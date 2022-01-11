import { app } from "../init";
import { firestore } from "firebase-admin";

export const fsValue = firestore.FieldValue;

const db = app.firestore();

export const paths = {
  config: "config/config",
  products: "config/products",
  logs: (pgNum: number | string) => `logs/${pgNum}`,
  stock: (stockID: string) => `stocks/${stockID}`,
  cashCounter: (stockID: string, cashCounterID: string) =>
    `stocks/${stockID}/cashCounters/${cashCounterID}`,
};

export function getDoc<T>(docPath: string) {
  return db
    .doc(docPath)
    .get()
    .future((x) => x.data() as any as undefined | T);
}

export function setDoc(docPath: string, type: "create" | "update", obj: obj) {
  return db
    .doc(docPath)
    [type](obj)
    .future(() => null);
}

export function runBatch(commits: commit[]) {
  const batch = db.batch();
  for (const commit of commits) {
    if (commit.ignore) continue;
    if (commit.type === "delete") batch.delete(db.doc(commit.path));
    else batch[commit.type](db.doc(commit.path), commit.obj);
  }
  return batch.commit().future(() => null);
}

export async function runTransaction<T, R = null>(
  docPath: string,
  processDoc: (docs: T) => LikePromise<{
    commits?: commit[] | commit;
    updateDoc?: obj;
    returnVal: R;
    err?: err;
  }>
): Res<R> {
  const x_1 = await db
    .runTransaction<res<R>>(async function (transaction) {
      const ref = db.doc(docPath);
      const res = await processDoc(
        (await transaction.get(ref).then((x) => x.data())) as any
      );
      if (res.updateDoc) transaction.update(ref, res.updateDoc);
      if (res.commits) {
        if (!Array.isArray(res.commits)) res.commits = [res.commits];
        for (const commit of res.commits) {
          if (commit.ignore) continue;
          if (commit.type === "delete") transaction.delete(db.doc(commit.path));
          else transaction[commit.type](db.doc(commit.path), commit.obj);
        }
      }
      if (res.err) return { err: true, val: res.err };
      return { err: false, val: res.returnVal };
    })
    .future();
  return x_1.err ? x_1 : x_1.val;
}
