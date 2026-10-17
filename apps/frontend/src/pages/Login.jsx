import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GradeTag, Logo, Plate, RatioCell } from '../components/ui'
import './Login.css'

const ADMIN_EMAIL = 'admin@evida.com'
const ADMIN_PASSWORD = '1234'

// 오른쪽 소개 영역에 보여 줄 예시 판정 (실제 데이터 아님)
const SAMPLE = [
  { plate: '34나5678', grade: 'NORMAL', ratio: 0.004 },
  { plate: '12가3456', grade: 'BLOCK',  ratio: 0.08 },
  { plate: '56다7890', grade: 'WARN',   ratio: 0.031 },
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('evida_login', 'true')
      navigate('/')
    } else {
      setError('이메일이나 비밀번호가 맞지 않아요. 다시 확인해 주세요.')
    }
  }

  return (
    <div className="login">
      <div className="login-form-side">
        <Logo />
        <form className="login-form" onSubmit={handleLogin} noValidate>
          <h1 className="login-title">관제 콘솔에 로그인</h1>
          <p className="login-desc">반납 차량의 AI 판정과 배차 상태를 관리해요.</p>

          <label className="field">
            <span className="field-label">이메일</span>
            <input className="input" type="email" autoComplete="username" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="admin@evida.com" aria-invalid={error ? true : undefined} />
          </label>
          <label className="field">
            <span className="field-label">비밀번호</span>
            <input className="input" type="password" autoComplete="current-password" value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              aria-invalid={error ? true : undefined} />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block btn-lg">로그인</button>
          <p className="login-hint">테스트 계정 <span className="num">admin@evida.com / 1234</span></p>
        </form>
      </div>

      <aside className="login-intro" aria-label="evida 소개">
        <h2 className="login-intro-title">다음 이용자가 문을 열기 전에,<br />AI가 실내를 먼저 봐요</h2>
        <p className="login-intro-desc">
          반납 사진 한 장으로 오염 면적을 재고, 기준을 넘으면 배차를 멈추고 세차를 불러요.
        </p>
        <ul className="login-sample">
          {SAMPLE.map(s => (
            <li key={s.plate}>
              <div className="login-sample-top">
                <Plate plate={s.plate} />
                <GradeTag grade={s.grade} />
              </div>
              <RatioCell ratio={s.ratio} />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
