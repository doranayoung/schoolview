import { useState, type ReactNode } from 'react'

// 입력 도우미에서 쓰는 작은 입력 칸들.
// 목록 값(string[])은 입력 중에는 빈 줄·공백을 그대로 두고, 내보낼 때 normalizeSchool에서 정리한다.

interface Base {
  label: string
  hint?: string
}

function Label({ label, hint }: Base) {
  return (
    <span>
      {label}
      {hint && <span className="hint"> · {hint}</span>}
    </span>
  )
}

export function TextInput({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  placeholder,
  list,
}: Base & { value: string; onChange: (v: string) => void; type?: 'text' | 'url' | 'date' | 'email'; placeholder?: string; list?: string }) {
  return (
    <label className="field">
      <Label label={label} hint={hint} />
      <input type={type} value={value} placeholder={placeholder} list={list} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function NumberInput({ label, hint, value, onChange, min, max }: Base & { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="field">
      <Label label={label} hint={hint} />
      <input type="number" value={Number.isNaN(value) ? '' : value} min={min} max={max} onChange={(e) => onChange(e.target.valueAsNumber)} />
    </label>
  )
}

export function TextArea({ label, hint, value, onChange, rows = 3, placeholder }: Base & { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="field">
      <Label label={label} hint={hint} />
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

// 한 줄에 하나씩
export function LinesInput({ label, hint = '한 줄에 하나씩', value, onChange, rows = 3, placeholder }: Base & { value: string[]; onChange: (v: string[]) => void; rows?: number; placeholder?: string }) {
  return <TextArea label={label} hint={hint} value={value.join('\n')} rows={rows} placeholder={placeholder} onChange={(v) => onChange(v.split('\n'))} />
}

// 쉼표로 구분
export function CommaInput({ label, hint = '쉼표(,)로 구분', value, onChange, placeholder, list }: Base & { value: string[]; onChange: (v: string[]) => void; placeholder?: string; list?: string }) {
  return <TextInput label={label} hint={hint} value={value.join(',')} placeholder={placeholder} list={list} onChange={(v) => onChange(v ? v.split(',') : [])} />
}

export function SelectInput<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  format = String,
}: Base & { value: T; options: readonly T[]; onChange: (v: T) => void; format?: (v: T) => string }) {
  return (
    <label className="field">
      <Label label={label} hint={hint} />
      <select value={String(value)} onChange={(e) => onChange(options.find((o) => String(o) === e.target.value) as T)}>
        {!options.includes(value) && <option value={String(value)}>{String(value) || '선택해 주세요'}</option>}
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>
            {format(o)}
          </option>
        ))}
      </select>
    </label>
  )
}

// 정해진 항목 중 여러 개 고르기. 목록에 없는 기존 값도 보여줘서 지울 수 있게 한다.
export function CheckGroup({ label, hint, options, value, onChange }: Base & { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const all = [...options, ...value.filter((v) => v.trim() && !options.includes(v))]
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])
  return (
    <fieldset className="field check-group">
      <legend>
        <Label label={label} hint={hint} />
      </legend>
      <div className="chips">
        {all.map((o) => (
          <label key={o} className={value.includes(o) ? 'chip chip-on' : 'chip'}>
            <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Checkbox({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

// 과목·동아리처럼 여러 개를 추가·순서 변경·삭제하는 목록. 한 번에 하나만 펼친다.
export function ItemList<T>({
  items,
  onChange,
  create,
  summary,
  render,
  addLabel,
  empty,
}: {
  items: T[]
  onChange: (items: T[]) => void
  create: () => T
  summary: (item: T, index: number) => string
  render: (item: T, set: (patch: Partial<T>) => void) => ReactNode
  addLabel: string
  empty: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const set = (i: number) => (patch: Partial<T>) => onChange(items.map((item, j) => (j === i ? { ...item, ...patch } : item)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
    if (openIndex === i) setOpenIndex(j)
    else if (openIndex === j) setOpenIndex(i)
  }
  const remove = (i: number) => {
    if (!window.confirm(`"${summary(items[i], i)}" 항목을 지울까요?`)) return
    onChange(items.filter((_, j) => j !== i))
    if (openIndex === i) setOpenIndex(null)
    else if (openIndex !== null && openIndex > i) setOpenIndex(openIndex - 1)
  }
  const add = () => {
    onChange([...items, create()])
    setOpenIndex(items.length)
  }

  return (
    <div className="stack">
      {items.length === 0 && <p className="muted">{empty}</p>}
      {items.map((item, i) => {
        const open = openIndex === i
        return (
          <section key={i} className={open ? 'card item item-open' : 'card item'}>
            <div className="item-head">
              <button type="button" className="item-toggle" aria-expanded={open} onClick={() => setOpenIndex(open ? null : i)}>
                <span aria-hidden>{open ? '▾' : '▸'}</span> {summary(item, i)}
              </button>
              <div className="item-tools">
                <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
                  ↑
                </button>
                <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="아래로">
                  ↓
                </button>
                <button type="button" className="icon-btn icon-danger" onClick={() => remove(i)} aria-label="삭제">
                  ✕
                </button>
              </div>
            </div>
            {open && <div className="item-body">{render(item, set(i))}</div>}
          </section>
        )
      })}
      <button type="button" className="btn add-btn" onClick={add}>
        + {addLabel}
      </button>
    </div>
  )
}
