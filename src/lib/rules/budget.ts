import {
  addMoney,
  compareMoney,
  divMoney,
  isNegativeMoney,
  isZeroMoney,
  mulMoneyInt,
  money,
  percentOf,
  subMoney,
  sumBy,
  toDecimal,
  type Money,
} from "@/lib/money";
import type { BudgetCategory, BudgetLine, Project } from "@/lib/types";

export type LineStatus = "unspent" | "part_committed" | "committed" | "over" | "critical";

export type BudgetHealth = "healthy" | "watch" | "at_risk" | "critical";

export interface BudgetTotals {
  budgetAmount: Money;
  committedAmount: Money;
  actualAmount: Money;
  spentPlusCommitted: Money;
  remaining: Money;
  variance: Money;
  forecastAtCompletion: Money;
  utilisationPercent: string;
  committedPercent: string;
  lineCount: number;
  overBudgetLineCount: number;
  health: BudgetHealth;
}

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  labour: "Labour",
  materials: "Materials",
  equipment: "Plant & Equipment",
  subcontractors: "Subcontractors",
  professional_fees: "Professional Fees",
  permits: "Permits & Statutory",
  contingency: "Contingency",
  overhead: "Site Overhead",
};

export function isContingency(category: BudgetCategory): boolean {
  return category === "contingency";
}

export function lineCommittedPlusActual(line: BudgetLine): Money {
  return addMoney(line.committedAmount, line.actualAmount);
}

export function lineRemaining(line: BudgetLine): Money {
  return subMoney(line.budgetAmount, lineCommittedPlusActual(line));
}

export function lineVariance(line: BudgetLine): Money {
  return lineRemaining(line);
}

export function lineUsedPercent(line: BudgetLine): number {
  const budget = toDecimal(line.budgetAmount);
  if (budget.isZero()) return 0;
  return toDecimal(lineCommittedPlusActual(line)).dividedBy(budget).times(100).toNumber();
}

export function lineStatus(line: BudgetLine): LineStatus {
  const remaining = toDecimal(lineRemaining(line));
  const budget = toDecimal(line.budgetAmount);
  if (remaining.isNegative()) {
    return lineUsedPercent(line) >= 110 ? "critical" : "over";
  }
  if (budget.isZero()) return "unspent";
  if (toDecimal(line.actualAmount).isZero() && toDecimal(line.committedAmount).isZero()) {
    return "unspent";
  }
  if (remaining.isZero()) return "committed";
  return "part_committed";
}

export function overBudgetLines(lines: readonly BudgetLine[]): BudgetLine[] {
  return lines.filter((line) => toDecimal(lineRemaining(line)).isNegative());
}

export function totalBudgetAmount(lines: readonly BudgetLine[]): Money {
  return sumBy(lines, (line) => line.budgetAmount);
}

export function totalCommittedAmount(lines: readonly BudgetLine[]): Money {
  return sumBy(lines, (line) => line.committedAmount);
}

export function totalActualAmount(lines: readonly BudgetLine[]): Money {
  return sumBy(lines, (line) => line.actualAmount);
}

export function totalsByCategory(
  lines: readonly BudgetLine[],
): { category: BudgetCategory; budget: Money; committed: Money; actual: Money; total: Money }[] {
  const categories = Array.from(new Set(lines.map((line) => line.category)));
  return categories.map((category) => {
    const scoped = lines.filter((line) => line.category === category);
    const budget = sumBy(scoped, (line) => line.budgetAmount);
    const committed = sumBy(scoped, (line) => line.committedAmount);
    const actual = sumBy(scoped, (line) => line.actualAmount);
    return { category, budget, committed, actual, total: addMoney(budget, committed, actual) };
  });
}

export function contingencyLines(lines: readonly BudgetLine[]): BudgetLine[] {
  return lines.filter((line) => isContingency(line.category));
}

export function contingencyRemaining(lines: readonly BudgetLine[]): Money {
  return sumBy(contingencyLines(lines), (line) => lineRemaining(line));
}

