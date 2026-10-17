import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE, STATUS, formatShortDateTime, networkMessage } from '../fleet'
import { ChevronRight, Notice, Plate, RatioCell, StatusTag } from '../components/ui'
import VehicleTable from '../components/VehicleTable'
import './Home.css'

const STATUS_ORDER = ['AVAILABLE', 'CARWASH_NEEDED', 'INSPECTING']

function headline(total, counts) {
  if (total === 0) return '등록된 차량이 없어요'
  if (counts.CARWASH_NEEDED > 0) return `세차를 기다리는 차량이 ${counts.CARWASH_NEEDED}대 있어요`
  if (counts.INSPECTING > 0) return `검수 중인 차량이 ${counts.INSPECTING}대 있어요`
  return '모든 차량을 바로 배차할 수 있어요'
}

export default function Home() {
  const [vehicles, setVehicles] = useState([])
  const [loadedAt, setLoadedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/vehicles`)
      .then(res => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
        return res.json()
      })
      .then(data => { setVehicles(data); setLoadedAt(new Date()); setLoading(false) })
      .catch(err => { setError(networkMessage(err)); setLoading(false) })
  }, [])

  if (loading) return <div className="page"><p className="empty">차량 현황을 불러오고 있어요</p></div>

  if (error) return (
    <div className="page">
      <Notice tone="error" title="차량 현황을 불러오지 못했어요">{error}</Notice>
    </div>
  )

  const counts = Object.fromEntries(STATUS_ORDER.map(s => [s, vehicles.filter(v => v.status === s).length]))
  const waiting = vehicles.filter(v => v.status === 'CARWASH_NEEDED')
  const recent = [...vehicles]
    .filter(v => v.last_checked)
    .sort((a, b) => new Date(b.last_checked) - new Date(a.last_checked))
    .slice(0, 5)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">{headline(vehicles.length, counts)}</h1>
          <p className="page-desc">
            전체 {vehicles.length}대 중 {counts.AVAILABLE}대를 지금 배차할 수 있어요.{' '}
            <span className="num">{loadedAt.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}</span> 기준이에요.
          </p>
        </div>
      </header>

      {vehicles.length > 0 && (
        <section className="panel panel-pad fleet" aria-label="차량 상태 구성">
          <div className="fleet-bar">
            {STATUS_ORDER.filter(s => counts[s] > 0).map(s => (
              <span key={s} className={`fleet-seg tone-${STATUS[s].tone}`} style={{ flexGrow: counts[s] }} />
            ))}
          </div>
          <ul className="fleet-legend">
            {STATUS_ORDER.map(s => (
              <li key={s}>
                <Link to={`/vehicles?status=${s}`} className="fleet-item">
                  <StatusTag status={s} />
                  <span className="fleet-count num">{counts[s]}<small>대</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">세차가 끝나면 배차를 다시 열어 주세요</h2>
            <p className="section-desc">오염이 확인돼 배차를 멈춘 차량이에요. 차량을 눌러 세차 완료를 처리할 수 있어요.</p>
          </div>
        </div>
        {waiting.length === 0 ? (
          <div className="panel empty">지금 세차를 기다리는 차량이 없어요</div>
        ) : (
          <ul className="task-grid">
            {waiting.map(v => (
              <li key={v.plate}>
                <Link to={`/vehicles/${v.plate}`} className="panel task">
                  <div className="task-main">
                    <Plate plate={v.plate} />
                    <span className="task-meta">
                      {v.zone ?? '존 미지정'}
                      {v.last_checked && <span className="num">{formatShortDateTime(v.last_checked)} 반납</span>}
                    </span>
                  </div>
                  <RatioCell ratio={v.pollution_ratio} />
                  <ChevronRight className="task-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">최근 반납</h2>
            <p className="section-desc">AI 검수를 마친 순서대로 최대 5대까지 보여요.</p>
          </div>
          <Link to="/vehicles" className="link">전체 차량 보기<ChevronRight size={16} /></Link>
        </div>
        <div className="panel table-panel">
          <VehicleTable vehicles={recent} empty="아직 검수한 차량이 없어요" />
        </div>
      </section>
    </div>
  )
}
