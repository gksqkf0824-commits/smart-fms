import { useNavigate, useParams } from 'react-router-dom'

const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusBg    = { AVAILABLE: '#dcfce7', CARWASH_NEEDED: '#fef9c3', INSPECTING: '#fee2e2' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#b45309', INSPECTING: '#dc2626' }

const gradeConfig = {
  NORMAL: { label: '정상', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  WARN:   { label: '경고', color: '#b45309', bg: '#fef9c3', border: '#fde68a' },
  BLOCK:  { label: '심각', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
}

const actionLabel = {
  dispatch_blocked:  '배차 차단됨',
  carwash_requested: '세차 접수됨',
  penalty_reserved:  '패널티 부과 예약됨',
  notified:          '알림 전송됨',
}
const actionColor = {
  dispatch_blocked:  '#ef4444',
  carwash_requested: '#f59e0b',
  penalty_reserved:  '#a855f7',
  notified:          '#4f8ef7',
}

// TODO: GET /vehicles/{plate} 완성되면 실제 API 호출로 교체
const mockData = {
  plate: '12가3456',
  model: '아이오닉5',
  zone: '강남 A존',
  status: 'CARWASH_NEEDED',
  last_checked: '2026-07-05T14:32:00',
  latest_inspection: {
    roi_pollution_ratio: 0.235,
    classes: [
      { type: 'trash', area_ratio: 0.14 },
      { type: 'spill', area_ratio: 0.09 },
    ],
    grade: 'BLOCK',
    actions: ['dispatch_blocked', 'carwash_requested', 'penalty_reserved', 'notified'],
    image_key: 'inspections/2026/12가3456_2037.jpg',
  }
}

export default function VehicleDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const data = { ...mockData, plate: id ?? mockData.plate }
  const ins = data.latest_inspection
  const grade = ins ? gradeConfig[ins.grade] : null
  const pollPct = ins ? (ins.roi_pollution_ratio * 100).toFixed(1) : null

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px', cursor: 'pointer' }} onClick={() => navigate('/vehicles')}>
        차량 목록 &gt; {data.plate}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {data.plate}
            <span style={{ background: statusBg[data.status], color: statusColor[data.status], padding: '3px 9px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
              {statusLabel[data.status]}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
            {data.model} · {data.zone} · 반납: {data.last_checked ? new Date(data.last_checked).toLocaleString('ko-KR') : '-'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>세차 호출</button>
          <button style={{ padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>패널티 부과</button>
          <button style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>배차 중단 유지</button>
        </div>
      </div>

      {ins && grade && (
        <>
          {/* 이미지 비교 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #eee' }}>
              <div style={{ padding: '10px 14px', background: '#f8f9fa', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: '700', color: '#555' }}>
                원본 사진
              </div>
              <div style={{ height: '220px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: '#aaa' }}>이미지 준비 중</div>
                <div style={{ fontSize: '10px', color: '#ccc' }}>{ins.image_key}</div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1.5px solid ${grade.border}` }}>
              <div style={{ padding: '10px 14px', background: grade.bg, borderBottom: `1px solid ${grade.border}`, fontSize: '12px', fontWeight: '700', color: grade.color }}>
                AI 마스크 오버레이
              </div>
              <div style={{ height: '220px', background: '#fff8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                <div style={{ fontSize: '13px', color: '#aaa' }}>마스크 결과 이미지</div>
                <div style={{
                  position: 'absolute', top: '25%', left: '15%', width: '65%', height: '45%',
                  background: `${grade.color}20`, borderRadius: '8px',
                  border: `2px dashed ${grade.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: grade.color, fontSize: '13px', fontWeight: '700',
                }}>
                  오염 감지 영역 {pollPct}%
                </div>
              </div>
            </div>
          </div>

          {/* 분석 결과 */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744', marginBottom: '16px' }}>AI 분석 결과</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: grade.bg, border: `1.5px solid ${grade.border}`, borderRadius: '10px', padding: '12px 20px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', color: grade.color, fontWeight: '700', marginBottom: '3px' }}>판정 등급</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: grade.color }}>{grade.label}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: '#f0f0f0', borderRadius: '20px', height: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${pollPct}%`, height: '100%', borderRadius: '20px', background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                  <span>합산 오염도: <strong style={{ color: grade.color }}>{pollPct}%</strong></span>
                  <span>기준치: 10% / 30%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {ins.classes.map((c, i) => (
                <div key={i} style={{ background: c.type === 'trash' ? '#fee2e2' : '#fef9c3', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: c.type === 'trash' ? '#dc2626' : '#b45309', fontWeight: '600' }}>
                  {c.type === 'trash' ? '고형 쓰레기' : '액체·얼룩'} · {(c.area_ratio * 100).toFixed(1)}%
                </div>
              ))}
            </div>

            {ins.actions.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px' }}>자동 처리 결과</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ins.actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: actionColor[a] ?? '#6b7280', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2744' }}>{actionLabel[a] ?? a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
