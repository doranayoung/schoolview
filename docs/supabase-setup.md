# 재학생 Q&A 서버 설정 (Supabase)

재학생 Q&A 작성·검수 기능은 [Supabase](https://supabase.com) 무료 플랜으로 동작합니다. 설정하지 않아도 나머지 화면은 그대로 쓸 수 있고, Q&A 탭에는 학교 파일에 들어 있는 검수 완료 답변만 보입니다.

## 동작 방식

```
재학생 (로그인 없음)          검수자 (학생회·담당 교사)          누구나
  정해진 질문에 답변 제출  →   이메일 인증 코드로 로그인    →   공개된 답변만 보기
  status = pending            공개(approved) / 반려(rejected)
```

- 질문은 앱에 정해진 목록(`src/data/questions.ts`)만 씁니다. 자유 게시판이 아닙니다.
- 답변자 이름·연락처는 받지 않고 **학년만** 저장합니다.
- **검수자가 등록된 학교만** 답변을 받습니다. DB 권한(RLS)으로 막혀 있어서 앱을 거치지 않고 요청해도 마찬가지입니다.
- 학생은 검수 전 답변을 읽을 수 없고, 검수자는 자기 학교 답변만 볼 수 있습니다.
- 검수자 자격(학생회/담당 교사)과 검수 시각은 서버가 기록합니다.

## 1. 프로젝트 만들기

1. supabase.com에서 새 프로젝트를 만듭니다. Region은 **Northeast Asia (Seoul)**을 고릅니다.
2. 왼쪽 메뉴 **SQL Editor**에서 [`supabase/schema.sql`](../supabase/schema.sql) 내용을 붙여넣고 **Run**을 누릅니다. (여러 번 실행해도 됩니다)

## 2. 로그인(인증 코드) 설정

검수자는 비밀번호 없이 이메일로 받은 6자리 코드로 로그인합니다.

1. **Authentication → Sign In / Providers**
   - Email: 켜기
   - **Allow new users to sign up: 끄기** (운영자가 초대한 검수자만 로그인)
2. **Authentication → Email Templates → Magic Link** 내용을 아래처럼 바꿉니다. 기본 템플릿에는 코드가 없어서 꼭 바꿔야 합니다.

   ```html
   <h2>스쿨뷰 검수자 로그인</h2>
   <p>아래 인증 코드를 스쿨뷰 검수 화면에 입력해 주세요.</p>
   <p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   <p>본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
   ```

3. 기본 메일 발송은 시간당 보낼 수 있는 수가 적습니다. 실제 운영할 때는 **Project Settings → Authentication → SMTP Settings**에서 학교·개인 메일 SMTP를 연결하세요.

## 3. 검수자 등록

1. **Authentication → Users → Add user → Send invitation**으로 검수자 이메일을 초대합니다. (또는 Create new user + Auto Confirm)
2. SQL Editor에서 그 사람을 학교 검수자로 등록합니다. `school_id`는 학교 JSON의 `id`입니다.

   ```sql
   insert into public.qna_reviewers (user_id, school_id, role)
   select id, 'busan-hanbit', '학생회'      -- 또는 '담당 교사'
   from auth.users where email = 'reviewer@example.com';
   ```

   검수자를 빼려면:

   ```sql
   delete from public.qna_reviewers
   where school_id = 'busan-hanbit'
     and user_id = (select id from auth.users where email = 'reviewer@example.com');
   ```

3. 학교 JSON에 `"qnaOpen": true`를 넣습니다. (입력 도우미 기본 정보의 "재학생 Q&A 답변을 받아요" 체크) 이 값이 있어야 학교 화면에 **답변 쓰기** 버튼이 보입니다.

## 4. 앱에 연결

**Project Settings → API Keys**에서 Project URL과 **Publishable key**를 확인합니다. (예전 프로젝트는 `anon` `public` 키)

- 내 컴퓨터: `.env.example`을 `.env.local`로 복사하고 값을 채운 뒤 `npm run dev`
- GitHub Pages 배포: 저장소 **Settings → Secrets and variables → Actions → Variables** 탭에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 추가하고 다시 배포

> Publishable key는 브라우저에 공개되는 키라 저장소 변수에 넣어도 됩니다. **secret 키(service_role)는 절대 앱이나 저장소에 넣지 마세요.** 데이터 보호는 `schema.sql`의 권한(RLS)이 맡습니다.

## 5. 동작 확인

1. 자기 이메일을 예시 학교(`sample-hanbit`, 이미 `qnaOpen: true`)의 검수자로 등록합니다.
2. 한빛고등학교(예시) → 재학생 Q&A → **답변 쓰기**로 답변을 제출합니다.
3. 화면 맨 아래 **재학생 Q&A 검수**(`#/review`)에서 로그인 → 검수 대기 → **공개**
4. 학교 화면 Q&A 탭에 답변이 나타나면 완료입니다. 확인이 끝나면 예시 학교 검수자 등록을 지워 주세요.

## 운영 메모

- 한 학교에 검수 대기 답변이 200개가 넘으면 새 답변을 받지 않습니다 (도배 방지). 검수하거나 반려·삭제하면 다시 받습니다.
- 반려한 답변은 **반려됨** 탭에서 삭제할 수 있습니다. 학기가 끝나면 오래된 반려 답변은 지워 주세요.
- 스쿨뷰 DB에는 답변자의 이름·연락처·IP를 저장하지 않습니다. 다만 Supabase 자체 접속 기록(로그)은 플랜에 따라 일정 기간 보관됩니다.
- 무료 플랜 프로젝트는 일주일 동안 요청이 없으면 일시 중지됩니다. 대시보드에서 다시 켤 수 있습니다.
