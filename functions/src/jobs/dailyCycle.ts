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
    let stockId: string,
      cashCounterIds: string[],
      cashCounterId: string,
      stockDoc: documents.stock,
      counterDoc: documents.cashCounter,
      counterDocs: typeof counterDoc[];

    for (stockId in configDoc) {
      if (Object.prototype.hasOwnProperty.call(configDoc, stockId)) {
        cashCounterIds = Object.keys(configDoc[stockId].cashCounters).map((x) =>
          paths.cashCounter(stockId, x)
        );
        [stockDoc, ...counterDocs] = await getDocs([
          paths.stock(stockId),
          ...cashCounterIds,
        ]);
        commits.push({
          type: "update",
          path: paths.stock(stockId),
          obj: stockDocReset,
        });
        for (cashCounterId of cashCounterIds) {
          commits.push({
            type: "set",
            path: paths.cashCounter(stockId, cashCounterId),
            obj: cashCounterReset,
          });
        }
        commits.push({
          type: "create",
          path: paths.summery(stockId, currentDate()),
          obj: createSummery(stockDoc, counterDocs),
        });
      }
    }
    return commits;
  });
  return setObj(rtPaths.currentDate, currentDate());
}
