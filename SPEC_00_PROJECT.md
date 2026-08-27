---
id: SPEC_00
title: 프로젝트 골격과 게임 화면
revision: 2
depends_on: []
max_iterations: 3
---

# SPEC 00 — 프로젝트 골격과 게임 화면

## 1. 목표

빈 폴더에 브라우저에서 실행되는 테트리스 프로젝트의 골격과 정적인 게임 화면을 만든다.
이번 단계에서는 움직이는 블록이나 게임 규칙을 구현하지 않는다.

> **revision 2 메모** — revision 1 은 자료구조 키 이름, 보드 렌더 방식, 파일 개수 규칙이
> 정해져 있지 않아 구현자마다 다르게 읽혔고, 완료 조건 여러 개가 부재 증명이라 관측이 불가능했다.
> 이번 개정에서 그 결정들을 문서에 고정하고, 완료 조건을 전부 관측 가능한 형태로 바꿨다.
> 결정 근거는 §11 에 모아 두었다.

## 2. 기술과 파일 구조

- HTML5, CSS, 브라우저 기본 JavaScript만 사용한다.
- 프레임워크, 번들러, 패키지 매니저, 외부 라이브러리를 사용하지 않는다.
- 패키지 설치, 설정 파일, 개발 서버, 빌드 단계가 없어야 한다.
- 두 HTML 은 `file://` 로 직접 열어서 동작해야 한다. 개발 서버를 전제하지 않는다.
- 스크립트는 **classic script** 로만 불러온다. `type="module"` 을 쓰지 않는다.
  (`file://` 에서 ES module 은 CORS 로 차단된다.)
- 모든 참조는 같은 폴더의 **상대 경로**다. CDN 을 포함한 외부 URL 을 참조하지 않는다.
- `index.html` 은 `style.css`, `game.js`, `main.js` 를 직접 불러온다.
  `game.js` 를 `main.js` 보다 먼저 불러오며 두 스크립트에는 `defer` 를 사용한다.
- `test.html` 은 `game.js`, `test.js` 를 이 순서로 직접 불러와 브라우저에서 테스트 결과를 표시한다.
- 두 HTML 은 파비콘 404 로 콘솔이 더러워지지 않도록 `<link rel="icon" href="data:,">` 를 포함한다.

### 2.1 산출물 파일

산출물은 **정확히 다음 여섯 개**다. 이 목록에 없는 산출물 파일을 만들지 않는다.

```text
tetris-loop/
├── index.html
├── game.js
├── main.js
├── style.css
├── test.html
└── test.js
```

**하네스 파일은 산출물이 아니다.** 다음은 개수 제한의 대상이 아니며 검증에서도 세지 않는다.

`CLAUDE.md` · `MEMORY.md` · `SPEC_*.md` · `docs/` · `.claude/` · `.loop/` · `.git/` · `.gitignore`

### 2.2 대상 브라우저

최신 Chromium 계열 브라우저 1종에서 통과하면 된다. 다른 엔진 호환은 이번 단계의 요구가 아니다.

## 3. 화면 정의

### 3.1 문서

- `<title>` 과 화면 최상단 `<h1>` 이 모두 `TETRIS LOOP` 다.
- 배경색과 글자색을 CSS 에서 **명시적으로** 지정한다.
  `prefers-color-scheme` 대응은 이번 단계의 요구가 아니지만, 지정을 생략해서
  브라우저 기본값에 기대면 안 된다.
- `<main>`, `<button>` 같은 기본 시맨틱 태그를 쓴다. 그 이상의 접근성 요구는 이번 단계에 없다.

### 3.2 레이아웃

- 뷰포트 폭 **768px 이상**: 왼쪽에 게임 보드, 오른쪽에 상태 패널을 나란히 배치한다.
- 뷰포트 폭 **768px 미만**: 보드와 상태 패널을 세로로 배치한다.
- 폭 **320px ~ 1440px** 구간에서 가로 스크롤이 생기지 않아야 한다.
- **세로 스크롤은 허용한다.** 보드 20행이 화면보다 길어 세로로 넘치는 것은 실패가 아니다.

### 3.3 게임 보드

보드는 **DOM 요소**로 그린다. `<canvas>` 를 사용하지 않는다.

```html
<div id="board" data-role="board">
  <!-- 행 20개, 각 행에 셀 10개, 총 200개 -->
  <div class="row" data-role="row">
    <div class="cell" data-role="cell"></div>
    <!-- ... 셀 10개 -->
  </div>
  <!-- ... 행 20개 -->
</div>
```

