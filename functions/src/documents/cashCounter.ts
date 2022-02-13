import { fsValue } from "../utility/firestore";

type _this = documents.raw.cashCounter;

export function InitCashCounter(): documents.raw.cashCounter {
  return {
    bills: {},
    income: { online: 0, offline: 0 },
  };
}

export function addBill(
  bill: bill,
  billNum: string | number,
  cashCounterObj: obj = {},
  stockObj: obj = {}
) {
  let totalMoney = 0,
    e: order,
    x: number;
  const stockChanges: { [itemID: string]: number } = {};
  for (e of bill.o) {
    stockChanges[e.iId] = -e.q + (stockChanges[e.iId] ?? 0);
    x = Math.floor((e.a * 1000) / e.q);
    if (Math.abs(e.r - x) > 1100) e.r = x;
    totalMoney += e.a;
  }
  for (const itemID in stockChanges) {
    if (Object.prototype.hasOwnProperty.call(stockChanges, itemID)) {
      stockObj[`currentStocks.${itemID}`] = fsValue.increment(
        stockChanges[itemID]
      );
    }
  }
  if (!bill.inC) {
    cashCounterObj["income.online"] = fsValue.increment(bill.mG);
    cashCounterObj["income.offline"] = fsValue.increment(totalMoney - bill.mG);
  } else cashCounterObj["income.offline"] = fsValue.increment(totalMoney);
  cashCounterObj[`bills.${billNum}`] = JSON.stringify(bill);
  return [cashCounterObj, stockObj];
}

export function cancleBill(
  doc: _this,
  billNum: string | number,
  cashCounterObj: obj = {},
  stockObj: obj = {}
): [bill | undefined, obj, obj] {
  const bill: bill = JSON.parse(doc.bills[billNum] ?? "null");
  if (!bill) return [undefined, cashCounterObj, stockObj];
  cashCounterObj[`bills.${billNum}`] = fsValue.delete();
  let totalMoney = 0,
    e: order;
  const stockChanges: { [itemID: string]: number } = {};
  for (e of bill.o) {
    stockChanges[e.iId] = e.q + (stockChanges[e.iId] ?? 0);
    totalMoney += e.a;
  }
  for (const itemID in stockChanges) {
    if (Object.prototype.hasOwnProperty.call(stockChanges, itemID)) {
      stockObj[`currentStocks.${itemID}`] = fsValue.increment(
        stockChanges[itemID]
      );
    }
  }
  if (bill.inC) {
    cashCounterObj[`income.offline`] = fsValue.increment(-totalMoney);
  } else {
    cashCounterObj[`income.online`] = fsValue.increment(-bill.mG);
    cashCounterObj[`income.offline`] = fsValue.increment(bill.mG - totalMoney);
  }
  return [bill, cashCounterObj, stockObj];
}
