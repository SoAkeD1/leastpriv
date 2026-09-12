import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, type AgentEvent, type ApprovalRequest, type RunSummary } from '../lib/api'
import { buildLiveDiff, diffCounts, diffStyle } from '../lib/diffLines'
import { ApprovalModal } from '../components/ApprovalModal'
import { useToast } from '../lib/toast'

const KIND_COLOR: Record<string, string> = {
  THOUGHT: 'var(--accent)',
  'TOOL CALL': 'var(--diff)',
  OBSERVATION: 'var(--muted)',
  DECISION: 'var(--healthy)',
  REPLAN: 'var(--checking)',
}

const STATUS_META: Record<string, { label: string; fg: string; bd: string; bg: string }> = {
  running: { label: 'RUNNING', fg: 'var(--checking)', bd: 'var(--checking-border)', bg: 'rgb(var(--checking-rgb) / .10)' },
  breakage: { label: 'BREAKAGE DETECTED', fg: 'var(--broken)', bd: 'var(--broken)', bg: 'rgb(var(--broken-rgb) / .14)' },
  awaiting_approval: { label: 'AWAITING APPROVAL', fg: 'var(--checking)', bd: 'var(--checking-border)', bg: 'rgb(var(--checking-rgb) / .10)' },
  converged: { label: 'CONVERGED', fg: 'var(--healthy)', bd: 'var(--healthy-border)', bg: 'rgb(var(--healthy-rgb) / .10)' },
  failed_to_converge: { label: 'FAILED TO CONVERGE', fg: 'var(--broken)', bd: 'var(--broken)', bg: 'rgb(var(--broken-rgb) / .14)' },
  error: { label: 'ERROR', fg: 'var(--broken)', bd: 'var(--broken)', bg: 'rgb(var(--broken-rgb) / .14)' },
}

const QUICK_SCENARIOS = [
  { role: 'checkout-svc-role', label: 'Checkout runtime cleanup', desc: 'Breakage → diagnosis → converges', requireApproval: false },
  { role: 'ci-deploy-role', label: 'CI deploy role', desc: 'Pauses for human approval', requireApproval: true },
  { role: 'data-lake-admin', label: 'Data lake admin', desc: 'Unresolvable dependency', requireApproval: false, maxIterations: 4 },
]

function fmt(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `00:${m}:${s}`
}

