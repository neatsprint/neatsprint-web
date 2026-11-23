"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClass = "max-w-xl",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Details"}
        className={cn(
          "flex h-full w-full flex-col border-l bg-[var(--bg-surface)] shadow-[var(--shadow-e3)]",
          widthClass,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b p-5">
          <div className="min-w-0">
            {subtitle ? (
              <p className="mono text-[12px] text-[var(--text-tertiary)]">{subtitle}</p>
            ) : null}
            <h2 className="mt-1 text-lg font-semibold leading-snug">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-[var(--radius-md)] p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <footer className="border-t p-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}
