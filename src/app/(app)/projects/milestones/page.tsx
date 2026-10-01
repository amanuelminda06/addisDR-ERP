"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
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
import { PercentText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { clampPercent, daysUntil, PROJECT_STATUS_LABELS } from "@/lib/rules/projects";
import { daysBetween, formatDate } from "@/lib/format";
import type { Milestone } from "@/lib/types";

const STATUS_LABELS: Record<Milestone["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Complete",
};

const STATUS_TONES: Record<Milestone["status"], Tone> = {
  not_started: "muted",
  in_progress: "info",
  blocked: "danger",
  done: "ok",
};

function MilestonesContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const employeeById = useMemo(
    () => Object.fromEntries(data.employees.map((employee) => [employee.id, employee])),
    [data.employees],
  );
  const rows = data.preview.milestones;

  const columns: PlannedColumn<Milestone>[] = [
    {
      key: "name",
      header: "Milestone",
      cell: (row) => (
        <>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.ref} · {row.phase} ·{" "}
            <NavLink href={`/projects/${row.projectId}`} className="hover:underline">
              {projectById[row.projectId]?.code ?? row.projectId}
            </NavLink>
          </div>
        </>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      cell: (row) => employeeById[row.ownerEmployeeId]?.name ?? "—",
    },
    {
      key: "dueDate",
      header: "Due",
      cell: (row) => {
        const remaining = daysUntil(projectById[row.projectId] ?? data.projects[0]);
        return (
          <>
            <div>{formatDate(row.dueDate)}</div>
            <div className="text-xs text-muted-foreground">
              {projectById[row.projectId]?.code} ends in {remaining} d
            </div>
          </>
        );
      },
    },
    {
      key: "weightPercent",
      header: "Weight",
      align: "right",
      cell: (row) => <PercentText value={row.weightPercent} />,
    },
    {
      key: "progressPercent",
      header: "Progress",
      align: "right",
      cell: (row) => (
        <span className="flex flex-col items-end gap-1">
          <PercentText value={row.progressPercent} />
          <Progress value={clampPercent(row.progressPercent)} className="w-16" />
        </span>
      ),
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
    {
      key: "variance",
      header: "Days to due",
      align: "right",
      cell: (row) => {
        const days = daysBetween(new Date(), row.dueDate);
        return (
          <span className={days < 0 && row.status !== "done" ? "text-amber-600" : ""}>
            {days} d
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="projects.milestones" />
      <PlannedBanner sectionKey="projects.milestones" />

      <PlannedToolbar
        searchPlaceholder="Search milestones…"
        filters={["All projects", "All phases", "Blocked only"]}
        actions={["Add milestone", "Baseline", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="milestones" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      <p className="text-xs text-muted-foreground">
        {rows.filter((row) => row.status === "blocked").length} blocked ·{" "}
        {rows.filter((row) => row.status === "done").length} complete across{" "}
        {new Set(rows.map((row) => row.projectId)).size} projects ·{" "}
        {PROJECT_STATUS_LABELS[projectById[rows[0]?.projectId ?? ""]?.status ?? "active"]} status
        inherited from the parent project.
      </p>
    </div>
  );
}

export default function MilestonesPage() {
  return (
    <RoleGuard sectionKey="projects.milestones">
      <HydrationGate>
        <MilestonesContent />
      </HydrationGate>
    </RoleGuard>
  );
}
