"use client";

import { useMemo } from "react";
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
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { formatHours } from "@/lib/units";
import { formatDate, formatWeekday } from "@/lib/format";
import type { SiteLog } from "@/lib/types";

const STATUS_LABELS: Record<SiteLog["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
};

const STATUS_TONES: Record<SiteLog["status"], Tone> = {
  draft: "muted",
  submitted: "info",
  approved: "ok",
};

function DailyLogsContent() {
  const data = useErpData();
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = [...data.preview.siteLogs].sort((a, b) => b.date.localeCompare(a.date));

  const columns: PlannedColumn<SiteLog>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => (
        <>
          <div className="font-medium">{formatDate(row.date)}</div>
          <div className="text-xs text-muted-foreground">{formatWeekday(row.date)}</div>
        </>
      ),
    },
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <NavLink href={`/projects/${row.projectId}`} className="font-medium hover:underline">
          {projectById[row.projectId]?.code ?? row.projectId}
        </NavLink>
      ),
    },
    { key: "weather", header: "Weather", cell: (row) => row.weather },
    {
      key: "crewOnSite",
      header: "Crew",
      align: "right",
      cell: (row) => row.crewOnSite,
    },
    {
      key: "totalManHours",
      header: "Man hours",
      align: "right",
      cell: (row) => `${formatHours(row.totalManHours)} h`,
    },
    {
      key: "delays",
      header: "Delays",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.delays || "None recorded"}</span>
      ),
    },
    {
      key: "safetyIncidents",
      header: "Safety",
      align: "right",
      cell: (row) =>
        row.safetyIncidents === 0 ? (
          <ToneBadge tone="ok" dot>
            Nil
          </ToneBadge>
        ) : (
          <ToneBadge tone="danger" dot>
            {row.safetyIncidents}
          </ToneBadge>
        ),
    },
    {
      key: "submittedBy",
      header: "Submitted by",
      cell: (row) => userById[row.submittedByUserId]?.name ?? "—",
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

  const incidents = rows.reduce((total, row) => total + row.safetyIncidents, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="projects.daily-logs" />
      <PlannedBanner sectionKey="projects.daily-logs" />

      <PlannedToolbar
        searchPlaceholder="Search daily logs…"
        filters={["All projects", "Any weather", "Delays only"]}
        actions={["New daily log", "Attach photos", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="site logs" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      <p className="text-xs text-muted-foreground">
        {rows.length} logs · {incidents} safety incidents recorded · man hours are stored as
        strings and rendered through the Quantity helpers.
      </p>
    </div>
  );
}

export default function DailyLogsPage() {
  return (
    <RoleGuard sectionKey="projects.daily-logs">
      <HydrationGate>
        <DailyLogsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
