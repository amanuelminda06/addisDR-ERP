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
import {
  budgetRollupByCategory,
  budgetTotals,
  CATEGORY_LABELS,
  budgetLineStatusText,
  lineRemaining,
  lineStatus,
  lineUsedPercent,
} from "@/lib/rules/budget";
import type { BudgetLine } from "@/lib/types";

const LINE_TONES: Record<string, Tone> = {
  unspent: "muted",
  part_committed: "info",
  committed: "warn",
  over: "danger",
  critical: "danger",
};

function BudgetContent() {
  const data = useErpData();

  const rows = useMemo(() => data.projects.flatMap((project) => project.budgetLines), [data.projects]);
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const totals = useMemo(() => budgetTotals(rows), [rows]);
  const byCategory = useMemo(() => budgetRollupByCategory(rows), [rows]);

  const columns: PlannedColumn<BudgetLine>[] = [
    {
      key: "code",
      header: "Code / description",
      cell: (line) => (
        <>
          <div className="font-medium">{line.description}</div>
          <div className="text-xs text-muted-foreground">
            {line.code} ·{" "}
            <NavLink href={`/projects/${line.projectId}`} className="hover:underline">
              {projectById[line.projectId]?.code}
            </NavLink>
          </div>
        </>
      ),
    },
    { key: "category", header: "Category", cell: (line) => CATEGORY_LABELS[line.category] },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      cell: (line) => <MoneyText value={line.budgetAmount} />,
    },
    {
      key: "committed",
      header: "Committed",
      align: "right",
      cell: (line) => <MoneyText value={line.committedAmount} />,
    },
    {
      key: "actual",
      header: "Actual",
      align: "right",
      cell: (line) => <MoneyText value={line.actualAmount} />,
    },
    {
      key: "remaining",
      header: "Remaining",
      align: "right",
      cell: (line) => <SignedMoneyText value={lineRemaining(line)} />,
    },
    {
      key: "used",
      header: "Used",
      align: "right",
      cell: (line) => (
        <span className="flex flex-col items-end gap-1">
          <PercentText value={lineUsedPercent(line)} />
          <Progress value={Math.min(100, lineUsedPercent(line))} className="w-16" />
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (line) => (
        <ToneBadge tone={LINE_TONES[lineStatus(line)]} dot>
          {budgetLineStatusText(line)}
        </ToneBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="projects.budget" />
      <PlannedBanner sectionKey="projects.budget" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Total budget
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totals.budgetAmount} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Committed + actual
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totals.spentPlusCommitted} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {totals.utilisationPercent}% used
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <SignedMoneyText value={totals.remaining} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Lines over budget
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {totals.overBudgetLineCount}
            <div className="text-xs font-normal text-muted-foreground">
              of {totals.lineCount} lines
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rollup by category</CardTitle>
          <CardDescription>
            The figures a cost controller would review before reallocating contingency.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {byCategory.map((entry) => (
            <div key={entry.category} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 text-muted-foreground">{entry.label}</span>
              <Progress value={Math.min(100, entry.usedPercent)} className="flex-1" />
              <span className="w-28 shrink-0 text-right tabular-nums">
                <MoneyText value={entry.budget} compact />
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                {entry.usedPercent.toFixed(0)}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search cost codes…"
        filters={["All projects", "All categories", "Overruns only"]}
        actions={["Reallocate", "New budget line", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="budget lines" />
      <PlannedTable columns={columns} rows={rows} rowKey={(line) => line.id} />
    </div>
  );
}

export default function BudgetLinesPage() {
  return (
    <RoleGuard sectionKey="projects.budget">
      <HydrationGate>
        <BudgetContent />
      </HydrationGate>
    </RoleGuard>
  );
}
