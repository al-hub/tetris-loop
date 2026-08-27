---
id: SPEC_02
title: 충돌·고정·줄 제거·게임오버 규칙
revision: 1
depends_on: [SPEC_00, SPEC_01]
max_iterations: 3
---

# SPEC 02 — 충돌·고정·줄 제거·게임오버 규칙

## 1. 목표

SPEC_01 에서 블록은 바닥에 닿으면 `LANDED` 로 게임을 멈췄다. 이번 단계는 그것을 실제 진행 규칙으로
바꾼다. 더 내려갈 수 없는 블록은 고정 보드에 굳고, 완성된 줄이 한 번에 제거되고, 남은 행이 아래로
압축되고, 제거한 줄 수가 누적되고, 다음 블록이 나온다. 새 블록을 생성 위치에 놓을 수 없을 때만
`GAME_OVER` 로 간다.

점수·레벨·하드 드롭·일시정지는 이번 단계에 없다 (§5).

## 2. 기술과 파일 구조

`SPEC_00 §2` 와 같다. 산출물은 여섯 개 그대로이고 파일을 늘리지 않는다.

이번 SPEC 이 **앞 SPEC 을 덮어쓰는 지점**은 넷이다.

| 앞 SPEC 조항 | 이번 SPEC 에서 |
|--------------|----------------|
| SPEC_01 §4.5 `applyMove` 규칙 3 — 아래가 막히면 `{...state, status:'LANDED'}` | **폐기.** 아래가 막히면 `lockAndAdvance(state)` 를 정확히 한 번 호출한 결과를 반환한다 (§4.4) |
| SPEC_01 §5 "굳은 블록 쌓기 없음 — `board` 는 계속 전부 `0`" | **폐기.** 이번 SPEC 의 본체가 굳히기다 |
| SPEC_01 완료 조건 6-15·6-16·6-22 (`LANDED` 지속 상태 전제) | **폐기.** `LANDED` 는 지속 상태로 나타나지 않는다 (§4.6) |
| SPEC_01 §7.3 필수 테스트 4개 | **교체.** 목록과 대체 이름은 §7.2 에 있다 |

`GAME_STATUS` 는 `SPEC_00 §4.2` 의 동결된 5키 그대로 둔다. `LANDED` 키는 정의만 남고
`state.status` 값으로는 쓰지 않는다. `BOARD_WIDTH`·`BOARD_HEIGHT`·`createEmptyBoard()`·
`PIECE_TYPES`·`PIECE_SHAPES`·`DROP_INTERVAL_MS`·`nextPieceType`·`createPiece`·`rotateCells`·
`canPlace`·`applyRotate`·`startGame` 의 계약은 바뀌지 않는다.
조작 안내(`SPEC_00 §3.5`) 문자열도 한 글자도 바꾸지 않는다.

## 3. 화면 정의

### 3.1 고정 셀과 현재 블록

`board` 의 셀 값은 **빈칸이면 숫자 `0`, 고정 셀이면 블록 종류 한 글자**(`'I'`…`'L'`)다.

렌더는 고정 보드와 현재 블록을 **합쳐서** 그린다. 둘 다 `data-piece="<종류 한 글자>"` 를 쓰고
색은 `SPEC_01 §3.1` 의 일곱 규칙을 그대로 쓴다. **화면에서 고정 셀과 낙하 중인 셀은 구분하지
않는다** — 구분은 내부 상태(`state.board` 대 `state.piece`)에만 있다 (§11).

```html
<div class="cell" data-role="cell" data-piece="I"></div>   <!-- 고정이든 낙하 중이든 같다 -->
<div class="cell" data-role="cell"></div>                  <!-- 빈 셀 -->
```

### 3.2 상태 패널

`[data-role="status"]` 는 `state.status` 를 그대로 쓴다 — `READY` · `PLAYING` · `GAME_OVER`.
**`LANDED` 는 표시되지 않는다.**

`[data-role="lines"]` 는 `state.lines` 를 그대로 쓴다. 줄이 제거되면 이 값이 오른다.
`[data-role="score"]` 는 이번 단계 내내 `0` 이다.

### 3.3 버튼

`[data-role="start"]` 텍스트는 **네 상태(`READY`·`PLAYING`·`GAME_OVER`, 그리고 재시작 직후)
모두 `시작`** 이다. `disabled` 를 쓰지 않는다.

