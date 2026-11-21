import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

const checklist = [
  { label: "Invite your team", done: false },
  { label: "Create your first project", done: false },
  { label: "Install the desktop agent", done: false },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">Foundation preview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your workspace</h1>
          <p className="mt-1 max-w-2xl text-[var(--text-secondary)]">
            The shell, design tokens and service skeleton are in place. Planning, tracking and
            reports arrive in the next milestones.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Clock3 size={16} />
            Start timer
          </Button>
          <Button>
            Create project
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="text-base font-semibold">My day</h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Your timer, assigned work and logged time will appear here.
          </p>
          <div className="mt-4 rounded-[var(--radius-md)] border border-dashed p-4">
            <p className="text-sm font-medium">No timer running</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Start tracking from the desktop agent or the timer pill.
            </p>
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            0m tracked today · 0 captures
          </p>
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="text-base font-semibold">Sprint pulse</h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Active sprint progress, blocked items and days remaining.
          </p>
          <div className="mt-4 rounded-[var(--radius-md)] border border-dashed p-4">
            <p className="text-sm font-medium">No active sprint</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Create a project and plan a sprint to see velocity and burndown.
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
            <div className="h-full w-0 bg-[var(--primary-600)]" />
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck size={18} className="text-[var(--success-600)]" />
            Privacy
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            You see every capture before your team does. Deleting one is permanent and leaves only
            an audit tombstone.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3">
              <dt className="text-xs text-[var(--text-secondary)]">Captured today</dt>
              <dd className="mt-1 text-xl font-semibold tabular">0</dd>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3">
              <dt className="text-xs text-[var(--text-secondary)]">Deleted</dt>
              <dd className="mt-1 text-xl font-semibold tabular">0</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Review window: 24 hours · capture only while a timer runs.
          </p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Get set up</h2>
            <span className="text-xs text-[var(--text-tertiary)]">0 of 3 complete</span>
          </div>
          <ul className="mt-3 divide-y">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 py-3">
                {item.done ? (
                  <CheckCircle2 size={18} className="text-[var(--success-600)]" />
                ) : (
                  <Circle size={18} className="text-[var(--text-tertiary)]" />
                )}
                <span className={item.done ? "text-[var(--text-tertiary)] line-through" : ""}>
                  {item.label}
                </span>
                <ArrowRight size={16} className="ml-auto text-[var(--text-tertiary)]" />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles size={18} className="text-[var(--accent-500)]" />
            Build status
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Milestone <span className="font-medium text-[var(--text-primary)]">M0</span> —
            foundations.
          </p>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--success-600)]" />
              Repositories and submodules
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--success-600)]" />
              Contracts and shared library
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--success-600)]" />
              Design tokens and app shell
            </li>
          </ul>
          <Link
            href="/design"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)]"
          >
            Open the design page
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
