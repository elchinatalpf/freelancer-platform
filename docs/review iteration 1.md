# Empowered Professional Platform — Deep Review (Opus 5.5, iteration 1)

Nov 23, 2026 · @Javier Morales

Iteration 2 (ChatGPT, Gemini, Grok) checked against primary sources: Iteration 2 cross-check

## Verdict

Do not write feature code yet. The blueprint picks reasonable products but skips the decisions and mechanics where a multi-tenant payments app actually fails, and the scaffold sits on a Next.js version inside a CVSS 10.0 remote-code-execution range.

1. **Rebuild, don't repair.** Regenerate the Next.js app on Node 26 and Next.js 16.4.5 or later, drop the NestJS app, then add git, a pnpm lockfile and CI (F01 to F04, Sprint 0).
2. **Tenancy is the foundation.** RLS works only with a runtime role that is not the table owner and does not bypass RLS (Neon's default role does: F26), transaction-local tenant context, `FORCE ROW LEVEL SECURITY`, and isolation tests written before any feature (F07).
3. **Scheduling is out of release 1 (your decision, November 23).** Release 1 is a portfolio site builder, so F05 and the scheduling notes below apply only if scheduling returns. The Build Playbook orders the work: tenancy, editor, public sites, uploads, billing in test mode.
4. **Tenant sites go on a different site from the app** (F08). With no custom domain, that means a second `vercel.app` hostname: `vercel.app` is on the Public Suffix List, so tenant pages cannot plant cookies on the dashboard.
5. **Haiku 5.5 executes; Opus or Sonnet decides and reviews.** Deterministic gates (tests, hooks, a schema check) enforce what prose instructions cannot.

**Confidence.** High on the version, CVE, RLS and domain findings, which rest on primary sources opened for this review. Moderate on ADRs #5 and #6, which recommend tools whose integration with this stack I did not verify.

**One implication against a likely prior.** The prior: once the workflow is tailored, a fast model can build the rest. The workflow documents do not transfer judgment to Haiku; the tests do. If the isolation tests and webhook tests do not exist, a tailored `CLAUDE.md` will not stop a cross-tenant leak.

## How to read this

Every load-bearing claim carries one of three labels, so later model iterations can check the same claims rather than re-argue them.

- **SOURCED**: from a page opened in this session, listed under Sources.
- **INFERENCE**: my reasoning, with what it rests on named.
- **UNCHECKED**: from training data, not verified here. Verify before acting on it.

Severity scale used in the findings register:

| Level | Meaning |
| --- | --- |
| P0 | Fix before writing any feature code |
| P1 | Fix before the first real user or real client data |
| P2 | Fix before the second tenant or before charging money |
| P3 | Hygiene; fix when convenient |

**Assumptions this review makes.** Each one changes a recommendation if it is wrong.

1. Portfolio first (confirmed): the main goal is a portfolio piece for junior developer roles. Updated November 23: release 1 is a portfolio site builder for any freelancer, with no scheduling or payouts, no custom domains, and a free tier plus a $10–40 a year tier built in Stripe test mode. Tenant #1 is you. The phases now live in Doc.
2. You are a solo developer with a small budget. Every extra service costs both money and attention.
3. Nothing is deployed and no real client data exists. Every fix is cheapest now.
4. A stronger model plans and reviews; Haiku 5.5 executes well-scoped tasks.

Because the project is portfolio-first, depth beats breadth: a deployed demo with seeded tenants, Stripe in test mode, and visible ADRs and isolation tests show more skill than extra features. Still use a maintained auth library rather than hand-rolled auth; a correct integration is a stronger hiring signal than a homemade one with gaps (INFERENCE). Revisit managed services only if you decide to charge tenants. The ADR section marks where this flips.

## Findings register

Twenty findings; seven are P0 and block feature work. The two that matter most are the vulnerable framework pin (F01) and the missing tenancy mechanics (F07). Keep the IDs stable across review iterations so each model confirms or disputes the same items.

| ID | Sev | Finding | Fix | Status |
| --- | --- | --- | --- | --- |
| F01 | P0 | `next 15.5.2` and `react 19.1.0` are pinned inside the React2Shell range (CVSS 10.0 RCE) and predate a year of 2026 security releases | Rebuild on Next.js 16.4.5 or later (Sprint 0) | Open |
| F02 | P0 | Node 23.11.0 is end-of-life; the supported LTS lines are 26, 24 and 22 | Node 26 plus an `engines` pin | Open |
| F03 | P0 | No git repository and no root `.gitignore` | `git init` before anything else | Open |
| F04 | P0 | Broken install: stray `package-lock.json`, no `pnpm-lock.yaml`, no `node_modules` in the API | Delete, regenerate, commit the pnpm lockfile | Open |
| F05 | P0 | Client scheduling is in the value proposition but absent from Sprints 2 to 4; no MVP definition, no data model | Deferred: scheduling is out of release 1 (owner, November 23) | Open |
| F06 | P0 | Ten integration decisions are unmade (query layer, auth, hosting, domains, contract and more) | Write the ADRs | Open |
| F07 | P0 | RLS is named without a role model, transaction-local context, `FORCE`, or isolation tests | Follow the RLS section | Open |
| F08 | P1 | Tenant sites planned as subdomains of the app's own domain, which lets tenant pages set app cookies | Second vercel.app hostname (on the Public Suffix List), `__Host-` cookies | Open |
| F09 | P1 | Auth and RLS (Sprint 3) arrive after the editor (Sprint 2) | Tenancy first (Roadmap section) | Open |
| F10 | P1 | Hardcoded API URL, CORS origin with credentials, `catch (error: any)`; no `.env.example` or env validation | Env schema at boot; NestJS app removed, so no CORS; typed errors | Open |
| F11 | P1 | Stripe plan uses legacy account types and has no webhook design | Release 1: Stripe Billing in test mode (Connect only if payouts return); raw-body signature check; idempotency | Open |
| F12 | P1 | "Programmatic subdomain creation via the Vercel API" is the wrong mechanism: one wildcard domain covers all subdomains; the API is for tenant custom domains | Deferred: no custom domains in release 1 | Open |
| F13 | P1 | A local Claude Code allow-list sits in the tree; no shared settings, deny rules or hooks | Committed `.claude/settings.json` (Agent workflow section) | Open |
| F14 | P1 | No dependency cooldown or build-script allow-list configured | pnpm supply-chain settings | Open |
| F15 | P2 | `packages/` is empty; the "standardized error shape" is undefined | `src/contracts` with zod; typed ActionResult\<T> for Server Actions, RFC 9457 for Route Handlers | Open |
| F16 | P2 | No CI, no web test runner, a suspect `supertest` import, `noImplicitAny` off | CI on every push; fix the tests; strict TypeScript | Open |
| F17 | P2 | Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts` and removes `next lint`; tenant routing and lint scripts must use the new names | Use `proxy.ts`; run ESLint directly | Open |
| F18 | P2 | Puck is now published as `@puckeditor/core`; page storage and publishing are unspecified | ADR #8: immutable page revisions, atomic publish | Open |
| F19 | P3 | Package metadata defaults: ISC at root, UNLICENSED in the API, empty author, boilerplate README and page metadata | Pick a license; fill metadata | Open |
| F20 | P3 | Blueprint bug: the tracer bullet fetches `/hello`, but Nest's default route is `/` | Fix the blueprint text; the code is right | Open |
| F21 | P1 | Neon's HTTP driver runs single queries and non-interactive batches only; `withTenant()` needs an interactive transaction per request | WebSocket `Pool` or TCP `pg` for tenant queries; never `neon-http` | Open |
| F22 | P1 | RLS blind spots: `TRUNCATE` ignores policies; views apply the view owner's policies unless `security_invoker` is set; an owner-run backfill under FORCE with no tenant context matches no rows; `pg_dump` as a non-bypass role errors | No `TRUNCATE` grant to the runtime role; `security_invoker = true` on every view; backfills and backups under a separate `BYPASSRLS` maintenance role | Open |
| F23 | P2 | A split Puck server config that drops render-time fields renders rich text as escaped strings | One shared field config; a test that publishes rich text and checks the HTML | Open |
| F24 | P1 | No upload pipeline: SVG and spoofed file types, and remote-image fetches through `next/image` | Presigned uploads, magic-byte checks, no SVG, `remotePatterns` limited to the platform bucket | Open |
| F25 | P2 | Concurrent writes: two tabs overwrite one page draft; class seats can oversell | Version column with compare-and-set on drafts; conditional update or row lock on seats | Open |
| F26 | P0 | Neon's default project role, and roles made in the Console, API or CLI, inherit `BYPASSRLS` from `neon_superuser`; with one in `DATABASE_URL`, every policy is skipped without an error | Create `app_runtime` with SQL; role test in CI | Open |

F17 is SOURCED from the [Next.js 16 release notes](https://nextjs.org/blog/next-16); F12 from [Vercel's domain docs](https://vercel.com/docs/platforms/multi-tenant-platforms/configuring-domains), which state that one wildcard certificate covers every tenant subdomain at that level and require Vercel nameservers for it.

## Architecture decisions the blueprint skipped

The blueprint picks products but leaves the ten decisions that determine whether they fit together unmade. Write each as a one-page ADR in `docs/adr/` before Sprint 1, because a fast executor model will otherwise make each one implicitly, differently, in every task.

| # | Decision | Recommendation | Main alternative | Flips if |
| --- | --- | --- | --- | --- |
| 1 | Who touches the database | Only server-side Next.js code, through one server-only Data Access Layer. The browser never queries Postgres. | A separate NestJS API, as the blueprint specifies | You need non-web clients, or want NestJS on your resume |
| 2 | Hosting | One Vercel project for the app; tenant sites on a second vercel.app hostname (playbook step 3.1) | A long-running container host | You need WebSockets or long background jobs |
| 3 | Domain layout | App and auth on one vercel.app hostname; tenant sites on a second one (no custom domains in release 1) | Everything under one apex | Never, while tenants can publish content |
| 4 | Read and write path | Server Components read through the Data Access Layer; Server Actions mutate; Route Handlers only for auth, webhooks and cron | A REST API called from the browser | A mobile app or third parties need an API |
| 5 | Query layer | Drizzle, after a one-day spike proving the RLS transaction pattern | Prisma interactive transactions | The spike shows Drizzle cannot hold one transaction handle cleanly |
| 6 | Authentication | Better Auth with database sessions | Passport plus your own session code | The project is purely for learning auth internals |
| 7 | API contract | zod schemas in `src/contracts`; typed `ActionResult<T>` for Server Actions; RFC 9457 for Route Handlers | tRPC, or a generated OpenAPI client | You add non-TypeScript clients |
| 8 | Puck page storage | Immutable `page_revisions(tenant_id, page_id, version, data jsonb)` plus `pages.published_revision_id`; drafts save with compare-and-set on `version`; publish moves the pointer in one transaction, then `updateTag`; rollback moves it back | Static export per tenant | Tenant count grows past what on-demand revalidation handles |
| 9 | Payments | Release 1: Stripe Billing subscriptions in test mode, with you as the merchant. If payouts to tenants return: Accounts v2 or controller properties, direct charges, Stripe-hosted onboarding | Legacy Express accounts with destination charges | You want the platform to own the customer relationship and its losses |
| 10 | Transactional email | Deferred: no email in release 1 because there is no domain yet; sign-in uses GitHub and Google. Later: send from a domain you own, tenant as reply-to | Verify each tenant's own domain | Tenants demand branded sender addresses |

**Reasoning for the rows that carry the most risk**

- **#1 and #4.** Decided November 23: Next.js only. This departs from the blueprint, which names NestJS as the backend (§1.C) and scaffolds it with `nest new api` (§4, Step 2). SOURCED: the [Next.js data-security guide](https://nextjs.org/docs/app/guides/data-security) recommends a Data Access Layer for new projects that runs only on the server, performs authorization checks and returns minimal objects, and warns that every Server Action is reachable by direct POST, so each one must re-verify authentication and authorization. The trade-off is that NestJS guards were an enforced chokepoint, while a Data Access Layer is a convention. INFERENCE: enforce it twice: an ESLint no-restricted-imports rule that lets only src/server/ import the database client, and an e2e test that calls every exported Server Action without a session and expects rejection. Dropping the separate API also removes CORS and the hardcoded `localhost:3001` origin.
- **#2.** With NestJS gone, one Vercel project serves the app and, on the second apex, the tenant sites. Scheduled work such as reminder emails runs as Vercel Cron calling a Route Handler; SOURCED from [Vercel's guide](https://vercel.com/kb/guide/ship-a-nestjs-app-on-vercel): cron triggers send an HTTP GET to the route, run only on production deployments, and should be protected with a `CRON_SECRET` bearer token.
- **#3.** SOURCED: Vercel's multi-tenant docs say that without a Public Suffix List entry, `tenant1.acme.com` can set a cookie for `acme.com` that the browser then sends to the dashboard. They recommend putting the dashboard and auth on a different apex, `__Host-` cookies without a `Domain` attribute, and Origin or CSRF-token checks ([Vercel docs](https://vercel.com/docs/platforms/multi-tenant-platforms/configuring-domains)). GitHub moved Pages from `github.com` to `github.io` in 2013 for the same reason: tenant JavaScript could write `github.com` cookies, enabling session and CSRF-token fixation ([GitHub blog](https://github.blog/news-insights/product-news/new-github-pages-domain-github-io)).
- **#6.** SOURCED: Auth.js has been maintained by the Better Auth team since September 22, 2025, and that announcement recommends new projects start with Better Auth ([Better Auth blog](https://better-auth.com/blog/authjs-joins-better-auth)). In the App Router it mounts as a catch-all Route Handler at `/api/auth/[...all]` through `toNextJsHandler`; Server Components and Server Actions read the session with `auth.api.getSession`; and its docs warn that a cookie check in `proxy.ts` does not validate the session, so every protected action must validate on the server ([Better Auth Next.js docs](https://www.better-auth.com/docs/integrations/next)). SOURCED: its organization plugin covers organizations, members, roles, invitations, an active organization on the session, and access control (Better Auth organization plugin docs, in Sources). Use HttpOnly session cookies, never tokens in `localStorage`.
- **#7.** SOURCED: RFC 9457 defines `type`, `title`, `status`, `detail` and `instance` with media type `application/problem+json`, allows extension members such as a validation `errors` array, and obsoletes RFC 7807 ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)). Adopt it for Route Handlers instead of inventing the "standardized error shape" the blueprint asks for. Server Actions return a typed ActionResult\<T> union instead (Gemini, iteration 2). INFERENCE: the client calls an action as a function and never reads its HTTP response, so a problem+json body adds nothing there.
- **#8.** Puck's package is now `@puckeditor/core` (SOURCED, [README](https://cdn.jsdelivr.net/npm/@puckeditor/core@0.22.0/README.md)); the blueprint-era name was `@measured/puck`. The page JSON is tenant-controlled input: validate component types and props against an allow-list on save, and reject `javascript:` and `data:` URLs in any link or image field (INFERENCE).
- **#9.** SOURCED: Stripe now marks Standard, Express and Custom account types as legacy and recommends Accounts v2 or controller properties ([Stripe docs](https://docs.stripe.com/connect/connecting-to-accounts)). Its comparison table puts fraud and dispute liability on the platform for Express and for destination charges, and on the connected account for Standard accounts using direct charges. For a solo founder, direct charges keep each teacher as the merchant of record. Confirm the exact v2 settings with Stripe's platform guide before building.

## Multi-tenancy and Row-Level Security

RLS protects nothing if the app connects as the table owner, a superuser, or a role with `BYPASSRLS`. SOURCED: the [PostgreSQL docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) state that superusers and `BYPASSRLS` roles always bypass row security, and that table owners normally do too unless the table uses `FORCE ROW LEVEL SECURITY`. The blueprint names RLS but specifies none of the mechanics below, and every one of them fails silently.

**Design rules**

1. **Shared schema, `tenant_id uuid not null` on every tenant-owned table**, with indexes that lead with `tenant_id`. INFERENCE: schema-per-tenant multiplies migrations by tenant count, which a solo developer cannot afford.
2. **Two database roles.** An owner role runs migrations and owns the tables. A runtime role logs in for the app and is not superuser, not `BYPASSRLS`, and owns nothing. Also set `FORCE ROW LEVEL SECURITY` on every tenant table as a second layer. On Neon, create the runtime role with SQL: the project's default role, and any role made in the Console, API or CLI, inherits `BYPASSRLS` through `neon_superuser` ([Neon roles](https://neon.com/docs/manage/roles/); F26).
3. **Tenant context is transaction-local.** Each request opens a transaction and calls `set_config('app.tenant_id', <id>, true)`. A session-level `SET` on a pooled connection leaks one tenant's context into the next request that reuses the connection. SOURCED: `LOCAL` takes effect for only the current transaction, and `set_config` provides the same behavior ([PostgreSQL SET](https://www.postgresql.org/docs/19/sql-set.html)). This needs an interactive transaction, so use Neon's WebSocket `Pool` or TCP `pg`, not the HTTP driver (F21).
4. **Policies fail closed.** With no context set, the policy must match zero rows. SOURCED: with RLS enabled and no policy, PostgreSQL applies a default-deny policy.
5. **One chokepoint in the Data Access Layer.** A single `server-only` module exports `withTenant(tenantId, fn)`, which opens the transaction, sets the context and hands a transaction handle to repository functions. Repositories accept only that handle, and only the Data Access Layer imports the database client, so no Server Component, Server Action or Route Handler can query outside it.
6. **Per-tenant uniqueness.** SOURCED: unique, primary-key and foreign-key checks always bypass row security, and the docs warn about "covert channel" leaks through them. A global `unique(email)` on clients lets tenant A discover that an email exists in tenant B. Use `unique(tenant_id, email)`. Only the public tenant slug should be globally unique.
7. **Webhooks and jobs have no user session.** Resolve the tenant from trusted data (for Stripe, the connected account ID on the verified event), then run through the same `withTenant` helper. Do not route them through the owner role because it is easier.
8. **The framework cache is outside RLS.** SOURCED: the [Next.js November 2026 security release](https://nextjs.org/blog/november-2026-security-release) fixed a high-severity cross-tenant cache disclosure when `use cache` and `unstable_cache` are combined and the cached function reads a root parameter such as a tenant ID. Run 16.4.5 or later, and pass the tenant ID explicitly as an argument to every cached function so it becomes part of the cache key (INFERENCE).

```sql
-- Migration role owns tables. Runtime role does not.
CREATE ROLE app_runtime LOGIN NOSUPERUSER NOBYPASSRLS;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON bookings
  USING      (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO app_runtime;

-- Per request, inside one transaction:
BEGIN;
SELECT set_config('app.tenant_id', $1, true);
-- ...queries...
COMMIT;
```

The `nullif(..., '')` guard is required. SOURCED: once a custom setting has been set in a session, even transaction-locally, `current_setting` returns an empty string rather than NULL after the transaction ends (PostgreSQL bug report [#15646](https://www.postgresql.org/message-id/15646-0d3caee9f6266f60@postgresql.org), snippet only; [Tom Lane's explanation](https://www.postgresql.org/message-id/1095764.1729350466%40sss.pgh.pa.us)). An empty string cast to `uuid` raises an error instead of matching nothing. Test both cases.

**Tests that prove isolation.** Write these before any feature that stores tenant data. They are the guardrail a fast model cannot talk its way past.

- [ ] With tenant A's context, every tenant table returns zero rows belonging to tenant B.
- [ ] Inserting a row with tenant B's ID under tenant A's context fails the `WITH CHECK`; updates and deletes of B's rows affect zero rows.
- [ ] With no context set, every tenant table returns zero rows.
- [ ] Schema test: every table with a `tenant_id` column has RLS enabled, RLS forced, and at least one policy. This catches a new table added without a policy.
- [ ] Role test: the runtime role is not superuser, not `BYPASSRLS`, and owns no tables.
- [ ] Pool test: with a pool of size 1, a request for tenant A followed by one for tenant B never sees A's context.

## Security review

The most severe security problem today is the pinned framework version. SOURCED: Next.js 15.x App Router apps are affected by CVE-2025-55182 ("React2Shell"), a CVSS 10.0 remote-code-execution flaw in the React Server Components protocol, fixed on the 15.5 line in 15.5.7 ([Next.js advisory](https://nextjs.org/blog/CVE-2025-66478), [CERT-EU](https://cert.europa.eu/publications/security-advisories/2025-041/), snippet only). The project pins `next 15.5.2` and `react 19.1.0`, inside that range. Next.js moved to scheduled monthly security releases in July 2026 (snippet only); the latest, on November 3, patched 16.4.5 and 15.5.29 ([release notes](https://nextjs.org/blog/november-2026-security-release)). Nothing is deployed, so the exposure is local, but no feature code should be written on this base.

| Risk | Severity | Control | Evidence |
| --- | --- | --- | --- |
| Known framework CVEs (RCE, cache leaks) | P0 | Next.js 16.4.5 or later; follow the monthly Next.js security releases; CI fails on high-severity advisories | SOURCED |
| Tenant-authored pages run script on the app's site | P0 before tenant pages go live | Separate apex for tenant sites (ADR #3); Public Suffix List entry; `__Host-` cookies; a Content-Security-Policy on tenant pages; allow-listed Puck props; reject `javascript:` and `data:` URLs | SOURCED (Vercel, GitHub); CSP and URL rules INFERENCE |
| One tenant reads another's rows | P0 before storing tenant data | RLS design and isolation tests (previous section) | SOURCED |
| Client supplies `tenant_id`, or a Server Action skips its auth check | P1 | Take `tenant_id` only from the server-side session; every Server Action and Route Handler re-checks the session and resource ownership through the Data Access Layer; an e2e test calls each exported action without a session and expects rejection | SOURCED ([Next.js data security](https://nextjs.org/docs/app/guides/data-security)); the test INFERENCE |
| Session fixation and CSRF | P1 | Database sessions; `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix; Origin or CSRF-token check on every state-changing Route Handler (Server Actions already compare Origin with Host); rate limits on login and magic links | SOURCED (Vercel docs on cookies and Origin checks) |
| Forged or replayed payment webhooks | P1 | Verify the Stripe signature over the raw body, read with `request.text()` in the Route Handler before any parsing; store processed event IDs under a unique constraint; read prices from the database, never from the client | UNCHECKED for the `request.text()` call; idempotency design INFERENCE |
| Card data on your servers | P1 | Stripe-hosted Checkout or Elements only | UNCHECKED: confirm the resulting PCI self-assessment scope with Stripe |
| Malicious dependency (install-script worm, typo-squat) | P1 | Keep pnpm's script blocking and strict builds; `minimumReleaseAge` of at least 1440; `blockExoticSubdeps`; `trustPolicy: no-downgrade`; new dependencies only with your approval | SOURCED ([pnpm](https://pnpm.io/supply-chain-security)) |
| Secrets leak through the repo or the agent | P1 | Test-mode keys only on your machine; live keys only in Vercel's environment settings; Claude Code `Read` deny rules for `.env*`; sandbox for OS-level enforcement; secret scanning in CI and push protection on GitHub | SOURCED (Claude Code permissions docs); scanner choice UNCHECKED |
| Tenant sites used for phishing | P2 | Verified sign-up; a way to suspend a tenant and unpublish its pages; an abuse contact | SOURCED (GitHub's 2013 rationale names phishing) |
| Children's data | P2 | Make the parent or guardian the account holder; store only the student's name; no health or injury notes in the MVP; a working delete path | INFERENCE; not legal advice, check COPPA and state law before launch |
| Logs leak tokens or personal data | P3 | Structured logs carrying `tenant_id` and request ID; redact headers, tokens and email bodies | INFERENCE |

**Two controls deserve emphasis because they are easy to skip.**

The Claude Code `.env` deny rule is not a wall. SOURCED: `Read` and `Edit` deny rules cover Claude's built-in file tools and recognized shell commands such as `cat`, `head`, `tail`, `sed` and `tee`, but not "a Python or Node script that opens files itself"; the docs point to the sandbox for OS-level enforcement ([permissions docs](https://code.claude.com/docs/en/permissions)). The robust control is that the secrets on your machine are worthless: Stripe test keys, a local database password, nothing live.

The webhook endpoint is the one place where an unauthenticated stranger can make the API write to the database. Treat it like a login form: signature check first, then idempotency, then tenant resolution from the verified payload, then the write.

## Product and roadmap gaps

**Superseded November 23.** Release 1 no longer includes scheduling or payments, so the roadmap below is kept for reference only. The current phases, steps and gates are in Doc.

The roadmap builds an editor, a database and a payment layer, but never the scheduling the vision promises. SOURCED from the blueprint itself: §1.B names client scheduling as core, and none of Sprints 2 to 4 mentions classes, sessions or bookings. There is also no MVP definition and no data model.

**What scheduling involves.** INFERENCE; each item is a source of edge-case bugs and needs its own tests.

- Recurring weekly classes stored as a rule plus generated occurrences, so cancelling one date does not break the series.
- Time zones: store `timestamptz`, keep each tenant's IANA zone, and generate occurrences in that zone so a 6 pm class stays at 6 pm across daylight-saving changes.
- Capacity, waitlists, cancellations and late-cancel policies.
- Class packs and memberships, which are prepaid balances rather than single charges.
- Reminder emails, which need Vercel Cron rather than an in-process scheduler.

**A testable MVP.** You, as tenant #1, build and publish your site in the Puck editor, including a live class-schedule block; a client books and pays for a drop-in class; both receive confirmation emails; you see the roster. Everything else waits.

&#91;embedded content: Re-sequenced roadmap · 6 phases, 6 exit gates\]

Tenancy moves first because adding `tenant_id` and policies after tables exist means rewriting every query. Scheduling moves ahead of payments and the editor because it is the daily value, and during a trial you can take cash. The Puck spike in Phase 1 proves the editor works with the tenancy model before Phase 4 builds on it.

Putting the Puck editor late was the call most open to dispute. Decided November 23: Puck is in the MVP, as the site builder in Phase 4. To keep that phase finite (INFERENCE): ship about six components (hero, text, image, class schedule, book button, contact); have the schedule and book-button blocks read live data from the scheduling tables rather than text the tenant types; store pages as ADR #8 describes; and validate every saved page against the component allow-list.

**Finish line for a portfolio-first project.** Phases 0 to 4, deployed, with Stripe in test mode and two seeded demo tenants, are the deliverable. Phase 5 waits until you decide to charge other teachers. If you run your real classes on it (the Phase 2 gate), the session and children's-data controls still apply, because real families' data will be in it.

## Sprint 0: rebuild the foundation

Regenerate both apps from current generators instead of repairing the existing ones. INFERENCE: `src/` holds only generator boilerplate plus about 30 lines of tracer-bullet edits, the install is broken, and the jump from Next.js 15.5.2 on Node 23 to Next.js 16.4.x on Node 26 means running codemods over code you would throw away anyway.

Run the items in this order; each is small enough for one agent task.

- [ ] `git init`, a root `.gitignore` (node\_modules, dist, .next, coverage, `.env*` except `.env.example`, `.claude/settings.local.json`), and a first commit holding only `blueprint.md` and this review.
- [ ] Install Node 26 (the current LTS line) and pin it: `.nvmrc` plus `"engines": { "node": ">=26 <27" }` in the root `package.json`.
- [ ] Delete `package-lock.json`, every `node_modules/`, and `apps/api/dist/`. Update pnpm to the current major and pin it in `packageManager`.
- [ ] Regenerate the app at the repo root with the current `create-next-app` (Next.js 16.4.5 or later) and delete `apps/api`. Keep `pnpm-workspace.yaml` for pnpm settings; with no `packages` list it covers the root package only. The tracer bullet becomes a Route Handler at `/api/health` that the home page reads.
- [ ] Put supply-chain settings in `pnpm-workspace.yaml`: `minimumReleaseAge: 1440` (explicit even where it is the default), keep strict dependency builds on with an explicit allow-list, and commit `pnpm-lock.yaml`.
- [ ] Add `.env.example` to each app and validate the environment at boot with a schema, so a missing variable crashes on start instead of on first use.
- [ ] Add root `.editorconfig`, one Prettier config, an ESLint config with a `no-restricted-imports` rule so only `src/server/` imports the database client, and a strict `tsconfig`. Keep TypeScript strict everywhere.
- [ ] Add `docker-compose.yml` with Postgres pinned to the same major version your managed host runs.
- [ ] Add CI (GitHub Actions): frozen-lockfile install, typecheck, lint, unit tests, build, and a dependency audit, on every push.
- [ ] Add a web test runner and one end-to-end test that proves the tracer bullet: the home page shows the health check's response.
- [ ] Delete `.claude/settings.local.json` from the shared tree and create a committed `.claude/settings.json` (see the agent workflow section).
- [ ] Decide the license; a portfolio repo will likely be public. A public portfolio repo raises the stakes on every secret-hygiene item above.

Skip Turborepo or Nx for now. INFERENCE: with two apps and one developer, `pnpm --filter` plus CI caching is enough; add a task runner when CI exceeds about five minutes.

## Agent workflow for Claude Code and Haiku 5.5

Haiku 5.5 should execute specified tasks, not make architecture or security decisions. SOURCED: Anthropic's launch post says Sonnet 5.5 and Opus 5.5 "remain better choices for complex agentic coding tasks," reports 39.2% for Haiku 5.5 against 70.6% for Sonnet 5.5 on Terminal-Bench 4.0, and positions Haiku 5.5 as a subagent paired with the larger models ([Anthropic](https://anthropic.com/news/claude-haiku-5-5)). INFERENCE: the dangerous failure here is not code that fails to compile, which typecheck catches. It is code that compiles, passes happy-path tests, and leaks a tenant's rows or skips a signature check. Guardrails therefore have to be deterministic checks, not instructions in a prompt.

**Model allocation**

| Work | Model | Reason |
| --- | --- | --- |
| ADRs, schema and migrations, RLS policies, auth, webhooks, payment flows | Opus 5.5 or Sonnet 5.5 | Mistakes here fail silently |
| Breaking a feature into task specs | Opus 5.5 or Sonnet 5.5, in plan mode | The spec is what makes Haiku safe |
| Implementing a written spec: CRUD endpoints, UI components, tests, refactors under green tests | Haiku 5.5 | Speed and cost, with tests as the oracle |
| Searching and summarizing the codebase | Haiku 5.5 subagent | Read-only, low risk |
| Reviewing every Haiku diff that touches the Data Access Layer, auth, billing, webhooks or `proxy.ts` | Opus 5.5 or Sonnet 5.5 reviewer subagent, read-only tools | A second model that did not write the code |

SOURCED: project subagents live in `.claude/agents/*.md` with a `model` field accepting `haiku`, `sonnet`, `opus`, `fable`, a full model ID or `inherit`, and a per-invocation model overrides the file's ([subagents docs](https://code.claude.com/docs/en/sub-agents)).

**The loop for every task**

1. **Spec** (strong model): write `docs/tasks/NNN-name.md` with the goal, the files it may touch, named acceptance tests, what is out of scope, and the ADRs it depends on.
2. **Implement** (Haiku 5.5): point it at the spec file, not a chat paragraph. Tests are written with the code.
3. **Gate** (deterministic): a Stop hook runs typecheck and tests and blocks Claude from finishing while they fail.
4. **Review** (strong-model subagent): check the diff against the security table above and the spec.
5. **Merge** (you): small commits on a branch, CI green, you read the diff and merge.

INFERENCE on task size: one behavior, five files or fewer, at least one named test. If Haiku needs more than one attempt on the same spec, the spec is usually too vague; send it back to step 1 rather than re-prompting.

**Files to commit**

`CLAUDE.md` at the root should stay short enough to be read in full on every task. A starting point:

```markdown
# Empowered Professional Platform
Multi-tenant SaaS for solo dance, yoga and pilates teachers.
One Next.js 16 app at the repo root, pnpm: src/contracts (zod), src/server/db (schema, migrations, withTenant).

## Commands
pnpm dev | pnpm test | pnpm typecheck | pnpm lint | pnpm db:migrate

## Non-negotiables
- Only the Data Access Layer (src/server/, import 'server-only') touches Postgres.
  Every query runs inside withTenant() over the Neon WebSocket Pool, never neon-http.
- Every Server Action and Route Handler re-checks the session and resource
  ownership through the Data Access Layer. Webhooks verify signatures instead.
- tenant_id comes from the session context, never from request input.
- Every new tenant table gets tenant_id, RLS enabled and forced, a policy,
  and an isolation test. The schema test fails otherwise.
- Validate all input with src/contracts schemas. Server Actions return ActionResult<T>; Route Handler errors are RFC 9457 problem+json.
- Never read or print .env files. Add a dependency only if the task spec names it.
- Do not edit applied migrations, docs/adr/ or .claude/ unless the task says so.
- If a task conflicts with an ADR, stop and ask.

## Conventions
kebab-case files, PascalCase components, camelCase functions.
Feature folders: src/features/<feature>/ (UI, actions and server code together).

## Definition of done
Typecheck, lint and tests green; new behavior has a test; the spec's acceptance
tests pass; the final message lists files changed and anything skipped.
```

`.claude/settings.json`, committed, replaces the local allow-list that is in the tree now:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)", "Read(./.env.*)", "Read(!.env.example)",
      "Edit(./.env)", "Edit(./.env.*)", "Edit(!.env.example)",
      "Bash(curl *)", "Bash(wget *)", "Bash(git push --force *)"
    ],
    "ask": ["Bash(pnpm add *)", "Bash(git push *)"],
    "allow": ["Bash(pnpm test *)", "Bash(pnpm typecheck)", "Bash(pnpm lint *)"]
  },
  "hooks": {
    "PreToolUse": [{ "matcher": "Edit|Write", "hooks": [
      { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh" }
    ]}],
    "Stop": [{ "hooks": [
      { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-gate.sh" }
    ]}]
  }
}
```

SOURCED from the Claude Code docs: rules are evaluated deny, then ask, then allow; a `!` pattern carves an exception out of the deny rules listed before it; a `PreToolUse` hook that denies blocks the tool even in bypass-permissions mode; and a Stop hook can block Claude from finishing, but Claude Code overrides it after eight consecutive blocks, so the script must exit early when `stop_hook_active` is true ([permissions](https://code.claude.com/docs/en/permissions), [hooks guide](https://code.claude.com/docs/en/hooks-guide)). UNCHECKED: the exact JSON shape above; confirm it with `/permissions` and `/hooks` after creating it.

Subagents to add in `.claude/agents/`: `security-reviewer` (model `opus`, tools `Read, Grep, Glob`), `implementer` (model `haiku`), and `explorer` (model `haiku`, read-only).

**Turn the Board's principles into checks**

The blueprint's principles are prose, and a fast model follows checks more reliably than prose. INFERENCE for every row.

| Principle | Check that enforces it |
| --- | --- |
| Never commit secrets | Secret scanning in CI plus GitHub push protection |
| Validate everything | A zod parse at the top of every Server Action and Route Handler; e2e tests that send malformed input and expect rejection |
| Standardized error shape | A shared error helper for Route Handlers; e2e tests asserting `application/problem+json` on 400, 401, 404 and 500 |
| Avoid N+1 queries | Integration tests that assert a query count for list endpoints |
| Stateless API | Lint rule against module-level mutable state; Vercel functions enforce it in practice |
| Intentional client vs server components | `server-only` imports in server modules; a bundle-size budget in CI |
| kebab-case files, feature colocation | A filename lint rule and an import-boundary lint rule |

## Where the technical summary is wrong or incomplete

The summary is reliable on repository state and weaker on everything that changed after September 2025. It missed the single most severe finding: the pinned framework versions are inside a CVSS 10.0 RCE range.

**What it gets right, and why it is solid.** Its claims about the missing `.git`, the stray npm lockfile, the missing API `node_modules`, the hardcoded CORS origin and the `/hello` versus `/` route all come from inspecting files, so they are checkable facts. Its architectural points on RLS with pooled connections, the empty `packages/` folder and auth arriving after the editor are correct and are developed further in this review.

**Wrong or outdated**

- "NestJS isn't a natural fit for serverless functions." Outdated. SOURCED: Vercel deploys NestJS with zero configuration as a single function on Fluid compute. The residual constraints are no in-process scheduler and the 250 MB function limit. Moot now that the project drops NestJS.
- "Which account type (Express or Standard)." The question is framed around types Stripe now calls legacy. SOURCED: Stripe recommends Accounts v2 or controller properties. The real decision is the charge type and who bears losses.
- "Hardcoded single-origin CORS conflicts with `*.tenant.domain`." The implied fix, wildcard CORS with credentials, would be a vulnerability. INFERENCE: tenant pages should never call the authenticated API from the browser; with NestJS dropped, no cross-origin API call is left to configure; tenant sites belong on a separate apex.
- "No Turborepo or Nx task caching" listed as a gap. Premature for two apps and one developer (INFERENCE).
- The `supertest` import is called "a known incompatibility" without a source. Moot now that the NestJS app is removed.

**Missed entirely**

- F01, the framework CVE exposure (it flagged only the non-LTS Node version).
- F05, scheduling missing from the roadmap.
- F08, tenant pages sharing a site with the app.
- The RLS bypass rules for owners and `BYPASSRLS` roles, and covert channels through unique constraints.
- Next.js 16 breaking changes: `proxy.ts` replacing `middleware.ts`, and `next lint` removed.
- Supply-chain settings and the agent's own access to secrets.
- Children as end users of a ballet-studio product.

## Running the next review iterations

Agreement between models is weak evidence. INFERENCE: models share much of their training data and therefore their blind spots, so three models agreeing on an unsourced claim is still one UNCHECKED claim. Settle disputes with a primary source or a running test, never by vote.

**Protocol**

1. Give every reviewer the same inputs: the blueprint, the technical summary, and this doc with its finding IDs.
2. Ask for three things only: confirm or dispute each F-ID with evidence; add new findings with new IDs; attack the three weakest recommendations here. A fresh "review this project" prompt makes each model re-derive the same obvious items.
3. Merge into this register. A disputed item stays Open until a source or a test resolves it.
4. Stop when a full round produces no new P0 or P1 finding, then turn the ADRs and register into task specs. The project has had no commits for 14 months, and review is cheaper than building, which makes it easy to keep reviewing instead of starting Sprint 0.

A prompt to paste for the next model:

```markdown
You are reviewing a project plan. Inputs: blueprint.md, technical-summary.md, review.md.
Label every load-bearing claim SOURCED (primary source you opened, linked),
INFERENCE (name what it rests on) or UNCHECKED.
1. For each finding F01-F26 in review.md: CONFIRM or DISPUTE, with evidence.
2. Add new findings as F27+, with severity P0-P3 and a fix.
3. Name the three weakest recommendations in review.md and argue against each.
4. Answer the open questions Q1-Q7 that you can verify; mark the rest UNCHECKED.
Check current versions and vendor docs before stating them. Do not repeat
findings you agree with in your own words; cite the ID.
```

**Open questions for the next reviewer**

These are the weakest load-bearing points in this review.

- [ ] Q1: Decided November 23: Next.js only. Proposed answer from iteration 2: no single check replaces the guards. An ESLint `no-restricted-imports` rule keeps database access inside the Data Access Layer, and the e2e test that calls every exported Server Action without a session catches a missing auth check. (ADR #1)
- [ ] Q2: Can the Data Access Layer read the Better Auth session once per request and open withTenant() from it without extra database round trips? (ADR #6)
- [ ] Q3: Drizzle or Prisma: which holds one transaction handle across a request with the least ceremony? Prove it with the pool test. (ADR #5)
- [ ] Q4 (deferred: no payouts in release 1): The exact Accounts v2 or controller-property configuration for direct charges with an application fee, and who bears negative balances. (ADR #9)
- [ ] Q5: Vercel Functions limits relevant to webhooks: maximum duration, retries, and database connection reuse under Fluid compute.
- [ ] Q6 (lower priority: release 1 takes no bookings): Whether COPPA or state privacy laws apply when a parent books classes for a child.
- [ ] Q7: Decided November 23: Puck is in the MVP. Still open: does Puck's current release render pages in Server Components, and from which import path?

## Sources

Inputs: `blueprint.md` (v1.0, September 7, 2025) and the technical summary of the repository snapshot taken November 23, 2026.

Opened during this review (SOURCED):

- [Next.js: Security Advisory CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478)
- [Next.js: November 2026 Security Release](https://nextjs.org/blog/november-2026-security-release)
- [Next.js 16 release notes](https://nextjs.org/blog/next-16)
- [Node.js: Releases](https://nodejs.org/about/releases/)
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Vercel: How to ship a NestJS app on Vercel](https://vercel.com/kb/guide/ship-a-nestjs-app-on-vercel)
- [Vercel: Configuring Custom Domains for multi-tenant platforms](https://vercel.com/docs/platforms/multi-tenant-platforms/configuring-domains)
- [Stripe: Connected account types](https://docs.stripe.com/connect/connecting-to-accounts)
- [pnpm: Mitigating supply chain attacks](https://pnpm.io/supply-chain-security)
- [GitHub blog: New GitHub Pages domain: github.io](https://github.blog/news-insights/product-news/new-github-pages-domain-github-io)
- [Better Auth: Auth.js is now part of Better Auth](https://better-auth.com/blog/authjs-joins-better-auth)
- [Puck: @puckeditor/core README](https://cdn.jsdelivr.net/npm/@puckeditor/core@0.22.0/README.md)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security) and [Better Auth: Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions)
- [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code: Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- [Anthropic: Introducing Claude Haiku 5.5](https://anthropic.com/news/claude-haiku-5-5)
- [Better Auth: Organization plugin](https://better-auth.com/docs/plugins/organization)
- [Neon: Manage roles](https://neon.com/docs/manage/roles/)
- [PostgreSQL: SET](https://www.postgresql.org/docs/19/sql-set.html)
- [pgsql-general: Tom Lane on custom settings after RESET](https://www.postgresql.org/message-id/1095764.1729350466%40sss.pgh.pa.us)

Search results used but not opened (snippet only): [CERT-EU advisory 2025-041](https://cert.europa.eu/publications/security-advisories/2025-041/), [Next.js security release program](https://nextjs.org/blog/next-security-release-program), [Better Auth organization plugin](https://better-auth.com/docs/plugins/organization).

Could not confirm: the current Puck import path for server-component rendering; Drizzle and Prisma behavior with transaction-local settings; the Route Handler raw-body pattern for Stripe webhooks; Vercel Functions limits for webhooks.
