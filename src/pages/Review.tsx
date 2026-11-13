import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, type FormEvent } from 'react'
import { getSchool } from '../data'
import { questionText } from '../data/questions'
import {
  deleteAnswer,
  errorMessage,
  fetchAnswersForReview,
  fetchMyRoles,
  getSession,
  onSessionChange,
  sendLoginCode,
  setAnswerStatus,
  signOut,
  verifyLoginCode,
  type AnswerStatus,
  type QnaAnswer,
  type ReviewerRole,
} from '../lib/qna'
import { supabaseEnabled } from '../lib/supabase'
import { findPersonalInfo } from '../utils/validateSchool'

const SETUP_DOC = 'https://github.com/doranayoung/schoolview/blob/main/docs/supabase-setup.md'

// 학생회·담당 교사용 재학생 Q&A 검수 화면
export default function Review() {
  return (
    <>
      <h1>재학생 Q&A 검수</h1>
      <p className="muted">학생회·담당 교사용이에요. 재학생이 제출한 답변을 확인하고, 공개해도 되는 답변만 공개해 주세요.</p>
      {supabaseEnabled ? (
        <ReviewGate />
      ) : (
        <p className="card">
          Q&A 서버가 아직 연결되지 않았어요. 운영자는{' '}
          <a href={SETUP_DOC} target="_blank" rel="noopener noreferrer">
            Supabase 설정 안내
          </a>
          를 따라 연결해 주세요.
        </p>
      )}
    </>
  )
}

function ReviewGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}
    getSession()
      .then((s) => !cancelled && setSession(s))
      .catch(() => !cancelled && setSession(null))
    void onSessionChange((s) => setSession(s)).then((u) => {
      if (cancelled) u()
      else unsubscribe = u
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  if (session === undefined) return <p className="muted">확인하는 중…</p>
  if (!session) return <LoginForm />
  return <ReviewBoard email={session.user.email ?? ''} />
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const run = async (e: FormEvent, action: () => Promise<void>) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (err) {
      setMessage(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'email') {
    return (
      <form
        className="card form login"
        onSubmit={(e) =>
          void run(e, async () => {
            await sendLoginCode(email)
            setStep('code')
          })
        }
      >
        <label className="field">
          <span>검수자 이메일</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <p className="small muted">운영자가 검수자로 등록한 이메일만 로그인할 수 있어요. 비밀번호 대신 이메일로 받은 인증 코드를 입력해요.</p>
        <div className="actions">
          <button className="btn btn-primary" disabled={busy || !email.includes('@')}>
            {busy ? '보내는 중…' : '인증 코드 받기'}
          </button>
        </div>
        {message && <p className="small error-text">{message}</p>}
      </form>
    )
  }

  return (
    <form className="card form login" onSubmit={(e) => void run(e, () => verifyLoginCode(email, code))}>
      <p>
        <strong>{email}</strong>로 보낸 인증 코드를 입력해 주세요.
      </p>
      <label className="field">
        <span>인증 코드</span>
        <input type="text" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
      </label>
      <div className="actions">
        <button className="btn btn-primary" disabled={busy || code.length < 6}>
          {busy ? '확인하는 중…' : '로그인'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setStep('email')}>
          이메일 다시 입력
        </button>
      </div>
      {message && <p className="small error-text">{message}</p>}
    </form>
  )
}

const STATUS_TABS: { id: AnswerStatus; label: string }[] = [
  { id: 'pending', label: '검수 대기' },
  { id: 'approved', label: '공개됨' },
  { id: 'rejected', label: '반려됨' },
]

const CHECKLIST = [
  '이름·연락처·SNS 계정처럼 사람을 알아볼 수 있는 내용이 없나요?',
  '특정 교사·학생을 비난하거나 평가하는 내용이 없나요?',
  '시험 문제·수행평가 답안 같은 평가 자료가 없나요?',
  '다른 학교와 비교하거나 순위를 매기는 내용이 없나요?',
  '우리 학교 사실과 맞나요?',
]

function ReviewBoard({ email }: { email: string }) {
  const [roles, setRoles] = useState<ReviewerRole[] | null>(null)
  const [schoolId, setSchoolId] = useState('')
  const [status, setStatus] = useState<AnswerStatus>('pending')
  const [answers, setAnswers] = useState<QnaAnswer[] | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchMyRoles()
      .then((r) => {
        setRoles(r)
        setSchoolId(r[0]?.school_id ?? '')
      })
      .catch((e: unknown) => {
        setRoles([])
        setMessage(errorMessage(e))
      })
  }, [])

  useEffect(() => {
    if (!schoolId) return
    let cancelled = false
    fetchAnswersForReview([schoolId], status)
      .then((a) => !cancelled && setAnswers(a))
      .catch((e: unknown) => !cancelled && setMessage(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [schoolId, status])

  const changeView = (next: { schoolId?: string; status?: AnswerStatus }) => {
    setAnswers(null)
    setMessage('')
    if (next.schoolId !== undefined) setSchoolId(next.schoolId)
    if (next.status !== undefined) setStatus(next.status)
  }

  const act = async (answer: QnaAnswer, action: AnswerStatus | 'delete') => {
    if (action === 'delete' && !window.confirm('이 답변을 완전히 지울까요?')) return
    setMessage('')
    try {
      if (action === 'delete') await deleteAnswer(answer.id)
      else await setAnswerStatus(answer.id, action)
      setAnswers((list) => list?.filter((a) => a.id !== answer.id) ?? null)
      setMessage(action === 'approved' ? '공개했어요.' : action === 'rejected' ? '반려했어요.' : action === 'pending' ? '검수 대기로 돌렸어요.' : '지웠어요.')
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }

  const schoolName = (id: string) => getSchool(id)?.name ?? id

  return (
    <div className="stack">
      <div className="toolbar">
        <p className="small muted">
          {email} · {roles?.map((r) => `${schoolName(r.school_id)} ${r.role}`).join(', ')}
        </p>
        <button className="btn btn-ghost" onClick={() => void signOut()}>
          로그아웃
        </button>
      </div>

      {roles && roles.length === 0 && <p className="card">검수자로 등록된 학교가 없어요. 스쿨뷰 운영자에게 등록을 요청해 주세요.</p>}

      {roles && roles.length > 0 && (
        <>
          <details className="card">
            <summary>
              <strong>공개 전에 확인해 주세요</strong>
            </summary>
            <ul className="list">
              {CHECKLIST.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="small muted">하나라도 걸리면 반려해 주세요. 답변자에게 따로 알리지 않아요.</p>
          </details>

          <div className="toolbar">
            <div className="chips">
              {STATUS_TABS.map((t) => (
                <button key={t.id} className={status === t.id ? 'chip chip-on' : 'chip'} onClick={() => changeView({ status: t.id })}>
                  {t.label}
                </button>
              ))}
            </div>
            {roles.length > 1 && (
              <select value={schoolId} onChange={(e) => changeView({ schoolId: e.target.value })} aria-label="학교 선택">
                {roles.map((r) => (
                  <option key={r.school_id} value={r.school_id}>
                    {schoolName(r.school_id)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {message && (
            <p className="small muted" role="status">
              {message}
            </p>
          )}
          {answers === null && <p className="muted">불러오는 중…</p>}
          {answers?.length === 0 && <p className="muted">{STATUS_TABS.find((t) => t.id === status)?.label} 답변이 없어요.</p>}
          {answers?.map((a) => {
            const personal = findPersonalInfo(a.answer)
            return (
              <article key={a.id} className="card">
                <h3>Q. {questionText(a.question_id)}</h3>
                <p className="pre-line">{a.answer}</p>
                <p className="muted small">
                  {a.grade}학년 재학생 · 제출 {new Date(a.created_at).toLocaleString('ko-KR')}
                  {a.reviewed_by && ` · ${a.reviewed_by} 검수`}
                </p>
                {personal.length > 0 && <p className="small error-text">{personal.join(', ')}로 보이는 내용이 있어요.</p>}
                <div className="actions">
                  {a.status !== 'approved' && (
                    <button className="btn btn-primary" onClick={() => void act(a, 'approved')}>
                      공개
                    </button>
                  )}
                  {a.status !== 'rejected' && (
                    <button className="btn btn-danger" onClick={() => void act(a, 'rejected')}>
                      {a.status === 'approved' ? '공개 취소' : '반려'}
                    </button>
                  )}
                  {a.status === 'rejected' && (
                    <button className="btn btn-ghost" onClick={() => void act(a, 'delete')}>
                      삭제
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </>
      )}
    </div>
  )
}
