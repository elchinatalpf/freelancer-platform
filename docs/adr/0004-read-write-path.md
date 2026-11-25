# ADR 4 · Read and write path

Status: Accepted · November 23, 2026

## Context
With one Next.js app and no separate API (ADR 1), the app needs one rule for how
data is read and changed, so that every feature follows the same path through the
Data Access Layer.

## Decision
- **Reads:** Server Components read through the Data Access Layer.
- **Writes:** Server Actions mutate, each calling `requireWorkspace()` first.
- **Route Handlers:** only these, each authenticating as shown instead of through
  `requireWorkspace()`:
  - `/api/health`: public and read-only.
  - `/api/auth/[...all]`: Better Auth (ADR 6).
  - Stripe webhook: the Stripe signature (ADR 9).
  - Cron: a `CRON_SECRET` bearer token (ADR 2).

## Main alternative
A REST API called from the browser.

## Revisit if
A mobile app or third parties need an API.

## Consequences
Error shapes follow ADR 7: `ActionResult<T>` for Server Actions, RFC 9457
problem+json for Route Handlers.

## Sources
- `docs/review iteration 1.md`, ADR table row 4
