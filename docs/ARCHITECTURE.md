# DecisionLens — Technical Architecture (V1)

DecisionLens helps people evaluate major financial and career decisions with
**transparent, deterministic math**. V1 ships one calculator — the Master's
Degree ROI Calculator — on a foundation built to host many more.

## 1. Guiding principles

| Principle | What it means in code |
|---|---|
| Deterministic math | Every number comes from pure TypeScript functions in `src/lib`. No LLM, no network, no randomness, no `Date.now()` in calculations. Same inputs → same outputs, on server and client. |
| Separation of concerns | **Data models** (`types.ts`), **calculation logic** (`engine.ts`, `scenarios.ts`, `sensitivity.ts`), and **UI** (`src/components`, `src/features`) live in separate modules. The engine never imports React; components never do math beyond formatting. |
| Transparency | Every assumption the engine makes is returned as data (`assumptions`), rendered verbatim in the UI and explained in "How this calculation works". |
| Reusable calculators | Calculators register in `src/lib/calculators/registry.ts`. Layout, input panels, stat cards, scenario tables, sensitivity charts and methodology/FAQ sections are generic components driven by config. |
| SEO first | Calculator pages are server-rendered with default results, per-page metadata, canonical URLs, Open Graph/Twitter cards, JSON-LD (`WebApplication`, `FAQPage`, `BreadcrumbList`), `sitemap.xml` and `robots.txt`. |

## 2. Stack

- **Next.js 16 (App Router)** + **React 19** + **TypeScript (strict)**
- **Tailwind CSS v4** for styling (no component library; small in-house UI kit)
- **Vitest** for unit tests of every financial formula
- Charts are hand-built SVG/HTML — no charting dependency, fully server-renderable and accessible.

- **PostgreSQL** via **Drizzle ORM** (typed schema + generated SQL migrations).
  Local development and tests use **PGlite** (Postgres compiled to WebAssembly) — no database server to install.

No auth, payments or AI features in V1 (explicit non-goals).

## 3. Layered design

```
┌────────────────────────────────────────────────────────────┐
│ app/ (routes, metadata, JSON-LD)          — Next.js layer  │
├────────────────────────────────────────────────────────────┤
│ features/<calculator>/ (client container: state ⇄ engine)  │
├────────────────────────────────────────────────────────────┤
│ components/ (generic, presentational, reusable)            │
├────────────────────────────────────────────────────────────┤
│ lib/calculators/<calculator>/ (models, engine, scenarios,  │
│   sensitivity, validation, url state, content)             │
├────────────────────────────────────────────────────────────┤
│ lib/finance/ (pure financial primitives, calculator-agnostic)│
└────────────────────────────────────────────────────────────┘
```

Dependencies only point downward. `lib/**` has zero React/Next imports and is
100% unit-testable in Node.

## 4. File structure

```
decisionlens/
├── docs/ARCHITECTURE.md             ← this file
├── src/
│   ├── app/
│   │   ├── layout.tsx               root layout, global metadata, header/footer
│   │   ├── page.tsx                 landing page
│   │   ├── globals.css              Tailwind + design tokens (light/dark)
│   │   ├── not-found.tsx
│   │   ├── sitemap.ts               generated from calculator registry
│   │   ├── robots.ts
│   │   ├── opengraph-image.tsx      generated OG image
│   │   └── calculators/
│   │       ├── page.tsx             calculator directory
│   │       └── masters-roi/page.tsx SEO shell + server-rendered calculator
│   ├── features/
│   │   ├── shared/useCalculatorController.ts      state, URL sync, save/load (every calculator)
│   │   ├── masters-roi/MastersRoiCalculator.tsx   client container
│   │   └── job-switch-roi/JobSwitchCalculator.tsx client container
│   ├── components/
│   │   ├── layout/                  SiteHeader, SiteFooter, Container
│   │   ├── ui/                      Card, Badge, NumberField, SelectField, Disclosure
│   │   ├── seo/JsonLd.tsx
│   │   └── calculator/              reusable calculator building blocks
│   │       ├── CalculatorLayout.tsx     two-column inputs/results shell
│   │       ├── InputPanel.tsx           renders FieldDefinition[] → inputs
│   │       ├── StatGrid.tsx             headline metric cards
│   │       ├── ScenarioTable.tsx        optimistic/expected/conservative
│   │       ├── AssumptionList.tsx       renders engine-reported assumptions
│   │       ├── TornadoChart.tsx         sensitivity analysis
│   │       ├── CumulativeChart.tsx      cumulative advantage over time
│   │       ├── MethodologySection.tsx   "How this calculation works"
│   │       └── FaqSection.tsx
│   └── lib/
│       ├── site.ts                  site config (name, URL, description)
│       ├── seo.ts                   metadata + JSON-LD builders
│       ├── format.ts                currency/percent/duration formatting
│       ├── finance/
│       │   ├── growth.ts            step-growth salary & earnings integrals
│       │   ├── piecewise.ts         exact root-finding on piecewise-linear series
│       │   └── *.test.ts
│       └── calculators/
│           ├── types.ts             shared calculator contracts (FieldDefinition, …)
│           ├── registry.ts          list of calculators (nav, sitemap, landing)
│           ├── definitions.ts       slug → formula version, fields, server hooks (DB + API)
│           ├── framework/           generic bounds/validation, scenarios, sensitivity,
│           │                        URL codec and strict input parser
│           ├── job-switch-roi/      same file layout as masters-roi
│           └── masters-roi/
│               ├── types.ts         MastersRoiInputs / MastersRoiResult models
│               ├── defaults.ts      default inputs + limits
│               ├── fields.ts        input field definitions (labels, help, bounds)
│               ├── validation.ts    input validation (errors + warnings)
│               ├── engine.ts        calculateMastersRoi() — core model
│               ├── scenarios.ts     scenario definitions + runner
│               ├── sensitivity.ts   one-at-a-time sensitivity analysis
│               ├── url-state.ts     shareable URL (de)serialisation
│               ├── content.ts       methodology copy, FAQ, SEO copy
│               └── *.test.ts
├── vitest.config.ts
├── next.config.ts
└── package.json
```

