/// <reference types="vite/client" />

// .env 또는 배포 환경 변수. 비어 있으면 재학생 Q&A 작성·검수 기능이 꺼진다.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
