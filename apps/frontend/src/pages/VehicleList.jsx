import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_BASE, STATUS, networkMessage } from '../fleet'
import { Notice, SearchIcon } from '../components/ui'
import VehicleTable from '../components/VehicleTable'
import './VehicleList.css'

const FILTERS = [['ALL', '전체'], ...Object.entries(STATUS).map(([key, s]) => [key, s.label])]

export default function VehicleList() {
  const [params, setParams] = useSearchParams()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // 상태 필터는 주소에 남겨 대시보드에서 바로 걸러 들어올 수 있게 한다 (?status=CARWASH_NEEDED)
  const filter = STATUS[params.get('status')] ? params.get('status') : 'ALL'
  const setFilter = (key) => setParams(key === 'ALL' ? {} : { status: key }, { replace: true })

  useEffect(() => {
    fetch(`${API_BASE}/vehicles`)
      .then(res => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
        return res.json()
      })
      .then(data => {
        setVehicles(data)
        setLoading(false)
      })
      .catch(err => {
        setError(networkMessage(err))
        setLoading(false)
      })
  }, [])

  const query = search.replace(/\s/g, '')
  const filtered = vehicles.filter(v =>
    (filter === 'ALL' || v.status === filter) &&
    v.plate.includes(query)
  )
  const countOf = (key) => key === 'ALL' ? vehicles.length : vehicles.filter(v => v.status === key).length

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">차량</h1>
          <p className="page-desc">번호판을 누르면 최근 검수 사진과 AI 판정을 볼 수 있어요.</p>
        </div>
      </header>

      {error ? (
        <Notice tone="error" title="차량 목록을 불러오지 못했어요">{error}</Notice>
      ) : loading ? (
        <p className="empty">차량 목록을 불러오고 있어요</p>
      ) : (
        <>
          <div className="toolbar">
            <div className="chips" role="group" aria-label="상태로 거르기">
              {FILTERS.map(([key, label]) => (
                <button key={key} className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                  {label}<span className="chip-count">{countOf(key)}</span>
                </button>
              ))}
            </div>
            <label className="search">
              <SearchIcon size={18} />
              <span className="sr-only">차량 번호 검색</span>
              <input className="input" type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="차량 번호로 찾기" />
            </label>
          </div>

          <div className="panel table-panel">
            <VehicleTable
              vehicles={filtered}
              empty={query ? `'${search.trim()}'에 맞는 차량이 없어요. 번호를 다시 확인해 주세요.` : '이 상태인 차량이 없어요'}
            />
          </div>
        </>
      )}
    </div>
  )
}
