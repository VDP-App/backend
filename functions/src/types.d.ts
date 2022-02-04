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
    | { role: "manager"; stockID: string }
    | { role: "accountent"; stockID: string; cashCounterID: string };
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
    n: string | number; //? bill number
  }
  namespace stockChanges {
    interface inDoc {
      iId: string; //? itemId
      n: number; //? now
      i: number; //? increment
      t?: "set" | "inc"; //? type
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
  interface entry {
    sC: stockChanges.inDoc[]; //? stockChanges
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
  type log = {
    item: item;
    itemId: string;
    createdAt: string;
    createdBy: string;
  } & (
    | { type: "create" }
    | { type: "update"; oldItem: item }
    | { type: "remove"; remainingStock: { [stockID: string]: number } }
  );
  namespace documents {
    interface logs {
      logs: log[];
      createItem: number[];
      removeItem: number[];
      updateItem: number[];
    }
    interface config_products {
      log: { count: number; page: number };
      ids: string[];
      items: { [id: string]: item };
    }
    interface config_config {
      stocks: {
        [stockID: string]: {
          name: string;
          cashCounters: { [cashCounterID: string]: { name: string } };
        };
      };
      users: {
        [uid: string]: { email: string; name: string; claim: claim };
      };
    }
    interface stock {
      entry: entry[];
      currentStocks: { [itemID: string]: number | undefined };
      transferNotifications: {
        [uniqueID: string]: {
          sC: stockChanges.inSendTransfer[]; //? stockChanges
          tF: string; //? transferFrom
          sUid: string;
        };
      };
      // ! uniqueID == stockID_date_entryNum
    }
    interface cashCounter {
      bills: bill[];
      income: { online: number; offline: number };
    }
    interface summery {
      bills: bill[];
      entry: entry[];
      stockSnapShot: { [itemId: string]: number | undefined };
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
      applyClaims: applyClaim;
      name: string;
    }
    type EditShop = { name: string } & (
      | { type: "createStock" }
      | { type: "editStock"; stockID: string }
      | { type: "createCashCounter"; stockID: string }
      | { type: "editCashCounter"; stockID: string; cashCounterID: string }
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
      changes: stockChanges.inReq[];
    }
    type TransferStock =
      | {
          type: "send";
          stockID: string;
          sendTostockID: string;
          changes: stockChanges.inSendTransfer[];
        }
      | { type: "recive"; uniqueID: string; stockID: string };
  }
}
