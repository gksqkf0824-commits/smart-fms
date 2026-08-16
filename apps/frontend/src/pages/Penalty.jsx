const gradeLabel = { BLOCK: '오염 심각', WARN: '경미한 오염' }
const gradeColor = { BLOCK: '#dc2626', WARN: '#b45309' }
const classLabel = { trash: '고형 쓰레기', occupy: '두고 간 소지품' }

const penalties = [
  { user: '홍길동', plate: '12가3456', checked_at: '07.05 14:32', roi_pollution_ratio: 0.235, classes: [{ type: 'trash' }, { type: 'occupy' }], points: 50000, settled: false, belongings_notified: true  },
  { user: '김철수', plate: '34나7890', checked_at: '07.05 13:15', roi_pollution_ratio: 0.082, classes: [{ type: 'trash' }],                      points: 20000, settled: true,  belongings_notified: false },
  { user: '이영희', plate: '90마2345', checked_at: '07.04 18:00', roi_pollution_ratio: 0.310, classes: [{ type: 'trash' }, { type: 'occupy' }], points: 80000, settled: false, belongings_notified: true  },
  { user: '박민수', plate: '78라5678', checked_at: '07.04 11:20', roi_pollution_ratio: 0.124, classes: [{ type: 'occupy' }],                     points: 30000, settled: true,  belongings_notified: true  },
]

export default function Penalty() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>패널티 관리</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '20px' }}>패널티 관리</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[['이번 달 패널티', '12건', '#ef4444', '총 310,000원'], ['정산 대기', '5건', '#f59e0b', '130,000원'], ['정산 완료', '7건', '#22c55e', '180,000원'], ['자동 처리율', '83%', '#4f8ef7', '수동 개입 없음']].map(([l, v, c, s]) => (
          <div key={l} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '6px' }}>{l}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: c }}>{v}</div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>패널티 내역</div>
          <button style={{ padding: '7px 14px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>엑셀 다운로드</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['이용자', '차량 번호', '반납 일시', '오염도', '감지 항목', '부과 금액', '상태', '증거 사진'].map(h => (
                <th key={h} style={{ background: '#f8f9fa', padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#666', borderBottom: '2px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {penalties.map(p => (
              <tr key={p.plate + p.user} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '11px 12px' }}>{p.user}</td>
                <td style={{ padding: '11px 12px' }}>{p.plate}</td>
                <td style={{ padding: '11px 12px' }}>{p.checked_at}</td>
                <td style={{ padding: '11px 12px' }}><strong style={{ color: p.roi_pollution_ratio >= 0.3 ? '#ef4444' : '#f59e0b' }}>{(p.roi_pollution_ratio * 100).toFixed(1)}%</strong></td>
                <td style={{ padding: '11px 12px' }}>
                  {p.classes.map(c => classLabel[c.type]).join(', ')}
                  {p.belongings_notified && (
                    <div style={{ fontSize: '10px', color: '#4f8ef7', marginTop: '4px' }}>소지품이 발견되어 안내드렸습니다</div>
                  )}
                </td>
                <td style={{ padding: '11px 12px' }}><strong>{p.points.toLocaleString()}원</strong></td>
                <td style={{ padding: '11px 12px' }}>
                  <span style={{ background: p.settled ? '#dcfce7' : '#fef9c3', color: p.settled ? '#16a34a' : '#b45309', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                    {p.settled ? '정산 완료' : '정산 대기'}
                  </span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <button style={{ padding: '5px 12px', background: '#fff', color: '#4f8ef7', border: '1.5px solid #4f8ef7', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>S3 링크</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}