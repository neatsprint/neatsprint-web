"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PRIORITIES,
  PriorityBadge,
  STATUSES,
  STATUS_LABELS,
  StatusBadge,
  priorityClass,
  statusClass,
} from "@/components/ui/task-badges";
import { UserPill } from "@/components/ui/user-pill";
import { cn } from "@/lib/utils";

export type BacklogItem = {
  id: string;
  key: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  estimate_points: number | null;
  assignee_id: string | null;
  sprint_id: string | null;
};

type Sprint = { id: string; name: string; state: string };
type User = { id: string; full_name: string; email: string; status: string };
type GroupBy = "status" | "priority" | "sprint" | "none";
type ItemPatch = Partial<
  Pick<BacklogItem, "title" | "priority" | "estimate_points" | "assignee_id" | "sprint_id">
>;

const TYPES = ["TASK", "STORY", "BUG", "SUGGESTION"] as const;

const CONTROL =
  "h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]";

type Group = { key: string; label: string; items: BacklogItem[] };

function groupItems(items: BacklogItem[], groupBy: GroupBy, sprints: Sprint[]): Group[] {
  if (groupBy === "none") {
    return [{ key: "__all__", label: "All items", items }];
  }
  const order: { key: string; label: string }[] = [];
  if (groupBy === "status") {
    for (const status of STATUSES) {
      order.push({ key: status, label: STATUS_LABELS[status] ?? status });
    }
  } else if (groupBy === "priority") {
    for (const priority of PRIORITIES) order.push({ key: priority, label: priority });
  } else {
    for (const sprint of sprints) {
      order.push({
        key: sprint.id,
        label: `${sprint.name}${sprint.state === "ACTIVE" ? " · active" : ""}`,
      });
    }
    order.push({ key: "__none__", label: "Backlog" });
  }
  const buckets = new Map<string, BacklogItem[]>(order.map((entry) => [entry.key, []]));
  for (const item of items) {
    const key =
      groupBy === "status"
        ? item.status
        : groupBy === "priority"
          ? item.priority
          : (item.sprint_id ?? "__none__");
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }
  const grouped = order
    .map((entry) => ({ key: entry.key, label: entry.label, items: buckets.get(entry.key) ?? [] }))
    .filter((group) => group.items.length > 0);
  const known = new Set(grouped.map((group) => group.key));
  for (const [key, bucket] of buckets) {
    if (bucket.length > 0 && !known.has(key)) {
      grouped.push({ key, label: key, items: bucket });
    }
  }
  return grouped;
}

