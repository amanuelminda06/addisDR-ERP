import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export type Tone = "ok" | "warn" | "danger" | "info" | "muted";

const TONE_STYLES: Record<Tone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950 dark:text-emerald-300",
  warn: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950 dark:text-amber-300",
  danger:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950 dark:text-red-300",
  info: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950 dark:text-sky-300",
  muted: "border-border bg-muted text-muted-foreground",
};

const DOT_STYLES: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  muted: "bg-muted-foreground/60",
};

export function ToneBadge({
  tone,
  children,
  className,
  dot = false,
  title,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  title?: string;
}) {
  return (
    <Badge variant="outline" title={title} className={cn("gap-1.5 font-medium", TONE_STYLES[tone], className)}>
      {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", DOT_STYLES[tone])} /> : null}
      {children}
    </Badge>
  );
}
