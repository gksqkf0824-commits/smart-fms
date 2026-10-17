import { Link, useNavigate } from 'react-router-dom'
import { formatShortDateTime } from '../fleet'
import { ChevronRight, Plate, RatioCell, StatusTag } from './ui'

// GET /vehicles 항목 목록. 행 전체를 누르면 차량 상세로 간다 (키보드는 번호판 링크로)
export default function VehicleTable({ vehicles, empty }) {
  const navigate = useNavigate()

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">차량</th>
            <th scope="col">배치 존</th>
            <th scope="col">최근 검수</th>
            <th scope="col">오염 면적</th>
            <th scope="col">상태</th>
            <th scope="col"><span className="sr-only">상세</span></th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 ? (
            <tr><td colSpan={6} className="empty">{empty}</td></tr>
          ) : vehicles.map(v => (
            <tr key={v.plate} className="row-link"
              onClick={e => { if (!e.target.closest('a')) navigate(`/vehicles/${v.plate}`) }}>
              <td><Link to={`/vehicles/${v.plate}`}><Plate plate={v.plate} /></Link></td>
              <td>{v.zone ?? <span className="muted">미지정</span>}</td>
              <td className="num">
                {v.last_checked ? formatShortDateTime(v.last_checked) : <span className="muted">검수 전</span>}
              </td>
              <td><RatioCell ratio={v.pollution_ratio} /></td>
              <td><StatusTag status={v.status} /></td>
              <td className="align-end"><ChevronRight className="chevron" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
