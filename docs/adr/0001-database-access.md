# ADR 1 · Who touches the database

Status: Accepted · November 23, 2026 (owner decision: Next.js only, NestJS dropped)

## Context
The blueprint named a separate NestJS API as the backend. NestJS guards were an
enforced chokepoint for authorization. Without that API, the chokepoint has to be
built inside the Next.js app. The Next.js data-security guide recommends a Data
Access Layer for new projects that runs only on the server, performs
authorization checks and returns minimal objects. It warns that every Server
Action is reachable by direct POST, so each one must re-verify authentication
and authorization.

## Decision
Only server-side Next.js code touches Postgres, through one Data Access Layer in
`src/server/` that imports `server-only`. The browser never queries Postgres.

A Data Access Layer is a convention, so it is enforced twice:
- An ESLint `no-restricted-imports` rule lets only `src/server/` import the
  database client (step 0.5).
- An e2e test calls every exported Server Action without a session and expects
  each to be rejected (step 1.5).

## Main alternative
A separate NestJS API, as the blueprint specified.

## Revisit if
You need non-web clients, or want NestJS on your resume.

## Consequences
No CORS and no hardcoded API origin, because there is no cross-origin API.
The tenancy rules in ADR 5 and the Data Access Layer's `withTenant()` and
`requireWorkspace()` sit behind this boundary.

## Sources
- `docs/review iteration 1.md`, ADR table row 1 and its reasoning; F10
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
