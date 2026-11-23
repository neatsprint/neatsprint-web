import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-dashed text-center",
        compact ? "p-6" : "p-10",
        className,
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          size={compact ? 20 : 24}
          className="mx-auto text-[var(--text-tertiary)]"
        />
      ) : null}
      <p
        className={cn(
          "font-medium",
          Icon ? "mt-2" : undefined,
          compact ? "text-[13px]" : "text-base",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
