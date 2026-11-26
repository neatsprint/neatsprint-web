import Link from "next/link";
import { redirect } from "next/navigation";

import {
  TimesheetClient,
  type SheetSprint,
  type TimesheetEntry,
} from "@/app/timesheet/timesheet-client";
import { AppShell } from "@/components/app-shell";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";
import { addDays, mondayOf, weekDays } from "@/lib/week";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type BacklogItem = { id: string; key: string; title: string; sprint_id: string | null };
type SprintSummary = { id: string; name: string; state: string };
type SheetItem = {
  id: string;
  key: string;
  title: string;
  sprint_id: string | null;
  project_id: string;
  project_key: string;
  project_name: string;
};

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const { week } = await searchParams;
  const parsed = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T00:00:00Z`) : null;
  const start = mondayOf(parsed ?? new Date());
  const end = addDays(start, 6);
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);

  const [sheetResponse, projectsResponse, policyResponse] = await Promise.all([
    gatewayFetch(`/work/timesheet?from=${from}&to=${to}`, {}, token),
    gatewayFetch("/tasks/projects", {}, token),
    gatewayFetch("/work/policy", {}, token),
  ]);
  if (sheetResponse.status === 401) redirect("/login");

  const entries: TimesheetEntry[] = sheetResponse.ok
    ? ((await sheetResponse.json()) as { data: { entries: TimesheetEntry[] } }).data.entries
    : [];
  const projects: Project[] = projectsResponse.ok
    ? ((await projectsResponse.json()) as { data: Project[] }).data
    : [];
  const allowWithoutSprint = policyResponse.ok
    ? ((await policyResponse.json()) as { data: { allow_time_without_sprint: boolean } }).data
        .allow_time_without_sprint
    : true;
  const backlogs = await Promise.all(
    projects.map(async (project) => {
      const response = await gatewayFetch(`/tasks/projects/${project.id}/backlog`, {}, token);
      if (!response.ok) return [] as SheetItem[];
      const payload = (await response.json()) as { data: BacklogItem[] };
      return payload.data.map((item) => ({
        ...item,
        project_id: project.id,
        project_key: project.key,
        project_name: project.name,
      }));
    }),
  );
  const items = backlogs.flat().sort((a, b) => a.key.localeCompare(b.key));
  const sprintLists = await Promise.all(
    projects.map(async (project) => {
      const response = await gatewayFetch(`/tasks/sprints?project_id=${project.id}`, {}, token);
      if (!response.ok) return [] as SheetSprint[];
      const payload = (await response.json()) as { data: SprintSummary[] };
      return payload.data
        .filter((sprint) => sprint.state !== "COMPLETED")
        .map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          project_key: project.key,
        }));
    }),
  );
  const sprints = sprintLists
    .flat()
    .sort((a, b) => Number(b.state === "ACTIVE") - Number(a.state === "ACTIVE"));

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            <Link href="/" className="hover:text-[var(--text-primary)]">
              Dashboard
            </Link>{" "}
            / My work
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Timesheet</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Your tracked and manual time, Monday to Sunday.
          </p>
        </div>
      </div>

      {!sheetResponse.ok ? (
        <InlineAlert>Timesheets could not be loaded. Try refreshing the page.</InlineAlert>
      ) : null}

      <TimesheetClient
        weekStart={from}
        days={weekDays(start).map((day) => day.toISOString().slice(0, 10))}
        entries={entries}
        items={items}
        sprints={sprints}
        allowWithoutSprint={allowWithoutSprint}
        canWrite={profile.permissions.includes("work:log:write")}
        canExport={profile.permissions.includes("report:export")}
      />
    </AppShell>
  );
}
