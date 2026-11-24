import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { BurndownChart, VelocityChart } from "@/components/reports-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type SprintSeries = {
  sprint_id: string;
  state: string;
  committed: number;
  completed: number;
  completed_at: string | null;
};
type Burndown = {
  sprint_id: string;
  total_points: number;
  series: Array<{ date: string; remaining: number }>;
};

export default async function VelocityReportPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("report:agile:view")) redirect("/reports");
  const token = await getAccessToken();
  const params = await searchParams;
  const projectsResponse = await gatewayFetch("/tasks/projects", {}, token);
  const projects: Project[] = projectsResponse.ok
    ? ((await projectsResponse.json()) as { data: Project[] }).data
    : [];
  const projectId = params.project ?? projects[0]?.id;
  if (!projectId) {
    return (
      <AppShell>
        <EmptyState
          title="No projects yet"
          description="Create a project and run a sprint to see velocity."
        />
      </AppShell>
    );
  }
  const velocityResponse = await gatewayFetch(
    `/reports/velocity?project_id=${projectId}`,
    {},
    token,
  );
  const series: SprintSeries[] = velocityResponse.ok
    ? ((await velocityResponse.json()) as { data: { sprints: SprintSeries[] } }).data.sprints
    : [];
  const selectedSprint = series[series.length - 1]?.sprint_id;
  const burndownResponse = selectedSprint
    ? await gatewayFetch(`/reports/burndown?sprint_id=${selectedSprint}`, {}, token)
    : null;
  const burndown: Burndown | null =
    burndownResponse && burndownResponse.ok
      ? ((await burndownResponse.json()) as { data: Burndown }).data
      : null;

  const chartData = series.map((sprint, index) => ({
    sprint: `S${index + 1}`,
    committed: sprint.committed,
    completed: sprint.completed,
  }));

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/reports" className="hover:text-[var(--text-primary)]">
            Reports
          </Link>{" "}
          / Velocity
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Velocity & burndown</h1>
      </div>

      <form method="get" className="mb-4 flex items-end gap-2">
        <label className="text-[12px] text-[var(--text-secondary)]">
          <span className="mb-1 block">Project</span>
          <select
            name="project"
            defaultValue={projectId}
            className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.key} · {project.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-md)] bg-[var(--primary-600)] px-4 text-[13px] font-medium text-white"
        >
          Apply
        </button>
      </form>

      {series.length === 0 ? (
        <EmptyState
          title="No sprint data"
          description="Velocity appears once sprint items have estimate points and outcomes."
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
            <h2 className="text-base font-semibold">Velocity</h2>
            <p className="mb-2 text-[12px] text-[var(--text-secondary)]">
              Committed versus completed points, last {series.length} sprints.
            </p>
            <VelocityChart data={chartData} />
            <table className="mt-3 w-full text-left text-[12px]">
              <thead className="text-[11px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                <tr>
                  <th className="py-1">Sprint</th>
                  <th className="py-1">State</th>
                  <th className="py-1 text-right">Committed</th>
                  <th className="py-1 text-right">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {series.map((sprint) => (
                  <tr key={sprint.sprint_id}>
                    <td className="py-1.5 text-[var(--text-secondary)]">
                      {sprint.sprint_id.slice(0, 8)}
                    </td>
                    <td className="py-1.5">{sprint.state}</td>
                    <td className="py-1.5 text-right tabular">{sprint.committed}</td>
                    <td className="py-1.5 text-right tabular">{sprint.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {burndown ? (
            <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
              <h2 className="text-base font-semibold">Burndown</h2>
              <p className="mb-2 text-[12px] text-[var(--text-secondary)]">
                {burndown.total_points} points in scope for the selected sprint.
              </p>
              <BurndownChart data={burndown.series} />
              <table className="mt-3 w-full text-left text-[12px]">
                <thead className="text-[11px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  <tr>
                    <th className="py-1">Date</th>
                    <th className="py-1 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {burndown.series.map((point) => (
                    <tr key={point.date}>
                      <td className="py-1.5 text-[var(--text-secondary)]">{point.date}</td>
                      <td className="py-1.5 text-right tabular">{point.remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
