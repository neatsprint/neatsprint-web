import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type Item = {
  id: string;
  key: string;
  title: string;
  priority: string;
  estimate_points: number | null;
  assignee_id: string | null;
};
type Column = { status: string; items: Item[] };
type Sprint = { id: string; name: string; state: string };

const LABELS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
};

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

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <section
            key={column.status}
            className="flex w-64 shrink-0 flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-subtle)]"
          >
            <header className="flex items-center justify-between px-3 py-2">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                {LABELS[column.status] ?? column.status}
              </h2>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {column.items.length}
              </span>
            </header>
            <div className="space-y-2 p-2">
              {column.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[var(--radius-md)] border bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-e1)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-[11px] text-[var(--text-tertiary)]">
                      {item.key}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium leading-snug">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                    <span>{item.assignee_id ? "Assigned" : "Unassigned"}</span>
                    <span>{item.estimate_points ?? "—"} pts</span>
                  </div>
                </article>
              ))}
              {column.items.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                  Empty
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
