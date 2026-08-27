---
id: SPEC_01
title: 블록 생성·자동 낙하·조작과 LANDED
revision: 1
depends_on: [SPEC_00]
max_iterations: 3
---

# SPEC 01 — 블록 생성·자동 낙하·조작과 LANDED

## 1. 목표

정적이던 SPEC_00 화면을 움직이게 만든다. `시작` 을 누르면 블록 하나가 상단 중앙에 생기고
700ms마다 한 칸 내려가며, 방향키로 좌·우·아래 이동과 시계 방향 회전이 된다.
더 내려갈 수 없는 상태에서 아래 이동이 발생하면 `LANDED` 로 멈추고, 버튼이 재시작으로 동작한다.

줄 제거·점수·다음 블록·일시정지는 이번 단계에 없다 (§5).

## 2. 기술과 파일 구조

`SPEC_00 §2` 와 같다. 산출물은 여섯 개 그대로이고 파일을 늘리지 않는다.
`file://` 직접 실행 요구도 그대로 유지한다 (단 §6 은 이를 판정하지 않는다 — §11 참조).

이번 SPEC 이 **SPEC_00 을 덮어쓰는 지점**은 둘이다.

| SPEC_00 조항 | 이번 SPEC 에서 |
|--------------|----------------|
| §4.4 `createInitialState()` 는 네 개 키 | **다섯 개 키** — `piece` 를 추가한다 (§4.6) |
| 완료 조건 6-13 "키 입력·클릭 후 스냅샷 불변" | **폐기.** 이번 SPEC 은 입력에 반응해야 한다. 대신 6-4 가 로드 직후 정지 상태를 지킨다 |

`GAME_STATUS` 값 집합과 `BOARD_WIDTH`·`BOARD_HEIGHT`·`createEmptyBoard()` 는 바뀌지 않는다.
조작 안내(`SPEC_00 §3.5`) 문자열도 **한 글자도 바꾸지 않는다** — `Space`·`P` 는 §5 범위 밖이라
안내만 남고 동작하지 않는다.

## 3. 화면 정의

### 3.1 블록 셀 표기

블록이 놓인 셀은 `data-piece` 속성으로 표시한다. **값은 블록 종류 한 글자**다.
빈 셀에는 이 속성이 없다.

```html
<div class="cell" data-role="cell" data-piece="T"></div>
<div class="cell" data-role="cell"></div>
```

- 화면에 블록이 있으면 `[data-piece]` 셀은 항상 **정확히 4개**이고 값이 모두 같다.
- 색은 CSS 가 `[data-piece="I"]` … `[data-piece="L"]` 일곱 규칙으로 준다.
  `game.js` 는 색을 모른다 (색은 로직이 아니라 표현이다).
- 일곱 색은 서로 다르고, 빈 셀 배경색과도 다르다. 값은 이것으로 고정한다.

| 종류 | `background-color` |
|------|--------------------|
| `I` | `#22d3ee` |
| `O` | `#facc15` |
| `T` | `#a855f7` |
| `S` | `#22c55e` |
| `Z` | `#ef4444` |
| `J` | `#3b82f6` |
| `L` | `#f97316` |

### 3.2 버튼

`[data-role="start"]` 텍스트는 **항상 `시작`** 이다. 상태에 따라 바꾸지 않는다.
`disabled` 도 쓰지 않는다.

| 클릭 시점 상태 | 동작 |
|----------------|------|
| `READY` | 게임 시작 |
| `LANDED` | 재시작 |
| `PLAYING` | **무시.** 화면이 전혀 바뀌지 않는다 |

### 3.3 상태 패널

`[data-role="status"]` 는 `state.status` 를 그대로 쓴다 — `READY` · `PLAYING` · `LANDED`.
`[data-role="score"]` 와 `[data-role="lines"]` 는 이번 단계 내내 `0` 이다.

### 3.4 방향키와 페이지 스크롤

`PLAYING` 동안 `ArrowLeft` · `ArrowRight` · `ArrowDown` · `ArrowUp` 의 `keydown` 에
`preventDefault()` 를 호출해 브라우저 기본 스크롤을 막는다.
`PLAYING` 이 아닐 때는 호출하지 않는다.

## 4. 상태와 공개 함수

### 4.1 좌표 기준

