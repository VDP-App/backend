import { checkAuth, checkPermission } from "../middlewere";
import { paths, runTransaction } from "../utility/firestore";
import { InitCashCounter, InitStock } from "../utility/docSetUp";
import { IncorrectReqErr } from "../utility/res";
import { randomStr } from "../utility/utils";

function reqIsNotOk(data: req.EditShop): boolean {
  try {
    if (
      [data.name, data.type].checkTypeIsNot("string") ||
      data.type.isNotIn([
        "createStock",
        "editStock",
        "createCashCounter",
        "editCashCounter",
        "editName",
      ])
    )
      return true;
    if (data.type === "editName") {
      if (typeof data.uid !== "string") return true;
    } else if (
      (data.type !== "createStock" && typeof data.stockID !== "string") ||
      (data.type === "editCashCounter" &&
        typeof data.cashCounterId !== "string")
    )
      return true;

    return false;
  } catch {
    return true;
  }
}

export default async function EditShop(
  data: req.EditShop,
  context: req.context
): Res<string> {
  if (reqIsNotOk(data)) return { err: true, val: IncorrectReqErr };

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
