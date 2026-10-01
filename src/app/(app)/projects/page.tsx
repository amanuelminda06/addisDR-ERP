"use client";

import { useMemo, useState } from "react";
import { Filter, HardHat, Plus } from "lucide-react";
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
import { MoneyText, PercentText, SignedMoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { NavLink } from "@/components/ui-bits/nav-link";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { addMoney, percentOf, subMoney } from "@/lib/money";
import { HEALTH_LABELS, HEALTH_TONES } from "@/lib/rules/budget";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  PROJECT_TYPE_LABELS,
} from "@/lib/rules/projects";
import { formatDate } from "@/lib/format";
import type { ProjectStatus } from "@/lib/types";

const ALL = "all";

function ProjectListContent() {
  const data = useErpData();
  const { can } = useSession();
  const [status, setStatus] = useState<string>(ALL);
  const [clientId, setClientId] = useState<string>(ALL);

  const clientNames = useMemo(
    () => Object.fromEntries(data.clients.map((client) => [client.id, client.companyName])),
    [data.clients],
  );

  const filtered = useMemo(
    () =>
      data.rollups.filter(
        (rollup) =>
          (status === ALL || rollup.status === status) &&
          (clientId === ALL || rollup.clientId === clientId),
      ),
    [data.rollups, status, clientId],
  );

  const statuses = useMemo(
    () => Array.from(new Set(data.rollups.map((rollup) => rollup.status))),
    [data.rollups],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="projects.list"
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Filtering is available in Phase 2">
              <Filter className="size-3.5" aria-hidden />
              Saved views
            </Button>
            <Button size="sm" disabled={!can("project.create")} title="Project creation is Phase 2">
              <Plus className="size-3.5" aria-hidden />
              New project
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contract value"
          value={<MoneyText value={data.portfolio.contractValue} compact />}
          hint={`${data.portfolio.projectCount} projects`}
          icon={HardHat}
        />
        <StatCard
          label="Approved budget"
          value={<MoneyText value={data.portfolio.budgetAmount} compact />}
          hint={`Margin held back ${percentOf(subMoney(data.portfolio.contractValue, data.portfolio.budgetAmount), data.portfolio.contractValue)}%`}
        />
        <StatCard
          label="Committed + actual"
          value={
            <MoneyText value={addMoney(data.portfolio.committedAmount, data.portfolio.actualAmount)} compact />
          }
          hint={`Actual ${percentOf(data.portfolio.actualAmount, data.portfolio.budgetAmount)}% · committed ${percentOf(data.portfolio.committedAmount, data.portfolio.budgetAmount)}%`}
        />
        <StatCard
          label="Weighted progress"
          value={<PercentText value={data.portfolio.weightedProgressPercent} />}
          hint={`Simple average ${data.portfolio.averageProgressPercent}%`}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(value) => value && setStatus(value as string)}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statuses.map((value) => (
              <SelectItem key={value} value={value}>
                {PROJECT_STATUS_LABELS[value as ProjectStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clientId} onValueChange={(value) => value && setClientId(value as string)}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Filter by client">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All clients</SelectItem>
            {data.clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Showing {filtered.length} of {data.rollups.length} projects
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project register</CardTitle>
          <CardDescription>
            Every figure is computed by the pure functions in <code>/lib/rules</code> from the
            session-scoped store.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Contract value</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rollup) => (
                <TableRow key={rollup.id}>
                  <TableCell className="pl-6">
                    <NavLink href={`/projects/${rollup.id}`} className="font-medium hover:underline">
                      {rollup.name}
                    </NavLink>
                    <div className="text-xs text-muted-foreground">
                      {rollup.code} · {PROJECT_TYPE_LABELS[rollup.type]} ·{" "}
                      {formatDate(rollup.endDate, "MMM yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{clientNames[rollup.clientId]}</TableCell>
                  <TableCell className="min-w-[8.5rem]">
                    <Progress value={rollup.progressPercent} />
                    <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                      <PercentText value={rollup.progressPercent} /> ·{" "}
                      {rollup.timeline.isBehindSchedule ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {rollup.timeline.scheduleVarianceDays} d behind
                        </span>
                      ) : (
                        <span>{rollup.timeline.scheduleVarianceDays} d ahead</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyText value={rollup.contractValue} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyText value={rollup.totals.budgetAmount} />
                    <div className="text-xs text-muted-foreground">
                      {rollup.totals.lineCount} lines
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyText value={rollup.totals.actualAmount} />
                  </TableCell>
                  <TableCell className="text-right">
                    <SignedMoneyText value={rollup.totals.remaining} />
                  </TableCell>
                  <TableCell>
                    <ToneBadge tone={PROJECT_STATUS_TONES[rollup.status]}>
                      {PROJECT_STATUS_LABELS[rollup.status]}
                    </ToneBadge>
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
    </div>
  );
}

export default function ProjectListPage() {
  return (
    <RoleGuard sectionKey="projects.list">
      <HydrationGate>
        <ProjectListContent />
      </HydrationGate>
    </RoleGuard>
  );
}
