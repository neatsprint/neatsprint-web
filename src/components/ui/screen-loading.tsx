import { AppShell } from "@/components/app-shell";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export function ScreenLoading({ rows = 3 }: { rows?: number }) {
  return (
    <AppShell>
      <PageSkeleton rows={rows} />
    </AppShell>
  );
}
