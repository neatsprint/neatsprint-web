import { redirect } from "next/navigation";

import { CreateTeamForm } from "@/app/teams/create-team-form";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Team = { id: string; name: string; description: string | null; lead_id: string | null };

export default async function TeamsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const response = await gatewayFetch("/teams", {}, token);
  if (response.status === 401) redirect("/login");
  const teams: Team[] = response.ok
    ? ((await response.json()) as { data: Team[] }).data
    : [];
  const loadFailed = !response.ok;

  const memberships = await Promise.all(
    teams.map(async (team) => {
      const members = await gatewayFetch(`/teams/${team.id}/members`, {}, token);
      if (!members.ok) return 0;
      const payload = (await members.json()) as { data: unknown[] };
      return payload.data.length;
    }),
  );

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">Team</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {teams.length} teams · you are {profile.roles.join(", ")}
          </p>
        </div>
        {profile.permissions.includes("team:team:manage") ? <CreateTeamForm /> : null}
      </div>

      {loadFailed ? (
        <InlineAlert>Teams could not be loaded. Try refreshing the page.</InlineAlert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team, index) => (
          <section
            key={team.id}
            className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{team.name}</h2>
              <span className="rounded-full border px-2 py-0.5 text-[11px]">
                {memberships[index] ?? 0} members
              </span>
            </div>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              {team.description || "No description"}
            </p>
            <p className="mt-4 text-[12px] text-[var(--text-tertiary)]">
              Lead: {team.lead_id ? "assigned" : "unassigned"}
            </p>
          </section>
        ))}
        {teams.length === 0 && !loadFailed ? (
          <EmptyState
            className="md:col-span-2 xl:col-span-3"
            title="No teams yet"
            description="Create your first team to group people around work."
          />
        ) : null}
      </div>
    </AppShell>
  );
}
