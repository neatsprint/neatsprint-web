"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export type Team = {
  id: string;
  name: string;
  description: string | null;
  lead_id: string | null;
};

export type TeamMember = {
  user_id: string;
  role_in_team: string;
  joined_at?: string;
};

export type TeamUser = {
  id: string;
  full_name: string;
  email: string;
  status: string;
};

export function TeamCard({
  team,
  initialMembers,
  users,
  canManage,
}: {
  team: Team;
  initialMembers: TeamMember[];
  users: TeamUser[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const available = users.filter(
    (user) => user.status === "ACTIVE" && !members.some((member) => member.user_id === user.id),
  );

  function displayName(member: TeamMember): string {
    return userMap.get(member.user_id)?.full_name ?? member.user_id.slice(0, 8);
  }

  async function addMember() {
    if (!userId || pending) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/session/teams/${team.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role_in_team: role }),
    }).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      const payload = response
        ? ((await response.json().catch(() => ({}))) as { detail?: string })
        : {};
      setError(payload.detail ?? "That member could not be added.");
      return;
    }
    setMembers((current) => [...current, { user_id: userId, role_in_team: role }]);
    setUserId("");
    setRole("MEMBER");
  }

  async function removeMember(member: TeamMember) {
    if (pending) return;
    setPending(true);
    setError(null);
    const response = await fetch(
      `/api/session/teams/${team.id}/members/${member.user_id}`,
      { method: "DELETE" },
    ).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      setError("That member could not be removed.");
      return;
    }
    setMembers((current) => current.filter((row) => row.user_id !== member.user_id));
  }

  return (
    <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{team.name}</h2>
        <span className="rounded-full border px-2 py-0.5 text-[11px]">
          {members.length} members
        </span>
      </div>
      <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
        {team.description || "No description"}
      </p>

      <ul className="mt-4 space-y-1.5" aria-label={`${team.name} members`}>
        {members.map((member) => (
          <li
            key={member.user_id}
            className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] px-2 py-1.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">
                {displayName(member)}
              </span>
              <span className="block truncate text-[11px] text-[var(--text-tertiary)]">
                {userMap.get(member.user_id)?.email ?? ""}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.04em]">
                {member.role_in_team}
              </span>
              {canManage ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void removeMember(member)}
                  className="text-[11px] font-medium text-[var(--danger-600)] disabled:opacity-50"
                  aria-label={`Remove ${displayName(member)} from ${team.name}`}
                >
                  Remove
                </button>
              ) : null}
            </span>
          </li>
        ))}
        {members.length === 0 ? (
          <li className="text-[13px] text-[var(--text-tertiary)]">No members yet.</li>
        ) : null}
      </ul>

      {canManage ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="h-8 min-w-40 flex-1 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[12px]"
            aria-label={`Add a member to ${team.name}`}
          >
            <option value="">Add member…</option>
            {available.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-8 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[12px]"
            aria-label={`Role for the new member of ${team.name}`}
          >
            <option value="MEMBER">Member</option>
            <option value="LEAD">Lead</option>
          </select>
          <Button size="sm" disabled={!userId || pending} onClick={() => void addMember()}>
            {pending ? "Saving…" : "Add"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
