import { checkAuth, checkPermission } from "../middlewere";
import { checkBill } from "../utility/check";
import { fsValue, paths, setDoc } from "../utility/firestore";
import { paths as rtPaths, runTransaction } from "../utility/realtime";
import { IncorrectReqErr, InternalErr } from "../utility/res";

function checkReq(data: req.Billing): res<req.Billing> {
  const err = { err: true as true, val: IncorrectReqErr };
  if ([data.stockID, data.cashCounterID].checkTypeIsNot("string")) return err;
  const bill = checkBill(data.bill);
  if (!bill) return err;
  return {
    err: false,
    val: {
      stockID: data.stockID,
      cashCounterID: data.cashCounterID,
      bill: bill,
    },
  };
}

export default async function Billing(
  data: req.Billing,
  context: req.context
): Res<number> {
  const p = checkReq(data);
  if (p.err) return p;
  data = p.val;

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
