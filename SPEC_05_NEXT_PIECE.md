---
id: SPEC_05
title: 다음 블록
revision: 1
depends_on: [SPEC_00, SPEC_01, SPEC_02, SPEC_03, SPEC_04]
max_iterations: 3
---

# SPEC 05 — 다음 블록

## 1. 목표

현재 블록과 별개로 **다음 차례 블록 하나**를 확정해 두고 NEXT 패널에 모양과 색을 보여준다.
현재 블록이 굳으면 미리 본 그 블록이 재선택 없이 실제 현재 블록이 되고, 그 뒤에만 새 NEXT 하나를
정한다. NEXT 는 화면용 예측이 아니라 다음에 쓸 **확정된 상태**다.

일시정지·홀드·NEXT 2개 이상은 이번 단계에 없다 (§5).

## 2. 기술과 파일 구조

`SPEC_00 §2` 와 같다. 산출물은 여섯 개 그대로이고 파일을 늘리지 않는다.

이번 SPEC 이 **앞 SPEC 을 덮어쓰는 지점**은 넷이다.

| 앞 조항 | 이번 SPEC 에서 |
|---------|----------------|
| SPEC_01 §4.5 `startGame` — `piece: createPiece(nextPieceType(prevType))` | **교체.** 두 번 공급한다 — 첫 결과가 `piece`, 둘째가 `next` (§4.4) |
| SPEC_02 §4.4 `lockAndAdvance` 5단계 — `next = createPiece(nextPieceType(state.piece.type))` | **교체.** `state.next` 를 승격하고, 배치 가능하면 그때 새 `next` 하나를 공급한다 (§4.5) |
| SPEC_01 §4.6 / SPEC_02·03·04 §4.1 — `state` 는 다섯 키 | **확장.** `next` 가 여섯 번째 키다 (§4.1) |
| SPEC_02 §7.3 `initial-state-keys-five` | **폐기.** 대체 이름은 `initial-state-keys-six` (§7.2) |

`nextPieceType` 의 계약과 순환 순서 `I→O→T→S→Z→J→L` 은 바뀌지 않는다. 실제 게임의 블록 공급은
여전히 이 순환이다. **난수를 도입하지 않는다.** 요구사항이 "블록 추첨" 이라 부르는 것은 이 프로젝트에서
"공급자 호출" 이고, 기본 공급자가 `nextPieceType` 이다 (§4.3·§11).

`SPEC_02 §7.3` 의 `start-game-cycles-type` · `lock-and-advance-spawns-next-type` 은 공급자를 넘기지 않는
호출이라 순환 결과가 그대로 나온다. **유지한다.**

## 3. 화면 정의

### 3.1 NEXT 패널

`index.html` 의 상태 패널(`<aside class="panel">`) 안, `레벨` 줄 **바로 다음**, 게임오버 영역 **앞**에 둔다.

```html
<section class="next" data-role="next">
  <h2>NEXT</h2>
  <div class="next-grid" data-role="next-grid">
    <div class="cell" data-role="next-cell"></div>
    <!-- … 총 16개 -->
  </div>
</section>
```

- `[data-role="next-cell"]` 은 **정확히 16개**(4×4)이며 행 우선 순서다 — 인덱스 `i` 가 행 `floor(i/4)`, 열 `i%4`.
- `next` 가 `null` 이면 16개 전부 `data-piece` 가 없다.
- `next` 가 종류 문자면 그 종류의 `PIECE_SHAPES` 행렬을 격자에 **중앙 배치**해 채워진 칸에
  `data-piece="<종류>"` 를 붙인다. 오프셋은 `floor((4 - N) / 2)`, `N` 은 행렬 변 길이.
  격자 인덱스는 `(i + off) * 4 + (j + off)` 다.
- 색은 보드와 같은 `[data-piece="…"]` CSS 규칙을 쓴다. NEXT 전용 색 규칙을 만들지 않는다.
- 셀 크기는 보드 셀과 같은 `--cell-size` 를 쓴다.

