---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 검증 게이트

**관측만 한다.** 코드·상태 파일을 고치지 않는다. 항목별 표를 돌려주는 것으로 끝난다.

현재 대상은 **SPEC_05 revision 1 (`SPEC_05_NEXT_PIECE.md`)** 이다.

## 판정 규칙

`PASS` 직접 관측해 만족 · `FAIL` 직접 관측해 불만족 · `BLOCKED` 관측 불가.
**관측하지 못한 것을 `PASS` 로 적지 않는다.** 근거에는 실제로 본 값을 적는다.

## 단계 0 — 관측 채널

SPEC_05 는 시간 의존 조건이 없다. 6-3(콘솔)을 뺀 21개는 공급자 인자를 넘긴 순수 함수 호출 ·
`loadState` · 합성 이벤트 · DOM 으로 결정적으로 판정된다.

| 채널 | 언제 | 무엇을 |
|------|------|--------|
| 브라우저 MCP 있음 | 기본 | 22개 전부 `http://localhost:8000` |
| MCP 없음 (사람 검증 결정) | 대안 | 6-1·6-2 파일시스템, 6-4~6-22 Node 스텁. 6-3 사람. **6-11 색은 Node 에서 `data-piece` 동일성으로 대체**하고 근거에 명시 |

Node 관측은 근거에 `(Node DOM)`. **6-3 은 종합 판정에서 제외** — 21개 전부 `PASS` 면 `PASSED`.

### 준비물 (SPEC_05 §6.0)

```js
const G = TetrisGame;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
const nextCells = () => [...document.querySelectorAll('[data-role="next-cell"]')];
const nextIdx = () => nextCells().map((c, i) => c.hasAttribute('data-piece') ? i : -1).filter(i => i >= 0);
const nextTypes = () => [...new Set(nextCells().filter(c => c.hasAttribute('data-piece')).map(c => c.getAttribute('data-piece')))];
const makeSupply = (queue) => { const s = (prev) => { s.calls += 1; s.args.push(prev); return queue.shift(); }; s.calls = 0; s.args = []; return s; };
const bottomT = () => ({ type: 'T', cells: G.createPiece('T').cells, row: 18, col: 3 });
const verticalI = () => ({ type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
const NEXT_IDX = { I:[4,5,6,7], O:[5,6,9,10], T:[1,4,5,6], S:[1,2,4,5], Z:[0,1,5,6], J:[0,4,5,6], L:[2,4,5,6] };
const playing = (b, p, ex) => Object.assign({ board: b, piece: p, next: null, score: 0, lines: 0, status: 'PLAYING' }, ex || {});
```

## 단계 1 — 정적

