"use client";

import { useMemo } from "react";
import { Building2, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { MoneyText, PercentText } from "@/components/ui-bits/money";
import { HydrationGate } from "@/components/ui-bits/hydration-gate";
import { NavLink } from "@/components/ui-bits/nav-link";
import { useErpData } from "@/hooks/use-erp-data";
import { useSession } from "@/hooks/use-session";
import { addMoney, subMoney } from "@/lib/money";
import { creditUtilisation, overCreditLimit, paymentTermsLabel } from "@/lib/rules/finance";
import { projectsForClient, PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/rules/projects";
import { formatDate, daysBetween } from "@/lib/format";
import type { ClientStatus } from "@/lib/types";

const CLIENT_TONES: Record<ClientStatus, Tone> = {
  active: "ok",
  prospect: "info",
  on_hold: "warn",
};

function ClientsContent() {
  const data = useErpData();
  const { can } = useSession();

  const totals = useMemo(
    () => ({
      outstanding: addMoney(...data.clients.map((client) => client.outstandingBalance)),
      credit: addMoney(...data.clients.map((client) => client.creditLimit)),
      contract: addMoney(
        ...data.projects.map((project) => project.contractValue),
      ),
      relationships: Math.max(
        ...data.clients.map((client) =>
          daysBetween(client.relationshipSince, new Date()),
        ),
      ),
    }),
    [data.clients, data.projects],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sectionKey="crm.clients"
        actions={
          <Button size="sm" disabled={!can("crm.client.manage")} title="Client creation is Phase 2">
            <Plus className="size-3.5" aria-hidden />
            Add client
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clients"
          value={data.clients.length}
          hint={`${Math.round(totals.relationships / 365)} years average relationship`}
          icon={Building2}
        />
        <StatCard
          label="Outstanding"
          value={<MoneyText value={totals.outstanding} compact />}
          hint={`${creditUtilisation(totals.outstanding, totals.credit)}% of credit used`}
          icon={Wallet}
        />
        <StatCard
          label="Contract value"
          value={<MoneyText value={totals.contract} compact />}
          hint={`${data.portfolio.projectCount} live projects`}
        />
        <StatCard
          label="Credit headroom"
          value={<MoneyText value={subMoney(totals.credit, totals.outstanding)} compact />}
          hint={
            overCreditLimit(totals.outstanding, totals.credit) ? "Over combined limit" : "Within limit"
          }
          tone={overCreditLimit(totals.outstanding, totals.credit) ? "danger" : "ok"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.clients.map((client) => {
          const clientProjects = projectsForClient(data.projects, client.id);
          const utilisation = Number(creditUtilisation(client.outstandingBalance, client.creditLimit));
          return (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>{client.companyName}</CardTitle>
                    <ToneBadge tone={CLIENT_TONES[client.status]}>
                      {client.status.replace(/_/g, " ")}
                    </ToneBadge>
                  </div>
                  <CardDescription>
                    {client.code} · {client.sector} · {client.city}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Credit utilisation</span>
                    <span className="tabular-nums">
                      <MoneyText value={client.outstandingBalance} compact /> of{" "}
                      <MoneyText value={client.creditLimit} compact />
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, utilisation)}
                    className={utilisation > 80 ? "[&_[data-slot=progress-indicator]]:bg-amber-500" : ""}
                  />
                </div>

                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <Detail label="Contact" value={`${client.contactName}`} />
                  <Detail label="Email" value={client.contactEmail} />
                  <Detail label="Phone" value={client.contactPhone} />
                  <Detail label="Terms" value={paymentTermsLabel(client.paymentTermsDays)} />
                  <Detail label="Tax ID" value={client.taxId} />
                  <Detail
                    label="Client since"
                    value={formatDate(client.relationshipSince, "MMM yyyy")}
                  />
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Live projects
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-0">Project</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="pl-0">
                            <NavLink
                              href={`/projects/${project.id}`}
                              className="font-medium hover:underline"
                            >
                              {project.code}
                            </NavLink>
                            <div className="text-xs text-muted-foreground">{project.name}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <MoneyText value={project.contractValue} compact />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <PercentText value={project.progressPercent} />
                          </TableCell>
                          <TableCell>
                            <ToneBadge tone={PROJECT_STATUS_TONES[project.status]}>
                              {PROJECT_STATUS_LABELS[project.status]}
                            </ToneBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {client.notes}
                </p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  Credit headroom{" "}
                  <MoneyText
                    value={subMoney(client.creditLimit, client.outstandingBalance)}
                    compact
                  />{" "}
                  · exposure {utilisation}% of limit · account manager{" "}
                  {data.users.find((user) => user.id === client.accountManagerUserId)?.name ?? "—"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right">{value}</span>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <RoleGuard sectionKey="crm.clients">
      <HydrationGate>
        <ClientsContent />
      </HydrationGate>
    </RoleGuard>
  );
}
