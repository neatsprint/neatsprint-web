"use client";

import { useState } from "react";

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

const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function BacklogClient({
  initialItems,
  canEdit,
}: {
  initialItems: BacklogItem[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function update(itemId: string, field: "priority", value: string) {
    const previous = items;
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
    setError(null);
    const response = await fetch(`/api/session/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => null);
    if (!response || !response.ok) {
      const body = response ? await response.json().catch(() => ({})) : {};
      setItems(previous);
      setError(body.detail ?? "That change could not be saved.");
    }
  }

  const visible = items.filter((item) => {
    const matchesQuery =
      !query ||
      item.key.toLowerCase().includes(query.toLowerCase()) ||
      item.title.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search key or title"
          className="h-9 w-64 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-3 text-[13px]"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {visible.length} of {items.length}
        </span>
      </div>

      {error ? (
        <p role="alert" className="mb-2 text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[var(--bg-subtle)] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Estimate</th>
              <th className="px-4 py-3 font-medium">Sprint</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--bg-subtle)]">
                <td className="mono px-4 py-2 text-[12px]">{item.key}</td>
                <td className="px-4 py-2 font-medium">{item.title}</td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">{item.type}</td>
                <td className="px-4 py-2">{item.status}</td>
                <td className="px-4 py-2">
                  {canEdit ? (
                    <select
                      value={item.priority}
                      onChange={(event) => update(item.id, "priority", event.target.value)}
                      className="h-8 rounded-[var(--radius-sm)] border bg-transparent px-1 text-[12px]"
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  ) : (
                    item.priority
                  )}
                </td>
                <td className="px-4 py-2">{item.estimate_points ?? "—"}</td>
                <td className="px-4 py-2 text-[var(--text-tertiary)]">
                  {item.sprint_id ? "Committed" : "Backlog"}
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--text-secondary)]">
                  No items match the filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
