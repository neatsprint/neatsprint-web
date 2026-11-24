import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Clock3, ShieldCheck, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

const reports = [
  {
    href: "/reports/time",
    title: "Time report",
    description: "Tracked hours by day, project and person.",
    icon: Clock3,
    permission: "report:productivity:view",
  },
  {
    href: "/reports/velocity",
    title: "Velocity & burndown",
    description: "Sprint delivery, committed versus completed points.",
    icon: TrendingUp,
    permission: "report:agile:view",
  },
  {
    href: "/reports/monitoring",
    title: "Monitoring summary",
    description: "Sessions, captures, deletions and aggregation-safe rows.",
    icon: ShieldCheck,
    permission: "report:monitoring:view",
  },
  {
    href: "/reports/exports",
    title: "Export centre",
    description: "Queue CSV or PDF exports and download signed links.",
    icon: BarChart3,
    permission: "report:export",
  },
] as const;

export default async function ReportsHubPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const available = reports.filter((report) =>
    profile.permissions.includes(report.permission),
  );

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[13px] text-[var(--text-secondary)]">Insights</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
          Operational answers from the report read models. Every chart has a data table and CSV
          export where permitted.
        </p>
      </div>

      {available.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No reports for your role"
          description="Ask an admin if you need reporting access."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {available.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.href}
                href={report.href}
                className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                <Icon size={20} className="text-[var(--primary-600)]" />
                <h2 className="mt-3 text-base font-semibold">{report.title}</h2>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  {report.description}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