- 행 `row` 는 위에서 아래로 `0` … `19`, 열 `col` 은 왼쪽에서 오른쪽으로 `0` … `9`.
  (`SPEC_00 §4.1` 의 `BOARD_HEIGHT` 20 · `BOARD_WIDTH` 10 을 그대로 쓴다. 보드 크기를 바꾸지 않는다.)
- 블록은 정사각 행렬로 표현한다. `piece.row` · `piece.col` 은 **행렬의 (0,0) 칸이 놓인 보드 좌표**다.
  행렬의 `1` 이 놓인 보드 좌표는 `piece.row + i` · `piece.col + j` 다.

### 4.2 `PIECE_TYPES`

`Object.freeze` 된 배열이며 순서가 이것과 같다.

```js
['I', 'O', 'T', 'S', 'Z', 'J', 'L']
```

### 4.3 `PIECE_SHAPES`

`Object.freeze` 된 객체다. 키는 §4.2 의 일곱 글자, 값은 동결된 정사각 행렬
(숫자 `0`·`1` 의 2차원 배열)이다. 행렬 변 길이는 `I` 가 4, `O` 가 2, 나머지 다섯이 3이다.
채워진 칸은 종류마다 정확히 4개다.

```text
I (4x4)      O (2x2)   T (3x3)   S (3x3)   Z (3x3)   J (3x3)   L (3x3)
0 0 0 0       1 1       0 1 0     0 1 1     1 1 0     1 0 0     0 0 1
1 1 1 1       1 1       1 1 1     1 1 0     0 1 1     1 1 1     1 1 1
0 0 0 0                 0 0 0     0 0 0     0 0 0     0 0 0     0 0 0
0 0 0 0
```

`I` 의 채워진 칸이 행렬 두 번째 줄인 것은 의도한 것이다 (§11).

### 4.4 `DROP_INTERVAL_MS`

숫자 `700`.

### 4.5 순수 함수

`game.js` 는 DOM 에 접근하지 않는다. `globalThis.TetrisGame` 에 아래를 추가한다.
`SPEC_00 §4.1` 의 다섯 개는 그대로 유지한다.

| 이름 | 인자 | 반환 |
|------|------|------|
| `nextPieceType(prevType)` | 이전 종류 문자열 또는 `null` | 다음 종류 문자열 |
| `createPiece(type)` | 종류 문자열 | 새 piece 객체 (§4.6) |
| `rotateCells(cells)` | 정사각 행렬 | 시계 방향 90° 회전한 **새 행렬** |
| `canPlace(board, piece)` | 보드, piece | `true` / `false` |
| `applyMove(state, dRow, dCol)` | 상태, 행 증분, 열 증분 | 새 상태 또는 인자 `state` 그대로 |
| `applyRotate(state)` | 상태 | 새 상태 또는 인자 `state` 그대로 |
| `startGame(state)` | 상태 (또는 `null`) | 새 상태 |

규칙은 아래와 같다.

**`nextPieceType(prevType)`** — `prevType` 이 `null`·`undefined` 이거나 `PIECE_TYPES` 에 없으면
`'I'` 를 반환한다. 있으면 그 다음 항목, 마지막(`'L'`)이면 `'I'` 로 돌아온다.

**`createPiece(type)`** — 다음 네 개 키를 가진 새 객체를 반환한다.

| 키 | 값 |
|----|-----|
| `type` | 인자로 받은 종류 문자열 |
| `cells` | `PIECE_SHAPES[type]` 의 **깊은 복사** (원본과 배열을 공유하지 않는다) |
| `row` | `0` |
| `col` | `Math.floor((BOARD_WIDTH - N) / 2)`, `N` 은 행렬 변 길이 |

따라서 `col` 은 `I` 가 `3`, `O` 가 `4`, 나머지 다섯이 `3` 이다.

**`rotateCells(cells)`** — `cells[0].map((_, c) => cells.map(r => r[c]).reverse())` 와 같은 결과다.
원본을 변형하지 않는다. 네 번 적용하면 원본과 값이 같아진다.
`O` 는 회전 결과 값이 원본과 같지만 **새 배열**이다.

**`canPlace(board, piece)`** — `piece` 의 채워진 칸 전부가 아래를 만족하면 `true`.

- `0 <= row < board.length`
- `0 <= col < board[row].length`
- `board[row][col] === 0`

**`applyMove(state, dRow, dCol)`**

