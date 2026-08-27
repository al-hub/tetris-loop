---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 브라우저 검증 게이트

**이 스킬의 유일한 일은 관측이다.** 코드를 고치지 않는다. 상태 파일을 쓰지 않는다.
발견한 문제를 고치고 싶어도 고치지 않는다 — 판정과 수정이 같은 손에 있으면 게이트가 무의미해진다.

호출자에게 항목별 표를 돌려주는 것으로 끝난다.

현재 대상은 **SPEC_01 (`SPEC_01_FALLING_PIECE.md`)** 이다.

## 판정 규칙

| 값 | 의미 |
|----|------|
| `PASS` | 브라우저/파일시스템에서 **직접 관측**해 조건을 만족함 |
| `FAIL` | 직접 관측해 조건을 만족하지 못함 |
| `BLOCKED` | 관측 자체를 못 함 (도구 없음, 페이지 로드 실패, 요소를 찾을 수 없음) |

**관측하지 못한 것을 `PASS` 로 적지 않는다.** 코드를 읽어서 "이렇게 되어 있으니 될 것" 은
`PASS` 가 아니다. 근거 열에는 추론이 아니라 실제로 본 값을 적는다.

## 단계 0 — 도구 확인

브라우저 도구(페이지 열기 · DOM 조회 · 콘솔 읽기 · 키 입력 · 클릭)가 없으면
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

**확장이 `file://` 스킴을 거부한다** (`Can't interact with browser-internal or unparseable URLs`).
WSL 파일시스템을 Windows Chrome 이 `file://` 로 여는 경로가 없으므로 정적 서버를 쓴다.

```bash
python3 -m http.server 8123 --bind 127.0.0.1   # 프로젝트 루트에서, 백그라운드
```

`http://localhost:8123/index.html` · `http://localhost:8123/test.html` 로 관측하고
**검증이 끝나면 서버를 종료한다.** 이 서버는 관측 수단일 뿐이고 산출물의 의존이 아니다.
SPEC §2 의 `file://` 조항은 이 채널로 관측할 수 없어 판정 대상이 아니다 (SPEC_01 §11).

폭 320~480px 은 Chrome 최소 창 폭(outer 약 516) 아래라 창 리사이즈로 도달할 수 없다.
필요하면 같은 origin 의 iframe 폭을 지정해 관측한다. (SPEC_01 에는 폭 조건이 없다.)

## 단계 1 — 정적 검사 (파일시스템)

프로젝트 루트: `/home/al-hub/workspace/tetris-loop`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-1 | 산출물 집합 일치 | `ls -a` — `index.html` `style.css` `game.js` `main.js` `test.html` `test.js` 정확히 이 여섯 개. 하네스 파일(`CLAUDE.md` `MEMORY.md` `SPEC_*.md` `docs/` `.claude/` `.loop/` `.git/` `.gitignore`)은 세지 않는다 |
| 6-2 | 설치·외부참조 없음 | `package.json` · lockfile · `node_modules/` · 번들러/TS 설정 파일 부재. 두 HTML 을 grep 해 `http://` `https://` `//cdn` 참조 0건 |

## 단계 2 — 브라우저 검사

### 2a. `test.html`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-5 | 테스트 통과 | `#test-summary` 의 `data-fail` 이 `0`, `data-pass` 가 `51` 이상. SPEC_01 §7.3 의 `data-name` 33개와 SPEC_00 §7.2 의 18개가 `#test-results` 에 전부 있는지 대조. 하나라도 빠지면 `FAIL`, 빠진 이름을 근거에 적는다. `#test-summary` 가 없으면 `BLOCKED` |

실패한 `<li>` 가 있으면 그 텍스트를 그대로 근거에 옮긴다.

### 2b. 로드 직후 (`index.html`, 입력 없음)

이 두 항목은 **아무 입력도 넣기 전에** 관측한다. 클릭·키 입력 후에는 다시 로드해야 한다.

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-3 | 콘솔 오류 없음 | 콘솔 트래킹을 먼저 켜고 페이지를 다시 로드한다. 로드 후 5초, `시작` 클릭 후 5초까지 error 레벨 0건. warning 은 세지 않는다 |
| 6-4 | 초기 정지 상태 | `[data-role="status"]`=`READY`, `[data-piece]` 셀 0개, `score`=`0`, `lines`=`0`, `[data-role="cell"]` 200개, `[data-role="controls"]` 텍스트가 아래와 **문자 단위로** 일치, `TetrisApp.getActiveDropTimerCount()`=`0`<br>`← → ↓ 이동 · ↑ 회전 · Space 하드 드롭 · P 일시정지` |

### 2c. 생성과 자동 낙하

