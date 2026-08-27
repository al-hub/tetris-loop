---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 브라우저 검증 게이트

**이 스킬의 유일한 일은 관측이다.** 코드를 고치지 않는다. 상태 파일을 쓰지 않는다.
발견한 문제를 고치고 싶어도 고치지 않는다 — 판정과 수정이 같은 손에 있으면 게이트가 무의미해진다.

호출자에게 항목별 표를 돌려주는 것으로 끝난다.

현재 대상은 **SPEC_02 revision 1 (`SPEC_02_LOCK_AND_CLEAR.md`)** 이다.

## 판정 규칙

| 값 | 의미 |
|----|------|
| `PASS` | 브라우저/파일시스템에서 **직접 관측**해 조건을 만족함 |
| `FAIL` | 직접 관측해 조건을 만족하지 못함 |
| `BLOCKED` | 관측 자체를 못 함 (도구 없음, 페이지 로드 실패, 요소를 찾을 수 없음) |

**관측하지 못한 것을 `PASS` 로 적지 않는다.** 코드를 읽어서 "이렇게 되어 있으니 될 것" 은
`PASS` 가 아니다. 근거 열에는 추론이 아니라 실제로 본 값을 적는다.

## 단계 0 — 도구 확인

브라우저 도구(페이지 열기 · DOM 조회 · 콘솔 읽기 · JS 실행)가 없으면
아래를 반환하고 즉시 끝낸다.

```
전 항목 BLOCKED
사유: 브라우저 도구 없음. `claude --chrome` 으로 세션을 다시 열어야 검증 가능.
```

도구가 목록에 있어도 `list_connected_browsers` 가 `[]` 면 확장이 붙지 않은 것이다.
이때도 전 항목 `BLOCKED` 이고 사유에 "Chrome 확장 미연결" 을 적는다.

파일시스템만으로 되는 항목(6-1·6-2)도 이때는 판정하지 않는다.
부분 판정은 "일부 통과" 라는 잘못된 인상을 만든다.

## 단계 0.5 — 관측 채널

### 정적 서버 경유

**확장이 `file://` 스킴을 거부한다** (`Can't interact with browser-internal or unparseable URLs`).

```bash
python3 -m http.server 8123 --bind 127.0.0.1   # 프로젝트 루트에서, 백그라운드
```

`http://localhost:8123/index.html` · `http://localhost:8123/test.html` 로 관측하고
**검증이 끝나면 서버를 종료한다.** SPEC §2 의 `file://` 조항은 판정 대상이 아니다.

### 입력은 합성 디스패치로 넣는다

**`computer` 의 `key`·`left_click` 을 필수 조건에 쓰지 않는다.** 창이 최소화·가려짐이면
도구가 "Clicked" 를 보고하면서 이벤트가 사라진다.

```js
window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', cancelable: true, bubbles: true}));
document.querySelector('[data-role="start"]').click();
```

### 타이머 억제를 전제로 둔다

숨은 탭에서 `setInterval` 이 1000ms 로 조인다. **5분 넘게 숨어 있던 탭은 0회까지 떨어진다** —
6-19 는 반드시 **페이지를 새로 로드한 직후**에 잰다. 평균 간격은 하한(630ms)만 본다.
페이지 안 대기는 긴 `sleep` 한 번으로 한다. 짧은 폴링 루프는 CDP 45초 타임아웃을 낸다
(`setTimeout` 도 1000ms 로 조여지기 때문).

### 검증용 보드 (SPEC_02 §6.0)

좌표를 바꾸면 기대값이 달라진다. 그대로 쓴다.

```js
const G = TetrisGame;
const fill = (b, row, from, to, t) => { for (let c = from; c <= to; c += 1) b[row][c] = t; return b; };
const verticalI = { type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 };  // 열 9, 행 16~19

const A = {...G.createInitialState(), status: 'PLAYING', piece: verticalI,
           board: fill(G.createEmptyBoard(), 19, 0, 8, 'O')};                       // 한 줄 완성 직전
const B = (() => { const b = G.createEmptyBoard(); fill(b, 18, 0, 8, 'O'); fill(b, 19, 0, 8, 'O');
                   return {...G.createInitialState(), status: 'PLAYING', piece: verticalI, board: b}; })();
const C = (() => { const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b, r, 0, 8, 'O'));
                   return {...G.createInitialState(), status: 'PLAYING', piece: verticalI, board: b}; })();
```

`TetrisApp.loadState(state)` 로 넣는다. (다)는 **열 0~8 까지만** 채운다 — 10칸을 다 채우면
완성 줄로 판정돼 제거되고 게임오버가 나지 않는다.

점유 좌표는 `[data-piece]` 셀의 부모 행 인덱스와 행 안 인덱스로 읽는다.

## 단계 1 — 정적 검사 (파일시스템)

프로젝트 루트: `/home/al-hub/workspace/tetris-loop`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-1 | 산출물 집합 일치 | `ls -a` — 여섯 개 정확히. 하네스 파일(`CLAUDE.md` `MEMORY.md` `SPEC_*.md` `docs/` `.claude/` `.loop/` `.git/` `.gitignore`)은 세지 않는다 |
| 6-2 | 설치·외부참조 없음 | `package.json` · lockfile · `node_modules/` · 번들러/TS 설정 부재. 두 HTML grep 해 `http://` `https://` `//cdn` 0건 |

## 단계 2 — 브라우저 검사

### 2a. `test.html`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-5 | 테스트 통과 | `data-fail`=`0`, `data-pass` ≥ `78`. SPEC_02 §7.3 의 31개 + SPEC_00 §7.2 의 18개 + SPEC_01 유지 29개가 전부 있고, **폐기 4개**(`apply-move-down-lands`·`apply-move-ignored-when-landed`·`apply-rotate-ignored-when-landed`·`landed-board-all-zero`)는 **없어야** 한다 |

