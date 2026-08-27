---
id: SPEC_06
title: 일시정지
revision: 1
depends_on: [SPEC_00, SPEC_01, SPEC_02, SPEC_03, SPEC_04, SPEC_05]
max_iterations: 3
---

# SPEC 06 — 일시정지

## 1. 목표

`PLAYING` 중 `P` 를 누르면 `PAUSED` 가 되어 시간 진행과 조작만 멈추고 게임 상태는 그대로 남는다.
다시 `P` 를 누르면 `PLAYING` 으로 돌아와 현재 레벨의 간격으로 자동 낙하가 재개된다.
`READY`·`GAME_OVER` 에서 `P` 는 아무 것도 하지 않는다. 몇 번을 멈추고 재개해도 활성 타이머는 하나다.

메뉴·저장·통계·드롭 기능은 이번 단계에 없다 (§5).

## 2. 기술과 파일 구조

`SPEC_00 §2` 와 같다. 산출물은 여섯 개 그대로다.

이번 SPEC 이 **앞 SPEC 을 덮어쓰는 지점**은 넷이다.

| 앞 조항 | 이번 SPEC 에서 |
|---------|----------------|
| SPEC_00 §4.2 "`PAUSED` 는 정의만 하고 참조하지 않는다" | **폐기.** `state.status` 값으로 실제 사용한다 |
| SPEC_01 §3.4 "`PLAYING` 이 아닐 때는 `preventDefault` 를 호출하지 않는다" | **완화.** `PLAYING` 과 `PAUSED` 둘 다 방향키·`P` 에 호출한다. `READY`·`GAME_OVER` 는 그대로 호출하지 않는다 (§3.3) |
| SPEC_02 §3.3 / SPEC_03 §3.3 버튼 표 (`READY`·`PLAYING`·`GAME_OVER` 세 행) | **확장.** `PAUSED` 행 추가 — 클릭 무시 (§3.2) |
| SPEC_01 §4.7 "`PLAYING` 진입 시 타이머를 만들고 `LANDED` 로 바뀌는 즉시 정지" | **일반화.** `status` 가 `PLAYING` 이 아니게 되면 정지, `PLAYING` 이 되면 하나만 시작 (§4.4) |

`PAUSED` 는 `SPEC_00 §4.2` 의 `GAME_STATUS` 에 이미 있는 값이다. 상태 키를 늘리지 않는다.
드롭 기능은 이 프로젝트에 없으므로(SPEC_03·04 §2.1) "PAUSED 중 드롭 무시" 는 대상이 없다.
이번 SPEC 은 존재하는 조작(←·→·↓·↑·자동 낙하·`시작` 클릭)만 다룬다.

## 3. 화면 정의

### 3.1 상태 패널

`[data-role="status"]` 가 `state.status` 를 그대로 보이므로 `PAUSED` 가 표시된다. 다른 화면 요소는 바뀌지 않는다.
`score`·`lines`·`level`·NEXT 격자·보드는 `PAUSED` 진입 직전 값을 그대로 그린다.

### 3.2 버튼

`[data-role="start"]` 텍스트는 네 상태 모두 `시작` 이다.

| 클릭 시점 | 동작 |
|-----------|------|
| `READY` | 시작 |
| `PLAYING` | 무시 |
| **`PAUSED`** | **무시** — 진행 중인 게임을 실수로 날리지 않는다 |
| `GAME_OVER` | 재시작 |

### 3.3 키와 기본 동작

| 키 | `READY` | `PLAYING` | `PAUSED` | `GAME_OVER` |
|----|---------|-----------|----------|-------------|
| `←` `→` `↓` `↑` | 무시, 기본 동작 유지 | 조작, `preventDefault` | **무시, `preventDefault`** | 무시, 기본 동작 유지 |
| `P` / `p` | 무시, 기본 동작 유지 | `PAUSED`, `preventDefault` | `PLAYING`, `preventDefault` | 무시, 기본 동작 유지 |

`P` 는 `event.key` 가 `'p'` 또는 `'P'` 인 `keydown` 이다. 다른 키(`Space` 등)는 이번 SPEC 이 다루지 않는다.

### 3.4 화면 문구

새 문구 없음. `PAUSED` 는 `GAME_STATUS` 값 문자열 그대로다.

## 4. 상태와 공개 함수

### 4.1 상태