| 종류 | `N` | `off` | 채워진 인덱스 |
|------|----:|------:|---------------|
| `I` | 4 | 0 | `4,5,6,7` |
| `O` | 2 | 1 | `5,6,9,10` |
| `T` | 3 | 0 | `1,4,5,6` |
| `S` | 3 | 0 | `1,2,4,5` |
| `Z` | 3 | 0 | `0,1,5,6` |
| `J` | 3 | 0 | `0,4,5,6` |
| `L` | 3 | 0 | `2,4,5,6` |

일곱 종류 모두 채워진 칸이 격자 안에 들어간다 — 잘리지 않는다.

### 3.2 화면 문구

```text
NEXT
```

### 3.3 NEXT 는 보드가 아니다

NEXT 격자 셀은 `[data-role="cell"]` 이 아니라 `[data-role="next-cell"]` 이다.
그래서 `SPEC_00` 6-7 의 "`[data-role="cell"]` 200개" 는 그대로 참이다.
NEXT 표시는 충돌·낙하·이동·회전·줄 제거 어디에도 관여하지 않는다 — `state.board` 도 `state.piece` 도 건드리지 않는다.

## 4. 상태와 공개 함수

### 4.1 상태

`state` 는 **여섯 키** `board`·`piece`·`next`·`score`·`lines`·`status` 를 갖는다.

| 키 | 값 |
|----|-----|
| `next` | 다음 블록의 **종류 한 글자**(`'I'`…`'L'`) 또는 `null` |

`next` 에 piece 객체를 넣지 않는다. 모양은 `PIECE_SHAPES[next]`, 색은 CSS 가 종류에서 결정하므로
종류 하나로 셋이 전부 정해진다 — "모양·색 일치" 가 구조적으로 보장된다 (§11).
실제 보드 좌표는 승격 시점에 `createPiece(next)` 가 기존 생성 규칙으로 정한다.

`createInitialState()` 는 `next: null` 을 갖는다. `READY` 와 `GAME_OVER` 에서 `next` 는 `null` 이거나
마지막 값 그대로다 (§4.5·§4.6).

### 4.2 `PIECE_TYPES`·`PIECE_SHAPES`·색

`SPEC_01 §4.2·§4.3·§3.1` 그대로다. NEXT 용 별도 정의를 만들지 않는다.

### 4.3 블록 공급자

**공급자**는 `(prevType) => type` 꼴의 함수다. 이전 종류(또는 `null`)를 받아 다음 종류 문자를 돌려준다.

- 기본 공급자는 **`nextPieceType`** 이다 — `SPEC_01` 의 결정적 순환.
- `startGame` 과 `lockAndAdvance` 는 **선택 인자**로 공급자를 받는다. 생략하면 기본 공급자를 쓴다.
- `main.js` 는 공급자를 넘기지 않는다. 실제 게임은 언제나 순환이다.
- 테스트는 배열에서 꺼내며 호출 횟수를 세는 공급자를 넘겨 순서와 횟수를 관측한다.

이 인자는 테스트용 심이 아니다. 순수 함수가 의존성을 인자로 받는 것이고, 실게임 동작을 바꾸지 않는다 (§11).

### 4.4 `startGame(state, supply)`

`supply` 를 생략하면 `nextPieceType`. 반환 상태는 이렇다.

| 키 | 값 |
|----|-----|
| `board` | `createEmptyBoard()` |
| `piece` | `createPiece(first)` — `first = supply(prev)`, `prev` 는 `state && state.piece ? state.piece.type : null` |
| `next` | `supply(first)` |
| `score` | `0` |
| `lines` | `0` |
| `status` | `'PLAYING'` |

공급자는 **정확히 두 번** 호출된다 — 첫 호출이 현재 블록, 둘째가 NEXT. 셋째를 부르지 않는다.
이전 게임의 `state.next` 는 **쓰지 않는다** — 새 게임은 순서를 처음부터 준비한다 (요구사항 §15).

기본 공급자(순환)에서의 결과: 초기 상태에서 시작하면 `piece.type` `I`, `next` `O`.
`piece.type` 이 `T` 인 상태에서 재시작하면 `S`, `next` `Z`.

### 4.5 `lockAndAdvance(state, supply)`

