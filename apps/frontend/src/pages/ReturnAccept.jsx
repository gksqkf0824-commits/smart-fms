const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusBg    = { AVAILABLE: '#dcfce7', CARWASH_NEEDED: '#fef9c3', INSPECTING: '#fee2e2' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#b45309', INSPECTING: '#dc2626' }
const gradeLabel  = { BLOCK: '오염 심각', WARN: '경미한 오염', NORMAL: '정상' }
const gradeBg     = { BLOCK: '#fee2e2', WARN: '#fef9c3', NORMAL: '#dcfce7' }
const gradeColor  = { BLOCK: '#dc2626', WARN: '#b45309', NORMAL: '#16a34a' }

const returns = [
  { checked_at: '14:32', plate: '12가3456', user: '홍길동', zone: '강남구 역삼동', grade: 'BLOCK',  roi_pollution_ratio: 0.235, status: 'INSPECTING',      actions: ['dispatch_blocked', 'carwash_requested'] },
  { checked_at: '13:15', plate: '34나7890', user: '김철수', zone: '서초구 서초동', grade: 'WARN',   roi_pollution_ratio: 0.082, status: 'CARWASH_NEEDED', actions: ['carwash_requested'] },
  { checked_at: '13:02', plate: '56다1234', user: '이영희', zone: '송파구 잠실동', grade: null,     roi_pollution_ratio: null,  status: 'INSPECTING',      actions: [] },
  { checked_at: '12:50', plate: '78라5678', user: '박민수', zone: '마포구 합정동', grade: 'NORMAL', roi_pollution_ratio: 0.003, status: 'AVAILABLE',      actions: [] },
]

export default function ReturnAccept() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>반납 접수</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '20px' }}>반납 접수 현황</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[['오늘 반납', '18', '#4f8ef7'], ['분석 완료', '14', '#22c55e'], ['분석 대기', '3', '#f59e0b'], ['오류 발생', '1', '#ef4444']].map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '6px' }}>{l}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>실시간 반납 접수 목록</div>
          <button style={{ padding: '7px 14px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>새로고침</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['접수 시각', '차량 번호', '이용자', '반납 위치', '오염도', 'AI 판정', '처리 상태', '상세'].map(h => (
                <th key={h} style={{ background: '#f8f9fa', padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#666', borderBottom: '2px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.plate} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '11px 12px' }}>{r.checked_at}</td>
                <td style={{ padding: '11px 12px' }}><strong>{r.plate}</strong></td>
                <td style={{ padding: '11px 12px' }}>{r.user}</td>
                <td style={{ padding: '11px 12px' }}>{r.zone}</td>
                <td style={{ padding: '11px 12px' }}>
                  {r.roi_pollution_ratio !== null
                    ? <strong style={{ color: r.roi_pollution_ratio >= 0.3 ? '#ef4444' : r.roi_pollution_ratio >= 0.1 ? '#f59e0b' : '#22c55e' }}>{(r.roi_pollution_ratio * 100).toFixed(1)}%</strong>
                    : <span style={{ color: '#aaa' }}>분석 중</span>}
                </td>
                <td style={{ padding: '11px 12px' }}>
                  {r.grade
                    ? <span style={{ background: gradeBg[r.grade], color: gradeColor[r.grade], padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{gradeLabel[r.grade]}</span>
                    : <span style={{ color: '#aaa', fontSize: '11px' }}>대기 중</span>}
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <span style={{ background: statusBg[r.status], color: statusColor[r.status], padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{statusLabel[r.status]}</span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <button style={{ padding: '5px 12px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>보기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
