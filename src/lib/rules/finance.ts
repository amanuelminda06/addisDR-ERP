import {
  addMoney,
  compareMoney,
  divMoney,
  isNegativeMoney,
  isZeroMoney,
  money,
  percentOf,
  subMoney,
  sumBy,
  toDecimal,
  type Money,
} from "@/lib/money";
import { addDays, formatDate } from "date-fns";
import { daysBetween, toDate } from "@/lib/format";
import type { BudgetLine, CashFlowMonth, ChartOfAccount, ExpenseClaim, Invoice } from "@/lib/types";

export const DEFAULT_TAX_RATE = "0.05";

export type AgingBucket = "current" | "d1_30" | "d31_60" | "d61_90" | "d90_plus";

export const AGING_LABELS: Record<AgingBucket, string> = {
  current: "Current",
  d1_30: "1–30 days",
  d31_60: "31–60 days",
  d61_90: "61–90 days",
  d90_plus: "90+ days",
};

export const AGING_TONES: Record<AgingBucket, "ok" | "warn" | "danger" | "muted"> = {
  current: "ok",
  d1_30: "warn",
  d31_60: "warn",
  d61_90: "danger",
  d90_plus: "danger",
};

export function invoiceOutstanding(invoice: Invoice): Money {
  return subMoney(invoice.total, invoice.amountPaid);
}

export function invoiceDaysOverdue(invoice: Invoice, asOf: string | Date = new Date()): number {
  if (["paid", "draft"].includes(invoice.status)) return 0;
  return Math.max(0, daysBetween(invoice.dueDate, asOf));
}

export function agingBucket(invoice: Invoice, asOf: string | Date = new Date()): AgingBucket {
  const overdue = invoiceDaysOverdue(invoice, asOf);
  if (overdue === 0) return "current";
  if (overdue <= 30) return "d1_30";
  if (overdue <= 60) return "d31_60";
  if (overdue <= 90) return "d61_90";
  return "d90_plus";
}

export function agingReport(
  invoices: readonly Invoice[],
  asOf: string | Date = new Date(),
): { bucket: AgingBucket; label: string; count: number; value: Money }[] {
  const buckets: AgingBucket[] = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"];
  return buckets.map((bucket) => {
    const scoped = invoices.filter((invoice) => agingBucket(invoice, asOf) === bucket);
    return {
      bucket,
      label: AGING_LABELS[bucket],
      count: scoped.length,
      value: sumBy(scoped, (invoice) => invoiceOutstanding(invoice)),
    };
  });
}

export function totalReceivable(invoices: readonly Invoice[]): Money {
  return sumBy(
    invoices.filter((invoice) => invoice.status !== "draft"),
    (invoice) => invoiceOutstanding(invoice),
  );
}

export function overdueReceivable(invoices: readonly Invoice[], asOf: string | Date = new Date()): Money {
  return sumBy(
    invoices.filter((invoice) => invoiceDaysOverdue(invoice, asOf) > 0),
    (invoice) => invoiceOutstanding(invoice),
  );
}

export function totalPayable(claims: readonly ExpenseClaim[]): Money {
  return sumBy(
    claims.filter((claim) => ["submitted", "approved"].includes(claim.status)),
    (claim) => claim.amount,
  );
}

export function retentionHeld(invoices: readonly Invoice[]): Money {
  return sumBy(invoices, (invoice) => invoice.retentionAmount);
}

export function releasableRetention(
  invoices: readonly Invoice[],
  asOf: string | Date = new Date(),
): Money {
  return sumBy(
    invoices.filter((invoice) => daysBetween(asOf, invoice.issueDate) > 180),
    (invoice) => invoice.retentionAmount,
  );
}

export function taxOn(subtotal: Money, rate: Money = DEFAULT_TAX_RATE): Money {
  return money(divMoney(subtotal, String(toDecimal(rate).plus(1)), 4));
}

export function grossFromNet(net: Money, rate: Money = DEFAULT_TAX_RATE): Money {
  return money(divMoney(net, String(toDecimal(rate).plus(1)), 4));
}

export function invoiceTotals(subtotal: Money, rate: Money = DEFAULT_TAX_RATE): {
  subtotal: Money;
  tax: Money;
  total: Money;
} {
  const tax = taxOn(subtotal, rate);
  return { subtotal: money(subtotal), tax, total: addMoney(subtotal, tax) };
}

export function dueDateFor(issueDate: string, paymentTermsDays: number): string {
  return formatDate(addDays(toDate(issueDate), paymentTermsDays), "yyyy-MM-dd");
}