`SPEC_05 §4.1` 과 같다 — 여섯 키. `status` 값으로 `'PAUSED'` 가 실제로 나타난다.

### 4.2 `togglePause(state)` — 순수 함수

| `state.status` | 반환 |
|----------------|------|
| `'PLAYING'` | `{...state, status: 'PAUSED'}` — 다른 다섯 키는 같은 참조 |
| `'PAUSED'` | `{...state, status: 'PLAYING'}` — 다른 다섯 키는 같은 참조 |
| 그 밖 (`READY`·`GAME_OVER`·`LANDED`·`null`) | **인자 `state` 그대로** (`===`) |

`board`·`piece`·`next`·`score`·`lines` 를 만들거나 복사하지 않는다. 상태만 바꾼다.

### 4.3 `PAUSED` 에서의 기존 함수

`applyMove`·`applyRotate`·`lockAndAdvance` 는 이미 `state.status !== 'PLAYING'` 이면 인자를 그대로 돌려준다
(SPEC_01·02·05). `PAUSED` 도 그 조건에 걸리므로 **게임 규칙 함수를 고치지 않는다.**
이번 SPEC 이 `game.js` 에 더하는 것은 `togglePause` 하나다.

### 4.4 `main.js` — 타이머 생명주기

타이머는 **`status` 전이에 따라** 하나만 산다.

| 전이 | 타이머 |
|------|--------|
| `→ PLAYING` (시작·재시작·재개·`loadState`) | 기존 정지 후 현재 레벨 간격으로 **하나** 시작 |
| `PLAYING → PLAYING` (레벨 변경) | 정지 후 새 간격으로 하나 (SPEC_04) |
| `PLAYING → PLAYING` (레벨 같음) | 건드리지 않음 |
| `→ PAUSED`·`→ GAME_OVER`·`→ READY` | 정지. `getActiveDropTimerCount()` `0` |

- `commit` 이 새 상태를 받았을 때: `status` 가 `PLAYING` 이 아니면 정지. `PLAYING` 이고
  (직전이 `PLAYING` 이 아니었거나 레벨이 바뀌었으면) 정지 후 하나 시작.
- 재개 간격은 `dropIntervalForLevel(levelForLines(state.lines))` — **저장된 레벨**. 700 으로 되돌리지 않는다.
- `tick()` 은 실행 시점에 `status !== 'PLAYING'` 이면 아무 것도 하지 않는다 (`count` 도 늘리지 않음).
  타이머 정지와 예약된 콜백 사이의 경합은 이 검사가 막는다.
- `onKeyDown`: `status` 가 `PLAYING`·`PAUSED` 일 때 `P`/`p` 에 `preventDefault` 후 `commit(togglePause(appState))`.
  방향키는 두 상태에서 `preventDefault` 하되 `PAUSED` 면 `commit` 하지 않는다.
- `onStartClick`: `status` 가 `PLAYING` **또는 `PAUSED`** 면 무시.
- `resetSaveState`·`captureGameOver` 는 바뀌지 않는다 — `PAUSED` 는 게임오버가 아니다.

## 5. 범위 밖

- 일시정지 메뉴·설정 화면·오버레이 배너
- 일시정지 중 블록 조작·NEXT 변경·게임 저장
- 일시정지 시간·횟수 통계
- 새 점수·레벨 규칙, 드롭 기능, 홀드, 새 게임 모드
- 서버·온라인

## 6. 완료 조건

| 조건 | 판정 경로 |
|------|-----------|
| 6-1 · 6-2 | 파일시스템 |
| 6-3 | 브라우저 콘솔 — **사람**, 종합 제외 |
| 6-4 | §7 러너 |
| 6-5 ~ 6-22 | 공개 함수 · `loadState` · 합성 `keydown` · `tick()` · `getActiveDropTimerCount()` · `getDropStats()` · DOM — **Node 로 판정** |
| §8 두 항목 | 사람 눈 |

시간 의존 조건 없음. "충분한 시간 경과" 는 `tick()` 직접 호출로 대체한다 — 타이머가 살아 있다면
콜백이 곧 `tick` 이고, 정지돼 있다면 관측할 것은 `getActiveDropTimerCount()` 다.

### 6.0 준비물

