import { database } from "firebase-admin";
import { app } from "../init";
import { currentDate } from "./utils";

const db = app.database();

export const rtIncrement = database.ServerValue.increment;

export const paths = {
  admin: (email: string) => `admin/${email}`,
  cashCounterBillNum: (stockID: string, cashCounterID: string, date?: string) =>
    `billNum/${stockID}-${cashCounterID}/${date ?? currentDate()}`,
  currentDate: "currentDate",
};

export function getObj<T>(path: string) {
  return db
    .ref(path)
    .get()
    .future<T>((x) => x.val());
}

export function setObj(path: string, val: any) {
  return db.ref(path).set(val).future<null>();
}

export function runTransaction<T>(path: string, fn: (val: T) => T | undefined) {
  let val: null | T = null;
  return db
    .ref(path)
    .transaction(function (x) {
      val = fn(x) ?? null;
      return val;
    })
    .future<T | null>(() => val);
}