export function paymentTermsLabel(days: number): string {
  if (days === 0) return "On receipt";
  if (days < 7) return `Net ${days}`;
  return `Net ${days} days`;
}

export function cashFlowNet(inflow: Money, outflow: Money): Money {
  return subMoney(inflow, outflow);
}

export function cumulativeCashFlow(months: readonly CashFlowMonth[]): {
  period: string;
  net: Money;
  closing: Money;
}[] {
  return months.map((month) => ({
    period: month.period,
    net: cashFlowNet(month.inflow, month.outflow),
    closing: month.closingBalance,
  }));
}

export function totalForecastOutflow(months: readonly CashFlowMonth[]): Money {
  return sumBy(
    months.filter((month) => month.forecast),
    (month) => month.outflow,
  );
}

export function budgetVsActualRows(lines: readonly BudgetLine[]): {
  id: string;
  description: string;
  category: string;
  budget: Money;
  committed: Money;
  actual: Money;
  variance: Money;
  usedPercent: number;
}[] {
  return lines.map((line) => {
    const committedPlusActual = addMoney(line.committedAmount, line.actualAmount);
    const budget = toDecimal(line.budgetAmount);
    return {
      id: line.id,
      description: line.description,
      category: line.category,
      budget: line.budgetAmount,
      committed: line.committedAmount,
      actual: line.actualAmount,
      variance: subMoney(line.budgetAmount, committedPlusActual),
      usedPercent: budget.isZero()
        ? 0
        : toDecimal(committedPlusActual).dividedBy(budget).times(100).toNumber(),
    };
  });
}

export function marginSummary(contractValue: Money, costToDate: Money): {
  contractValue: Money;
  costToDate: Money;
  margin: Money;
  marginPercent: string;
  isPositive: boolean;
} {
  const margin = subMoney(contractValue, costToDate);
  return {
    contractValue: money(contractValue),
    costToDate: money(costToDate),
    margin,
    marginPercent: percentOf(margin, contractValue, 1),
    isPositive: !isNegativeMoney(margin),
  };
}

export function receivableDays(invoices: readonly Invoice[], asOf: string | Date = new Date()): string {
  const outstanding = toDecimal(totalReceivable(invoices));
  const last30 = invoices.filter(
    (invoice) => daysBetween(invoice.issueDate, asOf) <= 30 && daysBetween(invoice.issueDate, asOf) >= 0,
  );
  const billed = toDecimal(sumBy(last30, (invoice) => invoice.total));
  if (billed.isZero()) return "0";
  return outstanding.dividedBy(billed.dividedBy(30)).toDecimalPlaces(1).toFixed(1);
}

export function expenseByStatus(claims: readonly ExpenseClaim[]): Record<string, { count: number; total: Money }> {
  const output: Record<string, { count: number; total: Money }> = {};
  for (const claim of claims) {
    const bucket = output[claim.status] ?? { count: 0, total: "0.00" };
    bucket.count += 1;
    bucket.total = addMoney(bucket.total, claim.amount);
    output[claim.status] = bucket;
  }
  return output;
}

export function accountHierarchy(accounts: readonly ChartOfAccount[]): {
  top: ChartOfAccount;
  children: ChartOfAccount[];
  total: Money;
}[] {
  return accounts
    .filter((account) => account.parentCode === null)
    .map((top) => {
      const children = accounts.filter((account) => account.parentCode === top.code);
      return {
        top,
        children,
        total: addMoney(top.balance, sumBy(children, (child) => child.balance)),
      };
    });
}

export function trialBalance(accounts: readonly ChartOfAccount[]): {
  debits: Money;
  credits: Money;
  balanced: boolean;
  difference: Money;
} {
  const debits = sumBy(
    accounts.filter((account) => ["asset", "cost"].includes(account.type)),
    (account) => account.balance,
  );
  const credits = sumBy(
    accounts.filter((account) => ["liability", "income", "equity"].includes(account.type)),
    (account) => account.balance,
  );
  const difference = subMoney(debits, credits);
  return { debits, credits, balanced: isZeroMoney(difference), difference };
}

export function collectionForecast(invoices: readonly Invoice[], asOf: string | Date = new Date()): Money {
  return sumBy(
    invoices.filter((invoice) => {
      const days = daysBetween(asOf, invoice.dueDate);
      return days >= 0 && days <= 30;
    }),
    (invoice) => invoiceOutstanding(invoice),
  );
}

export function creditUtilisation(outstanding: Money, creditLimit: Money): string {
  return percentOf(outstanding, creditLimit, 1);
}

export function overCreditLimit(outstanding: Money, creditLimit: Money): boolean {
  return compareMoney(outstanding, creditLimit) > 0;
}
