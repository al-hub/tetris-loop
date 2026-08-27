// game.js — 순수 게임 로직. DOM 에 접근하지 않는다.
// 공개 창구는 globalThis.TetrisGame 하나뿐이다 (SPEC_00 §4.1).
(function () {
  'use strict';

  var BOARD_WIDTH = 10;
  var BOARD_HEIGHT = 20;

  // 각 값은 키 이름과 같은 문자열이다 (SPEC_00 §4.2).
  // LANDED 는 이후 SPEC 이 쓸 자리이며 이번 단계에서는 참조하지 않는다.
  var GAME_STATUS = Object.freeze({
    READY: 'READY',
    PLAYING: 'PLAYING',
    LANDED: 'LANDED',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
  });

  // 호출마다 최상위 배열과 각 행 배열을 새로 만든다.
  // 두 결과가 어떤 배열도 공유하지 않아야 한다 (SPEC_00 §4.3).
  function createEmptyBoard() {
    var board = [];
    for (var y = 0; y < BOARD_HEIGHT; y += 1) {
      var row = [];
      for (var x = 0; x < BOARD_WIDTH; x += 1) {
        row.push(0);
      }
      board.push(row);
    }
    return board;
  }

  // 네 개의 키만 가진 새 객체를 반환한다 (SPEC_00 §4.4).
  function createInitialState() {
    return {
      board: createEmptyBoard(),
      score: 0,
      lines: 0,
      status: GAME_STATUS.READY
    };
  }

  globalThis.TetrisGame = {
    BOARD_WIDTH: BOARD_WIDTH,
    BOARD_HEIGHT: BOARD_HEIGHT,
    GAME_STATUS: GAME_STATUS,
    createEmptyBoard: createEmptyBoard,
    createInitialState: createInitialState
  };
})();
