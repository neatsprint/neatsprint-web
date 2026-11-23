"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { InlineAlert } from "@/components/ui/inline-alert";
import { KanbanColumn } from "@/components/ui/kanban-column";
import {
  PriorityBadge,
  StatusBadge,
  statusLabel,
} from "@/components/ui/task-badges";
import { UserPill } from "@/components/ui/user-pill";
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
type User = { id: string; full_name: string };

type Comment = { id: string; author_id: string; body: string; created_at: string };
type Attachment = { id: string; file_name: string; content_type: string; size_bytes: number };

const TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["IN_REVIEW", "DONE", "BLOCKED"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "BLOCKED"],
  BLOCKED: ["TODO", "IN_PROGRESS"],
  DONE: ["IN_PROGRESS"],
};

export function BoardClient({
  initialColumns,
  users,
  canTransition,
  canComment,
}: {
  initialColumns: Column[];
  users: User[];
  canTransition: boolean;
  canComment: boolean;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<BoardItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userMap = new Map(users.map((user) => [user.id, user.full_name]));

  function assigneeName(userId: string | null): string | null {
    if (!userId) return null;
    return userMap.get(userId) ?? "Unknown user";
  }

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
      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            label={statusLabel(column.status)}
            count={column.items.length}
            emptyLabel="Drop items here"
            onDragOver={(event) => {
              if (canTransition) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const itemId = event.dataTransfer.getData("text/plain") || dragging;
              if (itemId) void move(itemId, column.status);
              setDragging(null);
            }}
          >
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
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-[11px] text-[var(--text-tertiary)]">
                    {item.key}
                  </span>
                  <PriorityBadge priority={item.priority} />
                </div>
                <p className="mt-1 text-[13px] font-medium leading-snug">{item.title}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--text-tertiary)]">
                  <UserPill name={assigneeName(item.assignee_id)} />
                  <span className="shrink-0">{item.estimate_points ?? "—"} pts</span>
                </div>
              </article>
            ))}
          </KanbanColumn>
        ))}
      </div>

      {selected ? (
        <ItemDrawer
          item={selected}
          assigneeName={assigneeName(selected.assignee_id)}
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
  assigneeName,
  canTransition,
  canComment,
  onClose,
  onTransition,
}: {
  item: BoardItem;
  assigneeName: string | null;
  canTransition: boolean;
  canComment: boolean;
  onClose: () => void;
  onTransition: (status: string) => void;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    fetch(`/api/session/items/${item.id}/attachments`)
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload: { data: Attachment[] }) => setAttachments(payload.data))
      .catch(() => setAttachments([]));
  }, [load, item.id]);

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

  async function uploadAttachment(file: File) {
    setUploading(true);
    const presign = await fetch(`/api/session/items/${item.id}/attachments/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      }),
    }).catch(() => null);
    if (!presign || !presign.ok) {
      setUploading(false);
      return;
    }
    const prepared = (await presign.json()) as {
      data: { upload_url: string; object_key: string };
    };
    const put = await fetch(prepared.data.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    }).catch(() => null);
    if (!put || !put.ok) {
      setUploading(false);
      return;
    }
    const confirm = await fetch(`/api/session/items/${item.id}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object_key: prepared.data.object_key,
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      }),
    }).catch(() => null);
    if (confirm?.ok) {
      const response = await fetch(`/api/session/items/${item.id}/attachments`);
      const payload = (await response.json()) as { data: Attachment[] };
      setAttachments(payload.data);
    }
    setUploading(false);
  }

  async function downloadAttachment(id: string) {
    const response = await fetch(`/api/session/attachments/${id}/url`);
    if (!response.ok) return;
    const payload = (await response.json()) as { data: { download_url: string } };
    window.open(payload.data.download_url, "_blank");
  }

  return (
    <Drawer title={item.title} subtitle={item.key} onClose={onClose}>
      <div className="space-y-6">
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Details
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            <UserPill name={assigneeName} />
            <span className="text-[var(--text-tertiary)]">{item.estimate_points ?? "—"} pts</span>
          </div>
        </section>

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
            <StatusBadge status={item.status} />
            {canTransition
              ? (TRANSITIONS[item.status] ?? []).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onTransition(status)}
                    className="rounded-full border border-dashed px-2.5 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  >
                    → {statusLabel(status)}
                  </button>
                ))
              : null}
          </div>
        </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Attachments
            </h3>
            <ul className="mt-2 space-y-2">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border p-2 text-[13px]"
                >
                  <span className="truncate">{attachment.file_name}</span>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(attachment.id)}
                    className="text-[12px] font-medium text-[var(--primary-600)]"
                  >
                    Download
                  </button>
                </li>
              ))}
              {attachments.length === 0 ? (
                <li className="text-[13px] text-[var(--text-tertiary)]">No attachments.</li>
              ) : null}
            </ul>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[var(--primary-600)]">
              {uploading ? "Uploading…" : "Add attachment"}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAttachment(file);
                  event.target.value = "";
                }}
              />
            </label>
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
    </Drawer>
  );
}
