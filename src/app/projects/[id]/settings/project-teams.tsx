"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Team = { id: string; name: string };

export function ProjectTeams({
  projectId,
  teams,
  selected,
  canEdit,
}: {
  projectId: string;
  teams: Team[];
  selected: string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<string[]>(selected);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/session/projects/${projectId}/teams`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_ids: checked }),
    }).catch(() => null);
    setMessage(response?.ok ? "Teams updated." : "Teams could not be updated.");
    setPending(false);
    if (response?.ok) router.refresh();
  }

  return (
    <div>
      <div className="space-y-2">
        {teams.map((team) => (
          <label key={team.id} className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={checked.includes(team.id)}
              onChange={(event) =>
                setChecked((current) =>
                  event.target.checked
                    ? [...current, team.id]
                    : current.filter((id) => id !== team.id),
                )
              }
            />
            {team.name}
          </label>
        ))}
        {teams.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)]">No teams yet.</p>
        ) : null}
      </div>
      {canEdit ? (
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save teams
          </Button>
          {message ? <span className="text-[13px]">{message}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
