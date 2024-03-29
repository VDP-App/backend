import "./prototype";
import { functions } from "./init";
import EditItem from "./apis/editItem";
import ApplyRole from "./apis/applyRole";
import AdminRole from "./jobs/adminRole";
import Billing from "./apis/billing";
import EditShop from "./apis/editShop";
import CancleEntry from "./apis/cancleEntry";
import StockChanges from "./apis/stockChanges";
import TransferStock from "./apis/transferStock";
import DailyCycle from "./jobs/dailyCycle";

// make || remove => admin
exports.adminRole = functions.database.ref("/admin/{uid}").onWrite(AdminRole);

// manager || accountent || remove
exports.applyRole = functions.https.onCall(ApplyRole);

// (stockID |& cashCounter) & (create | delete)
exports.editShop = functions.https.onCall(EditShop);

// create || update || delete
exports.editItem = functions.https.onCall(EditItem);

// retail || whole-sell
exports.billing = functions.https.onCall(Billing);

// set & change
exports.stockChanges = functions.https.onCall(StockChanges);

// send || accept
exports.transferStock = functions.https.onCall(TransferStock);

// cancle bill || stockChanges
exports.cancleEntry = functions.https.onCall(CancleEntry);

exports.cycle = functions.pubsub
  .schedule("1 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(DailyCycle);
