# SPEC_06 반복 0 — PASSED

- 실행 시각: 2026-08-27T17:31:48+09:00
- SPEC revision: 1
- 결과: 완료 조건 22개 전부 PASS. Node 21 + 사람이 브라우저에서 6-3 확인.

## 채널

브라우저 MCP 없음. SPEC_06 §6 대로 6-3 을 뺀 21개를 Node 로 판정했다.
scratchpad 도구(`run-tests.js` · `run-dom6.js` · 회귀용 `run-dom.js`·`run-dom3.js`·`run-dom4.js`·`run-dom5.js`)를 프로젝트 밖에서 돌렸다.
DOM 스텁은 `setInterval`/`clearInterval` 을 흉내내 **실제 등록된 타이머 수**를 셌다 — 전 조건에서 `getActiveDropTimerCount()` 와 일치.

## 구현 요약

- `game.js` — `togglePause(state)` 하나 추가. `PLAYING`↔`PAUSED` 만 바꾸고 다른 상태·`null` 은 인자 그대로.
  다섯 키는 같은 참조. 게임 규칙 함수(`applyMove`·`applyRotate`·`lockAndAdvance`)는 손대지 않았다 —
  이미 `PLAYING` 아니면 거부한다.
- `main.js` — `onKeyDown`: `P`/`p` 는 `PLAYING`·`PAUSED` 에서 `preventDefault` 후 토글. `PAUSED` 중 방향키는
  `preventDefault` 만 하고 `commit` 안 함. `READY`·`GAME_OVER` 는 아무 것도 안 함.
  `commit`: 직전이 `PLAYING` 아니었는데 `PLAYING` 이 되면(재개) 기존 정지 후 타이머 하나 시작 — 간격은 저장된 레벨.
  `onStartClick`: `PAUSED` 도 무시.
- `test.js` — 17개 추가 → 166개. 폐기 0.

## 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 6개 | PASS | `ls -a` |
| 6-2 | 설치·외부 URL·네트워크 0 | PASS | grep 0 |
| 6-3 | 페이지 콘솔 error 0 | PASS (사람·브라우저) | 사람이 콘솔에서 확인 |
| 6-4 | PASS ≥166 / FAIL 0 | PASS (Node) | `PASS 166 / FAIL 0` |
| 6-5 | PLAYING→PAUSED 참조 동일 | PASS (Node) | 다섯 키 `===` |
| 6-6 | PAUSED→PLAYING 참조 동일 | PASS (Node) | |
| 6-7 | READY·GAME_OVER 인자 그대로 | PASS (Node) | `===` |
| 6-8 | 네 상태 P | PASS (Node DOM) | READY→READY(f) · PLAYING→PAUSED(t) · PAUSED→PLAYING(t) · GAME_OVER→GAME_OVER(f) |
| 6-9 | P 진입 타이머 0·블록 불변 | PASS (Node DOM) | 실제 등록 0 |
| 6-10 | PAUSED tick×5 무해 | PASS (Node DOM) | cells·count 불변 |
| 6-11 | 타이머 1→P→0 | PASS (Node DOM) | 실제 등록 1→0 |
| 6-12 | PAUSED 방향키 무시+prevented | PASS (Node DOM) | 12회 전부 prevented, 스냅샷 동일 |
| 6-13 | PAUSED 중 시작 무시 | PASS (Node DOM) | PAUSED 유지, 타이머 0 |
| 6-14 | 보존 후 재개 | PASS (Node DOM) | 회전 J·보드·700·23·레벨 3·NEXT Z 동일, PLAYING |
| 6-15 | 재개 간격 580 | PASS (Node DOM) | 레벨 3, 타이머 1 |
| 6-16 | 재개 간격 700/520 | PASS (Node DOM) | 레벨 1/4 |
| 6-17 | 재개 후 tick 한 칸 | PASS (Node DOM) | +1/+1 |
| 6-18 | PAUSED 저장 거부 | PASS (Node DOM) | `NOT_GAME_OVER`, 저장소 불변 |
| 6-19 | 8회 토글→PLAYING 타이머 1 | PASS (Node DOM) | 실제 등록 1 |
| 6-20 | 7회 토글→PAUSED 타이머 0 | PASS (Node DOM) | |
| 6-21 | 토글 후 tick 한 칸 | PASS (Node DOM) | +1/+1 |
| 6-22 | 재시작이 PAUSED·타이머 정리 | PASS (Node DOM) | PLAYING, lines 0, level 1, 700, 타이머 1 |

종합: **PASS 22 / FAIL 0 / BLOCKED 0** — Node 21 + 사람·브라우저 1.
회귀: SPEC_02 15/15 · SPEC_03 28/28 · SPEC_04 16/16 · SPEC_05 9/9 · 러너 기존 149 유지.

## 실패 원인 / 시그니처 / 반복 소비

없음 / 없음 / 0. 첫 iteration 통과.

## 사람이 브라우저에서 확인한 것

`http://localhost:8000` 에서 6-3(로드 → 시작 → P×3 → 5초, 페이지 콘솔 error 0건) PASS.

## 다음 조치

SPEC_06 완료. 커밋. 남은 §10: 오버레이·드롭 점수·홀드·무작위 공급자.
