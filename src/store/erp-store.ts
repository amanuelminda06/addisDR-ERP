"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { AUDIT_ACTIONS, logAction } from "@/lib/rules/audit";
import { buildSeedState, SEED_VERSION, type SeedState } from "@/lib/seed";
import type { AppNotification, AuditEntry, Role, User } from "@/lib/types";

export const STORAGE_KEY = "buildwell-erp-demo";

export interface ErpStoreState extends SeedState {
  activeUserId: string;
  resetDemo: () => void;
  setRole: (role: Role) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  recordProjectView: (projectId: string, projectLabel: string) => void;
  recordSupplierView: (supplierId: string, supplierLabel: string) => void;
}

function seedState(): SeedState {
  return buildSeedState();
}

/**
 * sessionStorage does not exist on the server, and can throw outright when a
 * browser blocks storage access (private mode, third-party cookie policies).
 * Falling back to an in-memory store keeps persist wired up in both places
 * instead of disabling it and leaving hasHydrated() stuck at false.
 */
const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function resolveStorage(): StateStorage {
  if (typeof window === "undefined") return memoryStorage;
  try {
    const store = window.sessionStorage;
    const probe = `${STORAGE_KEY}__probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return memoryStorage;
  }
}

function actorFor(state: Pick<ErpStoreState, "users" | "activeUserId">): Pick<
  User,
  "id" | "name" | "role"
> {
  const user = state.users.find((candidate) => candidate.id === state.activeUserId) ?? state.users[0];
  return {
    id: user?.id ?? "usr_unknown",
    name: user?.name ?? "Unknown user",
    role: user?.role ?? "admin",
  };
}

export const useErpStore = create<ErpStoreState>()(
  persist(
    (set) => ({
      ...seedState(),
      activeUserId: "usr_admin",

      resetDemo: () =>
        set((state) => {
          const fresh = seedState();
          const actor = actorFor(state);
          const entry: AuditEntry = logAction(fresh.audit, {
            actor,
            action: AUDIT_ACTIONS.demoReset,
            entity: "demo",
            entityId: "demo_dataset",
            entityLabel: "Demo dataset",
            field: "seedVersion",
            oldValue: state.seedVersion,
            newValue: SEED_VERSION,
            summary: `Demo data re-seeded. ${fresh.attendance.length} attendance records, ${fresh.projects.length} projects restored.`,
          })[0];
          return { ...fresh, activeUserId: "usr_admin", audit: [entry, ...fresh.audit] };
        }),

      setRole: (role) =>
        set((state) => {
          const nextUser = state.users.find((user) => user.role === role) ?? state.users[0];
          const previousUser = state.users.find((user) => user.id === state.activeUserId);
          if (!nextUser || nextUser.id === state.activeUserId) return state;
          return {
            activeUserId: nextUser.id,
            audit: logAction(state.audit, {
              actor: { id: nextUser.id, name: nextUser.name, role: nextUser.role },
              action: AUDIT_ACTIONS.roleChanged,
              entity: "session",
              entityId: "sess_demo",
              entityLabel: "Demo session",
              field: "activeRole",
              oldValue: previousUser?.role ?? "unknown",
              newValue: role,
              summary: `Active role switched to ${nextUser.name} (${nextUser.jobTitle}).`,
            }),
          };
        }),

      markNotificationRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((item) => item.id === id);
          if (!notification || notification.read) return state;
          return {
            notifications: state.notifications.map((item) =>
              item.id === id ? { ...item, read: true } : item,
            ),
            audit: logAction(state.audit, {
              actor: actorFor(state),
              action: AUDIT_ACTIONS.notificationRead,
              entity: "notification",
              entityId: id,
              entityLabel: notification.title,
              field: "read",
              oldValue: "false",
              newValue: "true",
            }),
          };
        }),

      markAllNotificationsRead: () =>
        set((state) => {
          const unread = state.notifications.filter((item) => !item.read);
          if (unread.length === 0) return state;
          return {
            notifications: state.notifications.map((item) => ({ ...item, read: true })),
            audit: logAction(state.audit, {
              actor: actorFor(state),
              action: AUDIT_ACTIONS.notificationReadAll,
              entity: "notification",
              entityId: "all_unread",
              entityLabel: `${unread.length} notifications`,
              field: "read",
              oldValue: "false",
              newValue: "true",
              summary: `${unread.length} notifications marked as read.`,
            }),
          };
        }),

      recordProjectView: (projectId, projectLabel) =>
        set((state) => ({
          audit: logAction(state.audit, {
            actor: actorFor(state),
            action: AUDIT_ACTIONS.projectViewed,
            entity: "project",
            entityId: projectId,
            entityLabel: projectLabel,
            field: "viewedBy",
            oldValue: state.activeUserId,
            newValue: actorFor(state).id,
          }),
        })),

      recordSupplierView: (supplierId, supplierLabel) =>
        set((state) => ({
          audit: logAction(state.audit, {
            actor: actorFor(state),
            action: "supplier.viewed",
            entity: "supplier",
            entityId: supplierId,
            entityLabel: supplierLabel,
            field: "viewedBy",
            oldValue: state.activeUserId,
            newValue: actorFor(state).id,
          }),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(resolveStorage),
      skipHydration: true,
      partialize: (state) => ({
        seedVersion: state.seedVersion,
        seededAt: state.seededAt,
        users: state.users,
        employees: state.employees,
        clients: state.clients,
        projects: state.projects,
        suppliers: state.suppliers,
        attendance: state.attendance,
        attendanceFrom: state.attendanceFrom,
        attendanceTo: state.attendanceTo,
        preview: state.preview,
        notifications: state.notifications,
        audit: state.audit,
        activeUserId: state.activeUserId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.seedVersion !== SEED_VERSION) {
          state.resetDemo();
        }
      },
      /**
       * The store is seeded unconditionally at construction so the server can
       * render real markup. That means an absent or stale payload must NOT be
       * distinguished by "is the array empty?" — an empty collection is a
       * legitimate state. seedVersion is the one-time flag: a missing key means
       * nothing was ever persisted (keep the in-memory seed), and a mismatched
       * seedVersion means the payload predates this build and must be rebuilt.
       */
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ErpStoreState> | undefined;
        if (!persisted || persisted.seedVersion !== SEED_VERSION) {
          return currentState;
        }
        return { ...currentState, ...persisted };
      },
    },
  ),
);

export function getActiveUser(state: ErpStoreState): User {
  return (
    state.users.find((user) => user.id === state.activeUserId) ??
    state.users[0] ?? {
      id: "usr_unknown",
      name: "Unknown user",
      email: "",
      role: "admin",
      jobTitle: "",
      employeeId: null,
      active: true,
    }
  );
}

export function unreadNotifications(notifications: readonly AppNotification[]): AppNotification[] {
  return notifications.filter((notification) => !notification.read);
}
