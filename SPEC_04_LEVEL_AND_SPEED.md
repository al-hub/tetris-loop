---
id: SPEC_04
title: 레벨과 속도
revision: 1
depends_on: [SPEC_00, SPEC_01, SPEC_02, SPEC_03]
max_iterations: 3
---

# SPEC 04 — 레벨과 속도

## 1. 목표

누적 제거 줄 수에서 레벨이 정해지고, 레벨이 오르면 블록이 더 빨리 떨어지며, 줄 제거 점수에
현재 레벨이 곱해진다. 레벨은 저장하는 값이 아니라 `lines` 에서 파생되는 값이다.
낙하 간격은 어떤 레벨에서도 100ms 아래로 내려가지 않는다.

NEXT·일시정지·드롭 점수는 이번 단계에 없다 (§5).

## 2. 기술과 파일 구조

`SPEC_00 §2` 와 같다. 산출물은 여섯 개 그대로이고 파일을 늘리지 않는다.

이번 SPEC 이 **앞 SPEC 을 덮어쓰는 지점**은 넷이다.

| 앞 조항 | 이번 SPEC 에서 |
|---------|----------------|
| SPEC_01 §4.4 `DROP_INTERVAL_MS = 700` | **의미 축소.** 상수는 남되 **레벨 1 의 간격**이 된다. 실제 타이머 간격은 `dropIntervalForLevel(level)` 이다 (§4.3) |
| SPEC_01 §4.8 `getDropStats().intervalMs` — "`DROP_INTERVAL_MS` 와 같아야 한다" | **교체.** `dropIntervalForLevel(levelForLines(state.lines))` 와 같아야 한다 |
| SPEC_01 완료 조건 6-9c "`intervalMs` 가 `700`" | **폐기.** 레벨 1 에서만 참이다. 6-13 이 이어받는다 |
| SPEC_03 §4.3 `score = state.score + scoreForLines(full.length)` | **교체.** `+ scoreForLines(full.length) × levelForLines(state.lines)` — 제거 **직전** 레벨을 곱한다 (§4.4) |

`SPEC_03 §7.3` 의 `lock-and-advance-adds-score` 는 레벨 1 전제(`state.lines` 0)에서 쓰였으므로
값이 바뀌지 않는다. **유지한다.** `SPEC_01 §7.3` 의 `drop-interval-700` 은 상수 `DROP_INTERVAL_MS === 700`
을 보는 테스트라 그대로 참이다. **유지한다.**

### 2.1 선행 의존성 — 드롭 점수

요구사항은 소프트 드롭·하드 드롭 점수에 레벨 배수를 적용하지 않기를 요구한다.
**이 프로젝트에는 두 점수 규칙이 없다.** `SPEC_03 §4.2` 가 "점수가 오르는 경로는 줄 제거 하나뿐"
으로 고정했고 하드 드롭 기능은 `SPEC_03 §5` 범위 밖이다.

요구사항 §10 자신의 규칙에 따라 이번 SPEC 은 드롭 점수를 **만들지 않는다.**
그 대신 "줄 제거 이외의 점수 경로가 없다" 를 관측 가능한 조건으로 둔다 (6-12) —
`applyMove` 로 아래·좌·우 이동을 하고 `applyRotate` 로 회전해도 `score` 가 변하지 않으면,
레벨 배수가 붙을 드롭 점수 자체가 없다는 것이 증명된다.
드롭 점수가 정의되는 SPEC 이 생기면 그 SPEC 이 "배수 미적용" 을 완료 조건으로 가져간다.

## 3. 화면 정의

### 3.1 상태 패널

`SPEC_00 §3.4` 의 세 줄 뒤에 한 줄을 추가한다. 라벨과 값을 분리하고 값에 `data-role` 을 붙인다.

```html
<div class="stat"><span class="label">레벨</span><span data-role="level">1</span></div>
```

- 라벨 문구는 `레벨` 이다. 초기 표시값은 `1` 이다.
- 값은 `levelForLines(state.lines)` 를 그대로 문자열로 표시한다. HTML 에 하드코딩하지 않는다.
- 위치는 `게임 상태` 줄 **바로 다음**이다. 다른 화면 요소는 건드리지 않는다.

