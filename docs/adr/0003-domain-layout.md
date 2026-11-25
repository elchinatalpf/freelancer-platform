# ADR 3 · Domain layout

Status: Accepted · November 23, 2026. Step 3.1 records the exact setup.

## Context
Tenants publish content, and all tenants share the sites origin. If tenant pages
lived on the app's own site, a tenant page could set cookies the browser then
sends to the dashboard (session and CSRF-token fixation). Vercel's multi-tenant
docs describe this risk and recommend putting the dashboard and auth on a
different site. GitHub moved Pages from `github.com` to `github.io` in 2013 for
the same reason.

`vercel.app` is on the Public Suffix List, so two `vercel.app` hostnames are two
separate sites to the browser.

## Decision
| Hostname | Serves |
| --- | --- |
| `<app>.vercel.app` | Dashboard, editor, sign-in, Route Handlers; holds the session cookie |
| `<sites>.vercel.app` | Public tenant pages at `/<slug>` |

- The session cookie uses the `__Host-` prefix, with no `Domain` attribute.
- `proxy.ts` routes by hostname: the sites host serves only tenant pages, and the
  app host never does (step 3.2).
- No custom HTML, script or embed blocks, because one tenant's script could act
  on another tenant's page on the shared sites origin.
- No custom domains in release 1.

## Main alternative
Everything under one apex, such as tenant pages at `/sites/<slug>` on the app
host. Rejected: same origin means no isolation at all.

## Revisit if
Never, while tenants can publish content.

## Sources
- `docs/review iteration 1.md`, ADR table row 3 and its reasoning; F08, F12
- `docs/Iteration 2 cross-check.md`, C5
- [Vercel: Configuring domains for multi-tenant platforms](https://vercel.com/docs/platforms/multi-tenant-platforms/configuring-domains)
- [GitHub blog: New GitHub Pages domain: github.io](https://github.blog/news-insights/product-news/new-github-pages-domain-github-io)
