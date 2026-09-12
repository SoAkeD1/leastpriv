export function TopBanner({ right }: { right: string }) {
  return (
    <div className="topbanner">
      <span>LeastPriv Labs · Cloud Identity Governance</span>
      <span className="dim">{right}</span>
    </div>
  )
}
