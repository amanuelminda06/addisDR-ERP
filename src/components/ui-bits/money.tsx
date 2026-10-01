import { cn } from "cn";
import { formatMoney, toDecimal, type Money } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/lib/money";

export function MoneyText({
  value,
  compact = false,
  currency = DEFAULT_CURRENCY,
  dp = 2,
  className,
  showSign = false,
}: {
  value: Money;
  compact?: boolean;
  currency?: string;
  dp?: number;
  className?: string;
  showSign?: boolean;
}) {
  return (
    <span
      className={cn("tabular-nums", !compact && "whitespace-nowrap", className)}
      data-money={value}
    >
      {formatMoney(value, { compact, currency, dp, showSign })}
    </span>
  );
}

export function SignedMoneyText({
  value,
  compact = false,
  currency = DEFAULT_CURRENCY,
  className,
}: {
  value: Money;
  compact?: boolean;
  currency?: string;
  className?: string;
}) {
  const negative = toDecimal(value).isNegative();
  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        negative ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
        className,
      )}
    >
      {formatMoney(value, { compact, currency, showSign: true })}
    </span>
  );
}

export function PercentText({
  value,
  dp = 1,
  className,
  suffix = true,
}: {
  value: number;
  dp?: number;
  className?: string;
  suffix?: boolean;
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {value.toFixed(dp)}
      {suffix ? "%" : ""}
    </span>
  );
}