- `[data-role="row"]` 20개, 각 행 안에 `[data-role="cell"]` 10개, 문서 전체 셀 200개.
- 셀은 테두리나 배경으로 서로 구분되어 보여야 한다.

### 3.4 상태 패널

라벨과 값을 분리하고, 값 요소에 `data-role` 을 붙인다.

```html
<div class="stat"><span class="label">점수</span><span data-role="score">0</span></div>
<div class="stat"><span class="label">제거한 줄</span><span data-role="lines">0</span></div>
<div class="stat"><span class="label">게임 상태</span><span data-role="status">READY</span></div>
```

- 라벨 문구는 `점수` · `제거한 줄` · `게임 상태` 다.
- 초기 표시값은 `0` · `0` · `READY` 다.

### 3.5 버튼과 조작 안내

```html
<button id="start-button" data-role="start">시작</button>
<p data-role="controls">← → ↓ 이동 · ↑ 회전 · Space 하드 드롭 · P 일시정지</p>
```

- `시작` 버튼은 보드 아래에 둔다. `disabled` 를 쓰지 않는다.
- 이번 단계에서 버튼에는 **어떤 이벤트 핸들러도 붙이지 않는다.**
  눌러도 화면이 전혀 바뀌지 않아야 한다.
- 조작 안내는 한 요소 안에 위 문자열과 **문자 단위로 일치**해야 한다.
  화살표 문자, 가운뎃점 `·`, 공백을 포함해 그대로 쓴다.

## 4. 상태와 공개 함수

### 4.1 `game.js` — 순수 로직

`game.js` 는 DOM 에 접근하지 않는다. 다음 값을 `globalThis.TetrisGame` 객체로 공개한다.

| 이름 | 값 / 반환 |
|------|-----------|
| `BOARD_WIDTH` | `10` |
| `BOARD_HEIGHT` | `20` |
| `GAME_STATUS` | 아래 §4.2 의 동결된 상수 객체 |
| `createEmptyBoard()` | 아래 §4.3 |
| `createInitialState()` | 아래 §4.4 |

### 4.2 `GAME_STATUS`

`Object.freeze` 된 객체이며, **각 값은 키 이름과 같은 문자열**이다.

```js
{ READY: 'READY', PLAYING: 'PLAYING', LANDED: 'LANDED', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER' }
```

`LANDED` 는 이번 단계에서 쓰이지 않는다. 이후 SPEC 이 쓸 자리를 미리 잡아 두는 것이며,
정의만 하고 어디에서도 참조하지 않는 것이 맞다.

### 4.3 `createEmptyBoard()`

- 길이 20 의 배열을 반환한다. 각 요소는 길이 10 의 배열이다.
- 모든 셀 값은 숫자 `0` 이다.
- **두 번 호출한 결과는 최상위 배열도, 각 행 배열도 공유하지 않는다.**
  (`a[0] !== b[0]` 이어야 한다.)

### 4.4 `createInitialState()`

다음 **네 개의 키**를 가진 새 객체를 반환한다. 키 이름은 아래와 정확히 같다.

| 키 | 값 |
|----|-----|
| `board` | `createEmptyBoard()` 의 결과 |
| `score` | `0` |
| `lines` | `0` (제거한 줄 수) |
| `status` | `GAME_STATUS.READY` |

두 번 호출한 결과는 `board` 를 공유하지 않는다.

### 4.5 `main.js` — 렌더링

`main.js` 는 `globalThis.TetrisApp` 객체로 다음을 공개한다.

| 이름 | 동작 |
|------|------|
| `render(state)` | 주어진 상태 객체로 보드와 상태 패널을 다시 그린다 |

- 보드 행 개수는 `state.board.length`, 각 행의 셀 개수는 `state.board[i].length` 를 따른다.
  상수를 하드코딩하지 않는다.
- 패널의 세 값은 `state.score` · `state.lines` · `state.status` 에서 읽는다.
- `main.js` 는 로드 시 `TetrisApp.render(TetrisGame.createInitialState())` 를 **한 번** 호출한다.

이 규정의 목적은 화면이 `game.js` 를 실제로 사용하도록 강제하는 것이다.
값을 HTML 에 써 넣고 끝내면 §6-11 검증에서 걸린다.

## 5. 범위 밖

- 움직이는 테트로미노
- 키보드 입력 처리
- 타이머와 자동 낙하
- 충돌, 줄 제거, 점수 계산
- `시작` 버튼의 동작
- 리더보드와 브라우저 저장
- 다크모드 대응, 브라우저 확대 대응, 기본 시맨틱을 넘는 접근성
- 외부 배포