| 클릭 시점 상태 | 동작 |
|----------------|------|
| `READY` | 게임 시작 |
| `GAME_OVER` | 재시작 (§4.7) |
| `PLAYING` | **무시.** 화면이 전혀 바뀌지 않는다 |

## 4. 상태와 공개 함수

### 4.1 좌표와 자료구조

`SPEC_01 §4.1` 과 같다. `state` 는 다섯 키 `board`·`piece`·`score`·`lines`·`status` 를 갖는다.
`board` 는 20행 × 10열이고 셀 값은 `0` 또는 종류 문자다.

### 4.2 새 순수 함수

`game.js` 는 DOM 에 접근하지 않는다. `globalThis.TetrisGame` 에 아래를 추가한다.

| 이름 | 인자 | 반환 |
|------|------|------|
| `lockPiece(board, piece)` | 보드, piece | 채워진 칸에 `piece.type` 을 적은 **새 보드** |
| `findFullRows(board)` | 보드 | 완성된 행 번호 배열, **오름차순** |
| `clearRows(board, rows)` | 보드, 행 번호 배열 | 그 행들을 제거하고 압축한 **새 보드** |
| `lockAndAdvance(state)` | 상태 | 고정 처리 전체를 한 번 수행한 **새 상태** (§4.4) |

**`lockPiece(board, piece)`**

- 원본 `board` 와 그 행 배열을 변형하지 않는다. 최상위·행 모두 새 배열이다.
- `piece` 의 채워진 칸에 해당하는 좌표에 `piece.type` 문자열을 쓴다.
- 이미 값이 있던 다른 고정 셀은 그대로 둔다.

**`findFullRows(board)`**

- 한 행의 **열 10개가 전부 `0` 이 아니면** 그 행을 완성으로 본다.
- 결과는 행 번호 오름차순 배열이다. 완성 행이 없으면 빈 배열이다.
- 현재 블록은 보지 않는다. 이 함수는 보드만 본다.

**`clearRows(board, rows)`**

- `rows` 가 빈 배열이면 값이 같은 **새 보드**를 반환한다 (같은 참조가 아니다).
- `rows` 의 행을 모두 제거한 뒤, 남은 행의 **순서를 유지한 채** 아래쪽으로 붙인다.
- 행 내부의 셀 순서를 바꾸지 않는다.
- 위쪽에 생긴 빈 자리는 전부 `0` 인 새 행으로 채운다.
- 결과는 항상 20행 × 10열이다.
- 원본 `board` 를 변형하지 않는다.

### 4.3 충돌 판정

`canPlace(board, piece)` 의 계약은 `SPEC_01 §4.5` 그대로다. 세 조건 중 `board[row][col] === 0`
가 **고정 블록 충돌 판정**에 해당한다. 보드 셀이 이제 `0` 이 아닌 값을 가질 수 있으므로
같은 함수가 경계와 충돌을 함께 본다.

`applyMove` 의 좌·우 이동과 `applyRotate` 는 이 판정으로 거부되며, 거부되면
**인자 `state` 를 그대로(동일 참조) 반환한다** (`SPEC_01 §4.5` 유지).

### 4.4 `lockAndAdvance(state)`

아래 순서를 **정확히 이 순서로, 한 번** 수행한 새 상태를 반환한다.

1. `locked = lockPiece(state.board, state.piece)`
2. `full = findFullRows(locked)`
3. `cleared = clearRows(locked, full)`
4. `lines = state.lines + full.length`
5. `next = createPiece(nextPieceType(state.piece.type))`
6. `canPlace(cleared, next)` 로 배치 가능 여부를 본다.

반환 상태는 이렇다.

| 키 | 배치 가능할 때 | 배치 불가일 때 |
|----|----------------|----------------|
| `board` | `cleared` | `cleared` |
| `piece` | `next` | **`null`** |
| `score` | `state.score` (바뀌지 않는다) | `state.score` |
| `lines` | 4단계의 `lines` | 4단계의 `lines` |
| `status` | `'PLAYING'` | `'GAME_OVER'` |

- 줄 제거를 한 줄씩 반복하지 않는다. 2단계에서 완성 행을 **전부** 찾은 뒤 3단계에서 한 번에 지운다.
- 다음 블록을 먼저 만들고 줄을 지우지 않는다. 순서를 바꾸지 않는다.
- 배치 불가일 때 새 블록의 위치를 좌·우·위·아래로 보정하지 않는다.
- `state.status !== 'PLAYING'` 이거나 `state.piece` 가 `null` 이면 **인자 `state` 를 그대로 반환**한다.