### 3.2 화면 문구

```text
레벨
```

## 4. 상태와 공개 함수

### 4.1 상태

`SPEC_02 §4.1` 과 같다. `state` 는 **다섯 키 그대로** `board`·`piece`·`score`·`lines`·`status` 다.
**`level` 키를 추가하지 않는다.** 레벨은 `lines` 에서 계산하는 파생값이다 (§11).

### 4.2 `levelForLines(lines)` — 순수 함수

```text
level = floor(lines / 10) + 1
```

- `lines` 가 `0` 이상의 정수면 위 식의 결과를 반환한다.
- 그 밖의 값(음수 · 정수가 아닌 값 · 숫자가 아닌 값)은 `1` 을 반환한다.
- 다른 기준(경험치 · 시간 · 점수 · 블록 수)을 쓰지 않는다.

| `lines` | `level` |
|--------:|--------:|
| 0 | 1 |
| 9 | 1 |
| 10 | 2 |
| 19 | 2 |
| 20 | 3 |
| 29 | 3 |
| 30 | 4 |
| 99 | 10 |
| 100 | 11 |

### 4.3 `dropIntervalForLevel(level)` — 순수 함수

```text
dropInterval = max(100, 700 - (level - 1) × 60)
```

- `level` 이 `1` 이상의 정수면 위 식의 결과를 반환한다.
- 그 밖의 값은 `700` 을 반환한다 (레벨 1 로 취급).
- 결과는 항상 `100` 이상이다.

| `level` | 계산값 | 반환 |
|--------:|-------:|-----:|
| 1 | 700 | 700 |
| 2 | 640 | 640 |
| 3 | 580 | 580 |
| 4 | 520 | 520 |
| 5 | 460 | 460 |
| 10 | 160 | 160 |
| 11 | 100 | 100 |
| 12 | 40 | **100** |
| 20 | −440 | **100** |
| 100 | −5240 | **100** |

하한이 처음 걸리는 레벨은 **12** 다. 레벨 11 은 계산값이 정확히 100 이라 하한 없이도 100 이다.

`DROP_INTERVAL_MS`(700)는 `dropIntervalForLevel(1)` 과 같다. 상수는 남지만 타이머가 직접 쓰지 않는다.

### 4.4 `lockAndAdvance` 의 점수 배수

`SPEC_02 §4.4` 의 순서는 그대로다. 4단계만 이렇게 바뀐다.

4. `lines = state.lines + full.length`,
   **`score = state.score + scoreForLines(full.length) × levelForLines(state.lines)`**

곱하는 레벨은 **제거 직전의 레벨** — 즉 `state.lines`(갱신 전)로 계산한 값이다.
갱신된 `lines` 로 계산한 새 레벨은 **그 다음 줄 제거부터** 적용된다.

| `state.lines` | 지운 줄 | 직전 레벨 | 가산 점수 | 새 `lines` | 새 레벨 |
|--------------:|--------:|----------:|----------:|-----------:|--------:|
| 0 | 1 | 1 | 100 | 1 | 1 |
| 9 | 1 | 1 | **100** | 10 | 2 |
| 10 | 1 | 2 | **200** | 11 | 2 |
| 19 | 2 | 2 | **600** | 21 | 3 |
| 20 | 2 | 3 | **900** | 22 | 3 |
| 9 | 4 | 1 | 800 | 13 | 2 |

배수는 정확히 **한 번** 곱한다. `scoreForLines` 가 이미 표를 봤으므로 그 결과에 레벨만 곱한다.
기본 점수표 `SCORE_TABLE` 은 바꾸지 않는다.

### 4.5 `main.js` — 타이머

`SPEC_01 §4.7·§4.8` 의 규정은 유지하고 간격 결정만 바뀐다.

