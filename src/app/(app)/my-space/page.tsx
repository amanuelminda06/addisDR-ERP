"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  CalendarClock,
  CalendarCheck,
  Clock,
  HardHat,
  MapPin,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { StatCard } from "@/components/ui-bits/stat-card";
import { ToneBadge } from "@/components/ui-bits/tone-badge";
import { StatusBadge } from "@/components/ui-bits/status-badge";
import { EmptyState } from "@/components/ui-bits/empty-state";
import { NavLink } from "@/components/ui-bits/nav-link";
import { useErpData } from "@/hooks/use-erp-data";
import { useActiveUser, useSession } from "@/hooks/use-session";
import { initials, formatDate, formatRelative, pluralize } from "@/lib/format";
import { toQ } from "@/lib/units";
import { summariseAttendance } from "@/lib/rules/attendance";
import {
  ANNUAL_LEAVE_ENTITLEMENT_DAYS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  leaveBalance,
  serviceTenure,
  tenureLabel,
} from "@/lib/rules/hr";
import { actionLabel } from "@/lib/rules/audit";
import { roleLabel } from "@/lib/rules/permissions";
import { COMPANY_NAME, COMPANY_TAGLINE, spaceActionsFor } from "@/lib/rules/my-space";
import { getSection } from "@/lib/navigation";

