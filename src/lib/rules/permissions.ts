import type { Role } from "@/lib/types";

export type ModuleKey =
  | "dashboard"
  | "projects"
  | "procurement"
  | "hr"
  | "finance"
  | "crm"
  | "audit";

export type ActionKey =
  | "project.view"
  | "project.edit"
  | "project.create"
  | "budget.view"
  | "budget.edit"
  | "procurement.request.create"
  | "procurement.request.approve"
  | "procurement.order.create"
  | "procurement.order.approve"
  | "procurement.receipt.record"
  | "supplier.view"
  | "supplier.manage"
  | "hr.employee.view"
  | "hr.employee.manage"
  | "hr.attendance.view"
  | "hr.attendance.manage"
  | "hr.payroll.view"
  | "hr.payroll.run"
  | "hr.leave.approve"
  | "finance.view"
  | "finance.invoice.manage"
  | "finance.expense.approve"
  | "finance.report.export"
  | "crm.view"
  | "crm.client.manage"
  | "crm.lead.manage"
  | "audit.view"
  | "audit.export"
  | "demo.reset"
  | "role.switch";

export const ALL_ROLES: Role[] = [
  "site_engineer",
  "procurement_officer",
  "approver",
  "hr_manager",
  "admin",
];

export const ROLE_LABELS: Record<Role, string> = {
  site_engineer: "Site Engineer",
  procurement_officer: "Procurement Officer",
  approver: "Approver",
  hr_manager: "HR Manager",
  admin: "Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  site_engineer: "Owns site execution: progress capture, variation inputs, material requests.",
  procurement_officer: "Owns the buy-side: supplier panel, requests, orders and receipts.",
  approver: "Controls spend release: PR/PO approval, invoice release, audit oversight.",
  hr_manager: "Owns workforce: contracts, attendance, leave, payroll preparation.",
  admin: "Full visibility across every module, plus demo administration.",
};

const MODULE_ACCESS: Record<ModuleKey, Role[]> = {
  dashboard: ["site_engineer", "procurement_officer", "approver", "hr_manager", "admin"],
  projects: ["site_engineer", "procurement_officer", "approver", "hr_manager", "admin"],
  procurement: ["site_engineer", "procurement_officer", "approver", "admin"],
  hr: ["site_engineer", "hr_manager", "admin"],
  finance: ["procurement_officer", "approver", "hr_manager", "admin"],
  crm: ["site_engineer", "approver", "admin"],
  audit: ["approver", "admin"],
};

const ACTION_ACCESS: Record<ActionKey, Role[]> = {
  "project.view": ["site_engineer", "procurement_officer", "approver", "hr_manager", "admin"],
  "project.edit": ["site_engineer", "admin"],
  "project.create": ["approver", "admin"],
  "budget.view": ["site_engineer", "procurement_officer", "approver", "hr_manager", "admin"],
  "budget.edit": ["approver", "admin"],
  "procurement.request.create": ["site_engineer", "procurement_officer", "admin"],
  "procurement.request.approve": ["approver", "admin"],
  "procurement.order.create": ["procurement_officer", "admin"],
  "procurement.order.approve": ["approver", "admin"],
  "procurement.receipt.record": ["site_engineer", "procurement_officer", "admin"],
  "supplier.view": ["site_engineer", "procurement_officer", "approver", "admin"],
  "supplier.manage": ["procurement_officer", "admin"],
  "hr.employee.view": ["site_engineer", "hr_manager", "admin"],
  "hr.employee.manage": ["hr_manager", "admin"],
  "hr.attendance.view": ["site_engineer", "hr_manager", "admin"],
  "hr.attendance.manage": ["hr_manager", "admin"],
  "hr.payroll.view": ["hr_manager", "admin"],
  "hr.payroll.run": ["hr_manager", "admin"],
  "hr.leave.approve": ["hr_manager", "admin"],
  "finance.view": ["procurement_officer", "approver", "hr_manager", "admin"],
  "finance.invoice.manage": ["procurement_officer", "approver", "admin"],
  "finance.expense.approve": ["approver", "hr_manager", "admin"],
  "finance.report.export": ["approver", "admin"],
  "crm.view": ["site_engineer", "approver", "admin"],
  "crm.client.manage": ["approver", "admin"],
  "crm.lead.manage": ["site_engineer", "approver", "admin"],
  "audit.view": ["approver", "admin"],
  "audit.export": ["approver", "admin"],
  "demo.reset": ["admin"],
  "role.switch": ["site_engineer", "procurement_officer", "approver", "hr_manager", "admin"],
};

export const ACTION_LABELS: Record<ActionKey, string> = {
  "project.view": "View projects",
  "project.edit": "Update project records",
  "project.create": "Create project",
  "budget.view": "View budget lines",
  "budget.edit": "Amend budget lines",
  "procurement.request.create": "Raise purchase request",
  "procurement.request.approve": "Approve purchase request",
  "procurement.order.create": "Issue purchase order",
  "procurement.order.approve": "Approve purchase order",
  "procurement.receipt.record": "Record goods receipt",
  "supplier.view": "View supplier panel",
  "supplier.manage": "Add / edit suppliers",
  "hr.employee.view": "View employees",
  "hr.employee.manage": "Add / edit employees",
  "hr.attendance.view": "View attendance",
  "hr.attendance.manage": "Correct attendance",
  "hr.payroll.view": "View payroll",
  "hr.payroll.run": "Run payroll",
  "hr.leave.approve": "Approve leave",
  "finance.view": "View finance",
  "finance.invoice.manage": "Create / send invoices",
  "finance.expense.approve": "Approve expenses",
  "finance.report.export": "Export finance reports",
  "crm.view": "View CRM",
  "crm.client.manage": "Manage clients",
  "crm.lead.manage": "Manage pipeline",
  "audit.view": "View audit log",
  "audit.export": "Export audit log",
  "demo.reset": "Reset demo data",
  "role.switch": "Switch active role",
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  procurement: "Procurement",
  hr: "Human Resources",
  finance: "Finance",
  crm: "CRM",
  audit: "Audit Log",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function roleDescription(role: Role): string {
  return ROLE_DESCRIPTIONS[role] ?? "";
}

export function isRole(value: string): value is Role {
  return ALL_ROLES.includes(value as Role);
}

export function canAccessModule(role: Role, moduleKey: ModuleKey): boolean {
  return MODULE_ACCESS[moduleKey].includes(role);
}

export function canPerformAction(role: Role, action: ActionKey): boolean {
  return ACTION_ACCESS[action].includes(role);
}

export function allowedActions(role: Role): ActionKey[] {
  return (Object.keys(ACTION_ACCESS) as ActionKey[]).filter((action) =>
    ACTION_ACCESS[action].includes(role),
  );
}

export function deniedActions(role: Role): ActionKey[] {
  return (Object.keys(ACTION_ACCESS) as ActionKey[]).filter(
    (action) => !ACTION_ACCESS[action].includes(role),
  );
}

export function rolesWithAction(action: ActionKey): Role[] {
  return ACTION_ACCESS[action];
}

export function isModuleKey(value: string): value is ModuleKey {
  return value in MODULE_ACCESS;
}