### 4.5 `applyMove` 의 아래 이동

`SPEC_01 §4.5` 의 규칙 3을 이것으로 대체한다.

1. `state.status !== 'PLAYING'` 이거나 `state.piece` 가 `null` 이면 인자 `state` 를 그대로 반환한다.
2. 이동한 piece 가 `canPlace` 를 만족하면 `{...state, piece: 이동한 piece}` 를 반환한다.
3. 만족하지 않고 `dRow > 0` 이면 **`lockAndAdvance(state)` 를 정확히 한 번** 호출해 그 결과를 반환한다.
4. 만족하지 않고 `dRow <= 0` 이면 인자 `state` 를 그대로 반환한다.

`↓` 입력과 자동 낙하 tick 은 둘 다 이 경로를 탄다. 그래서 두 경로가 갈리지 않는다.

### 4.6 `LANDED` 는 지속 상태가 아니다

`state.status` 가 `'LANDED'` 인 상태를 만들지 않는다. 고정 처리는 `lockAndAdvance` 안에서
한 번에 끝나므로 중간 상태를 밖으로 내보낼 자리가 없다.
`GAME_STATUS.LANDED` 키는 `SPEC_00 §4.2` 의 동결 객체를 깨지 않기 위해 정의만 남는다.

### 4.7 `startGame(state)`

`SPEC_01 §4.5` 그대로다. 이번 SPEC 에서 중요한 것은 결과가 다음을 만족한다는 점이다.

- `board` 는 `createEmptyBoard()` 결과 — 고정 셀이 하나도 없다.
- `lines` 는 `0`, `score` 는 `0`.
- `piece` 는 순환의 다음 종류 하나. `status` 는 `'PLAYING'`.

### 4.8 `main.js` — 렌더링과 브라우저 연결

`globalThis.TetrisApp` 에 아래를 공개한다. 앞 넷은 `SPEC_01 §4.7`·`§4.8` 그대로다.

| 이름 | 동작 |
|------|------|
| `render(state)` | 고정 보드와 현재 블록을 합쳐 그린다 |
| `getActiveDropTimerCount()` | 살아 있는 낙하 타이머 개수 |
| `tick()` | 자동 낙하 한 단계. `PLAYING` 이 아니면 아무 것도 하지 않는다 |
| `getDropStats()` | `{ count, lastAt, intervalMs }` |
| `loadState(state)` | 앱 상태를 주어진 상태로 **교체**하고 다시 그린다 (아래) |

**`loadState(state)`**

- 앱이 들고 있는 현재 상태를 인자로 통째로 바꾸고 `render` 한다.
- 바꾼 뒤 `status` 가 `'PLAYING'` 이면 낙하 타이머를 **하나만** 다시 건다
  (기존 타이머를 먼저 정지한다). `'PLAYING'` 이 아니면 타이머를 정지한다.
- `getDropStats().count` 를 되돌리지 않는다.

이 함수의 목적은 검증이 임의의 보드 모양을 만들 수 있게 하는 것이다. 줄 제거와 게임오버는
키 입력만으로 화면에서 재현하려면 수십 번의 착지가 필요해 관측이 불가능해진다 (§11).

**tick 과 GAME_OVER**

- `tick()` 은 실행 시점에 `status` 를 확인하고 `'PLAYING'` 이 아니면 아무 것도 하지 않는다.
  `getDropStats().count` 도 늘리지 않는다.
- `status` 가 `'PLAYING'` 이 아니게 되는 즉시 타이머를 정지한다.
- 키 입력은 `'PLAYING'` 일 때만 처리한다. `GAME_OVER` 에서 네 방향키는 아무 것도 하지 않는다.

## 5. 범위 밖

- 점수 계산, 점수 획득 규칙, 콤보 — `score` 는 이번 단계 내내 `0` 이다
- 레벨, 레벨에 따른 낙하 속도 변경
- 하드 드롭(`Space`), 일시정지(`P`), `PAUSED` 상태 사용
- 다음 블록 표시·미리보기, 홀드
- 리더보드, 브라우저 저장, 외부 배포
- 무작위 블록 선택 (결정적 순환 유지)
- wall kick, 회전 시 위치 보정

줄 제거를 만들었다는 이유로 점수나 레벨을 함께 넣지 않는다.

