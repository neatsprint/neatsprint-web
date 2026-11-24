import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = { key: string; seconds: number };
type Project = { id: string; key: string; name: string };
type User = { id: string; full_name: string };

export default async function TimeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; group_by?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("report:productivity:view")) redirect("/reports");
  const token = await getAccessToken();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = params.from ?? new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const to = params.to ?? today;
  const groupBy = params.group_by ?? "day";

  const [reportResponse, projectsResponse, usersResponse] = await Promise.all([
    gatewayFetch(`/reports/time?from=${from}&to=${to}&group_by=${groupBy}`, {}, token),
    gatewayFetch("/tasks/projects", {}, token),
    gatewayFetch("/iam/users?per_page=200", {}, token),
  ]);
  const report = reportResponse.ok
    ? ((await reportResponse.json()) as {
        data: { from: string; to: string; total_seconds: number; rows: Row[] };
      }).data
    : { from, to, total_seconds: 0, rows: [] };
  const projects: Project[] = projectsResponse.ok
    ? ((await projectsResponse.json()) as { data: Project[] }).data
    : [];
  const users: User[] = usersResponse.ok
    ? ((await usersResponse.json()) as { data: User[] }).data
    : [];
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const userMap = new Map(users.map((user) => [user.id, user.full_name]));
  const max = Math.max(1, ...report.rows.map((row) => row.seconds));

  function label(key: string): string {
    if (groupBy === "project") {
      const project = projectMap.get(key);
      return project ? `${project.key} · ${project.name}` : "Unassigned";
    }
    if (groupBy === "user") return userMap.get(key) ?? "Unknown user";
    return key;
  }

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/reports" className="hover:text-[var(--text-primary)]">
            Reports
          </Link>{" "}
          / Time
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Time report</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {formatDuration(report.total_seconds)} across {report.rows.length} buckets.
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
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">Group by</span>
            <select
              name="group_by"
              defaultValue={groupBy}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            >
              <option value="day">Day</option>
              <option value="project">Project</option>
              <option value="user">Person</option>
            </select>
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
            href={`/api/session/reports/export?report=time&from=${from}&to=${to}`}
            className="ml-auto inline-flex h-9 items-center rounded-[var(--radius-md)] border px-3 text-[13px] font-medium hover:bg-[var(--bg-subtle)]"
          >
            Export CSV
          </a>
        ) : null}
      </div>

      {!reportResponse.ok ? (
        <InlineAlert>That report could not be loaded.</InlineAlert>
      ) : report.rows.length === 0 ? (
        <EmptyState
          title="No tracked time in this range"
          description="Start a timer or add manual entries to see them here."
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
            <h2 className="text-base font-semibold">Distribution</h2>
            <div className="mt-4 space-y-2">
              {report.rows.map((row) => (
                <div key={row.key} className="grid grid-cols-[12rem_1fr_5rem] items-center gap-2">
                  <span className="truncate text-[12px] text-[var(--text-secondary)]">
                    {label(row.key)}
                  </span>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className="h-full bg-[var(--primary-600)]"
                      style={{ width: `${Math.max(2, Math.round((row.seconds / max) * 100))}%` }}
                    />
                  </div>
                  <span className="text-right text-[12px] tabular">
                    {formatDuration(row.seconds)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <DataTable
            label="Time report data"
            columns={[
              { key: "bucket", label: groupBy === "day" ? "Day" : groupBy === "project" ? "Project" : "Person" },
              { key: "seconds", label: "Duration" },
            ]}
          >
            <tbody className="divide-y">
              {report.rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-3 py-2">{label(row.key)}</td>
                  <td className="px-3 py-2 tabular">{formatDuration(row.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      )}
    </AppShell>
  );
}
