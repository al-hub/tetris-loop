# 루프 엔지니어링 하네스 설계

사람이 매 단계를 지시하지 않고, SPEC 문서 하나를 **구현 → 검증 → 기록 → 정지**까지
스스로 밀고 가는 반복 엔진. Claude Code 의 내장 `/loop` 을 자기 페이스(self-paced) 모드로 쓴다.

## 1. 왜 이렇게 만들었나

루프의 위험은 두 가지다. **멈추지 않는 것**과 **틀린 것을 통과로 기록하는 것**.
그래서 하네스는 두 개의 장치를 강제한다.

- **정지 조건이 상태 파일에 박혀 있다.** 반복 횟수와 실패 시그니처가 JSON 에 누적되고,
  같은 실패가 두 번 들어오면 그 자리에서 `HALTED` 다. 모델의 판단에 맡기지 않는다.
- **판정과 수정을 다른 스킬로 분리했다.** `/spec-verify` 는 관측만 하고 코드를 못 고친다.
  관측하지 못한 항목은 `PASS` 가 아니라 `BLOCKED` 다. 브라우저가 없으면 전부 `BLOCKED` 이고,
  루프는 구현을 시작하지도 않고 사람을 부른다.

## 2. `/loop` 이 실제로 어떻게 도는가

Claude Code v2.1.247 기준.

| 입력 | 동작 |
|------|------|
| `/loop 5m <프롬프트>` | 고정 인터벌. `CronCreate` 로 cron 등록. 7일 후 자동 만료 |
| `/loop <프롬프트>` | **dynamic 모드.** 지금 실행하고, 턴 마지막에 `ScheduleWakeup` 으로 다음 tick 예약 |
| `/loop` (인자 없음) | `<cwd>/.claude/loop.md` 를 읽어 그 내용을 tick 지시문으로 사용 |

dynamic 모드의 계약:

- 매 턴 마지막에 `ScheduleWakeup({delaySeconds, reason, prompt, noop})` 을 부르지 않으면 루프가 끝난다.
  (정확히는 keepalive 로 1200초짜리 한 번을 더 주고, 그때도 재예약이 없으면 종료.)
- `delaySeconds` 는 `[60, 3600]` 으로 clamp 된다.
- `prompt` 에는 다음 fire 가 다시 이 루프로 들어오도록 원래 입력을 그대로 넘긴다.
  `loop.md` 경로일 때는 `<<loop.md-dynamic>>` 센티널을 넘긴다 (fire 시점에 파일 내용으로 확장됨).
- `ScheduleWakeup({stop: true})` 가 **정상 종료**다. 실패가 아니다.
- `loop.md` 는 매 fire 마다 전달되고 25000 바이트에서 잘린다. 그래서 짧게 유지한다.

## 3. 구조

```text
tetris-loop/
├── SPEC_00_PROJECT.md          요구사항 원본 (유일한 진실)
├── CLAUDE.md                   불변 제약 (매 tick 자동 로드)
├── MEMORY.md                   진행 상태 사람용 사본
├── docs/LOOP_HARNESS.md        이 문서
├── .claude/
│   ├── loop.md                 tick 디스패처 — 계속할지 끊을지만 결정
│   └── skills/
│       ├── spec-loop/          루프 1회 실행 (구현 + 기록 + 커밋)
│       ├── spec-verify/        브라우저 검증 게이트 (관측 전용)
│       └── spec-status/        진행 보고 (읽기 전용)
└── .loop/
    ├── state/progress.json     기계용 상태 (정답)
    └── reports/                반복별 리포트 (커밋 대상)
```

책임 분리:

| 파일 | 하는 일 | 절대 안 하는 일 |
|------|---------|-----------------|
| `.claude/loop.md` | 상태 읽고 `/spec-loop` 호출, 재예약/정지 판단 | 코드 수정 |
| `spec-loop` | 구현, 리포트, 상태 갱신, 통과 시 커밋 | `ScheduleWakeup` 호출 |
| `spec-verify` | 브라우저 관측, 항목별 판정 | 코드 수정, 상태 파일 쓰기 |
| `spec-status` | 요약 출력 | 모든 쓰기 |

루프 수명 관리는 `loop.md` 한 곳에만 있다. 스킬이 재예약하면 두 곳이 루프를 잡게 되고
정지 조건이 새기 때문이다.

## 4. 상태 모델

`.loop/state/progress.json` 이 정답이다. `MEMORY.md` 는 사본이고, 어긋나면 JSON 을 믿는다.

```json
{
  "schema": 1,
  "current_spec": "SPEC_00",
  "spec_file": "SPEC_00_PROJECT.md",
  "iteration": 0,
  "max_iterations": 3,
  "status": "PENDING",
  "failure_signatures": [],
  "checklist": { "1_six_files_only": "UNKNOWN" },
  "last_report": null,
  "human_input_needed": null,
  "updated_at": null
}
```

