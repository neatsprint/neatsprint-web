import { ResetForm } from "@/app/reset-password/reset-form";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-e2)]">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 mb-6 text-sm text-[var(--text-secondary)]">
          Choose a new password. All other sessions will be signed out.
        </p>
        <ResetForm token={params.token ?? ""} />
      </div>
    </div>
  );
}
