---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 검증 게이트

**관측만 한다.** 코드·상태 파일을 고치지 않는다. 현재 대상 **SPEC_06 rev1 (`SPEC_06_PAUSE.md`)**.

## 판정 규칙

`PASS` 직접 관측해 만족 · `FAIL` 불만족 · `BLOCKED` 관측 불가. 관측하지 못한 것을 `PASS` 로 적지 않는다.

## 단계 0 — 채널

시간 의존 조건 없음. 6-3 을 뺀 21개는 순수 함수 · `loadState` · 합성 `keydown` · `tick()` · `getActiveDropTimerCount()` · `getDropStats()` · DOM 으로 결정적 판정.
MCP 없으면 Node 스텁(`setInterval`/`clearInterval` 흉내로 실제 타이머 수도 셈). **6-3 종합 제외**, 21개 전부 PASS 면 `PASSED`.

### 준비물 (SPEC_06 §6.0)

```js
const G = TetrisGame, App = TetrisApp;
const key = k => { const e = new KeyboardEvent('keydown', {key: k, cancelable: true, bubbles: true}); window.dispatchEvent(e); return e.defaultPrevented; };
const text = r => document.querySelector('[data-role="' + r + '"]').textContent;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const playing = ex => Object.assign({ board: G.createEmptyBoard(), piece: G.createPiece('T'), next: 'S', score: 0, lines: 0, status: 'PLAYING' }, ex || {});
const snap = () => ({ cells: [...document.querySelectorAll('[data-role="row"]')].flatMap((r, y) => [...r.children].map((c, x) => c.hasAttribute('data-piece') ? [y, x, c.getAttribute('data-piece')] : null).filter(Boolean)),
  score: text('score'), lines: text('lines'), level: text('level'), status: text('status'),
  next: [...document.querySelectorAll('[data-role="next-cell"]')].map((c, i) => c.hasAttribute('data-piece') ? i + c.getAttribute('data-piece') : '').join(','),
  count: App.getDropStats().count, timers: App.getActiveDropTimerCount() });
const minRow = () => Math.min(...snap().cells.filter(c => true).map(c => c[0]));   // 현재 블록만 볼 때는 보드 고정 셀이 없는 상태에서 쓴다
const verticalI = () => ({ type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
const blockedTop = () => { const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b, r, 0, 8, 'O')); return b; };
```

## 정적 · 러너 · 콘솔

| # | 관측 |
|---|------|
| 6-1 | `ls -a` 산출물 6개, 하네스 제외 |
| 6-2 | 설치 산출물·외부 URL·`fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` grep 0 |
| 6-4 | `data-fail` 0, `data-pass` ≥166, §7.3 17개 + 유지 149개 존재 |
| 6-3 | **사람.** 로드 5초 → `시작` → `P`·`P`·`P` → 5초, 페이지 error 0 (확장 주입 제외). 종합 제외 |

## A — 상태 전이

| # | 관측 |
|---|------|
| 6-5 | `s=playing(); r=G.togglePause(s)` → `r.status` `PAUSED`, `[board,piece,next,score,lines]` 모두 `r[k]===s[k]` |
| 6-6 | `s=playing({status:'PAUSED'}); r=G.togglePause(s)` → `PLAYING`, 다섯 키 `===` |
| 6-7 | `G.togglePause(G.createInitialState())===그 인자`, `G.togglePause(playing({status:'GAME_OVER'}))===그 인자` |
| 6-8 | 네 상태 각각 새로 `loadState` 후 `P`: READY→READY(prevented false) · PLAYING→PAUSED(true) · PAUSED→PLAYING(true) · GAME_OVER→GAME_OVER(false). `text('status')` 로 본다 |

## B — 진입·낙하 정지

| # | 관측 |
|---|------|
| 6-9 | `loadState(playing({lines:25}))` → `a=snap()` → `key('p')` → `status` `PAUSED`, `timers` 0, `cells` `===a.cells`(JSON) |
| 6-10 | 이어서 `App.tick()`×5 → `snap()` 의 `cells`·`count` 가 `a` 와 동일 |
| 6-11 | `loadState(playing())` → `timers` 1 확인 → `key('p')` → `timers` 0. 스텁: 실제 등록 타이머 0 |

## C — 입력 차단

| # | 관측 |
|---|------|
| 6-12 | `PAUSED` 에서 `['ArrowLeft','ArrowRight','ArrowDown','ArrowUp']` 각 3회 → 전부 `prevented===true`, `snap()` 의 `cells·score·lines·level·next·count` 동일 |
| 6-13 | `PAUSED` 에서 `[data-role="start"].click()` → `status` `PAUSED`, `cells`·`next` 동일, `timers` 0 |

## D — 보존·재개

| # | 관측 |
|---|------|
| 6-14 | `j=G.createPiece('J'); loadState({board: fill(빈,19,0,4,'O'), piece:{...j, cells:G.rotateCells(j.cells)}, next:'Z', score:700, lines:23, status:'PLAYING'})` → `a=snap()` → `P` → 방향키 4개 → `tick()`×3 → `P` → `b=snap()`: `b.cells===a.cells`, `score '700'`, `lines '23'`, `level '3'`, `next===a.next`, `status 'PLAYING'` |
| 6-15 | 6-14 직후 `getDropStats().intervalMs` **580**, `timers` **1** |
| 6-16 | `loadState(playing({lines:9}))` → `P`·`P` → `intervalMs` 700. `loadState(playing({lines:37}))` → `P`·`P` → 520 |
| 6-17 | 재개 직후 `r0=minRow(), c0=count` → `tick()` → `minRow()-r0===1`, `count-c0===1` (빈 보드에서) |
| 6-18 | `PAUSED` 에서 `App.saveResult('민수')` → `{ok:false, reason:'NOT_GAME_OVER'}`, `localStorage` 문자열 동일 |

## E — 반복·재시작

| # | 관측 |
|---|------|
| 6-19 | `loadState(playing())` → `key('p')`×8 → `status` `PLAYING`, `timers` 1, 스텁 실제 타이머 1 |
| 6-20 | 새로 `loadState(playing())` → `key('p')`×7 → `PAUSED`, `timers` 0 |
| 6-21 | 6-19 뒤 `tick()` 1회 → `minRow` +1, `count` +1 |
| 6-22 | `loadState({board: blockedTop(), piece: verticalI(), next:'T', score:0, lines:37, status:'PLAYING'})` → `key('ArrowDown')` → `GAME_OVER` → `[data-role="start"].click()` → `PLAYING`, `lines '0'`, `level '1'`, `intervalMs` 700, `timers` 1 |

## 반환

```markdown
## 검증 결과 — SPEC_06
| # | 항목 | 결과 | 근거 |
...
- 종합: PASS n / FAIL n / BLOCKED n / 사람 확인 1
- 판정: PASSED|FAILED|BLOCKED
- 실패 시그니처: `<파일>:<증상>`
```
