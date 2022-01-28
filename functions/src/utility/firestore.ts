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
  summery: (stockID: string, date: string) =>
    `stocks/${stockID}/summery/${date}`,
};

export function getDoc<T>(docPath: string) {
  return db
    .doc(docPath)
    .get()
    .future((x) => x.data() as any as undefined | T);
}

export function updateDoc(docPath: string, obj: obj) {
  return db
    .doc(docPath)
    .update(obj)
    .future(() => null);
}

export function runBatch(...commits: commit[]) {
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
  processDoc: (docs: T) => LikePromise<
    | {
        commits?: commit[] | commit;
        updateDoc?: obj;
        returnVal: R;
        err?: undefined;
      }
    | { err: err }
  >
): Res<R> {
  const x_1 = await db
    .runTransaction<res<R>>(async function (transaction) {
      const ref = db.doc(docPath);
      const res = await processDoc(
        (await transaction.get(ref).then((x) => x.data())) as any
      );
      if (res.err) return { err: true, val: res.err };
      if (res.updateDoc) transaction.update(ref, res.updateDoc);
      if (res.commits) {
        if (!Array.isArray(res.commits)) res.commits = [res.commits];
        let commit: commit;
        for (commit of res.commits) {
          if (commit.ignore) continue;
          if (commit.type === "delete") transaction.delete(db.doc(commit.path));
          else transaction[commit.type](db.doc(commit.path), commit.obj);
        }
      }
      return { err: false, val: res.returnVal };
    })
    .future();
  return x_1.err ? x_1 : x_1.val;
}

export async function runTransactionComplete(
  processDoc: (
    getDocs: (paths: string[]) => Promise<any[]>
  ) => Promise<completeCommit[]>
): Res<null> {
  const x_1 = await db
    .runTransaction<res<null>>(async function (transaction) {
      const refs: firestore.DocumentReference<firestore.DocumentData>[] = [];
      const commits = await processDoc(async function (paths) {
        let path: string;
        for (path of paths) refs.push(db.doc(path));
        const x = await transaction.getAll(...refs);
        const y: any[] = [];
        let doc: firestore.DocumentSnapshot<firestore.DocumentData>;
        for (doc of x) y.push(doc.data());
        return y;
      });
      if (commits) {
        let commit: completeCommit;
        for (commit of commits) {
          if (commit.ignore) continue;
          if (commit.type === "delete") transaction.delete(db.doc(commit.path));
          else if (commit.type === "set")
            transaction.set(db.doc(commit.path), commit.obj);
          else transaction[commit.type](db.doc(commit.path), commit.obj);
        }
      }
      return { err: false, val: null };
    })
    .future();
  return x_1.err ? x_1 : x_1.val;
}
