import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action}
      </CardContent>
    </Card>
  );
}
