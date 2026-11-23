import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function InlineAlert({
  children,
  tone = "danger",
}: {
  children: ReactNode;
  tone?: "danger" | "info";
}) {
  return (
    <p
      role="alert"
      className={
        tone === "danger"
          ? "mb-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--danger-600)] p-2 text-[13px] text-[var(--danger-600)]"
          : "mb-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--info-500)] p-2 text-[13px] text-[var(--info-500)]"
      }
    >
      <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
