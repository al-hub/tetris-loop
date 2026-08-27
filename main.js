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

  // 화면만 그린다. 앱이 들고 있는 상태를 바꾸지 않는다.
  function render(state) {
    if (!state) {
      return;
    }
    renderBoard(state.board, state.piece);
    setText('score', state.score);
    setText('lines', state.lines);
    setText('status', state.status);
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
    render(appState);
    if (appState.status === G.GAME_STATUS.PLAYING) {
      startDropTimer();
    } else {
      stopDropTimer();
    }
  }

  // 거부된 이동은 같은 참조로 돌아온다. 그때는 다시 그리지도 않는다.
  function commit(nextState) {
    if (nextState === appState) {
      return;
    }
    appState = nextState;
    render(appState);
    if (appState.status !== G.GAME_STATUS.PLAYING) {
      stopDropTimer();
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
    if (appState.status === G.GAME_STATUS.PLAYING) {
      return; // 진행 중에는 무시한다 (SPEC_01 §3.2).
    }
    appState = G.startGame(appState);
    render(appState);
    startDropTimer();
  }

  var MOVE_KEYS = {
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
    ArrowDown: [1, 0]
  };

  function onKeyDown(event) {
    if (appState.status !== G.GAME_STATUS.PLAYING) {
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

  globalThis.TetrisApp = {
    render: render,
    getActiveDropTimerCount: getActiveDropTimerCount,
    tick: tick,
    getDropStats: getDropStats,
    loadState: loadState
  };

  var startButton = document.querySelector('[data-role="start"]');
  if (startButton) {
    startButton.addEventListener('click', onStartClick);
  }
  // 리스너는 하나만 붙인다. 재시작마다 새로 붙이면 입력이 중복 처리된다.
  window.addEventListener('keydown', onKeyDown);

  render(appState);
})();
