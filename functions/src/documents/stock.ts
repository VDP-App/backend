import { fsValue } from "../utility/firestore";

type _this = documents.stock;

export function InitStock(): _this {
  return {
    entry: [],
    currentStocks: {},
    transferNotifications: {},
  };
}

export function ResetStock() {
  return { entry: [] };
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
      });
      stockObj[`currentStocks.${changes.iId}`] = changes.val;
    } else {
      sC.push({
        i: changes.val,
        iId: changes.iId,
        n: changes.val + (doc.currentStocks[changes.iId] ?? 0),
      });
      stockObj[`currentStocks.${changes.iId}`] = fsValue.increment(changes.val);
    }
  }
  stockObj.entry = fsValue.arrayUnion({ sC, uid });
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
  stockObj.entry = fsValue.arrayUnion({
    sC: stockChanges,
    tT: send.to,
    uid: uid,
  });
  otherStockDoc[`transferNotifications.${uniqueID}`] = {
    tF: send.from,
    sC: reqChanges,
    sUid: uid,
  };
  return [stockObj, otherStockDoc];
}
export function acceptTransfer(
  doc: _this,
  uniqueID: string,
  uid: string,
  stockDoc: obj = {}
) {
  const transferData = doc.transferNotifications[uniqueID];
  let changes: stockChanges.inSendTransfer;
  const stockChanges: stockChanges.inDoc[] = [];
  for (changes of transferData.sC) {
    stockChanges.push({
      i: changes.send,
      iId: changes.iId,
      n: (doc.currentStocks[changes.iId] ?? 0) - changes.send,
    });
    stockDoc[`currentStocks.${changes.iId}`] = fsValue.increment(changes.send);
  }
  stockDoc.entry = fsValue.arrayUnion({
    sC: stockChanges,
    tF: transferData.tF,
    uid,
    sUid: transferData.sUid,
  });
  stockDoc[uniqueID] = fsValue.delete();
  return stockDoc;
}
