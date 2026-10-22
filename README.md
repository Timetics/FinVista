# FinVista

A modern Finance Helper.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 + Recharts |
| Backend | Supabase (Postgres + GoTrue auth + Edge Functions) |
| Tests | Vitest |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API (Publishable key) |

`.env.local` is gitignored. `.env.example` documents the required keys.

## Backend setup

The project is already linked to a Supabase project (`supabase/.temp/linked-project.json`).
To work against it you need the [Supabase CLI](https://supabase.com/docs/guides/cli) and to be
logged in (`supabase login`).

```bash
# 1. Apply migrations (creates/fixes the `transactions` table + RLS policies)
supabase db push

# 2. Deploy the parse-statement edge function
supabase functions deploy parse-statement --project-ref <project-ref>

# 3. Run the test suite (includes a live auth round-trip)
npm test
```

### Database schema

`transactions` — one row per scanned transaction, owned by the authenticated user.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` | Primary key together with `user_id`. App-generated ids are deterministic 36-bit hashes; a sequence (`transactions_id_seq`, starting at `10^15`) supplies a fallback for inserts that omit it. |
| `user_id` | `uuid` | References `auth.users`. |
| `date` | `text` | ISO `YYYY-MM-DD`. |
| `description` | `text` | Merchant / memo. |
| `category` | `text` | Free-form category label. |
| `amount` | `numeric` | **Always absolute.** Direction is carried by `type`. |
| `type` | `text` | `credit` or `debit`. |
| `confidence` | `numeric` | Parser confidence, default `0`. |
| `flags` | `text[]` | e.g. `Recurring`, `Unusual`. Default `{}`. |
| `source` | `text` | `csv`, `scan`, `sample`. |

Primary key: `(user_id, id)`.

### Row Level Security

RLS is enabled with a single `FOR ALL` policy for the `authenticated` role:

```sql
using (auth.uid() = user_id) with check (auth.uid() = user_id)
```

Every read and write is therefore scoped to the caller's own rows.

### Deterministic row ids

`src/utils/helpers.js` exports `stableTransactionId()`, and the same algorithm is mirrored in
`supabase/functions/parse-statement/index.ts`. Both derive the id from
`date | description | amount | occurrence`, which means:

- Re-scanning the same statement **overwrites** its rows instead of duplicating them
  (the upsert target is `(user_id, id)`).
- Two genuinely distinct but identical rows in one statement (e.g. two $5 coffees on the
  same day) get distinct ids thanks to the `occurrence` counter.

> The two implementations must be kept in sync. If you change one, change the other.

### Edge function: `parse-statement`

`supabase/functions/parse-statement/index.ts`

- Verifies the caller's JWT (`verify_jwt = false` at the gateway; the function performs its
  own `auth.getUser()` check).
- Accepts CSV files up to 10 MB. Images and PDFs are handled client-side by the
  "AI Vision" mock scanner, not by this function.
- Upserts into `transactions` with `onConflict: user_id,id`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Oxlint |
| `npm test` | Vitest (watch mode; use `npm test -- --run` for a single pass) |

## Deployment (Vercel)

The frontend is deployed to Vercel and connected to the GitHub repository, so
**every push to `main` deploys automatically**.

| | |
|---|---|
| Vercel project | `timetics-projects/fin-vista` |
| Production URL | `https://fin-vista-chi.vercel.app` |
| GitHub repo | `Timetics/FinVista` (branch `main` → production) |
| Framework preset | Vite (`buildCommand: npm run build`, `outputDirectory: dist`) |
| Node version | 24.x |

### Environment variables (set in the Vercel project)

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://ldmlhtqqueoilzigasbm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the project's **publishable** key |

Both are set for **Production**, **Preview** and **Development**. Only these two
are needed — the backend is Supabase (Postgres + GoTrue auth + the
`parse-statement` edge function), and the publishable key is safe to ship in the
browser because access is controlled by Row Level Security.

> The project previously carried a full set of `SUPABASE_*` / `POSTGRES_*` / `NEXT_PUBLIC_*`
> variables (including a service-role key and the database password) pointing at a
> Supabase project that has since been deleted. They were removed. Do not add
> service-role or database credentials to this project — a Vercel build only ever
> needs the two `VITE_` variables above.

### Working with the deployment locally

```bash
vercel link --project fin-vista --scope timetics-projects   # links .vercel/project.json
vercel env pull .env.local --environment=development --yes   # pulls the remote vars
vercel --prod                                            # one-off production deploy
vercel logs fin-vista                                     # tail production logs
```

`vercel link` writes to `.env.local` and may overwrite local values — re-check
it after linking.

### `vercel.json`

Declares the Vite build explicitly, adds an SPA fallback rewrite, immutable
caching for hashed assets under `/assets/`, and security headers (CSP, HSTS,
`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).

The CSP allows the Supabase API (`https://*.supabase.co`), Google Fonts and the
Unsplash images used by the demo statement photos.

## Testing

```bash
npm test -- --run
```

`src/lib/supabaseAuth.test.js` performs a **live** sign-up/sign-in against the configured
Supabase project. It needs a reachable project and valid `.env.local` values. The other
suites (`src/lib/supabaseTransactions.test.js`, `src/utils/helpers.test.js`) run fully
offline against mocks.

### Live integration tests

`src/lib/supabaseTransactions.live.test.js` exercises the whole backend against the real
project: it creates throwaway users, uploads a statement to the `parse-statement` edge
function, and asserts on what lands in Postgres (row shape, idempotency, RLS isolation
between two users, and the client-side `saveTransactions` / `loadTransactions` round trip).

These are opt-in because they create real users:

```bash
# Linux / macOS
RUN_LIVE_TESTS=1 npx vitest run src/lib/supabaseTransactions.live.test.js

# Windows PowerShell
$env:RUN_LIVE_TESTS = 1; npx vitest run src/lib/supabaseTransactions.live.test.js
```

### Troubleshooting: "project ref" mismatch

`.env.local` and `supabase/.temp/linked-project.json` must point at the **same** Supabase
project. If they drift apart you get confusing symptoms:

| Symptom | Cause |
|---|---|
| `PGRST205: Could not find the table 'public.transactions' in the schema cache` | The app points at a project that has no `transactions` table. |
| `{"code":"NOT_FOUND","message":"Requested function was not found"}` | The app points at a project with no `parse-statement` function deployed. |
| `404` on `/functions/v1/parse-statement` | Same as above. |

Fix the env file, or re-link the CLI:

```bash
supabase link --project-ref <project-ref>
```

Also note that Supabase **pauses inactive free-tier projects**. A paused project has its
API hostname removed from DNS, so every request fails with `DNS name does not exist`.
Restore it from the dashboard (Project Settings → General → Restore project) before
debugging anything else.

## Development setup

This project uses React with Vite and Oxlint.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/vite-plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's type related rules in your project.
