import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, type Environment, type Role } from '../lib/api'
import { useToast } from '../lib/toast'

export default function NewRun() {
  const navigate = useNavigate()
  const { fire } = useToast()
  const [params] = useSearchParams()

  const [environments, setEnvironments] = useState<Environment[]>([])
  const [envId, setEnvId] = useState(params.get('env') || 'sandbox-prod-mirror')
  const [roles, setRoles] = useState<Role[]>([])
  const [roleId, setRoleId] = useState(params.get('role') || '')
  const [aggressiveness, setAggressiveness] = useState(65)
  const [maxIter, setMaxIter] = useState(8)
  const [requireApproval, setRequireApproval] = useState(true)
  const [protectedResources, setProtectedResources] = useState<string[]>([
    'prod-ledger-kms-key', 'billing-s3-bucket', 'org-root-trust-policy',
  ])
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    api.environments().then(setEnvironments).catch(() => {})
  }, [])

  useEffect(() => {
    api.roles(envId).then((rs) => {
      setRoles(rs)
      if (!rs.find((r) => r.id === roleId)) setRoleId(rs[0]?.id ?? '')
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envId])

  const role = roles.find((r) => r.id === roleId)
  const aggLabel = aggressiveness < 34 ? 'Conservative' : aggressiveness < 67 ? 'Balanced' : 'Aggressive'
  const aggFg = aggressiveness < 34 ? 'var(--healthy)' : aggressiveness < 67 ? 'var(--accent)' : 'var(--checking)'
  const analysisWindow = aggressiveness < 34 ? 120 : aggressiveness < 67 ? 90 : 60
  const aggEst = `analysis window ${analysisWindow}d · narrower window trims more`

  async function startRun() {
    if (!roleId) return
    setStarting(true)
    try {
      const run = await api.createRun({
        environment_id: envId,
        role_id: roleId,
        aggressiveness,
        max_iterations: maxIter,
        require_approval: requireApproval,
        protected_resources: protectedResources,
        analysis_window_days: analysisWindow,
      })
      fire('success', 'Run started', `${run.id} · ${envId} · ${roleId}`)
      navigate(`/app/console?run=${run.id}`)
    } catch (e) {
      fire('error', 'Could not start run', String(e))
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ padding: '26px 24px 48px', maxWidth: 1080 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 5 }}>New run</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22 }}>The agent runs entirely against the sandbox mirror. Nothing reaches your live account until you export.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Environment</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
              {environments.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setEnvId(e.id)}
                  style={{
                    border: envId === e.id ? '1px solid var(--healthy)' : '1px solid var(--border)',
                    background: envId === e.id ? 'rgb(var(--healthy-rgb) / .07)' : 'transparent',
                    borderRadius: 10, padding: '11px 13px', cursor: 'pointer',
                  }}
                >
                  <div className="mono" style={{ fontSize: 12.5, color: envId === e.id ? 'var(--ink)' : 'var(--muted)' }}>{e.id}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)', marginTop: 3 }}>{e.role_count} roles · synced {e.synced}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Role to trim</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
              {roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRoleId(r.id)}
                  style={{
                    border: roleId === r.id ? '1px solid var(--healthy)' : '1px solid var(--border)',
                    background: roleId === r.id ? 'rgb(var(--healthy-rgb) / .07)' : 'transparent',
                    borderRadius: 10, padding: '11px 13px', cursor: 'pointer',
                  }}
                >
                  <div className="mono" style={{ fontSize: 12.5, color: roleId === r.id ? 'var(--ink)' : 'var(--muted)' }}>{r.id}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)', marginTop: 3 }}>{r.actions} actions · {r.unused} unused · risk {r.risk}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>Goal settings</div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Aggressiveness</span>
                <span className="mono" style={{ fontSize: 12, color: aggFg }}>{aggLabel}</span>
              </div>
              <input type="range" min={0} max={100} value={aggressiveness} onChange={(e) => setAggressiveness(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--healthy)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--subtle)', marginTop: 6 }}>
                <span>Conservative</span><span>{aggEst}</span><span>Aggressive</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>Max iterations</div>
                <input type="number" className="input mono" value={maxIter} onChange={(e) => setMaxIter(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>Model</div>
                <select className="input mono" disabled>
                  <option>heuristic agent · deterministic, no API key</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Require human approval for high-risk removals</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>Pauses the loop on privilege-escalation and data-deletion actions.</div>
              </div>
              <div className={`toggle ${requireApproval ? 'on' : 'off'}`} onClick={() => setRequireApproval((v) => !v)}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5 }}>Protected resources</div>
            <div style={{ fontSize: 12.5, color: 'var(--subtle)', marginBottom: 12 }}>The agent must never propose a change touching these.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, border: '1px solid var(--border)', background: 'var(--sunken)', borderRadius: 10, padding: 9 }}>
              {protectedResources.map((r) => (
                <span key={r} className="mono" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, background: 'var(--tint)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '4px 8px' }}>
                  {r}
                  <span style={{ color: 'var(--subtle)', cursor: 'pointer' }} onClick={() => setProtectedResources((prev) => prev.filter((x) => x !== r))}>×</span>
                </span>
              ))}
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--faint)', padding: 4 }}>+ add resource…</span>
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ position: 'sticky', top: 74 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Run preview</div>
          <div style={{ display: 'grid', gap: 9, fontSize: 12.5, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--muted)' }}>Target role</span><span className="mono">{roleId || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--muted)' }}>Candidate actions</span><span className="mono">{role?.actions ?? '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--muted)' }}>Evidence window</span><span className="mono">{analysisWindow}d</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--muted)' }}>Services watched</span><span className="mono">{role?.services.length ?? '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--muted)' }}>Current risk score</span><span className="mono" style={{ color: 'var(--checking)' }}>{role?.risk ?? '—'}</span></div>
          </div>
          <div className="mono" style={{ border: '1px solid var(--border)', background: 'var(--sunken)', borderRadius: 10, padding: 11, fontSize: 11, color: 'var(--subtle)', lineHeight: 1.7, marginBottom: 16 }}>
            read-only on live acct<br />writes confined to sandbox<br />auto-rollback on stop
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={!roleId || starting} onClick={startRun}>
            {starting ? 'Starting…' : 'Run Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}
