import { ACTION_LABEL, formatPct, ratioTone, verdictReasons } from '../fleet'
import { CheckIcon, GradeTag, PollutionScale } from './ui'

// 검수 1건(ins)의 등급·오염 면적·판정 이유. ins는 latest_inspection 또는 POST /return 응답
export function Verdict({ ins }) {
  const ratio = ins.roi_pollution_ratio ?? 0
  return (
    <div className={`verdict tone-${ratioTone(ratio)}`}>
      <div className="verdict-head">
        <span className="verdict-label">오염 면적</span>
        <GradeTag grade={ins.grade} />
      </div>
      <p className="verdict-ratio">{formatPct(ratio)}</p>
      <PollutionScale ratio={ratio} />
      <ul className="verdict-reasons">
        {verdictReasons(ins).map(r => <li key={r}>{r}</li>)}
      </ul>
    </div>
  )
}

export function Detections({ ins }) {
  const rows = []
  if (ins.trash_count > 0) rows.push(['고형 쓰레기', `${ins.trash_count}개${ins.trash_large ? ', 대형 포함' : ''}`])
  if (ins.occupy_detected) rows.push(['두고 간 소지품', '있음'])
  if (rows.length === 0) return <p className="muted">감지된 물체가 없어요</p>
  return (
    <dl className="facts">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  )
}

// 판정 뒤 시스템이 실행한 조치 — 실행 순서대로 나열
export function ActionSteps({ actions }) {
  if (!actions?.length) return <p className="muted">자동으로 처리한 일이 없어요</p>
  return (
    <ol className="steps">
      {actions.map(a => (
        <li key={a}><CheckIcon />{ACTION_LABEL[a] ?? a}</li>
      ))}
    </ol>
  )
}
