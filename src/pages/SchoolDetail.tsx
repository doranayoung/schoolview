import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClubCard, SubjectCard } from '../components/Cards'
import { getSchool } from '../data'
import type { SubjectCategory } from '../types'

type Tab = 'intro' | 'subjects' | 'clubs' | 'qna'
const tabs: { id: Tab; label: string }[] = [
  { id: 'intro', label: '소개' },
  { id: 'subjects', label: '선택과목' },
  { id: 'clubs', label: '동아리' },
  { id: 'qna', label: '재학생 Q&A' },
]
const categories: (SubjectCategory | '전체')[] = ['전체', '공통', '일반선택', '진로선택', '융합선택']

export default function SchoolDetail() {
  const { id = '' } = useParams()
  const school = getSchool(id)
  const [tab, setTab] = useState<Tab>('intro')
  const [category, setCategory] = useState<SubjectCategory | '전체'>('전체')

  if (!school) {
    return (
      <p>
        학교를 찾을 수 없어요. <Link to="/">학교 목록으로</Link>
      </p>
    )
  }

  const subjects = school.subjects
    .filter((s) => category === '전체' || s.category === category)
    .sort((a, b) => a.grade - b.grade)

  return (
    <>
      <Link to="/" className="back">
        ← 학교 목록
      </Link>
      <section className="school-head">
        <h1>
          {school.name} {school.isSample && <span className="badge badge-sample">예시</span>}
        </h1>
        <p className="muted">
          {school.region} · {school.type} · 학년당 {school.classesPerGrade}학급
        </p>
      </section>

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'tab tab-on' : 'tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'intro' && (
        <section className="card">
          <p>{school.intro}</p>
          <ul className="list">
            {school.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="muted small">
            정보 출처: {school.sources.join(', ')} · 최종 수정 {school.updatedAt}
          </p>
        </section>
      )}

      {tab === 'subjects' && (
        <>
          <div className="chips">
            {categories.map((c) => (
              <button key={c} className={category === c ? 'chip chip-on' : 'chip'} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid">
            {subjects.map((s) => (
              <SubjectCard key={s.name} subject={s} />
            ))}
            {subjects.length === 0 && <p className="muted">해당 분류의 과목 정보가 아직 없어요.</p>}
          </div>
        </>
      )}

      {tab === 'clubs' && (
        <div className="grid">
          {school.clubs.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}

      {tab === 'qna' && (
        <div className="stack">
          {school.qna.map((q) => (
            <article key={q.question} className="card">
              <h3>Q. {q.question}</h3>
              <p>A. {q.answer}</p>
              <p className="muted small">
                {q.answeredBy} 답변 · {q.reviewedBy} 확인
              </p>
            </article>
          ))}
          {school.qna.length === 0 && <p className="muted">아직 등록된 답변이 없어요.</p>}
        </div>
      )}
    </>
  )
}
