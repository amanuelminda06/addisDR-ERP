"use client";

import { useMemo, useState } from "react";
import { Download, FileClock, Filter, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui-bits/page-header";
import { RoleGuard } from "@/components/ui-bits/planned-page";
import { StatCard } from "@/components/ui-bits/stat-card";
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { roleLabel } from "@/lib/rules/permissions";
import { actionLabel, AUDIT_ACTION_LABELS, filterAudit } from "@/lib/rules/audit";
import { formatDateTime, formatRelative, initials } from "@/lib/format";
import type { AuditSeverity, Role } from "@/lib/types";

const ALL = "all";

const SEVERITY_TONES: Record<AuditSeverity, Tone> = {
  info: "info",
  warning: "warn",
  critical: "danger",
};

function AuditContent() {
  const data = useErpData();
  const { can } = useSession();
  const [query, setQuery] = useState("");
  const [actorRole, setActorRole] = useState<string>(ALL);
  const [severity, setSeverity] = useState<string>(ALL);
  const [entity, setEntity] = useState<string>(ALL);

  const entities = useMemo(
    () => Array.from(new Set(data.audit.map((entry) => entry.entity))).sort(),
    [data.audit],
  );

  const filtered = useMemo(
    () =>
      filterAudit(data.audit, {
        query,
        actorRole: actorRole as Role | "all",
        severity: severity as AuditSeverity | "all",
        entity,
      }),
    [data.audit, query, actorRole, severity, entity],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="audit.log"
        actions={
          <Button variant="outline" size="sm" disabled={!can("audit.export")} title="Export arrives in Phase 2">
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Entries"
          value={data.audit.length}
          hint={`${data.auditStats.actors} actors in this session`}
          icon={FileClock}
        />
        <StatCard
          label="Critical"
          value={data.auditStats.bySeverity.critical}
          hint="Spend release, resets and role changes"
          tone={data.auditStats.bySeverity.critical > 0 ? "danger" : "ok"}
        />
        <StatCard
          label="Warnings"
          value={data.auditStats.bySeverity.warning}
          hint="Denials and reset events"
          tone={data.auditStats.bySeverity.warning > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Last change"
          value={data.audit[0] ? formatRelative(data.audit[0].at) : "—"}
          hint={data.audit[0] ? formatDateTime(data.audit[0].at) : "No changes yet"}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
                Append-only trail
              </CardTitle>
              <CardDescription>
                Every state change calls logAction() from /lib/rules/audit with actor, action,
                entity, timestamp and the old / new value.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search actor, entity or value…"
                  className="pl-8"
                  aria-label="Search audit log"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Select value={actorRole} onValueChange={(value) => value && setActorRole(value as string)}>
                  <SelectTrigger aria-label="Filter by role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All roles</SelectItem>
                    {(["site_engineer", "procurement_officer", "approver", "hr_manager", "admin"] as Role[]).map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabel(role)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Select value={severity} onValueChange={(value) => value && setSeverity(value as string)}>
                  <SelectTrigger aria-label="Filter by severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={entity} onValueChange={(value) => value && setEntity(value as string)}>
                  <SelectTrigger aria-label="Filter by entity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All entities</SelectItem>
                    {entities.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Field</TableHead>
                <TableHead className="text-right">Old value</TableHead>
                <TableHead className="text-right">New value</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="pl-6 whitespace-nowrap">
                    <div className="text-sm">{formatDateTime(entry.at)}</div>
                    <div className="text-xs text-muted-foreground">{formatRelative(entry.at)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.5625rem] font-semibold">
                        {initials(entry.actorName)}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{entry.actorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {roleLabel(entry.actorRole)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {AUDIT_ACTION_LABELS[entry.action] ?? actionLabel(entry.action)}
                    </div>
                    <div className="text-[0.625rem] text-muted-foreground">{entry.action}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{entry.entityLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.entity} · {entry.entityId}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.field ?? "—"}</TableCell>
                  <TableCell className="text-right text-xs">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      {entry.oldValue ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      {entry.newValue ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ToneBadge tone={SEVERITY_TONES[entry.severity]} dot>
                      {entry.severity}
                    </ToneBadge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Filter className="mx-auto mb-2 size-4" aria-hidden />
                    No audit entries match these filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <RoleGuard sectionKey="audit.log">
      <HydrationGate>
        <AuditContent />
      </HydrationGate>
    </RoleGuard>
  );
}
