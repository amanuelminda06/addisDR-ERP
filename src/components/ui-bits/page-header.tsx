"use client";

import { ChevronRight } from "lucide-react";
import { NavLink } from "@/components/ui-bits/nav-link";
import { StatusBadge } from "@/components/ui-bits/status-badge";
import { getSection, moduleForSection, visibleSections } from "@/lib/navigation";
import { cn } from "cn";
import { useSession } from "@/hooks/use-session";

export function PageHeader({
  sectionKey,
  actions,
  subtitle,
  className,
  showTabs = true,
}: {
  sectionKey: string;
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  showTabs?: boolean;
}) {
  const { role } = useSession();
  const section = getSection(sectionKey);
  const parentModule = moduleForSection(sectionKey);
  const siblings = visibleSections(role, parentModule.key);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{parentModule.label}</span>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">{section.label}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{section.label}</h1>
            <StatusBadge status={section.status} />
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">{section.description}</p>
          {subtitle}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {showTabs && siblings.length > 1 ? (
        <div className="-mx-1 flex flex-wrap gap-1.5">
          {siblings.map((item) => {
            const isActive = item.key === sectionKey;
            return (
              <NavLink
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-foreground/15 bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    item.status === "live" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                  aria-hidden
                />
              </NavLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
