// main.js — DOM 렌더링만 담당한다. 게임 규칙은 game.js 에 있다.
// 공개 창구는 globalThis.TetrisApp 하나뿐이다 (SPEC_00 §4.5).
(function () {
  'use strict';

  function setText(role, value) {
    var el = document.querySelector('[data-role="' + role + '"]');
    if (el) {
      el.textContent = String(value);
    }
  }

  // 보드 크기는 상태 객체에서만 읽는다. 상수를 하드코딩하지 않는다.
  function renderBoard(board) {
    var boardEl = document.querySelector('[data-role="board"]');
    if (!boardEl) {
      return;
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
        rowEl.appendChild(cellEl);
      }
      boardEl.appendChild(rowEl);
    }
  }

  function render(state) {
    if (!state) {
      return;
    }
    renderBoard(state.board);
    setText('score', state.score);
    setText('lines', state.lines);
    setText('status', state.status);
  }

  globalThis.TetrisApp = { render: render };

  // 로드 시 한 번만 그린다. 이번 단계에는 게임 루프도 이벤트 핸들러도 없다.
  render(globalThis.TetrisGame.createInitialState());
})();
