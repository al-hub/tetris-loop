# SPEC_02 반복 0 — BLOCKED (구현 완료, 브라우저 관측 4건 미수행)

- 실행 시각: 2026-08-27T15:47:59+09:00
- SPEC revision: 1
- 결과: 구현을 마쳤고 20개 조건 중 16개를 기계로 확인했다. 나머지 4개는 브라우저가 없어 미검증이다.

## 이번 실행의 전제

세션에 `claude-in-chrome` MCP 가 없다 (서버 끊김, `/chrome` 으로도 복구되지 않음).
사람이 "검증은 직접 하겠다, 바로 진행하자" 고 지시해 브라우저 게이트를 우회하고 구현했다.
**`PASSED` 로 적지 않는다** — 브라우저에서 관측하지 못한 항목은 미검증으로 남긴다.

관측 수단으로 Node 를 썼다. 프로젝트 밖(scratchpad)에 도구 두 개를 두고 돌렸다.
산출물 여섯 파일과 저장소에는 아무 것도 추가하지 않았다.

| 도구 | 하는 일 |
|------|---------|
| `run-tests.js` | 가짜 DOM 을 물려 `game.js` + `test.js` 를 그대로 실행 |
| `run-dom.js` | index.html 구조의 DOM 스텁에 `game.js` + `main.js` 를 올리고 §6 조건을 점검 |

## 구현 요약

`game.js` — 순수 로직 4개 추가 (공개 키 15 → 19).

- `lockPiece(board, piece)` · `findFullRows(board)` · `clearRows(board, rows)` · `lockAndAdvance(state)`
- `applyMove` 규칙 3 을 `LANDED` 반환에서 `lockAndAdvance(state)` 한 번 호출로 교체
- DOM·타이머·리스너 접근 0건 유지 (grep 확인)

`main.js` — 렌더가 `board` 값과 `piece` 를 합쳐 그리도록 고치고 `loadState(state)` 공개.
낙하 타이머는 `loadState` 경로에서도 최대 한 개다.

`test.js` — 폐기 4개 제거, 신규 31개 추가. 총 79개.

## 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 6-1 | 산출물 집합 일치 | PASS | `ls -a` — 산출물 정확히 6개, 초과 0 |
| 6-2 | 설치·외부참조 없음 | PASS | 설치 산출물 전부 부재, 두 HTML 외부 URL 0건 |
| 6-3 | 페이지가 만든 콘솔 error 0건 | **미검증** | 브라우저 콘솔을 읽을 수 없음 |
| 6-4 | 로드 직후 READY 스냅샷 | PASS (Node DOM) | `READY`·`0`·`0`, 블록 0, 셀 200, 행 20, 타이머 0, `count` 0 |
| 6-5 | FAIL 0 / PASS ≥78 | PASS (Node) · 브라우저 미검증 | Node 실행 `PASS 79 / FAIL 0`, 폐기 4개 부재 확인. `test.html` 을 브라우저로 연 결과는 미관측 |
| 6-6 | 고정 + 현재 블록 합성 렌더 | PASS (Node DOM) | 셀 7개, 좌표 `{(19,0),(19,1),(19,2)}` ∪ T 4칸 |
| 6-7 | 한 줄 제거 | PASS (Node DOM) | `lines`=1, `PLAYING`, 셀 7, 남은 고정 행 `{17,18,19}` (열 9) |
| 6-8 | 두 줄 동시 제거 | PASS (Node DOM) | `lines`=2 |
| 6-9 | 압축 결과 | PASS (Node DOM) | 열 9 의 남은 고정 셀 2개, 행 `{18,19}` |
| 6-10 | `LANDED` 미노출 | PASS (Node DOM) | 착지 직후 `PLAYING` |
| 6-11 | 게임오버 전이 | PASS (Node DOM) | `GAME_OVER`, 타이머 0, `lines` 0 |
| 6-12 | GAME_OVER 입력 무시 | PASS (Node DOM) | 좌표·`lines`·`status`·`count` 전부 동일 |
| 6-13 | 예약 tick 무해 (2450ms) | **미검증** | 실시간 타이머 관측 필요 |
| 6-14 | `tick()` 직접 호출 무해 | PASS (Node DOM) | 3회 호출 후 네 값 불변 |
| 6-15 | 입력당 고정 처리 한 번 | PASS (Node DOM) | `lines` +1, 셀 7, 행 ≤3 셀 정확히 4 |
| 6-16 | 고정 셀이 이동 차단 | PASS (Node DOM) | 좌표 집합 불변 |
| 6-17 | 고정 셀이 회전 차단 | PASS (Node DOM) | 좌표 집합 불변 |
| 6-18 | 재시작 초기화 | PASS (Node DOM) | `PLAYING`, 셀 4, `lines`·`score` 0, 타이머 1 |
| 6-19 | 재시작 2회 후 타이머 하나 | 부분 — 개수 PASS, **간격 미검증** | 타이머 개수 1 확인. 평균 간격 ≥630ms 는 실시간 측정 필요 |
| 6-20 | 버튼·안내 문구 | 부분 — 버튼 PASS, **controls 미검증** | 세 상태 모두 `시작`. `[data-role="controls"]` 문자 비교는 브라우저에서 |

