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
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";
import { MoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { CATEGORY_LABELS } from "@/lib/rules/budget";
import { expenseByStatus, totalPayable } from "@/lib/rules/finance";
import { percentOf, sumBy } from "@/lib/money";
import { formatDate, daysBetween } from "@/lib/format";
import type { ExpenseClaim } from "@/lib/types";

const STATUS_LABELS: Record<ExpenseClaim["status"], string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Refused",
  reimbursed: "Reimbursed",
};

const STATUS_TONES: Record<ExpenseClaim["status"], Tone> = {
  submitted: "info",
  approved: "ok",
  rejected: "danger",
  reimbursed: "muted",
};

function PayablesContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const employeeById = useMemo(
    () => Object.fromEntries(data.employees.map((employee) => [employee.id, employee])),
    [data.employees],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = useMemo(
    () =>
      [...data.preview.expenseClaims].sort((a, b) => b.claimDate.localeCompare(a.claimDate)),
    [data.preview.expenseClaims],
  );

  const byStatus = useMemo(() => expenseByStatus(rows), [rows]);
  const approvedTotal = byStatus.approved?.total ?? "0.00";
  const pendingTotal = sumBy(
    rows.filter((row) => row.status === "submitted"),
    (row) => row.amount,
  );

  const columns: PlannedColumn<ExpenseClaim>[] = [
    {
      key: "ref",
      header: "Claim",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="max-w-64 truncate text-xs text-muted-foreground">{row.description}</div>
        </>
      ),
    },
    {
      key: "employee",
      header: "Claimant",
      cell: (row) => (
        <>
          <div className="font-medium">{employeeById[row.employeeId]?.name ?? row.employeeId}</div>
          <div className="text-xs text-muted-foreground">
            {employeeById[row.employeeId]?.department.replace(/_/g, " ")}
          </div>
        </>
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
      key: "category",
      header: "Cost code",
      cell: (row) => CATEGORY_LABELS[row.category],
    },
    {
      key: "claimDate",
      header: "Claimed",
      cell: (row) => {
        const days = daysBetween(row.claimDate, new Date());
        return (
          <>
            <div>{formatDate(row.claimDate)}</div>
            <div className="text-xs text-muted-foreground">{days} d ago</div>
          </>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => <MoneyText value={row.amount} />,
    },
    {
      key: "receiptAttached",
      header: "Receipt",
      cell: (row) =>
        row.receiptAttached ? (
          <ToneBadge tone="ok" dot>
            Attached
          </ToneBadge>
        ) : (
          <ToneBadge tone="danger" dot>
            Missing
          </ToneBadge>
        ),
    },
    {
      key: "approver",
      header: "Approver",
      cell: (row) =>
        row.approverUserId ? (
          userById[row.approverUserId]?.name ?? "—"
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
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
      <PageHeader sectionKey="finance.payables" />
      <PlannedBanner sectionKey="finance.payables" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Payable pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totalPayable(rows)} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Approved to pay
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={approvedTotal} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {byStatus.approved?.count ?? 0} claims ready
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Awaiting approval
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={pendingTotal} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {percentOf(pendingTotal, totalPayable(rows))} of pipeline
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controls before payment</CardTitle>
          <CardDescription>
            Claims without a receipt are held back, and any claim above 500.00 needs a second
            approver in Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {rows.filter((row) => !row.receiptAttached).length} claims are missing a receipt ·{" "}
          {rows.filter((row) => row.status === "rejected").length} were refused.
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search claims…"
        filters={["All projects", "All statuses", "Missing receipt"]}
        actions={["New claim", "Approve selected", "Run payment"]}
      />
      <PlannedSelectionBar count={rows.length} label="expense claims" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function PayablesPage() {
  return (
    <RoleGuard sectionKey="finance.payables">
      <HydrationGate>
        <PayablesContent />
      </HydrationGate>
    </RoleGuard>
  );
}
