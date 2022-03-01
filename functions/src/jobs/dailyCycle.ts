import { InitCashCounter } from "../documents/cashCounter";
import { ResetStock } from "../documents/stock";
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
  const stockDocReset = ResetStock(),
    cashCounterReset = InitCashCounter();

  const promiseArr: Res<null>[] = [];
  for (const stockID of Object.keys(configDoc)) {
    const cashCounterPaths = Object.keys(configDoc[stockID].cashCounters).map(
      (x) => paths.cashCounter(stockID, x)
    );
    promiseArr.push(
      runTransactionComplete(
        [paths.stock(stockID), ...cashCounterPaths],
        ([stockDoc, ...counterDocs]) => {
          const commits: completeCommit[] = [];
          commits.push({
            type: "update",
            path: paths.stock(stockID),
            obj: stockDocReset,
          });
          for (const cashCounterPath of cashCounterPaths) {
            commits.push({
              type: "set",
              path: cashCounterPath,
              obj: cashCounterReset,
            });
          }
          commits.push({
            type: "create",
            path: paths.summery(stockID, date.val),
            obj: createSummery(stockDoc, counterDocs),
          });
          return commits;
        }
      )
    );
  }
  await Promise.all(promiseArr);
  return await setObj(rtPaths.currentDate, currentDate());
}
