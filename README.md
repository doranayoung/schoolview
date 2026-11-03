# 스쿨뷰 (SchoolView)

고등학교의 과목·동아리·학교생활을 미리 알고, 직접 선택하는 정보 가이드.

## 실행 방법
```bash
npm install
npm run dev
```
브라우저에서 http://localhost:5173 을 연다.

## 학교 추가하기
`src/data/schools/` 폴더에 기존 JSON 파일을 복사해서 내용을 바꾸면 자동으로 목록에 나타난다.
형식은 `src/types.ts`의 `School`을 따른다.

현재 들어 있는 한빛고등학교·바다로고등학교는 화면 확인용 **가상 예시 데이터**다.
