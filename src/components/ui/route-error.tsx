"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function RouteError({
  reset,
  title = "This screen could not be loaded",
  description = "Something went wrong while fetching data. Try again in a moment.",
}: {
  reset: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <AppShell>
      <EmptyState
        icon={AlertTriangle}
        title={title}
        description={description}
        action={
          <Button onClick={reset}>
            <RotateCcw size={16} />
            Try again
          </Button>
        }
      />
    </AppShell>
  );
}
