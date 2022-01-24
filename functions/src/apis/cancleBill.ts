import {
  either,
  isInterfaceAs,
  isString,
  isNumber,
  sanitizeJson,
} from "sanitize-json";
import { cancleBill } from "../documents/cashCounter";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";

const reqS = isInterfaceAs({
  billNum: either(isNumber, isString),
  stockID: isString,
  cashCounterID: isString,
});

export default async function CancleBill(
  data: req.CancleBill,
  context: req.context
): Res<bill> {
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

  return await  runTransaction<documents.cashCounter, bill>(
    paths.cashCounter(data.stockID, data.cashCounterID),
    function (doc) {
      const [proceed, updateDoc, updateStockDoc] = cancleBill(
        doc,
        data.billNum
      );
      if (proceed)
        return {
          returnVal: doc.bills[data.billNum],
          updateDoc,
          commits: {
            type: "update",
            path: paths.stock(data.stockID),
            obj: updateStockDoc,
          },
        };
      return {
        err: {
          code: "No such bill",
          message: "Either no such Bill exists or bill is already deleted",
        },
      };
    }
  );
}
