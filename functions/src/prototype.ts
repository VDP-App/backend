import { logger } from "firebase-functions";
import { isTypeOf } from "./utility/check";
import { InternalErr } from "./utility/res";

Promise.prototype.future = function (this, onfulfilled, onrejected) {
  return this.then(onfulfilled).then(
    (x) => ({ err: false, val: x }),
    function (e) {
      logger.error(e);
      return {
        err: true,
        val: onrejected ?? InternalErr,
        originalErr() {
          return e;
        },
      };
    }
  );
};

Array.prototype.mapCheck = function (this, checker) {
  const newArr = [];
  let val;
  for (const e of this) {
    val = checker(e);
    if (!val) return;
    newArr.push(val);
  }
  return newArr;
};

Array.prototype.checkTypeIs = function (this, type) {
  for (const e of this) if (!isTypeOf(e, type)) return false;
  return true;
};

Array.prototype.checkTypeIsNot = function (this, type) {
  return !this.checkTypeIs(type);
};

Array.prototype.areRespectively = function (this, list) {
  for (const i in list) if (!isTypeOf(this[i], list[i])) return false;
  return true;
};

Array.prototype.areRespectivelyNot = function (this, list) {
  return !this.areRespectively(list);
};

String.prototype.isIn = function (this, list) {
  for (const e of list) if (this === e) return true;
  return false;
};

String.prototype.isNotIn = function (this, list) {
  return !this.isIn(list);
};
