type _this = documents.summery;

export function createSummery(
  stockDoc: documents.stock,
  cashCounterDocs: documents.cashCounter[]
): _this {
  const doc: _this = {
    bills: [],
    entry: stockDoc.entry,
    stockSnapShot: stockDoc.currentStocks,
  };
  let cashCounterDoc: documents.cashCounter;
  for (cashCounterDoc of cashCounterDocs) {
    doc.bills.push(...Object.values(cashCounterDoc.bills));
  }
  return doc;
}
