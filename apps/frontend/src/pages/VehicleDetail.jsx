import { useNavigate } from 'react-router-dom'

const vehicle = {
  plate: '12가3456',
  model: '아이오닉5',
  zone: '강남 A존',
  status: 'INSPECTING',
  last_checked: '2026.07.05 14:32',
  latest_inspection: {
    roi_pollution_ratio: 0.235,
    classes: [
      { type: 'trash', area_ratio: 0.12 },
      { type: 'spill', area_ratio: 0.08 },
    ],
    grade: 'BLOCK',
    actions: ['dispatch_blocked', 'carwash_requested', 'penalty_reserved', 'notified'],
    iou: 0.86,
    confidence: 0.91,
    image_url: null,
    checked_at: '2026-07-05T14:32:00',
  }
}

const actionLabel = {
  dispatch_blocked:  '배차 자동 중단',
  carwash_requested: '세차 업체 호출',
  penalty_reserved:  '패널티 부과 예약',
  notified:          '디스코드 알림 전송',
}
const actionColor = {
  dispatch_blocked:  '#ef4444',
  carwash_requested: '#f59e0b',
  penalty_reserved:  '#a855f7',
  notified:          '#4f8ef7',
}

export default function VehicleDetail() {
  const navigate = useNavigate()
  const ins = vehicle.latest_inspection
  const pollPct = (ins.roi_pollution_ratio * 100).toFixed(1)
  const pollColor = ins.roi_pollution_ratio >= 0.3 ? '#ef4444' : ins.roi_pollution_ratio >= 0.1 ? '#f59e0b' : '#22c55e'

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px', cursor: 'pointer' }} onClick={() => navigate('/vehicles')}>
        차량 목록 &gt; {vehicle.plate}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {vehicle.plate}
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 9px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>검수 중</span>
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{vehicle.model} · {vehicle.zone} · 반납: {vehicle.last_checked}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>세차 호출</button>
          <button style={{ padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>패널티 부과</button>
          <button style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>배차 중단 유지</button>
        </div>
      </div>

      {/* 이미지 비교 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #eee' }}>
          <div style={{ padding: '10px 14px', background: '#f8f9fa', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: '700' }}>
            원본 사진 <span style={{ fontWeight: '400', color: '#aaa' }}>(반납 시 자동 촬영)</span>
          </div>
          <div style={{ height: '220px', background: '#e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#aaa', fontSize: '13px' }}>
            <div style={{ fontSize: '44px' }}>[ 원본 이미지 ]</div>
            <div>S3 presigned URL 연결 후 표시</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #fecaca' }}>
          <div style={{ padding: '10px 14px', background: '#fff5f5', borderBottom: '1px solid #fecaca', fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>
            AI 마스크 오버레이 <span style={{ fontWeight: '400', color: '#aaa' }}>(오염 감지 결과)</span>
          </div>
          <div style={{ height: '220px', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#aaa', fontSize: '13px', position: 'relative' }}>
            <div style={{ fontSize: '44px' }}>[ 마스크 결과 ]</div>
            <div style={{
              position: 'absolute', top: '28%', left: '18%', width: '58%', height: '42%',
              background: 'rgba(239,68,68,0.25)', borderRadius: '8px', border: '2px dashed #ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', fontSize: '12px', fontWeight: '700',
            }}>오염 감지 영역 {pollPct}%</div>
          </div>
        </div>
      </div>

      {/* 분석 결과 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744', marginBottom: '14px' }}>AI 분석 결과</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            [pollPct + '%', pollColor, '합산 오염도'],
            [(ins.confidence * 100).toFixed(0) + '%', '#4f8ef7', '모델 신뢰도'],
            [ins.iou.toFixed(2), '#22c55e', 'IoU'],
            [ins.classes.length + '건', '#f59e0b', '감지 클래스'],
          ].map(([v, c, l]) => (
            <div key={l} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: c }}>{v}</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#f0f0f0', borderRadius: '20px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: `${pollPct}%`, height: '100%', borderRadius: '20px', background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '16px' }}>
          <span>합산 오염도: <strong style={{ color: pollColor }}>{pollPct}%</strong></span>
          <span style={{ color: '#ef4444', fontWeight: '700' }}>기준치(10%) 초과</span>
          <span>기준치: 10%</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {ins.classes.map((c, i) => (
            <div key={i} style={{ background: c.type === 'trash' ? '#fee2e2' : '#fef9c3', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: c.type === 'trash' ? '#dc2626' : '#b45309', fontWeight: '600' }}>
              {c.type === 'trash' ? '고형 쓰레기' : '액체·얼룩'} · {(c.area_ratio * 100).toFixed(1)}%
            </div>
          ))}
        </div>
      </div>

      {/* 자동 처리 결과 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744', marginBottom: '14px' }}>자동 처리 결과</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ins.actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: actionColor[a], flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2744' }}>{actionLabel[a]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
