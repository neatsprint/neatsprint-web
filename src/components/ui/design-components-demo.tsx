"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanColumn } from "@/components/ui/kanban-column";
import { PriorityBadge, StatusBadge } from "@/components/ui/task-badges";
import { UserPill } from "@/components/ui/user-pill";

export function DesignComponentsDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Badges and people
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status="IN_PROGRESS" />
          <PriorityBadge priority="URGENT" />
          <UserPill name="Mia Member" />
          <UserPill name={null} />
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          EmptyState
        </p>
        <EmptyState
          compact
          className="mt-2"
          title="No items match the filters"
          description="Try a different term or clear the filters."
        />
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          DataTable
        </p>
        <DataTable
          className="mt-2"
          label="Component demo table"
          columns={[
            { key: "key", label: "Key" },
            { key: "title", label: "Title" },
            { key: "priority", label: "Priority" },
          ]}
        >
          <tbody className="divide-y">
            <tr>
              <td className="mono px-3 py-2 text-[12px]">AUTH-142</td>
              <td className="px-3 py-2">Device-bound sessions</td>
              <td className="px-3 py-2">
                <PriorityBadge priority="HIGH" />
              </td>
            </tr>
          </tbody>
        </DataTable>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          KanbanColumn
        </p>
        <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
          <KanbanColumn label="In progress" count={1}>
            <article className="rounded-[var(--radius-md)] border bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-e1)]">
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-[var(--text-tertiary)]">AUTH-142</span>
                <PriorityBadge priority="HIGH" />
              </div>
              <p className="mt-1 text-[13px] font-medium">Device-bound sessions</p>
            </article>
          </KanbanColumn>
          <KanbanColumn label="Done" count={0} emptyLabel="Nothing completed yet" />
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Drawer
        </p>
        <Button className="mt-2" variant="secondary" onClick={() => setOpen(true)}>
          Open drawer example
        </Button>
      </div>

      {open ? (
        <Drawer
          title="Device-bound sessions"
          subtitle="AUTH-142"
          onClose={() => setOpen(false)}
        >
          <p className="text-[13px] text-[var(--text-secondary)]">
            The drawer renders as a modal panel on the right. Escape and the backdrop close it.
          </p>
        </Drawer>
      ) : null}
    </div>
  );
}
