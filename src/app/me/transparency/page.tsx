import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Capture = {
  id: string;
  captured_at: string;
  state: string;
  visible_after: string;
  deleted_at: string | null;
};

type Deletion = {
  screenshot_id: string;
  deleted_at: string;
  request_source: string;
  blob_confirmed_deleted: boolean;
  embedding_confirmed_deleted: boolean;
};

type Session = {
  id: string;
  state: string;
  started_at: string;
  ended_at: string | null;
};

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function TransparencyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const params = await searchParams;
  const today = new Date();
  const to = params.to ?? isoDay(today);
  const from = params.from ?? isoDay(new Date(today.getTime() - 6 * 86_400_000));
  const response = await gatewayFetch(
    `/monitor/transparency?from=${from}&to=${to}`,
    {},
    token,
  );
  if (response.status === 401) redirect("/login");
  const payload = response.ok
    ? ((await response.json()) as {
        data: { captures: Capture[]; deletions: Deletion[]; sessions: Session[] };
      }).data
    : { captures: [], deletions: [], sessions: [] };

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/" className="hover:text-[var(--text-primary)]">
            Dashboard
          </Link>{" "}
          / My work
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Transparency log</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
          Every capture, deletion and monitoring session that belongs to you. This view never
          includes images.
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
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-md)] bg-[var(--primary-600)] px-4 text-[13px] font-medium text-white"
        >
          Apply
        </button>
      </form>

      {!response.ok ? <InlineAlert>The transparency log could not be loaded.</InlineAlert> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4">
          <h2 className="text-base font-semibold">Captures</h2>
          {payload.captures.length === 0 ? (
            <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">No captures.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {payload.captures.map((capture) => (
                <li
                  key={capture.id}
                  className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-2 text-[12px]"
                >
                  <p className="font-medium">{new Date(capture.captured_at).toLocaleString()}</p>
                  <p className="mt-0.5 text-[var(--text-secondary)]">
                    {capture.state}
                    {capture.deleted_at
                      ? ` · deleted ${new Date(capture.deleted_at).toLocaleString()}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4">
          <h2 className="text-base font-semibold">Deletions</h2>
          {payload.deletions.length === 0 ? (
            <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">No deletions.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {payload.deletions.map((deletion) => (
                <li
                  key={`${deletion.screenshot_id}-${deletion.deleted_at}`}
                  className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-2 text-[12px]"
                >
                  <p className="font-medium">
                    {new Date(deletion.deleted_at).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[var(--text-secondary)]">
                    {deletion.request_source} · blob {deletion.blob_confirmed_deleted ? "gone" : "pending"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4">
          <h2 className="text-base font-semibold">Sessions</h2>
          {payload.sessions.length === 0 ? (
            <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">No sessions.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {payload.sessions.map((session) => (
                <li
                  key={session.id}
                  className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-2 text-[12px]"
                >
                  <p className="font-medium">
                    {new Date(session.started_at).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[var(--text-secondary)]">
                    {session.ended_at
                      ? `ended ${new Date(session.ended_at).toLocaleTimeString()}`
                      : "running"}{" "}
                    · {session.state}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {payload.captures.length === 0 &&
      payload.deletions.length === 0 &&
      payload.sessions.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="Nothing in this range"
          description="Try a wider date range. Captures and sessions are listed only when your timer ran."
        />
      ) : null}
    </AppShell>
  );
}
