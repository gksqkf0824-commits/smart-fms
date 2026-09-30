import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, Logo } from './ui'
import './AppHeader.css'

const menus = [
  { path: '/',         label: '대시보드', end: true },
  { path: '/vehicles', label: '차량' },
  { path: '/analysis', label: 'AI 분석' },
  { path: '/return',   label: '반납 접수' },
  { path: '/penalty',  label: '패널티' },
  { path: '/alert',    label: '알림 내역' },
]

export default function AppHeader() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const accountRef = useRef(null)

  // 메뉴 바깥을 누르거나 Esc를 누르면 닫는다
  useEffect(() => {
    if (!open) return
    const onPointer = e => { if (!accountRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (path) => { setOpen(false); navigate(path) }

  return (
    <header className="gnb">
      <div className="gnb-inner">
        <Link to="/" className="gnb-brand" aria-label="evida 대시보드로 가기"><Logo /></Link>

        <nav className="gnb-nav" aria-label="주 메뉴">
          {menus.map(m => (
            <NavLink key={m.path} to={m.path} end={m.end} className="gnb-link">{m.label}</NavLink>
          ))}
        </nav>

        <div className="account" ref={accountRef}>
          <button className="account-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            <span className="avatar" aria-hidden="true">관</span>
            <span className="account-name">관리자</span>
            <ChevronDown size={16} />
          </button>
          {open && (
            <div className="account-menu" role="menu">
              <div className="account-who">
                <strong>관리자</strong>
                <span>admin@evida.kr</span>
              </div>
              <button role="menuitem" onClick={() => go('/profile')}>내 정보</button>
              <button role="menuitem" onClick={() => go('/login')}>로그아웃</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
