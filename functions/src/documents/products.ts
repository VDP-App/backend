import { fsValue } from "../utility/firestore";
import { randomStr } from "../utility/utils";

type _this = documents.raw.config_products;

const MaxLogCount = 100;

function updateLogCounter(doc: _this, productObj: obj): [boolean, number] {
  if (doc.log.count > MaxLogCount) {
    productObj["log.page"] = fsValue.increment(1);
    productObj["log.count"] = 0;
    return [true, doc.log.page + 1];
  }
  productObj["log.count"] = fsValue.increment(1);
  return [false, doc.log.page];
}

export function addItem(
  doc: _this,
  itemId: string,
  item: item,
  productObj: obj = {}
): [boolean, number, string, obj] {
  while (itemId in doc.items) itemId = randomStr();
  productObj.ids = fsValue.arrayUnion(itemId);
  productObj[`items.${itemId}`] = item;
  return [...updateLogCounter(doc, productObj), itemId, productObj];
}

export function removeItem(
  doc: _this,
  itemId: string,
  productObj: obj = {}
): [boolean, number, obj] {
  productObj.ids = fsValue.arrayRemove(itemId);
  const p = `items.${itemId}.`;
  productObj[p + "code"] = fsValue.delete();
  productObj[p + "collectionName"] = fsValue.delete();
  return [...updateLogCounter(doc, productObj), productObj];
}

export function updateItem(
  doc: _this,
  itemId: string,
  item: item,
  productObj: obj = {}
): [boolean, number, obj] {
  productObj[`items.${itemId}`] = item;
  return [...updateLogCounter(doc, productObj), productObj];
}
