import { useParams, useNavigate } from 'react-router-dom'

const classLabel = { trash: '쓰레기', occupy: '소지품' }
const gradeLabel = { NORMAL: '정상', WARN: '경고', BLOCK: '심각' }

const actionLabel = {
  dispatch_blocked:    '배차 자동 중단',
  carwash_requested:   '세차 업체 호출',
  penalty_reserved:    '패널티 예약',
  notified:            'Discord 알림 전송',
  belongings_notified: '소지품이 발견되어 안내드렸습니다',
}

const severityFor = (ratio) => ratio >= 0.3
  ? { label: '심각', color: '#ef4444', bg: 'rgba(127,29,29,0.4)' }
  : ratio >= 0.1
    ? { label: '경미', color: '#f59e0b', bg: 'rgba(66,32,6,0.4)' }
    : { label: '낮음', color: '#22c55e', bg: 'rgba(6,78,59,0.4)' }

const mockResult = {
  vehicle: '12가3456',
  checked_at: '2026-07-05T14:32:00',
  roi_pollution_ratio: 0.235,
  classes: [
    { type: 'trash', area_ratio: 0.14 },
    { type: 'occupy', area_ratio: 0.09 },
  ],
  grade: 'BLOCK',
  actions: ['dispatch_blocked', 'carwash_requested', 'penalty_reserved', 'notified', 'belongings_notified'],
  image_key: 'inspections/2026/12가3456_2037.jpg',
}

export default function AIAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = { ...mockResult, vehicle: id ?? mockResult.vehicle }
  const pollPct = (data.roi_pollution_ratio * 100).toFixed(1)
  const pollColor = data.roi_pollution_ratio >= 0.3 ? '#ef4444' : data.roi_pollution_ratio >= 0.1 ? '#f59e0b' : '#22c55e'
  const font = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0c14', color: '#cdd6f4', fontFamily: font }}>

      <div style={{ background: '#0f1117', borderBottom: '1px solid #1e2235', padding: '0 20px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '12px' }}>AI 분석</span>
          <span style={{ color: '#2d3555' }}>/</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>차량 실내 AI 오염도 분석</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#4a5568' }}>모델: YOLO11-Seg</span>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f1a', minWidth: 0 }}>
          <div style={{ background: '#0f1117', borderBottom: '1px solid #1e2235', padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: '#8892b0' }}>반납 시 촬영 사진 · {data.vehicle}</span>
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c14' }}>
            <div style={{ fontSize: '13px', color: '#4a5568' }}>이미지 로드 중 · {data.image_key}</div>
          </div>
          <div style={{ background: '#0f1117', borderTop: '1px solid #1e2235', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>배차 중단</button>
            <button style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: '4px', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>세차 호출</button>
          </div>
        </div>

        <div style={{ width: '280px', background: '#0d0f1a', borderLeft: '1px solid #1e2235', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>

          <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>오염도 스코어</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: pollColor, lineHeight: 1 }}>{pollPct}%</div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${pollColor}`, borderRadius: '4px', padding: '3px 10px', fontSize: '11px', color: pollColor, fontWeight: '700' }}>
                {gradeLabel[data.grade] ?? data.grade}
              </div>
            </div>
            <div style={{ background: '#1e2235', borderRadius: '3px', height: '7px', marginBottom: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pollPct}%`, background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#2d3555' }}>
              <span>0%</span><span style={{ color: '#4a5568' }}>기준치: 10% / 30%</span><span>100%</span>
            </div>
          </div>

          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>감지 항목 [{data.classes.length}건]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.classes.map((c, i) => {
                const sev = severityFor(c.area_ratio)
                return (
                  <div key={i} style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', borderLeft: `3px solid ${sev.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>{classLabel[c.type] ?? c.type}</span>
                      <span style={{ fontSize: '10px', background: sev.bg, color: sev.color, padding: '2px 7px', borderRadius: '3px', fontWeight: '700' }}>{sev.label}</span>
                    </div>
                    <div style={{ background: '#1e2235', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.area_ratio * 100}%`, background: sev.color, borderRadius: '2px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '5px', textAlign: 'right' }}>{(c.area_ratio * 100).toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>모델 통계</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['추론 속도', '24fps', '#22c55e'], ['처리 시간', '41.7ms', '#22c55e'], ['mAP50', '0.909', '#4f8ef7'], ['감지 수', `${data.classes.length}건`, '#f59e0b']].map(([l, v, c]) => (
                <div key={l} style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', border: '1px solid #1e2235' }}>
                  <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '4px' }}>{l}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

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