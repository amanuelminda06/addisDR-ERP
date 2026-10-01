"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, CalendarRange, MapPin, PencilLine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { EmptyState } from "@/components/ui-bits/empty-state";
import { NavLink } from "@/components/ui-bits/nav-link";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { useErpStore } from "@/store/erp-store";
import {
  budgetRollupByCategory,
  budgetLineStatusText,
  budgetTotals,
  CATEGORY_LABELS,
  HEALTH_LABELS,
  HEALTH_TONES,
  lineStatus,
  lineRemaining,
  lineUsedPercent,
  marginPercentAtCompletion,
  retentionAmount,
} from "@/lib/rules/budget";
import {
  findProject,
  projectTimeline,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
} from "@/lib/rules/projects";
import { formatDate } from "@/lib/format";
import type { Tone } from "@/components/ui-bits/tone-badge";

const LINE_STATUS_TONES: Record<string, Tone> = {
  unspent: "muted",
  part_committed: "info",
  committed: "warn",
  over: "danger",
  critical: "danger",
};

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const data = useErpData();
  const { can } = useSession();
  const recordProjectView = useErpStore((state) => state.recordProjectView);
  const loggedFor = useRef<string | null>(null);

  const project = useMemo(() => findProject(data.projects, projectId), [data.projects, projectId]);
  const client = useMemo(
    () => data.clients.find((item) => item.id === project?.clientId) ?? null,
    [data.clients, project?.clientId],
  );

  useEffect(() => {
    if (!project) return;
    if (loggedFor.current === project.id) return;
    loggedFor.current = project.id;
    recordProjectView(project.id, `${project.code} · ${project.name}`);
  }, [project, recordProjectView]);

  const totals = useMemo(
    () =>
      project
        ? budgetTotals(project.budgetLines, { progressPercent: project.progressPercent })
        : null,
    [project],
  );

  if (!project || !totals) {
    return (
      <div className="flex flex-col gap-6">
        <NavLink
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to projects
        </NavLink>
        <EmptyState
          title="Project not found"
          description={`No project with id "${projectId}" exists in the seeded demo data. Choose a project from the register.`}
          action={
            <NavLink
              href="/projects"
              className="mt-2 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
            >
              Open project register
            </NavLink>
          }
        />
      </div>
    );
  }

  const crew = data.employees.filter((employee) =>
    project.engineerEmployeeIds.includes(employee.id),
  );
  const manager = data.employees.find((employee) => employee.id === project.siteManagerEmployeeId);
  const categories = budgetRollupByCategory(project.budgetLines);
  const timeline = projectTimeline(project);
  const elapsed = timeline.elapsedDays;

  return (
    <div className="flex flex-col gap-6">
      <NavLink
        href="/projects"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to projects
      </NavLink>

      <PageHeader
        sectionKey="projects.detail"
        subtitle={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <ToneBadge tone={PROJECT_STATUS_TONES[project.status]}>
              {PROJECT_STATUS_LABELS[project.status]}
            </ToneBadge>
            <ToneBadge tone={HEALTH_TONES[totals.health]}>{HEALTH_LABELS[totals.health]}</ToneBadge>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {project.siteAddress}, {project.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="size-3" aria-hidden />
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </span>
          </div>
        }
        actions={
          <>
            <Button variant="outline" size="sm" disabled={!can("project.edit")} title="Editing is Phase 2">
              <PencilLine className="size-3.5" aria-hidden />
              Edit project
            </Button>
            <Button size="sm" disabled title="Progress capture is Phase 2">
              Capture progress
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contract value"
          value={<MoneyText value={project.contractValue} compact />}
          hint={
            <span className="flex items-center gap-1">
              Retention {project.retentionPercent}%
              <MoneyText value={retentionAmount(project.contractValue, project.retentionPercent)} compact />
              held
            </span>
          }
        />
        <StatCard
          label="Budget vs actual"
          value={
            <span className="flex flex-col">
              <MoneyText value={totals.actualAmount} compact />
              <span className="text-xs font-normal text-muted-foreground">
                of <MoneyText value={totals.budgetAmount} compact />
              </span>
            </span>
          }
          hint={`${totals.utilisationPercent}% used (incl. commitments)`}
          tone={totals.health === "critical" ? "danger" : "muted"}
        />
        <StatCard
          label="Forecast at completion"
          value={<MoneyText value={totals.forecastAtCompletion} compact />}
          hint={`Assumes ${project.progressPercent}% progress today`}
          tone="warn"
        />
        <StatCard
          label="Margin at completion"
          value={marginPercentAtCompletion(project)}
          hint={`Retention and claims excluded`}
          tone="ok"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <CardTitle>Delivery progress</CardTitle>
                <CardDescription>
                  Time-scaled plan vs reported progress — day {elapsed} of {timeline.totalDays},
                  {timeline.isBehindSchedule ? " behind programme" : " on or ahead of programme"}.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reported progress</span>
                  <span className="tabular-nums">
                    <PercentText value={project.progressPercent} />
                  </span>
                </div>
                <Progress value={project.progressPercent} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Time-scaled plan</span>
                  <span className="tabular-nums">
                    <PercentText value={timeline.expectedProgressPercent} />
                  </span>
                </div>
                <Progress value={timeline.expectedProgressPercent} />
              </div>
              <p className="text-xs text-muted-foreground">
                {project.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget lines</CardTitle>
              <CardDescription>
                Live figures from the store. Overrun lines are raised by budget rules in
                /lib/rules/budget.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Code / description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Committed</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.budgetLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="pl-6">
                        <div className="font-medium">{line.description}</div>
                        <div className="text-xs text-muted-foreground">{line.code}</div>
                      </TableCell>
                      <TableCell className="text-sm">{CATEGORY_LABELS[line.category]}</TableCell>
                      <TableCell className="text-right">
                        <MoneyText value={line.budgetAmount} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyText value={line.committedAmount} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyText value={line.actualAmount} />
                      </TableCell>
                      <TableCell className="text-right">
                        <SignedMoneyText value={lineRemaining(line)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PercentText value={lineUsedPercent(line)} />
                      </TableCell>
                      <TableCell>
                        <ToneBadge tone={LINE_STATUS_TONES[lineStatus(line)]}>
                          {budgetLineStatusText(line)}
                        </ToneBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {client ? (
                <>
                  <NavLink
                    href="/crm/clients"
                    className="font-medium hover:underline"
                  >
                    {client.companyName}
                  </NavLink>
                  <p className="text-xs text-muted-foreground">{client.sector}</p>
                  <Separator />
                  <Row label="Contact" value={`${client.contactName} · ${client.contactEmail}`} />
                  <Row label="Terms" value={`Net ${client.paymentTermsDays} days`} />
                  <Row label="Credit limit" value={<MoneyText value={client.creditLimit} />} />
                  <Row
                    label="Outstanding"
                    value={<MoneyText value={client.outstandingBalance} />}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">No client linked.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site team</CardTitle>
              <CardDescription>{crew.length} assigned · foreman {manager?.name ?? "—"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {crew.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" aria-hidden />
                    {employee.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{employee.jobTitle}</span>
                </div>
              ))}
              {crew.length === 0 ? (
                <p className="text-muted-foreground">No engineers assigned.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {categories.map((entry) => (
                <div key={entry.category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{entry.label}</span>
                    <span className="tabular-nums">
                      <MoneyText value={entry.budget} compact /> · {entry.usedPercent.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, entry.usedPercent)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  return (
    <RoleGuard sectionKey="projects.detail">
      <HydrationGate>
        <ProjectDetailContent projectId={projectId} />
      </HydrationGate>
    </RoleGuard>
  );
}