## 6. 완료 조건

전 항목이 관측 가능해야 한다. 판정 경로는 이렇게 갈린다.

| 조건 | 판정 경로 |
|------|-----------|
| 6-1 · 6-2 | 파일시스템 (`ls` · `grep`) |
| 6-5 | §7 러너 출력 (`test.html`) |
| 6-3 · 6-4 · 6-6 ~ 6-20 | 브라우저 관측 (DOM, 콘솔, 공개 함수 호출, 합성 이벤트 디스패치) |
| §8 두 항목 | 사람 눈 |

입력의 필수 관측 수단은 `SPEC_01 §6` 과 같다 — **합성 디스패치와 도달성 프로브**다.
OS 신뢰 입력은 필수가 아니다. 보드 모양은 `TetrisApp.loadState` 로 만든다.

### 6.0 검증이 쓰는 세 가지 보드

아래 세 상태를 그대로 만들어 쓴다. 좌표를 바꾸면 조건의 기대값이 달라진다.

```js
const G = TetrisGame;
const fill = (board, row, from, to, t) => { for (let c = from; c <= to; c += 1) board[row][c] = t; return board; };
// 세로 I — 행렬 세 번째 열이 채워지므로 보드 열은 col + 2 = 9, 행은 16~19
const verticalI = { type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 };

// (가) 한 줄 완성 직전 — 19행 열 0~8 고정
const A = {...G.createInitialState(), status: 'PLAYING', piece: verticalI,
           board: fill(G.createEmptyBoard(), 19, 0, 8, 'O')};

// (나) 두 줄 완성 직전 — 18·19행 열 0~8 고정
const B = (() => { const b = G.createEmptyBoard(); fill(b, 18, 0, 8, 'O'); fill(b, 19, 0, 8, 'O');
                   return {...G.createInitialState(), status: 'PLAYING', piece: verticalI, board: b}; })();

// (다) 게임오버 직전 — 0~3행 열 0~8 고정(완성 줄이 아니다) + 바닥의 세로 I
const C = (() => { const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b, r, 0, 8, 'O'));
                   return {...G.createInitialState(), status: 'PLAYING', piece: verticalI, board: b}; })();
```

(다)에서 0~3행을 **열 0~8 까지만** 채우는 것이 중요하다. 열 10칸을 다 채우면 그 행들이
완성 줄로 판정돼 제거되고 게임오버가 나지 않는다.

- [ ] **6-1** 산출물 파일 집합이 `SPEC_00 §2.1` 의 여섯 개와 정확히 일치한다 (하네스 파일 제외).
      하네스 파일은 `CLAUDE.md` · `MEMORY.md` · `SPEC_*.md` · `docs/` · `.claude/` · `.loop/` ·
      `.git/` · `.gitignore` 이며 세지 않는다.
- [ ] **6-2** `package.json`, lockfile, `node_modules/`, 번들러·TS 설정 파일이 없고,
      두 HTML 의 외부 URL 참조가 0건이다.
- [ ] **6-3** `index.html` 로드 완료 후 5초, 그리고 `시작` 후 5초까지
      **페이지가 만든** 콘솔 error 레벨 0건이다 (warning 은 세지 않는다).
      확장이 주입한 예외는 세지 않는다 — 판별 기준은 `SPEC_01 §6` 6-3 과 같다.
- [ ] **6-4** 로드 직후 아무 입력도 넣지 않은 상태에서
      `[data-role="status"]`=`READY`, `[data-piece]` 셀 0개, `score`=`0`, `lines`=`0`,
      `[data-role="cell"]` 200개, `getActiveDropTimerCount()`=`0`, `getDropStats().count`=`0` 이다.
- [ ] **6-5** `test.html` 요약이 `FAIL 0` 이고 `PASS` 가 **78 이상**이며,
      §7.3 의 필수 테스트 이름 31개와 §7.2 가 유지를 요구하는 47개
      (`SPEC_00` 18 + `SPEC_01` 29)가 전부 결과 목록에 있다.
      §7.2 가 폐기한 4개(`apply-move-down-lands` · `apply-move-ignored-when-landed` ·
      `apply-rotate-ignored-when-landed` · `landed-board-all-zero`)는 목록에 **없어야** 한다.
