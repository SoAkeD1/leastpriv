import { useState } from 'react'
import type { ApprovalRequest } from '../lib/api'

interface Props {
  request: ApprovalRequest
  onDecide: (decision: 'approve' | 'reject' | 'approve_modified', scopedResource?: string) => void
  onClose: () => void
}

export function ApprovalModal({ request, onDecide, onClose }: Props) {
  const [scoped, setScoped] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--overlay)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 680, background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '2px solid var(--checking)', borderRadius: 16, boxShadow: 'var(--shadow-modal)', overflow: 'hidden', animation: 'lp-in .22s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '18px 20px', borderBottom: '1px solid var(--border-soft)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--checking)', marginTop: 5, animation: 'lp-pulse 1.8s ease-in-out infinite', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.02em' }}>Agent is asking for a judgment call</h2>
              <span className="pill pill-checking">high risk</span>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--subtle)', marginTop: 5 }}>{request.action} on {request.resource}</div>
          </div>
          <span onClick={onClose} style={{ color: 'var(--subtle)', fontSize: 15, cursor: 'pointer', padding: '2px 4px' }}>✕</span>
        </div>

        <div style={{ padding: '18px 20px', display: 'grid', gap: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--subtle)', marginBottom: 8 }}>PROPOSED CHANGE</div>
            <div className="mono" style={{ border: '1px solid var(--border)', background: 'var(--sunken)', borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.75 }}>
              <div style={{ color: 'var(--broken)', textDecoration: 'line-through' }}>- "{request.action}" on Resource "{request.resource}"</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
            <div style={{ border: '1px solid rgb(var(--healthy-rgb) / .25)', background: 'rgb(var(--healthy-rgb) / .04)', borderRadius: 10, padding: '13px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--healthy)', marginBottom: 9 }}>Evidence for removing</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, display: 'grid', gap: 7 }}>
                {request.reason_for.map((r) => <div key={r}>{r}</div>)}
              </div>
            </div>
            <div style={{ border: '1px solid rgb(var(--broken-rgb) / .25)', background: 'rgb(var(--broken-rgb) / .04)', borderRadius: 10, padding: '13px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--broken)', marginBottom: 9 }}>Evidence against</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, display: 'grid', gap: 7 }}>
                {request.reason_against.map((r) => <div key={r}>{r}</div>)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid var(--border)', background: 'var(--sunken)', borderRadius: 10, padding: '11px 14px', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--subtle)' }}>AGENT CONFIDENCE</span>
            <div style={{ flex: 1, minWidth: 120, height: 4, background: 'var(--border-soft)', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${request.confidence}%`, height: '100%', background: 'var(--checking)' }} /></div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--checking)' }}>{request.confidence}% — below your 85% auto-apply threshold</span>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, borderLeft: '2px solid var(--accent)', paddingLeft: 11 }}>
            <span className="mono" style={{ color: 'var(--accent)', fontSize: 11 }}>AGENT →</span> {request.agent_note}
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--subtle)', marginBottom: 8 }}>SCOPE INSTEAD OF REMOVING (optional)</div>
            <input
              className="input mono"
              placeholder="e.g. ecsTaskExecutionRole"
              value={scoped}
              onChange={(e) => setScoped(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderTop: '1px solid var(--border-soft)', background: 'var(--canvas)', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>agent waits · run auto-stops in 24h</span>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button className="btn btn-danger" onClick={() => onDecide('reject')}>Reject</button>
            <button
              className="btn btn-secondary"
              disabled={!scoped.trim()}
              onClick={() => onDecide('approve_modified', scoped.trim())}
            >Approve with modification</button>
            <button className="btn btn-primary" onClick={() => onDecide('approve')}>Approve removal</button>
          </div>
        </div>
      </div>
    </div>
  )
}
