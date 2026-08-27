---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 검증 게이트

**이 스킬의 유일한 일은 관측이다.** 코드를 고치지 않는다. 상태 파일을 쓰지 않는다.
호출자에게 항목별 표를 돌려주는 것으로 끝난다.

현재 대상은 **SPEC_04 revision 1 (`SPEC_04_LEVEL_AND_SPEED.md`)** 이다.

## 판정 규칙

| 값 | 의미 |
|----|------|
| `PASS` | 직접 관측해 조건을 만족함 |
| `FAIL` | 직접 관측해 조건을 만족하지 못함 |
| `BLOCKED` | 관측 자체를 못 함 |

**관측하지 못한 것을 `PASS` 로 적지 않는다.** 근거 열에는 실제로 본 값을 적는다.

## 단계 0 — 관측 채널

SPEC_04 는 **시간에 기대는 조건이 없다.** 6-3(콘솔)을 뺀 19개는 순수 함수 호출 · `loadState` ·
`tick()` · 합성 이벤트 · DOM 텍스트로 결정적으로 판정된다.

| 채널 | 언제 | 무엇을 |
|------|------|--------|
| 브라우저 MCP 있음 | 기본 | 20개 전부 `http://localhost:8000` 에서 |
| MCP 없음 | 사람이 직접 검증하기로 한 경우 | 6-1·6-2 파일시스템, 6-4~6-20 은 **Node 스텁**(scratchpad `run-tests.js` · DOM 스텁)으로. 6-3 은 사람 몫 |

Node 채널로 관측한 항목은 근거에 `(Node DOM)` 을 붙인다.
**6-3 은 루프의 종합 판정에서 제외한다** — `BLOCKED` 이 아니라 `사람 확인` 으로 적고,
나머지 19개가 전부 `PASS` 면 종합 `PASSED` 로 낸다. 사람이 마지막에 콘솔을 한 번 본다 (SPEC_04 §6·§11).

정적 서버·합성 디스패치·억제 주의사항은 앞 SPEC 과 같다 (`file://` 거부, `computer` 키 입력 미사용,
숨은 탭 타이머 억제 — 이번엔 실측 조건이 없어 영향 없음).

### 준비물 (SPEC_04 §6.0)

```js
const G = TetrisGame;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const verticalI = () => ({ type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
const oneLineAt = (lines, score) => {
  TetrisApp.loadState({ board: fill(G.createEmptyBoard(), 19, 0, 8, 'O'), piece: verticalI(),
                        score: score || 0, lines, status: 'PLAYING' });
  down();
};
const twoLinesAt = (lines, score) => {
  const b = G.createEmptyBoard(); fill(b, 18, 0, 8, 'O'); fill(b, 19, 0, 8, 'O');
  TetrisApp.loadState({ board: b, piece: verticalI(), score: score || 0, lines, status: 'PLAYING' });
  down();
};
const text = r => document.querySelector('[data-role="' + r + '"]').textContent;
const minRow = () => Math.min(...[...document.querySelectorAll('[data-role="row"]')]
  .flatMap((r, y) => [...r.children].some(c => c.hasAttribute('data-piece')) ? [y] : []));
```

