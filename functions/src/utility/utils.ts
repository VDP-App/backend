export function randomStr() {
  const { floor, random } = Math;
  const { charAt } =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array(10)
    .fill(() => floor(random() * 62))
    .map((x) => charAt(x()))
    .join("");
}

export function currentDate() {
  return new Date().toISOString().split("T")[0];
}
