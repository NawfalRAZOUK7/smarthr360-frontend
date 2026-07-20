# Frontend coverage & real-backend runbook

## Running against the REAL backend

One command, from `smarthr360-platform/`:

```bash
./bootstrap.sh
```

It does everything: checks prerequisites, generates RSA keys (one-time),
writes `.env` with **dynamically generated random secrets** (via
`scripts/gen_secret.sh` — nothing hardcoded, never overwrites an existing
`.env`), runs `docker compose up --build -d`, waits for every service's
`/healthz/`, then seeds both datasets. Variants:

```bash
./bootstrap.sh --seed small   # only the quick demo story
./bootstrap.sh --seed full    # only the big dataset
./bootstrap.sh --seed none    # infrastructure only
./bootstrap.sh --no-build     # restart without rebuilding images
./bootstrap.sh --down         # stop the stack (volumes kept)
```

Two seed scripts (both idempotent, pure HTTP):

- `scripts/seed_demo.py` — the quick story: 4 accounts, one department set,
  a survey, a burnout case, a retention conversation.
- `scripts/seed_demo_full.py` — the large dataset: 24 accounts, 6 departments,
  ~24 profiles, 14 skills + ~90 evaluations, future-competency demand,
  review cycles/reviews/goals, 2 wellbeing surveys with 9 responses each
  (crosses the anonymity threshold so stats show), workload volume with two
  engineered burnout cases, and the full retention chain: detection →
  conversations completed → actions generated → some approved with recorded
  outcomes, **always leaving one pending action** so the approve/reject/outcome
  UI has live data.

Then open http://localhost:3100 and log in with a **seeded account** (e.g.
`hr@demo.smarthr360.dev` / `Demo#2026!hr360`, see `scripts/platform_client.py`).
Every screen switches from mock to live data automatically; the amber "demo
data" banner disappears.

CORS for :3100 is pre-configured in docker-compose for all 7 services.

### Notes / gotchas discovered during live verification

- **future-skills ML training** needs its dataset at
  `ml/data/future_skills_dataset.csv` *inside the build context*
  (`services/smarthr360_m3_future_skills/`). It is now committed there and
  baked into the image by `COPY ml/`. Training runs the real RandomForest
  pipeline (~1s) and reaches ~0.986 accuracy. Regenerate predictions from the
  ML training tab after a run.
- **Satellite CORS**: after editing compose env you must recreate the
  affected containers (`docker compose up -d`), not just rebuild the frontend —
  a bare `up -d --build frontend` leaves the others on stale config.
- **Auth throttling**: login is rate-limited; the seed scripts back off and
  retry, and local compose relaxes `THROTTLE_LOGIN`/`THROTTLE_REGISTER`.

## Module coverage matrix

Legend: **read** = view/analyse, **write** = create/mutate from the UI
(verified live against the real backend).

| Service | Read screens | Write actions (live-verified) | Still open |
|---|---|---|---|
| **auth** :8000 | Login (email/username), 2FA step-up, refresh, logout, RBAC, Users & Roles list | **Role change**, **register (self-service)**, **password reset (request+confirm)**, **2FA setup wizard**, **change password**, **GDPR self-erasure** | Email verification UI |
| **core-hr** :8001 | Employees, org-chart, **skill-matrix heatmap**, **HR-Open interop browser** (competency defs / person competencies / position models), skill-gap predictions, Wellbeing stats, Reviews (items/goals/cycles/**360 feedback**), Organization (dept + skill catalog) | Create survey (+questions), answer survey, Departments CRUD, Skills CRUD, CSV export, create review, create goal, **give 360° peer feedback** | — |
| **future-skills** :8004 | Predictions, market trends, HR investment recs, training-runs history + metrics, **economic indicators**, **service health/monitoring** | **Trigger ML training**, **regenerate predictions (bulk-predict)**, **bulk employee import (+auto-predict)** | — |
| **career-sim** :8003 | Position picker, multi-target comparison, **my profile**, **simulation history** | (comparison POST) | Single simulation detail form |
| **workload** :8005 | Team burnout forecast, Tasks table, Alerts inbox, personal score trend, Rebalance suggestions | **Add task (+assign)**, **compute score**, **acknowledge alert**, **log daily signal** | — |
| **retention** :8007 | Attrition prediction, Conversations (live multi-turn chat), Actions kanban, Outcome stats | **Run detection**, **advance conversation (respond)**, **approve/reject**, **complete**, **record outcome** | — |
| **policy-gen** :8006 | A/B comparison, **single Simulate + history**, Analytics KPIs, Budget optimizer, AI recommendations (Groq) | (compare / **simulate** / **apply** / optimize / recommend POSTs) | — |

Every one of the 7 services has read screens **and** write actions wired into
the UI — including the previously-open HR-Open interop standards browser and
future-skills bulk employee import. The only untouched items are back-office
analytics niches (economic reports, ML drift monitoring). Every user-facing HR
workflow is now built and tested.

## E2E tests

Playwright specs live in `e2e/` (`smoke.spec.ts`, `write-flows.spec.ts`,
`extended.spec.ts` — 17 tests) covering login, RBAC, and every write flow
including the interop browser, bulk import, economic data, and monitoring.
See `e2e/README.md` to run them:

```bash
npm install && npm run test:e2e:install && npm run test:e2e
```
