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
import { useSession } from "@/hooks/use-session";
import { NavLink } from "@/components/ui-bits/nav-link";
import {
  approvalDecision,
  canConvertPrToPo,
  daysUntilNeeded,
  PR_STATUS_LABELS,
  PR_STATUS_TONES,
  prAgeDays,
  prIsOverdue,
  prUrgency,
  PROCUREMENT_SLA_DAYS,
  ROLE_APPROVAL_LIMITS,
} from "@/lib/rules/procurement";
import { sumBy } from "@/lib/money";
import { formatDate, pluralize } from "@/lib/format";
import type { PurchaseRequest } from "@/lib/types";

const URGENCY_TONES: Record<string, Tone> = {
  overdue: "danger",
  urgent: "warn",
  normal: "info",
};

function RequestsContent() {
  const data = useErpData();
  const { role } = useSession();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const supplierById = useMemo(
    () => Object.fromEntries(data.suppliers.map((supplier) => [supplier.id, supplier])),
    [data.suppliers],
  );
  const rows = useMemo(
    () =>
      [...data.preview.purchaseRequests].sort((a, b) =>
        b.requestedDate.localeCompare(a.requestedDate),
      ),
    [data.preview.purchaseRequests],
  );

  const overdue = rows.filter((row) => prIsOverdue(row));
  const openValue = sumBy(
    rows.filter((row) => !["rejected", "cancelled"].includes(row.status)),
    (row) => row.estimatedTotal,
  );
  const limit = ROLE_APPROVAL_LIMITS[role];

  const columns: PlannedColumn<PurchaseRequest>[] = [
    {
      key: "ref",
      header: "Request",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="max-w-64 truncate text-xs text-muted-foreground">{row.purpose}</div>
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
      key: "supplier",
      header: "Preferred supplier",
      cell: (row) => (row.supplierId ? supplierById[row.supplierId]?.name ?? "—" : "Open bid"),
    },
    {
      key: "estimatedTotal",
      header: "Estimated",
      align: "right",
      cell: (row) => <MoneyText value={row.estimatedTotal} />,
    },
    {
      key: "itemCount",
      header: "Items",
      align: "right",
      cell: (row) => row.itemCount,
    },
    {
      key: "neededByDate",
      header: "Needed by",
      cell: (row) => {
        const days = daysUntilNeeded(row);
        return (
          <>
            <div>{formatDate(row.neededByDate)}</div>
            <div className="text-xs text-muted-foreground">
              {days < 0 ? `${Math.abs(days)} d overdue` : `in ${days} d`}
            </div>
          </>
        );
      },
    },
    {
      key: "age",
      header: "Age",
      align: "right",
      cell: (row) => (
        <span className={prAgeDays(row) > PROCUREMENT_SLA_DAYS ? "text-amber-600" : ""}>
          {prAgeDays(row)} d
        </span>
      ),
    },
    {
      key: "urgency",
      header: "Urgency",
      cell: (row) => (
        <ToneBadge tone={URGENCY_TONES[prUrgency(row)]} dot>
          {prUrgency(row)}
        </ToneBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <ToneBadge tone={PR_STATUS_TONES[row.status]} dot>
          {PR_STATUS_LABELS[row.status]}
        </ToneBadge>
      ),
    },
    {
      key: "decision",
      header: "Your authority",
      cell: (row) => {
        const decision = approvalDecision(role, row.estimatedTotal);
        const convert = canConvertPrToPo(row, role);
        return (
          <span className="text-xs text-muted-foreground">
            {decision.allowed ? decision.reason : "Escalate"}
            {row.status === "approved" ? ` · ${convert.allowed ? "can convert" : convert.reason}` : ""}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="procurement.requests" />
      <PlannedBanner sectionKey="procurement.requests" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Open value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={openValue} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Past SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {overdue.length}
            <div className="text-xs font-normal text-muted-foreground">
              {pluralize(overdue.length, "request")} over {PROCUREMENT_SLA_DAYS} days
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Your delegated limit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={limit} compact />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval rules already in place</CardTitle>
          <CardDescription>
            These are pure functions in /lib/rules/procurement.ts, so Phase 2 only needs the
            buttons.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>
            Requester: {userById[rows[0]?.requestedByUserId ?? ""]?.name ?? "—"} · SLA{" "}
            {PROCUREMENT_SLA_DAYS} days · second approval above 50,000.00
          </p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search requests…"
        filters={["All projects", "All statuses", "Awaiting me"]}
        actions={["New request", "Bulk approve", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="purchase requests" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function PurchaseRequestsPage() {
  return (
    <RoleGuard sectionKey="procurement.requests">
      <HydrationGate>
        <RequestsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
