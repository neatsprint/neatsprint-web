import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectSettingsForm } from "@/app/projects/[id]/settings/settings-form";
import { ProjectTeams } from "@/app/projects/[id]/settings/project-teams";
import { AppShell } from "@/components/app-shell";
import { ProjectUnavailable } from "@/components/project-unavailable";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const response = await gatewayFetch(`/tasks/projects/${id}`, {}, token);
  if (response.status === 401) redirect("/login");
  if (response.status === 404) return <ProjectUnavailable />;
  if (!response.ok) redirect("/projects");
  const project = ((await response.json()) as { data: Project }).data;
  const canEdit = profile.permissions.includes("task:project:edit");

  const [teamsResponse, projectTeamsResponse] = await Promise.all([
    gatewayFetch("/teams", {}, token),
    gatewayFetch(`/tasks/projects/${id}/teams`, {}, token),
  ]);
  const teams = teamsResponse.ok
    ? ((await teamsResponse.json()) as { data: Array<{ id: string; name: string }> }).data
    : [];
  const selected = projectTeamsResponse.ok
    ? ((await projectTeamsResponse.json()) as { data: string[] }).data
    : [];

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/projects" className="hover:text-[var(--text-primary)]">
            Projects
          </Link>{" "}
          / {project.key}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Project settings</h1>
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
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            Planning
          </Link>
          <Link
            href={`/projects/${id}/settings`}
            className="rounded-[var(--radius-md)] bg-[var(--primary-100)] px-3 py-1.5 font-medium text-[var(--primary-700)]"
          >
            Settings
          </Link>
        </nav>
      </div>

      {!teamsResponse.ok || !projectTeamsResponse.ok ? (
        <InlineAlert>Some project settings could not be loaded.</InlineAlert>
      ) : null}

      <section className="max-w-2xl rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
        {!canEdit ? (
          <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
            You can view this project but not edit it.
          </p>
        ) : null}
        <ProjectSettingsForm project={project} />
      </section>

      <section className="mt-4 max-w-2xl rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
        <h2 className="mb-1 text-base font-semibold">Project teams</h2>
        <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
          Only members of these teams can open this project. Leave every box clear to make the
          project visible to the whole workspace.
        </p>
        <ProjectTeams
          projectId={id}
          teams={teams}
          selected={selected}
          canEdit={canEdit}
        />
      </section>
    </AppShell>
  );
}
