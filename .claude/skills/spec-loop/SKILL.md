---
name: spec-loop
description: SPEC 문서 하나를 구현하고 브라우저로 검증한 뒤 결과를 기록하는 루프 1회 실행. `.loop/state/progress.json` 의 현재 SPEC 을 읽어 구현 → `/spec-verify` 검증 → 리포트·상태 갱신 → 통과 시 커밋까지 한 걸음을 수행한다. `/loop` tick 에서 호출되거나 사람이 단독으로 1회 실행할 때 사용.
---

# spec-loop — 루프 1회 실행

한 번 호출되면 **정확히 한 걸음**만 나간다. 스스로 반복하지 않는다.
루프 수명(`ScheduleWakeup`, 재예약, 정지)은 호출자(`.claude/loop.md` 또는 `/loop`)가 관리한다.
이 스킬은 `ScheduleWakeup` 을 절대 호출하지 않는다.

프로젝트 제약은 `CLAUDE.md` 에 있다. 시작 전에 읽는다.

---

## 단계 1 — 브라우저 게이트 (가장 먼저)

이 프로젝트의 완료 판정은 실제 브라우저 관측으로만 내린다. 검증할 수 없으면 구현도 시작하지 않는다.

세션에 브라우저 조작 도구(페이지 열기 · DOM 읽기 · 콘솔 읽기 · 뷰포트 리사이즈 · 키 입력)가
있는지 확인한다. 도구 목록에 없으면 `ToolSearch` 로 한 번 찾아본다.

**없으면 여기서 끝낸다:**

- `status` → `BLOCKED`
- `human_input_needed` → `"브라우저 도구 없음. claude --chrome 으로 세션을 다시 열어야 SPEC 검증 가능."`
- 체크리스트는 건드리지 않는다 (`UNKNOWN` 유지)
- `iteration` 을 올리지 않는다 — 반복을 소비한 게 아니라 시작조차 못 한 것이다
- 상태 저장(단계 6) 후 즉시 종료. **코드를 한 줄도 쓰지 않는다.**

**있으면** — `status` 가 `BLOCKED` 이고 `human_input_needed` 가 브라우저 도구 없음을 사유로
적고 있으면 사람이 이미 세션을 다시 연 것이다. `status` → `PENDING`,
`human_input_needed` → `null` 로 되돌리고 단계 2 로 진행한다.

## 단계 2 — 정지 조건 선검사

`.loop/state/progress.json` 을 읽고 아래 중 하나라도 해당하면 `HALTED` 로 종료한다
(SPEC_00 §9 를 기계적으로 강제하는 장치다).

- `iteration >= max_iterations` — 세 번 실행하고도 완료 못 함
- `failure_signatures` 에 같은 값이 두 번 이상 — 같은 실패 반복
- `status` 가 이미 `PASSED` · `HALTED`
- `status` 가 `BLOCKED` 이고 사유가 브라우저 도구 없음이 **아님** (사람의 답을 기다리는 중)

`HALTED` 로 갈 때 `human_input_needed` 에 어느 조건이 발동했는지 한 문장으로 적는다.

## 단계 3 — SPEC 로드

`progress.json.spec_file` 이 가리키는 문서를 읽는다. 그 문서가 유일한 요구사항 출처다.
`§6 완료 조건`, `§7 자동 검증`, `§8 수동 검증`, `§5 범위 밖`, `§9 안전과 정지 조건` 을 확인한다.

`status` → `IN_PROGRESS` 로 갱신하고 저장한다.

이전 반복이 있으면 `.loop/reports/` 의 **가장 최근 리포트를 읽는다.**
같은 실수를 반복하지 않는 것이 반복 예산을 지키는 유일한 방법이다.

## 단계 4 — 구현

- SPEC 이 정의한 범위 안에서만 만든다. `§5 범위 밖` 항목은 만들지 않는다.
- 산출물 파일 제약(`CLAUDE.md` §2)을 지킨다. 여섯 개 외 파일을 만들지 않는다.
- 프로젝트 폴더 밖 파일을 만들거나 수정하지 않는다.
- 실패 반복이면 최근 리포트의 실패 원인부터 고친다. 통과한 부분을 다시 쓰지 않는다.

**SPEC 에 없는 결정이 필요하면 추측하지 않는다.** 화면 문구, 색, 레이아웃 수치, 자료구조 등
SPEC 이 정해주지 않은 것을 정해야 한다면:

- `status` → `BLOCKED`
- `human_input_needed` → `"[사람 확인 필요] <무엇을 정해야 하는지, 선택지와 함께 한두 문장>"`
- 단계 6 으로 건너뛰고 종료

## 단계 5 — 검증

`Skill({skill: "spec-verify"})` 를 호출한다.

`status` → `VERIFYING` 로 갱신해두고 호출한다.
검증 결과는 항목별 `PASS` · `FAIL` · `BLOCKED` 표로 돌아온다.

**검증 결과를 스스로 고쳐 쓰지 않는다.** "아마 될 것" 은 `PASS` 가 아니다.

## 단계 6 — 기록

### 6a. 리포트

`.loop/reports/<SPEC>-iter-<N>.md` 를 쓴다 (`N` 은 이번 반복 번호).

```markdown
# SPEC_00 반복 0 — <PASSED|FAILED|BLOCKED|HALTED>

- 실행 시각: <ISO8601>
- 결과: <한 문장>

## 체크리스트
| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | ... | PASS | 관측한 내용 |

## 실패 원인
(없으면 "없음")

## 실패 시그니처
(정규화된 짧은 문자열. 예: `test.html:board-row-shared-reference`)

## 다음 조치
(다음 반복이 무엇부터 할지 한두 줄. 종료 상태면 사람이 할 일)
```

### 6b. `progress.json`

전체 내용을 다시 쓰고, 쓴 뒤 반드시 파싱 검증한다.

```bash
node -e "JSON.parse(require('fs').readFileSync('.loop/state/progress.json','utf8'));console.log('progress.json OK')"
```

`updated_at` 은 ISO8601 로 채운다. 시각은 `date -Iseconds` 로 얻는다.

### 6c. `MEMORY.md`

`progress.json` 을 사람이 읽는 형태로 반영한다. 현재 표 · 체크리스트 · 반복 기록 ·
사람 확인 필요 · 정지 이력을 갱신한다. **진행 상태만 쓴다.** 설계 설명이나 코드 요약을 넣지 않는다.

## 단계 7 — 분기

| 검증 결과 | `status` | 추가 동작 |
|-----------|----------|-----------|
| 전 항목 `PASS` | `PASSED` | 커밋 (아래) |
| `FAIL` 하나 이상, `BLOCKED` 없음 | `FAILED` | `iteration += 1`, `failure_signatures` 에 시그니처 추가 |
| `BLOCKED` 하나 이상 | `BLOCKED` | `human_input_needed` 채움. `iteration` 은 올리지 않음 |

`FAILED` 로 가기 전에 새 시그니처가 `failure_signatures` 에 이미 있는지 본다.
있으면 같은 실패 두 번이므로 `HALTED` 로 바꾼다.

### 통과 시 커밋

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(SPEC_00): <한 줄 요약>

<완료 조건 중 무엇이 어떻게 충족됐는지 2~4줄>

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

실패한 반복은 커밋하지 않는다. 리포트와 상태만 남긴다.

## 단계 8 — 보고

사람이 읽을 3~5줄로 끝낸다: 이번 반복 결과, 체크리스트 통과/전체, 다음에 무슨 일이 일어나는지.
`ScheduleWakeup` 을 호출하지 않는다.
