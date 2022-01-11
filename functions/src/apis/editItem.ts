import { checkAuth, checkPermission } from "../middlewere";
import { checkItem } from "../utility/check";
import { fsValue, paths, runTransaction } from "../utility/firestore";
import { IncorrectReqErr } from "../utility/res";
import { randomStr } from "../utility/utils";

const MaxLogCount = 100;

function checkReq(data: req.EditItem): res<req.EditItem> {
  const err = { err: true as true, val: IncorrectReqErr };
  if (
    [data.id, data.type].checkTypeIsNot("string") ||
    data.type.isNotIn(["create", "remove", "update"])
  )
    return err;
  const item = checkItem(data.item);
  if (!item) return err;
  return { err: false, val: { id: data.id, type: data.type, item: item } };
}

export default async function EditItem(
  data: req.EditItem,
  context: req.context
): Res<req.EditItem> {
  const p = checkReq(data);
  if (p.err) return p;
  data = p.val;

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
