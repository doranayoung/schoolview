import { interests } from '../data'
import { ASSESSMENTS, CLUB_CATEGORIES, REVIEWERS, SUBJECT_CATEGORIES, TEACHING_STYLES } from '../data/options'
import type { Club, QnA, Subject } from '../types'
import { parsePrefillLink } from '../utils/applyForm'
import { emptyClub, emptyQnA, emptySubject } from '../utils/schoolJson'
import { CheckGroup, Checkbox, CommaInput, ItemList, LinesInput, NumberInput, SelectInput, TextArea, TextInput } from './FormFields'

// 진로 탐색 키워드. 과목·동아리 키워드에 이 단어가 있어야 진로 탐색에 나온다.
const interestTags = [...new Set(interests.flatMap((i) => i.tags))]

function TagHint() {
  return <p className="small muted">진로 탐색 키워드: {interestTags.join(', ')}</p>
}

export function SubjectsEditor({ subjects, onChange }: { subjects: Subject[]; onChange: (s: Subject[]) => void }) {
  return (
    <ItemList
      items={subjects}
      onChange={onChange}
      create={emptySubject}
      addLabel="과목 추가"
      empty="아직 과목이 없어요. 학교에서 여는 선택과목을 하나씩 추가해 주세요."
      summary={(s) => `${s.name.trim() || '새 과목'} · ${s.category} · ${s.grade}학년`}
      render={(s, set) => (
        <>
          <div className="form-row">
            <TextInput label="과목 이름" value={s.name} onChange={(name) => set({ name })} placeholder="예: 인공지능 기초" />
            <SelectInput label="구분" value={s.category} options={SUBJECT_CATEGORIES} onChange={(category) => set({ category })} />
          </div>
          <div className="form-row">
            <SelectInput label="주로 듣는 학년" value={s.grade} options={[1, 2, 3]} format={(g) => `${g}학년`} onChange={(grade) => set({ grade })} />
            <NumberInput label="학점" value={s.credits} min={1} max={10} onChange={(credits) => set({ credits })} />
          </div>
          <CheckGroup label="수업 방식" options={TEACHING_STYLES} value={s.teachingStyle} onChange={(teachingStyle) => set({ teachingStyle })} />
          <CheckGroup label="평가 유형" hint="유형만 고르고, 시험 문제·답안은 넣지 않아요" options={ASSESSMENTS} value={s.assessment} onChange={(assessment) => set({ assessment })} />
          <TextInput label="교실" hint="선택" value={s.room ?? ''} onChange={(room) => set({ room })} placeholder="예: 본관 3층 컴퓨터실" />
          <TextArea label="선배 한마디" hint="선택 · 학생회·교사가 확인한 내용만" value={s.seniorComment ?? ''} rows={2} onChange={(seniorComment) => set({ seniorComment })} />
          <CommaInput label="키워드" value={s.tags} onChange={(tags) => set({ tags })} placeholder="예: AI, 데이터, 코딩" />
          <TagHint />
        </>
      )}
    />
  )
}

export function ClubsEditor({ clubs, schoolId, onChange }: { clubs: Club[]; schoolId: string; onChange: (c: Club[]) => void }) {
  return (
    <ItemList
      items={clubs}
      onChange={onChange}
      create={() => emptyClub(schoolId, clubs)}
      addLabel="동아리 추가"
      empty="아직 동아리가 없어요."
      summary={(c) => `${c.name.trim() || '새 동아리'} · ${c.category}${c.recruit ? ' · 모집 일정 있음' : ''}`}
      render={(c, set) => <ClubFields club={c} set={set} />}
    />
  )
}

