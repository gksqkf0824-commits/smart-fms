import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

const FIELDS = [
  { label: '이름',   key: 'name' },
  { label: '이메일', key: 'email' },
  { label: '연락처', key: 'phone' },
]

export default function Profile() {
  const navigate = useNavigate()
  const [info, setInfo] = useState({
    name: '관리자',
    email: 'admin@evida.kr',
    phone: '010-1234-5678',
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...info })

  const handleSave = (e) => {
    e.preventDefault()
    setInfo({ ...draft })
    setEditing(false)
  }

  return (
    <div className="page profile">
      <header className="page-head">
        <div>
          <h1 className="page-title">내 정보</h1>
          <p className="page-desc">관제 콘솔에서 쓰는 계정 정보예요.</p>
        </div>
      </header>

      <form className="panel" onSubmit={handleSave}>
        <div className="profile-head">
          <span className="profile-avatar" aria-hidden="true">{info.name.slice(0, 1)}</span>
          <div>
            <strong className="profile-name">{info.name}</strong>
            <span className="profile-role">플릿 매니저</span>
          </div>
          {!editing && (
            <button type="button" className="btn btn-secondary btn-sm profile-edit"
              onClick={() => { setDraft({ ...info }); setEditing(true) }}>
              정보 수정
            </button>
          )}
        </div>

        <dl className="profile-fields">
          {FIELDS.map(({ label, key }) => (
            <div key={key}>
              <dt><label htmlFor={`profile-${key}`}>{label}</label></dt>
              <dd>
                {editing
                  ? <input id={`profile-${key}`} className="input" value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                  : info[key]}
              </dd>
            </div>
          ))}
        </dl>

        {editing && (
          <div className="profile-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>취소</button>
            <button type="submit" className="btn btn-primary">저장</button>
          </div>
        )}
      </form>

      <button className="btn btn-text profile-logout" onClick={() => navigate('/login')}>로그아웃</button>
    </div>
  )
}
