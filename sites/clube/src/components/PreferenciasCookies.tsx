"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/tracking";

const temRastreio = Boolean(
  process.env.NEXT_PUBLIC_GTM_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.NEXT_PUBLIC_CLARITY_ID,
);

export function PreferenciasCookies() {
  if (!temRastreio) return null;
  return (
    <button
      type="button"
      className="transition hover:text-white"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      Preferências de cookies
    </button>
  );
}
