import { useState } from 'react'
import type { Club } from '../types'
import { MAX_ANSWER_LENGTH, buildApplyUrl, formatAnswers } from '../utils/applyForm'
import { formatDate, type RecruitStatus } from '../utils/recruit'
import { useLocalState } from '../utils/storage'

interface Props {
  club: Club & { survey: string[] }
  status: RecruitStatus
  isSample?: boolean
}

// 동아리 사전 설문 작성 → 동아리 신청서로 제출.
// 스쿨뷰는 답변을 서버에 저장하지 않는다. 작성 중인 답변은 이 기기에만 임시 저장되고,
// 제출은 동아리·학교가 운영하는 신청서(applyForm)에서 이뤄진다.
export default function ClubSurvey({ club, status, isSample }: Props) {
  const [open, setOpen] = useState(false)
  const label = status === 'upcoming' ? '사전 설문 미리 써보기' : '사전 설문 작성하기'

  return (
    <div>
      <button className="btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? '사전 설문 닫기' : label}
      </button>
      {open && <SurveyForm club={club} status={status} isSample={isSample} />}
    </div>
  )
}

function SurveyForm({ club, status, isSample }: Props) {
  const questions = club.survey
  const [answers, setAnswers, clearAnswers] = useLocalState<string[]>(`survey:${club.id}`, [])
  const [message, setMessage] = useState('')

  const setAnswer = (i: number, value: string) => {
    const next = questions.map((_, j) => (j === i ? value : (answers[j] ?? '')))
    setAnswers(next)
    setMessage('')
  }

  const filled = questions.filter((_, i) => answers[i]?.trim()).length
  const canSubmit = status === 'open' || status === 'none'
  const applyUrl = club.applyForm ? buildApplyUrl(club.applyForm, answers) : null
  const prefilled = Boolean(applyUrl && club.applyForm?.entries?.length)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatAnswers(club.name, questions, answers))
      setMessage('답변을 복사했어요. 신청서에 붙여넣어 주세요.')
      return true
    } catch {
      setMessage('복사하지 못했어요. 답변을 직접 선택해서 복사해 주세요.')
      return false
    }
  }

  const clear = () => {
    if (filled > 0 && !window.confirm('작성한 답변을 모두 지울까요?')) return
    clearAnswers()
    setMessage('')
  }

  return (
    <form className="survey-form" onSubmit={(e) => e.preventDefault()}>
      <p className="notice small">
        답변은 이 기기에만 임시 저장돼요. 이름·학번 같은 개인정보는 여기에 쓰지 말고, 동아리 신청서에만 적어 주세요.
      </p>
      {questions.map((q, i) => {
        const value = answers[i] ?? ''
        return (
          <label key={q} className="field">
            <span>
              {i + 1}. {q}
            </span>
            <textarea value={value} maxLength={MAX_ANSWER_LENGTH} rows={3} onChange={(e) => setAnswer(i, e.target.value)} />
            <span className="counter">
              {value.length}/{MAX_ANSWER_LENGTH}
            </span>
          </label>
        )
      })}

      <div className="actions">
        {canSubmit && applyUrl && !isSample && (
          <a
            className="btn btn-primary"
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (!prefilled) void copy()
            }}
          >
            신청서에 제출하러 가기 ↗
          </a>
        )}
        <button type="button" className="btn" onClick={() => void copy()} disabled={filled === 0}>
          답변 복사
        </button>
        <button type="button" className="btn btn-ghost" onClick={clear} disabled={filled === 0}>
          답변 지우기
        </button>
      </div>

      <p className="small muted" role="status">
        {message || guide({ club, status, isSample, hasForm: Boolean(applyUrl), prefilled })}
      </p>
    </form>
  )
}

function guide({
  club,
  status,
  isSample,
  hasForm,
  prefilled,
}: {
  club: Club
  status: RecruitStatus
  isSample?: boolean
  hasForm: boolean
  prefilled: boolean
}): string {
  if (isSample) return '예시 학교라 실제 신청서는 없어요. 답변 작성과 복사만 해볼 수 있어요.'
  if (status === 'upcoming' && club.recruit) {
    return `모집이 시작되는 ${formatDate(club.recruit.start)}부터 제출할 수 있어요. 미리 써 두면 이 기기에 남아 있어요.`
  }
  if (!hasForm) return '이 동아리는 아직 온라인 신청서를 등록하지 않았어요. 답변을 복사해서 모집 안내에 따라 제출해 주세요.'
  if (prefilled) return '신청서에 답변이 미리 채워져요. 신청서에서 학번·이름을 적고 제출 버튼까지 눌러야 지원이 끝나요.'
  return '신청서를 열면서 답변을 복사해 둘게요. 신청서에 붙여넣고 제출 버튼까지 눌러야 지원이 끝나요.'
}
