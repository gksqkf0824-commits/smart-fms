import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()
  const [info, setInfo] = useState({
    name: '관리자',
    email: 'admin@evida.kr',
    phone: '010-1234-5678',
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...info })

  const handleSave = () => {
    setInfo({ ...draft })
    setEditing(false)
  }

  return (
    <div style={{ padding: '24px 40px', background: '#f9fafb', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>내 정보</div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744' }}>계정 정보를 관리하세요</div>
      </div>

      {/* 프로필 카드 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', background: '#4f8ef7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>관</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a2744' }}>{info.name}</div>
              <div style={{ fontSize: '11px', background: '#eff6ff', color: '#4f8ef7', padding: '2px 10px', borderRadius: '20px', fontWeight: '700' }}>Fleet Manager</div>
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{info.email}</div>
          </div>
        </div>
        <button
          onClick={() => { setEditing(!editing); setDraft({ ...info }) }}
          style={{ padding: '7px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          {editing ? '취소' : '프로필 수정'}
        </button>
      </div>

      {/* 기본 정보 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1a2744', marginBottom: '14px' }}>기본 정보</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: '이름', key: 'name' },
            { label: '이메일', key: 'email' },
            { label: '연락처', key: 'phone' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#f9fafb', borderRadius: '10px' }}>
              <div style={{ width: '56px', fontSize: '12px', color: '#9ca3af', fontWeight: '600', flexShrink: 0 }}>{label}</div>
              <div style={{ flex: 1 }}>
                {editing ? (
                  <input
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    style={{ width: '100%', border: '1.5px solid #4f8ef7', borderRadius: '6px', padding: '5px 10px', fontSize: '14px', color: '#1a2744', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontSize: '14px', color: '#1a2744', fontWeight: '500' }}>{info[key]}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {editing && (
          <button
            onClick={handleSave}
            style={{ marginTop: '14px', width: '100%', padding: '11px', background: '#1a2744', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
          >
            저장하기
          </button>
        )}
      </div>

      {/* 로그아웃 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '4px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => navigate('/login')}
          style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
        >
          로그아웃
        </button>
      </div>

    </div>
  )
}