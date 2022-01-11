export default async function StockChanges(
  data: req.StockChanges,
  context: req.context
): Res<null> {
  return { err: false, val: null };
}
