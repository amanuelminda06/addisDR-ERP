import type { ActionKey } from "@/lib/rules/permissions";
import type { Role } from "@/lib/types";

export const COMPANY_NAME = "BuildWell Construction";

export const COMPANY_TAGLINE = "Building the region's infrastructure, one site at a time";

export interface SpaceAction {
  label: string;
  href: string;
  /** The nav section this shortcut lands on, used for its Live badge. */
  targetKey: string;
  description: string;
}

/**
 * Quick actions are declared once and filtered by permissions the role already
 * holds in ACTION_ACCESS, so the role switcher stays the single source of
 * truth for what a role can do. Every href points at an existing Live route:
 * a shortcut into a planned section would only lead to a "Phase 2" placeholder.
 */
const ACTIONS: (SpaceAction & { requires: ActionKey })[] = [
  {
    label: "Record attendance",
    href: "/hr/attendance",
    targetKey: "hr.attendance",
    description: "Punch in for today or correct a record",
    requires: "hr.attendance.manage",
  },
  {
    label: "My attendance",
    href: "/hr/attendance",
    targetKey: "hr.attendance",
    description: "Thirty days of hours, punctuality and anomalies",
    requires: "hr.attendance.view",
  },
  {
    label: "Employee register",
    href: "/hr/employees",
    targetKey: "hr.employees",
    description: "Contracts, site assignment and cost rollup",
    requires: "hr.employee.view",
  },
  {
    label: "Supplier panel",
    href: "/procurement/suppliers",
    targetKey: "procurement.suppliers",
    description: "Scorecards, risk flags and vendor onboarding",
    requires: "supplier.view",
  },
  {
    label: "Projects",
    href: "/projects",
    targetKey: "projects.list",
    description: "Progress, budget health and schedule variance",
    requires: "project.view",
  },
  {
    label: "Clients",
    href: "/crm/clients",
    targetKey: "crm.clients",
    description: "Credit position and live project accounts",
    requires: "crm.client.manage",
  },
  {
    label: "Pending approvals",
    href: "/audit",
    targetKey: "audit.log",
    description: "Review what is waiting on your sign-off",
    requires: "audit.view",
  },
];

/**
 * Preferred order per role, so each one leads with the action that defines it.
 * Roles absent here fall back to alphabetical order. Labels absent from a
 * role's list simply keep that role's own alphabetical ordering.
 */
const ACTION_ORDER: Record<Role, string[]> = {
  site_engineer: ["My attendance", "Projects", "Supplier panel"],
  procurement_officer: ["Supplier panel", "Projects"],
  approver: ["Pending approvals", "Clients", "Projects"],
  hr_manager: ["Employee register", "My attendance", "Projects"],
  admin: ["Pending approvals", "Projects", "Employee register"],
};

export function spaceActionsFor(
  role: Role,
  can: (action: ActionKey) => boolean,
): SpaceAction[] {
  const preferred = ACTION_ORDER[role] ?? [];
  const permitted = ACTIONS.filter((action) => can(action.requires));
  return permitted
    .sort((a, b) => {
      const ai = preferred.indexOf(a.label);
      const bi = preferred.indexOf(b.label);
      if (ai === -1 && bi === -1) return a.label.localeCompare(b.label);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}
