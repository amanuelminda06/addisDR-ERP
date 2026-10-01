import { formatDate, toIsoDay } from "@/lib/format";
import {
  qAdd,
  qCompare,
  qMul,
  qPercentOf,
  qSub,
  qSum,
  q,
  toQ,
  type Quantity,
} from "@/lib/units";
import type { AttendanceRecord, AttendanceStatus, Employee } from "@/lib/types";

export const STANDARD_DAY_HOURS: Quantity = "8.00";
export const MAX_DAILY_OVERTIME_HOURS: Quantity = "4.00";
export const STANDARD_WORKING_DAYS_PER_MONTH = 26;
export const LATE_GRACE_MINUTES = 15;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "Leave",
  holiday: "Holiday",
};

export type Tone = "ok" | "warn" | "danger" | "muted" | "info";

export const ATTENDANCE_STATUS_TONES: Record<AttendanceStatus, Tone> = {
  present: "ok",
  late: "warn",
  absent: "danger",
  leave: "info",
  holiday: "muted",
};

export interface AttendanceSummary {
  totalRecords: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  holiday: number;
  workedDays: number;
  regularHours: Quantity;
  overtimeHours: Quantity;
  totalHours: Quantity;
  attendanceRatePercent: string;
  punctualityRatePercent: string;
  averageHoursPerWorkedDay: Quantity;
}

export function workedStatus(status: AttendanceStatus): boolean {
  return status === "present" || status === "late";
}

export function isAbsence(status: AttendanceStatus): boolean {
  return status === "absent" || status === "leave";
}

export function totalHours(record: AttendanceRecord): Quantity {
  return qAdd(record.regularHours, record.overtimeHours);
}

export function summariseAttendance(records: readonly AttendanceRecord[]): AttendanceSummary {
  const byStatus = (status: AttendanceStatus) => records.filter((r) => r.status === status).length;
  const present = byStatus("present");
  const late = byStatus("late");
  const absent = byStatus("absent");
  const leave = byStatus("leave");
  const holiday = byStatus("holiday");
  const workedDays = present + late;
  const regularHours = qSum(records.map((r) => r.regularHours));
  const overtimeHours = qSum(records.map((r) => r.overtimeHours));
  const total = qAdd(regularHours, overtimeHours);
  return {
    totalRecords: records.length,
    present,
    late,
    absent,
    leave,
    holiday,
    workedDays,
    regularHours,
    overtimeHours,
    totalHours: total,
    attendanceRatePercent: qPercentOf(workedDays, qSum([workedDays, absent, leave])),
    punctualityRatePercent: qPercentOf(present, workedDays),
    averageHoursPerWorkedDay: workedDays === 0 ? "0.00" : toQ(total).dividedBy(workedDays).toFixed(2),
  };
}

export function summariseByEmployee(
  records: readonly AttendanceRecord[],
): Record<string, AttendanceSummary> {
  const grouped = new Map<string, AttendanceRecord[]>();
  for (const record of records) {
    const bucket = grouped.get(record.employeeId);
    if (bucket) bucket.push(record);
    else grouped.set(record.employeeId, [record]);
  }
  const output: Record<string, AttendanceSummary> = {};
  for (const [employeeId, bucket] of grouped) output[employeeId] = summariseAttendance(bucket);
  return output;
}

export function summariseByDate(
  records: readonly AttendanceRecord[],
): Record<string, AttendanceSummary> {
  const grouped = new Map<string, AttendanceRecord[]>();
  for (const record of records) {
    const bucket = grouped.get(record.date);
    if (bucket) bucket.push(record);
    else grouped.set(record.date, [record]);
  }
  const output: Record<string, AttendanceSummary> = {};
  for (const [date, bucket] of grouped) output[date] = summariseAttendance(bucket);
  return output;
}

export type AttendanceAnomalyKind =
  | "missing_punch"
  | "overtime_over_limit"
  | "absent_without_note"
  | "leave_on_weekend"
  | "zero_hours_but_worked";

export interface AttendanceAnomaly {
  id: string;
  kind: AttendanceAnomalyKind;
  employeeId: string;
  employeeName: string;
  date: string;
  detail: string;
  severity: "warning" | "critical";
}

export const ANOMALY_LABELS: Record<AttendanceAnomalyKind, string> = {
  missing_punch: "Missing punch",
  overtime_over_limit: "Overtime over cap",
  absent_without_note: "Absence without note",
  leave_on_weekend: "Leave booked on rest day",
  zero_hours_but_worked: "Zero hours but marked present",
};

export function detectAnomalies(
  records: readonly AttendanceRecord[],
  employees: readonly Employee[],
): AttendanceAnomaly[] {
  const nameById = new Map(employees.map((employee) => [employee.id, employee.name]));
  const anomalies: AttendanceAnomaly[] = [];

  for (const record of records) {
    const employeeName = nameById.get(record.employeeId) ?? record.employeeId;
    const base = {
      id: `${record.id}_${record.employeeId}`,
      employeeId: record.employeeId,
      employeeName,
      date: record.date,
    };

    if (workedStatus(record.status)) {
      if (!record.checkIn || !record.checkOut) {
        anomalies.push({
          ...base,
          kind: "missing_punch",
          detail: `${formatDate(record.date, "dd MMM")} — ${employeeName} has an incomplete punch pair.`,
          severity: "warning",
        });
      }
      if (toQ(record.regularHours).isZero()) {
        anomalies.push({
          ...base,
          kind: "zero_hours_but_worked",
          detail: `${formatDate(record.date, "dd MMM")} — ${employeeName} is marked ${record.status} with 0 logged hours.`,
          severity: "warning",
        });
      }
    }

    if (qCompare(record.overtimeHours, MAX_DAILY_OVERTIME_HOURS) > 0) {
      anomalies.push({
        ...base,
        kind: "overtime_over_limit",
        detail: `${formatDate(record.date, "dd MMM")} — ${employeeName} logged ${q(record.overtimeHours, 1)} h overtime (cap ${MAX_DAILY_OVERTIME_HOURS} h).`,
        severity: "critical",
      });
    }

    if (record.status === "absent" && !record.note) {
      anomalies.push({
        ...base,
        kind: "absent_without_note",
        detail: `${formatDate(record.date, "dd MMM")} — ${employeeName} is absent with no reason recorded.`,
        severity: "warning",
      });
    }

    const weekday = new Date(`${record.date}T00:00:00`).getDay();
    if (record.status === "leave" && weekday === 0) {
      anomalies.push({
        ...base,
        kind: "leave_on_weekend",
        detail: `${formatDate(record.date, "dd MMM")} — ${employeeName} has leave booked on a Sunday.`,
        severity: "warning",
      });
    }
  }

  return anomalies;
}

