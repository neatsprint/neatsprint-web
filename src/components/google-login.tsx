"use client";

import { useEffect, useRef, useState } from "react";

type CredentialResponse = { credential?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string>) => void;
        };
      };
    };
  }
}

export function GoogleLogin({ onError }: { onError: (message: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session/config")
      .then((response) => response.json())
      .then((body: { google_client_id?: string | null }) => {
        setClientId(body.google_client_id ?? null);
      })
      .catch(() => setClientId(null));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const existing = document.getElementById("gsi-script");
    if (existing) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!ready || !clientId || !window.google || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response.credential) return;
        const result = await fetch("/api/session/login/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: response.credential }),
        }).catch(() => null);
        if (!result || !result.ok) {
          onError("Google sign-in failed. Ask your admin for an invitation.");
          return;
        }
        window.location.assign("/admin/users");
      },
    });
    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      width: "320",
      text: "continue_with",
    });
  }, [ready, clientId, onError]);

  if (!clientId) return null;
  return <div ref={ref} className="flex justify-center" />;
}
