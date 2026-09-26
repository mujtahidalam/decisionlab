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
- Optional **AI Decision Analysis**: an on-demand, structured interpretation of a result — the AI explains the numbers but never calculates or changes them
- Responsive, light/dark, keyboard- and screen-reader-friendly; charts include data tables

Not in V1 (by design): authentication, payments.

## AI Decision Analysis

**The deterministic calculator is the source of truth; the AI only interprets its results.**

```
inputs → validation → deterministic engine → structured context (formatted numbers)
       → POST /api/analyze → LLM (structured output) → schema check → numeric guard → report
```

- The browser sends **only** `{ calculator, inputs, currency }`. The server re-validates the inputs,
  **recomputes every result, scenario and sensitivity figure** with the engine, and sends those to the AI.
  Any `results` a client sends are ignored.
- The response must match a strict JSON schema, and a **numeric guard** rejects any answer that contains a
  number (with its unit — durations, percentages, amounts) the calculator didn't produce.
- Called only when the user clicks **Analyze My Result**, never for invalid inputs; 10 requests / 10 min per client.
- Nothing is stored; failures are logged by category only, never with inputs or AI text.
- Without `OPENAI_API_KEY` the button shows "AI analysis is temporarily unavailable…" and everything else works.

Setup: add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4o-mini`) to `.env.local`. See `.env.example`.

`POST /api/analyze` — body `{ "calculator": "masters-roi", "inputs": {…}, "currency": "USD" }` →
`200 { analysis: { summary, key_drivers[], risks[], sensitivity[], assumptions[], questions_to_consider[] }, meta }`;
`400` invalid request/inputs (with `fieldErrors`), `404` unknown calculator, `413` body > 16 KB, `429` rate-limited,
`502` AI failed or returned an invalid/unverifiable answer, `503` AI not configured.

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
src/lib/ai/                        provider-neutral AI analysis layer (prompt, schema, numeric guard, OpenAI provider)
src/lib/services/                  session saving/loading and AI analysis used by the API routes
src/app/api/                       JSON API (calculators, sessions, analyze)
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
