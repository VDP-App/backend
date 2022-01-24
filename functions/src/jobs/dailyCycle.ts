import { InitCashCounter } from "../documents/cashCounter";
import { createSummery } from "../documents/summery";
import { getDoc, paths, runTransactionComplete } from "../utility/firestore";
import { getObj, paths as rtPaths, setObj } from "../utility/realtime";
import { currentDate } from "../utility/utils";

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
    let stockID: string,
      cashCounterIDs: string[],
      cashCounterID: string,
      stockDoc: documents.stock,
      counterDoc: documents.cashCounter,
      counterDocs: typeof counterDoc[];

    for (stockID in configDoc) {
      if (Object.prototype.hasOwnProperty.call(configDoc, stockID)) {
        cashCounterIDs = Object.keys(configDoc[stockID].cashCounters).map((x) =>
          paths.cashCounter(stockID, x)
        );
        [stockDoc, ...counterDocs] = await getDocs([
          paths.stock(stockID),
          ...cashCounterIDs,
        ]);
        commits.push({
          type: "update",
          path: paths.stock(stockID),
          obj: stockDocReset,
        });
        for (cashCounterID of cashCounterIDs) {
          commits.push({
            type: "set",
            path: paths.cashCounter(stockID, cashCounterID),
            obj: cashCounterReset,
          });
        }
        commits.push({
          type: "create",
          path: paths.summery(stockID, currentDate()),
          obj: createSummery(stockDoc, counterDocs),
        });
      }
    }
    return commits;
  });
  return setObj(rtPaths.currentDate, currentDate());
}
