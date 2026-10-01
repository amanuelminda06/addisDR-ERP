import {
  Banknote,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderKanban,
  Handshake,
  HardHat,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/rules/permissions";
import { ALL_ROLES } from "@/lib/rules/permissions";
import type { Role, SectionStatus } from "@/lib/types";

export interface NavSection {
  key: string;
  label: string;
  href: string;
  status: SectionStatus;
  moduleKey: ModuleKey;
  description: string;
  preview: string;
  phase2Items: string[];
  roles: Role[];
  activePrefix?: string;
  hidesFromSidebar?: boolean;
}

export interface NavModule {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  shortLabel: string;
  description: string;
  sections: NavSection[];
}

const ALL: Role[] = [...ALL_ROLES];
const OFFICE_FINANCE: Role[] = ["procurement_officer", "approver", "hr_manager", "admin"];
const BUY_SIDE: Role[] = ["site_engineer", "procurement_officer", "approver", "admin"];
const WORKFORCE: Role[] = ["site_engineer", "hr_manager", "admin"];
const GOVERNANCE: Role[] = ["approver", "admin"];

export const NAV_MODULES: NavModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    icon: LayoutDashboard,
    description: "Portfolio position, workload and the queue of items waiting on you.",
    sections: [
      {
        key: "dashboard.overview",
        label: "Overview",
        href: "/dashboard",
        status: "live",
        moduleKey: "dashboard",
        description: "Live portfolio KPIs computed from the seeded demo dataset.",
        preview: "Contract value, committed spend, budget health and open items.",
        phase2Items: ["Drill-through to each module", "Personal task queue", "Saved views"],
        roles: ALL,
      },
      {
        key: "dashboard.my-work",
        label: "My Work",
        href: "/dashboard/my-work",
        status: "planned",
        moduleKey: "dashboard",
        description: "Role-aware work queue of requests, approvals and inspections.",
        preview: "A prioritised list of items assigned to the active user.",
        phase2Items: ["Role-scoped queues", "SLA countdown", "Bulk approve"],
        roles: ALL,
      },
      {
        key: "dashboard.kpis",
        label: "KPI Trends",
        href: "/dashboard/kpis",
        status: "planned",
        moduleKey: "dashboard",
        description: "Time series of margin, cost per progress point and cash.",
        preview: "Trend tables for margin, budget usage and receivables.",
        phase2Items: ["Charted time series", "Target vs actual", "Export to PDF"],
        roles: ALL,
      },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    shortLabel: "Projects",
    icon: HardHat,
    description: "Live project register, budget lines and delivery position.",
    sections: [
      {
        key: "projects.list",
        label: "Project List",
        href: "/projects",
        status: "live",
        moduleKey: "projects",
        description: "Every project with progress, budget health and schedule variance.",
        preview: "Register of active and pipeline projects with live rollups.",
        phase2Items: ["Create / edit project", "Change status workflow", "Filters and saved views"],
        roles: ALL,
      },
      {
        key: "projects.detail",
        label: "Project Detail",
        href: "/projects/prj_2401",
        status: "live",
        moduleKey: "projects",
        description: "Single project: budget lines, margins, team and site activity.",
        preview: "Header KPIs, budget line table and delivery timeline.",
        phase2Items: ["Capture progress updates", "Request budget transfer", "Variation register"],
        roles: ALL,
        activePrefix: "/projects/",
      },
      {
        key: "projects.budget",
        label: "Budget Lines",
        href: "/projects/budget",
        status: "planned",
        moduleKey: "projects",
        description: "Cost code level budget with commitments and forecast.",
        preview: "Budget lines across all projects with used and remaining columns.",
        phase2Items: ["Edit budget amounts", "Reallocate between lines", "Baseline vs current"],
        roles: ALL,
      },
      {
        key: "projects.milestones",
        label: "Milestones",
        href: "/projects/milestones",
        status: "planned",
        moduleKey: "projects",
        description: "Programme milestones with weights and progress.",
        preview: "Milestone list with due dates, weights and status.",
        phase2Items: ["Update milestone status", "Dependency view", "Baseline comparison"],
        roles: ALL,
      },
      {
        key: "projects.daily-logs",
        label: "Daily Site Logs",
        href: "/projects/daily-logs",
        status: "planned",
        moduleKey: "projects",
        description: "Daily site records: weather, crew, man-hours and incidents.",
        preview: "Recent site log entries with crew counts and delays.",
        phase2Items: ["Submit daily log", "Photo attachments", "Approval workflow"],
        roles: ALL,
      },
      {
        key: "projects.variations",
        label: "Variations",
        href: "/projects/variations",
        status: "planned",
        moduleKey: "projects",
        description: "Variation and change order register with time and cost impact.",
        preview: "Variation register with value and time impact.",
        phase2Items: ["Raise variation", "Client approval tracking", "Cost code mapping"],
        roles: ALL,
      },
    ],
  },
  {
    key: "procurement",
    label: "Procurement",
    shortLabel: "Procurement",
    icon: ShoppingCart,
    description: "Supplier panel, purchase requests, orders and receipts.",
    sections: [
      {
        key: "procurement.requests",
        label: "Purchase Requests",
        href: "/procurement/requests",
        status: "planned",
        moduleKey: "procurement",
        description: "Requisition to approval with delegated spend limits.",
        preview: "Requisition list with estimated value, urgency and approval state.",
        phase2Items: ["Raise / edit request", "Approval routing", "SLA tracking"],
        roles: BUY_SIDE,
      },
      {
        key: "procurement.orders",
        label: "Purchase Orders",
        href: "/procurement/orders",
        status: "planned",
        moduleKey: "procurement",
        description: "Issued orders, expected dates and receipt progress.",
        preview: "PO list with supplier, value and receipt percentage.",
        phase2Items: ["Issue PO from approved PR", "Amend and cancel", "Supplier acknowledgement"],
        roles: BUY_SIDE,
      },
      {
        key: "procurement.suppliers",
        label: "Suppliers",
        href: "/procurement/suppliers",
        status: "live",
        moduleKey: "procurement",
        description: "Live supplier panel with scorecards and risk flags.",
        preview: "Supplier scorecard: rating, delivery, quality, spend and risk notes.",
        phase2Items: ["Add / edit supplier", "Panel status workflow", "Score history"],
        roles: BUY_SIDE,
      },
      {
        key: "procurement.receipts",
        label: "Goods Receipt",
        href: "/procurement/receipts",
        status: "planned",
        moduleKey: "procurement",
        description: "Site receipt, inspection result and three-way match.",
        preview: "Receipt log with inspection outcome and accepted value.",
        phase2Items: ["Post receipt", "Inspection workflow", "Three-way match exceptions"],
        roles: BUY_SIDE,
      },
      {
        key: "procurement.subcontractors",
        label: "Subcontractor Register",
        href: "/procurement/subcontractors",
        status: "planned",
        moduleKey: "procurement",
        description: "Subcontract packages, retention and insurance tracking.",
        preview: "Subcontractor packages with committed value and insurance status.",
        phase2Items: ["Register package", "Insurance expiry alerts", "Retention tracking"],
        roles: BUY_SIDE,
      },
    ],
  },
  {
    key: "hr",
    label: "Human Resources",
    shortLabel: "HR",
    icon: Users,
    description: "Workforce register, attendance, leave and payroll.",
    sections: [
      {
        key: "hr.employees",
        label: "Employees",
        href: "/hr/employees",
        status: "live",
        moduleKey: "hr",
        description: "Live employee register with site assignment and cost rollup.",
        preview: "Employee list with department, site, status and monthly cost.",
        phase2Items: ["Add / edit employee", "Contract expiry alerts", "Document uploads"],
        roles: WORKFORCE,
      },
      {
        key: "hr.attendance",
        label: "Attendance",
        href: "/hr/attendance",
        status: "live",
        moduleKey: "hr",
        description: "30 days of seeded attendance with hours and anomaly detection.",
        preview: "Per-employee grid, daily totals and flagged exceptions.",
        phase2Items: ["Correct a record", "Bulk import from device", "Overtime approval"],
        roles: WORKFORCE,
      },
      {
        key: "hr.timesheets",
        label: "Timesheets",
        href: "/hr/timesheets",
        status: "planned",
        moduleKey: "hr",
        description: "Weekly timesheets reconciled against attendance records.",
        preview: "Weekly timesheet list with hours and approval state.",
        phase2Items: ["Submit timesheet", "Reconcile vs attendance", "Approve for payroll"],
        roles: WORKFORCE,
      },
      {
        key: "hr.leave",
        label: "Leave",
        href: "/hr/leave",
        status: "planned",
        moduleKey: "hr",
        description: "Leave requests, balances and approver routing.",
        preview: "Leave request list with type, days and status.",
        phase2Items: ["Request leave", "Balance tracking", "Approve / reject"],
        roles: WORKFORCE,
      },
      {
        key: "hr.payroll",
        label: "Payroll",
        href: "/hr/payroll",
        status: "planned",
        moduleKey: "hr",
        description: "Monthly payroll run from attendance and salary bands.",
        preview: "Payroll run history and per-employee gross to net preview.",
        phase2Items: ["Run payroll", "Approve and lock", "Bank file export"],
        roles: ["hr_manager", "admin"],
      },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    shortLabel: "Finance",
    icon: Wallet,
    description: "Receivables, payables, cost control and cash flow.",
    sections: [
      {
        key: "finance.accounts",
        label: "Chart of Accounts",
        href: "/finance/accounts",
        status: "planned",
        moduleKey: "finance",
        description: "Grouped account structure and trial balance.",
        preview: "Account hierarchy with balances and a trial balance check.",
        phase2Items: ["Add account", "Mapping rules", "Period lock"],
        roles: OFFICE_FINANCE,
      },
      {
        key: "finance.payables",
        label: "Accounts Payable",
        href: "/finance/payables",
        status: "planned",
        moduleKey: "finance",
        description: "Supplier invoices, expense claims and payment runs.",
        preview: "Expense and payable list with approval state and amount.",
        phase2Items: ["Approve claim", "Three-way match", "Payment run"],
        roles: OFFICE_FINANCE,
      },
      {
        key: "finance.receivables",
        label: "Accounts Receivable",
        href: "/finance/receivables",
        status: "planned",
        moduleKey: "finance",
        description: "Progress claims, retention and invoice ageing.",
        preview: "Invoice list with ageing bucket, outstanding balance and retention.",
        phase2Items: ["Issue progress claim", "Record payment", "Ageing report export"],
        roles: OFFICE_FINANCE,
      },
      {
        key: "finance.budget-vs-actual",
        label: "Budget vs Actual",
        href: "/finance/budget-vs-actual",
        status: "planned",
        moduleKey: "finance",
        description: "Cost to date against budget for every project.",
        preview: "Variance table with budget, committed, actual and variance.",
        phase2Items: ["Cost report by cost code", "Forecast at completion", "Export"],
        roles: OFFICE_FINANCE,
      },
      {
        key: "finance.cash-flow",
        label: "Cash Flow",
        href: "/finance/cash-flow",
        status: "planned",
        moduleKey: "finance",
        description: "Project inflow and outflow with forecast months.",
        preview: "Monthly inflow, outflow and closing balance per project.",
        phase2Items: ["Update forecast", "Consolidated group view", "13-week cash view"],
        roles: OFFICE_FINANCE,
      },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    shortLabel: "CRM",
    icon: Handshake,
    description: "Clients, contacts, pipeline and tender pipeline.",
    sections: [
      {
        key: "crm.clients",
        label: "Clients",
        href: "/crm/clients",
        status: "live",
        moduleKey: "crm",
        description: "Live client register with credit position and live projects.",
        preview: "Client cards with terms, credit utilisation and project rollups.",
        phase2Items: ["Add / edit client", "Credit hold workflow", "Contact sync"],
        roles: ["site_engineer", "approver", "admin"],
      },
      {
        key: "crm.contacts",
        label: "Contacts",
        href: "/crm/contacts",
        status: "planned",
        moduleKey: "crm",
        description: "Client stakeholders and decision roles.",
        preview: "Contact list grouped by client with decision role.",
        phase2Items: ["Add contact", "Set primary contact", "Communication log"],
        roles: ["site_engineer", "approver", "admin"],
      },
      {
        key: "crm.pipeline",
        label: "Sales Pipeline",
        href: "/crm/pipeline",
        status: "planned",
        moduleKey: "crm",
        description: "Enquiry to won pipeline with weighted value.",
        preview: "Lead list with stage, value and probability.",
        phase2Items: ["Move stage", "Weighted forecast", "Convert to project"],
        roles: ["site_engineer", "approver", "admin"],
      },
      {
        key: "crm.tenders",
        label: "Tenders & Bids",
        href: "/crm/tenders",
        status: "planned",
        moduleKey: "crm",
        description: "Tender submissions, document completeness and outcome.",
        preview: "Tender list with bid value, estimate and document progress.",
        phase2Items: ["Register tender", "Document checklist", "Post-bid review"],
        roles: ["site_engineer", "approver", "admin"],
      },
    ],
  },
  {
    key: "audit",
    label: "Audit Log",
    shortLabel: "Audit",
    icon: ScrollText,
    description: "Every state change with who, what, when and old / new value.",
    sections: [
      {
        key: "audit.log",
        label: "Activity Log",
        href: "/audit",
        status: "live",
        moduleKey: "audit",
        description: "Live append-only trail written by logAction on every change.",
        preview: "Newest first, filterable by actor, action, severity and entity.",
        phase2Items: ["Server-side persistence", "Export to CSV", "Alert on critical actions"],
        roles: GOVERNANCE,
      },
    ],
  },
];

export const ALL_SECTIONS: NavSection[] = NAV_MODULES.flatMap((module) => module.sections);

export const SECTION_BY_KEY: Record<string, NavSection> = Object.fromEntries(
  ALL_SECTIONS.map((section) => [section.key, section]),
);

export const MODULE_BY_KEY: Record<ModuleKey, NavModule> = Object.fromEntries(
  NAV_MODULES.map((module) => [module.key, module]),
) as Record<ModuleKey, NavModule>;

export function getSection(key: string): NavSection {
  const section = SECTION_BY_KEY[key];
  if (!section) throw new Error(`Unknown navigation section: ${key}`);
  return section;
}

export function moduleForSection(key: string): NavModule {
  return MODULE_BY_KEY[getSection(key).moduleKey];
}

export function visibleSections(role: Role, moduleKey?: ModuleKey): NavSection[] {
  return ALL_SECTIONS.filter(
    (section) => (!moduleKey || section.moduleKey === moduleKey) && section.roles.includes(role),
  );
}

export function visibleModules(role: Role): NavModule[] {
  return NAV_MODULES.filter((module) =>
    module.sections.some((section) => section.roles.includes(role)),
  );
}

export function canAccessSection(role: Role, key: string): boolean {
  const section = SECTION_BY_KEY[key];
  return section ? section.roles.includes(role) : false;
}

export function activeSectionKey(pathname: string): string | null {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const exact = ALL_SECTIONS.find((section) => section.href === normalized);
  if (exact) return exact.key;
  const prefixed = ALL_SECTIONS.filter(
    (section) => section.activePrefix && normalized.startsWith(section.activePrefix),
  ).sort((a, b) => b.href.length - a.href.length);
  if (prefixed.length > 0) return prefixed[0].key;
  return null;
}

export function activeModuleKey(pathname: string): ModuleKey | null {
  const key = activeSectionKey(pathname);
  return key ? SECTION_BY_KEY[key].moduleKey : null;
}

export interface NavStats {
  sections: number;
  live: number;
  planned: number;
  modules: number;
  coveragePercent: number;
}

export function navStats(role: Role): NavStats {
  const sections = visibleSections(role);
  const live = sections.filter((section) => section.status === "live").length;
  return {
    sections: sections.length,
    live,
    planned: sections.length - live,
    modules: visibleModules(role).length,
    coveragePercent: sections.length === 0 ? 0 : Math.round((live / sections.length) * 100),
  };
}

export const SECTION_ICON: Record<ModuleKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  projects: HardHat,
  procurement: ShoppingCart,
  hr: Users,
  finance: Wallet,
  crm: Handshake,
  audit: ScrollText,
};

export const SECTION_STATUS_LABEL: Record<SectionStatus, string> = {
  live: "Live",
  planned: "Planned - Phase 2",
};

export const SUB_SECTION_ICON = {
  FolderKanban,
  FileText,
  Package,
  Truck,
  Receipt,
  Banknote,
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  Building2,
  UserCog,
  Handshake,
  ScrollText,
};