| # | 조건 | 관측 |
|---|------|------|
| 6-1 | 산출물 6개 | `ls -a`, 하네스 파일 제외 |
| 6-2 | 설치·외부 URL·`fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 0건 | grep |

## 단계 2 — 러너·콘솔

| # | 조건 | 관측 |
|---|------|------|
| 6-4 | `data-fail` 0, `data-pass` ≥149, §7.3 24개 + 유지 125개 존재, `initial-state-keys-five` **부재** | 러너 DOM |
| 6-3 | 로드 5초 → `시작` → `ArrowDown`×25 → ×25 → 5초, 페이지 error 0건 (확장 주입 제외) | **사람**, 종합 제외 |

## 단계 3 — 상태와 시작 (A)

| # | 관측 |
|---|------|
| 6-5 | `Object.keys(createInitialState()).sort()` → `board,lines,next,piece,score,status`, `next === null` |
| 6-6 | `s=makeSupply(['T','I','L']); r=G.startGame(null,s)` → `r.piece.type` `T`, `r.next` `I`, `s.calls` **2** |
| 6-7 | `G.startGame(G.createInitialState())` → `piece.type` `I`, `next` `O` |
| 6-8 | 로드 → `[data-role="start"].click()` → 보드 `[data-piece]` 4개, `nextTypes()` `['O']`, `nextIdx()` `[5,6,9,10]` |

## 단계 4 — NEXT 표시 (B)

| # | 관측 |
|---|------|
| 6-9 | `nextCells().length === 16`, 로드 직후 `nextIdx().length === 0` |
| 6-10 | 7종 각각 `loadState(playing(빈, createPiece('I'), {next: t}))` → `nextIdx()` = `NEXT_IDX[t]`, `nextTypes()` = `[t]` |
| 6-11 | 7종 각각 `loadState(playing(빈, createPiece(t), {next: t}))` → `getComputedStyle(next-cell[data-piece=t]).backgroundColor === getComputedStyle(cell[data-piece=t]).backgroundColor`. **Node 대체**: 두 셀의 `data-piece` 가 같은 값 `t` |

## 단계 5 — 승격·보충 (C)

| # | 관측 |
|---|------|
| 6-12 | `s=makeSupply(['L']); r=G.lockAndAdvance(playing(빈, bottomT(), {next:'I'}), s)` → `piece.type` `I`, `next` `L`, `calls` **1** |
| 6-13 | 6-12 의 `r.piece` — `JSON(cells)===JSON(PIECE_SHAPES.I)`, `row 0`, `col 3` |
| 6-14 | `s=makeSupply(['T','I','L','O','Z']); st=G.startGame(null,s)`; k=0..2: `N=st.piece.cells.length; st=G.lockAndAdvance({...st, piece:{...st.piece, row:18-(N-3), col:[0,3,7][k]}}, s)` → 궤적 `(T,I,2)(I,L,3)(L,O,4)(O,Z,5)`, `status` 내내 `PLAYING` |
| 6-15 | 6-12 의 `s.args` → `['I']` (승격된 종류) |
| 6-16 | `G.lockAndAdvance(playing(빈, bottomT(), {next:null}))` → `piece.type` `S`, `next` `Z` |
| 6-17 | `loadState(playing(빈, bottomT(), {next:'J'}))` → `down()` → 보드 `[data-piece]` 8개(T 4 + J 4), `nextTypes()` `['L']`, `nextIdx()` `NEXT_IDX.L` |

## 단계 6 — 게임오버 (D)

| # | 관측 |
|---|------|
| 6-18 | `b=빈; [0,1,2,3].forEach(r=>fill(b,r,0,8,'O')); s=makeSupply(['O']); r=G.lockAndAdvance(playing(b, verticalI(), {next:'T'}), s)` → `status` `GAME_OVER`, `piece` `null`, `next` `'T'`, `calls` **0** |
| 6-19 | 6-18 상태를 `loadState` → `down()` → `status` `GAME_OVER`. 네 방향키 + `TetrisApp.tick()`×3 후 `nextTypes()` `['T']`, `nextIdx()` `NEXT_IDX.T` 불변 |

## 단계 7 — 재시작·리더보드·보드 (E)

| # | 관측 |
|---|------|
| 6-20 | `s=makeSupply(['S','Z']); r=G.startGame(playing(빈, createPiece('L'), {next:'O', status:'GAME_OVER'}), s)` → `(S,Z)`, `calls` 2. 브라우저: `GAME_OVER` 에서 `시작` 클릭 → `nextTypes()` 가 새 값 |
| 6-21 | 게임오버 → `saveResult('민수')` → `Object.keys(JSON.parse(localStorage.getItem(KEY))[0]).sort()` = `clearedLines,id,name,playedAt,score` |
| 6-22 | `loadState(playing(빈, createPiece('T'), {next:'I'}))` 의 보드 `data-piece` 분포 스냅샷 → `loadState(같은 상태, next:'L')` → 분포 동일, `[data-role="cell"]` 200개 |

## 반환 형식

```markdown
## 검증 결과 — SPEC_05

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-3 | 콘솔 | 사람 확인 | 종합 제외 |
| 6-12 | 승격 시 공급 1회 | FAIL | calls 2 (승격 전에 공급자를 불렀다) |

- 종합: PASS 20 / FAIL 1 / BLOCKED 0 / 사람 확인 1
- 판정: FAILED
- 실패 시그니처: `game.js:supply-called-before-promotion`
```

종합: `BLOCKED` 있으면 `BLOCKED`, `FAIL` 있으면 `FAILED`, 21개 전부 `PASS` 면 `PASSED`.
시그니처는 `<파일>:<증상>` 정규화 문자열.
