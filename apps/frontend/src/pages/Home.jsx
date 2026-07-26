import { useNavigate } from 'react-router-dom'

const gradeLabel = { BLOCK: '오염 심각', WARN: '경미한 오염', NORMAL: '정상' }
const gradeBg    = { BLOCK: '#fee2e2', WARN: '#fef9c3', NORMAL: '#dcfce7' }
const gradeColor = { BLOCK: '#dc2626', WARN: '#b45309', NORMAL: '#16a34a' }
const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusBg    = { AVAILABLE: '#dcfce7', CARWASH_NEEDED: '#fef9c3', INSPECTING: '#fee2e2' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#b45309', INSPECTING: '#dc2626' }

const recentData = [
  { plate: '12가3456', last_checked: '14:32', roi_pollution_ratio: 0.235, classes: [{ type: 'trash', area_ratio: 0.12 }, { type: 'spill', area_ratio: 0.08 }], grade: 'BLOCK', status: 'INSPECTING' },
  { plate: '34나7890', last_checked: '13:15', roi_pollution_ratio: 0.082, classes: [{ type: 'trash', area_ratio: 0.082 }], grade: 'WARN', status: 'CARWASH_NEEDED' },
  { plate: '56다1234', last_checked: '12:50', roi_pollution_ratio: 0.011, classes: [], grade: 'NORMAL', status: 'AVAILABLE' },
  { plate: '78라5678', last_checked: '11:40', roi_pollution_ratio: 0.003, classes: [], grade: 'NORMAL', status: 'AVAILABLE' },
]

const pollutionColor = (v) => v >= 0.3 ? '#ef4444' : v >= 0.1 ? '#f59e0b' : '#22c55e'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>대시보드</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744' }}>전체 차량 현황</div>
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>2026.07.05 · 실시간 업데이트 중</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: '전체 차량', value: '48', sub: '관리 중인 플릿', color: '#4f8ef7', border: '#4f8ef7' },
          { label: '운행 가능', value: '35', sub: '즉시 배차 가능', color: '#22c55e', border: '#22c55e' },
          { label: '세차 필요', value: '9',  sub: '처리 대기 중',   color: '#f59e0b', border: '#f59e0b' },
          { label: '검수 중',   value: '4',  sub: '조치 필요',      color: '#ef4444', border: '#ef4444' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${c.border}` }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '8px' }}>{c.label}</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>최근 반납 차량 AI 분석 결과</div>
          <button onClick={() => navigate('/vehicles')} style={{ padding: '7px 14px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>전체 보기</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['차량 번호', '반납 시각', '오염도', '감지 항목', 'AI 판정', '상태', '조치'].map(h => (
                <th key={h} style={{ background: '#f8f9fa', padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#666', borderBottom: '2px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentData.map(row => (
              <tr key={row.plate} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '11px 12px' }}><strong>{row.plate}</strong></td>
                <td style={{ padding: '11px 12px' }}>{row.last_checked}</td>
                <td style={{ padding: '11px 12px' }}><strong style={{ color: pollutionColor(row.roi_pollution_ratio) }}>{(row.roi_pollution_ratio * 100).toFixed(1)}%</strong></td>
                <td style={{ padding: '11px 12px' }}>
                  {row.classes.length > 0
                    ? row.classes.map(c => c.type === 'trash' ? '고형 쓰레기' : '액체·얼룩').join(', ')
                    : '-'}
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <span style={{ background: gradeBg[row.grade], color: gradeColor[row.grade], padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{gradeLabel[row.grade]}</span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <span style={{ background: statusBg[row.status], color: statusColor[row.status], padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{statusLabel[row.status]}</span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <button onClick={() => navigate(`/vehicles/${row.plate}`)} style={{ padding: '5px 12px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
