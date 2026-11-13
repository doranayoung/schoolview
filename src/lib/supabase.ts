import type { SupabaseClient } from '@supabase/supabase-js'

// 재학생 Q&A 작성·검수에만 쓰는 Supabase 연결.
// 환경 변수가 없으면 기능이 꺼지고, 나머지 화면은 그대로 동작한다.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseEnabled = Boolean(url && key)

let client: Promise<SupabaseClient> | null = null

// 처음 쓸 때 불러온다. 학생 대부분은 Q&A 탭을 열기 전까지 이 코드를 받지 않는다.
export function getSupabase(): Promise<SupabaseClient> {
  if (!url || !key) return Promise.reject(new Error('Supabase 환경 변수가 설정되지 않았어요.'))
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }),
  )
  return client
}
