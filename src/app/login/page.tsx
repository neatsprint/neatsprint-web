"use client";

import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GoogleLogin } from "@/components/google-login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@acme-labs.com");
  const [password, setPassword] = useState("NeatSprint!2026");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.detail ?? "Sign in failed. Check your email and password.");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Cannot reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[var(--bg-inverse)] p-10 text-[var(--text-inverse)] lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-600)] font-bold">
            N
          </span>
          <span className="text-lg font-semibold">NeatSprint</span>
        </div>
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight">
            Plan the work. Prove the work. Respect the person.
          </p>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Screenshots pause when your timer stops, and you can delete them before your team
            ever sees them.
          </p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">Local development build</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm rounded-[var(--radius-xl)] border bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-e2)]"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Sign in to your workspace.
          </p>

          <div className="mt-6">
            <GoogleLogin onError={setError} />
          </div>

          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            <span className="h-px flex-1 bg-[var(--border-default)]" />
            or email
            <span className="h-px flex-1 bg-[var(--border-default)]" />
          </div>

          <label className="mt-2 block text-[13px] font-medium" htmlFor="email">
            Email
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-[var(--radius-md)] border px-3">
            <Mail size={16} className="text-[var(--text-tertiary)]" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full bg-transparent outline-none"
            />
          </div>

          <label className="mt-4 block text-[13px] font-medium" htmlFor="password">
            Password
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-[var(--radius-md)] border px-3">
            <LockKeyhole size={16} className="text-[var(--text-tertiary)]" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full bg-transparent outline-none"
            />
          </div>

          {error ? (
            <p role="alert" className="mt-3 text-[13px] text-[var(--danger-600)]">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-6 w-full" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign in
            <ArrowRight size={16} />
          </Button>

          <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
            Demo: owner@acme-labs.com · NeatSprint!2026
          </p>
          <p className="mt-2 text-center text-xs">
            <a
              href="/forgot-password"
              className="text-[var(--primary-600)] hover:text-[var(--primary-700)]"
            >
              Forgot password?
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
