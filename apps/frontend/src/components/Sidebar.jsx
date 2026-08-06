import { Link, useLocation } from 'react-router-dom'

const menus = [
  { section: 'MAIN', items: [
    { path: '/',          label: '대시보드' },
    { path: '/vehicles',  label: '차량 목록' },
    { path: '/analysis',  label: 'AI 분석' },
    { path: '/return',    label: '반납 접수' },
  ]},
  { section: '관리', items: [
    { path: '/penalty',   label: '패널티 관리' },
    { path: '/alert',     label: '알림 내역' },
  ]},
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div style={{
      width: '200px', background: '#1a2744', color: '#fff',
      height: '100vh', position: 'fixed', top: 0, left: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #2d3f6e' }}>
        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', letterSpacing: '3px' }}>
          <span style={{ color: '#4f8ef7' }}>E</span>VIDA
        </div>
        <div style={{ fontSize: '9px', color: '#4f8ef7', letterSpacing: '1.5px', marginTop: '3px', fontWeight: '600' }}>
          VEHICLE INTERIOR AI
        </div>
      </div>

      <div style={{ flex: 1, paddingTop: '8px' }}>
        {menus.map(group => (
          <div key={group.section}>
            <div style={{ padding: '16px 20px 6px', fontSize: '9px', color: '#4f8ef7', fontWeight: '800', letterSpacing: '1.5px' }}>
              {group.section}
            </div>
            <ul style={{ listStyle: 'none' }}>
              {group.items.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link to={item.path} style={{
                      display: 'flex', alignItems: 'center',
                      padding: '10px 20px',
                      color: isActive ? '#fff' : '#8fa8d0',
                      fontSize: '13px', fontWeight: isActive ? '600' : '400',
                      textDecoration: 'none', transition: 'all 0.15s',
                      background: isActive ? '#2d3f6e' : 'transparent',
                      borderLeft: isActive ? '3px solid #4f8ef7' : '3px solid transparent',
                    }}>
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #2d3f6e', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', background: '#4f8ef7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>
          관
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>관리자</div>
          <div style={{ fontSize: '10px', color: '#8fa8d0' }}>Fleet Manager</div>
        </div>
      </div>
    </div>
  )
}
