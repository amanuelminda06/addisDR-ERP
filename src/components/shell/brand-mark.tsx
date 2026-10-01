import { HardHat } from "lucide-react";
import { cn } from "cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <HardHat className="size-3.5" />
    </span>
  );
}

export function BrandHeader() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <BrandMark className="size-7" />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold">BuildWell ERP</span>
        <span className="truncate text-[0.6875rem] text-muted-foreground">
          Construction demo
        </span>
      </div>
      <span className="ml-auto rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-wide text-amber-800 uppercase dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        Demo
      </span>
    </div>
  );
}
