"use client";

import { useMemo, useState } from "react";
import { Briefcase, Plus, UserPlus, Users } from "lucide-react";
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
import { MoneyText, PercentText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { useErpStore } from "@/store/erp-store";
import {
  DEPARTMENT_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
} from "@/lib/rules/hr";
import { formatDate, initials } from "@/lib/format";
import type { EmployeeStatus } from "@/lib/types";

const ALL = "all";

const STATUS_TONES: Record<EmployeeStatus, Tone> = {
  active: "ok",
  on_leave: "warn",
  probation: "info",
  inactive: "muted",
};

function EmployeesContent() {
  const data = useErpData();
  const { can } = useSession();
  const users = useErpStore((state) => state.users);
  const [department, setDepartment] = useState<string>(ALL);

  const projectNames = useMemo(
    () => Object.fromEntries(data.projects.map((project) => [project.id, project.code])),
    [data.projects],
  );

  const employees = useMemo(
    () =>
      data.employees.filter(
        (employee) => department === ALL || employee.department === department,
      ),
    [data.employees, department],
  );

  const userForEmployee = (employeeId: string) =>
    users.find((user) => user.employeeId === employeeId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="hr.employees"
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Onboarding is Phase 2">
              <UserPlus className="size-3.5" aria-hidden />
              Onboard
            </Button>
            <Button size="sm" disabled={!can("hr.employee.manage")} title="Employee creation is Phase 2">
              <Plus className="size-3.5" aria-hidden />
              Add employee
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Headcount"
          value={data.headcount.total}
          hint={`${data.headcount.active} active · ${data.headcount.onLeave} on leave · ${data.headcount.probation} probation`}
          icon={Users}
        />
        <StatCard
          label="Monthly payroll cost"
          value={<MoneyText value={data.headcount.monthlyPayrollCost} compact />}
          hint="Base salaries of active employees"
        />
        <StatCard
          label="Average salary"
          value={<MoneyText value={data.headcount.averageSalary} compact />}
          hint="Excludes allowances and overtime"
        />
        <StatCard
          label="Attendance rate"
          value={<PercentText value={Number(data.attendanceSummary.attendanceRatePercent)} />}
          hint={`Last ${data.attendanceFrom} → ${data.attendanceTo}`}
          tone={Number(data.attendanceSummary.attendanceRatePercent) >= 90 ? "ok" : "warn"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Employee register</CardTitle>
                <CardDescription>Live records with site assignment and cost.</CardDescription>
              </div>
              <Select
                value={department}
                onValueChange={(value) => value && setDepartment(value as string)}
              >
                <SelectTrigger className="w-full sm:w-56" aria-label="Filter by department">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All departments</SelectItem>
                  {data.headcount.byDepartment.map((entry) => (
                    <SelectItem key={entry.department} value={entry.department}>
                      {entry.label} ({entry.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Base salary</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const summary = data.attendanceByEmployee[employee.id];
                  const user = userForEmployee(employee.id);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-semibold">
                            {initials(employee.name)}
                          </span>
                          <div>
                            <div className="font-medium">
                              {employee.name}
                              {user ? (
                                <span className="ml-1.5 rounded border px-1 py-px text-[0.5625rem] font-normal text-muted-foreground">
                                  login
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {employee.employeeNo} · {employee.jobTitle} · joined{" "}
                              {formatDate(employee.joinedOn, "MMM yyyy")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {DEPARTMENT_LABELS[employee.department]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {employee.projectId ? projectNames[employee.projectId] : "Head office"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyText value={employee.baseMonthlySalary} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {summary ? `${summary.attendanceRatePercent}%` : "—"}
                        {summary ? (
                          <div className="text-xs text-muted-foreground">
                            {summary.workedDays} days
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <ToneBadge tone={STATUS_TONES[employee.status]}>
                          {EMPLOYMENT_STATUS_LABELS[employee.status]}
                        </ToneBadge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Headcount by department</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {data.headcount.byDepartment.map((entry) => (
                <div key={entry.department} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="size-3.5" aria-hidden />
                    {entry.label}
                  </span>
                  <span className="tabular-nums">{entry.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Compliance coverage across the workforce</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              {data.employees.flatMap((employee) =>
                employee.certifications.map((certification) => (
                  <div key={`${employee.id}_${certification}`} className="flex items-center justify-between gap-2">
                    <span className="truncate text-muted-foreground">{certification}</span>
                    <span className="shrink-0">{employee.employeeNo}</span>
                  </div>
                )),
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <RoleGuard sectionKey="hr.employees">
      <HydrationGate>
        <EmployeesContent />
      </HydrationGate>
    </RoleGuard>
  );
}
