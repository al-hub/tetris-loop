---
id: SPEC_03
title: 점수 규칙과 로컬 리더보드
revision: 1
depends_on: [SPEC_00, SPEC_01, SPEC_02]
max_iterations: 3
---

# SPEC 03 — 점수 규칙과 로컬 리더보드

## 1. 목표

지금까지 `score` 는 상태 키로만 있고 값이 늘 `0` 이었다. 이번 단계에서 줄을 지우면 점수가 오른다.
그리고 게임이 끝나면 사람이 이름을 넣어 결과를 브라우저 `localStorage` 에 남기고,
페이지를 다시 열어도 그 기록이 순위대로 다시 보인다.

서버는 쓰지 않는다. 기록은 지금 이 브라우저에만 있다.

## 2. 기술과 파일 구조

`SPEC_00 §2` 와 같다. 산출물은 여섯 개 그대로이고 파일을 늘리지 않는다.

이번 SPEC 이 **앞 SPEC 을 덮어쓰는 지점**은 넷이다.

| 앞 조항 | 이번 SPEC 에서 |
|---------|----------------|
| SPEC_02 §5 "점수 계산·점수 획득 규칙·콤보 — 범위 밖" | **폐기.** 점수 규칙을 이번에 정한다 (§4.2). 콤보는 여전히 범위 밖이다 |
| SPEC_02 §3.2 "`[data-role="score"]` 는 이번 단계 내내 `0`" | **폐기.** `state.score` 를 그대로 표시하며 줄 제거로 오른다 |
| SPEC_02 §4.4 `lockAndAdvance` 반환의 `score` = `state.score` (불변) | **교체.** `state.score + scoreForLines(제거한 줄 수)` (§4.3) |
| SPEC_02 §7.3 `lock-and-advance-keeps-score` | **폐기.** 대체 이름은 `lock-and-advance-adds-score` (§7.2) |

원 요구사항에 있던 금지 조항 *"이번 SPEC 을 이유로 점수 계산 공식을 새롭게 추가하지 않는다"* 는
**이번 SPEC 이 명시적으로 폐기한다.** 점수와 리더보드를 한 문서에서 다루기로 사람이 결정했고,
그 결정 없이는 리더보드 정렬 1순위가 실게임에서 영원히 동점이 된다 (§11).

`localStorage` 접근은 `main.js` 에서만 한다. `game.js` 는 여전히 DOM 도 저장소도 모른다.

## 3. 화면 정의

### 3.1 게임오버 결과 영역

`index.html` 에 아래 구조를 둔다. `hidden` 속성으로 표시를 토글한다.

```html
<section data-role="gameover" hidden>
  <p>최종 점수 <span data-role="final-score">0</span></p>
  <p>제거한 줄 <span data-role="final-lines">0</span></p>
  <input data-role="name-input" type="text" maxlength="20" placeholder="이름">
  <button data-role="save">기록 저장</button>
  <p data-role="name-error"></p>
</section>
```

- `status` 가 `GAME_OVER` 일 때만 `hidden` 을 뗀다. `READY` · `PLAYING` 에서는 `hidden` 이 붙어 있다.
- `[data-role="name-error"]` 는 오류가 없으면 빈 문자열이다. 위치는 입력란 바로 다음 형제다.
- `maxlength="20"` 은 입력 편의를 위한 것이고 **검증 근거가 아니다.** 판정은 §4.4 가 한다.

### 3.2 리더보드 영역

항상 표시한다. 기록이 없으면 `[data-role="record"]` 가 0개다.

```html
<section data-role="leaderboard">
  <h2>리더보드</h2>
  <ol data-role="record-list">
    <li data-role="record">
      <span data-role="rank">1</span>
      <span data-role="record-name">민수</span>
      <span data-role="record-score">800</span>
      <span data-role="record-lines">4</span>
    </li>
  </ol>
  <button data-role="clear-leaderboard">리더보드 초기화</button>
</section>
```

- `[data-role="record"]` 는 정렬 결과와 **같은 순서**로 나온다. 최대 10개다.
- `[data-role="rank"]` 는 `1` 부터 시작하는 표시 순위다.
- `playedAt` 은 화면에 표시하지 않는다 (§5).

### 3.3 화면 문구

아래 문자열을 그대로 쓴다. 완료 조건이 문자 단위로 비교한다.

```text
기록 저장
리더보드
리더보드 초기화
이름은 2자 이상이어야 합니다
이름은 10자 이하여야 합니다
한글·영문·숫자만 쓸 수 있습니다
저장 완료
```

`confirm` 창 문구는 이것이다.

```text
리더보드를 모두 지울까요?
```

### 3.4 상태 패널

`[data-role="score"]` 는 `state.score` 를, `[data-role="lines"]` 는 `state.lines` 를 그대로 쓴다.
`SPEC_02 §3.2` 의 "`score` 는 내내 `0`" 은 폐기됐다.

