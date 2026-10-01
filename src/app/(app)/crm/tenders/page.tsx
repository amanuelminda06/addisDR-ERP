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
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";
import { MoneyText, PercentText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { marginSummary } from "@/lib/rules/finance";
import { sumBy } from "@/lib/money";
import { daysBetween, formatDate } from "@/lib/format";
import type { Tender } from "@/lib/types";

const STATUS_LABELS: Record<Tender["status"], string> = {
  preparing: "Preparing",
  submitted: "Submitted",
  won: "Won",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

const STATUS_TONES: Record<Tender["status"], Tone> = {
  preparing: "info",
  submitted: "warn",
  won: "ok",
  lost: "danger",
  withdrawn: "muted",
};

function TendersContent() {
  const data = useErpData();
  const clientById = useMemo(
    () => Object.fromEntries(data.clients.map((client) => [client.id, client])),
    [data.clients],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = useMemo(
    () =>
      [...data.preview.tenders].sort((a, b) => a.tenderCloseDate.localeCompare(b.tenderCloseDate)),
    [data.preview.tenders],
  );

  const decided = useMemo(
    () => rows.filter((row) => ["won", "lost"].includes(row.status)),
    [rows],
  );
  const won = useMemo(() => rows.filter((row) => row.status === "won"), [rows]);
  const weakestMargin = useMemo(() => {
    let weakest: { ref: string; margin: string; marginPercent: string } | null = null;
    for (const row of rows) {
      const summary = marginSummary(row.bidValue, row.estimatedCost);
      if (!weakest || summary.margin < weakest.margin) {
        weakest = { ref: row.ref, margin: summary.margin, marginPercent: summary.marginPercent };
      }
    }
    return weakest;
  }, [rows]);

  const columns: PlannedColumn<Tender>[] = [
    {
      key: "ref",
      header: "Tender",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="max-w-64 truncate text-xs text-muted-foreground">{row.projectName}</div>
        </>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (row) => (
        <NavLink href="/crm/clients" className="hover:underline">
          {clientById[row.clientId]?.companyName ?? row.clientId}
        </NavLink>
      ),
    },
    {
      key: "bidValue",
      header: "Bid value",
      align: "right",
      cell: (row) => <MoneyText value={row.bidValue} />,
    },
    {
      key: "estimatedCost",
      header: "Estimated cost",
      align: "right",
      cell: (row) => <MoneyText value={row.estimatedCost} compact />,
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      cell: (row) => {
        const summary = marginSummary(row.bidValue, row.estimatedCost);
        return (
          <>
            <SignedMoneyText value={summary.margin} />
            <div
              className={`text-xs ${summary.isPositive ? "text-muted-foreground" : "text-red-600"}`}
            >
              {summary.marginPercent}%
            </div>
          </>
        );
      },
    },
    {
      key: "documents",
      header: "Documents",
      align: "right",
      cell: (row) => {
        const complete = row.documentsRequired === 0 ? 0 : row.documentsComplete / row.documentsRequired;
        return (
          <span className="flex flex-col items-end gap-1">
            <span>
              {row.documentsComplete}/{row.documentsRequired}
            </span>
            <Progress value={complete * 100} className="w-16" />
          </span>
        );
      },
    },
    {
      key: "tenderCloseDate",
      header: "Closes",
      cell: (row) => {
        const days = daysBetween(new Date(), row.tenderCloseDate);
        return (
          <>
            <div>{formatDate(row.tenderCloseDate)}</div>
            <div className={`text-xs ${days < 5 && days >= 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {days < 0 ? `${Math.abs(days)} d ago` : `in ${days} d`}
            </div>
          </>
        );
      },
    },
    {
      key: "submissionDate",
      header: "Submitted",
      cell: (row) =>
        row.submissionDate ? (
          formatDate(row.submissionDate)
        ) : (
          <span className="text-muted-foreground">Not submitted</span>
        ),
    },
    {
      key: "owner",
      header: "Bid lead",
      cell: (row) => userById[row.ownerUserId]?.name ?? "—",
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
      <PageHeader sectionKey="crm.tenders" />
      <PlannedBanner sectionKey="crm.tenders" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Open bids
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText
              value={sumBy(
                rows.filter((row) => ["preparing", "submitted"].includes(row.status)),
                (row) => row.bidValue,
              )}
              compact
            />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Win rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <PercentText
              value={decided.length === 0 ? 0 : (won.length / decided.length) * 100}
            />
            <div className="text-xs font-normal text-muted-foreground">
              {won.length} of {decided.length} decided
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Pipeline margin
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {marginSummary(
              sumBy(rows, (row) => row.bidValue),
              sumBy(rows, (row) => row.estimatedCost),
            ).marginPercent}
            %
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Incomplete packs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {rows.filter((row) => row.documentsComplete < row.documentsRequired).length}
            <div className="text-xs font-normal text-muted-foreground">
              of {rows.length} tenders
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Margin discipline</CardTitle>
          <CardDescription>
            marginSummary() runs on every bid, so a tender priced below the estimated cost shows a
            negative margin before submission. Losing bids still count for win-rate reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>
            Weakest bid margin: {weakestMargin ? `${weakestMargin.marginPercent}%` : "—"} (
            {weakestMargin ? <MoneyText value={weakestMargin.margin} compact /> : "—"}) on{" "}
            {weakestMargin?.ref ?? "—"}.
          </p>
          <p>
            {rows.some((row) => !marginSummary(row.bidValue, row.estimatedCost).isPositive)
              ? "At least one bid is priced below its estimated cost and needs review before submission."
              : "No negative bid margins in this sample."}
          </p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search tenders…"
        filters={["All clients", "All statuses", "Closing soon"]}
        actions={["New tender", "Upload document", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="tenders" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function TendersPage() {
  return (
    <RoleGuard sectionKey="crm.tenders">
      <HydrationGate>
        <TendersContent />
      </HydrationGate>
    </RoleGuard>
  );
}
