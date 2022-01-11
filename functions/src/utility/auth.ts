import { app } from "../init";

export function applyClaims(uid: string, claims: applyClaim) {
  let claimObj: null | obj = null;
  if (claims) {
    if (claims === "admin") claimObj = { r: 0 };
    else if (claims.role === "manager") claimObj = { r: 1, s: claims.stockId };
    else if (claims.role === "accountent")
      claimObj = { r: 2, s: claims.stockId, c: claims.cashCounter };
  }
  return app.auth().setCustomUserClaims(uid, claimObj).future();
}

export function getClaims(claims: applyClaim): claim | null {
  if (!claims) return null;
  if (claims === "admin") return { r: 0 };
  else if (claims.role === "manager") return { r: 1, s: claims.stockId };
  else if (claims.role === "accountent")
    return { r: 2, s: claims.stockId, c: claims.cashCounter };
  return null;
}

export function getUser(uid: string) {
  return app.auth().getUser(uid).future<user>();
}

export function getUserByEmail(email: string) {
  return app.auth().getUserByEmail(email).future<user>();
}
