import { addMoney, subMoney, sumBy, toDecimal, type Money } from "@/lib/money";
import type { Project, ProjectStatus } from "@/lib/types";
import { daysBetween } from "@/lib/format";
import { budgetTotals, type BudgetHealth, type BudgetTotals } from "./budget";

export interface ProjectTimeline {
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  expectedProgressPercent: number;
  scheduleVarianceDays: number;
  scheduleVariancePercent: string;
  isBehindSchedule: boolean;
  progressPercent: number;
  daysToCompletion: number;
}

export interface ProjectRollup extends Project {
  totals: BudgetTotals;
  health: BudgetHealth;
  timeline: ProjectTimeline;
  progressGapPercent: number;
  spendPerProgressPoint: Money;
}

export function findProject(projects: readonly Project[], id: string): Project | null {
  return projects.find((project) => project.id === id) ?? null;
}

export function projectsForClient(projects: readonly Project[], clientId: string): Project[] {
  return projects.filter((project) => project.clientId === clientId);
}

export function activeProjects(projects: readonly Project[]): Project[] {
  return projects.filter((project) => project.status === "active");
}

export function projectTimeline(project: Project, asOf: string | Date = new Date()): ProjectTimeline {
  const totalDays = Math.max(1, daysBetween(project.startDate, project.endDate));
  const elapsedDays = Math.max(0, daysBetween(project.startDate, asOf));
  const remainingDays = Math.max(0, daysBetween(asOf, project.endDate));
  const expectedProgressPercent = Math.min(100, (elapsedDays / totalDays) * 100);
  const progress = clampPercent(project.progressPercent);
  const progressPerDay = 100 / totalDays;
  const scheduleVarianceDays = Number(((progress - expectedProgressPercent) / progressPerDay).toFixed(1));
  return {
    totalDays,
    elapsedDays,
    remainingDays,
    expectedProgressPercent: Number(expectedProgressPercent.toFixed(1)),
    scheduleVarianceDays,
    scheduleVariancePercent: expectedProgressPercent === 0
      ? "0.0"
      : toDecimal(progress)
          .minus(expectedProgressPercent)
          .dividedBy(expectedProgressPercent)
          .times(100)
          .toDecimalPlaces(1)
          .toFixed(1),
    isBehindSchedule: progress + 2 < expectedProgressPercent,
    progressPercent: progress,
    daysToCompletion: remainingDays,
  };
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function projectHealth(project: Project, asOf: string | Date = new Date()): BudgetHealth {
  const totals = budgetTotals(project.budgetLines, { progressPercent: project.progressPercent });
  const timeline = projectTimeline(project, asOf);
  if (project.status === "completed") return "healthy";
  if (totals.health === "critical") return "critical";
  if (timeline.isBehindSchedule && totals.health !== "healthy") return "critical";
  return totals.health;
}

export function withRollups(project: Project, asOf: string | Date = new Date()): ProjectRollup {
  const totals = budgetTotals(project.budgetLines, { progressPercent: project.progressPercent });
  const timeline = projectTimeline(project, asOf);
  return {
    ...project,
    totals,
    health: projectHealth(project, asOf),
    timeline,
    progressGapPercent: Number(
      (project.progressPercent - timeline.expectedProgressPercent).toFixed(1),
    ),
    spendPerProgressPoint:
      project.progressPercent > 0
        ? toDecimal(totals.actualAmount).dividedBy(project.progressPercent).toDecimalPlaces(2).toFixed(2)
        : "0.00",
  };
}

export interface PortfolioTotals {
  projectCount: number;
  activeCount: number;
  contractValue: Money;
  budgetAmount: Money;
  committedAmount: Money;
  actualAmount: Money;
  remaining: Money;
  averageProgressPercent: number;
  weightedProgressPercent: number;
}

export function portfolioTotals(projects: readonly Project[]): PortfolioTotals {
  const contractValue = sumBy(projects, (project) => project.contractValue);
  const budgetAmount = sumBy(projects, (project) =>
    sumBy(project.budgetLines, (line) => line.budgetAmount),
  );
  const committedAmount = sumBy(projects, (project) =>
    sumBy(project.budgetLines, (line) => line.committedAmount),
  );
  const actualAmount = sumBy(projects, (project) =>
    sumBy(project.budgetLines, (line) => line.actualAmount),
  );
  const totalProgress = projects.reduce((acc, project) => acc + project.progressPercent, 0);
  const weighted = toDecimal(contractValue).isZero()
    ? 0
    : projects
        .reduce(
          (acc, project) => acc.plus(toDecimal(project.contractValue).times(project.progressPercent)),
          toDecimal(0),
        )
        .dividedBy(contractValue)
        .toNumber();
  return {
    projectCount: projects.length,
    activeCount: projects.filter((project) => project.status === "active").length,
    contractValue,
    budgetAmount,
    committedAmount,
    actualAmount,
    remaining: subMoney(budgetAmount, addMoney(committedAmount, actualAmount)),
    averageProgressPercent:
      projects.length === 0 ? 0 : Number((totalProgress / projects.length).toFixed(1)),
    weightedProgressPercent: Number(weighted.toFixed(1)),
  };
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

export const PROJECT_STATUS_TONES: Record<ProjectStatus, "ok" | "warn" | "muted" | "info"> = {
  planning: "info",
  active: "ok",
  on_hold: "warn",
  completed: "muted",
};

export const PROJECT_TYPE_LABELS: Record<Project["type"], string> = {
  residential: "Residential",
  commercial: "Commercial",
  infrastructure: "Infrastructure",
  fit_out: "Interior Fit-out",
};

export function projectCrew(project: Project, employees: readonly { id: string }[]): number {
  return employees.filter((employee) => project.engineerEmployeeIds.includes(employee.id)).length;
}

export function sortProjectsByRisk(projects: readonly Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const aRollup = withRollups(a);
    const bRollup = withRollups(b);
    return aRollup.progressGapPercent - bRollup.progressGapPercent;
  });
}

export function daysUntil(project: Project): number {
  return daysBetween(new Date(), project.endDate);
}

export function isCompletionAtRisk(project: Project, asOf: string | Date = new Date()): boolean {
  return projectTimeline(project, asOf).isBehindSchedule;
}

export function projectRef(project: Project): string {
  return project.code;
}

export function budgetLineFor(
  project: Project,
  category: Project["budgetLines"][number]["category"],
): Project["budgetLines"][number] | null {
  return project.budgetLines.find((line) => line.category === category) ?? null;
}