- 낙하 타이머를 만들 때 넘기는 간격은 **`dropIntervalForLevel(levelForLines(appState.lines))`** 다.
- `getDropStats().intervalMs` 는 마지막으로 타이머를 만들 때 실제로 넘긴 그 값이다.
- **레벨이 바뀌면 타이머를 다시 건다.** `commit` 이 새 상태를 받았을 때 `levelForLines` 가
  이전과 다르고 `status` 가 `PLAYING` 이면, 기존 타이머를 정지하고 새 간격으로 하나만 다시 만든다.
  레벨이 같으면 타이머를 건드리지 않는다.
- 재시작(`startGame`)과 `loadState` 는 그 상태의 `lines` 로 간격을 계산해 타이머를 하나 건다.
- 어느 시점에도 `getActiveDropTimerCount()` 는 `0` 또는 `1` 이다.
- `tick()` 한 번은 `applyMove(state, 1, 0)` 한 번이다 — 한 tick 에 한 칸.

`render` 는 `[data-role="level"]` 에 `levelForLines(state.lines)` 를 쓴다.

## 5. 범위 밖

- NEXT 블록, 다음 블록 미리보기, 홀드
- 일시정지, `PAUSED` 상태 사용
- 소프트 드롭 점수, 하드 드롭 점수, 하드 드롭 기능 자체
- 새로운 블록 종류, 새로운 점수 기본값, 새로운 줄 제거 점수표
- 콤보, 백투백, 레벨 보너스, 레벨별 블록 변화
- `state` 에 `level` 키 추가
- 새 게임 모드, 온라인, 서버

이번 SPEC 의 범위는 **레벨 계산 · 낙하 간격 · 줄 점수 배수** 셋이다.

## 6. 완료 조건

전 항목이 관측 가능해야 한다. 판정 경로는 이렇게 갈린다.

| 조건 | 판정 경로 |
|------|-----------|
| 6-1 · 6-2 | 파일시스템 (`ls` · `grep`) |
| 6-3 | 브라우저 콘솔 — **사람** |
| 6-4 | §7 러너 출력 (`test.html`) — Node 또는 사람 |
| 6-5 ~ 6-20 | 공개 함수 호출 · `loadState` · `tick()` · 합성 이벤트 · DOM 텍스트 — **Node 스텁으로 판정 가능** |
| §8 두 항목 | 사람 눈 |

시간에 기대는 조건이 없다. 낙하는 `TetrisApp.tick()` 으로 결정적으로 진행시키고,
간격은 실측하지 않고 `getDropStats().intervalMs` 값으로 본다.
6-3 만 사람 몫이며 루프의 종합 판정에서 **제외**한다 — 사람이 마지막에 한 번 본다 (§11).

### 6.0 검증이 쓰는 준비물

```js
const G = TetrisGame;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const verticalI = () => ({ type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
const down = () => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
// 한 줄 완성 직전 보드 (19행 열 0~8) 에 lines 를 심어 놓고 ↓ 한 번으로 한 줄을 지운다
const oneLineAt = (lines, score) => {
  TetrisApp.loadState({ board: fill(G.createEmptyBoard(), 19, 0, 8, 'O'), piece: verticalI(),
                        score: score || 0, lines, status: 'PLAYING' });
  down();
};
// 두 줄 완성 직전 (18·19행 열 0~8)
const twoLinesAt = (lines, score) => {
  const b = G.createEmptyBoard(); fill(b, 18, 0, 8, 'O'); fill(b, 19, 0, 8, 'O');
  TetrisApp.loadState({ board: b, piece: verticalI(), score: score || 0, lines, status: 'PLAYING' });
  down();
};
const text = r => document.querySelector('[data-role="' + r + '"]').textContent;
```

### 위생

- [ ] **6-1** 산출물 파일 집합이 `SPEC_00 §2.1` 의 여섯 개와 정확히 일치한다 (하네스 파일 제외).
      하네스 파일은 `CLAUDE.md` · `MEMORY.md` · `SPEC_*.md` · `docs/` · `.claude/` · `.loop/` ·
      `.git/` · `.gitignore` 이며 세지 않는다.
- [ ] **6-2** `package.json`, lockfile, `node_modules/`, 번들러·TS 설정 파일이 없고,
      두 HTML 의 외부 URL 참조가 0건이며, 산출물 grep 에 `fetch(`·`XMLHttpRequest`·`WebSocket`·
      `sendBeacon` 이 0건이다.