1. `state.status !== 'PLAYING'` 이면 **인자 `state` 를 그대로 반환**한다 (동일 참조).
2. 이동한 piece 가 `canPlace` 를 만족하면 `{...state, piece: 이동한 piece}` 를 반환한다.
3. 만족하지 않고 `dRow > 0` 이면 `{...state, status: 'LANDED'}` 를 반환한다.
   `piece` 는 이동 전 참조를 그대로 넘긴다.
4. 만족하지 않고 `dRow <= 0` 이면 **인자 `state` 를 그대로 반환**한다.

**`applyRotate(state)`**

1. `state.status !== 'PLAYING'` 이면 인자 `state` 를 그대로 반환한다.
2. 회전한 piece 가 `canPlace` 를 만족하면 `{...state, piece: 회전한 piece}` 를 반환한다.
3. 아니면 인자 `state` 를 그대로 반환한다. **위치 보정(wall kick)을 하지 않는다.**

**`startGame(state)`** — 아래 다섯 키를 가진 새 상태를 반환한다.

| 키 | 값 |
|----|-----|
| `board` | `createEmptyBoard()` |
| `piece` | `createPiece(nextPieceType(state && state.piece ? state.piece.type : null))` |
| `score` | `0` |
| `lines` | `0` |
| `status` | `'PLAYING'` |

### 4.6 `createInitialState()` 확장

`SPEC_00 §4.4` 의 네 키에 `piece` 를 더해 **정확히 다섯 개** 키를 갖는다.

| 키 | 값 |
|----|-----|
| `board` | `createEmptyBoard()` 의 결과 |
| `piece` | `null` |
| `score` | `0` |
| `lines` | `0` |
| `status` | `GAME_STATUS.READY` |

### 4.7 `main.js` — 렌더링과 브라우저 연결

`globalThis.TetrisApp` 에 아래를 공개한다.

| 이름 | 동작 |
|------|------|
| `render(state)` | 보드·블록·패널을 다시 그린다 |
| `getActiveDropTimerCount()` | 지금 살아 있는 낙하 타이머 개수를 숫자로 반환한다 |

- `render` 는 `state.board` 로 격자를 만들고, `state.piece` 가 `null` 이 아니면
  그 채워진 칸에 해당하는 셀에 `data-piece="<type>"` 를 붙인다.
  행·열 개수는 `SPEC_00 §4.5` 대로 상태에서 읽는다.
- 낙하 타이머는 **항상 최대 한 개**다. `getActiveDropTimerCount()` 는
  `READY` 와 `LANDED` 에서 `0`, `PLAYING` 에서 `1` 이다.
- `PLAYING` 진입 시 타이머를 만들고, `LANDED` 로 바뀌는 즉시 정지한다.
  재시작할 때는 새 타이머를 만들기 전에 기존 타이머를 정지한다.
- 키 입력 처리는 `window` 의 `keydown` 하나로 한다. 리스너를 재시작마다 새로 붙이지 않는다.
- 로드 시 `render(TetrisGame.createInitialState())` 를 한 번 호출한다 (SPEC_00 과 동일).

## 5. 범위 밖

- 굳은 블록 쌓기 — `LANDED` 이후 블록을 `board` 에 기입하지 않는다. `board` 는 계속 전부 `0` 이다.
- 줄 제거, 점수 계산, `lines` 증가
- 다음 블록 미리보기, 홀드
- 무작위 블록 선택 (이번 단계는 결정적 순환이다)
- `Space` 하드 드롭, `P` 일시정지, `PAUSED` 상태 사용
- `GAME_OVER` 상태 사용
- wall kick, 회전 시 위치 보정
- 낙하 속도 변화, 레벨
- 리더보드, 브라우저 저장, 외부 배포

## 6. 완료 조건

전 항목이 관측 가능해야 한다. 판정 경로는 이렇게 갈린다.

| 조건 | 판정 경로 |
|------|-----------|
| 6-1 · 6-2 | 파일시스템 (`ls` · `grep`) |
| 6-5 | §7 러너 출력 (`test.html`) |
| 6-3 · 6-4 · 6-6 ~ 6-22 | 브라우저 관측 (DOM 개수·속성·텍스트, 콘솔, 실제 키 입력·클릭, 공개 함수 호출) |
| §8 세 항목 | 사람 눈 |

- [ ] **6-1** 산출물 파일 집합이 `SPEC_00 §2.1` 의 여섯 개와 정확히 일치한다 (하네스 파일 제외).
      하네스 파일은 `CLAUDE.md` · `MEMORY.md` · `SPEC_*.md` · `docs/` · `.claude/` · `.loop/` ·
      `.git/` · `.gitignore` 이며 세지 않는다.
