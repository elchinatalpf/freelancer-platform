# Empowered Professional Platform — Build Playbook

Nov 23, 2026 · @Javier Morales

Work top to bottom. One step is one GitHub issue and one pull request; move its Status as it goes, and the tracker shows where the build stands.

## How to use this playbook

You steer, Claude Code builds, and GitHub keeps the record. Every step below becomes one GitHub issue, one branch and one pull request (PR), and nothing merges until the automated checks pass.

1. **Pick.** Take the first step in the current phase whose Status is Not started, and set it to In progress.
2. **Spec.** Paste the Spec prompt from the Agent kit tab. Opus writes `docs/specs/<step id>.md` and opens the issue. Read the spec (about a page, plain language) and approve it or ask for changes.
3. **Build.** Start a fresh Claude Code session (`/clear`), pick the model in the step's Model column, and paste the Build prompt. Claude Code works on a branch, runs the checks and opens the PR.
4. **Review.** The reviewer agent posts its report on the PR and CI must be green. Set Status to In review.
5. **Check and merge.** Read the PR summary and its "how this works" note, click the preview link, then merge. Set Status to Done and paste the PR link in Evidence.
6. **Close the phase.** After the last step, run the phase gate (section Quality gates), tick its checklist, and mark the phase Done in the tracker.

**Status values.** Not started · In progress · In review · Blocked (write the reason in Notes) · Done.

**Model column.** Opus writes specs, reviews every PR and runs the red team. Sonnet builds every step, including the security-critical ones. Haiku takes steps that copy a pattern already in the repo, because Anthropic positions Sonnet and Opus as the stronger agentic coders (see the review doc).

**Three rules.** One step per PR. A step that conflicts with an ADR (a recorded architecture decision) stops and comes back to chat. When the agent says "done", the checks decide, not the agent.

**ADR changes.** Steps 1.1, 3.1, 4.1, 5.1 and 5.6 change an ADR. Put that change in its own PR on a `kit/` branch first; the hook blocks ADR edits on any other branch.

## Where we are

