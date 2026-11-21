"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function AcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${API}/iam/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, full_name: fullName, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.detail ?? "The invitation could not be accepted.");
        return;
      }
      router.push("/login");
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <p className="text-[13px] text-[var(--danger-600)]">
        This invitation link is missing its token. Ask your admin to resend it.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-[13px] font-medium" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3"
        />
      </div>
      <div>
        <label className="text-[13px] font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          At least 10 characters with upper, lower and a digit.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        Join workspace
      </Button>
    </form>
  );
}
