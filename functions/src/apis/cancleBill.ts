import { checkAuth, checkPermission } from "../middlewere";
import { isSameAs } from "../utility/check";
import { IncorrectReqErr } from "../utility/res";

function reqIsNotOk(data: req.CancleBill): boolean {
  return (
    (typeof data.billNum).isNotIn(["string", "number"]) ||
    !isSameAs(data, {
      stockID: "string",
      cashCounterID: "string",
      date: "string",
    })
  );
}

export default async function CancleBill(
  data: req.CancleBill,
  context: req.context
): Res<null> {
  if (reqIsNotOk(data)) return { err: true, val: IncorrectReqErr };

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "accountent");
  if (permissionErr.err) return permissionErr;

  return { err: false, val: null };
}
