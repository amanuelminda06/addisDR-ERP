"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-bits/page-header";
import {
  PlannedBanner,
  PlannedSelectionBar,
  PlannedTable,
  PlannedToolbar,
  RoleGuard,
  type PlannedColumn,
} from "@/components/ui-bits/planned-page";
import { ToneBadge } from "@/components/ui-bits/tone-badge";
import { MoneyText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { cashFlowNet, cumulativeCashFlow, totalForecastOutflow } from "@/lib/rules/finance";
import { sumBy } from "@/lib/money";
import { formatMonth } from "@/lib/format";
import type { CashFlowMonth } from "@/lib/types";

function CashFlowContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );

  const rows = useMemo(
    () =>
      [...data.preview.cashFlow].sort(
        (a, b) => a.period.localeCompare(b.period) || a.projectId.localeCompare(b.projectId),
      ),
    [data.preview.cashFlow],
  );

  const cumulative = useMemo(() => cumulativeCashFlow(rows), [rows]);
  const forecastOutflow = useMemo(() => totalForecastOutflow(rows), [rows]);

  const columns: PlannedColumn<CashFlowMonth>[] = [
    {
      key: "period",
      header: "Period",
      cell: (row) => (
        <span className="flex items-center gap-2 font-medium">
          {formatMonth(`${row.period}-01`)}
          {row.forecast ? <ToneBadge tone="info">Forecast</ToneBadge> : null}
        </span>
      ),
    },
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <NavLink href={`/projects/${row.projectId}`} className="hover:underline">
          {projectById[row.projectId]?.code ?? row.projectId}
        </NavLink>
      ),
    },
    {
      key: "inflow",
      header: "Cash in",
      align: "right",
      cell: (row) => <MoneyText value={row.inflow} />,
    },
    {
      key: "outflow",
      header: "Cash out",
      align: "right",
      cell: (row) => <MoneyText value={row.outflow} />,
    },
    {
      key: "net",
      header: "Net",
      align: "right",
      cell: (row) => <SignedMoneyText value={cashFlowNet(row.inflow, row.outflow)} />,
    },
    {
      key: "openingBalance",
      header: "Opening",
      align: "right",
      cell: (row) => <MoneyText value={row.openingBalance} compact />,
    },
    {
      key: "closingBalance",
      header: "Closing",
      align: "right",
      cell: (row) => <MoneyText value={row.closingBalance} />,
    },
  ];

  const periods = Array.from(new Set(rows.map((row) => row.period))).sort();
  const perPeriod = periods.map((period) => {
    const scoped = rows.filter((row) => row.period === period);
    const inflow = sumBy(scoped, (row) => row.inflow);
    const outflow = sumBy(scoped, (row) => row.outflow);
    return { period, inflow, outflow, net: cashFlowNet(inflow, outflow) };
  });
  const maxAbs = Math.max(
    1,
    ...perPeriod.flatMap((entry) => [Math.abs(Number(entry.inflow)), Math.abs(Number(entry.outflow))]),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="finance.cash-flow" />
      <PlannedBanner sectionKey="finance.cash-flow" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Total inflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={sumBy(rows, (row) => row.inflow)} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Total outflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={sumBy(rows, (row) => row.outflow)} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Forecast outflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={forecastOutflow} compact />
            <div className="text-xs font-normal text-muted-foreground">next periods only</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Closing balance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={cumulative[cumulative.length - 1]?.closing ?? "0.00"} compact />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inflow against outflow by period</CardTitle>
          <CardDescription>
            Phase 2 replaces this with a stacked chart plus a 13-week rolling forecast.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {perPeriod.map((entry) => (
            <div key={entry.period} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">
                {formatMonth(`${entry.period}-01`)}
              </span>
              <div className="flex h-5 flex-1 gap-0.5">
                <div
                  className="h-full rounded-sm bg-emerald-500/80"
                  style={{ width: `${(Math.abs(Number(entry.inflow)) / maxAbs) * 50}%` }}
                />
                <div
                  className="ml-auto h-full rounded-sm bg-red-400/70"
                  style={{ width: `${(Math.abs(Number(entry.outflow)) / maxAbs) * 50}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right tabular-nums">
                <MoneyText value={entry.inflow} compact />
              </span>
              <span className="w-28 shrink-0 text-right tabular-nums">
                <MoneyText value={entry.outflow} compact />
              </span>
              <span className="w-28 shrink-0 text-right tabular-nums">
                <SignedMoneyText value={entry.net} />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search cash flow…"
        filters={["All projects", "Actuals only", "Next 6 months"]}
        actions={["Add forecast", "Export", "Email board pack"]}
      />
      <PlannedSelectionBar count={rows.length} label="cash flow periods" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      <p className="text-xs text-muted-foreground">
        Net movement across all rows is{" "}
        <SignedMoneyText
          value={cashFlowNet(
            sumBy(rows, (row) => row.inflow),
            sumBy(rows, (row) => row.outflow),
          )}
        />
        , all handled by cashFlowNet() so no float arithmetic touches money.
      </p>
    </div>
  );
}

export default function CashFlowPage() {
  return (
    <RoleGuard sectionKey="finance.cash-flow">
      <HydrationGate>
        <CashFlowContent />
      </HydrationGate>
    </RoleGuard>
  );
}
