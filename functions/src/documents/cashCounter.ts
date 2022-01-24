import { fsValue } from "../utility/firestore";

type _this = documents.cashCounter;

export function InitCashCounter(): documents.cashCounter {
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
  for (e of bill.o) {
    stockObj[`currentStocks.${e.iId}`] = fsValue.increment(-e.q);
    x = Math.floor((e.q * 1000) / e.a);
    if (Math.abs(e.r - x) > 1100) e.r = x;
    totalMoney += e.a;
  }
  if (!bill.inC) {
    cashCounterObj["income.online"] = fsValue.increment(bill.mG);
    cashCounterObj["income.offline"] = fsValue.increment(totalMoney - bill.mG);
  } else cashCounterObj["income.offline"] = fsValue.increment(totalMoney);
  cashCounterObj[`bills.${billNum}`] = bill;

  return [cashCounterObj, stockObj];
}

export function cancleBill(
  doc: _this,
  billNum: string | number,
  cashCounterObj: obj = {},
  stockObj: obj = {}
): [boolean, obj, obj] {
  const bill = doc.bills[billNum];
  if (!bill) return [false, cashCounterObj, stockObj];
  cashCounterObj[`bills.${billNum}`] = fsValue.delete();
  let totalMoney = 0,
    e: order;
  for (e of bill.o) {
    stockObj[`currentStocks.${e.iId}`] = fsValue.increment(e.q);
    totalMoney += e.a;
  }
  if (bill.inC) {
    cashCounterObj[`income.offline`] = fsValue.increment(-totalMoney);
  } else {
    cashCounterObj[`income.online`] = fsValue.increment(-bill.mG);
    cashCounterObj[`income.offline`] = fsValue.increment(bill.mG - totalMoney);
  }
  return [true, cashCounterObj, stockObj];
}
