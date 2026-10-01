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
import { MoneyText, PercentText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { pipelineValueByStage } from "@/lib/rules/procurement";
import { mulMoney, sumBy } from "@/lib/money";
import { formatDate, daysBetween, titleCase } from "@/lib/format";
import type { Lead } from "@/lib/types";

const STAGE_ORDER: Lead["stage"][] = [
  "enquiry",
  "qualification",
  "estimating",
  "tendering",
  "won",
  "lost",
];

const STAGE_TONES: Record<Lead["stage"], Tone> = {
  enquiry: "muted",
  qualification: "info",
  estimating: "info",
  tendering: "warn",
  won: "ok",
  lost: "danger",
};

const SOURCE_LABELS: Record<Lead["source"], string> = {
  referral: "Referral",
  tender: "Tender",
  website: "Website",
  repeat_client: "Repeat client",
  cold_call: "Cold call",
};

function PipelineContent() {
  const data = useErpData();
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = useMemo(
    () => [...data.preview.leads].sort((a, b) => b.estimatedValue.localeCompare(a.estimatedValue)),
    [data.preview.leads],
  );

  const stageTotals = useMemo(() => pipelineValueByStage(rows), [rows]);

  const weighted = useMemo(
    () =>
      sumBy(
        rows.filter((row) => !["won", "lost"].includes(row.stage)),
        (row) => row.estimatedValue,
      ),
    [rows],
  );

  const weightedValue = useMemo(
    () =>
      sumBy(
        rows.filter((row) => !["won", "lost"].includes(row.stage)),
        (row) => {
          const factor = (row.probabilityPercent / 100).toFixed(4);
          return mulMoney(row.estimatedValue, factor);
        },
      ),
    [rows],
  );

  const columns: PlannedColumn<Lead>[] = [
    {
      key: "companyName",
      header: "Opportunity",
      cell: (row) => (
        <>
          <div className="font-medium">{row.companyName}</div>
          <div className="text-xs text-muted-foreground">
            {row.ref} · {row.city} · {SOURCE_LABELS[row.source]}
          </div>
        </>
      ),
    },
    { key: "contactName", header: "Contact", cell: (row) => row.contactName },
    {
      key: "stage",
      header: "Stage",
      cell: (row) => (
        <ToneBadge tone={STAGE_TONES[row.stage]} dot>
          {titleCase(row.stage)}
        </ToneBadge>
      ),
    },
    {
      key: "estimatedValue",
      header: "Estimated value",
      align: "right",
      cell: (row) => <MoneyText value={row.estimatedValue} />,
    },
    {
      key: "probabilityPercent",
      header: "Probability",
      align: "right",
      cell: (row) => (
        <>
          <PercentText value={row.probabilityPercent} />
          <div className="text-xs text-muted-foreground">
            <MoneyText
              value={mulMoney(row.estimatedValue, (row.probabilityPercent / 100).toFixed(4))}
              compact
            />
          </div>
        </>
      ),
    },
    {
      key: "expectedStart",
      header: "Expected start",
      cell: (row) => {
        const days = daysBetween(new Date(), row.expectedStart);
        return (
          <>
            <div>{formatDate(row.expectedStart)}</div>
            <div className="text-xs text-muted-foreground">in {days} d</div>
          </>
        );
      },
    },
    {
      key: "owner",
      header: "Owner",
      cell: (row) => userById[row.ownerUserId]?.name ?? "—",
    },
    {
      key: "nextAction",
      header: "Next action",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.nextAction}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="crm.pipeline" />
      <PlannedBanner sectionKey="crm.pipeline" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Open pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={weighted} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Weighted value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={weightedValue} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {rows.length}
            <div className="text-xs font-normal text-muted-foreground">
              {rows.filter((row) => row.stage === "won").length} won ·{" "}
              {rows.filter((row) => row.stage === "lost").length} lost
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline by stage</CardTitle>
          <CardDescription>
            Values come from pipelineValueByStage(), which sums with decimal-safe money helpers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {STAGE_ORDER.map((stage) => {
            const amount = stageTotals[stage] ?? "0.00";
            const share = Number(
              mulMoney(amount, (100 / Math.max(1, Number(weighted))).toFixed(4)),
            );
            const count = rows.filter((row) => row.stage === stage).length;
            return (
              <div key={stage} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-muted-foreground">{titleCase(stage)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right tabular-nums">
                  <MoneyText value={amount} compact />
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search opportunities…"
        filters={["All stages", "All sources", "Closing this quarter"]}
        actions={["New opportunity", "Advance stage", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="opportunities" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function PipelinePage() {
  return (
    <RoleGuard sectionKey="crm.pipeline">
      <HydrationGate>
        <PipelineContent />
      </HydrationGate>
    </RoleGuard>
  );
}
