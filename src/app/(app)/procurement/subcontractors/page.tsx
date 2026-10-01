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
import { MoneyText, PercentText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { CATEGORY_LABELS, lineRemaining, lineUsedPercent } from "@/lib/rules/budget";
import { percentOf, sumBy } from "@/lib/money";
import { formatNumber } from "@/lib/money";

interface SubcontractorRow {
  id: string;
  name: string;
  trade: string;
  projectId: string;
  projectCode: string;
  contractValue: string;
  certifiedToDate: string;
  remaining: string;
  retention: string;
  usedPercent: number;
  tier: Tone;
  tierLabel: string;
}

const TIER_BY_USED: { max: number; tone: Tone; label: string }[] = [
  { max: 70, tone: "ok", label: "Comfortable" },
  { max: 92, tone: "info", label: "On plan" },
  { max: 105, tone: "warn", label: "Tight" },
  { max: Infinity, tone: "danger", label: "Overcommitted" },
];

function tierFor(usedPercent: number) {
  return TIER_BY_USED.find((entry) => usedPercent <= entry.max) ?? TIER_BY_USED[TIER_BY_USED.length - 1];
}

function SubcontractorsContent() {
  const data = useErpData();

  const rows = useMemo<SubcontractorRow[]>(() => {
    const tradeSuppliers = data.suppliers.filter((supplier) =>
      supplier.categories.some((category) =>
        /mep|scaffold|steel|formwork|earth|glaz|electri|waterproof|plant/i.test(category),
      ),
    );
    const subcontractLines = data.projects.flatMap((project) =>
      project.budgetLines
        .filter((line) => line.category === "subcontractors")
        .map((line) => ({ project, line })),
    );
    return subcontractLines.map(({ project, line }, index) => {
      const supplier = tradeSuppliers[index % Math.max(1, tradeSuppliers.length)];
      const used = lineUsedPercent(line);
      const tier = tierFor(used);
      return {
        id: line.id,
        name: supplier?.name ?? "Unallocated subcontract package",
        trade: supplier?.categories.join(", ") ?? CATEGORY_LABELS.subcontractors,
        projectId: project.id,
        projectCode: project.code,
        contractValue: line.budgetAmount,
        certifiedToDate: line.actualAmount,
        remaining: lineRemaining(line),
        retention: percentOf(line.actualAmount, line.budgetAmount, 2),
        usedPercent: used,
        tier: tier.tone,
        tierLabel: tier.label,
      };
    });
  }, [data.projects, data.suppliers]);

  const totals = useMemo(
    () => ({
      value: sumBy(rows, (row) => row.contractValue),
      certified: sumBy(rows, (row) => row.certifiedToDate),
      remaining: sumBy(rows, (row) => row.remaining),
    }),
    [rows],
  );

  const columns: PlannedColumn<SubcontractorRow>[] = [
    {
      key: "name",
      header: "Subcontractor",
      cell: (row) => (
        <>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.trade}</div>
        </>
      ),
    },
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <NavLink href={`/projects/${row.projectId}`} className="font-medium hover:underline">
          {row.projectCode}
        </NavLink>
      ),
    },
    {
      key: "contractValue",
      header: "Contract value",
      align: "right",
      cell: (row) => <MoneyText value={row.contractValue} />,
    },
    {
      key: "certifiedToDate",
      header: "Certified to date",
      align: "right",
      cell: (row) => <MoneyText value={row.certifiedToDate} />,
    },
    {
      key: "remaining",
      header: "Remaining",
      align: "right",
      cell: (row) => <SignedMoneyText value={row.remaining} />,
    },
    {
      key: "retention",
      header: "Cert. rate",
      align: "right",
      cell: (row) => <PercentText value={row.usedPercent} />,
    },
    {
      key: "tier",
      header: "Commitment health",
      cell: (row) => (
        <ToneBadge tone={row.tier} dot>
          {row.tierLabel}
        </ToneBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="procurement.subcontractors" />
      <PlannedBanner sectionKey="procurement.subcontractors" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Package value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totals.value} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Certified
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totals.certified} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {percentOf(totals.certified, totals.value)} of package
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Still to certify
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <SignedMoneyText value={totals.remaining} />
            <div className="text-xs font-normal text-muted-foreground">
              {formatNumber(rows.length)} packages
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance checklist</CardTitle>
          <CardDescription>
            Subcontractor insurance, induction and safety records sit alongside the certified
            values in Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 text-sm text-muted-foreground">
          <p>• Public liability and workers compensation certificates on file</p>
          <p>• Site induction recorded for every operative booked to a package</p>
          <p>• Variation instructions priced before the next valuation date</p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search subcontractors…"
        filters={["All trades", "All projects", "Overcommitted"]}
        actions={["New package", "Request insurance", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="subcontract packages" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function SubcontractorsPage() {
  return (
    <RoleGuard sectionKey="procurement.subcontractors">
      <HydrationGate>
        <SubcontractorsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
