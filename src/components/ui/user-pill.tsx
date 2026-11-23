import { cn, initials } from "@/lib/utils";

export function UserPill({
  name,
  size = "sm",
  className,
}: {
  name: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!name) {
    return (
      <span className={cn("text-[12px] text-[var(--text-tertiary)]", className)}>
        Unassigned
      </span>
    );
  }
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-[12px]", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] font-semibold text-[var(--text-secondary)]",
          size === "md" ? "size-7 text-[12px]" : "size-5 text-[10px]",
        )}
      >
        {initials(name)}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
