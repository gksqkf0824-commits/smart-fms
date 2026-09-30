import { useState } from 'react'
import { API_BASE, formatPct, ratioTone } from '../fleet'
import { CameraIcon, Logo, Notice, Plate, PollutionScale } from '../components/ui'
import { Detections } from '../components/Inspection'
import './CustomerReturn.css'

const STEPS = ['차량 번호', '실내 사진', '결과 확인']

const resultTitle = {
  NORMAL: '깨끗하게 반납됐어요',
  WARN:   '반납됐어요. 가벼운 오염이 있었어요',
  BLOCK:  '반납됐어요. 실내 오염이 확인됐어요',
}

function Steps({ current }) {
  return (
    <ol className="cr-steps" aria-label="반납 단계">
      {STEPS.map((s, i) => (
        <li key={s} className={i <= current ? 'is-done' : undefined} aria-current={i === current ? 'step' : undefined}>
          <span className="cr-step-no num">{i + 1}</span>{s}
        </li>
      ))}
    </ol>
  )
}

function Shell({ children }) {
  return (
    <div className="cr">
      <header className="cr-bar"><Logo size={24} /></header>
      <main className="cr-main">{children}</main>
    </div>
  )
}

export default function CustomerReturn() {
  const [plate, setPlate] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const normalized = plate.replace(/\s/g, '')
    if (!normalized || !file) {
      setError('차량 번호와 사진을 모두 넣어 주세요.')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('plate', normalized)
    formData.append('image', file)
    try {
      const res = await fetch(`${API_BASE}/return`, { method: 'POST', body: formData })
      if (res.status === 404) {
        const data = await res.json()
        setError(data.detail || '등록되지 않은 차량 번호예요. 번호판을 다시 확인해 주세요.')
        return
      }
      if (!res.ok) {
        setError('반납을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
        return
      }
      setResult(await res.json())
    } catch {
      setError('인터넷 연결을 확인한 뒤 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPlate(''); setFile(null); setPreview(null); setResult(null); setError(null)
  }

  /* 분석 중 — 올린 사진 위로 스캔선이 지나간다 */
  if (loading) return (
    <Shell>
      <Steps current={1} />
      <div className="cr-scan" aria-hidden="true">
        {preview && <img src={preview} alt="" />}
        <span className="cr-scan-line" />
      </div>
      <h1 className="cr-title" role="status">AI가 실내를 확인하고 있어요</h1>
      <p className="cr-desc">쓰레기, 얼룩, 두고 간 물건이 있는지 찾는 중이에요.</p>
    </Shell>
  )

  /* 결과 */
  if (result) {
    const washRequested = result.actions?.includes('carwash_requested')
    return (
      <Shell>
        <Steps current={2} />
        <Plate plate={result.vehicle} />
        <h1 className="cr-title">{resultTitle[result.grade] ?? '반납됐어요'}</h1>
        <p className="cr-desc">
          {washRequested ? '세차를 요청해 두었어요. 이용해 주셔서 고마워요.' : '다음 이용자가 바로 탈 수 있어요. 이용해 주셔서 고마워요.'}
        </p>

        {preview && <img className="cr-result-photo" src={preview} alt="반납할 때 찍은 실내 사진" />}

        <section className="cr-card">
          <div className="cr-card-row">
            <h2>오염 면적</h2>
            <strong className={`num tone-${ratioTone(result.roi_pollution_ratio)}`}>{formatPct(result.roi_pollution_ratio)}</strong>
          </div>
          <PollutionScale ratio={result.roi_pollution_ratio} />
        </section>

        {(result.trash_count > 0 || result.occupy_detected) && (
          <section className="cr-card">
            <h2 className="cr-card-title">사진에서 찾은 것</h2>
            <Detections ins={result} />
          </section>
        )}

        {result.user_alert && (
          <Notice tone="info" title="두고 내린 물건이 있어요">
            차 안에서 소지품이 보여 안내드려요. 분실물은 고객센터로 문의해 주세요.
          </Notice>
        )}

        <div className="cr-cta">
          <button className="btn btn-secondary btn-block btn-lg" onClick={handleReset}>처음으로</button>
        </div>
      </Shell>
    )
  }

  /* 입력 */
  return (
    <Shell>
      <Steps current={file ? 1 : 0} />
      <h1 className="cr-title">반납할 차량을 알려 주세요</h1>
      <p className="cr-desc">번호판과 실내 사진 한 장이면 반납이 끝나요.</p>

      <form className="cr-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">차량 번호</span>
          <input className="input cr-plate-input" value={plate} onChange={(e) => setPlate(e.target.value)}
            placeholder="12가3456" autoComplete="off" />
        </label>

        <div className="field">
          <span className="field-label">실내 사진</span>
          <label className="cr-photo">
            {preview ? (
              <>
                <img src={preview} alt="고른 실내 사진" />
                <span className="cr-photo-retake">다시 찍기</span>
              </>
            ) : (
              <span className="cr-photo-empty">
                <CameraIcon size={32} />
                <strong>사진 찍기</strong>
                <span>뒷좌석과 바닥이 한 장에 들어오게 찍어 주세요</span>
              </span>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
          </label>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="cr-cta">
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={!plate.trim() || !file}>
            반납하기
          </button>
          <p className="cr-help">문제가 있으면 고객센터로 연락해 주세요</p>
        </div>
      </form>
    </Shell>
  )
}