- [ ] **6-2** `package.json`, lockfile, `node_modules/`, 번들러·TS 설정 파일이 없고,
      두 HTML 의 외부 URL 참조가 0건이다.
- [ ] **6-3** `index.html` 로드 완료 후 5초, 그리고 `시작` 클릭 후 5초까지
      콘솔 **error 레벨 0건**이다 (warning 은 세지 않는다).
- [ ] **6-4** 로드 직후 아무 입력도 넣지 않은 상태에서
      `[data-role="status"]`=`READY`, `[data-piece]` 셀 0개, `score`=`0`, `lines`=`0`,
      `[data-role="cell"]` 200개, `[data-role="controls"]` 텍스트가 `SPEC_00 §3.5` 문자열과
      문자 단위로 같고, `getActiveDropTimerCount()` 가 `0` 이다.
- [ ] **6-5** `test.html` 요약이 `FAIL 0` 이고 `PASS` 가 **51 이상**이며,
      §7.3 의 필수 테스트 이름 33개와 `SPEC_00 §7.2` 의 18개가 전부 결과 목록에 있다.
- [ ] **6-6** `시작` 클릭 후 `[data-role="status"]`=`PLAYING` 이고,
      `[data-piece]` 셀이 **정확히 4개**이며 네 값이 모두 같고,
      `getActiveDropTimerCount()` 가 `1` 이다.
- [ ] **6-7** 로드 후 첫 `시작` 에서 나온 블록의 `data-piece` 값이 `I` 다.
- [ ] **6-8** 그 첫 블록의 점유 열 집합이 `{3,4,5,6}`, 점유 행 집합이 `{1}` 이다
      (`createPiece('I')` 의 `col`=3·`row`=0 과 §4.3 행렬에서 나오는 값).
- [ ] **6-9** `시작` 후 2450ms 대기하면 점유 셀의 최소 행이 **3 또는 4** 증가한다.
- [ ] **6-10** `←` 한 번에 점유 열이 모두 1 감소하고, `→` 한 번에 1 증가한다
      (실제 키 입력으로 관측하며, 자동 낙하 때문에 행은 변할 수 있으므로 열만 본다).
- [ ] **6-11** `↓` 한 번에 점유 행이 모두 1 증가한다.
- [ ] **6-12** 첫 블록(`I`)에 `↑` 를 한 번 누르면 점유 셀이 4개이고,
      점유 **열 집합이 `{5}`**, 점유 행이 연속된 4행이다.
      (`I` 회전 결과는 행렬 세 번째 열이 채워지므로 보드 열은 `piece.col + 2 = 5` 다.
      자동 낙하로 행은 내려가지만 열은 변하지 않는다.)
- [ ] **6-13** `PLAYING` 중 `ArrowLeft`·`ArrowRight`·`ArrowUp`·`ArrowDown` 의 `keydown` 이
      네 개 모두 `defaultPrevented === true` 다.
- [ ] **6-14** `←` 를 20번 눌러도 점유 열의 최소값이 `0` 이고 음수가 되지 않는다.
      `→` 를 20번 눌러도 최대값이 `9` 를 넘지 않는다.
- [ ] **6-15** `↓` 를 25번 눌러 바닥에 닿게 하면 `[data-role="status"]`=`LANDED` 이고,
      `[data-piece]` 셀이 4개 그대로 남아 있고, `getActiveDropTimerCount()` 가 `0` 이다.
- [ ] **6-16** `LANDED` 에서 `← → ↓ ↑` 를 차례로 입력한 뒤
      `[data-piece]` 좌표 집합과 패널 세 값이 입력 직전과 완전히 같다.
- [ ] **6-17** `LANDED` 에서 `시작` 을 클릭하면 `status`=`PLAYING`,
      `[data-piece]` 셀 4개, 점유 행의 최소값이 `0` 또는 `1` 로 돌아오고,
      `data-piece` 값이 §4.2 순환의 다음 종류이며, `getActiveDropTimerCount()` 가 `1` 이다.
- [ ] **6-18** `LANDED` → `시작` 을 두 번 반복한 뒤에도
      `getActiveDropTimerCount()` 가 `1` 이고, 그 상태에서 2450ms 대기 시
      점유 셀의 최소 행 증가량이 **3 또는 4** 다 (타이머가 겹치면 더 커진다).