`SPEC_02 §4.4` 의 1~4단계(고정 → 완성 줄 탐색 → 동시 제거 → 압축, 줄 수·점수 갱신)는 그대로다.
5~6단계가 이렇게 바뀐다.

5. `promotedType = state.next !== null ? state.next : supply(state.piece.type)`
   — **NEXT 가 있으면 그것을 쓴다. 공급자를 부르지 않는다.**
   `next` 가 `null` 인 상태(앞 SPEC 이 만든 상태)에서만 한 번 공급해 보충한다.
6. `promoted = createPiece(promotedType)` · `placeable = canPlace(cleared, promoted)`
7. 배치 가능하면 `newNext = supply(promotedType)` — **여기서만** 공급자를 한 번 부른다.
   배치 불가면 공급자를 부르지 않는다.

반환 상태는 이렇다.

| 키 | 배치 가능 | 배치 불가 |
|----|-----------|-----------|
| `board` | `cleared` | `cleared` |
| `piece` | `promoted` | `null` |
| `next` | `newNext` | **`state.next` 그대로** |
| `score` · `lines` | SPEC_02·04 규칙 | 같음 |
| `status` | `'PLAYING'` | `'GAME_OVER'` |

정상 고정 한 번에 공급자 호출은 **정확히 한 번**(`next` 가 `null` 이었으면 두 번)이다.
게임오버로 끝나면 **0번**(`null` 보충 시 한 번). 게임오버를 피하려고 다른 종류를 공급받거나 위치를
보정하거나 NEXT 를 건너뛰지 않는다 — `SPEC_02 §4.4` 의 충돌 규칙 그대로다.

`state.status !== 'PLAYING'` 이거나 `state.piece` 가 `null` 이면 인자 `state` 를 그대로 반환한다 (변경 없음).

### 4.6 `GAME_OVER` 이후

`applyMove`·`applyRotate`·`lockAndAdvance` 는 `PLAYING` 이 아니면 인자를 그대로 돌려주므로
예약된 tick 이나 키 입력이 `next` 를 바꿀 수 없다. `next` 는 게임오버 순간의 값에 머문다.

### 4.7 `main.js`

- `render` 가 `state.next` 로 NEXT 격자 16칸을 다시 그린다 (§3.1 규칙).
- `startGame`·`lockAndAdvance` 호출에 공급자를 넘기지 않는다.
- `loadState` 는 받은 상태의 `next` 를 그대로 쓴다.
- `saveResult` 가 만드는 기록은 `SPEC_03 §4.5` 의 다섯 키 그대로다. `next` 를 넣지 않는다.

## 5. 범위 밖

- NEXT 2개 이상, NEXT 큐
- 7-bag 등 무작위 알고리즘 도입 (공급은 결정적 순환 유지)
- 홀드, NEXT 교체·건너뛰기, 사용자가 NEXT 를 고르는 기능
- 고스트 피스
- 일시정지, `PAUSED` 상태 사용
- 새로운 점수·레벨 규칙
- 애니메이션, 온라인, 서버

## 6. 완료 조건

| 조건 | 판정 경로 |
|------|-----------|
| 6-1 · 6-2 | 파일시스템 |
| 6-3 | 브라우저 콘솔 — **사람**, 종합 판정 제외 |
| 6-4 | §7 러너 |
| 6-5 ~ 6-22 | 공개 함수 호출(공급자 인자) · `loadState` · 합성 이벤트 · DOM — **Node 로 판정 가능** |
| §8 두 항목 | 사람 눈 |

### 6.0 준비물

```js
const G = TetrisGame;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
const nextCells = () => [...document.querySelectorAll('[data-role="next-cell"]')];
// 배열에서 꺼내며 횟수를 세는 공급자
const makeSupply = (queue) => { const s = (prev) => { s.calls += 1; return queue.shift(); }; s.calls = 0; return s; };
// 바닥에 놓인 T — ↓ 한 번으로 굳는다. (18행에 두면 아래가 막힌다)
const bottomT = () => ({ type: 'T', cells: G.createPiece('T').cells, row: 18, col: 3 });
// 종류별 NEXT 격자 기대 인덱스 (§3.1 표)
const NEXT_IDX = { I:[4,5,6,7], O:[5,6,9,10], T:[1,4,5,6], S:[1,2,4,5], Z:[0,1,5,6], J:[0,4,5,6], L:[2,4,5,6] };
```

