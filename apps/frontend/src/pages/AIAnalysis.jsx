import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_BASE, formatDateTime, formatShortDateTime, networkMessage, ratioTone } from '../fleet'
import { CheckIcon, Notice, Plate } from '../components/ui'
import { ActionSteps, Detections, Verdict } from '../components/Inspection'
import './AIAnalysis.css'

// 반납 사진 1장이 거치는 처리 순서 (docs/API.md의 POST /return 내부 동작)
const PIPELINE = ['사진 수신', '얼굴·번호판 가림', '모델 추론', '등급 판정', '자동 조치']

// 검증 데이터 기준 모델 성능 (AI 팀 보고 값)
const MODEL_METRICS = [['Precision', '0.897'], ['Recall', '0.869'], ['mAP50', '0.909']]

export default function AIAnalysis() {
  const { id } = useParams()
  const [inspected, setInspected] = useState([])   // 검수 이력이 있는 차량 (최근 검수 순)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  // 차량 목록 — 번호판 없이 들어오면 가장 최근에 검수된 차량을 보여준다
  useEffect(() => {
    fetch(`${API_BASE}/vehicles`)
      .then(res => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
        return res.json()
      })
      .then(list => setInspected(
        list.filter(v => v.last_checked)
          .sort((a, b) => new Date(b.last_checked) - new Date(a.last_checked))
      ))
      .catch(e => setError(networkMessage(e)))
  }, [])

  const plate = id ?? inspected[0]?.plate

  useEffect(() => {
    if (!plate) return
    setDetail(null)
    setError(null)
    fetch(`${API_BASE}/vehicles/${encodeURIComponent(plate)}`)
      .then(res => {
        if (res.status === 404) throw new Error('등록되지 않은 차량이에요.')
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
        return res.json()
      })
      .then(setDetail)
      .catch(e => setError(networkMessage(e)))
  }, [plate])

  const ins = detail?.latest_inspection
  const detectionCount = ins ? (ins.trash_count > 0 ? 1 : 0) + (ins.occupy_detected ? 1 : 0) : 0

  let body
  if (error) body = <Notice tone="error" title="분석 결과를 불러오지 못했어요">{error}</Notice>
  else if (!ins) body = (
    <p className="empty">
      {detail ? '아직 검수한 적이 없는 차량이에요.'
        : plate || inspected.length > 0 ? '분석 결과를 불러오고 있어요'
        : '검수 이력이 있는 차량이 없어요. 반납 접수에서 사진을 올려 보세요.'}
    </p>
  )
  else body = (
    <div className="analysis-main">
      <section className="analysis-photo">
        <figure className="photo">
          {ins.image_url
            ? <img src={ins.image_url} alt={`${detail.plate} 반납 시 실내 사진`} />
            : <div className="photo-empty">저장된 사진이 없어요</div>}
        </figure>

        <div className="pipeline">
          <h2 className="panel-title">처리 과정</h2>
          <ol className="pipeline-steps">
            {PIPELINE.map((step, i) => (
              <li key={step}>
                <span className="pipeline-mark"><CheckIcon size={14} /></span>
                <span><span className="pipeline-no num">{i + 1}</span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="analysis-actions">
          <button className="btn btn-secondary btn-sm">배차 중단</button>
          <button className="btn btn-secondary btn-sm">세차 호출</button>
        </div>
      </section>

      <aside className="analysis-side">
        <section className="panel panel-pad">
          <h2 className="sr-only">AI 판정</h2>
          <Verdict ins={ins} />
        </section>
        <section className="panel panel-pad">
          <h2 className="panel-title">감지한 물체 <span className="muted num">{detectionCount}건</span></h2>
          <Detections ins={ins} />
        </section>
        <section className="panel panel-pad">
          <h2 className="panel-title">자동으로 처리한 일</h2>
          <ActionSteps actions={ins.actions} />
        </section>
        <section className="panel panel-pad">
          <h2 className="panel-title">모델 성능</h2>
          <dl className="metrics">
            {MODEL_METRICS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>
            ))}
          </dl>
          <p className="metrics-note">검증 데이터 기준이에요.</p>
        </section>
      </aside>
    </div>
  )

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">AI 분석</h1>
          <p className="page-desc">
            {ins
              ? <>반납 사진을 쓰레기·소지품 감지 모델과 오염 면적 모델이 함께 본 결과예요. <span className="num">{formatDateTime(ins.checked_at)}</span> 검수</>
              : '반납 사진을 쓰레기·소지품 감지 모델과 오염 면적 모델이 함께 본 결과예요.'}
          </p>
        </div>
      </header>

      <div className="analysis">
        <nav className="analysis-list" aria-label="검수한 차량">
          <h2 className="panel-title">검수한 차량 <span className="muted num">{inspected.length}</span></h2>
          <ul>
            {inspected.map(v => (
              <li key={v.plate}>
                <Link to={`/analysis/${v.plate}`} className="analysis-item" aria-current={v.plate === plate ? 'page' : undefined}>
                  <Plate plate={v.plate} />
                  <span className="analysis-item-meta">
                    <span className="num">{formatShortDateTime(v.last_checked)}</span>
                    {v.pollution_ratio != null && (
                      <span className={`analysis-dot tone-${ratioTone(v.pollution_ratio)}`} aria-hidden="true" />
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {body}
      </div>
    </div>
  )
}
