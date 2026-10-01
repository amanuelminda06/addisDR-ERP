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
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { timesheetMatchesAttendance, timesheetTotals } from "@/lib/rules/hr";
import { qAdd, formatHours } from "@/lib/units";
import { formatDate, pluralize } from "@/lib/format";
import type { Timesheet } from "@/lib/types";

const STATUS_LABELS: Record<Timesheet["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Returned",
};

const STATUS_TONES: Record<Timesheet["status"], Tone> = {
  draft: "muted",
  submitted: "info",
  approved: "ok",
  rejected: "danger",
};

function TimesheetsContent() {
  const data = useErpData();
  const employeeById = useMemo(
    () => Object.fromEntries(data.employees.map((employee) => [employee.id, employee])),
    [data.employees],
  );
  const projectById = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project])),
    [data.projects],
  );
  const rows = useMemo(
    () => [...data.preview.timesheets].sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
    [data.preview.timesheets],
  );

  const totals = useMemo(() => timesheetTotals(rows), [rows]);
  const mismatches = useMemo(
    () =>
      rows
        .map((row) => ({ row, check: timesheetMatchesAttendance(row, data.attendance) }))
        .filter((entry) => !entry.check.matches),
    [rows, data.attendance],
  );

  const columns: PlannedColumn<Timesheet>[] = [
    {
      key: "ref",
      header: "Timesheet",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.weekStart)} – {formatDate(row.weekEnd)}
          </div>
        </>
      ),
    },
    {
      key: "employee",
      header: "Operative",
      cell: (row) => {
        const employee = employeeById[row.employeeId];
        return (
          <>
            <div className="font-medium">{employee?.name ?? row.employeeId}</div>
            <div className="text-xs text-muted-foreground">
              {employee?.employeeNo} · {employee?.jobTitle}
            </div>
          </>
        );
      },
    },
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <NavLink href={`/projects/${row.projectId}`} className="hover:underline">
          {projectById[row.projectId]?.code ?? row.projectId}
        </NavLink>
      ),
    },
    {
      key: "regularHours",
      header: "Regular",
      align: "right",
      cell: (row) => `${formatHours(row.regularHours)} h`,
    },
    {
      key: "overtimeHours",
      header: "Overtime",
      align: "right",
      cell: (row) => (
        <span className={Number(row.overtimeHours) > 8 ? "text-amber-600" : ""}>
          {formatHours(row.overtimeHours)} h
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (row) => `${formatHours(qAdd(row.regularHours, row.overtimeHours))} h`,
    },
    {
      key: "attendance",
      header: "Attendance check",
      cell: (row) => {
        const check = timesheetMatchesAttendance(row, data.attendance);
        return (
          <span className="flex flex-col items-start gap-1">
            <ToneBadge tone={check.matches ? "ok" : "warn"} dot>
              {check.matches ? "Matches site log" : "Differs from site log"}
            </ToneBadge>
            <span className="text-xs text-muted-foreground">
              Log {formatHours(check.attendanceHours)} h
            </span>
          </span>
        );
      },
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
      <PageHeader sectionKey="hr.timesheets" />
      <PlannedBanner sectionKey="hr.timesheets" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Regular hours
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {formatHours(totals.regular)} h
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Overtime hours
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {formatHours(totals.overtime)} h
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Payable hours
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {formatHours(totals.total)} h
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Timesheets
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {rows.length}
            <div className="text-xs font-normal text-muted-foreground">
              {pluralize(mismatches.length, "mismatch", "mismatches")} vs attendance
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation against attendance</CardTitle>
          <CardDescription>
            Attendance records are already live on the Attendance page. Phase 2 will write approved
            timesheets straight from those records and flag overtime above the daily cap.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {mismatches.length} of {rows.length} timesheets differ from the site log for the same
          week.
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search timesheets…"
        filters={["All projects", "All statuses", "Mismatch only"]}
        actions={["Approve week", "Export to payroll", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="timesheets" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function TimesheetsPage() {
  return (
    <RoleGuard sectionKey="hr.timesheets">
      <HydrationGate>
        <TimesheetsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
