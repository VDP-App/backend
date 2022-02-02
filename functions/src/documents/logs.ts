import { fsValue } from "../utility/firestore";
import { currentTime } from "../utility/utils";

export function logAddItem(
  itemId: string,
  uid: string,
  item: item,
  doc: documents.config_products,
  logsObj: obj = {}
) {
  logsObj["logs"] = fsValue.arrayUnion({
    createdAt: currentTime(),
    createdBy: uid,
    item,
    itemId,
    type: "create",
  });
  logsObj.createItem = fsValue.arrayUnion(doc.log.count);
  return logsObj;
}
export function logRemoveItem(
  itemId: string,
  uid: string,
  item: item,
  doc: documents.config_products,
  stockIDs: string[],
  stockDocs: documents.stock[],
  logsObj: obj = {}
): obj {
  const log: log = {
    createdAt: currentTime(),
    createdBy: uid,
    item,
    itemId,
    type: "remove",
    remainingStock: {},
  };
  for (let i = 0; i < stockIDs.length; i++)
    log.remainingStock[stockIDs[i]] = stockDocs[i].currentStocks[itemId] ?? 0;
  logsObj["logs"] = fsValue.arrayUnion(log);
  logsObj.createItem = fsValue.arrayUnion(doc.log.count);
  return logsObj;
}
export function logUpdateItem(
  itemId: string,
  uid: string,
  item: item,
  doc: documents.config_products,
  logsObj: obj = {}
) {
  logsObj["logs"] = fsValue.arrayUnion({
    createdAt: currentTime(),
    createdBy: uid,
    item,
    itemId,
    type: "update",
    oldItem: doc.items[itemId],
  });
  logsObj.createItem = fsValue.arrayUnion(doc.log.count);
  return logsObj;
}
