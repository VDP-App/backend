import {
  isInterfaceAs,
  isString,
  isBoolean,
  checkIfIt,
  isListOf,
  sanitizeJson,
  isNumber,
  isInteger,
} from "sanitize-json";
import { addBill } from "../documents/cashCounter";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runBatch } from "../utility/firestore";
import { paths as rtPaths, runTransaction } from "../utility/realtime";
import { IncorrectReqErr, InternalErr } from "../utility/res";

export const isValidNumS = checkIfIt(isNumber, isInteger);
const orderS = isInterfaceAs({
  iId: isString,
  q: isValidNumS,
  a: isValidNumS,
  r: isValidNumS,
});
const billS = isInterfaceAs({
  isWS: isBoolean,
  inC: isBoolean,
  mG: isValidNumS,
  o: isListOf(orderS),
});
const reqS = isInterfaceAs({
  bill: billS,
  stockID: isString,
  cashCounterID: isString,
});

export default async function Billing(
  data: req.Billing,
  context: req.context
): Res<number> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;
  data.bill.uid = user.val.uid;

  const permissionErr = checkPermission(user.val, "accountent", {
    stockID: data.stockID,
    cashCounterID: data.cashCounterID,
  });
  if (permissionErr.err) return permissionErr;

  const res1 = await runTransaction(
    rtPaths.cashCounterBillNum(data.stockID, data.cashCounterID),
    function (billNum: number) {
      if (typeof billNum !== "number" || billNum < 0) billNum = 0;
      return billNum + 1;
    }
  );
  if (res1.err) return res1;
  if (!res1.val) return { err: true, val: InternalErr };

  const [billObj, stockObj] = addBill(data.bill, res1.val);

  const res2 = await runBatch(
    {
      type: "update",
      path: paths.cashCounter(data.stockID, data.cashCounterID),
      obj: billObj,
    },
    {
      type: "update",
      path: paths.stock(data.stockID),
      obj: stockObj,
    }
  );
  if (res2.err) return res2;

  return { err: false, val: res1.val };
}
