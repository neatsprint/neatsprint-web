"use client";

import {
  BarChart3,
  Bell,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  type LucideIcon,
  Search,
  Settings,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  enabled: boolean;
};

const nav: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Work",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard, enabled: true },
      { label: "Projects", icon: FolderKanban, enabled: false },
      { label: "Timesheet", icon: Clock3, enabled: false },
      { label: "My screenshots", icon: ShieldCheck, enabled: false },
    ],
  },
  {
    section: "Team",
    items: [{ label: "Teams", icon: Users, enabled: false }],
  },
  {
    section: "Insights",
    items: [{ label: "Reports", icon: BarChart3, enabled: false }],
  },
  {
    section: "Admin",
    items: [{ label: "Settings", icon: Settings, enabled: false }],
  },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href ?? "~");
  const Icon = item.icon;

  if (!item.enabled) {
    return (
      <span
        aria-disabled="true"
        title="Available in a later milestone"
        className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-tertiary)]"
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href ?? "/"}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 transition-colors",
        active
          ? "bg-[var(--primary-100)] font-medium text-[var(--primary-700)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
      )}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-[var(--bg-surface)] md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <span className="grid size-7 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-600)] text-sm font-bold text-white">
            N
          </span>
          <span className="text-[15px] font-semibold tracking-tight">NeatSprint</span>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto p-3">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="m-3 rounded-[var(--radius-lg)] border bg-[var(--bg-subtle)] p-3">
          <p className="flex items-center gap-2 text-[13px] font-medium">
            <ShieldCheck size={16} className="text-[var(--success-600)]" />
            Privacy is on your side
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Screenshots pause when your timer stops. Review and delete them anytime within the
            window.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-[var(--bg-surface)] px-4">
          <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] px-3 py-1.5 text-[var(--text-tertiary)] md:max-w-md">
            <Search size={16} />
            <span className="text-[13px]">Search projects, items and people</span>
            <kbd className="ml-auto hidden rounded border bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] md:block">
              Ctrl K
            </kbd>
          </div>

          <span className="hidden items-center gap-2 rounded-full border px-3 py-1 text-[12px] text-[var(--text-secondary)] sm:flex">
            <Timer size={14} />
            No timer running
          </span>

          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <Bell size={18} />
          </button>

          <ThemeToggle />

          <span className="grid size-8 place-items-center rounded-full bg-[var(--primary-100)] text-[12px] font-semibold text-[var(--primary-700)]">
            LF
          </span>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