function MySpaceContent() {
  const data = useErpData();
  const { can } = useSession();
  const user = useActiveUser();

  const employee = useMemo(
    () =>
      user.employeeId
        ? data.employees.find((candidate) => candidate.id === user.employeeId)
        : data.employees.find((candidate) => candidate.name === user.name),
    [data.employees, user.employeeId, user.name],
  );

  const attendanceSummary = useMemo(() => {
    if (!employee) return null;
    return summariseAttendance(
      data.attendance.filter((record) => record.employeeId === employee.id),
    );
  }, [data.attendance, employee]);

  const tenure = useMemo(
    () => (employee ? serviceTenure(employee.joinedOn, data.seededAt) : null),
    [employee, data.seededAt],
  );

  const myLeave = useMemo(
    () =>
      employee
        ? data.preview.leaveRequests.filter((request) => request.employeeId === employee.id)
        : [],
    [data.preview.leaveRequests, employee],
  );

  const annualRemaining = employee
    ? leaveBalance(data.preview.leaveRequests, employee.id, "annual")
    : "0.00";
  const sickRemaining = employee
    ? leaveBalance(data.preview.leaveRequests, employee.id, "sick")
    : "0.00";
  const pendingLeave = myLeave.filter((request) => request.status === "pending").length;

  const approvals = useMemo(() => {
    // Each queue is counted only if this role can actually decide it, so an
    // HR Manager never sees procurement requests and an Approver never sees
    // leave requests.
    const prs = can("procurement.request.approve")
      ? data.preview.purchaseRequests.filter((request) =>
          ["submitted", "under_review"].includes(request.status),
        ).length
      : 0;
    const leave = can("hr.leave.approve")
      ? data.preview.leaveRequests.filter((request) => request.status === "pending").length
      : 0;
    return { total: prs + leave, prs, leave };
  }, [can, data.preview.purchaseRequests, data.preview.leaveRequests]);

  const recentActivity = useMemo(
    () => data.audit.filter((entry) => entry.actorUserId === user.id).slice(0, 5),
    [data.audit, user.id],
  );

  const actions = useMemo(() => spaceActionsFor(user.role, can), [user.role, can]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/8 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/8 blur-2xl"
        />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar size="lg" className="size-20 rounded-2xl sm:size-24">
            <AvatarFallback className="rounded-2xl bg-primary/12 text-2xl font-semibold text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Sparkles className="size-3.5" aria-hidden />
              {COMPANY_NAME}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{COMPANY_TAGLINE}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ToneBadge tone="info">{roleLabel(user.role)}</ToneBadge>
              {employee ? (
                <>
                  <ToneBadge tone="muted">{user.jobTitle}</ToneBadge>
                  <ToneBadge tone="muted">{DEPARTMENT_LABELS[employee.department]}</ToneBadge>
                  <ToneBadge
                    tone={
                      employee.status === "active"
                        ? "ok"
                        : employee.status === "on_leave"
                          ? "info"
                          : "warn"
                    }
                    dot
                  >
                    {EMPLOYMENT_STATUS_LABELS[employee.status]}
                  </ToneBadge>
                </>
              ) : (
                <ToneBadge tone="warn" dot>
                  No employee record linked
                </ToneBadge>
              )}
            </div>
          </div>
        </div>
      </div>

      {employee && tenure ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Annual leave left"
            value={`${annualRemaining} d`}
            hint={`of ${ANNUAL_LEAVE_ENTITLEMENT_DAYS} d entitlement · ${sickRemaining} d sick remaining`}
            icon={CalendarCheck}
            tone={toQ(annualRemaining).lte("5") ? "warn" : "ok"}
          />
          <StatCard
            label="Attendance"
            value={`${attendanceSummary?.attendanceRatePercent ?? "0.0"}%`}
            hint={`${attendanceSummary?.workedDays ?? 0} worked days · ${attendanceSummary?.punctualityRatePercent ?? "0.0"}% on time`}
            icon={Clock}
            tone={Number(attendanceSummary?.attendanceRatePercent ?? 0) >= 90 ? "ok" : "warn"}
          />
          <StatCard
            label="My pending requests"
            value={pendingLeave}
            hint={
              pendingLeave === 0
                ? "Nothing awaiting a decision"
                : `${pluralize(pendingLeave, "request")} awaiting approval`
            }
            icon={CalendarClock}
            tone={pendingLeave > 0 ? "warn" : "muted"}
          />
          <StatCard
            label="Awaiting your approval"
            value={approvals.total}
            hint={
              approvals.total === 0
                ? "Your queue is clear"
                : [
                    approvals.prs > 0 ? pluralize(approvals.prs, "purchase request") : null,
                    approvals.leave > 0 ? pluralize(approvals.leave, "leave request") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
            }
            icon={UserRoundCheck}
            tone={approvals.total > 0 ? "warn" : "ok"}
          />
        </div>
      ) : null}

      {employee && tenure ? (
        <Card>
          <CardHeader>
            <CardTitle>At {COMPANY_NAME}</CardTitle>
            <CardDescription>
              {tenureLabel(tenure)} at {COMPANY_NAME}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Employee no.</span>
              <span className="font-medium tabular-nums">{employee.employeeNo}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Joined on</span>
              <span className="font-medium">{formatDate(employee.joinedOn)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Tenure</span>
              <span className="font-medium">
                {tenure.years} yr{tenure.months} mo
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Assigned to</span>
              <span className="flex items-center gap-1.5 font-medium">
                <HardHat className="size-3.5 text-muted-foreground" aria-hidden />
                {data.projects.find((project) => project.id === employee.projectId)?.code ??
                "Unassigned"}
              </span>
            </div>
            {employee.projectId ? (
              <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-4">
                <span className="text-xs text-muted-foreground">Site</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                  {data.projects.find((project) => project.id === employee.projectId)?.name ??
                    "—"}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>My actions</CardTitle>
            <CardDescription>
              Shortcuts for {roleLabel(user.role)}, filtered by the permissions this role holds.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No quick actions are available to this role yet.
              </p>
            ) : (
              actions.map((action) => (
                <NavLink
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-foreground/20 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {action.label}
                      <StatusBadge status={getSection(action.targetKey).status} />
                    </span>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </NavLink>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Your last {recentActivity.length} audit entries</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing recorded yet"
                description="Actions you take in this session appear here, newest first."
                className="border-none shadow-none"
              />
            ) : (
              <>
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-0.5 border-l-2 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {actionLabel(entry.action)}
                      </span>
                      <span className="shrink-0 text-[0.625rem] text-muted-foreground">
                        {formatRelative(entry.at)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{entry.entityLabel}</span>
                    <span className="text-[0.6875rem] text-muted-foreground/90">
                      {formatDate(entry.at, "dd MMM, HH:mm")}
                    </span>
                  </div>
                ))}
                <Separator />
                {can("audit.view") ? (
                  <NavLink
                    href="/audit"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open full audit log
                    <ArrowRight className="size-3" aria-hidden />
                  </NavLink>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    The full audit log is restricted to Approver and Admin roles.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MySpacePage() {
  return (
    <HydrationGate>
      <MySpaceContent />
    </HydrationGate>
  );
}
