import Link from "next/link";
import { redirect } from "next/navigation";

import { BacklogClient, type BacklogItem } from "@/app/projects/[id]/backlog/backlog-client";
import { AppShell } from "@/components/app-shell";
import { ProjectUnavailable } from "@/components/project-unavailable";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = { id: string; key: string; name: string };
type Sprint = { id: string; name: string; state: string };
type User = { id: string; full_name: string; email: string; status: string };

export default async function BacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();

  const [projectResponse, backlogResponse, sprintsResponse, usersResponse] = await Promise.all([
    gatewayFetch(`/tasks/projects/${id}`, {}, token),
    gatewayFetch(`/tasks/projects/${id}/backlog`, {}, token),
    gatewayFetch(`/tasks/sprints?project_id=${id}`, {}, token),
    gatewayFetch("/iam/users?per_page=200", {}, token),
  ]);
  if (projectResponse.status === 401) redirect("/login");
  if (projectResponse.status === 404) return <ProjectUnavailable />;
  if (!projectResponse.ok) redirect("/projects");

  const project = ((await projectResponse.json()) as { data: Project }).data;
  const items: BacklogItem[] = backlogResponse.ok
    ? ((await backlogResponse.json()) as { data: BacklogItem[] }).data
    : [];
  const sprints: Sprint[] = sprintsResponse.ok
    ? ((await sprintsResponse.json()) as { data: Sprint[] }).data
    : [];
  const users: User[] = usersResponse.ok
    ? ((await usersResponse.json()) as { data: User[] }).data
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
          <Link
            href={`/projects/${id}/planning`}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Planning
          </Link>
          <Link
            href={`/projects/${id}/settings`}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Settings
          </Link>
        </nav>
      </div>

      {!backlogResponse.ok ? (
        <InlineAlert>Some backlog data could not be loaded. Try refreshing the page.</InlineAlert>
      ) : null}

      <BacklogClient
        projectId={id}
        initialItems={items}
        sprints={sprints}
        users={users}
        canCreate={profile.permissions.includes("task:item:create")}
        canEdit={profile.permissions.includes("task:item:edit")}
        canTransition={profile.permissions.includes("task:item:transition")}
        canAssign={profile.permissions.includes("task:item:assign")}
        canDelete={profile.permissions.includes("task:item:delete")}
      />
    </AppShell>
  );
}
