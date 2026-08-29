import { useParams, useNavigate } from 'react-router-dom'

const gradeLabel = { NORMAL: '정상', WARN: '경고', BLOCK: '심각' }

const actionLabel = {
  dispatch_blocked:  '배차 자동 중단',
  carwash_requested: '세차 업체 호출',
  penalty_reserved:  '패널티 예약',
  notified:          'Discord 알림 전송',
  user_alerted:      '소지품이 발견되어 안내드렸습니다',
}

const mockResult = {
  vehicle: '12가3456',
  checked_at: '2026-07-05T14:32:00',
  roi_pollution_ratio: 0.235,
  trash_count: 3,
  occupy_detected: true,
  grade: 'BLOCK',
  user_alert: true,
  actions: ['dispatch_blocked', 'carwash_requested', 'penalty_reserved', 'notified', 'user_alerted'],
  image_key: 'inspections/2026/12가3456_2037.jpg',
}

export default function AIAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = { ...mockResult, vehicle: id ?? mockResult.vehicle }
  const pollPct = (data.roi_pollution_ratio * 100).toFixed(1)
  const pollColor = data.roi_pollution_ratio >= 0.05 ? '#ef4444' : data.roi_pollution_ratio >= 0.02 ? '#f59e0b' : '#22c55e'
  const font = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  const detectionCount = (data.trash_count > 0 ? 1 : 0) + (data.occupy_detected ? 1 : 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0c14', color: '#cdd6f4', fontFamily: font }}>

      <div style={{ background: '#0f1117', borderBottom: '1px solid #1e2235', padding: '0 20px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '12px' }}>AI 분석</span>
          <span style={{ color: '#2d3555' }}>/</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>차량 실내 AI 오염도 분석</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#4a5568' }}>Detection + Segmentation</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>서버 정상</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#0d0f1a', borderBottom: '1px solid #1e2235', padding: '0 20px', height: '34px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {['이미지 업로드', '번호판·얼굴 마스킹', 'YOLO 추론', '오염도 판정', '자동 조치'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', background: '#22c55e', color: '#fff' }}>✓</div>
              <span style={{ fontSize: '11px', color: '#22c55e', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < 4 && <div style={{ width: '24px', height: '1px', background: '#22c55e' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 좌측 — 차량 정보 */}
        <div style={{ width: '180px', background: '#0d0f1a', borderRight: '1px solid #1e2235', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', paddingBottom: '6px', borderBottom: '1px solid #1e2235' }}>차량 정보</div>
          <div style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', border: '1px solid #1e2235' }}>
            <div style={{ fontSize: '13px', color: '#cdd6f4', fontWeight: '700' }}>{data.vehicle}</div>
            <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '4px' }}>
              {new Date(data.checked_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={() => navigate('/vehicles')} style={{ marginTop: 'auto', width: '100%', padding: '8px', background: '#1a1f2e', border: '1px solid #1e2235', borderRadius: '5px', color: '#8892b0', fontSize: '11px', cursor: 'pointer' }}>
            차량 목록으로
          </button>
        </div>

        {/* 가운데 — 이미지 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f1a', minWidth: 0 }}>
          <div style={{ background: '#0f1117', borderBottom: '1px solid #1e2235', padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: '#8892b0' }}>반납 시 촬영 사진 · {data.vehicle}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c14' }}>
            <div style={{ fontSize: '13px', color: '#4a5568' }}>이미지 로드 중 · {data.image_key}</div>
          </div>
          <div style={{ background: '#0f1117', borderTop: '1px solid #1e2235', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>배차 중단</button>
            <button style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: '4px', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>세차 호출</button>
          </div>
        </div>

        {/* 우측 — 분석 결과 */}
        <div style={{ width: '280px', background: '#0d0f1a', borderLeft: '1px solid #1e2235', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>

          {/* 오염도 */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>오염도 스코어</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: pollColor, lineHeight: 1 }}>{pollPct}%</div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${pollColor}`, borderRadius: '4px', padding: '3px 10px', fontSize: '11px', color: pollColor, fontWeight: '700' }}>
                {gradeLabel[data.grade] ?? data.grade}
              </div>
            </div>
            <div style={{ background: '#1e2235', borderRadius: '3px', height: '7px', marginBottom: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(pollPct, 100)}%`, background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#2d3555' }}>
              <span>0%</span><span style={{ color: '#4a5568' }}>기준치: 2% / 5%</span><span>100%</span>
            </div>
          </div>

          {/* 감지 항목 */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>감지 항목 [{detectionCount}건]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.trash_count > 0 && (
                <div style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>고형 쓰레기</span>
                    <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>{data.trash_count}개</span>
                  </div>
                </div>
              )}
              {data.occupy_detected && (
                <div style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', borderLeft: '3px solid #4f8ef7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>두고 간 소지품</span>
                    <span style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700' }}>감지됨</span>
                  </div>
                </div>
              )}
              {detectionCount === 0 && (
                <div style={{ fontSize: '12px', color: '#4a5568' }}>감지된 항목 없음</div>
              )}
            </div>
          </div>

          {/* 모델 통계 */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>모델 통계</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['Precision', '0.897', '#22c55e'], ['Recall', '0.869', '#22c55e'], ['mAP50', '0.909', '#4f8ef7'], ['감지 수', `${detectionCount}건`, '#f59e0b']].map(([l, v, c]) => (
                <div key={l} style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', border: '1px solid #1e2235' }}>
                  <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '4px' }}>{l}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 자동 처리 */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>자동 처리 결과</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111827', borderRadius: '6px', padding: '9px 12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f8ef7', flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>{actionLabel[a] ?? a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}