- [ ] **6-3** `index.html` 로드 완료 후 5초, 그리고 레벨 전환(6-13)을 한 번 일으킨 뒤 5초까지
      **페이지가 만든** 콘솔 error 레벨 0건이다. 확장 주입 예외는 세지 않는다 (`SPEC_01 §6` 6-3 기준).
- [ ] **6-4** `test.html` 요약이 `FAIL 0` 이고 `PASS` 가 **126 이상**이며,
      §7.3 의 필수 테스트 이름 20개와 §7.2 가 유지를 요구하는 106개가 전부 결과 목록에 있다.

### 그룹 A — 레벨 계산 (6-5 ~ 6-6)

- [ ] **6-5** `levelForLines` 가 `0·9·10·19·20` 에 대해 각각 `1·1·2·2·3` 을 반환한다.
      **Given** `lines` 다섯 값 · **When** `levelForLines` 호출 · **Then** 표와 일치.
- [ ] **6-6** `levelForLines` 가 `29·30·99·100` 에 대해 각각 `3·4·10·11` 을 반환하고,
      `-1`·`1.5`·`'10'`·`null` 에 대해 `1` 을 반환한다.

### 그룹 B — 낙하 간격 (6-7 ~ 6-9)

- [ ] **6-7** `dropIntervalForLevel` 이 `1·2·3·4·5` 에 대해 각각 `700·640·580·520·460` 을 반환한다.
- [ ] **6-8** `dropIntervalForLevel` 이 `11·12·20·100·1000` 에 대해 **전부 `100`** 을 반환한다.
      (12 부터 계산값이 100 미만이 되며, 12·20·100·1000 이 하한에 걸린다. 11 은 계산값이 정확히 100.)
- [ ] **6-9** `dropIntervalForLevel(1) === TetrisGame.DROP_INTERVAL_MS === 700` 이다.

### 그룹 C — 점수 배수 (6-10 ~ 6-12)

- [ ] **6-10** `oneLineAt(0, 0)` 후 `[data-role="score"]` 가 `100`,
      `oneLineAt(10, 0)` 후 `200`, `oneLineAt(20, 0)` 후 `300` 이다
      (같은 한 줄 제거가 레벨 1·2·3 에서 100·200·300 — 배수가 정확히 한 번 곱해진다).
- [ ] **6-11** 레벨 경계에서 **직전 레벨**이 곱해진다.
      `oneLineAt(9, 0)` 후 `score`=`100`(레벨 1 배수) 이고 `lines`=`10`, `[data-role="level"]`=`2`.
      `twoLinesAt(19, 0)` 후 `score`=`600`(300 × 레벨 2) 이고 `lines`=`21`, `level`=`3`.
      `twoLinesAt(20, 0)` 후 `score`=`900`(300 × 레벨 3).
- [ ] **6-12** 줄 제거 이외의 경로로 점수가 오르지 않는다.
      `loadState` 로 빈 보드 + `createPiece('T')` + `score: 0` + `lines: 25`(레벨 3) 를 넣고
      `ArrowDown`·`ArrowLeft`·`ArrowRight`·`ArrowUp` 을 각 3회 넣은 뒤 `[data-role="score"]` 가 `0` 이다.
      (드롭 점수가 없으므로 레벨 배수가 붙을 대상도 없다 — §2.1)

### 그룹 D — 레벨 전환과 타이머 (6-13 ~ 6-17)

- [ ] **6-13** `oneLineAt(9, 0)` 후 `[data-role="level"]` 이 `2`,
      `getDropStats().intervalMs` 가 `640`, `getActiveDropTimerCount()` 가 `1` 이다.
      **Given** `lines` 9 · **When** 한 줄 제거 · **Then** 레벨 2, 간격 640, 타이머 1.
- [ ] **6-14** `oneLineAt(19, 0)` 후 `[data-role="level"]` 이 `3`,
      `getDropStats().intervalMs` 가 `580`, `getActiveDropTimerCount()` 가 `1` 이다.
