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
import { goodsReceiptValue, pendingInspectionCount } from "@/lib/rules/procurement";
import { formatDate, daysBetween } from "@/lib/format";
import type { GoodsReceipt } from "@/lib/types";

const INSPECTION_LABELS: Record<GoodsReceipt["inspectionResult"], string> = {
  passed: "Passed",
  passed_with_notes: "Passed with notes",
  failed: "Failed",
};

const INSPECTION_TONES: Record<GoodsReceipt["inspectionResult"], Tone> = {
  passed: "ok",
  passed_with_notes: "warn",
  failed: "danger",
};

const STATUS_LABELS: Record<GoodsReceipt["status"], string> = {
  pending_inspection: "Pending inspection",
  inspected: "Inspected",
  posted: "Posted to stock",
};

const STATUS_TONES: Record<GoodsReceipt["status"], Tone> = {
  pending_inspection: "warn",
  inspected: "info",
  posted: "ok",
};

function ReceiptsContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const supplierById = useMemo(
    () => Object.fromEntries(data.suppliers.map((supplier) => [supplier.id, supplier])),
    [data.suppliers],
  );
  const orderById = useMemo(
    () => Object.fromEntries(data.preview.purchaseOrders.map((order) => [order.id, order])),
    [data.preview.purchaseOrders],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = useMemo(
    () =>
      [...data.preview.goodsReceipts].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate)),
    [data.preview.goodsReceipts],
  );

  const columns: PlannedColumn<GoodsReceipt>[] = [
    {
      key: "ref",
      header: "Receipt",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="text-xs text-muted-foreground">
            against {orderById[row.purchaseOrderId]?.ref ?? row.purchaseOrderId}
          </div>
        </>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      cell: (row) => (
        <NavLink href="/procurement/suppliers" className="font-medium hover:underline">
          {supplierById[row.supplierId]?.name ?? row.supplierId}
        </NavLink>
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
      key: "receivedDate",
      header: "Received",
      cell: (row) => {
        const days = daysBetween(row.receivedDate, new Date());
        return (
          <>
            <div>{formatDate(row.receivedDate)}</div>
            <div className="text-xs text-muted-foreground">{days} d ago</div>
          </>
        );
      },
    },
    {
      key: "lineCount",
      header: "Lines",
      align: "right",
      cell: (row) => (
        <>
          {row.lineCount}
          {row.rejectedLines > 0 ? (
            <div className="text-xs text-amber-600">{row.rejectedLines} rejected</div>
          ) : null}
        </>
      ),
    },
    {
      key: "acceptedValue",
      header: "Accepted value",
      align: "right",
      cell: (row) => <MoneyText value={row.acceptedValue} />,
    },
    {
      key: "inspection",
      header: "Inspection",
      cell: (row) => (
        <ToneBadge tone={INSPECTION_TONES[row.inspectionResult]} dot>
          {INSPECTION_LABELS[row.inspectionResult]}
        </ToneBadge>
      ),
    },
    {
      key: "receivedBy",
      header: "Received by",
      cell: (row) => userById[row.receivedByUserId]?.name ?? "—",
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
      <PageHeader sectionKey="procurement.receipts" />
      <PlannedBanner sectionKey="procurement.receipts" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Accepted value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={goodsReceiptValue(rows)} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Awaiting inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {pendingInspectionCount(rows)}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Posted
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {rows.filter((row) => row.status === "posted").length}
            <div className="text-xs font-normal text-muted-foreground">of {rows.length} receipts</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why three-way matching matters</CardTitle>
          <CardDescription>
            A receipt only creates a payable when quantity and price agree with the purchase order
            and the supplier invoice. Phase 2 shows the variance inline.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {rows.reduce((total, row) => total + row.rejectedLines, 0)} rejected lines recorded
          across this period.
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search receipts…"
        filters={["All projects", "All suppliers", "Pending inspection"]}
        actions={["New receipt", "Post to stock", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="goods receipts" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function GoodsReceiptsPage() {
  return (
    <RoleGuard sectionKey="procurement.receipts">
      <HydrationGate>
        <ReceiptsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
