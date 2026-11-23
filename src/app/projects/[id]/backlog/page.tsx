import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type Item = {
  id: string;
  key: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  estimate_points: number | null;
  assignee_id: string | null;
  sprint_id: string | null;
};

export default async function BacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();

  const [projectResponse, backlogResponse] = await Promise.all([
    gatewayFetch(`/tasks/projects/${id}`, {}, token),
    gatewayFetch(`/tasks/projects/${id}/backlog`, {}, token),
  ]);
  if (projectResponse.status === 401) redirect("/login");
  if (!projectResponse.ok) redirect("/projects");

  const project = ((await projectResponse.json()) as { data: Project }).data;
  const items: Item[] = backlogResponse.ok
    ? ((await backlogResponse.json()) as { data: Item[] }).data
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.name} backlog</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{items.length} items</p>
        </div>
        <nav className="flex gap-2 text-[13px]">
          <Link
            href={`/projects/${id}/board`}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Board
          </Link>
          <Link
            href={`/projects/${id}/backlog`}
            className="rounded-[var(--radius-md)] bg-[var(--primary-100)] px-3 py-1.5 font-medium text-[var(--primary-700)]"
          >
            Backlog
          </Link>
        </nav>
      </div>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[var(--bg-subtle)] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Estimate</th>
              <th className="px-4 py-3 font-medium">Sprint</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--bg-subtle)]">
                <td className="mono px-4 py-3 text-[12px]">{item.key}</td>
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{item.type}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">{item.priority}</td>
                <td className="px-4 py-3">{item.estimate_points ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">
                  {item.sprint_id ? "Committed" : "Backlog"}
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--text-secondary)]">
                  No items yet. Add the first item from the API or seed script.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