- [ ] **6-6** `loadState` 로 19행 열 0~2 를 `'O'` 로 고정하고 현재 블록을 `createPiece('T')`
      로 둔 상태를 넣으면, `[data-piece]` 셀이 **정확히 7개**이고
      좌표 집합이 `{(19,0),(19,1),(19,2)}` 와 `T` 의 점유 4칸의 합집합과 같다
      (고정 보드와 현재 블록이 합쳐져 그려진다).
- [ ] **6-7** 보드 (가)를 `loadState` 로 넣고 `ArrowDown` 을 한 번 넣으면
      `[data-role="lines"]` 가 `1`, `[data-role="status"]` 가 `PLAYING` 이고,
      `[data-piece]` 셀이 **정확히 7개**다 — 남은 고정 셀 3개(열 9, 행 `{17,18,19}`)와
      새로 생성된 블록 4개.
- [ ] **6-8** 보드 (나)를 `loadState` 로 넣고 `ArrowDown` 을 한 번 넣으면
      `[data-role="lines"]` 가 **`2`** 가 된다 (두 줄이 한 번에 제거된다).
- [ ] **6-9** 6-8 직후 열 9 의 남은 고정 셀이 **정확히 2개**이고 행이 `{18,19}` 다
      (제거된 두 행 위에 있던 행 16·17 이 두 칸 내려온다).
- [ ] **6-10** 6-7·6-8 어느 경우에도 `[data-role="status"]` 가 `LANDED` 로 관측되지 않는다.
      착지 처리 직후 상태는 `PLAYING` 또는 `GAME_OVER` 뿐이다.
- [ ] **6-11** 보드 (다)를 `loadState` 로 넣고 `ArrowDown` 을 한 번 넣으면
      `[data-role="status"]` 가 `GAME_OVER` 가 되고, `getActiveDropTimerCount()` 가 `0` 이며,
      `[data-role="lines"]` 는 `0` 그대로다 (완성된 줄이 없다).
- [ ] **6-12** `GAME_OVER` 에서 `ArrowLeft`·`ArrowRight`·`ArrowDown`·`ArrowUp` 을 차례로 넣어도
      `[data-piece]` 좌표 집합 · `[data-role="lines"]` · `[data-role="status"]` ·
      `getDropStats().count` 가 입력 직전과 완전히 같다.
- [ ] **6-13** `GAME_OVER` 에서 아무 입력 없이 2450ms 기다려도 6-12 의 네 값이 모두 그대로다
      (예약된 tick 이 상태를 바꾸지 않는다).
- [ ] **6-14** `GAME_OVER` 에서 `TetrisApp.tick()` 을 3번 직접 호출해도 6-12 의 네 값이 그대로다.
- [ ] **6-15** 한 번의 `ArrowDown` 으로 고정 처리가 **한 번만** 일어난다.
      보드 (가)에서 `ArrowDown` 한 번 뒤 `[data-role="lines"]` 증가량이 정확히 `1` 이고,
      `[data-piece]` 셀이 7개이며, 그중 행 `≤ 3` 인 셀이 정확히 4개다
      (새 블록이 하나만 생겼다는 뜻 — 두 번 돌았다면 8개이거나 `lines` 가 2가 된다).
- [ ] **6-16** `board[1][2] = 'O'` 하나만 고정하고 `piece` 를 `createPiece('I')`
      (행 1, 열 3~6 점유)로 둔 상태를 `loadState` 로 넣고 `ArrowLeft` 를 넣으면
      `[data-piece]` 좌표 집합이 변하지 않는다 (고정 셀이 왼쪽 이동을 막는다).
- [ ] **6-17** `board[2][4] = 'O'` 하나만 고정하고 `piece` 를 `createPiece('T')`
      (행 0~1 점유)로 둔 상태를 `loadState` 로 넣고 `ArrowUp` 을 넣으면
      `[data-piece]` 좌표 집합이 변하지 않는다.
      (`T` 를 시계로 돌리면 `(2,4)` 를 쓰게 되는데 그 칸이 이미 고정 셀이다.)
- [ ] **6-18** `GAME_OVER` 에서 `시작` 을 클릭하면 `[data-role="status"]`=`PLAYING`,
      `[data-piece]` 셀이 **정확히 4개**(고정 셀 0개), `[data-role="lines"]`=`0`,
      `[data-role="score"]`=`0`, `getActiveDropTimerCount()`=`1` 이다.
