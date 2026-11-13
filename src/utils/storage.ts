import { useState } from 'react'

// 이 기기(브라우저)에만 저장하는 임시 저장소. 서버로 보내지 않는다.
const PREFIX = 'schoolview:'

export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장 공간이 없거나 사생활 보호 모드면 저장하지 않고 넘어간다.
  }
}

export function removeLocal(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // 무시
  }
}

// useState처럼 쓰되, 값을 바꿀 때마다 이 기기에 저장한다.
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => loadLocal(key, initial))
  const update = (next: T) => {
    setValue(next)
    saveLocal(key, next)
  }
  const clear = () => {
    setValue(initial)
    removeLocal(key)
  }
  return [value, update, clear] as const
}