- [ ] **6-15** 레벨이 바뀌지 않는 줄 제거는 간격을 바꾸지 않는다.
      `oneLineAt(0, 0)` 후 `intervalMs` 가 `700` 그대로이고 `level` 이 `1` 이다.
- [ ] **6-16** 레벨을 연속으로 세 번 바꿔도 타이머는 하나다.
      `oneLineAt(9)` → `oneLineAt(19)` → `oneLineAt(29)` 를 차례로 하면
      마지막에 `getActiveDropTimerCount()` 가 `1`, `intervalMs` 가 `520`(레벨 4) 이다.
- [ ] **6-17** 레벨 전환 직후 `TetrisApp.tick()` 한 번에 현재 블록이 정확히 한 칸 내려간다.
      `oneLineAt(9, 0)` 후 새 블록의 점유 행 최소값을 기록 → `tick()` 1회 → 최소값이 정확히 `+1`,
      `getDropStats().count` 가 정확히 `+1`.

### 그룹 E — 재시작과 표시 (6-18 ~ 6-20)

- [ ] **6-18** **Given** `loadState` 로 `{ board: 빈 보드, piece: null, score: 0, lines: 37, status: 'GAME_OVER' }`
      를 넣는다 (`[data-role="level"]` 이 `4`, `getActiveDropTimerCount()` 가 `0` 인 것을 먼저 확인).
      **When** `[data-role="start"]` 를 클릭한다.
      **Then** `[data-role="lines"]`=`0`, `[data-role="level"]`=`1`, `getDropStats().intervalMs`=`700`,
      `getActiveDropTimerCount()`=`1`, `[data-role="status"]`=`PLAYING` 이다.
      (`GAME_OVER` 상태를 직접 주입하는 이유: `PLAYING` 중 `시작` 클릭은 무시되므로 재시작 경로를
      타려면 `GAME_OVER` 에서 눌러야 한다.)
- [ ] **6-19** 로드 직후 `READY` 에서 `[data-role="level"]` 이 `1` 이고,
      `[data-role="level"]` 의 앞 형제 `.label` 텍스트가 `레벨` 이며,
      그 `.stat` 이 `게임 상태` 줄의 바로 다음 형제다.
- [ ] **6-20** `[data-role="level"]` 은 항상 `levelForLines(lines 표시값)` 과 같다.
      `loadState` 로 `lines` 를 `0·9·10·25·100` 으로 바꿔 넣을 때마다
      `Number(text('level')) === G.levelForLines(Number(text('lines')))` 다.

## 7. 자동 검증

### 7.1 러너 출력 형식

`SPEC_00 §7.1` 과 같다.

```html
<div id="test-summary" data-pass="126" data-fail="0">PASS 126 / FAIL 0</div>
<ul id="test-results">
  <li data-name="level-for-lines-boundaries" data-result="pass">0·9·10·19·20 이 1·1·2·2·3 이다</li>
</ul>
```

### 7.2 유지·폐기

기존 106개를 **전부 유지**한다. 폐기하는 테스트는 없다.

- `drop-interval-700` — 상수 `DROP_INTERVAL_MS === 700` 은 여전히 참이다 (레벨 1 의 값).
- `lock-and-advance-adds-score` — `lines` 0 전제라 레벨 1 배수. 값이 바뀌지 않는다.
- `initial-state-keys-five` — `state` 에 `level` 을 넣지 않으므로 그대로 참이다.

### 7.3 이번 SPEC 의 필수 테스트

아래 20개는 **`data-name` 이 정확히 이 값이어야** 한다. 더 추가하는 것은 자유다.