export function forecastAtCompletion(
  actualSoFar: Money,
  progressPercent: number,
): Money {
  if (!progressPercent || progressPercent <= 0) return money(0);
  return money(divMoney(actualSoFar, String(progressPercent / 100), 2));
}

export function budgetTotals(
  lines: readonly BudgetLine[],
  options: { progressPercent?: number } = {},
): BudgetTotals {
  const budgetAmount = totalBudgetAmount(lines);
  const committedAmount = totalCommittedAmount(lines);
  const actualAmount = totalActualAmount(lines);
  const spentPlusCommitted = addMoney(committedAmount, actualAmount);
  const remaining = subMoney(budgetAmount, spentPlusCommitted);
  const progress = options.progressPercent ?? 0;
  const forecastAtCompletionValue = forecastAtCompletion(actualAmount, progress);
  const over = overBudgetLines(lines);
  return {
    budgetAmount,
    committedAmount,
    actualAmount,
    spentPlusCommitted,
    remaining,
    variance: remaining,
    forecastAtCompletion: forecastAtCompletionValue,
    utilisationPercent: percentOf(spentPlusCommitted, budgetAmount),
    committedPercent: percentOf(committedAmount, budgetAmount),
    lineCount: lines.length,
    overBudgetLineCount: over.length,
    health: healthFromTotals({
      budgetAmount,
      spentPlusCommitted,
      remaining,
      forecastAtCompletion: forecastAtCompletionValue,
      progressPercent: progress,
      overBudgetLineCount: over.length,
    }),
  };
}

export function healthFromTotals(input: {
  budgetAmount: Money;
  spentPlusCommitted: Money;
  remaining: Money;
  forecastAtCompletion: Money;
  progressPercent: number;
  overBudgetLineCount: number;
}): BudgetHealth {
  if (isZeroMoney(input.budgetAmount)) return "healthy";
  if (input.overBudgetLineCount >= 3) return "critical";
  const used = toDecimal(input.spentPlusCommitted).dividedBy(input.budgetAmount).times(100);
  const progress = Math.max(input.progressPercent, 0);
  const forecast = toDecimal(input.forecastAtCompletion);
  const budget = toDecimal(input.budgetAmount);
  if (used.greaterThan(100) || forecast.greaterThan(budget)) {
    return used.greaterThan(110) || forecast.greaterThan(budget.times(1.08)) ? "critical" : "at_risk";
  }
  if (progress > 0) {
    const usedPercent = used.toNumber();
    if (usedPercent > progress + 8) return "at_risk";
    if (usedPercent > progress + 3) return "watch";
  }
  if (isNegativeMoney(input.remaining)) return "at_risk";
  return "healthy";
}

export const HEALTH_LABELS: Record<BudgetHealth, string> = {
  healthy: "On track",
  watch: "Watch",
  at_risk: "At risk",
  critical: "Critical",
};

export const HEALTH_TONES: Record<BudgetHealth, "ok" | "warn" | "danger"> = {
  healthy: "ok",
  watch: "warn",
  at_risk: "warn",
  critical: "danger",
};

export function budgetLineStatusText(line: BudgetLine): string {
  const status = lineStatus(line);
  switch (status) {
    case "unspent":
      return "Unspent";
    case "part_committed":
      return "Committed";
    case "committed":
      return "Fully used";
    case "over":
      return "Over budget";
    case "critical":
      return "Critical over";
  }
}

export function burnPerDay(lines: readonly BudgetLine[], elapsedDays: number): Money {
  if (elapsedDays <= 0) return money(0);
  return money(divMoney(totalActualAmount(lines), String(elapsedDays), 2));
}

export function projectedDailyRate(
  lines: readonly BudgetLine[],
  remainingDays: number,
): Money {
  if (remainingDays <= 0) return money(0);
  return money(divMoney(subMoney(totalBudgetAmount(lines), totalActualAmount(lines)), String(remainingDays), 2));
}

export function budgetLineSharePercent(line: BudgetLine, lines: readonly BudgetLine[]): string {
  return percentOf(line.budgetAmount, totalBudgetAmount(lines), 1);
}

