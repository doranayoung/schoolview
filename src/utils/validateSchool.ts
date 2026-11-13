import { ASSESSMENTS, SUBJECT_CATEGORIES } from '../data/options'
import type { School } from '../types'
import { safeUrl } from './applyForm'

export interface Issue {
  level: 'error' | 'warning'
  where: string // 예: "동아리 2번 (코드랩)"
  message: string
}

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// 설계 원칙에 어긋날 수 있는 표현. 발견되면 경고만 하고, 사람이 판단한다.
const PERSONAL_INFO = [
  { pattern: /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/, label: '휴대전화 번호' },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]+/, label: '이메일 주소' },
]
const BANNED_WORDS = [
  { words: ['기출', '족보', '모범 답안', '모범답안', '시험 문제'], label: '시험·수행평가 자료로 보이는 표현 (원칙 3)' },
  { words: ['순위', '랭킹', '별점', '서열'], label: '학교 비교·순위 표현 (원칙 2)' },
]

const isDate = (s?: string) => !!s && DATE_PATTERN.test(s) && !Number.isNaN(new Date(s).getTime())
const blank = (s?: string) => !s || !s.trim()
const clean = (list: string[] = []) => list.map((s) => s.trim()).filter(Boolean)

// 저장·내보내기 전에 빈 줄과 앞뒤 공백을 정리한다.
export function normalizeSchool(school: School): School {
  return {
    ...school,
    id: school.id.trim(),
    name: school.name.trim(),
    region: school.region.trim(),
    type: school.type.trim(),
    intro: school.intro.trim(),
    highlights: clean(school.highlights),
    sources: clean(school.sources),
    isSample: school.isSample || undefined,
    subjects: school.subjects.map((s) => ({
      ...s,
      name: s.name.trim(),
      teachingStyle: clean(s.teachingStyle),
      assessment: clean(s.assessment),
      tags: clean(s.tags),
      room: s.room?.trim() || undefined,
      seniorComment: s.seniorComment?.trim() || undefined,
    })),
    clubs: school.clubs.map((c) => ({
      ...c,
      id: c.id.trim(),
      name: c.name.trim(),
      category: c.category.trim(),
      description: c.description.trim(),
      activities: clean(c.activities),
      tags: clean(c.tags),
      survey: clean(c.survey).length ? clean(c.survey) : undefined,
      recruit: c.recruit
        ? {
            start: c.recruit.start,
            end: c.recruit.end,
            interview: c.recruit.interview?.trim() || undefined,
            notice: c.recruit.notice?.trim() || undefined,
          }
        : undefined,
      applyForm: c.applyForm?.url.trim()
        ? {
            url: c.applyForm.url.trim(),
            entries: clean(c.applyForm.entries).length ? clean(c.applyForm.entries) : undefined,
          }
        : undefined,
    })),
    qna: school.qna.map((q) => ({
      question: q.question.trim(),
      answer: q.answer.trim(),
      answeredBy: q.answeredBy.trim(),
      reviewedBy: q.reviewedBy.trim(),
    })),
  }
}