`시작` 버튼은 **실제 클릭**으로 누른다 (`computer` 의 `left_click`).
점유 좌표는 `[data-piece]` 셀의 부모 행 인덱스와 행 안 인덱스로 읽는다.

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-6 | 시작 전이 | 클릭 후 `status`=`PLAYING`, `[data-piece]` 셀 정확히 4개, 네 값이 모두 같음, `getActiveDropTimerCount()`=`1` |
| 6-7 | 첫 블록 종류 | 로드 후 첫 `시작` 에서 `data-piece` 값이 `I` |
| 6-8 | 생성 좌표 | 그 블록의 점유 열 집합이 `{3,4,5,6}`, 점유 행 집합이 `{1}` |
| 6-9 | 자동 낙하 | `시작` 직후 최소 행을 기록하고 2450ms 대기 → 최소 행 증가량이 `3` 또는 `4` |

### 2d. 키 입력

방향키는 **실제 키 입력**으로 넣는다 (`computer` 의 `key`).
자동 낙하가 동시에 진행되므로 좌우 이동은 **열만**, 아래 이동은 **행만** 비교한다.

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-10 | 좌우 이동 | `←` 한 번에 점유 열이 전부 1 감소, `→` 한 번에 1 증가 |
| 6-11 | 아래 이동 | `↓` 한 번에 점유 행이 전부 1 증가 (같은 700ms 구간 안에서 관측) |
| 6-12 | 회전 | 첫 블록(`I`)에 `↑` 한 번 → 점유 셀 4개, 점유 **열 집합 `{5}`**, 점유 행이 연속된 4행 |
| 6-13 | 기본 동작 차단 | `PLAYING` 중 `new KeyboardEvent('keydown',{key,cancelable:true,bubbles:true})` 를 `window` 에 디스패치해 `ArrowLeft`·`ArrowRight`·`ArrowUp`·`ArrowDown` 네 개 모두 `defaultPrevented === true` |
| 6-14 | 좌우 경계 | `←` 20회 후 점유 열 최소값이 `0` 이고 음수 없음. 다시 로드·시작 후 `→` 20회 후 최대값이 `9` 이하 |

### 2e. LANDED

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-15 | 착지 | `↓` 25회 → `status`=`LANDED`, `[data-piece]` 셀 4개 유지, `getActiveDropTimerCount()`=`0` |
| 6-16 | 입력 무시 | `LANDED` 에서 점유 좌표와 패널 세 값을 스냅샷 → `← → ↓ ↑` 입력 → 스냅샷이 완전히 같음 |
| 6-22 | 정지 유지 | `LANDED` 에서 2450ms 대기 → `[data-piece]` 셀 4개, 좌표 집합 불변 |

### 2f. 재시작과 버튼

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-17 | 재시작 | `LANDED` 에서 `시작` 클릭 → `status`=`PLAYING`, 셀 4개, 점유 행 최소값 `0` 또는 `1`, `data-piece` 값이 `['I','O','T','S','Z','J','L']` 순환의 다음 종류, `getActiveDropTimerCount()`=`1` |
| 6-18 | 타이머 중복 없음 | `LANDED` → `시작` 을 두 번 반복 → `getActiveDropTimerCount()`=`1`, 그 상태에서 2450ms 대기 시 최소 행 증가량이 `3` 또는 `4` (겹치면 더 커진다) |
| 6-19 | PLAYING 중 클릭 무시 | `PLAYING` 중 `시작` 클릭 → `data-piece` 값이 클릭 직전과 같고 점유 행 최소값이 클릭 직전보다 작아지지 않음 |
| 6-20 | 버튼 텍스트 | `READY`·`PLAYING`·`LANDED` 세 상태에서 `[data-role="start"]` 텍스트가 `시작` |

### 2g. 색

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-21 | 일곱 색 구분 | 콘솔에서 종류별로 `TetrisApp.render({...TetrisGame.createInitialState(), status:'PLAYING', piece: TetrisGame.createPiece(t)})` 를 실행하고 `[data-piece]` 셀의 `getComputedStyle(...).backgroundColor` 를 읽는다. 일곱 값이 SPEC_01 §3.1 표와 일치하고 서로 다르며 빈 셀 색과도 다름 |

이 항목은 상태를 오염시키므로 **맨 마지막에** 하거나, 한 뒤 페이지를 다시 로드한다.

## 반환 형식

```markdown
## 검증 결과 — SPEC_01

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | ls 결과 정확히 6개, 추가 산출물 없음 |
| 6-9 | 자동 낙하 | FAIL | 2450ms 후 최소 행 증가량 7 (타이머 2개로 보임) |
...

- 종합: PASS 20 / FAIL 1 / BLOCKED 1
- 판정: FAILED
- 실패 시그니처: `main.js:duplicate-drop-timer`
```

종합 판정 규칙: `BLOCKED` 이 하나라도 있으면 `BLOCKED`. 아니면 `FAIL` 이 하나라도 있으면 `FAILED`.
전부 `PASS` 여야 `PASSED`.

실패 시그니처는 재발 감지에 쓰이므로 **정규화된 짧은 문자열**이어야 한다
(`<파일>:<증상>` 형태, 타임스탬프나 가변 수치 금지).