```js
const G = TetrisGame, App = TetrisApp;
const key = k => { const e = new KeyboardEvent('keydown', {key: k, cancelable: true, bubbles: true}); window.dispatchEvent(e); return e.defaultPrevented; };
const text = r => document.querySelector('[data-role="' + r + '"]').textContent;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const playing = (ex) => Object.assign({ board: G.createEmptyBoard(), piece: G.createPiece('T'), next: 'S', score: 0, lines: 0, status: 'PLAYING' }, ex || {});
// 관측용 스냅샷 — piece 좌표·회전·보드·점수·줄·레벨·NEXT
const snap = () => ({
  cells: [...document.querySelectorAll('[data-role="row"]')].flatMap((r, y) => [...r.children].map((c, x) => c.hasAttribute('data-piece') ? [y, x, c.getAttribute('data-piece')] : null).filter(Boolean)),
  score: text('score'), lines: text('lines'), level: text('level'), status: text('status'),
  next: [...document.querySelectorAll('[data-role="next-cell"]')].map((c, i) => c.hasAttribute('data-piece') ? i + c.getAttribute('data-piece') : '').join(','),
  count: App.getDropStats().count, timers: App.getActiveDropTimerCount()
});
```

### 위생

- [ ] **6-1** 산출물 여섯 개 (하네스 파일 `CLAUDE.md`·`MEMORY.md`·`SPEC_*.md`·`docs/`·`.claude/`·`.loop/`·`.git/`·`.gitignore` 제외).
- [ ] **6-2** 설치 산출물·외부 URL·`fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 0건.
- [ ] **6-3** 로드 5초 → `시작` → `P` → `P` → `P` → 5초. **페이지가 만든** 콘솔 error 0건 (확장 주입 제외).
- [ ] **6-4** `test.html` `FAIL 0`, `PASS` **166 이상**, §7.3 17개 + 유지 149개 전부 존재, 폐기 0.

### 그룹 A — 상태 전이 (6-5 ~ 6-8)

- [ ] **6-5** **Given** `PLAYING` **When** `togglePause` **Then** `status` `PAUSED`, `board`·`piece`·`next`·`score`·`lines` 가 **같은 참조**(`===`).
- [ ] **6-6** **Given** `PAUSED` **When** `togglePause` **Then** `status` `PLAYING`, 다른 다섯 키 같은 참조.
- [ ] **6-7** **Given** `READY`(`createInitialState()`) 와 `GAME_OVER` 각각 **When** `togglePause` **Then** 인자 그대로(`===`).
- [ ] **6-8** 브라우저 네 상태 각각 독립 준비 후 `P` 한 번: `READY`→`READY` · `PLAYING`→`PAUSED` · `PAUSED`→`PLAYING` · `GAME_OVER`→`GAME_OVER`. `READY`·`GAME_OVER` 에서 `P` 의 `defaultPrevented` 는 `false`, `PLAYING`·`PAUSED` 에서 `true`.

### 그룹 B — PAUSED 진입과 낙하 정지 (6-9 ~ 6-11)

- [ ] **6-9** `loadState(playing({lines: 25}))` → `snap()` → `P` **Then** `status` `PAUSED`, `getActiveDropTimerCount()` **0**, `cells` 동일 (P 자체가 블록을 움직이지 않는다).
- [ ] **6-10** `PAUSED` 에서 `App.tick()` 5회 **Then** `cells`·`count` 동일. (예약 콜백이 실행돼도 진행 없음 — tick 이 그 콜백이다.)
- [ ] **6-11** **Given** `PLAYING` 에서 `getActiveDropTimerCount()` 1 **When** `P` **Then** 0. 스텁 채널에서는 실제 등록된 타이머 수도 0.

### 그룹 C — PAUSED 중 입력 차단 (6-12 ~ 6-13)

- [ ] **6-12** `PAUSED` 에서 `←`·`→`·`↓`·`↑` 각 3회 **Then** `snap()` 전부 동일(`cells`·`score`·`lines`·`level`·`next`·`count`). 네 키의 `defaultPrevented` 는 **`true`**.
- [ ] **6-13** `PAUSED` 에서 `[data-role="start"].click()` **Then** `status` `PAUSED` 그대로, `cells`·`next` 동일, 타이머 0.

### 그룹 D — 보존과 재개 (6-14 ~ 6-18)

- [ ] **6-14** **Given** `loadState({board: 19행 열0~4 고정, piece: createPiece('J') 를 회전 1회 한 cells, next: 'Z', score: 700, lines: 23, status: 'PLAYING'})`
      **When** `P` → `←`·`→`·`↓`·`↑` → `tick()`×3 → `P` **Then** `snap()` 의 `cells`·`score` `700`·`lines` `23`·`level` `3`·`next`(Z 인덱스) 가 `P` 이전과 동일. `status` `PLAYING`.
- [ ] **6-15** 6-14 재개 직후 `getDropStats().intervalMs` **580** (레벨 3), `getActiveDropTimerCount()` **1**. 700 이 아니다.
- [ ] **6-16** **Given** `lines: 9`(레벨 1) 로 시작, `P`·`P` **Then** `intervalMs` 700. **Given** `lines: 37`(레벨 4) **Then** 520. 재개 간격은 저장된 레벨을 따른다.
- [ ] **6-17** 재개 후 `tick()` 1회 **Then** 점유 행 최소값 정확히 **+1**, `count` **+1**.
- [ ] **6-18** `PAUSED` 에서 `saveResult('민수')` **Then** `{ok:false, reason:'NOT_GAME_OVER'}`, 저장소 불변 — `PAUSED` 는 게임오버가 아니다.

### 그룹 E — 반복과 재시작 (6-19 ~ 6-22)

- [ ] **6-19** `P` 를 **8회**(4회 정지·4회 재개) **Then** `status` `PLAYING`, `getActiveDropTimerCount()` **1**, 스텁 채널에서 실제 등록 타이머 **1**.
- [ ] **6-20** `P` 를 **7회** **Then** `status` `PAUSED`, 타이머 **0**.
- [ ] **6-21** 6-19 뒤 `tick()` 1회 **Then** 최소 행 정확히 **+1**, `count` **+1** (중복 낙하 없음).
- [ ] **6-22** **Given** `PAUSED` 상태(`lines: 37`)를 `loadState` 로 넣고 게임오버로 보내 `GAME_OVER` 에서 `시작` 클릭
      — 절차: `loadState({...blockedTop, piece: verticalI, next:'T', lines: 37, status:'PLAYING'})` → `↓`(게임오버) → `시작`
      **Then** `status` `PLAYING`, `lines` `0`, `level` `1`, `intervalMs` 700, 타이머 **1**. 이전 게임의 `PAUSED` 나 타이머가 남지 않는다.

## 7. 자동 검증

### 7.1 러너 출력 형식

`SPEC_00 §7.1` 과 같다.

### 7.2 유지·폐기

기존 149개 **전부 유지**. 폐기 0.

### 7.3 이번 SPEC 의 필수 테스트 (17개)

| `data-name` | 확인 내용 |
|-------------|-----------|
| `api-surface-spec06` | `togglePause` 가 함수 |
| `toggle-pause-playing-to-paused` | `PLAYING` → `PAUSED` |
| `toggle-pause-paused-to-playing` | `PAUSED` → `PLAYING` |
| `toggle-pause-ready-identity` | `READY` → 인자 그대로 `===` |
| `toggle-pause-game-over-identity` | `GAME_OVER` → 인자 그대로 `===` |
| `toggle-pause-landed-identity` | `status: 'LANDED'` → 인자 그대로 (SPEC_00 의 예약 키) |
| `toggle-pause-null-identity` | `null`·`undefined` → 그대로 (던지지 않음) |
| `toggle-pause-keeps-references` | 전이 결과의 `board`·`piece`·`next`·`score`·`lines` 가 입력과 `===` |
| `toggle-pause-round-trip` | `P`·`P` 두 번 → `status` `PLAYING`, 다섯 키 참조 동일 |
| `apply-move-ignored-when-paused` | `PAUSED` 에 `applyMove` 좌·우·아래 → 인자 그대로 |
| `apply-rotate-ignored-when-paused` | `PAUSED` 에 `applyRotate` → 인자 그대로 |
| `lock-and-advance-ignored-when-paused` | `PAUSED` 에 `lockAndAdvance` → 인자 그대로, 공급자 0회 |
| `paused-keeps-level` | `PAUSED` 상태의 `levelForLines(lines)` 가 전이 전과 같다 |
| `paused-keeps-next` | 전이 결과 `next` 가 입력과 같다 |
| `game-status-has-paused` | `GAME_STATUS.PAUSED === 'PAUSED'`, 동결 유지, 키 5개 그대로 |
| `pause-does-not-touch-board` | 전이 전후 `board` 200칸 값 동일 |
| `start-game-from-paused-resets` | `PAUSED` 상태에 `startGame` → `PLAYING`, `lines` 0, 새 `piece`·`next` |

합계: 유지 149 + 신규 17 = **166**.

## 8. 수동 검증

1. 플레이 중 `P` 를 눌러 블록이 멈추고 패널이 `PAUSED` 로 바뀌는지, 방향키가 먹지 않는지, 다시 `P` 로 같은 자리에서 이어지는지 본다.
2. `P` 를 빠르게 여러 번 눌러도 재개 후 속도가 빨라지지 않는지 본다.

## 9. 안전과 정지 조건

- 프로젝트 폴더 밖 파일 금지. 전역 설정 변경 금지. 외부 라이브러리 금지.
- `READY` 에서 `P` 로 시작하지 않는다. `GAME_OVER` 에서 `P` 로 재개하지 않는다.
- `PAUSED` 중 낙하·이동·회전·고정·점수·줄·레벨·NEXT 변경 금지.
- 예약 tick 이 `PAUSED` 상태를 바꾸게 두지 않는다.
- 재개 시 기존 타이머와 새 타이머를 동시에 두지 않는다. 횟수만큼 누적하지 않는다.
- 재개 시 700 으로 되돌리지 않는다.
- 게임 로직 복제 금지. 드롭 기능을 만들지 않는다.
- **반복 3회**(`max_iterations`). iteration = 구현·수정 → 전체 검증 → 판정. 3회 후 실패면 삭제·완화·우회 없이
  전체·통과·실패 수, 실패 항목, 기대·실제, 원인, 마지막 수정을 리포트에 적고 `HALTED`.
- 없는 결정은 `[사람 확인 필요]`.

## 10. 다음 단계로 넘기는 것

| 항목 | 이유 |
|------|------|
| 일시정지 오버레이·메뉴 | 문구·위치·역할 계약이 새로 필요하다 |
| 하드 드롭·소프트 드롭 점수 | 그 SPEC 이 "PAUSED 중 드롭 무시" 도 함께 가져간다 |
| 홀드 | 독립 상태 |
| 무작위 공급자 | SPEC_05 §10 그대로 |

## 11. 해석 고정 근거 (revision 1)

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| 토글 위치 | `game.js` 순수 함수 `togglePause` | 상태표 4행이 순수 함수 테스트로 관측된다. `main.js` 는 `commit` 만 한다 |
| 다른 상태에서 `P` | 인자 그대로 `===` | 앞 SPEC 들의 거부 규약과 같다 — 테스트 한 줄로 판정 |
| `PAUSED` 중 방향키 `preventDefault` | 한다 | 일시정지 중 화면이 스크롤되면 사용자 입장에서 버그다. SPEC_01 6-13 은 `PLAYING` 만 검사해 충돌 없음 |
| `READY`·`GAME_OVER` 에서 `P` `preventDefault` | 안 한다 | 게임 밖에서 브라우저 기본 동작을 빼앗지 않는다 (SPEC_01 §3.4 정신 유지) |
| `PAUSED` 중 `시작` 클릭 | 무시 | `PLAYING` 과 같은 이유 — 실수로 게임을 날리지 않는다. 재시작은 `GAME_OVER` 에서만 |
| 화면 | 상태 패널 값만 | 요구사항 §5 가 메뉴·오버레이를 범위 밖에 뒀다 |
| "시간 경과" 관측 | `tick()` 직접 호출 + `getActiveDropTimerCount()` | 타이머 콜백이 곧 `tick` 이라 예약 콜백 실행을 결정적으로 재현한다. 실시간 대기는 숨은 탭에서 판정 불가 |
| 게임 규칙 함수 | 고치지 않음 | `applyMove`·`applyRotate`·`lockAndAdvance` 가 이미 `PLAYING` 아니면 거부 |
| 재개 간격 | `dropIntervalForLevel(levelForLines(lines))` | SPEC_04 가 이미 이렇게 정했다. 700 하드코딩 금지는 그 함수를 쓰면 자동 |
| 드롭 무시 조건 | 대상 없음 | 드롭 기능이 없다(SPEC_03·04 §2.1). 발명하지 않는다 |
| 6-3 | 사람, 종합 제외 | SPEC_04·05 와 같은 규정 |
| 필수 테스트 | 17 신설, 폐기 0 | 기존 149 전부 그대로 참 |
