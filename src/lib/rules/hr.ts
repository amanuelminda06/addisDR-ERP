import { addMoney, divMoney, money, mulMoney, percentOf, subMoney, sumBy, toDecimal, type Money } from "@/lib/money";
import { daysBetween, pluralize, toDate } from "@/lib/format";
import { qAdd, qMul, qSub, q, toQ, type Quantity } from "@/lib/units";
import { STANDARD_WORKING_DAYS_PER_MONTH } from "./attendance";
import type { AttendanceRecord, Employee, LeaveRequest, Timesheet } from "@/lib/types";

export const ANNUAL_LEAVE_ENTITLEMENT_DAYS: Quantity = "24.00";
export const SICK_LEAVE_ENTITLEMENT_DAYS: Quantity = "10.00";
export const OVERTIME_MULTIPLIER: Quantity = "1.50";
export const HOUSING_ALLOWANCE_RATE = "0.05";
export const TRANSPORT_ALLOWANCE_RATE = "0.03";
export const MEDICAL_ALLOWANCE_RATE = "0.04";
export const TAX_EXEMPTION: Money = "15000.00";

export const EMPLOYMENT_STATUS_LABELS: Record<Employee["status"], string> = {
  active: "Active",
  on_leave: "On leave",
  probation: "Probation",
  inactive: "Inactive",
};

export const DEPARTMENT_LABELS: Record<Employee["department"], string> = {
  site: "Site & Engineering",
  procurement: "Procurement",
  finance: "Finance",
  hr: "Human Resources",
  commercial: "Commercial",
  health_safety: "Health & Safety",
};

export const EMPLOYMENT_TYPE_LABELS: Record<Employee["employmentType"], string> = {
  full_time: "Full time",
  contract: "Contract",
  subcontract: "Subcontract",
};

export interface HeadcountSummary {
  total: number;
  active: number;
  onLeave: number;
  probation: number;
  inactive: number;
  byDepartment: { department: Employee["department"]; label: string; count: number }[];
  monthlyPayrollCost: Money;
  averageSalary: Money;
}

export function headcountSummary(employees: readonly Employee[]): HeadcountSummary {
  const byDepartment = Array.from(new Set(employees.map((employee) => employee.department))).map(
    (department) => ({
      department,
      label: DEPARTMENT_LABELS[department],
      count: employees.filter((employee) => employee.department === department).length,
    }),
  );
  const active = employees.filter((employee) => employee.status === "active");
  const monthlyPayrollCost = sumBy(active, (employee) => employee.baseMonthlySalary);
  return {
    total: employees.length,
    active: active.length,
    onLeave: employees.filter((employee) => employee.status === "on_leave").length,
    probation: employees.filter((employee) => employee.status === "probation").length,
    inactive: employees.filter((employee) => employee.status === "inactive").length,
    byDepartment,
    monthlyPayrollCost,
    averageSalary: employees.length === 0 ? "0.00" : money(divMoney(monthlyPayrollCost, active.length || 1, 2)),
  };
}

export interface PayrollLine {
  employeeId: string;
  employeeName: string;
  basicMonthlySalary: Money;
  payableHours: Quantity;
  overtimeHours: Quantity;
  overtimePay: Money;
  allowances: Money;
  grossPay: Money;
  taxDeduction: Money;
  netPay: Money;
}

export function hourlyRate(monthlySalary: Money, hoursPerMonth: Quantity): Money {
  return money(divMoney(monthlySalary, hoursPerMonth, 4));
}

export function allowancesFor(monthlySalary: Money): {
  housing: Money;
  transport: Money;
  medical: Money;
  total: Money;
} {
  const housing = money(mulMoney(monthlySalary, HOUSING_ALLOWANCE_RATE));
  const transport = money(mulMoney(monthlySalary, TRANSPORT_ALLOWANCE_RATE));
  const medical = money(mulMoney(monthlySalary, MEDICAL_ALLOWANCE_RATE));
  return { housing, transport, medical, total: addMoney(housing, transport, medical) };
}

