import { makeId } from "@/lib/id";
import type { AuditEntry, AuditSeverity, Role, User } from "@/lib/types";

export const AUDIT_ACTIONS = {
  demoSeeded: "demo.seeded",
  demoReset: "demo.reset",
  roleChanged: "session.role_changed",
  notificationRead: "notification.read",
  notificationReadAll: "notification.read_all",
  projectViewed: "project.viewed",
  projectStatusChanged: "project.status_changed",
  projectProgressChanged: "project.progress_changed",
  budgetLineAmountChanged: "budget.line_amount_changed",
  supplierRated: "supplier.rated",
  supplierStatusChanged: "supplier.status_changed",
  attendanceCorrected: "attendance.corrected",
  employeeStatusChanged: "employee.status_changed",
  purchaseRequestSubmitted: "procurement.pr_submitted",
  purchaseRequestApproved: "procurement.pr_approved",
  purchaseOrderIssued: "procurement.po_issued",
  goodsReceiptPosted: "procurement.receipt_posted",
  invoiceSent: "finance.invoice_sent",
  expenseApproved: "finance.expense_approved",
  payrollApproved: "hr.payroll_approved",
  leaveApproved: "hr.leave_approved",
  accessDenied: "access.denied",
} as const;

export type AuditActionKey = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "demo.seeded": "Demo data seeded",
  "demo.reset": "Demo data reset",
  "session.role_changed": "Active role changed",
  "notification.read": "Notification marked read",
  "notification.read_all": "All notifications marked read",
  "project.viewed": "Project opened",
  "project.status_changed": "Project status changed",
  "project.progress_changed": "Project progress updated",
  "budget.line_amount_changed": "Budget line amount changed",
  "supplier.rated": "Supplier rating updated",
  "supplier.status_changed": "Supplier panel status changed",
  "attendance.corrected": "Attendance record corrected",
  "employee.status_changed": "Employee status changed",
  "procurement.pr_submitted": "Purchase request submitted",
  "procurement.pr_approved": "Purchase request approved",
  "procurement.po_issued": "Purchase order issued",
  "procurement.receipt_posted": "Goods receipt posted",
  "finance.invoice_sent": "Invoice issued",
  "finance.expense_approved": "Expense approved",
  "hr.payroll_approved": "Payroll run approved",
  "hr.leave_approved": "Leave request approved",
  "access.denied": "Access denied",
};

export const CRITICAL_ACTIONS = new Set<string>([
  AUDIT_ACTIONS.demoReset,
  AUDIT_ACTIONS.roleChanged,
  AUDIT_ACTIONS.purchaseRequestApproved,
  AUDIT_ACTIONS.purchaseOrderIssued,
  AUDIT_ACTIONS.expenseApproved,
  AUDIT_ACTIONS.payrollApproved,
  AUDIT_ACTIONS.budgetLineAmountChanged,
  AUDIT_ACTIONS.accessDenied,
]);

export interface AuditInput {
  actor: Pick<User, "id" | "name" | "role">;
  action: string;
  entity: string;
  entityId: string;
  entityLabel: string;
  field?: string | null;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
  summary?: string | null;
  severity?: AuditSeverity;
  at?: string;
  id?: string;
}

function stringify(value: AuditInput["oldValue"]): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function severityForAction(action: string, override?: AuditSeverity): AuditSeverity {
  if (override) return override;
  if (CRITICAL_ACTIONS.has(action)) return "critical";
  if (action.includes("denied") || action.includes("reset")) return "warning";
  return "info";
}

export function actionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function diffText(input: Pick<AuditInput, "field" | "oldValue" | "newValue">): string | null {
  if (!input.field) return null;
  const oldValue = stringify(input.oldValue) ?? "—";
  const newValue = stringify(input.newValue) ?? "—";
  return `${input.field}: ${oldValue} → ${newValue}`;
}

export function createAuditEntry(input: AuditInput): AuditEntry {
  const diff = diffText(input);
  const summary = input.summary ?? diff ?? actionLabel(input.action);
  return {
    id: input.id ?? makeId("aud"),
    at: input.at ?? new Date().toISOString(),
    actorUserId: input.actor.id,
    actorName: input.actor.name,
    actorRole: input.actor.role,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    field: input.field ?? null,
    oldValue: stringify(input.oldValue),
    newValue: stringify(input.newValue),
    summary,
    severity: severityForAction(input.action, input.severity),
  };
}

export function logAction(entries: readonly AuditEntry[], input: AuditInput): AuditEntry[] {
  return [createAuditEntry(input), ...entries];
}

export interface AuditFilter {
  query?: string;
  actorRole?: Role | "all";
  action?: string | "all";
  severity?: AuditSeverity | "all";
  entity?: string | "all";
}

export function filterAudit(entries: readonly AuditEntry[], filter: AuditFilter): AuditEntry[] {
  const query = filter.query?.trim().toLowerCase() ?? "";
  return entries.filter((entry) => {
    if (filter.actorRole && filter.actorRole !== "all" && entry.actorRole !== filter.actorRole) {
      return false;
    }
    if (filter.action && filter.action !== "all" && entry.action !== filter.action) {
      return false;
    }
    if (filter.severity && filter.severity !== "all" && entry.severity !== filter.severity) {
      return false;
    }
    if (filter.entity && filter.entity !== "all" && entry.entity !== filter.entity) {
      return false;
    }
    if (query) {
      const haystack = [
        entry.actorName,
        entry.action,
        actionLabel(entry.action),
        entry.entity,
        entry.entityLabel,
        entry.summary,
        entry.oldValue ?? "",
        entry.newValue ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function auditStats(entries: readonly AuditEntry[]): {
  total: number;
  bySeverity: Record<AuditSeverity, number>;
  lastActionAt: string | null;
  actors: number;
} {
  const bySeverity: Record<AuditSeverity, number> = { info: 0, warning: 0, critical: 0 };
  const actors = new Set<string>();
  for (const entry of entries) {
    bySeverity[entry.severity] += 1;
    actors.add(entry.actorUserId);
  }
  return {
    total: entries.length,
    bySeverity,
    lastActionAt: entries[0]?.at ?? null,
    actors: actors.size,
  };
}

export function changesByEntity(entries: readonly AuditEntry[]): Record<string, number> {
  const output: Record<string, number> = {};
  for (const entry of entries) {
    output[entry.entity] = (output[entry.entity] ?? 0) + 1;
  }
  return output;
}

export function timelineGroupedByDay(
  entries: readonly AuditEntry[],
): { date: string; entries: AuditEntry[] }[] {
  const groups = new Map<string, AuditEntry[]>();
  for (const entry of entries) {
    const day = entry.at.slice(0, 10);
    const bucket = groups.get(day);
    if (bucket) bucket.push(entry);
    else groups.set(day, [entry]);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dayEntries]) => ({ date, entries: dayEntries }));
}
