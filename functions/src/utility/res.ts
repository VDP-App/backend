export const NullRes: res<null> = { err: false, val: null };
export const InternalErr: err = {
  code: "Something went wrong",
  message: "Internal server side error",
};
export const IncorrectReqErr: err = {
  code: "Incorrect Req send",
  message: "Req formate is not valid or req data is incorrect",
};
export const AuthorizationLevelErr: err = {
  code: "Auth permition required",
  message: "You don't have required permissions",
};
