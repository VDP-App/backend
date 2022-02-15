import { fsValue } from "../utility/firestore";

type _this = documents.raw.stock;

export function InitStock(): _this {
  return {
    entryNum: 0,
    entry: {},
    currentStocks: {},
    transferNotifications: {},
  };
}

export function ResetStock() {
  return { entry: {}, entryNum: 0 };
}

export function RemoveItem(itemID: string) {
  return { [`currentStocks.${itemID}`]: fsValue.delete() };
}

export function addEntry(
  doc: _this,
  uid: string,
  reqChanges: stockChanges.inReq[],
  stockObj: obj = {}
) {
  const sC: stockChanges.inDoc[] = [];
  let changes: stockChanges.inReq;
  for (changes of reqChanges) {
    if (changes.type === "set") {
      sC.push({
        n: changes.val,
        iId: changes.iId,
        i: changes.val - (doc.currentStocks[changes.iId] ?? 0),
        t: "set",
      });
      stockObj[`currentStocks.${changes.iId}`] = changes.val;
    } else {
      sC.push({
        i: changes.val,
        iId: changes.iId,
        n: changes.val + (doc.currentStocks[changes.iId] ?? 0),
        t: "inc",
      });
      stockObj[`currentStocks.${changes.iId}`] = fsValue.increment(changes.val);
    }
  }
  stockObj[`entry.${doc.entryNum + 1}`] = JSON.stringify({ sC, uid });
  stockObj.entryNum = fsValue.increment(1);
  return stockObj;
}

export function sendTransfer(
  doc: _this,
  uid: string,
  send: { from: string; to: string },
  uniqueID: string,
  reqChanges: stockChanges.inSendTransfer[],
  stockObj: obj = {},
  otherStockDoc: obj = {}
) {
  let changes: stockChanges.inSendTransfer;
  const stockChanges: stockChanges.inDoc[] = [];
  for (changes of reqChanges) {
    stockChanges.push({
      i: -changes.send,
      iId: changes.iId,
      n: (doc.currentStocks[changes.iId] ?? 0) - changes.send,
    });
    stockObj[`currentStocks.${changes.iId}`] = fsValue.increment(-changes.send);
  }
  stockObj[`entry.${doc.entryNum + 1}`] = JSON.stringify({
    sC: stockChanges,
    tT: send.to,
    uid: uid,
  });
  stockObj.entryNum = fsValue.increment(1);
  otherStockDoc[`transferNotifications.${uniqueID}`] = JSON.stringify({
    tF: send.from,
    sC: reqChanges,
    sUid: uid,
  });
  return [stockObj, otherStockDoc];
}
export function acceptTransfer(
  doc: _this,
  uniqueID: string,
  uid: string,
  stockObj: obj = {}
) {
  const transferData: transferReq = JSON.parse(
    doc.transferNotifications[uniqueID]
  );
  let changes: stockChanges.inSendTransfer;
  const stockChanges: stockChanges.inDoc[] = [];
  for (changes of transferData.sC) {
    stockChanges.push({
      i: changes.send,
      iId: changes.iId,
      n: (doc.currentStocks[changes.iId] ?? 0) + changes.send,
    });
    stockObj[`currentStocks.${changes.iId}`] = fsValue.increment(changes.send);
  }
  stockObj[`entry.${doc.entryNum + 1}`] = JSON.stringify({
    sC: stockChanges,
    tF: transferData.tF,
    uid,
    sUid: transferData.sUid,
  });
  stockObj.entryNum = fsValue.increment(1);
  stockObj[`transferNotifications.${uniqueID}`] = fsValue.delete();
  return stockObj;
}
export function cancleEntry(
  doc: _this,
  entryNum: string | number,
  stockObj: obj = {}
): [entry | undefined, obj] {
  const entry: entry = JSON.parse(doc.entry[entryNum] ?? "null");
  if (!entry || entry.sUid || entry.tF || entry.tT) {
    return [undefined, stockObj];
  }
  for (const changes of entry.sC) {
    stockObj[`currentStocks.${changes.iId}`] = fsValue.increment(-changes.i);
  }
  stockObj[`entry.${entryNum}`] = fsValue.delete();
  return [entry, stockObj];
}
