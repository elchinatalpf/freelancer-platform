# ADR 2 · Hosting

Status: Accepted · November 23, 2026. Step 3.1 confirms the two-hostname setup.

## Context
With NestJS dropped (ADR 1), one Next.js app serves the dashboard, the editor,
Route Handlers and the public tenant sites. Release 1 has no custom domains and
starts on Vercel's Hobby plan, which allows personal or non-commercial use only.

## Decision
One Vercel project for the app. Tenant sites are served from a second
`vercel.app` hostname (ADR 3). Scheduled work runs as Vercel Cron calling a Route
Handler protected with a `CRON_SECRET` bearer token.

If step 3.1 finds that one Vercel project cannot hold both hostnames, deploy the
same repo as two projects, and record that here.

## Main alternative
A long-running container host.

## Revisit if
You need WebSockets or long background jobs. Move to Vercel Pro ($20 per developer
seat per month) before the first real charge, because Hobby is non-commercial.

## Consequences
No in-process scheduler. Cron triggers send an HTTP GET to the route and run only
on production deployments.

## Sources
- `docs/review iteration 1.md`, ADR table row 2 and its reasoning
- `docs/Playbook.md`, "Hosting layout" and "Your decisions"
- [Vercel: Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel: How to ship a NestJS app on Vercel](https://vercel.com/kb/guide/ship-a-nestjs-app-on-vercel) (cron behavior)
