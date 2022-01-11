import { CallableContext } from "firebase-functions/lib/providers/https";
import { getUser } from "./utility/auth";
import { AuthorizationLevelErr, NullRes } from "./utility/res";

export async function checkAuth(context: CallableContext): Res<user> {
  if (!context.auth)
    return {
      err: true,
      val: { code: "Auth not fount", message: "You need to LogIn first" },
    };
  return await getUser(context.auth.uid);
}

export function checkPermission(
  auth: user,
  roleNeeded: "admin" | "manager" | "accountent",
  location: { stockID?: string; cashCounterID?: string } = {}
): res<null> {
  const errRes = {
    err: true as true,
    val: AuthorizationLevelErr,
  };
  const claim = auth.customClaims;
  if (!claim) return errRes;
  if (claim.r === 0) return NullRes;
  if (claim.r === 1) {
    if (roleNeeded === "admin") return errRes;
  } else if (claim.r === 2) {
    if (roleNeeded !== "accountent") return errRes;
    if (location.cashCounterID && claim.c !== location.cashCounterID)
      return errRes;
  }
  if (location.stockID && claim.s !== location.stockID) return errRes;
  return NullRes;
}
