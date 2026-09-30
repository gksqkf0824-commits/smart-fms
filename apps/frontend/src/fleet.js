// 화면 전체가 같이 쓰는 상태값·등급·표기 규칙 (docs/API.md 4·5번과 같은 값)

export const API_BASE = 'http://localhost:8080'

// 오염 등급 기준 — 백엔드 판정 규칙(docs/API.md 2번)과 같은 값
export const WARN_RATIO = 0.02
export const BLOCK_RATIO = 0.05
export const BLOCK_TRASH_COUNT = 3

// tone은 index.css의 .tone-* 클래스와 연결된다
export const STATUS = {
  AVAILABLE:      { label: '운행 가능', tone: 'go' },
  CARWASH_NEEDED: { label: '세차 필요', tone: 'wash' },
  INSPECTING:     { label: '검수 중',   tone: 'wait' },
}

export const GRADE = {
  NORMAL: { label: '정상', tone: 'go' },
  WARN:   { label: '경고', tone: 'wash' },
  BLOCK:  { label: '심각', tone: 'stop' },
}

export const ACTION_LABEL = {
  dispatch_blocked:  '배차 차단',
  carwash_requested: '세차 요청',
  penalty_reserved:  '패널티 예약',
  user_alerted:      '이전 이용자에게 소지품 안내',
  notified:          '디스코드 알림 전송',
}

export const ratioTone = (ratio) =>
  ratio >= BLOCK_RATIO ? 'stop' : ratio >= WARN_RATIO ? 'wash' : 'go'

export const formatPct = (ratio) => `${(ratio * 100).toFixed(1)}%`

// 12가3456 → 12가 3456 (실제 번호판처럼 한글 뒤를 띄운다)
export const formatPlate = (plate) =>
  plate ? plate.replace(/^(\d{2,3})([가-힣])(\d{4})$/, '$1$2 $3') : plate

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export const formatShortDateTime = (iso) =>
  new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })

export const networkMessage = (e) =>
  e.message === 'Failed to fetch' ? '서버에 연결할 수 없어요. 백엔드(8080)가 켜져 있는지 확인해 주세요.' : e.message

// 검수 결과가 왜 그 등급인지 — 판정 규칙을 문장으로 풀어 쓴다
export function verdictReasons(ins) {
  const reasons = []
  const ratio = ins.roi_pollution_ratio ?? 0
  if (ratio >= BLOCK_RATIO) reasons.push(`오염 면적이 심각 기준(${BLOCK_RATIO * 100}%) 이상이에요`)
  else if (ratio >= WARN_RATIO) reasons.push(`오염 면적이 경고 기준(${WARN_RATIO * 100}%) 이상이에요`)
  // 쓰레기와 오염 면적은 따로 판정하고, 둘 중 더 심각한 쪽이 최종 등급이 된다
  if (ins.trash_large) reasons.push('대형 쓰레기가 있어 심각 수준이에요')
  else if (ins.trash_count >= BLOCK_TRASH_COUNT) reasons.push(`쓰레기가 ${ins.trash_count}개로 심각 기준(${BLOCK_TRASH_COUNT}개) 이상이에요`)
  else if (ins.trash_count > 0) reasons.push(`쓰레기가 ${ins.trash_count}개 있어요. 쓰레기만 보면 경고 수준이에요`)
  if (reasons.length === 0) reasons.push('오염 면적과 쓰레기 모두 기준 아래예요')
  return reasons
}