export function taxDeductionFor(taxable: Money): Money {
  const excess = subMoney(taxable, TAX_EXEMPTION);
  if (toDecimal(excess).isNegative() || toDecimal(excess).isZero()) return "0.00";
  const rate = toDecimal(excess).lte("50000") ? toDecimal("0.05") : toDecimal("0.10");
  return money(divMoney(excess, String(toDecimal("1").plus(rate)), 4));
}

export function payrollLine(
  employee: Employee,
  records: readonly AttendanceRecord[],
): PayrollLine {
  const scoped = records.filter((record) => record.employeeId === employee.id);
  const regularHours = qSumHours(scoped.map((record) => record.regularHours));
  const overtimeHours = qSumHours(scoped.map((record) => record.overtimeHours));
  const rate = hourlyRate(employee.baseMonthlySalary, String(STANDARD_WORKING_DAYS_PER_MONTH * 8));
  const overtimePay = money(divMoney(mulMoney(rate, overtimeHours), "1", 4));
  const allowances = allowancesFor(employee.baseMonthlySalary);
  const grossPay = addMoney(employee.baseMonthlySalary, overtimePay, allowances.total);
  const tax = taxDeductionFor(grossPay);
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    basicMonthlySalary: money(employee.baseMonthlySalary),
    payableHours: qAdd(regularHours, qMul(overtimeHours, OVERTIME_MULTIPLIER)),
    overtimeHours,
    overtimePay,
    allowances: allowances.total,
    grossPay,
    taxDeduction: tax,
    netPay: subMoney(grossPay, tax),
  };
}

function qSumHours(values: readonly string[]): Quantity {
  return q(
    values.reduce((acc, value) => acc.plus(toQ(value)), toQ(0)),
    2,
  );
}

export function payrollRun(
  employees: readonly Employee[],
  records: readonly AttendanceRecord[],
): { lines: PayrollLine[]; grossTotal: Money; deductionsTotal: Money; netTotal: Money; headcount: number } {
  const active = employees.filter((employee) => employee.status === "active");
  const lines = active.map((employee) => payrollLine(employee, records));
  const grossTotal = sumBy(lines, (line) => line.grossPay);
  const deductionsTotal = sumBy(lines, (line) => line.taxDeduction);
  return {
    lines,
    grossTotal,
    deductionsTotal,
    netTotal: subMoney(grossTotal, deductionsTotal),
    headcount: lines.length,
  };
}

export function overtimeCostEstimate(records: readonly AttendanceRecord[], hourlyRateValue: Money): Money {
  const overtimeHours = qSumHours(records.map((record) => record.overtimeHours));
  return money(divMoney(mulMoney(hourlyRateValue, overtimeHours), "1", 4));
}

export function leaveBalance(
  requests: readonly LeaveRequest[],
  employeeId: string,
  type: LeaveRequest["leaveType"] = "annual",
): Quantity {
  const entitlement =
    type === "sick" ? SICK_LEAVE_ENTITLEMENT_DAYS : ANNUAL_LEAVE_ENTITLEMENT_DAYS;
  const taken = qSumHours(
    requests
      .filter((request) => request.employeeId === employeeId && request.leaveType === type)
      .filter((request) => request.status === "approved")
      .map((request) => request.days),
  );
  return qSub(entitlement, taken);
}

export function leaveRequestsFor(
  requests: readonly LeaveRequest[],
  employeeId: string,
): LeaveRequest[] {
  return requests.filter((request) => request.employeeId === employeeId);
}

export function overlappingLeave(
  requests: readonly LeaveRequest[],
  employeeId: string,
  startDate: string,
  endDate: string,
): LeaveRequest[] {
  return requests.filter(
    (request) =>
      request.employeeId === employeeId &&
      request.startDate <= endDate &&
      request.endDate >= startDate &&
      request.status !== "cancelled" &&
      request.status !== "rejected",
  );
}

