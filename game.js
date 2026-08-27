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

  // 인덱스가 한 번에 지운 줄 수다 (SPEC_03 §4.2).
  var SCORE_TABLE = Object.freeze([0, 100, 300, 500, 800]);

  var LEADERBOARD_KEY = 'tetris-loop.leaderboard.v1';
  var LEADERBOARD_LIMIT = 10;

  // 허용 문자는 완성형 한글 음절·영문·숫자뿐이다. 자모와 공백·기호·이모지는 막는다.
  var NAME_PATTERN = /^[가-힣A-Za-z0-9]+$/;

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

  // 레벨은 저장하지 않는다. 누적 줄 수에서 매번 파생한다 (SPEC_04 §4.2).
  function levelForLines(lines) {
    if (typeof lines !== 'number' || !Number.isInteger(lines) || lines < 0) {
      return 1;
    }
    return Math.floor(lines / 10) + 1;
  }

  // max(100, 700 - (level-1)*60). 어떤 레벨에서도 100 아래로 내려가지 않는다 (SPEC_04 §4.3).
  function dropIntervalForLevel(level) {
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 1) {
      return DROP_INTERVAL_MS;
    }
    return Math.max(100, DROP_INTERVAL_MS - (level - 1) * 60);
  }

  // 범위 밖 입력은 던지지 않고 0 을 준다 — 여기서 던지면 lockAndAdvance 가 게임을 죽인다.
  function scoreForLines(count) {
    if (typeof count !== 'number' || !Number.isInteger(count)) {
      return 0;
    }
    if (count < 0 || count >= SCORE_TABLE.length) {
      return 0;
    }
    return SCORE_TABLE[count];
  }

  // 길이를 먼저 보고 그다음 문자를 본다. 순서를 바꾸면 같은 입력에 다른 reason 이 나온다.
  function validateName(raw) {
    var name = typeof raw === 'string' ? raw.trim() : '';
    var length = Array.from(name).length;
    if (length < 2) {
      return { ok: false, name: name, reason: 'TOO_SHORT' };
    }
    if (length > 10) {
      return { ok: false, name: name, reason: 'TOO_LONG' };
    }
    if (!NAME_PATTERN.test(name)) {
      return { ok: false, name: name, reason: 'INVALID_CHAR' };
    }
    return { ok: true, name: name, reason: null };
  }

  function isValidRecord(record) {
    return record !== null &&
      typeof record === 'object' &&
      typeof record.id === 'string' &&
      typeof record.name === 'string' &&
      Number.isFinite(record.score) &&
      Number.isFinite(record.clearedLines) &&
      Number.isFinite(record.playedAt);
  }

  // 어떤 값이 와도 던지지 않는다. 배열이 아니면 빈 배열, 배열이면 유효 항목만 순서대로.
  function sanitizeRecords(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    var out = [];
    for (var i = 0; i < value.length; i += 1) {
      if (isValidRecord(value[i])) {
        out.push(value[i]);
      }
    }
    return out;
  }

  // score 내림차순 -> playedAt 오름차순 -> 기존 순서 유지. 그 밖의 필드는 보지 않는다.
  function sortRecords(records) {
    return records.slice().sort(function (a, b) {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.playedAt - b.playedAt;
    });
  }

  // 추가 -> 전체 정렬 -> 상위 10개. 순서를 바꾸지 않는다.
  function addRecord(records, record) {
    return sortRecords(records.concat([record])).slice(0, LEADERBOARD_LIMIT);
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

  // 채워진 칸에 종류 문자를 적은 새 보드를 만든다. 원본은 건드리지 않는다.
  function lockPiece(board, piece) {
    var out = [];
    for (var y = 0; y < board.length; y += 1) {
      out.push(board[y].slice());
    }
    forEachFilled(piece, function (row, col) {
      if (row >= 0 && row < out.length && col >= 0 && col < out[row].length) {
        out[row][col] = piece.type;
      }
    });
    return out;
  }

  // 열 10개가 전부 0 이 아닌 행. 오름차순.
  function findFullRows(board) {
    var rows = [];
    for (var y = 0; y < board.length; y += 1) {
      var complete = true;
      for (var x = 0; x < board[y].length; x += 1) {
        if (board[y][x] === 0) {
          complete = false;
          break;
        }
      }
      if (complete) {
        rows.push(y);
      }
    }
    return rows;
  }

  // 주어진 행들을 한 번에 지우고 남은 행을 아래로 붙인다. 위쪽은 빈 행으로 채운다.
  function clearRows(board, rows) {
    var width = board.length > 0 ? board[0].length : BOARD_WIDTH;
    var kept = [];
    for (var y = 0; y < board.length; y += 1) {
      if (rows.indexOf(y) < 0) {
        kept.push(board[y].slice());
      }
    }
    while (kept.length < board.length) {
      var empty = [];
      for (var x = 0; x < width; x += 1) {
        empty.push(0);
      }
      kept.unshift(empty);
    }
    return kept;
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
      return lockAndAdvance(state);
    }
    return state;
  }

  // 고정 -> 완성 줄 전체 탐색 -> 동시 제거 -> 압축 -> 줄 수 누적 -> 다음 블록 -> 게임오버 판정.
  // 순서를 바꾸지 않는다. 한 입력·한 tick 에서 한 번만 호출된다.
  function lockAndAdvance(state) {
    if (!state || state.status !== GAME_STATUS.PLAYING || !state.piece) {
      return state;
    }
    var locked = lockPiece(state.board, state.piece);
    var full = findFullRows(locked);
    var cleared = clearRows(locked, full);
    var lines = state.lines + full.length;
    // 제거 직전 레벨을 곱한다. 갱신된 레벨은 다음 줄 제거부터 (SPEC_04 §4.4).
    var score = state.score + scoreForLines(full.length) * levelForLines(state.lines);
    var next = createPiece(nextPieceType(state.piece.type));
    var placeable = canPlace(cleared, next);
    return {
      board: cleared,
      piece: placeable ? next : null,
      score: score,
      lines: lines,
      status: placeable ? GAME_STATUS.PLAYING : GAME_STATUS.GAME_OVER
    };
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
    SCORE_TABLE: SCORE_TABLE,
    LEADERBOARD_KEY: LEADERBOARD_KEY,
    LEADERBOARD_LIMIT: LEADERBOARD_LIMIT,
    scoreForLines: scoreForLines,
    levelForLines: levelForLines,
    dropIntervalForLevel: dropIntervalForLevel,
    validateName: validateName,
    sanitizeRecords: sanitizeRecords,
    sortRecords: sortRecords,
    addRecord: addRecord,
    createEmptyBoard: createEmptyBoard,
    createInitialState: createInitialState,
    nextPieceType: nextPieceType,
    createPiece: createPiece,
    rotateCells: rotateCells,
    canPlace: canPlace,
    lockPiece: lockPiece,
    findFullRows: findFullRows,
    clearRows: clearRows,
    lockAndAdvance: lockAndAdvance,
    applyMove: applyMove,
    applyRotate: applyRotate,
    startGame: startGame
  };
})();
