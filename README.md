# D-day Calendar Tracker

캘린더 기반으로 D-day를 설정하고, 날짜별 진행 여부를 `X`로 표시할 수 있는 정적 웹 앱입니다.

## 기능

- 목표 이름, 시작일, D-day 설정
- 날짜별 `D-숫자 / D+숫자 / D-DAY` 표시
- 매일 달력에서 `X 표시` 토글
- 오늘, D-day, 체크 완료 상태 시각화
- 진행률 / 남은 기간 / 누적 체크 현황 요약
- `localStorage` 기반 자동 저장

## 실행 방법

### 1) 바로 열기
`index.html`을 브라우저에서 바로 열어도 동작합니다.

### 2) 로컬 서버로 실행
정적 파일 서버로 실행하면 더 편하게 테스트할 수 있습니다.

```bash
python -m http.server 4173
```

브라우저에서 아래 주소를 열면 됩니다.

```text
http://localhost:4173
```

## 파일 구조

- `index.html` : 앱 구조
- `style.css` : UI 스타일
- `app.js` : D-day 계산, 캘린더 렌더링, 체크 저장 로직