## 4. 상태와 공개 함수

### 4.1 좌표와 상태

`SPEC_02 §4.1` 과 같다. `state` 는 다섯 키 `board`·`piece`·`score`·`lines`·`status` 를 갖는다.

### 4.2 점수표

`game.js` 가 `Object.freeze` 된 배열로 공개한다. 인덱스가 한 번에 지운 줄 수다.

```js
SCORE_TABLE = [0, 100, 300, 500, 800]
```

| 한 번에 지운 줄 | 점수 |
|-----------------|------|
| 0 | 0 |
| 1 | 100 |
| 2 | 300 |
| 3 | 500 |
| 4 | 800 |

**`scoreForLines(count)`** — 순수 함수.

- `count` 가 `0`·`1`·`2`·`3`·`4` 이면 `SCORE_TABLE[count]` 를 반환한다.
- 그 밖의 값(음수 · `5` 이상 · 정수가 아닌 값 · 숫자가 아닌 값)은 `0` 을 반환한다.

점수가 오르는 경로는 **줄 제거 하나뿐이다.** 소프트 드롭·하드 드롭·시간·레벨 보너스는 없다.

### 4.3 `lockAndAdvance` 의 점수 가산

`SPEC_02 §4.4` 의 순서는 그대로다. 4단계만 이렇게 바뀐다.

4. `lines = state.lines + full.length`, **`score = state.score + scoreForLines(full.length)`**

반환 상태의 `score` 는 배치 가능 여부와 무관하게 이 값이다. 게임오버로 끝난 고정에서도
그 고정이 지운 줄의 점수는 더해진다.

### 4.4 이름 검증

**`validateName(raw)`** — 순수 함수. 아래 세 키를 가진 새 객체를 반환한다.

| 키 | 값 |
|----|-----|
| `ok` | `true` / `false` |
| `name` | `trim` 을 마친 문자열. `ok` 가 `false` 여도 채운다 |
| `reason` | `ok` 가 `true` 면 `null`. 아니면 `'TOO_SHORT'` · `'TOO_LONG'` · `'INVALID_CHAR'` 중 하나 |

판정 순서는 이것이다. 순서를 바꾸면 같은 입력에 다른 `reason` 이 나온다.

1. `raw` 가 문자열이 아니면 `''` 로 본다. `String.prototype.trim()` 을 적용한다.
2. **길이** — 길이는 `Array.from(name).length` (코드포인트 개수)로 센다.
   `2` 미만이면 `TOO_SHORT`, `10` 초과면 `TOO_LONG`.
3. **문자** — 정규식 `/^[가-힣A-Za-z0-9]+$/` 에 맞지 않으면 `INVALID_CHAR`.
4. 셋 다 통과하면 `ok: true`, `reason: null`.

허용 문자는 이 넷뿐이다.

| 종류 | 범위 |
|------|------|
| 한글 | 완성형 음절 `가`(U+AC00) ~ `힣`(U+D7A3) |
| 영문 대문자 | `A`~`Z` |
| 영문 소문자 | `a`~`z` |
| 숫자 | `0`~`9` |

한글 자모(`ㄱ`~`ㅣ`, U+3131~U+3163)는 **허용하지 않는다.** 조합 중간 상태가 기록에 남는 것을 막는다.
이름 안의 공백·특수문자·기호·이모지도 허용하지 않는다.

허용 문자가 전부 BMP 단일 코드 단위라 `length` 와 코드포인트 수가 같다. `Array.from` 을 쓰는 것은
이모지처럼 `length` 가 2 이상인 입력이 들어와도 길이 판정이 흔들리지 않게 하기 위해서다.

경계는 이렇다.

| 입력 (`trim` 후) | 결과 |
|------------------|------|
| `민` (1자) | `TOO_SHORT` |
| `민수` (2자) | `ok` |
| `가나다라마바사아자차` (10자) | `ok` |
| `가나다라마바사아자차카` (11자) | `TOO_LONG` |
| `Player1` | `ok` |
| `테트리스7` | `ok` |
| `김 민수` | `INVALID_CHAR` |
| `Player!` | `INVALID_CHAR` |
| `민수🎮` | `INVALID_CHAR` |
| `ㄱㄴ` | `INVALID_CHAR` |
| `  민수  ` | `ok`, `name` 은 `민수` |
| `a` | `TOO_SHORT` |
| `` (빈 문자열) | `TOO_SHORT` |

### 4.5 기록과 리더보드

**저장 키** — 정확히 이 문자열이다. `game.js` 가 상수로 공개한다.

```js
LEADERBOARD_KEY = 'tetris-loop.leaderboard.v1'
LEADERBOARD_LIMIT = 10
```

**기록 한 건**은 다섯 키를 갖는다. 순서는 상관없고 이름과 타입이 계약이다.