| `data-name` | 확인 내용 |
|-------------|-----------|
| `api-surface-spec04` | `levelForLines`·`dropIntervalForLevel` 이 함수다 |
| `level-for-lines-boundaries` | `0·9·10·19·20` → `1·1·2·2·3` |
| `level-for-lines-higher` | `29·30·99·100` → `3·4·10·11` |
| `level-for-lines-invalid` | `-1`·`1.5`·`'10'`·`null`·`undefined` → 전부 `1` |
| `level-for-lines-formula` | `0`~`50` 전 구간에서 `Math.floor(n/10)+1` 과 일치 |
| `drop-interval-levels-1-to-5` | `1·2·3·4·5` → `700·640·580·520·460` |
| `drop-interval-level-11-exact-100` | `11` → `100` (계산값이 정확히 100) |
| `drop-interval-floor-100` | `12·20·100·1000` → 전부 `100` |
| `drop-interval-never-below-100` | `1`~`200` 전 구간에서 결과 `>= 100` |
| `drop-interval-invalid` | `0`·`-1`·`1.5`·`'2'`·`null` → 전부 `700` |
| `drop-interval-level-1-equals-constant` | `dropIntervalForLevel(1) === DROP_INTERVAL_MS` |
| `lock-and-advance-multiplies-by-level` | `lines` 0·10·20 에서 한 줄 제거 → 가산 `100·200·300` |
| `lock-and-advance-uses-level-before-clear` | `lines` 9 에서 한 줄 → `+100`(레벨 1), 결과 `lines` 10 |
| `lock-and-advance-boundary-19-to-21` | `lines` 19 에서 두 줄 → `+600`(300×2), 결과 `lines` 21 |
| `lock-and-advance-boundary-20` | `lines` 20 에서 두 줄 → `+900`(300×3) |
| `lock-and-advance-multiplier-once` | `lines` 10 에서 한 줄 → 정확히 `200` (`400` 이 아니다) |
| `lock-and-advance-four-lines-at-9` | `lines` 9 에서 네 줄 → `+800`(800×1), 결과 `lines` 13 |
| `move-and-rotate-do-not-score` | `lines` 25 인 상태에서 `applyMove` 좌·우·아래, `applyRotate` 후 `score` 불변 |
| `start-game-resets-lines-to-zero` | `lines` 37 인 상태에서 `startGame` → `lines` 0, `levelForLines` 1 |
| `score-table-unchanged` | `SCORE_TABLE` 이 여전히 `[0,100,300,500,800]` |

필수 이름 합계는 유지 106 + 신규 20 = **126개**다.

## 8. 수동 검증

1. 실제로 플레이해 10줄을 지웠을 때 패널의 레벨이 `2` 로 바뀌고 블록이 눈에 띄게 빨라지는지 본다.
2. 재시작하면 레벨이 `1` 로 돌아오고 속도가 원래대로인지 본다.

## 9. 안전과 정지 조건

- 프로젝트 폴더(`/home/al-hub/workspace/tetris-loop`) 밖 파일을 만들거나 수정하거나 삭제하지 않는다.
- OS 나 브라우저의 전역 설정을 바꾸지 않는다.
- 외부 라이브러리·프레임워크·번들러·패키지 매니저를 추가하지 않는다.
- 레벨 공식과 낙하 간격 공식을 바꾸지 않는다. 간격을 100ms 미만으로 만들지 않는다.
- 줄 제거 점수 이외에 레벨 배수를 적용하지 않는다. 드롭 점수·하드 드롭 기능을 만들지 않는다.
- 선행 정의가 없는 기본 점수 값을 추가하지 않는다. `SCORE_TABLE` 을 바꾸지 않는다.
- 레벨 변경 때 이전 타이머를 남겨 두지 않는다.
- 테스트 통과만을 위한 분기나 하드코딩을 넣지 않는다. 테스트용으로 게임 로직을 복제하지 않는다.
- 이번 SPEC 과 관계없는 UI·게임 기능을 바꾸지 않는다.
- **루프 반복을 3회** (frontmatter `max_iterations`) 소진하거나 같은 실패 시그니처가 두 번
  기록되면 중단한다. 한 iteration 은 "구현·수정 → **전체** 자동 검증 → 판정" 이다.
  실패한 테스트만 다시 돌리고 끝내지 않는다. 3회 뒤에도 실패가 남으면 테스트 삭제·기대값 변경·
  요구 완화·우회 코드 없이, 전체 검증 수·통과 수·실패 수·실패 항목·기대·실제·원인·마지막 수정
  내용을 리포트에 적고 `HALTED` 로 끝낸다.
- 이 문서에 없는 화면·기술 결정을 해야 하면 추측하지 않고 `[사람 확인 필요]` 로 보고한다.