## 6. 완료 조건

전 항목이 관측 가능해야 한다. 판정 방법은 §7·§8 에 있다.

- [ ] **6-1** 산출물 파일 집합이 §2.1 의 여섯 개와 정확히 일치한다 (하네스 파일 제외).
- [ ] **6-2** `package.json`, lockfile, `node_modules/`, 번들러·TS 설정 파일이 없고,
      두 HTML 의 외부 URL 참조가 0건이다.
- [ ] **6-3** `index.html` 로드 완료 후 5초까지 콘솔 **error 레벨 0건**이다. (warning 은 세지 않는다.)
- [ ] **6-4** `index.html` 이 `style.css` → `game.js` → `main.js` 순서로 참조하고,
      두 `<script>` 에 `defer` 가 있으며 `type="module"` 이 없다.
- [ ] **6-5** `test.html` 이 `game.js` → `test.js` 순서로 참조한다.
- [ ] **6-6** `test.html` 요약이 `FAIL 0` 이고 `PASS` 가 **18 이상**이며,
      §7.2 의 필수 테스트 이름이 전부 결과 목록에 있다.
- [ ] **6-7** `index.html` 에서 `[data-role="row"]` 20개, 각 행의 `[data-role="cell"]` 10개,
      문서 전체 셀 200개다.
- [ ] **6-8** `[data-role="score"]`=`0`, `[data-role="lines"]`=`0`, `[data-role="status"]`=`READY`
      이고, 라벨 `점수` · `제거한 줄` · `게임 상태` 가 화면에 있다.
- [ ] **6-9** `<title>` 과 `<h1>` 이 모두 `TETRIS LOOP` 다.
- [ ] **6-10** `[data-role="start"]` 버튼 텍스트가 `시작` 이고,
      `[data-role="controls"]` 텍스트가 §3.5 문자열과 문자 단위로 같다.
- [ ] **6-11** 콘솔에서
      `TetrisApp.render({...TetrisGame.createInitialState(), score: 1234, lines: 7, status: 'PAUSED'})`
      를 실행하면 패널이 `1234` · `7` · `PAUSED` 로 바뀐다.
- [ ] **6-12** 폭 320 · 390 · 480 · 768 · 1024 · 1440px 각각에서
      `scrollWidth <= clientWidth` 이고, 390px 에서 세로 배치, 1024px 에서 좌우 배치다.
- [ ] **6-13** 로드 후 5초 경과, `← → ↓ ↑ Space P` 입력, `시작` 버튼 클릭을 모두 거친 뒤
      보드 200셀과 패널 세 값의 스냅샷이 초기와 완전히 같다.

## 7. 자동 검증

### 7.1 러너 출력 형식

`test.html` 은 결과를 사람이 읽을 수 있게 표시하되, 아래 구조를 반드시 포함한다.
기계가 결과를 읽을 수 있어야 하기 때문이다.

```html
<div id="test-summary" data-pass="18" data-fail="0">PASS 18 / FAIL 0</div>
<ul id="test-results">
  <li data-name="board-width" data-result="pass">BOARD_WIDTH 는 10 이다</li>
  <li data-name="..." data-result="fail">... — 실패 이유</li>
</ul>
```

- `#test-summary` 의 `data-pass` · `data-fail` 은 정수다.
- 실패한 항목은 `<li>` 텍스트에 실패 이유를 포함한다.

### 7.2 필수 테스트

아래 18개는 **`data-name` 이 정확히 이 값이어야** 한다. 더 추가하는 것은 자유다.

| `data-name` | 확인 내용 |
|-------------|-----------|
| `api-tetrisgame` | `globalThis.TetrisGame` 이 객체다 |
| `api-create-empty-board` | `createEmptyBoard` 가 함수다 |
| `api-create-initial-state` | `createInitialState` 가 함수다 |
| `api-game-status` | `GAME_STATUS` 가 객체다 |
| `board-width` | `BOARD_WIDTH === 10` |
| `board-height` | `BOARD_HEIGHT === 20` |
| `empty-board-row-count` | 빈 보드의 행이 20개다 |
| `empty-board-col-count` | 모든 행의 셀이 10개다 |
| `empty-board-all-zero` | 모든 셀이 숫자 `0` 이다 |
| `empty-board-outer-not-shared` | 두 번 만든 보드의 최상위 배열이 다르다 |
| `empty-board-rows-not-shared` | 두 번 만든 보드의 각 행 배열이 다르다 |
| `status-keys` | `GAME_STATUS` 키가 정확히 5개다 |
| `status-values-match-keys` | 각 값이 키 이름과 같은 문자열이다 |
| `status-frozen` | `Object.isFrozen(GAME_STATUS)` 가 참이다 |
| `initial-score` | 초기 상태 `score === 0` |
| `initial-lines` | 초기 상태 `lines === 0` |
| `initial-status` | 초기 상태 `status === GAME_STATUS.READY` |
| `initial-board-not-shared` | 두 번 만든 초기 상태의 `board` 가 다르다 |

