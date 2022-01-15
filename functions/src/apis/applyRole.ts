import {
  checkIf,
  interfaceOf,
  is,
  isEmail,
  isUndefinedOr,
  sanitizeJson,
  switchOn,
} from "sanitize-json";
import { checkAuth, checkPermission } from "../middlewere";
import { applyClaims, getClaims, getUserByEmail } from "../utility/auth";
import { AuthorizationLevelErr, IncorrectReqErr } from "../utility/res";
import { paths, setDoc } from "../utility/firestore";
import { setUser } from "../documents/config";

const managerS = interfaceOf({ role: is.string, stockId: is.string });
const accountentS = interfaceOf({
  role: is.string,
  stockId: is.string,
  cashCounter: is.string,
});
const reqS = interfaceOf({
  email: checkIf(is.string, isEmail),
  name: is.string,
  applyClaims: isUndefinedOr(
    switchOn(
      (x: any) => x.role,
      { when: "manager", then: managerS },
      { when: "accountent", then: accountentS }
    )
  ),
});

export default async function ApplyRole(
  data: req.ApplyRole,
  context: req.context
): Res<null> {
  const err = { err: true as true, val: AuthorizationLevelErr };

  const cleanData = sanitizeJson(reqS, data);
  if (cleanData.err) return { err: true, val: IncorrectReqErr };
  data = cleanData.val;

  const claim = data.applyClaim;
  if (claim?.role === "admin") return err;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "admin");
  if (permissionErr.err) return permissionErr;

  const otherUser = await getUserByEmail(data.email);
  if (otherUser.err) return otherUser;
  if (otherUser.val.customClaims?.r === 0) return err;

  const configObj: obj = {};

  if (claim) {
    setUser(
      otherUser.val.uid,
      { email: data.email, name: data.name, claim: getClaims(claim) },
      configObj
    );
  } else if (otherUser.val.customClaims) {
    setUser(otherUser.val.uid, undefined, configObj);
  }

  await applyClaims(data.email, claim);

  return setDoc(paths.config, "update", configObj);
}
