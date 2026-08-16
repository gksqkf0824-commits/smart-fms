import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const API_BASE = 'http://localhost:8080'

const statusLabel = { AVAILABLE: '운행 가능', CARWASH_NEEDED: '세차 필요', INSPECTING: '검수 중' }
const statusColor = { AVAILABLE: '#16a34a', CARWASH_NEEDED: '#92400e', INSPECTING: '#991b1b' }
const statusBg    = { AVAILABLE: '#f0fdf4', CARWASH_NEEDED: '#fffbeb', INSPECTING: '#fef2f2' }

const gradeConfig = {
  NORMAL: { label: '정상', color: '#16a34a', light: '#f0fdf4' },
  WARN:   { label: '경고', color: '#92400e', light: '#fffbeb' },
  BLOCK:  { label: '심각', color: '#991b1b', light: '#fef2f2' },
}

const classLabel = { trash: '고형 쓰레기', occupy: '두고 간 소지품' }

const actionLabel = {
  dispatch_blocked:    '배차 차단',
  carwash_requested:   '세차 접수',
  penalty_reserved:    '패널티 예약',
  notified:            '알림 전송',
  belongings_notified: '소지품이 발견되어 안내드렸습니다',
}

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
      { type: 'occupy', area_ratio: 0.09 },
    ],
    grade: 'BLOCK',
    actions: ['dispatch_blocked', 'carwash_requested', 'penalty_reserved', 'notified', 'belongings_notified'],
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

  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    setImageLoading(true)
    fetch(`${API_BASE}/vehicles/${data.plate}`)
      .then(res => res.json())
      .then(json => setImageUrl(json.image_url ?? null))
      .catch(() => setImageUrl(null))
      .finally(() => setImageLoading(false))
  }, [data.plate])

  return (
    <div style={{ padding: '32px 40px', background: '#f9fafb', minHeight: '100vh' }}>

      {/* 브레드크럼 */}
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/vehicles')}>
        <span>차량 목록</span>
        <span>/</span>
        <span style={{ color: '#374151' }}>{data.plate}</span>
      </div>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{data.plate}</h1>
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '4px',
              color: statusColor[data.status], background: statusBg[data.status],
              border: `1px solid ${statusColor[data.status]}30`
            }}>{statusLabel[data.status]}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {data.model} &nbsp;·&nbsp; {data.zone} &nbsp;·&nbsp; 반납 {data.last_checked ? new Date(data.last_checked).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '8px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>세차 호출</button>
          <button style={{ padding: '8px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>패널티 부과</button>
          <button style={{ padding: '8px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>배차 중단 유지</button>
        </div>
      </div>

      {ins && grade && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>

          {/* 좌측 — 이미지 */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>원본 사진</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>반납 시 자동 촬영</span>
            </div>
            <div style={{ height: '440px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageLoading ? (
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>이미지 불러오는 중…</div>
              ) : imageUrl ? (
                <img src={imageUrl} alt="차량 실내 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>사진 없음</div>
              )}
            </div>
          </div>

          {/* 우측 — 분석 결과 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '14px', textTransform: 'uppercase' }}>판정 결과</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '40px', fontWeight: '700', color: grade.color, lineHeight: 1 }}>{pollPct}%</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>합산 오염도</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: grade.color }}>{grade.label}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>등급</div>
                </div>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${pollPct}%`, height: '100%', background: grade.color, borderRadius: '100px', transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d1d5db', marginTop: '4px' }}>
                <span>0%</span>
                <span>기준치 10% / 30%</span>
                <span>100%</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '14px', textTransform: 'uppercase' }}>감지 항목</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ins.classes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: i < ins.classes.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        {classLabel[c.type] ?? c.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '80px', background: '#f3f4f6', borderRadius: '100px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${c.area_ratio * 100 / 0.5 * 100}%`, maxWidth: '100%', height: '100%', background: '#374151', borderRadius: '100px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', minWidth: '36px', textAlign: 'right' }}>{(c.area_ratio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '14px', textTransform: 'uppercase' }}>자동 처리 결과</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ins.actions.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < ins.actions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#111827', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151' }}>{actionLabel[a] ?? a}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af' }}>완료</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}