### 상태 전이

```text
                    ┌──────────────────────────────┐
                    ▼                              │
PENDING ──▶ IN_PROGRESS ──▶ VERIFYING ──▶ FAILED ──┘  (iteration+1, 재시도)
                    │            │
                    │            ├──▶ PASSED    커밋 후 루프 정지
                    │            └──▶ BLOCKED   사람 대기, 루프 정지
                    └──────────────────▶ BLOCKED
                                 
어느 상태에서든 ──▶ HALTED   정지 조건 발동, 루프 정지
```

`PASSED` · `BLOCKED` · `HALTED` 는 **종료 상태**다. 셋 다 루프를 `stop: true` 로 끝낸다.
차이는 사람이 할 일이다 — 각각 "다음 SPEC 쓰기" / "결정 내려주기" / "접근 바꾸기".

### 정지 조건 (SPEC_00 §9 를 기계화한 것)

| 조건 | 결과 |
|------|------|
| `iteration >= max_iterations` | `HALTED` |
| `failure_signatures` 에 같은 값 두 번 | `HALTED` |
| 브라우저 도구 없음 | `BLOCKED` (구현 시작 안 함, `iteration` 소비 안 함). `--chrome` 세션으로 다시 열면 `PENDING` 으로 자동 복구 |
| SPEC 에 없는 결정 필요 | `BLOCKED` + `[사람 확인 필요]` |

**실패 시그니처**는 재발 감지의 열쇠라서 정규화된 짧은 문자열이어야 한다.
`<파일>:<증상>` 형태 — 예: `index.html:css-path-typo`, `test.html:board-row-shared-reference`.
타임스탬프나 가변 수치가 들어가면 같은 실패가 매번 다른 값이 되어 정지 조건이 죽는다.

## 5. 실행

브라우저 검증이 필수이므로 **`--chrome` 없이는 루프가 진행되지 않는다.**

```bash
cd /home/al-hub/workspace/tetris-loop
claude --chrome
```

세션 안에서:

| 명령 | 용도 |
|------|------|
| `/loop /spec-loop` | **1차 진입점.** 자기 페이스 루프 시작 |
| `/loop` | `.claude/loop.md` 훅 경로. 기능 플래그가 켜져 있을 때만 동작 |
| `/spec-loop` | 루프 없이 한 걸음만 |
| `/spec-verify` | 지금 상태를 검증만 |
| `/spec-status` | 진행 확인 (아무것도 안 고침) |

`/loop /spec-loop` 을 1차로 두는 이유: `loop.md` 경로는 서버 측 기능 플래그
(`tengu_kairos_loop_prompt`)에 걸려 있어서 꺼져 있으면 사용법만 출력하고 만다.
슬래시 커맨드를 인자로 주는 형태는 플래그와 무관하게 동작한다.

### 정지

SPEC 이 `PASSED` · `BLOCKED` · `HALTED` 가 되면 루프가 스스로 멈춘다.
수동 정지는 Ctrl+C 또는 "루프 정지" 라고 말하면 된다.

## 6. 다음 SPEC 으로 넘어가기

**자동으로 넘어가지 않는다.** 의도된 설계다 — SPEC 경계는 사람이 결과를 보고 넘는 지점이다.

1. 새 SPEC 문서를 쓴다 (`SPEC_01_*.md`). frontmatter 에 `id` · `depends_on` · `max_iterations`.
2. `.loop/state/progress.json` 을 갱신한다.
   - `current_spec` · `spec_file` 을 새 SPEC 으로
   - `iteration` → `0`, `status` → `PENDING`
   - `failure_signatures` → `[]`, `checklist` → 새 SPEC 의 완료 조건으로 교체
   - `human_input_needed` → `null`
3. `MEMORY.md` 를 같은 내용으로 맞춘다.
4. `claude --chrome` 세션에서 `/loop /spec-loop`.

`.loop/reports/` 는 지우지 않는다. SPEC 별 파일명(`<SPEC>-iter-<N>.md`)으로 누적되고,
커밋 대상이다 — 루프가 무엇을 왜 했는지가 이력이다.

## 7. 아는 한계

- 검증이 `claude --chrome` 세션에 의존한다. 헤드리스 CI 에서는 못 돈다.
- `loop.md` 훅 경로는 서버 기능 플래그에 의존한다. `/loop /spec-loop` 이 안전한 쪽이다.
- dynamic 루프는 세션 수명 안에서만 산다. 세션을 닫으면 끝난다.
  (지속 실행이 필요하면 `/schedule` 쪽 클라우드 경로를 봐야 한다.)
- `iteration` 을 소비할지 말지는 `spec-loop` 의 판단이다. 구현을 시작하지 못한 `BLOCKED` 은
  소비하지 않는다 — 사람이 세션을 잘못 열었다고 반복 예산을 태우면 안 되기 때문.