| 키 | 타입 | 의미 |
|----|------|------|
| `id` | `string` | 기록 식별자. 같은 게임 결과가 두 id 로 들어가지 않는다 |
| `name` | `string` | `validateName` 을 통과한 `trim` 완료 이름 |
| `score` | `number` | 게임오버 시점의 최종 점수 |
| `clearedLines` | `number` | 게임오버 시점의 누적 제거 줄 수 |
| `playedAt` | `number` | 저장 시각. `Date.now()` 의 epoch 밀리초 |

`id` 는 외부 라이브러리 없이 만든다. 형식은 구현에 맡기되 문자열이어야 하고,
한 번의 저장에서 하나만 만든다.

**`localStorage` 최상위 구조**는 **기록 객체의 배열**이다. 감싸는 객체를 쓰지 않는다.

```json
[{"id":"...","name":"민수","score":800,"clearedLines":4,"playedAt":1787812345678}]
```

**`sanitizeRecords(value)`** — 순수 함수. 어떤 값이 와도 던지지 않고 배열을 반환한다.

- `value` 가 배열이 아니면 (`null` · 문자열 · 숫자 · 객체 등) `[]` 를 반환한다.
- 배열이면 각 항목을 검사해 **다섯 키가 전부 있고 타입이 맞는 항목만** 남긴다.
  `id`·`name` 은 문자열, `score`·`clearedLines`·`playedAt` 은 `Number.isFinite` 를 만족하는 숫자다.
- 남은 항목의 순서는 입력 순서 그대로다. 값을 고치지 않는다.

**`sortRecords(records)`** — 순수 함수. 새 배열을 반환하고 원본을 변형하지 않는다.

1. `score` **내림차순**
2. 같으면 `playedAt` **오름차순**
3. 둘 다 같으면 **입력 배열에서의 기존 순서 유지** (안정 정렬)

`id`·`name`·`clearedLines` 를 정렬 기준으로 쓰지 않는다.

**`addRecord(records, record)`** — 순수 함수. 처리 순서를 바꾸지 않는다.

1. `records` 뒤에 `record` 를 붙인다
2. 전체를 `sortRecords` 로 정렬한다
3. 앞에서 `LEADERBOARD_LIMIT`(10)개만 남긴다

새 기록이 10위 안에 못 들면 결과에 포함되지 않는다. 원본 배열을 변형하지 않는다.

### 4.6 `main.js` — 저장소와 화면

`globalThis.TetrisApp` 에 아래를 추가한다. 앞 다섯은 `SPEC_02 §4.8` 그대로다.

| 이름 | 동작 |
|------|------|
| `getLeaderboard()` | 지금 메모리에 있는 기록 배열의 복사본을 반환한다 |
| `saveResult(rawName)` | 현재 게임 결과를 저장 시도하고 `{ ok, reason }` 을 반환한다 |
| `clearLeaderboard()` | 확인을 받고 리더보드를 비운다. 지웠으면 `true`, 취소면 `false` |
| `isSavedForCurrentGame()` | 이번 게임 결과가 이미 저장됐으면 `true` |

**페이지 로드** — `localStorage.getItem(LEADERBOARD_KEY)` 를 읽는다.

- 값이 없으면 빈 목록으로 시작한다.
- `JSON.parse` 가 던지면 **빈 목록으로 시작하고 `localStorage` 는 건드리지 않는다.**
- 파싱은 되지만 구조가 다르면 `sanitizeRecords` 결과를 쓴다. 이때도 `localStorage` 는 건드리지 않는다.
- 어느 경우에도 예외가 밖으로 나가지 않는다. 게임은 정상 실행된다.

손상 값을 정상 값으로 덮어쓰는 시점은 **다음 저장이 성공할 때 한 번뿐이다.**
읽기 실패만으로 사용자 데이터를 지우지 않는다 (§11).

**`saveResult(rawName)`**

1. `status` 가 `GAME_OVER` 가 아니면 `{ ok: false, reason: 'NOT_GAME_OVER' }`. 저장소를 건드리지 않는다.
2. 이번 게임을 이미 저장했으면 `{ ok: false, reason: 'ALREADY_SAVED' }`. 저장소를 건드리지 않는다.
3. `validateName(rawName)` 이 실패하면 `{ ok: false, reason: 검증 reason }`.
   저장소·기록·저장 완료 상태를 모두 그대로 둔다.
4. 통과하면 기록 하나를 만들어 `addRecord` 로 넣고, 결과를 `localStorage` 에 쓰고,
   화면을 다시 그리고, 이번 게임을 저장 완료로 표시한 뒤 `{ ok: true, reason: null }` 을 반환한다.

`score` 와 `clearedLines` 는 **`GAME_OVER` 가 된 순간에 찍어 둔 값**을 쓴다.
이름을 입력하는 동안 그 값이 바뀌지 않는다.

