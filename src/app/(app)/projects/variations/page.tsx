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
import { MoneyText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { sumBy } from "@/lib/money";
import { formatDate } from "@/lib/format";
import type { VariationOrder } from "@/lib/types";

const TYPE_LABELS: Record<VariationOrder["variationType"], string> = {
  addition: "Addition",
  omission: "Omission",
  price_adjustment: "Price adjustment",
};

const STATUS_LABELS: Record<VariationOrder["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_TONES: Record<VariationOrder["status"], Tone> = {
  draft: "muted",
  submitted: "info",
  approved: "ok",
  rejected: "danger",
};

function VariationsContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = data.preview.variations;

  const approved = useMemo(
    () => rows.filter((row) => row.status === "approved"),
    [rows],
  );
  const netImpact = useMemo(() => sumBy(approved, (row) => row.valueImpact), [approved]);
  const pendingDays = useMemo(
    () => sumBy(rows.filter((row) => row.status === "submitted"), (row) => row.timeImpactDays),
    [rows],
  );

  const columns: PlannedColumn<VariationOrder>[] = [
    {
      key: "title",
      header: "Variation",
      cell: (row) => (
        <>
          <div className="font-medium">{row.title}</div>
          <div className="text-xs text-muted-foreground">
            {row.ref} ·{" "}
            <NavLink href={`/projects/${row.projectId}`} className="hover:underline">
              {projectById[row.projectId]?.code ?? row.projectId}
            </NavLink>
          </div>
        </>
      ),
    },
    { key: "type", header: "Type", cell: (row) => TYPE_LABELS[row.variationType] },
    {
      key: "valueImpact",
      header: "Value impact",
      align: "right",
      cell: (row) => <SignedMoneyText value={row.valueImpact} />,
    },
    {
      key: "timeImpactDays",
      header: "Time impact",
      align: "right",
      cell: (row) => `${row.timeImpactDays} d`,
    },
    {
      key: "requestedBy",
      header: "Requested by",
      cell: (row) => userById[row.requestedByUserId]?.name ?? "—",
    },
    {
      key: "submittedDate",
      header: "Submitted",
      cell: (row) => formatDate(row.submittedDate),
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
      <PageHeader sectionKey="projects.variations" />
      <PlannedBanner sectionKey="projects.variations" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Approved value impact
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <SignedMoneyText value={netImpact} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Awaiting decision
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {rows.filter((row) => row.status === "submitted").length}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Contract time claimed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {pendingDays} d
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval path</CardTitle>
          <CardDescription>
            Phase 2 wires this register to the same approval limits as procurement, so a variation
            above{" "}
            <MoneyText value="50000" compact /> needs a second approver.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Site engineer raises → commercial review → approver decision → client instruction → cost
          codes updated on approval.
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search variations…"
        filters={["All projects", "All types", "Open only"]}
        actions={["New variation", "Attach documents", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="variations" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function VariationsPage() {
  return (
    <RoleGuard sectionKey="projects.variations">
      <HydrationGate>
        <VariationsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
