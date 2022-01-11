export function isSameAs(Obj: obj, obj: obj<type>) {
  try {
    for (const key in obj) if (!isTypeOf(Obj[key], obj[key])) return false;
    return true;
  } catch {
    return false;
  }
}

export function mapCheck<T>(
  obj: obj<T>,
  checker: (val: T) => T | void
): obj<T> | void {
  const newObj: obj<T> = {};
  let val;
  for (const key in obj) {
    val = checker(obj[key]);
    if (!val) return;
    newObj[key] = val;
  }
  return newObj;
}

export function checkBill(bill: bill): bill | void {
  try {
    if (
      isSameAs(bill, {
        isWS: "boolean",
        inC: "boolean",
        mG: "number",
        o: "array",
      })
    ) {
      const o = bill.o.mapCheck(checkOrder);
      if (o)
        return {
          isWS: bill.isWS,
          inC: bill.inC,
          mG: bill.mG,
          o: o,
        };
    }
  } catch {}
}

export function checkItem(item: item): item | void {
  try {
    if (
      isSameAs(item, {
        code: "string",
        collectionName: "string",
        name: "string",
        cgst: "number",
        rate1: "number",
        rate2: "number",
        sgst: "number",
      })
    )
      return {
        cgst: item.cgst,
        code: item.code,
        collectionName: item.collectionName,
        name: item.name,
        rate1: item.rate1,
        rate2: item.rate2,
        sgst: item.sgst,
      };
  } catch {}
}

export function checkApplyClaims(applyClaim: applyClaim): applyClaim | void {
  try {
    if (applyClaim === "admin" || applyClaim === undefined) return applyClaim;
    if ([applyClaim.role, applyClaim.stockId].checkTypeIs("string"))
      if (applyClaim.role === "manager")
        return {
          role: "manager",
          stockId: applyClaim.stockId,
        };
      else if (applyClaim.role === "accountent")
        return {
          role: "accountent",
          stockId: applyClaim.stockId,
          cashCounter: applyClaim.cashCounter,
        };
  } catch {}
}

export function checkOrder(order: order): order | void {
  try {
    if (
      isSameAs(order, {
        iId: "string",
        q: "number",
        a: "number",
        r: "number",
      }) &&
      order.a > 999 &&
      order.q > 1
    )
      return {
        iId: order.iId,
        q: order.q,
        a: order.a,
        r: order.r,
      };
  } catch {}
}

export function isTypeOf(val: any, type: type): boolean {
  if (type === "null") return val === null;
  const t = typeof val;
  if (t === type) return true;
  if (type === "array" && t === "object") return Array.isArray(val);
  return false;
}
