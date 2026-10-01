"use client";

import { useState } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useErpStore } from "@/store/erp-store";
import { useSession } from "@/hooks/use-session";

export function ResetDemoButton({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  const resetDemo = useErpStore((state) => state.resetDemo);
  const [open, setOpen] = useState(false);
  const { can } = useSession();
  const allowed = can("demo.reset");

  if (!allowed) {
    return (
      <Button variant="ghost" size="sm" disabled title="Reset demo data is an Admin action">
        <RotateCcw className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Reset demo</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size="sm">
            <RotateCcw className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Reset demo</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-amber-600" aria-hidden />
            Re-seed the demo dataset?
          </DialogTitle>
          <DialogDescription>
            This clears every change made in this tab and regenerates the seed: 2 clients, 3
            projects with budget lines, 8 employees, 6 users, 5 suppliers and 30 days of attendance.
            The action is written to the audit log.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            }
          />
          <Button
            size="sm"
            onClick={() => {
              resetDemo();
              setOpen(false);
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset demo data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
