import { useEffect, useState, type FormEvent } from 'react'
import { QNA_QUESTIONS } from '../data/questions'
import { ANSWER_MAX, ANSWER_MIN, errorMessage, fetchApprovedAnswers, submitAnswer, type QnaAnswer } from '../lib/qna'
import { supabaseEnabled } from '../lib/supabase'
import type { School } from '../types'
import { findPersonalInfo } from '../utils/validateSchool'

type Load = { state: 'loading' } | { state: 'done'; answers: QnaAnswer[] } | { state: 'error'; message: string }

// 학교 상세의 "재학생 Q&A" 탭.
// 학교 파일에 들어 있는 Q&A + 검수를 통과한 재학생 답변(DB)을 보여주고, 답변 작성 창을 연다.
export default function QnaSection({ school, preview }: { school: School; preview?: boolean }) {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [writing, setWriting] = useState(false)

  useEffect(() => {
    if (!supabaseEnabled) return
    let cancelled = false
    fetchApprovedAnswers(school.id)
      .then((answers) => !cancelled && setLoad({ state: 'done', answers }))
      .catch((e: unknown) => !cancelled && setLoad({ state: 'error', message: errorMessage(e) }))
    return () => {
      cancelled = true
    }
  }, [school.id])

  const dbAnswers = load.state === 'done' ? load.answers : []
  const grouped = QNA_QUESTIONS.map((q) => ({ question: q, answers: dbAnswers.filter((a) => a.question_id === q.id) })).filter((g) => g.answers.length > 0)
  // 답변을 실제로 받을지는 서버가 정한다 (검수자가 등록된 학교만). 예시 학교는 기능 확인용.
  const canWrite = supabaseEnabled && school.qnaOpen && !preview
  const empty = school.qna.length === 0 && grouped.length === 0

  return (
    <div className="stack">
      {canWrite && (
        <div className="card qna-write">
          {writing ? (
            <QnaForm schoolId={school.id} onClose={() => setWriting(false)} />
          ) : (
            <div className="qna-cta">
              <p>
                <strong>{school.name} 재학생인가요?</strong> 정해진 질문에 답해 주세요. 학생회·담당 교사가 확인한 뒤 공개돼요.
              </p>
              <button className="btn btn-primary" onClick={() => setWriting(true)}>
                답변 쓰기
              </button>
            </div>
          )}
        </div>
      )}

      {school.qna.map((q) => (
        <article key={q.question} className="card">
          <h3>Q. {q.question}</h3>
          <p>A. {q.answer}</p>
          <p className="muted small">
            {q.answeredBy} 답변 · {q.reviewedBy} 확인
          </p>
        </article>
      ))}

      {grouped.map(({ question, answers }) => (
        <article key={question.id} className="card">
          <h3>Q. {question.text}</h3>
          {answers.map((a) => (
            <div key={a.id} className="answer">
              <p>A. {a.answer}</p>
              <p className="muted small">
                {a.grade}학년 재학생 답변{a.reviewed_by && ` · ${a.reviewed_by} 확인`}
              </p>
            </div>
          ))}
        </article>
      ))}

      {supabaseEnabled && load.state === 'loading' && <p className="muted small">재학생 답변을 불러오는 중이에요…</p>}
      {load.state === 'error' && <p className="muted small">재학생 답변을 불러오지 못했어요. {load.message}</p>}
      {empty && load.state !== 'loading' && <p className="muted">아직 등록된 답변이 없어요.</p>}
    </div>
  )
}

function QnaForm({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const [questionId, setQuestionId] = useState(QNA_QUESTIONS[0].id)
  const [grade, setGrade] = useState(0)
  const [answer, setAnswer] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const question = QNA_QUESTIONS.find((q) => q.id === questionId) ?? QNA_QUESTIONS[0]
  const length = answer.trim().length
  const personal = findPersonalInfo(answer)
  const ready = grade > 0 && length >= ANSWER_MIN && length <= ANSWER_MAX && agreed && personal.length === 0 && !sending

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setSending(true)
    setResult(null)
    try {
      await submitAnswer({ schoolId, questionId, answer, grade })
      setAnswer('')
      setAgreed(false)
      setResult({ ok: true, message: '제출했어요. 학생회·담당 교사가 확인한 뒤 공개돼요. 다른 질문에도 답할 수 있어요.' })
    } catch (err) {
      setResult({ ok: false, message: errorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="survey-form qna-form" onSubmit={(e) => void submit(e)}>
      <p className="notice small">
        이름·연락처는 쓰지 않아요. 답변에는 학년만 표시돼요. 다른 사람을 비난하거나 시험 문제·답안을 적은 답변은 공개되지 않아요.
      </p>
      <label className="field">
        <span>질문</span>
        <select value={questionId} onChange={(e) => setQuestionId(e.target.value)}>
          {QNA_QUESTIONS.map((q) => (
            <option key={q.id} value={q.id}>
              {q.text}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field check-group">
        <legend>
          <span>학년</span>
        </legend>
        <div className="chips">
          {[1, 2, 3].map((g) => (
            <label key={g} className={grade === g ? 'chip chip-on' : 'chip'}>
              <input type="radio" name="grade" checked={grade === g} onChange={() => setGrade(g)} />
              {g}학년
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>
          답변<span className="hint"> · {question.hint}</span>
        </span>
        <textarea value={answer} rows={5} maxLength={ANSWER_MAX} onChange={(e) => setAnswer(e.target.value)} />
        <span className="counter">
          {length}/{ANSWER_MAX}
          {length > 0 && length < ANSWER_MIN && ` · ${ANSWER_MIN}자 이상 적어 주세요`}
        </span>
      </label>
      {personal.length > 0 && <p className="small error-text">{personal.join(', ')}로 보이는 내용이 있어요. 지우고 제출해 주세요.</p>}
      <label className="checkbox">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>이 학교 재학생이고, 사실대로 적었어요.</span>
      </label>
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={!ready}>
          {sending ? '제출하는 중…' : '제출하기'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          닫기
        </button>
      </div>
      {result && (
        <p className={result.ok ? 'small ok-text' : 'small error-text'} role="status">
          {result.message}
        </p>
      )}
    </form>
  )
}
