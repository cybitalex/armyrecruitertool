/**
 * SORB (Special Operations Recruiting Battalion) mode detection.
 * When true, the app shows SORB-specific UI (analytics, branding, etc.).
 * Set via VITE_SORB_MODE=true when building for sorbarmyrecruitertool.duckdns.org
 */
export const IS_SORB =
  import.meta.env.VITE_SORB_MODE === "true" ||
  (typeof window !== "undefined" && window.location.hostname.includes("sorb"));
