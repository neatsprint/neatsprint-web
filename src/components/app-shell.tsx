"use client";

import {
  BarChart3,
  Clock3,
  Eye,
  FolderKanban,
  LayoutDashboard,
  type LucideIcon,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
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
      { label: "Projects", href: "/projects", icon: FolderKanban, enabled: true },
      { label: "Timesheet", href: "/timesheet", icon: Clock3, enabled: true },
      { label: "My screenshots", href: "/me/screenshots", icon: ShieldCheck, enabled: true },
      { label: "Transparency", href: "/me/transparency", icon: Eye, enabled: true },
    ],
  },
  {
    section: "Team",
    items: [
      { label: "Teams", href: "/teams", icon: Users, enabled: true },
      { label: "Monitoring", href: "/monitor", icon: Eye, enabled: true },
    ],
  },
  {
    section: "Insights",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3, enabled: true }],
  },
  {
    section: "Admin",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, enabled: true },
      { label: "Roles", href: "/admin/roles", icon: ShieldCheck, enabled: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, enabled: true },
      { label: "Audit", href: "/admin/audit", icon: ShieldCheck, enabled: true },
    ],
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

type ShellProfile = {
  full_name: string;
  email: string;
  roles: string[];
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  return ((first[0] ?? "") + (second[0] ?? "")).toUpperCase() || "?";
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<ShellProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/session/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data: ShellProfile } | null) => setProfile(payload?.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoaded(true));
  }, []);

  async function signOut() {
    await fetch("/api/session/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-[var(--primary-600)] px-3 py-2 text-white focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
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
          <GlobalSearch />

          <span className="hidden items-center gap-2 rounded-full border px-3 py-1 text-[12px] text-[var(--text-secondary)] sm:flex">
            <Timer size={14} />
            No timer running
          </span>

          <NotificationBell />

          <ThemeToggle />

          {profile ? (
            <>
              <span className="hidden max-w-40 truncate text-[12px] text-[var(--text-secondary)] lg:inline">
                {profile.full_name}
              </span>
              <span
                title={profile.email}
                className="grid size-8 place-items-center rounded-full bg-[var(--primary-100)] text-[12px] font-semibold text-[var(--primary-700)]"
              >
                {initials(profile.full_name)}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-[var(--radius-md)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : loaded ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <LogIn size={15} />
              Sign in
            </Link>
          ) : null}
        </header>

        <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 p-4 md:p-6">
          <nav
            aria-label="Mobile"
            className="mb-4 flex gap-1 overflow-x-auto border-b pb-2 text-[12px] md:hidden"
          >
            {([
              ["Projects", "/projects"],
              ["Timesheet", "/timesheet"],
              ["Screenshots", "/me/screenshots"],
              ["Reports", "/reports"],
              ["Teams", "/teams"],
              ["Monitoring", "/monitor"],
            ] as const).map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-[var(--radius-md)] px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                {label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
