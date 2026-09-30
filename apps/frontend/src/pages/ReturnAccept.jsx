import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE, networkMessage } from '../fleet'
import { CameraIcon, GradeTag, Notice, Plate, RatioCell } from '../components/ui'
import { ActionSteps, Detections, Verdict } from '../components/Inspection'
import './ReturnAccept.css'

export default function ReturnAccept() {
  const [plate, setPlate] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])   // 이 화면에서 접수한 반납 (새로고침하면 비워짐)
  const fileRef = useRef()

  async function handleSubmit(e) {
    e.preventDefault()
    const normalized = plate.replace(/\s/g, '')
    if (!normalized) { setError('차량 번호를 입력해 주세요.'); return }
    if (!file) { setError('실내 사진을 골라 주세요.'); return }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('plate', normalized)
    formData.append('image', file)

    try {
      const res = await fetch(`${API_BASE}/return`, {
        method: 'POST',
        body: formData,
      })
      if (res.status === 404) throw new Error('등록되지 않은 차량이에요. 번호판을 다시 확인해 주세요.')
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data = await res.json()
      setResult(data)
      setHistory(prev => [{ ...data, at: new Date() }, ...prev])
    } catch (err) {
      setError(networkMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">반납 접수</h1>
          <p className="page-desc">현장에서 받은 실내 사진으로 반납을 대신 접수해요. 접수하면 AI 판정과 자동 조치가 바로 실행돼요.</p>
        </div>
      </header>

      <form className="panel panel-pad return-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">차량 번호</span>
          <input className="input" value={plate} onChange={e => setPlate(e.target.value)} placeholder="12가3456"
            aria-invalid={error && !plate.trim() ? true : undefined} />
        </label>
        <div className="field">
          <span className="field-label" id="photo-label">실내 사진</span>
          <button type="button" className="input file-button" aria-labelledby="photo-label"
            onClick={() => fileRef.current.click()}>
            <CameraIcon size={18} />
            <span className={file ? 'file-name' : 'file-name muted'}>{file ? file.name : '사진 파일 고르기'}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setFile(e.target.files[0] ?? null)} />
        </div>
        <button type="submit" className="btn btn-primary return-submit" disabled={loading}>
          {loading ? 'AI가 분석하고 있어요' : '반납 접수'}
        </button>
        {error && <div className="return-error"><Notice tone="error">{error}</Notice></div>}
      </form>

      {result && (
        <section className="section" aria-live="polite">
          <div className="section-head">
            <div className="result-title">
              <Plate plate={result.vehicle} size="lg" />
              <div>
                <h2 className="section-title">반납을 접수했어요</h2>
                <p className="section-desc">
                  AI 판정이 끝났어요. <Link to={`/vehicles/${result.vehicle}`} className="link">차량 상세에서 보기</Link>
                </p>
              </div>
            </div>
          </div>
          <div className="result-grid">
            <div className="panel panel-pad"><Verdict ins={result} /></div>
            <div className="panel panel-pad">
              <h3 className="panel-title">감지한 물체</h3>
              <Detections ins={result} />
              <h3 className="panel-title result-subtitle">자동으로 처리한 일</h3>
              <ActionSteps actions={result.actions} />
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">방금 접수한 반납</h2>
            <p className="section-desc">이 화면을 떠나면 비워져요. 지난 기록은 차량 목록에서 볼 수 있어요.</p>
          </div>
        </div>
        <div className="panel table-panel">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">차량</th>
                  <th scope="col">접수 시각</th>
                  <th scope="col">오염 면적</th>
                  <th scope="col">판정</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={4} className="empty">아직 접수한 반납이 없어요</td></tr>
                ) : history.map(h => (
                  <tr key={h.at.getTime()}>
                    <td><Plate plate={h.vehicle} /></td>
                    <td className="num">{h.at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                    <td><RatioCell ratio={h.roi_pollution_ratio} /></td>
                    <td><GradeTag grade={h.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
