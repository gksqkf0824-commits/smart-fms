import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusBg    = { AVAILABLE: '#dcfce7', CARWASH_NEEDED: '#fef9c3', INSPECTING: '#fee2e2' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#b45309', INSPECTING: '#dc2626' }
const pollutionColor = (v) => v >= 0.3 ? '#ef4444' : v >= 0.1 ? '#f59e0b' : '#22c55e'

const vehicles = [
  { plate: '12가3456', model: '아이오닉5', last_checked: '07.05 14:32', roi_pollution_ratio: 0.235, classes: [{ type: 'trash' }, { type: 'spill' }], status: 'INSPECTING',      penalty: '50,000원' },
  { plate: '34나7890', model: 'EV6',       last_checked: '07.05 13:15', roi_pollution_ratio: 0.082, classes: [{ type: 'trash' }],                    status: 'CARWASH_NEEDED', penalty: '20,000원' },
  { plate: '56다1234', model: '코나 EV',   last_checked: '07.05 12:50', roi_pollution_ratio: 0.011, classes: [],                                      status: 'AVAILABLE',      penalty: '-' },
  { plate: '78라5678', model: '아이오닉6', last_checked: '07.05 11:40', roi_pollution_ratio: 0.003, classes: [],                                      status: 'AVAILABLE',      penalty: '-' },
  { plate: '90마2345', model: '넥쏘',      last_checked: '07.04 18:00', roi_pollution_ratio: 0.310, classes: [{ type: 'trash' }, { type: 'spill' }], status: 'INSPECTING',      penalty: '80,000원' },
]

export default function VehicleList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')

  const filtered = vehicles.filter(v =>
    (filter === '전체' || statusLabel[v.status] === filter) && v.plate.includes(search)
  )

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>차량 목록</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '20px' }}>차량 목록</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[['전체', '48', '#4f8ef7'], ['운행 가능', '35', '#22c55e'], ['세차 필요', '9', '#f59e0b'], ['검수 중', '4', '#ef4444']].map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '6px' }}>{l}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>전체 차량</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e0e0e0', borderRadius: '6px', fontSize: '12px' }}>
              {['전체', '운행 가능', '세차 필요', '검수 중'].map(s => <option key={s}>{s}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="차량 번호 검색"
              style={{ padding: '7px 12px', border: '1.5px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', width: '160px' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['차량 번호', '차종', '최근 반납', '오염도', '감지 항목', '상태', '패널티', '상세'].map(h => (
                <th key={h} style={{ background: '#f8f9fa', padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#666', borderBottom: '2px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.plate} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '11px 12px' }}><strong>{v.plate}</strong></td>
                <td style={{ padding: '11px 12px' }}>{v.model}</td>
                <td style={{ padding: '11px 12px' }}>{v.last_checked}</td>
                <td style={{ padding: '11px 12px' }}><strong style={{ color: pollutionColor(v.roi_pollution_ratio) }}>{(v.roi_pollution_ratio * 100).toFixed(1)}%</strong></td>
                <td style={{ padding: '11px 12px' }}>
                  {v.classes.length > 0 ? v.classes.map(c => c.type === 'trash' ? '고형 쓰레기' : '액체·얼룩').join(', ') : '-'}
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <span style={{ background: statusBg[v.status], color: statusColor[v.status], padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{statusLabel[v.status]}</span>
                </td>
                <td style={{ padding: '11px 12px' }}>{v.penalty}</td>
                <td style={{ padding: '11px 12px' }}>
                  <button onClick={() => navigate(`/vehicles/${v.plate}`)} style={{ padding: '5px 12px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>보기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
