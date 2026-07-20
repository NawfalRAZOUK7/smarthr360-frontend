# smarthr360-frontend

Next.js 16 frontend for the SmartHR360 suite. Dark/light theme (including the
sidebar), mobile drawer navigation, glassmorphism UI, animated charts
(Recharts 3), JWT auth against `smarthr360-auth`.

> Do not run `npm audit fix --force` — it force-swaps Next.js between v9 and
> v16. The remaining "moderate" audit findings are dev-tooling transitive deps
> inside Next itself, not runtime risks.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3100 (Grafana holds :3000)
```

No backend running? Log in with **demo / demo** to explore the UI with sample
data (a banner marks demo mode). With the platform running
(`docker-compose up` in `smarthr360-platform`), use real credentials.

## Configuration

Copy `.env.local.example` → `.env.local`. Defaults match the platform
docker-compose port mapping (auth :8000, core-hr :8001, …).

## What's implemented (milestone 1)

- **Auth shell** — login (email or username, 2FA/OTP step-up, token refresh),
  route guard, logout.
- **Executive dashboard** — KPI cards, top skill-gap risks, coverage radar,
  projected supply vs demand.
- **Core HR** — employee directory (search + department filter),
  skill-gap prediction explorer (horizon 3/6/12/24m, severity filter,
  expandable rows with velocity/coverage/attrition/rationale).
- **Workload** — team burnout forecast (7/14/30d horizon, per-member
  trajectory cards with slope and confidence). Manager/HR/Admin.
- **Retention** — attrition prediction (risk rings, level filter,
  expandable factor breakdown with top drivers). HR/Admin.
- **Career Sim** — select target positions, compare trajectories
  (readiness, success odds, time-to-ready, missing skills, ranked).
- **Policy Gen** — A/B policy comparison (6 policy types, optional live
  core-hr mode, benefit/cost-efficiency ranking). HR/Admin.

## Architecture notes

- Pure SPA pages (`"use client"`); the Django services stay the only backend.
- `src/lib/api.ts` unwraps the project's `{data, meta}` envelope and retries
  once after a transparent `/api/auth/refresh/`.
- `src/lib/use-data.ts` falls back to `src/lib/mock.ts` on network failure so
  the UI is always explorable.
- Design tokens are CSS variables in `globals.css`, mapped to Tailwind v4
  utilities via `@theme inline`; `.dark` class toggles the palette
  (pre-paint script in `layout.tsx` avoids theme flash).

## CORS

All six services read `CORS_ALLOWED_ORIGINS` from the environment; the
platform docker-compose already sets it to `http://localhost:3100`. If you
run a service outside compose, export
`CORS_ALLOWED_ORIGINS=http://localhost:3100` yourself.

## Platform compose

The frontend is wired into `smarthr360-platform/docker-compose.yml` as the
`frontend` service (port 3100, build context `../smarthr360-frontend`).
`docker-compose up` brings up the full stack including the UI.

## Docker

```bash
docker build -t smarthr360-frontend \
  --build-arg NEXT_PUBLIC_AUTH_URL=http://auth.example.com \
  --build-arg NEXT_PUBLIC_CORE_HR_URL=http://core-hr.example.com .
docker run -p 3100:3100 smarthr360-frontend
```
