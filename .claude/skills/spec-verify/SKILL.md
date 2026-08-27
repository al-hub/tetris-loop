---
name: spec-verify
description: 현재 SPEC 의 완료 조건을 실제 브라우저(claude-in-chrome)에서 관측해 항목별 PASS/FAIL/BLOCKED 로 판정하는 검증 게이트. 브라우저 도구가 없으면 전 항목 BLOCKED 를 반환하고 통과를 추측하지 않는다. `/spec-loop` 이 호출하거나 사람이 현재 구현 상태를 확인할 때 사용.
---

# spec-verify — 브라우저 검증 게이트

**이 스킬의 유일한 일은 관측이다.** 코드를 고치지 않는다. 상태 파일을 쓰지 않는다.
발견한 문제를 고치고 싶어도 고치지 않는다 — 판정과 수정이 같은 손에 있으면 게이트가 무의미해진다.

호출자에게 항목별 표를 돌려주는 것으로 끝난다.

## 판정 규칙

| 값 | 의미 |
|----|------|
| `PASS` | 브라우저/파일시스템에서 **직접 관측**해 조건을 만족함 |
| `FAIL` | 직접 관측해 조건을 만족하지 못함 |
| `BLOCKED` | 관측 자체를 못 함 (도구 없음, 페이지 로드 실패, 요소를 찾을 수 없음) |

**관측하지 못한 것을 `PASS` 로 적지 않는다.** 코드를 읽어서 "이렇게 되어 있으니 될 것" 은
`PASS` 가 아니다. 근거 열에는 추론이 아니라 실제로 본 값을 적는다.

## 단계 0 — 도구 확인

브라우저 도구(페이지 열기 · DOM 조회 · 콘솔 읽기 · 뷰포트 리사이즈 · 키 입력)가 없으면
아래를 반환하고 즉시 끝낸다.

```
전 항목 BLOCKED
사유: 브라우저 도구 없음. `claude --chrome` 으로 세션을 다시 열어야 검증 가능.
```

파일시스템만으로 되는 항목(6-1·6-2·6-4·6-5)도 이때는 판정하지 않는다.
부분 판정은 "일부 통과" 라는 잘못된 인상을 만든다.

## 단계 1 — 정적 검사 (파일시스템)

프로젝트 루트: `/home/al-hub/workspace/tetris-loop`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-1 | 산출물 집합 일치 | `ls -a` — `index.html` `style.css` `game.js` `main.js` `test.html` `test.js` 정확히 이 여섯 개. 하네스 파일(`CLAUDE.md` `MEMORY.md` `SPEC_*.md` `docs/` `.claude/` `.loop/` `.git/` `.gitignore`)은 세지 않는다 (SPEC §2.1) |
| 6-2 | 설치·외부참조 없음 | `package.json` · lockfile · `node_modules/` · 번들러/TS 설정 파일 부재. 두 HTML 을 grep 해 `http://` `https://` `//cdn` 참조 0건 |
| 6-4 | `index.html` 로드 순서 | `style.css` → `game.js` → `main.js` 순. 두 `<script>` 에 `defer` 있고 `type="module"` 없음 |
| 6-5 | `test.html` 로드 순서 | `game.js` → `test.js` 순 |

## 단계 2 — 브라우저 검사

`file:///home/al-hub/workspace/tetris-loop/...` 로 직접 연다. 개발 서버를 띄우지 않는다.

### 2a. `test.html`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-6 | 테스트 통과 | `#test-summary` 의 `data-fail` 이 `0`, `data-pass` 가 `18` 이상. 그리고 SPEC §7.2 의 `data-name` 18개가 `#test-results` 에 전부 있는지 대조. 하나라도 빠지면 `FAIL`, 빠진 이름을 근거에 적는다. `#test-summary` 가 없으면 `BLOCKED` |

실패한 `<li>` 가 있으면 그 텍스트를 그대로 근거에 옮긴다.

### 2b. `index.html`

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-3 | 콘솔 오류 없음 | 로드 완료 후 5초까지 error 레벨 0건. warning 은 세지 않는다 |
| 6-7 | 보드 20×10 | `[data-role="row"]` 20개, 각 행의 `[data-role="cell"]` 10개, 문서 전체 셀 200개 |
| 6-8 | 상태 패널 | `[data-role="score"]`=`0`, `[data-role="lines"]`=`0`, `[data-role="status"]`=`READY`. 라벨 `점수` · `제거한 줄` · `게임 상태` 존재 |
| 6-9 | 제목 | `<title>` 과 `<h1>` 이 모두 `TETRIS LOOP` |
| 6-10 | 버튼 + 조작 안내 | `[data-role="start"]` 텍스트 `시작`. `[data-role="controls"]` 텍스트가 아래와 **문자 단위로** 일치 (복사해서 대조할 것)<br>`← → ↓ 이동 · ↑ 회전 · Space 하드 드롭 · P 일시정지` |

### 2c. 배선 확인 (하드코딩 탐지)

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-11 | `main.js` 가 `game.js` 를 실제로 씀 | 콘솔에서 다음을 실행한 뒤 패널이 `1234` · `7` · `PAUSED` 로 바뀌는지 확인<br>`TetrisApp.render({...TetrisGame.createInitialState(), score: 1234, lines: 7, status: 'PAUSED'})`<br>안 바뀌면 값이 HTML 에 박혀 있는 것 → `FAIL`. 확인 후 페이지를 새로고침해 6-13 스냅샷을 오염시키지 않는다 |

### 2d. 반응형

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-12 | 여섯 폭에서 가로 스크롤 없음 | 폭 320 · 390 · 480 · 768 · 1024 · 1440px 각각에서 `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. 추가로 390px 에서 세로 배치, 1024px 에서 좌우 배치 확인. 세로 스크롤은 허용이므로 보지 않는다 |

여섯 폭 중 하나라도 실패하면 `FAIL` 이고, 어느 폭인지 근거에 적는다.

### 2e. 정지 상태

| # | 조건 | 관측 방법 |
|---|------|-----------|
| 6-13 | 화면 불변 | 보드 200셀과 패널 세 값의 스냅샷을 뜬다. 5초 대기 → `←` `→` `↓` `↑` `Space` `P` 입력 → `시작` 버튼 클릭. 다시 스냅샷을 떠서 완전히 같은지 확인. 달라지면 `FAIL` |

## 반환 형식

```markdown
## 검증 결과 — SPEC_00

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | ls 결과 정확히 6개, 추가 산출물 없음 |
| 6-3 | 콘솔 오류 없음 | FAIL | `GET file:///.../styles.css 404` |
...

- 종합: PASS 11 / FAIL 1 / BLOCKED 1
- 판정: FAILED
- 실패 시그니처: `index.html:css-path-typo`
```

종합 판정 규칙: `BLOCKED` 이 하나라도 있으면 `BLOCKED`. 아니면 `FAIL` 이 하나라도 있으면 `FAILED`.
전부 `PASS` 여야 `PASSED`.

실패 시그니처는 재발 감지에 쓰이므로 **정규화된 짧은 문자열**이어야 한다
(`<파일>:<증상>` 형태, 타임스탬프나 가변 수치 금지).
