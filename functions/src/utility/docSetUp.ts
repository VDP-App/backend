export function InitStock(): documents.stock {
  return {
    entry: [],
    currentStocks: {},
    transferNotifications: {},
  };
}
export function InitCashCounter(): documents.cashCounter {
  return {
    bills: {},
    income: { online: 0, offline: 0 },
    stockConsumed: {},
  };
}
