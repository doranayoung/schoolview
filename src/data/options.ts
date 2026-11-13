import type { SubjectCategory } from '../types'

// 입력 도우미에서 고를 수 있는 정해진 항목들.
// 학교마다 같은 말로 적어야 비교 없이도 읽기 쉽고, 진로 탐색·필터가 제대로 동작한다.

export const SCHOOL_TYPES = [
  '일반고',
  '자율형 공립고',
  '자율형 사립고',
  '특성화고',
  '마이스터고',
  '과학고',
  '외국어고',
  '국제고',
  '예술고',
  '체육고',
]

export const SUBJECT_CATEGORIES: SubjectCategory[] = ['공통', '일반선택', '진로선택', '융합선택']

export const TEACHING_STYLES = ['강의식', '토론', '프로젝트', '실습', '실험', '문제풀이', '발표', '현장체험']

// 평가 "유형"만 적는다. 시험 문제·수행평가 답안 같은 평가 자료는 다루지 않는다. (설계 원칙 3)
export const ASSESSMENTS = ['지필', '서술형', '발표', '보고서', '실기', '실험 보고서', '토론', '포트폴리오']

export const CLUB_CATEGORIES = ['학술', '예술', '체육', '봉사', '언론', '진로', '기타']

export const REVIEWERS = ['학생회', '담당 교사']
