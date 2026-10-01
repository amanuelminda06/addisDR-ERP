import Decimal from "decimal.js";

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

export type Money = string;

export const ZERO: Money = "0.00";

export const DEFAULT_CURRENCY = "USD";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SAR: "SAR ",
  QAR: "QAR ",
  KWD: "KD ",
  INR: "₹",
  NGN: "₦",
  ZAR: "R",
  KES: "KSh ",
};

export type MoneyInput = Money | number | Decimal | null | undefined;

export function toDecimal(value: MoneyInput): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  if (value instanceof Decimal) return value;
  if (typeof value === "number") return new Decimal(value);
  const trimmed = value.trim().replace(/[^0-9.eE+-]/g, "");
  if (trimmed === "" || trimmed === "-" || trimmed === "+") return new Decimal(0);
  return new Decimal(trimmed);
}

export function money(value: MoneyInput, dp = 2): Money {
  return toDecimal(value).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toFixed(dp);
}

export function zero(dp = 2): Money {
  return new Decimal(0).toFixed(dp);
}

export function addMoney(...values: MoneyInput[]): Money {
  return money(values.reduce<Decimal>((acc, v) => acc.plus(toDecimal(v)), new Decimal(0)));
}

export function sumMoney(values: Iterable<MoneyInput>): Money {
  let acc = new Decimal(0);
  for (const v of values) acc = acc.plus(toDecimal(v));
  return money(acc);
}

export function subMoney(a: MoneyInput, b: MoneyInput): Money {
  return money(toDecimal(a).minus(toDecimal(b)));
}

export function mulMoney(value: MoneyInput, factor: MoneyInput): Money {
  return money(toDecimal(value).times(toDecimal(factor)));
}

export function mulMoneyInt(value: MoneyInput, factor: number): Money {
  return money(toDecimal(value).times(factor));
}

export function divMoney(a: MoneyInput, b: MoneyInput, dp = 2): Money {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return zero(dp);
  return money(toDecimal(a).dividedBy(divisor), dp);
}

export function negateMoney(value: MoneyInput): Money {
  return money(toDecimal(value).negated());
}

export function absMoney(value: MoneyInput): Money {
  return money(toDecimal(value).abs());
}

export function compareMoney(a: MoneyInput, b: MoneyInput): -1 | 0 | 1 {
  return toDecimal(a).comparedTo(toDecimal(b)) as -1 | 0 | 1;
}

export function isZeroMoney(value: MoneyInput): boolean {
  return toDecimal(value).isZero();
}

export function isNegativeMoney(value: MoneyInput): boolean {
  return toDecimal(value).isNegative();
}

export function isPositiveMoney(value: MoneyInput): boolean {
  return toDecimal(value).greaterThan(0);
}

export function maxMoney(a: MoneyInput, b: MoneyInput): Money {
  return compareMoney(a, b) >= 0 ? money(a) : money(b);
}

export function minMoney(a: MoneyInput, b: MoneyInput): Money {
  return compareMoney(a, b) <= 0 ? money(a) : money(b);
}

export function sumBy<T>(items: readonly T[], pick: (item: T) => MoneyInput): Money {
  return sumMoney(items.map(pick));
}

export function percentOf(part: MoneyInput, whole: MoneyInput, dp = 1): string {
  const total = toDecimal(whole);
  if (total.isZero()) return "0.0";
  return toDecimal(part).dividedBy(total).times(100).toDecimalPlaces(dp).toFixed(dp);
}

export function ratioString(part: MoneyInput, whole: MoneyInput, dp = 2): string {
  const total = toDecimal(whole);
  if (total.isZero()) return zero(dp);
  return toDecimal(part).dividedBy(total).toDecimalPlaces(dp).toFixed(dp);
}

export function formatMoney(
  value: MoneyInput,
  options: { currency?: string; compact?: boolean; showSign?: boolean; dp?: number } = {},
): string {
  const { currency = DEFAULT_CURRENCY, compact = false, showSign = false, dp = 2 } = options;
  const decimalValue = toDecimal(value).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
  const numeric = decimalValue.toNumber();
  if (compact) {
    const abs = Math.abs(numeric);
    const sign = numeric < 0 ? "-" : showSign && numeric > 0 ? "+" : "";
    if (abs >= 1_000_000_000) return `${sign}${currencySymbol(currency)}${trim(abs / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${sign}${currencySymbol(currency)}${trim(abs / 1_000_000)}M`;
    if (abs >= 1_000) return `${sign}${currencySymbol(currency)}${trim(abs / 1_000)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    signDisplay: showSign ? "exceptZero" : "auto",
  }).format(numeric);
}

export function currencySymbol(currency = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatNumber(value: number, dp = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(value);
}

export function clampPercent(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
