import { applyOr, interfaceOf, is, sanitizeJson } from "sanitize-json";
import { checkAuth, checkPermission } from "../middlewere";
import { IncorrectReqErr } from "../utility/res";

const reqS = interfaceOf({
  billNum: applyOr(is.number, is.string),
  stockID: is.string,
  cashCounterID: is.string,
  date: is.string,
});

export default async function CancleBill(
  data: req.CancleBill,
  context: req.context
): Res<null> {
  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "accountent");
  if (permissionErr.err) return permissionErr;

  // Todo
  return { err: false, val: null };
}
