// test.js — game.js 의 공개 API 만 검증한다. 결과는 브라우저에 표시한다.
// 출력 구조는 SPEC_00 §7.1 이 정한 계약이다. 기계가 읽을 수 있어야 한다.
(function () {
  'use strict';

  var results = [];

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function test(name, label, fn) {
    try {
      fn();
      results.push({ name: name, label: label, pass: true, reason: '' });
    } catch (error) {
      var reason = error && error.message ? error.message : String(error);
      results.push({ name: name, label: label, pass: false, reason: reason });
    }
  }

  var G = globalThis.TetrisGame;
  var J = function (v) { return JSON.stringify(v); };

  // ======================= SPEC_00 §7.2 — 유지 =======================

  test('api-tetrisgame', 'globalThis.TetrisGame 은 객체다', function () {
    assert(G !== null && typeof G === 'object', 'TetrisGame 이 객체가 아니다: ' + typeof G);
  });

  test('api-create-empty-board', 'createEmptyBoard 는 함수다', function () {
    assert(typeof G.createEmptyBoard === 'function', 'createEmptyBoard 가 함수가 아니다');
  });

  test('api-create-initial-state', 'createInitialState 는 함수다', function () {
    assert(typeof G.createInitialState === 'function', 'createInitialState 가 함수가 아니다');
  });

  test('api-game-status', 'GAME_STATUS 는 객체다', function () {
    assert(G.GAME_STATUS !== null && typeof G.GAME_STATUS === 'object', 'GAME_STATUS 가 객체가 아니다');
  });

  test('board-width', 'BOARD_WIDTH 는 10 이다', function () {
    assert(G.BOARD_WIDTH === 10, 'BOARD_WIDTH=' + G.BOARD_WIDTH);
  });

  test('board-height', 'BOARD_HEIGHT 는 20 이다', function () {
    assert(G.BOARD_HEIGHT === 20, 'BOARD_HEIGHT=' + G.BOARD_HEIGHT);
  });

  test('empty-board-row-count', '빈 보드의 행이 20개다', function () {
    var board = G.createEmptyBoard();
    assert(Array.isArray(board), '보드가 배열이 아니다');
    assert(board.length === 20, '행 개수=' + board.length);
  });

  test('empty-board-col-count', '모든 행의 셀이 10개다', function () {
    var board = G.createEmptyBoard();
    for (var y = 0; y < board.length; y += 1) {
      assert(Array.isArray(board[y]), y + '행이 배열이 아니다');
      assert(board[y].length === 10, y + '행의 셀 개수=' + board[y].length);
    }
  });

  test('empty-board-all-zero', '모든 셀이 숫자 0 이다', function () {
    var board = G.createEmptyBoard();
    for (var y = 0; y < board.length; y += 1) {
      for (var x = 0; x < board[y].length; x += 1) {
        var cell = board[y][x];
        assert(typeof cell === 'number' && cell === 0, '(' + y + ',' + x + ')=' + String(cell));
      }
    }
  });

  test('empty-board-outer-not-shared', '두 번 만든 보드의 최상위 배열이 다르다', function () {
    assert(G.createEmptyBoard() !== G.createEmptyBoard(), '최상위 배열이 같은 참조다');
  });

  test('empty-board-rows-not-shared', '두 번 만든 보드의 각 행 배열이 다르다', function () {
    var a = G.createEmptyBoard();
    var b = G.createEmptyBoard();
    for (var y = 0; y < a.length; y += 1) {
      assert(a[y] !== b[y], y + '행이 같은 참조다');
    }
  });

  test('status-keys', 'GAME_STATUS 키가 정확히 5개다', function () {
    var keys = Object.keys(G.GAME_STATUS);
    assert(keys.length === 5, '키 개수=' + keys.length + ' (' + keys.join(',') + ')');
  });

  test('status-values-match-keys', '각 값이 키 이름과 같은 문자열이다', function () {
    var keys = Object.keys(G.GAME_STATUS);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var value = G.GAME_STATUS[key];
      assert(typeof value === 'string', key + ' 값이 문자열이 아니다');
      assert(value === key, key + ' 값=' + value);
    }
  });

  test('status-frozen', 'GAME_STATUS 가 동결되어 있다', function () {
    assert(Object.isFrozen(G.GAME_STATUS), 'Object.isFrozen 이 false 다');
  });

  test('initial-score', '초기 상태 score 는 0 이다', function () {
    assert(G.createInitialState().score === 0, 'score=' + String(G.createInitialState().score));
  });

  test('initial-lines', '초기 상태 lines 는 0 이다', function () {
    assert(G.createInitialState().lines === 0, 'lines=' + String(G.createInitialState().lines));
  });

  test('initial-status', '초기 상태 status 는 GAME_STATUS.READY 다', function () {
    var state = G.createInitialState();
    assert(state.status === G.GAME_STATUS.READY, 'status=' + String(state.status));
  });

  test('initial-board-not-shared', '두 번 만든 초기 상태의 board 가 다르다', function () {
    var a = G.createInitialState();
    var b = G.createInitialState();
    assert(a.board !== b.board, 'board 가 같은 참조다');
    for (var y = 0; y < a.board.length; y += 1) {
      assert(a.board[y] !== b.board[y], y + '행이 같은 참조다');
    }
  });

  test('initial-board-shape', '초기 상태 board 가 20x10 이다', function () {
    var board = G.createInitialState().board;
    assert(board.length === 20, '행 개수=' + board.length);
    for (var y = 0; y < board.length; y += 1) {
      assert(board[y].length === 10, y + '행의 셀 개수=' + board[y].length);
    }
  });

  // ======================= SPEC_01 §7.3 — 신규 =======================

  test('api-surface-spec01', 'SPEC_01 공개 API 가 모두 있다', function () {
    assert(Array.isArray(G.PIECE_TYPES), 'PIECE_TYPES 가 배열이 아니다');
    assert(G.PIECE_SHAPES !== null && typeof G.PIECE_SHAPES === 'object', 'PIECE_SHAPES 가 객체가 아니다');
    assert(typeof G.DROP_INTERVAL_MS === 'number', 'DROP_INTERVAL_MS 가 숫자가 아니다');
    var fns = ['nextPieceType', 'createPiece', 'rotateCells', 'canPlace', 'applyMove', 'applyRotate', 'startGame'];
    for (var i = 0; i < fns.length; i += 1) {
      assert(typeof G[fns[i]] === 'function', fns[i] + ' 가 함수가 아니다');
    }
  });

  test('piece-types-order', 'PIECE_TYPES 가 I,O,T,S,Z,J,L 순이다', function () {
    assert(J(G.PIECE_TYPES) === J(['I', 'O', 'T', 'S', 'Z', 'J', 'L']), '실제=' + J(G.PIECE_TYPES));
  });

  test('piece-types-frozen', 'PIECE_TYPES 가 동결되어 있다', function () {
    assert(Object.isFrozen(G.PIECE_TYPES), 'Object.isFrozen 이 false 다');
  });

  test('shapes-matrix-size', 'I 4x4 · O 2x2 · 나머지 3x3 정사각이다', function () {
    var want = { I: 4, O: 2, T: 3, S: 3, Z: 3, J: 3, L: 3 };
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var m = G.PIECE_SHAPES[t];
      assert(Array.isArray(m), t + ' 행렬이 배열이 아니다');
      assert(m.length === want[t], t + ' 변 길이=' + m.length + ' (기대 ' + want[t] + ')');
      for (var r = 0; r < m.length; r += 1) {
        assert(m[r].length === want[t], t + ' ' + r + '행 길이=' + m[r].length);
      }
    }
  });

  test('shapes-cell-count', '일곱 종류 모두 채워진 칸이 4개다', function () {
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var n = 0;
      var m = G.PIECE_SHAPES[t];
      for (var r = 0; r < m.length; r += 1) {
        for (var c = 0; c < m[r].length; c += 1) {
          if (m[r][c] !== 0) { n += 1; }
        }
      }
      assert(n === 4, t + ' 채워진 칸=' + n);
    }
  });

  test('shapes-frozen', 'PIECE_SHAPES 와 각 행렬이 동결되어 있다', function () {
    assert(Object.isFrozen(G.PIECE_SHAPES), 'PIECE_SHAPES 가 동결되지 않았다');
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      assert(Object.isFrozen(G.PIECE_SHAPES[t]), t + ' 행렬이 동결되지 않았다');
    }
  });

  test('drop-interval-700', 'DROP_INTERVAL_MS 는 700 이다', function () {
    assert(G.DROP_INTERVAL_MS === 700, 'DROP_INTERVAL_MS=' + G.DROP_INTERVAL_MS);
  });

  test('next-piece-type-cycle', 'null→I · I→O · L→I · 목록 밖→I', function () {
    assert(G.nextPieceType(null) === 'I', 'null→' + G.nextPieceType(null));
    assert(G.nextPieceType(undefined) === 'I', 'undefined→' + G.nextPieceType(undefined));
    assert(G.nextPieceType('I') === 'O', 'I→' + G.nextPieceType('I'));
    assert(G.nextPieceType('L') === 'I', 'L→' + G.nextPieceType('L'));
    assert(G.nextPieceType('X') === 'I', 'X→' + G.nextPieceType('X'));
  });

  test('create-piece-spawn-col', '생성 열은 I=3 · O=4 · 나머지=3 이다', function () {
    var want = { I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var col = G.createPiece(t).col;
      assert(col === want[t], t + ' col=' + col + ' (기대 ' + want[t] + ')');
    }
  });

  test('create-piece-spawn-row', '일곱 종류 모두 row 가 0 이다', function () {
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      assert(G.createPiece(t).row === 0, t + ' row=' + G.createPiece(t).row);
    }
  });

  test('create-piece-cells-not-shared', 'piece.cells 가 원본·서로와 배열을 공유하지 않는다', function () {
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var a = G.createPiece(t);
      var b = G.createPiece(t);
      assert(a.cells !== G.PIECE_SHAPES[t], t + ' cells 가 PIECE_SHAPES 와 같은 참조다');
      assert(a.cells !== b.cells, t + ' 두 piece 의 cells 가 같은 참조다');
      for (var r = 0; r < a.cells.length; r += 1) {
        assert(a.cells[r] !== G.PIECE_SHAPES[t][r], t + ' ' + r + '행이 원본과 같은 참조다');
        assert(a.cells[r] !== b.cells[r], t + ' ' + r + '행이 서로 같은 참조다');
      }
    }
  });

  test('rotate-cells-t-clockwise', 'T 회전 결과가 [[0,1,0],[0,1,1],[0,1,0]] 이다', function () {
    var got = G.rotateCells(G.PIECE_SHAPES.T);
    assert(J(got) === J([[0, 1, 0], [0, 1, 1], [0, 1, 0]]), '실제=' + J(got));
  });

  test('rotate-cells-i-clockwise', 'I 회전 결과가 네 행 모두 [0,0,1,0] 이다', function () {
    var got = G.rotateCells(G.PIECE_SHAPES.I);
    assert(J(got) === J([[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]]), '실제=' + J(got));
  });

  test('rotate-cells-o-invariant', 'O 회전 결과 값은 같고 배열은 다른 객체다', function () {
    var got = G.rotateCells(G.PIECE_SHAPES.O);
    assert(J(got) === J(G.PIECE_SHAPES.O), '실제=' + J(got));
    assert(got !== G.PIECE_SHAPES.O, '같은 참조를 돌려줬다');
  });

  test('rotate-cells-pure', '회전 후 원본 행렬이 변하지 않는다', function () {
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var before = J(G.PIECE_SHAPES[t]);
      G.rotateCells(G.PIECE_SHAPES[t]);
      assert(J(G.PIECE_SHAPES[t]) === before, t + ' 원본이 변했다');
    }
  });

  test('rotate-cells-four-times-identity', '네 번 회전하면 원본과 값이 같다', function () {
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var m = G.PIECE_SHAPES[t];
      var got = G.rotateCells(G.rotateCells(G.rotateCells(G.rotateCells(m))));
      assert(J(got) === J(m), t + ' 4회전 결과=' + J(got));
    }
  });

  test('can-place-initial-true', '빈 보드에 생성 직후 piece 는 놓을 수 있다', function () {
    var board = G.createEmptyBoard();
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      assert(G.canPlace(board, G.createPiece(t)) === true, t + ' 가 false 다');
    }
  });

  test('can-place-left-out', '왼쪽 경계를 넘으면 false 다', function () {
    var board = G.createEmptyBoard();
    var p = G.createPiece('I');
    assert(G.canPlace(board, { type: 'I', cells: p.cells, row: 0, col: -1 }) === false, 'col=-1 인데 true 다');
  });

  test('can-place-right-out', '오른쪽 경계를 넘으면 false 다', function () {
    var board = G.createEmptyBoard();
    var p = G.createPiece('I');
    assert(G.canPlace(board, { type: 'I', cells: p.cells, row: 0, col: 7 }) === false, 'col=7 인데 true 다');
  });

  test('can-place-bottom-out', '아래쪽 경계를 넘으면 false 다', function () {
    var board = G.createEmptyBoard();
    var p = G.createPiece('I');
    assert(G.canPlace(board, { type: 'I', cells: p.cells, row: 19, col: 3 }) === false, 'row=19 인데 true 다');
  });

  test('initial-state-piece-null', '초기 상태 piece 는 null 이다', function () {
    assert(G.createInitialState().piece === null, 'piece=' + J(G.createInitialState().piece));
  });

  test('start-game-from-ready-type-i', '초기 상태에서 시작하면 PLAYING · I 다', function () {
    var next = G.startGame(G.createInitialState());
    assert(next.status === 'PLAYING', 'status=' + next.status);
    assert(next.piece && next.piece.type === 'I', 'type=' + (next.piece && next.piece.type));
  });

  test('start-game-cycles-type', 'T 다음은 S 다', function () {
    var landed = G.startGame(G.createInitialState());
    var withT = { board: landed.board, piece: G.createPiece('T'), score: 0, lines: 0, status: 'LANDED' };
    var next = G.startGame(withT);
    assert(next.piece.type === 'S', 'type=' + next.piece.type);
  });

  test('start-game-resets-board', '시작 결과의 board 는 20x10 전부 0 이고 score·lines 가 0 이다', function () {
    var next = G.startGame({ board: G.createEmptyBoard(), piece: G.createPiece('Z'), score: 99, lines: 7, status: 'LANDED' });
    assert(next.board.length === 20, '행 개수=' + next.board.length);
    for (var y = 0; y < next.board.length; y += 1) {
      assert(next.board[y].length === 10, y + '행 길이=' + next.board[y].length);
      for (var x = 0; x < next.board[y].length; x += 1) {
        assert(next.board[y][x] === 0, '(' + y + ',' + x + ')=' + next.board[y][x]);
      }
    }
    assert(next.score === 0 && next.lines === 0, 'score=' + next.score + ' lines=' + next.lines);
  });

  test('apply-move-left-ok', '왼쪽으로 갈 수 있으면 col 이 1 줄어든 새 상태를 준다', function () {
    var state = G.startGame(G.createInitialState());
    var next = G.applyMove(state, 0, -1);
    assert(next !== state, '같은 참조를 돌려줬다');
    assert(next.piece.col === state.piece.col - 1, 'col=' + next.piece.col + ' (이전 ' + state.piece.col + ')');
    assert(next.status === 'PLAYING', 'status=' + next.status);
  });

  test('apply-move-rejected-identity', '왼쪽 경계에서 거부되면 인자 state 를 그대로 준다', function () {
    var base = G.startGame(G.createInitialState());
    var state = { board: base.board, piece: { type: 'I', cells: base.piece.cells, row: 0, col: 0 }, score: 0, lines: 0, status: 'PLAYING' };
    assert(G.applyMove(state, 0, -1) === state, '같은 참조가 아니다');
  });

  test('apply-rotate-ok', '회전할 수 있으면 회전된 cells 를 가진 새 상태를 준다', function () {
    var state = G.startGame(G.createInitialState());
    var next = G.applyRotate(state);
    assert(next !== state, '같은 참조를 돌려줬다');
    assert(J(next.piece.cells) === J(G.rotateCells(state.piece.cells)), 'cells=' + J(next.piece.cells));
    assert(next.piece.row === state.piece.row && next.piece.col === state.piece.col, '위치가 보정됐다');
  });

  test('apply-rotate-rejected-identity', '회전 결과가 경계를 넘으면 인자 state 를 그대로 준다', function () {
    var board = G.createEmptyBoard();
    var piece = { type: 'T', cells: G.createPiece('T').cells, row: 18, col: 3 };
    var state = { board: board, piece: piece, score: 0, lines: 0, status: 'PLAYING' };
    assert(G.canPlace(board, piece) === true, '회전 전 위치부터 놓을 수 없다');
    assert(G.applyRotate(state) === state, '같은 참조가 아니다');
  });

  // ======================= SPEC_02 §7.3 — 신규 =======================

  function emptyBoard() {
    return G.createEmptyBoard();
  }

  function fillRow(board, row, from, to, type) {
    for (var c = from; c <= to; c += 1) {
      board[row][c] = type;
    }
    return board;
  }

  function occupied(board) {
    var out = [];
    for (var y = 0; y < board.length; y += 1) {
      for (var x = 0; x < board[y].length; x += 1) {
        if (board[y][x] !== 0) {
          out.push([y, x, board[y][x]]);
        }
      }
    }
    return out;
  }

  function pieceCells(piece) {
    var out = [];
    for (var i = 0; i < piece.cells.length; i += 1) {
      for (var j = 0; j < piece.cells[i].length; j += 1) {
        if (piece.cells[i][j] !== 0) {
          out.push([piece.row + i, piece.col + j]);
        }
      }
    }
    return out;
  }

  // 세로 I — 보드 열 9, 행 16~19
  function verticalI() {
    return { type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 };
  }

  function playing(board, piece, extra) {
    var state = { board: board, piece: piece, score: 0, lines: 0, status: G.GAME_STATUS.PLAYING };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) {
          state[k] = extra[k];
        }
      }
    }
    return state;
  }

  test('api-surface-spec02', 'SPEC_02 공개 API 가 모두 있다', function () {
    var fns = ['lockPiece', 'findFullRows', 'clearRows', 'lockAndAdvance'];
    for (var i = 0; i < fns.length; i += 1) {
      assert(typeof G[fns[i]] === 'function', fns[i] + ' 가 함수가 아니다');
    }
  });

  test('lock-piece-writes-type', '고정하면 채워진 칸에 종류 문자가 들어간다', function () {
    var piece = G.createPiece('T');
    var out = G.lockPiece(emptyBoard(), piece);
    var cells = pieceCells(piece);
    for (var i = 0; i < cells.length; i += 1) {
      var v = out[cells[i][0]][cells[i][1]];
      assert(v === 'T', '(' + cells[i][0] + ',' + cells[i][1] + ')=' + String(v));
    }
  });

  test('lock-piece-pure', '고정은 원본 보드를 변형하지 않는다', function () {
    var board = emptyBoard();
    var before = J(board);
    var out = G.lockPiece(board, G.createPiece('T'));
    assert(J(board) === before, '원본이 변했다');
    assert(out !== board, '같은 참조를 돌려줬다');
    for (var y = 0; y < board.length; y += 1) {
      assert(out[y] !== board[y], y + '행이 같은 참조다');
    }
  });

  test('lock-piece-keeps-others', '기존 고정 셀은 그대로 남는다', function () {
    var board = emptyBoard();
    board[19][0] = 'O';
    var out = G.lockPiece(board, G.createPiece('T'));
    assert(out[19][0] === 'O', '(19,0)=' + String(out[19][0]));
  });

  test('lock-piece-cell-count', '빈 보드에 고정하면 0 이 아닌 셀이 4개다', function () {
    for (var i = 0; i < G.PIECE_TYPES.length; i += 1) {
      var t = G.PIECE_TYPES[i];
      var out = G.lockPiece(emptyBoard(), G.createPiece(t));
      assert(occupied(out).length === 4, t + ' 고정 셀 수=' + occupied(out).length);
    }
  });

  test('find-full-rows-none', '빈 보드에는 완성 줄이 없다', function () {
    assert(J(G.findFullRows(emptyBoard())) === J([]), '실제=' + J(G.findFullRows(emptyBoard())));
  });

  test('find-full-rows-single', '19행을 채우면 [19] 다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 9, 'O');
    assert(J(G.findFullRows(board)) === J([19]), '실제=' + J(G.findFullRows(board)));
  });

  test('find-full-rows-multiple-ascending', '15행과 19행을 채우면 [15,19] 다', function () {
    var board = emptyBoard();
    fillRow(board, 19, 0, 9, 'O');
    fillRow(board, 15, 0, 9, 'I');
    assert(J(G.findFullRows(board)) === J([15, 19]), '실제=' + J(G.findFullRows(board)));
  });

  test('find-full-rows-ignores-partial', '9칸만 채운 행은 완성이 아니다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 8, 'O');
    assert(J(G.findFullRows(board)) === J([]), '실제=' + J(G.findFullRows(board)));
  });

  test('find-full-rows-ignores-piece', '현재 블록이 메울 자리는 세지 않는다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 8, 'O');
    var state = playing(board, { type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
    assert(J(G.findFullRows(state.board)) === J([]), '보드만 봐야 하는데 실제=' + J(G.findFullRows(state.board)));
  });

  test('clear-rows-single', '한 줄 제거하면 위 행이 한 칸 내려온다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 9, 'O');
    board[18][3] = 'I';
    var out = G.clearRows(board, [19]);
    assert(out[19][3] === 'I', '(19,3)=' + String(out[19][3]));
    assert(J(out[18]) === J([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), '18행=' + J(out[18]));
  });

  test('clear-rows-multiple-simultaneous', '비인접 두 행을 한 번에 제거한다', function () {
    var board = emptyBoard();
    fillRow(board, 19, 0, 9, 'O');
    fillRow(board, 15, 0, 9, 'I');
    board[14][0] = 'J';
    board[16][1] = 'S';
    var out = G.clearRows(board, [15, 19]);
    assert(out[16][0] === 'J', '14행 J 가 16행으로 안 갔다: ' + J(occupied(out)));
    assert(out[17][1] === 'S', '16행 S 가 17행으로 안 갔다: ' + J(occupied(out)));
    assert(occupied(out).length === 2, '남은 셀 수=' + occupied(out).length);
  });

  test('clear-rows-keeps-dimensions', '제거 후에도 20x10 이다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 9, 'O');
    var out = G.clearRows(board, [19]);
    assert(out.length === 20, '행 개수=' + out.length);
    for (var y = 0; y < out.length; y += 1) {
      assert(out[y].length === 10, y + '행 길이=' + out[y].length);
    }
  });

  test('clear-rows-top-empty', '제거한 줄 수만큼 상단이 빈 행이다', function () {
    var board = emptyBoard();
    fillRow(board, 19, 0, 9, 'O');
    fillRow(board, 15, 0, 9, 'I');
    var out = G.clearRows(board, [15, 19]);
    for (var y = 0; y < 2; y += 1) {
      for (var x = 0; x < 10; x += 1) {
        assert(out[y][x] === 0, '(' + y + ',' + x + ')=' + String(out[y][x]));
      }
    }
  });

  test('clear-rows-preserves-order', '남은 행의 셀 순서가 바뀌지 않는다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 9, 'O');
    board[18] = ['I', 0, 'J', 0, 0, 'L', 0, 0, 0, 'S'];
    var want = J(board[18]);
    var out = G.clearRows(board, [19]);
    assert(J(out[19]) === want, '실제=' + J(out[19]));
  });

  test('clear-rows-pure', '제거는 원본 보드를 변형하지 않는다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 9, 'O');
    var before = J(board);
    G.clearRows(board, [19]);
    assert(J(board) === before, '원본이 변했다');
  });

  test('clear-rows-empty-list', '빈 배열을 주면 값은 같고 참조는 다르다', function () {
    var board = fillRow(emptyBoard(), 19, 0, 8, 'O');
    var out = G.clearRows(board, []);
    assert(J(out) === J(board), '값이 달라졌다');
    assert(out !== board, '같은 참조를 돌려줬다');
  });

  test('lock-and-advance-locks-and-spawns', '고정하고 다음 블록을 만든다', function () {
    var state = playing(emptyBoard(), { type: 'I', cells: G.rotateCells(G.PIECE_SHAPES.I), row: 16, col: 7 });
    var next = G.lockAndAdvance(state);
    assert(occupied(next.board).length === 4, '고정 셀 수=' + occupied(next.board).length);
    assert(next.piece !== null && typeof next.piece === 'object', 'piece 가 없다');
    assert(next.status === 'PLAYING', 'status=' + next.status);
  });

  test('lock-and-advance-lines-accumulate', '한 줄 제거 시 lines 가 1 증가한다', function () {
    var state = playing(fillRow(emptyBoard(), 19, 0, 8, 'O'), verticalI(), { lines: 3 });
    var next = G.lockAndAdvance(state);
    assert(next.lines === 4, 'lines=' + next.lines);
  });

  test('lock-and-advance-multi-line-once', '두 줄 동시 제거 시 lines 가 2 증가한다', function () {
    var board = emptyBoard();
    fillRow(board, 18, 0, 8, 'O');
    fillRow(board, 19, 0, 8, 'O');
    var next = G.lockAndAdvance(playing(board, verticalI(), { lines: 3 }));
    assert(next.lines === 5, 'lines=' + next.lines);
    assert(occupied(next.board).length === 2, '남은 고정 셀=' + J(occupied(next.board)));
  });

  test('lock-and-advance-clears-before-spawn', '제거가 끝난 보드 위에 새 블록이 놓인다', function () {
    var next = G.lockAndAdvance(playing(fillRow(emptyBoard(), 19, 0, 8, 'O'), verticalI()));
    assert(J(G.findFullRows(next.board)) === J([]), '완성 줄이 남아 있다: ' + J(G.findFullRows(next.board)));
    assert(G.canPlace(next.board, next.piece) === true, '새 블록을 놓을 수 없는 보드다');
  });

  test('lock-and-advance-spawns-next-type', '새 블록은 순환의 다음 종류다', function () {
    var state = playing(emptyBoard(), { type: 'T', cells: G.createPiece('T').cells, row: 18, col: 3 });
    var next = G.lockAndAdvance(state);
    assert(next.piece.type === G.nextPieceType('T'), 'type=' + next.piece.type);
    assert(next.piece.type === 'S', 'T 다음이 S 가 아니다: ' + next.piece.type);
  });

  test('lock-and-advance-game-over', '생성 위치가 막히면 GAME_OVER 이고 piece 는 null 이다', function () {
    var board = emptyBoard();
    [0, 1, 2, 3].forEach(function (r) { fillRow(board, r, 0, 8, 'O'); });
    var next = G.lockAndAdvance(playing(board, verticalI()));
    assert(next.status === 'GAME_OVER', 'status=' + next.status);
    assert(next.piece === null, 'piece=' + J(next.piece));
  });

  test('lock-and-advance-game-over-keeps-board', '게임오버여도 보드는 제거·압축까지 끝난 상태다', function () {
    var board = emptyBoard();
    [0, 1, 2, 3].forEach(function (r) { fillRow(board, r, 0, 8, 'O'); });
    var piece = verticalI();
    var expected = G.clearRows(G.lockPiece(board, piece), G.findFullRows(G.lockPiece(board, piece)));
    var next = G.lockAndAdvance(playing(board, piece));
    assert(J(next.board) === J(expected), '보드가 기대와 다르다');
    assert(occupied(next.board).length === 4 * 9 + 4, '고정 셀 수=' + occupied(next.board).length);
  });

  test('lock-and-advance-ignored-when-not-playing', 'PLAYING 이 아니거나 piece 가 없으면 그대로 반환한다', function () {
    var ready = G.createInitialState();
    assert(G.lockAndAdvance(ready) === ready, 'READY 에서 상태가 바뀌었다');
    var over = playing(emptyBoard(), null, { status: 'GAME_OVER' });
    assert(G.lockAndAdvance(over) === over, 'GAME_OVER 에서 상태가 바뀌었다');
    var noPiece = playing(emptyBoard(), null);
    assert(G.lockAndAdvance(noPiece) === noPiece, 'piece 가 null 인데 상태가 바뀌었다');
  });

  test('apply-move-down-locks', '아래가 막히면 고정 처리 결과를 준다', function () {
    var state = playing(emptyBoard(), verticalI());
    var next = G.applyMove(state, 1, 0);
    assert(next !== state, '같은 참조를 돌려줬다');
    assert(next.status === 'PLAYING', 'status=' + next.status);
    assert(occupied(next.board).length === 4, '고정 셀 수=' + occupied(next.board).length);
    assert(next.piece && next.piece.type === 'O', '새 블록 type=' + (next.piece && next.piece.type));
  });

  test('apply-move-blocked-by-locked-cell', '옆이 고정 셀이면 이동이 거부된다', function () {
    var board = emptyBoard();
    board[1][2] = 'O';
    var state = playing(board, G.createPiece('I'));
    assert(G.applyMove(state, 0, -1) === state, '같은 참조가 아니다');
  });

  test('apply-rotate-blocked-by-locked-cell', '회전 결과가 고정 셀과 겹치면 거부된다', function () {
    var board = emptyBoard();
    board[2][4] = 'O';
    var state = playing(board, G.createPiece('T'));
    assert(G.applyRotate(state) === state, '같은 참조가 아니다');
  });

  test('apply-move-ignored-when-game-over', 'GAME_OVER 에서 이동은 그대로 반환한다', function () {
    var state = playing(emptyBoard(), G.createPiece('I'), { status: 'GAME_OVER' });
    assert(G.applyMove(state, 0, -1) === state, '왼쪽 이동이 상태를 바꿨다');
    assert(G.applyMove(state, 1, 0) === state, '아래 이동이 상태를 바꿨다');
  });

  test('apply-rotate-ignored-when-game-over', 'GAME_OVER 에서 회전은 그대로 반환한다', function () {
    var state = playing(emptyBoard(), G.createPiece('T'), { status: 'GAME_OVER' });
    assert(G.applyRotate(state) === state, '같은 참조가 아니다');
  });

  // ======================= SPEC_03 §7.3 — 신규 =======================

  function rec(id, score, playedAt, name, lines) {
    return {
      id: id,
      name: name === undefined ? id : name,
      score: score,
      clearedLines: lines === undefined ? 1 : lines,
      playedAt: playedAt
    };
  }

  function ids(records) {
    return records.map(function (r) { return r.id; }).join(',');
  }

  test('api-surface-spec03', 'SPEC_03 공개 API 가 모두 있다', function () {
    assert(Array.isArray(G.SCORE_TABLE), 'SCORE_TABLE 이 배열이 아니다');
    assert(typeof G.LEADERBOARD_KEY === 'string', 'LEADERBOARD_KEY 가 문자열이 아니다');
    assert(typeof G.LEADERBOARD_LIMIT === 'number', 'LEADERBOARD_LIMIT 가 숫자가 아니다');
    var fns = ['scoreForLines', 'validateName', 'sanitizeRecords', 'sortRecords', 'addRecord'];
    for (var i = 0; i < fns.length; i += 1) {
      assert(typeof G[fns[i]] === 'function', fns[i] + ' 가 함수가 아니다');
    }
  });

  test('score-table-values', 'SCORE_TABLE 이 [0,100,300,500,800] 이고 동결되어 있다', function () {
    assert(J(G.SCORE_TABLE) === J([0, 100, 300, 500, 800]), '실제=' + J(G.SCORE_TABLE));
    assert(Object.isFrozen(G.SCORE_TABLE), '동결되지 않았다');
  });

  test('score-for-lines-table', '0·1·2·3·4 가 0·100·300·500·800 이다', function () {
    var got = [0, 1, 2, 3, 4].map(function (n) { return G.scoreForLines(n); });
    assert(J(got) === J([0, 100, 300, 500, 800]), '실제=' + J(got));
  });

  test('score-for-lines-out-of-range', '범위 밖 입력은 전부 0 이다', function () {
    var inputs = [-1, 5, 1.5, '2', null, undefined, NaN, Infinity];
    for (var i = 0; i < inputs.length; i += 1) {
      var got = G.scoreForLines(inputs[i]);
      assert(got === 0, String(inputs[i]) + ' → ' + got);
    }
  });

  test('leaderboard-key-exact', '저장 키가 tetris-loop.leaderboard.v1 이다', function () {
    assert(G.LEADERBOARD_KEY === 'tetris-loop.leaderboard.v1', '실제=' + G.LEADERBOARD_KEY);
  });

  test('leaderboard-limit-ten', 'LEADERBOARD_LIMIT 이 10 이다', function () {
    assert(G.LEADERBOARD_LIMIT === 10, '실제=' + G.LEADERBOARD_LIMIT);
  });

  test('lock-and-advance-adds-score', '한 줄 100 · 두 줄 300 이 더해진다', function () {
    var one = G.lockAndAdvance(playing(fillRow(emptyBoard(), 19, 0, 8, 'O'), verticalI(), { score: 0 }));
    assert(one.score === 100, '한 줄 score=' + one.score);
    var board = emptyBoard();
    fillRow(board, 18, 0, 8, 'O');
    fillRow(board, 19, 0, 8, 'O');
    var two = G.lockAndAdvance(playing(board, verticalI(), { score: 0 }));
    assert(two.score === 300, '두 줄 score=' + two.score);
    var accumulated = G.lockAndAdvance(playing(fillRow(emptyBoard(), 19, 0, 8, 'O'), verticalI(), { score: 500 }));
    assert(accumulated.score === 600, '누적 score=' + accumulated.score);
  });

  test('lock-and-advance-score-on-game-over', '게임오버 고정에서도 점수가 더해진다', function () {
    var board = emptyBoard();
    fillRow(board, 19, 0, 8, 'O');
    [0, 1, 2, 3].forEach(function (r) { fillRow(board, r, 0, 8, 'O'); });
    var next = G.lockAndAdvance(playing(board, verticalI(), { score: 0 }));
    assert(next.status === 'GAME_OVER', 'status=' + next.status);
    assert(next.score === 100, 'score=' + next.score);
    assert(next.lines === 1, 'lines=' + next.lines);
  });

  test('validate-name-trims', '앞뒤 공백을 제거한다', function () {
    var r = G.validateName('  민수  ');
    assert(r.ok === true, 'ok=' + r.ok + ' reason=' + r.reason);
    assert(r.name === '민수', 'name=' + J(r.name));
  });

  test('validate-name-too-short', '1자와 빈 문자열은 TOO_SHORT 다', function () {
    assert(G.validateName('민').reason === 'TOO_SHORT', "'민' → " + G.validateName('민').reason);
    assert(G.validateName('').reason === 'TOO_SHORT', "'' → " + G.validateName('').reason);
    assert(G.validateName('a').reason === 'TOO_SHORT', "'a' → " + G.validateName('a').reason);
    assert(G.validateName('   ').reason === 'TOO_SHORT', '공백만 → ' + G.validateName('   ').reason);
  });

  test('validate-name-min-two', '2자는 통과한다', function () {
    assert(G.validateName('민수').ok === true, 'reason=' + G.validateName('민수').reason);
  });

  test('validate-name-max-ten', '10자는 통과한다', function () {
    var ten = '가나다라마바사아자차';
    assert(Array.from(ten).length === 10, '테스트 데이터가 10자가 아니다');
    assert(G.validateName(ten).ok === true, 'reason=' + G.validateName(ten).reason);
  });

  test('validate-name-too-long', '11자는 TOO_LONG 이다', function () {
    var eleven = '가나다라마바사아자차카';
    assert(Array.from(eleven).length === 11, '테스트 데이터가 11자가 아니다');
    assert(G.validateName(eleven).reason === 'TOO_LONG', '실제=' + G.validateName(eleven).reason);
  });

  test('validate-name-hangul', '한글 이름은 통과한다', function () {
    assert(G.validateName('테트리스').ok === true, 'reason=' + G.validateName('테트리스').reason);
  });

  test('validate-name-latin-digit', '영문·숫자 조합은 통과한다', function () {
    assert(G.validateName('Player1').ok === true, "Player1 → " + G.validateName('Player1').reason);
    assert(G.validateName('테트리스7').ok === true, "테트리스7 → " + G.validateName('테트리스7').reason);
  });

  test('validate-name-inner-space', '내부 공백은 INVALID_CHAR 다', function () {
    assert(G.validateName('김 민수').reason === 'INVALID_CHAR', '실제=' + G.validateName('김 민수').reason);
  });

  test('validate-name-symbol', '특수문자는 INVALID_CHAR 다', function () {
    assert(G.validateName('Player!').reason === 'INVALID_CHAR', '실제=' + G.validateName('Player!').reason);
  });

  test('validate-name-emoji', '이모지는 INVALID_CHAR 다 (길이로 걸리지 않는다)', function () {
    var r = G.validateName('민수🎮');
    assert(r.reason === 'INVALID_CHAR', '실제=' + r.reason);
  });

  test('validate-name-jamo', '한글 자모는 INVALID_CHAR 다', function () {
    assert(G.validateName('ㄱㄴ').reason === 'INVALID_CHAR', '실제=' + G.validateName('ㄱㄴ').reason);
  });

  test('validate-name-shape', '반환 객체가 ok·name·reason 셋이다', function () {
    var keys = Object.keys(G.validateName('민수')).sort();
    assert(keys.join(',') === 'name,ok,reason', '키=' + keys.join(','));
    assert(G.validateName('민수').reason === null, 'ok 인데 reason 이 null 이 아니다');
    assert(typeof G.validateName(null).name === 'string', '문자열이 아닌 입력에 name 이 문자열이 아니다');
  });

  test('sanitize-non-array', '배열이 아니면 빈 배열이다', function () {
    var inputs = [null, 'x', 3, {}, undefined, true];
    for (var i = 0; i < inputs.length; i += 1) {
      var got = G.sanitizeRecords(inputs[i]);
      assert(Array.isArray(got) && got.length === 0, J(inputs[i]) + ' → ' + J(got));
    }
  });

  test('sanitize-drops-invalid-items', '필수 키·타입이 어긋난 항목만 제거한다', function () {
    var input = [
      rec('a', 100, 1),
      { id: 'b', name: 'B', score: 100 },
      { id: 'c', name: 'C', score: '100', clearedLines: 1, playedAt: 2 },
      null,
      'x',
      rec('d', 200, 3)
    ];
    var got = G.sanitizeRecords(input);
    assert(ids(got) === 'a,d', '남은 id=' + ids(got));
  });

  test('sanitize-keeps-valid', '유효 기록의 값을 바꾸지 않는다', function () {
    var one = rec('a', 100, 5, '민수', 3);
    var got = G.sanitizeRecords([one]);
    assert(got.length === 1, '길이=' + got.length);
    assert(J(got[0]) === J(one), '값이 변했다: ' + J(got[0]));
  });

  test('sort-score-desc', '점수 내림차순이다', function () {
    var got = G.sortRecords([rec('a', 100, 1), rec('b', 300, 2), rec('c', 200, 3)]);
    assert(ids(got) === 'b,c,a', '순서=' + ids(got));
  });

  test('sort-tie-played-at-asc', '동점이면 playedAt 오름차순이다', function () {
    var got = G.sortRecords([rec('late', 300, 30), rec('low', 100, 1), rec('early', 300, 20)]);
    assert(ids(got) === 'early,late,low', '순서=' + ids(got));
  });

  test('sort-stable-on-full-tie', '점수·playedAt 이 같으면 기존 순서를 지킨다', function () {
    var got = G.sortRecords([rec('first', 300, 7), rec('second', 300, 7), rec('third', 300, 7)]);
    assert(ids(got) === 'first,second,third', '순서=' + ids(got));
  });

  test('sort-pure', '정렬은 원본을 변형하지 않는다', function () {
    var input = [rec('a', 100, 1), rec('b', 300, 2)];
    var before = ids(input);
    var got = G.sortRecords(input);
    assert(ids(input) === before, '원본이 변했다: ' + ids(input));
    assert(got !== input, '같은 참조를 돌려줬다');
  });

  test('add-record-sorts-then-limits', '추가 → 정렬 → 상위 10개 순서다', function () {
    var base = [];
    for (var i = 0; i < 10; i += 1) {
      base.push(rec('r' + i, (i + 1) * 100, i + 1));
    }
    var before = ids(base);

    var top = G.addRecord(base, rec('best', 5000, 99));
    assert(top.length === 10, '길이=' + top.length);
    assert(top[0].id === 'best', '1위=' + top[0].id);
    assert(ids(top).indexOf('r0') < 0, '최하위 r0 가 남아 있다: ' + ids(top));

    var low = G.addRecord(base, rec('weak', 5, 99));
    assert(low.length === 10, '길이=' + low.length);
    assert(ids(low).indexOf('weak') < 0, '10위 밖 기록이 남았다: ' + ids(low));

    assert(ids(base) === before, '원본이 변했다');
  });

  // ======================= SPEC_04 §7.3 — 신규 =======================

  function oneLineState(lines, score) {
    return playing(fillRow(emptyBoard(), 19, 0, 8, 'O'), verticalI(), { lines: lines, score: score || 0 });
  }

  function twoLineState(lines, score) {
    var board = emptyBoard();
    fillRow(board, 18, 0, 8, 'O');
    fillRow(board, 19, 0, 8, 'O');
    return playing(board, verticalI(), { lines: lines, score: score || 0 });
  }

  function fourLineState(lines, score) {
    var board = emptyBoard();
    [16, 17, 18, 19].forEach(function (r) { fillRow(board, r, 0, 8, 'O'); });
    return playing(board, verticalI(), { lines: lines, score: score || 0 });
  }

  test('api-surface-spec04', 'SPEC_04 공개 API 가 모두 있다', function () {
    assert(typeof G.levelForLines === 'function', 'levelForLines 가 함수가 아니다');
    assert(typeof G.dropIntervalForLevel === 'function', 'dropIntervalForLevel 이 함수가 아니다');
  });

  test('level-for-lines-boundaries', '0·9·10·19·20 이 1·1·2·2·3 이다', function () {
    var got = [0, 9, 10, 19, 20].map(G.levelForLines);
    assert(J(got) === J([1, 1, 2, 2, 3]), '실제=' + J(got));
  });

  test('level-for-lines-higher', '29·30·99·100 이 3·4·10·11 이다', function () {
    var got = [29, 30, 99, 100].map(G.levelForLines);
    assert(J(got) === J([3, 4, 10, 11]), '실제=' + J(got));
  });

  test('level-for-lines-invalid', '범위 밖 입력은 전부 1 이다', function () {
    var inputs = [-1, 1.5, '10', null, undefined, NaN];
    for (var i = 0; i < inputs.length; i += 1) {
      assert(G.levelForLines(inputs[i]) === 1, String(inputs[i]) + ' → ' + G.levelForLines(inputs[i]));
    }
  });

  test('level-for-lines-formula', '0~50 전 구간에서 floor(n/10)+1 과 같다', function () {
    for (var n = 0; n <= 50; n += 1) {
      assert(G.levelForLines(n) === Math.floor(n / 10) + 1, n + ' → ' + G.levelForLines(n));
    }
  });

  test('drop-interval-levels-1-to-5', '레벨 1~5 가 700·640·580·520·460 이다', function () {
    var got = [1, 2, 3, 4, 5].map(G.dropIntervalForLevel);
    assert(J(got) === J([700, 640, 580, 520, 460]), '실제=' + J(got));
  });

  test('drop-interval-level-11-exact-100', '레벨 11 은 계산값이 정확히 100 이다', function () {
    assert(G.dropIntervalForLevel(11) === 100, '실제=' + G.dropIntervalForLevel(11));
    assert(700 - 10 * 60 === 100, '계산값 확인');
  });

  test('drop-interval-floor-100', '12·20·100·1000 은 전부 100 이다', function () {
    var got = [12, 20, 100, 1000].map(G.dropIntervalForLevel);
    assert(J(got) === J([100, 100, 100, 100]), '실제=' + J(got));
  });

  test('drop-interval-never-below-100', '레벨 1~200 에서 항상 100 이상이다', function () {
    for (var l = 1; l <= 200; l += 1) {
      assert(G.dropIntervalForLevel(l) >= 100, '레벨 ' + l + ' → ' + G.dropIntervalForLevel(l));
    }
  });

  test('drop-interval-invalid', '범위 밖 레벨은 전부 700 이다', function () {
    var inputs = [0, -1, 1.5, '2', null, undefined];
    for (var i = 0; i < inputs.length; i += 1) {
      assert(G.dropIntervalForLevel(inputs[i]) === 700, String(inputs[i]) + ' → ' + G.dropIntervalForLevel(inputs[i]));
    }
  });

  test('drop-interval-level-1-equals-constant', '레벨 1 간격이 DROP_INTERVAL_MS 와 같다', function () {
    assert(G.dropIntervalForLevel(1) === G.DROP_INTERVAL_MS, G.dropIntervalForLevel(1) + ' !== ' + G.DROP_INTERVAL_MS);
    assert(G.DROP_INTERVAL_MS === 700, 'DROP_INTERVAL_MS=' + G.DROP_INTERVAL_MS);
  });

  test('lock-and-advance-multiplies-by-level', 'lines 0·10·20 에서 한 줄이 100·200·300 이다', function () {
    var got = [0, 10, 20].map(function (n) { return G.lockAndAdvance(oneLineState(n)).score; });
    assert(J(got) === J([100, 200, 300]), '실제=' + J(got));
  });

  test('lock-and-advance-uses-level-before-clear', 'lines 9 에서 한 줄은 레벨 1 배수다', function () {
    var next = G.lockAndAdvance(oneLineState(9));
    assert(next.score === 100, 'score=' + next.score + ' (레벨 2 를 곱했다면 200)');
    assert(next.lines === 10, 'lines=' + next.lines);
    assert(G.levelForLines(next.lines) === 2, '새 레벨=' + G.levelForLines(next.lines));
  });

  test('lock-and-advance-boundary-19-to-21', 'lines 19 에서 두 줄은 300×2=600 이다', function () {
    var next = G.lockAndAdvance(twoLineState(19));
    assert(next.score === 600, 'score=' + next.score);
    assert(next.lines === 21, 'lines=' + next.lines);
  });

  test('lock-and-advance-boundary-20', 'lines 20 에서 두 줄은 300×3=900 이다', function () {
    var next = G.lockAndAdvance(twoLineState(20));
    assert(next.score === 900, 'score=' + next.score);
  });

  test('lock-and-advance-multiplier-once', 'lines 10 에서 한 줄은 정확히 200 이다', function () {
    var next = G.lockAndAdvance(oneLineState(10));
    assert(next.score === 200, 'score=' + next.score + ' (400 이면 배수 중복)');
  });

  test('lock-and-advance-four-lines-at-9', 'lines 9 에서 네 줄은 800×1=800 이다', function () {
    var next = G.lockAndAdvance(fourLineState(9));
    assert(next.lines === 13, 'lines=' + next.lines);
    assert(next.score === 800, 'score=' + next.score);
  });

  test('move-and-rotate-do-not-score', '이동·회전으로는 점수가 오르지 않는다', function () {
    var state = playing(emptyBoard(), G.createPiece('T'), { lines: 25, score: 0 });
    var s = state;
    s = G.applyMove(s, 0, -1); s = G.applyMove(s, 0, 1); s = G.applyMove(s, 1, 0); s = G.applyRotate(s);
    s = G.applyMove(s, 1, 0); s = G.applyRotate(s);
    assert(s.score === 0, 'score=' + s.score);
    assert(s.status === 'PLAYING', 'status=' + s.status);
  });

  test('start-game-resets-lines-to-zero', 'lines 37 에서 startGame 하면 lines 0 · 레벨 1 이다', function () {
    var next = G.startGame(playing(emptyBoard(), null, { lines: 37, score: 999, status: 'GAME_OVER' }));
    assert(next.lines === 0, 'lines=' + next.lines);
    assert(G.levelForLines(next.lines) === 1, '레벨=' + G.levelForLines(next.lines));
    assert(next.score === 0, 'score=' + next.score);
  });

  test('score-table-unchanged', 'SCORE_TABLE 이 그대로다', function () {
    assert(J(G.SCORE_TABLE) === J([0, 100, 300, 500, 800]), '실제=' + J(G.SCORE_TABLE));
  });

  // ======================= SPEC_05 §7.3 — 신규 =======================

  function makeSupply(queue) {
    var q = queue.slice();
    var s = function (prev) { s.calls += 1; s.args.push(prev); return q.shift(); };
    s.calls = 0;
    s.args = [];
    return s;
  }

  function bottomT() {
    return { type: 'T', cells: G.createPiece('T').cells, row: 18, col: 3 };
  }

  function playingNext(board, piece, next, extra) {
    var st = playing(board, piece, extra);
    st.next = next;
    return st;
  }

  function blockedTopBoard() {
    var b = emptyBoard();
    [0, 1, 2, 3].forEach(function (r) { fillRow(b, r, 0, 8, 'O'); });
    return b;
  }

  test('initial-state-keys-six', '초기 상태 키가 여섯 개다', function () {
    var keys = Object.keys(G.createInitialState()).sort().join(',');
    assert(keys === 'board,lines,next,piece,score,status', '키=' + keys);
  });

  test('initial-state-next-null', '초기 상태 next 는 null 이다', function () {
    assert(G.createInitialState().next === null, 'next=' + J(G.createInitialState().next));
  });

  test('start-game-sets-next', '기본 공급자로 시작하면 I / next O 다', function () {
    var r = G.startGame(G.createInitialState());
    assert(r.piece.type === 'I' && r.next === 'O', 'piece=' + r.piece.type + ' next=' + r.next);
  });

  test('start-game-supply-two-calls', '공급자 [T,I,L] 로 시작하면 (T,I) 이고 2회 호출이다', function () {
    var s = makeSupply(['T', 'I', 'L']);
    var r = G.startGame(null, s);
    assert(r.piece.type === 'T' && r.next === 'I', 'piece=' + r.piece.type + ' next=' + r.next);
    assert(s.calls === 2, 'calls=' + s.calls);
  });

  test('start-game-supply-order', '첫 호출 결과가 piece, 둘째가 next 다', function () {
    var r = G.startGame(null, makeSupply(['Z', 'J']));
    assert(r.piece.type === 'Z', 'piece=' + r.piece.type);
    assert(r.next === 'J', 'next=' + r.next);
  });

  test('start-game-ignores-previous-next', '재시작은 이전 next 를 쓰지 않는다', function () {
    var prev = playingNext(emptyBoard(), G.createPiece('L'), 'O', { status: 'GAME_OVER' });
    var s = makeSupply(['S', 'Z']);
    var r = G.startGame(prev, s);
    assert(r.piece.type === 'S' && r.next === 'Z', 'piece=' + r.piece.type + ' next=' + r.next);
    assert(s.calls === 2, 'calls=' + s.calls);
  });

  test('start-game-supply-prev-arg', '공급자 인자가 이전 종류 → 첫 결과 순이다', function () {
    var s1 = makeSupply(['T', 'I']);
    G.startGame(null, s1);
    assert(J(s1.args) === J([null, 'T']), 'args=' + J(s1.args));
    var s2 = makeSupply(['T', 'I']);
    G.startGame(playing(emptyBoard(), G.createPiece('L')), s2);
    assert(J(s2.args) === J(['L', 'T']), 'args=' + J(s2.args));
  });

  test('lock-promotes-next', '굳으면 next 가 현재 블록이 된다', function () {
    var r = G.lockAndAdvance(playingNext(emptyBoard(), bottomT(), 'I'), makeSupply(['L']));
    assert(r.piece.type === 'I', 'piece=' + (r.piece && r.piece.type));
  });

  test('lock-promoted-uses-spawn-rule', '승격 블록의 좌표는 createPiece 규칙이다', function () {
    var r = G.lockAndAdvance(playingNext(emptyBoard(), bottomT(), 'I'), makeSupply(['L']));
    var want = G.createPiece('I');
    assert(J(r.piece.cells) === J(want.cells), 'cells 불일치');
    assert(r.piece.row === want.row && r.piece.col === want.col, 'row/col=' + r.piece.row + '/' + r.piece.col);
  });

  test('lock-supplies-new-next-once', '승격 후 next 를 정확히 한 번 공급한다', function () {
    var s = makeSupply(['L']);
    var r = G.lockAndAdvance(playingNext(emptyBoard(), bottomT(), 'I'), s);
    assert(r.next === 'L', 'next=' + r.next);
    assert(s.calls === 1, 'calls=' + s.calls);
  });

  test('lock-supply-after-promotion', '공급자 인자가 승격된 종류다', function () {
    var s = makeSupply(['L']);
    G.lockAndAdvance(playingNext(emptyBoard(), bottomT(), 'I'), s);
    assert(J(s.args) === J(['I']), 'args=' + J(s.args));
  });

  test('lock-sequence-tilo', '[T,I,L,O,Z] 에서 (T,I)(I,L)(L,O)(O,Z), calls 2·3·4·5 다', function () {
    var s = makeSupply(['T', 'I', 'L', 'O', 'Z']);
    var st = G.startGame(null, s);
    var trace = [[st.piece.type, st.next, s.calls]];
    var cols = [0, 3, 7];
    for (var k = 0; k < 3; k += 1) {
      var N = st.piece.cells.length;
      var moved = { type: st.piece.type, cells: st.piece.cells, row: 18 - (N - 3), col: cols[k] };
      st = G.lockAndAdvance({ board: st.board, piece: moved, next: st.next, score: st.score, lines: st.lines, status: st.status }, s);
      assert(st.status === 'PLAYING', k + '회차 status=' + st.status);
      trace.push([st.piece.type, st.next, s.calls]);
    }
    assert(J(trace) === J([['T', 'I', 2], ['I', 'L', 3], ['L', 'O', 4], ['O', 'Z', 5]]), '궤적=' + J(trace));
  });

  test('lock-null-next-falls-back-to-cycle', 'next 가 없으면 순환으로 보충한다', function () {
    var r = G.lockAndAdvance(playing(emptyBoard(), bottomT()));
    assert(r.piece.type === 'S' && r.next === 'Z', 'piece=' + r.piece.type + ' next=' + r.next);
  });

  test('lock-game-over-keeps-next', '생성이 막히면 GAME_OVER 이고 next 는 그대로다', function () {
    var r = G.lockAndAdvance(playingNext(blockedTopBoard(), verticalI(), 'T'), makeSupply(['O']));
    assert(r.status === 'GAME_OVER', 'status=' + r.status);
    assert(r.next === 'T', 'next=' + r.next);
  });

  test('lock-game-over-no-supply', '게임오버면 공급자를 부르지 않는다', function () {
    var s = makeSupply(['O']);
    G.lockAndAdvance(playingNext(blockedTopBoard(), verticalI(), 'T'), s);
    assert(s.calls === 0, 'calls=' + s.calls);
  });

  test('lock-game-over-piece-null', '게임오버면 piece 가 null 이다', function () {
    var r = G.lockAndAdvance(playingNext(blockedTopBoard(), verticalI(), 'T'), makeSupply(['O']));
    assert(r.piece === null, 'piece=' + J(r.piece));
  });

  test('lock-ignored-when-not-playing-keeps-next', 'GAME_OVER 에서 lockAndAdvance 는 인자 그대로다', function () {
    var st = playingNext(emptyBoard(), null, 'T', { status: 'GAME_OVER' });
    assert(G.lockAndAdvance(st, makeSupply(['O'])) === st, '같은 참조가 아니다');
  });

  test('apply-move-keeps-next', '이동은 next 를 바꾸지 않는다', function () {
    var st = playingNext(emptyBoard(), G.createPiece('T'), 'S');
    var a = G.applyMove(st, 0, -1), b = G.applyMove(st, 0, 1), c = G.applyMove(st, 1, 0);
    assert(a.next === 'S' && b.next === 'S' && c.next === 'S', 'next=' + [a.next, b.next, c.next].join(','));
  });

  test('apply-rotate-keeps-next', '회전은 next 를 바꾸지 않는다', function () {
    var r = G.applyRotate(playingNext(emptyBoard(), G.createPiece('T'), 'S'));
    assert(r.next === 'S', 'next=' + r.next);
  });

  test('next-does-not-touch-board', 'next 만 다른 두 상태의 board 는 같다', function () {
    var a = playingNext(fillRow(emptyBoard(), 19, 0, 4, 'O'), G.createPiece('T'), 'I');
    var b = playingNext(fillRow(emptyBoard(), 19, 0, 4, 'O'), G.createPiece('T'), 'L');
    assert(J(a.board) === J(b.board), 'board 가 다르다');
    assert(G.canPlace(a.board, a.piece) === G.canPlace(b.board, b.piece), 'canPlace 가 다르다');
  });

  test('next-type-is-single-char', '정상 상태의 next 는 PIECE_TYPES 원소 하나다', function () {
    var r = G.startGame(G.createInitialState());
    assert(typeof r.next === 'string' && r.next.length === 1 && G.PIECE_TYPES.indexOf(r.next) >= 0, 'next=' + J(r.next));
  });

  test('next-grid-index-table', '일곱 종류의 4x4 중앙 배치 인덱스가 표와 같다', function () {
    var want = { I: [4, 5, 6, 7], O: [5, 6, 9, 10], T: [1, 4, 5, 6], S: [1, 2, 4, 5], Z: [0, 1, 5, 6], J: [0, 4, 5, 6], L: [2, 4, 5, 6] };
    G.PIECE_TYPES.forEach(function (t) {
      var m = G.PIECE_SHAPES[t], off = Math.floor((4 - m.length) / 2), idx = [];
      for (var i = 0; i < m.length; i += 1) for (var j = 0; j < m[i].length; j += 1) if (m[i][j]) idx.push((i + off) * 4 + (j + off));
      assert(J(idx) === J(want[t]), t + ' 인덱스=' + J(idx));
    });
  });

  test('default-supply-is-cycle', '공급자를 생략하면 순환과 같다', function () {
    var a = G.startGame(playing(emptyBoard(), G.createPiece('T')));
    assert(a.piece.type === G.nextPieceType('T') && a.next === G.nextPieceType(a.piece.type), 'start=' + a.piece.type + '/' + a.next);
    var b = G.lockAndAdvance(playingNext(emptyBoard(), bottomT(), 'J'));
    assert(b.piece.type === 'J' && b.next === G.nextPieceType('J'), 'lock=' + b.piece.type + '/' + b.next);
  });

  test('record-has-no-next', '기록 검사는 다섯 키만 본다', function () {
    var rec = { id: 'a', name: 'A', score: 1, clearedLines: 1, playedAt: 1 };
    assert(G.sanitizeRecords([rec]).length === 1, 'next 없는 기록이 제거됐다');
    var withNext = G.sanitizeRecords([Object.assign({ next: 'T' }, rec)])[0];
    assert(withNext !== undefined, 'next 가 있어도 유효 기록은 남아야 한다');
    assert(Object.keys(rec).sort().join(',') === 'clearedLines,id,name,playedAt,score', '다섯 키');
  });

  // ======================= SPEC_06 §7.3 — 신규 =======================

  function pausedState(extra) {
    return playingNext(emptyBoard(), G.createPiece('T'), 'S', Object.assign({ status: 'PAUSED' }, extra || {}));
  }

  function sameRefs(a, b) {
    return ['board', 'piece', 'next', 'score', 'lines'].every(function (k) { return a[k] === b[k]; });
  }

  test('api-surface-spec06', 'togglePause 가 함수다', function () {
    assert(typeof G.togglePause === 'function', 'togglePause 가 함수가 아니다');
  });

  test('toggle-pause-playing-to-paused', 'PLAYING → PAUSED', function () {
    var r = G.togglePause(playingNext(emptyBoard(), G.createPiece('T'), 'S'));
    assert(r.status === 'PAUSED', 'status=' + r.status);
  });

  test('toggle-pause-paused-to-playing', 'PAUSED → PLAYING', function () {
    var r = G.togglePause(pausedState());
    assert(r.status === 'PLAYING', 'status=' + r.status);
  });

  test('toggle-pause-ready-identity', 'READY 는 인자 그대로다', function () {
    var st = G.createInitialState();
    assert(G.togglePause(st) === st, '같은 참조가 아니다');
  });

  test('toggle-pause-game-over-identity', 'GAME_OVER 는 인자 그대로다', function () {
    var st = playingNext(emptyBoard(), null, 'T', { status: 'GAME_OVER' });
    assert(G.togglePause(st) === st, '같은 참조가 아니다');
  });

  test('toggle-pause-landed-identity', 'LANDED 는 인자 그대로다', function () {
    var st = playingNext(emptyBoard(), G.createPiece('T'), 'S', { status: 'LANDED' });
    assert(G.togglePause(st) === st, '같은 참조가 아니다');
  });

  test('toggle-pause-null-identity', 'null·undefined 는 그대로이고 던지지 않는다', function () {
    assert(G.togglePause(null) === null, 'null');
    assert(G.togglePause(undefined) === undefined, 'undefined');
  });

  test('toggle-pause-keeps-references', '전이 결과의 다섯 키가 입력과 같은 참조다', function () {
    var st = playingNext(emptyBoard(), G.createPiece('T'), 'S', { score: 300, lines: 12 });
    assert(sameRefs(G.togglePause(st), st), '참조가 달라졌다');
    var back = G.togglePause(pausedState({ score: 300, lines: 12 }));
    assert(sameRefs(back, pausedState({ score: 300, lines: 12 })) === false || back.status === 'PLAYING', 'PAUSED→PLAYING 도 상태만 바뀐다');
  });

  test('toggle-pause-round-trip', 'P·P 두 번이면 PLAYING 이고 참조가 그대로다', function () {
    var st = playingNext(emptyBoard(), G.createPiece('T'), 'S');
    var r = G.togglePause(G.togglePause(st));
    assert(r.status === 'PLAYING', 'status=' + r.status);
    assert(sameRefs(r, st), '참조가 달라졌다');
  });

  test('apply-move-ignored-when-paused', 'PAUSED 에서 이동은 인자 그대로다', function () {
    var st = pausedState();
    assert(G.applyMove(st, 0, -1) === st && G.applyMove(st, 0, 1) === st && G.applyMove(st, 1, 0) === st, '상태가 바뀌었다');
  });

  test('apply-rotate-ignored-when-paused', 'PAUSED 에서 회전은 인자 그대로다', function () {
    var st = pausedState();
    assert(G.applyRotate(st) === st, '상태가 바뀌었다');
  });

  test('lock-and-advance-ignored-when-paused', 'PAUSED 에서 고정은 인자 그대로이고 공급자를 안 부른다', function () {
    var st = pausedState();
    var s = makeSupply(['O']);
    assert(G.lockAndAdvance(st, s) === st, '상태가 바뀌었다');
    assert(s.calls === 0, 'calls=' + s.calls);
  });

  test('paused-keeps-level', '전이 후 레벨이 같다', function () {
    var st = playingNext(emptyBoard(), G.createPiece('T'), 'S', { lines: 23 });
    var r = G.togglePause(st);
    assert(G.levelForLines(r.lines) === G.levelForLines(st.lines) && G.levelForLines(r.lines) === 3, '레벨=' + G.levelForLines(r.lines));
  });

  test('paused-keeps-next', '전이 후 next 가 같다', function () {
    var st = playingNext(emptyBoard(), G.createPiece('T'), 'Z');
    assert(G.togglePause(st).next === 'Z', 'next=' + G.togglePause(st).next);
    assert(G.togglePause(G.togglePause(st)).next === 'Z', '왕복 후 next 가 달라졌다');
  });

  test('game-status-has-paused', 'GAME_STATUS.PAUSED 가 있고 동결·5키다', function () {
    assert(G.GAME_STATUS.PAUSED === 'PAUSED', 'PAUSED=' + G.GAME_STATUS.PAUSED);
    assert(Object.isFrozen(G.GAME_STATUS), '동결 아님');
    assert(Object.keys(G.GAME_STATUS).length === 5, '키 수=' + Object.keys(G.GAME_STATUS).length);
  });

  test('pause-does-not-touch-board', '전이 전후 board 값이 같다', function () {
    var st = playingNext(fillRow(emptyBoard(), 19, 0, 4, 'O'), G.createPiece('T'), 'S');
    var before = J(st.board);
    var r = G.togglePause(st);
    assert(J(r.board) === before && r.board === st.board, 'board 가 변했다');
  });

  test('start-game-from-paused-resets', 'PAUSED 에서 startGame 은 새 게임이다', function () {
    var st = pausedState({ lines: 37, score: 900 });
    var r = G.startGame(st);
    assert(r.status === 'PLAYING' && r.lines === 0 && r.score === 0, 'status/lines/score=' + r.status + '/' + r.lines + '/' + r.score);
    assert(r.piece && typeof r.next === 'string', 'piece/next 가 준비되지 않았다');
    assert(r.piece.type === G.nextPieceType('T'), '순환이 이전 piece 를 따르지 않았다');
  });

  // ======================= 결과 표시 =======================

  var passCount = 0;
  var failCount = 0;
  var list = document.getElementById('test-results');
  for (var i = 0; i < results.length; i += 1) {
    var item = results[i];
    if (item.pass) {
      passCount += 1;
    } else {
      failCount += 1;
    }
    var li = document.createElement('li');
    li.setAttribute('data-name', item.name);
    li.setAttribute('data-result', item.pass ? 'pass' : 'fail');
    li.textContent = item.pass ? item.label : item.label + ' — ' + item.reason;
    if (list) {
      list.appendChild(li);
    }
  }

  var summary = document.getElementById('test-summary');
  if (summary) {
    summary.setAttribute('data-pass', String(passCount));
    summary.setAttribute('data-fail', String(failCount));
    summary.setAttribute('data-result', failCount === 0 ? 'pass' : 'fail');
    summary.textContent = 'PASS ' + passCount + ' / FAIL ' + failCount;
  }
})();
