/** Maps the redirect route's `google_error` reason to a user-facing message. */
export function googleErrorMessage(reason: string | null): string | null {
  if (!reason) return null;
  switch (reason) {
    case "csrf":
      return "Google sign-in could not be verified. Please try again.";
    case "not_invited":
      return "This Google account isn't invited to this workspace. Ask an admin to invite it.";
    case "rejected":
      return "Google could not verify this sign-in. Please try again.";
    default:
      return "Google sign-in failed. Please try again or use your email and password.";
  }
}

/** Maps an IAM error response to the `google_error` reason used in the URL. */
export function googleErrorReason(status: number, code?: string | null): string {
  if (status === 403 && code === "invitation_required") return "not_invited";
  if (status === 401) return "rejected";
  return "failed";
}
