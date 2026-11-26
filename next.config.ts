import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: http://localhost:9000 http://localhost:9100",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com/gsi/client",
              "connect-src 'self' http://localhost:8000 http://localhost:8100 https://accounts.google.com ws://localhost:3000",
              "frame-src 'self' https://accounts.google.com/gsi/",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; ") + ";",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
