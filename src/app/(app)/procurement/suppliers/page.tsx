"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Plus, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui-bits/page-header";
import { RoleGuard } from "@/components/ui-bits/planned-page";
import { StatCard } from "@/components/ui-bits/stat-card";
import { ToneBadge } from "@/components/ui-bits/tone-badge";
import { MoneyText, PercentText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { useErpStore } from "@/store/erp-store";
import { sumBy } from "@/lib/money";
import {
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_TONES,
  SUPPLIER_TIER_LABELS,
  supplierRiskNotes,
  supplierScore,
  supplierSpendShare,
  supplierTier,
} from "@/lib/rules/procurement";
import { formatDate } from "@/lib/format";

const ALL = "all";

function SuppliersContent() {
  const data = useErpData();
  const { can } = useSession();
  const recordSupplierView = useErpStore((state) => state.recordSupplierView);
  const [status, setStatus] = useState<string>(ALL);

  const suppliers = useMemo(
    () =>
      data.suppliers.filter((supplier) => status === ALL || supplier.status === status),
    [data.suppliers, status],
  );

  const totalSpend = sumBy(data.suppliers, (supplier) => supplier.totalSpend);
  const atRisk = data.suppliers.filter((supplier) => supplierRiskNotes(supplier).length > 0);
  const averageOnTime =
    data.suppliers.reduce((total, supplier) => total + supplier.onTimeDeliveryPercent, 0) /
    Math.max(1, data.suppliers.length);
  const openOrders = data.suppliers.reduce(
    (total, supplier) => total + supplier.openPurchaseOrderCount,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="procurement.suppliers"
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Vendor onboarding is Phase 2">
              Vendor onboarding
            </Button>
            <Button size="sm" disabled={!can("supplier.manage")} title="Supplier creation is Phase 2">
              <Plus className="size-3.5" aria-hidden />
              Add supplier
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Panel members"
          value={data.suppliers.length}
          hint={`${data.suppliers.filter((supplier) => supplier.status === "approved").length} approved · ${data.suppliers.filter((supplier) => supplier.status === "under_review").length} under review`}
          icon={Building2}
        />
        <StatCard
          label="Lifetime spend"
          value={<MoneyText value={totalSpend} compact />}
          hint="Across all awarded packages"
        />
        <StatCard
          label="Avg on-time delivery"
          value={<PercentText value={averageOnTime} />}
          hint="Service level target 85%"
          tone={averageOnTime >= 85 ? "ok" : "warn"}
        />
        <StatCard
          label="Open purchase orders"
          value={openOrders}
          hint={`${atRisk.length} suppliers flagged for review`}
          icon={Truck}
          tone={atRisk.length > 0 ? "warn" : "ok"}
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(value) => value && setStatus(value as string)}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by panel status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All panel statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Score = ⅓(on-time + (100 − reject %) + rating × 20)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier scorecard</CardTitle>
          <CardDescription>
            Live panel data. Tier, risk notes and spend share come from the procurement rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Supplier</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">On time</TableHead>
                <TableHead className="text-right">Reject</TableHead>
                <TableHead className="text-right">Terms</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => {
                const risks = supplierRiskNotes(supplier);
                return (
                  <TableRow
                    key={supplier.id}
                    onClick={() => recordSupplierView(supplier.id, `${supplier.code} · ${supplier.name}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2 font-medium">
                        {supplier.name}
                        <ToneBadge
                          tone={supplierTier(supplier) === "watch" ? "danger" : "muted"}
                          title={`Weighted score ${supplierScore(supplier).toFixed(1)}`}
                        >
                          <Star className="size-2.5" aria-hidden />
                          {SUPPLIER_TIER_LABELS[supplierTier(supplier)]}
                        </ToneBadge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {supplier.code} · {supplier.city} · insurance{" "}
                        {formatDate(supplier.insuranceExpiry)}
                      </div>
                      {risks.length > 0 ? (
                        <ul className="mt-1.5 flex flex-col gap-0.5">
                          {risks.map((risk) => (
                            <li
                              key={risk}
                              className="flex items-start gap-1.5 text-[0.6875rem] text-amber-700 dark:text-amber-400"
                            >
                              <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories.map((category) => (
                          <span
                            key={category}
                            className="rounded-md border px-1.5 py-0.5 text-[0.625rem] text-muted-foreground"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {supplierScore(supplier).toFixed(1)}
                      <div className="mt-1 w-16">
                        <Progress value={(supplierScore(supplier) / 100) * 100} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {supplier.onTimeDeliveryPercent}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {supplier.qualityRejectPercent}%
                    </TableCell>
                    <TableCell className="text-right text-sm">Net {supplier.paymentTermsDays}</TableCell>
                    <TableCell className="text-right">
                      <MoneyText value={supplier.totalSpend} />
                      <div className="text-xs text-muted-foreground">
                        {supplierSpendShare(supplier, data.suppliers)}% of spend
                      </div>
                    </TableCell>
                    <TableCell>
                      <ToneBadge tone={SUPPLIER_STATUS_TONES[supplier.status]}>
                        {SUPPLIER_STATUS_LABELS[supplier.status]}
                      </ToneBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <RoleGuard sectionKey="procurement.suppliers">
      <HydrationGate>
        <SuppliersContent />
      </HydrationGate>
    </RoleGuard>
  );
}
