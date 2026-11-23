import { cn } from "@/lib/utils";

export const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const STATUS_LABELS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
};

const STATUS_STYLES: Record<string, string> = {
  TODO: "bg-[var(--bg-subtle)] text-[var(--text-secondary)]",
  IN_PROGRESS: "bg-[var(--primary-100)] text-[var(--primary-700)]",
  IN_REVIEW: "bg-[var(--info-500)] text-white",
  BLOCKED: "bg-[var(--warning-500)] text-white",
  DONE: "bg-[var(--success-600)] text-white",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-[var(--bg-subtle)] text-[var(--text-secondary)]",
  MEDIUM: "bg-[var(--primary-100)] text-[var(--primary-700)]",
  HIGH: "bg-[var(--warning-500)] text-white",
  URGENT: "bg-[var(--danger-600)] text-white",
};

const BADGE = "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em]";

export function statusClass(status: string): string {
  return STATUS_STYLES[status] ?? "bg-[var(--bg-subtle)] text-[var(--text-secondary)]";
}

export function priorityClass(priority: string): string {
  return PRIORITY_STYLES[priority] ?? "bg-[var(--bg-subtle)] text-[var(--text-secondary)]";
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn(BADGE, statusClass(status), className)}>{statusLabel(status)}</span>;
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  return <span className={cn(BADGE, priorityClass(priority), className)}>{priority}</span>;
}
