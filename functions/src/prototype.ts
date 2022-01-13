import { logger } from "firebase-functions";
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
