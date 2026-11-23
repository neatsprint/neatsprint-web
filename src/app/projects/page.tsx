import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CreateProjectForm } from "@/app/projects/create-project-form";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: string;
};

export default async function ProjectsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const response = await gatewayFetch("/tasks/projects", {}, token);
  if (response.status === 401) redirect("/login");
  const projects = response.ok
    ? ((await response.json()) as { data: Project[] }).data
    : [];
  const canCreate = profile.permissions.includes("task:project:create");

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">Work</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {projects.length} active projects
          </p>
        </div>
        {canCreate ? <CreateProjectForm /> : null}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed p-10 text-center">
          <p className="text-base font-medium">No projects yet</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Create a project to start planning work.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <section
              key={project.id}
              className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]"
            >
              <div className="flex items-center justify-between">
                <span className="mono rounded bg-[var(--bg-subtle)] px-2 py-0.5 text-[12px]">
                  {project.key}
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--success-600)]">
                  {project.status}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold">{project.name}</h2>
              <p className="mt-1 line-clamp-2 text-[13px] text-[var(--text-secondary)]">
                {project.description ?? "No description"}
              </p>
              <div className="mt-4 flex gap-3 text-[13px]">
                <Link
                  href={`/projects/${project.id}/board`}
                  className="font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)]"
                >
                  Board
                </Link>
                <Link
                  href={`/projects/${project.id}/backlog`}
                  className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Backlog
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
