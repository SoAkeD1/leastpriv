from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from .models import (
    AgentEvent, ApprovalDecision, ApprovalRequest, EventKind, EvidenceRow,
    IterationLogEntry, PolicyAction, RunConfig, RunStatus,
)


@dataclass
class Run:
    id: str
    config: RunConfig
    owner_id: str = ""
    status: RunStatus = "running"
    iteration: int = 0
    events: list[AgentEvent] = field(default_factory=list)
    subscribers: list[asyncio.Queue] = field(default_factory=list)
    start_monotonic: float = field(default_factory=time.monotonic)
    started_at_iso: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    pending_approval: ApprovalRequest | None = None
    approval_event: asyncio.Event = field(default_factory=asyncio.Event)
    approval_decision: ApprovalDecision | None = None

    before_policy: list[PolicyAction] = field(default_factory=list)
    current_candidate: list[PolicyAction] = field(default_factory=list)
    final_policy: list[PolicyAction] | None = None
    evidence: list[EvidenceRow] = field(default_factory=list)
    iteration_log: list[IterationLogEntry] = field(default_factory=list)
    services_total: int = 0
    services_healthy: int = 0
    before_risk: int | None = None
    after_risk: int | None = None
    service_status: dict[str, str] = field(default_factory=dict)

    task: asyncio.Task | None = None

    def elapsed_seconds(self) -> int:
        return int(time.monotonic() - self.start_monotonic)

    def elapsed_str(self) -> str:
        s = self.elapsed_seconds()
        return f"00:{s // 60:02d}:{s % 60:02d}"


class RunManager:
    def __init__(self) -> None:
        self.runs: dict[str, Run] = {}

    def create(self, config: RunConfig, owner_id: str = "") -> Run:
        run = Run(id=uuid.uuid4().hex[:8], config=config, owner_id=owner_id)
        self.runs[run.id] = run
        return run

    def get(self, run_id: str) -> Run | None:
        return self.runs.get(run_id)

    def list(self) -> list[Run]:
        return sorted(self.runs.values(), key=lambda r: r.started_at_iso, reverse=True)

    def subscribe(self, run: Run) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        run.subscribers.append(q)
        return q

    def unsubscribe(self, run: Run, q: asyncio.Queue) -> None:
        if q in run.subscribers:
            run.subscribers.remove(q)

    def emit(self, run: Run, kind: EventKind, title: str, body: str, bad: bool = False, good: bool = False) -> AgentEvent:
        event = AgentEvent(
            seq=len(run.events), k=kind, t=run.elapsed_str(), title=title, body=body, bad=bad, good=good,
        )
        run.events.append(event)
        for q in list(run.subscribers):
            q.put_nowait(event)
        return event

    def request_approval(self, run: Run, req: ApprovalRequest) -> None:
        run.pending_approval = req
        run.status = "awaiting_approval"
        run.approval_event.clear()

    def resolve_approval(self, run: Run, decision: ApprovalDecision) -> None:
        run.approval_decision = decision
        run.approval_event.set()


manager = RunManager()
