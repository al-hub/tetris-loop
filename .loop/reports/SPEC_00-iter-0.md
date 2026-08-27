# SPEC_00 반복 0 — PASSED

- 실행 시각: 2026-08-27T13:48:21+09:00
- SPEC revision: 2
- 결과: 산출물 6개 구현, 완료 조건 13개 전부 브라우저에서 관측 통과.

## 관측 환경

| 항목 | 값 |
|------|-----|
| 브라우저 | Windows Chrome (claude-in-chrome 확장, deviceId 0370496b…) |
| devicePixelRatio | 1.65 |
| 전송 | `http://localhost:8123` (WSL `python3 -m http.server`, 검증 후 종료) |

### `file://` 을 쓰지 못한 이유

확장의 URL allowlist 가 `file://` 스킴을 거부한다.
`file://wsl.localhost/Ubuntu/...` 과 `file:///C:/` 둘 다 같은 응답이었다.

```
Can't interact with browser-internal or unparseable URLs.
```

WSL2 NAT 환경에서 Windows Chrome 이 WSL 파일시스템을 `file://` 로 여는 경로가 없어
정적 서버를 **관측 전송 수단으로만** 썼다. 산출물에 서버 의존이 생긴 것은 아니다.

**SPEC §2 의 "두 HTML 은 `file://` 로 직접 열어서 동작해야 한다" 는 미관측이다.**
§6 완료 조건 13개에는 이 조항이 없어 판정에 반영하지 않았다.
두 스킴이 갈릴 수 있는 지점은 정적으로 부재를 확인했다:
`type="module"` 없음 · fetch/XHR 없음 · 모든 참조가 같은 폴더 상대경로 · 외부 URL 0건.

## 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | `ls -a` — 산출물 정확히 6개, 초과 파일 0 |
| 6-2 | 설치·외부참조 없음 | PASS | `package.json`·lockfile·`node_modules/`·번들러/TS 설정 전부 부재. 두 HTML `https?://`·`//cdn` grep 0건 |
| 6-3 | 콘솔 error 0건 | PASS | 콘솔 트래킹 활성 후 재로드 → 6초 → 키입력 → 클릭. `onlyErrors` 0건, 전체 메시지도 0건 |
| 6-4 | index 로드 순서·defer | PASS | style.css → `game.js defer` → `main.js defer`, `type="module"` 없음 |
| 6-5 | test 로드 순서 | PASS | `game.js` → `test.js` |
| 6-6 | FAIL 0 / PASS ≥18 | PASS | `#test-summary data-pass=20 data-fail=0`, `li` 20개, 필수 `data-name` 18개 전부 존재 (missingRequired 빈 배열) |
| 6-7 | 보드 20×10=200 | PASS | `[data-role="row"]` 20, 행별 셀 집합 `[10]`, 전체 셀 200, `canvas` 없음 |
| 6-8 | 패널 값·라벨 | PASS | score `0` · lines `0` · status `READY`, 라벨 `점수`·`제거한 줄`·`게임 상태` |
| 6-9 | title·h1 | PASS | 둘 다 `TETRIS LOOP` |
| 6-10 | 버튼·조작 안내 | PASS | 버튼 텍스트 `시작`, `disabled=false`. controls 문자 단위 비교 `true` |
| 6-11 | render 가 상태를 씀 | PASS | `0/0/READY` → `1234/7/PAUSED`. `board:[[0,0,0],[0,0,0]]` 주면 행 2·셀 6 → 보드 크기도 상태에서 읽음 |
| 6-12 | 여섯 폭 가로 스크롤 없음 | PASS | 320·390·480·768·1024·1440 전부 `scrollWidth == clientWidth`. 390 세로 배치, 1024 좌우 배치 (panel.left 252 ≥ board.right 236) |
| 6-13 | 정지 상태 불변 | PASS | 200셀+패널 스냅샷 → 6초 → `← → ↓ ↑ Space P` → `시작` 클릭(activeElement `BUTTON/start`) → `identical: true` |

### §8 수동 검증

1. 셀 격자 시각 구분 — 통과 (확대 스크린샷에서 10×20 격자선 확인)
2. 1024px↑ 보드 왼쪽 / 패널 오른쪽 — 통과
3. 390px 세로 배치, 잘림 없음 — 통과 (제목·보드·시작 버튼·패널·조작 안내 전부 표시)

### 6-12 측정 주석

폭 320·390·480 은 Chrome 최소 창 폭(outer 516 / viewport 456) 아래여서
창 리사이즈로 도달할 수 없다. 같은 origin 의 iframe 폭을 지정해 실제 렌더를 관측했다.

768px 만 세로 배치로 측정됐다. iframe 실측 CSS 폭이 dpr 1.65 때문에 767.99px 이라
`min-width: 768px` 이 걸리지 않은 측정 오차다. 769px 에서 `flex-direction: row` 로
전환되는 것과 `(min-width: 767.5px)` 가 참인 것을 확인해 브레이크포인트 자체는 정상이다.
6-12 가 768px 에 요구하는 것은 가로 스크롤 부재뿐이고 그건 통과했다.

## 실패 원인

없음.

## 실패 시그니처

없음.

## 반복 소비

없음. `iteration` 0 에서 통과했다.

## 다음 조치

SPEC_00 완료. 루프는 정지한다 — 다음 SPEC 으로 자동 진행하지 않는다.

사람이 할 일:

1. (선택) `file://` 직접 열기를 눈으로 확인하고 싶으면 Windows Chrome 주소창에
   `file://wsl.localhost/Ubuntu/home/al-hub/workspace/tetris-loop/index.html` 을 붙여 넣는다.
2. 다음 SPEC 문서를 쓰고 `.loop/state/progress.json` 의 `spec_file`·`current_spec` 을 바꾼다.
3. `iteration` 을 0, `status` 를 `PENDING`, `checklist` 를 새 SPEC 것으로 교체한 뒤 `/loop /spec-loop`.
