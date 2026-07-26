import { useState, useRef, useEffect } from 'react'

const zones = [
  { id: 'main',   label: '전체 실내', file: '/car-main.png',    pollution: 28.3 },
  { id: 'back',   label: '뒷좌석',    file: '/seat-back.jpg',   pollution: 19.7 },
  { id: 'driver', label: '운전석',    file: '/seat-driver.png', pollution: 12.1 },
  { id: 'rear',   label: '앞좌석',    file: '/seat-rear.png',   pollution: 8.4  },
]

const detections = {
  main:   [
    { label: '시트 오염', zone: '좌측', conf: 96.1, area: '28.3%', sev: '심각', sevColor: '#ef4444', sevBg: 'rgba(127,29,29,0.85)', barColor: '#ef4444', cx: '22%', cy: '62%', rx: '14%', ry: '10%' },
    { label: '시트 오염', zone: '우측', conf: 89.4, area: '19.7%', sev: '심각', sevColor: '#ef4444', sevBg: 'rgba(127,29,29,0.85)', barColor: '#ef4444', cx: '72%', cy: '55%', rx: '12%', ry: '9%' },
    { label: '이물질',    zone: '센터', conf: 74.2, area: '-',     sev: '경미', sevColor: '#f59e0b', sevBg: 'rgba(66,32,6,0.85)',   barColor: '#f59e0b', cx: '48%', cy: '70%', rx: '6%',  ry: '4%' },
  ],
  back:   [{ label: '시트 오염', zone: '뒷좌석', conf: 82.3, area: '19.7%', sev: '심각', sevColor: '#ef4444', sevBg: 'rgba(127,29,29,0.85)', barColor: '#ef4444', cx: '35%', cy: '60%', rx: '18%', ry: '12%' }],
  driver: [{ label: '시트 오염', zone: '운전석', conf: 78.5, area: '12.1%', sev: '경미', sevColor: '#f59e0b', sevBg: 'rgba(66,32,6,0.85)',   barColor: '#f59e0b', cx: '55%', cy: '65%', rx: '14%', ry: '10%' }],
  rear:   [{ label: '이물질',    zone: '앞좌석', conf: 74.2, area: '8.4%',  sev: '경미', sevColor: '#f59e0b', sevBg: 'rgba(66,32,6,0.85)',   barColor: '#f59e0b', cx: '30%', cy: '72%', rx: '10%', ry: '7%' }],
}

const actions = [
  { color: '#ef4444', label: '배차 자동 중단', detail: '14:32:07 자동 실행' },
  { color: '#f59e0b', label: '세차 업체 호출', detail: 'partner_id: WC-0042' },
  { color: '#4f8ef7', label: 'Slack 알림 전송', detail: '#fleet-alert · 200 OK' },
  { color: '#a855f7', label: '패널티 예약',    detail: 'KRW 50,000 · U-8821' },
]

