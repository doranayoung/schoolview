-- 스쿨뷰 재학생 Q&A 스키마 (Supabase)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행한다. 여러 번 실행해도 된다.
--
-- 흐름
--   1) 재학생(로그인 없음)이 정해진 질문에 답변을 제출한다 → status = 'pending'
--   2) 그 학교의 검수자(학생회·담당 교사, 이메일 로그인)가 공개(approved) 또는 반려(rejected)한다
--   3) 누구나 공개된 답변만 읽을 수 있다
--
-- 설계 원칙
--   - 자유 게시판이 아니다: 질문은 앱에 정해진 목록(question_id)만 쓴다
--   - 개인정보 최소 수집: 답변자 이름·연락처·IP를 저장하지 않는다. 학년만 받는다
--   - 검수자가 없는 학교는 답변을 받지 않는다

-- 검수자 목록. 운영자가 직접 추가한다 (docs/supabase-setup.md 참고)
create table if not exists public.qna_reviewers (
  user_id uuid not null references auth.users (id) on delete cascade,
  school_id text not null,
  role text not null check (role in ('학생회', '담당 교사')),
  created_at timestamptz not null default now(),
  primary key (user_id, school_id)
);

create table if not exists public.qna_answers (
  id uuid primary key default gen_random_uuid(),
  school_id text not null check (school_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  question_id text not null check (question_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  answer text not null check (char_length(answer) between 10 and 500),
  grade smallint not null check (grade between 1 and 3),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text check (reviewed_by in ('학생회', '담당 교사')),
  reviewer_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists qna_answers_school_status on public.qna_answers (school_id, status);

-- 도우미 함수 (security definer: RLS를 거치지 않고 검수자 표를 확인)
create or replace function public.is_qna_reviewer(target_school text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.qna_reviewers where user_id = auth.uid() and school_id = target_school)
$$;

create or replace function public.school_accepts_qna(target_school text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.qna_reviewers where school_id = target_school)
$$;

-- 제출 시: 검수 관련 값은 서버가 비우고, 검수 대기 답변이 너무 많으면 막는다 (도배 방지)
create or replace function public.qna_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewer_id := null;
  new.reviewed_at := null;
  new.created_at := now();
  if (select count(*) from public.qna_answers where school_id = new.school_id and status = 'pending') >= 200 then
    raise exception 'too many pending answers' using errcode = 'P0001', hint = 'pending_limit';
  end if;
  return new;
end $$;

-- 검수 시: 누가·언제·어떤 자격으로 검수했는지 서버가 기록한다 (클라이언트가 바꿀 수 없음)
create or replace function public.qna_before_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    new.reviewer_id := auth.uid();
    new.reviewed_by := (select role from public.qna_reviewers where user_id = auth.uid() and school_id = new.school_id);
    new.reviewed_at := case when new.status = 'pending' then null else now() end;
  end if;
  return new;
end $$;

drop trigger if exists qna_answers_insert on public.qna_answers;
create trigger qna_answers_insert before insert on public.qna_answers
  for each row execute function public.qna_before_insert();

drop trigger if exists qna_answers_review on public.qna_answers;
create trigger qna_answers_review before update on public.qna_answers
  for each row execute function public.qna_before_review();

-- 행 단위 권한 (RLS)
alter table public.qna_answers enable row level security;
alter table public.qna_reviewers enable row level security;

drop policy if exists "공개된 답변은 누구나 읽기" on public.qna_answers;
create policy "공개된 답변은 누구나 읽기" on public.qna_answers
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "검수자가 있는 학교에 답변 제출" on public.qna_answers;
create policy "검수자가 있는 학교에 답변 제출" on public.qna_answers
  for insert to anon, authenticated with check (public.school_accepts_qna(school_id));

drop policy if exists "검수자는 자기 학교 답변 읽기" on public.qna_answers;
create policy "검수자는 자기 학교 답변 읽기" on public.qna_answers
  for select to authenticated using (public.is_qna_reviewer(school_id));

drop policy if exists "검수자는 자기 학교 답변 검수" on public.qna_answers;
create policy "검수자는 자기 학교 답변 검수" on public.qna_answers
  for update to authenticated using (public.is_qna_reviewer(school_id)) with check (public.is_qna_reviewer(school_id));

drop policy if exists "검수자는 자기 학교 답변 삭제" on public.qna_answers;
create policy "검수자는 자기 학교 답변 삭제" on public.qna_answers
  for delete to authenticated using (public.is_qna_reviewer(school_id));

drop policy if exists "검수자는 자기 정보만 읽기" on public.qna_reviewers;
create policy "검수자는 자기 정보만 읽기" on public.qna_reviewers
  for select to authenticated using (user_id = auth.uid());

-- 열 단위 권한: 제출은 네 칸만, 검수는 상태만 바꿀 수 있다. reviewer_id는 공개하지 않는다
revoke all on public.qna_answers from anon, authenticated;
revoke all on public.qna_reviewers from anon, authenticated;
grant select (id, school_id, question_id, answer, grade, status, reviewed_by, created_at, reviewed_at) on public.qna_answers to anon, authenticated;
grant insert (school_id, question_id, answer, grade) on public.qna_answers to anon, authenticated;
grant update (status) on public.qna_answers to authenticated;
grant delete on public.qna_answers to authenticated;
grant select on public.qna_reviewers to authenticated;
