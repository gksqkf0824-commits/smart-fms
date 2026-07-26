import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusBg    = { AVAILABLE: '#dcfce7', CARWASH_NEEDED: '#fef9c3', INSPECTING: '#fee2e2' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#b45309', INSPECTING: '#dc2626' }
const pollutionColor = (v) => v >= 0.3 ? '#ef4444' : v >= 0.1 ? '#f59e0b' : '#22c55e'

const API_BASE = 'http://localhost:8080'

export default function VehicleList() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/vehicles`)
      .then(res => {
        if (!res.ok) throw new Error('서버 오류')
        return res.json()
      })
      .then(data => {
        setVehicles(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = vehicles.filter(v =>
    (filter === '전체' || statusLabel[v.status] === filter) &&
    v.plate.includes(search)
  )

  const counts = {
    전체: vehicles.length,
    '운행 가능': vehicles.filter(v => v.status === 'AVAILABLE').length,
    '세차 필요': vehicles.filter(v => v.status === 'CARWASH_NEEDED').length,
    '검수 중': vehicles.filter(v => v.status === 'INSPECTING').length,
  }

  if (loading) return (
    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontSize: '14px', color: '#888' }}>차량 목록 불러오는 중...</div>
    </div>
  )

  if (error) return (
    <div style={{ padding: '24px' }}>
      <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', color: '#dc2626', fontSize: '13px' }}>
        서버 연결 실패: {error}. 백엔드 서버가 실행 중인지 확인해주세요.
      </div>
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>차량 목록</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '20px' }}>차량 목록</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[['전체', '#4f8ef7'], ['운행 가능', '#22c55e'], ['세차 필요', '#f59e0b'], ['검수 중', '#ef4444']].map(([l, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '6px' }}>{l}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: c }}>{counts[l]}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>전체 차량</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding: '7px 12px', border: '1.5px solid #e0e0e0', borderRadius: '6px', fontSize: '12px' }}>
              {['전체', '운행 가능', '세차 필요', '검수 중'].map(s => <option key={s}>{s}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="차량 번호 검색"
              style={{ padding: '7px 12px', border: '1.5px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', width: '160px' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['차량 번호', '배치 존', '최근 검수', '오염도', '상태', '상세'].map(h => (
                <th key={h} style={{ background: '#f8f9fa', padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#666', borderBottom: '2px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>검색 결과가 없습니다.</td>
              </tr>
            ) : (
              filtered.map(v => (
                <tr key={v.plate} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '11px 12px' }}><strong>{v.plate}</strong></td>
                  <td style={{ padding: '11px 12px' }}>{v.zone ?? '-'}</td>
                  <td style={{ padding: '11px 12px' }}>
                    {v.last_checked
                      ? new Date(v.last_checked).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : <span style={{ color: '#aaa' }}>검수 전</span>}
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    {v.pollution_ratio != null
                      ? <strong style={{ color: pollutionColor(v.pollution_ratio) }}>{(v.pollution_ratio * 100).toFixed(1)}%</strong>
                      : <span style={{ color: '#aaa' }}>검수 전</span>}
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{ background: statusBg[v.status] ?? '#f3f4f6', color: statusColor[v.status] ?? '#6b7280', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                      {statusLabel[v.status] ?? v.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <button onClick={() => navigate(`/vehicles/${v.plate}`)}
                      style={{ padding: '5px 12px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                      보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
