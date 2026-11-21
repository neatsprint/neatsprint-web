"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-e2)]">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="mt-1 mb-6 text-sm text-[var(--text-secondary)]">
          If the email exists, we will send a reset link that expires in 30 minutes.
        </p>
        {sent ? (
          <p className="rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] p-3 text-[13px]">
            Check your inbox. You can close this page.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-[13px] font-medium">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 font-normal"
              />
            </label>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : null}
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
