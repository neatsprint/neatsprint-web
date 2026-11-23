import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DesignComponentsDemo } from "@/components/ui/design-components-demo";

export const metadata: Metadata = { title: "Design system" };

const colours = [
  ["Canvas", "--bg-canvas"],
  ["Surface", "--bg-surface"],
  ["Subtle", "--bg-subtle"],
  ["Primary 600", "--primary-600"],
  ["Primary 100", "--primary-100"],
  ["Accent", "--accent-500"],
  ["Success", "--success-600"],
  ["Warning", "--warning-500"],
  ["Danger", "--danger-600"],
  ["Info", "--info-500"],
] as const;

const type = [
  ["Display", "text-[36px] leading-[44px] font-semibold", "Plan the work."],
  ["H1", "text-2xl font-semibold", "Projects"],
  ["H2", "text-xl font-semibold", "Sprint pulse"],
  ["H3", "text-base font-semibold", "AUTH-142"],
  ["Body", "text-sm", "Screenshots pause when your timer stops."],
  ["Caption", "text-xs text-[var(--text-secondary)]", "Updated 2 minutes ago"],
] as const;

const components = [
  ["DataTable", "Headered, token-styled table shell used by the backlog."],
  ["Drawer", "Right-side modal panel with Escape and backdrop close."],
  ["KanbanColumn", "Board column with title, count, empty placeholder and drop target."],
  ["PriorityBadge", "Priority chip shared by the board and backlog."],
  ["UserPill", "Avatar initial plus name, with an explicit unassigned state."],
  ["EmptyState", "Consistent empty, no-results and access messaging."],
] as const;

export default function DesignPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[13px] text-[var(--text-secondary)]">Internal · not linked in production</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Design system</h1>
        <p className="mt-1 max-w-2xl text-[var(--text-secondary)]">
          Tokens and primitives from docs/UI_UX_DESIGN.md. Components must use tokens, never raw
          hex values.
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5">
        <h2 className="text-base font-semibold">Colour</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {colours.map(([label, token]) => (
            <div key={token} className="overflow-hidden rounded-[var(--radius-md)] border">
              <div className="h-14 w-full" style={{ background: `var(${token})` }} />
              <div className="p-2">
                <p className="text-xs font-medium">{label}</p>
                <p className="mono text-[10px] text-[var(--text-tertiary)]">{token}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5">
          <h2 className="text-base font-semibold">Typography</h2>
          <div className="mt-4 space-y-4">
            {type.map(([label, classes, sample]) => (
              <div key={label}>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  {label}
                </p>
                <p className={classes}>{sample}</p>
              </div>
            ))}
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                Mono
              </p>
              <p className="mono text-[13px]">018f1c2d-7a3b-7c4d-9e5f-0123456789ab</p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5">
          <h2 className="text-base font-semibold">Buttons</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button size="sm">Small</Button>
            <Button disabled>Disabled</Button>
          </div>

          <h2 className="mt-6 text-base font-semibold">Status</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[
              ["To do", "--text-secondary"],
              ["In progress", "--info-500"],
              ["In review", "--primary-600"],
              ["Blocked", "--danger-600"],
              ["Done", "--success-600"],
            ].map(([label, token]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
              >
                <span className="size-2 rounded-full" style={{ background: `var(${token})` }} />
                {label}
              </span>
            ))}
          </div>

          <h2 className="mt-6 text-base font-semibold">Privacy pill</h2>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-[var(--bg-subtle)] px-3 py-1.5 text-[13px]">
            <span className="size-2 rounded-full bg-[var(--warning-500)]" />
            Recording · review 3
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5">
        <h2 className="text-base font-semibold">Components</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Shared primitives used by the M2 planning surfaces. Every component uses tokens and has a
          loading, empty or permission-aware state where relevant.
        </p>
        <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {components.map(([name, description]) => (
            <div key={name} className="rounded-[var(--radius-md)] border p-3">
              <dt className="mono text-[12px] font-semibold">{name}</dt>
              <dd className="mt-1 text-[12px] text-[var(--text-secondary)]">{description}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <DesignComponentsDemo />
        </div>
      </section>
    </AppShell>
  );
}
