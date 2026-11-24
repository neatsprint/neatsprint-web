"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Project = { id: string; key: string; name: string };
type Item = { id: string; key: string; title: string; project_id: string };
type User = { id: string; full_name: string; email: string };

type Result = {
  key: string;
  label: string;
  hint: string;
  href: string;
  group: "Commands" | "Projects" | "Items" | "People";
};

const commands: Result[] = [
  { key: "cmd-timesheet", label: "Timesheet", hint: "My week", href: "/timesheet", group: "Commands" },
  { key: "cmd-screens", label: "My screenshots", hint: "Review captures", href: "/me/screenshots", group: "Commands" },
  { key: "cmd-reports", label: "Reports", hint: "Insights", href: "/reports", group: "Commands" },
  { key: "cmd-projects", label: "Projects", hint: "All work", href: "/projects", group: "Commands" },
  { key: "cmd-teams", label: "Teams", hint: "People and leads", href: "/teams", group: "Commands" },
  { key: "cmd-monitor", label: "Monitoring", hint: "Manager gallery", href: "/monitor", group: "Commands" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(commands);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/session/search?q=${encodeURIComponent(term)}`)
        .then((response) => (response.ok ? response.json() : { data: {} }))
        .then(
          (payload: {
            data: { projects?: Project[]; items?: Item[]; users?: User[] };
          }) => {
            const projects = (payload.data.projects ?? []).map((project) => ({
              key: `project-${project.id}`,
              label: `${project.key} · ${project.name}`,
              hint: "Project",
              href: `/projects/${project.id}/board`,
              group: "Projects" as const,
            }));
            const items = (payload.data.items ?? []).map((item) => ({
              key: `item-${item.id}`,
              label: `${item.key} · ${item.title}`,
              hint: "Backlog item",
              href: `/projects/${item.project_id}/backlog`,
              group: "Items" as const,
            }));
            const users = (payload.data.users ?? []).map((user) => ({
              key: `user-${user.id}`,
              label: user.full_name,
              hint: user.email,
              href: "/admin/users",
              group: "People" as const,
            }));
            setResults([...projects, ...items, ...users].slice(0, 18));
            setActive(0);
          },
        )
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const groups = useMemo(() => {
    const grouped = new Map<string, Result[]>();
    for (const result of results) {
      const list = grouped.get(result.group) ?? [];
      list.push(result);
      grouped.set(result.group, list);
    }
    return Array.from(grouped.entries());
  }, [results]);

  function choose(result: Result) {
    setOpen(false);
    router.push(result.href);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      choose(results[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-1 items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] px-3 py-1.5 text-left text-[var(--text-tertiary)] md:max-w-md"
        aria-label="Open global search"
      >
        <Search size={16} />
        <span className="text-[13px]">Search projects, items and people</span>
        <kbd className="ml-auto hidden rounded border bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] md:block">
          Ctrl K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e3)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search size={16} className="text-[var(--text-tertiary)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search or jump to…"
                className="h-9 flex-1 bg-transparent text-[14px] outline-none"
                aria-label="Search query"
              />
              <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                Esc
              </kbd>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {loading ? (
                <p className="px-2 py-4 text-[13px] text-[var(--text-tertiary)]">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-2 py-4 text-[13px] text-[var(--text-tertiary)]">
                  No matches.
                </p>
              ) : (
                groups.map(([group, entries]) => (
                  <div key={group} className="mb-2">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      {group}
                    </p>
                    <ul>
                      {entries.map((result) => {
                        const index = results.indexOf(result);
                        return (
                          <li key={result.key}>
                            <button
                              type="button"
                              onMouseEnter={() => setActive(index)}
                              onClick={() => choose(result)}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-2 py-2 text-left text-[13px]",
                                index === active
                                  ? "bg-[var(--primary-100)] text-[var(--primary-700)]"
                                  : "hover:bg-[var(--bg-subtle)]",
                              )}
                            >
                              <span className="truncate">{result.label}</span>
                              <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">
                                {result.hint}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
