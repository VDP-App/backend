import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.initializeApp();

exports.fnRunEveryDay = functions
  .region("asia-south1")
  .pubsub.schedule("0 * * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async function (context) {
    function addObj(
      obj1: { [itemID: string]: number },
      obj2: { [itemID: string]: number }
    ) {
      const obj3 = { ...obj2 };
      Object.keys(obj1).forEach((itemID) => {
        if (itemID in obj3) obj3[itemID] += obj1[itemID];
        else obj3[itemID] = obj1[itemID];
      });
      return obj3;
    }
    function docData({
      startWith,
      stockChanges,
    }: {
      startWith: { [itemID: string]: number };
      stockChanges: { [itemID: string]: number };
    }) {
      return {
        startWith: addObj(startWith, stockChanges),
        entries: {},
        stockChanges: {},
        billSold: {},
        customSold: {},
        money: {
          earned: 0,
          SGST: 0,
          CGST: 0,
          custom: 0,
          back: 0,
          expenses: 0,
        },
      };
    }
    const firestore = app.firestore();
    const dateRef = app
      .database("https://vdp-production-40318.firebaseio.com/")
      .ref("config/lastDate");
    const lastCheckDate: string = (await dateRef.get()).val();
    const date = new Date();
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    const todaysDate = date.toISOString().slice(0, 10);
    if (todaysDate === lastCheckDate)
      return functions.logger.info("✔️ ✔️ ✔️ already done! at " + date);
    dateRef.set(todaysDate);
    try {
      return functions.logger.log(
        await firestore.runTransaction(async function (transaction) {
          const prvDocData = (await transaction
            .getAll(
              firestore.doc(`sell/${lastCheckDate}`),
              firestore.doc(`production/${lastCheckDate}`)
            )
            .then((x) => x.map((y) => y.data()))) as [any, any];
          transaction.create(
            firestore.doc(`sell/${todaysDate}`),
            docData(prvDocData[0])
          );
          transaction.create(
            firestore.doc(`production/${todaysDate}`),
            docData(prvDocData[1])
          );
          return "💃 💃 💃 Done! at " + date;
        })
      );
    } catch (err) {
      functions.logger.error(err);
      return functions.logger.warn("😞 😞 😞 failed! at " + date);
    }
  });
