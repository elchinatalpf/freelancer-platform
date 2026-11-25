# ADR 7 · API contract

Status: Accepted · November 23, 2026

## Context
The blueprint asked for "a standardized error shape" without defining one.
Server Actions and Route Handlers are called differently: the client calls an
action as a function and never reads its HTTP response, while Route Handlers
answer HTTP requests from outside the app (auth callbacks, webhooks, cron).

## Decision
- **Schemas:** zod schemas in `src/contracts/`, shared by forms, Server Actions
  and page blocks. Every input is parsed before it is used.
- **Server Actions** return a typed `ActionResult<T>` union.
- **Route Handlers** return errors as RFC 9457 problem+json: `type`, `title`,
  `status`, `detail`, `instance`, media type `application/problem+json`, with
  extension members such as a validation `errors` array allowed.

## Main alternative
tRPC, or a generated OpenAPI client.

## Revisit if
You add non-TypeScript clients.

## Sources
- `docs/review iteration 1.md`, ADR table row 7 and its reasoning; F15
- `docs/Iteration 2 cross-check.md`, "Where I am changing my review" (Server Action errors)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