중복 저장 방지는 **버튼 비활성화가 아니라 `saveResult` 안의 2단계**가 담당한다.
버튼은 저장 성공 후 `disabled` 가 되고 `[data-role="name-error"]` 에 `저장 완료` 가 표시되지만,
그 UI 를 우회해 `saveResult` 를 다시 불러도 두 번째 기록은 생기지 않는다.

**저장 가능 상태의 초기화** — `startGame` 으로 새 게임이 시작되거나 `loadState` 로 상태가 교체되면
저장 완료 표시를 해제한다. 리더보드 기록은 건드리지 않는다.

**`clearLeaderboard()`** — `window.confirm('리더보드를 모두 지울까요?')` 를 부른다.

- `false` 면 아무 것도 하지 않고 `false` 를 반환한다. `localStorage` 도 화면도 그대로다.
- `true` 면 메모리 목록을 `[]` 로 만들고 `localStorage` 에 `[]` 를 쓰고 화면을 다시 그린 뒤 `true` 를 반환한다.

게임 재시작은 리더보드를 건드리지 않는다. 둘은 다른 상태다.

## 5. 범위 밖

- 서버 저장·서버 API·데이터베이스·온라인 리더보드·전 세계 순위
- 계정·로그인·회원가입·인증·기기 간 동기화·클라우드 백업·소셜 공유
- 콤보 보너스, 소프트/하드 드롭 점수, 시간 보너스
- 레벨, 레벨에 따른 낙하 속도 변경
- 하드 드롭(`Space`), 일시정지(`P`), `PAUSED` 상태
- 다음 블록 표시·미리보기, 홀드
- `playedAt` 의 화면 표시
- 무작위 블록 선택, wall kick

## 6. 완료 조건

전 항목이 관측 가능해야 한다. 판정 경로는 이렇게 갈린다.

| 조건 | 판정 경로 |
|------|-----------|
| 6-1 · 6-2 | 파일시스템 (`ls` · `grep`) |
| 6-3 | 브라우저 콘솔 |
| 6-4 | §7 러너 출력 (`test.html`) |
| 6-5 ~ 6-31 | 브라우저 관측 (DOM, 공개 함수 호출, 합성 이벤트, `localStorage` 직접 읽기) |
| §8 두 항목 | 사람 눈 |

입력의 필수 관측 수단은 `SPEC_02 §6` 과 같다 — 합성 디스패치와 도달성 프로브다.
보드 모양은 `TetrisApp.loadState` 로 만든다. `confirm` 은 검증이 임시로 바꿔 끼운다.

### 6.0 검증이 쓰는 준비물

```js
const G = TetrisGame, KEY = G.LEADERBOARD_KEY;
const fill = (b, r, f, t, v) => { for (let c = f; c <= t; c += 1) b[r][c] = v; return b; };
const verticalI = () => ({ type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });

// (가) 한 줄 완성 직전 — 19행 열 0~8 고정
const boardA = () => fill(G.createEmptyBoard(), 19, 0, 8, 'O');
// (다) 게임오버 직전 — 0~3행 열 0~8 고정 (완성 줄이 아니다)
const boardC = () => { const b = G.createEmptyBoard(); [0,1,2,3].forEach(r => fill(b, r, 0, 8, 'O')); return b; };
// 게임오버 만들기
const makeGameOver = (score, lines) => {
  TetrisApp.loadState({ board: boardC(), piece: verticalI(), score, lines, status: 'PLAYING' });
  window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', cancelable:true, bubbles:true}));
};
```

### 그룹 A — 점수 (6-5 ~ 6-9)

- [ ] **6-1** 산출물 파일 집합이 `SPEC_00 §2.1` 의 여섯 개와 정확히 일치한다 (하네스 파일 제외).
      하네스 파일은 `CLAUDE.md` · `MEMORY.md` · `SPEC_*.md` · `docs/` · `.claude/` · `.loop/` ·
      `.git/` · `.gitignore` 이며 세지 않는다.
- [ ] **6-2** `package.json`, lockfile, `node_modules/`, 번들러·TS 설정 파일이 없고,
      두 HTML 의 외부 URL 참조가 0건이며, 산출물 여섯 개를 grep 해
      `fetch(` · `XMLHttpRequest` · `WebSocket` · `navigator.sendBeacon` 이 0건이다 (서버 통신 없음).
- [ ] **6-3** `index.html` 로드 완료 후 5초, 그리고 게임오버·저장·초기화를 한 바퀴 돈 뒤 5초까지
      **페이지가 만든** 콘솔 error 레벨 0건이다 (warning 은 세지 않는다).
      확장이 주입한 예외는 세지 않는다 — 판별 기준은 `SPEC_01 §6` 6-3 과 같다.
- [ ] **6-4** `test.html` 요약이 `FAIL 0` 이고 `PASS` 가 **105 이상**이며,
      §7.3 의 필수 테스트 이름 28개와 §7.2 가 유지를 요구하는 77개가 전부 결과 목록에 있고,
      폐기한 `lock-and-advance-keeps-score` 는 목록에 **없다**.
