import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "muted",
  footer,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "muted" | "ok" | "warn" | "danger" | "info";
  footer?: React.ReactNode;
  className?: string;
}) {
  const valueTone = {
    muted: "text-foreground",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-sky-600 dark:text-sky-400",
  }[tone];

  return (
    <Card size="sm" className={cn("gap-2", className)}>
      <CardHeader className="px-4">
        <CardTitle className="flex items-center justify-between gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>{label}</span>
          {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className={cn("text-2xl font-semibold tabular-nums", valueTone)}>{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        {footer ? <div className="mt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card size="sm" className={cn("gap-2", className)}>
      <CardHeader className="px-4">
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