- [ ] **6-19** `PLAYING` 중 `시작` 을 클릭하면 `data-piece` 값이 클릭 직전과 같고
      점유 행의 최소값이 클릭 직전보다 **작아지지 않는다** (재시작이 일어나지 않았다는 뜻).
- [ ] **6-20** `[data-role="start"]` 텍스트가 `READY` · `PLAYING` · `LANDED` 세 상태에서
      모두 `시작` 이다.
- [ ] **6-21** 일곱 종류를 각각 `TetrisApp.render` 로 그렸을 때 `[data-piece]` 셀의
      `getComputedStyle` 배경색이 §3.1 표의 값과 일치하고, 일곱 색이 서로 다르며
      빈 셀 배경색과도 다르다.
- [ ] **6-22** `LANDED` 가 된 뒤 아무 입력 없이 2450ms 기다려도
      `[data-piece]` 셀이 4개 그대로이고 좌표 집합이 변하지 않는다.
      (타이머가 멈췄고 새 블록도 생기지 않았다는 뜻. 굳은 블록이 `board` 에 남지 않는 것은
      §7.3 `landed-board-all-zero` 가 판정한다.)

## 7. 자동 검증

### 7.1 러너 출력 형식

`SPEC_00 §7.1` 과 같다.

```html
<div id="test-summary" data-pass="51" data-fail="0">PASS 51 / FAIL 0</div>
<ul id="test-results">
  <li data-name="drop-interval-700" data-result="pass">DROP_INTERVAL_MS 는 700 이다</li>
</ul>
```

### 7.2 유지해야 하는 테스트

`SPEC_00 §7.2` 의 18개는 이름과 통과 상태를 그대로 유지한다.
단 `initial-state-keys` 같은 SPEC_00 시절의 **추가** 테스트가 `piece` 확장과 충돌하면
그 테스트는 §7.3 의 `initial-state-keys-five` 로 대체한다.

### 7.3 이번 SPEC 의 필수 테스트

아래 33개는 **`data-name` 이 정확히 이 값이어야** 한다. 더 추가하는 것은 자유다.

