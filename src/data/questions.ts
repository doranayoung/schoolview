// 재학생 Q&A의 정해진 질문. 자유 게시판을 만들지 않기 위해 학생은 이 질문에만 답할 수 있다. (설계 원칙 1)
// id는 DB(qna_answers.question_id)에 저장되므로 한 번 정하면 바꾸지 않는다. 질문 문구는 다듬어도 된다.
export interface QnaQuestion {
  id: string
  text: string
  hint: string // 답변 작성 안내
}

export const QNA_QUESTIONS: QnaQuestion[] = [
  { id: 'daily', text: '하루 일과(등교·점심·하교 시간)는 어떻게 되나요?', hint: '시간표 흐름을 적어 주세요.' },
  { id: 'moving-class', text: '이동수업은 어떻게 하나요?', hint: '몇 학년부터, 어떤 과목이 이동하는지 적어 주세요.' },
  { id: 'subject-choice', text: '선택과목은 언제, 어떻게 고르나요?', hint: '신청 시기, 상담, 바꿀 수 있는지 등을 적어 주세요.' },
  { id: 'club-life', text: '동아리 활동은 얼마나 자주, 어떻게 하나요?', hint: '활동 시간, 자율 동아리 여부 등을 적어 주세요.' },
  { id: 'after-school', text: '방과후 수업이나 자율학습은 어떻게 운영되나요?', hint: '신청 방법, 필수인지 등을 적어 주세요.' },
  { id: 'facilities', text: '도서관·실습실 같은 시설은 어떻게 이용하나요?', hint: '이용 시간과 방법을 적어 주세요.' },
  { id: 'events', text: '축제·체육대회 같은 학교 행사는 어떤 게 있나요?', hint: '시기와 분위기를 적어 주세요.' },
  { id: 'freshman-tip', text: '신입생이 입학 전에 알아두면 좋은 점은?', hint: '준비물, 첫 달 생활 팁 등을 적어 주세요.' },
]

export const questionText = (id: string) => QNA_QUESTIONS.find((q) => q.id === id)?.text ?? '(삭제된 질문)'
