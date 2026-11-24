import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  request_id: string | null;
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("report:audit:view")) redirect("/admin/settings");
  const token = await getAccessToken();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = params.from ?? new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const to = params.to ?? today;
  const action = params.action ?? "";
  const query = new URLSearchParams({ from, to, limit: "200" });
  if (action) query.set("action", action);
  const response = await gatewayFetch(`/iam/audit?${query.toString()}`, {}, token);
  const rows: AuditRow[] = response.ok
    ? ((await response.json()) as { data: AuditRow[] }).data
    : [];

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/admin/settings" className="hover:text-[var(--text-primary)]">
            Admin
          </Link>{" "}
          / Audit
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Append-only record of security and administration actions.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">Action</span>
            <input
              name="action"
              defaultValue={action}
              placeholder="e.g. login"
              className="h-9 w-44 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">From</span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">To</span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded-[var(--radius-md)] bg-[var(--primary-600)] px-4 text-[13px] font-medium text-white"
          >
            Apply
          </button>
        </form>
        <a
          href={`/api/session/audit?from=${from}&to=${to}${action ? `&action=${action}` : ""}&export=csv`}
          className="ml-auto inline-flex h-9 items-center rounded-[var(--radius-md)] border px-3 text-[13px] font-medium hover:bg-[var(--bg-subtle)]"
        >
          Export CSV
        </a>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No audit rows"
          description="Try a wider date range or a different action."
        />
      ) : (
        <DataTable
          label="Audit log"
          columns={[
            { key: "time", label: "When" },
            { key: "action", label: "Action" },
            { key: "actor", label: "Actor" },
            { key: "target", label: "Target" },
            { key: "request", label: "Request" },
          ]}
        >
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-medium">{row.action}</td>
                <td className="mono px-3 py-2 text-[11px]">
                  {row.actor_id ? row.actor_id.slice(0, 8) : "system"}
                </td>
                <td className="px-3 py-2 text-[12px]">
                  {row.target_type ?? "—"}
                  {row.target_id ? ` · ${row.target_id.slice(0, 8)}` : ""}
                </td>
                <td className="mono px-3 py-2 text-[11px] text-[var(--text-tertiary)]">
                  {row.request_id ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </AppShell>
  );
}