- [ ] **6-5** `TetrisGame.SCORE_TABLE` 이 `[0, 100, 300, 500, 800]` 이고 `Object.isFrozen` 이 참이다.
- [ ] **6-6** 보드 (가)를 `loadState` 로 넣고 `ArrowDown` 을 한 번 넣으면
      `[data-role="score"]` 가 `100`, `[data-role="lines"]` 가 `1` 이 된다.
- [ ] **6-7** 18·19행 열 0~8 을 고정한 보드에 세로 `I` 를 두고 `ArrowDown` 을 한 번 넣으면
      `[data-role="score"]` 가 `300`, `[data-role="lines"]` 가 `2` 가 된다
      (두 줄 동시 제거가 `100 × 2` 가 아니다).
- [ ] **6-8** 점수 `500`·줄 `7` 인 상태에서 보드 (가)로 한 줄을 더 지우면
      `[data-role="score"]` 가 `600`, `[data-role="lines"]` 가 `8` 이 된다 (누적 가산).
- [ ] **6-9** `GAME_OVER` 로 끝나는 고정에서도 그 고정이 지운 줄의 점수가 더해진다.
      19행 열 0~8 을 고정하고 0~3행 열 0~8 도 고정한 보드에 세로 `I` 를 두고 `ArrowDown` 을 넣으면
      `status` 가 `GAME_OVER` 이고 `[data-role="score"]` 가 `100` 이다.

### 그룹 B — 리더보드 (6-10 ~ 6-31)

- [ ] **6-10** 로드 직후 `READY` 상태에서 `[data-role="gameover"]` 의 `hidden` 이 `true` 이고,
      `[data-role="leaderboard"]` 는 문서에 있으며 `[data-role="record"]` 개수가
      `localStorage` 에 저장된 유효 기록 수와 같다.
- [ ] **6-11** `PLAYING` 상태에서도 `[data-role="gameover"]` 의 `hidden` 이 `true` 다.
      그 상태에서 `TetrisApp.saveResult('민수')` 를 부르면
      `{ ok: false, reason: 'NOT_GAME_OVER' }` 이고 `localStorage` 값이 변하지 않는다.
- [ ] **6-12** `GAME_OVER` 가 되면 `[data-role="gameover"]` 의 `hidden` 이 `false` 가 되고,
      `[data-role="final-score"]` 와 `[data-role="final-lines"]` 가 각각 그 게임의 최종
      `score` · `lines` 와 같은 문자열이며, `[data-role="name-input"]` 과
      `[data-role="save"]` 가 문서에 있다.
- [ ] **6-13** `[data-role="save"]` 텍스트가 `기록 저장`,
      `[data-role="clear-leaderboard"]` 텍스트가 `리더보드 초기화` 이고,
      `[data-role="leaderboard"]` 안의 `h2` 텍스트가 `리더보드` 다 (문자 단위 비교).
- [ ] **6-14** `GAME_OVER` 에서 이름 `  민수  ` 로 저장하면 `ok` 가 `true` 이고,
      `localStorage` 의 기록 하나에 `name` 이 정확히 `민수` 다 (앞뒤 공백 제거).
- [ ] **6-15** 이름 `민` 으로 저장하면 `reason` 이 `TOO_SHORT`,
      `[data-role="name-error"]` 텍스트가 `이름은 2자 이상이어야 합니다` 이고 기록이 늘지 않는다.
- [ ] **6-16** 이름 `가나다라마바사아자차카`(11자)로 저장하면 `reason` 이 `TOO_LONG`,
      오류 문구가 `이름은 10자 이하여야 합니다` 이고 기록이 늘지 않는다.
- [ ] **6-17** 이름 `민수`(2자)와 `가나다라마바사아자차`(10자)는 각각 저장에 성공한다.
- [ ] **6-18** 이름 `김 민수` · `Player!` · `민수🎮` 각각에 대해 `reason` 이 `INVALID_CHAR` 이고
      오류 문구가 `한글·영문·숫자만 쓸 수 있습니다` 이며 기록이 늘지 않는다.
- [ ] **6-19** 이름 `Player1` 과 `테트리스7` 은 각각 저장에 성공한다 (영문·숫자·한글 조합).
- [ ] **6-20** 검증 실패 직후 `localStorage.getItem('tetris-loop.leaderboard.v1')` 의 값이
      실패 직전과 **문자열 단위로 동일**하고, 같은 게임에서 올바른 이름으로 다시 저장하면 성공한다.
- [ ] **6-21** 저장 성공 후 같은 게임에서 `TetrisApp.saveResult('민수')` 를 세 번 더 부르면
      셋 다 `{ ok: false, reason: 'ALREADY_SAVED' }` 이고 기록 수가 늘지 않는다.
      `[data-role="save"]` 를 연속 다섯 번 클릭해도 기록 수가 늘지 않는다.