| `data-name` | 확인 내용 |
|-------------|-----------|
| `api-surface-spec01` | `PIECE_TYPES`·`PIECE_SHAPES`·`DROP_INTERVAL_MS`·`nextPieceType`·`createPiece`·`rotateCells`·`canPlace`·`applyMove`·`applyRotate`·`startGame` 이 모두 공개되어 있고 타입이 맞다 |
| `piece-types-order` | `PIECE_TYPES` 가 `['I','O','T','S','Z','J','L']` 와 순서까지 같다 |
| `piece-types-frozen` | `Object.isFrozen(PIECE_TYPES)` 가 참이다 |
| `shapes-matrix-size` | `I` 4x4, `O` 2x2, 나머지 다섯이 3x3 이고 모두 정사각이다 |
| `shapes-cell-count` | 일곱 종류 모두 채워진 칸이 4개다 |
| `shapes-frozen` | `PIECE_SHAPES` 와 각 행렬이 동결되어 있다 |
| `drop-interval-700` | `DROP_INTERVAL_MS === 700` |
| `next-piece-type-cycle` | `null`→`I`, `I`→`O`, `L`→`I`, 목록 밖 값→`I` |
| `create-piece-spawn-col` | `I`=3, `O`=4, `T`·`S`·`Z`·`J`·`L`=3 |
| `create-piece-spawn-row` | 일곱 종류 모두 `row === 0` |
| `create-piece-cells-not-shared` | 두 번 만든 piece 의 `cells` 가 `PIECE_SHAPES` 와도, 서로와도 배열을 공유하지 않는다 |
| `rotate-cells-t-clockwise` | `T` 회전 결과가 `[[0,1,0],[0,1,1],[0,1,0]]` 이다 |
| `rotate-cells-i-clockwise` | `I` 회전 결과가 네 행 모두 `[0,0,1,0]` 이다 |
| `rotate-cells-o-invariant` | `O` 회전 결과 값이 원본과 같고 배열은 다른 객체다 |
| `rotate-cells-pure` | 회전 후 원본 행렬이 변하지 않았다 |
| `rotate-cells-four-times-identity` | 네 번 회전하면 값이 원본과 같다 (일곱 종류 전부) |
| `can-place-initial-true` | 빈 보드 + 생성 직후 piece 가 `true` |
| `can-place-left-out` | `col` 을 왼쪽으로 밀어 칸이 `col < 0` 이 되면 `false` |
| `can-place-right-out` | 오른쪽으로 밀어 `col >= 10` 이 되면 `false` |
| `can-place-bottom-out` | 아래로 밀어 `row >= 20` 이 되면 `false` |
| `initial-state-piece-null` | `createInitialState().piece === null` |
| `initial-state-keys-five` | 키가 `board`·`piece`·`score`·`lines`·`status` 다섯 개다 |
| `start-game-from-ready-type-i` | 초기 상태에서 `startGame` 하면 `status==='PLAYING'`, `piece.type==='I'` |
| `start-game-cycles-type` | `piece.type==='T'` 인 상태에서 `startGame` 하면 다음이 `'S'` 다 |
| `start-game-resets-board` | 결과의 `board` 가 20x10 전부 `0`, `score`·`lines` 가 `0` |
| `apply-move-left-ok` | 이동 가능한 위치에서 `applyMove(state,0,-1)` 이 `piece.col` 을 1 줄인 **새 상태**를 준다 |
| `apply-move-rejected-identity` | 왼쪽 경계에서 `applyMove(state,0,-1)` 이 인자 `state` 를 그대로(`===`) 반환한다 |
| `apply-move-down-lands` | 바닥에서 `applyMove(state,1,0)` 이 `status==='LANDED'` 인 새 상태를 주고 `piece` 참조는 그대로다 |
| `apply-move-ignored-when-landed` | `status==='LANDED'` 인 상태에서 `applyMove` 가 인자 `state` 를 그대로 반환한다 |
| `apply-rotate-ok` | 회전 가능한 위치에서 `applyRotate` 가 회전된 `cells` 를 가진 새 상태를 준다 |
| `apply-rotate-rejected-identity` | 회전 결과가 경계를 벗어나는 위치에서 인자 `state` 를 그대로 반환한다 |
| `apply-rotate-ignored-when-landed` | `status==='LANDED'` 에서 인자 `state` 를 그대로 반환한다 |
| `landed-board-all-zero` | 바닥에서 `applyMove(state,1,0)` 으로 `LANDED` 를 만든 뒤 그 상태의 `board` 200칸이 전부 숫자 `0` 이다 (§5 굳은 블록 없음) |

## 8. 수동 검증

자동으로 관측할 수 없는 것만 남긴다.

1. `시작` 을 누르고 몇 초 지켜봐 블록이 **끊기지 않고 부드럽게** 한 칸씩 내려오는지 본다.
2. 방향키로 좌·우로 움직이고 회전시켜 봐 조작감이 어긋나지 않는지 본다.
3. 재시작을 두세 번 눌러 블록 종류가 `I → O → T → S` 순으로 바뀌는지 눈으로 확인한다.

## 9. 안전과 정지 조건

- 프로젝트 폴더(`/home/al-hub/workspace/tetris-loop`) 밖 파일을 만들거나 수정하지 않는다.
- 외부 배포와 유료 서비스를 사용하지 않는다.
- **루프 반복을 3회** (frontmatter `max_iterations`) 소진하거나,
  같은 실패 시그니처가 두 번 기록되면 중단한다.
- 이 문서에 없는 화면·기술 결정을 해야 하면 추측하지 않고 `[사람 확인 필요]` 로 보고한다.

## 10. 다음 단계로 넘기는 것

| 항목 | 넘기는 이유 |
|------|-------------|
| `LANDED` 블록을 `board` 에 굳히기 | 줄 제거가 없으면 굳힐 이유가 없다. 쌓임과 줄 제거는 한 SPEC 에서 같이 다뤄야 한다 |
| 무작위 블록 선택 | 결정적 순환이어야 이번 단계의 생성 조건(6-7·6-17)을 관측할 수 있다 |
| `Space` 하드 드롭 · `P` 일시정지 | `PAUSED` 사용과 함께 다뤄야 한다. 안내 문구는 이미 화면에 있다 |
| `GAME_OVER` | 블록이 쌓이지 않으므로 게임이 끝날 조건이 없다 |
| wall kick | 회전 거부 규칙(§4.5)을 먼저 고정해 두는 편이 이후 비교가 쉽다 |

## 11. 해석 고정 근거 (revision 1)

