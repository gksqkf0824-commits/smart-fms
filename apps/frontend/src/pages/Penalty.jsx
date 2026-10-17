import { Plate, RatioCell } from '../components/ui'
import './Penalty.css'

const penalties = [
  { user: '홍길동', plate: '12가3456', checked_at: '07.05 14:32', roi_pollution_ratio: 0.235, trash_count: 2, trash_large: false, occupy_detected: true,  points: 50000, settled: false, user_alert: true  },
  { user: '김철수', plate: '34나7890', checked_at: '07.05 13:15', roi_pollution_ratio: 0.082, trash_count: 1, trash_large: false, occupy_detected: false, points: 20000, settled: true,  user_alert: false },
  { user: '이영희', plate: '90마2345', checked_at: '07.04 18:00', roi_pollution_ratio: 0.310, trash_count: 3, trash_large: true,  occupy_detected: true,  points: 80000, settled: false, user_alert: true  },
  { user: '박민수', plate: '78라5678', checked_at: '07.04 11:20', roi_pollution_ratio: 0.124, trash_count: 0, trash_large: false, occupy_detected: true,  points: 30000, settled: true,  user_alert: true  },
]

const summary = [
  { label: '이번 달 부과', value: '12건', sub: '310,000원' },
  { label: '정산 대기',   value: '5건',  sub: '130,000원' },
  { label: '정산 완료',   value: '7건',  sub: '180,000원' },
  { label: '자동 처리율', value: '83%',  sub: '사람 손을 거치지 않은 비율' },
]

function getDetectionText(p) {
  const items = []
  if (p.trash_count > 0) items.push(`고형 쓰레기 ${p.trash_count}개${p.trash_large ? ' (대형)' : ''}`)
  if (p.occupy_detected) items.push('두고 간 소지품')
  return items.join(', ') || '-'
}

export default function Penalty() {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">패널티</h1>
          <p className="page-desc">오염된 채로 반납한 이용자에게 부과한 패널티와 정산 상태예요.</p>
        </div>
        <button className="btn btn-secondary">엑셀로 내려받기</button>
      </header>

      <dl className="panel summary">
        {summary.map(s => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd className="num">{s.value}</dd>
            <dd className="summary-sub num">{s.sub}</dd>
          </div>
        ))}
      </dl>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">부과 내역</h2>
        </div>
        <div className="panel table-panel">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  {['이용자', '차량', '반납 일시', '오염 면적', '감지 항목'].map(h => <th key={h} scope="col">{h}</th>)}
                  <th scope="col" className="align-end">부과 금액</th>
                  <th scope="col">정산</th>
                  <th scope="col"><span className="sr-only">증거 사진</span></th>
                </tr>
              </thead>
              <tbody>
                {penalties.map(p => (
                  <tr key={p.plate + p.user}>
                    <td>{p.user}</td>
                    <td><Plate plate={p.plate} /></td>
                    <td className="num">{p.checked_at}</td>
                    <td><RatioCell ratio={p.roi_pollution_ratio} /></td>
                    <td>
                      {getDetectionText(p)}
                      {p.user_alert && <div className="penalty-note">소지품 안내를 보냈어요</div>}
                    </td>
                    <td className="align-end num"><strong>{p.points.toLocaleString()}원</strong></td>
                    <td>
                      <span className={`tag ${p.settled ? 'tone-go' : 'tone-wash'}`}>{p.settled ? '정산 완료' : '정산 대기'}</span>
                    </td>
                    <td className="align-end">
                      <button className="btn btn-secondary btn-sm">증거 사진</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