- [ ] **6-22** 저장 성공 후 `시작` 을 눌러 새 게임을 하고 다시 게임오버가 되면
      `TetrisApp.isSavedForCurrentGame()` 이 `false` 이고 저장이 다시 한 번 성공한다.
- [ ] **6-23** `localStorage` 에 실제로 쓰인 키가 `tetris-loop.leaderboard.v1` 이고,
      기록 하나가 `id`·`name`·`score`·`clearedLines`·`playedAt` 다섯 키를 전부 가지며
      타입이 각각 `string`·`string`·`number`·`number`·`number` 다.
- [ ] **6-24** `localStorage` 에 `score` 가 `100`·`300`·`300` 인 기록 셋을 직접 넣고
      (`playedAt` 은 `300` 인 둘이 `T2 < T3`) 페이지를 새로고침하면
      `[data-role="record-name"]` 순서가 `300(T2)` · `300(T3)` · `100` 이다.
- [ ] **6-25** `score` 와 `playedAt` 이 모두 같은 기록 둘을 넣으면
      `localStorage` 배열에서 앞에 있던 기록이 화면에서도 앞에 온다 (안정 정렬).
- [ ] **6-26** 기록 11개를 만들면 `localStorage` 배열 길이가 `10` 이고
      `[data-role="record"]` 개수도 `10` 이다. 잘린 하나는 점수가 가장 낮은(동점이면 가장 늦은) 기록이다.
- [ ] **6-27** 10개가 찬 상태에서 최고점 기록을 새로 저장하면 그 기록이 1위로 들어가고
      기존 최하위 기록이 목록에서 사라지며 길이는 `10` 이다.
- [ ] **6-28** 저장 후 페이지를 새로고침하면 `[data-role="record"]` 개수와 순서·이름·점수가
      새로고침 전과 같다.
- [ ] **6-29** `localStorage.setItem('tetris-loop.leaderboard.v1', '{broken json')` 후 새로고침하면
      콘솔 error 없이 게임이 뜨고 `[data-role="record"]` 가 0개이며,
      `localStorage` 값은 **`{broken json` 그대로**다 (읽기 실패만으로 덮어쓰지 않는다).
- [ ] **6-30** 값이 `null` · `"문자열"` · `{"a":1}` · 필수 필드가 빠진 항목이 섞인 배열인 네 경우
      각각에 대해 새로고침하면 게임이 정상 실행되고, 유효한 항목만 화면에 남는다
      (넷 다 콘솔 error 0건).
- [ ] **6-31** `window.confirm` 을 `() => false` 로 바꿔 끼우고
      `[data-role="clear-leaderboard"]` 를 클릭하면 `localStorage` 값과 화면 기록이 그대로다.
      `() => true` 로 바꿔 다시 클릭하면 `localStorage` 값이 `[]` 이고 화면 기록이 0개다.
      그 뒤 `시작` 으로 재시작해도 리더보드는 계속 0개이며, 기록이 있는 상태에서
      `시작` 을 눌러도 기록 수가 줄지 않는다.

## 7. 자동 검증

### 7.1 러너 출력 형식

`SPEC_00 §7.1` 과 같다.

```html
<div id="test-summary" data-pass="105" data-fail="0">PASS 105 / FAIL 0</div>
<ul id="test-results">
  <li data-name="score-for-lines-table" data-result="pass">1·2·3·4줄이 100·300·500·800 이다</li>
</ul>
```

### 7.2 유지·폐기

`SPEC_00 §7.2` 18개, `SPEC_01` 유지분 29개, `SPEC_02 §7.3` 31개 중 **30개**를 유지한다 — 합계 77개.

| 폐기하는 `data-name` | 이유 | 대체 |
|----------------------|------|------|
| `lock-and-advance-keeps-score` | 이번 SPEC 이 `score` 가산을 도입했다 | `lock-and-advance-adds-score` |

### 7.3 이번 SPEC 의 필수 테스트

아래 28개는 **`data-name` 이 정확히 이 값이어야** 한다. 더 추가하는 것은 자유다.

