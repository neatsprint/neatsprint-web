import Link from "next/link";
import { redirect } from "next/navigation";

import {
  MyScreenshotsClient,
  type MyScreenshot,
} from "@/app/me/screenshots/my-screenshots-client";
import { AppShell } from "@/components/app-shell";
import { InlineAlert } from "@/components/ui/inline-alert";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MyScreenshotsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const token = await getAccessToken();
  const [shotsResponse, policyResponse] = await Promise.all([
    gatewayFetch("/monitor/screenshots/mine", {}, token),
    gatewayFetch("/monitor/policy", {}, token),
  ]);
  if (shotsResponse.status === 401) redirect("/login");
  const screenshots: MyScreenshot[] = shotsResponse.ok
    ? ((await shotsResponse.json()) as { data: MyScreenshot[] }).data
    : [];
  const privacyHours = policyResponse.ok
    ? ((await policyResponse.json()) as { data: { privacy_window_hours: number } }).data
        .privacy_window_hours
    : 24;

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          <Link href="/" className="hover:text-[var(--text-primary)]">
            Dashboard
          </Link>{" "}
          / My work
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">My screenshots</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
          Captures stay private during the window. Delete anything you do not want to share;
          managers see a tombstone, never the image.
        </p>
      </div>

      {!shotsResponse.ok ? (
        <InlineAlert>Your screenshots could not be loaded. Try refreshing the page.</InlineAlert>
      ) : null}

      <MyScreenshotsClient screenshots={screenshots} privacyHours={privacyHours} />
    </AppShell>
  );
}
