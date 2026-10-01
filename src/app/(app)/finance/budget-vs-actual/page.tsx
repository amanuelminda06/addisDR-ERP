"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui-bits/page-header";
import {
  PlannedBanner,
  PlannedSelectionBar,
  PlannedTable,
  PlannedToolbar,
  RoleGuard,
  type PlannedColumn,
} from "@/components/ui-bits/planned-page";
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";
import { MoneyText, PercentText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { budgetVsActualRows, marginSummary } from "@/lib/rules/finance";
import {
  CATEGORY_LABELS,
  healthFromTotals,
  HEALTH_LABELS,
  HEALTH_TONES,
  scaledBudgetForProgress,
} from "@/lib/rules/budget";
import { sumBy } from "@/lib/money";
import type { BudgetCategory } from "@/lib/types";

interface VarianceRow {
  projectId: string;
  projectCode: string;
  projectName: string;
  contractValue: string;
  scaledBudget: string;
  costToDate: string;
  variance: string;
  variancePercent: string;
  expectedValue: string;
  forecastAtCompletion: string;
  marginPercent: string;
  health: "healthy" | "watch" | "at_risk" | "critical";
  progressPercent: number;
}

function BudgetVsActualContent() {
  const data = useErpData();

  const rows = useMemo<VarianceRow[]>(
    () =>
      data.rollups.map((project) => {
        const summary = marginSummary(project.contractValue, project.totals.actualAmount);
        const scaled = scaledBudgetForProgress(
          project,
          project.budgetLines,
          project.progressPercent,
        );
        const expectedValue = scaled;
        return {
          projectId: project.id,
          projectCode: project.code,
          projectName: project.name,
          contractValue: project.contractValue,
          scaledBudget: scaled,
          costToDate: project.totals.actualAmount,
          variance: project.totals.remaining,
          variancePercent: project.totals.utilisationPercent,
          expectedValue,
          forecastAtCompletion: project.totals.forecastAtCompletion,
          marginPercent: summary.marginPercent,
          health: project.totals.health,
          progressPercent: project.progressPercent,
        };
      }),
    [data.rollups],
  );

  const byCategory = useMemo(
    () => data.projects.flatMap((project) =>
      budgetVsActualRows(project.budgetLines).map((row) => ({ ...row, projectCode: project.code })),
    ),
    [data.projects],
  );

  const columns: PlannedColumn<VarianceRow>[] = [
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <NavLink href={`/projects/${row.projectId}`} className="font-medium hover:underline">
          {row.projectCode}
        </NavLink>
      ),
    },
    {
      key: "contractValue",
      header: "Contract value",
      align: "right",
      cell: (row) => <MoneyText value={row.contractValue} />,
    },
    {
      key: "scaledBudget",
      header: "Budget to date",
      align: "right",
      cell: (row) => <MoneyText value={row.scaledBudget} />,
    },
    {
      key: "costToDate",
      header: "Cost to date",
      align: "right",
      cell: (row) => <MoneyText value={row.costToDate} />,
    },
    {
      key: "variance",
      header: "Variance",
      align: "right",
      cell: (row) => <SignedMoneyText value={row.variance} />,
    },
    {
      key: "utilisation",
      header: "Used",
      align: "right",
      cell: (row) => (
        <span className="flex flex-col items-end gap-1">
          <PercentText value={Number(row.variancePercent)} />
          <Progress
            value={Math.min(100, Number(row.variancePercent))}
            className={Number(row.variancePercent) > 100 ? "[&_[data-slot=progress-indicator]]:bg-red-500" : ""}
          />
        </span>
      ),
    },
    {
      key: "expectedValue",
      header: "Expected at progress",
      align: "right",
      cell: (row) => (
        <span className="flex flex-col items-end gap-0.5">
          <MoneyText value={row.expectedValue} compact />
          <span className="text-xs text-muted-foreground">
            at {row.progressPercent}% complete
          </span>
        </span>
      ),
    },
    {
      key: "forecastAtCompletion",
      header: "Forecast at completion",
      align: "right",
      cell: (row) => <MoneyText value={row.forecastAtCompletion} compact />,
    },
    {
      key: "marginPercent",
      header: "Margin to date",
      align: "right",
      cell: (row) => (
        <span className={row.marginPercent.startsWith("-") ? "text-red-600" : ""}>
          {row.marginPercent}%
        </span>
      ),
    },
    {
      key: "health",
      header: "Health",
      cell: (row) => (
        <ToneBadge tone={HEALTH_TONES[row.health] as Tone} dot>
          {HEALTH_LABELS[row.health]}
        </ToneBadge>
      ),
    },
  ];

  const categoryColumns: PlannedColumn<(typeof byCategory)[number]>[] = [
    { key: "project", header: "Project", cell: (row) => row.projectCode },
    { key: "description", header: "Cost code", cell: (row) => row.description },
    {
      key: "category",
      header: "Category",
      cell: (row) => CATEGORY_LABELS[row.category as BudgetCategory],
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      cell: (row) => <MoneyText value={row.budget} />,
    },
    {
      key: "committed",
      header: "Committed",
      align: "right",
      cell: (row) => <MoneyText value={row.committed} compact />,
    },
    {
      key: "actual",
      header: "Actual",
      align: "right",
      cell: (row) => <MoneyText value={row.actual} />,
    },
    {
      key: "variance",
      header: "Variance",
      align: "right",
      cell: (row) => <SignedMoneyText value={row.variance} />,
    },
    {
      key: "consumed",
      header: "Consumed",
      align: "right",
      cell: (row) => <PercentText value={row.usedPercent} />,
    },
  ];

  const portfolioHealth = useMemo(
    () =>
      healthFromTotals({
        budgetAmount: sumBy(data.rollups, (project) => project.totals.budgetAmount),
        spentPlusCommitted: sumBy(
          data.rollups,
          (project) => project.totals.spentPlusCommitted,
        ),
        remaining: sumBy(data.rollups, (project) => project.totals.remaining),
        forecastAtCompletion: sumBy(
          data.rollups,
          (project) => project.totals.forecastAtCompletion,
        ),
        progressPercent: data.portfolio.weightedProgressPercent,
        overBudgetLineCount: data.budgetAlerts,
      }),
    [data.rollups, data.portfolio.weightedProgressPercent, data.budgetAlerts],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="finance.budget-vs-actual" />
      <PlannedBanner sectionKey="finance.budget-vs-actual" />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Portfolio health</CardTitle>
            <ToneBadge tone={HEALTH_TONES[portfolioHealth] as Tone} dot>
              {HEALTH_LABELS[portfolioHealth]}
            </ToneBadge>
          </div>
          <CardDescription>
            Time-scaled by progress so a 40% complete project is not judged against 100% of its
            budget.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>
            Weighted progress{" "}
            <PercentText value={data.portfolio.weightedProgressPercent} /> · remaining budget{" "}
            <MoneyText value={data.portfolio.remaining} compact /> ·{" "}
            {data.budgetAlerts} budget alerts across {data.projects.length} projects.
          </p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search cost codes…"
        filters={["All projects", "All categories", "Over budget only"]}
        actions={["Reallocate", "Add budget line", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="projects" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.projectId} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Cost code detail
        </h2>
        <PlannedSelectionBar count={byCategory.length} label="cost codes" />
        <PlannedTable
          columns={categoryColumns}
          rows={[...byCategory].sort((a, b) => b.usedPercent - a.usedPercent)}
          rowKey={(row) => row.id}
          maxHeight="480px"
        />
      </div>
    </div>
  );
}

export default function BudgetVsActualPage() {
  return (
    <RoleGuard sectionKey="finance.budget-vs-actual">
      <HydrationGate>
        <BudgetVsActualContent />
      </HydrationGate>
    </RoleGuard>
  );
}