export function anomalyCounts(anomalies: readonly AttendanceAnomaly[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const anomaly of anomalies) {
    counts[anomaly.kind] = (counts[anomaly.kind] ?? 0) + 1;
  }
  return counts;
}

export function attendanceDates(
  records: readonly AttendanceRecord[],
): { date: string; label: string }[] {
  const dates = Array.from(new Set(records.map((record) => record.date))).sort();
  return dates.map((date) => ({ date, label: formatDate(date, "dd MMM") }));
}

export function recordsForDate(
  records: readonly AttendanceRecord[],
  date: string,
): AttendanceRecord[] {
  return records.filter((record) => record.date === date);
}

export function findRecord(
  records: readonly AttendanceRecord[],
  employeeId: string,
  date: string,
): AttendanceRecord | null {
  return (
    records.find((record) => record.employeeId === employeeId && record.date === date) ?? null
  );
}

export function dailyTotals(
  records: readonly AttendanceRecord[],
  date: string,
): { regularHours: Quantity; overtimeHours: Quantity; totalHours: Quantity; headcount: number } {
  const scoped = recordsForDate(records, date);
  const regularHours = qSum(scoped.map((r) => r.regularHours));
  const overtimeHours = qSum(scoped.map((r) => r.overtimeHours));
  return {
    regularHours,
    overtimeHours,
    totalHours: qAdd(regularHours, overtimeHours),
    headcount: scoped.filter((r) => workedStatus(r.status)).length,
  };
}

export function lastNDates(records: readonly AttendanceRecord[], days: number): string[] {
  const dates = Array.from(new Set(records.map((record) => record.date))).sort();
  return dates.slice(-days);
}

export function hoursForEmployeeOnDate(
  records: readonly AttendanceRecord[],
  employeeId: string,
  date: string,
): Quantity {
  const record = findRecord(records, employeeId, date);
  return record ? totalHours(record) : "0.00";
}

export function buildGrid(
  records: readonly AttendanceRecord[],
  employees: readonly Employee[],
  dates: readonly string[],
): Record<string, Record<string, AttendanceStatus | null>> {
  const grid: Record<string, Record<string, AttendanceStatus | null>> = {};
  for (const employee of employees) {
    grid[employee.id] = {};
    for (const date of dates) {
      grid[employee.id][date] = findRecord(records, employee.id, date)?.status ?? null;
    }
  }
  return grid;
}

export function employeeAbsenceDays(
  records: readonly AttendanceRecord[],
  employeeId: string,
): number {
  return records.filter(
    (record) => record.employeeId === employeeId && isAbsence(record.status),
  ).length;
}

export function overtimeForEmployee(
  records: readonly AttendanceRecord[],
  employeeId: string,
): Quantity {
  return qSum(
    records.filter((record) => record.employeeId === employeeId).map((r) => r.overtimeHours),
  );
}

export function payableHours(
  records: readonly AttendanceRecord[],
  employeeId: string,
  overtimeMultiplier: Quantity = "1.50",
): Quantity {
  const scoped = records.filter((record) => record.employeeId === employeeId);
  const regular = qSum(scoped.map((r) => r.regularHours));
  const overtime = qSum(scoped.map((r) => r.overtimeHours));
  return qAdd(regular, qMul(overtime, overtimeMultiplier));
}

export function attendancePercentForRange(
  records: readonly AttendanceRecord[],
  from: string,
  to: string,
): string {
  const scoped = records.filter((record) => record.date >= from && record.date <= to);
  return summariseAttendance(scoped).attendanceRatePercent;
}

export function isSameDay(a: string, b: string): boolean {
  return toIsoDay(a) === toIsoDay(b);
}

export function unrecordedEmployees(
  records: readonly AttendanceRecord[],
  employees: readonly Employee[],
  date: string,
): Employee[] {
  return employees.filter((employee) => !findRecord(records, employee.id, date));
}

export function headcountOnDate(
  records: readonly AttendanceRecord[],
  date: string,
): number {
  return recordsForDate(records, date).filter((record) => workedStatus(record.status)).length;
}

export function shortfallToTarget(
  records: readonly AttendanceRecord[],
  employees: readonly Employee[],
  targetPercent = 90,
): string {
  const rate = Number(summariseAttendance(records).attendanceRatePercent);
  const gap = targetPercent - rate;
  return q(gap, 1);
}

export function hoursDeltaAgainstStandard(
  records: readonly AttendanceRecord[],
): Quantity {
  const workedDays = summariseAttendance(records).workedDays;
  return qSub(qSum(records.map((r) => r.regularHours)), qMul(STANDARD_DAY_HOURS, workedDays));
}
