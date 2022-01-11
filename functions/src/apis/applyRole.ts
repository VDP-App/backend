import { checkApplyClaims } from "../utility/check";
import { checkAuth, checkPermission } from "../middlewere";
import { applyClaims, getClaims, getUserByEmail } from "../utility/auth";
import { AuthorizationLevelErr, IncorrectReqErr } from "../utility/res";
import { fsValue, paths, setDoc } from "../utility/firestore";

function checkReq(data: req.ApplyRole): res<req.ApplyRole> {
  const err = { err: true as true, val: IncorrectReqErr };
  if ([data.email, data.name].checkTypeIsNot("string")) return err;
  const applyClaim = checkApplyClaims(data.applyClaim);
  if (!applyClaim && data.applyClaim) return err;
  return {
    err: false,
    val: {
      email: data.email,
      applyClaim: applyClaim ?? undefined,
      name: data.name,
    },
  };
}

export default async function ApplyRole(
  data: req.ApplyRole,
  context: req.context
): Res<null> {
  const err = { err: true as true, val: AuthorizationLevelErr };

  const p = checkReq(data);
  if (p.err) return p;
  data = p.val;

  const claim = data.applyClaim;
  if (claim === "admin") return err;

  const user = await checkAuth(context);
  if (user.err) return user;

  const permissionErr = checkPermission(user.val, "admin");
  if (permissionErr.err) return permissionErr;

  const otherUser = await getUserByEmail(data.email);
  if (otherUser.err) return otherUser;
  if (otherUser.val.customClaims?.r === 0) return err;

  const configObj: obj = {};

  if (claim) {
    configObj[`users.${otherUser.val.uid}`] = {
      email: otherUser.val.email,
      name: data.name,
      claim: getClaims(claim),
    };
  } else if (otherUser.val.customClaims) {
    configObj[`users.${otherUser.val.uid}`] = fsValue.delete();
  }

  await applyClaims(data.email, claim);

  return setDoc(paths.config, "update", configObj);
}
