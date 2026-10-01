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
import { prAgeDays, prIsOverdue, prUrgency } from "@/lib/rules/procurement";
import { roleLabel } from "@/lib/rules/permissions";
import { daysBetween, formatDate } from "@/lib/format";

interface QueueRow {
  id: string;
  ref: string;
  item: string;
  source: string;
  amount: string | null;
  age: string;
  priority: "critical" | "warning" | "info";
  reason: string;
}

const PRIORITY_TONE: Record<QueueRow["priority"], Tone> = {
  critical: "danger",
  warning: "warn",
  info: "info",
};

function MyWorkContent() {
  const data = useErpData();
  const { role, user } = useSession();

  const rows = useMemo<QueueRow[]>(() => {
    const approvalQueue = data.preview.purchaseRequests
      .filter((request) => ["submitted", "under_review"].includes(request.status))
      .map((request) => {
        const urgency = prUrgency(request);
        return {
          id: request.id,
          ref: request.ref,
          item: request.purpose,
          source: "Purchase request",
          amount: request.estimatedTotal,
          age: `${prAgeDays(request)} d`,
          priority: (urgency === "overdue" || prIsOverdue(request)
            ? "critical"
            : urgency === "urgent"
              ? "warning"
              : "info") as QueueRow["priority"],
          reason:
            urgency === "overdue"
              ? "Needed on site before the requested date"
              : request.status === "under_review"
                ? "Awaiting commercial review"
                : "Awaiting approval",
        };
      });

    const leaveQueue = data.preview.leaveRequests
      .filter((request) => request.status === "pending")
      .map((request) => ({
        id: request.id,
        ref: request.ref,
        item: `${request.leaveType} leave · ${request.days} day(s)`,
        source: "Leave request",
        amount: null,
        age: `${Math.max(0, daysBetween(request.startDate, new Date()))} d`,
        priority: "info" as const,
        reason: "Awaiting HR approval",
      }));

    const invoiceQueue = data.preview.invoices
      .filter((invoice) => invoice.status === "draft")
      .map((invoice) => ({
        id: invoice.id,
        ref: invoice.ref,
        item: "Progress claim awaiting issue",
        source: "Invoice",
        amount: invoice.total,
        age: `${Math.max(0, daysBetween(invoice.issueDate, new Date()))} d`,
        priority: "warning" as const,
        reason: "Draft not yet issued to client",
      }));

    return [...approvalQueue, ...leaveQueue, ...invoiceQueue];
  }, [data.preview]);

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (role === "approver" || role === "admin") return true;
        if (role === "hr_manager") return row.source !== "Purchase request" || row.amount === null;
        return row.source === "Leave request";
      }),
    [rows, role],
  );

  const columns: PlannedColumn<QueueRow>[] = [
    { key: "ref", header: "Reference", cell: (row) => row.ref },
    { key: "item", header: "Item", cell: (row) => <span className="font-medium">{row.item}</span> },
    { key: "source", header: "Source module", cell: (row) => row.source },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (row.amount ? <MoneyText value={row.amount} compact /> : "—"),
    },
    { key: "age", header: "Age", align: "right", cell: (row) => row.age },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => (
        <ToneBadge tone={PRIORITY_TONE[row.priority]} dot>
          {row.priority}
        </ToneBadge>
      ),
    },
    { key: "reason", header: "Why it is here", cell: (row) => row.reason },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="dashboard.my-work" />
      <PlannedBanner sectionKey="dashboard.my-work" />

      <Card>
        <CardHeader>
          <CardTitle>Scoped to {roleLabel(role)}</CardTitle>
          <CardDescription>
            The same underlying sample data filtered for {user.name}. Phase 2 adds SLA countdowns,
            bulk actions and role-owned queues.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {visible.length} items would appear in your queue. Switch roles in the top bar to compare
          what each role owns.
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search my work…"
        filters={["All modules", "Any priority", "Due this week"]}
        actions={["Bulk approve", "Assign to me"]}
      />
      <PlannedSelectionBar count={visible.length} label="queue items" />
      <PlannedTable columns={columns} rows={visible} rowKey={(row) => row.id} />
      <p className="text-xs text-muted-foreground">
        Sample data generated on {formatDate(data.seededAt, "dd MMM yyyy")} · request SLA is 3 days
        · {data.preview.purchaseRequests.filter((request) => prIsOverdue(request)).length} purchase
        requests are past SLA.
      </p>
    </div>
  );
}

export default function MyWorkPage() {
  return (
    <RoleGuard sectionKey="dashboard.my-work">
      <HydrationGate>
        <MyWorkContent />
      </HydrationGate>
    </RoleGuard>
  );
}
