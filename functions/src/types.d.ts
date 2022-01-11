import { auth } from "firebase-admin";
import { functions } from "./init";

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
  interface Array<T> {
    mapCheck(checker: (val: T) => T | void): T[] | void;
    checkTypeIs(type: type): boolean;
    checkTypeIsNot(type: type): boolean;
    areRespectively(list: type[]): boolean;
    areRespectivelyNot(list: type[]): boolean;
  }
  interface String {
    isIn(list: string[]): boolean;
    isNotIn(list: string[]): boolean;
  }
  interface err {
    code: string;
    message: string;
  }
  type applyClaim =
    | undefined
    | "admin"
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
    iId: string;
    q: number;
    a: number;
    r: number;
  }
  interface bill {
    isWS: boolean;
    inC: boolean;
    mG: number;
    o: order[];
  }
  interface stockChanges {
    iId: string;
  }
  interface stockChangesInDoc extends stockChanges {
    n: number;
    i: number;
  }
  interface stockChangesInReq extends stockChanges {
    val: number;
    type: "set" | "increment";
  }
  interface entry<T extends stockChanges> {
    sC: T[];
    fT?: boolean;
  }
  interface transferEntry {}
  type commit =
    | { path: string; ignore?: boolean } & (
        | { type: "update" | "create"; obj: obj }
        | { type: "delete" }
      );
  interface obj<T = any> {
    [key: string]: T;
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
          cashCounters: {
            [cashCounterId: string]: {
              name: string;
            };
          };
        };
      };
      users: {
        [uid: string]: {
          email: string;
          name: string;
          claim: claim;
        };
      };
    }
    interface stock {
      entry: entry<stockChangesInDoc>[];
      currentStocks: { [itemID: string]: number | undefined };
      transferNotifications: { [uniqueId: string]: transferEntry };
    }
    interface cashCounter {
      bills: { [billNum: string]: bill };
      income: { online: number; offline: number };
      stockConsumed: { [itemID: string]: number | undefined };
      cancledBillNum?: string[];
    }
  }
  namespace bgFn {
    namespace rtDb {
      type changes = functions.Change<functions.database.DataSnapshot>;
      type context = functions.EventContext;
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
      date: string;
    }
    interface StockChanges {
      stockID: string;
      changes: entry<stockChangesInReq>;
    }
  }
}
