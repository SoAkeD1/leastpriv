import { useEffect, useMemo, useState } from 'react'
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

const FILTERS: Array<'All' | RunStatus> = ['All', 'converged', 'awaiting_approval', 'failed_to_converge']

export default function History() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [filter, setFilter] = useState<'All' | RunStatus>('All')

  useEffect(() => {
    let alive = true
    async function tick() {
      try { const rs = await api.runs(); if (alive) setRuns(rs) } catch { /* backend may be offline */ }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const filtered = useMemo(() => (filter === 'All' ? runs : runs.filter((r) => r.status === filter)), [runs, filter])
  const converged = runs.filter((r) => r.status === 'converged').length
  const awaiting = runs.filter((r) => r.status === 'awaiting_approval').length
  const failed = runs.filter((r) => r.status === 'failed_to_converge').length

  function openRun(r: RunSummary) {
    if (r.status === 'converged' || r.status === 'failed_to_converge') navigate(`/app/report?run=${r.id}`)
    else navigate(`/app/console?run=${r.id}`)
  }

  return (
    <div style={{ padding: '26px 24px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 5 }}>Run history</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>{runs.length} run(s) this session · {converged} converged · {awaiting} awaiting approval · {failed} failed</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className="btn btn-sm"
              style={{
                background: filter === f ? 'var(--tint)' : 'transparent',
                border: `1px solid ${filter === f ? 'var(--border-strong)' : 'var(--border-soft)'}`,
                color: filter === f ? 'var(--ink)' : 'var(--muted)',
              }}
              onClick={() => setFilter(f)}
            >{f === 'All' ? 'All' : STATUS_LABEL[f]}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div className="table-head" style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1.3fr) minmax(0,1fr) 130px 80px 90px', gap: 10, minWidth: 780 }}>
          <span>RUN</span><span>ROLE</span><span>ENVIRONMENT</span><span>OUTCOME</span><span>TRIMMED</span><span>ITERS</span>
        </div>
        {filtered.map((r) => (
          <div key={r.id} className="table-row" onClick={() => openRun(r)} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1.3fr) minmax(0,1fr) 130px 80px 90px', gap: 10, minWidth: 780, cursor: 'pointer' }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{r.id}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.role_id}</span>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.environment_id}</span>
            <span className={`pill ${STATUS_CLASS[r.status]}`} style={{ justifySelf: 'start' }}>{STATUS_LABEL[r.status]}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--healthy)' }}>{r.trimmed}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{r.iteration}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>No runs match this filter yet.</div>
        )}
      </div>
    </div>
  )
}