### 위생

- [ ] **6-1** 산출물이 여섯 개와 정확히 일치한다 (하네스 파일 `CLAUDE.md`·`MEMORY.md`·`SPEC_*.md`·`docs/`·`.claude/`·`.loop/`·`.git/`·`.gitignore` 제외).
- [ ] **6-2** 설치 산출물·외부 URL·`fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 이 0건이다.
- [ ] **6-3** 로드 후 5초, 그리고 `시작` 클릭 → `ArrowDown` 25회(첫 블록 굳음) → `ArrowDown` 25회(둘째 굳음)
      뒤 5초까지 **페이지가 만든** 콘솔 error 0건 (확장 주입 제외, `SPEC_01 §6` 6-3 기준).
- [ ] **6-4** `test.html` 이 `FAIL 0`, `PASS` **149 이상**, §7.3 의 24개와 유지 125개가 전부 있고 `initial-state-keys-five` 는 **없다**.

### 그룹 A — 상태와 시작 (6-5 ~ 6-8)

- [ ] **6-5** `createInitialState()` 의 키가 정확히 `board`·`piece`·`next`·`score`·`lines`·`status` 여섯 개이고 `next` 가 `null` 이다.
- [ ] **6-6** **Given** 공급자 `[T,I,L]` **When** `startGame(null, supply)` **Then** `piece.type` `T`, `next` `I`, `supply.calls` **정확히 2**.
- [ ] **6-7** 기본 공급자(순환)로 `startGame(createInitialState())` 하면 `piece.type` `I`, `next` `O`.
- [ ] **6-8** 브라우저에서 `시작` 클릭 후 `[data-piece]` 보드 셀 4개(현재 블록 `I`)와
      `[data-role="next-cell"][data-piece="O"]` 4개 — 인덱스 집합 `{5,6,9,10}`.

### 그룹 B — NEXT 표시 (6-9 ~ 6-11)

- [ ] **6-9** `[data-role="next-cell"]` 이 정확히 16개이고 로드 직후(`READY`)에는 `data-piece` 가 있는 셀이 0개다.
- [ ] **6-10** 일곱 종류 각각에 대해 `loadState({... next: t})` 후 `data-piece` 가 있는 `next-cell` 인덱스 집합이 `NEXT_IDX[t]` 와 같고 값이 전부 `t` 다.
- [ ] **6-11** 일곱 종류 각각에서 `next-cell[data-piece=t]` 의 `getComputedStyle().backgroundColor` 가
      같은 종류의 보드 셀 `[data-role="cell"][data-piece=t]` 색과 **같다** (`loadState` 로 둘을 동시에 놓고 비교).
      — 이 항목은 CSS 가 필요하므로 **브라우저 관측**이다. Node 채널에서는 두 셀이 같은 `data-piece` 값을 갖는지로 대체한다.

### 그룹 C — 승격과 보충 (6-12 ~ 6-17)

- [ ] **6-12** **Given** `{board: 빈, piece: bottomT(), next: 'I', …PLAYING}`, 공급자 `[L]`
      **When** `lockAndAdvance(state, supply)` **Then** `piece.type` `I`, `next` `L`, `supply.calls` **정확히 1**.
- [ ] **6-13** 6-12 의 결과에서 `piece.cells` 가 `PIECE_SHAPES.I` 와 값이 같고, `piece.row` `0`, `piece.col` `3`
      (승격 블록의 좌표는 기존 생성 규칙 — `createPiece('I')` 와 동일).
- [ ] **6-14** **Given** 공급자 `[T,I,L,O,Z]` **When** `s = startGame(null, supply)` 뒤 `k = 0,1,2` 로 세 번 반복:
      `N = s.piece.cells.length; s = lockAndAdvance({...s, piece: {...s.piece, row: 18 - (N - 3), col: [0, 3, 7][k]}}, supply)`
      — 현재 블록의 `cells` 는 그대로 두고 바닥 직전 행과 **서로 다른 열 구간**(`0`·`3`·`7`)에 놓아 굳힌다.
      열을 가르는 이유: 같은 열에 쌓으면 둘째 블록이 첫 블록 위에 놓여 `canPlace` 가 거부된다.
      세 블록(T 4칸·I 4칸·L 4칸 = 12칸)이 18·19행에 흩어져 어느 행도 완성되지 않고 생성 위치(0~1행)를 막지 않는다.
      **Then** `(piece.type, next)` 가 차례로 `(T,I)`·`(I,L)`·`(L,O)`·`(O,Z)`, `supply.calls` 가 `2·3·4·5`, `status` 내내 `PLAYING`.
      (`I` 는 행렬 변 4 → `row` 17, 채워진 줄이 18행. `T`·`L` 은 `row` 18.)
- [ ] **6-15** 공급자가 **승격 뒤에** 호출된다 — `supply` 가 받은 `prevType` 인자가 6-12 에서 `'I'`(승격된 종류)다.
- [ ] **6-16** `next` 가 `null` 인 상태(앞 SPEC 형식)를 굳히면 순환으로 보충된다 —
      `{piece: bottomT(), next: null}` → `lockAndAdvance` → `piece.type` `S`(T 의 다음), `next` `Z`.
- [ ] **6-17** 브라우저: `loadState({board: 빈, piece: bottomT(), next: 'J', …})` → `ArrowDown` →
      보드 `[data-piece]` 가 고정 T 4개 + 현재 J 4개, `next-cell` 인덱스가 `NEXT_IDX.L` (`J` 의 순환 다음).

### 그룹 D — 게임오버 (6-18 ~ 6-19)

- [ ] **6-18** **Given** 0~3행 열 0~8 고정 + `piece: 세로 I(16~19행, 열 9)` + `next: 'T'`, 공급자 `[O]`
      **When** `lockAndAdvance(state, supply)` **Then** `status` `GAME_OVER`, `piece` `null`, `next` **`'T'` 그대로**, `supply.calls` **0**.
- [ ] **6-19** 브라우저: 6-18 상태를 `loadState` 로 넣고 `ArrowDown` → `GAME_OVER`. 그 뒤 네 방향키 + `tick()` 3회 후
      `next-cell` 의 `data-piece` 집합이 그대로(`T`, `NEXT_IDX.T`).

### 그룹 E — 재시작·리더보드·보드 무관 (6-20 ~ 6-22)

- [ ] **6-20** **Given** `{piece: L, next: 'O', status: GAME_OVER}` 에 공급자 `[S,Z]`
      **When** `startGame(state, supply)` **Then** `piece.type` `S`, `next` `Z`, `calls` `2` — 이전 `O` 가 쓰이지 않았다.
      브라우저: `GAME_OVER` 에서 `시작` 클릭 → `next-cell` 이 새 게임의 NEXT 로 바뀜.
- [ ] **6-21** 게임오버 후 `saveResult('민수')` 성공 → `localStorage` 기록의 키가 정확히
      `id`·`name`·`score`·`clearedLines`·`playedAt` 다섯 개 (`next` 없음).
- [ ] **6-22** `loadState({... next: 'I'})` 뒤 `loadState({... next: 'L'})` 로 `next` 만 바꿔도
      `state.board` 200칸과 `[data-role="cell"]` 200개의 `data-piece` 분포가 변하지 않는다.

## 7. 자동 검증

### 7.1 러너 출력 형식

`SPEC_00 §7.1` 과 같다.

### 7.2 유지·폐기

기존 126개 중 **125개 유지**, 1개 폐기.

| 폐기 | 이유 | 대체 |
|------|------|------|
| `initial-state-keys-five` | `next` 가 여섯 번째 키 | `initial-state-keys-six` |

`start-game-from-ready-type-i`(순환 기본 공급자에서 `I`) · `start-game-cycles-type`(T 다음 S) ·
`lock-and-advance-spawns-next-type`(`next: null` 상태에서 순환 보충 → S) 은 그대로 참이다.

### 7.3 이번 SPEC 의 필수 테스트 (24개)

| `data-name` | 확인 내용 |
|-------------|-----------|
| `initial-state-keys-six` | 키가 `board`·`piece`·`next`·`score`·`lines`·`status` 여섯 개 |
| `initial-state-next-null` | `createInitialState().next === null` |
| `start-game-sets-next` | 기본 공급자 시작 → `piece.type` `I`, `next` `O` |
| `start-game-supply-two-calls` | 공급자 `[T,I,L]` → `(T,I)`, `calls` 2 |
| `start-game-supply-order` | 첫 호출 결과가 `piece`, 둘째가 `next` (`[T,I]` → T 가 piece) |
| `start-game-ignores-previous-next` | `{piece:L, next:'O'}` + 공급자 `[S,Z]` → `(S,Z)`, `O` 미사용 |
| `start-game-supply-prev-arg` | 첫 호출 인자가 이전 `piece.type`(없으면 `null`), 둘째 호출 인자가 첫 결과 |
| `lock-promotes-next` | `{piece: bottomT, next:'I'}` + `[L]` → `piece.type` `I` |
| `lock-promoted-uses-spawn-rule` | 승격 블록의 `cells`·`row`·`col` 이 `createPiece(next)` 와 같다 |
| `lock-supplies-new-next-once` | 위 상황에서 `next` `L`, `calls` 1 |
| `lock-supply-after-promotion` | 공급자가 받은 인자가 승격된 종류 |
| `lock-sequence-tilo` | `[T,I,L,O,Z]` 로 시작 후 3회 굳힘(6-14 절차) → `(T,I)(I,L)(L,O)(O,Z)`, `calls` 2·3·4·5 |
| `lock-null-next-falls-back-to-cycle` | `next: null` 굳힘 → 순환 보충 (`T` → `S`, `next` `Z`) |
| `lock-game-over-keeps-next` | 생성 막힘 → `GAME_OVER`, `next` 그대로 |
| `lock-game-over-no-supply` | 위 상황에서 `calls` 0 |
| `lock-game-over-piece-null` | 위 상황에서 `piece` `null` |
| `lock-ignored-when-not-playing-keeps-next` | `GAME_OVER` 상태에 `lockAndAdvance` → 인자 그대로(`===`) |
| `apply-move-keeps-next` | `applyMove` 좌·우·아래 결과의 `next` 가 입력과 같다 |
| `apply-rotate-keeps-next` | `applyRotate` 결과의 `next` 가 입력과 같다 |
| `next-does-not-touch-board` | `next` 만 다른 두 상태의 `board` 가 값이 같다 (`canPlace` 결과도 같다) |
| `next-type-is-single-char` | 정상 상태의 `next` 가 `PIECE_TYPES` 원소 하나 |
| `next-grid-index-table` | 일곱 종류의 중앙 배치 인덱스가 §3.1 표와 같다 (`floor((4-N)/2)` 계산으로) |
| `default-supply-is-cycle` | 공급자 생략 시 결과가 `nextPieceType` 과 같다 (`startGame`·`lockAndAdvance` 둘 다) |
| `record-has-no-next` | `sanitizeRecords` 가 `next` 필드를 요구하지도 보존하지도 않는다 — 다섯 키만 검사 |

필수 합계: 유지 125 + 신규 24 = **149**.

## 8. 수동 검증

1. 게임을 시작하면 NEXT 패널에 다음 블록이 보드와 같은 색으로 보이고, 현재 블록이 굳으면
   그 블록이 실제로 위에서 내려오며 NEXT 가 다음 것으로 바뀌는지 본다.
2. 일곱 종류가 차례로 지나가는 동안 NEXT 격자에서 잘리는 블록이 없는지 본다.

## 9. 안전과 정지 조건

- 프로젝트 폴더 밖 파일 생성·수정·삭제 금지. OS·브라우저 전역 설정 변경 금지. 외부 라이브러리 금지.
- NEXT 를 승격할 때 공급자를 다시 부르지 않는다. 미리보기와 실제 생성은 같은 종류다.
- NEXT 색을 승격 시 다시 정하지 않는다 — 색은 종류에서만 나온다.
- 굳기 전에 NEXT 를 바꾸지 않는다. NEXT 를 둘 이상 저장하지 않는다.
- 충돌·줄 제거·게임오버 규칙을 바꾸지 않는다. 게임오버를 피하려고 NEXT 를 교체하지 않는다.
- `GAME_OVER` 뒤 공급자를 부르지 않는다.
- 테스트 통과만을 위한 종류 하드코딩·별도 게임 로직 금지.
- **반복 3회**(`max_iterations`). 한 iteration = 구현·수정 → 전체 검증 → 판정. 실패한 것만 다시 돌리고 끝내지 않는다.
  3회 후 실패가 남으면 테스트 삭제·기대값 변경·요구 완화·우회 없이, 전체·통과·실패 수, 실패 항목,
  기대·실제, 원인, 마지막 수정을 리포트에 적고 `HALTED`.
- 문서에 없는 결정이 필요하면 `[사람 확인 필요]` 로 보고한다.

## 10. 다음 단계로 넘기는 것

| 항목 | 이유 |
|------|------|
| 일시정지 (`PAUSED`) | 타이머 정지·재개·예약 tick 처리가 독립 SPEC 이다 |
| 무작위 공급자 | 공급자 인자가 이미 있으므로 `Math.random` 기반 공급자를 `main.js` 에서 넘기면 된다. 도입 여부는 별도 결정 |
| 홀드 · NEXT 큐 | 이번 목적은 NEXT 하나다 |
| 고스트 피스 | 표시 계층이 다르다 |

## 11. 해석 고정 근거 (revision 1)

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| "추첨" 과 난수 | 공급자 호출로 읽고, 기본 공급자는 순환 | 프로젝트에 난수가 없다(SPEC_01 결정). 요구사항의 결정성 요구는 순환이 이미 만족한다 |
| 공급자를 어디에 두나 | `startGame`·`lockAndAdvance` 의 **선택 인자** | 전역 교체는 `game.js` 에 상태가 생겨 순수 함수 계약이 깨진다. 인자면 테스트 간 오염이 없고 실게임(`main.js`)은 생략해 순환 그대로 |
| `next` 의 형태 | 종류 한 글자 | 모양은 `PIECE_SHAPES[next]`, 색은 CSS 가 종류에서 정한다. 종류 하나면 셋이 구조적으로 일치 — "모양·색 재선택" 자체가 불가능 |
| 승격 블록 좌표 | 승격 시점에 `createPiece(next)` | 요구사항 §12. NEXT 는 종류 예약이고 좌표는 생성 규칙 |
| 공급 순서 | 승격 **뒤** `supply(promotedType)` | 요구사항 §9. 인자로 승격된 종류를 넘겨 순환이 이어진다 |
| 게임오버 시 `next` | 그대로 둔다, 공급 0회 | 요구사항 §14. `null` 로 지우면 6-19 의 "변경 없음" 관측이 흐려진다 |
| `next: null` 보충 | 순환으로 한 번 공급 | 앞 SPEC 의 테스트가 만든 5키 상태를 깨지 않는다. `lock-and-advance-spawns-next-type` 유지 |
| 재시작 | 이전 `next` 무시, 두 번 공급 | 요구사항 §15 |
| 격자 크기·배치 | 4×4, `floor((4-N)/2)` 오프셋 | `I` 가 4 라 4×4 가 최소. 표로 인덱스를 고정해 6-10 이 숫자로 판정된다 |
| 격자 셀 role | `next-cell` (`cell` 아님) | SPEC_00 6-7 "`cell` 200개" 를 지킨다 |
| 6-11 색 비교 | 브라우저에서 `getComputedStyle`, Node 에선 `data-piece` 동일성으로 대체 | 색은 CSS 라 Node 스텁이 못 본다. 대신 같은 속성 값이면 같은 규칙이 적용된다는 것이 구조적으로 참 |
| 6-3 | 사람 몫, 종합 제외 | SPEC_04 와 같은 규정 — 나머지가 결정적이라 루프가 스스로 돈다 |
| 필수 테스트 | 24 신설, 1 폐기 | 5키 테스트만 6키로 교체. 순환 전제 테스트는 공급자 생략 호출이라 그대로 참 |
