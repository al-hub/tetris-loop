# 루프 진행 상태

이 파일은 **루프 진행 상태만** 담는다. 설계 설명·기능 노트는 여기 쓰지 않는다.
기계용 원본은 `.loop/state/progress.json` 이고, 이 파일은 사람이 읽는 사본이다.
둘이 어긋나면 `progress.json` 이 정답이다.

## 현재

| 항목 | 값 |
|------|-----|
| 현재 SPEC | SPEC_00 rev2 (`SPEC_00_PROJECT.md`) |
| 상태 | `PASSED` |
| 반복 | 0 / 3 (반복 소비 없이 통과) |
| 마지막 리포트 | `.loop/reports/SPEC_00-iter-0.md` |
| 갱신 시각 | 2026-08-27T13:48:21+09:00 |

## 완료 조건 체크리스트 (SPEC_00 rev2 §6)

| # | 항목 | 결과 |
|---|------|------|
| 6-1 | 산출물 파일 집합이 여섯 개와 정확히 일치 | PASS |
| 6-2 | 설치 산출물 없음 · 외부 URL 참조 0건 | PASS |
| 6-3 | `index.html` 콘솔 error 0건 (로드 후 5초) | PASS |
| 6-4 | `style.css`→`game.js`→`main.js`, defer, module 아님 | PASS |
| 6-5 | `test.html` 이 `game.js`→`test.js` 순 | PASS |
| 6-6 | 테스트 FAIL 0 · PASS ≥18 · 필수 이름 18개 존재 | PASS (20/0) |
| 6-7 | 행 20 × 셀 10 = 200 | PASS |
| 6-8 | 점수 `0` · 제거한 줄 `0` · 상태 `READY` | PASS |
| 6-9 | `<title>` 과 `<h1>` 이 `TETRIS LOOP` | PASS |
| 6-10 | `시작` 버튼 + 조작 안내 문자 단위 일치 | PASS |
| 6-11 | `TetrisApp.render()` 로 패널이 실제로 갱신됨 | PASS |
| 6-12 | 320~1440px 여섯 폭에서 가로 스크롤 없음 | PASS |
| 6-13 | 5초·키입력·버튼클릭 후 스냅샷 불변 | PASS |

`—` 미판정 · `PASS` 관측 통과 · `FAIL` 관측 실패 · `BLOCKED` 관측 불가

§8 수동 검증 3항목(격자 시각 구분 · 1024px 좌우 배치 · 390px 세로 배치)도 통과.

## 미관측으로 남은 것

SPEC §2 의 "두 HTML 은 `file://` 로 직접 열어서 동작해야 한다".
확장이 `file://` 스킴을 거부해 `http://localhost` 정적 서버로 관측했다.
§6 완료 조건에는 없는 조항이라 판정에 반영하지 않았다. 근거는 리포트 참조.

## 반복 기록

| 반복 | 결과 | 실패 시그니처 | 리포트 |
|------|------|---------------|--------|
| (소비 없음) | BLOCKED — 세션에 브라우저 도구 없음, 구현 미시작 | 없음 | (덮어씀) |
| (소비 없음) | BLOCKED — 구현 완료, Chrome 확장 미연결 | 없음 | (덮어씀) |
| 0 | PASSED — 완료 조건 13/13 관측 통과 | 없음 | `.loop/reports/SPEC_00-iter-0.md` |

## 사람 확인 필요

없음.

## 다음 단계

SPEC_00 완료. 루프는 여기서 멈춘다 — 다음 SPEC 으로 자동 진행하지 않는다.

1. 다음 SPEC 문서 작성
2. `.loop/state/progress.json` 의 `current_spec`·`spec_file`·`spec_revision` 교체,
   `iteration` 0, `status` `PENDING`, `checklist` 를 새 SPEC 완료 조건으로 교체
3. `/loop /spec-loop`

## 정지 이력

| 시각 | 상태 | 사유 |
|------|------|------|
| 2026-08-27T13:18:37+09:00 | BLOCKED | 브라우저 게이트 — 세션에 브라우저 도구 없음 |
| (같은 세션) | BLOCKED | 브라우저 게이트 — 도구는 있으나 Chrome 확장 미연결 |
| 2026-08-27T13:48:21+09:00 | PASSED | SPEC_00 완료, 정상 종료 |
