"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useErpHydrated } from "@/hooks/use-hydrated";
import { cn } from "cn";

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function HydrationGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useErpHydrated();
  if (!hydrated) return <>{fallback ?? <PageSkeleton />}</>;
  return <>{children}</>;
}
