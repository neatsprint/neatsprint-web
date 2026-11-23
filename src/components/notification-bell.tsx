"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setFailed(false);
    const response = await fetch("/api/session/notifications").catch(() => null);
    if (response?.ok) {
      const payload = (await response.json()) as {
        data: Notification[];
        meta: { unread?: number };
      };
      setItems(payload.data);
      setUnread(payload.meta.unread ?? 0);
    } else {
      setFailed(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markRead(id: string) {
    const readAt = new Date().toISOString();
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read_at: readAt } : item)),
    );
    setUnread((current) => Math.max(0, current - 1));
    await fetch(`/api/session/notifications/${id}/read`, { method: "POST" }).catch(
      () => null,
    );
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    setItems((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })),
    );
    setUnread(0);
    await fetch("/api/session/notifications/read-all", { method: "POST" }).catch(
      () => null,
    );
  }

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--danger-600)] px-1 text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e3)]">
          <header className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-[13px] font-semibold">Notifications</h2>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary-600)]"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            ) : null}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-[13px] text-[var(--text-tertiary)]">
                Loading…
              </p>
            ) : failed ? (
              <p className="px-3 py-6 text-center text-[13px] text-[var(--danger-600)]">
                Notifications could not be loaded.
              </p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-[var(--text-tertiary)]">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.link ?? "/projects"}
                      onClick={() => {
                        if (!item.read_at) void markRead(item.id);
                        setOpen(false);
                      }}
                      className="flex gap-2 px-3 py-2.5 hover:bg-[var(--bg-subtle)]"
                    >
                      <span
                        aria-hidden="true"
                        className={
                          item.read_at
                            ? "mt-1.5 size-2 shrink-0 rounded-full bg-transparent"
                            : "mt-1.5 size-2 shrink-0 rounded-full bg-[var(--primary-600)]"
                        }
                      />
                      <span className="min-w-0">
                        <span
                          className={
                            item.read_at
                              ? "block text-[13px] text-[var(--text-secondary)]"
                              : "block text-[13px] font-medium"
                          }
                        >
                          {item.title}
                        </span>
                        {item.body ? (
                          <span className="mt-0.5 block truncate text-[12px] text-[var(--text-tertiary)]">
                            {item.body}
                          </span>
                        ) : null}
                        <span className="mt-0.5 block text-[11px] text-[var(--text-tertiary)]">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
