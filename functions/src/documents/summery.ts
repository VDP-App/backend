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
  return {
    entry: JSON.stringify(doc.entry),
    retail: JSON.stringify(doc.retail),
    stockSnapShot: JSON.stringify(doc.stockSnapShot),
    wholeSell: JSON.stringify(doc.wholeSell),
    income: doc.income,
  };
}
