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
import { MoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import {
  allowancesFor,
  hourlyRate,
  OVERTIME_MULTIPLIER,
  payrollLine,
  payrollRun,
  TAX_EXEMPTION,
} from "@/lib/rules/hr";
import { percentOf, sumBy } from "@/lib/money";
import { formatMonth } from "@/lib/format";
import type { PayrollRun } from "@/lib/types";

const STATUS_LABELS: Record<PayrollRun["status"], string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  paid: "Paid",
};

const STATUS_TONES: Record<PayrollRun["status"], Tone> = {
  draft: "muted",
  in_review: "info",
  approved: "ok",
  paid: "warn",
};

function PayrollContent() {
  const data = useErpData();
  const { role } = useSession();
  const rows = useMemo(
    () =>
      [...data.preview.payrollRuns].sort((a, b) => b.period.localeCompare(a.period)),
    [data.preview.payrollRuns],
  );

  const previewLines = useMemo(
    () =>
      data.employees
        .filter((employee) => employee.status === "active")
        .slice(0, 5)
        .map((employee) => payrollLine(employee, data.attendance)),
    [data.employees, data.attendance],
  );

  const computedRun = useMemo(
    () => payrollRun(data.employees, data.attendance),
    [data.employees, data.attendance],
  );

  const allowanceSample = useMemo(
    () => allowancesFor(data.employees[0]?.baseMonthlySalary ?? "0.00"),
    [data.employees],
  );

  const gross = useMemo(() => sumBy(rows, (row) => row.grossTotal), [rows]);
  const deductions = useMemo(() => sumBy(rows, (row) => row.deductionsTotal), [rows]);
  const net = useMemo(() => sumBy(rows, (row) => row.netTotal), [rows]);

  const runColumns: PlannedColumn<PayrollRun>[] = [
    {
      key: "ref",
      header: "Run",
      cell: (row) => (
        <>
          <div className="font-medium">{row.ref}</div>
          <div className="text-xs text-muted-foreground">{formatMonth(`${row.period}-01`)}</div>
        </>
      ),
    },
    {
      key: "payDate",
      header: "Pay date",
      cell: (row) => formatMonth(`${row.period}-01`),
    },
    {
      key: "employeeCount",
      header: "Employees",
      align: "right",
      cell: (row) => row.employeeCount,
    },
    {
      key: "grossTotal",
      header: "Gross",
      align: "right",
      cell: (row) => <MoneyText value={row.grossTotal} />,
    },
    {
      key: "deductionsTotal",
      header: "Deductions",
      align: "right",
      cell: (row) => <MoneyText value={row.deductionsTotal} />,
    },
    {
      key: "netTotal",
      header: "Net payable",
      align: "right",
      cell: (row) => <MoneyText value={row.netTotal} />,
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

  const lineColumns: PlannedColumn<(typeof previewLines)[number]>[] = [
    {
      key: "employee",
      header: "Employee",
      cell: (line) => (
        <>
          <div className="font-medium">{line.employeeName}</div>
          <div className="text-xs text-muted-foreground">{line.employeeId}</div>
        </>
      ),
    },
    {
      key: "regularHours",
      header: "Hours",
      align: "right",
      cell: (line) => `${line.payableHours} payable / ${line.overtimeHours} OT`,
    },
    {
      key: "basic",
      header: "Basic",
      align: "right",
      cell: (line) => <MoneyText value={line.basicMonthlySalary} />,
    },
    {
      key: "allowances",
      header: "Allowances",
      align: "right",
      cell: (line) => <MoneyText value={line.allowances} compact />,
    },
    {
      key: "overtime",
      header: "Overtime",
      align: "right",
      cell: (line) => <MoneyText value={line.overtimePay} compact />,
    },
    {
      key: "gross",
      header: "Gross",
      align: "right",
      cell: (line) => <MoneyText value={line.grossPay} />,
    },
    {
      key: "tax",
      header: "Tax",
      align: "right",
      cell: (line) => <MoneyText value={line.taxDeduction} compact />,
    },
    {
      key: "net",
      header: "Net",
      align: "right",
      cell: (line) => <MoneyText value={line.netPay} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="hr.payroll" />
      <PlannedBanner sectionKey="hr.payroll" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Gross across runs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={gross} compact />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={deductions} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {percentOf(deductions, gross)} of gross
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Net payable
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={net} compact />
            <div className="text-xs font-normal text-muted-foreground">
              {role === "hr_manager" || role === "admin" ? "Visible to your role" : "Masked"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculation rules already applied</CardTitle>
          <CardDescription>
            payrollLine() derives basic pay from the monthly salary and worked hours, applies
            allowances and pays overtime at {OVERTIME_MULTIPLIER}x, then deducts tax above a{" "}
            <MoneyText value={TAX_EXEMPTION} compact /> exemption.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 text-sm text-muted-foreground">
          <p>
            Hourly rate derived as {hourlyRate(data.employees[0]?.baseMonthlySalary ?? "0.00", "26.00")}{" "}
            per hour from a 26-day month.
          </p>
          <p>
            Sample allowance split: housing {allowanceSample.housing}, transport{" "}
            {allowanceSample.transport}, medical {allowanceSample.medical}.
          </p>
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search payroll runs…"
        filters={["All statuses", "Current year", "All sites"]}
        actions={["New run", "Approve run", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="payroll runs" />
      <PlannedTable columns={runColumns} rows={rows} rowKey={(row) => row.id} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Illustrative payslip lines
        </h2>
        <PlannedTable columns={lineColumns} rows={previewLines} rowKey={(line) => line.employeeId} />
        <p className="text-xs text-muted-foreground">
          Computed live from the 30-day attendance seed with payrollLine() and payrollRun():{" "}
          {computedRun.lines.length} employees, gross{" "}
          <MoneyText value={computedRun.grossTotal} compact />, net{" "}
          <MoneyText value={computedRun.netTotal} compact />. Phase 2 writes these runs to a payslip
          document and posts the journal to accounts.
        </p>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  return (
    <RoleGuard sectionKey="hr.payroll">
      <HydrationGate>
        <PayrollContent />
      </HydrationGate>
    </RoleGuard>
  );
}
