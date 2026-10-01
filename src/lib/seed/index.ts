import { subDays, subHours, subMinutes, format } from "date-fns";
import { buildCoreSeed, SEED_VERSION } from "./core";
import { buildPreviewSeed } from "./preview";
import { createAuditEntry, type AuditInput } from "@/lib/rules/audit";
import type { AppNotification, AuditEntry, Role, User } from "@/lib/types";

export interface SeedState {
  seedVersion: string;
  seededAt: string;
  users: User[];
  employees: ReturnType<typeof buildCoreSeed>["employees"];
  clients: ReturnType<typeof buildCoreSeed>["clients"];
  projects: ReturnType<typeof buildCoreSeed>["projects"];
  suppliers: ReturnType<typeof buildCoreSeed>["suppliers"];
  attendance: ReturnType<typeof buildCoreSeed>["attendance"];
  attendanceFrom: string;
  attendanceTo: string;
  preview: ReturnType<typeof buildPreviewSeed>;
  notifications: AppNotification[];
  audit: AuditEntry[];
}

export { SEED_VERSION, buildCoreSeed, buildPreviewSeed };

export function buildSeedState(now: Date = new Date()): SeedState {
  const core = buildCoreSeed(now);
  const preview = buildPreviewSeed(core.projects, core.suppliers, core.employees, core.clients, now);
  const usersById = new Map(core.users.map((user) => [user.id, user]));

  const notifications: AppNotification[] = [
    {
      id: "ntf_001",
      title: "Materials budget line over committed value",
      body: "PRJ-2401 · Structural steel, rebar and concrete supply is 5.3% over its budgeted value.",
      severity: "critical",
      moduleKey: "projects",
      createdAt: subHours(now, 1).toISOString(),
      read: false,
      roleHint: "approver",
    },
    {
      id: "ntf_002",
      title: "Purchase request awaiting approval",
      body: "PR-2026-0410 for PRJ-2401 is over the procurement delegated limit.",
      severity: "warning",
      moduleKey: "procurement",
      createdAt: subHours(now, 3).toISOString(),
      read: false,
      roleHint: "approver",
    },
    {
      id: "ntf_003",
      title: "Overtime above daily cap detected",
      body: "Attendance import flagged overtime beyond 4.00 h on 2 records this period.",
      severity: "warning",
      moduleKey: "hr",
      createdAt: subHours(now, 5).toISOString(),
      read: false,
      roleHint: "hr_manager",
    },
    {
      id: "ntf_004",
      title: "Supplier insurance expiring",
      body: "Volt & Pipe Systems insurance lapsed 3 weeks ago — renew before further orders.",
      severity: "critical",
      moduleKey: "procurement",
      createdAt: subHours(now, 26).toISOString(),
      read: false,
      roleHint: "procurement_officer",
    },
    {
      id: "ntf_005",
      title: "Progress behind programme",
      body: "PRJ-2401 is 4.6 points behind the time-scaled plan for this stage.",
      severity: "warning",
      moduleKey: "projects",
      createdAt: subDays(now, 1).toISOString(),
      read: false,
      roleHint: "site_engineer",
    },
    {
      id: "ntf_006",
      title: "Ret releasable to Meridian Development Group",
      body: "Three certified claims are past the 180-day retention release window.",
      severity: "info",
      moduleKey: "finance",
      createdAt: subDays(now, 2).toISOString(),
      read: true,
      roleHint: "all",
    },
  ];

  const auditSeed: AuditInput[] = [
    {
      actor: userActor(usersById, "usr_engineer"),
      action: "project.progress_changed",
      entity: "project",
      entityId: "prj_2401",
      entityLabel: "PRJ-2401 · Meridian Riverside Tower — Phase 2",
      field: "progressPercent",
      oldValue: "58",
      newValue: "62",
      summary: "Progress updated after level 14 envelope sign-off.",
      at: subHours(now, 20).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_procurement"),
      action: "procurement.po_issued",
      entity: "purchaseOrder",
      entityId: "po_001",
      entityLabel: "PO-2026-1180 · Steelcore Metals Ltd",
      field: "status",
      oldValue: "draft",
      newValue: "issued",
      summary: "PO issued against approved PR-2026-0410.",
      at: subHours(now, 27).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_approver"),
      action: "procurement.pr_approved",
      entity: "purchaseRequest",
      entityId: "pr_001",
      entityLabel: "PR-2026-0410 · Level 14–18 curtain wall brackets",
      field: "status",
      oldValue: "under_review",
      newValue: "approved",
      summary: "Approved above delegated limit — programme risk accepted.",
      at: subHours(now, 30).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_hr"),
      action: "employee.status_changed",
      entity: "employee",
      entityId: "emp_008",
      entityLabel: "BW-2008 · Sarah Njoku",
      field: "status",
      oldValue: "active",
      newValue: "on_leave",
      summary: "Unpaid leave approved for 10 days.",
      at: subDays(now, 1).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_admin"),
      action: "supplier.status_changed",
      entity: "supplier",
      entityId: "sup_0003",
      entityLabel: "SUP-003 · Volt & Pipe Systems",
      field: "status",
      oldValue: "approved",
      newValue: "under_review",
      summary: "Moved to review after two late MEP deliveries.",
      at: subDays(now, 2).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_approver"),
      action: "finance.invoice_sent",
      entity: "invoice",
      entityId: "inv_003",
      entityLabel: "INV-2026-2202 · Halcyon Infrastructure Partners",
      field: "status",
      oldValue: "draft",
      newValue: "sent",
      summary: "Progress claim 3 issued with retention deducted.",
      at: subDays(now, 3).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_engineer"),
      action: "attendance.corrected",
      entity: "attendance",
      entityId: `att_${format(subDays(now, 6), "yyyyMMdd")}_001`,
      entityLabel: "BW-1001 · Yusuf Karim",
      field: "overtimeHours",
      oldValue: "3.00",
      newValue: "2.50",
      summary: "Overtime corrected after supervisor sign-off.",
      at: subDays(now, 6).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_procurement"),
      action: "budget.line_amount_changed",
      entity: "budgetLine",
      entityId: "bl_2401_02",
      entityLabel: "PRJ-2401 · Materials",
      field: "budgetAmount",
      oldValue: "2400000.00",
      newValue: "2640000.00",
      summary: "Steel price index adjustment approved at board level.",
      at: subDays(now, 8).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_approver"),
      action: "session.role_changed",
      entity: "session",
      entityId: "sess_demo",
      entityLabel: "Demo session",
      field: "role",
      oldValue: "site_engineer",
      newValue: "approver",
      summary: "Role switched to Approver for approval walkthrough.",
      at: subMinutes(now, 45).toISOString(),
    },
    {
      actor: userActor(usersById, "usr_admin"),
      action: "access.denied",
      entity: "payrollRun",
      entityId: "pay_003",
      entityLabel: "PR-2026-03 · Current month payroll",
      field: "access",
      oldValue: "procurement_officer",
      newValue: "denied",
      summary: "Payroll access requested by a non-HR role and refused.",
      severity: "warning",
      at: subDays(now, 4).toISOString(),
    },
  ];

  return {
    seedVersion: SEED_VERSION,
    seededAt: now.toISOString(),
    users: core.users,
    employees: core.employees,
    clients: core.clients,
    projects: core.projects,
    suppliers: core.suppliers,
    attendance: core.attendance,
    attendanceFrom: core.attendanceFrom,
    attendanceTo: core.attendanceTo,
    preview,
    notifications,
    audit: auditSeed
      .map((input) => createAuditEntry(input))
      .sort((a, b) => b.at.localeCompare(a.at)),
  };
}

function userActor(
  usersById: Map<string, User>,
  id: string,
): Pick<User, "id" | "name" | "role"> & { role: Role } {
  const user = usersById.get(id);
  return {
    id: user?.id ?? id,
    name: user?.name ?? "System",
    role: (user?.role ?? "admin") as Role,
  };
}
