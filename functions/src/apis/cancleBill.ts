import { applyOr, interfaceOf, is, sanitizeJson } from "sanitize-json";
import { cancleBill } from "../documents/cashCounter";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
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
      const [proceed, updateDoc, updateStockDoc] = cancleBill(
        doc,
        data.billNum
      );
      if (proceed)
        return {
          returnVal: null,
          updateDoc,
          commits: {
            type: "update",
            path: paths.stock(data.stockID),
            obj: updateStockDoc,
          },
        };
      else return { returnVal: null };
    }
  );
}
