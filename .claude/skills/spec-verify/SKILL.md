---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 브라우저 검증 게이트

**이 스킬의 유일한 일은 관측이다.** 코드를 고치지 않는다. 상태 파일을 쓰지 않는다.
발견한 문제를 고치고 싶어도 고치지 않는다 — 판정과 수정이 같은 손에 있으면 게이트가 무의미해진다.

현재 대상은 **SPEC_03 revision 1 (`SPEC_03_SCORE_AND_LEADERBOARD.md`)** 이다.

## 판정 규칙

| 값 | 의미 |
|----|------|
| `PASS` | 브라우저/파일시스템에서 **직접 관측**해 조건을 만족함 |
| `FAIL` | 직접 관측해 조건을 만족하지 못함 |
| `BLOCKED` | 관측 자체를 못 함 (도구 없음, 페이지 로드 실패, 요소를 찾을 수 없음) |

**관측하지 못한 것을 `PASS` 로 적지 않는다.** 근거 열에는 추론이 아니라 실제로 본 값을 적는다.

## 단계 0 — 도구 확인

브라우저 도구(페이지 열기 · DOM 조회 · 콘솔 읽기 · JS 실행)가 없으면 전 항목 `BLOCKED` 로
끝낸다. 사유: `브라우저 도구 없음. claude --chrome 으로 세션을 다시 열어야 검증 가능.`
`list_connected_browsers` 가 `[]` 여도 같다 (사유에 "Chrome 확장 미연결").
파일시스템만으로 되는 항목도 이때는 판정하지 않는다.

**브라우저 도구가 없고 사람이 직접 검증하기로 한 경우에만** 대안 채널을 쓸 수 있다.
그때는 순수 로직을 Node 로 돌리고(가짜 DOM 스텁), 관측 경로를 리포트에 `PASS (Node DOM)` 처럼
명시한다. CSS·실시간 타이머·콘솔·`localStorage` 는 그 채널로 증명되지 않으므로 사람에게 넘긴다.

## 단계 0.5 — 관측 채널

정적 서버를 프로젝트 루트에서 띄운다. `file://` 은 확장이 거부한다.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

입력은 **합성 디스패치**로 넣는다 (`computer` 의 실제 키·클릭은 창 상태에 좌우돼 조용히 사라진다).

```js
window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
document.querySelector('[data-role="save"]').click();
```

숨은 탭은 `setInterval` 이 1000ms 로 조이고 5분 넘으면 더 심해진다. 타이밍이 걸린 항목은
**페이지를 새로 로드한 직후**에 재고, 페이지 안 대기는 긴 `sleep` 한 번으로 한다.

### 준비물 (SPEC_03 §6.0)

```js
const G = TetrisGame, KEY = G.LEADERBOARD_KEY;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const verticalI = () => ({ type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
const boardA = () => fill(G.createEmptyBoard(), 19, 0, 8, 'O');                       // 한 줄 완성 직전
const boardC = () => { const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b, r, 0, 8, 'O')); return b; };
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
const makeGameOver = (score, lines) => {
  TetrisApp.loadState({ board: boardC(), piece: verticalI(), score, lines, status: 'PLAYING' });
  down();
};
const records = () => [...document.querySelectorAll('[data-role="record"]')].map(li => ({
  rank: li.querySelector('[data-role="rank"]').textContent,
  name: li.querySelector('[data-role="record-name"]').textContent,
  score: li.querySelector('[data-role="record-score"]').textContent,
  lines: li.querySelector('[data-role="record-lines"]').textContent
}));
```

`localStorage` 는 직접 읽고 쓴다. `window.confirm` 은 임시로 바꿔 끼운다.

