import { Lock } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";

export function ProjectUnavailable() {
  return (
    <AppShell>
      <EmptyState
        icon={Lock}
        title="Project not available"
        description="It may not exist, or you may not be a member of its teams."
        action={
          <Link
            href="/projects"
            className="text-[13px] font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)]"
          >
            Back to projects
          </Link>
        }
      />
    </AppShell>
  );
}
