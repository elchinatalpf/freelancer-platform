# ADR 5 · Query layer

Status: **Proposed.** Step 1.1 runs the spike and records Drizzle or Prisma here.

## Context
Row-level security depends on tenant context that is local to one transaction:
each request opens a transaction and calls
`set_config('app.tenant_id', <id>, true)`. A session-level `SET` on a pooled
connection would leak one tenant's context into the next request that reuses the
connection. That needs an interactive transaction. Neon's HTTP driver runs only
single queries and non-interactive batches (F21), so tenant queries use Neon's
WebSocket `Pool` (or TCP `pg`), never `neon-http`.

## Proposed decision
Drizzle, after a one-day spike that proves the RLS transaction pattern:
`withTenant(tenantId, fn)` opens a transaction, sets the context with
`set_config(..., true)` and hands one transaction handle to repository functions.

The spike passes when a test shows the tenant setting present inside the
transaction and gone after it, including on a pool of size 1.

## Main alternative
Prisma interactive transactions.

## Revisit if
The spike shows Drizzle cannot hold one transaction handle cleanly.

## Confidence
Moderate. Drizzle and Prisma behavior with transaction-local settings was not
verified in the review. The spike exists to settle it.

## Sources
- `docs/review iteration 1.md`, ADR table row 5; "Multi-tenancy and Row-Level Security", rules 3 and 5; F21; Q3
- `docs/Iteration 2 cross-check.md` (Neon serverless driver)
- [PostgreSQL: SET](https://www.postgresql.org/docs/19/sql-set.html)
