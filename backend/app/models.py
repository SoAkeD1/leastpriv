from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

EventKind = Literal["THOUGHT", "TOOL CALL", "OBSERVATION", "DECISION", "REPLAN"]
RunStatus = Literal[
    "running", "breakage", "awaiting_approval", "converged", "failed_to_converge", "error"
]


class PolicyAction(BaseModel):
    action: str
    resource: str = "*"


class Permission(BaseModel):
    action: str
    tag: Literal["used", "unused", "never"]
    note: str


class Role(BaseModel):
    id: str
    arn: str
    risk: int
    actions: int
    unused: int
    services: list[str]
    permissions: list[Permission]


class Environment(BaseModel):
    id: str
    account: str
    region: str
    synced: str
    role_count: int


class AgentEvent(BaseModel):
    seq: int
    k: EventKind
    t: str
    title: str
    body: str
    bad: bool = False
    good: bool = False


class ServiceHealth(BaseModel):
    name: str
    status: Literal["healthy", "checking", "broken"]
    detail: Optional[str] = None
    latency_ms: Optional[int] = None


class ServiceHealthOut(BaseModel):
    name: str
    status: Literal["healthy", "checking", "broken"]


class DiffEntry(BaseModel):
    type: Literal["ctx", "del", "add"]
    text: str


class ApprovalRequest(BaseModel):
    id: str
    action: str
    resource: str
    reason_for: list[str]
    reason_against: list[str]
    confidence: int
    agent_note: str


class EvidenceRow(BaseModel):
    permission: str
    action: Literal["Removed", "Narrowed", "Scoped", "Restored"]
    scoped_to: str
    justification: str
    evidence: str
    confidence: int


class IterationLogEntry(BaseModel):
    n: int
    ok: bool
    title: str
    body: str


class RunConfig(BaseModel):
    environment_id: str
    role_id: str
    aggressiveness: int = Field(default=65, ge=0, le=100)
    max_iterations: int = Field(default=8, ge=1, le=20)
    require_approval: bool = True
    protected_resources: list[str] = Field(default_factory=list)
    analysis_window_days: int = 90
    replay_window_days: int = 180
    model: str = "claude-opus-4-6"


class RunSummary(BaseModel):
    id: str
    environment_id: str
    role_id: str
    status: RunStatus
    iteration: int
    max_iterations: int
    trimmed: int
    services_total: int
    services_healthy: int
    started_at: str
    elapsed_seconds: int
    duration: Optional[str] = None
    risk_reduction: Optional[str] = None
    before_policy: list[PolicyAction] = Field(default_factory=list)
    current_policy: list[PolicyAction] = Field(default_factory=list)
    service_health: list[ServiceHealthOut] = Field(default_factory=list)
    iteration_log: list[IterationLogEntry] = Field(default_factory=list)


class RunReport(BaseModel):
    run_id: str
    role_id: str
    environment_id: str
    status: RunStatus
    before_action_count: int
    after_action_count: int
    before_risk: int
    after_risk: int
    permissions_removed: int
    services_preserved: str
    iterations: int
    total_runtime: str
    risk_reduction: str
    before_policy: list[PolicyAction]
    after_policy: list[PolicyAction]
    evidence: list[EvidenceRow]
    iteration_log: list[IterationLogEntry]


class ApprovalDecision(BaseModel):
    decision: Literal["approve", "reject", "approve_modified"]
    scoped_resource: Optional[str] = None