| `data-name` | 확인 내용 |
|-------------|-----------|
| `api-surface-spec03` | `SCORE_TABLE`·`LEADERBOARD_KEY`·`LEADERBOARD_LIMIT`·`scoreForLines`·`validateName`·`sanitizeRecords`·`sortRecords`·`addRecord` 가 모두 공개되어 있고 타입이 맞다 |
| `score-table-values` | `SCORE_TABLE` 이 `[0,100,300,500,800]` 이고 동결되어 있다 |
| `score-for-lines-table` | `scoreForLines` 가 0·1·2·3·4 에 대해 0·100·300·500·800 이다 |
| `score-for-lines-out-of-range` | `-1`·`5`·`1.5`·`'2'`·`null`·`undefined` 가 전부 `0` 이다 |
| `leaderboard-key-exact` | `LEADERBOARD_KEY === 'tetris-loop.leaderboard.v1'` |
| `leaderboard-limit-ten` | `LEADERBOARD_LIMIT === 10` |
| `lock-and-advance-adds-score` | 한 줄 제거 시 `score` 가 100 늘고, 두 줄 동시 제거 시 300 는다 |
| `lock-and-advance-score-on-game-over` | 게임오버가 되는 고정에서도 그 고정이 지운 줄의 점수가 더해진다 |
| `validate-name-trims` | `'  민수  '` → `ok`, `name === '민수'` |
| `validate-name-too-short` | `'민'` 과 `''` 가 `TOO_SHORT` |
| `validate-name-min-two` | `'민수'` 가 `ok` |
| `validate-name-max-ten` | 10자 한글이 `ok` |
| `validate-name-too-long` | 11자 한글이 `TOO_LONG` |
| `validate-name-hangul` | `'테트리스'` 가 `ok` |
| `validate-name-latin-digit` | `'Player1'` 과 `'테트리스7'` 이 `ok` |
| `validate-name-inner-space` | `'김 민수'` 가 `INVALID_CHAR` |
| `validate-name-symbol` | `'Player!'` 가 `INVALID_CHAR` |
| `validate-name-emoji` | `'민수🎮'` 가 `INVALID_CHAR` (길이도 2로 세어 `TOO_SHORT` 가 아니다) |
| `validate-name-jamo` | `'ㄱㄴ'` 이 `INVALID_CHAR` |
| `validate-name-shape` | 반환 객체 키가 `ok`·`name`·`reason` 셋이고 `ok` 일 때 `reason` 이 `null` |
| `sanitize-non-array` | `null`·`'x'`·`3`·`{}`·`undefined` 가 전부 `[]` |
| `sanitize-drops-invalid-items` | 필수 키가 빠졌거나 타입이 틀린 항목이 제거되고 유효 항목 순서는 유지된다 |
| `sanitize-keeps-valid` | 유효한 기록의 값이 변형되지 않는다 |
| `sort-score-desc` | 점수 내림차순 |
| `sort-tie-played-at-asc` | 동점이면 `playedAt` 오름차순 |
| `sort-stable-on-full-tie` | 점수·`playedAt` 이 같으면 입력 순서 유지 |
| `sort-pure` | 원본 배열을 변형하지 않고 새 배열을 반환한다 |
| `add-record-sorts-then-limits` | 11개가 되면 정렬 후 상위 10개만 남고, 원본은 변형되지 않는다 |

## 8. 수동 검증

1. 게임을 실제로 해서 줄을 지우고 점수가 오르는지, 게임오버 화면에 최종 점수와 줄 수가
   맞게 뜨는지 본다.
2. 이름을 넣어 저장한 뒤 리더보드에 순위·이름·점수·줄 수가 읽기 좋게 표시되는지,
   새로고침 후에도 그대로인지 본다.

## 9. 안전과 정지 조건

- 프로젝트 폴더(`/home/al-hub/workspace/tetris-loop`) 밖 파일을 만들거나 수정하거나 삭제하지 않는다.
- OS 나 브라우저의 전역 설정을 바꾸지 않는다.
- 외부 라이브러리·프레임워크·번들러·패키지 매니저를 추가하지 않는다.
- 서버를 추가하지 않는다. 로그인 기능을 추가하지 않는다.
- `localStorage` 키를 `tetris-loop.leaderboard.v1` 에서 바꾸지 않는다.
- 게임오버 시 사용자 확인 없이 기록을 자동 저장하지 않는다.
- 이름 검증 실패 상태에서 저장하지 않는다. 같은 게임 결과를 두 번 저장하지 않는다.
- 정렬 전에 기록을 임의로 버리지 않는다. 10개 제한을 정렬보다 먼저 적용하지 않는다.
- 리더보드 초기화를 사용자 확인 없이 실행하지 않는다. 게임 재시작과 연결하지 않는다.
- 손상 JSON 때문에 게임 실행을 중단하지 않는다.
- 이번 SPEC 이 요구하지 않은 게임 기능을 미리 만들지 않는다 (§5).
- **루프 반복을 3회** (frontmatter `max_iterations`) 소진하거나,
  같은 실패 시그니처가 두 번 기록되면 중단한다. 그때 요구사항을 완화하거나 기능을 더하지 않고
  실패 항목·실제 결과·기대 결과·원인·마지막 수정 내용을 리포트에 적고 끝낸다.
- 이 문서에 없는 화면·기술 결정을 해야 하면 추측하지 않고 `[사람 확인 필요]` 로 보고한다.

## 10. 다음 단계로 넘기는 것

