// main.js — DOM 렌더링과 브라우저 연결(타이머·키 입력)만 담당한다.
// 게임 규칙은 game.js 에 있다. 공개 창구는 globalThis.TetrisApp 하나뿐이다.
(function () {
  'use strict';

  var G = globalThis.TetrisGame;

  var appState = G.createInitialState();
  var dropTimerId = null;

  // 낙하 기록. 타이머가 진짜 도는지, 겹치지 않는지를 밖에서 셀 수 있게 한다 (SPEC_01 §4.8).
  var dropCount = 0;
  var lastDropAt = null;
  var dropIntervalMs = G.DROP_INTERVAL_MS;

  // 영속 리더보드 상태. 게임 상태와 별개다 (SPEC_03 §4.6).
  var leaderboard = [];
  // 이번 게임의 게임오버 결과 스냅샷. 이름을 입력하는 동안 값이 흔들리지 않게 찍어 둔다.
  var gameOverResult = null;
  var savedForCurrentGame = false;

  function setText(role, value) {
    var el = document.querySelector('[data-role="' + role + '"]');
    if (el) {
      el.textContent = String(value);
    }
  }

  // 보드 크기는 상태 객체에서만 읽는다. 상수를 하드코딩하지 않는다.
  function renderBoard(board, piece) {
    var boardEl = document.querySelector('[data-role="board"]');
    if (!boardEl) {
      return;
    }

    // 고정 셀은 board 값에서, 낙하 중인 블록은 piece 에서 온다.
    // 화면에서는 둘을 합쳐 그리고 구분하지 않는다 (SPEC_02 §3.1).
    var occupied = {};
    if (piece) {
      for (var i = 0; i < piece.cells.length; i += 1) {
        for (var j = 0; j < piece.cells[i].length; j += 1) {
          if (piece.cells[i][j] !== 0) {
            occupied[(piece.row + i) + ',' + (piece.col + j)] = piece.type;
          }
        }
      }
    }

    boardEl.textContent = '';
    for (var y = 0; y < board.length; y += 1) {
      var rowEl = document.createElement('div');
      rowEl.className = 'row';
      rowEl.setAttribute('data-role', 'row');
      for (var x = 0; x < board[y].length; x += 1) {
        var cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.setAttribute('data-role', 'cell');
        var locked = board[y][x];
        var type = occupied[y + ',' + x] || (locked !== 0 ? locked : null);
        if (type) {
          cellEl.setAttribute('data-piece', type);
        }
        rowEl.appendChild(cellEl);
      }
      boardEl.appendChild(rowEl);
    }
  }

  // NEXT 격자 16칸. 행렬을 4x4 중앙에 놓고 채워진 칸에만 data-piece 를 붙인다 (SPEC_05 §3.1).
  function renderNext(next) {
    var cells = document.querySelectorAll('[data-role="next-cell"]');
    if (!cells || cells.length === 0) {
      return;
    }
    var filled = {};
    if (typeof next === 'string' && G.PIECE_SHAPES[next]) {
      var shape = G.PIECE_SHAPES[next];
      var off = Math.floor((4 - shape.length) / 2);
      for (var i = 0; i < shape.length; i += 1) {
        for (var j = 0; j < shape[i].length; j += 1) {
          if (shape[i][j] !== 0) {
            filled[(i + off) * 4 + (j + off)] = true;
          }
        }
      }
    }
    for (var k = 0; k < cells.length; k += 1) {
      if (filled[k]) {
        cells[k].setAttribute('data-piece', next);
      } else {
        cells[k].removeAttribute('data-piece');
      }
    }
  }

  function renderGameOver(state) {
    var section = document.querySelector('[data-role="gameover"]');
    if (!section) {
      return;
    }
    var over = state.status === G.GAME_STATUS.GAME_OVER;
    section.hidden = !over;
    if (over && gameOverResult) {
      setText('final-score', gameOverResult.score);
      setText('final-lines', gameOverResult.clearedLines);
    }
    var saveButton = document.querySelector('[data-role="save"]');
    if (saveButton) {
      saveButton.disabled = !over || savedForCurrentGame;
    }
  }

  function renderLeaderboard() {
    var list = document.querySelector('[data-role="record-list"]');
    if (!list) {
      return;
    }
    list.textContent = '';
    for (var i = 0; i < leaderboard.length; i += 1) {
      var record = leaderboard[i];
      var item = document.createElement('li');
      item.setAttribute('data-role', 'record');
      item.appendChild(cellSpan('rank', i + 1));
      item.appendChild(cellSpan('record-name', record.name));
      item.appendChild(cellSpan('record-score', record.score));
      item.appendChild(cellSpan('record-lines', record.clearedLines));
      list.appendChild(item);
    }
  }

  function cellSpan(role, value) {
    var span = document.createElement('span');
    span.setAttribute('data-role', role);
    span.textContent = String(value);
    return span;
  }

  // 화면만 그린다. 앱이 들고 있는 상태를 바꾸지 않는다.
  function render(state) {
    if (!state) {
      return;
    }
    renderBoard(state.board, state.piece);
    setText('score', state.score);
    setText('lines', state.lines);
    setText('status', state.status);
    setText('level', G.levelForLines(state.lines));
    renderNext(state.next);
    renderGameOver(state);
    renderLeaderboard();
  }

  function stopDropTimer() {
    if (dropTimerId !== null) {
      clearInterval(dropTimerId);
      dropTimerId = null;
    }
  }

  // 새 타이머를 만들기 전에 기존 것을 반드시 정지한다 — 타이머는 항상 최대 한 개다.
  // 콜백은 tick 하나만 호출한다. 자동 낙하가 두 경로로 갈리지 않게.
  function startDropTimer() {
    stopDropTimer();
    // 간격은 현재 레벨에서 나온다. 700 은 레벨 1 의 값일 뿐이다 (SPEC_04 §4.5).
    dropIntervalMs = G.dropIntervalForLevel(G.levelForLines(appState.lines));
    dropTimerId = setInterval(tick, dropIntervalMs);
  }

  function getActiveDropTimerCount() {
    return dropTimerId === null ? 0 : 1;
  }

  function getDropStats() {
    return { count: dropCount, lastAt: lastDropAt, intervalMs: dropIntervalMs };
  }

  // 앱 상태를 통째로 교체한다. 검증이 임의의 보드 모양을 만들 때 쓴다 (SPEC_02 §4.8).
  // 타이머는 여기서도 최대 한 개다.
  function loadState(state) {
    if (!state) {
      return;
    }
    appState = state;
    resetSaveState();
    captureGameOver(appState);
    render(appState);
    if (appState.status === G.GAME_STATUS.PLAYING) {
      startDropTimer();
    } else {
      stopDropTimer();
    }
  }

  // 게임오버로 넘어가는 순간의 점수·줄 수를 찍어 둔다. 그 뒤에는 바뀌지 않는다.
  function captureGameOver(state) {
    if (state.status === G.GAME_STATUS.GAME_OVER) {
      if (!gameOverResult) {
        gameOverResult = { score: state.score, clearedLines: state.lines };
      }
    } else {
      gameOverResult = null;
    }
  }

  // 거부된 이동은 같은 참조로 돌아온다. 그때는 다시 그리지도 않는다.
  function commit(nextState) {
    if (nextState === appState) {
      return;
    }
    var levelBefore = G.levelForLines(appState.lines);
    var wasPlaying = appState.status === G.GAME_STATUS.PLAYING;
    appState = nextState;
    captureGameOver(appState);
    render(appState);
    if (appState.status !== G.GAME_STATUS.PLAYING) {
      // PAUSED·GAME_OVER 어디로 가든 타이머는 멈춘다 (SPEC_06 §4.4).
      stopDropTimer();
    } else if (!wasPlaying || G.levelForLines(appState.lines) !== levelBefore) {
      // PLAYING 으로 들어올 때(재개)와 레벨이 바뀔 때만 다시 건다. 매 tick 마다 걸면 간격이 리셋된다.
      startDropTimer();
    }
  }

  // 자동 낙하 한 단계. 바닥에 닿아 LANDED 로 바뀌는 tick 도 카운트에 넣는다.
  function tick() {
    if (appState.status !== G.GAME_STATUS.PLAYING) {
      return;
    }
    dropCount += 1;
    lastDropAt = performance.now();
    commit(G.applyMove(appState, 1, 0));
  }

  function onStartClick() {
    if (appState.status === G.GAME_STATUS.PLAYING || appState.status === G.GAME_STATUS.PAUSED) {
      return; // 진행 중·일시정지 중에는 무시한다 (SPEC_01 §3.2 · SPEC_06 §3.2).
    }
    appState = G.startGame(appState);
    resetSaveState();
    render(appState);
    startDropTimer();
  }

  // 새 게임은 다시 한 번 저장할 수 있다. 리더보드 기록은 건드리지 않는다.
  function resetSaveState() {
    gameOverResult = null;
    savedForCurrentGame = false;
    setText('name-error', '');
    var input = document.querySelector('[data-role="name-input"]');
    if (input) {
      input.value = '';
    }
  }

  var MOVE_KEYS = {
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
    ArrowDown: [1, 0]
  };

  function onKeyDown(event) {
    var playing = appState.status === G.GAME_STATUS.PLAYING;
    var paused = appState.status === G.GAME_STATUS.PAUSED;
    if (!playing && !paused) {
      return; // READY·GAME_OVER 에서는 기본 동작도 빼앗지 않는다 (SPEC_06 §3.3).
    }
    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault();
      commit(G.togglePause(appState));
      return;
    }
    if (paused) {
      // 일시정지 중 방향키는 무시하되 화면 스크롤은 막는다 (SPEC_06 §3.3).
      if (event.key === 'ArrowUp' || MOVE_KEYS[event.key]) {
        event.preventDefault();
      }
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      commit(G.applyRotate(appState));
      return;
    }
    var delta = MOVE_KEYS[event.key];
    if (!delta) {
      return;
    }
    event.preventDefault();
    commit(G.applyMove(appState, delta[0], delta[1]));
  }

  // ---- 리더보드 (SPEC_03 §4.6) ----

  var ERROR_TEXT = {
    TOO_SHORT: '이름은 2자 이상이어야 합니다',
    TOO_LONG: '이름은 10자 이하여야 합니다',
    INVALID_CHAR: '한글·영문·숫자만 쓸 수 있습니다'
  };

  // 읽기 실패는 메모리만 빈 목록으로 만든다. localStorage 는 건드리지 않는다.
  function loadLeaderboard() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(G.LEADERBOARD_KEY);
    } catch (error) {
      return [];
    }
    if (raw === null) {
      return [];
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return [];
    }
    // 화면은 늘 정렬 결과와 같은 순서다 (SPEC_03 §3.2). 저장값은 건드리지 않는다.
    return G.sortRecords(G.sanitizeRecords(parsed)).slice(0, G.LEADERBOARD_LIMIT);
  }

  function writeLeaderboard() {
    try {
      window.localStorage.setItem(G.LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (error) {
      // 저장소가 막혀 있어도 게임을 멈추지 않는다.
    }
  }

  function getLeaderboard() {
    return leaderboard.slice();
  }

  function isSavedForCurrentGame() {
    return savedForCurrentGame;
  }

  function makeId() {
    return 'r' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36);
  }

  // 중복 저장은 UI 가 아니라 여기 2단계가 막는다.
  function saveResult(rawName) {
    if (appState.status !== G.GAME_STATUS.GAME_OVER || !gameOverResult) {
      return { ok: false, reason: 'NOT_GAME_OVER' };
    }
    if (savedForCurrentGame) {
      return { ok: false, reason: 'ALREADY_SAVED' };
    }
    var checked = G.validateName(rawName);
    if (!checked.ok) {
      setText('name-error', ERROR_TEXT[checked.reason] || '');
      return { ok: false, reason: checked.reason };
    }
    leaderboard = G.addRecord(leaderboard, {
      id: makeId(),
      name: checked.name,
      score: gameOverResult.score,
      clearedLines: gameOverResult.clearedLines,
      playedAt: Date.now()
    });
    writeLeaderboard();
    savedForCurrentGame = true;
    render(appState);
    setText('name-error', '저장 완료');
    return { ok: true, reason: null };
  }

  function clearLeaderboard() {
    if (!window.confirm('리더보드를 모두 지울까요?')) {
      return false;
    }
    leaderboard = [];
    writeLeaderboard();
    render(appState);
    return true;
  }

  function onSaveClick() {
    var input = document.querySelector('[data-role="name-input"]');
    saveResult(input ? input.value : '');
  }

  globalThis.TetrisApp = {
    render: render,
    getActiveDropTimerCount: getActiveDropTimerCount,
    tick: tick,
    getDropStats: getDropStats,
    loadState: loadState,
    getLeaderboard: getLeaderboard,
    saveResult: saveResult,
    clearLeaderboard: clearLeaderboard,
    isSavedForCurrentGame: isSavedForCurrentGame
  };

  var startButton = document.querySelector('[data-role="start"]');
  if (startButton) {
    startButton.addEventListener('click', onStartClick);
  }
  var saveButton = document.querySelector('[data-role="save"]');
  if (saveButton) {
    saveButton.addEventListener('click', onSaveClick);
  }
  var clearButton = document.querySelector('[data-role="clear-leaderboard"]');
  if (clearButton) {
    clearButton.addEventListener('click', clearLeaderboard);
  }
  // 리스너는 하나만 붙인다. 재시작마다 새로 붙이면 입력이 중복 처리된다.
  window.addEventListener('keydown', onKeyDown);

  leaderboard = loadLeaderboard();
  render(appState);
})();
