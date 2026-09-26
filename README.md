# DecisionLens

DecisionLens helps people evaluate major financial and career decisions using
**transparent mathematical models and scenario analysis**. Live calculators:

- **Master's Degree ROI** — `/calculators/masters-roi`
- **Job Switch ROI** — `/calculators/job-switch-roi`

- Deterministic calculation engine in plain TypeScript. No LLM does any math.
- Optimistic / expected / conservative scenarios
- One-at-a-time sensitivity (tornado) analysis
- Every assumption displayed, plus a "How this calculation works" section
- SEO: static pre-rendering, per-page metadata, canonical URLs, Open Graph,
  JSON-LD (`WebApplication`, `FAQPage`, `BreadcrumbList`, `WebSite`), sitemap, robots
- Shareable results: inputs live in the URL query string
- Optional **Save calculation**: stores inputs + server-computed results in PostgreSQL under a random link
- Responsive, light/dark, keyboard- and screen-reader-friendly; charts include data tables

Not in V1 (by design): authentication, payments, AI-generated recommendations.

## Quick start

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL to your domain
npm run dev                  # http://localhost:3000
```

No database setup is needed for development: without `DATABASE_URL`, the app
starts an embedded Postgres (PGlite) in `.data/pglite` and migrates and seeds
it automatically.

### Production database

1. Create a PostgreSQL 13+ database and set `DATABASE_URL`.
2. Run `npm run db:setup` (apply migrations + seed calculators) on every deploy, before starting the app.

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:coverage` | Tests with coverage for `src/lib` |
| `npm run typecheck` | Strict TypeScript check |
| `npm run db:generate` | Generate a SQL migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` / `db:seed` / `db:setup` | Apply migrations / sync calculators / both |
| `npm run db:studio` | Browse the database (Drizzle Studio) |

Requires Node.js ≥ 20.9.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layer diagram, the
file structure, the full financial model specification and how to add a new calculator.

In short:

```
src/lib/finance/                   pure financial primitives (step-growth earnings, exact root finding)
src/lib/calculators/framework/     generic validation, scenarios, sensitivity, URL codec, input parser
src/lib/calculators/<slug>/        per-calculator models, engine, scenarios, sensitivity, content
src/features/shared/               shared client controller (state, URL sync, save/load)
src/components/calculator/         reusable calculator UI (inputs, stats, scenarios, charts, methodology, FAQ)
src/features/<slug>/               client containers wiring state → engine → components
src/lib/db/                        schema, connections, seed, repositories (PostgreSQL via Drizzle)
src/lib/services/                  session saving/loading used by the API routes
src/app/api/                       JSON API (calculators, sessions)
src/app/                           routes, metadata, JSON-LD, sitemap, robots, OG image
drizzle/                           generated SQL migrations
```

`src/lib` has no React imports, and every formula in it is unit-tested against
hand-calculated values.

## The model in one paragraph

Two cash-flow paths start on the first day of the program. On the **no-degree
path** you keep earning your current salary. On the **degree path** you pay
tuition + living costs − scholarship, spread evenly over the study period, then
earn the post-degree salary. Both salaries grow once a year at the same rate.
*Opportunity cost* is the no-degree salary forgone until the new job starts.
*Break-even* is the exact moment after graduation when cumulative degree-path
cash catches up. *5-/10-year impact* is the cumulative difference 5/10 years
after graduation, with all costs included. Figures are nominal and pre-tax.
