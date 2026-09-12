import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type PolicyAction, type RunReport } from '../lib/api'
import { useToast } from '../lib/toast'

const ACTION_COLOR: Record<string, { fg: string; bd: string }> = {
  Removed: { fg: 'var(--broken)', bd: 'rgb(var(--broken-rgb) / .30)' },
  Narrowed: { fg: 'var(--diff)', bd: 'rgb(var(--diff-rgb) / .30)' },
  Scoped: { fg: 'var(--accent)', bd: 'rgb(var(--accent-rgb) / .30)' },
  Restored: { fg: 'var(--healthy)', bd: 'rgb(var(--healthy-rgb) / .30)' },
}

function policyJson(policy: PolicyAction[]): string {
  const lines = policy.map((pa) => `    "${pa.action}" on "${pa.resource}"`)
  return `{\n  "Effect": "Allow",\n  "Action": [\n${lines.join(',\n')}\n  ]\n}`
}

export default function Report() {
  const { fire } = useToast()
  const [params] = useSearchParams()
  const runId = params.get('run')
  const [report, setReport] = useState<RunReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!runId) return
    api.report(runId).then(setReport).catch((e) => setError(String(e)))
  }, [runId])

  if (!runId) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--subtle)' }}>No run selected. Open a run from the Dashboard or Run History.</div>
  }
  if (error) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--broken)' }}>Could not load report: {error}</div>
  }
  if (!report) {
    return <div style={{ padding: 48, color: 'var(--subtle)' }}>Loading report…</div>
  }

  const isConverged = report.status === 'converged'

  return (
    <div style={{ padding: '26px 24px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Run report · {report.run_id}</h1>
            <span className={`pill ${isConverged ? 'pill-healthy' : 'pill-broken'}`}>{isConverged ? 'Converged' : 'Failed to converge'}</span>
          </div>
          <p className="mono" style={{ fontSize: 12, color: 'var(--subtle)' }}>{report.role_id} · {report.environment_id} · heuristic agent</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fire('success', 'Policy exported', `${report.role_id}-final.json downloaded`)}>Export JSON</button>
          <button className="btn btn-secondary btn-sm">Export PDF</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: '15px 17px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 7 }}>Permissions removed</div><div style={{ fontSize: 26, fontWeight: 600, color: 'var(--healthy)', letterSpacing: '-0.03em' }}>{report.permissions_removed}</div></div>
        <div className="card" style={{ padding: '15px 17px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 7 }}>Services preserved</div><div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{report.services_preserved}</div></div>
        <div className="card" style={{ padding: '15px 17px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 7 }}>Iterations</div><div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{report.iterations}</div></div>
        <div className="card" style={{ padding: '15px 17px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 7 }}>Total runtime</div><div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{report.total_runtime}</div></div>
        <div className="card" style={{ padding: '15px 17px', borderColor: isConverged ? 'var(--healthy-border)' : 'var(--broken-border)' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 7 }}>Risk reduction</div><div style={{ fontSize: 26, fontWeight: 600, color: isConverged ? 'var(--healthy)' : 'var(--broken)', letterSpacing: '-0.03em' }}>{report.risk_reduction}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Before · {report.before_action_count} actions</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--broken)' }}>risk {report.before_risk}</span>
          </div>
          <pre className="mono" style={{ fontSize: 11.5, lineHeight: 1.75, color: 'var(--muted)', padding: '12px 14px', background: 'var(--sunken)', margin: 0, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {policyJson(report.before_policy)}
          </pre>
        </div>
        <div className="card" style={{ overflow: 'hidden', borderColor: isConverged ? 'var(--healthy-border)' : 'var(--broken-border)' }}>
          <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isConverged ? 'rgb(var(--healthy-rgb) / .05)' : 'rgb(var(--broken-rgb) / .05)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>After · {report.after_action_count} actions</span>
            <span className="mono" style={{ fontSize: 10.5, color: isConverged ? 'var(--healthy)' : 'var(--broken)' }}>risk {report.after_risk}</span>
          </div>
          <pre className="mono" style={{ fontSize: 11.5, lineHeight: 1.75, color: 'var(--muted)', padding: '12px 14px', background: 'var(--sunken)', margin: 0, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {policyJson(report.after_policy)}
          </pre>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Evidence table</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)' }}>{report.evidence.length} change(s)</span>
        </div>
        <div className="table-head" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) 96px minmax(0,1.1fr) minmax(0,1.6fr) minmax(0,1fr) 120px', gap: 10, minWidth: 860 }}>
          <span>PERMISSION</span><span>ACTION</span><span>SCOPED TO</span><span>JUSTIFICATION</span><span>EVIDENCE</span><span>CONFIDENCE</span>
        </div>
        {report.evidence.map((e, i) => {
          const ac = ACTION_COLOR[e.action]
          const confFg = e.confidence >= 95 ? 'var(--healthy)' : e.confidence >= 90 ? 'var(--checking)' : 'var(--muted)'
          return (
            <div key={i} className="table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) 96px minmax(0,1.1fr) minmax(0,1.6fr) minmax(0,1fr) 120px', gap: 10, minWidth: 860 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.permission}</span>
              <span style={{ justifySelf: 'start', fontSize: 10.5, fontWeight: 500, padding: '2px 8px', borderRadius: 100, border: `1px solid ${ac.bd}`, color: ac.fg }}>{e.action}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.scoped_to}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>{e.justification}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{e.evidence}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 3, background: 'var(--border-soft)', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${e.confidence}%`, height: '100%', background: confFg }} /></div>
                <span className="mono" style={{ fontSize: 11, color: confFg }}>{e.confidence}</span>
              </div>
            </div>
          )
        })}
        {report.evidence.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>No changes were applied — see the iteration log below.</div>
        )}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13.5, fontWeight: 600 }}>Iteration log</div>
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          {report.iteration_log.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${s.ok ? 'var(--healthy-border)' : 'var(--broken-border)'}`, background: s.ok ? 'rgb(var(--healthy-rgb) / .10)' : 'rgb(var(--broken-rgb) / .10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: s.ok ? 'var(--healthy)' : 'var(--broken)' }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
