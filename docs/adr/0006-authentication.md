# ADR 6 · Authentication

Status: Accepted · November 23, 2026

## Context
Hand-rolled auth is a common source of gaps, and a correct integration of a
maintained library is a stronger portfolio signal than a homemade one. Auth.js
has been maintained by the Better Auth team since September 22, 2025, and that
announcement recommends that new projects start with Better Auth.

## Decision
Better Auth with database sessions.
- Mounted as a catch-all Route Handler at `/api/auth/[...all]`. Server Components
  and Server Actions read the session with `auth.api.getSession`.
- Sign-in with GitHub and Google only, no passwords and no email in release 1
  (ADR 10). A test provider serves previews and CI (step 1.8).
- The organization plugin creates one workspace per user at sign-up and keeps the
  active workspace on the session. One owner per workspace in release 1.
- HttpOnly, Secure, `SameSite=Lax` session cookie with the `__Host-` prefix, on the
  app hostname only (ADR 3). Never tokens in `localStorage`.
- Auth tables sit outside RLS, and only Better Auth touches them.
- A cookie check in `proxy.ts` does not validate a session. Every protected Server
  Action and Route Handler validates on the server through `requireWorkspace()`.

## Main alternative
Passport plus your own session code.

## Revisit if
The project is purely for learning auth internals.

## Sources
- `docs/review iteration 1.md`, ADR table row 6 and its reasoning; Q2
- `docs/Playbook.md`, steps 1.4 and 1.8
- [Better Auth: Auth.js is now part of Better Auth](https://better-auth.com/blog/authjs-joins-better-auth)
- [Better Auth: Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth: Organization plugin](https://better-auth.com/docs/plugins/organization)
