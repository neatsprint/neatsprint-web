"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/ui/task-badges";

export type AssignedItem = {
  id: string;
  key: string;
  title: string;
  status: string;
};

const DEFAULT_VISIBLE = 5;

export function AssignedItems({ items }: { items: AssignedItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, DEFAULT_VISIBLE);
  const hidden = items.length - DEFAULT_VISIBLE;

  return (
    <div className="mt-3">
      <ul className="space-y-1 text-[12px]">
        {visible.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="mono shrink-0 text-[var(--text-tertiary)]">{item.key}</span>
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            <StatusBadge status={item.status} />
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-2 text-[12px] font-medium text-[var(--primary-700)] hover:underline"
        >
          {expanded ? "Show less" : `More… (${hidden})`}
        </button>
      ) : null}
    </div>
  );
}