- [ ] **6-19** `GAME_OVER` → `시작` 을 두 번 반복한 뒤에도 `getActiveDropTimerCount()` 가 `1` 이고,
      그 상태에서 2450ms 대기 시 `getDropStats()` 의 평균 간격
      `(lastAt 증가분)/(count 증가분)` 이 **630ms 이상**이다.
      `count` 증가량이 `0` 이면 브라우저의 강한 억제이므로 `FAIL` 이 아니라 `BLOCKED` 으로 적는다.
- [ ] **6-20** `[data-role="start"]` 텍스트가 `READY` · `PLAYING` · `GAME_OVER` 세 상태에서
      모두 `시작` 이고, `[data-role="controls"]` 텍스트가 `SPEC_00 §3.5` 문자열과
      문자 단위로 같다.

## 7. 자동 검증

### 7.1 러너 출력 형식

`SPEC_00 §7.1` 과 같다.

```html
<div id="test-summary" data-pass="78" data-fail="0">PASS 78 / FAIL 0</div>
<ul id="test-results">
  <li data-name="clear-rows-single" data-result="pass">한 줄 제거 후 위 행이 한 칸 내려온다</li>
</ul>
```

### 7.2 유지·폐기·교체

`SPEC_00 §7.2` 의 18개는 이름과 통과 상태를 그대로 유지한다.

`SPEC_01 §7.3` 의 33개 중 **29개를 유지**하고 아래 **4개를 폐기**한다.
폐기 이유는 전부 이번 SPEC 이 `LANDED` 지속 상태와 "굳히기 없음" 을 뒤집었기 때문이다.

| 폐기하는 `data-name` | 이유 | 대체 |
|----------------------|------|------|
| `apply-move-down-lands` | 아래가 막히면 이제 `LANDED` 가 아니라 고정 처리다 | `apply-move-down-locks` |
| `apply-move-ignored-when-landed` | `LANDED` 는 지속 상태가 아니다 | `apply-move-ignored-when-game-over` |
| `apply-rotate-ignored-when-landed` | 위와 같다 | `apply-rotate-ignored-when-game-over` |
| `landed-board-all-zero` | 이번 SPEC 은 `board` 에 고정 셀을 쓴다 | `lock-piece-writes-type` |

유지하는 29개에 `test.js` 를 맞춰 고칠 때, 그 테스트들이 만드는 상태에 고정 셀을 넣지 않는다.
빈 보드 위에서의 계약은 바뀌지 않았다.

### 7.3 이번 SPEC 의 필수 테스트

아래 31개는 **`data-name` 이 정확히 이 값이어야** 한다. 더 추가하는 것은 자유다.

