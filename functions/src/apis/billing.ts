import { interfaceOf, is, checkIf, listOf, sanitizeJson } from "sanitize-json";
import { addBill } from "../documents/cashCounter";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runBatch } from "../utility/firestore";
import { paths as rtPaths, runTransaction } from "../utility/realtime";
import { IncorrectReqErr, InternalErr } from "../utility/res";

export const validNumS = checkIf<number>(is.number, is.truly);
const orderS = interfaceOf({
  iId: is.string,
  q: validNumS,
  a: validNumS,
  r: validNumS,
});
const billS = interfaceOf({
  isWS: is.boolean,
  inC: is.boolean,
  mG: validNumS,
  o: listOf(orderS),
});
const reqS = interfaceOf({
  bill: billS,
  stockID: is.string,
  cashCounterID: is.string,
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
      if (typeof billNum !== "number" || billNum < 1) billNum = 1;
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
