"use client";

import { ShieldCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_ROLES, isRole, roleDescription, roleLabel } from "@/lib/rules/permissions";
import { useErpStore } from "@/store/erp-store";
import { useActiveUser } from "@/hooks/use-session";
import { initials } from "@/lib/format";
import type { Role } from "@/lib/types";

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const setRole = useErpStore((state) => state.setRole);
  const users = useErpStore((state) => state.users);
  const user = useActiveUser();
  const nameForRole = (role: Role) => users.find((candidate) => candidate.role === role)?.name ?? "";

  return (
    <div className="flex items-center gap-2">
      <div
        className="hidden items-center gap-1.5 rounded-lg border bg-muted/40 px-2 py-1 text-xs text-muted-foreground lg:flex"
        title={roleDescription(user.role)}
      >
        <ShieldCheck className="size-3.5" aria-hidden />
        <span className="max-w-[14rem] truncate">{roleDescription(user.role)}</span>
      </div>
      <Select
        value={user.role}
        onValueChange={(value) => {
          if (typeof value === "string" && isRole(value)) setRole(value);
        }}
      >
        <SelectTrigger
          size={compact ? "sm" : "default"}
          aria-label="Active role"
          className="min-w-[13.5rem]"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.625rem] font-semibold text-primary-foreground">
            {initials(user.name)}
          </span>
          <SelectValue>
            {(value: string | null) => (value ? roleLabel(value as Role) : "Select role")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[20rem]">
          {ALL_ROLES.map((role) => (
            <SelectItem key={role} value={role} className="flex-col items-start gap-0.5 py-2">
              <span className="flex w-full items-center justify-between gap-3">
                <span className="font-medium">{roleLabel(role)}</span>
                <span className="text-[0.625rem] text-muted-foreground">{nameForRole(role)}</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {roleDescription(role)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
