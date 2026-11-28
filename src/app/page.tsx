import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { AssignedItems } from "@/components/assigned-items";
import { Button } from "@/components/ui/button";
import { assignedItems } from "@/lib/assigned";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type Item = {
  id: string;
  key: string;
  title: string;
  status: string;
  assignee_id: string | null;
  estimate_points: number | null;
  sprint_id: string | null;
};
type Sprint = { id: string; name: string; state: string };

export default async function DashboardPage() {
  const profile = await getProfile();
  const token = await getAccessToken();
  if (!profile || !token) {
    return (
      <AppShell>
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/login" className="text-[var(--primary-600)]">
            Sign in
          </Link>{" "}
          to see your workspace.
        </p>
      </AppShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const canReports = profile.permissions.includes("report:productivity:view");
  const canAgile = profile.permissions.includes("report:agile:view");

  const [currentResponse, sheetResponse, shotsResponse, projectsResponse, teamsResponse] =
    await Promise.all([
      gatewayFetch("/work/current", {}, token),
      gatewayFetch(`/work/timesheet?from=${today}&to=${today}`, {}, token),
      gatewayFetch(`/monitor/screenshots/mine?from=${today}&to=${today}`, {}, token),
      gatewayFetch("/tasks/projects", {}, token),
      gatewayFetch("/teams", {}, token),
    ]);
  const current = currentResponse.ok
    ? ((await currentResponse.json()) as { data: { state: string; elapsed_seconds: number } | null })
        .data
    : null;
  const sheet = sheetResponse.ok
    ? ((await sheetResponse.json()) as { data: { total_seconds: number } }).data
    : { total_seconds: 0 };
  const shots = shotsResponse.ok
    ? ((await shotsResponse.json()) as { data: Array<{ state: string }> }).data
    : [];
  const projects = projectsResponse.ok
    ? ((await projectsResponse.json()) as { data: Project[] }).data
    : [];
  const teams = teamsResponse.ok
    ? ((await teamsResponse.json()) as { data: unknown[] }).data
    : [];

  const backlogs = await Promise.all(
    projects.slice(0, 8).map(async (project) => {
      const response = await gatewayFetch(
        `/tasks/projects/${project.id}/backlog`,
        {},
        token,
      );
      if (!response.ok) return [] as Item[];
      const payload = (await response.json()) as { data: Item[] };
      return payload.data.map((item) => ({ ...item, project_id: project.id }) as Item & { project_id: string });
    }),
  );
  const sprintLists = await Promise.all(
    projects.slice(0, 8).map(async (project) => {
      const response = await gatewayFetch(`/tasks/sprints?project_id=${project.id}`, {}, token);
      if (!response.ok) return [] as Sprint[];
      return ((await response.json()) as { data: Sprint[] }).data;
    }),
  );
  const activeSprints = sprintLists.flat().filter((sprint) => sprint.state === "ACTIVE");
  const activeSprintIds = new Set(activeSprints.map((sprint) => sprint.id));
  const assigned = assignedItems(backlogs.flat(), profile.id, activeSprintIds);

  const activeSprint: Sprint | null = activeSprints[0] ?? null;
  let sprintItems: Item[] = [];
  if (activeSprint) {
    const itemsResponse = await gatewayFetch(
      `/tasks/sprints/${activeSprint.id}/items`,
      {},
      token,
    );
    if (itemsResponse.ok) {
      sprintItems = ((await itemsResponse.json()) as { data: Item[] }).data;
    }
  }

  const completionResponse = canAgile
    ? await gatewayFetch(`/reports/completion?from=${today}&to=${today}`, {}, token)
    : null;
  const completedToday =
    completionResponse && completionResponse.ok
      ? ((await completionResponse.json()) as { data: { completed: number } }).data.completed
      : 0;

  const captures = shots.filter((shot) => shot.state !== "DELETED").length;
  const deletions = shots.filter((shot) => shot.state === "DELETED").length;
  const sprintDone = sprintItems.filter((item) => item.status === "DONE").length;
  const sprintTotal = sprintItems.length;
  const sprintPoints = sprintItems.reduce(
    (sum, item) => sum + (item.estimate_points ?? 0),
    0,
  );
  const donePoints = sprintItems
    .filter((item) => item.status === "DONE")
    .reduce((sum, item) => sum + (item.estimate_points ?? 0), 0);

  const checklist = [
    { label: "Invite your team", done: teams.length > 0 },
    { label: "Create your first project", done: projects.length > 0 },
    { label: "Start a timer", done: sheet.total_seconds > 0 || current !== null },
  ];

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Good to see you, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1 max-w-2xl text-[var(--text-secondary)]">
            My day, sprint pulse and your privacy at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/timesheet">
            <Button variant="secondary">
              <Clock3 size={16} />
              Log time
            </Button>
          </Link>
          {canReports ? (
            <Link href="/reports">
              <Button>
                <BarChart3 size={16} />
                Reports
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {checklist.some((item) => !item.done) ? (
        <section className="mb-4 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold">
            <Sparkles size={16} className="text-[var(--primary-600)]" />
            Finish setup
          </h2>
          <ul className="mt-2 flex flex-wrap gap-4">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-[13px]">
                {item.done ? (
                  <CheckCircle2 size={15} className="text-[var(--success-600)]" />
                ) : (
                  <Circle size={15} className="text-[var(--text-tertiary)]" />
                )}
                {item.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="text-base font-semibold">My day</h2>
          <div className="mt-3 rounded-[var(--radius-md)] border border-dashed p-4">
            {current ? (
              <>
                <p className="text-sm font-medium">
                  {current.state === "PAUSED" ? "Timer paused" : "Timer running"}
                </p>
                <p className="mt-1 text-xl font-semibold tabular">
                  {formatDuration(current.elapsed_seconds)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No timer running</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Start tracking from the desktop agent or log time manually.
                </p>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            {formatDuration(sheet.total_seconds)} tracked today · {assigned.length}{" "}
            {assigned.length === 1 ? "assigned item" : "assigned items"}
          </p>
          <AssignedItems items={assigned} />
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="text-base font-semibold">Sprint pulse</h2>
          {activeSprint ? (
            <>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {activeSprint.name} · {sprintDone}/{sprintTotal} items done
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className="h-full bg-[var(--primary-600)]"
                  style={{
                    width: `${sprintPoints ? Math.round((donePoints / sprintPoints) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
                {donePoints} of {sprintPoints} points completed
              </p>
            </>
          ) : (
            <div className="mt-3 rounded-[var(--radius-md)] border border-dashed p-4">
              <p className="text-sm font-medium">No active sprint</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Plan a sprint from a project to see progress here.
              </p>
            </div>
          )}
          {canAgile ? (
            <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
              {completedToday} items completed today
            </p>
          ) : null}
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck size={18} className="text-[var(--success-600)]" />
            Privacy
          </h2>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
            {captures} captures today · {deletions} deleted by you
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
            Screenshots pause when your timer stops. Review and delete them within the privacy
            window.
          </p>
          <Link
            href="/me/screenshots"
            className="mt-3 inline-flex text-[13px] font-medium text-[var(--primary-600)]"
          >
            Review my screenshots
          </Link>
        </section>
      </div>

      {canReports ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {([
            ["/reports/time", "Time report", "Hours by day, project and person"],
            ["/reports/velocity", "Velocity & burndown", "Sprint delivery trend"],
            ["/reports/monitoring", "Monitoring summary", "Captures, deletions and activity"],
          ] as const).map(([href, title, description]) => (
            <Link
              key={href}
              href={href}
              className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)] transition-colors hover:bg-[var(--bg-subtle)]"
            >
              <p className="text-[13px] font-semibold">{title}</p>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{description}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
