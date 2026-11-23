export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 rounded bg-[var(--bg-subtle)]" />
      <div className="h-7 w-64 rounded bg-[var(--bg-subtle)]" />
      <div className="h-3 w-80 rounded bg-[var(--bg-subtle)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)]"
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
