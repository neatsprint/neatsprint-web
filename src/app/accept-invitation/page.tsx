import { AcceptForm } from "@/app/accept-invitation/accept-form";

export const metadata = { title: "Accept invitation" };

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-e2)]">
        <h1 className="text-2xl font-semibold tracking-tight">Join your workspace</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Set your name and password to activate your account.
        </p>
        <div className="mt-6">
          <AcceptForm token={params.token ?? ""} />
        </div>
      </div>
    </div>
  );
}
