"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-bits/page-header";
import {
  PlannedBanner,
  PlannedSelectionBar,
  PlannedTable,
  PlannedToolbar,
  RoleGuard,
  type PlannedColumn,
} from "@/components/ui-bits/planned-page";
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";
import { MoneyText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { useErpData } from "@/hooks/use-erp-data";
import { NavLink } from "@/components/ui-bits/nav-link";
import { overdueReceivable, totalReceivable } from "@/lib/rules/finance";
import { titleCase } from "@/lib/format";
import type { Contact } from "@/lib/types";

const DECISION_LABELS: Record<Contact["decisionRole"], string> = {
  decision_maker: "Decision maker",
  technical: "Technical",
  finance: "Finance",
  site: "Site",
};

const DECISION_TONES: Record<Contact["decisionRole"], Tone> = {
  decision_maker: "ok",
  technical: "info",
  finance: "warn",
  site: "muted",
};

function ContactsContent() {
  const data = useErpData();
  const clientById = useMemo(
    () => Object.fromEntries(data.clients.map((client) => [client.id, client])),
    [data.clients],
  );
  const rows = useMemo(
    () => [...data.preview.contacts].sort((a, b) => a.name.localeCompare(b.name)),
    [data.preview.contacts],
  );

  const columns: PlannedColumn<Contact>[] = [
    {
      key: "name",
      header: "Contact",
      cell: (row) => (
        <>
          <div className="flex items-center gap-2 font-medium">
            {row.name}
            {row.isPrimary ? (
              <ToneBadge tone="ok" dot>
                Primary
              </ToneBadge>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">{row.jobTitle}</div>
        </>
      ),
    },
    {
      key: "client",
      header: "Client account",
      cell: (row) => (
        <NavLink href="/crm/clients" className="font-medium hover:underline">
          {clientById[row.clientId]?.companyName ?? row.clientId}
        </NavLink>
      ),
    },
    {
      key: "decisionRole",
      header: "Decision role",
      cell: (row) => (
        <ToneBadge tone={DECISION_TONES[row.decisionRole]}>{DECISION_LABELS[row.decisionRole]}</ToneBadge>
      ),
    },
    { key: "email", header: "Email", cell: (row) => <span className="text-xs">{row.email}</span> },
    { key: "phone", header: "Phone", cell: (row) => <span className="text-xs">{row.phone}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader sectionKey="crm.contacts" />
      <PlannedBanner sectionKey="crm.contacts" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">{rows.length}</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Decision makers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            {rows.filter((row) => row.decisionRole === "decision_maker").length}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-wide text-muted-foreground uppercase">
              Client credit exposure
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-semibold tabular-nums">
            <MoneyText value={totalReceivable(data.preview.invoices)} compact />
            <div className="text-xs font-normal text-muted-foreground">
              <MoneyText value={overdueReceivable(data.preview.invoices)} compact /> overdue
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stakeholder map</CardTitle>
          <CardDescription>
            Every contact is attached to a live client account so a call log or meeting note can be
            attributed in Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {data.clients.map((client) => {
            const scoped = rows.filter((row) => row.clientId === client.id);
            return (
              <div key={client.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-medium">{client.companyName}</div>
                <div className="text-xs text-muted-foreground">
                  {scoped.length} contacts ·{" "}
                  {scoped
                    .map((contact) => titleCase(contact.decisionRole))
                    .join(", ") || "No mapped contacts"}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <PlannedToolbar
        searchPlaceholder="Search contacts…"
        filters={["All clients", "All decision roles", "Primary only"]}
        actions={["New contact", "Log call", "Export"]}
      />
      <PlannedSelectionBar count={rows.length} label="contacts" />
      <PlannedTable columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <RoleGuard sectionKey="crm.contacts">
      <HydrationGate>
        <ContactsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
