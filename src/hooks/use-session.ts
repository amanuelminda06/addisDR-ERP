"use client";

import { useMemo } from "react";
import { useErpHydrated } from "@/hooks/use-hydrated";
import { useErpStore } from "@/store/erp-store";
import {
  allowedActions,
  canAccessModule,
  canPerformAction,
  type ActionKey,
  type ModuleKey,
} from "@/lib/rules/permissions";
import { activeModuleKey, visibleModules, visibleSections } from "@/lib/navigation";
import type { Role, User } from "@/lib/types";

export interface Session {
  user: User;
  role: Role;
  roleLabel: string;
  isHydrated: boolean;
  can: (action: ActionKey) => boolean;
  canOpen: (moduleKey: ModuleKey) => boolean;
  actions: ActionKey[];
  moduleCount: number;
  sectionCount: number;
  liveCount: number;
  plannedCount: number;
  coveragePercent: number;
}

export function useActiveUser(): User {
  const users = useErpStore((state) => state.users);
  const activeUserId = useErpStore((state) => state.activeUserId);
  return useMemo(
    () =>
      users.find((user) => user.id === activeUserId) ??
      (users[0] as User | undefined) ?? {
        id: "usr_unknown",
        name: "Unknown user",
        email: "",
        role: "admin" as Role,
        jobTitle: "",
        employeeId: null,
        active: true,
      },
    [users, activeUserId],
  );
}

export function useSession(): Session {
  const user = useActiveUser();
  const role = user.role;
  const isHydrated = useErpHydrated();

  return useMemo(() => {
    const sections = visibleSections(role);
    const liveCount = sections.filter((section) => section.status === "live").length;
    return {
      user,
      role,
      roleLabel: role,
      isHydrated,
      can: (action: ActionKey) => canPerformAction(role, action),
      canOpen: (moduleKey: ModuleKey) => canAccessModule(role, moduleKey),
      actions: allowedActions(role),
      moduleCount: visibleModules(role).length,
      sectionCount: sections.length,
      liveCount,
      plannedCount: sections.length - liveCount,
      coveragePercent:
        sections.length === 0 ? 0 : Math.round((liveCount / sections.length) * 100),
    };
  }, [user, role, isHydrated]);
}

export function useRoleScopedNavigation(pathname: string) {
  const { role } = useSession();
  return useMemo(
    () => ({
      modules: visibleModules(role),
      sections: visibleSections(role),
      activeModule: activeModuleKey(pathname),
    }),
    [role, pathname],
  );
}