실패한 `<li>` 가 있으면 텍스트를 그대로 근거에 옮긴다.

### 2b. 로드 직후 (`index.html`, 입력 없음)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-3 | 콘솔 오류 없음 | 트래킹을 `clear: true` 로 비우고 다시 로드. 로드 후 5초, `시작` 후 5초까지 **페이지가 만든** error 0건. 확장 주입 예외(`A listener indicated an asynchronous response…`)는 세지 않는다 — 출처 `:0:0`, `test.html` 에서도 같은 문구, 산출물 grep 에 `chrome.*`·`sendMessage`·`async` 0건을 근거로 적는다 |
| 6-4 | 초기 정지 상태 | `status`=`READY`, `[data-piece]` 0개, `score`=`0`, `lines`=`0`, 셀 200개, `getActiveDropTimerCount()`=`0`, `getDropStats().count`=`0` |

### 2c. 렌더 합성

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-6 | 고정 + 현재 블록 | 19행 열 0~2 를 `'O'` 로 고정하고 `piece`=`createPiece('T')` 인 상태를 `loadState` → `[data-piece]` 셀 **정확히 7개**, 좌표 집합이 `{(19,0),(19,1),(19,2)}` ∪ `T` 점유 4칸 |

### 2d. 줄 제거

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-7 | 한 줄 제거 | 보드 (가) `loadState` → `ArrowDown` 1회 → `lines`=`1`, `status`=`PLAYING`, `[data-piece]` 7개(고정 3: 열 9 행 `{17,18,19}` + 새 블록 4) |
| 6-8 | 두 줄 동시 제거 | 보드 (나) `loadState` → `ArrowDown` 1회 → `lines`=`2` |
| 6-9 | 압축 결과 | 6-8 직후 열 9 의 고정 셀이 정확히 2개, 행 `{18,19}` |
| 6-10 | `LANDED` 미노출 | 6-7·6-8 어느 경우에도 `[data-role="status"]` 가 `LANDED` 로 관측되지 않는다. 착지 직후 값은 `PLAYING` 또는 `GAME_OVER` |
| 6-15 | 입력당 한 번 | 보드 (가)에서 `ArrowDown` 1회 → `lines` 증가량 정확히 `1`, `[data-piece]` 7개, 그중 행 `≤ 3` 인 셀이 정확히 4개 (두 번 돌았으면 8개이거나 `lines`=2) |

### 2e. 게임오버

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-11 | 전이 | 보드 (다) `loadState` → `ArrowDown` 1회 → `status`=`GAME_OVER`, `getActiveDropTimerCount()`=`0`, `lines`=`0` |
| 6-12 | 입력 무시 | 좌표·`lines`·`status`·`getDropStats().count` 스냅샷 → 네 방향키 → 전부 동일 |
| 6-13 | 예약 tick 무해 | 6-12 의 네 값 스냅샷 → 2450ms 대기 → 전부 동일 |
| 6-14 | `tick()` 직접 호출 무해 | `TetrisApp.tick()` 3회 → 네 값 전부 동일 |

### 2f. 고정 셀 충돌

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-16 | 이동 차단 | `board[1][2]='O'`, `piece`=`createPiece('I')` 상태 `loadState` → `ArrowLeft` → `[data-piece]` 좌표 집합 불변 |
| 6-17 | 회전 차단 | `board[2][4]='O'`, `piece`=`createPiece('T')` 상태 `loadState` → `ArrowUp` → 좌표 집합 불변 |

### 2g. 재시작과 버튼

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-18 | 재시작 초기화 | `GAME_OVER` 에서 `버튼.click()` → `status`=`PLAYING`, `[data-piece]` 정확히 4개(고정 0), `lines`=`0`, `score`=`0`, 타이머 `1` |
| 6-19 | 타이머 하나 | **새 로드 직후** `GAME_OVER` → `시작` 두 번 반복 → 타이머 `1`, 2450ms 대기 시 평균 간격 `(Δlast)/(Δcount)` ≥630ms. `Δcount`=`0` 이면 `BLOCKED` |
| 6-20 | 버튼·안내 문구 | `READY`·`PLAYING`·`GAME_OVER` 세 상태에서 `[data-role="start"]` 텍스트가 `시작`, `[data-role="controls"]` 가 아래와 문자 단위로 일치<br>`← → ↓ 이동 · ↑ 회전 · Space 하드 드롭 · P 일시정지` |

### 2h. 선택 관측 — 판정에 넣지 않는다

`document.visibilityState === 'visible'` 이고 실제 키·클릭이 `isTrusted: true` 로 도달할 때만
시도한다. 실패하면 조용히 넘어간다 — **`FAIL` 로 적지 않는다.**

## 반환 형식

```markdown
## 검증 결과 — SPEC_02

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | ls 결과 정확히 6개 |
| 6-8 | 두 줄 동시 제거 | FAIL | lines 가 1 (한 줄씩 제거로 보임) |
...

- 종합: PASS 18 / FAIL 1 / BLOCKED 1
- 판정: FAILED
- 실패 시그니처: `game.js:sequential-row-clear`
- 선택 관측: 건너뜀 (visibilityState=hidden)
```

종합 판정 규칙: `BLOCKED` 이 하나라도 있으면 `BLOCKED`. 아니면 `FAIL` 이 하나라도 있으면 `FAILED`.
전부 `PASS` 여야 `PASSED`. 선택 관측은 종합 판정에 넣지 않는다.

실패 시그니처는 **정규화된 짧은 문자열**이어야 한다 (`<파일>:<증상>`, 타임스탬프·가변 수치 금지).
