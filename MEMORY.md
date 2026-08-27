# 루프 진행 상태

이 파일은 **루프 진행 상태만** 담는다. 기계용 원본은 `.loop/state/progress.json` 이고 이 파일은 사본이다.

## 현재

| 항목 | 값 |
|------|-----|
| 현재 SPEC | SPEC_05 rev1 (`SPEC_05_NEXT_PIECE.md`) |
| 상태 | `PASSED` |
| 반복 | 0 / 3 |
| 구현 | 완료 |
| 마지막 리포트 | `.loop/reports/SPEC_05-iter-0.md` |
| 갱신 시각 | 2026-08-27T17:19:16+09:00 |

## 완료 조건 체크리스트 (SPEC_05 rev1 §6)

| # | 항목 | 결과 |
|---|------|------|
| 6-1 | 산출물 여섯 개 일치 | PASS |
| 6-2 | 설치·외부 URL·네트워크 API 0건 | PASS |
| 6-3 | 페이지 콘솔 error 0건 (사람 몫, 종합 제외) | 사람 확인 (종합 제외) |
| 6-4 | 테스트 FAIL 0 · PASS ≥149 · `initial-state-keys-five` 부재 | PASS (Node) |
| 6-5 | 초기 상태 6키, `next` null | PASS (Node) |
| 6-6 | `startGame` 공급자 2회 → (T,I) | PASS (Node) |
| 6-7 | 순환 기본 시작 → (I,O) | PASS (Node) |
| 6-8 | 브라우저 시작 후 NEXT 격자에 O | PASS (Node) |
| 6-9 | `next-cell` 16개, READY 에서 비어 있음 | PASS (Node) |
| 6-10 | 7종 중앙 배치 인덱스 일치 | PASS (Node) |
| 6-11 | NEXT 색 = 보드 셀 색 | PASS (Node 대체) · 색은 사람 |
| 6-12 | 승격 시 공급 1회, next 보충 | PASS (Node) |
| 6-13 | 승격 블록 좌표 = `createPiece` 규칙 | PASS (Node) |
| 6-14 | [T,I,L,O,Z] 3회 굳힘 순서·calls 2·3·4·5 | PASS (Node) |
| 6-15 | 공급자 인자 = 승격된 종류 | PASS (Node) |
| 6-16 | `next: null` 은 순환 보충 | PASS (Node) |
| 6-17 | 브라우저 굳힘 → 승격 + NEXT 갱신 | PASS (Node) |
| 6-18 | 게임오버 시 next 유지·공급 0회 | PASS (Node) |
| 6-19 | 브라우저 GAME_OVER 후 NEXT 불변 | PASS (Node) |
| 6-20 | 재시작은 이전 next 무시 | PASS (Node) |
| 6-21 | 리더보드 기록에 next 없음 | PASS (Node) |
| 6-22 | next 변경이 board 를 안 건드림 | PASS (Node) |

`—` 미판정 · `PASS` · `FAIL` · `BLOCKED` · `사람 확인`

## 반복 기록

| 반복 | 결과 | 실패 시그니처 | 리포트 |
|------|------|---------------|--------|
| 0 | PASSED — 21/21 (6-3 사람 확인 별도) | 없음 | `.loop/reports/SPEC_05-iter-0.md` |

## 사람 확인 필요

**6-3**(콘솔 error 0) · **6-11**(NEXT 색 = 보드 색, 리포트 스니펫) · §8. 절차는 리포트.

## 다음 단계

SPEC_05 완료. 다음은 `/spec-new` — 일시정지(`PAUSED`).

## 정지 이력

| 시각 | 상태 | 사유 |
|------|------|------|
| 2026-08-27T13:18:37+09:00 | BLOCKED | 브라우저 게이트 — 세션에 브라우저 도구 없음 |
| (같은 세션) | BLOCKED | Chrome 확장 미연결 |
| (같은 세션) | PASSED | SPEC_00 — 13/13 |
| (같은 세션) | BLOCKED | SPEC_01 rev1 — 배경 탭 억제 + 신뢰 입력 미도달 |
| (같은 세션) | PASSED | SPEC_01 rev2 — 24/24 |
| (같은 세션) | BLOCKED | SPEC_02 — MCP 끊김 / 브라우저 4건 대기 |
| (같은 세션) | PASSED | SPEC_02 — 20/20 |
| (같은 세션) | BLOCKED | SPEC_03 — 브라우저 2건 대기 |
| (같은 세션) | PASSED | SPEC_03 — 31/31 |
| (같은 세션) | PASSED | SPEC_04 — 20/20, 반복 소비 0 |
| 2026-08-27T17:12:22+09:00 | PENDING | SPEC_05 배선 완료, 구현 대기 |
| 2026-08-27T17:19:16+09:00 | PASSED | SPEC_05 — 21/21, 반복 소비 0 |
