import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn = {
  key: string;
  label: ReactNode;
  className?: string;
};

export function DataTable({
  columns,
  children,
  label,
  className,
}: {
  columns: DataTableColumn[];
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]",
        className,
      )}
    >
      <table className="w-full text-left text-[13px]" aria-label={label}>
        <thead className="bg-[var(--bg-subtle)] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn("px-3 py-3 font-medium", column.className)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </section>
  );
}