// otherSchools: 이미 등록된 다른 학교들 (동아리 id 중복 검사용)
export function validateSchool(raw: School, otherSchools: School[] = []): Issue[] {
  const school = normalizeSchool(raw)
  const issues: Issue[] = []
  const error = (where: string, message: string) => issues.push({ level: 'error', where, message })
  const warn = (where: string, message: string) => issues.push({ level: 'warning', where, message })

  // 기본 정보
  if (blank(school.name)) error('기본 정보', '학교 이름을 적어 주세요.')
  if (!ID_PATTERN.test(school.id)) error('기본 정보', '학교 ID는 영어 소문자·숫자·하이픈(-)만 쓸 수 있어요. 예: busan-hanbit')
  if (blank(school.region)) error('기본 정보', '지역을 적어 주세요.')
  if (blank(school.type)) error('기본 정보', '학교 유형을 골라 주세요.')
  if (!Number.isInteger(school.classesPerGrade) || school.classesPerGrade < 1) error('기본 정보', '학년당 학급 수는 1 이상의 정수여야 해요.')
  if (blank(school.intro)) error('기본 정보', '한 줄 소개를 적어 주세요.')
  if (!isDate(school.updatedAt)) error('기본 정보', '최종 수정일이 올바른 날짜가 아니에요.')
  if (school.sources.length === 0) warn('기본 정보', '정보 출처를 적어 주세요. (예: 학교알리미, 학교 제공)')

  // 선택과목
  const subjectNames = new Set<string>()
  school.subjects.forEach((s, i) => {
    const where = `선택과목 ${i + 1}번${s.name ? ` (${s.name})` : ''}`
    if (blank(s.name)) error(where, '과목 이름을 적어 주세요.')
    else if (subjectNames.has(s.name)) error(where, '같은 이름의 과목이 이미 있어요.')
    subjectNames.add(s.name)
    if (!SUBJECT_CATEGORIES.includes(s.category)) error(where, '과목 구분을 골라 주세요.')
    if (![1, 2, 3].includes(s.grade)) error(where, '학년은 1~3 중에서 골라 주세요.')
    if (!Number.isInteger(s.credits) || s.credits < 1 || s.credits > 10) error(where, '학점은 1~10 사이의 정수여야 해요.')
    if (s.teachingStyle.length === 0) warn(where, '수업 방식을 하나 이상 골라 주세요.')
    if (s.assessment.length === 0) warn(where, '평가 유형을 하나 이상 골라 주세요.')
    const unknown = s.assessment.filter((a) => !ASSESSMENTS.includes(a))
    if (unknown.length) warn(where, `정해진 평가 유형이 아니에요: ${unknown.join(', ')}`)
    if (s.tags.length === 0) warn(where, '키워드가 없으면 진로 탐색에 나오지 않아요.')
  })

  // 동아리
  const otherClubIds = new Set(otherSchools.filter((o) => o.id !== school.id).flatMap((o) => o.clubs.map((c) => c.id)))
  const clubIds = new Set<string>()
  school.clubs.forEach((c, i) => {
    const where = `동아리 ${i + 1}번${c.name ? ` (${c.name})` : ''}`
    if (blank(c.name)) error(where, '동아리 이름을 적어 주세요.')
    if (!ID_PATTERN.test(c.id)) error(where, '동아리 ID는 영어 소문자·숫자·하이픈(-)만 쓸 수 있어요. 예: hanbit-code')
    else if (clubIds.has(c.id) || otherClubIds.has(c.id)) error(where, `동아리 ID "${c.id}"가 이미 쓰이고 있어요.`)
    clubIds.add(c.id)
    if (blank(c.category)) error(where, '동아리 분야를 골라 주세요.')
    if (blank(c.description)) error(where, '동아리 소개를 적어 주세요.')
    if (c.tags.length === 0) warn(where, '키워드가 없으면 진로 탐색에 나오지 않아요.')
    if (c.recruit) {
      if (!isDate(c.recruit.start) || !isDate(c.recruit.end)) error(where, '모집 시작일과 마감일을 모두 넣어 주세요.')
      else if (c.recruit.start > c.recruit.end) error(where, '모집 마감일이 시작일보다 빨라요.')
    }
    if (c.applyForm) {
      if (!safeUrl(c.applyForm.url)) error(where, '신청서 주소는 https:// 로 시작해야 해요.')
      const entries = c.applyForm.entries ?? []
      const survey = c.survey ?? []
      if (entries.length && entries.length !== survey.length) {
        error(where, `사전 설문은 ${survey.length}문항인데 신청서 entry 번호는 ${entries.length}개예요. 문항 수와 순서를 맞춰 주세요.`)
      }
      if (entries.some((e) => !/^(entry\.)?\d+$/.test(e))) error(where, 'entry 번호 형식이 올바르지 않아요. 예: entry.1234567')
    }
  })

  // 재학생 Q&A (검수 완료된 답변만)
  school.qna.forEach((q, i) => {
    const where = `Q&A ${i + 1}번`
    if (blank(q.question) || blank(q.answer)) error(where, '질문과 답변을 모두 적어 주세요.')
    if (blank(q.answeredBy)) error(where, '답변한 사람(예: 2학년 재학생)을 적어 주세요.')
    if (blank(q.reviewedBy)) error(where, '확인한 사람(학생회 또는 담당 교사)을 적어 주세요. 확인 전 답변은 넣지 않아요.')
  })

  // 설계 원칙 점검 (경고)
  const text = JSON.stringify(school)
  for (const { pattern, label } of PERSONAL_INFO) {
    if (pattern.test(text)) warn('개인정보', `${label}로 보이는 내용이 있어요. 개인 연락처는 넣지 말아 주세요. (원칙 4)`)
  }
  for (const { words, label } of BANNED_WORDS) {
    const found = words.filter((w) => text.includes(w))
    if (found.length) warn('설계 원칙', `${label}: "${found.join('", "')}"`)
  }

  return issues
}
