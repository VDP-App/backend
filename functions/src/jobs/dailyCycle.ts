import { InitCashCounter } from "../utility/docSetUp";
import { getDoc, paths, runTransactionComplete } from "../utility/firestore";
import { getObj, paths as rtPaths, setObj } from "../utility/realtime";
import { currentDate } from "../utility/utils";

interface changes {
  retail?: number;
  stockChanges?: [string | number, number];
  transferFromChanges?: [string | number, number];
  transferToChanges?: [string | number, number];
  wholesell?: [string | number, number];
}

export default async function DailyCycle(context: bgFn.schedule.context) {
  const date = await getObj<string>(rtPaths.currentDate);
  if (date.err) return;
  if (date.val === currentDate()) return;

  const Doc = await getDoc<documents.config_config>(paths.config);
  if (Doc.err || !Doc.val) return;
  const configDoc = Doc.val.stocks;

  runTransactionComplete(async function (getDocs) {
    const stockDocReset = { entry: [] },
      cashCounterReset = InitCashCounter(),
      commits: completeCommit[] = [];
    let stockId: string,
      stockDoc: documents.stock,
      newSummeryDoc: documents.summery,
      counterDoc: documents.cashCounter,
      counterDocs: typeof counterDoc[],
      cashCounterIds: string[],
      entry: entry<stockChanges.inDoc>,
      stockChanges: stockChanges.inDoc,
      i: number,
      billNum: string,
      bill: bill,
      order: order,
      iReport: itemReport;
    for (stockId in configDoc) {
      if (Object.prototype.hasOwnProperty.call(configDoc, stockId)) {
        cashCounterIds = Object.keys(configDoc[stockId].cashCounters).map((x) =>
          paths.cashCounter(stockId, x)
        );
        [stockDoc, ...counterDocs] = await getDocs([
          paths.stock(stockId),
          ...cashCounterIds,
        ]);
        newSummeryDoc = {
          entry: stockDoc.entry,
          stockSnapShot: stockDoc.currentStocks,
          income: 0,
          bills: [],
          report: {},
        };
        function addReportItem(
          itemId: string,
          {
            retail,
            stockChanges,
            transferFromChanges,
            transferToChanges,
            wholesell,
          }: changes
        ) {
          if (!(itemId in newSummeryDoc.report)) {
            iReport = { r: 0, s: {}, tF: {}, w: {}, tT: {} };
            newSummeryDoc.report[itemId] = iReport;
          } else iReport = newSummeryDoc.report[itemId] as itemReport;
          if (retail) iReport.r += retail;
          if (stockChanges) {
            iReport.s[stockChanges[0]] =
              (iReport.s[stockChanges[0]] ?? 0) + stockChanges[1];
          }
          if (transferToChanges) {
            iReport.tT[transferToChanges[0]] =
              (iReport.tT[transferToChanges[0]] ?? 0) + transferToChanges[1];
          }
          if (transferFromChanges) {
            iReport.tF[transferFromChanges[0]] =
              (iReport.tF[transferFromChanges[0]] ?? 0) +
              transferFromChanges[1];
          }
          if (wholesell) {
            iReport.w[wholesell[0]] =
              (iReport.w[wholesell[0]] ?? 0) + wholesell[1];
          }
        }
        commits.push({
          type: "update",
          path: paths.stock(stockId),
          obj: stockDocReset,
        });
        for (i = 0; i < newSummeryDoc.entry.length; i++) {
          entry = newSummeryDoc.entry[i];
          if (entry.tF) {
            for (stockChanges of entry.sC) {
              addReportItem(stockChanges.iId, {
                transferFromChanges: [i, stockChanges.i],
              });
            }
          } else if (entry.tT) {
            for (stockChanges of entry.sC) {
              addReportItem(stockChanges.iId, {
                transferToChanges: [i, stockChanges.i],
              });
            }
          } else {
            for (stockChanges of entry.sC) {
              addReportItem(stockChanges.iId, {
                stockChanges: [i, stockChanges.i],
              });
            }
          }
        }
        for (i = 0; i < cashCounterIds.length; i++) {
          counterDoc = counterDocs[i];
          newSummeryDoc.income +=
            counterDoc.income.online + counterDoc.income.offline;
          for (billNum in counterDoc.bills) {
            if (
              Object.prototype.hasOwnProperty.call(counterDoc.bills, billNum)
            ) {
              bill = counterDoc.bills[billNum];
              if (bill.isWS) {
                newSummeryDoc.bills.push(bill);
                for (order of bill.o) {
                  addReportItem(order.iId, { wholesell: [billNum, order.a] });
                }
              } else {
                newSummeryDoc.bills.push(bill);
                for (order of bill.o) {
                  addReportItem(order.iId, { retail: order.a });
                }
              }
            }
          }
          commits.push({
            type: "set",
            path: paths.cashCounter(stockId, cashCounterIds[i]),
            obj: cashCounterReset,
          });
        }
        commits.push({
          type: "create",
          path: paths.summery(stockId, currentDate()),
          obj: newSummeryDoc,
        });
      }
    }
    return commits;
  });
  return setObj(rtPaths.currentDate, currentDate());
}
