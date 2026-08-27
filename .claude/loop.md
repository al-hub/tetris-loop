# 루프 tick — SPEC 진행 디스패처

이 tick 의 일은 단 하나다. **현재 SPEC 을 한 걸음 전진시키고, 루프를 계속할지 끊을지 정한다.**
직접 코드를 고치지 말고 `/spec-loop` 스킬에 맡긴다.

프로젝트 규칙은 `CLAUDE.md`, 설계는 `docs/LOOP_HARNESS.md` 에 있다.

## 1. 상태 읽기

`.loop/state/progress.json` 을 읽는다. 파일이 없거나 JSON 파싱이 실패하면
그 사실을 한 줄로 보고하고 `ScheduleWakeup({stop: true})` 로 루프를 끝낸다. 복구를 시도하지 않는다.

## 2. 종료 상태면 즉시 정지

`status` 가 `PASSED` · `BLOCKED` · `HALTED` 중 하나면 루프가 이미 끝난 것이다.

- 한 줄로 결과를 보고한다 (`PASSED` 면 통과 사실, `BLOCKED` 면 `human_input_needed` 내용,
  `HALTED` 면 정지 사유).
- `ScheduleWakeup({stop: true})` 를 호출하고 이 tick 을 끝낸다.
- **재시도하지 않는다.** 이 세 상태는 전부 사람의 판단을 기다리는 상태다.

### 예외 — 브라우저 게이트가 이미 풀린 경우

`status` 가 `BLOCKED` 이고 `human_input_needed` 가 **브라우저 도구 없음**을 사유로 적고 있는데
지금 세션에 브라우저 도구가 있다면, 사람이 이미 `claude --chrome` 으로 다시 연 것이다.
이때만 예외로:

- `status` → `PENDING`, `human_input_needed` → `null` 로 되돌려 저장하고
- 3번으로 진행한다

다른 사유의 `BLOCKED`(SPEC 에 없는 결정 대기 등)은 스스로 풀지 않는다. 그건 사람이 답할 몫이다.

## 3. 진행 중이면 한 걸음

`status` 가 `PENDING` · `IN_PROGRESS` · `VERIFYING` · `FAILED` 면
`Skill({skill: "spec-loop"})` 를 호출한다. 구현·검증·기록은 전부 그 스킬이 한다.

## 4. 스킬이 끝나면 다시 판정

`.loop/state/progress.json` 을 **다시 읽고** 2번 판정을 그대로 적용한다.

- 종료 상태가 되었으면 → 보고 후 `ScheduleWakeup({stop: true})`
- 아직 `FAILED` 이고 `iteration < max_iterations` 이면 → 다음 tick 예약:

```
ScheduleWakeup({
  delaySeconds: 60,
  reason: "SPEC_00 반복 <N> 실패, 즉시 재시도",
  prompt: "<<loop.md-dynamic>>",
  noop: false
})
```

재시도는 외부 이벤트를 기다리는 게 아니라 바로 이어서 하는 일이므로 짧은 지연이 맞다.
`Monitor` 는 걸지 않는다 — 이 루프를 깨울 외부 이벤트가 없다.

## 5. 이 루프의 정지가 정상 종료다

SPEC 하나가 끝나면 멈춘다. 다음 SPEC 으로 자동으로 넘어가지 않는다.
사람이 `.loop/state/progress.json` 의 `spec_file` 을 바꾸고 `/loop` 을 다시 실행한다.
