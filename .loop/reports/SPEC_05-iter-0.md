# SPEC_05 반복 0 — PASSED

- 실행 시각: 2026-08-27T17:19:16+09:00
- SPEC revision: 1
- 결과: 종합 판정 대상 21개 전부 PASS. 6-3(콘솔)은 규정대로 종합 제외, 사람 확인 대기.

## 채널

브라우저 MCP 없음. SPEC_05 §6 대로 6-3 을 뺀 21개를 Node 로 판정했다.
scratchpad 도구(`run-tests.js` · `run-dom5.js` · 회귀용 `run-dom.js`·`run-dom3.js`·`run-dom4.js`)를 프로젝트 밖에서 돌렸다.
6-11(색)은 CSS 라 Node 가 못 보므로 규정대로 `data-piece` 동일성으로 대체했다 — 실제 색은 사람이 본다.

## 구현 요약

- `game.js` — `startGame(state, supply)`·`lockAndAdvance(state, supply)` 에 선택 인자 공급자.
  생략 시 `nextPieceType`(순환). `startGame` 은 두 번 공급(첫→`piece`, 둘째→`next`).
  `lockAndAdvance` 는 `state.next` 를 승격하고 배치 가능할 때만 그 뒤에 한 번 공급한다.
  게임오버면 공급 0회, `next` 그대로. `next` 가 없는 옛 상태는 순환 보충. `withPiece` 가 `next` 를 보존.
  `createInitialState` 에 `next: null`. DOM·저장소·타이머 접근 0건 유지.
- `index.html` — `레벨` 다음에 NEXT 섹션, `next-cell` 16개 (`cell` 아님 → SPEC_00 200개 유지).
- `style.css` — 4열 grid, 보드 셀 크기·색 규칙 공유.
- `main.js` — `renderNext` 가 `floor((4-N)/2)` 오프셋으로 중앙 배치. 공급자를 넘기지 않는다.
- `test.js` — `initial-state-keys-five` 폐기, 24개 추가 → 149개.

## 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 6개 | PASS | `ls -a` |
| 6-2 | 설치·외부 URL·네트워크 0 | PASS | grep 0건 |
| 6-3 | 페이지 콘솔 error 0 | **사람 확인** | 종합 제외 |
| 6-4 | PASS ≥149 / FAIL 0 | PASS (Node) | `PASS 149 / FAIL 0`, 폐기 이름 부재 |
| 6-5 | 6키, next null | PASS (Node) | `board,lines,next,piece,score,status` |
| 6-6 | 공급자 [T,I,L] → (T,I), 2회 | PASS (Node) | 정확히 2 |
| 6-7 | 순환 시작 (I,O) | PASS (Node) | |
| 6-8 | 브라우저 시작 → NEXT O | PASS (Node DOM) | 보드 4, `next-cell` O `{5,6,9,10}` |
| 6-9 | 16칸, READY 비어 있음 | PASS (Node DOM) | |
| 6-10 | 7종 인덱스 | PASS (Node DOM) | 표와 전부 일치 |
| 6-11 | NEXT 색 = 보드 색 | PASS (Node 대체) · **색은 사람** | 7종 `data-piece` 동일 |
| 6-12 | 승격 시 공급 1회 | PASS (Node) | `(I, L)`, calls 1 |
| 6-13 | 승격 좌표 = createPiece | PASS (Node) | row 0 col 3, cells 동일 |
| 6-14 | [T,I,L,O,Z] 연속 굳힘 | PASS (Node) | `(T,I,2)(I,L,3)(L,O,4)(O,Z,5)`, 내내 PLAYING |
| 6-15 | 공급 인자 = 승격 종류 | PASS (Node) | `['I']` |
| 6-16 | next null 순환 보충 | PASS (Node) | `(S, Z)` |
| 6-17 | 브라우저 굳힘 → J 승격, NEXT L | PASS (Node DOM) | T4+J4, `NEXT_IDX.L` |
| 6-18 | 게임오버: next 유지, 공급 0 | PASS (Node) | `GAME_OVER`, piece null, next T, calls 0 |
| 6-19 | GAME_OVER 후 NEXT 불변 | PASS (Node DOM) | 4키+tick×3 후 T 유지 |
| 6-20 | 재시작 이전 next 무시 | PASS (Node DOM) | 순수: [S,Z]→(S,Z). DOM: next S → 재시작 → piece I, NEXT O |
| 6-21 | 기록 5키 | PASS (Node DOM) | `next` 없음 |
| 6-22 | next 변경이 board 무관 | PASS (Node DOM) | 200칸 분포 동일 |

종합: **PASS 21 / FAIL 0 / BLOCKED 0 / 사람 확인 1** → **PASSED** (§6 규정).
회귀: SPEC_02 15/15 · SPEC_03 28/28 · SPEC_04 16/16 · 러너 기존 125 유지.

## 검증 도구 결함 (제품 아님)

첫 DOM 실행에서 2건 FAIL 이 났으나 둘 다 **내 스텁·기대값 결함**이었다.
(1) 스텁 `querySelector` 가 `[data-role="cell"][data-piece="I"]` 복합 셀렉터를 못 파싱해 null.
(2) 6-20 DOM 기대값을 잘못 계산 — `startGame` 은 이전 `piece.type`(L) 다음(I)을 쓰므로 next 는 O 가 맞다.
이전 next 를 S 로 두어 "달라짐" 이 관측되게 고쳤다. 제품 코드는 손대지 않았고 고친 뒤 9/9.

## 실패 원인 / 시그니처 / 반복 소비

없음 / 없음 / 0.

## 사람이 브라우저에서 확인할 것

`python3 -m http.server 8000` → `http://localhost:8000`.

1. **6-3** — 로드 → `시작` → `↓` 25회 → `↓` 25회 → 5초. 페이지가 만든 error 0건 (확장 주입 제외).
2. **6-11** — NEXT 격자 블록 색이 보드의 같은 종류 블록 색과 같은지. 콘솔:
```js
const G=TetrisGame; G.PIECE_TYPES.forEach(t=>{ TetrisApp.loadState({board:G.createEmptyBoard(),piece:G.createPiece(t),next:t,score:0,lines:0,status:'PLAYING'});
  const b=getComputedStyle(document.querySelector('[data-role="cell"][data-piece="'+t+'"]')).backgroundColor;
  const n=getComputedStyle(document.querySelector('[data-role="next-cell"][data-piece="'+t+'"]')).backgroundColor;
  console.log(t, b===n?'PASS':'FAIL', b, n); });
```
3. **§8** — 시작 후 NEXT 에 다음 블록이 보이고, 굳히면 그 블록이 내려오며 NEXT 가 바뀌는지. 7종이 잘리지 않는지.

## 다음 조치

SPEC_05 완료. 커밋. 다음 SPEC: 일시정지(`PAUSED`) — SPEC_05 §10.