## 10. 다음 단계로 넘기는 것

| 항목 | 넘기는 이유 |
|------|-------------|
| NEXT 블록 미리보기 | 생성 순서 계약이 독립적인 SPEC 을 이룬다 |
| 일시정지 (`PAUSED`) | 타이머 정지·재개와 예약 tick 처리를 따로 다뤄야 한다 |
| 소프트·하드 드롭 점수 | 이 프로젝트에 드롭 점수가 없다. 하드 드롭 SPEC 이 생기면 "배수 미적용" 을 그 SPEC 이 가져간다 |
| 콤보·백투백 | 기본 배수가 고정된 뒤에 얹는다 |
| 레벨 표시 강조·애니메이션 | 이번 범위는 값 표시까지다 |

## 11. 해석 고정 근거 (revision 1)

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| SPEC 번호 | `SPEC_04` (요구사항의 `04-01` 대신) | 하네스가 `SPEC_NN` 두 자리를 전제한다 — 커밋 접두사·`progress.json` 키·스킬 문서 전부. NEXT·일시정지는 다음 번호로 간다 |
| 레벨을 어디에 두나 | `state` 키로 두지 않고 `lines` 에서 파생 | 저장하면 `lines` 와 어긋날 수 있는 값이 하나 는다. 파생이면 갱신 누락이 원리적으로 불가능하고 SPEC_02·03 의 5키 테스트가 그대로 산다 |
| 배수에 쓰는 레벨 | 제거 **직전** 레벨 (`state.lines` 기준) | 요구사항 §7 이 정했다. SPEC_03 에 기준이 없으므로 그대로 채택. 10번째 줄은 레벨 1 로 계산되고 11번째부터 레벨 2 |
| 100ms 하한 관측 | 레벨 `12·20·100·1000` 을 직접 넣는다 | 12 가 계산값이 처음 100 미만이 되는 레벨(40). 11 은 정확히 100 이라 하한 없이도 100 이므로 따로 확인한다 |
| `DROP_INTERVAL_MS` 상수 | 남긴다. `dropIntervalForLevel(1)` 과 같음을 조건으로 둔다 | SPEC_01 의 `drop-interval-700` 테스트를 폐기하지 않아도 되고, "700 은 레벨 1 의 값" 이라는 관계가 코드에 남는다 |
| SPEC_01 6-9c 폐기 | `intervalMs === 700` 은 레벨 1 에서만 참 | 6-13·6-14 가 레벨별 간격으로 이어받는다 |
| 드롭 점수 | 만들지 않는다. "줄 제거 외 점수 경로 없음" 을 6-12 로 관측 | 요구사항 §10 자신이 "선행 정의가 없으면 발명하지 말라" 고 했다. 배수 미적용을 직접 검증할 대상이 없으므로 그 부재를 조건으로 바꿨다 |
| 타이머 재설정 시점 | `commit` 에서 레벨이 바뀌었을 때만 | 매 tick 마다 다시 걸면 간격이 리셋돼 실제 낙하가 느려진다. 레벨이 같으면 건드리지 않는다 |
| 검증용 보드 | SPEC_02 의 (가)·(나)에 `lines` 만 심는다 | 한 줄·두 줄 제거를 결정적으로 만들 수 있고 `loadState` 가 이미 있다 |
| 판정 채널 | 6-3(콘솔)만 사람, 나머지는 Node | 시간 의존 조건이 없어 `tick()` 과 `intervalMs` 값으로 전부 결정적으로 관측된다. 그래야 루프가 `FAILED → 수정 → 재검증` 을 스스로 돌 수 있다. 사람은 마지막에 콘솔과 §8 을 한 번 본다 |
| 화면 | 패널에 `레벨` 한 줄 추가, `게임 상태` 다음 | 사람이 레벨 변화를 볼 수 있어야 §8 이 의미를 갖는다. 기존 `.stat` 구조를 그대로 써서 변경이 한 줄이다 |
| 필수 테스트 | 20개 신설, 폐기 0 | 기존 106개가 전부 그대로 참이다 — 상수·5키·레벨 1 전제 어느 것도 깨지지 않는다 |
