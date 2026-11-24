import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Screenshot = {
  id: string;
  user_id: string;
  captured_at: string;
  state: string;
  visible_after: string;
  deleted_at: string | null;
  deleted_by_user: boolean;
  content_url: string | null;
  width: number;
  height: number;
  display_index: number;
};

type MonitorSession = {
  id: string;
  user_id: string;
  state: string;
  started_at: string;
  ended_at: string | null;
};

type User = { id: string; full_name: string; email: string };

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; user?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const params = await searchParams;
  const today = new Date();
  const to = params.to ?? isoDay(today);
  const from = params.from ?? isoDay(new Date(today.getTime() - 6 * 86_400_000));
  const userFilter = params.user ?? "";
  const query = new URLSearchParams({ from, to });
  if (userFilter) query.set("user_id", userFilter);

  const [galleryResponse, sessionsResponse, usersResponse] = await Promise.all([
    gatewayFetch(`/monitor/screenshots?${query.toString()}`, {}, token),
    gatewayFetch(`/monitor/sessions?${query.toString()}`, {}, token),
    gatewayFetch("/iam/users?per_page=200", {}, token),
  ]);
  if (galleryResponse.status === 401) redirect("/login");

  if (galleryResponse.status === 403) {
    return (
      <AppShell>
        <EmptyState
          title="Monitoring access required"
          description="Your role does not include team monitoring. Ask an admin if you need it."
          action={
            <Link
              href="/projects"
              className="text-[13px] font-medium text-[var(--primary-600)]"
            >
              Back to projects
            </Link>
          }
        />
      </AppShell>
    );
  }

  const screenshots: Screenshot[] = galleryResponse.ok
    ? ((await galleryResponse.json()) as { data: Screenshot[] }).data
    : [];
  const sessions: MonitorSession[] = sessionsResponse.ok
    ? ((await sessionsResponse.json()) as { data: MonitorSession[] }).data
    : [];
  const users: User[] = usersResponse.ok
    ? ((await usersResponse.json()) as { data: User[] }).data
    : [];
  const userMap = new Map(users.map((user) => [user.id, user.full_name]));

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/teams" className="hover:text-[var(--text-primary)]">
            Team
          </Link>{" "}
          / Monitoring
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Team monitoring</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
          Only captures whose privacy window has closed are visible. Deleted captures show a
          tombstone. Every image view is written to the audit log.
        </p>
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
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
        <label className="text-[12px] text-[var(--text-secondary)]">
          <span className="mb-1 block">Person</span>
          <select
            name="user"
            defaultValue={userFilter}
            className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
          >
            <option value="">Everyone in scope</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-md)] bg-[var(--primary-600)] px-4 text-[13px] font-medium text-white"
        >
          Apply
        </button>
        <span className="ml-auto rounded-full border bg-[var(--bg-subtle)] px-3 py-1 text-[11px] text-[var(--text-secondary)]">
          Viewing is recorded in the audit log
        </span>
      </form>

      {!galleryResponse.ok ? (
        <InlineAlert>Monitoring captures could not be loaded.</InlineAlert>
      ) : null}

      <section className="mb-5 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
        <h2 className="text-base font-semibold">Session timeline</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
            No monitoring sessions in this range.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {sessions.slice(0, 12).map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] px-3 py-2 text-[12px]"
              >
                <span className="font-medium">
                  {userMap.get(session.user_id) ?? "Unknown user"}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {new Date(session.started_at).toLocaleString()}
                  {session.ended_at
                    ? ` → ${new Date(session.ended_at).toLocaleTimeString()}`
                    : " → running"}
                </span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  {session.state}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <h2 className="mb-2 text-base font-semibold">Captures</h2>
      {screenshots.length === 0 ? (
        <EmptyState
          title="No visible captures"
          description="Captures appear after their privacy window closes, or when the person explicitly shares them."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {screenshots.map((screenshot) => {
            const tombstone = screenshot.state === "DELETED" || screenshot.state === "EXPIRED";
            return (
              <article
                key={screenshot.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]"
              >
                {tombstone ? (
                  <div
                    className="flex aspect-video flex-col items-center justify-center gap-1 text-[var(--text-tertiary)]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, var(--bg-subtle), var(--bg-subtle) 8px, var(--bg-surface) 8px, var(--bg-surface) 16px)",
                    }}
                  >
                    <Trash2 size={20} />
                    <p className="text-[12px] font-medium">Deleted by user</p>
                    <p className="text-[11px]">
                      {screenshot.deleted_at
                        ? new Date(screenshot.deleted_at).toLocaleString()
                        : "Removed"}
                    </p>
                  </div>
                ) : (
                  <div className="relative aspect-video bg-[var(--bg-subtle)]">
                    {screenshot.content_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/session${screenshot.content_url.replace("/api/v1", "")}`}
                        alt={`Capture for ${userMap.get(screenshot.user_id) ?? "user"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Eye size={11} />
                      Audited view
                    </span>
                  </div>
                )}
                <div className="p-3 text-[12px]">
                  <p className="font-medium">
                    {userMap.get(screenshot.user_id) ?? "Unknown user"}
                  </p>
                  <p className="mt-0.5 text-[var(--text-secondary)]">
                    {new Date(screenshot.captured_at).toLocaleString()} · display{" "}
                    {screenshot.display_index + 1}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                    {screenshot.width}×{screenshot.height} · {screenshot.state}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
