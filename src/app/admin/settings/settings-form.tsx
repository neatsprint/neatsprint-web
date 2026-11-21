"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export type SettingsValues = {
  timezone: string;
  week_start: string;
  privacy_window_hours: number;
  screenshot_interval_min: number;
  screenshot_interval_max: number;
  retention_days: number;
  aggregation_threshold: number;
};

export function SettingsForm({
  initial,
  canEdit,
}: {
  initial: SettingsValues;
  canEdit: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/session/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.detail ?? "Settings could not be saved.");
        return;
      }
      setMessage("Settings saved.");
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[13px] font-medium">
          Timezone
          <input
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.timezone}
            disabled={!canEdit}
            onChange={(event) => update("timezone", event.target.value)}
          />
        </label>
        <label className="text-[13px] font-medium">
          Week starts on
          <select
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.week_start}
            disabled={!canEdit}
            onChange={(event) => update("week_start", event.target.value)}
          >
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </label>
        <label className="text-[13px] font-medium">
          Review window (hours)
          <input
            type="number"
            min={1}
            max={72}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.privacy_window_hours}
            disabled={!canEdit}
            onChange={(event) => update("privacy_window_hours", Number(event.target.value))}
          />
          <span className="mt-1 block text-xs font-normal text-[var(--text-tertiary)]">
            Applies to new captures; existing screenshots keep their original window.
          </span>
        </label>
        <label className="text-[13px] font-medium">
          Retention (days)
          <input
            type="number"
            min={1}
            max={365}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.retention_days}
            disabled={!canEdit}
            onChange={(event) => update("retention_days", Number(event.target.value))}
          />
        </label>
        <label className="text-[13px] font-medium">
          Screenshot interval min (minutes)
          <input
            type="number"
            min={1}
            max={120}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.screenshot_interval_min}
            disabled={!canEdit}
            onChange={(event) => update("screenshot_interval_min", Number(event.target.value))}
          />
        </label>
        <label className="text-[13px] font-medium">
          Screenshot interval max (minutes)
          <input
            type="number"
            min={1}
            max={240}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.screenshot_interval_max}
            disabled={!canEdit}
            onChange={(event) => update("screenshot_interval_max", Number(event.target.value))}
          />
        </label>
        <label className="text-[13px] font-medium">
          Aggregation threshold
          <input
            type="number"
            min={0}
            max={100}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
            value={values.aggregation_threshold}
            disabled={!canEdit}
            onChange={(event) => update("aggregation_threshold", Number(event.target.value))}
          />
          <span className="mt-1 block text-xs font-normal text-[var(--text-tertiary)]">
            0 disables aggregation privacy mode.
          </span>
        </label>
      </div>

      {message ? <p className="text-[13px] text-[var(--success-600)]">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={!canEdit || pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save settings
      </Button>
    </form>
  );
}
