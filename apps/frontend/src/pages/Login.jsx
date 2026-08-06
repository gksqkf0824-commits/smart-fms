import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL = 'admin@evida.com'
const ADMIN_PASSWORD = '1234'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('evida_login', 'true')
      navigate('/')
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2744 50%, #0d1b3e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex', width: '900px', height: '560px',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg, #1a2f6e 0%, #0d1b3e 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(79,142,247,0.08)', top: '-80px', left: '-80px' }} />
          <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(79,142,247,0.06)', bottom: '-50px', right: '-50px' }} />
          <div style={{ fontSize: '52px', fontWeight: '900', color: '#fff', letterSpacing: '6px', marginBottom: '8px', zIndex: 1 }}>
            <span style={{ color: '#4f8ef7' }}>E</span>VIDA
          </div>
          <div style={{ fontSize: '11px', color: '#4f8ef7', letterSpacing: '2px', fontWeight: '600', marginBottom: '32px', zIndex: 1 }}>
            EFFICIENT VEHICLE INTERIOR DIRECTION AUTOMATION
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: '1.8', zIndex: 1 }}>
            AI 기반 차량 실내 오염 감지<br />자동 배차 관제 솔루션
          </div>
          <div style={{ display: 'flex', gap: '32px', marginTop: '40px', zIndex: 1 }}>
            {[['80%+', '자동 분류율'], ['24fps', '추론 속도'], ['무인', '자동 관제']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#4f8ef7' }}>{val}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '380px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a2744', marginBottom: '4px' }}>관리자 로그인</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '32px' }}>EVIDA FMS 관제 시스템에 로그인하세요</div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>이메일</label>
            <input value={email} onChange={e => { setEmail(e.target.value); setError('') }} onKeyDown={handleKeyDown} placeholder="admin@evida.com"
              style={{ width: '100%', padding: '12px 14px', border: error ? '1.5px solid #ef4444' : '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>비밀번호</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} onKeyDown={handleKeyDown} placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', border: error ? '1.5px solid #ef4444' : '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px', background: '#fff5f5', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} style={{ width: '100%', padding: '13px', background: '#1a2744', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
            로그인
          </button>

          <div style={{ background: '#f0f6ff', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#4f8ef7', marginTop: '20px' }}>
            테스트 계정: admin@evida.com / 1234
          </div>
        </div>
      </div>
    </div>
  )
}