"use client";

import { useMemo } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";
import { formatRelative } from "@/lib/format";
import { useErpStore } from "@/store/erp-store";
import { useActiveUser } from "@/hooks/use-session";
import { ToneBadge, type Tone } from "@/components/ui-bits/tone-badge";

const SEVERITY_TONE: Record<string, Tone> = {
  info: "info",
  warning: "warn",
  critical: "danger",
};

export function NotificationsMenu() {
  const notifications = useErpStore((state) => state.notifications);
  const markNotificationRead = useErpStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useErpStore((state) => state.markAllNotificationsRead);
  const user = useActiveUser();

  const relevant = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.roleHint === "all" || notification.roleHint === user.role,
      ),
    [notifications, user.role],
  );
  const unread = relevant.filter((notification) => !notification.read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="relative" aria-label="Notifications">
            <Bell className="size-3.5" aria-hidden />
            {unread.length > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[0.5625rem] font-semibold text-white">
                {unread.length}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[22rem]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications for {user.role.replace(/_/g, " ")}</span>
          <span className="text-[0.625rem] text-muted-foreground">
            {unread.length} unread of {relevant.length}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {relevant.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing waiting on this role.
          </p>
        ) : (
          relevant.slice(0, 6).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => markNotificationRead(notification.id)}
              className="flex-col items-start gap-1 py-2.5"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={cn("text-sm", notification.read ? "text-muted-foreground" : "font-medium")}>
                  {notification.title}
                </span>
                <ToneBadge tone={SEVERITY_TONE[notification.severity] ?? "muted"}>
                  {notification.severity}
                </ToneBadge>
              </div>
              <span className="text-xs text-muted-foreground">{notification.body}</span>
              <span className="text-[0.625rem] text-muted-foreground/80">
                {formatRelative(notification.createdAt)}
                {notification.read ? " · read" : ""}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => markAllNotificationsRead()}
          disabled={unread.length === 0}
          className="justify-center text-xs"
        >
          <CheckCheck className="size-3.5" aria-hidden />
          Mark all as read (logged)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
