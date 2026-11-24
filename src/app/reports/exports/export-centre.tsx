"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";

export type ExportJob = {
  id: string;
  report: string;
  format: string;
  status: string;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "text-[var(--success-600)]",
  FAILED: "text-[var(--danger-600)]",
  RUNNING: "text-[var(--info-500)]",
  PENDING: "text-[var(--text-tertiary)]",
};

export function ExportCentre({ initialJobs }: { initialJobs: ExportJob[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const [jobs, setJobs] = useState(initialJobs);
  const [report, setReport] = useState("time");
  const [format, setFormat] = useState("csv");
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const response = await fetch("/api/session/reports/exports").catch(() => null);
    if (response?.ok) {
      const payload = (await response.json()) as { data: ExportJob[] };
      setJobs(payload.data);
    }
  }

  useEffect(() => {
    if (!jobs.some((job) => job.status === "PENDING" || job.status === "RUNNING")) return;
    const timer = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(timer);
  }, [jobs]);

  async function create() {
    setCreating(true);
    setError(null);
    const response = await fetch("/api/session/reports/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report,
        format,
        from_date: from,
        to_date: to,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      const payload = response ? ((await response.json().catch(() => ({}))) as { detail?: string }) : {};
      setError(payload.detail ?? "That export could not be queued.");
      setCreating(false);
      return;
    }
    await load();
    setCreating(false);
  }

  async function download(job: ExportJob) {
    const response = await fetch(`/api/session/reports/exports/${job.id}/download`).catch(
      () => null,
    );
    if (!response?.ok) {
      setError("That export is not ready yet.");
      return;
    }
    const payload = (await response.json()) as { data: { download_url: string } };
    window.open(payload.data.download_url, "_blank");
  }

  return (
    <div>
      <section className="mb-4 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-e1)]">
        <h2 className="text-base font-semibold">New export</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">Report</span>
            <select
              value={report}
              onChange={(event) => setReport(event.target.value)}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            >
              <option value="time">Time</option>
              <option value="monitoring">Monitoring</option>
            </select>
          </label>
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">Format</span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <label className="text-[12px] text-[var(--text-secondary)]">
            <span className="mb-1 block">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-2 text-[13px]"
            />
          </label>
          <Button disabled={creating} onClick={() => void create()}>
            {creating ? "Queueing…" : "Queue export"}
          </Button>
        </div>
      </section>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {jobs.length === 0 ? (
        <EmptyState
          title="No exports yet"
          description="Queue a CSV or PDF and it will appear here with its status."
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-e1)]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[var(--bg-subtle)] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
              <tr>
                <th className="px-3 py-3 font-medium">Report</th>
                <th className="px-3 py-3 font-medium">Format</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Created</th>
                <th className="px-3 py-3 font-medium text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-3 py-2 capitalize">{job.report}</td>
                  <td className="px-3 py-2 uppercase">{job.format}</td>
                  <td className={`px-3 py-2 font-medium ${STATUS_STYLES[job.status] ?? ""}`}>
                    {job.status}
                    {job.error ? (
                      <span className="ml-1 text-[11px] text-[var(--text-tertiary)]">
                        {job.error}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {job.status === "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => void download(job)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary-600)]"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    ) : (
                      <span className="text-[12px] text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
