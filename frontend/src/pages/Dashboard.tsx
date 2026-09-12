import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type RunStatus, type RunSummary } from '../lib/api'

const STATUS_CLASS: Record<RunStatus, string> = {
  running: 'pill-checking',
  breakage: 'pill-broken',
  awaiting_approval: 'pill-checking',
  converged: 'pill-healthy',
  failed_to_converge: 'pill-broken',
  error: 'pill-broken',
}
const STATUS_LABEL: Record<RunStatus, string> = {
  running: 'Running',
  breakage: 'Breakage',
  awaiting_approval: 'Awaiting approval',
  converged: 'Converged',
  failed_to_converge: 'Failed to converge',
  error: 'Error',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function tick() {
      try {
        const rs = await api.runs()
        if (alive) { setRuns(rs); setError(null) }
      } catch (e) {
        if (alive) setError(String(e))
      }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const converged = runs.filter((r) => r.status === 'converged')
  const permissionsRemoved = converged.reduce((sum, r) => sum + r.trimmed, 0)
  const servicesHealthy = runs.reduce((sum, r) => sum + r.services_healthy, 0)
  const servicesTotal = runs.reduce((sum, r) => sum + r.services_total, 0)
  const avgIter = converged.length ? (converged.reduce((s, r) => s + r.iteration, 0) / converged.length).toFixed(1) : '—'
  const failed = runs.filter((r) => r.status === 'failed_to_converge').length
  const pendingApproval = runs.find((r) => r.status === 'awaiting_approval')

  function openRun(r: RunSummary) {
    if (r.status === 'converged' || r.status === 'failed_to_converge') navigate(`/app/report?run=${r.id}`)
    else navigate(`/app/console?run=${r.id}`)
  }

  return (
    <div style={{ padding: '26px 24px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 5 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Workspace acme-platform · sandbox-prod-mirror · {runs.length} run(s) this session</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/app/new-run')}>New Run</button>
      </div>

      {error && (
        <div style={{ border: '1px solid rgb(var(--broken-rgb) / .35)', background: 'rgb(var(--broken-rgb) / .06)', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: 'var(--broken)' }}>
          Could not reach the agent backend at http://localhost:8000 — start it with <code className="mono">uvicorn app.main:app --reload</code>.
        </div>
      )}

      {runs.length === 0 && !error ? (
        <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 16, padding: '72px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--sunken)' }}>
          <div style={{ width: 44, height: 44, border: '1px solid var(--healthy-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, background: 'var(--healthy)', animation: 'lp-pulse 2s ease-in-out infinite' }} />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>No runs yet</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', maxWidth: 400, lineHeight: 1.6, marginBottom: 22 }}>Connect a sandbox mirror, pick a role, and the agent will trim it to minimum permissions — proving each removal before it ships.</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/new-run')}>Start first run</button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginBottom: 22 }}>
            <div className="card card-pad">
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>Permissions Removed</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>{permissionsRemoved}</span></div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>Services Protected</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>{servicesHealthy}</span><span className="mono" style={{ fontSize: 11, color: 'var(--subtle)' }}>of {servicesTotal}</span></div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>Runs Completed</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>{converged.length + failed}</span><span className="mono" style={{ fontSize: 11, color: 'var(--broken)' }}>{failed} failed</span></div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>Avg Iterations to Converge</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>{avgIter}</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: pendingApproval ? 'minmax(0,2.2fr) minmax(0,1fr)' : '1fr', gap: 12 }}>
            <div className="card" style={{ overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Recent runs</span>
                <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/app/history')}>View all →</span>
              </div>
              <div className="table-head" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1.2fr) 96px 80px 110px', gap: 10, minWidth: 620 }}>
                <span>STATUS</span><span>ENVIRONMENT / ROLE</span><span>TRIMMED</span><span>ITER</span><span>ELAPSED</span>
              </div>
              {runs.map((r) => (
                <div key={r.id} className="table-row" onClick={() => openRun(r)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1.2fr) 96px 80px 110px', gap: 10, minWidth: 620, cursor: 'pointer' }}>
                  <span className={`pill ${STATUS_CLASS[r.status]}`} style={{ justifySelf: 'start' }}>{STATUS_LABEL[r.status]}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.role_id}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)' }}>{r.environment_id}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--healthy)' }}>{r.trimmed}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{r.iteration}/{r.max_iterations}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--subtle)' }}>{r.duration ?? `${r.elapsed_seconds}s`}</span>
                </div>
              ))}
            </div>

            {pendingApproval && (
              <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                <div className="card card-pad-sm" style={{ borderColor: 'var(--checking-border)', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--checking)', animation: 'lp-pulse 1.8s ease-in-out infinite' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Awaiting your decision</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 12 }}>{pendingApproval.id} paused on {pendingApproval.role_id} — a high-risk removal needs sign-off.</p>
                  <button className="btn btn-warn-solid" style={{ width: '100%' }} onClick={() => navigate(`/app/console?run=${pendingApproval.id}`)}>Review request</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