요구사항에서 갈릴 수 있던 지점과, 어느 쪽으로 정했는지.

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| 낙하 블록을 어디에 담나 | `state.piece` 로 분리, `board` 는 계속 전부 `0` | 이동·회전이 `board` 를 만지지 않아 순수 함수로 남고, 거부 시 "원본 유지" 가 자연스럽다. `board` 기입은 대칭 복원이 필요해 실수가 난다 |
| 블록 종류 선택 | 결정적 순환 `I→O→T→S→Z→J→L` | 무작위면 6-7·6-8·6-17 을 관측할 수 없다. 무작위는 §5 로 밀었다 |
| 회전 행렬 크기 | `I` 4x4, `O` 2x2, 나머지 3x3 | 표준 테트리스 관행. 전부 4x4 로 통일하면 3칸 블록이 회전마다 한 칸 밀려 보인다 |
| `I` 행렬의 채워진 줄 | 두 번째 줄 | 회전하면 세 번째 열이 채워져 블록이 행렬 중앙 쪽에 남는다. 첫 줄에 두면 회전 후 네 번째 열로 튀어 생성 위치에서 3칸 오른쪽으로 점프한다 |
| 생성 열 계산 | `Math.floor((BOARD_WIDTH - N) / 2)`, `N` 은 행렬 변 길이 | 폭 10 에 3칸 블록은 정중앙이 없다. `floor` 로 좌측 편향을 못 박아 홀짝 모호성을 없앴다 |
| 생성 행 | `piece.row = 0` (행렬 (0,0) 이 보드 0행) | 기준을 좌표 하나로 고정해야 6-8 을 숫자로 쓸 수 있다. `I` 는 그래서 시각적으로 1행부터 보인다 |
| 버튼 텍스트 | 항상 `시작` | `SPEC_00` 6-10 이 이 텍스트를 검사한다. 바꾸면 지난 조건을 재정의해야 한다 |
| `PLAYING` 중 버튼 클릭 | 무시 | 진행 중인 게임이 실수 한 번으로 날아가지 않게. 요구사항이 비워 둔 자리다 |
| 블록 셀 표기 | `data-piece="<종류 한 글자>"`, 빈 셀은 속성 없음 | 검증이 색이 아니라 속성으로 종류·좌표를 셀 수 있다. 색은 CSS 가 이 속성으로 준다 |
| 색 값 | §3.1 의 일곱 hex 고정 | "구분할 수 있는 색" 만으로는 6-21 을 판정할 수 없다 |
| `game.js` 가 색을 모름 | 색은 CSS 에만 | `CLAUDE.md` §3 의 "순수 로직" 경계. 색은 표현이다 |
| 타이머 하나 관측 | `TetrisApp.getActiveDropTimerCount()` 신설 | 타이머 중복은 화면만 봐서는 "빨리 떨어진다" 로만 나타난다. 숫자로 세게 만들어 6-6·6-15·6-18 을 관측 가능하게 했다 |
| 700ms 판정 | 2450ms 대기 후 증가량 `3` 또는 `4` | 시간 측정은 흔들린다. 3.5 구간을 잡고 허용 폭을 문서에 박았다 |
| 거부 시 반환 | **인자 `state` 를 그대로**(`===`) | "상태 유지" 를 참조 동일성으로 바꿔 테스트가 한 줄로 판정한다 |
| `LANDED` 전이 위치 | `applyMove` 안 | 자동 낙하와 `↓` 입력이 같은 함수를 타므로 두 경로가 갈리지 않는다 |
| `createInitialState()` 키 개수 | 4 → 5 (`piece: null` 추가) | `piece` 를 상태에 두기로 했으므로 초기 상태도 그 자리를 가져야 한다. SPEC_00 §4.4 를 이번 SPEC 이 덮는다 |
| SPEC_00 6-13 | 폐기 | "입력 후 화면 불변" 은 이번 SPEC 의 목표와 정면으로 충돌한다. 로드 직후 정지 상태는 6-4 가 이어받는다 |
| `board` 가 계속 `0` | 6-22 로 명시 | §5 "굳은 블록 없음" 을 부재 증명으로 두지 않고 관측 조건으로 바꿨다 |
| `file://` | §2 요구는 유지, §6 판정 대상 아님 | 브라우저 확장이 `file://` 스킴을 거부해 관측할 수 없다. SPEC_00 검증에서 확인된 제약이다 |
