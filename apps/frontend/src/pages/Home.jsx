import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const gradeLabel = { BLOCK: '오염 심각', WARN: '경미한 오염', NORMAL: '정상' }
const gradeBg    = { BLOCK: '#fee2e2', WARN: '#fef9c3', NORMAL: '#dcfce7' }
const gradeColor = { BLOCK: '#dc2626', WARN: '#b45309', NORMAL: '#16a34a' }
const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusBg    = { AVAILABLE: '#dcfce7', CARWASH_NEEDED: '#fef9c3', INSPECTING: '#fee2e2' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#b45309', INSPECTING: '#dc2626' }
const pollutionColor = (v) => v >= 0.3 ? '#ef4444' : v >= 0.1 ? '#f59e0b' : '#22c55e'

const API_BASE = 'http://localhost:8080'

export default function Home() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const counts = {
    전체: vehicles.length,
    '운행 가능': vehicles.filter(v => v.status === 'AVAILABLE').length,
    '세차 필요': vehicles.filter(v => v.status === 'CARWASH_NEEDED').length,
    '검수 중':   vehicles.filter(v => v.status === 'INSPECTING').length,
  }

  const recent = [...vehicles]
    .filter(v => v.last_checked)
    .sort((a, b) => new Date(b.last_checked) - new Date(a.last_checked))
    .slice(0, 5)

  if (loading) return (
    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontSize: '14px', color: '#888' }}>차량 현황 불러오는 중...</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>대시보드</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744' }}>전체 차량 현황</div>
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>실시간 업데이트 중</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: '전체 차량',  color: '#4f8ef7', border: '#4f8ef7', sub: '관리 중인 플릿' },
          { label: '운행 가능',  color: '#22c55e', border: '#22c55e', sub: '즉시 배차 가능' },
          { label: '세차 필요',  color: '#f59e0b', border: '#f59e0b', sub: '처리 대기 중' },
          { label: '검수 중',    color: '#ef4444', border: '#ef4444', sub: '조치 필요' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '8px' }}>{c.label}</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: c.color, lineHeight: 1 }}>{counts[c.label]}</div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>최근 반납 차량 현황</div>
          <button onClick={() => navigate('/vehicles')} style={{ padding: '7px 14px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>전체 보기</button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', padding: '24px' }}>최근 검수 내역이 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                {['차량 번호', '배치 존', '최근 검수', '오염도', '상태', '조치'].map(h => (
                  <th key={h} style={{ background: '#f8f9fa', padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#666', borderBottom: '2px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(row => (
                <tr key={row.plate} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '11px 12px' }}><strong>{row.plate}</strong></td>
                  <td style={{ padding: '11px 12px' }}>{row.zone ?? '-'}</td>
                  <td style={{ padding: '11px 12px' }}>
                    {row.last_checked
                      ? new Date(row.last_checked).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : <span style={{ color: '#aaa' }}>검수 전</span>}
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    {row.pollution_ratio != null
                      ? <strong style={{ color: pollutionColor(row.pollution_ratio) }}>{(row.pollution_ratio * 100).toFixed(1)}%</strong>
                      : <span style={{ color: '#aaa' }}>검수 전</span>}
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{ background: statusBg[row.status] ?? '#f3f4f6', color: statusColor[row.status] ?? '#6b7280', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                      {statusLabel[row.status] ?? row.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <button onClick={() => navigate(`/vehicles/${row.plate}`)}
                      style={{ padding: '5px 12px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
