"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Hammer, Lock, ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSection, visibleSections } from "@/lib/navigation";
import { ALL_ROLES, roleLabel } from "@/lib/rules/permissions";
import type { Role } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { useErpStore } from "@/store/erp-store";
import { NavLink } from "@/components/ui-bits/nav-link";
import { cn } from "cn";

export function PlannedBanner({ sectionKey, className }: { sectionKey: string; className?: string }) {
  const section = getSection(sectionKey);
  return (
    <Alert
      className={cn(
        "border-amber-300 bg-amber-50/70 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100",
        className,
      )}
    >
      <Hammer className="size-4" aria-hidden />
      <AlertTitle className="flex flex-wrap items-center gap-2">
        Planned - Phase 2
        <Badge variant="outline" className="border-amber-400 bg-background/60 text-amber-800 dark:text-amber-200">
          No workflows yet
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
        <p>
          The table below shows the realistic shape of this module using sample data. Creating,
          editing and approving will arrive in Phase 2.
        </p>
        <p className="mt-1.5 text-xs">
          Planned in Phase 2: {section.phase2Items.join(" · ")}
        </p>
      </AlertDescription>
    </Alert>
  );
}

export function PlannedToolbar({
  searchPlaceholder = "Search records…",
  filters = ["All projects", "All statuses"],
  actions = ["Export", "New record"],
}: {
  searchPlaceholder?: string;
  filters?: string[];
  actions?: string[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <Input
          disabled
          readOnly
          placeholder={searchPlaceholder}
          className="w-full sm:max-w-xs"
          aria-label={searchPlaceholder}
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button key={filter} variant="outline" size="sm" disabled>
              {filter}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action} size="sm" variant="secondary" disabled>
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function PlannedSelectionBar({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-2">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox disabled />
        Select all {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">{count} rows shown</span>
        <Button size="sm" variant="outline" disabled>
          Bulk actions
        </Button>
      </div>
    </div>
  );
}

export interface PlannedColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  cell: (row: T) => React.ReactNode;
}

export function PlannedTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  maxHeight,
}: {
  columns: PlannedColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T, index: number) => string;
  rowHref?: (row: T) => string;
  maxHeight?: string;
}) {
  return (
    <div
      className="overflow-x-auto rounded-xl border"
      style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.className,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={rowKey(row, index)}>
              {columns.map((column, columnIndex) => {
                const href = rowHref?.(row);
                return (
                  <TableCell
                    key={column.key}
                    className={cn(
                      column.align === "right" && "text-right tabular-nums",
                      column.align === "center" && "text-center",
                      columnIndex === 0 && "pl-6",
                      column.className,
                    )}
                  >
                    {href && columnIndex === 0 ? (
                      <NavLink href={href} className="font-medium hover:underline">
                        {column.cell(row)}
                      </NavLink>
                    ) : (
                      column.cell(row)
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RoleGuard({
  sectionKey,
  children,
}: {
  sectionKey: string;
  children: React.ReactNode;
}) {
  const { role, user } = useSession();
  const setRole = useErpStore((state) => state.setRole);
  const section = getSection(sectionKey);
  const allowed = section.roles.includes(role);
  const allowedRoles = ALL_ROLES.filter((candidate) =>
    section.roles.includes(candidate as Role),
  );

  if (allowed) return <>{children}</>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-600" aria-hidden />
          <CardTitle>Restricted for {roleLabel(role)}</CardTitle>
        </div>
        <CardDescription>
          {section.label} is not part of the {roleLabel(role)} menu. Menu items and actions are
          filtered by role — switch role to preview it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Lock className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">Available to:</span>
          {allowedRoles.map((candidate) => (
            <Button
              key={candidate}
              size="sm"
              variant={candidate === role ? "default" : "outline"}
              onClick={() => setRole(candidate as Role)}
            >
              {roleLabel(candidate as Role)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          You are signed in as {user.name} ({user.jobTitle}). Switching role is recorded in the
          audit log.
        </p>
        <div className="flex gap-2">
          <NavLink
            href={visibleSections(role)[0]?.href ?? "/dashboard"}
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            Go to my first section
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
