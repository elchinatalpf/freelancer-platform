# ADR 9 · Payments

Status: Accepted for release 1 · November 23, 2026. Step 5.1 rewrites this ADR for
Stripe Billing in detail.

## Context
Release 1 has a free tier and a paid tier at $10–40 a year, built in Stripe test
mode. There are no payouts to tenants, so the platform is the merchant. The
blueprint's Stripe Connect plan used account types Stripe now marks as legacy.

## Decision
Release 1: Stripe Billing subscriptions in test mode, with you as the merchant.
- Stripe-hosted Checkout and the Customer Portal only. No card data on our servers.
- The webhook Route Handler verifies the signature over the raw body before any
  parsing, stores processed event ids under a unique constraint so a replay
  changes nothing, and updates subscription state in one transaction.
- Prices are read from the database, never from the client.
- Only test keys exist, in the repo history and in Vercel.

If payouts to tenants return: Accounts v2 or controller properties, direct
charges, Stripe-hosted onboarding.

## Main alternative
Legacy Express accounts with destination charges. Rejected for any future Connect
setup: with destination charges, Stripe recommends the platform carry negative
balances.

## Revisit if
You want the platform to own the customer relationship and its losses.
Before the first real charge: Vercel Pro, live keys, ADR 12 (sales tax or VAT),
terms and privacy policy.

## Sources
- `docs/review iteration 1.md`, ADR table row 9 and its reasoning; F11; security table (webhooks, card data)
- `docs/Iteration 2 cross-check.md`, C4
- `docs/Playbook.md`, Phase 5
- [Stripe: Connected account types](https://docs.stripe.com/connect/connecting-to-accounts)
