"use client";

import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { addDays, isoDate } from "@/lib/week";
import { formatDuration } from "@/lib/utils";

export type TimesheetEntry = {
  id: string;
  session_id: string | null;
  user_id: string;
  item_id: string | null;
  project_id: string | null;
  sprint_id: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  source: string;
  comment: string | null;
  client_id: string;
};

export type SheetItem = {
  id: string;
  key: string;
  title: string;
  sprint_id: string | null;
  project_id: string;
  project_key: string;
  project_name: string;
};

export type SheetSprint = {
  id: string;
  name: string;
  state: string;
  project_key: string;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimesheetClient({
  weekStart,
  days,
  entries,
  items,
  sprints,
  allowWithoutSprint,
  canWrite,
  canExport,
}: {
  weekStart: string;
  days: string[];
  entries: TimesheetEntry[];
  items: SheetItem[];
  sprints: SheetSprint[];
  allowWithoutSprint: boolean;
  canWrite: boolean;
  canExport: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimesheetEntry | null>(null);
  const [sprintId, setSprintId] = useState("");
  const [itemId, setItemId] = useState("");
  const [date, setDate] = useState(weekStart);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Entry times are formatted in the viewer's timezone, which the server cannot know.
  // Render them only after mount so the first client render matches the server HTML.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const visibleItems = useMemo(
    () => (sprintId ? items.filter((item) => item.sprint_id === sprintId) : items),
    [items, sprintId],
  );
  const total = entries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = isoDate(addDays(start, 6));
  const previousWeek = isoDate(addDays(start, -7));
  const nextWeek = isoDate(addDays(start, 7));
  const noSprintAvailable = !allowWithoutSprint && sprints.length === 0;

  function openCreate() {
    const defaultSprint = allowWithoutSprint ? "" : (sprints[0]?.id ?? "");
    setEditing(null);
    setSprintId(defaultSprint);
    setItemId(
      (defaultSprint ? items.filter((item) => item.sprint_id === defaultSprint) : items)[0]?.id ??
        "",
    );
    setDate(weekStart);
    setStartTime("09:00");
    setEndTime("10:00");
    setComment("");
    setError(null);
    setOpen(true);
  }

  function changeSprint(value: string) {
    setSprintId(value);
    const stillVisible = value
      ? items.some((item) => item.id === itemId && item.sprint_id === value)
      : itemId !== "";
    if (!stillVisible) setItemId("");
  }

  function openEdit(entry: TimesheetEntry) {
    setEditing(entry);
    setSprintId(entry.sprint_id ?? "");
    setItemId(entry.item_id ?? "");
    setDate(localDate(entry.started_at));
    setStartTime(localTime(entry.started_at));
    setEndTime(localTime(entry.ended_at));
    setComment(entry.comment ?? "");
    setError(null);
    setOpen(true);
  }

  async function submit() {
    const startAt = new Date(`${date}T${startTime}:00`);
    const endAt = new Date(`${date}T${endTime}:00`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setError("Enter a valid date and time.");
      return;
    }
    if (endAt <= startAt) {
      setError("The end time must follow the start time.");
      return;
    }
    if (!allowWithoutSprint && !sprintId) {
      setError("Choose a sprint to log time.");
      return;
    }
    const selected = itemMap.get(itemId);
    const body = {
      item_id: itemId || null,
      sprint_id: sprintId || null,
      project_id: selected?.project_id ?? null,
      started_at: startAt.toISOString(),
      ended_at: endAt.toISOString(),
      comment: comment || null,
    };
    setSaving(true);
    setError(null);
    const response = await fetch(
      editing ? `/api/session/work/entries/${editing.id}` : "/api/session/work/entries",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    ).catch(() => null);
    if (!response?.ok) {
      const payload = response ? ((await response.json().catch(() => ({}))) as { detail?: string }) : {};
      setError(payload.detail ?? "That entry could not be saved.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function remove(entry: TimesheetEntry) {
    if (!window.confirm("Delete this time entry?")) return;
    const response = await fetch(`/api/session/work/entries/${entry.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!response?.ok) {
      setError("That entry could not be deleted.");
      return;
    }
    router.refresh();
  }

  async function exportCsv() {
    setExporting(true);
    setError(null);
    const response = await fetch(
      `/api/session/work/export?from=${weekStart}&to=${end}`,
    ).catch(() => null);
    if (!response?.ok) {
      setError("The export could not be prepared.");
      setExporting(false);
      return;
    }
    const payload = (await response.json()) as { data: { download_url: string } };
    window.open(payload.data.download_url, "_blank");
    setExporting(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]">
          <Link
            href={`/timesheet?week=${previousWeek}`}
            className="rounded-[var(--radius-md)] border px-3 py-1.5 hover:bg-[var(--bg-subtle)]"
          >
            ← Previous
          </Link>
          <Link
            href="/timesheet"
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            This week
          </Link>
          <Link
            href={`/timesheet?week=${nextWeek}`}
            className="rounded-[var(--radius-md)] border px-3 py-1.5 hover:bg-[var(--bg-subtle)]"
          >
            Next →
          </Link>
          <span className="ml-2 text-[var(--text-secondary)]">
            {weekStart} – {end}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--text-secondary)]">
            {formatDuration(total)} · {entries.length} entries
          </span>
          {canExport ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={exporting}
              onClick={() => void exportCsv()}
            >
              {exporting ? "Preparing…" : "Export CSV"}
            </Button>
          ) : null}
          {canWrite ? (
            <Button size="sm" onClick={openCreate}>
              <CalendarPlus size={15} />
              Log time
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {entries.length === 0 ? (
        <EmptyState
          title="No time logged this week"
          description="Start a timer in the desktop agent or add time manually."
          action={
            canWrite ? (
              <Button size="sm" onClick={openCreate}>
                Log time
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {days.map((day) => {
            const dayEntries = mounted
              ? entries.filter((entry) => localDate(entry.started_at) === day)
              : [];
            const dayTotal = dayEntries.reduce(
              (sum, entry) => sum + entry.duration_seconds,
              0,
            );
            return (
              <section
                key={day}
                className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-e1)]"
              >
                <header className="mb-2 flex items-center justify-between">
                  <h2 className="text-[12px] font-semibold">{day.slice(5)}</h2>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {mounted ? formatDuration(dayTotal) : null}
                  </span>
                </header>
                <div className="space-y-2">
                  {dayEntries.map((entry) => {
                    const item = entry.item_id ? itemMap.get(entry.item_id) : undefined;
                    return (
                      <article
                        key={entry.id}
                        className="rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] p-2 text-[12px]"
                      >
                        <p className="mono text-[10px] text-[var(--text-tertiary)]">
                          {item?.key ?? "Unlinked"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 font-medium">
                          {item?.title ?? "No task"}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                          {localTime(entry.started_at)}–{localTime(entry.ended_at)} ·{" "}
                          {formatDuration(entry.duration_seconds)}
                        </p>
                        {entry.comment ? (
                          <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-tertiary)]">
                            {entry.comment}
                          </p>
                        ) : null}
                        {canWrite ? (
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              aria-label="Edit entry"
                              onClick={() => openEdit(entry)}
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete entry"
                              onClick={() => void remove(entry)}
                              className="text-[var(--danger-600)]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                  {dayEntries.length === 0 ? (
                    mounted ? (
                      <p className="py-4 text-center text-[11px] text-[var(--text-tertiary)]">
                        No time
                      </p>
                    ) : null
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {open ? (
        <Drawer
          title={editing ? "Edit time entry" : "Log time"}
          subtitle={weekStart}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            <label className="block text-[13px]">
              <span className="mb-1 block text-[var(--text-secondary)]">
                Sprint{allowWithoutSprint ? "" : " (required)"}
              </span>
              <select
                value={sprintId}
                onChange={(event) => changeSprint(event.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
              >
                {allowWithoutSprint ? <option value="">No sprint</option> : null}
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} · {sprint.project_key}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[13px]">
              <span className="mb-1 block text-[var(--text-secondary)]">Task</span>
              <select
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
              >
                <option value="">No task</option>
                {visibleItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.key} · {item.title}
                  </option>
                ))}
              </select>
              {sprintId && visibleItems.length === 0 ? (
                <span className="mt-1 block text-xs text-[var(--text-tertiary)]">
                  No tasks are in this sprint yet.
                </span>
              ) : null}
            </label>
            {noSprintAvailable ? (
              <InlineAlert>
                No sprint is available. Ask a project manager to create a sprint before logging
                time.
              </InlineAlert>
            ) : null}
            <label className="block text-[13px]">
              <span className="mb-1 block text-[var(--text-secondary)]">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px]">
                <span className="mb-1 block text-[var(--text-secondary)]">Start</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
                />
              </label>
              <label className="block text-[13px]">
                <span className="mb-1 block text-[var(--text-secondary)]">End</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
                />
              </label>
            </div>
            <label className="block text-[13px]">
              <span className="mb-1 block text-[var(--text-secondary)]">Comment</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className="w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)] p-2 text-[13px]"
              />
            </label>
            {error ? <InlineAlert>{error}</InlineAlert> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={saving || noSprintAvailable} onClick={() => void submit()}>
                {saving ? "Saving…" : editing ? "Save changes" : "Add entry"}
              </Button>
            </div>
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}
