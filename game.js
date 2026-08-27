// game.js — 순수 게임 로직. DOM 에 접근하지 않는다.
// 타이머도 이벤트 리스너도 여기 없다 (CLAUDE.md §3). 공개 창구는 globalThis.TetrisGame 하나뿐이다.
(function () {
  'use strict';

  var BOARD_WIDTH = 10;
  var BOARD_HEIGHT = 20;

  // 각 값은 키 이름과 같은 문자열이다 (SPEC_00 §4.2).
  var GAME_STATUS = Object.freeze({
    READY: 'READY',
    PLAYING: 'PLAYING',
    LANDED: 'LANDED',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
  });

  var PIECE_TYPES = Object.freeze(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);

  var DROP_INTERVAL_MS = 700;

  function freezeMatrix(matrix) {
    for (var i = 0; i < matrix.length; i += 1) {
      Object.freeze(matrix[i]);
    }
    return Object.freeze(matrix);
  }

  // I 의 채워진 칸이 두 번째 줄인 것은 의도한 것이다 — 회전하면 세 번째 열이 채워져
  // 블록이 행렬 중앙 쪽에 남는다 (SPEC_01 §11).
  var PIECE_SHAPES = Object.freeze({
    I: freezeMatrix([[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]]),
    O: freezeMatrix([[1, 1], [1, 1]]),
    T: freezeMatrix([[0, 1, 0], [1, 1, 1], [0, 0, 0]]),
    S: freezeMatrix([[0, 1, 1], [1, 1, 0], [0, 0, 0]]),
    Z: freezeMatrix([[1, 1, 0], [0, 1, 1], [0, 0, 0]]),
    J: freezeMatrix([[1, 0, 0], [1, 1, 1], [0, 0, 0]]),
    L: freezeMatrix([[0, 0, 1], [1, 1, 1], [0, 0, 0]])
  });

  // 호출마다 최상위 배열과 각 행 배열을 새로 만든다 (SPEC_00 §4.3).
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

  function cloneCells(cells) {
    var copy = [];
    for (var i = 0; i < cells.length; i += 1) {
      copy.push(cells[i].slice());
    }
    return copy;
  }

  // 목록에 없는 값(null · undefined 포함)은 처음으로 되돌린다.
  function nextPieceType(prevType) {
    var index = PIECE_TYPES.indexOf(prevType);
    if (index < 0) {
      return PIECE_TYPES[0];
    }
    return PIECE_TYPES[(index + 1) % PIECE_TYPES.length];
  }

  // 생성 열은 행렬 변 길이 기준 floor — 폭 10 에 3칸 블록은 정중앙이 없어 좌측으로 붙인다.
  function createPiece(type) {
    var shape = PIECE_SHAPES[type];
    return {
      type: type,
      cells: cloneCells(shape),
      row: 0,
      col: Math.floor((BOARD_WIDTH - shape.length) / 2)
    };
  }

  // 시계 방향 90°. 원본을 변형하지 않는다.
  function rotateCells(cells) {
    var size = cells.length;
    var out = [];
    for (var c = 0; c < cells[0].length; c += 1) {
      var row = [];
      for (var r = size - 1; r >= 0; r -= 1) {
        row.push(cells[r][c]);
      }
      out.push(row);
    }
    return out;
  }

  function forEachFilled(piece, visit) {
    for (var i = 0; i < piece.cells.length; i += 1) {
      for (var j = 0; j < piece.cells[i].length; j += 1) {
        if (piece.cells[i][j] !== 0) {
          visit(piece.row + i, piece.col + j);
        }
      }
    }
  }

  function canPlace(board, piece) {
    if (!board || !piece) {
      return false;
    }
    var ok = true;
    forEachFilled(piece, function (row, col) {
      if (row < 0 || row >= board.length) {
        ok = false;
        return;
      }
      if (col < 0 || col >= board[row].length) {
        ok = false;
        return;
      }
      if (board[row][col] !== 0) {
        ok = false;
      }
    });
    return ok;
  }

  function shiftedPiece(piece, dRow, dCol) {
    return { type: piece.type, cells: piece.cells, row: piece.row + dRow, col: piece.col + dCol };
  }

  function withPiece(state, piece, status) {
    return {
      board: state.board,
      piece: piece,
      score: state.score,
      lines: state.lines,
      status: status
    };
  }

  // 거부되면 인자 state 를 그대로(동일 참조) 반환한다. 아래로 막히면 LANDED 로 간다.
  function applyMove(state, dRow, dCol) {
    if (!state || state.status !== GAME_STATUS.PLAYING || !state.piece) {
      return state;
    }
    var moved = shiftedPiece(state.piece, dRow, dCol);
    if (canPlace(state.board, moved)) {
      return withPiece(state, moved, state.status);
    }
    if (dRow > 0) {
      return withPiece(state, state.piece, GAME_STATUS.LANDED);
    }
    return state;
  }

  // wall kick 을 하지 않는다. 경계를 벗어나면 그냥 거부한다.
  function applyRotate(state) {
    if (!state || state.status !== GAME_STATUS.PLAYING || !state.piece) {
      return state;
    }
    var rotated = {
      type: state.piece.type,
      cells: rotateCells(state.piece.cells),
      row: state.piece.row,
      col: state.piece.col
    };
    if (canPlace(state.board, rotated)) {
      return withPiece(state, rotated, state.status);
    }
    return state;
  }

  function startGame(state) {
    var prevType = state && state.piece ? state.piece.type : null;
    return {
      board: createEmptyBoard(),
      piece: createPiece(nextPieceType(prevType)),
      score: 0,
      lines: 0,
      status: GAME_STATUS.PLAYING
    };
  }

  // 다섯 개 키를 가진 새 객체를 반환한다 (SPEC_01 §4.6 이 SPEC_00 §4.4 를 확장).
  function createInitialState() {
    return {
      board: createEmptyBoard(),
      piece: null,
      score: 0,
      lines: 0,
      status: GAME_STATUS.READY
    };
  }

  globalThis.TetrisGame = {
    BOARD_WIDTH: BOARD_WIDTH,
    BOARD_HEIGHT: BOARD_HEIGHT,
    GAME_STATUS: GAME_STATUS,
    PIECE_TYPES: PIECE_TYPES,
    PIECE_SHAPES: PIECE_SHAPES,
    DROP_INTERVAL_MS: DROP_INTERVAL_MS,
    createEmptyBoard: createEmptyBoard,
    createInitialState: createInitialState,
    nextPieceType: nextPieceType,
    createPiece: createPiece,
    rotateCells: rotateCells,
    canPlace: canPlace,
    applyMove: applyMove,
    applyRotate: applyRotate,
    startGame: startGame
  };
})();
