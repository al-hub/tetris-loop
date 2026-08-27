---
name: spec-status
description: 루프 진행 상태를 읽기 전용으로 요약해 보여준다. `.loop/state/progress.json` 과 최근 리포트를 읽어 현재 SPEC·상태·반복 횟수·체크리스트·정지 사유를 표 하나로 출력한다. 파일을 수정하지 않고 루프도 돌리지 않는다. 루프 도중이나 이후에 상황을 확인할 때 사용.
---

# spec-status — 진행 상태 보고 (읽기 전용)

**아무것도 고치지 않는다.** 파일 수정 금지, 커밋 금지, `/spec-loop` 호출 금지,
`ScheduleWakeup` 호출 금지. 상태가 나빠 보여도 보고만 한다.

## 읽을 것

1. `.loop/state/progress.json` — 기계용 원본
2. `.loop/reports/` 의 가장 최근 파일 — 직전 반복의 근거
3. `MEMORY.md` — 사람용 사본 (원본과 어긋나면 그 사실을 보고한다)

## 출력

```markdown
## 루프 상태

| 항목 | 값 |
|------|-----|
| 현재 SPEC | SPEC_00 (SPEC_00_PROJECT.md) |
| 상태 | FAILED |
| 반복 | 1 / 3 |
| 남은 반복 | 2 |
| 갱신 | 2026-08-27T11:04:12+09:00 |

### 완료 조건 (PASS 8 / FAIL 1 / BLOCKED 0 / 미판정 1)

| # | 항목 | 결과 |
|---|------|------|
| ... |

### 직전 반복
- 리포트: .loop/reports/SPEC_00-iter-0.md
- 실패 원인: <한 줄>
- 다음 조치: <한 줄>

### 실패 시그니처 이력
- `index.html:css-path-typo`

### 사람이 할 일
<없으면 "없음". BLOCKED 면 human_input_needed 를 그대로>
```

## 상태별 한 줄 결론

출력 끝에 지금 무엇을 하면 되는지 한 줄로 붙인다.

| 상태 | 결론 |
|------|------|
| `PENDING` | 아직 시작 안 함. `claude --chrome` 세션에서 `/loop /spec-loop` 실행 |
| `IN_PROGRESS` / `VERIFYING` | 루프가 도는 중이거나 tick 중간에 끊긴 상태. 후자면 다시 `/loop /spec-loop` |
| `FAILED` | 반복 예산 남음. 루프를 다시 돌리면 이어서 재시도 |
| `PASSED` | SPEC 완료·커밋됨. 다음 SPEC 을 쓰고 `spec_file` 을 바꿔야 진행 |
| `BLOCKED` | 사람 결정 대기. `human_input_needed` 를 해소해야 진행 |
| `HALTED` | 정지 조건 발동. 리포트를 읽고 SPEC 이나 접근을 바꾼 뒤 `iteration` 을 0 으로 되돌려야 재시작 |

`progress.json` 이 없거나 파싱되지 않으면 그 사실만 보고한다. 고쳐놓지 않는다.
