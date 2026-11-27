# Empowered Professional Platform
Multi-tenant site builder for freelancers. One Next.js 16 app at the repo root, pnpm.
Architecture decisions: docs/adr/. The current step's spec: docs/specs/<step id>.md.

## Commands
pnpm dev | pnpm check (typecheck, lint, unit, integration) | pnpm test:e2e | pnpm db:migrate

## Layout
src/app/             routes: (app) dashboard and editor, (sites) public pages
src/features/<name>/ UI and Server Actions for one feature
src/server/          Data Access Layer, the only code that imports the database client
src/contracts/       zod schemas shared by forms, actions and page blocks
tests/               unit, integration (real Postgres), e2e (Playwright)
tests/security/      red-team tests; protected

## Non-negotiables
- Only src/server/ touches Postgres (import 'server-only'). Every tenant query runs
  inside withTenant() over the Neon WebSocket Pool, never neon-http.
- Every Server Action and Route Handler calls requireWorkspace() first, except the
  Route Handlers listed in ADR 4, which authenticate as ADR 4 says. tenant_id comes
  from the session, never from request input.
- Every new tenant table gets tenant_id, RLS enabled and forced, the nullif policy
  and an isolation test. The schema test fails otherwise.
- Validate all input with src/contracts. Server Actions return ActionResult<T>;
  Route Handler errors are RFC 9457 problem+json.
- No raw HTML, script or embed blocks. Rich text renders on the server.
- Never read or print .env files. Add a dependency only if the spec names it.
- Branches: step/<id>-<slug> for features, kit/<slug> for .claude/, .github/ or
  docs/adr/ changes, redteam/phase-<n> for red-team tests. A hook and CI enforce
  what each may edit.
- If the spec conflicts with an ADR, stop and say so. Do not work around it.

## Definition of done
pnpm check green; new behavior has tests; the spec's acceptance tests pass;
the PR body follows .github/pull_request_template.md, including "How this works".

## Conventions
kebab-case files, PascalCase components, camelCase functions.
Copy the patterns in src/features/workspace-profile/ (the golden slice).
