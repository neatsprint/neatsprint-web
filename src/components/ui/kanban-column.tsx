import type { DragEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function KanbanColumn({
  label,
  count,
  children,
  emptyLabel = "No items",
  onDragOver,
  onDrop,
  className,
}: {
  label: string;
  count: number;
  children?: ReactNode;
  emptyLabel?: string;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  className?: string;
}) {
  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-label={`${label} column`}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-subtle)]",
        className,
      )}
    >
      <header className="flex items-center justify-between px-3 py-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
          {label}
        </h2>
        <span className="text-[11px] text-[var(--text-tertiary)]">{count}</span>
      </header>
      <div className="flex-1 space-y-2 p-2">
        {children}
        {count === 0 ? (
          <p className="px-2 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
            {emptyLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}
