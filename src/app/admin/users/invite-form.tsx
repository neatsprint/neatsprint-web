"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Role = { id: string; code: string; name: string };

export function InviteForm({ roles }: { roles: Role[] }) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(
    roles.find((role) => role.code === "MEMBER")?.id ?? roles[0]?.id ?? "",
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/session/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role_ids: [roleId] }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.detail ?? "Invitation could not be sent.");
        return;
      }
      const token = body.data?.dev_token as string | undefined;
      setMessage(
        token
          ? `Invitation created. Dev link: /accept-invitation?token=${token}`
          : `Invitation sent to ${email}.`,
      );
      setEmail("");
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <input
          type="email"
          required
          placeholder="teammate@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-3 outline-none"
          aria-label="Email address"
        />
        <select
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          className="h-10 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2"
          aria-label="Role"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Invite
        </Button>
      </div>
      {message ? (
        <p className="break-all text-[13px] text-[var(--success-600)]">{message}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
