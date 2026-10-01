"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, HardHat, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "@/components/ui-bits/nav-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { activeSectionKey, visibleModules, type NavModule } from "@/lib/navigation";
import { useSession } from "@/hooks/use-session";
import { cn } from "cn";

function ModuleGroup({
  module,
  pathname,
  expanded,
  onToggle,
  onNavigate,
}: {
  module: NavModule;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { role } = useSession();
  const sections = useMemo(
    () => module.sections.filter((section) => section.roles.includes(role)),
    [module.sections, role],
  );
  const activeKey = activeSectionKey(pathname);
  const activeInModule = sections.some((section) => section.key === activeKey);
  const liveCount = sections.filter((section) => section.status === "live").length;
  const Icon = module.icon;

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "h-9 w-full justify-start gap-2 px-2.5 text-[0.8125rem] font-medium",
          activeInModule ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">{module.label}</span>
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[0.625rem] font-normal text-muted-foreground"
        >
          {liveCount}/{sections.length}
        </Badge>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", expanded ? "" : "-rotate-90")}
          aria-hidden
        />
      </Button>

      {expanded ? (
        <ul className="mb-1 ml-[1.15rem] flex flex-col gap-0.5 border-l pl-2.5">
          {sections.map((section) => {
            const isActive = section.key === activeKey;
            return (
              <li key={section.key}>
                <NavLink
                  href={section.href}
                  onClick={onNavigate}
                  title={`${section.label} — ${section.status === "live" ? "Live" : "Planned - Phase 2"}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-[0.8125rem] transition-colors",
                    isActive
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      section.status === "live"
                        ? "bg-emerald-500"
                        : "bg-amber-400 dark:bg-amber-500",
                    )}
                  />
                  <span className="flex-1 truncate">{section.label}</span>
                  {section.status === "planned" ? (
                    <span className="text-[0.625rem] tracking-wide text-amber-600/80 dark:text-amber-400/80">
                      P2
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, liveCount, sectionCount } = useSession();
  const modules = useMemo(() => visibleModules(role), [role]);
  const activeModule = useMemo(() => activeSectionKey(pathname), [pathname]);
  const activeModuleKey = modules.find((module) =>
    module.sections.some((section) => section.key === activeModule),
  )?.key;

  const [manual, setManual] = useState<Record<string, boolean>>({});

  const isExpanded = (moduleKey: string) =>
    manual[moduleKey] ?? moduleKey === activeModuleKey;

  return (
    <nav className="flex h-full min-h-0 flex-col" aria-label="Modules">
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-3">
        {modules.map((module) => (
          <ModuleGroup
            key={module.key}
            module={module}
            pathname={pathname}
            expanded={isExpanded(module.key)}
            onToggle={() =>
              setManual((previous) => ({
                ...previous,
                [module.key]: !isExpanded(module.key),
              }))
            }
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="border-t px-2.5 py-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            Phase 1 coverage
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Collapse / expand all"
            onClick={() => setManual(Object.fromEntries(modules.map((entry) => [entry.key, false])))}
          >
            <PanelLeftClose className="size-3.5" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center justify-between px-1">
          <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            {liveCount} live
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            {sectionCount - liveCount} planned
          </Badge>
        </div>
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[0.6875rem] text-muted-foreground">
          <HardHat className="size-3" aria-hidden />
          Session-scoped demo data
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-7 w-full justify-start px-1 text-[0.6875rem] text-muted-foreground"
          onClick={() => setManual(Object.fromEntries(modules.map((entry) => [entry.key, true])))}
        >
          <PanelLeftOpen className="mr-1 size-3" aria-hidden />
          Expand all modules
        </Button>
      </div>
    </nav>
  );
}