| `data-name` | 확인 내용 |
|-------------|-----------|
| `api-surface-spec02` | `lockPiece`·`findFullRows`·`clearRows`·`lockAndAdvance` 가 모두 함수다 |
| `lock-piece-writes-type` | 고정 후 piece 의 채워진 칸 좌표에 `piece.type` 문자가 들어간다 |
| `lock-piece-pure` | 원본 `board` 와 각 행 배열이 변하지 않고, 결과가 새 배열이다 |
| `lock-piece-keeps-others` | 이미 있던 고정 셀 값이 그대로 남는다 |
| `lock-piece-cell-count` | 빈 보드에 고정하면 `0` 이 아닌 셀이 정확히 4개다 |
| `find-full-rows-none` | 빈 보드에서 빈 배열이다 |
| `find-full-rows-single` | 19행만 채우면 `[19]` 다 |
| `find-full-rows-multiple-ascending` | 15행과 19행을 채우면 `[15, 19]` (오름차순)다 |
| `find-full-rows-ignores-partial` | 9칸만 채운 행은 포함되지 않는다 |
| `find-full-rows-ignores-piece` | 보드만 본다 — 현재 블록으로 채워질 자리는 세지 않는다 |
| `clear-rows-single` | 19행 제거 후 18행에 있던 값이 19행으로 내려온다 |
| `clear-rows-multiple-simultaneous` | 비인접 두 행을 한 번에 제거한 결과가 순차 제거와 무관하게 정확하다 |
| `clear-rows-keeps-dimensions` | 결과가 항상 20행 × 10열이다 |
| `clear-rows-top-empty` | 제거한 줄 수만큼 상단 행이 전부 `0` 이다 |
| `clear-rows-preserves-order` | 남은 행의 셀 순서가 바뀌지 않는다 |
| `clear-rows-pure` | 원본 `board` 가 변하지 않는다 |
| `clear-rows-empty-list` | 빈 배열을 주면 값은 같고 참조는 다른 새 보드다 |
| `lock-and-advance-locks-and-spawns` | 결과 `board` 에 고정 셀이 있고 `piece` 가 새 블록이다 |
| `lock-and-advance-lines-accumulate` | 한 줄 제거 시 `lines` 가 정확히 1 증가한다 |
| `lock-and-advance-multi-line-once` | 두 줄 동시 제거 시 `lines` 가 정확히 2 증가한다 |
| `lock-and-advance-clears-before-spawn` | 제거 결과 보드 위에 새 블록이 놓인다 (생성이 제거보다 뒤다) |
| `lock-and-advance-spawns-next-type` | 새 블록 종류가 `nextPieceType(직전 종류)` 다 |
| `lock-and-advance-keeps-score` | `score` 가 변하지 않는다 |
| `lock-and-advance-game-over` | 생성 위치가 고정 셀과 겹치면 `status==='GAME_OVER'` 이고 `piece === null` 이다 |
| `lock-and-advance-game-over-keeps-board` | 게임오버여도 `board` 는 제거·압축까지 끝난 상태다 |
| `lock-and-advance-ignored-when-not-playing` | `status` 가 `PLAYING` 이 아니거나 `piece` 가 `null` 이면 인자 `state` 를 그대로 반환한다 |
| `apply-move-down-locks` | 아래가 막히면 고정 처리 결과를 반환한다 — `status` 가 `PLAYING`, `board` 에 고정 셀 4개, `piece` 가 새 블록 |
| `apply-move-blocked-by-locked-cell` | 옆이 고정 셀이면 좌우 이동이 인자 `state` 를 그대로 반환한다 |
| `apply-rotate-blocked-by-locked-cell` | 회전 결과가 고정 셀과 겹치면 인자 `state` 를 그대로 반환한다 |
| `apply-move-ignored-when-game-over` | `GAME_OVER` 에서 `applyMove` 가 인자 `state` 를 그대로 반환한다 |
| `apply-rotate-ignored-when-game-over` | `GAME_OVER` 에서 `applyRotate` 가 인자 `state` 를 그대로 반환한다 |

필수 이름 합계는 `SPEC_00` 18 + `SPEC_01` 유지 29 + 이번 31 = **78개**다.

## 8. 수동 검증

자동으로 관측할 수 없는 것만 남긴다.

1. 블록을 바닥까지 내려 굳히기를 몇 번 반복해, 굳은 블록이 그 자리에 남고
   새 블록이 위에서 다시 내려오는지 눈으로 본다.
2. `loadState` 로 한 줄을 거의 채운 뒤 마지막 칸을 메워, 줄이 사라지고 위 블록이
   내려앉는 것이 자연스럽게 보이는지 본다.

## 9. 안전과 정지 조건

- 프로젝트 폴더(`/home/al-hub/workspace/tetris-loop`) 밖 파일을 만들거나 수정하거나 삭제하지 않는다.
- OS 나 브라우저의 전역 설정을 바꾸지 않는다.
- 외부 라이브러리·프레임워크·번들러·패키지 매니저를 추가하지 않는다.
- 외부 배포와 유료 서비스를 사용하지 않는다.
- 이번 SPEC 이 요구하지 않은 게임 기능을 미리 만들지 않는다 (§5).
- 기존 화면 구조를 이유 없이 다시 설계하지 않는다.
- 앞 SPEC 에서 동작하던 생성·이동·회전을 제거하지 않는다.
- **루프 반복을 3회** (frontmatter `max_iterations`) 소진하거나,
  같은 실패 시그니처가 두 번 기록되면 중단한다.
- 이 문서에 없는 화면·기술 결정을 해야 하면 추측하지 않고 `[사람 확인 필요]` 로 보고한다.

## 10. 다음 단계로 넘기는 것

| 항목 | 넘기는 이유 |
|------|-------------|
| 점수 계산·콤보 | 제거 줄 수가 먼저 정확해야 점수 규칙을 그 위에 얹을 수 있다 |
| 레벨과 낙하 속도 변화 | 속도가 변하면 이번 SPEC 의 간격 하한 조건을 다시 설계해야 한다 |
| 하드 드롭 · 일시정지 | `Space`·`P` 와 `PAUSED` 를 함께 다뤄야 한다. 안내 문구는 이미 화면에 있다 |
| 다음 블록 표시 · 홀드 | 화면 요소와 `data-role` 계약이 늘어난다 |
| 무작위 블록 선택 | 결정적 순환이라야 이번 조건(6-7·6-18)을 관측할 수 있다 |
| wall kick | 회전 거부 규칙을 두 SPEC 에 걸쳐 고정해 둔 뒤에 바꾸는 편이 안전하다 |

