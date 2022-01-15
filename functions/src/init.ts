import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.initializeApp();
const regionalFunctions = functions.region("asia-south1");

export { regionalFunctions as functions, admin, app };