function points(items: BacklogItem[]): number {
  return items.reduce((sum, item) => sum + (item.estimate_points ?? 0), 0);
}

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function BacklogClient({
  projectId,
  initialItems,
  sprints,
  users,
  canEdit,
  canTransition,
  canAssign,
  canDelete,
}: {
  projectId: string;
  initialItems: BacklogItem[];
  sprints: Sprint[];
  users: User[];
  canEdit: boolean;
  canTransition: boolean;
  canAssign: boolean;
  canDelete: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingBulk, setPendingBulk] = useState(false);

  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const cancelEdit = useRef(false);

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "ACTIVE"),
    [users],
  );
  const sprintMap = useMemo(
    () => new Map(sprints.map((sprint) => [sprint.id, sprint])),
    [sprints],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !term ||
        item.key.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term);
      const matchesType = !typeFilter || item.type === typeFilter;
      const matchesPriority = !priorityFilter || item.priority === priorityFilter;
      const matchesAssignee =
        !assigneeFilter ||
        (assigneeFilter === "__none__"
          ? item.assignee_id === null
          : item.assignee_id === assigneeFilter);
      return matchesQuery && matchesType && matchesPriority && matchesAssignee;
    });
  }, [items, query, typeFilter, priorityFilter, assigneeFilter]);

  const groups = useMemo(
    () => groupItems(visible, groupBy, sprints),
    [visible, groupBy, sprints],
  );
  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    if (!focusedId || editingId) return;
    rowRefs.current.get(focusedId)?.focus();
  }, [focusedId, editingId]);

  function displayName(userId: string | null): string {
    if (!userId) return "Unassigned";
    return userMap.get(userId)?.full_name ?? "Unknown user";
  }

  function sprintName(sprintId: string | null): string {
    if (!sprintId) return "Backlog";
    return sprintMap.get(sprintId)?.name ?? "Sprint";
  }

  function patchItem(item: BacklogItem, updates: ItemPatch): Promise<boolean> {
    const previous = items;
    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, ...updates } : row)),
    );
    setError(null);
    return fetch(`/api/session/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
      .then(async (response) => {
        if (response.ok) return true;
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        setItems(previous);
        setError(body.detail ?? "That change could not be saved.");
        return false;
      })
      .catch(() => {
        setItems(previous);
        setError("That change could not be saved.");
        return false;
      });
  }

  function transitionItem(item: BacklogItem, status: string): Promise<boolean> {
    if (status === item.status) return Promise.resolve(true);
    const previous = items;
    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, status } : row)),
    );
    setError(null);
    return fetch(`/api/session/items/${item.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(async (response) => {
        if (response.ok) return true;
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        setItems(previous);
        setError(body.detail ?? "That status change is not allowed.");
        return false;
      })
      .catch(() => {
        setItems(previous);
        setError("That status change is not allowed.");
        return false;
      });
  }

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(group: Group) {
    setSelected((current) => {
      const next = new Set(current);
      const all = group.items.every((item) => next.has(item.id));
      for (const item of group.items) {
        if (all) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(visible.map((item) => item.id)));
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
  }

  function startEdit(item: BacklogItem) {
    if (!canEdit) return;
    cancelEdit.current = false;
    setEditingId(item.id);
    setEditingTitle(item.title);
  }

  function saveTitle(item: BacklogItem) {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title || title === item.title) return;
    void patchItem(item, { title });
  }

  function onTitleKey(event: React.KeyboardEvent<HTMLInputElement>, item: BacklogItem) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      cancelEdit.current = true;
      setEditingId(null);
    }
  }

  function onRowKey(event: React.KeyboardEvent<HTMLTableRowElement>, item: BacklogItem) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const index = flat.findIndex((row) => row.id === item.id);
      const next = flat[index + (event.key === "ArrowDown" ? 1 : -1)];
      if (next) setFocusedId(next.id);
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      toggleSelect(item.id);
      return;
    }
    if ((event.key === "e" || event.key === "E") && canEdit) {
      event.preventDefault();
      startEdit(item);
      return;
    }
    if (event.key === "Enter" && canEdit) {
      event.preventDefault();
      startEdit(item);
    }
  }

  async function reload() {
    const response = await fetch(`/api/session/projects/${projectId}/backlog`).catch(
      () => null,
    );
    if (response?.ok) {
      const payload = (await response.json()) as { data: BacklogItem[] };
      setItems(payload.data);
    }
    setSelected(new Set());
  }

  async function bulkPatch(updates: ItemPatch) {
    const ids = [...selected];
    if (!ids.length || pendingBulk) return;
    setPendingBulk(true);
    setError(null);
    const responses = await Promise.all(
      ids.map((id) =>
        fetch(`/api/session/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }).catch(() => null),
      ),
    );
    setPendingBulk(false);
    if (responses.some((response) => !response || !response.ok)) {
      await reload();
      setError("Some items could not be updated. The list has been refreshed.");
      return;
    }
    setItems((current) =>
      current.map((item) => (selected.has(item.id) ? { ...item, ...updates } : item)),
    );
    setSelected(new Set());
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length || pendingBulk) return;
    if (
      !window.confirm(
        `Delete ${ids.length} selected item${ids.length === 1 ? "" : "s"}? They will be removed from the backlog.`,
      )
    ) {
      return;
    }
    setPendingBulk(true);
    setError(null);
    const responses = await Promise.all(
      ids.map((id) =>
        fetch(`/api/session/items/${id}`, { method: "DELETE" }).catch(() => null),
      ),
    );
    setPendingBulk(false);
    if (responses.some((response) => !response || !response.ok)) {
      await reload();
      setError("Some items could not be deleted. The list has been refreshed.");
      return;
    }
    setItems((current) => current.filter((item) => !selected.has(item.id)));
    setSelected(new Set());
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search key or title"
          className={cn(CONTROL, "w-64")}
          aria-label="Search backlog"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className={CONTROL}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className={CONTROL}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(event) => setAssigneeFilter(event.target.value)}
          className={CONTROL}
          aria-label="Filter by assignee"
        >
          <option value="">Anyone</option>
          <option value="__none__">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
        <select
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as GroupBy)}
          className={CONTROL}
          aria-label="Group backlog"
        >
          <option value="status">Group: status</option>
          <option value="priority">Group: priority</option>
          <option value="sprint">Group: sprint</option>
          <option value="none">Group: none</option>
        </select>
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {visible.length} of {items.length} · {formatPoints(points(visible))} pts
        </span>
      </div>

      {selected.size > 0 ? (
        <div
          data-testid="bulk-bar"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-e1)]"
        >
          <span className="text-[13px] font-medium">{selected.size} selected</span>
          <button
            type="button"
            onClick={selectAllVisible}
            className="text-[12px] font-medium text-[var(--primary-600)]"
          >
            Select all visible
          </button>
          {canEdit ? (
            <select
              value=""
              disabled={pendingBulk}
              onChange={(event) => {
                if (event.target.value) void bulkPatch({ priority: event.target.value });
              }}
              className={CONTROL}
              aria-label="Set priority for selected items"
            >
              <option value="">Set priority…</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          ) : null}
          {canEdit ? (
            <select
              value="__pick__"
              disabled={pendingBulk}
              onChange={(event) => {
                if (event.target.value !== "__pick__") {
                  void bulkPatch({ sprint_id: event.target.value || null });
                }
              }}
              className={CONTROL}
              aria-label="Move selected items to a sprint"
            >
              <option value="__pick__">Move to sprint…</option>
              <option value="">Backlog</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          ) : null}
          {canAssign ? (
            <select
              value="__pick__"
              disabled={pendingBulk}
              onChange={(event) => {
                if (event.target.value !== "__pick__") {
                  void bulkPatch({ assignee_id: event.target.value || null });
                }
              }}
              className={CONTROL}
              aria-label="Assign selected items"
            >
              <option value="__pick__">Assign…</option>
              <option value="">Unassigned</option>
              {activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          ) : null}
          {canDelete ? (
            <Button variant="danger" size="sm" disabled={pendingBulk} onClick={bulkDelete}>
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
          {pendingBulk ? (
            <span className="text-[12px] text-[var(--text-tertiary)]">Saving…</span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-2 text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="This backlog is empty"
          description="Add your first item to get started."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`${query ? `No matches for “${query}”. ` : ""}Try a different term or clear filters.`}
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <DataTable
          label="Project backlog"
          columns={[
            { key: "select", label: <span className="sr-only">Select</span>, className: "w-10" },
            { key: "key", label: "Key" },
            { key: "title", label: "Title" },
            { key: "type", label: "Type" },
            { key: "status", label: "Status" },
            { key: "priority", label: "Priority" },
            { key: "assignee", label: "Assignee" },
            { key: "estimate", label: "Estimate" },
            { key: "sprint", label: "Sprint" },
          ]}
        >
            {groups.map((group) => {
              const allSelected = group.items.every((item) => selected.has(item.id));
              return (
                <tbody key={group.key} className="divide-y">
                  <tr className="bg-[var(--bg-subtle)]">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleGroup(group)}
                        aria-label={`Select all ${group.label} items`}
                      />
                    </td>
                    <td colSpan={8} className="px-3 py-2">
                      <span
                        data-testid="group-header"
                        className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                      >
                        {group.label}
                      </span>
                      <span className="ml-2 text-[12px] text-[var(--text-tertiary)]">
                        {group.items.length} items · {formatPoints(points(group.items))} pts
                      </span>
                    </td>
                  </tr>
                  {group.items.map((item, index) => {
                    const assignee = item.assignee_id
                      ? userMap.get(item.assignee_id)
                      : undefined;
                    return (
                      <tr
                        key={item.id}
                        data-testid={`row-${item.key}`}
                        ref={(node) => {
                          if (node) rowRefs.current.set(item.id, node);
                          else rowRefs.current.delete(item.id);
                        }}
                        tabIndex={
                          focusedId === item.id || (!focusedId && index === 0) ? 0 : -1
                        }
                        onFocus={() => setFocusedId(item.id)}
                        onKeyDown={(event) => onRowKey(event, item)}
                        className={cn(
                          "hover:bg-[var(--bg-subtle)]",
                          selected.has(item.id) && "bg-[var(--primary-100)]",
                        )}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            aria-label={`Select ${item.key}`}
                          />
                        </td>
                        <td className="mono px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                          {item.key}
                        </td>
                        <td className="px-3 py-2">
                          {editingId === item.id ? (
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onBlur={() => {
                                if (cancelEdit.current) {
                                  cancelEdit.current = false;
                                  return;
                                }
                                saveTitle(item);
                              }}
                              onKeyDown={(event) => onTitleKey(event, item)}
                              className="h-8 w-full rounded-[var(--radius-sm)] border bg-[var(--bg-surface)] px-2 text-[13px]"
                              aria-label={`Edit ${item.key} title`}
                            />
                          ) : (
                            <span
                              className="font-medium"
                              onDoubleClick={() => startEdit(item)}
                              title={canEdit ? "Double-click or press E to edit" : undefined}
                            >
                              {item.title}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{item.type}</td>
                        <td className="px-3 py-2">
                          {canTransition ? (
                            <select
                              value={item.status}
                              onChange={(event) =>
                                void transitionItem(item, event.target.value)
                              }
                              className={cn(
                                "h-7 rounded-full border-0 px-2 text-[11px] font-medium uppercase tracking-[0.04em]",
                                statusClass(item.status),
                              )}
                              aria-label={`Status for ${item.key}`}
                            >
                              {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_LABELS[status]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {canEdit ? (
                            <select
                              value={item.priority}
                              onChange={(event) =>
                                void patchItem(item, { priority: event.target.value })
                              }
                              className={cn(
                                "h-7 rounded-full border-0 px-2 text-[11px] font-medium uppercase tracking-[0.04em]",
                                priorityClass(item.priority),
                              )}
                              aria-label={`Priority for ${item.key}`}
                            >
                              {PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <PriorityBadge priority={item.priority} />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {canAssign ? (
                            <select
                              value={item.assignee_id ?? ""}
                              onChange={(event) =>
                                void patchItem(item, {
                                  assignee_id: event.target.value || null,
                                })
                              }
                              className="h-8 max-w-40 rounded-[var(--radius-sm)] border bg-transparent px-1 text-[12px]"
                              aria-label={`Assignee for ${item.key}`}
                            >
                              <option value="">Unassigned</option>
                              {assignee && !activeUsers.some((user) => user.id === assignee.id) ? (
                                <option value={assignee.id}>
                                  {assignee.full_name} (inactive)
                                </option>
                              ) : null}
                              {activeUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.full_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <UserPill
                              name={item.assignee_id ? displayName(item.assignee_id) : null}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {canEdit ? (
                            <input
                              key={`${item.id}-${item.estimate_points ?? "none"}`}
                              type="number"
                              min={0}
                              step={0.5}
                              defaultValue={item.estimate_points ?? ""}
                              onBlur={(event) => {
                                const raw = event.target.value;
                                const value = raw === "" ? null : Number(raw);
                                if (value !== null && Number.isNaN(value)) return;
                                if (value !== item.estimate_points) {
                                  void patchItem(item, { estimate_points: value });
                                }
                              }}
                              className="h-8 w-16 rounded-[var(--radius-sm)] border bg-transparent px-1 text-[12px] tabular"
                              aria-label={`Estimate for ${item.key}`}
                            />
                          ) : (
                            <span className="tabular">
                              {item.estimate_points ?? "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {canEdit ? (
                            <select
                              value={item.sprint_id ?? ""}
                              onChange={(event) =>
                                void patchItem(item, {
                                  sprint_id: event.target.value || null,
                                })
                              }
                              className="h-8 max-w-40 rounded-[var(--radius-sm)] border bg-transparent px-1 text-[12px]"
                              aria-label={`Sprint for ${item.key}`}
                            >
                              <option value="">Backlog</option>
                              {sprints.map((sprint) => (
                                <option key={sprint.id} value={sprint.id}>
                                  {sprint.name}
                                  {sprint.state === "COMPLETED" ? " (completed)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                              {sprintName(item.sprint_id)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
        </DataTable>
      )}
    </div>
  );
}
