import { fsValue } from "../utility/firestore";
import { currentTime } from "../utility/utils";

export function logAddItem(
  itemId: string,
  uid: string,
  item: item,
  logsObj: obj = {}
) {
  const log: log = {
    createdAt: currentTime(),
    createdBy: uid,
    item,
    itemId,
    type: "create",
  };
  logsObj["logs"] = fsValue.arrayUnion(JSON.stringify(log));
  return logsObj;
}
export function logRemoveItem(
  itemId: string,
  uid: string,
  item: item,
  stockIDs: string[],
  stockDocs: documents.raw.stock[],
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
  logsObj["logs"] = fsValue.arrayUnion(JSON.stringify(log));
  return logsObj;
}
export function logUpdateItem(
  itemId: string,
  uid: string,
  item: item,
  doc: documents.raw.config_products,
  logsObj: obj = {}
) {
  const log: log = {
    createdAt: currentTime(),
    createdBy: uid,
    item,
    itemId,
    type: "update",
    oldItem: doc.items[itemId],
  };
  logsObj["logs"] = fsValue.arrayUnion(JSON.stringify(log));
  return logsObj;
}