## 5. Master's ROI financial model

All figures are **nominal and pre-tax** (users may enter after-tax values for a
take-home view). Time `t` is measured in years from the start of the program.

### Inputs

| Symbol | Field | Unit |
|---|---|---|
| S₀ | Current annual salary | currency / year |
| P₀ | Expected post-degree starting salary | currency / year |
| T | Tuition (whole program) | currency |
| L | Living expenses while studying | currency / year |
| Sch | Scholarship / funding (whole program) | currency |
| D | Study duration | years (fractional allowed) |
| g | Expected annual salary growth (both paths) | % / year |
| J | Job-search period after graduation (advanced, default 0) | months |

### Salary paths

Salaries rise in annual steps: a job paying `B` pays `B·(1+g)^⌊τ⌋` in its
τ-th year. Earnings over any interval are computed **exactly** by summing whole
and partial years (`lib/finance/growth.ts`).

- **No-degree path:** earns S₀ from t = 0.
- **Degree path:** pays costs evenly over [0, D]; earns P₀ from `t = D + J/12`.

### Outputs

| Output | Formula |
|---|---|
| Total education cost | `T + L·D − Sch` |
| Opportunity cost | earnings of the no-degree path over `[0, D + J/12]` |
| Net investment | `education cost + opportunity cost` |
| Annual income increase | `P₀ − S₀·(1+g)^⌊D + J/12⌋` (first-year premium vs. where you'd be without the degree) |
| Cumulative advantage A(t) | `degree-path cash(t) − no-degree cash(t)`; `A(D + J/12) = −net investment` |
| Break-even period | smallest `t ≥ D + J/12` with `A(t) ≥ 0`, reported in years after graduation (exact root of a piecewise-linear function; searched up to 50 years) |
| 5-/10-year impact | `A(D + 5)`, `A(D + 10)` — net position 5/10 years after graduation, all costs included |
| 10-year ROI | `A(D + 10) / net investment` (net gain ÷ cost, as %) |

### Scenarios

Scenario definitions are data (`scenarios.ts`) and shown to users:

| Scenario | Post-degree salary | Salary growth | Living costs | Job search |
|---|---|---|---|---|
| Optimistic | +10% | +1 pp | −5% | as entered |
| Expected | as entered | as entered | as entered | as entered |
| Conservative | −15% | −1 pp | +10% | +3 months |

### Sensitivity analysis

One-at-a-time ("tornado") analysis: each assumption is moved to a low and a
high value while all others stay at the user's inputs; the change in 10-year
impact is recorded and assumptions are ranked by total swing.

## 5b. Job Switch ROI model

Time `t` is in years from today (the day you resign). Packages are
salary + bonus + benefits.

| Output | Formula |
|---|---|
| One-time net cost | `forfeited compensation + moving costs − signing bonus` (at t = 0) |
| Income lost in the gap | current package earned over `[0, gap]` |
| Net switching cost | one-time net cost + income lost in the gap |
| Annual pay increase | `new package − current package·(1+g_cur)^⌊gap⌋` |
| Net annual gain | annual pay increase − extra yearly costs of the new job |
| Cumulative advantage A(t) | `−one-time + E_new(0, t−gap) − extra·max(0, t−gap) − E_cur(0, t)` |
| 1/3/5-year impact | `A(1)`, `A(3)`, `A(5)` |
| Break-even | the time **after which A stays ≥ 0** within 20 years (`stableNonNegativeFrom`), so a temporary lead from a signing bonus that is later lost never counts |

Scenarios vary only the new job (the current job is known): optimistic —
bonus +25%, raises +1 pp, start 1 month sooner; conservative — bonus −50%,
raises −1 pp, start 2 months later, moving costs +25%.

## 6. Database

```
calculators                      calculator_inputs                    calculator_sessions
───────────                      ─────────────────                    ───────────────────
id              int PK ◄──┐      calculator_id  int FK ─► calculators  id             uuid PK (random)
slug            text UQ   ├───── field_name     text   ┐ PK            calculator_id  int FK ─► calculators
name            text      │      field_type     enum   ┘               inputs         jsonb
description     text      │      default_value  jsonb                  results        jsonb
category        text      │      validation_rules jsonb                created_at     timestamptz
formula_version text?     │                                           INDEX (calculator_id, created_at)
status          enum      └──── ON DELETE CASCADE                     ON DELETE RESTRICT
```

- **Code is the source of truth** for calculator definitions (`registry.ts`,
  each calculator's `fields.ts`, `MASTERS_ROI_FORMULA_VERSION`). `calculators`
  and `calculator_inputs` mirror it; `npm run db:seed` upserts them idempotently.
  Pages stay statically generated and never need the database to render.
- `validation_rules` and `default_value` are stored in **model units**
  (percentages as decimals), matching the values stored in `inputs`.
- **Sessions are only created when a user clicks "Save calculation".** The API
  re-validates the inputs and **recomputes results on the server** with the
  deterministic engine; any `results` sent by a client are ignored. The stored
  results include `formulaVersion`, so old sessions stay interpretable after
  formula changes. Session ids are random UUIDs, so links can't be enumerated.
- Deleting a calculator cascades to its input rows but is blocked while saved
  sessions reference it.

| Layer | File |
|---|---|
| Schema | `src/lib/db/schema.ts` → migrations in `/drizzle` (`npm run db:generate`) |
| Connections | `src/lib/db/connect.ts` (PGlite / node-postgres), `client.ts` (cached app handle, server-only) |
| Seed | `src/lib/db/seed.ts` |
| Repositories | `src/lib/db/repositories/{calculators,sessions}.ts` |
| Service | `src/lib/services/sessions.ts` (validation + server-side computation) |
| API | `src/app/api/**/route.ts` |

### API

| Method & path | Purpose |
|---|---|
| `GET /api/calculators` | All calculators |
| `GET /api/calculators/:slug` | One calculator with its input definitions |
| `POST /api/calculators/:slug/sessions` | Save a calculation. Body `{ "inputs": {…} }` → `201 { id, createdAt, warnings }`; `400` with `fieldErrors` on invalid input; `404` unknown calculator; `409` not live; `413` body > 16 KB |
| `GET /api/sessions/:id` | A saved calculation (inputs + results); `404` if unknown |

## 7. Adding a new calculator

1. Create `src/lib/calculators/<slug>/` with `types.ts`, `defaults.ts`
   (incl. formula version), `fields.ts`, `validation.ts` (uses
   `framework/bounds`), `engine.ts`, `scenarios.ts` / `sensitivity.ts` /
   `url-state.ts` / `input-parsing.ts` (thin wrappers over `framework/`),
   `session-results.ts`, `content.ts` and tests.
2. Register it in `src/lib/calculators/registry.ts` (drives the directory,
   landing page and sitemap) and add its model to
   `src/lib/calculators/definitions.ts`, then run `npm run db:seed`.
3. Create `src/features/<slug>/<Name>Calculator.tsx`: call
   `useCalculatorController(...)` and compose `InputsCard`, `SaveShareBar`,
   `StatGrid`, `CumulativeChart`, `ScenarioTable`, `TornadoChart`, `AssumptionList`.
4. Add `src/app/calculators/<slug>/page.tsx` with `buildPageMetadata()` and
   `CalculatorPageShell` (breadcrumbs, methodology, FAQ, JSON-LD).

## 8. Quality gates

- `npm run typecheck` — strict TypeScript
- `npm test` — unit tests for every formula, plus database tests against an in-memory Postgres
- `npm run build` — production build, static pre-rendering of all pages
