import {
  checkIfIt,
  isInterfaceAs,
  isString,
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

const managerS = isInterfaceAs({ role: isString, stockID: isString });
const accountentS = isInterfaceAs({
  role: isString,
  stockID: isString,
  cashCounter: isString,
});
const reqS = isInterfaceAs({
  email: checkIfIt(isString, isEmail),
  name: isString,
  applyClaims: isUndefinedOr(
    switchOn((x: any) => x.role, { manager: managerS, accountent: accountentS })
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

  await applyClaims(otherUser.val.uid, claim);

  return await setDoc(paths.config, "update", configObj);
}
