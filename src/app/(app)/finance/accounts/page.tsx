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
import { accountHierarchy, trialBalance } from "@/lib/rules/finance";
import { sumBy } from "@/lib/money";
import type { ChartOfAccount } from "@/lib/types";

const TYPE_LABELS: Record<ChartOfAccount["type"], string> = {
  asset: "Asset",
  liability: "Liability",
  income: "Income",
  cost: "Cost",
  equity: "Equity",
};

const TYPE_TONES: Record<ChartOfAccount["type"], Tone> = {
  asset: "info",
  liability: "warn",
  income: "ok",
  cost: "danger",
  equity: "muted",
};

interface AccountRow {
  account: ChartOfAccount;
  depth: number;
}

function AccountsContent() {
  const data = useErpData();
  const accounts = data.preview.chartOfAccounts;

  const rows = useMemo<AccountRow[]>(() => {
    const hierarchy = accountHierarchy(accounts);
    return hierarchy.flatMap((entry) => [
      { account: entry.top, depth: 0 },
      ...entry.children.map((child) => ({ account: child, depth: 1 })),
    ]);
  }, [accounts]);

  const trial = useMemo(() => trialBalance(accounts), [accounts]);

  const columns: PlannedColumn<AccountRow>[] = [
    {
      key: "code",
      header: "Code",
      cell: (row) => (
        <span style={{ paddingLeft: `${row.depth * 14}px` }} className="font-mono text-xs">
          {row.account.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Account",
      cell: (row) => (
        <span style={{ paddingLeft: `${row.depth * 14}px` }}>{row.account.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <ToneBadge tone={TYPE_TONES[row.account.type]}>{TYPE_LABELS[row.account.type]}</ToneBadge>
      ),
    },
    {
      key: "parentCode",
      header: "Parent",
      align: "right",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.account.parentCode ?? "—"}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (row) =>
        row.account.type === "asset" || row.account.type === "cost" ? (
          <MoneyText value={row.account.balance} />
        ) : (
          <SignedMoneyText value={row.account.balance} />
        ),
    },
    {
      key: "currency",
      header: "Currency",
      cell: (row) => <span className="text-xs">{row.account.currency}</span>,
    },
    {
      key: "active",
      header: "Status",
      cell: (row) => (
        <ToneBadge tone={row.account.active ? "ok" : "muted"} dot>
          {row.account.active ? "Active" : "Dormant"}
        </ToneBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="finance.accounts" />
      <PlannedBanner sectionKey="finance.accounts" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(["asset", "liability", "income", "cost", "equity"] as ChartOfAccount["type"][]).map(
          (type) => (
            <Card key={type} size="sm">
              <CardHeader className="px-4">
                <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
                  {TYPE_LABELS[type]}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-lg font-semibold tabular-nums">
                <MoneyText
                  value={sumBy(
                    accounts.filter((account) => account.type === type),
                    (account) => account.balance,
                  )}
                  compact
                />
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trial balance check</CardTitle>
          <CardDescription>
            trialBalance() in /lib/rules/finance.ts must return zero net movement for the
            demonstration to look right.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 text-sm text-muted-foreground">
          <p>
            Debit total <MoneyText value={trial.debits} /> · credit total{" "}
            <MoneyText value={trial.credits} /> · difference{" "}
            <MoneyText value={trial.difference} />
          </p>
          <p>
            {trial.balanced
              ? "Balanced — the seeded chart of accounts articulates."
              : "Not balanced in the sample seed; Phase 2 posts journals to close the gap."}
          </p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search accounts…"
        filters={["All types", "Active only", "Top level"]}
        actions={["New account", "Import mapping", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="accounts" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.account.id} />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <RoleGuard sectionKey="finance.accounts">
      <HydrationGate>
        <AccountsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
