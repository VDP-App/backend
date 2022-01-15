import { interfaceOf, is, listOf, sanitizeJson, switchOn } from "sanitize-json";
import { acceptTransfer, sendTransfer } from "../documents/stock";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";
import { currentDate } from "../utility/utils";
import { validNumS } from "./billing";

const itemChangesS = interfaceOf({
  iId: is.string,
  send: validNumS,
});
const entryS = interfaceOf({
  sC: listOf(itemChangesS),
});
const sendReqS = interfaceOf({
  type: is.string,
  stockID: is.string,
  sendToStockID: is.string,
  changes: entryS,
});
const reciveReqS = interfaceOf({
  type: is.string,
  uniqueID: is.string,
  stockID: is.string,
});
const reqS = switchOn(
  (x: any) => x.type,
  { when: "send", then: sendReqS },
  { when: "recive", then: reciveReqS }
);

export default async function TransferStock(
  data: req.TransferStock,
  context: req.context
): Res<string | number> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "manager", {
    stockID: data.stockID,
  });
  if (permissionErr.err) return permissionErr;

  return runTransaction<documents.stock, string | number>(
    paths.stock(data.stockID),
    function (doc) {
      const updateDoc: obj = {};
      const otherStockDoc: obj = {};
      let returnVal: string | number;
      if (data.type === "send") {
        returnVal = `${data.stockID}_${currentDate()}_${doc.entry.length + 1}`;
        sendTransfer(
          doc,
          user.val.uid,
          { to: data.sendToStockID, from: data.stockID },
          returnVal,
          data.changes,
          updateDoc,
          otherStockDoc
        );
      } else {
        returnVal = doc.entry.length + 1;
        acceptTransfer(doc, data.uniqueID, user.val.uid, updateDoc);
      }
      return {
        returnVal: returnVal,
        updateDoc: updateDoc,
        commits: {
          ignore: data.type !== "send",
          path: paths.stock((data as any).sendToStockID),
          type: "update",
          obj: otherStockDoc,
        },
      };
    }
  );
}
