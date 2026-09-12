import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Environment, type PermTag, type Role } from '../lib/api'

const TAG_CLASS: Record<PermTag, string> = { used: 'tag-used', unused: 'tag-unused', never: 'tag-never' }
const TAG_LABEL: Record<PermTag, string> = { used: 'used recently', unused: 'unused 90d', never: 'never used' }

function riskColor(risk: number) {
  if (risk > 70) return { fg: 'var(--broken)', bd: 'rgb(var(--broken-rgb) / .35)', bg: 'rgb(var(--broken-rgb) / .10)' }
  if (risk > 40) return { fg: 'var(--checking)', bd: 'rgb(var(--checking-rgb) / .35)', bg: 'rgb(var(--checking-rgb) / .10)' }
  return { fg: 'var(--healthy)', bd: 'rgb(var(--healthy-rgb) / .30)', bg: 'rgb(var(--healthy-rgb) / .08)' }
}

export default function Environments() {
  const navigate = useNavigate()
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [envId, setEnvId] = useState('sandbox-prod-mirror')
  const [roles, setRoles] = useState<Role[]>([])
  const [open, setOpen] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.environments().then(setEnvironments).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.roles(envId)
      .then((rs) => { setRoles(rs); setOpen(rs[0]?.id ?? '') })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [envId])

  const env = environments.find((e) => e.id === envId)
  const totalServices = new Set(roles.flatMap((r) => r.services)).size
  const totalResources = roles.reduce((sum, r) => sum + r.actions, 0)
  const wildcardGrants = roles.reduce((sum, r) => sum + r.permissions.filter((p) => p.action.endsWith(':*')).length, 0)

  return (
    <div style={{ padding: '26px 24px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{envId}</h1>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={envId} onChange={(e) => setEnvId(e.target.value)}>
              {environments.map((e) => <option key={e.id} value={e.id}>{e.id}</option>)}
            </select>
          </div>
          <p className="mono" style={{ fontSize: 12, color: 'var(--subtle)' }}>
            acct {env?.account ?? '—'} · {env?.region ?? '—'} · mirrored {env?.synced ?? '—'} · {roles.length} roles · {totalServices} services · {totalResources} resources
          </p>
        </div>
        <button className="btn btn-secondary">Re-sync inventory</button>
      </div>

      {error && (
        <div style={{ border: '1px solid rgb(var(--broken-rgb) / .35)', background: 'rgb(var(--broken-rgb) / .06)', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: 'var(--broken)' }}>
          Could not reach the agent backend at {`http://localhost:8000`} — is it running? ({error})
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card card-pad-sm" style={{ padding: '14px 16px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>Identities / roles</div><div style={{ fontSize: 22, fontWeight: 600 }}>{roles.length}</div></div>
        <div className="card card-pad-sm" style={{ padding: '14px 16px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>Services</div><div style={{ fontSize: 22, fontWeight: 600 }}>{totalServices}</div></div>
        <div className="card card-pad-sm" style={{ padding: '14px 16px' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>Distinct actions</div><div style={{ fontSize: 22, fontWeight: 600 }}>{totalResources}</div></div>
        <div className="card card-pad-sm" style={{ padding: '14px 16px', borderColor: 'rgb(var(--broken-rgb) / .30)' }}><div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>Wildcard grants</div><div style={{ fontSize: 22, fontWeight: 600, color: 'var(--broken)' }}>{wildcardGrants}</div></div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--subtle)', paddingLeft: 2 }}>IDENTITIES</div>
        {loading && <div style={{ color: 'var(--subtle)', fontSize: 13 }}>Loading roles…</div>}
        {!loading && roles.map((r) => {
          const rc = riskColor(r.risk)
          const isOpen = open === r.id
          return (
            <div key={r.id} className="card" style={{ overflow: 'auto' }}>
              <div onClick={() => setOpen(isOpen ? '' : r.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
                <span style={{ color: 'var(--subtle)', fontSize: 11, width: 10 }}>{isOpen ? '▾' : '▸'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>{r.id}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.arn}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{r.actions} actions</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--checking)' }}>{r.unused} unused</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: `1px solid ${rc.bd}`, background: rc.bg, borderRadius: 10, padding: '5px 9px', minWidth: 54 }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: '.06em', color: 'var(--muted)' }}>RISK</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: rc.fg }}>{r.risk}</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--canvas)', padding: '6px 16px 12px' }}>
                  {r.permissions.map((p) => (
                    <div key={p.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--tint)' }}>
                      <span className="mono" style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.action}</span>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)' }}>{p.note}</span>
                      <span className={`tag ${TAG_CLASS[p.tag]}`}>{TAG_LABEL[p.tag]}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-tint btn-sm" onClick={() => navigate(`/app/new-run?env=${envId}&role=${r.id}`)}>Trim this role</button>
                    <button className="btn btn-secondary btn-sm" style={{ background: 'none' }}>View access history</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
