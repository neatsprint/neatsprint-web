"use client";

import { useState } from "react";

type ModuleRow = {
  application_code: string;
  name: string;
  enabled: boolean;
};

export function ModuleToggles({
  initial,
  canEdit,
}: {
  initial: ModuleRow[];
  canEdit: boolean;
}) {
  const [modules, setModules] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle(code: string, enabled: boolean) {
    setError(null);
    try {
      const response = await fetch(`/api/session/modules/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.detail ?? "The module could not be updated.");
        return;
      }
      setModules((current) =>
        current.map((module) =>
          module.application_code === code ? { ...module, enabled } : module,
        ),
      );
    } catch {
      setError("Cannot reach the server.");
    }
  }

  return (
    <div className="space-y-3">
      {modules.map((module) => (
        <div
          key={module.application_code}
          className="flex items-center justify-between rounded-[var(--radius-md)] border p-3"
        >
          <div>
            <p className="text-sm font-medium">{module.name}</p>
            <p className="mono text-[11px] text-[var(--text-tertiary)]">
              {module.application_code}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={module.enabled}
            disabled={!canEdit}
            onClick={() => toggle(module.application_code, !module.enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              module.enabled
                ? "bg-[var(--primary-600)]"
                : "bg-[var(--border-strong)]"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                module.enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
