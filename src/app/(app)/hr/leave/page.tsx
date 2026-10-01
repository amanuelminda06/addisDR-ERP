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
import { useSession } from "@/hooks/use-session";
import {
  ANNUAL_LEAVE_ENTITLEMENT_DAYS,
  canApproveLeave,
  leaveBalance,
  leaveDurationDays,
  overlappingLeave,
  SICK_LEAVE_ENTITLEMENT_DAYS,
} from "@/lib/rules/hr";
import { formatDate, daysBetween, titleCase } from "@/lib/format";
import type { LeaveRequest } from "@/lib/types";

const STATUS_LABELS: Record<LeaveRequest["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Refused",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<LeaveRequest["status"], Tone> = {
  pending: "warn",
  approved: "ok",
  rejected: "danger",
  cancelled: "muted",
};

const LEAVE_TONES: Record<LeaveRequest["leaveType"], Tone> = {
  annual: "info",
  sick: "warn",
  unpaid: "muted",
  compassionate: "danger",
};

function LeaveContent() {
  const data = useErpData();
  const { role } = useSession();
  const employeeById = useMemo(
    () => Object.fromEntries(data.employees.map((employee) => [employee.id, employee])),
    [data.employees],
  );
  const userById = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const rows = useMemo(
    () => [...data.preview.leaveRequests].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [data.preview.leaveRequests],
  );

  const balances = useMemo(
    () =>
      data.employees.slice(0, 6).map((employee) => ({
        employee,
        annual: leaveBalance(data.preview.leaveRequests, employee.id, "annual"),
        sick: leaveBalance(data.preview.leaveRequests, employee.id, "sick"),
        pending: data.preview.leaveRequests.filter(
          (request) => request.employeeId === employee.id && request.status === "pending",
        ).length,
      })),
    [data.employees, data.preview.leaveRequests],
  );

  const columns: PlannedColumn<LeaveRequest>[] = [
    {
      key: "ref",
      header: "Request",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="max-w-64 truncate text-xs text-muted-foreground">{row.reason}</div>
        </>
      ),
    },
    {
      key: "employee",
      header: "Employee",
      cell: (row) => {
        const employee = employeeById[row.employeeId];
        return (
          <>
            <div className="font-medium">{employee?.name ?? row.employeeId}</div>
            <div className="text-xs text-muted-foreground">
              {employee?.jobTitle} · {employee?.department.replace(/_/g, " ")}
            </div>
          </>
        );
      },
    },
    {
      key: "leaveType",
      header: "Type",
      cell: (row) => (
        <ToneBadge tone={LEAVE_TONES[row.leaveType]}>{titleCase(row.leaveType)}</ToneBadge>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (row) => (
        <>
          <div>
            {formatDate(row.startDate)} – {formatDate(row.endDate)}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.days} d booked · {leaveDurationDays(row.startDate, row.endDate)} d elapsed
          </div>
        </>
      ),
    },
    {
      key: "leadTime",
      header: "Starts in",
      align: "right",
      cell: (row) => {
        const days = daysBetween(new Date(), row.startDate);
        return <span className={days < 0 ? "text-muted-foreground" : ""}>{days} d</span>;
      },
    },
    {
      key: "clash",
      header: "Team clash",
      cell: (row) => {
        const ownClashes = overlappingLeave(
          data.preview.leaveRequests,
          row.employeeId,
          row.startDate,
          row.endDate,
        ).filter((candidate) => candidate.id !== row.id);
        const teamClashes = data.preview.leaveRequests.filter(
          (candidate) =>
            candidate.employeeId !== row.employeeId &&
            candidate.startDate <= row.endDate &&
            candidate.endDate >= row.startDate &&
            candidate.status !== "cancelled" &&
            candidate.status !== "rejected",
        );
        if (ownClashes.length > 0) {
          return (
            <ToneBadge tone="warn" dot>
              Duplicates another request
            </ToneBadge>
          );
        }
        return teamClashes.length > 0 ? (
          <ToneBadge tone="warn" dot>
            {teamClashes.length} team clash
          </ToneBadge>
        ) : (
          <ToneBadge tone="ok" dot>
            No overlap
          </ToneBadge>
        );
      },
    },
    {
      key: "approver",
      header: "Approver",
      cell: (row) =>
        row.approverUserId ? (
          userById[row.approverUserId]?.name ?? "—"
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
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
      key: "authority",
      header: "You can approve",
      cell: () => (
        <span className="text-xs text-muted-foreground">
          {canApproveLeave(role) ? "Yes" : "No — HR manager only"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="hr.leave" />
      <PlannedBanner sectionKey="hr.leave" />

      <Card>
        <CardHeader>
          <CardTitle>Leave balances</CardTitle>
          <CardDescription>
            Entitlement is {ANNUAL_LEAVE_ENTITLEMENT_DAYS} days annual and{" "}
            {SICK_LEAVE_ENTITLEMENT_DAYS} days sick, calculated by leaveBalance() in
            /lib/rules/hr.ts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {balances.map((entry) => (
            <div
              key={entry.employee.id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{entry.employee.name}</div>
                <div className="text-xs text-muted-foreground">
                  Annual {entry.annual} d · Sick {entry.sick} d
                </div>
              </div>
              {entry.pending > 0 ? (
                <ToneBadge tone="warn" dot>
                  {entry.pending} pending
                </ToneBadge>
              ) : (
                <ToneBadge tone="ok" dot>
                  Clear
                </ToneBadge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search leave requests…"
        filters={["All types", "All statuses", "Pending only"]}
        actions={["New request", "Approve selected", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="leave requests" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function LeavePage() {
  return (
    <RoleGuard sectionKey="hr.leave">
      <HydrationGate>
        <LeaveContent />
      </HydrationGate>
    </RoleGuard>
  );
}
