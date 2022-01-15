import { auth } from "firebase-admin";
import * as functions from "firebase-functions";
import { EventContext } from "firebase-functions";

declare global {
  type LikePromise<T> = Promise<T> | T;
  type res<T> =
    | { err: true; val: err; originalErr?: () => any }
    | { err: false; val: T };
  type Res<T> = Promise<res<T>>;
  interface user extends auth.UserRecord {
    customClaims?: claim;
  }
  type claim = { r: 0 } | { r: 1; s: string } | { r: 2; s: string; c: string };
  type type =
    | "undefined"
    | "symbol"
    | "string"
    | "object"
    | "number"
    | "function"
    | "boolean"
    | "bigint"
    | "array"
    | "null";
  interface Promise<T> {
    future<TResult1 = T>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: err | null
    ): Res<TResult1>;
  }
  interface err {
    code: string;
    message: string;
  }
  type applyClaim =
    | undefined
    | { role: "admin" }
    | { role: "manager"; stockId: string }
    | { role: "accountent"; stockId: string; cashCounter: string };
  interface item {
    cgst: number;
    code: string;
    collectionName: string;
    name: string;
    rate1: number;
    rate2: number;
    sgst: number;
  }
  interface order {
    iId: string; //? itemId
    q: number; //? quntity
    a: number; //? amount
    r: number; //? rate
  }
  interface bill {
    isWS: boolean; //? isWholeSell
    inC: boolean; //? inCash
    mG: number; //? moneyGiven
    o: order[]; //? orders
    uid: string;
  }
  namespace stockChanges {
    interface inDoc {
      iId: string; //? itemId
      n: number; //? now
      i: number; //? increment
    }
    interface inReq {
      iId: string; //? itemId
      val: number;
      type: "set" | "increment";
    }
    interface inSendTransfer {
      iId: string; //? itemId
      send: number;
    }
  }
  interface entry<T> {
    sC: T[]; //? stockChanges
    tF?: string; //? transferFrom
    tT?: string; //? transferTo
    uid: string;
    sUid?: string; //? sender's uid
  }
  type commit =
    | { path: string; ignore?: boolean } & (
        | { type: "update" | "create"; obj: obj }
        | { type: "delete" }
      );
  type completeCommit =
    | { path: string; ignore?: boolean } & (
        | { type: "update" | "create" | "set"; obj: obj }
        | { type: "delete" }
      );
  interface obj<T = any> {
    [key: string]: T;
  }
  interface itemReport {
    r: number; // retail Consumption
    w: obj<number>; // wholesell Consumption
    s: obj<number>; // stock Changes
    tF: obj<number>; // stock Transfered From
    tT: obj<number>; // stock Transfered To
  }
  namespace documents {
    interface config_products {
      log: { count: number; page: number };
      ids: string[];
      items: { [id: string]: item };
    }
    interface config_config {
      stocks: {
        [stockId: string]: {
          name: string;
          cashCounters: { [cashCounterId: string]: { name: string } };
        };
      };
      users: {
        [uid: string]: { email: string; name: string; claim: claim };
      };
    }
    interface stock {
      entry: entry<stockChanges.inDoc>[];
      currentStocks: { [itemID: string]: number | undefined };
      transferNotifications: {
        [uniqueId: string]: {
          sC: stockChanges.inSendTransfer[]; //? stockChanges
          tF: string; //? transferFrom
          sUid: string;
        };
      };
      // ! uniqueId == stockId_date_entryNum
    }
    interface cashCounter {
      bills: { [billNum: string]: bill };
      income: { online: number; offline: number };
    }
    interface summery {
      bills: bill[];
      entry: entry<stockChanges.inDoc>[];
      income: number;
      stockSnapShot: { [itemId: string]: number | undefined };
      report: { [itemId: string]: itemReport | undefined };
    }
  }
  namespace bgFn {
    namespace rtDb {
      type changes = functions.Change<functions.database.DataSnapshot>;
      type context = functions.EventContext;
    }
    namespace schedule {
      type context = EventContext;
    }
  }
  namespace req {
    type context = functions.https.CallableContext;
    interface EditItem {
      type: "create" | "remove" | "update";
      item: item;
      id: string;
    }
    interface ApplyRole {
      email: string;
      applyClaim: applyClaim;
      name: string;
    }
    type EditShop = { name: string } & (
      | { type: "createStock" }
      | { type: "editStock"; stockID: string }
      | { type: "createCashCounter"; stockID: string }
      | { type: "editCashCounter"; stockID: string; cashCounterId: string }
      | { type: "editName"; uid: string }
    );

    interface Billing {
      bill: bill;
      stockID: string;
      cashCounterID: string;
    }
    interface CancleBill {
      billNum: number | string;
      stockID: string;
      cashCounterID: string;
    }
    interface StockChanges {
      stockID: string;
      changes: entry<stockChanges.inReq>;
    }
    type TransferStock =
      | {
          type: "send";
          stockID: string;
          sendToStockID: string;
          changes: entry<stockChanges.inSendTransfer>;
        }
      | { type: "recive"; uniqueID: string; stockID: string };
  }
}
