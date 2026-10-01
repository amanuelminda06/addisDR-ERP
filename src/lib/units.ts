import Decimal from "decimal.js";

export type Quantity = string;

export const QZERO: Quantity = "0.00";

export type QuantityInput = Quantity | number | Decimal | null | undefined;

export function toQ(value: QuantityInput): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  if (value instanceof Decimal) return value;
  if (typeof value === "number") return new Decimal(value);
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "+") return new Decimal(0);
  return new Decimal(trimmed);
}

export function q(value: QuantityInput, dp = 2): Quantity {
  return toQ(value).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toFixed(dp);
}

export function qAdd(a: QuantityInput, b: QuantityInput): Quantity {
  return q(toQ(a).plus(toQ(b)));
}

export function qSub(a: QuantityInput, b: QuantityInput): Quantity {
  return q(toQ(a).minus(toQ(b)));
}

export function qMul(a: QuantityInput, b: QuantityInput): Quantity {
  return q(toQ(a).times(toQ(b)));
}

export function qDiv(a: QuantityInput, b: QuantityInput, dp = 2): Quantity {
  const divisor = toQ(b);
  if (divisor.isZero()) return q(0, dp);
  return q(toQ(a).dividedBy(divisor), dp);
}

export function qSum(values: Iterable<QuantityInput>, dp = 2): Quantity {
  let acc = new Decimal(0);
  for (const v of values) acc = acc.plus(toQ(v));
  return q(acc, dp);
}

export function qCompare(a: QuantityInput, b: QuantityInput): -1 | 0 | 1 {
  return toQ(a).comparedTo(toQ(b)) as -1 | 0 | 1;
}

export function qIsZero(value: QuantityInput): boolean {
  return toQ(value).isZero();
}

export function qPercentOf(part: QuantityInput, whole: QuantityInput, dp = 1): string {
  const total = toQ(whole);
  if (total.isZero()) return "0.0";
  return toQ(part).dividedBy(total).times(100).toDecimalPlaces(dp).toFixed(dp);
}

export function formatHours(value: QuantityInput, dp = 1): string {
  return `${q(value, dp)} h`;
}

export function formatDays(value: QuantityInput, dp = 1): string {
  return `${q(value, dp)} d`;
}
