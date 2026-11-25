# ADR 8 · Puck page storage

Status: Accepted · November 23, 2026

## Context
Tenants build pages with the Puck editor (now published as `@puckeditor/core`).
The page JSON is tenant-controlled input. Two browser tabs can save the same draft
at once (F25), and a publish must never leave a page half-updated.

## Decision
- Immutable `page_revisions(tenant_id, page_id, version, data jsonb)`. The runtime
  database role cannot update or delete revisions.
- `pages.published_revision_id` points at the live revision.
- Drafts save with compare-and-set on `pages.version`. A stale save gets a typed
  conflict error.
- Publish copies the draft into a new revision and moves the pointer in one
  transaction, then calls `updateTag`. Rollback moves the pointer back.
- On save, every block is validated against an allow-list of component types and
  their zod schemas. `javascript:` and `data:` URLs are rejected in any link or
  image field. Page size is capped.
- Rich text renders on the server, with render-time fields kept in the server
  config (F23).

## Main alternative
Static export per tenant.

## Revisit if
Tenant count grows past what on-demand revalidation handles.

## Sources
- `docs/review iteration 1.md`, ADR table row 8 and its reasoning; F18, F23, F25
- `docs/Iteration 2 cross-check.md`, C7 (`updateTag` replaces single-argument `revalidateTag`)
- [Puck: Server components](https://puckeditor.com/docs/integrating-puck/server-components)
