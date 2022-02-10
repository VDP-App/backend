import { fsValue } from "../utility/firestore";
import { randomStr } from "../utility/utils";

export type _this = documents.raw.config_config;

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
  val: { name: string; stockID?: string },
  doc: _this,
  configObj: obj = {}
): [string, obj] {
  if (val.stockID === undefined) {
    do val.stockID = randomStr();
    while (val.stockID in doc.stocks);
    configObj[`stocks.${val.stockID}`] = {
      name: val.name,
      cashCounters: { main: { name: "main" } },
    };
  } else configObj[`stocks.${val.stockID}.name`] = val.name;
  return [val.stockID, configObj];
}

export function setCashCounter(
  val: { name: string; stockID: string; cashCounterID?: string },
  doc: _this,
  configObj: obj = {}
): [string, obj] {
  if (val.cashCounterID === undefined) {
    const stockConfig = doc.stocks[val.stockID];
    do val.cashCounterID = randomStr();
    while (val.cashCounterID in stockConfig.cashCounters);
    configObj[`stocks.${val.stockID}.cashCounters.${val.cashCounterID}`] = {
      name: val.name,
    };
  } else
    configObj[`stocks.${val.stockID}.cashCounters.${val.cashCounterID}.name`] =
      val.name;
  return [val.cashCounterID, configObj];
}
