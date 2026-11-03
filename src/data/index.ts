import type { Interest, School } from '../types'

// src/data/schools/*.json 파일을 전부 자동으로 불러온다.
// 새 학교를 추가하려면 같은 형식의 JSON 파일만 넣으면 된다.
const modules = import.meta.glob<School>('./schools/*.json', { eager: true, import: 'default' })

export const schools: School[] = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name, 'ko'))

export function getSchool(id: string): School | undefined {
  return schools.find((s) => s.id === id)
}

// 진로 탐색 키워드. 과목·동아리의 tags와 겹치면 관련 있는 것으로 본다.
export const interests: Interest[] = [
  { id: 'it', label: '정보·컴퓨터·AI', tags: ['코딩', 'AI', '데이터', '컴퓨터', '정보'] },
  { id: 'edu', label: '교육·교사', tags: ['교육', '교사'] },
  { id: 'bio', label: '의학·생명', tags: ['의학', '생명'] },
  { id: 'eng', label: '공학·해양', tags: ['공학', '해양'] },
  { id: 'soc', label: '사회·인문', tags: ['사회', '인문', '정책', '글쓰기'] },
  { id: 'art', label: '예술·미디어', tags: ['예술', '음악', '미디어'] },
]
