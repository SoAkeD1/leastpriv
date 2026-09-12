# LeastPriv

**Autonomous IAM least-privilege remediation agent.** Give it a role, it removes every permission that role doesn't use, proves each removal is safe by replaying real traffic against the candidate policy in a sandbox, and revises itself when that replay reveals a hidden dependency — closed-loop, with a human in it only where the risk genuinely calls for one.

Built for Tech Zephyr 4.0 (Track 5: Cybersecurity — *Autonomous Cloud IAM Least-Privilege Mitigator*).

## The problem

IAM policies only ever grow. Someone adds a wildcard at 2am to unblock a deploy, and it stays for four years. Nobody removes permissions afterward, because nobody can prove the removal is safe — so blast radius compounds silently until a stolen credential inherits everything nobody bothered to revoke.

## Why this needs to be an agent, not a single LLM call

Two independent, deliberately inconsistent data sources drive the sandbox:

- **CloudTrail** (log queries) — what an analysis tool can see. Realistically limited: a 90-day window misses a permission used only during quarterly key rotation, and a resource with data-event logging disabled never shows up in *any* window.
- **Traffic replay** (the sandbox simulator) — what the service actually calls, ground truth, immune to both blind spots.

A one-shot policy proposal built only from the CloudTrail summary is **objectively wrong** for the flagship scenario — it breaks two services. The only way to find that out is to simulate the change, watch it fail, diagnose *which kind* of blind spot caused each denial, and revise. That loop — not an LLM's judgment on a single prompt — is what makes this an agentic problem, and it's fully reproducible: three demo scenarios below always play out the same way, so a judge (or a graded rubric) can verify the mechanism, not just take an LLM's word for it.

## Architecture

```
leastpriv/
  backend/    FastAPI agent + sandboxed simulator (Python, no LLM API key required)
  frontend/   React console: dashboard, environments, live agent view, reports (Vite + TypeScript)
```

The agent loop — observe (query the sandbox) → decide (propose a policy revision) → act (simulate it) → evaluate (check for denials) → adapt (diagnose and restore the exact missing grant) — lives entirely in `backend/app/agent.py`, running against the synthetic cloud in `backend/app/simulator.py`. The frontend is a thin, fully real-time view onto that loop: it streams agent reasoning over Server-Sent Events, polls live service-health and policy-diff state, and surfaces human-approval requests exactly when the backend actually pauses for one.

See [`backend/README.md`](backend/README.md) for the simulator/agent design in depth, and [`frontend/README.md`](frontend/README.md) if present for UI notes.

## Running it

Two processes, no cloud account or API key needed.

**Backend** (Python 3.11+):
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (Node 18+):
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, go to **Agent Console**, and run one of the three reference scenarios:

| Scenario | Role | What it demonstrates |
|---|---|---|
| Checkout runtime cleanup | `checkout-svc-role` | Breakage → two distinct root-cause diagnoses → converges (the flagship story) |
| CI deploy role | `ci-deploy-role` | Pauses for human approval on every high-risk removal |
| Data lake admin | `data-lake-admin` | Recognizes an unresolvable dependency, stops cleanly instead of looping forever |

Interactive API docs: `http://localhost:8000/docs`.

## Deploying

Backend → [Render](backend/README.md#deploying-render) (a `render.yaml`
blueprint at the repo root does the setup). Frontend → [Vercel](frontend/README.md#deploying-vercel)
(root directory `frontend`, one env var pointing at the backend URL). No
other infrastructure is required — the agent's state is in-memory and its
data is SQLite, both fine for a single free-tier instance.

## Authentication

Real accounts, not a demo login: signup and sign-in hit the backend, passwords
are bcrypt-hashed into a local SQLite file, sessions are signed JWTs, every
API route requires one, and runs are scoped to the user that started them.
See [`backend/README.md`](backend/README.md#authentication) for details.

## Evaluation & robustness

- **Objective verifier**: `simulate()` is a deterministic replay against real traffic, not an LLM grading its own output. Convergence means 0 denials across the full replay window, full stop.
- **Evidence, not assertions**: every permission change ships with its justification (call counts, time window, or "logging gap — sandbox is the only signal") and a confidence score.
- **Failure handling**: an unmirrorable cross-account dependency is retried sensibly, then the agent stops and explains why — never an infinite loop, never a silently-wrong policy.
- **Human-in-the-loop**: high-risk removals (e.g. `iam:PassRole`) always pause for approval unless explicitly configured otherwise; the agent states its own recommendation and confidence, not just the raw choice.
