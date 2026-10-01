"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erp] module route crashed:", error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>This section failed to render</CardTitle>
        <CardDescription>
          The rest of the app is still usable. This is usually a data or
          component bug rather than a lost session — retrying re-runs the route
          against the current store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      </CardContent>
      <CardFooter>
        <Button onClick={reset}>Retry this page</Button>
      </CardFooter>
    </Card>
  );
}
