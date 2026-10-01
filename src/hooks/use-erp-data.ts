"use client";

import { useMemo } from "react";
import { useErpStore } from "@/store/erp-store";
import { withRollups, portfolioTotals, type ProjectRollup } from "@/lib/rules/projects";
import { summariseAttendance, detectAnomalies, summariseByEmployee } from "@/lib/rules/attendance";
import { headcountSummary } from "@/lib/rules/hr";
import { auditStats } from "@/lib/rules/audit";
import { budgetAlertCount } from "@/lib/rules/budget";

export function useErpData() {
  const users = useErpStore((state) => state.users);
  const employees = useErpStore((state) => state.employees);
  const clients = useErpStore((state) => state.clients);
  const projects = useErpStore((state) => state.projects);
  const suppliers = useErpStore((state) => state.suppliers);
  const attendance = useErpStore((state) => state.attendance);
  const attendanceFrom = useErpStore((state) => state.attendanceFrom);
  const attendanceTo = useErpStore((state) => state.attendanceTo);
  const preview = useErpStore((state) => state.preview);
  const notifications = useErpStore((state) => state.notifications);
  const audit = useErpStore((state) => state.audit);
  const seededAt = useErpStore((state) => state.seededAt);
  const activeUserId = useErpStore((state) => state.activeUserId);

  return useMemo(() => {
    const rollups: ProjectRollup[] = projects.map((project) => withRollups(project));
    const attendanceSummary = summariseAttendance(attendance);
    const anomalies = detectAnomalies(attendance, employees);
    return {
      users,
      employees,
      clients,
      projects,
      rollups,
      suppliers,
      attendance,
      attendanceFrom,
      attendanceTo,
      preview,
      notifications,
      audit,
      auditStats: auditStats(audit),
      seededAt,
      activeUserId,
      portfolio: portfolioTotals(projects),
      attendanceSummary,
      attendanceByEmployee: summariseByEmployee(attendance),
      anomalies,
      headcount: headcountSummary(employees),
      budgetAlerts: projects.reduce(
        (total, project) => total + budgetAlertCount(project.budgetLines),
        0,
      ),
    };
  }, [
    users,
    employees,
    clients,
    projects,
    suppliers,
    attendance,
    attendanceFrom,
    attendanceTo,
    preview,
    notifications,
    audit,
    seededAt,
    activeUserId,
  ]);
}

export type ErpData = ReturnType<typeof useErpData>;
