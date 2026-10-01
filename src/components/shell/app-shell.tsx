"use client";

import { BrandHeader } from "@/components/shell/brand-mark";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { StoreHydrator } from "@/components/shell/store-hydrator";
import { TopBar } from "@/components/shell/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <StoreHydrator />
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <BrandHeader />
        <div className="min-h-0 flex-1">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