종합: **PASS 16 / 미검증 4 (6-3 · 6-13 · 6-19 간격 · 6-20 controls) / FAIL 0**

"PASS (Node DOM)" 은 실제 브라우저가 아니라 DOM 스텁 위에서 관측했다는 뜻이다.
로직·상태·DOM 속성 계약은 증명되지만 **CSS 색, 실제 렌더, 실시간 타이머, 콘솔은 증명되지 않는다.**

## 실패 원인

없음. 관측한 16개 전부 기대값과 일치했다.

## 실패 시그니처

없음.

## 반복 소비

없음. `iteration` 은 0 그대로다. 커밋하지 않았다 — `CLAUDE.md` §7 은 SPEC 통과 시에만 커밋한다.

## 사람이 브라우저에서 확인할 것

로컬 서버를 띄우고 `http://localhost:8123/` 로 연다.

```bash
python3 -m http.server 8123
```

1. **6-5** — `test.html` 요약이 `PASS 79 / FAIL 0` 인지.
2. **6-3** — `index.html` 을 열고 콘솔에 페이지가 만든 error 가 있는지
   (확장이 주입하는 `A listener indicated an asynchronous response…` 는 세지 않는다).
3. **6-20** — 조작 안내가 아래와 한 글자도 다르지 않은지.
   `← → ↓ 이동 · ↑ 회전 · Space 하드 드롭 · P 일시정지`
4. **6-13 · 6-19** — 콘솔에 아래를 붙여 넣는다.

```js
// 6-13: GAME_OVER 후 2450ms 동안 아무것도 변하지 않아야 한다
(async () => {
  const G = TetrisGame, fill = (b,r,f,t,v) => { for (let c=f;c<=t;c++) b[r][c]=v; return b; };
  const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b,r,0,8,'O'));
  TetrisApp.loadState({board:b, piece:{type:'I',cells:G.rotateCells(G.PIECE_SHAPES.I),row:16,col:7},
                       score:0, lines:0, status:'PLAYING'});
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',cancelable:true,bubbles:true}));
  const snap = () => [document.querySelectorAll('[data-piece]').length,
                      document.querySelector('[data-role="lines"]').textContent,
                      document.querySelector('[data-role="status"]').textContent,
                      TetrisApp.getDropStats().count].join('|');
  const before = snap();
  await new Promise(r => setTimeout(r, 2450));
  console.log('6-13', before === snap() ? 'PASS' : 'FAIL', before, snap());
})();

// 6-19: 재시작 2회 후 타이머 하나 · 평균 간격 630ms 이상 (페이지를 새로 로드한 직후에 실행)
(async () => {
  const btn = document.querySelector('[data-role="start"]');
  const G = TetrisGame, fill = (b,r,f,t,v) => { for (let c=f;c<=t;c++) b[r][c]=v; return b; };
  for (let i = 0; i < 2; i++) {
    const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b,r,0,8,'O'));
    TetrisApp.loadState({board:b, piece:{type:'I',cells:G.rotateCells(G.PIECE_SHAPES.I),row:16,col:7},
                         score:0, lines:0, status:'PLAYING'});
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',cancelable:true,bubbles:true}));
    btn.click();
  }
  console.log('타이머 개수', TetrisApp.getActiveDropTimerCount());
  await new Promise(r => setTimeout(r, 2000));
  const a = TetrisApp.getDropStats();
  await new Promise(r => setTimeout(r, 2450));
  const c = TetrisApp.getDropStats();
  const dc = c.count - a.count, gap = dc ? (c.lastAt - a.lastAt) / dc : null;
  console.log('6-19', dc === 0 ? 'BLOCKED(억제)' : (gap >= 630 ? 'PASS' : 'FAIL'), 'Δcount', dc, '평균', gap);
})();
```

§8 수동 2항목(굳은 블록이 남고 새 블록이 내려오는지 · 줄이 사라지며 위가 내려앉는지)도 같이 본다.

## 다음 조치

네 항목이 사람 눈으로 통과하면 알려준다. 그러면 `progress.json` 을 `PASSED` 로 올리고
`feat(SPEC_02): …` 로 커밋한다. 하나라도 어긋나면 그 항목부터 고친다 (`iteration` 은 그때 소비한다).
