# tetris-loop — 프로젝트 규칙

이 저장소는 **루프 엔지니어링 하네스**로 운영된다. 사람이 매 단계를 지시하지 않고,
`/loop` 이 SPEC 문서 하나를 읽어 구현 → 검증 → 기록 → 정지까지 스스로 수행한다.

하네스 설계는 [docs/LOOP_HARNESS.md](docs/LOOP_HARNESS.md), 진행 상태는 [MEMORY.md](MEMORY.md)에 있다.

## 1. 지금 작업 중인 SPEC

`.loop/state/progress.json` 의 `spec_file` 이 현재 SPEC 이다. 지금은 `SPEC_00_PROJECT.md`.
**SPEC 문서가 유일한 요구사항 출처다.** 이 CLAUDE.md 는 SPEC 을 대체하지 않고 제약만 고정한다.

## 2. 산출물 제약 (SPEC_00 §2)

- 산출물은 정확히 이 여섯 개뿐이다.
  `index.html` · `style.css` · `game.js` · `main.js` · `test.html` · `test.js`
- HTML5, CSS, 브라우저 기본 JavaScript만 쓴다.
- 프레임워크 · 번들러 · 패키지 매니저 · 외부 라이브러리 금지.
- 패키지 설치 · 설정 파일 · 개발 서버 · 빌드 단계가 없어야 한다.
  `package.json`, lockfile, `node_modules/`, `tsconfig.json` 등을 만들지 않는다.
- `index.html` 은 `style.css`, `game.js`, `main.js` 를 직접 불러온다.
  `game.js` 가 `main.js` 보다 먼저이고, 두 스크립트 모두 `defer` 를 쓴다.
- `test.html` 은 `game.js`, `test.js` 를 직접 불러온다.

### 하네스 파일은 예외

`CLAUDE.md`, `MEMORY.md`, `SPEC_*.md`, `docs/`, `.claude/`, `.loop/`, `.gitignore` 는
하네스 파일이며 "여섯 개 파일" 제약의 대상이 아니다. 검증 시에도 위반으로 세지 않는다.

## 3. 코드 구조

- `game.js` 는 **DOM 에 접근하지 않는 순수 로직**이다. `globalThis.TetrisGame` 하나로만 공개한다.
- `main.js` 가 DOM 렌더링을 담당하고 `globalThis.TetrisApp` 하나로만 공개한다.
- `test.js` 는 `game.js` 의 공개 API 만 검증한다.
- 이 분리를 지켜야 `test.html` 이 브라우저에서 독립적으로 돌아간다.
- **화면 값을 HTML 에 하드코딩하지 않는다.** 보드 크기와 패널 값은 반드시
  `TetrisGame` 이 만든 상태 객체에서 읽어 렌더한다 (SPEC §4.5, 완료 조건 6-11 이 이를 검사한다).
- 스크립트는 classic script 로만 불러온다. `type="module"` 은 `file://` 에서 CORS 로 죽는다.
- 검증이 DOM 을 세야 하므로 `data-role` 속성 계약(SPEC §3)을 지킨다.

## 4. 범위 통제

- 현재 SPEC 의 "범위 밖"(SPEC_00 §5) 기능을 미리 구현하지 않는다.
  나중에 필요할 것 같아도 만들지 않는다. 범위 초과는 실패로 취급한다.
- SPEC 에 없는 화면 · 기술 결정이 필요하면 **추측하지 않는다.**
  `.loop/state/progress.json` 의 `human_input_needed` 에 `[사람 확인 필요]` 로 적고
  상태를 `BLOCKED` 으로 두고 멈춘다.

## 5. 안전 (SPEC_00 §9)

- 프로젝트 폴더(`/home/al-hub/workspace/tetris-loop`) 밖의 파일을 만들거나 수정하지 않는다.
- 외부 배포와 유료 서비스를 쓰지 않는다.
- 정지 조건: 같은 실패가 두 번 반복되거나, 총 세 번 실행해도 완료하지 못하면 중단한다.

## 6. 검증

- 완료 판정은 **`/spec-verify` 가 실제 브라우저에서 관측한 결과**로만 내린다.
- 브라우저 도구가 없는 세션에서는 검증할 수 없다. 이때는 통과로 추측하지 않고
  `BLOCKED` 으로 기록하고 멈춘다. 세션을 `claude --chrome` 으로 다시 열어야 한다.
- 직접 관측하지 못한 항목을 `PASS` 로 적지 않는다. 관측 실패는 `BLOCKED` 이다.

## 7. 언어와 커밋

- 문서 · 주석 · 커밋 메시지 본문은 한국어로 쓴다.
- SPEC 이 통과했을 때만 커밋한다. 커밋 제목 형식: `feat(SPEC_00): 요약`
- 실패한 반복은 커밋하지 않는다. 리포트만 남긴다.
