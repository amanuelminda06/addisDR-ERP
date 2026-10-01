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
import { MoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import {
  AGING_LABELS,
  AGING_TONES,
  agingBucket,
  agingReport,
  collectionForecast,
  invoiceDaysOverdue,
  invoiceOutstanding,
  overdueReceivable,
  receivableDays,
  retentionHeld,
  totalReceivable,
  type AgingBucket,
} from "@/lib/rules/finance";
import { percentOf, sumBy } from "@/lib/money";
import { formatDate, daysBetween } from "@/lib/format";
import type { Invoice } from "@/lib/types";

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Draft",
  sent: "Issued",
  partially_paid: "Part paid",
  paid: "Settled",
  overdue: "Overdue",
};

const STATUS_TONES: Record<Invoice["status"], "ok" | "warn" | "danger" | "muted" | "info"> = {
  draft: "muted",
  sent: "info",
  partially_paid: "warn",
  paid: "ok",
  overdue: "danger",
};

function ReceivablesContent() {
  const data = useErpData();
  const clientById = useMemo(
    () => Object.fromEntries(data.clients.map((client) => [client.id, client])),
    [data.clients],
  );
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const rows = useMemo(
    () => [...data.preview.invoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [data.preview.invoices],
  );
  const report = useMemo(() => agingReport(rows), [rows]);
  const buckets: AgingBucket[] = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"];

  const columns: PlannedColumn<Invoice>[] = [
    {
      key: "ref",
      header: "Invoice",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="text-xs text-muted-foreground">
            {row.currency} · retention {row.retentionAmount}
          </div>
        </>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (row) => clientById[row.clientId]?.companyName ?? row.clientId,
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
      key: "total",
      header: "Total",
      align: "right",
      cell: (row) => <MoneyText value={row.total} />,
    },
    {
      key: "amountPaid",
      header: "Paid",
      align: "right",
      cell: (row) => <MoneyText value={row.amountPaid} compact />,
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      cell: (row) => <MoneyText value={invoiceOutstanding(row)} />,
    },
    {
      key: "dueDate",
      header: "Due",
      cell: (row) => {
        const overdue = invoiceDaysOverdue(row);
        return (
          <>
            <div>{formatDate(row.dueDate)}</div>
            <div className={`text-xs ${overdue > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {overdue > 0 ? `${overdue} d overdue` : `in ${Math.abs(overdue)} d`}
            </div>
          </>
        );
      },
    },
    {
      key: "aging",
      header: "Ageing",
      cell: (row) => {
        const bucket = agingBucket(row);
        return (
          <ToneBadge tone={AGING_TONES[bucket]} dot>
            {AGING_LABELS[bucket]}
          </ToneBadge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <ToneBadge tone={STATUS_TONES[row.status]} dot>
          {STATUS_LABELS[row.status]}
        </ToneBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="finance.receivables" />
      <PlannedBanner sectionKey="finance.receivables" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Total receivable
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totalReceivable(rows)} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={overdueReceivable(rows)} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {percentOf(overdueReceivable(rows), totalReceivable(rows))} of book
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Retention held
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={retentionHeld(rows)} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Collection forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={collectionForecast(rows)} compact />
            <div className="text-xs font-normal text-muted-foreground">
              DSO {receivableDays(rows)} days
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ageing profile</CardTitle>
          <CardDescription>
            agingReport() buckets by due date so a credit controller can see the same shape Phase 2
            will chart.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {buckets.map((bucket) => {
            const entry = report.find((item) => item.bucket === bucket);
            const amount = entry?.value ?? "0.00";
            const share = Number(percentOf(amount, totalReceivable(rows)));
            return (
              <div key={bucket} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted-foreground">{AGING_LABELS[bucket]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${Math.min(100, share)}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right tabular-nums">
                  <MoneyText value={amount} compact />
                </span>
                <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                  {entry?.count ?? 0} inv
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search invoices…"
        filters={["All clients", "All statuses", "Overdue only"]}
        actions={["New invoice", "Send reminder", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="invoices" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      <p className="text-xs text-muted-foreground">
        {rows.filter((row) => row.status === "draft").length} drafts still to issue ·{" "}
        <MoneyText value={sumBy(rows.filter((row) => row.status === "draft"), (row) => row.total)} compact />{" "}
        unbilled value · last invoice issued{" "}
        {rows.length > 0 ? formatDate(rows[rows.length - 1].issueDate) : "—"} (
        {rows.length > 0 ? daysBetween(rows[rows.length - 1].issueDate, new Date()) : 0} d ago).
      </p>
    </div>
  );
}

export default function ReceivablesPage() {
  return (
    <RoleGuard sectionKey="finance.receivables">
      <HydrationGate>
        <ReceivablesContent />
      </HydrationGate>
    </RoleGuard>
  );
}
