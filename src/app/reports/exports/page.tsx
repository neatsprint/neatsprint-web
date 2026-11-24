import Link from "next/link";
import { redirect } from "next/navigation";

import { ExportCentre, type ExportJob } from "@/app/reports/exports/export-centre";
import { AppShell } from "@/components/app-shell";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("report:export")) redirect("/reports");
  const token = await getAccessToken();
  const response = await gatewayFetch("/reports/exports", {}, token);
  const jobs: ExportJob[] = response.ok
    ? ((await response.json()) as { data: ExportJob[] }).data
    : [];

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/reports" className="hover:text-[var(--text-primary)]">
            Reports
          </Link>{" "}
          / Exports
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Export centre</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          CSV and PDF exports are generated in the background and downloaded through short-lived
          signed links.
        </p>
      </div>
      <ExportCentre initialJobs={jobs} />
    </AppShell>
  );
}
