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
import { MoneyText, PercentText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { divMoney, mulMoney, percentOf, subMoney, sumBy } from "@/lib/money";
import { totalReceivable } from "@/lib/rules/finance";
import { formatMonth } from "@/lib/format";

interface KpiRow {
  period: string;
  contractValue: string;
  costToDate: string;
  margin: string;
  marginPercent: string;
  inflow: string;
  outflow: string;
  net: string;
  receivable: string;
  forecast: boolean;
}

function KpisContent() {
  const data = useErpData();

  const rows = useMemo<KpiRow[]>(() => {
    const periods = Array.from(new Set(data.preview.cashFlow.map((entry) => entry.period))).sort();
    return periods.map((period, index) => {
      const monthEntries = data.preview.cashFlow.filter((entry) => entry.period === period);
      const inflow = sumBy(monthEntries, (entry) => entry.inflow);
      const outflow = sumBy(monthEntries, (entry) => entry.outflow);
      const recognised = sumBy(data.projects, (project) =>
        sumBy(
          project.budgetLines,
          (line) => subMoney(line.budgetAmount, subMoney(line.budgetAmount, line.actualAmount)),
        ),
      );
      const cost = sumBy(
        data.projects,
        (project) => sumBy(project.budgetLines, (line) => line.actualAmount),
      );
      const periodCost = mulMoney(divMoney(cost, String(periods.length)), index + 1);
      const periodValue = mulMoney(divMoney(recognised, String(periods.length)), index + 1);
      return {
        period: formatMonth(`${period}-01`),
        contractValue: periodValue,
        costToDate: periodCost,
        margin: subMoney(periodValue, periodCost),
        marginPercent: percentOf(subMoney(periodValue, periodCost), periodValue, 1),
        inflow,
        outflow,
        net: subMoney(inflow, outflow),
        receivable: mulMoney(
          divMoney(totalReceivable(data.preview.invoices), String(periods.length)),
          index + 1,
        ),
        forecast: index >= periods.length - 2,
      };
    });
  }, [data.preview, data.projects]);

  const totals = useMemo(
    () => ({
      contractValue: sumBy(rows, (row) => row.contractValue),
      cost: sumBy(rows, (row) => row.costToDate),
      net: sumBy(rows, (row) => row.net),
    }),
    [rows],
  );

  const columns: PlannedColumn<KpiRow>[] = [
    {
      key: "period",
      header: "Period",
      cell: (row) => (
        <span className="flex items-center gap-2 font-medium">
          {row.period}
          {row.forecast ? <ToneBadge tone="info">Forecast</ToneBadge> : null}
        </span>
      ),
    },
    {
      key: "contractValue",
      header: "Value recognised",
      align: "right",
      cell: (row) => <MoneyText value={row.contractValue} compact />,
    },
    {
      key: "costToDate",
      header: "Cost to date",
      align: "right",
      cell: (row) => <MoneyText value={row.costToDate} compact />,
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      cell: (row) => (
        <>
          <SignedMoneyText value={row.margin} />
          <div className="text-xs text-muted-foreground">{row.marginPercent}%</div>
        </>
      ),
    },
    {
      key: "inflow",
      header: "Cash in",
      align: "right",
      cell: (row) => <MoneyText value={row.inflow} compact />,
    },
    {
      key: "outflow",
      header: "Cash out",
      align: "right",
      cell: (row) => <MoneyText value={row.outflow} compact />,
    },
    {
      key: "net",
      header: "Net movement",
      align: "right",
      cell: (row) => <SignedMoneyText value={row.net} />,
    },
    {
      key: "receivable",
      header: "Receivable",
      align: "right",
      cell: (row) => <MoneyText value={row.receivable} compact />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="dashboard.kpis" />
      <PlannedBanner sectionKey="dashboard.kpis" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Contract value in view
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totals.contractValue} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Cost in view
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totals.cost} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Net cash movement
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <SignedMoneyText value={totals.net} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How this view will read</CardTitle>
          <CardDescription>
            Phase 2 replaces this static table with charted time series, target vs actual and export
            to PDF. The current columns are computed with the same decimal-safe helpers used by the
            live pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            Portfolio weighted progress today is{" "}
            <PercentText value={data.portfolio.weightedProgressPercent} /> with{" "}
            <MoneyText value={data.portfolio.remaining} compact /> of budget still available.
          </p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search periods…"
        filters={["Last 6 months", "All projects", "Actuals only"]}
        actions={["Add target", "Export PDF"]}
      />
      <PlannedSelectionBar count={rows.length} label="periods" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.period} />
    </div>
  );
}

export default function KpisPage() {
  return (
    <RoleGuard sectionKey="dashboard.kpis">
      <HydrationGate>
        <KpisContent />
      </HydrationGate>
    </RoleGuard>
  );
}
