type _this = documents.raw.summery;

function parseStockDoc(stockDoc: documents.raw.stock) {
  const returnDoc: documents.stock = {
    currentStocks: stockDoc.currentStocks,
    transferNotifications: {},
    entry: {},
    entryNum: stockDoc.entryNum,
  };
  for (const entryNum in stockDoc.entry) {
    if (Object.prototype.hasOwnProperty.call(stockDoc.entry, entryNum)) {
      returnDoc.entry[entryNum] = JSON.parse(stockDoc.entry[entryNum]);
    }
  }
  return returnDoc;
}
function parseCashCounterDocs(cashCounterDocs: documents.raw.cashCounter[]) {
  const returnDocs: documents.cashCounter[] = [];
  for (const cashCounterDoc of cashCounterDocs) {
    const returnDoc: documents.cashCounter = {
      cancledStock: JSON.parse(cashCounterDoc.cancledStock ?? "{}"),
      bills: {},
      income: cashCounterDoc.income,
      stockConsumed: cashCounterDoc.stockConsumed,
    };
    for (const billNum in cashCounterDoc.bills) {
      if (Object.prototype.hasOwnProperty.call(cashCounterDoc.bills, billNum)) {
        const bill = cashCounterDoc.bills[billNum];
        returnDoc.bills[billNum] = JSON.parse(bill);
      }
    }
    returnDocs.push(returnDoc);
  }
  return returnDocs;
}

export function createSummery(
  _stockDoc: documents.raw.stock,
  _cashCounterDocs: documents.raw.cashCounter[]
): _this {
  const stockDoc = parseStockDoc(_stockDoc);
  const cashCounterDocs = parseCashCounterDocs(_cashCounterDocs);
  const doc: documents.summery = {
    cancledStock: {},
    retail: {},
    wholeSell: [],
    entry: Object.values(stockDoc.entry),
    stockSnapShot: stockDoc.currentStocks,
    income: { offline: 0, online: 0 },
  };
  const retail: { [itemID: string]: { [rate: number]: number } } = {};
  let cashCounterDoc: typeof cashCounterDocs[0];
  let bill: typeof cashCounterDoc.bills[0];
  let order: typeof bill.o[0];
  let retailItem: typeof retail[""];
  const cancledStock: { [itemID: string]: { [rate: number]: number } } = {};
  for (cashCounterDoc of cashCounterDocs) {
    doc.income.offline += cashCounterDoc.income.offline;
    doc.income.online += cashCounterDoc.income.online;
    for (const billNum in cashCounterDoc.bills) {
      if (Object.prototype.hasOwnProperty.call(cashCounterDoc.bills, billNum)) {
        bill = cashCounterDoc.bills[billNum];
        if (bill.isWS) doc.wholeSell.push(bill);
        else {
          for (order of bill.o) {
            if (order.iId in retail) {
              retailItem = retail[order.iId];
              if (order.r in retailItem) retailItem[order.r] += order.q;
              else retailItem[order.r] = order.q;
            } else retail[order.iId] = { [order.r]: order.q };
          }
        }
      }
    }
    let itemID;
    let rate;
    let cancledStockItem: typeof cancledStock[""];
    let obj: typeof cashCounterDoc.cancledStock[""];
    for (itemID in cashCounterDoc.cancledStock) {
      if (
        Object.prototype.hasOwnProperty.call(
          cashCounterDoc.cancledStock,
          itemID
        )
      ) {
        if (!(itemID in cancledStock)) cancledStock[itemID] = {};
        cancledStockItem = cancledStock[itemID];
        obj = cashCounterDoc.cancledStock[itemID];
        for (rate in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, rate)) {
            cancledStockItem[rate] = (cancledStockItem[rate] ?? 0) + obj[rate];
          }
        }
      }
    }
  }
  let itemID: string;
  let rate: string;
  let quntity: number;
  let retailArr: typeof doc.retail[""];
  for (itemID in retail) {
    if (Object.prototype.hasOwnProperty.call(retail, itemID)) {
      retailItem = retail[itemID];
      retailArr = doc.retail[itemID] = [];
      for (rate in retailItem) {
        if (Object.prototype.hasOwnProperty.call(retailItem, rate)) {
          quntity = retailItem[rate];
          retailArr.push({ r: -(-rate), q: quntity });
        }
      }
    }
  }
  let cancledStockItem: typeof cancledStock[""];
  let cancledStockArr: typeof doc.cancledStock[""];
  for (itemID in cancledStock) {
    if (Object.prototype.hasOwnProperty.call(cancledStock, itemID)) {
      cancledStockItem = cancledStock[itemID];
      cancledStockArr = doc.retail[itemID] = [];
      for (rate in cancledStockItem) {
        if (Object.prototype.hasOwnProperty.call(cancledStockItem, rate)) {
          quntity = cancledStockItem[rate];
          cancledStockArr.push({ r: -(-rate), q: quntity });
        }
      }
    }
  }
  return {
    cancledStock: JSON.stringify(doc.cancledStock),
    entry: JSON.stringify(doc.entry),
    retail: JSON.stringify(doc.retail),
    stockSnapShot: JSON.stringify(doc.stockSnapShot),
    wholeSell: JSON.stringify(doc.wholeSell),
    income: doc.income,
  };
}
