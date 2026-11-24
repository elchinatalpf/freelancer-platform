# Iteration 2 cross-check

I checked the load-bearing factual claims in the ChatGPT, Gemini (two docs) and Grok reviews against primary sources on November 23, 2026. Most of Gemini's version and advisory claims hold up. Six claims are wrong, outdated or unsupported, one new P0 turned up that none of the four reviews caught, and Grok presents product decisions as yours that I have never seen.

## Corrections: claims that are wrong, outdated or unsupported

| # | Claim | From | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| C1 | Public storefronts live at `src/app/_sites/[tenantSlug]/` and `proxy.ts` rewrites to them | Gemini (both docs) | **Wrong.** An underscore prefix makes a private folder, opting it and all its subfolders out of routing, so the rewrite would hit a 404. Use `sites/` (or `%5Fsites` if the underscore matters). | [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| C2 | A non-superuser `pg_dump` under FORCE RLS silently dumps 0 rows | Gemini consolidated (F22) | **Wrong mechanism, right conclusion.** `pg_dump` turns `row_security` off by default, which makes a query that a policy would filter fail with an error. Still: run backups as a `BYPASSRLS` role. | [PostgreSQL row\_security](https://www.postgresql.org/docs/17/runtime-config-client.html), [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) |
| C3 | Delete `pnpm-workspace.yaml` when flattening the repo | Gemini | **Wrong for current pnpm.** Settings such as `minimumReleaseAge` live in `pnpm-workspace.yaml` (only auth, registry, TLS and proxy settings are read from `.npmrc`), and omitting `packages` includes just the root package. Keep the file for settings; pin pnpm so an older version does not reject it. | [pnpm settings](https://pnpm.io/settings) |
| C4 | Stripe Connect Express with destination charges | Gemini | **Outdated and shifts risk to you.** For destination charges Stripe recommends setting `losses_collector` and `fees_collector` to `application`, so the platform carries negative balances. Gemini's own consolidated doc reverses this. | [Stripe account configuration](https://docs.stripe.com/connect/accounts-v2/connected-account-configuration) |
| C5 | Path-based `/sites/[slug]` on the app's own origin is cookie-safe enough for a demo | Grok; Gemini as its $0 mode | **Weakest option.** Same origin means no isolation at all: tenant script would run with the dashboard's origin, and Server Actions' Origin-versus-Host check would pass (INFERENCE). A $0 alternative exists: `vercel.app` is on the Public Suffix List, so a second `*.vercel.app` hostname is a separate site. | [Vercel on the PSL](https://vercel.com/kb/guide/can-i-set-a-cookie-from-my-vercel-project-subdomain-to-vercel-app), [Next.js data security](https://nextjs.org/docs/app/guides/data-security) |
| C6 | `@puckeditor/core/rsc` is the RSC import path, labeled SOURCED | Gemini consolidated | **Unconfirmed.** Puck's RSC page names `<Render>` and `resolveAllData` as the server-safe APIs but does not show their import path. Check the package's exports at install time. | [Puck RSC docs](https://puckeditor.com/docs/integrating-puck/server-components) |
| C7 | Publish calls `revalidateTag(tag)` | Gemini | **Deprecated in Next.js 16.** The single-argument form needs a `cacheLife` profile now; for read-your-writes from a Server Action, Next.js 16 adds `updateTag`. | [Next.js 16 release notes](https://nextjs.org/blog/next-16) |
| C8 | Docker and CI on Postgres 17 | Grok, Gemini | **Outdated, not wrong.** Postgres 17 is supported, but Neon made 18 the default for new projects in June 2026 (snippet only) and PostgreSQL 19 shipped November 19, 2026. Pin Docker to the major version your Neon project runs. | [PostgreSQL docs banner](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) |
| C9 | Keep and recover the existing Next.js 15.5.2 scaffold | ChatGPT | **Contradicted by F01.** 15.5.2 sits inside the React2Shell range, and 15.x security releases end January 31, 2027. Its other rule stands: never mix recovery, upgrades and features in one change. | [Next.js support policy](https://nextjs.org/support-policy) |

## New finding none of the reviews caught

**F26 (P0): the default Neon role bypasses RLS.** Neon gives the project's default role, and every role created in the Console, API or CLI, membership in `neon_superuser`, which carries `BYPASSRLS`. Roles created with SQL do not get it ([Neon roles](https://neon.com/docs/manage/roles/)). If `DATABASE_URL` uses the default role, every policy, `FORCE` included, is skipped without any error. Create `app_runtime` with SQL, and keep the role test from the RLS section in CI: it is the check that catches this.

## Confirmed

| Claim | From | Evidence |
| --- | --- | --- |
| The November 3 release fixed GHSA-mfr8-8qww-v76h (cross-tenant cache), GHSA-vc7v-qv4w-wrv8, GHSA-f3mh-rxg3-f5g2 (Edge routes only, not Node Route Handlers) and GHSA-7qx7-33qx-rqx2 | Gemini | [Next.js November release](https://nextjs.org/blog/november-2026-security-release) |
| CVE-2026-64642 is a proxy/middleware auth bypass in 16.0.0 to 16.2.10 (single i18n locale, Turbopack), fixed in 16.2.11 | Gemini | [CVE record](https://cveawg.mitre.org/api/cve/CVE-2026-64642) |
| Next.js 15 gets security releases through January 31, 2027 | Gemini | [Next.js support policy](https://nextjs.org/support-policy) |
| Node 26.13.1 "Lithium" is LTS and v23 is end-of-life; Temporal is on by default in Node 26 (snippet only) | Gemini | [Node.js releases](https://nodejs.org/about/releases/) |
| Puck 0.24 shipped October 29, 2026 (field groups, tabs, checkboxes); rich text arrived in 0.21 (snippet only) | Gemini | [Puck blog](https://puckeditor.com/blog) |
| A split server config must keep render-time fields, or rich text is escaped as plain strings | Gemini consolidated | [Puck RSC docs](https://puckeditor.com/docs/integrating-puck/server-components) |
| Neon's HTTP driver handles single queries and non-interactive batches; interactive transactions need `Pool` or `Client` over WebSockets (snippet only) | Gemini | [Neon serverless driver](https://neon.com/docs/serverless) |
| Accounts v2 `fees_collector` and `losses_collector` set to `stripe` make Stripe liable for the connected account's negative balances; `losses_collector: application` forces `fees_collector: application` | Gemini consolidated | [Stripe account configuration](https://docs.stripe.com/connect/accounts-v2/connected-account-configuration) |
| After a transaction-local custom setting ends, `current_setting` returns `''`, not NULL, so `nullif(..., '')` is required. This resolves my UNCHECKED label. | Gemini consolidated | [Tom Lane on pgsql-general](https://www.postgresql.org/message-id/1095764.1729350466%40sss.pgh.pa.us) |
| `TRUNCATE` is not subject to row security, so never grant it to the runtime role | Gemini consolidated | [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) |
| Views check the owner's permissions and policies unless `security_invoker` is true (snippet only) | Gemini consolidated | [CREATE VIEW](https://www.postgresql.org/docs/18/sql-createview.html) |
| Better Auth's organization plugin covers organizations, members, roles, invitations, an active organization on the session, and access control. This upgrades my "snippet only" label. | All | [Better Auth organization plugin](https://better-auth.com/docs/plugins/organization) |

## Where I am changing my review

| Topic | My iteration 1 | Better idea, and from whom |
| --- | --- | --- |
| Repo layout | `apps/web` plus `packages/*` | Flatten to one root Next.js app (Gemini), keeping `pnpm-workspace.yaml` for settings (C3) |
| Enforcing the Data Access Layer | An e2e test per Server Action | Add ESLint `no-restricted-imports` so only `src/server/db` imports the client (Gemini, Grok). This answers my open question Q1. |
| Server Action errors | Unspecified | A typed `ActionResult<T>` union for actions; RFC 9457 only for Route Handlers (Gemini) |
| Page storage | `draft` and `published` JSON columns | Immutable `page_revisions`, atomic publish, rollback, optimistic concurrency (ChatGPT) |
| Haiku onboarding | Spec files only | A frontier-built "golden slice" that Haiku mirrors (Gemini) |
| Database driver | Not addressed | Use WebSocket `Pool` or TCP `pg`, never `neon-http`, for `withTenant()` (Gemini) |
| Uploads | Not addressed | Presigned uploads, magic-byte checks, no SVG, R2-only `remotePatterns` (ChatGPT, Gemini) |

I am holding three positions: rebuild rather than recover (C9); Accounts v2 with direct charges rather than Express with destination charges (C4); and real site isolation for tenant pages rather than same-origin paths (C5).

## Not verified

Cloudflare R2 free-tier and egress terms; Node 26's end-of-life date; Next.js 16.4 agent tooling (`AGENTS.md`, browser log forwarding); whether one Vercel project can hold two custom `vercel.app` hostnames (Vercel's guide says any `vercel.app` domain can be used, snippet only).

## Needs your decision

Grok lists "owner decisions" that never came up in our conversation: any freelancer as the audience, a portfolio-only MVP with no scheduling or payments, a free tier with a $10 to $40 per year paid tier, and no custom domain. Gemini flags the same split as Fork A. Sprints 0 to 2 are identical under both readings; only Sprint 3 changes.
