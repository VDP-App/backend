import {
  checkIf,
  interfaceOf,
  is,
  isCallTrue,
  sanitizeJson,
} from "sanitize-json";
import { checkAuth, checkPermission } from "../middlewere";
import { fsValue, paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";
import { randomStr } from "../utility/utils";

const MaxLogCount = 100;

const validNumS = checkIf<number>(is.number, is.truly);
const itemS = interfaceOf({
  cgst: validNumS,
  code: is.string,
  collectionName: is.string,
  name: is.string,
  rate1: validNumS,
  rate2: validNumS,
  sgst: validNumS,
});
const typeS = checkIf(
  is.string,
  isCallTrue((x) => x == "create" || x == "remove" || x == "update")
);
const reqS = interfaceOf({
  type: typeS,
  item: itemS,
  id: is.string,
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
      const page = doc.log.page;
      const isPageNew = doc.log.count >= MaxLogCount;

      const productObj: obj = {
        "log.count": fsValue.increment(1),
      };

      if (isPageNew) {
        productObj["log.count"] = 0;
        productObj["log.page"] = fsValue.increment(1);
      }

      const log: obj = {
        ...data,
        createdBy: user.val.uid,
        createdAt: Date(),
      };

      if (data.type === "remove") {
        productObj.ids = fsValue.arrayRemove(data.id);
        const p = `items.${data.id}.`;
        productObj[p + "code"] = fsValue.delete();
        productObj[p + "collectionName"] = fsValue.delete();
      } else if (data.type === "create") {
        while (data.id in doc.items) data.id = randomStr();
        productObj.ids = fsValue.arrayUnion(data.id);
        productObj[`items.${data.id}`] = data.item;
      } else {
        productObj[`items.${data.id}`] = data.item;
        log.oldItem = doc.items[data.id];
      }

      return {
        updateDoc: productObj,
        commits: {
          type: isPageNew ? "create" : "update",
          path: paths.logs(page),
          obj: {
            logs: fsValue.arrayUnion(log),
            [data.type + "-item"]: fsValue.arrayUnion(doc.log.count),
          },
        },
        returnVal: data,
      };
    }
  );
}
