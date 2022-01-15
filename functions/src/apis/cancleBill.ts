import { applyOr, interfaceOf, is, sanitizeJson } from "sanitize-json";
import { checkAuth, checkPermission } from "../middlewere";
import { fsValue, paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";

const reqS = interfaceOf({
  billNum: applyOr(is.number, is.string),
  stockID: is.string,
  cashCounterID: is.string,
});

export default async function CancleBill(
  data: req.CancleBill,
  context: req.context
): Res<null> {
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

  return runTransaction(
    paths.cashCounter(data.stockID, data.cashCounterID),
    function (doc: documents.cashCounter) {
      const bill = doc.bills[data.billNum];
      if (!bill) return { returnVal: null };
      const updateDoc: obj = {};
      const updateStockDoc: obj = {};
      updateDoc[`bills.${data.billNum}`] = fsValue.delete();
      doc.income.offline;
      let totalMoney = 0,
        e: order;
      for (e of bill.o) {
        updateStockDoc[`currentStocks.${e.iId}`] = fsValue.increment(e.q);
        totalMoney += e.a;
      }
      if (bill.inC) {
        updateDoc[`income.offline`] = fsValue.increment(-totalMoney);
      } else {
        updateDoc[`income.online`] = fsValue.increment(-bill.mG);
        updateDoc[`income.offline`] = fsValue.increment(bill.mG - totalMoney);
      }
      return {
        returnVal: null,
        updateDoc,
        commits: {
          type: "update",
          path: paths.stock(data.stockID),
          obj: updateStockDoc,
        },
      };
    }
  );
}
