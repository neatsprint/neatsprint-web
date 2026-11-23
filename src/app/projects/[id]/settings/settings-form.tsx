"use client";

import { Loader2, Save, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

export function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [startDate, setStartDate] = useState(project.start_date ?? "");
  const [endDate, setEndDate] = useState(project.end_date ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/session/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
      }),
    }).catch(() => null);
    const body = response ? await response.json().catch(() => ({})) : {};
    if (!response || !response.ok) {
      setError(body.detail ?? "Settings could not be saved.");
    } else {
      setMessage("Project saved.");
      router.refresh();
    }
    setPending(false);
  }

  async function archive() {
    if (!window.confirm(`Archive “${project.name}”? It becomes read-only.`)) return;
    setPending(true);
    const response = await fetch(`/api/session/projects/${project.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    }).catch(() => null);
    if (response?.ok) {
      router.push("/projects");
      router.refresh();
      return;
    }
    setError("The project could not be archived.");
    setPending(false);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[13px] font-medium">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
          />
        </label>
        <label className="text-[13px] font-medium">
          Key
          <input
            value={project.key}
            disabled
            className="mono mt-1 h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] px-3 font-normal"
          />
        </label>
        <label className="text-[13px] font-medium">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
          />
        </label>
        <label className="text-[13px] font-medium">
          End date
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
          />
        </label>
      </div>
      <label className="block text-[13px] font-medium">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-[var(--radius-md)] border px-3 py-2 font-normal"
        />
      </label>

      {message ? <p className="text-[13px] text-[var(--success-600)]">{message}</p> : null}
      {error ? <p className="text-[13px] text-[var(--danger-600)]">{error}</p> : null}

      <div className="flex items-center justify-between">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </Button>
        {project.status === "ACTIVE" ? (
          <Button type="button" variant="danger" onClick={archive} disabled={pending}>
            <Archive size={16} />
            Archive project
          </Button>
        ) : null}
      </div>
    </form>
  );
}
