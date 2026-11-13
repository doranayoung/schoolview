import type { ApplyForm } from '../types'

// 답변 하나의 최대 길이. 답변이 신청서 주소(URL)에 실려 가므로 너무 길면 안 된다.
export const MAX_ANSWER_LENGTH = 300

// https 주소만 허용한다. (javascript: 같은 주소가 데이터에 섞여 들어오는 것을 막는다)
export function safeUrl(url: string): URL | null {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'https:' ? u : null
  } catch {
    return null
  }
}

const toEntryKey = (entry: string) => (entry.startsWith('entry.') ? entry : `entry.${entry}`)

// 답변을 미리 채운 신청서 주소를 만든다. entries가 없으면 신청서 주소를 그대로 돌려준다.
export function buildApplyUrl(form: ApplyForm, answers: string[]): string | null {
  const url = safeUrl(form.url)
  if (!url) return null
  if (form.entries?.length) {
    url.searchParams.set('usp', 'pp_url')
    form.entries.forEach((entry, i) => {
      const answer = answers[i]?.trim()
      if (entry.trim() && answer) url.searchParams.set(toEntryKey(entry.trim()), answer)
    })
  }
  return url.toString()
}

// 구글 설문 '미리 채워진 링크'에서 신청서 주소와 entry 번호(문항 순서대로)를 뽑는다.
// 입력 도우미에서 교사·학생회가 링크를 붙여넣으면 이 함수로 applyForm을 만든다.
export function parsePrefillLink(link: string): ApplyForm | null {
  const u = safeUrl(link)
  if (!u) return null
  const entries = [...new Set([...u.searchParams.keys()].filter((k) => /^entry\.\d+$/.test(k)))]
  u.search = ''
  u.hash = ''
  return entries.length ? { url: u.toString(), entries } : { url: u.toString() }
}

// 복사해서 신청서에 붙여넣을 수 있는 텍스트
export function formatAnswers(clubName: string, questions: string[], answers: string[]): string {
  const lines = questions.map((q, i) => `${i + 1}. ${q}\n${answers[i]?.trim() || '(답변 없음)'}`)
  return `[${clubName} 사전 설문]\n\n${lines.join('\n\n')}`
}
