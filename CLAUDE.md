# tetris-loop — 프로젝트 규칙

이 저장소는 **루프 엔지니어링 하네스**로 운영된다. 사람이 매 단계를 지시하지 않고,
`/loop` 이 SPEC 문서 하나를 읽어 구현 → 검증 → 기록 → 정지까지 스스로 수행한다.

하네스 설계는 [docs/LOOP_HARNESS.md](docs/LOOP_HARNESS.md), 진행 상태는 [MEMORY.md](MEMORY.md)에 있다.

## 1. 지금 작업 중인 SPEC

`.loop/state/progress.json` 의 `spec_file` 이 현재 SPEC 이다. 지금은 `SPEC_04_LEVEL_AND_SPEED.md`.
앞 SPEC 넷(`SPEC_00` ~ `SPEC_03`)은 통과했고, 이후 SPEC 이 명시적으로 덮은 조항만 무효다.
SPEC_01 §2 가 SPEC_00 §4.4 와 완료 조건 6-13 을 덮고,
SPEC_02 §2 가 SPEC_01 §4.5 규칙 3 · §5 "board 는 전부 0" · 완료 조건 6-15·6-16·6-22 ·
필수 테스트 4개를 덮고,
SPEC_03 §2 가 SPEC_02 §5 "점수 범위 밖" · §3.2 "score 는 내내 0" · §4.4 score 불변 ·
필수 테스트 `lock-and-advance-keeps-score` 를 덮고,
SPEC_04 §2 가 SPEC_01 `DROP_INTERVAL_MS` 의 의미(레벨 1 값으로 축소) · `intervalMs` 계약 ·
완료 조건 6-9c · SPEC_03 §4.3 점수 가산(직전 레벨을 곱함)을 덮는다.
**SPEC 문서가 유일한 요구사항 출처다.** 이 CLAUDE.md 는 SPEC 을 대체하지 않고 제약만 고정한다.

## 2. 산출물 제약 (SPEC_00 §2 · SPEC_01 §2 · SPEC_02 §2 · SPEC_03 §2 · SPEC_04 §2)

- 산출물은 정확히 이 여섯 개뿐이다.
  `index.html` · `style.css` · `game.js` · `main.js` · `test.html` · `test.js`
- HTML5, CSS, 브라우저 기본 JavaScript만 쓴다.
- 프레임워크 · 번들러 · 패키지 매니저 · 외부 라이브러리 금지.
- 패키지 설치 · 설정 파일 · 개발 서버 · 빌드 단계가 없어야 한다.
  `package.json`, lockfile, `node_modules/`, `tsconfig.json` 등을 만들지 않는다.
- `index.html` 은 `style.css`, `game.js`, `main.js` 를 직접 불러온다.
  `game.js` 가 `main.js` 보다 먼저이고, 두 스크립트 모두 `defer` 를 쓴다.
- `test.html` 은 `game.js`, `test.js` 를 직접 불러온다.

### 하네스 파일은 예외

`CLAUDE.md`, `MEMORY.md`, `SPEC_*.md`, `docs/`, `.claude/`, `.loop/`, `.gitignore` 는
하네스 파일이며 "여섯 개 파일" 제약의 대상이 아니다. 검증 시에도 위반으로 세지 않는다.

## 3. 코드 구조

- `game.js` 는 **DOM 에 접근하지 않는 순수 로직**이다. `globalThis.TetrisGame` 하나로만 공개한다.
- `main.js` 가 DOM 렌더링을 담당하고 `globalThis.TetrisApp` 하나로만 공개한다.
- `test.js` 는 `game.js` 의 공개 API 만 검증한다.
- 이 분리를 지켜야 `test.html` 이 브라우저에서 독립적으로 돌아간다.
- **화면 값을 HTML 에 하드코딩하지 않는다.** 보드 크기와 패널 값은 반드시
  `TetrisGame` 이 만든 상태 객체에서 읽어 렌더한다 (현재 SPEC §4.5·§4.7).
- **타이머와 키 입력은 `main.js` 것이다.** `game.js` 는 `setInterval` 도 `addEventListener` 도
  쓰지 않는다. 낙하 간격 상수(`DROP_INTERVAL_MS`)만 `game.js` 가 들고 있다.
- **낙하 타이머는 항상 최대 한 개다.** 재시작 시 기존 타이머를 먼저 정지한다.
  `TetrisApp.getActiveDropTimerCount()` 가 이를 관측 가능하게 만든다.
- **키 리스너는 `window` 에 하나만 붙인다.** 재시작마다 새로 붙이면 입력이 중복 처리된다.
- **색은 CSS 에만 있다.** `game.js` 는 블록 색을 모른다 — 색은 로직이 아니라 표현이다.
  블록 셀은 `data-piece="<종류 한 글자>"` 속성으로 표시하고 CSS 가 그 속성으로 색을 준다.
