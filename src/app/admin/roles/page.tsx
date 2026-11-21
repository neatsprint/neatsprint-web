import { redirect } from "next/navigation";
import { Fragment } from "react";

import { AppShell } from "@/components/app-shell";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type RoleRow = {
  id: string;
  code: string;
  name: string;
  is_system: boolean;
  permissions: string[];
};

type PermissionRow = { code: string; description: string | null };

export default async function RolesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("core:role:read")) redirect("/");

  const token = await getAccessToken();
  const [rolesResponse, permissionsResponse] = await Promise.all([
    gatewayFetch("/iam/roles", {}, token),
    gatewayFetch("/iam/permissions", {}, token),
  ]);
  if (rolesResponse.status === 401) redirect("/login");

  const roles = rolesResponse.ok
    ? ((await rolesResponse.json()) as { data: RoleRow[] }).data
    : [];
  const permissions = permissionsResponse.ok
    ? ((await permissionsResponse.json()) as { data: PermissionRow[] }).data
    : [];

  const grouped = new Map<string, PermissionRow[]>();
  for (const permission of permissions) {
    const domain = permission.code.split(":")[0] ?? "other";
    grouped.set(domain, [...(grouped.get(domain) ?? []), permission]);
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[13px] text-[var(--text-secondary)]">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Roles & permissions</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          System roles are immutable in MVP. Effective permissions are additive across roles.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="sticky top-0 bg-[var(--bg-subtle)] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
            <tr>
              <th className="px-3 py-3 font-medium">Permission</th>
              {roles.map((role) => (
                <th key={role.id} className="px-3 py-3 text-center font-medium">
                  {role.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([domain, rows]) => (
              <Fragment key={`section-${domain}`}>
                <tr className="bg-[var(--bg-subtle)]">
                  <td
                    colSpan={roles.length + 1}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
                  >
                    {domain}
                  </td>
                </tr>
                {rows.map((permission) => (
                  <tr key={permission.code} className="border-t">
                    <td className="px-3 py-2">
                      <span className="mono text-[12px]">{permission.code}</span>
                      <span className="ml-2 text-[var(--text-tertiary)]">
                        {permission.description}
                      </span>
                    </td>
                    {roles.map((role) => (
                      <td key={`${role.id}-${permission.code}`} className="px-3 py-2 text-center">
                        {role.permissions.includes(permission.code) ? (
                          <span className="text-[var(--success-600)]" aria-label="granted">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]" aria-label="not granted">
                            ·
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--text-tertiary)]">
        Permission changes are audited. Custom role composition is an Enterprise feature (P3).
      </p>
    </AppShell>
  );
}
