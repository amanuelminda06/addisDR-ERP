"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { ResetDemoButton } from "@/components/shell/reset-demo-button";
import { RoleSwitcher } from "@/components/shell/role-switcher";
import { BrandMark } from "@/components/shell/brand-mark";
import { activeModuleKey, MODULE_BY_KEY } from "@/lib/navigation";
import { useActiveUser } from "@/hooks/use-session";
import { initials } from "@/lib/format";
import { roleLabel } from "@/lib/rules/permissions";

export function TopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useActiveUser();
  const moduleKey = activeModuleKey(pathname);
  const moduleLabel = moduleKey ? MODULE_BY_KEY[moduleKey]?.label : undefined;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-sm lg:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-4" aria-hidden />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <BrandMark className="size-6" />
              BuildWell ERP
            </SheetTitle>
            <SheetDescription className="text-xs">
              Construction ERP demo shell — {moduleLabel ?? "Overview"}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden items-center gap-2 lg:flex">
        <BrandMark className="size-6" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">BuildWell ERP</span>
          <span className="text-[0.6875rem] text-muted-foreground">
            {moduleLabel ?? "Overview"} · demo shell
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden rounded-lg border bg-muted/40 px-2 py-1 text-[0.6875rem] text-muted-foreground md:inline">
          Zustand → sessionStorage
        </span>
        <RoleSwitcher />
        <NotificationsMenu />
        <ResetDemoButton />
        <Separator orientation="vertical" className="mx-0.5 hidden h-6 sm:block" />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
            {initials(user.name)}
          </div>
          <div className="hidden flex-col leading-tight xl:flex">
            <span className="text-xs font-medium">{user.name}</span>
            <span className="text-[0.625rem] text-muted-foreground">
              {roleLabel(user.role)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