**Now:** Phase 0, steps 0.1 to 0.5 are done. 0.6 (CI) is in progress on the `kit/0.6-ci` branch, a `kit/` branch because 0.6 changes `.github/` and the protect-paths hook. You approved its spec, `docs/specs/0.6.md` ([issue #9](https://github.com/elchinatalpf/freelancer-platform/issues/9)), on Nov 26; the build is next. A repository ruleset already makes changes to `main` go through a pull request; 0.6 adds the required CI check to it. Last updated Nov 26, 2026.

Move this line forward every time a step changes status. Phase status comes from its step table: a phase is Done only after its gate checklist is ticked.

| Phase | Goal | Gate, in one line | Status | Started | Finished |
| --- | --- | --- | --- | --- | --- |
| 0 · Foundation | A clean repo that deploys a health check, with CI and agent guardrails | CI green on `main`; the hooks block a protected-test edit | In progress | Nov 24, 2026 |  |
| 1 · Tenancy and sign-in | Users sign up, create a workspace, and only ever see their own data | Isolation suite green; runtime-role test passes; red team finds no cross-tenant path | Not started |  |  |
| 2 · Page editor | A signed-in user builds a page, saves drafts, publishes and rolls back | Concurrent-save, rich-text and publish e2e tests green | Not started |  |  |
| 3 · Public sites | Published pages are live on the sites hostname | Host-routing tests green; app cookies never reach the sites host | Not started |  |  |
| 4 · Media uploads | Tenants upload images safely | SVG, spoofed and oversized files rejected by tests | Not started |  |  |
| 5 · Plans and billing | Free and paid limits enforced; checkout works in Stripe test mode | Webhook signature, idempotency and limit tests green | Not started |  |  |
| 6 · Portfolio launch | A demo anyone can try, a README case study, tested backups | Final red team clean; restore drill done | Not started |  |  |

The detail of each step lives in its GitHub issue. The `/status` command (Agent kit) reads git and GitHub and tells you which step is next, so this page and the repo stay in step.

## Scope and rules

Release 1 is a site builder for any freelancer, built first as your portfolio project. It has no scheduling, no payouts to tenants, no custom domains, and takes no real money until the hosting plan changes. Findings (F01–F26) and architecture decisions (ADR #1–10) stay in the review doc: Doc.

**Your decisions**

- **Audience:** any freelancer or solo professional. The page blocks are generic; templates per profession come later.
- **Release 1:** the portfolio site builder only. No scheduling, booking or Stripe Connect.
- **Pricing:** a free tier and a paid tier at $10–40 a year, built in Stripe test mode. Vercel's Hobby plan allows only personal or non-commercial use, so move to Pro ($20 per developer seat per month) before the first real charge.
- **Domains:** no custom domains in release 1.
- **Earlier:** Next.js only (NestJS dropped), portfolio first, Puck in the first release.

**Hosting layout**

| Hostname | Serves | Why |
| --- | --- | --- |
| `<app>.vercel.app` | Dashboard, editor, sign-in, Route Handlers | Holds the session cookie, set as a `__Host-` cookie |
| `<sites>.vercel.app` | Public tenant pages at `/<slug>` | `vercel.app` is on the Public Suffix List, so this is a separate site and app cookies never reach it |

One Next.js app serves both, and `proxy.ts` routes by hostname. Step 3.1 confirms that one Vercel project can hold both hostnames; if it cannot, deploy the same repo as two projects.

**Rules that follow**

- No custom HTML, script or embed blocks. All tenants share the sites origin, so one tenant's script could act on another's page (INFERENCE).
- One owner per workspace. Invitations and multi-member workspaces wait for a later release.
- Reserved slugs (`admin`, `api`, `app`, `login`, `www` and similar) cannot be claimed.
- Out of scope for release 1: scheduling, payouts, custom domains, analytics dashboards, multiple languages, and any email sending, which needs a purchased domain.

## Before Claude Code

These are steps 0.1 and 0.2, and you do them yourself: about an hour, all free tiers. Tick each box as you go.

**Tools on your computer (step 0.1)**

- [x] Node.js 26 LTS (26.13.1 was current on November 23). Use the installer from nodejs.org.
- [x] pnpm, installed with its own installer from pnpm.io. Step 0.3 pins the version in `package.json`.
- [x] Git, and the GitHub CLI (`gh`). Run `gh auth login` once; Claude Code uses `gh` to open issues and pull requests.
- [x] Docker Desktop. The isolation tests run against a local Postgres in a container.
- [x] VS Code with the Claude Code extension, signed in. `/security-review` is included on Pro and Max plans.
- [x] One empty folder for the project. Claude Code works only inside it.

**Accounts (step 0.2)**

- [x] GitHub: create an empty private repository.
- [x] Vercel, on Hobby, connected to your GitHub account.
- [x] Neon: one project on Postgres 18. Keep its default connection string for migrations only; the app gets its own role in step 1.2 (F26).
- [x] Stripe, in test mode only. Never paste live keys anywhere.
- [x] Storage for uploads: none yet. Phase 4 picks it.

## Phase 0 · Foundation

A new repo that deploys a health check, with CI and the agent guardrails in place before any feature. Rebuild in an empty folder rather than recovering the old scaffold (F01); copy only `blueprint.md` into `docs/`.

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Install the tools (Before Claude Code) | You | Every box in that list is ticked | Done | Checked Nov 25: Node 26.13.1 (via fnm), pnpm 12.23.0, Git, `gh` signed in, Docker 29.9.3 |
| 0.2 | Create the accounts (Before Claude Code) | You | Every box in that list is ticked | Done | GitHub repo checked (public since Nov 25). Confirmed by the owner Nov 25: Vercel on Hobby with GitHub, a Neon project on Postgres 18, Stripe in test mode. Storage waits for Phase 4 |
| 0.3 | Scaffold one Next.js 16.4.5+ app at the repo root: strict TypeScript, `pnpm-workspace.yaml` with the supply-chain settings, Node and pnpm pinned, `.env.example`, environment validated at boot | Sonnet | `pnpm build` passes and `/api/health` returns 200 locally | Done | [PR #1](https://github.com/elchinatalpf/freelancer-platform/pull/1) |
| 0.4 | On a kit/ branch, add the agent kit from the Agent kit tab: `CLAUDE.md`, `.claude/` settings, hooks, agents and skills, `docs/adr/` with ADR #1–10, the spec and PR templates | Sonnet | `/status` runs, and an edit to `tests/security/` is blocked | Done | [PR #2](https://github.com/elchinatalpf/freelancer-platform/pull/2); follow-ups [#3](https://github.com/elchinatalpf/freelancer-platform/pull/3) and [#6](https://github.com/elchinatalpf/freelancer-platform/pull/6) |
| 0.5 | Quality tooling: Vitest, Playwright, ESLint rules (database client only under `src/server/`), Prettier, knip, Stryker for the mutation tests run at gates, one `pnpm check` script | Sonnet | `pnpm check` runs typecheck, lint and tests in one command | Done | [PR #7](https://github.com/elchinatalpf/freelancer-platform/pull/7), merged Nov 25; spec [PR #5](https://github.com/elchinatalpf/freelancer-platform/pull/5), [issue #4](https://github.com/elchinatalpf/freelancer-platform/issues/4) |
| 0.6 | CI on GitHub Actions: frozen install, `pnpm check`, Playwright smoke test, dependency audit, secret scan, a Postgres service container; branch protection on `main` | Sonnet | A PR shows green checks and `main` refuses direct pushes | In progress | Spec approved Nov 26, [issue #9](https://github.com/elchinatalpf/freelancer-platform/issues/9) |
| 0.7 | Connect Vercel: preview deployment per PR, environment variables per environment | You + Sonnet | The PR shows a preview link and `/api/health` answers on `<app>.vercel.app` | Not started |  |

**Phase 0 gate**

- [ ] CI green on `main`, with branch protection on
- [ ] Asked to edit a file in `tests/security/`, Claude Code is blocked
- [ ] Claude Code cannot finish a step while `pnpm check` fails
- [ ] Secret scan clean; every `.env` file except `.env.example` is ignored by git
- [ ] You can say in two minutes what each file in `.claude/` does

## Phase 1 · Tenancy and sign-in

Users sign up, get a workspace, and can only ever reach their own data. This phase carries most of the security weight, so Opus writes every spec and reviews every PR, Sonnet builds, and the tests run against a real Postgres, never mocks.

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Spike: Drizzle on Neon's WebSocket `Pool`, with `withTenant()` calling `set_config(..., true)` inside a transaction (F21, ADR #5) | Sonnet | A test shows the tenant setting inside the transaction and gone after it; ADR #5 records Drizzle or Prisma | Not started |  |
| 1.2 | Database roles: an owner role for migrations, `app_runtime` created with SQL, a separate `BYPASSRLS` maintenance role for backups and backfills; local Postgres 18 in Docker | Sonnet | The role test passes: runtime role is not superuser, has no `BYPASSRLS`, owns nothing, cannot `TRUNCATE` (F26, F22) | Not started |  |
| 1.3 | Tenancy schema: `tenant_id` on every tenant table, RLS enabled and forced, the `nullif` policy, `security_invoker` on views | Sonnet | Schema test and isolation suite green: cross-tenant read, insert and update fail; no context and empty context return zero rows; pooled connections never leak context | Not started |  |
| 1.4 | Better Auth: GitHub and Google sign-in with no passwords (step 1.8 adds the providers), the organization plugin with one workspace per user at sign-up, active workspace on the session, `__Host-` cookie. Auth tables sit outside RLS and only Better Auth touches them | Sonnet | e2e: sign up, sign in, sign out; the session carries the active workspace | Not started |  |
| 1.5 | Data Access Layer under `src/server/` (`server-only`): `requireWorkspace()`, `withTenant()`, tenant id taken only from the session | Sonnet | An e2e test calls every exported Server Action without a session and each is rejected; lint fails on a database import outside `src/server/` | Not started |  |
| 1.6 | Golden slice: workspace profile (name, slug, bio) end to end: schema, Data Access Layer, Server Action with zod and `ActionResult<T>`, form, unit, integration and e2e tests | Sonnet | The reviewer passes it as the pattern later steps copy, and its "how this works" note exists | Not started |  |
| 1.7 | Slug rules: one platform-wide namespace, format check, reserved list | Haiku | Tests cover reserved, duplicate and badly formed slugs | Not started |  |
| 1.8 | Sign-in without email: GitHub and Google through Better Auth, callbacks on the app hostname, a test provider for previews and CI. No email in release 1, because providers send only from a domain you own, which waits until you buy one | Sonnet | e2e signs in through the test provider; both real providers work on the app hostname | Not started |  |

**Phase 1 gate**

- [ ] Isolation suite and role test green in CI against Postgres
- [ ] Red team finds no cross-tenant read or write; each finding is now a passing test in `tests/security/`
- [ ] Mutation score on the tenancy and auth code at 70% or more (a starting floor; raise it later)
- [ ] `/security-review` run on the phase's changes; findings fixed or recorded
- [ ] You have read the five core pieces: the RLS migration, `withTenant()`, `requireWorkspace()`, the profile Server Action, the isolation test

## Phase 2 · Page editor

A signed-in user builds pages with Puck, saves drafts, publishes, and rolls back. One site per workspace, several pages per site (home, about, work, contact).

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Page data model: `pages` with a `version` column and `published_revision_id`; immutable `page_revisions` (the runtime role cannot update or delete them) | Sonnet | Tests: a stale save gets a conflict; revisions cannot be changed; publish is one transaction | Not started |  |
| 2.2 | Puck editor shell with `@puckeditor/core` 0.24 or later, plus two blocks (Hero, Text with rich text); each block has a zod schema | Sonnet | The editor loads a draft and the two blocks render in its preview | Not started |  |
| 2.3 | The rest of the generic block library: Image (placeholder until Phase 4), Gallery, Services list, Testimonials, Contact (email link), Social links, Spacer | Haiku | Each block has a schema, a render test, and follows the 2.2 pattern | Not started |  |
| 2.4 | Save draft: a Server Action validates every block against its schema, caps the page size, and returns a typed conflict error on a stale version | Sonnet | Invalid data, oversize pages and stale saves are rejected by tests; the editor offers a reload on conflict | Not started |  |
| 2.5 | Publish and rollback: publish copies the draft into a new revision and moves the pointer, then calls `updateTag`; rollback moves the pointer back | Sonnet | e2e: publish shows the new page; rollback restores the old one | Not started |  |
| 2.6 | Rich-text safety: render on the server with the render-time fields kept in the server config (F23), no raw HTML anywhere | Sonnet | A test publishes rich text containing a script: formatting survives, the script does not | Not started |  |
| 2.7 | Page management: create, rename, reorder and delete pages | Haiku | Tests cover each action and the reserved page paths | Not started |  |

**Phase 2 gate**

- [ ] Conflict, revision and publish tests green
- [ ] Rich-text test green (F23)
- [ ] Red team finds no way to read or change another workspace's pages by guessing IDs, and no script that runs from block content
- [ ] Mutation floor met on the save and publish code
- [ ] You have read the revisions migration, the save action, the publish transaction, and one block from schema to render

## Phase 3 · Public sites

Published pages go live at `<sites>.vercel.app/<slug>`, isolated from the dashboard and from each other's caches.

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Spike: add the sites hostname (one Vercel project or two), confirm the session cookie never reaches it | You + Sonnet | ADR #3 records the setup; a test against the sites host sees no app cookie | Not started |  |
| 3.2 | Host routing in `proxy.ts`: the sites host serves only `/<slug>` and `/<slug>/<page>`; the app host never serves tenant pages | Sonnet | Routing tests pass in both directions | Not started |  |
| 3.3 | Public read path: look up the workspace by slug, read only the published revision, render with Puck's server `<Render>` | Sonnet | Drafts are never visible; an unpublished site returns 404 | Not started |  |
| 3.4 | Caching with tags that include the tenant id, invalidated by `updateTag` on publish; Next.js stays at 16.4.5 or later for the cross-tenant cache fix | Sonnet | Publishing in workspace A never changes what workspace B serves | Not started |  |
| 3.5 | Page metadata, a default share image, a sitemap and robots file per site | Haiku | Metadata tests pass for every page type | Not started |  |
| 3.6 | Security headers on the sites host: Content-Security-Policy (report-only first), frame-ancestors, Referrer-Policy | Sonnet | A header test passes; CSP moves from report-only to enforced with no reports | Not started |  |
| 3.7 | Not-found and unpublished pages | Haiku | e2e covers unknown slug, unknown page, unpublished site | Not started |  |

**Phase 3 gate**

- [ ] Routing, cookie, draft-leak and cache-isolation tests green
- [ ] Red team finds no draft leak, no cross-tenant cache hit, no script that runs on a public page
- [ ] Lighthouse performance and accessibility at 90 or more on the demo site
- [ ] You have read `proxy.ts`, the public read function and the cache tags

## Phase 4 · Media uploads

Tenants upload images for their pages, and nothing they upload can run as code or reach another workspace (F24). Hobby includes 5,000 image transformations a month, so images are sized at upload rather than on every view.

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Spike: pick storage, Vercel Blob (no extra account) or Cloudflare R2, and record it as ADR #11 with the cost at 100 workspaces of 50 MB each | Sonnet | ADR #11 merged | Not started |  |
| 4.2 | Upload flow: short-lived signed upload straight to storage, keys under the workspace's own prefix, an asset row under RLS | Sonnet | e2e upload works; the server sets the key prefix, never the client | Not started |  |
| 4.3 | Validation: JPEG, PNG and WebP only, type checked from the file's bytes, no SVG, size and dimension caps, location data stripped from photos | Sonnet | Tests reject SVG, a renamed file, an oversize file, and confirm the location data is gone | Not started |  |
| 4.4 | Delivery: `next/image` with `remotePatterns` limited to the storage host; resized variants made at upload | Sonnet | A test shows an image URL outside the bucket is refused | Not started |  |
| 4.5 | Connect the Image and Gallery blocks to a media library; deleting an asset removes it from storage and from pages | Haiku | e2e covers pick, replace and delete | Not started |  |
| 4.6 | Storage quota per workspace (file count and total size), enforced in the Data Access Layer | Haiku | Tests reject an upload over quota; Phase 5 sets the numbers per plan | Not started |  |

**Phase 4 gate**

- [ ] Validation and quota tests green
- [ ] Red team cannot write into another workspace's prefix, fetch an arbitrary URL through the image path, or store a file that runs
- [ ] You have read the upload action and the validation function

## Phase 5 · Plans and billing in test mode

Free and paid limits are enforced, and the paid tier can be bought with Stripe test cards. You are the merchant here, so this is a plain subscription (Stripe Billing), not the Connect setup the old blueprint needed.

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 5.1 | Plans and entitlements: free and paid limits (pages, storage, the "made with" badge) read through the Data Access Layer; rewrite ADR #9 for Stripe Billing | Sonnet | Entitlement tests pass for both plans; ADR #9 updated | Not started |  |
| 5.2 | Stripe Checkout for the yearly price, and the Customer Portal for card changes and cancelling, both in test mode | Sonnet | e2e buys and cancels with a test card | Not started |  |
| 5.3 | Webhook Route Handler: raw body, signature check, event ids stored so a replay changes nothing, subscription state updated in one transaction | Sonnet | Tests: a bad signature gets 400, a replayed event has no second effect, events arriving out of order end in the right state | Not started |  |
| 5.4 | Downgrade: content over the free limit stays but cannot be published; the badge returns | Sonnet | Tests cover paid to free and back | Not started |  |
| 5.5 | Pricing page and the plan screen in the dashboard | Haiku | e2e reaches Checkout from both | Not started |  |
| 5.6 | ADR #12: how sales tax or VAT will be handled before any real charge (Stripe Tax or a merchant of record) | You + Opus | ADR #12 merged; no code | Not started |  |

**Phase 5 gate**

- [ ] Signature, replay, ordering and entitlement tests green
- [ ] Red team cannot forge a webhook, replay one for a second effect, or unlock paid limits without paying
- [ ] Only test keys exist, in the repo history and in Vercel

**Before the first real charge** (not part of this phase): Vercel Pro, live Stripe keys, the ADR #12 decision in place, terms and privacy policy published.

## Phase 6 · Portfolio launch

Anyone can try the product in one click, the data can be restored, and the README tells the story an interviewer will ask about.

| ID | Step | Model | Done when | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 6.1 | One-click demo: "Try it" creates a sample workspace that expires after 24 hours and is cleaned up by a scheduled job | Sonnet | e2e creates a demo; expired demos disappear | Not started |  |
| 6.2 | Backups and a restore drill: restore to a Neon branch, then run the isolation suite against it | Sonnet | `docs/runbooks/restore.md` written and the drill logged | Not started |  |
| 6.3 | Error tracking and structured logs that carry no personal data | Sonnet | A forced error shows up in the tracker without an email or name in it | Not started |  |
| 6.4 | Account deletion and data export | Sonnet | e2e: export downloads the workspace's data; deletion removes it and its files | Not started |  |
| 6.5 | Terms and privacy policy pages | You | Pages live and linked from sign-up | Not started |  |
| 6.6 | Final security pass: whole-app red team, `/security-review`, dependency audit | Opus | Gate report shows no open P0 or P1 | Not started |  |
| 6.7 | README case study: architecture diagram, the ADRs, the security model, what you would do next. Claude drafts it; you rewrite it in your own words | You + Sonnet | You can read it aloud without stumbling | Not started |  |

**Phase 6 gate**

- [ ] Final red team clean and the restore drill done
- [ ] The demo works from a phone on a fresh browser
- [ ] You can walk someone through tenant isolation, without notes, in five minutes

## Quality gates

Four layers check the agent's work. The first two run on every PR; the other two run once per phase, at the gate.

| Layer | What it catches | When | Run by |
| --- | --- | --- | --- |
| Automatic checks: typecheck, lint with import rules, tests against Postgres, Playwright, knip, dependency audit, secret scan | Anything a machine can check; the agent cannot argue past it | Before the agent may finish a step (Stop hook) and on every PR (CI) | Hooks and CI |
| Reviewer agent: fresh context, read-only, on Opus | Drift from the spec or the ADRs, missing tests, unclear code, broken project rules | Every PR | You, with the Review prompt |
| Red-team agent (can write only in `tests/security/`) plus `/security-review` | Cross-tenant access, sign-in bypass, injection, upload and webhook abuse | Each phase gate | You, with the Red team prompt |
| Mutation testing (Stryker) on `src/server/` | Tests that pass without testing anything | Each phase gate | A manual CI job |

**Running a gate**

1. Confirm every step in the phase is Done and `main` is green.
2. Run `/security-review` on the phase's changes.
3. Run the red-team agent. Each finding comes back as a failing test on its own branch; fix each in a normal PR until all pass.
4. Run mutation testing and note the score.
5. Opus writes `docs/gates/phase-<n>.md` from the gate template: checks run, findings, fixes, scores, open risks.
6. Read the report and the phase's core pieces, tick the gate checklist, tag the commit `phase-<n>-done`, and set the phase to Done in the tracker.

**Why these rules.** A finding that must arrive as a failing test filters out false alarms and stays as a regression test. The builder cannot edit `tests/security/`, so it cannot weaken a security test to get green (INFERENCE). The reviewer runs on a different model, in a fresh context, from the one that built the code, so the work is not grading itself. For the Phase 1 and Phase 6 gates, a red-team pass from another vendor's model adds different blind spots (INFERENCE).

**What you read on each PR.** The summary, the "how this works" note, the CI result, the reviewer's verdict, and the preview. Read the diff itself whenever it touches a migration, `src/server/`, `proxy.ts`, the webhook handler, `tests/security/`, `.claude/` or `.github/`. Those are the paths where a quiet mistake costs the most.

## Sources

Checked November 23, 2026. "Snippet only" means the search result was read but the page was not opened.

- [Claude Code: hooks guide](https://code.claude.com/docs/en/hooks-guide): the protect-files pattern, exit code 2, `$CLAUDE_PROJECT_DIR`, the Stop-hook block cap and `stop_hook_active`
- [Claude Code: subagents](https://code.claude.com/docs/en/sub-agents) (snippet only): file location and the `name`, `description`, `tools`, `model` fields
- [Claude Code: skills](https://code.claude.com/docs/en/skills) (snippet only): custom commands merged into skills
- [Claude Code: permissions](https://code.claude.com/docs/en/permissions) (snippet only): rule syntax such as `Bash(rm *)` and `Read(./.env)`
- [Automated security reviews in Claude Code](https://support.claude.com/en/articles/11932705-automated-security-reviews-in-claude-code) (snippet only): `/security-review` and the GitHub Action
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby): Pro seats at $20 per user per month, 5,000 image transformations a month on Hobby
- [Vercel Terms of Service](https://vercel.com/legal/terms) (snippet only): Hobby for personal or non-commercial use only
- [Neon: Manage roles](https://neon.com/docs/manage/roles/): the default role inherits `BYPASSRLS`
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Better Auth: Organization plugin](https://better-auth.com/docs/plugins/organization)
- [Puck: Server components](https://puckeditor.com/docs/integrating-puck/server-components)
- [Next.js: November 2026 security release](https://nextjs.org/blog/november-2026-security-release)
- [Node.js releases](https://nodejs.org/about/releases/)

Everything else (findings, ADRs and their sources) is in the review doc.

**Not verified here, so the step that needs it checks it first:** whether one Vercel project can hold two `vercel.app` hostnames (3.1); Vercel Blob and Cloudflare R2 limits and prices (4.1); the Stryker setup for this stack (0.5); whether Google limits sign-ins to an unverified app (1.8).
