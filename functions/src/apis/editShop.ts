import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { InitCashCounter, InitStock } from "../utility/docSetUp";
import { IncorrectReqErr } from "../utility/res";
import { randomStr } from "../utility/utils";
import {
  combine,
  interfaceOf,
  is,
  sanitizeJson,
  switchOn,
} from "sanitize-json";

const commonS = interfaceOf({ name: is.string, type: is.string });
const editS = combine(commonS, interfaceOf({ stockID: is.string }));
const createC = combine(commonS, interfaceOf({ stockID: is.string }));
const editC = combine(
  commonS,
  interfaceOf({ stockID: is.string, cashCounterId: is.string })
);
const editN = combine(commonS, interfaceOf({ uid: is.string }));

const reqS = switchOn(
  (x: any) => x.type,
  { when: "createStock", then: commonS },
  { when: "editStock", then: editS },
  { when: "createCashCounter", then: createC },
  { when: "editCashCounter", then: editC },
  { when: "editName", then: editN }
);
export default async function EditShop(
  data: req.EditShop,
  context: req.context
): Res<string> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "admin");
  if (permissionErr.err) {
    if (data.type !== "editName") return permissionErr;
    else if (user.val.uid !== data.uid) return permissionErr;
  }

  return runTransaction(paths.config, function (doc: documents.config_config) {
    const docChanges: obj = {};
    const commits: commit[] = [];
    let returnVal: string;
    let errObj: err | undefined = undefined;

    if (data.type === "editName") {
      returnVal = data.uid;
      docChanges[`users.${returnVal}.name`] = data.name;
    } else if (data.type === "createStock") {
      do {
        returnVal = randomStr();
      } while (returnVal in doc.stocks);
      docChanges[`stocks.${returnVal}`] = {
        name: data.name,
        cashCounters: { main: { name: "main" } },
      };
      commits.push(
        {
          path: paths.stock(returnVal),
          type: "create",
          obj: InitStock(),
        },
        {
          path: paths.cashCounter(returnVal, "main"),
          type: "create",
          obj: InitCashCounter(),
        }
      );
    } else {
      if (data.stockID in doc.stocks) {
        if (data.type === "editStock") {
          returnVal = data.stockID;
          docChanges[`stocks.${returnVal}.name`] = data.name;
        } else if (data.type === "createCashCounter") {
          do {
            returnVal = randomStr();
          } while (returnVal in doc.stocks[data.stockID].cashCounters);
          docChanges[`stocks.${data.stockID}.cashCounters.${returnVal}`] = {
            name: data.name,
          };
          commits.push({
            path: paths.cashCounter(data.stockID, returnVal),
            type: "create",
            obj: InitCashCounter(),
          });
        } else {
          if (data.cashCounterId in doc.stocks[data.stockID].cashCounters) {
            returnVal = data.cashCounterId;
            docChanges[
              `stocks.${data.stockID}.cashCounters.${returnVal}.name`
            ] = data.name;
          } else {
            returnVal = "";
            errObj = {
              code: "Incorrect Info",
              message: "Given cashCounterID dosen't exist.",
            };
          }
        }
      } else {
        returnVal = "";
        errObj = {
          code: "Incorrect Info",
          message: "Given stockID dosen't exist.",
        };
      }
    }
    return {
      returnVal: returnVal,
      updateDoc: docChanges,
      err: errObj,
      commits: commits,
    };
  });
}