export function canReallocate(
  from: BudgetLine,
  to: BudgetLine,
  amount: Money,
): { allowed: boolean; reason: string } {
  if (compareMoney(amount, "0") <= 0) {
    return { allowed: false, reason: "Transfer amount must be positive." };
  }
  if (from.category === to.category && from.id === to.id) {
    return { allowed: false, reason: "Source and target must differ." };
  }
  if (isContingency(from.category) && isContingency(to.category)) {
    return { allowed: false, reason: "Contingency cannot be moved to another contingency line." };
  }
  if (isZeroMoney(from.budgetAmount)) {
    return { allowed: false, reason: "Source line has no budget to reallocate from." };
  }
  if (compareMoney(lineRemaining(from), amount) < 0) {
    return { allowed: false, reason: "Transfer exceeds remaining balance on the source line." };
  }
  return { allowed: true, reason: "Transfer is within the source line balance." };
}

export function contractValuePerDay(project: Project): Money {
  const days = Math.max(
    1,
    Math.round(
      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
        86_400_000,
    ),
  );
  return money(divMoney(project.contractValue, String(days), 2));
}

export function budgetVsContractVariance(project: Project): Money {
  return subMoney(project.contractValue, totalBudgetAmount(project.budgetLines));
}

export function scaledBudgetForProgress(
  project: Project,
  lines: readonly BudgetLine[],
  progressPercent: number,
): Money {
  const budget = totalBudgetAmount(lines);
  if (progressPercent <= 0) return money(0);
  return money(divMoney(budget, String(progressPercent / 100), 2));
}

export function budgetAlertCount(lines: readonly BudgetLine[]): number {
  return lines.filter((line) => {
    const status = lineStatus(line);
    return status === "over" || status === "critical";
  }).length;
}

export function retentionAmount(contractValue: Money, retentionPercent: string): Money {
  return money(divMoney(contractValue, String(toDecimal(retentionPercent).dividedBy(100)), 2));
}

export function expectedValueAtCompletion(project: Project): Money {
  return forecastAtCompletion(totalActualAmount(project.budgetLines), project.progressPercent);
}

export function marginAtCompletion(project: Project): Money {
  return subMoney(project.contractValue, expectedValueAtCompletion(project));
}

export function marginPercentAtCompletion(project: Project): string {
  return percentOf(marginAtCompletion(project), project.contractValue, 1);
}

export function labourSharePercent(lines: readonly BudgetLine[]): string {
  const labour = lines.filter((line) => line.category === "labour");
  if (labour.length === 0) return "0.0";
  return percentOf(sumBy(labour, (line) => line.budgetAmount), totalBudgetAmount(lines), 1);
}

export function dailySpendCapacity(remaining: Money, remainingDays: number): Money {
  if (remainingDays <= 0) return money(0);
  return money(divMoney(remaining, String(remainingDays), 2));
}

export function budgetRollupByCategory(
  lines: readonly BudgetLine[],
): { category: BudgetCategory; label: string; budget: Money; actual: Money; variance: Money; usedPercent: number }[] {
  return totalsByCategory(lines).map((entry) => {
    const scoped = lines.filter((line) => line.category === entry.category);
    return {
      category: entry.category,
      label: CATEGORY_LABELS[entry.category],
      budget: entry.budget,
      actual: entry.actual,
      variance: subMoney(entry.budget, entry.actual),
      usedPercent: lineUsedPercent({
        ...(scoped[0] ?? ({} as BudgetLine)),
        budgetAmount: entry.budget,
        committedAmount: entry.committed,
        actualAmount: entry.actual,
      }),
    };
  });
}

export function warnIfNegative(value: Money): boolean {
  return isNegativeMoney(value);
}

export function monthlyRunRate(lines: readonly BudgetLine[], elapsedMonths: number): Money {
  if (elapsedMonths <= 0) return money(0);
  return money(divMoney(totalActualAmount(lines), String(elapsedMonths), 2));
}

export function annualisedSpend(lines: readonly BudgetLine[], elapsedMonths: number): Money {
  return mulMoneyInt(monthlyRunRate(lines, elapsedMonths), 12);
}