export default function AIAnalysis() {
  const [selected, setSelected] = useState('main')
  const [showMask, setShowMask] = useState(true)
  const [scoreW, setScoreW] = useState(0)
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  const zone = zones.find(z => z.id === selected)
  const dets = detections[selected]
  const pollColor = zone.pollution >= 20 ? '#ef4444' : zone.pollution >= 10 ? '#f59e0b' : '#22c55e'

  useEffect(() => {
    setScoreW(0)
    setTimeout(() => setScoreW(zone.pollution), 100)
  }, [selected])

  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    function draw() {
      if (!showMask) { canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); return }
      canvas.width = img.offsetWidth
      canvas.height = img.offsetHeight
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const W = canvas.width, H = canvas.height
      const points = dets.map(d => ({
        x: parseFloat(d.cx) / 100 * W,
        y: parseFloat(d.cy) / 100 * H,
        rx: parseFloat(d.rx) / 100 * W,
        ry: parseFloat(d.ry) / 100 * H,
        intensity: d.conf / 100,
      }))
      const imageData = ctx.createImageData(W, H)
      const data = imageData.data
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let heat = 0
          for (const p of points) {
            const dx = (x - p.x) / p.rx
            const dy = (y - p.y) / p.ry
            heat += p.intensity * Math.exp(-(dx * dx + dy * dy) * 2)
          }
          heat = Math.min(1, heat)
          if (heat > 0.05) {
            const idx = (y * W + x) * 4
            let r, g, b
            if (heat < 0.25)      { r = 0;   g = Math.floor(heat * 4 * 255); b = 255 }
            else if (heat < 0.5)  { r = 0;   g = 255; b = Math.floor((1 - (heat - 0.25) * 4) * 255) }
            else if (heat < 0.75) { r = Math.floor((heat - 0.5) * 4 * 255); g = 255; b = 0 }
            else                  { r = 255; g = Math.floor((1 - (heat - 0.75) * 4) * 255); b = 0 }
            data[idx] = r; data[idx+1] = g; data[idx+2] = b
            data[idx+3] = Math.floor(heat * 180)
          }
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }

    if (img.complete) draw(); else img.onload = draw
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [selected, showMask, dets])

  const font = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0c14', color: '#cdd6f4', fontFamily: font }}>

      {/* 상단 헤더 */}
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

      {/* 스텝 바 */}
      <div style={{ background: '#0d0f1a', borderBottom: '1px solid #1e2235', padding: '0 20px', height: '34px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {['이미지 업로드', '번호판·얼굴 마스킹', 'YOLO 추론 중', '오염도 판정', '자동 조치'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: '700', flexShrink: 0,
                background: i < 2 ? '#22c55e' : i === 2 ? '#4f8ef7' : '#1e2235',
                color: i < 2 ? '#fff' : i === 2 ? '#fff' : '#4a5568',
              }}>{i < 2 ? '✓' : i + 1}</div>
              <span style={{ fontSize: '11px', color: i < 2 ? '#22c55e' : i === 2 ? '#4f8ef7' : '#4a5568', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < 4 && <div style={{ width: '24px', height: '1px', background: i < 2 ? '#22c55e' : '#1e2235' }} />}
          </div>
        ))}
      </div>

      {/* 본문 3단 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ① 좌측: 썸네일 (고정 너비) */}
        <div style={{ width: '155px', background: '#0d0f1a', borderRight: '1px solid #1e2235', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px', paddingBottom: '6px', borderBottom: '1px solid #1e2235' }}>촬영 구역 선택</div>
          {zones.map(z => (
            <div key={z.id} onClick={() => setSelected(z.id)} style={{
              borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
              border: selected === z.id ? '2px solid #4f8ef7' : '1px solid #1e2235',
              background: selected === z.id ? 'rgba(79,142,247,0.08)' : '#111827',
              transition: 'all 0.15s',
            }}>
              <img src={z.file} alt={z.label} style={{ width: '100%', height: '72px', objectFit: 'cover', display: 'block', opacity: selected === z.id ? 1 : 0.55, transition: 'opacity 0.15s' }} />
              <div style={{ padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: selected === z.id ? '#fff' : '#4a5568', fontWeight: selected === z.id ? '600' : '400' }}>{z.label}</span>
                <span style={{ fontSize: '11px', color: z.pollution >= 10 ? '#ef4444' : '#f59e0b', fontWeight: '700' }}>{z.pollution}%</span>
              </div>
            </div>
          ))}

          <div style={{ border: '1px dashed #1e2235', borderRadius: '6px', padding: '10px 8px', textAlign: 'center', marginTop: '4px' }}>
            <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '6px' }}>사진 업로드</div>
            <button style={{ width: '100%', padding: '6px', background: '#4f8ef7', border: 'none', borderRadius: '5px', color: 'white', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>파일 선택</button>
          </div>

          <div style={{ background: '#111827', borderRadius: '6px', padding: '8px 10px', border: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '4px' }}>차량 정보</div>
            <div style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>서울 12가 3456</div>
            <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>2026.07.05 14:32</div>
          </div>
        </div>

        {/* ② 가운데: 이미지 뷰어 (축소) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f1a', minWidth: 0 }}>
          <div style={{ background: '#0f1117', borderBottom: '1px solid #1e2235', padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: '#8892b0' }}>{zone.label} · 서울 12가 3456</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['마스크', '원본', '비교'].map((t, i) => (
                <button key={t} onClick={() => i === 0 && setShowMask(!showMask)} style={{
                  padding: '3px 10px', borderRadius: '4px', fontSize: '11px', border: 'none', cursor: 'pointer',
                  background: (i === 0 && showMask) ? '#4f8ef7' : '#1a1f2e',
                  color: (i === 0 && showMask) ? '#fff' : '#4a5568', fontWeight: '600',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* 이미지 + 히트맵 */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c14' }}>
            <img ref={imgRef} src={zone.file} alt="차량 실내" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
            {showMask && <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />}
            {showMask && dets.map((d, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `calc(${d.cx} - ${d.rx} - 4px)`,
                top: `calc(${d.cy} - ${d.ry} - 24px)`,
                background: d.sevBg, border: `1px solid ${d.sevColor}`,
                borderRadius: '3px', padding: '2px 8px',
                fontSize: '10px', color: d.sevColor, fontWeight: '600', whiteSpace: 'nowrap',
              }}>{d.label} {d.conf}%</div>
            ))}
          </div>

          {/* 컬러바 + 하단 */}
          <div style={{ background: '#0f1117', borderTop: '1px solid #1e2235', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', color: '#4a5568' }}>Low</span>
            <div style={{ width: '120px', height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }} />
            <span style={{ fontSize: '10px', color: '#4a5568' }}>High</span>
            <span style={{ fontSize: '10px', color: '#2d3555', marginLeft: '12px' }}>불투명도</span>
            <input type="range" min="0" max="100" defaultValue="70" style={{ width: '70px', accentColor: '#4f8ef7' }} />
            <div style={{ flex: 1 }} />
            <button style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>배차 중단</button>
            <button style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: '4px', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>세차 호출</button>
            <span style={{ fontSize: '10px', color: '#22c55e', marginLeft: '8px' }}>24fps · 41.7ms</span>
          </div>
        </div>

        {/* ③ 우측: 분석 결과 (넓게) */}
        <div style={{ width: '280px', background: '#0d0f1a', borderLeft: '1px solid #1e2235', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>

          {/* 오염도 스코어 */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>오염도 스코어</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: pollColor, lineHeight: 1 }}>{zone.pollution}%</div>
              <div style={{ background: pollColor === '#ef4444' ? 'rgba(127,29,29,0.4)' : 'rgba(66,32,6,0.4)', border: `1px solid ${pollColor}`, borderRadius: '4px', padding: '3px 10px', fontSize: '11px', color: pollColor, fontWeight: '700' }}>
                {zone.pollution >= 20 ? 'SEVERE' : zone.pollution >= 10 ? 'MODERATE' : 'MINOR'}
              </div>
            </div>
            <div style={{ background: '#1e2235', borderRadius: '3px', height: '7px', marginBottom: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${scoreW}%`, background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)', transition: 'width 1.2s ease', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#2d3555' }}>
              <span>0%</span><span style={{ color: '#4a5568' }}>기준치: 10%</span><span>100%</span>
            </div>
            {zone.pollution >= 10 && (
              <div style={{ marginTop: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', padding: '7px 10px', fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>
                ⚠ 기준치 초과 → 배차 자동 중단
              </div>
            )}
          </div>

          {/* 감지 항목 */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>감지 항목 [{dets.length}건]</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dets.map((d, i) => (
                <div key={i} style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', borderLeft: `3px solid ${d.sevColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>{d.label} — {d.zone}</span>
                    <span style={{ fontSize: '10px', background: d.sevBg, color: d.sevColor, padding: '2px 7px', borderRadius: '3px', fontWeight: '700' }}>{d.sev}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '6px' }}>신뢰도 {d.conf}%{d.area !== '-' ? `  ·  면적 ${d.area}` : ''}</div>
                  <div style={{ background: '#1e2235', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.conf}%`, background: d.barColor, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 모델 통계 */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2235' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>모델 통계</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['추론 속도', '24fps', '#22c55e'], ['처리 시간', '41.7ms', '#22c55e'], ['mAP', '0.93', '#4f8ef7'], ['감지 수', `${dets.length}건`, '#f59e0b']].map(([l, v, c]) => (
                <div key={l} style={{ background: '#111827', borderRadius: '6px', padding: '10px 12px', border: '1px solid #1e2235' }}>
                  <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '4px' }}>{l}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 자동 처리 결과 */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '10px', color: '#4f8ef7', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px' }}>자동 처리 결과</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111827', borderRadius: '6px', padding: '9px 12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#cdd6f4', fontWeight: '600' }}>{a.label}</div>
                    <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '1px' }}>{a.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