export default function Console() {
  const navigate = useNavigate()
  const { fire } = useToast()
  const [params, setParams] = useSearchParams()
  const runId = params.get('run')

  const [run, setRun] = useState<RunSummary | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [approval, setApproval] = useState<ApprovalRequest | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [starting, setStarting] = useState(false)
  const streamRef = useRef<HTMLDivElement>(null)
  const seenSeq = useRef<Set<number>>(new Set())

  const appendEvent = useCallback((e: AgentEvent) => {
    if (seenSeq.current.has(e.seq)) return
    seenSeq.current.add(e.seq)
    setEvents((prev) => [...prev, e].sort((a, b) => a.seq - b.seq))
  }, [])

  // SSE stream
  useEffect(() => {
    if (!runId) return
    setEvents([])
    seenSeq.current = new Set()
    setNotFound(false)
    const es = api.eventSource(runId)
    es.onmessage = (msg) => {
      try { appendEvent(JSON.parse(msg.data) as AgentEvent) } catch { /* ignore keep-alive */ }
    }
    es.addEventListener('done', () => es.close())
    es.onerror = () => { /* browser auto-retries; backend closes cleanly on completion */ }
    return () => es.close()
  }, [runId, appendEvent])

  // Poll run summary
  useEffect(() => {
    if (!runId) return
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    async function tick() {
      try {
        const r = await api.run(runId!)
        if (!alive) return
        setRun(r)
        if (r.status === 'awaiting_approval') {
          const a = await api.approval(runId!)
          if (alive) setApproval(a)
        } else {
          setApproval(null)
        }
        if (r.status === 'running' || r.status === 'breakage' || r.status === 'awaiting_approval') {
          timer = setTimeout(tick, 900)
        }
      } catch {
        if (alive) setNotFound(true)
      }
    }
    tick()
    return () => { alive = false; clearTimeout(timer) }
  }, [runId])

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [events])

  async function startScenario(s: typeof QUICK_SCENARIOS[number]) {
    setStarting(true)
    try {
      const created = await api.createRun({
        environment_id: 'sandbox-prod-mirror',
        role_id: s.role,
        require_approval: s.requireApproval,
        max_iterations: s.maxIterations ?? 8,
      })
      fire('success', 'Run started', `${created.id} · ${s.role}`)
      setParams({ run: created.id })
    } catch (e) {
      fire('error', 'Could not start run', String(e))
    } finally {
      setStarting(false)
    }
  }

  async function decide(decision: 'approve' | 'reject' | 'approve_modified', scopedResource?: string) {
    if (!runId) return
    try {
      await api.decideApproval(runId, { decision, scoped_resource: scopedResource })
      setApproval(null)
    } catch (e) {
      fire('error', 'Could not submit decision', String(e))
    }
  }

  if (!runId) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 780, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>Agent Console</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 24 }}>No run selected. Start one of the three reference scenarios below, or configure a custom run.</p>
        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          {QUICK_SCENARIOS.map((s) => (
            <div key={s.role} className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 3 }}>{s.role}</div>
                <div style={{ fontSize: 12.5, color: 'var(--subtle)' }}>{s.label} — {s.desc}</div>
              </div>
              <button className="btn btn-primary btn-sm" disabled={starting} onClick={() => startScenario(s)}>Run</button>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/app/new-run')}>Configure a custom run →</button>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2 style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Can't reach the agent backend</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>Is uvicorn running at localhost:8000? Or this run id may no longer exist.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setParams({})}>← Back to scenarios</button>
      </div>
    )
  }

  if (!run) {
    return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,400px) minmax(0,1fr)', gap: 10, padding: '12px 20px', minHeight: 0 }}>
        <div className="card" style={{ padding: 16, display: 'grid', gap: 10, alignContent: 'start' }}>
          <div className="skel" style={{ height: 12, width: '40%' }} />
          <div className="skel" style={{ height: 64, borderRadius: 10 }} />
          <div className="skel" style={{ height: 84, borderRadius: 10 }} />
        </div>
      </div>
    )
  }

  const status = STATUS_META[run.status]
  const diff = buildLiveDiff(run.before_policy, run.current_policy)
  const counts = diffCounts(run.before_policy, run.current_policy)
  const healthFg = run.services_healthy < run.services_total ? 'var(--broken)' : 'var(--healthy)'
  const lastFailed = run.iteration_log.filter((l) => !l.ok).slice(-1)[0]
  const lastEvent = events[events.length - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 49px)', minHeight: 660 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '11px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 12, letterSpacing: '.06em', padding: '5px 11px', borderRadius: 9, border: `1px solid ${status.bd}`, background: status.bg, color: status.fg }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.fg, animation: 'lp-pulse 1.3s ease-in-out infinite' }} />{status.label}
          </span>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink)' }}>{run.id}</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--subtle)' }}>{run.role_id} · {run.environment_id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--subtle)' }}>elapsed <span style={{ color: 'var(--ink)' }}>{fmt(run.elapsed_seconds)}</span></span>
            <span style={{ color: 'var(--subtle)' }}>iteration <span style={{ color: 'var(--ink)' }}>{run.iteration} of {run.max_iterations}</span></span>
            <span style={{ color: 'var(--subtle)' }}>services <span style={{ color: healthFg }}>{run.services_healthy} / {run.services_total} healthy</span></span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setParams({})}>New scenario</button>
        </div>
      </div>

      {run.status === 'breakage' && lastFailed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: 'rgb(var(--broken-rgb) / .12)', borderBottom: '1px solid var(--broken)', animation: 'lp-in .25s ease-out' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--broken)', animation: 'lp-pulse 1s ease-in-out infinite', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--broken-deep)', letterSpacing: '-0.01em' }}>{lastFailed.title}</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--broken-text)', marginTop: 3 }}>{lastFailed.body}</div>
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--broken-deep)', border: '1px solid rgb(var(--broken-rgb) / .45)', padding: '4px 9px', borderRadius: 8, whiteSpace: 'nowrap' }}>agent diagnosing · no rollback</span>
        </div>
      )}
      {run.status === 'converged' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: 'rgb(var(--healthy-rgb) / .10)', borderBottom: '1px solid var(--healthy-border)', animation: 'lp-in .25s ease-out' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--healthy)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--healthy-deep)', letterSpacing: '-0.01em' }}>Converged at iteration {run.iteration} — {run.trimmed} action(s) trimmed, 0 services broken</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--healthy-text)', marginTop: 3 }}>blast radius {run.risk_reduction ?? ''} · {run.services_healthy}/{run.services_total} services healthy</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/app/report?run=${run.id}`)}>View Report →</button>
        </div>
      )}
      {run.status === 'failed_to_converge' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: 'rgb(var(--broken-rgb) / .12)', borderBottom: '1px solid var(--broken)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--broken)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--broken-deep)' }}>Could not converge after {run.max_iterations} iterations</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--broken-text)', marginTop: 3 }}>No policy change was applied — see the reasoning stream for the unresolved dependency.</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setParams({})}>Try another scenario</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,400px) minmax(0,1fr)', gap: 10, padding: '12px 20px 0', minHeight: 0 }}>
        {/* Panel A */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--accent)' }}>PANEL A</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Agent reasoning</span>
            </div>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)' }}>
              {run.status === 'running' || run.status === 'breakage' ? 'streaming ▍' : `${events.length} events`}
            </span>
          </div>
          <div ref={streamRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'grid', gap: 8, alignContent: 'start' }}>
            {events.map((e) => {
              const accentColor = e.bad ? 'var(--broken)' : e.good ? 'var(--healthy)' : KIND_COLOR[e.k]
              return (
                <div key={e.seq} className={`event-card${e.bad ? ' bad' : ''}${e.good ? ' good' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="kind-label" style={{ color: KIND_COLOR[e.k], borderColor: 'var(--border)' }}>{e.k}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>{e.t}</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.45, marginBottom: 6 }}>{e.title}</div>
                  <div className="event-body" style={{ borderLeftColor: accentColor }}>{e.body}</div>
                </div>
              )
            })}
            {events.length === 0 && <div style={{ color: 'var(--faint)', fontSize: 12.5 }}>Connecting to agent stream…</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: 'minmax(0,1.15fr) minmax(0,1fr)', gap: 10, minHeight: 0 }}>
          {/* Panel B */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--accent)' }}>PANEL B</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Service health grid</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--healthy)' }} />Healthy</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--checking)' }} />Checking</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--broken)' }} />Broken</span>
                </div>
                <span className="mono" style={{ fontWeight: 600, fontSize: 13, color: healthFg }}>{run.services_healthy} / {run.services_total}</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
                {run.service_health.map((s) => (
                  <div key={s.name} className={`svc-tile ${s.status}`}>
                    <div className="svc-tile-head">
                      <span className="svc-dot" style={{ background: s.status === 'broken' ? 'var(--broken)' : s.status === 'checking' ? 'var(--checking)' : 'var(--healthy)' }} />
                      <span className="svc-name">{s.name}</span>
                    </div>
                    <div className="svc-row">
                      <span className="svc-status" style={{ color: s.status === 'broken' ? 'var(--broken)' : s.status === 'checking' ? 'var(--checking)' : 'var(--healthy)' }}>{s.status.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                {run.service_health.length === 0 && <div style={{ color: 'var(--faint)', fontSize: 12.5 }}>No service data yet.</div>}
              </div>
            </div>
          </div>

          {/* Panel C */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--diff)' }}>PANEL C</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Live policy diff</span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)' }}>{run.role_id}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
                <span style={{ color: 'var(--broken)' }}>−{counts.removed}</span><span style={{ color: 'var(--healthy)' }}>+{counts.added}</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '10px 0', background: 'var(--sunken)' }}>
              {diff.map((d, i) => {
                const s = diffStyle(d.t)
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 6, padding: '1px 12px', background: s.bg, fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.7 }}>
                    <span style={{ color: s.fg, textAlign: 'center' }}>{s.sign}</span>
                    <span style={{ color: s.fg, textDecoration: s.deco, whiteSpace: 'pre' }}>{d.x}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Panel D */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderTop: '1px solid var(--border-soft)', marginTop: 12, background: 'var(--surface)', flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--subtle)' }}>PANEL D · ITERATIONS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
          {run.iteration_log.map((it, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, border: `1px solid ${it.ok ? 'var(--healthy-border)' : 'var(--broken-border)'}`, background: it.ok ? 'rgb(var(--healthy-rgb) / .10)' : 'rgb(var(--broken-rgb) / .10)', borderRadius: 100, padding: '5px 12px 5px 6px' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: `1px solid ${it.ok ? 'var(--healthy-border)' : 'var(--broken-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: it.ok ? 'var(--healthy)' : 'var(--broken)' }}>{it.n}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{it.title}</span>
            </span>
          ))}
          {(run.status === 'running' || run.status === 'breakage' || run.status === 'awaiting_approval') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid var(--checking-border)', background: 'rgb(var(--checking-rgb) / .10)', borderRadius: 100, padding: '5px 12px 5px 6px' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--checking-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--checking)' }}>{run.iteration || 1}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{lastEvent?.title ?? 'working…'}</span>
            </span>
          )}
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--subtle)' }}>budget {run.max_iterations} · stop when minimal + green</span>
      </div>

      {approval && <ApprovalModal request={approval} onDecide={decide} onClose={() => {}} />}
    </div>
  )
}