export function canApproveLeave(role: string): boolean {
  return role === "hr_manager" || role === "admin";
}

export function leaveDurationDays(startDate: string, endDate: string): Quantity {
  return q(Math.max(1, daysBetween(startDate, endDate) + 1), 2);
}

export function timesheetTotals(
  timesheets: readonly Timesheet[],
  employeeId?: string,
): { regular: Quantity; overtime: Quantity; total: Quantity; count: number } {
  const scoped = employeeId
    ? timesheets.filter((timesheet) => timesheet.employeeId === employeeId)
    : timesheets;
  const regular = qSumHours(scoped.map((timesheet) => timesheet.regularHours));
  const overtime = qSumHours(scoped.map((timesheet) => timesheet.overtimeHours));
  return { regular, overtime, total: qAdd(regular, overtime), count: scoped.length };
}

export function timesheetMatchesAttendance(
  timesheet: Timesheet,
  records: readonly AttendanceRecord[],
): { matches: boolean; attendanceHours: Quantity; delta: Quantity } {
  const scoped = records.filter(
    (record) =>
      record.employeeId === timesheet.employeeId &&
      record.date >= timesheet.weekStart &&
      record.date <= timesheet.weekEnd,
  );
  const attendanceHours = qSumHours(scoped.map((record) => record.regularHours));
  const claimed = toQ(timesheet.regularHours);
  const delta = q(claimed.minus(attendanceHours), 2);
  return { matches: toQ(delta).isZero(), attendanceHours, delta };
}

export function contractExpiryWarning(employee: Employee, asOf: string | Date = new Date()): string | null {
  const tenureDays = daysBetween(employee.joinedOn, asOf);
  if (employee.status === "probation" && tenureDays > 90) {
    return "Probation period exceeded 90 days without confirmation.";
  }
  if (employee.status === "inactive" && tenureDays > 30) {
    return "Marked inactive for more than 30 days.";
  }
  return null;
}

export function salaryBandUtilisation(
  salary: Money,
  bandMin: Money,
  bandMax: Money,
): string {
  const span = subMoney(bandMax, bandMin);
  if (toDecimal(span).isZero()) return "0.0";
  return percentOf(subMoney(salary, bandMin), span, 1);
}

/**
 * Whole years and whole months of service, as integers only — no fractional
 * month arithmetic. Months are counted by advancing the anniversary month and
 * clamping the day, so 31 Jan → 28/29 Feb resolves rather than overflowing.
 */
export interface ServiceTenure {
  years: number;
  months: number;
  totalMonths: number;
  isCompleted: boolean;
}

export function serviceTenure(joinedOn: string, asOf: string | Date = new Date()): ServiceTenure {
  const start = new Date(`${joinedOn}T00:00:00`);
  const end = toDate(asOf);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { years: 0, months: 0, totalMonths: 0, isCompleted: false };
  }
  if (end < start) return { years: 0, months: 0, totalMonths: 0, isCompleted: false };

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const endDay = end.getDate();
  const daysInAnniversaryMonth = new Date(
    end.getFullYear(),
    end.getMonth() + 1,
    0,
  ).getDate();
  if (endDay < Math.min(start.getDate(), daysInAnniversaryMonth)) months -= 1;
  if (months < 0) months = 0;

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalMonths: months,
    isCompleted: months > 0,
  };
}

export function tenureLabel(tenure: ServiceTenure): string {
  if (tenure.totalMonths === 0) return "Joined this month";
  if (tenure.years === 0) {
    return pluralize(tenure.months, "month");
  }
  if (tenure.months === 0) {
    return pluralize(tenure.years, "year");
  }
  return `${pluralize(tenure.years, "year")}, ${pluralize(tenure.months, "month")}`;
}

export function headcountPerProject(
  employees: readonly Employee[],
): Record<string, number> {
  const output: Record<string, number> = {};
  for (const employee of employees) {
    if (!employee.projectId) continue;
    output[employee.projectId] = (output[employee.projectId] ?? 0) + 1;
  }
  return output;
}
