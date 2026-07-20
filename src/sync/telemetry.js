/**
 * telemetry — fire-and-forget usage reporting to a Power Automate HTTP-trigger
 * flow, so practice and validation attempt counts can actually be aggregated
 * (see buildAttemptRecord in guidedSignoff.js). Distinct from the Teams-folder
 * export: that's the per-validation audit record an SME saves deliberately;
 * this is a lightweight beacon sent automatically for EVERY attempt, from any
 * device — no folder-permission grant required, so it also works on the
 * general-audience Practice page where no SME is present at all.
 *
 * The endpoint URL is read from an env var, injected at build time from a
 * GitHub Actions secret (VITE_POWER_AUTOMATE_URL) — never hardcoded here.
 * SECURITY NOTE: this is still a public static site with no backend. Any
 * value baked into the shipped JS bundle is visible to anyone who inspects
 * network traffic, no matter how it got there — keeping it out of the
 * committed source only keeps it out of the git history / repo diff, it does
 * NOT make the endpoint truly secret at runtime. The realistic exposure is
 * someone spamming junk rows into the destination list, not a data leak
 * (nothing sent here is sensitive beyond a name/email/training outcome).
 */
const ENDPOINT = import.meta.env.VITE_POWER_AUTOMATE_URL || ''

export function telemetryEnabled() {
  return !!ENDPOINT
}

/** Sends `record` to the configured endpoint. Never throws, never blocks the UI. */
export function reportAttempt(record) {
  if (!ENDPOINT) return
  try {
    // mode: 'no-cors' avoids needing the endpoint to opt in via CORS headers —
    // we can't read the response, but we don't need to; this is a beacon, not
    // a request/response call. A plain-text body (rather than declaring
    // application/json) keeps this a CORS-simple request, so no preflight is
    // required either.
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify(record) }).catch(() => {})
  } catch {
    // ignore — telemetry must never break the learner/SME flow
  }
}
