import { useState } from 'react'
import type { Club, Subject } from '../types'
import { daysLeft, formatDate, recruitStatus, statusLabel } from '../utils/recruit'

export function Tags({ tags, highlight = [] }: { tags: string[]; highlight?: string[] }) {
  return (
    <div className="tags">
      {tags.map((tag) => (
        <span key={tag} className={highlight.includes(tag) ? 'tag tag-on' : 'tag'}>
          #{tag}
        </span>
      ))}
    </div>
  )
}

export function SubjectCard({ subject, highlight }: { subject: Subject; highlight?: string[] }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>{subject.name}</h3>
        <span className="badge">{subject.category}</span>
      </div>
      <dl className="meta">
        <div>
          <dt>학년·학점</dt>
          <dd>
            {subject.grade}학년 · {subject.credits}학점
          </dd>
        </div>
        <div>
          <dt>수업 방식</dt>
          <dd>{subject.teachingStyle.join(', ')}</dd>
        </div>
        <div>
          <dt>평가 유형</dt>
          <dd>{subject.assessment.join(', ')}</dd>
        </div>
        {subject.room && (
          <div>
            <dt>교실</dt>
            <dd>{subject.room}</dd>
          </div>
        )}
      </dl>
      {subject.seniorComment && <p className="senior">선배 한마디 · {subject.seniorComment}</p>}
      <Tags tags={subject.tags} highlight={highlight} />
    </article>
  )
}

export function RecruitBadge({ club }: { club: Club }) {
  const status = recruitStatus(club.recruit)
  let extra = ''
  if (status === 'open' && club.recruit) {
    const left = daysLeft(club.recruit)
    extra = left === 0 ? ' · 오늘 마감' : ` · D-${left}`
  }
  return <span className={`status status-${status}`}>{statusLabel[status] + extra}</span>
}

export function ClubCard({ club, schoolName, highlight }: { club: Club; schoolName?: string; highlight?: string[] }) {
  const [showSurvey, setShowSurvey] = useState(false)
  const status = recruitStatus(club.recruit)

  return (
    <article className="card">
      <div className="card-head">
        <h3>{club.name}</h3>
        <RecruitBadge club={club} />
      </div>
      <p className="muted">
        {schoolName ? `${schoolName} · ` : ''}
        {club.category}
      </p>
      <p>{club.description}</p>
      <ul className="list">
        {club.activities.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      {club.recruit && (
        <div className="recruit">
          <p>
            <strong>모집</strong> {formatDate(club.recruit.start)} ~ {formatDate(club.recruit.end)}
          </p>
          {club.recruit.interview && (
            <p>
              <strong>면접</strong> {club.recruit.interview}
            </p>
          )}
          {club.recruit.notice && <p className="muted">{club.recruit.notice}</p>}
        </div>
      )}
      {club.survey && status !== 'closed' && (
        <div>
          <button className="btn" onClick={() => setShowSurvey((v) => !v)}>
            {showSurvey ? '사전 설문 닫기' : '지원 전 사전 설문 보기'}
          </button>
          {showSurvey && (
            <ol className="survey">
              {club.survey.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          )}
        </div>
      )}
      <Tags tags={club.tags} highlight={highlight} />
    </article>
  )
}
