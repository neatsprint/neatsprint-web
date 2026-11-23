"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CreateProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/session/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.detail ?? "The project could not be created.");
        return;
      }
      setOpen(false);
      setName("");
      setKey("");
      router.refresh();
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        New project
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="text-[12px] font-medium">
        Name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 block h-9 w-48 rounded-[var(--radius-md)] border px-2 font-normal"
        />
      </label>
      <label className="text-[12px] font-medium">
        Key
        <input
          required
          value={key}
          maxLength={10}
          onChange={(event) => setKey(event.target.value.toUpperCase())}
          className="mono mt-1 block h-9 w-24 rounded-[var(--radius-md)] border px-2 font-normal uppercase"
          placeholder="AUTH"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        Create
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error ? (
        <p role="alert" className="w-full text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
