import { redirect } from "next/navigation";

import { ModuleToggles } from "@/app/admin/settings/module-toggles";
import { SettingsForm, type SettingsValues } from "@/app/admin/settings/settings-form";
import { AppShell } from "@/components/app-shell";
import { gatewayFetch, getAccessToken, getProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type TenantResponse = {
  data: {
    name: string;
    plan_code: string;
    settings: SettingsValues;
  };
};

type ModuleResponse = {
  data: Array<{ application_code: string; name: string; enabled: boolean }>;
};

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.permissions.includes("core:tenant:read")) redirect("/");

  const token = await getAccessToken();
  const [tenantResponse, modulesResponse] = await Promise.all([
    gatewayFetch("/core/tenants/current", {}, token),
    gatewayFetch("/core/tenant-applications", {}, token),
  ]);
  if (tenantResponse.status === 401 || modulesResponse.status === 401) redirect("/login");

  if (!tenantResponse.ok) {
    return (
      <AppShell>
        <p className="rounded-[var(--radius-md)] border p-4 text-[13px] text-[var(--danger-600)]">
          Tenant settings are unavailable. Check the Core service.
        </p>
      </AppShell>
    );
  }

  const tenant = ((await tenantResponse.json()) as TenantResponse).data;
  const modules = modulesResponse.ok
    ? ((await modulesResponse.json()) as ModuleResponse).data
    : [];
  const canEdit = profile.permissions.includes("core:tenant:update");

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[13px] text-[var(--text-secondary)]">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tenant settings</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          {tenant.name} · {tenant.plan_code} plan
        </p>
      </div>

      {!canEdit ? (
        <p className="mb-4 rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] p-3 text-[13px] text-[var(--text-secondary)]">
          Only the tenant owner can change settings. You can review the current policy below.
        </p>
      ) : null}

      <section className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
        <h2 className="mb-4 text-base font-semibold">Monitoring & retention</h2>
        <SettingsForm initial={tenant.settings} canEdit={canEdit} />
      </section>

      <section className="mt-4 rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-e1)]">
        <h2 className="mb-1 text-base font-semibold">Modules</h2>
        <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
          Disabled modules disappear from navigation and their APIs reject requests.
        </p>
        <ModuleToggles initial={modules} canEdit={canEdit} />
      </section>
    </AppShell>
  );
}
