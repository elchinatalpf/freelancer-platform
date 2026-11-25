# Empowered Professional Platform

A multi-tenant site builder for freelancers and solo professionals. One Next.js
app, pnpm, PostgreSQL with row-level security.

The plan is in [docs/Playbook.md](docs/Playbook.md); architecture decisions and
findings are in [docs/review iteration 1.md](docs/review%20iteration%201.md).

## Run it locally

Requires Node 26 (see `.nvmrc`) and the pnpm version in `package.json`.

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

Open http://localhost:3000. `GET /api/health` returns `{"status":"ok"}`.
