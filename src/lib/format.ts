import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
} from "date-fns";

export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

export function formatDate(value: string | Date, pattern = "dd MMM yyyy"): string {
  const date = toDate(value);
  return isValid(date) ? format(date, pattern) : "—";
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, "dd MMM yyyy, HH:mm");
}

export function formatMonth(value: string | Date): string {
  return formatDate(value, "MMM yyyy");
}

export function formatWeekday(value: string | Date): string {
  return formatDate(value, "EEE dd");
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  if (!isValid(date)) return "—";
  const diff = differenceInCalendarDays(new Date(), date);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff === -1) return "tomorrow";
  return formatDistanceToNowStrict(date).replace(" days", "d").replace(" day", "d") + " ago";
}

export function daysBetween(from: string | Date, to: string | Date): number {
  return differenceInCalendarDays(toDate(to), toDate(from));
}

export function toIsoDay(value: string | Date): string {
  return formatDate(value, "yyyy-MM-dd");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPercent(value: number, dp = 1): string {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(dp).replace(/\.0+$/, (m) => (m.length > 1 ? m.slice(-1) : m))}%`;
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function truncate(value: string, max = 60): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
