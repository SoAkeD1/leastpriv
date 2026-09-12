"""Synthetic cloud environment seed data.

Two independent ground truths, deliberately kept separate:

- TRAFFIC_LOG: what services actually call, ever. Used only by `simulate()`
  (the sandbox replay) — this is production reality.
- ACCESS_LOG: derived from TRAFFIC_LOG by dropping any entry whose resource
  has CloudTrail data-event logging disabled. Used by `access_summary()` and
  `query_access()` — this is what an analysis tool can see. No amount of
  window-widening reveals a logging-gap entry; only a sandbox replay does.

This split is what makes single-shot "read the logs and guess" remediation
unsound, and makes iterate-simulate-observe-revise the only strategy that
converges safely.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class TrafficEvent:
    role_id: str
    service: str
    action: str
    resource: str
    age_days: int
    count: int
    logging_disabled: bool = False
    unmirrorable: bool = False


@dataclass
class PolicyActionSeed:
    action: str
    resource: str = "*"


@dataclass
class RoleSeed:
    id: str
    arn: str
    environment_id: str
    current_policy: list[PolicyActionSeed]
    protected_resources: list[str] = field(default_factory=list)


ENVIRONMENTS = [
    {"id": "sandbox-prod-mirror", "account": "4471", "region": "us-east-1", "synced": "14m ago"},
    {"id": "staging-mirror", "account": "4471", "region": "us-east-1", "synced": "2h ago"},
    {"id": "dev-mirror", "account": "4471", "region": "us-west-2", "synced": "1d ago"},
]

ALL_SERVICES = [
    "api-gateway", "checkout-api", "ledger-worker", "auth-svc", "notify-queue",
    "image-proc", "search-index", "billing-cron", "audit-log", "session-store",
    "report-gen", "webhook-relay",
]

ROLES: dict[str, RoleSeed] = {
    "checkout-svc-role": RoleSeed(
        id="checkout-svc-role",
        arn="arn:aws:iam::4471:role/checkout-svc-role",
        environment_id="sandbox-prod-mirror",
        current_policy=[
            PolicyActionSeed("s3:*", "*"),
            PolicyActionSeed("s3:DeleteBucket", "*"),
            PolicyActionSeed("iam:PassRole", "*"),
            PolicyActionSeed("ec2:*", "*"),
            PolicyActionSeed("dynamodb:PutItem", "*"),
            PolicyActionSeed("dynamodb:Query", "*"),
            PolicyActionSeed("dynamodb:Scan", "*"),
            PolicyActionSeed("kms:Decrypt", "*"),
            PolicyActionSeed("sqs:ChangeMessageVisibility", "*"),
        ],
        protected_resources=["prod-ledger-kms-key", "billing-s3-bucket", "org-root-trust-policy"],
    ),
    "ci-deploy-role": RoleSeed(
        id="ci-deploy-role",
        arn="arn:aws:iam::4471:role/ci-deploy-role",
        environment_id="sandbox-prod-mirror",
        current_policy=[
            PolicyActionSeed("ecr:PutImage", "*"),
            PolicyActionSeed("ecs:UpdateService", "*"),
            PolicyActionSeed("iam:CreateRole", "*"),
            PolicyActionSeed("iam:PassRole", "*"),
            PolicyActionSeed("s3:*", "*"),
        ],
    ),
    "ledger-worker-role": RoleSeed(
        id="ledger-worker-role",
        arn="arn:aws:iam::4471:role/ledger-worker-role",
        environment_id="sandbox-prod-mirror",
        current_policy=[
            PolicyActionSeed("sqs:ReceiveMessage", "ledger-queue"),
            PolicyActionSeed("sqs:ChangeMessageVisibility", "ledger-queue"),
            PolicyActionSeed("rds-data:ExecuteStatement", "*"),
            PolicyActionSeed("cloudwatch:PutMetricData", "*"),
        ],
    ),
    "report-gen-role": RoleSeed(
        id="report-gen-role",
        arn="arn:aws:iam::4471:role/report-gen-role",
        environment_id="sandbox-prod-mirror",
        current_policy=[
            PolicyActionSeed("s3:GetObject", "*"),
            PolicyActionSeed("ses:SendEmail", "*"),
            PolicyActionSeed("lambda:InvokeFunction", "*"),
        ],
    ),
    "data-lake-admin": RoleSeed(
        id="data-lake-admin",
        arn="arn:aws:iam::4471:role/data-lake-admin",
        environment_id="sandbox-prod-mirror",
        current_policy=[
            PolicyActionSeed("glue:GetTable", "*"),
            PolicyActionSeed("athena:StartQueryExecution", "*"),
            PolicyActionSeed("sts:AssumeRole", "arn:aws:iam::9981:role/partner-federation"),
            PolicyActionSeed("s3:GetObject", "*"),
        ],
    ),
}

TRAFFIC_LOG: list[TrafficEvent] = [
    # ---- checkout-svc-role: the flagship scenario ----
    TrafficEvent("checkout-svc-role", "checkout-api", "s3:GetObject", "checkout-assets/*", 5, 1_200_000),
    TrafficEvent("checkout-svc-role", "checkout-api", "s3:PutObject", "checkout-assets/*", 7, 340_000),
    TrafficEvent("checkout-svc-role", "checkout-api", "dynamodb:PutItem", "orders-table", 3, 812_000),
    TrafficEvent("checkout-svc-role", "checkout-api", "dynamodb:Query", "orders-table", 2, 95_000),
    # current, actively-rotating key: well within any reasonable window
    TrafficEvent("checkout-svc-role", "checkout-api", "kms:Decrypt", "key/9f2a", 12, 1_204),
    # previous quarter's key: still needed for old tokens, but only every ~100+ days.
    # Present in both logs -- a genuine "your window is too narrow" miss, fixable by widening it.
    TrafficEvent("checkout-svc-role", "checkout-api", "kms:Decrypt", "key/4c81", 110, 3_902),
    # ledger-queue visibility extension during month-end batch reconciliation.
    # CloudTrail data-event logging is OFF for this queue -- no window ever reveals it via logs.
    TrafficEvent(
        "checkout-svc-role", "ledger-worker", "sqs:ChangeMessageVisibility", "ledger-queue",
        15, 640, logging_disabled=True,
    ),
    # s3:*, ec2:*, dynamodb:Scan, s3:DeleteBucket, iam:PassRole: zero traffic, ever (no entries).

    # ---- ci-deploy-role: converges, one high-risk action needs approval ----
    TrafficEvent("ci-deploy-role", "ci-runner", "ecr:PutImage", "*", 2, 4_100),
    TrafficEvent("ci-deploy-role", "ci-runner", "ecs:UpdateService", "*", 3, 980),
    # iam:CreateRole and iam:PassRole: zero traffic -- but PassRole is high-risk, held for approval.
    # s3:* wildcard: zero traffic under it at all.

    # ---- ledger-worker-role: clean single-iteration convergence ----
    TrafficEvent("ledger-worker-role", "ledger-worker", "sqs:ReceiveMessage", "ledger-queue", 1, 6_400_000),
    TrafficEvent("ledger-worker-role", "ledger-worker", "sqs:ChangeMessageVisibility", "ledger-queue", 4, 640_000),
    TrafficEvent("ledger-worker-role", "ledger-worker", "rds-data:ExecuteStatement", "ledger-db", 1, 2_200_000),
    # cloudwatch:PutMetricData: zero traffic.

    # ---- report-gen-role: clean single-iteration convergence ----
    TrafficEvent("report-gen-role", "report-gen", "s3:GetObject", "reports-bucket/*", 3, 44_000),
    TrafficEvent("report-gen-role", "report-gen", "ses:SendEmail", "*", 5, 12_000),
    # lambda:InvokeFunction: zero traffic.

    # ---- data-lake-admin: cannot safely converge ----
    TrafficEvent("data-lake-admin", "athena-federation", "glue:GetTable", "*", 2, 18_000),
    TrafficEvent("data-lake-admin", "athena-federation", "athena:StartQueryExecution", "*", 1, 9_400),
    TrafficEvent("data-lake-admin", "athena-federation", "s3:GetObject", "data-lake/*", 2, 240_000),
    # Cross-account trust the sandbox cannot mirror: every replay against ANY candidate
    # policy fails here, regardless of what the policy allows -- there is no fixture for it.
    TrafficEvent(
        "data-lake-admin", "athena-federation", "sts:AssumeRole",
        "arn:aws:iam::9981:role/partner-federation", 6, 1_100, unmirrorable=True,
    ),
]

ACCESS_LOG: list[TrafficEvent] = [e for e in TRAFFIC_LOG if not e.logging_disabled]

HIGH_RISK_ACTIONS = {"iam:PassRole", "iam:CreateRole", "iam:DeleteRole", "iam:AttachRolePolicy"}
