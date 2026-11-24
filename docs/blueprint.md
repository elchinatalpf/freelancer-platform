# Project Blueprint: The Empowered Professional Platform
Version: 1.0
Date: September 7, 2025
Status: Approved by the Architecture Review Board

# 1.0 High-Level Summary & Charter
## A. Vision:
To build a multi-tenant, all-in-one SaaS platform that empowers solo wellness professionals (yoga, pilates, ballet teachers) to manage and grow their business, eliminating the "patchwork problem" of disconnected tools.

## B. Core Value Proposition:
The platform will provide a seamless, integrated experience for website creation (via a visual editor), client scheduling, payment processing, and business management. It is a vertical solution designed specifically for the workflow of the "Empowered Professional."

## C. Confirmed Technology Stack:

Frontend: Next.js

Visual Editor: Puck

Backend: NestJS

Database: PostgreSQL with Row-Level Security (RLS)

Deployment/Hosting: Vercel

Payments: Stripe Connect

Transactional Email: Resend

# 2.0 The Board's Guiding Principles
This project will adhere to the "Clean Code" philosophy outlined in the initial research. All development work will be evaluated against the following principles, representing the consensus of the Board's expert members.

## The Pragmatic Maintainer on Readability & Structure:

Clarity is paramount. Code should be written to be understood by the next developer.

We will adopt the feature-based colocation structure detailed in the research. All logic, components, and types for a specific feature (e.g., "billing") will reside in the same directory.

## Consistent Naming:

Files and directories: kebab-case (e.g., user-profile.tsx)

React Components: PascalCase (e.g., <UserProfile />)

Variables & Functions: camelCase (e.g., getUserProfile)

## The Performance Optimizer on Efficiency:

Start lean. We must be disciplined about the client-side JavaScript bundle size from day one.

Leverage Next.js features (Server Components, SSG, ISR) appropriately to minimize client-side work. Every component's placement (client vs. server) must be an intentional decision.

Database queries must be efficient. Avoid N+1 query patterns.

## The Security Champion on Defensive Coding:

Security is not an afterthought. It is a foundational requirement.

NEVER commit secrets. All API keys, database connection strings, and other sensitive credentials MUST be managed via environment variables. A .env.example file is required in each service's root.

Validate everything. All data coming from the client (API requests) and from third-party services must be validated and sanitized before being processed or stored.

## The DevOps & Scalability Engineer on Infrastructure:

Design for statelessness. The NestJS backend API must be stateless. All persistent state must live in the PostgreSQL database or a dedicated cache, allowing for horizontal scaling.

Configuration as Code: Environment-specific configurations should be managed through environment variables, not hard-coded values. This ensures smooth transitions between local, staging, and production environments.

## The UX-First Developer on Experience:

Developer Experience (DX) Matters. The API contract between the Next.js frontend and the NestJS backend is a critical user interface. It must be well-defined, consistent, and predictable.

Consistent Error Handling: All API endpoints must return a standardized error shape. This allows the frontend to handle errors gracefully without custom logic for each endpoint.

# 3.0 Phase 1: Environment & Monorepo Setup
This phase focuses on creating a clean, repeatable, and efficient local development environment. We recommend a pnpm-based monorepo to manage the frontend and backend projects cohesively.

## A. Prerequisites:

Node.js (LTS version)

pnpm

Git & Git Bash (or equivalent terminal)

VS Code

## B. Monorepo Initialization:

Create the project directory:

mkdir empowered-professional-platform
cd empowered-professional-platform
git init

Initialize the pnpm workspace:

pnpm init
touch pnpm-workspace.yaml

## In pnpm-workspace.yaml, define the package locations:

packages:
  - 'apps/*'
  - 'packages/*'

## Create the directory structure:

mkdir apps
mkdir packages

# C. Recommended VS Code Extensions:

ESLint

Prettier - Code formatter

EditorConfig for VS Code

DotENV (for .env file syntax highlighting)

# 4.0 Phase 1: "Tracer Bullet" Implementation Plan
The goal of this first development sprint is to create a thin, end-to-end slice of the application. This verifies that the core frontend and backend services are set up correctly and can communicate with each other.

Step 1: Create the Next.js Frontend App

# From the project root
cd apps
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

Follow the prompts. This will create a web directory inside apps.

Step 2: Create the NestJS Backend App

# From the project root
# First, ensure the NestJS CLI is available
pnpm add -g @nestjs/cli

cd apps
nest new api

Choose pnpm as the package manager. This will create an api directory inside apps.

Step 3: Establish API Communication

Backend (NestJS): Start the backend dev server.

# From the project root
cd apps/api
pnpm run start:dev

By default, it will run on http://localhost:3000.

Frontend (Next.js): Change the default port for the Next.js dev server to avoid conflicts.

Open apps/web/package.json.

Modify the dev script: "dev": "next dev -p 3001",

Frontend (Next.js): Create a simple server component to fetch data from the backend's default health check endpoint.

In apps/web/src/app/page.tsx, replace the content with:

async function getApiStatus() {
  try {
    // In production, this would be an absolute URL from an env var
    const res = await fetch('http://localhost:3000/hello', { cache: 'no-store' });
    if (!res.ok) {
      return `Error: ${res.statusText}`;
    }
    return res.text();
  } catch (error: any) {
    return `Error: Failed to fetch API. Is it running?`;
  }
}

export default async function HomePage() {
  const apiStatus = await getApiStatus();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Empowered Professional Platform</h1>
      <p className="text-lg">Connecting to the NestJS API...</p>
      <div className="mt-4 p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
        <p className="font-mono">API Status: <strong>{apiStatus}</strong></p>
      </div>
    </main>
  );
}

Verification: Run both applications in separate terminals from the project root.

Terminal 1: pnpm --filter api start:dev

Terminal 2: pnpm --filter web dev

Open http://localhost:3001 in your browser. You should see the message "API Status: Hello World!".

5.0 Roadmap to MVP
Completing the "Tracer Bullet" provides a stable foundation. The subsequent development sprints will build upon this, following the phased roadmap from the research.

Sprint 2: Core Editor & UI Foundation:

Integrate the Puck visual editor into the Next.js app.

Develop the first set of basic, reusable UI components (Button, Card, Input) in src/components/ui.

Establish the main application layout ((app) route group).

Sprint 3: Database & Tenancy Foundation:

Set up the PostgreSQL database schema.

Implement user authentication (e.g., using Passport.js in NestJS).

Implement the core Row-Level Security (RLS) policies for tenant data isolation.

Sprint 4: Commercial & Operational Layer:

Integrate Stripe Connect for tenant onboarding and payments.

Integrate Resend for transactional emails (e.g., welcome email).

Implement programmatic subdomain creation using the Vercel API.

This structured approach will ensure we build a robust, scalable, and maintainable platform.