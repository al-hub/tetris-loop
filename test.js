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

  test('initial-state-keys-five', '초기 상태 키가 다섯 개다', function () {
    var keys = Object.keys(G.createInitialState()).sort();
    var want = ['board', 'lines', 'piece', 'score', 'status'].join(',');
    assert(keys.join(',') === want, '키=' + keys.join(','));
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

  test('apply-move-down-lands', '바닥에서 아래로 가면 LANDED 가 되고 piece 참조는 그대로다', function () {
    var base = G.startGame(G.createInitialState());
    var piece = { type: 'I', cells: base.piece.cells, row: 18, col: 3 };
    var state = { board: base.board, piece: piece, score: 0, lines: 0, status: 'PLAYING' };
    var next = G.applyMove(state, 1, 0);
    assert(next !== state, '같은 참조를 돌려줬다');
    assert(next.status === 'LANDED', 'status=' + next.status);
    assert(next.piece === piece, 'piece 참조가 바뀌었다');
  });

  test('apply-move-ignored-when-landed', 'LANDED 에서 이동은 인자 state 를 그대로 준다', function () {
    var base = G.startGame(G.createInitialState());
    var state = { board: base.board, piece: base.piece, score: 0, lines: 0, status: 'LANDED' };
    assert(G.applyMove(state, 0, -1) === state, '왼쪽 이동이 상태를 바꿨다');
    assert(G.applyMove(state, 1, 0) === state, '아래 이동이 상태를 바꿨다');
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

  test('apply-rotate-ignored-when-landed', 'LANDED 에서 회전은 인자 state 를 그대로 준다', function () {
    var base = G.startGame(G.createInitialState());
    var state = { board: base.board, piece: base.piece, score: 0, lines: 0, status: 'LANDED' };
    assert(G.applyRotate(state) === state, '같은 참조가 아니다');
  });

  test('landed-board-all-zero', 'LANDED 가 되어도 board 200칸이 전부 0 이다', function () {
    var base = G.startGame(G.createInitialState());
    var state = { board: base.board, piece: { type: 'I', cells: base.piece.cells, row: 18, col: 3 }, score: 0, lines: 0, status: 'PLAYING' };
    var landed = G.applyMove(state, 1, 0);
    assert(landed.status === 'LANDED', 'status=' + landed.status);
    var count = 0;
    for (var y = 0; y < landed.board.length; y += 1) {
      for (var x = 0; x < landed.board[y].length; x += 1) {
        assert(landed.board[y][x] === 0, '(' + y + ',' + x + ')=' + landed.board[y][x]);
        count += 1;
      }
    }
    assert(count === 200, '셀 개수=' + count);
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
