import { setUser } from "../documents/config";
import { applyClaims, getClaims, getUserByEmail } from "../utility/auth";
import { setDoc, paths as fsPaths } from "../utility/firestore";
import { paths, setObj } from "../utility/realtime";

export default async function AdminRole(
  change: bgFn.rtDb.changes,
  context: bgFn.rtDb.context
) {
  let obj:
    | ({ status: "🤔🤔🤔" } & err)
    | { status: "👍👍👍"; message: string }
    | undefined = undefined;
  const email: string = context.params.email;
  let claim: applyClaim | null = undefined;
  const val = change.after.val();

  const user = await getUserByEmail(email);

  if (user.err)
    obj = {
      status: "🤔🤔🤔",
      code: "No Such User",
      message: "" + user.originalErr?.() || user.val.message,
    };
  else {
    const uid = user.val.uid;

    if (val === "make") {
      claim = { role: "admin" };
      obj = {
        status: "👍👍👍",
        message: "This user was made admin successfully",
      };
    } else if (val === "remove") {
      obj = {
        status: "👍👍👍",
        message: "This user was removed from admin rights successfully",
      };
    } else if (typeof val === "string") {
      claim = null;
      obj = {
        status: "🤔🤔🤔",
        code: "Worng Input",
        message: "try writing 'make' or 'remove'",
      };
    } else if (change.after.exists()) return;

    if (claim !== null) {
      const configObj = setUser(uid, {
        email: email,
        name: "Admin",
        claim: getClaims(claim),
      });

      setDoc(fsPaths.config, "update", configObj);

      const res = await applyClaims(uid, claim);
      if (res.err)
        obj = {
          status: "🤔🤔🤔",
          code: `Error while ${claim ? "applying" : "removing"} admin rights`,
          message: res.originalErr?.() ?? res.val.message,
        };
    }
  }

  if (obj) await setObj(paths.admin(email), obj);
}
