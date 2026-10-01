"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, Download, TriangleAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";
import { PercentText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { formatHours } from "@/lib/units";
import {
  ANOMALY_LABELS,
  ATTENDANCE_STATUS_LABELS,
  anomalyCounts,
  attendanceDates,
  buildGrid,
  dailyTotals,
  lastNDates,
  summariseAttendance,
} from "@/lib/rules/attendance";
import { formatDate, initials } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";

const CELL_TONES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  late: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  absent: "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300",
  leave: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300",
  holiday: "bg-muted text-muted-foreground",
};

const CELL_SHORT: Record<AttendanceStatus, string> = {
  present: "P",
  late: "L",
  absent: "A",
  leave: "LV",
  holiday: "—",
};

const ANOMALY_TONE: Record<string, Tone> = {
  warning: "warn",
  critical: "danger",
};

function AttendanceContent() {
  const data = useErpData();
  const { can } = useSession();
  const [days, setDays] = useState("14");
  const [employeeId, setEmployeeId] = useState<string>("all");

  const windowDays = Number(days);
  const dates = useMemo(
    () => lastNDates(data.attendance, windowDays),
    [data.attendance, windowDays],
  );
  const scoped = useMemo(
    () => data.attendance.filter((record) => dates.includes(record.date)),
    [data.attendance, dates],
  );
  const summary = useMemo(() => summariseAttendance(scoped), [scoped]);
  const grid = useMemo(
    () => buildGrid(data.attendance, data.employees, dates),
    [data.attendance, data.employees, dates],
  );
  const counts = useMemo(() => anomalyCounts(data.anomalies), [data.anomalies]);
  const dayLabels = useMemo(
    () => attendanceDates(data.attendance).filter((entry) => dates.includes(entry.date)),
    [data.attendance, dates],
  );
  const visibleEmployees = useMemo(
    () =>
      employeeId === "all"
        ? data.employees
        : data.employees.filter((employee) => employee.id === employeeId),
    [data.employees, employeeId],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="hr.attendance"
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Device import is Phase 2">
              <Download className="size-3.5" aria-hidden />
              Import from device
            </Button>
            <Button size="sm" disabled={!can("hr.attendance.manage")} title="Corrections are Phase 2">
              Correct record
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Records in window"
          value={scoped.length}
          hint={`${formatDate(dates[0])} → ${formatDate(dates[dates.length - 1])}`}
          icon={CalendarDays}
        />
        <StatCard
          label="Attendance rate"
          value={<PercentText value={Number(summary.attendanceRatePercent)} />}
          hint={`${summary.workedDays} worked days · ${summary.absent} absences · ${summary.leave} leave`}
          tone={Number(summary.attendanceRatePercent) >= 90 ? "ok" : "warn"}
        />
        <StatCard
          label="Total hours"
          value={formatHours(summary.totalHours, 0)}
          hint={`${formatHours(summary.overtimeHours)} overtime logged`}
          icon={Clock}
        />
        <StatCard
          label="Flagged exceptions"
          value={data.anomalies.length}
          hint={Object.entries(counts)
            .map(([kind, value]) => `${ANOMALY_LABELS[kind as keyof typeof ANOMALY_LABELS]}: ${value}`)
            .join(" · ")}
          icon={TriangleAlert}
          tone={data.anomalies.length > 0 ? "warn" : "ok"}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={days} onValueChange={(value) => value && setDays(value as string)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={employeeId}
          onValueChange={(value) => value && setEmployeeId(value as string)}
        >
          <SelectTrigger className="w-full sm:w-64" aria-label="Filter by employee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {data.employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.employeeNo} · {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          P present · L late · A absent · LV leave · — rest day
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance grid</CardTitle>
          <CardDescription>
            {scoped.length} records across {visibleEmployees.length} employees. Anomalies are
            detected by pure functions, not stored flags.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-card pl-6">Employee</TableHead>
                  {dayLabels.map((day) => (
                    <TableHead key={day.date} className="px-1 text-center text-[0.625rem]">
                      {day.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEmployees.map((employee) => {
                  const row = scoped.filter((record) => record.employeeId === employee.id);
                  const rowSummary = summariseAttendance(row);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="sticky left-0 z-10 bg-card pl-6">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.5625rem] font-semibold">
                            {initials(employee.name)}
                          </span>
                          <div>
                            <div className="text-sm font-medium">{employee.name}</div>
                            <div className="text-[0.625rem] text-muted-foreground">
                              {employee.employeeNo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {dayLabels.map((day) => {
                        const status = grid[employee.id]?.[day.date] ?? null;
                        return (
                          <TableCell key={day.date} className="p-0.5 text-center">
                            {status ? (
                              <span
                                title={`${employee.name} · ${formatDate(day.date)} · ${ATTENDANCE_STATUS_LABELS[status]}`}
                                className={`inline-flex size-6 items-center justify-center rounded text-[0.625rem] font-semibold ${CELL_TONES[status]}`}
                              >
                                {CELL_SHORT[status]}
                              </span>
                            ) : (
                              <span className="text-[0.625rem] text-muted-foreground/40">·</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right tabular-nums">
                        {rowSummary.present + rowSummary.late}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                        {rowSummary.absent}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {rowSummary.overtimeHours}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily totals</CardTitle>
            <CardDescription>Headcount and hours per day in the selected window.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead className="text-right">On site</TableHead>
                  <TableHead className="text-right">Regular hours</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...dayLabels].reverse().map((day) => {
                  const totals = dailyTotals(scoped, day.date);
                  return (
                    <TableRow key={day.date}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <Users className="size-3.5 text-muted-foreground" aria-hidden />
                          {formatDate(day.date, "EEE dd MMM")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{totals.headcount}</TableCell>
                      <TableCell className="text-right tabular-nums">{totals.regularHours}</TableCell>
                      <TableCell className="text-right tabular-nums">{totals.overtimeHours}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {totals.totalHours}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flagged exceptions</CardTitle>
            <CardDescription>
              Computed by detectAnomalies() — missing punches, overtime over the 4 h cap, absences
              without a note.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.anomalies.slice(0, 8).map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <ToneBadge tone={ANOMALY_TONE[anomaly.severity] ?? "muted"} dot>
                  {ANOMALY_LABELS[anomaly.kind]}
                </ToneBadge>
                <span className="text-muted-foreground">{anomaly.detail}</span>
              </div>
            ))}
            {data.anomalies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exceptions detected.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <RoleGuard sectionKey="hr.attendance">
      <HydrationGate>
        <AttendanceContent />
      </HydrationGate>
    </RoleGuard>
  );
}
