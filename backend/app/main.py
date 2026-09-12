from __future__ import annotations

import asyncio

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import simulator
from .agent import run_heuristic_agent
from .auth import (
    LoginRequest, SignupRequest, TokenResponse, UserOut,
    get_current_user, init_db, login as auth_login, signup as auth_signup,
)
from .models import (
    ApprovalDecision, ApprovalRequest, Environment, Role, RunConfig, RunReport, RunSummary,
    ServiceHealthOut,
)
from .runs import Run, manager

app = FastAPI(title="LeastPriv Agent API", version="0.1.0")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/signup", response_model=TokenResponse)
def signup(req: SignupRequest) -> TokenResponse:
    return auth_signup(req)


@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest) -> TokenResponse:
    return auth_login(req)


@app.get("/api/auth/me", response_model=UserOut)
def me(user: UserOut = Depends(get_current_user)) -> UserOut:
    return user


def summarize(run: Run) -> RunSummary:
    before_actions = len({pa.action for pa in run.before_policy}) if run.before_policy else 0
    reference = run.final_policy if run.final_policy is not None else run.current_candidate
    after_actions = len({pa.action for pa in reference}) if reference else before_actions
    trimmed = max(before_actions - after_actions, 0)

    duration = run.elapsed_str() if run.status in ("converged", "failed_to_converge") else None
    risk_reduction = None
    if run.before_risk is not None and run.after_risk is not None:
        pct = int(100 * (run.before_risk - run.after_risk) / run.before_risk) if run.before_risk else 0
        risk_reduction = f"-{pct}%"

    return RunSummary(
        id=run.id, environment_id=run.config.environment_id, role_id=run.config.role_id,
        status=run.status, iteration=run.iteration, max_iterations=run.config.max_iterations,
        trimmed=trimmed, services_total=run.services_total, services_healthy=run.services_healthy,
        started_at=run.started_at_iso, elapsed_seconds=run.elapsed_seconds(),
        duration=duration, risk_reduction=risk_reduction,
        before_policy=run.before_policy, current_policy=run.current_candidate,
        service_health=[ServiceHealthOut(name=n, status=s) for n, s in sorted(run.service_status.items())],
        iteration_log=run.iteration_log,
    )


@app.get("/api/environments", response_model=list[Environment])
def get_environments(user: UserOut = Depends(get_current_user)) -> list[Environment]:
    return simulator.list_environments()


@app.get("/api/environments/{environment_id}/roles", response_model=list[Role])
def get_roles(environment_id: str, user: UserOut = Depends(get_current_user)) -> list[Role]:
    roles = simulator.list_roles(environment_id)
    if not roles:
        raise HTTPException(404, "environment not found or has no roles")
    return roles


@app.get("/api/roles/{role_id}", response_model=Role)
def get_role(role_id: str, user: UserOut = Depends(get_current_user)) -> Role:
    try:
        return simulator.get_role(role_id)
    except KeyError:
        raise HTTPException(404, "role not found")


@app.post("/api/runs", response_model=RunSummary)
async def create_run(config: RunConfig, user: UserOut = Depends(get_current_user)) -> RunSummary:
    if config.role_id not in [r.id for e in simulator.list_environments() for r in simulator.list_roles(e.id)]:
        raise HTTPException(404, "role not found")
    run = manager.create(config, owner_id=user.id)
    run.task = asyncio.create_task(run_heuristic_agent(run))
    return summarize(run)


@app.get("/api/runs", response_model=list[RunSummary])
def list_runs(user: UserOut = Depends(get_current_user)) -> list[RunSummary]:
    return [summarize(r) for r in manager.list() if r.owner_id == user.id]


@app.get("/api/runs/{run_id}", response_model=RunSummary)
def get_run(run_id: str, user: UserOut = Depends(get_current_user)) -> RunSummary:
    run = manager.get(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    return summarize(run)


@app.get("/api/runs/{run_id}/approval", response_model=ApprovalRequest | None)
def get_pending_approval(run_id: str, user: UserOut = Depends(get_current_user)) -> ApprovalRequest | None:
    run = manager.get(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    return run.pending_approval


@app.post("/api/runs/{run_id}/approval")
def post_approval(run_id: str, decision: ApprovalDecision, user: UserOut = Depends(get_current_user)) -> dict:
    run = manager.get(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    if not run.pending_approval:
        raise HTTPException(409, "no approval pending on this run")
    manager.resolve_approval(run, decision)
    return {"ok": True}


@app.get("/api/runs/{run_id}/report", response_model=RunReport)
def get_report(run_id: str, user: UserOut = Depends(get_current_user)) -> RunReport:
    run = manager.get(run_id)
    if not run:
        raise HTTPException(404, "run not found")
    if run.status not in ("converged", "failed_to_converge"):
        raise HTTPException(409, "run has not finished yet")

    before_actions = len({pa.action for pa in run.before_policy})
    final = run.final_policy or run.current_candidate or run.before_policy
    after_actions = len({pa.action for pa in final})

    return RunReport(
        run_id=run.id, role_id=run.config.role_id, environment_id=run.config.environment_id,
        status=run.status, before_action_count=before_actions, after_action_count=after_actions,
        before_risk=run.before_risk or simulator.compute_risk(run.config.role_id),
        after_risk=run.after_risk or (run.before_risk or 0),
        permissions_removed=max(before_actions - after_actions, 0),
        services_preserved=f"{run.services_healthy} / {run.services_total}",
        iterations=run.iteration, total_runtime=run.elapsed_str(),
        risk_reduction=summarize(run).risk_reduction or "0%",
        before_policy=run.before_policy, after_policy=final,
        evidence=run.evidence, iteration_log=run.iteration_log,
    )


@app.get("/api/runs/{run_id}/events")
async def stream_events(run_id: str, user: UserOut = Depends(get_current_user)):
    run = manager.get(run_id)
    if not run:
        raise HTTPException(404, "run not found")

    async def gen():
        for event in run.events:
            yield f"data: {event.model_dump_json()}\n\n"
        if run.status in ("converged", "failed_to_converge"):
            yield "event: done\ndata: {}\n\n"
            return

        q = manager.subscribe(run)
        try:
            while True:
                event = await asyncio.wait_for(q.get(), timeout=30)
                yield f"data: {event.model_dump_json()}\n\n"
                if run.status in ("converged", "failed_to_converge") and q.empty():
                    yield "event: done\ndata: {}\n\n"
                    return
        except asyncio.TimeoutError:
            yield ": keep-alive\n\n"
        finally:
            manager.unsubscribe(run, q)

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}
