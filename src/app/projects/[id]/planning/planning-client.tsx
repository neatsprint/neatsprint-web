"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { PriorityBadge } from "@/components/ui/task-badges";

type Item = {
  id: string;
  key: string;
  title: string;
  status: string;
  estimate_points: number | null;
  priority: string;
};

type Sprint = { id: string; name: string; state: string } | null;

export function PlanningClient({
  projectId,
  sprint,
  backlog,
  sprintItems,
  canManage,
}: {
  projectId: string;
  sprint: Sprint;
  backlog: Item[];
  sprintItems: Item[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function call(key: string, url: string, init: RequestInit) {
    setPending(key);
    setError(null);
    const response = await fetch(url, init).catch(() => null);
    if (!response || !response.ok) {
      const body = response ? await response.json().catch(() => ({})) : {};
      setError(body.detail ?? "That change could not be saved.");
      setPending(null);
      return false;
    }
    setPending(null);
    router.refresh();
    return true;
  }

  async function createSprint(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const ok = await call("create", "/api/session/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, name }),
    });
    if (ok) setName("");
  }

  if (!sprint) {
    return (
      <div className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-6">
        <h2 className="text-base font-semibold">Plan a sprint</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Create a sprint, add items, then start it when the scope is committed.
        </p>
        <form onSubmit={createSprint} className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Sprint 1"
            className="h-10 flex-1 rounded-[var(--radius-md)] border px-3 text-[13px]"
          />
          <Button type="submit" disabled={!canManage || pending === "create"}>
            {pending === "create" ? <Loader2 size={16} className="animate-spin" /> : null}
            Create sprint
          </Button>
        </form>
        {error ? <InlineAlert>{error}</InlineAlert> : null}
      </div>
    );
  }

  const committed = sprintItems.reduce((sum, item) => sum + (item.estimate_points ?? 0), 0);

  return (
    <div>
      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4">
        <div>
          <h2 className="text-base font-semibold">
            {sprint.name} <span className="text-[12px] font-normal text-[var(--text-tertiary)]">({sprint.state})</span>
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {sprintItems.length} items · {committed} points committed
          </p>
        </div>
        {sprint.state === "PLANNED" && canManage ? (
          <Button
            onClick={() =>
              call("start", `/api/session/sprints/${sprint.id}/start`, {
                method: "POST",
                body: "{}",
              })
            }
            disabled={sprintItems.length === 0 || pending === "start"}
          >
            {pending === "start" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Start sprint
          </Button>
        ) : null}
        {sprint.state === "ACTIVE" && canManage ? (
          <Button
            variant="secondary"
            onClick={() => {
              if (!window.confirm(`Complete “${sprint.name}”? Unfinished items return to the backlog.`)) {
                return;
              }
              void call("complete", `/api/session/sprints/${sprint.id}/complete`, {
                method: "POST",
                body: "{}",
              });
            }}
            disabled={pending === "complete"}
          >
            {pending === "complete" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Complete sprint
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)]">
          <header className="border-b px-4 py-3">
            <h3 className="text-[13px] font-semibold">Backlog</h3>
          </header>
          <ul className="divide-y">
            {backlog.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                <span className="mono text-[11px] text-[var(--text-tertiary)]">{item.key}</span>
                <span className="flex-1 text-[13px]">{item.title}</span>
                <PriorityBadge priority={item.priority} />
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {item.estimate_points ?? "—"} pts
                </span>
                {canManage ? (
                  <button
                    type="button"
                    aria-label="Add to sprint"
                    disabled={pending === item.id}
                    onClick={() =>
                      call(item.id, `/api/session/sprints/${sprint.id}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ item_ids: [item.id] }),
                      })
                    }
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--primary-600)] hover:bg-[var(--bg-subtle)]"
                  >
                    <ArrowRight size={15} />
                  </button>
                ) : null}
              </li>
            ))}
            {backlog.length === 0 ? (
              <li>
                <EmptyState
                  compact
                  className="border-0"
                  title="Nothing left in the backlog"
                  description="Every open item is already in the sprint."
                />
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)]">
          <header className="border-b px-4 py-3">
            <h3 className="text-[13px] font-semibold">Sprint scope</h3>
          </header>
          <ul className="divide-y">
            {sprintItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                <span className="mono text-[11px] text-[var(--text-tertiary)]">{item.key}</span>
                <span className="flex-1 text-[13px]">{item.title}</span>
                <PriorityBadge priority={item.priority} />
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {item.estimate_points ?? "—"} pts
                </span>
                {canManage && sprint.state === "PLANNED" ? (
                  <button
                    type="button"
                    aria-label="Remove from sprint"
                    disabled={pending === item.id}
                    onClick={() =>
                      call(item.id, `/api/session/sprints/${sprint.id}/items?item_id=${item.id}`, {
                        method: "DELETE",
                      })
                    }
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  >
                    <ArrowLeft size={15} />
                  </button>
                ) : null}
              </li>
            ))}
            {sprintItems.length === 0 ? (
              <li>
                <EmptyState
                  compact
                  className="border-0"
                  title="No sprint items yet"
                  description="Add items from the backlog to commit scope."
                />
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
