import { useState, useRef } from 'react'

const API_BASE = 'http://localhost:8080'

const gradeConfig = {
  NORMAL: { label: '정상',  color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: '정상' },
  WARN:   { label: '경고',  color: '#b45309', bg: '#fef9c3', border: '#fde68a', icon: '경고' },
  BLOCK:  { label: '심각',  color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: '심각' },
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

const classLabel = { trash: '고형 쓰레기', spill: '액체·얼룩' }

export default function ReturnAccept() {
  const [plate, setPlate] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  async function handleSubmit() {
    if (!plate.trim()) { setError('차량 번호를 입력해주세요.'); return }
    if (!file) { setError('사진을 선택해주세요.'); return }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('plate', plate.trim())
    formData.append('image', file)

    try {
      const res = await fetch(`${API_BASE}/return`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const grade = result ? gradeConfig[result.grade] : null

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>반납 접수</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '20px' }}>반납 접수</div>

      {/* 반납 폼 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744', marginBottom: '16px' }}>차량 반납 접수</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>차량 번호</label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value)}
              placeholder="예: 12가3456"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>실내 사진</label>
            <div
              onClick={() => fileRef.current.click()}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: file ? '#333' : '#aaa', background: '#fafafa' }}
            >
              {file ? file.name : '사진 파일 선택...'}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '10px 24px', background: loading ? '#94a3b8' : '#1a2744', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
          >
            {loading ? '분석 중...' : '반납하기'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#dc2626' }}>
            {error}
          </div>
        )}
      </div>

      {/* 분석 결과 */}
      {result && grade && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px', border: `1.5px solid ${grade.border}` }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744', marginBottom: '16px' }}>AI 분석 결과</div>

          {/* 등급 + 오염도 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: grade.bg, border: `1.5px solid ${grade.border}`, borderRadius: '10px', padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: grade.color, fontWeight: '700', marginBottom: '4px' }}>판정 등급</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: grade.color }}>{grade.label}</div>
            </div>
            <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: '700', marginBottom: '4px' }}>합산 오염도</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: grade.color }}>{(result.roi_pollution_ratio * 100).toFixed(1)}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#f0f0f0', borderRadius: '20px', height: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: `${result.roi_pollution_ratio * 100}%`, height: '100%', borderRadius: '20px', background: `linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)`, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa' }}>
                <span>0%</span><span>기준치 10% / 30%</span><span>100%</span>
              </div>
            </div>
          </div>

          {/* 감지 항목 */}
          {result.classes && result.classes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px' }}>감지 항목</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {result.classes.map((c, i) => (
                  <div key={i} style={{ background: c.type === 'trash' ? '#fee2e2' : '#fef9c3', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: c.type === 'trash' ? '#dc2626' : '#b45309', fontWeight: '600' }}>
                    {classLabel[c.type] ?? c.type} · {(c.area_ratio * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 자동 처리 결과 */}
          {result.actions && result.actions.length > 0 ? (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px' }}>자동 처리 결과</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.actions.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: actionColor[a] ?? '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2744' }}>{actionLabel[a] ?? a}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
              오염이 감지되지 않았습니다. 정상 반납 처리되었습니다.
            </div>
          )}
        </div>
      )}

      {/* 접수 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a2744' }}>오늘 반납 접수 목록</div>
        </div>
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', padding: '24px' }}>
          반납 접수 내역이 없습니다.
        </div>
      </div>
    </div>
  )
}
