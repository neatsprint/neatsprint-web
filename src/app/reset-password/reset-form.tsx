"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.detail ?? "The password could not be reset.");
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
        This reset link is missing its token. Request a new one.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-[13px] font-medium">
        New password
        <input
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
        />
      </label>
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--danger-600)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        Set new password
      </Button>
    </form>
  );
}
