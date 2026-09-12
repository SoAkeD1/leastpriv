import { useNavigate } from 'react-router-dom'

export function Logo({ withVersion, to = '/' }: { withVersion?: boolean; to?: string }) {
  const navigate = useNavigate()
  return (
    <div className="logo" onClick={() => navigate(to)}>
      <div className="logo-mark" />
      <span className="logo-name">LeastPriv</span>
      {withVersion && <span className="logo-version">v0.9.3</span>}
    </div>
  )
}
