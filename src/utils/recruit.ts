import type { Recruit } from '../types'

export type RecruitStatus = 'open' | 'upcoming' | 'closed' | 'none'

// 날짜 문자열(YYYY-MM-DD)을 그 날 0시로 바꾼다.
function toDay(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function recruitStatus(recruit?: Recruit, now: Date = today()): RecruitStatus {
  if (!recruit) return 'none'
  if (now < toDay(recruit.start)) return 'upcoming'
  if (now > toDay(recruit.end)) return 'closed'
  return 'open'
}

// 마감까지 남은 일수 (마감일 당일 = 0)
export function daysLeft(recruit: Recruit, now: Date = today()): number {
  return Math.round((toDay(recruit.end).getTime() - now.getTime()) / 86400000)
}

export function formatDate(date: string): string {
  const d = toDay(date)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export const statusLabel: Record<RecruitStatus, string> = {
  open: '모집 중',
  upcoming: '모집 예정',
  closed: '모집 마감',
  none: '상시·미정',
}
