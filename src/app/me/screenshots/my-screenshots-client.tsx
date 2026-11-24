"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";

export type MyScreenshot = {
  id: string;
  captured_at: string;
  state: string;
  visible_after: string;
  window_open: boolean;
  can_delete: boolean;
  content_url: string | null;
  width: number;
  height: number;
  deleted_at: string | null;
};

function remainingLabel(target: string, now: number): string {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  if (seconds === 0) return "Window closed";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${hours}h ${minutes}m ${rest}s left to delete`;
}

export function MyScreenshotsClient({
  screenshots,
  privacyHours,
}: {
  screenshots: MyScreenshot[];
  privacyHours: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"PENDING" | "VISIBLE">("PENDING");
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function remove(screenshot: MyScreenshot) {
    if (
      !window.confirm(
        "Delete this screenshot?\n\nYour manager will see that it was deleted, but never the image. This cannot be undone.",
      )
    ) {
      return;
    }
    const response = await fetch(`/api/session/monitor/screenshots/${screenshot.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!response || !response.ok) {
      setError("That screenshot could not be deleted.");
      return;
    }
    router.refresh();
  }

  const visible = screenshots.filter((screenshot) => screenshot.state === tab);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["PENDING", "VISIBLE"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={
              tab === value
                ? "rounded-full bg-[var(--primary-100)] px-3 py-1.5 text-[13px] font-medium text-[var(--primary-700)]"
                : "rounded-full px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            }
          >
            {value === "PENDING" ? "In privacy window" : "Visible to managers"}
          </button>
        ))}
        <span className="ml-2 text-[12px] text-[var(--text-tertiary)]">
          {visible.length} captures · delete window {privacyHours}h
        </span>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {visible.length === 0 ? (
        <EmptyState
          title={
            tab === "PENDING" ? "No captures in the privacy window" : "Nothing visible yet"
          }
          description="Screenshots appear only while your timer is running. You can delete them until the privacy window closes."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((screenshot) => (
            <article
              key={screenshot.id}
              className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]"
            >
              <div className="relative aspect-video bg-[var(--bg-subtle)]">
                {screenshot.content_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/session${screenshot.content_url.replace("/api/v1", "")}`}
                    alt={`Capture from ${new Date(screenshot.captured_at).toLocaleString()}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-tertiary)]">
                    Deleted
                  </div>
                )}
                {screenshot.state === "PENDING" ? (
                  <span className="absolute left-2 top-2 rounded-full bg-[var(--warning-500)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
                    Pending
                  </span>
                ) : (
                  <span className="absolute left-2 top-2 rounded-full bg-[var(--success-600)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
                    Visible
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {new Date(screenshot.captured_at).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  {screenshot.width}×{screenshot.height} ·{" "}
                  {remainingLabel(screenshot.visible_after, now)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    Viewing is audited
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!screenshot.can_delete}
                    onClick={() => void remove(screenshot)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