| 항목 | 넘기는 이유 |
|------|-------------|
| 콤보·연속 제거 보너스 | 기본 점수표가 먼저 고정돼야 그 위에 얹을 수 있다 |
| 레벨과 낙하 속도 변화 | 속도가 변하면 `SPEC_02` 의 간격 하한 조건을 다시 설계해야 한다 |
| 하드 드롭 · 일시정지 | `Space`·`P` 와 `PAUSED` 를 함께 다뤄야 한다 |
| 다음 블록 표시 · 홀드 | 화면 요소와 `data-role` 계약이 늘어난다 |
| `playedAt` 화면 표시 | 표시 형식·타임존을 새로 정해야 한다. 정렬에는 이미 쓰고 있다 |
| 온라인 리더보드 | 서버가 필요하다. 이 프로젝트의 제약 밖이다 |

## 11. 해석 고정 근거 (revision 1)

| 지점 | 정한 것 | 이유 |
|------|---------|------|
| 점수와 리더보드를 한 SPEC 에 | 합친다 (사람 결정) | 쪼개는 편을 권했으나 사람이 합치기로 정했다. 대신 §6 을 점수 그룹과 리더보드 그룹으로 나눠 실패 시그니처가 섞이지 않게 했다 |
| 원 요구사항의 "점수 공식 추가 금지" | 이번 SPEC 이 폐기 | 합치기로 한 이상 그 조항과 공존할 수 없다. 지우지 않고 §2 에 폐기를 명시해 나중에 "왜 어겼나" 가 남지 않게 했다 |
| 점수표 | `1·2·3·4줄 = 100·300·500·800` | 현대 테트리스 가이드라인 기본값에서 레벨 배수를 뺀 형태. 동시 제거 이득이 있어야 4줄 노림이 의미를 갖는다 |
| 가산 경로 | 줄 제거 하나뿐 | 관측 지점이 하나면 검증이 깔끔하다. 드롭 보너스는 하드 드롭 SPEC 에서 함께 다룬다 |
| `scoreForLines` 범위 밖 입력 | `0` 반환 | 던지면 `lockAndAdvance` 가 게임을 죽인다. 조용히 0 이면 최악이 "점수가 안 오름" 이다 |
| 한글 범위 | 완성형 음절 `가-힣` 만 | 정규식 한 줄로 끝나고 경계가 명확하다. 자모(`ㄱ`~`ㅣ`)를 넣으면 IME 조합 중간 상태가 기록에 남는다 |
| 이름 길이 세는 법 | `Array.from(name).length` (코드포인트) | 허용 문자는 전부 BMP 라 `length` 와 같지만, 이모지 입력이 `length` 2 로 세어져 `'민수🎮'` 가 길이만으로 통과하는 일을 막는다 |
| 검증 순서 | 길이 먼저, 그다음 문자 | 순서를 안 정하면 `'ㄱ'` 이 `TOO_SHORT` 인지 `INVALID_CHAR` 인지 구현마다 갈린다 |
| `playedAt` | `Date.now()` epoch 밀리초 숫자 | 정렬이 뺄셈 하나로 끝나고 타임존·로케일에 흔들리지 않는다. 검증이 값을 직접 주입해 동점 순서를 재현하기도 쉽다 |
| `localStorage` 최상위 구조 | 기록 객체의 **배열** | 감싸는 객체를 두면 버전 필드를 또 정해야 한다. 키 이름에 이미 `.v1` 이 있다 |
| 손상 데이터 복구 | 메모리만 빈 목록, 저장소는 그대로 | 읽기 실패만으로 사용자 기록을 지우지 않는다. 다음 저장 성공 때 정상 값으로 덮인다 |
| 구조 불량 데이터 | `sanitizeRecords` 로 유효 항목만 남긴다 | 전부 버리면 한 항목이 깨졌다고 나머지 아홉을 잃는다 |
| 중복 저장 방지 | `saveResult` 안의 `ALREADY_SAVED` 검사 | 버튼 `disabled` 만으로는 더블 클릭·이벤트 중복 전달·직접 호출을 못 막는다. UI 는 보조다 |
| 게임오버 결과 스냅샷 | `GAME_OVER` 순간의 `score`·`lines` 를 찍어 둔다 | 이름 입력 중 예약된 tick 이 상태를 건드려도 저장값이 흔들리지 않는다 |
| 초기화 확인 | `window.confirm` | 화면 요소·문구·`data-role` 이 늘지 않는다. 검증은 `window.confirm` 을 임시로 바꿔 끼워 두 갈래를 다 관측한다 |
| 게임오버 영역 표시 | `hidden` 속성 토글 | `style.display` 보다 관측이 명확하다 — `el.hidden` 이 불리언 하나다 |
| `playedAt` 화면 표시 | 안 한다 | 표시 형식·타임존을 정하는 비용이 이번 목표와 무관하다. 정렬에는 이미 쓰인다 |
| 필수 테스트 개수 | 28개 신설, `SPEC_02` 1개 폐기, 합계 하한 105 | 폐기 이름을 박지 않으면 다음 반복이 `score` 불변 테스트를 되살리려다 실패한다 |
