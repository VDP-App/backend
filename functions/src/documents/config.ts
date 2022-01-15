import { fsValue } from "../utility/firestore";
import { randomStr } from "../utility/utils";

export type _this = documents.config_config;

export function setUser(
  uid: string,
  val?: { email: string; name?: string; claim: claim | null },
  configObj: obj = {}
) {
  if (val && val.claim) configObj[`users.${uid}`] = val;
  else configObj[`users.${uid}`] = fsValue.delete();
  return configObj;
}
export function setUsername(uid: string, name: string, configObj: obj = {}) {
  configObj[`users.${uid}.name`] = name;
  return configObj;
}

export function setStock(
  val: { name: string; stockId?: string },
  doc: _this,
  configObj: obj = {}
): [string, obj] {
  if (val.stockId === undefined) {
    do val.stockId = randomStr();
    while (val.stockId in doc.stocks);
    configObj[`stocks.${val.stockId}`] = {
      name: val.name,
      cashCounters: { main: { name: "main" } },
    };
  } else configObj[`stocks.${val.stockId}.name`] = val.name;
  return [val.stockId, configObj];
}

export function setCashCounter(
  val: { name: string; stockID: string; cashCounterId?: string },
  doc: _this,
  configObj: obj = {}
): [string, obj] {
  if (val.cashCounterId === undefined) {
    const stockConfig = doc.stocks[val.stockID];
    do val.cashCounterId = randomStr();
    while (val.cashCounterId in stockConfig.cashCounters);
    configObj[`stocks.${val.stockID}.cashCounters.${val.cashCounterId}`] = {
      name: val.name,
    };
  } else
    configObj[`stocks.${val.stockID}.cashCounters.${val.cashCounterId}.name`] =
      val.name;
  return [val.cashCounterId, configObj];
}
