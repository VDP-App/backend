import {
  interfaceOf,
  is,
  isCallTrue,
  listOf,
  sanitizeJson,
} from "sanitize-json";
import { addEntry } from "../documents/stock";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";

import { IncorrectReqErr } from "../utility/res";
import { validNumS } from "./billing";

const itemChangesS = interfaceOf({
  iId: is.string,
  val: validNumS,
  type: isCallTrue((x) => x === "set" || x === "increment"),
});
const reqS = interfaceOf({ stockID: is.string, changes: listOf(itemChangesS) });

export default async function StockChanges(
  data: req.StockChanges,
  context: req.context
): Res<number> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "manager", {
    stockID: data.stockID,
  });
  if (permissionErr.err) return permissionErr;

  return runTransaction(
    paths.stock(data.stockID),
    function (doc: documents.stock) {
      const updateDoc: obj = addEntry(doc, user.val.uid, data.changes);
      return { returnVal: doc.entry.length + 1, updateDoc: updateDoc };
    }
  );
}
