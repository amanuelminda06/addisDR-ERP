import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import type { SectionStatus } from "@/lib/types";

export const STATUS_BADGE_LABEL: Record<SectionStatus, string> = {
  live: "Live",
  planned: "Planned - Phase 2",
};

const STATUS_STYLES: Record<SectionStatus, string> = {
  live:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  planned:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SectionStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", STATUS_STYLES[status], className)}
      data-status={status}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "live" ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      {STATUS_BADGE_LABEL[status]}
    </Badge>
  );
}
