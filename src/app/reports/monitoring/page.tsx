import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type MonitoringReport = {
  from: string;
  to: string;
  totals: {
    sessions: number;
    captures: number;
    deletions: number;
    deletion_rate: number;
    active_seconds: number;
  };
  days: Array<{ date: string; captures: number; deletions: number }>;
  users: Array<{
    user_id: string;
    captures: number;
    deletions: number;
    active_seconds: number;
  }>;
  suppressed: boolean;
  aggregation_threshold: number;
};

type User = { id: string; full_name: string };

export default async function MonitoringReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("report:monitoring:view")) redirect("/reports");
  const token = await getAccessToken();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = params.from ?? new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const to = params.to ?? today;
  const [reportResponse, usersResponse] = await Promise.all([
    gatewayFetch(`/reports/monitoring?from=${from}&to=${to}`, {}, token),
    gatewayFetch("/iam/users?per_page=200", {}, token),
  ]);
  const report: MonitoringReport | null = reportResponse.ok
    ? ((await reportResponse.json()) as { data: MonitoringReport }).data
    : null;
  const users: User[] = usersResponse.ok
    ? ((await usersResponse.json()) as { data: User[] }).data
    : [];
  const userMap = new Map(users.map((user) => [user.id, user.full_name]));
  const maxCaptures = Math.max(1, ...(report?.days.map((day) => day.captures) ?? [1]));

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/reports" className="hover:text-[var(--text-primary)]">
            Reports
          </Link>{" "}
          / Monitoring
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Monitoring summary</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Aggregated activity only. Small groups are suppressed to protect individuals.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">From</span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">To</span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded-[var(--radius-md)] bg-[var(--primary-600)] px-4 text-[13px] font-medium text-white"
          >
            Apply
          </button>
        </form>
        {profile.permissions.includes("report:export") ? (
          <a
            href={`/api/session/reports/export?report=monitoring&from=${from}&to=${to}`}
            className="ml-auto inline-flex h-9 items-center rounded-[var(--radius-md)] border px-3 text-[13px] font-medium hover:bg-[var(--bg-subtle)]"
          >
            Export CSV
          </a>
        ) : null}
      </div>

      {!report ? (
        <InlineAlert>That report could not be loaded.</InlineAlert>
      ) : report.totals.captures === 0 && report.totals.sessions === 0 ? (
        <EmptyState
          title="No monitoring activity"
          description="Captures and sessions appear here once the desktop agent is running."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Sessions", report.totals.sessions],
              ["Captures", report.totals.captures],
              ["Deletions", report.totals.deletions],
              ["Deletion rate", `${Math.round(report.totals.deletion_rate * 100)}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]"
              >
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
            <h2 className="text-base font-semibold">Capture heatmap</h2>
            <div className="mt-3 flex flex-wrap gap-1">
              {report.days.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.captures} captures, ${day.deletions} deletions`}
                  className="flex h-10 w-16 items-center justify-center rounded-[var(--radius-sm)] border text-[10px]"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--primary-600) ${Math.round(
                      (day.captures / maxCaptures) * 70,
                    )}%, var(--bg-surface))`,
                  }}
                >
                  {day.captures}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              One tile per day. Hover for captures and deletions.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
            <h2 className="text-base font-semibold">People</h2>
            {report.suppressed ? (
              <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                Per-person rows are hidden because fewer than{" "}
                {report.aggregation_threshold} people were active in this range.
              </p>
            ) : (
              <table className="mt-3 w-full text-left text-[12px]">
                <thead className="text-[11px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  <tr>
                    <th className="py-1">Person</th>
                    <th className="py-1 text-right">Captures</th>
                    <th className="py-1 text-right">Deletions</th>
                    <th className="py-1 text-right">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.users.map((row) => (
                    <tr key={row.user_id}>
                      <td className="py-1.5">{userMap.get(row.user_id) ?? "Unknown user"}</td>
                      <td className="py-1.5 text-right tabular">{row.captures}</td>
                      <td className="py-1.5 text-right tabular">{row.deletions}</td>
                      <td className="py-1.5 text-right tabular">
                        {Math.round(row.active_seconds / 60)}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
