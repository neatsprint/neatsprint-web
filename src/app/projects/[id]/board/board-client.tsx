"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BoardItem = {
  id: string;
  key: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimate_points: number | null;
  assignee_id: string | null;
};

type Column = { status: string; items: BoardItem[] };

type Comment = { id: string; author_id: string; body: string; created_at: string };

const LABELS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
};

const TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["IN_REVIEW", "DONE", "BLOCKED"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "BLOCKED"],
  BLOCKED: ["TODO", "IN_PROGRESS"],
  DONE: ["IN_PROGRESS"],
};

export function BoardClient({
  initialColumns,
  canTransition,
  canComment,
}: {
  initialColumns: Column[];
  canTransition: boolean;
  canComment: boolean;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<BoardItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  function findItem(itemId: string): { item: BoardItem; status: string } | null {
    for (const column of columns) {
      const item = column.items.find((candidate) => candidate.id === itemId);
      if (item) return { item, status: column.status };
    }
    return null;
  }

  async function move(itemId: string, targetStatus: string) {
    const found = findItem(itemId);
    if (!found || found.status === targetStatus) return;
    const previous = columns;
    setColumns((current) =>
      current.map((column) => {
        if (column.status === found.status) {
          return { ...column, items: column.items.filter((item) => item.id !== itemId) };
        }
        if (column.status === targetStatus) {
          return {
            ...column,
            items: [...column.items, { ...found.item, status: targetStatus }],
          };
        }
        return column;
      }),
    );
    setError(null);

    const response = await fetch(`/api/session/items/${itemId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    }).catch(() => null);
    if (!response || !response.ok) {
      const body = response ? await response.json().catch(() => ({})) : {};
      setColumns(previous);
      setError(body.detail ?? "That move is not allowed.");
    }
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 rounded-[var(--radius-md)] border border-[var(--danger-600)] p-2 text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <section
            key={column.status}
            onDragOver={(event) => {
              if (canTransition) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const itemId = event.dataTransfer.getData("text/plain") || dragging;
              if (itemId) void move(itemId, column.status);
              setDragging(null);
            }}
            className="flex w-64 shrink-0 flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-subtle)]"
          >
            <header className="flex items-center justify-between px-3 py-2">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                {LABELS[column.status] ?? column.status}
              </h2>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {column.items.length}
              </span>
            </header>
            <div className="flex-1 space-y-2 p-2">
              {column.items.map((item) => (
                <article
                  key={item.id}
                  draggable={canTransition}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", item.id);
                    setDragging(item.id);
                  }}
                  onClick={() => setSelected(item)}
                  className={cn(
                    "cursor-pointer rounded-[var(--radius-md)] border bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-e1)]",
                    dragging === item.id && "opacity-50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-[11px] text-[var(--text-tertiary)]">
                      {item.key}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium leading-snug">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                    <span>{item.assignee_id ? "Assigned" : "Unassigned"}</span>
                    <span>{item.estimate_points ?? "—"} pts</span>
                  </div>
                </article>
              ))}
              {column.items.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                  Drop items here
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {selected ? (
        <ItemDrawer
          item={selected}
          canTransition={canTransition}
          canComment={canComment}
          onClose={() => setSelected(null)}
          onTransition={(status) => {
            setSelected({ ...selected, status });
            void move(selected.id, status);
          }}
        />
      ) : null}
    </div>
  );
}

function ItemDrawer({
  item,
  canTransition,
  canComment,
  onClose,
  onTransition,
}: {
  item: BoardItem;
  canTransition: boolean;
  canComment: boolean;
  onClose: () => void;
  onTransition: (status: string) => void;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/session/items/${item.id}/comments`).catch(() => null);
    if (response?.ok) {
      const payload = (await response.json()) as { data: Comment[] };
      setComments(payload.data);
    } else {
      setComments([]);
    }
  }, [item.id]);

  useEffect(() => {
    void load();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [load, onClose]);

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    const response = await fetch(`/api/session/items/${item.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }).catch(() => null);
    if (response?.ok) {
      setBody("");
      await load();
    }
    setPending(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l bg-[var(--bg-surface)] shadow-[var(--shadow-e3)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b p-5">
          <div>
            <p className="mono text-[12px] text-[var(--text-tertiary)]">{item.key}</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug">{item.title}</h2>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {item.type} · {item.priority} · {item.estimate_points ?? "—"} pts
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-[var(--radius-md)] p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Description
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-[13px] text-[var(--text-secondary)]">
              {item.description || "No description yet."}
            </p>
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Status
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border px-2.5 py-1 text-[12px] font-medium">
                {LABELS[item.status] ?? item.status}
              </span>
              {canTransition
                ? (TRANSITIONS[item.status] ?? []).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onTransition(status)}
                      className="rounded-full border border-dashed px-2.5 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                    >
                      → {LABELS[status] ?? status}
                    </button>
                  ))
                : null}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Comments
            </h3>
            <ul className="mt-2 space-y-2">
              {comments?.map((comment) => (
                <li key={comment.id} className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3">
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px]">{comment.body}</p>
                </li>
              ))}
              {comments && comments.length === 0 ? (
                <li className="text-[13px] text-[var(--text-tertiary)]">No comments yet.</li>
              ) : null}
            </ul>
            {canComment ? (
              <form onSubmit={addComment} className="mt-3 flex gap-2">
                <input
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Add a comment"
                  className="h-10 flex-1 rounded-[var(--radius-md)] border px-3 text-[13px]"
                />
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 size={16} className="animate-spin" /> : null}
                  Post
                </Button>
              </form>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}
