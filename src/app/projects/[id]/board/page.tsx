import Link from "next/link";
import { redirect } from "next/navigation";

import { BoardClient, type BoardItem } from "@/app/projects/[id]/board/board-client";
import { AppShell } from "@/components/app-shell";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type Column = { status: string; items: BoardItem[] };
type Sprint = { id: string; name: string; state: string };

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();

  const [projectResponse, sprintsResponse] = await Promise.all([
    gatewayFetch(`/tasks/projects/${id}`, {}, token),
    gatewayFetch(`/tasks/sprints?project_id=${id}`, {}, token),
  ]);
  if (projectResponse.status === 401) redirect("/login");
  if (!projectResponse.ok) redirect("/projects");

  const project = ((await projectResponse.json()) as { data: Project }).data;
  const sprints: Sprint[] = sprintsResponse.ok
    ? ((await sprintsResponse.json()) as { data: Sprint[] }).data
    : [];
  const active = sprints.find((sprint) => sprint.state === "ACTIVE") ?? sprints[0];

  const boardResponse = await gatewayFetch(
    `/tasks/projects/${id}/board${active ? `?sprint_id=${active.id}` : ""}`,
    {},
    token,
  );
  const columns: Column[] = boardResponse.ok
    ? ((await boardResponse.json()) as { data: { columns: Column[] } }).data.columns
    : [];

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            <Link href="/projects" className="hover:text-[var(--text-primary)]">
              Projects
            </Link>{" "}
            / {project.key}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {active ? `${active.name} · ${active.state}` : "No sprint planned"}
          </p>
        </div>
        <nav className="flex gap-2 text-[13px]">
          <Link
            href={`/projects/${id}/board`}
            className="rounded-[var(--radius-md)] bg-[var(--primary-100)] px-3 py-1.5 font-medium text-[var(--primary-700)]"
          >
            Board
          </Link>
          <Link
            href={`/projects/${id}/backlog`}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Backlog
          </Link>
        </nav>
      </div>

      <BoardClient
        initialColumns={columns}
        canTransition={profile.permissions.includes("task:item:transition")}
        canComment={profile.permissions.includes("task:item:comment")}
      />
    </AppShell>
  );
}
