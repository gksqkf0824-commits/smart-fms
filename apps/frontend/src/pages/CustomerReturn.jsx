import { useState } from 'react'

const gradeLabel = { BLOCK: '오염 심각', WARN: '경미한 오염', NORMAL: '정상' }
const gradeColor = { BLOCK: '#dc2626', WARN: '#b45309', NORMAL: '#16a34a' }
const gradeBg    = { BLOCK: '#fef2f2', WARN: '#fffbeb', NORMAL: '#f0fdf4' }
const classLabel = { trash: '고형 쓰레기', occupy: '두고 간 소지품' }

function Header() {
  return (
    <div style={{ background: '#1a2744', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '30px', height: '30px', background: '#4f8ef7', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: '900', fontSize: '12px' }}>E</span>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>EVIDA</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>VEHICLE INTERIOR AI</div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerReturn() {
  const [plate, setPlate] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!plate || !file) {
      setError('차량 번호와 사진을 모두 입력해주세요.')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('plate', plate)
    formData.append('image', file)
    try {
      const res = await fetch('/return', { method: 'POST', body: formData })
      if (res.status === 404) {
        const data = await res.json()
        setError(data.detail || '차량번호를 확인해주세요.')
        return
      }
      if (!res.ok) {
        setError('반납 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }
      setResult(await res.json())
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPlate(''); setFile(null); setPreview(null); setResult(null); setError(null)
  }

  /* 로딩 */
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 58px)', gap: '16px' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid #e5e7eb', borderTopColor: '#1a2744', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a2744' }}>AI가 실내를 분석하고 있어요</div>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>잠시만 기다려주세요</div>
      </div>
    </div>
  )

  /* 결과 */
  if (result) {
    const hasBelongings = result.actions?.includes('belongings_notified')
    const color = gradeColor[result.grade] ?? '#374151'
    const bg = gradeBg[result.grade] ?? '#f9fafb'
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header />
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>{result.vehicle}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a2744', marginBottom: '14px' }}>반납이 완료되었습니다</div>
            <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '12px', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>오염도</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color }}>{(result.roi_pollution_ratio * 100).toFixed(1)}%</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>판정</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color }}>{gradeLabel[result.grade] ?? result.grade}</div>
              </div>
            </div>
          </div>

          {result.classes?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>감지 항목</div>
              {result.classes.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < result.classes.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{classLabel[c.type] ?? c.type}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a2744' }}>{(c.area_ratio * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          {hasBelongings && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px' }}>두고 가신 물건이 있어요</div>
              <div style={{ fontSize: '13px', color: '#3b82f6', lineHeight: '1.6' }}>소지품이 발견되어 안내드렸습니다. 분실물 센터로 문의해 주세요.</div>
            </div>
          )}

          {result.grade === 'NORMAL' && !hasBelongings && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>깨끗하게 이용해 주셨어요!</div>
              <div style={{ fontSize: '13px', color: '#22c55e' }}>반납이 정상적으로 완료되었습니다.</div>
            </div>
          )}

          <button onClick={handleReset} style={{ width: '100%', padding: '15px', background: '#1a2744', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,39,68,0.3)' }}>
            처음으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  /* 입력 */
  return (
    <div style={{ height: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '480px', width: '100%', margin: '0 auto', padding: '16px 20px', boxSizing: 'border-box' }}>

        {/* 스텝 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: plate ? '#1a2744' : '#e5e7eb', color: plate ? '#fff' : '#9ca3af', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: plate ? '#1a2744' : '#9ca3af' }}>차량 번호</span>
          </div>
          <div style={{ flex: 1, height: '1px', background: plate ? '#1a2744' : '#e5e7eb' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: file ? '#1a2744' : '#e5e7eb', color: file ? '#fff' : '#9ca3af', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: file ? '#1a2744' : '#9ca3af' }}>사진 등록</span>
          </div>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e5e7eb', color: '#9ca3af', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>결과 확인</span>
          </div>
        </div>

        {/* 타이틀 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2744', marginBottom: '4px' }}>차량 반납</div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>차량 번호와 실내 사진을 등록해주세요</div>
        </div>

        {/* 차량 번호 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>차량 번호</label>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="예: 12가3456"
            style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${plate ? '#1a2744' : '#e5e7eb'}`, borderRadius: '10px', fontSize: '16px', color: '#1a2744', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {/* 사진 업로드 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>실내 사진</label>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            {preview ? (
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #1a2744', position: 'relative' }}>
                <img src={preview} alt="미리보기" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                  탭해서 다시 선택
                </div>
              </div>
            ) : (
              <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a2744', marginBottom: '4px' }}>사진 촬영 / 업로드</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>탭해서 카메라를 열거나 사진을 선택하세요</div>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', fontSize: '13px', marginBottom: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(220,38,38,0.12)' }}>
            {error}
          </div>
        )}

        {/* 버튼 — 에러 없으면 사진 바로 아래, 있으면 에러 바로 아래 */}
        <button
          onClick={handleSubmit}
          disabled={!plate || !file}
          style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
            background: (!plate || !file) ? '#e5e7eb' : '#1a2744',
            color: (!plate || !file) ? '#9ca3af' : '#fff',
            fontSize: '16px', fontWeight: '700',
            cursor: (!plate || !file) ? 'not-allowed' : 'pointer',
            boxShadow: (!plate || !file) ? 'none' : '0 4px 14px rgba(26,39,68,0.3)',
            transition: 'all 0.2s',
          }}
        >
          반납하기
        </button>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#d1d5db' }}>
          문의사항은 관리자에게 연락해 주세요
        </div>
      </div>
    </div>
  )
}