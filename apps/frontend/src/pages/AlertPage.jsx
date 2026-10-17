import { useState } from 'react'
import { Plate } from '../components/ui'
import './AlertPage.css'

const TYPES = {
  block:   { label: '배차 중단',     tone: 'stop' },
  wash:    { label: '세차 호출',     tone: 'wash' },
  notify:  { label: '디스코드 알림', tone: 'wait' },
  penalty: { label: '패널티',        tone: 'wait' },
  normal:  { label: '정상 반납',     tone: 'go' },
}

const alerts = [
  { type: 'block',   plate: '12가3456', title: '배차를 자동으로 멈췄어요', desc: '오염 면적 23.5%로 심각 판정이 나와 배차를 막고, 잡혀 있던 예약을 다른 차량으로 바꿨어요.', time: '14:32' },
  { type: 'wash',    plate: '12가3456', title: '세차 업체를 불렀어요',     desc: '제휴 업체 WC-0042에 요청했어요. 15:00 도착 예정이에요.', time: '14:33' },
  { type: 'notify',  plate: '12가3456', title: '디스코드로 알렸어요',       desc: '#fleet-alert 채널에 오염 감지 알림을 보냈어요.', time: '14:33' },
  { type: 'penalty', plate: '12가3456', title: '패널티를 예약했어요',       desc: '홍길동 님에게 50,000원을 예약하고 증거 사진을 S3에 저장했어요.', time: '14:33' },
  { type: 'normal',  plate: '56다1234', title: '정상 반납',                desc: '오염 면적 1.1%로 정상 판정이 나와 바로 운행 가능으로 바꿨어요.', time: '12:50' },
  { type: 'normal',  plate: '78라5678', title: '정상 반납',                desc: '오염 면적 0.3%로 정상 판정이 나와 바로 운행 가능으로 바꿨어요.', time: '11:40' },
]

export default function AlertPage() {
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? alerts : alerts.filter(a => a.type === filter)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">알림 내역</h1>
          <p className="page-desc">AI 판정 뒤 시스템이 스스로 처리한 일을 모았어요.</p>
        </div>
      </header>

      <div className="chips alert-filters" role="group" aria-label="종류로 거르기">
        <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>전체</button>
        {Object.entries(TYPES).map(([key, t]) => (
          <button key={key} className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>{t.label}</button>
        ))}
      </div>

      <ol className="panel timeline">
        {shown.map((a, i) => (
          <li key={i} className={`timeline-item tone-${TYPES[a.type].tone}`}>
            <time className="timeline-time num">{a.time}</time>
            <span className="timeline-dot" aria-hidden="true" />
            <div className="timeline-body">
              <div className="timeline-head">
                <h2>{a.title}</h2>
                <Plate plate={a.plate} />
              </div>
              <p>{a.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
