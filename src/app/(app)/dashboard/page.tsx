"use client";

import { useMemo } from "react";
import { Activity, AlertTriangle, ArrowRight, CircleDollarSign, ClipboardList, Gauge, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { MoneyText, PercentText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { NavLink } from "@/components/ui-bits/nav-link";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { addMoney, percentOf, subMoney } from "@/lib/money";
import { ACTION_LABELS, roleLabel, type ActionKey } from "@/lib/rules/permissions";
import { HEALTH_LABELS, HEALTH_TONES } from "@/lib/rules/budget";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/rules/projects";
import { actionLabel, AUDIT_ACTION_LABELS } from "@/lib/rules/audit";
import { formatRelative } from "@/lib/format";
import { ANOMALY_LABELS } from "@/lib/rules/attendance";

function OverviewContent() {
  const data = useErpData();
  const { user, can, liveCount, sectionCount, moduleCount, actions } = useSession();

  const clientNames = useMemo(
    () => Object.fromEntries(data.clients.map((client) => [client.id, client.companyName])),
    [data.clients],
  );

  const committedPlusActual = addMoney(data.portfolio.committedAmount, data.portfolio.actualAmount);
  const alerts = useMemo(
    () => [
      ...data.anomalies.map((anomaly) => ({
        id: anomaly.id,
        kind: ANOMALY_LABELS[anomaly.kind],
        detail: anomaly.detail,
        severity: anomaly.severity === "critical" ? ("danger" as const) : ("warn" as const),
      })),
      ...data.rollups.flatMap((rollup) =>
        rollup.totals.overBudgetLineCount > 0
          ? [
              {
                id: `${rollup.id}_budget`,
                kind: "Budget line over value",
                detail: `${rollup.code} has ${rollup.totals.overBudgetLineCount} budget line(s) beyond their budgeted value.`,
                severity: "danger" as const,
              },
            ]
          : [],
      ),
    ],
    [data.anomalies, data.rollups],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="dashboard.overview"
        subtitle={
          <p className="text-xs text-muted-foreground">
            Signed in as {user.name} · {roleLabel(user.role)} · menu filtered to{" "}
            {sectionCount} sections ({liveCount} live). Seeded {formatRelative(data.seededAt)}.
          </p>
        }
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Arrives in Phase 2">
              <Gauge className="size-3.5" aria-hidden />
              Configure widgets
            </Button>
            <Button size="sm" disabled title="Workflows arrive in Phase 2">
              <ClipboardList className="size-3.5" aria-hidden />
              New record
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contract value"
          value={<MoneyText value={data.portfolio.contractValue} compact />}
          hint={`${data.portfolio.projectCount} projects · ${data.portfolio.activeCount} active`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Committed + spent"
          value={<MoneyText value={committedPlusActual} compact />}
          hint={`${percentOf(committedPlusActual, data.portfolio.budgetAmount)}% of approved budget`}
          icon={Wallet}
          tone={Number(percentOf(committedPlusActual, data.portfolio.budgetAmount)) > 80 ? "warn" : "muted"}
        />
        <StatCard
          label="Budget remaining"
          value={<MoneyText value={data.portfolio.remaining} compact />}
          hint={`Forecast-weighted across ${data.rollups.length} projects`}
          icon={Activity}
          tone="ok"
        />
        <StatCard
          label="Open alerts"
          value={alerts.length}
          hint="Budget, attendance and procurement exceptions"
          icon={AlertTriangle}
          tone={alerts.length > 0 ? "warn" : "ok"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Project position</CardTitle>
            <CardDescription>
              Progress against the time-scaled plan, with cost status from the live budget lines.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Budget used</TableHead>
                  <TableHead>Contract value</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rollups.map((rollup) => (
                  <TableRow key={rollup.id}>
                    <TableCell className="pl-6">
                      <NavLink
                        href={`/projects/${rollup.id}`}
                        className="font-medium hover:underline"
                      >
                        {rollup.name}
                      </NavLink>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{rollup.code}</span>
                        <span>·</span>
                        <span>{clientNames[rollup.clientId]}</span>
                        <ToneBadge tone={PROJECT_STATUS_TONES[rollup.status]}>
                          {PROJECT_STATUS_LABELS[rollup.status]}
                        </ToneBadge>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[9rem]">
                      <div className="flex flex-col gap-1">
                        <Progress value={rollup.progressPercent} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            <PercentText value={rollup.progressPercent} /> complete
                          </span>
                          <span
                            className={rollup.timeline.isBehindSchedule ? "text-amber-600 dark:text-amber-400" : ""}
                          >
                            plan <PercentText value={rollup.timeline.expectedProgressPercent} />
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <PercentText value={Number(rollup.totals.utilisationPercent)} />
                      <div className="text-xs text-muted-foreground">
                        of <MoneyText value={rollup.totals.budgetAmount} compact />
                      </div>
                    </TableCell>
                    <TableCell>
                      <MoneyText value={rollup.contractValue} compact />
                    </TableCell>
                    <TableCell>
                      <SignedMoneyText value={subMoney(rollup.contractValue, rollup.totals.budgetAmount)} />
                      <div className="text-xs text-muted-foreground">margin at completion</div>
                    </TableCell>
                    <TableCell>
                      <ToneBadge tone={HEALTH_TONES[rollup.health]}>
                        {HEALTH_LABELS[rollup.health]}
                      </ToneBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your role</CardTitle>
              <CardDescription>{roleLabel(user.role)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Modules</span>
                <span className="tabular-nums">{moduleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Live sections</span>
                <span className="tabular-nums">{liveCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Planned sections</span>
                <span className="tabular-nums">{sectionCount - liveCount}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Actions available to you in this demo ({actions.length}):
              </p>
              <ul className="flex flex-col gap-1.5">
                {actions.slice(0, 7).map((action) => (
                  <li key={action} className="flex items-center gap-2 text-xs">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {ACTION_LABELS[action as ActionKey]}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Written by logAction on every state change</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.audit.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex flex-col gap-0.5 border-l-2 pl-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {AUDIT_ACTION_LABELS[entry.action] ?? actionLabel(entry.action)}
                    </span>
                    <span className="shrink-0 text-[0.625rem] text-muted-foreground">
                      {formatRelative(entry.at)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.actorName} · {entry.entityLabel}
                  </span>
                  {entry.field ? (
                    <span className="text-[0.6875rem] text-muted-foreground/90">
                      {entry.field}: {entry.oldValue ?? "—"} → {entry.newValue ?? "—"}
                    </span>
                  ) : null}
                </div>
              ))}
              {can("audit.view") ? (
                <NavLink
                  href="/audit"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open audit log
                  <ArrowRight className="size-3" aria-hidden />
                </NavLink>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alerts for {roleLabel(user.role)}</CardTitle>
          <CardDescription>
            Exceptions raised by the pure rule functions in /lib/rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exceptions in the seeded data.</p>
          ) : (
            alerts.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <ToneBadge tone={alert.severity} dot>
                  {alert.kind}
                </ToneBadge>
                <span className="text-muted-foreground">{alert.detail}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardOverviewPage() {
  return (
    <RoleGuard sectionKey="dashboard.overview">
      <HydrationGate>
        <OverviewContent />
      </HydrationGate>
    </RoleGuard>
  );
}