## 11. 해석 고정 근거 (revision 1)

요구사항에서 갈릴 수 있던 지점과, 어느 쪽으로 정했는지.

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| 고정 셀 값 | 블록 종류 한 글자 (`'I'`…`'L'`), 빈칸은 숫자 `0` | 종류를 남기면 색이 유지되고, 검증이 DOM 에서 무엇이 어디 굳었는지 바로 읽는다. 숫자 `1` 이면 종류 정보가 사라진다 |
| 화면에서 고정/낙하 구분 | 구분하지 않는다. 둘 다 `data-piece` | 요구사항 §1 은 **내부 상태**의 분리를 요구했다. DOM 에 `data-locked` 를 더하면 계약과 CSS 규칙이 두 배가 되는데 얻는 게 없다 |
| 고정 처리 API | 원자 함수 `lockAndAdvance(state)` 하나 + 헬퍼 3개 공개 | 호출이 하나라 "정확히 한 번"(요구사항 §14)을 강제하기 쉽다. 헬퍼를 따로 공개해 단계별 테스트도 가능하다 |
| 게임오버 시 `piece` | `null` | 배치 불가로 판정한 블록을 "현재 블록" 으로 남기면 §12 의 "새 블록을 추가로 생성하지 않는다" 와 화면 표시가 모호해진다. `null` 이면 화면에 고정 보드만 남아 관측이 분명하다 |
| `LANDED` | 상태 값으로 쓰지 않는다. 키는 정의만 유지 | 요구사항 §4 가 지속 상태 사용을 금지했다. `SPEC_00 §4.2` 의 동결 5키를 깨지 않으려면 키는 남겨야 한다 |
| 브라우저에서 줄 제거를 어떻게 만드나 | `TetrisApp.loadState(state)` 신설 | 키 입력만으로 한 줄을 채우려면 착지를 수십 번 반복해야 하고, 그 과정에서 자동 낙하가 끼어들어 재현이 불가능하다. 임의 상태 주입이 있어야 6-7~6-17 이 관측 가능해진다 |
| `loadState` 가 타이머를 어떻게 다루나 | `PLAYING` 이면 하나만 다시 걸고, 아니면 정지 | 주입한 상태와 타이머가 어긋나면 이후 모든 조건이 흔들린다. "타이머는 최대 한 개" 규칙을 여기서도 지킨다 |
| 게임오버 화면 | 상태값만 `GAME_OVER` 로 바뀐다. 배너 없음, 버튼 텍스트 `시작` 고정 | 화면 요소를 늘리면 문구·위치·색을 새로 정해야 하고 `SPEC_01` 6-20 을 덮어야 한다. 얻는 정보는 상태 패널이 이미 준다 |
| `score` | 이번 단계 내내 `0`, 재시작 시 `0` 으로 초기화만 | 요구사항이 점수 계산을 명시적으로 범위 밖에 뒀다 |
| `clearRows(board, [])` | 값이 같은 **새** 보드 | 반환 규약을 하나로 통일해야 호출부가 분기하지 않는다. 참조 동일성으로 "제거 없음" 을 표현하면 `lockAndAdvance` 의 순서 계약이 흐려진다 |
| 게임오버 보드를 어떻게 만드나 | 0~3행을 **열 0~8 까지만** 채운다 (§6.0 의 (다)) | 열 10칸을 다 채우면 그 행들이 완성 줄로 판정돼 먼저 제거되고 게임오버가 나지 않는다. 조건이 스스로를 무효화하는 함정이었다 |
| 검증용 보드 좌표 | §6.0 에 코드로 고정 | 말로 "거의 찬 보드" 라고 두면 기대 셀 개수가 반복마다 달라진다 |
| 필수 테스트 개수 | 31개 신설, `SPEC_01` 4개 폐기, 합계 하한 78 | 폐기 목록을 문서에 박지 않으면 다음 반복이 `LANDED` 테스트를 되살리려다 실패한다. 폐기 4개는 목록에 남아 있으면 안 되므로 6-5 가 부재까지 검사한다 |
