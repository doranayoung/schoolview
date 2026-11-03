import { Link } from 'react-router-dom'
import { interests, schools } from '../data'
import { recruitStatus } from '../utils/recruit'

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>선배가 없어도, 학교 안을 미리 볼 수 있게</h1>
        <p>고등학교의 선택과목·동아리·학교생활을 같은 틀로 정리했어요. 학교 순위가 아니라 내 관심 진로로 찾아보세요.</p>
        <div className="chips">
          {interests.map((i) => (
            <Link key={i.id} className="chip" to={`/explore?interest=${i.id}`}>
              {i.label}
            </Link>
          ))}
        </div>
      </section>

      <h2 className="section-title">학교 둘러보기</h2>
      <div className="grid">
        {schools.map((s) => {
          const openClubs = s.clubs.filter((c) => recruitStatus(c.recruit) === 'open').length
          return (
            <Link key={s.id} to={`/school/${s.id}`} className="card card-link">
              <div className="card-head">
                <h3>{s.name}</h3>
                {s.isSample && <span className="badge badge-sample">예시</span>}
              </div>
              <p className="muted">
                {s.region} · {s.type} · 학년당 {s.classesPerGrade}학급
              </p>
              <p>{s.intro}</p>
              <p className="muted">
                선택과목 {s.subjects.length}개 · 동아리 {s.clubs.length}개
                {openClubs > 0 && <strong className="accent"> · 모집 중 {openClubs}</strong>}
              </p>
            </Link>
          )
        })}
      </div>
    </>
  )
}
