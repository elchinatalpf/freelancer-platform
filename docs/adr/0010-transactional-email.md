# ADR 10 · Transactional email

Status: Deferred · November 23, 2026

## Context
Email providers send only from a domain you own. Release 1 has no purchased
domain, and runs on `vercel.app` hostnames (ADR 3).

## Decision
No email in release 1. Sign-in uses GitHub and Google (ADR 6), so no magic links
or password resets are needed.

Later, once a domain is bought: send from that domain, with the tenant as
reply-to.

## Main alternative
Verify each tenant's own domain as a sender.

## Revisit if
Tenants demand branded sender addresses, or a feature needs email before a domain
is bought.

## Sources
- `docs/review iteration 1.md`, ADR table row 10
- `docs/Playbook.md`, "Rules that follow" and step 1.8
