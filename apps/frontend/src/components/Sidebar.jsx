import { Link, useLocation } from 'react-router-dom'

const styles = {
  sidebar: {
    width: '200px', background: '#1a2744', color: '#fff',
    height: '100vh', position: 'fixed', top: 0, left: 0,
    display: 'flex', flexDirection: 'column',
  },
  logoWrap: {
    padding: '20px 16px', borderBottom: '1px solid #2d3f6e',
  },
  logoText: {
    fontSize: '20px', fontWeight: '900', color: '#fff', letterSpacing: '3px',
  },
  logoSpan: { color: '#4f8ef7' },
  logoSub: {
    fontSize: '8px', color: '#4f8ef7', letterSpacing: '1px',
    marginTop: '2px', fontWeight: '600',
  },
  menuSection: {
    padding: '14px 16px 4px', fontSize: '9px', color: '#4f8ef7',
    fontWeight: '800', letterSpacing: '1.5px',
  },
  ul: { listStyle: 'none' },
  bottom: {
    marginTop: 'auto', padding: '16px', borderTop: '1px solid #2d3f6e',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  avatar: {
    width: '32px', height: '32px', background: '#4f8ef7',
    borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '14px',
  },
  userName: { fontSize: '12px', fontWeight: '700', color: '#fff' },
  userRole: { fontSize: '10px', color: '#8fa8d0' },
}

const menus = [
  { section: 'MAIN', items: [
    { path: '/', icon: '🏠', label: '대시보드' },
    { path: '/vehicles', icon: '🚙', label: '차량 목록' },
    { path: '/analysis', icon: '🔍', label: 'AI 분석' },
    { path: '/return', icon: '📋', label: '반납 접수' },
  ]},
  { section: '관리', items: [
    { path: '/penalty', icon: '⚠️', label: '패널티 관리' },
    { path: '/alert', icon: '🔔', label: '알림 내역' },
  ]},
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoWrap}>
        <div style={styles.logoText}>
          <span style={styles.logoSpan}>E</span>VIDA
        </div>
        <div style={styles.logoSub}>VEHICLE INTERIOR AI</div>
      </div>

      {menus.map(group => (
        <div key={group.section}>
          <div style={styles.menuSection}>{group.section}</div>
          <ul style={styles.ul}>
            {group.items.map(item => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link to={item.path} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', color: isActive ? '#fff' : '#8fa8d0',
                    fontSize: '12px', transition: 'all 0.2s',
                    background: isActive ? '#2d3f6e' : 'transparent',
                    borderLeft: isActive ? '3px solid #4f8ef7' : '3px solid transparent',
                    paddingLeft: isActive ? '13px' : '16px',
                  }}>
                    {item.icon} {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <div style={styles.bottom}>
        <div style={styles.avatar}>👤</div>
        <div>
          <div style={styles.userName}>관리자</div>
          <div style={styles.userRole}>Fleet Manager</div>
        </div>
      </div>
    </div>
  )
}
