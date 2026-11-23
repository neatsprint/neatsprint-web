import Link from "next/link";
import { redirect } from "next/navigation";

import { PlanningClient } from "@/app/projects/[id]/planning/planning-client";
import { AppShell } from "@/components/app-shell";
import { ProjectUnavailable } from "@/components/project-unavailable";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type Sprint = { id: string; name: string; state: string };
type Item = {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  estimate_points: number | null;
  sprint_id: string | null;
};

export default async function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();

  const [projectResponse, sprintsResponse, backlogResponse] = await Promise.all([
    gatewayFetch(`/tasks/projects/${id}`, {}, token),
    gatewayFetch(`/tasks/sprints?project_id=${id}`, {}, token),
    gatewayFetch(`/tasks/projects/${id}/backlog`, {}, token),
  ]);
  if (projectResponse.status === 401) redirect("/login");
  if (projectResponse.status === 404) return <ProjectUnavailable />;
  if (!projectResponse.ok) redirect("/projects");

  let loadError = !sprintsResponse.ok || !backlogResponse.ok;

  const project = ((await projectResponse.json()) as { data: Project }).data;
  const sprints: Sprint[] = sprintsResponse.ok
    ? ((await sprintsResponse.json()) as { data: Sprint[] }).data
    : [];
  const sprint =
    sprints.find((item) => item.state === "ACTIVE") ??
    sprints.find((item) => item.state === "PLANNED") ??
    null;

  const backlog: Item[] = backlogResponse.ok
    ? ((await backlogResponse.json()) as { data: Item[] }).data
    : [];

  let sprintItems: Item[] = [];
  if (sprint) {
    const itemsResponse = await gatewayFetch(`/tasks/sprints/${sprint.id}/items`, {}, token);
    if (itemsResponse.ok) {
      sprintItems = ((await itemsResponse.json()) as { data: Item[] }).data;
    } else {
      loadError = true;
    }
  }
  const sprintIds = new Set(sprintItems.map((item) => item.id));
  const available = backlog.filter((item) => !sprintIds.has(item.id) && item.status !== "DONE");

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/projects" className="hover:text-[var(--text-primary)]">
            Projects
          </Link>{" "}
          / {project.key}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.name} planning</h1>
        <nav className="mt-2 flex gap-2 text-[13px]">
          <Link
            href={`/projects/${id}/board`}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Board
          </Link>
          <Link
            href={`/projects/${id}/backlog`}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Backlog
          </Link>
          <Link
            href={`/projects/${id}/planning`}
            className="rounded-[var(--radius-md)] bg-[var(--primary-100)] px-3 py-1.5 font-medium text-[var(--primary-700)]"
          >
            Planning
          </Link>
        </nav>
      </div>

      {loadError ? (
        <InlineAlert>Some planning data could not be loaded. Try refreshing the page.</InlineAlert>
      ) : null}

      <PlanningClient
        projectId={id}
        sprint={sprint}
        backlog={available}
        sprintItems={sprintItems}
        canManage={profile.permissions.includes("task:sprint:manage")}
      />
    </AppShell>
  );
}
