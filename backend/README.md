# LeastPriv Agent Backend

Autonomous IAM least-privilege remediation agent. Given a role, it removes
every permission the role doesn't use, proves each removal is safe by
replaying real traffic against the candidate policy in a sandbox, and
revises itself when that replay reveals a hidden dependency — all without
a human in the loop, except where the risk genuinely calls for one.

## Why this needs to be an agent, not a single LLM call

Two independent, deliberately inconsistent data sources drive the sandbox:

- **CloudTrail (`access_summary`, `query_access`)** — what a log query can
  see. Subject to two realistic blind spots: a window that's too narrow to
  catch a quarterly key rotation, and a resource with data-event logging
  disabled that no query at any window will ever reveal.
- **Traffic replay (`simulate`)** — what the service actually calls, ground
  truth, immune to both blind spots.

A one-shot policy proposal built only from the CloudTrail summary is
*wrong* for the flagship `checkout-svc-role` scenario — it will break two
services. The only way to find that out is to simulate the change and
watch it fail, diagnose which specific denial is a windowing problem
versus a logging gap, and revise. That loop — not the LLM's judgment on a
single prompt — is what this backend proves is necessary.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

No API key is required. The default agent brain (`app/agent.py`) is a
deterministic, tool-using heuristic loop — it needs no LLM to run, which
keeps the demo reproducible offline and under judges' control. (An
`ANTHROPIC_API_KEY` in `.env` is reserved for an optional LLM-driven brain
behind the same tool interface, if that mode is added later.)

Interactive API docs: `http://localhost:8000/docs`

## Deploying (Render)

The repo root has a `render.yaml` blueprint. On [render.com](https://render.com):
**New +** → **Blueprint** → connect the `leastpriv` GitHub repo → Render
reads `render.yaml` and creates a Python web service rooted at `backend/`
with `JWT_SECRET` auto-generated. Note the resulting URL
(`https://<name>.onrender.com`) — the frontend needs it as `VITE_API_URL`.

CORS already allows any `*.vercel.app` origin by default, so a Vercel
frontend deploy needs no backend config change. Set `ALLOWED_ORIGINS`
(comma-separated) only if you're serving the frontend from somewhere else.

## Authentication

Real accounts: `POST /api/auth/signup` bcrypt-hashes the password and stores
the user in a local SQLite file (`leastpriv.db`, created on first run,
gitignored); `POST /api/auth/login` verifies it and both return a signed JWT.
Every other `/api/*` route requires that JWT (`Authorization: Bearer <token>`,
or a `?token=` query param for the SSE endpoint, since `EventSource` can't
set headers) via the `get_current_user` dependency — there is no
unauthenticated path to the agent. Runs are scoped to the user that started
them; `GET /api/runs` only ever returns your own.

Set `JWT_SECRET` in `.env` for anything beyond local demo use — see
`.env.example`.

## Architecture

```
app/
  auth.py        signup/login, bcrypt hashing, JWT issuing and verification
  seed_data.py   synthetic cloud: roles, policies, and two independent
                 traffic logs (CloudTrail-visible vs. ground-truth)
  simulator.py   the sandboxed environment: policy matching, log queries,
                 and simulate() -- the objective, deterministic verifier
  agent.py       the observe -> decide -> act -> evaluate -> adapt loop
  runs.py        run state, SSE event fan-out, human-approval gating
  main.py        FastAPI routes
```

## Try the three demo scenarios

```bash
# 0. Create an account and grab a token (every /api/* route needs one)
TOKEN=$(curl -s -X POST localhost:8000/api/auth/signup -H "Content-Type: application/json" \
  -d '{"email":"dana@acme.io","password":"hunter2hunter2","name":"Dana Kimura"}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
AUTH=(-H "Authorization: Bearer $TOKEN")

# 1. Converges after a breakage-and-repair cycle (the flagship story)
curl -X POST localhost:8000/api/runs "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"environment_id":"sandbox-prod-mirror","role_id":"checkout-svc-role","require_approval":false}'

# 2. Pauses for human approval on high-risk removals
curl -X POST localhost:8000/api/runs "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"environment_id":"sandbox-prod-mirror","role_id":"ci-deploy-role","require_approval":true}'
# then: GET /api/runs/{id}/approval, POST /api/runs/{id}/approval {"decision":"approve"}

# 3. Recognizes an unresolvable dependency and stops cleanly, no infinite loop
curl -X POST localhost:8000/api/runs "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"environment_id":"sandbox-prod-mirror","role_id":"data-lake-admin","require_approval":false,"max_iterations":4}'
```

Watch any run live: `GET /api/runs/{id}/events` (Server-Sent Events).
Read the final result: `GET /api/runs/{id}/report`.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account, returns a JWT |
| POST | `/api/auth/login` | Verify credentials, returns a JWT |
| GET | `/api/auth/me` | Current user (requires a token) |
| GET | `/api/environments` | List sandbox environments |
| GET | `/api/environments/{env}/roles` | Roles in an environment, with permission tags |
| POST | `/api/runs` | Start a new remediation run |
| GET | `/api/runs` | List all runs |
| GET | `/api/runs/{id}` | Run status snapshot |
| GET | `/api/runs/{id}/events` | Live agent event stream (SSE) |
| GET | `/api/runs/{id}/approval` | Pending human-approval request, if any |
| POST | `/api/runs/{id}/approval` | Resolve a pending approval |
| GET | `/api/runs/{id}/report` | Final before/after policy, evidence, iteration log |
