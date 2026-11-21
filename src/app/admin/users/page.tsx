import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { InviteForm } from "@/app/admin/users/invite-form";
import { SignOutButton } from "@/app/admin/users/sign-out-button";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  job_title: string | null;
  roles: string[];
  last_login_at: string | null;
};

type RoleRow = { id: string; code: string; name: string };

export default async function UsersPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const token = await getAccessToken();
  const usersResponse = await gatewayFetch("/iam/users?per_page=100", {}, token);
  if (usersResponse.status === 401) redirect("/login");

  const usersBody = usersResponse.ok
    ? ((await usersResponse.json()) as { data: UserRow[] })
    : { data: [] };
  const canManage = profile.permissions.includes("core:user:invite");

  let roles: RoleRow[] = [];
  if (canManage) {
    const rolesResponse = await gatewayFetch("/iam/roles", {}, token);
    if (rolesResponse.ok) {
      const body = (await rolesResponse.json()) as { data: RoleRow[] };
      roles = body.data;
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {usersBody.data.length} people in this workspace · signed in as {profile.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      {canManage ? (
        <section className="mb-4 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="mb-3 text-base font-semibold">Invite a teammate</h2>
          <InviteForm roles={roles} />
        </section>
      ) : (
        <p className="mb-4 rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] p-3 text-[13px] text-[var(--text-secondary)]">
          You can view users but not invite them. Ask an owner or admin for access.
        </p>
      )}

      <section className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usersBody.data.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--bg-subtle)]">
                <td className="px-4 py-3 font-medium">{user.full_name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.status === "ACTIVE"
                        ? "text-[var(--success-600)]"
                        : "text-[var(--text-tertiary)]"
                    }
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString()
                    : "Never"}
                </td>
              </tr>
            ))}
            {usersBody.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-secondary)]">
                  No users yet. Invite your first teammate above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-xs text-[var(--text-tertiary)]">
        Role changes, invitations and sign-ins are written to the append-only audit log.
      </p>
    </AppShell>
  );
}
