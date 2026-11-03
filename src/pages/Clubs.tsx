import { useState } from 'react'
import { ClubCard } from '../components/Cards'
import { schools } from '../data'
import { recruitStatus, type RecruitStatus } from '../utils/recruit'

const filters: { id: RecruitStatus | 'all'; label: string }[] = [
  { id: 'open', label: '모집 중' },
  { id: 'upcoming', label: '모집 예정' },
  { id: 'all', label: '전체' },
]
const order: Record<RecruitStatus, number> = { open: 0, upcoming: 1, none: 2, closed: 3 }

export default function Clubs() {
  const [filter, setFilter] = useState<RecruitStatus | 'all'>('open')
  const [schoolId, setSchoolId] = useState('all')

  const items = schools
    .filter((s) => schoolId === 'all' || s.id === schoolId)
    .flatMap((s) => s.clubs.map((club) => ({ club, school: s })))
    .map((x) => ({ ...x, status: recruitStatus(x.club.recruit) }))
    .filter((x) => filter === 'all' || x.status === filter)
    .sort((a, b) => order[a.status] - order[b.status] || (a.club.recruit?.end ?? '').localeCompare(b.club.recruit?.end ?? ''))

  return (
    <>
      <h1>동아리 모집 한눈에 보기</h1>
      <p className="muted">마감이 가까운 순서로 보여줘요.</p>
      <div className="toolbar">
        <div className="chips">
          {filters.map((f) => (
            <button key={f.id} className={filter === f.id ? 'chip chip-on' : 'chip'} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} aria-label="학교 선택">
          <option value="all">모든 학교</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid">
        {items.map(({ club, school }) => (
          <ClubCard key={club.id} club={club} schoolName={school.name} />
        ))}
      </div>
      {items.length === 0 && <p className="muted">조건에 맞는 동아리가 없어요.</p>}
    </>
  )
}
