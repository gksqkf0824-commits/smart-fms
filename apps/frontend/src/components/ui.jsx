import { BLOCK_RATIO, GRADE, STATUS, WARN_RATIO, formatPct, formatPlate, ratioTone } from '../fleet'

/* ---------- icons ---------- */

function Svg({ size = 20, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

export const ChevronRight = (p) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
export const ChevronLeft  = (p) => <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>
export const ChevronDown  = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
export const SearchIcon   = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
export const CameraIcon   = (p) => <Svg {...p}><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.7l1.6-2.2h6.4L16.8 7h2.7A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /><circle cx="12" cy="13" r="3.5" /></Svg>
export const CheckIcon    = (p) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>

/* ---------- brand ---------- */

// 카메라 뷰파인더 모서리 + 가로 스캔선: 사진 한 장을 훑어 판정한다는 뜻
export function Logo({ size = 26 }) {
  return (
    <span className="logo">
      <svg className="logo-mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect width="24" height="24" rx="7" />
        <path d="M7 10V7h3M17 14v3h-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="logo-word">evida</span>
    </span>
  )
}

/* ---------- vehicle ---------- */

export function Plate({ plate, size }) {
  return <span className={size === 'lg' ? 'plate plate-lg' : 'plate'}>{formatPlate(plate)}</span>
}

export function StatusTag({ status }) {
  const s = STATUS[status] ?? { label: status, tone: 'wait' }
  return <span className={`tag tone-${s.tone}`}>{s.label}</span>
}

export function GradeTag({ grade }) {
  const g = GRADE[grade] ?? { label: grade, tone: 'wait' }
  return <span className={`tag tag-solid tone-${g.tone}`}>{g.label}</span>
}

/* ---------- pollution ---------- */

// 오염도 막대는 0~10% 구간을 보여 준다. 실제 판정이 2%·5%에서 갈리기 때문에
// 0~100%로 그리면 8%도 거의 빈 막대처럼 보인다.
const SCALE_MAX = 0.1
const at = (ratio) => `${(ratio / SCALE_MAX) * 100}%`

export function PollutionScale({ ratio, compact = false }) {
  const fill = Math.min(ratio / SCALE_MAX, 1) * 100
  const label = `오염 면적 ${formatPct(ratio)}, 경고 기준 ${WARN_RATIO * 100}%, 심각 기준 ${BLOCK_RATIO * 100}%`
  return (
    <div className={`scale tone-${ratioTone(ratio)}${compact ? ' scale-compact' : ''}`}>
      <div className="scale-track" role="img" aria-label={label}>
        <span className="scale-fill" style={{ width: `${fill}%` }} />
        <span className="scale-tick" style={{ left: at(WARN_RATIO) }} />
        <span className="scale-tick" style={{ left: at(BLOCK_RATIO) }} />
      </div>
      {!compact && (
        <div className="scale-legend" aria-hidden="true">
          <span style={{ left: 0 }}>0</span>
          <span className="at" style={{ left: at(WARN_RATIO) }}>경고 {WARN_RATIO * 100}%</span>
          <span className="at" style={{ left: at(BLOCK_RATIO) }}>심각 {BLOCK_RATIO * 100}%</span>
          <span style={{ right: 0 }}>{ratio > SCALE_MAX ? '10% 넘음' : '10%'}</span>
        </div>
      )}
    </div>
  )
}

export function RatioCell({ ratio }) {
  if (ratio == null) return <span className="muted">검수 전</span>
  return (
    <span className={`ratio-cell tone-${ratioTone(ratio)}`}>
      <span className="ratio-value">{formatPct(ratio)}</span>
      <PollutionScale ratio={ratio} compact />
    </span>
  )
}

/* ---------- feedback ---------- */

export function Notice({ tone, title, children }) {
  return (
    <div className={tone ? `notice notice-${tone}` : 'notice'} role={tone === 'error' ? 'alert' : undefined}>
      {title && <strong>{title}</strong>}
      {children}
    </div>
  )
}
