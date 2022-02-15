import {
  either,
  isInterfaceAs,
  isString,
  isNumber,
  sanitizeJson,
  switchOn,
} from "sanitize-json";
import { cancleBill } from "../documents/cashCounter";
import { cancleEntry } from "../documents/stock";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";

const billS = isInterfaceAs({
  type: isString,
  num: either(isNumber, isString),
  stockID: isString,
  cashCounterID: isString,
});
const stockChangesS = isInterfaceAs({
  type: isString,
  num: either(isNumber, isString),
  stockID: isString,
});

const reqS = switchOn((x) => x.type, {
  bill: billS,
  stockChanges: stockChangesS,
});

export default async function CancleEntry(
  data: req.CancleEntry,
  context: req.context
): Res<bill | entry> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;

  if (data.type == "bill") {
    const permissionErr = checkPermission(user.val, "accountent", {
      stockID: data.stockID,
      cashCounterID: data.cashCounterID,
    });
    if (permissionErr.err) return permissionErr;
    return await runTransaction<documents.raw.cashCounter, bill>(
      paths.cashCounter(data.stockID, data.cashCounterID),
      function (doc) {
        const [bill, updateDoc, updateStockDoc] = cancleBill(doc, data.num);
        if (bill)
          return {
            returnVal: bill,
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
  } else {
    const permissionErr = checkPermission(user.val, "manager", {
      stockID: data.stockID,
    });
    if (permissionErr.err) return permissionErr;
    return await runTransaction<documents.raw.stock, entry>(
      paths.stock(data.stockID),
      function (doc) {
        const [entry, updateDoc] = cancleEntry(doc, data.num);
        if (entry) return { returnVal: entry, updateDoc };
        return {
          err: {
            code: "No such Entry",
            message: "Either no such Entry exists or entry is already deleted",
          },
        };
      }
    );
  }
}
