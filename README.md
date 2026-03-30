# Template for React Router App with Tailwind CSS and SQLite

**This is a code style and architecture template repository.** Use it as a reference for coding patterns, project structure, and development standards when building production applications.

The template demonstrates a simplified, modern stack with React Router v7, TypeScript, Tailwind CSS, Hono, tRPC, and SQLite via Drizzle + better-sqlite3. The `app/` shell is the starter surface; the `server/` tree is a backend reference slice that can be kept, replaced, or removed when your real API lands.

> **⚠️ Important**: This is a **template repository** showcasing patterns and structure, not a feature-complete product.

> **Required reading**: Review [AGENTS.md](./AGENTS.md) before development for commands, coding standards, and architecture rules.

## 📋 What This Template Provides

### ✅ Use This Template For:

- **Code Style Reference** - TypeScript + React + Tailwind conventions
- **Architecture Patterns** - Clean layering (contracts → queries → services → routes)
- **Type Safety Examples** - Zod contracts + neverthrow error handling
- **UI Component Library** - Reusable, tested UI primitives
- **Database Patterns** - Drizzle schema + migration workflow
- **Project Organization** - Scalable app/server/test directory structure

### ❌ This Template Does NOT Provide:

- A complete business product
- Domain-complete ERP/accounting features
- Ready-to-ship production logic without adaptation

### 💡 How to Use This Template:

1. Study the patterns in `app/`, `server/`, and `tests/`
2. Copy the structure into your own project
3. Replace or remove the backend slice when you wire your real backend
4. Keep strict contracts and Result-based error handling
5. Follow [AGENTS.md](./AGENTS.md) for development workflow

## 🔍 What's Working vs What's a Pattern

### ✅ Fully Functional (Study These):

- **UI shell and workflow pages** - Shared `MainLayout` + route-backed CPQ workflow shell
- **Backend reference slice** - `estimate` contract/query/service/tRPC route chain, kept as reference wiring only
- **Database layer** - Drizzle schema + generated SQL migrations + runner
- **Quality gates** - Typecheck, lint, build, and test workflows
- **Component library** - Tested reusable UI building blocks

### 📐 Pattern Scaffolding:

- **tRPC client/provider files in `app/lib/`** - Available as typed integration scaffolding
- **Backend note** - The `server/` files are intentionally reference-only until a consuming project swaps in its own API contract
- **Single-module backend design** - Intentionally minimal for extension

## Template Features & Patterns

This template demonstrates:

- **Modern Stack**: React Router SPA mode with Hono + tRPC backend, Vite 8, strict TypeScript
- **Type Safety**: Zod runtime contracts + neverthrow Result/ResultAsync patterns
- **Database Layer**: better-sqlite3 + Drizzle ORM with migration-driven schema changes
- **UI Patterns**: Tailwind CSS v4 with reusable components and a shared app layout
- **Workflow Engine**: CPQ workflow data drives stages, steps, progress, and page routing
- **Code Quality**: Type-aware linting (oxlint) + Vitest coverage
- **Architecture**: Explicit client/server boundary with typed API contracts

## Workflow Shell

This template is set up as a **CPQ template built around a workflow system**.

- The left workflow rail is organized into **stages**
- Each stage contains **steps**
- Each step has its own **route-backed page**
- Clicking a stage expands or collapses it
- Clicking a step navigates to that step page
- Each step page includes a **proceed action** that advances to the next step, and then into the next stage when needed

The template ships with a neutral workflow shell so the shell renders without business-specific data. The workflow engine is **not** limited to any fixed stage or step count; teams can add, remove, or rename stages and steps by changing the workflow data shape.

Today the workflow state is stored locally in browser storage so the template works without backend setup. Teams building on top of this template can keep the same workflow/page structure and replace the local storage source with their own database-backed workflow data.

The workflow behavior itself now lives in a separate core module, `app/lib/workflow-engine.ts`. The CPQ data layer feeds stage/step definitions into that engine, and the current template persists the runtime state in local storage. Teams can keep the same engine and swap only the data source, or move the same engine concepts to the backend if they want the workflow to execute server-side.

## Tech Stack