## 단계 1 — 정적 검사 (파일시스템)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-1 | 산출물 집합 일치 | `ls -a` — 여섯 개 정확히. 하네스 파일은 세지 않는다 |
| 6-2 | 설치·외부참조·서버통신 없음 | 설치 산출물 부재, 두 HTML 외부 URL 0건, 산출물 여섯 개 grep 에 `fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 0건 |

## 단계 2 — 브라우저 검사

### 2a. 러너와 콘솔

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-4 | 테스트 통과 | `data-fail`=`0`, `data-pass` ≥ `105`. SPEC_03 §7.3 의 31개(28개 신규 포함)와 유지 77개가 전부 있고 **`lock-and-advance-keeps-score` 는 없어야** 한다 |
| 6-3 | 콘솔 오류 없음 | 트래킹 `clear` 후 재로드 → 게임오버·저장·초기화를 한 바퀴 → 페이지가 만든 error 0건. 확장 주입 예외는 세지 않는다 (출처 `:0:0`, `test.html` 에서도 같은 문구, 산출물 grep 0건) |

### 2b. 점수 (그룹 A)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-5 | 점수표 | `SCORE_TABLE` 이 `[0,100,300,500,800]`, `Object.isFrozen` 참 |
| 6-6 | 1줄 100 | 보드 (가) `loadState` → `ArrowDown` → `score`=`100`, `lines`=`1` |
| 6-7 | 2줄 300 | 18·19행 열 0~8 고정 + 세로 I → `ArrowDown` → `score`=`300`, `lines`=`2` |
| 6-8 | 누적 | `score` 500·`lines` 7 로 시작해 보드 (가) 한 줄 → `600` · `8` |
| 6-9 | 게임오버 고정도 가산 | 19행 열 0~8 **와** 0~3행 열 0~8 고정 + 세로 I → `ArrowDown` → `GAME_OVER`, `score`=`100` |

### 2c. 표시와 시점 (그룹 B)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-10 | READY 에서 숨김 | 로드 직후 `[data-role="gameover"]`.hidden 이 `true`, `[data-role="record"]` 수 = 저장된 유효 기록 수 |
| 6-11 | PLAYING 에서 저장 거부 | hidden `true`, `TetrisApp.saveResult('민수')` 가 `{ok:false, reason:'NOT_GAME_OVER'}`, `localStorage` 문자열 불변 |
| 6-12 | 게임오버 표시 | hidden `false`, `[data-role="final-score"]`·`[data-role="final-lines"]` 가 그 게임 최종값, 입력란·저장 버튼 존재 |
| 6-13 | 문구 | `기록 저장` · `리더보드 초기화` · `리더보드` 문자 단위 일치 |

### 2d. 이름 검증

각 항목마다 저장 전후 `localStorage` 문자열과 기록 수를 함께 본다.

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-14 | trim | `'  민수  '` 저장 → `ok`, 저장된 `name` 이 정확히 `민수` |
| 6-15 | 너무 짧음 | `'민'` → `reason` `TOO_SHORT`, 오류 문구 `이름은 2자 이상이어야 합니다`, 기록 불변 |
| 6-16 | 너무 김 | 11자 → `TOO_LONG`, `이름은 10자 이하여야 합니다`, 기록 불변 |
| 6-17 | 경계 통과 | `'민수'`(2자)·10자 한글 각각 저장 성공 |
| 6-18 | 허용 안 되는 문자 | `'김 민수'`·`'Player!'`·`'민수🎮'` 셋 다 `INVALID_CHAR`, `한글·영문·숫자만 쓸 수 있습니다`, 기록 불변 |
| 6-19 | 영문·숫자·한글 | `'Player1'`·`'테트리스7'` 저장 성공 |
| 6-20 | 실패는 저장소를 안 건드림 | 실패 직전/직후 `localStorage.getItem(KEY)` 문자열 동일, 이어서 올바른 이름으로 저장하면 성공 |

### 2e. 중복 저장과 재시작

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-21 | 중복 차단 | 저장 성공 후 `saveResult` 3회 → 전부 `ALREADY_SAVED`, 기록 수 불변. 저장 버튼 5연타 → 기록 수 불변 |
| 6-22 | 새 게임은 다시 저장 가능 | `시작` → 게임오버 → `isSavedForCurrentGame()`=`false`, 저장 성공 |

### 2f. 저장 구조와 정렬

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-23 | 키와 필드 | 쓰인 키가 `tetris-loop.leaderboard.v1`, 기록에 5키 존재, 타입 `string·string·number·number·number` |
| 6-24 | 점수→시각 정렬 | `100`·`300(T2)`·`300(T3)` 주입 후 새로고침 → 표시 순서 `300(T2)`·`300(T3)`·`100` |
| 6-25 | 안정 정렬 | `score`·`playedAt` 동일한 둘 → 배열에서 앞이 화면에서도 앞 |
| 6-26 | 상위 10개 | 11개 → 배열 길이 `10`, `[data-role="record"]` `10`개, 잘린 건 최저점(동점이면 가장 늦은) |
| 6-27 | 최고점 삽입 | 10개 찬 상태에서 최고점 저장 → 1위, 기존 최하위 사라짐, 길이 `10` |
| 6-28 | 새로고침 유지 | 새로고침 전후 개수·순서·이름·점수 동일 |

### 2g. 손상 데이터와 초기화

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-29 | 손상 JSON | `setItem(KEY,'{broken json')` → 새로고침 → 콘솔 error 0건, 기록 0개, **저장값은 `{broken json` 그대로** |
| 6-30 | 구조 불량 | `null` · `"문자열"` · `{"a":1}` · 필수 필드 빠진 항목이 섞인 배열 — 네 경우 각각 새로고침 → 정상 실행, 유효 항목만 표시, 콘솔 error 0건 |
| 6-31 | 초기화 확인 | `window.confirm=()=>false` 로 클릭 → 저장값·화면 불변. `()=>true` 로 클릭 → 저장값 `[]`, 기록 0개. 재시작해도 리더보드 불변 |

## 반환 형식

```markdown
## 검증 결과 — SPEC_03

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | ls 결과 정확히 6개 |
| 6-7 | 2줄 300 | FAIL | score 가 200 (줄당 100 으로 계산) |
...

- 종합: PASS 29 / FAIL 1 / BLOCKED 1
- 판정: FAILED
- 실패 시그니처: `game.js:score-per-line-not-table`
```

종합 판정: `BLOCKED` 하나라도 있으면 `BLOCKED`. 아니면 `FAIL` 하나라도 있으면 `FAILED`.
전부 `PASS` 여야 `PASSED`.

실패 시그니처는 **정규화된 짧은 문자열**이어야 한다 (`<파일>:<증상>`, 타임스탬프·가변 수치 금지).
