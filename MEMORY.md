# 루프 진행 상태

이 파일은 **루프 진행 상태만** 담는다. 설계 설명·기능 노트는 여기 쓰지 않는다.
기계용 원본은 `.loop/state/progress.json` 이고, 이 파일은 사람이 읽는 사본이다.
둘이 어긋나면 `progress.json` 이 정답이다.

## 현재

| 항목 | 값 |
|------|-----|
| 현재 SPEC | SPEC_03 rev1 (`SPEC_03_SCORE_AND_LEADERBOARD.md`) |
| 상태 | `PASSED` |
| 반복 | 0 / 3 |
| 구현 | 완료 |
| 마지막 리포트 | `.loop/reports/SPEC_03-iter-0.md` |
| 갱신 시각 | 2026-08-27T16:27:29+09:00 |

## 완료 조건 체크리스트 (SPEC_03 rev1 §6)

### 위생

| # | 항목 | 결과 |
|---|------|------|
| 6-1 | 산출물 여섯 개 일치 | PASS |
| 6-2 | 설치 산출물·외부 URL·서버 통신 0건 | PASS |
| 6-3 | 페이지가 만든 콘솔 error 0건 | PASS (사람) |
| 6-4 | 테스트 FAIL 0 · PASS ≥105 · 폐기 1개 부재 | PASS (사람, 106/0) |

### 그룹 A — 점수

| # | 항목 | 결과 |
|---|------|------|
| 6-5 | `SCORE_TABLE` `[0,100,300,500,800]` 동결 | PASS (Node DOM) |
| 6-6 | 한 줄 제거 → 점수 100 | PASS (Node DOM) |
| 6-7 | 두 줄 동시 제거 → 점수 300 | PASS (Node DOM) |
| 6-8 | 점수 누적 (500+100=600) | PASS (Node DOM) |
| 6-9 | 게임오버 고정에서도 가산 | PASS (Node DOM) |

### 그룹 B — 리더보드

| # | 항목 | 결과 |
|---|------|------|
| 6-10 | READY 에서 게임오버 영역 숨김 | PASS (Node DOM) |
| 6-11 | PLAYING 에서 저장 거부 | PASS (Node DOM) |
| 6-12 | 게임오버 결과 표시 | PASS (Node DOM) |
| 6-13 | 화면 문구 문자 단위 일치 | PASS (Node DOM) |
| 6-14 | 이름 앞뒤 공백 trim | PASS (Node DOM) |
| 6-15 | 1자 거부 (`TOO_SHORT`) | PASS (Node DOM) |
| 6-16 | 11자 거부 (`TOO_LONG`) | PASS (Node DOM) |
| 6-17 | 2자·10자 허용 | PASS (Node DOM) |
| 6-18 | 내부 공백·특수문자·이모지 거부 | PASS (Node DOM) |
| 6-19 | 영문·숫자·한글 조합 허용 | PASS (Node DOM) |
| 6-20 | 검증 실패 시 저장소 불변 | PASS (Node DOM) |
| 6-21 | 같은 게임 중복 저장 차단 | PASS (Node DOM) |
| 6-22 | 새 게임은 다시 저장 가능 | PASS (Node DOM) |
| 6-23 | 저장 키와 5개 필드 타입 | PASS (Node DOM) |
| 6-24 | 정렬 점수 내림 → playedAt 오름 | PASS (Node DOM) |
| 6-25 | 완전 동점이면 기존 순서 유지 | PASS (Node DOM) |
| 6-26 | 상위 10개 제한 | PASS (Node DOM) |
| 6-27 | 최고점 삽입 시 최하위 제거 | PASS (Node DOM) |
| 6-28 | 새로고침 후 기록 유지 | PASS (Node DOM) |
| 6-29 | 손상 JSON → 빈 목록, 저장값은 보존 | PASS (Node DOM) |
| 6-30 | 구조 불량 4종 안전 처리 | PASS (Node DOM) |
| 6-31 | 초기화는 확인 후에만 · 재시작과 무관 | PASS (Node DOM) |

`—` 미판정 · `PASS` 관측 통과 · `FAIL` 관측 실패 · `BLOCKED` 관측 불가

## 반복 기록

| 반복 | 결과 | 실패 시그니처 | 리포트 |
|------|------|---------------|--------|
| 0 | PASSED — SPEC_03 완료 조건 31/31 | 없음 | `.loop/reports/SPEC_03-iter-0.md` |

## 사람 확인 필요

없음.

## 다음 단계

SPEC_03 완료. 다음 SPEC 은 `/spec-new` 로 만든다.
넘긴 것: 콤보·연속 제거 보너스 · 레벨과 낙하 속도 · 하드 드롭·일시정지 ·
다음 블록 표시·홀드 · `playedAt` 화면 표시 · 온라인 리더보드(제약 밖).

```
/spec-new <목표>
```

## 정지 이력

| 시각 | 상태 | 사유 |
|------|------|------|
| 2026-08-27T13:18:37+09:00 | BLOCKED | 브라우저 게이트 — 세션에 브라우저 도구 없음 |
| (같은 세션) | BLOCKED | 브라우저 게이트 — Chrome 확장 미연결 |
| (같은 세션) | PASSED | SPEC_00 완료 — 13/13 |
| (같은 세션) | BLOCKED | SPEC_01 rev1 — 배경 탭 타이머 억제 + 신뢰 입력 미도달 |
| (같은 세션) | PASSED | SPEC_01 rev2 완료 — 24/24 |
| (같은 세션) | BLOCKED | SPEC_02 — claude-in-chrome MCP 서버 끊김 |
| (같은 세션) | BLOCKED | SPEC_02 — 구현 완료, 브라우저 관측 4건 대기 |
| (같은 세션) | PASSED | SPEC_02 완료 — 20/20 (사람이 브라우저 5건 관측) |
| 2026-08-27T16:13:26+09:00 | PENDING | SPEC_03 배선 완료, 구현 대기 |
| 2026-08-27T16:27:29+09:00 | PASSED | SPEC_03 완료 — 31/31 (사람이 브라우저 2건 관측) |
