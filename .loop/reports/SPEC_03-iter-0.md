# SPEC_03 반복 0 — PASSED

- 실행 시각: 2026-08-27T16:21:46+09:00
- SPEC revision: 1
- 결과: 완료 조건 31개 전부 통과. 기계 관측 29개 + 사람이 브라우저에서 관측 2개.

## 전제

세션에 `claude-in-chrome` MCP 가 없다. 사람이 직접 검증하기로 해서
`spec-verify` 단계 0 의 예외 경로(Node 대안 채널)로 갔다.
프로젝트 밖 scratchpad 도구 세 개를 썼고 저장소에는 아무 것도 추가하지 않았다.

| 도구 | 하는 일 |
|------|---------|
| `run-tests.js` | 가짜 DOM 으로 `game.js` + `test.js` 실행 |
| `run-dom3.js` | DOM + `localStorage` + `confirm` 스텁 위에 `game.js` + `main.js` 를 올리고 §6 점검 |
| `run-dom.js` | SPEC_02 회귀 |

## 구현 요약

`game.js` — 순수 함수·상수 8개 추가 (공개 키 19 → 27).
`SCORE_TABLE`(동결) · `LEADERBOARD_KEY` · `LEADERBOARD_LIMIT` ·
`scoreForLines` · `validateName` · `sanitizeRecords` · `sortRecords` · `addRecord`.
`lockAndAdvance` 4단계에 `score = state.score + scoreForLines(full.length)` 를 넣었다.
DOM·저장소 접근은 여전히 0건이다 (grep 확인).

`index.html` — 게임오버 결과 영역과 리더보드 영역 추가. `data-role` 계약 11개.
`style.css` — 두 영역 스타일. `main.js` — 저장소 읽기·쓰기, 게임오버 결과 스냅샷,
중복 저장 차단, `confirm` 초기화, 리더보드 렌더. 공개 API 4개 추가.
`test.js` — 폐기 1개 제거, 신규 28개 추가 → 총 106개.

