import {
  isInterfaceAs,
  isString,
  isTrueOnCall,
  sanitizeJson,
} from "sanitize-json";
import { logAddItem, logRemoveItem, logUpdateItem } from "../documents/logs";
import { addItem, removeItem, updateItem } from "../documents/products";
import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";
import { validNumS } from "./billing";

const itemS = isInterfaceAs({
  cgst: validNumS,
  code: isString,
  collectionName: isString,
  name: isString,
  rate1: validNumS,
  rate2: validNumS,
  sgst: validNumS,
});
const typeS = isTrueOnCall(
  (x) => x === "create" || x === "remove" || x === "update"
);
const reqS = isInterfaceAs({
  type: typeS,
  item: itemS,
  id: isString,
});
export default async function EditItem(
  data: req.EditItem,
  context: req.context
): Res<req.EditItem> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "manager");
  if (permissionErr.err) return permissionErr;

  return await runTransaction(
    paths.products,
    function (doc: documents.config_products) {
      let page: number;
      let isPageNew: boolean;

      const productObj: obj = {};

      const logObj: obj = {};

      if (data.type === "remove") {
        [isPageNew, page] = removeItem(doc, data.id, productObj);
        logRemoveItem(data.id, user.val.uid, data.item, doc, logObj);
      } else if (data.type === "create") {
        [isPageNew, page, data.id] = addItem(
          doc,
          data.id,
          data.item,
          productObj
        );
        logAddItem(data.id, user.val.uid, data.item, doc, logObj);
      } else {
        [isPageNew, page] = updateItem(doc, data.id, data.item, productObj);
        logUpdateItem(data.id, user.val.uid, data.item, doc, logObj);
      }

      return {
        updateDoc: productObj,
        commits: {
          type: isPageNew ? "create" : "update",
          path: paths.logs(page),
          obj: logObj,
        },
        returnVal: data,
      };
    }
  );
}
