import { Link, useSearchParams } from 'react-router-dom'
import { ClubCard, SubjectCard } from '../components/Cards'
import { interests, schools } from '../data'

const overlaps = (a: string[], b: string[]) => a.some((t) => b.includes(t))

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const selected = interests.find((i) => i.id === params.get('interest')) ?? interests[0]

  // 학교별로 관련 과목·동아리를 모은다. 순위가 아니라 "있는지"를 보여주는 게 목적.
  const results = schools
    .map((school) => ({
      school,
      subjects: school.subjects.filter((s) => overlaps(s.tags, selected.tags)),
      clubs: school.clubs.filter((c) => overlaps(c.tags, selected.tags)),
    }))
    .filter((r) => r.subjects.length + r.clubs.length > 0)

  return (
    <>
      <h1>관심 진로로 찾아보기</h1>
      <p className="muted">관심 진로와 관련된 과목·동아리가 있는 학교를 보여줘요. 학교 순위는 매기지 않아요.</p>
      <div className="chips">
        {interests.map((i) => (
          <button key={i.id} className={selected.id === i.id ? 'chip chip-on' : 'chip'} onClick={() => setParams({ interest: i.id })}>
            {i.label}
          </button>
        ))}
      </div>

      {results.map(({ school, subjects, clubs }) => (
        <section key={school.id} className="result">
          <h2 className="section-title">
            <Link to={`/school/${school.id}`}>{school.name}</Link>
            <small className="muted">
              {' '}
              과목 {subjects.length} · 동아리 {clubs.length}
            </small>
          </h2>
          <div className="grid">
            {subjects.map((s) => (
              <SubjectCard key={s.name} subject={s} highlight={selected.tags} />
            ))}
            {clubs.map((c) => (
              <ClubCard key={c.id} club={c} highlight={selected.tags} />
            ))}
          </div>
        </section>
      ))}
      {results.length === 0 && <p className="muted">아직 관련 정보가 등록된 학교가 없어요.</p>}
    </>
  )
}
