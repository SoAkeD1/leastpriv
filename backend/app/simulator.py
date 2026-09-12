"""The sandboxed synthetic cloud: policy matching, log queries, and replay simulation.

This is the "environment" the agent observes and acts on. Nothing here calls
an LLM -- it is a plain deterministic model, which is what lets `simulate()`
serve as an objective, reproducible verifier instead of a self-graded opinion.
"""
from __future__ import annotations

from dataclasses import dataclass

from . import seed_data as sd
from .models import Permission, PolicyAction, Role, Environment


# ---------------------------------------------------------------------------
# Policy matching
# ---------------------------------------------------------------------------

def action_matches(pattern: str, action: str) -> bool:
    if pattern == "*" or pattern == action:
        return True
    if pattern.endswith(":*"):
        return action.startswith(pattern[:-1])
    return False


def resource_matches(pattern: str, resource: str) -> bool:
    if pattern in ("*", None) or pattern == resource:
        return True
    if pattern.endswith("/*"):
        return resource.startswith(pattern[:-1])
    return False


def policy_allows(policy: list[PolicyAction], action: str, resource: str) -> bool:
    return any(
        action_matches(pa.action, action) and resource_matches(pa.resource, resource)
        for pa in policy
    )


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def human_count(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M".replace(".0M", "M")
    if n >= 1_000:
        return f"{n / 1_000:.1f}k".replace(".0k", "k")
    return str(n)


# ---------------------------------------------------------------------------
# Environments & roles
# ---------------------------------------------------------------------------

def list_environments() -> list[Environment]:
    out = []
    for env in sd.ENVIRONMENTS:
        role_count = sum(1 for r in sd.ROLES.values() if r.environment_id == env["id"])
        out.append(Environment(
            id=env["id"], account=env["account"], region=env["region"],
            synced=env["synced"], role_count=role_count,
        ))
    return out


def current_policy(role_id: str) -> list[PolicyAction]:
    seed = sd.ROLES[role_id]
    return [PolicyAction(action=p.action, resource=p.resource) for p in seed.current_policy]


def classify_action(role_id: str, action: str, window_days: int = 90) -> tuple[str, str, int]:
    """Returns (tag, note, recent_count) for one action across all its resources."""
    all_time = [e for e in sd.TRAFFIC_LOG if e.role_id == role_id and e.action == action]
    if not all_time:
        return "never", "0 calls ever", 0

    recent = [e for e in all_time if e.age_days <= window_days and not e.logging_disabled]
    recent_count = sum(e.count for e in recent)
    if recent_count > 0:
        newest = min(e.age_days for e in recent)
        return "used", f"{human_count(recent_count)} calls · {window_days}d", recent_count

    if any(e.logging_disabled for e in all_time):
        return "unused", "0 calls · logging gap", 0

    oldest_visible = min(e.age_days for e in all_time)
    return "unused", f"0 calls · {window_days}d (seen at {oldest_visible}d)", 0


def role_permissions(role_id: str, window_days: int = 90) -> list[Permission]:
    seed = sd.ROLES[role_id]
    perms: list[Permission] = []
    seen_actions: set[str] = set()

    for pa in seed.current_policy:
        if pa.action.endswith(":*"):
            prefix = pa.action[:-1]
            observed = sorted({
                e.action for e in sd.TRAFFIC_LOG
                if e.role_id == role_id and e.action.startswith(prefix)
            })
            for act in observed:
                if act in seen_actions:
                    continue
                seen_actions.add(act)
                tag, note, _ = classify_action(role_id, act, window_days)
                perms.append(Permission(action=act, tag=tag, note=note))
            wildcard_tag = "used" if observed else "never"
            perms.append(Permission(
                action=pa.action, tag=wildcard_tag,
                note=(f"wildcard · only {len(observed)} of many actions observed"
                      if observed else "wildcard · 0 calls observed"),
            ))
            continue

        if pa.action in seen_actions:
            continue
        seen_actions.add(pa.action)
        tag, note, _ = classify_action(role_id, pa.action, window_days)
        perms.append(Permission(action=pa.action, tag=tag, note=note))

    return perms


def compute_risk(role_id: str) -> int:
    perms = role_permissions(role_id)
    if not perms:
        return 0
    unused = sum(1 for p in perms if p.tag in ("unused", "never"))
    risk = int(70 * unused / len(perms))
    seed = sd.ROLES[role_id]
    if any(pa.action in sd.HIGH_RISK_ACTIONS for pa in seed.current_policy):
        risk += 15
    if any(pa.action.endswith(":*") for pa in seed.current_policy):
        risk += 10
    return min(99, risk)


def get_role(role_id: str) -> Role:
    seed = sd.ROLES[role_id]
    perms = role_permissions(role_id)
    services = sorted({e.service for e in sd.TRAFFIC_LOG if e.role_id == role_id})
    return Role(
        id=seed.id, arn=seed.arn, risk=compute_risk(role_id),
        actions=len(seed.current_policy), unused=sum(1 for p in perms if p.tag in ("unused", "never")),
        services=services, permissions=perms,
    )


def list_roles(environment_id: str) -> list[Role]:
    return [get_role(r.id) for r in sd.ROLES.values() if r.environment_id == environment_id]


# ---------------------------------------------------------------------------
# Tools the agent calls
# ---------------------------------------------------------------------------

@dataclass
class AccessSummaryRow:
    action: str
    resource: str
    count: int
    last_seen_days_ago: int


def access_summary(role_id: str, window_days: int = 90) -> list[AccessSummaryRow]:
    rows: dict[tuple[str, str], AccessSummaryRow] = {}
    for e in sd.ACCESS_LOG:
        if e.role_id != role_id or e.age_days > window_days:
            continue
        key = (e.action, e.resource)
        if key not in rows:
            rows[key] = AccessSummaryRow(e.action, e.resource, 0, e.age_days)
        rows[key].count += e.count
        rows[key].last_seen_days_ago = min(rows[key].last_seen_days_ago, e.age_days)
    return sorted(rows.values(), key=lambda r: -r.count)


@dataclass
class QueryMatch:
    resource: str
    count: int
    age_days: int


def query_access(role_id: str, action: str, resource: str | None = None, window_days: int = 200) -> list[QueryMatch]:
    """Deep-dive lookup against CloudTrail (ACCESS_LOG) -- still blind to logging gaps."""
    out = []
    for e in sd.ACCESS_LOG:
        if e.role_id != role_id or e.action != action or e.age_days > window_days:
            continue
        if resource and not resource_matches(resource, e.resource) and e.resource != resource:
            continue
        out.append(QueryMatch(resource=e.resource, count=e.count, age_days=e.age_days))
    return out


@dataclass
class Denial:
    service: str
    action: str
    resource: str
    age_days: int
    count: int
    unmirrorable: bool


@dataclass
class SimResult:
    services: dict[str, str]          # service -> "healthy" | "broken"
    denials: list[Denial]
    replayed_calls: int
    services_total: int
    services_healthy: int


def simulate(role_id: str, candidate_policy: list[PolicyAction], replay_window_days: int = 180) -> SimResult:
    events = [e for e in sd.TRAFFIC_LOG if e.role_id == role_id and e.age_days <= replay_window_days]
    denials: list[Denial] = []
    broken_services: set[str] = set()
    replayed = 0

    for e in events:
        replayed += e.count
        allowed = (not e.unmirrorable) and policy_allows(candidate_policy, e.action, e.resource)
        if not allowed:
            denials.append(Denial(
                service=e.service, action=e.action, resource=e.resource,
                age_days=e.age_days, count=e.count, unmirrorable=e.unmirrorable,
            ))
            broken_services.add(e.service)

    all_services = sorted({e.service for e in sd.TRAFFIC_LOG if e.role_id == role_id})
    services = {s: ("broken" if s in broken_services else "healthy") for s in all_services}

    return SimResult(
        services=services, denials=denials, replayed_calls=replayed,
        services_total=len(all_services), services_healthy=len(all_services) - len(broken_services),
    )
