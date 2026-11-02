import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Hosts das ferramentas de mídia carregadas pelo GTM / Pixel / Clarity (só após o consentimento).
// Se o time de tráfego adicionar outra ferramenta no GTM, acrescente o domínio dela aqui.
const trackingScripts = [
  "https://www.googletagmanager.com",
  "https://*.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://www.googleadservices.com",
  "https://googleads.g.doubleclick.net",
  "https://connect.facebook.net",
  "https://www.clarity.ms",
  "https://*.clarity.ms",
  "https://analytics.tiktok.com",
];
const trackingConnect = [
  ...trackingScripts,
  "https://*.analytics.google.com",
  "https://stats.g.doubleclick.net",
  "https://www.google.com",
  "https://www.facebook.com",
  "https://*.facebook.com",
];
const trackingFrames = [
  "https://www.googletagmanager.com",
  "https://td.doubleclick.net",
  "https://www.facebook.com",
];

// Páginas estáticas (servidas pela CDN): o Next injeta scripts inline com o payload do RSC
// e o GTM injeta tags "HTML personalizado", por isso script-src usa 'unsafe-inline' com
// lista de hosts permitidos em vez de nonce (nonce obrigaria renderização dinâmica).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${trackingScripts.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self' ${trackingConnect.join(" ")}`,
  `frame-src ${trackingFrames.join(" ")}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // O repositório tem outro package-lock.json na raiz: fixa a raiz do projeto nesta pasta.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/videos/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