## 단계 1 — 정적 검사

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-1 | 산출물 집합 일치 | `ls -a` — 여섯 개 정확히. 하네스 파일은 세지 않는다 |
| 6-2 | 설치·외부참조·서버통신 없음 | 설치 산출물 부재, 두 HTML 외부 URL 0건, 산출물 grep 에 `fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 0건 |

## 단계 2 — 러너와 콘솔

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-4 | 테스트 통과 | `data-fail`=`0`, `data-pass` ≥ `126`. SPEC_04 §7.3 20개 + 유지 106개 전부 존재. 폐기 0 |
| 6-3 | 콘솔 오류 없음 | **사람 몫.** 로드 후 5초, `oneLineAt(9)` 한 번 뒤 5초까지 페이지가 만든 error 0건. 확장 주입 예외(`A listener indicated…`)는 세지 않는다. 종합 판정에서 제외 |

## 단계 3 — 레벨 계산 (그룹 A)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-5 | 경계 | `[0,9,10,19,20].map(G.levelForLines)` → `[1,1,2,2,3]` |
| 6-6 | 상위·범위 밖 | `[29,30,99,100]` → `[3,4,10,11]`, `[-1,1.5,'10',null]` → 전부 `1` |

## 단계 4 — 낙하 간격 (그룹 B)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-7 | 레벨 1~5 | `[1,2,3,4,5].map(G.dropIntervalForLevel)` → `[700,640,580,520,460]` |
| 6-8 | 하한 | `[11,12,20,100,1000]` → 전부 `100` |
| 6-9 | 상수 일치 | `G.dropIntervalForLevel(1) === G.DROP_INTERVAL_MS && G.DROP_INTERVAL_MS === 700` |

## 단계 5 — 점수 배수 (그룹 C)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-10 | 레벨 배수 | `oneLineAt(0)` → `score` `100`; `oneLineAt(10)` → `200`; `oneLineAt(20)` → `300` |
| 6-11 | 직전 레벨 | `oneLineAt(9)` → `score` `100`, `lines` `10`, `level` `2`. `twoLinesAt(19)` → `600`, `lines` `21`, `level` `3`. `twoLinesAt(20)` → `900` |
| 6-12 | 줄 제거 외 점수 없음 | `loadState({board: 빈, piece: createPiece('T'), score: 0, lines: 25, status: 'PLAYING'})` → `ArrowDown`·`ArrowLeft`·`ArrowRight`·`ArrowUp` 각 3회 → `score` `0` |

## 단계 6 — 레벨 전환과 타이머 (그룹 D)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-13 | 레벨 2 | `oneLineAt(9)` → `level` `2`, `getDropStats().intervalMs` `640`, `getActiveDropTimerCount()` `1` |
| 6-14 | 레벨 3 | `oneLineAt(19)` → `level` `3`, `intervalMs` `580`, 타이머 `1` |
| 6-15 | 같은 레벨 | `oneLineAt(0)` → `intervalMs` `700`, `level` `1` |
| 6-16 | 연속 전환 | `oneLineAt(9)` → `oneLineAt(19)` → `oneLineAt(29)` → 타이머 `1`, `intervalMs` `520` |
| 6-17 | tick 한 칸 | `oneLineAt(9)` → `minRow()` 와 `getDropStats().count` 기록 → `TetrisApp.tick()` → 둘 다 정확히 `+1` |

## 단계 7 — 재시작과 표시 (그룹 E)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-18 | 재시작 | `loadState({board: 빈, piece: null, score: 0, lines: 37, status: 'GAME_OVER'})` → `level` `4`, 타이머 `0` 확인 → `[data-role="start"].click()` → `lines` `0`, `level` `1`, `intervalMs` `700`, 타이머 `1`, `status` `PLAYING` |
| 6-19 | 라벨과 위치 | 로드 직후 `level` `1`, `[data-role="level"]` 의 이전 형제 `.label` 텍스트 `레벨`, 그 `.stat` 이 `게임 상태` `.stat` 의 다음 형제 |
| 6-20 | 표시 일관성 | `lines` `0·9·10·25·100` 을 `loadState` 로 넣을 때마다 `Number(text('level')) === G.levelForLines(Number(text('lines')))` |

## 반환 형식

```markdown
## 검증 결과 — SPEC_04

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-3 | 콘솔 오류 없음 | 사람 확인 | 종합 판정 제외 |
| 6-13 | 레벨 2 | FAIL | intervalMs 700 (타이머를 다시 걸지 않음) |
...

- 종합: PASS 18 / FAIL 1 / BLOCKED 0 / 사람 확인 1
- 판정: FAILED
- 실패 시그니처: `main.js:timer-not-rescheduled-on-level-change`
```

종합 판정: `BLOCKED` 하나라도 있으면 `BLOCKED`. 아니면 `FAIL` 하나라도 있으면 `FAILED`.
19개(6-3 제외)가 전부 `PASS` 면 `PASSED`.
실패 시그니처는 `<파일>:<증상>` 형태의 정규화된 짧은 문자열이다.
