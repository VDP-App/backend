export function randomStr() {
  const { floor, random } = Math;
  const { charAt } =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array(10)
    .fill(() => floor(random() * 62))
    .map((x) => charAt(x()))
    .join("");
}

export function DateObj() {
  const date = new Date();
  date.setHours(date.getHours() + 5);
  date.setMinutes(date.getMinutes() + 30);
  return date;
}

export function currentDate() {
  return DateObj().toISOString().split("T")[0];
}
