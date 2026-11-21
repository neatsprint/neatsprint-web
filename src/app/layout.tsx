import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NeatSprint",
    template: "%s · NeatSprint",
  },
  description:
    "Privacy-honest agile delivery: plan the work, prove the work, respect the person.",
  applicationName: "NeatSprint",
  robots: { index: false, follow: false },
};

const themeScript = `(function(){try{var t=localStorage.getItem("neatsprint-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
