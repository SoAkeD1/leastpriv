import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/environments', label: 'Environments' },
  { to: '/app/new-run', label: 'New Run' },
  { to: '/app/console', label: 'Agent Console' },
  { to: '/app/history', label: 'Run History' },
  { to: '/app/report', label: 'Reports' },
  { to: '/app/settings', label: 'Settings' },
]

export default function AppLayout() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '216px minmax(0,1fr)', background: 'var(--canvas)' }}>
      <div className="sidebar">
        <div>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 18px', cursor: 'pointer' }}>
            <div className="logo-mark" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>LeastPriv</span>
          </div>
          <div className="sidebar-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <span className="dot" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ border: '1px solid var(--border)', background: 'var(--canvas)', borderRadius: 14, padding: 12 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--subtle)', letterSpacing: '.08em', marginBottom: 8 }}>SANDBOX</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--healthy)', animation: 'lp-pulse 2s ease-in-out infinite' }} />
              connected · us-east-1
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle)', marginTop: 6 }}>replay lag 240ms</div>
          </div>
          <div onClick={() => navigate('/')} style={{ fontSize: 12, color: 'var(--subtle)', padding: '4px 8px', cursor: 'pointer' }}>← Back to site</div>
        </div>
      </div>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--healthy)' }} />
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink)' }}>sandbox-prod-mirror</span>
              <span style={{ color: 'var(--subtle)', fontSize: 10 }}>▾</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>acct 4471 · us-east-1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>
              ◔<span style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: 'var(--broken)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', paddingLeft: 14, borderLeft: '1px solid var(--border-soft)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--diff))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>DK</div>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>Dana Kimura</div>
                <div style={{ fontSize: 10.5, color: 'var(--subtle)' }}>Security · Admin</div>
              </div>
              <span style={{ color: 'var(--subtle)', fontSize: 10 }}>▾</span>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