## 8. 수동 검증

자동으로 관측할 수 없는 것만 남긴다. 나머지는 §6 이 기계 판정한다.

1. `index.html` 을 열어 보드 셀 격자가 **시각적으로 구분되어** 보이는지 본다.
2. 1024px 폭에서 보드가 왼쪽, 상태 패널이 오른쪽으로 보이는지 본다.
3. 390px 폭에서 보드와 상태 패널이 위아래로 쌓이고, 잘려 나간 내용이 없는지 본다.

## 9. 안전과 정지 조건

- 프로젝트 폴더 밖 파일을 만들거나 수정하지 않는다.
- 외부 배포와 유료 서비스를 사용하지 않는다.
- **루프 반복을 3회** (frontmatter `max_iterations`) 소진하거나,
  같은 실패 시그니처가 두 번 기록되면 중단한다.
- 이 문서에 없는 화면·기술 결정을 해야 하면 추측하지 않고 `[사람 확인 필요]` 로 보고한다.

## 10. 다음 단계로 넘기는 것

이번 단계에서 의도적으로 남긴 것들이다. 지금 구현하면 범위 초과다.

| 항목 | 넘기는 이유 |
|------|-------------|
| `시작` 버튼 동작 | 게임 루프가 없으므로 누를 대상이 없다 |
| `GAME_STATUS.LANDED` 사용처 | 충돌·고정이 §5 범위 밖이다 |
| 키보드 입력 | 조작 안내는 표시만 하고 동작은 다음 SPEC 이다 |

## 11. 해석 고정 근거 (revision 2)

구현자마다 다르게 읽히던 지점과, 어느 쪽으로 정했는지.

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| `createInitialState()` 키 이름 | `board` · `score` · `lines` · `status` | 이름이 없으면 §7 의 초기 상태 테스트를 쓸 수 없었다 |
| 보드 렌더 방식 | DOM 요소 (`canvas` 금지) | `canvas` 면 셀 200개를 관측할 방법이 없어 6-7 이 검증 불가가 된다 |
| "최소 파일 구조" vs "여섯 개만" | 산출물 정확히 6개, 하네스 파일은 세지 않음 | 하네스 파일이 실재하므로 문자 그대로면 영구 실패였다 |
| `GAME_STATUS` 값 타입 | 키 이름과 같은 문자열, `Object.freeze` | 값을 모르면 테스트가 비교할 대상이 없다 |
| 반응형 브레이크포인트 | 768px | 수치가 없으면 391~767px 구간 동작이 미정이었다 |
| 검사할 폭 | 320 · 390 · 480 · 768 · 1024 · 1440 | 연속 구간 전체는 유한 검증이 불가능하다 |
| 세로 스크롤 | 허용 | 원문이 가로만 금지했는데 20행 보드는 세로로 넘칠 수밖에 없다 |
| 조작 안내 | 문자 단위 일치 | "의미만 맞으면" 이면 판정이 사람 주관이 된다 |
| `시작` 버튼 | 핸들러 없음, 눌러도 무변화 | 원문이 버튼을 요구하면서 동작을 §5 에 넣지 않아 비어 있었다 |
| 스크립트 방식 | classic script, `type="module"` 금지 | `file://` 에서 module 은 CORS 로 죽는다 |
| 파비콘 | `<link rel="icon" href="data:,">` | 없으면 favicon 404 가 6-3 의 "콘솔 오류 0건" 을 흔든다 |
| "콘솔 오류" 정의 | error 레벨만, 로드 후 5초까지 | 범위가 없으면 환경마다 판정이 달라진다 |
| `TetrisApp.render(state)` | 신설 | 값을 HTML 에 하드코딩해도 원문 완료 조건을 전부 통과할 수 있었다 |
| 테스트 개수·이름 | 18개 고정 | "모든 테스트 통과" 는 테스트 1개만 써도 충족되는 자기 채점이었다 |
| "총 세 번 실행" | 루프 반복 3회 | frontmatter `max_iterations` 와 같은 값임을 명시했다 |
