import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { InitCashCounter } from "../documents/cashCounter";
import { InitStock } from "../documents/stock";
import { IncorrectReqErr } from "../utility/res";
import {
  combine,
  interfaceOf,
  is,
  sanitizeJson,
  switchOn,
} from "sanitize-json";
import { setCashCounter, setStock, setUsername } from "../documents/config";

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
      setUsername(data.uid, data.name, docChanges);
      returnVal = data.uid;
    } else if (data.type === "createStock") {
      [returnVal] = setStock(data, doc, docChanges);
      commits.push(
        { path: paths.stock(returnVal), type: "create", obj: InitStock() },
        {
          path: paths.cashCounter(returnVal, "main"),
          type: "create",
          obj: InitCashCounter(),
        }
      );
    } else {
      if (data.stockID in doc.stocks) {
        if (data.type === "editStock") {
          [returnVal] = setStock(data, doc, docChanges);
        } else if (data.type === "createCashCounter") {
          [returnVal] = setCashCounter(data, doc, docChanges);
          commits.push({
            path: paths.cashCounter(data.stockID, returnVal),
            type: "create",
            obj: InitCashCounter(),
          });
        } else {
          if (data.cashCounterId in doc.stocks[data.stockID].cashCounters) {
            [returnVal] = setCashCounter(data, doc, docChanges);
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