## 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | `ls -a` — 산출물 정확히 6개 |
| 6-2 | 설치·외부참조·서버통신 없음 | PASS | 설치 산출물 부재, 외부 URL 0건, `fetch(`·`XMLHttpRequest`·`WebSocket`·`sendBeacon` 0건 |
| 6-3 | 페이지가 만든 콘솔 error 0건 | PASS (사람·브라우저) | 사람이 콘솔에서 확인 |
| 6-4 | FAIL 0 / PASS ≥105 | PASS (사람·브라우저) | 사람이 `test.html` 에서 `PASS 106 / FAIL 0` 확인. Node 실행도 동일, 폐기 `lock-and-advance-keeps-score` 부재 |
| 6-5 | 점수표 동결 | PASS (Node DOM) | `[0,100,300,500,800]`, `isFrozen` 참 |
| 6-6 | 한 줄 100 | PASS (Node DOM) | `score`=`100`, `lines`=`1` |
| 6-7 | 두 줄 300 | PASS (Node DOM) | `score`=`300` (100×2 아님), `lines`=`2` |
| 6-8 | 누적 | PASS (Node DOM) | 500 → 600, `lines` 8 |
| 6-9 | 게임오버 고정도 가산 | PASS (Node DOM) | `GAME_OVER` + `score`=`100` |
| 6-10 | READY 에서 숨김 | PASS (Node DOM) | `hidden`=`true`, 기록 0 |
| 6-11 | PLAYING 저장 거부 | PASS (Node DOM) | `NOT_GAME_OVER`, 저장소 문자열 불변 |
| 6-12 | 게임오버 표시 | PASS (Node DOM) | `hidden`=`false`, final 400/3 |
| 6-13 | 화면 문구 | PASS (Node DOM) | `기록 저장`·`리더보드 초기화`·`리더보드` |
| 6-14 | trim | PASS (Node DOM) | 저장된 `name` 이 `민수` |
| 6-15 | 1자 거부 | PASS (Node DOM) | `TOO_SHORT` + 문구 일치 |
| 6-16 | 11자 거부 | PASS (Node DOM) | `TOO_LONG` + 문구 일치 |
| 6-17 | 2자·10자 허용 | PASS (Node DOM) | 둘 다 저장 성공 |
| 6-18 | 공백·특수문자·이모지 거부 | PASS (Node DOM) | 셋 다 `INVALID_CHAR` + 문구 일치 |
| 6-19 | 영문·숫자·한글 | PASS (Node DOM) | `Player1`·`테트리스7` 성공 |
| 6-20 | 실패는 저장소 불변 | PASS (Node DOM) | 실패 전후 문자열 동일, 재시도 성공 |
| 6-21 | 중복 저장 차단 | PASS (Node DOM) | `ALREADY_SAVED` ×3, 버튼 5연타 후에도 1건 |
| 6-22 | 새 게임 재저장 | PASS (Node DOM) | 재시작 후 `isSavedForCurrentGame()`=`false`, 총 2건 |
| 6-23 | 키와 5필드 타입 | PASS (Node DOM) | 5키, `string·string·number·number·number` |
| 6-24 | 정렬 점수→시각 | PASS (Node DOM) | `EARLY(300,T20)`→`LATE(300,T30)`→`LOW(100)` |
| 6-25 | 안정 정렬 | PASS (Node DOM) | 완전 동점 시 입력 순서 유지 |
| 6-26 | 상위 10개 | PASS (Node DOM) | 배열 10, 화면 10, 최저점 제외 |
| 6-27 | 최고점 삽입 | PASS (Node DOM) | 1위 삽입, 기존 최하위 제거, 길이 10 |
| 6-28 | 새로고침 유지 | PASS (Node DOM) | 저장값으로 재부팅 후 개수·순서·값 동일 |
| 6-29 | 손상 JSON | PASS (Node DOM) | 기록 0, 저장값 `{broken json` 그대로 |
| 6-30 | 구조 불량 4종 | PASS (Node DOM) | `null`·문자열·객체·필드 누락 — 넷 다 정상, 유효 항목만 |
| 6-31 | 초기화 확인 | PASS (Node DOM) | 취소 시 보존, 확인 시 `[]`, 재시작과 무관 |

종합: **PASS 31 / FAIL 0 / BLOCKED 0** — 기계 관측 29, 사람·브라우저 관측 2

SPEC_02 회귀도 같이 돌렸다 — 15/15 유지.

## 구현 중 잡은 결함

`loadLeaderboard` 가 저장값을 **정렬 없이** 그대로 그렸다. 6-24 가 잡았다
(실제 `LOW→LATE→EARLY`, 기대 `EARLY→LATE→LOW`). SPEC §3.2 는 화면이 늘 정렬 결과와
같은 순서여야 한다고 못 박고 있다. 로드 시 `sortRecords` 후 상위 10개로 자르도록 고쳤고
저장값은 건드리지 않는다. 고친 뒤 28/28.

## 실패 원인

없음. 관측한 29개 전부 기대값과 일치했다.

## 실패 시그니처

없음.

## 반복 소비

없음. `iteration` 0 에서 통과했다.

## 사람이 브라우저에서 확인한 것

세션에 브라우저 도구가 없어 사람이 `http://localhost:8000` 에서 직접 관측했다.

| # | 확인 내용 |
|---|-----------|
| 6-4 | `test.html` 요약이 `PASS 106 / FAIL 0` |
| 6-3 | `index.html` 콘솔에 페이지가 만든 error 0건 |

나머지 29개는 Node 채널로 관측했다. 그 채널이 증명하지 못하는 것은 CSS 표현과 실제 렌더뿐이고,
`localStorage`·`confirm`·DOM 계약·상태 전이는 스텁 위에서 실제 코드 경로를 그대로 탔다.

## 다음 조치

SPEC_03 완료. 루프는 정지한다. 다음은 `/spec-new` 로 SPEC_04 문서를 만든다.
넘긴 것은 §10 참조 — 콤보·레벨·하드 드롭·일시정지·다음 블록·홀드·`playedAt` 표시.
