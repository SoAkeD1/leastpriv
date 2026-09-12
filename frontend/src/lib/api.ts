export const API_BASE = "http://localhost:8000"

export interface PolicyAction {
  action: string
  resource: string
}

export type PermTag = "used" | "unused" | "never"

export interface Permission {
  action: string
  tag: PermTag
  note: string
}

export interface Role {
  id: string
  arn: string
  risk: number
  actions: number
  unused: number
  services: string[]
  permissions: Permission[]
}

export interface Environment {
  id: string
  account: string
  region: string
  synced: string
  role_count: number
}

export type EventKind = "THOUGHT" | "TOOL CALL" | "OBSERVATION" | "DECISION" | "REPLAN"

export interface AgentEvent {
  seq: number
  k: EventKind
  t: string
  title: string
  body: string
  bad: boolean
  good: boolean
}

export type RunStatus = "running" | "breakage" | "awaiting_approval" | "converged" | "failed_to_converge" | "error"
export type ServiceStatus = "healthy" | "checking" | "broken"

export interface ServiceHealthOut {
  name: string
  status: ServiceStatus
}

export interface RunSummary {
  id: string
  environment_id: string
  role_id: string
  status: RunStatus
  iteration: number
  max_iterations: number
  trimmed: number
  services_total: number
  services_healthy: number
  started_at: string
  elapsed_seconds: number
  duration: string | null
  risk_reduction: string | null
  before_policy: PolicyAction[]
  current_policy: PolicyAction[]
  service_health: ServiceHealthOut[]
  iteration_log: IterationLogEntry[]
}

export interface ApprovalRequest {
  id: string
  action: string
  resource: string
  reason_for: string[]
  reason_against: string[]
  confidence: number
  agent_note: string
}

export type EvidenceAction = "Removed" | "Narrowed" | "Scoped" | "Restored"

export interface EvidenceRow {
  permission: string
  action: EvidenceAction
  scoped_to: string
  justification: string
  evidence: string
  confidence: number
}

export interface IterationLogEntry {
  n: number
  ok: boolean
  title: string
  body: string
}

export interface RunReport {
  run_id: string
  role_id: string
  environment_id: string
  status: RunStatus
  before_action_count: number
  after_action_count: number
  before_risk: number
  after_risk: number
  permissions_removed: number
  services_preserved: string
  iterations: number
  total_runtime: string
  risk_reduction: string
  before_policy: PolicyAction[]
  after_policy: PolicyAction[]
  evidence: EvidenceRow[]
  iteration_log: IterationLogEntry[]
}

export interface RunConfigInput {
  environment_id: string
  role_id: string
  aggressiveness?: number
  max_iterations?: number
  require_approval?: boolean
  protected_resources?: string[]
  analysis_window_days?: number
  replay_window_days?: number
  model?: string
}

export type ApprovalDecisionInput = {
  decision: "approve" | "reject" | "approve_modified"
  scoped_resource?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  environments: () => request<Environment[]>("/api/environments"),
  roles: (environmentId: string) => request<Role[]>(`/api/environments/${environmentId}/roles`),
  role: (roleId: string) => request<Role>(`/api/roles/${roleId}`),
  createRun: (config: RunConfigInput) =>
    request<RunSummary>("/api/runs", { method: "POST", body: JSON.stringify(config) }),
  runs: () => request<RunSummary[]>("/api/runs"),
  run: (id: string) => request<RunSummary>(`/api/runs/${id}`),
  approval: (id: string) => request<ApprovalRequest | null>(`/api/runs/${id}/approval`),
  decideApproval: (id: string, decision: ApprovalDecisionInput) =>
    request<{ ok: boolean }>(`/api/runs/${id}/approval`, {
      method: "POST",
      body: JSON.stringify(decision),
    }),
  report: (id: string) => request<RunReport>(`/api/runs/${id}/report`),
  eventSource: (id: string) => new EventSource(`${API_BASE}/api/runs/${id}/events`),
}
