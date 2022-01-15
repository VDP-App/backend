import "./prototype";
import { functions } from "./init";
import EditItem from "./apis/editItem";
import ApplyRole from "./apis/applyRole";
import AdminRole from "./jobs/adminRole";
import Billing from "./apis/billing";
import EditShop from "./apis/editShop";
import CancleBill from "./apis/cancleBill";
import StockChanges from "./apis/stockChanges";
import TransferStock from "./apis/transferStock";
import DailyCycle from "./jobs/dailyCycle";

// make || remove => admin
exports.adminRole = functions.database.ref("/admin/{email}").onWrite(AdminRole);

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

// cancle bills
exports.cancleBill = functions.https.onCall(CancleBill);

exports.cycle = functions.pubsub.schedule("0 2,3 * * *").onRun(DailyCycle);
