import {
  interfaceOf,
  is,
  isCallTrue,
  listOf,
  sanitizeJson,
} from "sanitize-json";
import { checkAuth, checkPermission } from "../middlewere";
import { fsValue, paths, runTransaction } from "../utility/firestore";

import { IncorrectReqErr } from "../utility/res";
import { validNumS } from "./billing";

const itemChangesS = interfaceOf({
  iId: is.string,
  val: validNumS,
  type: isCallTrue((x) => x === "set" || x === "increment"),
});
const entryS = interfaceOf({
  sC: listOf(itemChangesS),
});
const reqS = interfaceOf({ stockID: is.string, changes: entryS });

export default async function StockChanges(
  data: req.StockChanges,
  context: req.context
): Res<number> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;
  data.changes.uid = user.val.uid;

  const permissionErr = checkPermission(user.val, "manager", {
    stockID: data.stockID,
  });
  if (permissionErr.err) return permissionErr;

  return runTransaction(
    paths.stock(data.stockID),
    function (doc: documents.stock) {
      let changes: stockChanges.inReq;
      const stockChanges: stockChanges.inDoc[] = [];
      const updateDoc: obj = {};
      for (changes of data.changes.sC) {
        if (changes.type === "set") {
          stockChanges.push({
            n: changes.val,
            iId: changes.iId,
            i: changes.val - (doc.currentStocks[changes.iId] ?? 0),
          });
          updateDoc[`currentStocks.${changes.iId}`] = changes.val;
        } else {
          stockChanges.push({
            i: changes.val,
            iId: changes.iId,
            n: changes.val + (doc.currentStocks[changes.iId] ?? 0),
          });
          updateDoc[`currentStocks.${changes.iId}`] = fsValue.increment(
            changes.val
          );
        }
      }
      updateDoc.entry = fsValue.arrayUnion({
        sC: stockChanges,
        uid: user.val.uid,
      });
      return { returnVal: doc.entry.length + 1, updateDoc: updateDoc };
    }
  );
}