- **고정 보드와 현재 블록은 상태에서 분리한다.** `state.board` 셀은 빈칸이면 숫자 `0`,
  고정 셀이면 종류 한 글자다. 낙하 중인 블록은 `state.piece` 에만 있고 매 tick 마다
  `board` 에 쓰지 않는다. 화면에서는 둘을 합쳐 그리되 DOM 에서 구분하지 않는다.
- **고정 처리는 원자 함수 하나다.** `lockAndAdvance(state)` 가
  고정 → 완성 줄 탐색 → 동시 제거 → 압축 → 줄 수 누적 → 다음 블록 생성 → 게임오버 판정을
  이 순서로 한 번에 한다. 한 입력·한 tick 에서 두 번 호출하지 않는다.
- **`LANDED` 는 지속 상태가 아니다.** `state.status` 값으로 쓰지 않는다.
  `GAME_STATUS` 의 동결 5키는 그대로 둔다.
- **`TetrisApp.loadState(state)` 는 검증이 임의 보드를 만드는 통로다.** 상태를 교체하고 다시 그리며,
  `PLAYING` 이면 타이머를 하나만 다시 건다.
- **`localStorage` 는 `main.js` 만 만진다.** `game.js` 는 저장소를 모른다 — 이름 검증·정렬·
  상위 10개 자르기·손상 데이터 정리는 전부 순수 함수로 `game.js` 에 두고, 읽기·쓰기와
  `window.confirm` 은 `main.js` 가 한다.
- **저장 키는 `tetris-loop.leaderboard.v1` 하나뿐이다.** 최상위 구조는 기록 객체의 배열이다.
- **중복 저장 방지는 UI 가 아니라 로직이 한다.** 버튼 `disabled` 는 보조일 뿐이고
  `TetrisApp.saveResult` 안에서 같은 게임의 두 번째 저장을 거부한다.
- **서버와 통신하지 않는다.** `fetch`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 을 쓰지 않는다.
- **레벨은 저장하지 않는다.** `state` 는 다섯 키 그대로고 레벨은 `levelForLines(state.lines)` 로
  매번 계산한다. `state.level` 을 만들지 않는다.
- **낙하 간격은 레벨에서 나온다.** 타이머를 만들 때 `dropIntervalForLevel(levelForLines(lines))` 를
  넘기고, `DROP_INTERVAL_MS`(700)는 레벨 1 의 값으로만 남는다. 레벨이 바뀔 때만 타이머를 다시 건다 —
  매 tick 마다 다시 걸면 간격이 리셋된다. 간격은 절대 100ms 미만이 되지 않는다.
- **레벨 배수는 줄 제거 점수에만, 제거 직전 레벨로.** `scoreForLines(n) × levelForLines(state.lines)`.
  드롭 점수는 이 프로젝트에 없다 — 만들지 않는다.
- 스크립트는 classic script 로만 불러온다. `type="module"` 은 `file://` 에서 CORS 로 죽는다.
- 검증이 DOM 을 세야 하므로 `data-role` 속성 계약(SPEC §3)을 지킨다.

## 4. 범위 통제

- 현재 SPEC 의 "범위 밖"(현재 SPEC §5) 기능을 미리 구현하지 않는다.
  나중에 필요할 것 같아도 만들지 않는다. 범위 초과는 실패로 취급한다.
- SPEC 에 없는 화면 · 기술 결정이 필요하면 **추측하지 않는다.**
  `.loop/state/progress.json` 의 `human_input_needed` 에 `[사람 확인 필요]` 로 적고
  상태를 `BLOCKED` 으로 두고 멈춘다.

## 5. 안전 (현재 SPEC §9)

- 프로젝트 폴더(`/home/al-hub/workspace/tetris-loop`) 밖의 파일을 만들거나 수정하지 않는다.
- 외부 배포와 유료 서비스를 쓰지 않는다.
- 정지 조건: 같은 실패가 두 번 반복되거나, 총 세 번 실행해도 완료하지 못하면 중단한다.

## 6. 검증

- 완료 판정은 **`/spec-verify` 가 실제 브라우저에서 관측한 결과**로만 내린다.
- 브라우저 도구가 없는 세션에서는 검증할 수 없다. 이때는 통과로 추측하지 않고
  `BLOCKED` 으로 기록하고 멈춘다. 세션을 `claude --chrome` 으로 다시 열어야 한다.
- 확장이 `file://` 스킴을 거부하므로 관측은 `python3 -m http.server` 로 띄운
  `http://localhost` 를 경유한다. 검증이 끝나면 서버를 끈다. 이 서버는 산출물의 의존이 아니다.
- 직접 관측하지 못한 항목을 `PASS` 로 적지 않는다. 관측 실패는 `BLOCKED` 이다.

## 7. 언어와 커밋

- 문서 · 주석 · 커밋 메시지 본문은 한국어로 쓴다.
- SPEC 이 통과했을 때만 커밋한다. 커밋 제목 형식: `feat(SPEC_NN): 요약` (현재는 `feat(SPEC_01): …`)
- 실패한 반복은 커밋하지 않는다. 리포트만 남긴다.
