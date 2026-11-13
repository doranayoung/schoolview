import { useMemo, useState } from 'react'
import { ClubsEditor, QnaEditor, SubjectsEditor } from '../components/EditorSections'
import { Checkbox, LinesInput, NumberInput, TextArea, TextInput } from '../components/FormFields'
import { schools } from '../data'
import { SCHOOL_TYPES } from '../data/options'
import type { School } from '../types'
import { emptySchool, exportSchool, parseSchoolJson, toSchoolJson } from '../utils/schoolJson'
import { useLocalState } from '../utils/storage'
import { validateSchool } from '../utils/validateSchool'
import { SchoolView } from './SchoolDetail'

type EditorTab = 'basic' | 'subjects' | 'clubs' | 'qna' | 'preview' | 'export'

const REPO_DATA_URL = 'https://github.com/doranayoung/schoolview/tree/main/src/data/schools'

// 교사·학생회용 학교 정보 입력 도우미.
// 서버 없이 이 기기에서만 작성하고, 결과를 JSON 파일로 내려받아 운영자에게 전달한다.
export default function SchoolEditor() {
  const [draft, setDraft] = useLocalState<School>('editor:draft', emptySchool())
  const [tab, setTab] = useState<EditorTab>('basic')
  const [loadMessage, setLoadMessage] = useState('')

  const update = (patch: Partial<School>) => setDraft({ ...draft, ...patch })
  const output = useMemo(() => exportSchool(draft), [draft])
  const issues = useMemo(() => validateSchool(output, schools), [output])
  const errorCount = issues.filter((i) => i.level === 'error').length

  const isEmpty = !draft.name.trim() && draft.subjects.length === 0 && draft.clubs.length === 0
  const replaceDraft = (next: School, message: string) => {
    if (!isEmpty && !window.confirm('지금 작성 중인 내용이 지워져요. 계속할까요?')) return
    setDraft(next)
    setTab('basic')
    setLoadMessage(message)
  }

  const loadExisting = (id: string) => {
    const school = schools.find((s) => s.id === id)
    if (school) replaceDraft(parseSchoolJson(JSON.stringify(school)), `${school.name} 정보를 불러왔어요.`)
  }

  const loadFile = async (file?: File) => {
    if (!file) return
    try {
      const school = parseSchoolJson(await file.text())
      replaceDraft(school, `${file.name} 파일을 불러왔어요.`)
    } catch (e) {
      setLoadMessage(`불러오지 못했어요: ${e instanceof Error ? e.message : '올바른 JSON 파일이 아니에요.'}`)
    }
  }

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'basic', label: '기본 정보' },
    { id: 'subjects', label: `선택과목 ${draft.subjects.length}` },
    { id: 'clubs', label: `동아리 ${draft.clubs.length}` },
    { id: 'qna', label: `Q&A ${draft.qna.length}` },
    { id: 'preview', label: '미리보기' },
    { id: 'export', label: errorCount ? `확인·내보내기 (${errorCount})` : '확인·내보내기' },
  ]

  return (
    <>
      <h1>학교 정보 입력 도우미</h1>
      <p className="muted">
        교사·학생회용이에요. 학교 소개, 선택과목, 동아리 정보를 입력하면 스쿨뷰에 올릴 파일을 만들어 줘요. 작성 중인 내용은 이 기기에만 저장돼요.
      </p>

      <div className="card editor-start">
        <div className="actions">
          <button type="button" className="btn" onClick={() => replaceDraft(emptySchool(), '새 학교 입력을 시작했어요.')}>
            새로 시작
          </button>
          <select value="" onChange={(e) => loadExisting(e.target.value)} aria-label="등록된 학교 불러오기">
            <option value="">등록된 학교 불러오기</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="btn file-btn">
            JSON 파일 불러오기
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                void loadFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {loadMessage && (
          <p className="small muted" role="status">
            {loadMessage}
          </p>
        )}
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'tab tab-on' : 'tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicFields draft={draft} update={update} />}
      {tab === 'subjects' && <SubjectsEditor subjects={draft.subjects} onChange={(subjects) => update({ subjects })} />}
      {tab === 'clubs' && <ClubsEditor clubs={draft.clubs} schoolId={draft.id} onChange={(clubs) => update({ clubs })} />}
      {tab === 'qna' && <QnaEditor qna={draft.qna} onChange={(qna) => update({ qna })} />}
      {tab === 'preview' && (
        <div className="preview">
          <p className="notice small">학생에게 보이는 화면이에요. 사전 설문의 신청서 링크도 실제로 동작하니 직접 확인해 보세요.</p>
          <SchoolView school={output} preview />
        </div>
      )}
      {tab === 'export' && <ExportPanel output={output} issues={issues} />}
    </>
  )
}

