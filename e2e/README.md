# E2E tests (Playwright)

End-to-end tests covering login, RBAC, and every write flow that was
verified by hand, so they can't silently regress.

## Prerequisites

The app and (ideally) the backend must already be running:

```bash
# from smarthr360-platform/
./bootstrap.sh              # brings up all services + the frontend on :3100
python3 scripts/seed_demo_full.py   # real data for the write flows
```

The specs log in with the seeded HR account
(`hr@demo.smarthr360.dev` / `Demo#2026!hr360`). If the backend isn't up they
fall back to the built-in `demo`/`demo` account and run against mock data — the
write actions still assert their success toasts (the UI short-circuits
mutations to a toast in demo mode).

## Run

```bash
cd smarthr360-frontend
npm install                 # installs @playwright/test
npm run test:e2e:install    # one-time: downloads the Chromium browser
npm run test:e2e            # headless
npm run test:e2e -- --ui    # interactive runner
```

Override the target or credentials with env vars:

```bash
BASE_URL=http://localhost:3100 \
E2E_EMAIL=hr@demo.smarthr360.dev E2E_PASSWORD='Demo#2026!hr360' \
npm run test:e2e
```

## What's covered

| Spec | Asserts |
|---|---|
| `smoke.spec.ts` | login → every nav route renders; theme toggle flips |
| `write-flows.spec.ts` | create survey, add task + compute score, run detection, trigger ML training, create department; **RBAC**: employee sees locked nav + "Restricted area" |