| Package               | Version       | Purpose                         |
| --------------------- | ------------- | ------------------------------- |
| react-router          | 7.13.0        | Client routing framework        |
| vite                  | 8.0.0-beta.13 | Build tool                      |
| hono                  | ^4.12.1       | HTTP server                     |
| @trpc/server          | ^11.10.0      | Type-safe API layer             |
| @trpc/react-query     | ^11.10.0      | Typed client hooks              |
| @tanstack/react-query | ^5.90.21      | Query/mutation state management |
| tailwindcss           | 4.1.18        | Styling                         |
| zod                   | 4.3.6         | Schema validation               |
| neverthrow            | 8.2.0         | Type-safe error handling        |
| vitest                | 4.0.18        | Testing framework               |
| oxlint                | 1.47.0        | Type-aware linting              |
| better-sqlite3        | ^12.6.2       | SQLite runtime                  |
| drizzle-orm           | ^0.45.1       | ORM and query builder           |
| drizzle-kit           | ^0.31.9       | Migration generation and tooling |

## 🎨 Design

- **UI Components**: shadcn/ui-style primitives
- **Color System**: professional neutral base with clear status states
- **Typography**: clean, readable hierarchy for dashboard-style layouts
- **Layout**: shared shell via `app/layouts/MainLayout.tsx`

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate and apply SQL migrations
npm run db:generate
npm run db:migrate

# Build and run
npm run build
npm run start
```

## 📁 Project Structure

```text
app/
├── components/
│   └── ui/                    # Reusable UI components
├── hooks/
│   └── use-mobile.tsx
├── layouts/
│   └── MainLayout.tsx         # Shared page shell + header
├── lib/
│   ├── workflow-engine.ts     # Pure workflow progression + derivation engine
│   ├── trpc.ts                # Typed tRPC client type binding
│   ├── trpc-provider.tsx      # Typed provider scaffolding
│   └── utils.ts
├── routes/
│   ├── index.tsx              # Root redirect into the active workflow step
│   └── workflow.$stepId.tsx   # Route-backed workflow step page
├── routes.ts                  # Route definitions
└── root.tsx

server/
├── contracts/
│   ├── estimate.ts            # Reference Zod runtime contracts for the backend slice
│   └── index.ts
├── db/
│   ├── index.ts               # Reference Drizzle + better-sqlite3 init for the backend slice
│   ├── schemas.ts             # Sample Drizzle table schema
│   ├── queries/
│   │   └── estimates.ts       # Sample query layer (ResultAsync)
│   ├── migrations/            # Generated SQL + drizzle metadata
│   └── migrate.ts             # Reference migration runner for the backend slice
├── services/
│   └── estimate.ts            # Reference business logic for the backend slice
├── trpc/
│   └── router.ts              # Reference API procedures for the backend slice
├── types/
│   └── errors.ts              # Shared app error contracts
├── index.ts                   # Reference Hono app setup for the backend slice
├── start.ts                   # Sample server entrypoint
└── tsconfig.json

tests/
├── components/                # UI component tests
├── db/                        # DB behavior tests
├── layouts/                   # Layout tests
├── routes/                    # Route tests
├── services/                  # Service tests
└── lib/                       # Utility tests
```

## 🗄️ Database Architecture

**Technology**: SQLite (`better-sqlite3`) + Drizzle ORM

**Database file path**: `.dbs/database.db`

**Migration workflow**:

1. Update `server/db/schemas.ts`
2. Run `npm run db:generate`
3. Run `npm run db:migrate`

### Tables Implemented

- `estimates`

This intentionally keeps one reference table so teams can extend from a clean baseline.

## 📝 Scripts

| Script                 | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run build`        | Build client + server                |
| `npm run build:client` | Build client bundle                  |
| `npm run build:server` | Compile server TypeScript            |
| `npm run start`        | Start production Hono server         |
| `npm run db:generate`  | Generate Drizzle SQL migrations      |
| `npm run db:migrate`   | Run Drizzle migrations               |
| `npm run typecheck`    | TypeScript type checking             |
| `npm run lint`         | Type-aware linting with oxlint       |
| `npm test`             | Run all tests                        |
| `npm run check`        | Run typecheck, lint, build, and test |

## 🧪 Testing

### Running Tests

```bash
npm test
npm run check
```

### Coverage Areas

- UI components
- App routes and layout behavior
- Database behavior
- Server service layer

All tests use Vitest (and React Testing Library for UI).

## 🏗️ Example Module

The repository includes one cohesive backend reference module:

- **Estimate**
  - Contract: `server/contracts/estimate.ts`
  - Query: `server/db/queries/estimates.ts`
  - Service: `server/services/estimate.ts`
  - API route: `server/trpc/router.ts`

Use this as the canonical pattern when adding your own modules, or replace it entirely when your application ships its own API contracts and persistence.

## 📖 Documentation

- [README.md](./README.md) - Project overview and quick start
- [AGENTS.md](./AGENTS.md) - Development standards and architectural rules

---

This repository is designed as a reference baseline: keep the structure, extend by module, and preserve strict contracts and typed boundaries.