function BasicFields({ draft, update }: { draft: School; update: (patch: Partial<School>) => void }) {
  return (
    <div className="card form">
      <div className="form-row">
        <TextInput label="학교 이름" value={draft.name} onChange={(name) => update({ name })} placeholder="예: 한빛고등학교" />
        <TextInput label="학교 ID" hint="영어 소문자·숫자·하이픈, 파일 이름이 돼요" value={draft.id} onChange={(id) => update({ id })} placeholder="예: busan-hanbit" />
      </div>
      <div className="form-row">
        <TextInput label="지역" value={draft.region} onChange={(region) => update({ region })} placeholder="예: 부산 해운대구" />
        <TextInput label="학교 유형" value={draft.type} list="school-types" onChange={(type) => update({ type })} />
        <NumberInput label="학년당 학급 수" value={draft.classesPerGrade} min={1} onChange={(classesPerGrade) => update({ classesPerGrade })} />
      </div>
      <datalist id="school-types">
        {SCHOOL_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <TextArea label="한 줄 소개" value={draft.intro} rows={2} onChange={(intro) => update({ intro })} placeholder="예: 과학·정보 선택과목이 다양하고, 학생 주도 프로젝트 수업이 많은 학교예요." />
      <LinesInput label="학교 특색" value={draft.highlights} onChange={(highlights) => update({ highlights })} placeholder={'예: 정보·AI 선택과목 3과목 개설\n2학년부터 과목별 이동수업'} />
      <LinesInput label="정보 출처" value={draft.sources} rows={2} onChange={(sources) => update({ sources })} placeholder={'예: 학교알리미\n학교 제공 (교육과정부)'} />
      <Checkbox
        label="예시(가상) 학교예요 — 실제 학교 정보가 아니면 체크"
        checked={Boolean(draft.isSample)}
        onChange={(isSample) => update({ isSample })}
      />
      <Checkbox
        label="재학생 Q&A 답변을 받아요 — 답변을 검수할 학생회·담당 교사가 정해졌을 때만 체크"
        checked={Boolean(draft.qnaOpen)}
        onChange={(qnaOpen) => update({ qnaOpen })}
      />
    </div>
  )
}

const CHECKLIST = [
  '학교(담당 교사·학생회)의 확인을 받은 정보예요. (원칙 5)',
  '학생·교사의 이름·연락처 같은 개인정보가 없어요. (원칙 4)',
  '시험 문제·수행평가 답안 같은 평가 자료가 없어요. (원칙 3)',
  '다른 학교와 비교하거나 순위를 매기는 표현이 없어요. (원칙 2)',
]

function ExportPanel({ output, issues }: { output: School; issues: ReturnType<typeof validateSchool> }) {
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false))
  const [message, setMessage] = useState('')
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const confirmed = output.isSample || checked.every(Boolean)
  const ready = errors.length === 0 && confirmed
  const json = toSchoolJson(output)

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${output.id}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage(`${output.id}.json 파일을 내려받았어요.`)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setMessage('JSON을 복사했어요.')
    } catch {
      setMessage('복사하지 못했어요. 파일로 내려받아 주세요.')
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h3>1. 입력 내용 점검</h3>
        {issues.length === 0 && <p className="ok-text">빠진 내용이나 문제가 없어요.</p>}
        {errors.length > 0 && (
          <>
            <p className="error-text">꼭 고쳐야 할 것 {errors.length}개</p>
            <ul className="issues">
              {errors.map((i, n) => (
                <li key={n}>
                  <strong>{i.where}</strong> {i.message}
                </li>
              ))}
            </ul>
          </>
        )}
        {warnings.length > 0 && (
          <>
            <p className="warn-text">확인해 볼 것 {warnings.length}개</p>
            <ul className="issues">
              {warnings.map((i, n) => (
                <li key={n}>
                  <strong>{i.where}</strong> {i.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h3>2. 설계 원칙 확인</h3>
        {output.isSample ? (
          <p className="muted">예시 학교라 확인 없이 내보낼 수 있어요. 화면에 "예시" 표시가 붙어요.</p>
        ) : (
          CHECKLIST.map((text, i) => (
            <Checkbox key={text} label={text} checked={checked[i]} onChange={(v) => setChecked(checked.map((c, j) => (j === i ? v : c)))} />
          ))
        )}
      </section>

      <section className="card">
        <h3>3. 내보내기</h3>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={download} disabled={!ready}>
            {output.id || 'school'}.json 내려받기
          </button>
          <button type="button" className="btn" onClick={() => void copy()} disabled={!ready}>
            JSON 복사
          </button>
        </div>
        {!ready && <p className="small muted">{errors.length ? '위의 꼭 고쳐야 할 것을 먼저 해결해 주세요.' : '설계 원칙 확인란을 모두 체크해 주세요.'}</p>}
        {message && (
          <p className="small ok-text" role="status">
            {message}
          </p>
        )}
        <p className="small">
          내려받은 파일을 스쿨뷰 운영자에게 보내 주세요. 운영자가 내용을 확인한 뒤 올리면 학교 목록에 나타나요. GitHub를 쓸 수 있다면{' '}
          <a href={REPO_DATA_URL} target="_blank" rel="noopener noreferrer">
            src/data/schools 폴더
          </a>
          에 파일을 올리는 Pull Request를 보내도 돼요.
        </p>
        <details>
          <summary className="small muted">JSON 미리보기</summary>
          <pre className="json-preview">{json}</pre>
        </details>
      </section>
    </div>
  )
}
