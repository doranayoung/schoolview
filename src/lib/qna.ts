import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

// supabase/schema.sql 의 qna_answers 와 같은 모양
export type AnswerStatus = 'pending' | 'approved' | 'rejected'

export interface QnaAnswer {
  id: string
  school_id: string
  question_id: string
  answer: string
  grade: number
  status: AnswerStatus
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
}

export interface ReviewerRole {
  school_id: string
  role: string
}

export const ANSWER_MIN = 10
export const ANSWER_MAX = 500

// reviewer_id 등 공개하지 않는 열은 읽지 않는다 (DB에서도 권한이 없다)
const COLUMNS = 'id, school_id, question_id, answer, grade, status, reviewed_by, created_at, reviewed_at'

interface DbError {
  code?: string
  message?: string
  hint?: string
}

// 서버 오류를 학생이 이해할 수 있는 말로 바꾼다.
export function errorMessage(e: unknown): string {
  const err = (e ?? {}) as DbError
  if (err.hint === 'pending_limit') return '검수를 기다리는 답변이 많아요. 며칠 뒤에 다시 제출해 주세요.'
  if (err.code === '42501') return '지금은 이 학교의 답변을 받지 않아요.'
  if (err.code === '23514') return `답변은 ${ANSWER_MIN}~${ANSWER_MAX}자로 적어 주세요.`
  if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) return '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'
  if (err.code === 'otp_expired' || err.message?.toLowerCase().includes('token has expired')) return '인증 코드가 틀렸거나 만료됐어요. 다시 받아 주세요.'
  if (err.message?.toLowerCase().includes('signups not allowed')) return '검수자로 등록된 이메일이 아니에요. 스쿨뷰 운영자에게 문의해 주세요.'
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

// ── 학생 ─────────────────────────────────────────

export async function fetchApprovedAnswers(schoolId: string): Promise<QnaAnswer[]> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('qna_answers')
    .select(COLUMNS)
    .eq('school_id', schoolId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data as QnaAnswer[]
}

// 제출한 답변은 검수 전이라 학생이 다시 읽을 수 없다. 그래서 결과를 돌려받지 않는다.
export async function submitAnswer(input: { schoolId: string; questionId: string; answer: string; grade: number }) {
  const sb = await getSupabase()
  const { error } = await sb.from('qna_answers').insert({
    school_id: input.schoolId,
    question_id: input.questionId,
    answer: input.answer.trim(),
    grade: input.grade,
  })
  if (error) throw error
}

// ── 검수자 ────────────────────────────────────────

// 검수자로 등록된 이메일만 로그인할 수 있다 (새 계정을 만들지 않는다).
export async function sendLoginCode(email: string) {
  const sb = await getSupabase()
  const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
  if (error) throw error
}

export async function verifyLoginCode(email: string, code: string) {
  const sb = await getSupabase()
  const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const sb = await getSupabase()
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function onSessionChange(callback: (session: Session | null) => void): Promise<() => void> {
  const sb = await getSupabase()
  const { data } = sb.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function signOut() {
  const sb = await getSupabase()
  await sb.auth.signOut()
}

export async function fetchMyRoles(): Promise<ReviewerRole[]> {
  const sb = await getSupabase()
  const { data, error } = await sb.from('qna_reviewers').select('school_id, role')
  if (error) throw error
  return data as ReviewerRole[]
}

export async function fetchAnswersForReview(schoolIds: string[], status: AnswerStatus): Promise<QnaAnswer[]> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('qna_answers')
    .select(COLUMNS)
    .in('school_id', schoolIds)
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(200)
  if (error) throw error
  return data as QnaAnswer[]
}

// 권한이 없으면 RLS 때문에 오류 없이 0개가 바뀐다. 그 경우도 실패로 본다.
const NOT_ALLOWED: DbError = { code: '42501', message: 'not allowed' }

// 검수자 이름·시각은 DB 트리거가 기록한다.
export async function setAnswerStatus(id: string, status: AnswerStatus) {
  const sb = await getSupabase()
  const { data, error } = await sb.from('qna_answers').update({ status }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw NOT_ALLOWED
}

export async function deleteAnswer(id: string) {
  const sb = await getSupabase()
  const { data, error } = await sb.from('qna_answers').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw NOT_ALLOWED
}
