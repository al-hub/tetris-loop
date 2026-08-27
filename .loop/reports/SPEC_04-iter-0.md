# SPEC_04 반복 0 — PASSED

- 실행 시각: 2026-08-27T16:58:31+09:00
- SPEC revision: 1
- 결과: 완료 조건 20개 전부 PASS. Node 19 + 사람이 브라우저에서 6-3 확인.

## 채널

브라우저 MCP 없음. SPEC_04 §6 이 정한 대로 6-3 을 뺀 19개는 Node 로 결정적으로 판정했다.
scratchpad 도구 셋(`run-tests.js` · `run-dom4.js` · SPEC_02/03 회귀용 `run-dom.js`·`run-dom3.js`)을
프로젝트 밖에서 돌렸다. 저장소에 추가한 것은 없다.

DOM 스텁은 `setInterval`/`clearInterval` 도 흉내내 **실제 등록된 타이머 개수**를 셌다.
`getActiveDropTimerCount()` 와 실제 개수가 전 조건에서 일치했다.

## 구현 요약

- `game.js` — `levelForLines(lines)` · `dropIntervalForLevel(level)` 추가 (공개 키 27 → 29).
  `lockAndAdvance` 4단계에 `× levelForLines(state.lines)` (제거 직전 레벨). DOM·타이머 접근 0건 유지.
- `main.js` — `startDropTimer` 가 `dropIntervalForLevel(levelForLines(appState.lines))` 를 넘긴다.
  `commit` 이 레벨 변화를 감지하면 타이머를 정지 후 하나만 다시 건다. `render` 가 `[data-role="level"]` 갱신.
- `index.html` — `게임 상태` 다음에 `레벨` 한 줄.
- `test.js` — 신규 20개 → 총 126개. 폐기 0.

## 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 여섯 개 | PASS | `ls -a` 산출물 정확히 6개 |
| 6-2 | 설치·외부 URL·네트워크 API 0건 | PASS | 설치 산출물 부재, 외부 URL 0, `fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 0 |
| 6-3 | 페이지 콘솔 error 0건 | PASS (사람·브라우저) | 사람이 콘솔에서 확인 |
| 6-4 | PASS ≥126 / FAIL 0 | PASS (Node) | `PASS 126 / FAIL 0`, 신규 20 + 유지 106, 중복 0 |
| 6-5 | 레벨 경계 | PASS (Node) | `0·9·10·19·20 → 1·1·2·2·3` |
| 6-6 | 상위·범위 밖 | PASS (Node) | `29·30·99·100 → 3·4·10·11`, 범위 밖 → 1 |
| 6-7 | 간격 1~5 | PASS (Node) | `700·640·580·520·460` |
| 6-8 | 하한 100 | PASS (Node) | `11·12·20·100·1000 → 전부 100` |
| 6-9 | 레벨 1 = 상수 | PASS (Node) | `dropIntervalForLevel(1) === DROP_INTERVAL_MS === 700` |
| 6-10 | 배수 | PASS (Node DOM) | lines 0·10·20 한 줄 → `100·200·300` |
| 6-11 | 직전 레벨 | PASS (Node DOM) | 9→`100`(lines 10, level 2) · 19 두 줄→`600`(lines 21, level 3) · 20 두 줄→`900` |
| 6-12 | 이동·회전 무득점 | PASS (Node DOM) | lines 25 에서 4키×3회 후 `score` 0 |
| 6-13 | 레벨 2 전환 | PASS (Node DOM) | level 2, `intervalMs` 640, 타이머 1 (실제 등록 1) |
| 6-14 | 레벨 3 전환 | PASS (Node DOM) | level 3, 580, 타이머 1 |
| 6-15 | 같은 레벨 유지 | PASS (Node DOM) | lines 0 한 줄 → 700 유지 |
| 6-16 | 연속 3회 전환 | PASS (Node DOM) | 9→19→29 후 타이머 1, 520 (레벨 4) |
| 6-17 | tick 한 칸 | PASS (Node DOM) | 전환 직후 `tick()` → 최소 행 +1, `count` +1 |
| 6-18 | 재시작 | PASS (Node DOM) | GAME_OVER(lines 37, 레벨 4, 타이머 0) → 클릭 → lines 0, level 1, 700, 타이머 1, PLAYING |
| 6-19 | 라벨·위치 | PASS (Node DOM) | 초기 `1`, 라벨 `레벨`, `게임 상태` 다음 형제 |
| 6-20 | 표시 일관성 | PASS (Node DOM) | lines 0·9·10·25·100 전부 `levelForLines` 와 일치 |

종합: **PASS 20 / FAIL 0 / BLOCKED 0** — Node 19 + 사람·브라우저 1.

회귀: SPEC_02 DOM 15/15 · SPEC_03 DOM 28/28 · 러너 기존 106개 전부 유지.

## 실패 원인 / 시그니처

없음. 첫 iteration 에서 전부 통과.

## 반복 소비

없음. `iteration` 0.

## 사람이 브라우저에서 확인한 것

6-3 —  콘솔에 페이지가 만든 error 0건 (레벨 전환 후에도). PASS.

## 다음 조치

SPEC_04 완료. 커밋한다. 사람 확인 결과가 어긋나면 그 항목부터 고친다.
다음 SPEC: NEXT 미리보기 · 일시정지 (SPEC_04 §10).
