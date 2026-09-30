import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_BASE, formatDateTime, networkMessage } from '../fleet'
import { ChevronLeft, Notice, Plate, StatusTag } from '../components/ui'
import { ActionSteps, Detections, Verdict } from '../components/Inspection'
import './VehicleDetail.css'

// 관리자 API(배차 재개) 인증 — 백엔드 APP_ADMIN_TOKEN과 같은 값을 apps/frontend/.env에 설정
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? ''

export default function VehicleDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resuming, setResuming] = useState(false)
  const [resumeError, setResumeError] = useState(null)
  const [resumed, setResumed] = useState(false)

  const resumeDispatch = () => {
    setResuming(true)
    setResumeError(null)
    fetch(`${API_BASE}/vehicles/${encodeURIComponent(data.plate)}/resume`, {
      method: 'POST',
      headers: { 'X-Admin-Token': ADMIN_TOKEN },
    })
      .then(res => {
        if (res.status === 401) throw new Error('관리자 인증에 실패했어요. .env의 VITE_ADMIN_TOKEN을 확인해 주세요.')
        if (!res.ok) return res.json().then(body => { throw new Error(body.detail ?? `서버 오류 (${res.status})`) })
        return res.json()
      })
      .then(body => { setData(prev => ({ ...prev, status: body.status })); setResumed(true) })
      .catch(e => setResumeError(networkMessage(e)))
      .finally(() => setResuming(false))
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    setResumed(false)
    fetch(`${API_BASE}/vehicles/${encodeURIComponent(id)}`)
      .then(res => {
        if (res.status === 404) throw new Error('등록되지 않은 차량이에요. 번호판을 다시 확인해 주세요.')
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
        return res.json()
      })
      .then(setData)
      .catch(e => setError(networkMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  const back = <Link to="/vehicles" className="back-link"><ChevronLeft size={18} />차량 목록</Link>

  if (loading || error || !data) {
    return (
      <div className="page">
        {back}
        {error
          ? <Notice tone="error" title={`${id} 차량을 열 수 없어요`}>{error}</Notice>
          : <p className="empty">차량 정보를 불러오고 있어요</p>}
      </div>
    )
  }

  const ins = data.latest_inspection

  return (
    <div className="page">
      {back}

      <header className="page-head detail-head">
        <div>
          <div className="detail-title">
            <h1><Plate plate={data.plate} size="lg" /></h1>
            <StatusTag status={data.status} />
          </div>
          <p className="page-desc">{data.zone ? `${data.zone}에 배치된` : '배치 존이 정해지지 않은'} {data.model ?? '차량'}</p>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary">세차 호출</button>
          <button className="btn btn-secondary">패널티 부과</button>
          {data.status === 'CARWASH_NEEDED' && (
            <button className="btn btn-primary" onClick={resumeDispatch} disabled={resuming}>
              {resuming ? '배차 재개 중' : '세차 완료, 배차 재개'}
            </button>
          )}
        </div>
      </header>

      {resumeError && <div className="detail-notice"><Notice tone="error" title="배차를 재개하지 못했어요">{resumeError}</Notice></div>}
      {resumed && <div className="detail-notice"><Notice tone="go">배차를 재개했어요. 이제 이 차량을 바로 배차할 수 있어요.</Notice></div>}

      {!ins ? (
        <div className="panel empty">아직 검수한 적이 없는 차량이에요. 반납 사진이 들어오면 여기에 판정 결과가 보여요.</div>
      ) : (
        <div className="detail-grid">
          <figure className="photo">
            {ins.image_url
              ? <img src={ins.image_url} alt={`${data.plate} 반납 시 실내 사진`} />
              : <div className="photo-empty">저장된 사진이 없어요</div>}
            <figcaption className="num">
              {ins.checked_at ? `${formatDateTime(ins.checked_at)} 반납 때 찍은 사진` : '반납 때 찍은 사진'}
            </figcaption>
          </figure>

          <aside className="detail-side">
            <section className="panel panel-pad">
              <h2 className="sr-only">AI 판정</h2>
              <Verdict ins={ins} />
            </section>
            <section className="panel panel-pad">
              <h2 className="panel-title">감지한 물체</h2>
              <Detections ins={ins} />
            </section>
            <section className="panel panel-pad">
              <h2 className="panel-title">자동으로 처리한 일</h2>
              <ActionSteps actions={ins.actions} />
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