function ClubFields({ club: c, set }: { club: Club; set: (patch: Partial<Club>) => void }) {
  const survey = c.survey ?? []
  const surveyCount = survey.filter((q) => q.trim()).length
  const entries = c.applyForm?.entries ?? []

  // 구글 설문 '미리 채워진 링크'를 붙여넣으면 주소와 entry 번호를 나눠 담는다.
  const setFormUrl = (value: string) => {
    if (!value.trim()) return set({ applyForm: undefined })
    const parsed = parsePrefillLink(value)
    if (parsed?.entries) return set({ applyForm: parsed })
    set({ applyForm: { url: value, entries: c.applyForm?.entries } })
  }

  return (
    <>
      <div className="form-row">
        <TextInput label="동아리 이름" value={c.name} onChange={(name) => set({ name })} />
        <TextInput label="분야" value={c.category} list="club-categories" onChange={(category) => set({ category })} />
      </div>
      <datalist id="club-categories">
        {CLUB_CATEGORIES.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <TextInput label="동아리 ID" hint="영어 소문자·숫자·하이픈, 다른 동아리와 겹치면 안 돼요" value={c.id} onChange={(id) => set({ id })} />
      <TextArea label="소개" value={c.description} rows={2} onChange={(description) => set({ description })} />
      <LinesInput label="주요 활동" value={c.activities} onChange={(activities) => set({ activities })} placeholder={'예: 주 1회 스터디\n축제 부스 운영'} />
      <CommaInput label="키워드" value={c.tags} onChange={(tags) => set({ tags })} placeholder="예: 코딩, AI" />
      <TagHint />

      <h4 className="sub-title">모집</h4>
      <Checkbox
        label="모집 일정이 있어요"
        checked={Boolean(c.recruit)}
        onChange={(on) => set({ recruit: on ? { start: '', end: '', ...c.recruit } : undefined })}
      />
      {c.recruit && (
        <>
          <div className="form-row">
            <TextInput label="모집 시작일" type="date" value={c.recruit.start} onChange={(start) => set({ recruit: { ...c.recruit!, start } })} />
            <TextInput label="모집 마감일" type="date" value={c.recruit.end} onChange={(end) => set({ recruit: { ...c.recruit!, end } })} />
          </div>
          <TextInput label="면접 일정" hint="선택" value={c.recruit.interview ?? ''} onChange={(interview) => set({ recruit: { ...c.recruit!, interview } })} placeholder="예: 3월 12일 점심시간, 컴퓨터실" />
          <TextInput label="모집 안내" hint="선택" value={c.recruit.notice ?? ''} onChange={(notice) => set({ recruit: { ...c.recruit!, notice } })} placeholder="예: 경험 없어도 지원 가능" />
        </>
      )}

      <h4 className="sub-title">사전 설문과 신청서</h4>
      <LinesInput label="사전 설문 문항" hint="한 줄에 한 문항" value={survey} onChange={(s) => set({ survey: s })} placeholder={'예: 동아리에서 해보고 싶은 것은?\n관련 경험이 있나요?'} />
      <TextInput
        label="신청서 주소"
        hint="구글 설문 '미리 채워진 링크'를 붙여넣으면 답변이 자동으로 채워져요"
        type="url"
        value={c.applyForm?.url ?? ''}
        onChange={setFormUrl}
        placeholder="https://docs.google.com/forms/d/e/.../viewform"
      />
      {c.applyForm && (
        <>
          <CommaInput label="신청서 entry 번호" hint="사전 설문 문항 순서대로" value={entries} onChange={(e) => set({ applyForm: { ...c.applyForm!, entries: e } })} />
          <p className={entries.length && entries.length !== surveyCount ? 'small warn-text' : 'small muted'}>
            {entries.length === 0
              ? 'entry 번호가 없으면 신청서를 열 때 답변을 복사해 줘요. 학생이 붙여넣으면 돼요.'
              : entries.length === surveyCount
                ? `사전 설문 ${surveyCount}문항과 entry ${entries.length}개가 맞아요. 답변이 신청서에 자동으로 채워져요.`
                : `사전 설문은 ${surveyCount}문항인데 entry는 ${entries.length}개예요. 개수와 순서를 맞춰 주세요.`}
          </p>
        </>
      )}
    </>
  )
}

export function QnaEditor({ qna, onChange }: { qna: QnA[]; onChange: (q: QnA[]) => void }) {
  return (
    <>
      <p className="notice small">학생회·담당 교사가 확인한 답변만 넣어 주세요. 답변자 이름 대신 "2학년 재학생"처럼 학년만 적어요.</p>
      <ItemList
        items={qna}
        onChange={onChange}
        create={emptyQnA}
        addLabel="Q&A 추가"
        empty="아직 Q&A가 없어요."
        summary={(q) => q.question.trim() || '새 질문'}
        render={(q, set) => (
          <>
            <TextInput label="질문" value={q.question} onChange={(question) => set({ question })} />
            <TextArea label="답변" value={q.answer} onChange={(answer) => set({ answer })} />
            <div className="form-row">
              <TextInput label="답변한 사람" value={q.answeredBy} onChange={(answeredBy) => set({ answeredBy })} placeholder="예: 2학년 재학생" />
              <SelectInput label="확인한 사람" value={q.reviewedBy} options={REVIEWERS} onChange={(reviewedBy) => set({ reviewedBy })} />
            </div>
          </>
        )}
      />
    </>
  )
}
