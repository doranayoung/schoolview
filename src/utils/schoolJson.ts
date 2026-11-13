import type { Club, QnA, School, Subject } from '../types'
import { normalizeSchool } from './validateSchool'

export function todayString(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// 키 순서는 기존 학교 JSON 파일과 같게 맞춘다.
export function emptySchool(): School {
  return {
    id: '',
    name: '',
    region: '',
    type: '일반고',
    isSample: false,
    classesPerGrade: 8,
    intro: '',
    highlights: [],
    subjects: [],
    clubs: [],
    qna: [],
    qnaOpen: false,
    updatedAt: todayString(),
    sources: ['학교 제공'],
  }
}

export function emptySubject(): Subject {
  return { name: '', category: '일반선택', grade: 2, credits: 4, teachingStyle: [], assessment: [], room: '', seniorComment: '', tags: [] }
}

export function emptyClub(schoolId: string, clubs: Club[]): Club {
  const prefix = schoolId.trim() || 'club'
  let n = clubs.length + 1
  while (clubs.some((c) => c.id === `${prefix}-${n}`)) n++
  return { id: `${prefix}-${n}`, name: '', category: '학술', description: '', activities: [], tags: [], recruit: undefined, survey: [], applyForm: undefined }
}

export function emptyQnA(): QnA {
  return { question: '', answer: '', answeredBy: '', reviewedBy: '학생회' }
}

// 내보낼 JSON. 정리하고, 최종 수정일을 오늘로 바꾼다.
export function exportSchool(draft: School, now = new Date()): School {
  return { ...normalizeSchool(draft), updatedAt: todayString(now) }
}

// 사람이 읽기 쉽게: 문자열·숫자만 든 배열은 한 줄로 적는다. (기존 예시 파일과 같은 모양)
export function toSchoolJson(school: School): string {
  const json = JSON.stringify(school, null, 2)
  const primitive = String.raw`(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?)`
  const arrayPattern = new RegExp(String.raw`\[\n\s+(${primitive}(?:,\n\s+${primitive})*)\n\s*\]`, 'g')
  return json.replace(arrayPattern, (_, inner: string) => `[${inner.split(/,\n\s+/).join(', ')}]`) + '\n'
}

// 파일에서 불러온 JSON을 학교 형식으로 맞춘다. 빠진 목록은 빈 목록으로 채운다.
export function parseSchoolJson(text: string): School {
  const data: unknown = JSON.parse(text)
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('학교 정보 JSON이 아니에요.')
  const raw = data as Partial<School>
  if (typeof raw.name !== 'string' || typeof raw.id !== 'string') throw new Error('학교 이름(name)과 ID(id)가 있는 파일이어야 해요.')
  const base = emptySchool()
  return {
    ...base,
    ...raw,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    subjects: Array.isArray(raw.subjects) ? raw.subjects.map((s) => ({ ...emptySubject(), ...s })) : [],
    clubs: Array.isArray(raw.clubs) ? raw.clubs.map((c) => ({ ...c, activities: c.activities ?? [], tags: c.tags ?? [], survey: c.survey ?? [] })) : [],
    qna: Array.isArray(raw.qna) ? raw.qna : [],
    sources: Array.isArray(raw.sources) ? raw.sources : [],
  }
}
