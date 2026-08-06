const alerts = [
  { color: '#ef4444', title: '배차 자동 중단 — 12가3456', desc: '오염도 23.5% 감지 · grade: BLOCK · 배차 자동 차단 + Swap 실행', time: '14:32' },
  { color: '#f59e0b', title: '세차 업체 자동 호출 — 12가3456', desc: '세차 API 호출 완료 · partner_id: WC-0042 · 예상 도착 15:00', time: '14:33' },
  { color: '#4f8ef7', title: '디스코드 알림 전송 — #fleet-alert', desc: '오염 감지 알림 자동 전송 완료 (12가3456 · 23.5%)', time: '14:33' },
  { color: '#a855f7', title: '패널티 부과 예약 — 홍길동', desc: '50,000원 패널티 예약 · PostgreSQL 기록 완료 · S3 증거 사진 저장', time: '14:33' },
  { color: '#22c55e', title: '정상 반납 — 56다1234', desc: '오염도 1.1% · grade: NORMAL · 즉시 AVAILABLE 상태 전환', time: '12:50' },
  { color: '#22c55e', title: '정상 반납 — 78라5678', desc: '오염도 0.3% · grade: NORMAL · 즉시 AVAILABLE 상태 전환', time: '11:40' },
]

const filters = ['전체', '배차 중단', '세차 호출', '디스코드 알림', '패널티', '정상 반납']

export default function AlertPage() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>알림 내역</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '20px' }}>자동 처리 알림 내역</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {filters.map((f, i) => (
          <button key={f} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
            cursor: 'pointer', border: '1.5px solid #e0e0e0',
            background: i === 0 ? '#1a2744' : '#fff',
            color: i === 0 ? '#fff' : '#888',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.map((a, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '12px', padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${a.color}`,
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: a.color, flexShrink: 0, marginTop: '4px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>{a.title}</div>
              <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>{a.desc}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#bbb', whiteSpace: 'nowrap' }}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
