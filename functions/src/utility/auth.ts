import { app } from "../init";

export function applyClaims(uid: string, claims: applyClaim) {
  let claimObj: null | obj = null;
  if (claims) {
    if (claims.role === "admin") claimObj = { r: 0 };
    else if (claims.role === "manager") claimObj = { r: 1, s: claims.stockID };
    else if (claims.role === "accountent")
      claimObj = { r: 2, s: claims.stockID, c: claims.cashCounterID };
  }
  return app.auth().setCustomUserClaims(uid, claimObj).future();
}

export function getClaims(claims: applyClaim): claim | null {
  if (!claims) return null;
  if (claims.role === "admin") return { r: 0 };
  else if (claims.role === "manager") return { r: 1, s: claims.stockID };
  else if (claims.role === "accountent")
    return { r: 2, s: claims.stockID, c: claims.cashCounterID };
  return null;
}

export function getUser(uid: string) {
  return app.auth().getUser(uid).future<user>();
}

export function getUserByEmail(email: string) {
  return app
    .auth()
    .getUserByEmail(email)
    .catch(() => app.auth().createUser({ email, password: "panth977" }))
    .future<user>();
}
