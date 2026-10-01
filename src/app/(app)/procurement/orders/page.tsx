"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
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
  estimatedTaxOnSpend,
  goodsReceiptValue,
  overduePurchaseOrders,
  PO_STATUS_LABELS,
  PO_STATUS_TONES,
  purchaseOrderValue,
} from "@/lib/rules/procurement";
import { daysBetween, formatDate } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/types";

function OrdersContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const supplierById = useMemo(
    () => Object.fromEntries(data.suppliers.map((supplier) => [supplier.id, supplier])),
    [data.suppliers],
  );
  const rows = useMemo(
    () => [...data.preview.purchaseOrders].sort((a, b) => b.issuedDate.localeCompare(a.issuedDate)),
    [data.preview.purchaseOrders],
  );
  const open = useMemo(() => purchaseOrderValue(rows.filter((row) => row.status === "issued")), [rows]);
  const tax = useMemo(() => estimatedTaxOnSpend(open), [open]);
  const late = useMemo(() => overduePurchaseOrders(rows), [rows]);

  const columns: PlannedColumn<PurchaseOrder>[] = [
    {
      key: "ref",
      header: "Purchase order",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="text-xs text-muted-foreground">
            {row.currency} · {row.lineCount} lines
            {row.purchaseRequestId ? ` · from ${row.purchaseRequestId}` : ""}
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
      key: "subtotal",
      header: "Subtotal",
      align: "right",
      cell: (row) => <MoneyText value={row.subtotal} />,
    },
    {
      key: "taxAmount",
      header: "Tax",
      align: "right",
      cell: (row) => <MoneyText value={row.taxAmount} compact />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (row) => <MoneyText value={row.total} />,
    },
    {
      key: "expectedDate",
      header: "Expected",
      cell: (row) => {
        const days = daysBetween(new Date(), row.expectedDate);
        return (
          <>
            <div>{formatDate(row.expectedDate)}</div>
            <div className={`text-xs ${days < 0 && row.status === "issued" ? "text-amber-600" : "text-muted-foreground"}`}>
              {days < 0 ? `${Math.abs(days)} d late` : `in ${days} d`}
            </div>
          </>
        );
      },
    },
    {
      key: "receivedPercent",
      header: "Received",
      align: "right",
      cell: (row) => (
        <span className="flex flex-col items-end gap-1">
          <span>{row.receivedPercent.toFixed(0)}%</span>
          <Progress value={row.receivedPercent} className="w-16" />
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <ToneBadge tone={PO_STATUS_TONES[row.status]} dot>
          {PO_STATUS_LABELS[row.status]}
        </ToneBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="procurement.orders" />
      <PlannedBanner sectionKey="procurement.orders" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Issued value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={open} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Tax accrued
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={tax} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Late deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {late.length}
            <div className="text-xs font-normal text-muted-foreground">
              across {rows.length} orders
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Three-way match coverage</CardTitle>
          <CardDescription>
            Goods receipts and supplier invoices post against these orders; unmatched lines stay
            out of accounts payable until Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Received value on file is{" "}
          <MoneyText value={goodsReceiptValue(data.preview.goodsReceipts)} compact /> —{" "}
          {data.preview.goodsReceipts.length} receipts recorded against{" "}
          {new Set(data.preview.goodsReceipts.map((receipt) => receipt.purchaseOrderId)).size} of
          these orders.
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search purchase orders…"
        filters={["All projects", "All suppliers", "Issued only"]}
        actions={["New purchase order", "Chase supplier", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="purchase orders" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <RoleGuard sectionKey="procurement.orders">
      <HydrationGate>
        <OrdersContent />
      </HydrationGate>
    </RoleGuard>
  );
}
