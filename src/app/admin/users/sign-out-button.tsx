"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/session/logout", { method: "POST" }).catch(() => null);
        router.push("/login");
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
    >
      <LogOut size={15} />
      Sign out
    </button>
  );
}
