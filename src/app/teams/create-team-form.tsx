"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/session/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    }).catch(() => null);
    const body = response ? await response.json().catch(() => ({})) : {};
    if (!response || !response.ok) {
      setError(body.detail ?? "The team could not be created.");
      setPending(false);
      return;
    }
    setName("");
    setDescription("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="text-[12px] font-medium">
        Team name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 block h-9 w-48 rounded-[var(--radius-md)] border px-2 font-normal"
        />
      </label>
      <label className="text-[12px] font-medium">
        Description
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 block h-9 w-64 rounded-[var(--radius-md)] border px-2 font-normal"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Create team
      </Button>
      {error ? <p className="text-[13px] text-[var(--danger-600)]">{error}</p> : null}
    </form>
  );
}
