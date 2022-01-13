import { interfaceOf, is, checkIf, listOf, sanitizeJson } from "sanitize-json";
import { checkAuth, checkPermission } from "../middlewere";
import { fsValue, paths, setDoc } from "../utility/firestore";
import { paths as rtPaths, runTransaction } from "../utility/realtime";
import { IncorrectReqErr, InternalErr } from "../utility/res";

const validNumS = checkIf<number>(is.number, is.truly);
const orderS = interfaceOf({
  iId: is.string,
  q: validNumS,
  a: validNumS,
  r: validNumS,
});
const billS = interfaceOf({
  isWS: is.boolean,
  imC: is.boolean,
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

  const permissionErr = checkPermission(user.val, "accountent", {
    stockID: data.stockID,
    cashCounterID: data.cashCounterID,
  });
  if (permissionErr.err) return permissionErr;

  let totalMoney = 0,
    e: order,
    x: number;
  for (e of data.bill.o) {
    x = Math.floor((e.q * 1000) / e.a);
    if (Math.abs(e.r - x) > 1100) e.r = x;
    totalMoney += e.a;
  }

  const billObj: obj = {};
  if (data.bill.inC) {
    billObj["income.online"] = fsValue.increment(data.bill.mG);
    billObj["income.offline"] = fsValue.increment(totalMoney - data.bill.mG);
  } else billObj["income.offline"] = fsValue.increment(totalMoney);

  const res1 = await runTransaction(
    rtPaths.cashCounterBillNum(data.stockID, data.cashCounterID),
    function (billNum: number) {
      if (typeof billNum !== "number" || billNum < 1) billNum = 1;
      return billNum + 1;
    }
  );
  if (res1.err) return res1;
  if (!res1.val) return { err: true, val: InternalErr };

  billObj[`bills.${res1.val}`] = data.bill;
  const res2 = await setDoc(
    paths.cashCounter(data.stockID, data.cashCounterID),
    "update",
    billObj
  );
  if (res2.err) return res2;

  return { err: false, val: res1.val };
}
