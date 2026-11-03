// 스쿨뷰 데이터 형식 정의
// 학교 하나 = src/data/schools/ 안의 JSON 파일 하나

export type SubjectCategory = '공통' | '일반선택' | '진로선택' | '융합선택'

export interface Subject {
  name: string
  category: SubjectCategory
  grade: number // 주로 듣는 학년
  credits: number
  teachingStyle: string[] // 예: 강의식, 토론, 프로젝트, 실습
  assessment: string[] // 예: 지필, 발표, 보고서, 실기 (정해진 항목만)
  room?: string // 수업 교실 (이동수업 안내)
  seniorComment?: string // 선배 한 줄 소개 (검수 후 공개)
  tags: string[] // 진로 탐색용 키워드
}

export interface Recruit {
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  interview?: string // 면접 일정 안내
  notice?: string
}

export interface Club {
  id: string
  name: string
  category: string // 학술, 예술, 체육, 봉사 등
  description: string
  activities: string[]
  tags: string[]
  recruit?: Recruit
  survey?: string[] // 지원 전 사전 설문 문항
  applyUrl?: string
}

export interface QnA {
  question: string
  answer: string
  answeredBy: string // 예: 2학년 재학생
  reviewedBy: string // 예: 학생회, 담당 교사
}

export interface School {
  id: string
  name: string
  region: string
  type: string // 일반고, 특성화고 등
  isSample?: boolean // 예시 데이터 여부
  classesPerGrade: number
  intro: string
  highlights: string[]
  subjects: Subject[]
  clubs: Club[]
  qna: QnA[]
  updatedAt: string
  sources: string[] // 정보 출처 (학교알리미, 학교 제공 등)
}

export interface Interest {
  id: string
  label: string
  tags: string[]
}
