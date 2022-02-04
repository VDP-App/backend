import { fsValue } from "../utility/firestore";

type _this = documents.cashCounter;

export function InitCashCounter(): documents.cashCounter {
  return {
    bills: [],
    income: { online: 0, offline: 0 },
  };
}

export function addBill(
  bill: bill,
  billNum: string | number,
  cashCounterObj: obj = {},
  stockObj: obj = {}
) {
  bill.n = billNum;
  let totalMoney = 0,
    e: order,
    x: number;
  for (e of bill.o) {
    stockObj[`currentStocks.${e.iId}`] = fsValue.increment(-e.q);
    x = Math.floor((e.a * 1000) / e.q);
    if (Math.abs(e.r - x) > 1100) e.r = x;
    totalMoney += e.a;
  }
  if (!bill.inC) {
    cashCounterObj["income.online"] = fsValue.increment(bill.mG);
    cashCounterObj["income.offline"] = fsValue.increment(totalMoney - bill.mG);
  } else cashCounterObj["income.offline"] = fsValue.increment(totalMoney);
  cashCounterObj.bills = fsValue.arrayUnion(bill);
  return [cashCounterObj, stockObj];
}

export function cancleBill(
  doc: _this,
  billNum: string | number,
  cashCounterObj: obj = {},
  stockObj: obj = {}
): [bill | undefined, obj, obj] {
  let bill: bill | undefined;
  const newBills: bill[] = [];
  for (var b of doc.bills) {
    if (b.n == billNum) bill = b;
    else newBills.push(b);
  }
  if (!bill) return [undefined, cashCounterObj, stockObj];
  cashCounterObj[`bills`] = newBills;
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
  return [bill, cashCounterObj, stockObj];
}
