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

  // --- 공개 API 존재 ---
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

  // --- 보드 크기 상수 ---
  test('board-width', 'BOARD_WIDTH 는 10 이다', function () {
    assert(G.BOARD_WIDTH === 10, 'BOARD_WIDTH=' + G.BOARD_WIDTH);
  });

  test('board-height', 'BOARD_HEIGHT 는 20 이다', function () {
    assert(G.BOARD_HEIGHT === 20, 'BOARD_HEIGHT=' + G.BOARD_HEIGHT);
  });

  // --- 빈 보드 ---
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

  // --- GAME_STATUS ---
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

  // --- 초기 상태 ---
  test('initial-score', '초기 상태 score 는 0 이다', function () {
    var state = G.createInitialState();
    assert(state.score === 0, 'score=' + String(state.score));
  });

  test('initial-lines', '초기 상태 lines 는 0 이다', function () {
    var state = G.createInitialState();
    assert(state.lines === 0, 'lines=' + String(state.lines));
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

  // --- 추가 검증: 초기 상태의 키 집합과 보드 ---
  test('initial-state-keys', '초기 상태 키가 board·score·lines·status 4개다', function () {
    var keys = Object.keys(G.createInitialState()).sort();
    var want = ['board', 'lines', 'score', 'status'].join(',');
    assert(keys.join(',') === want, '키=' + keys.join(','));
  });

  test('initial-board-shape', '초기 상태 board 가 20x10 이다', function () {
    var board = G.createInitialState().board;
    assert(board.length === 20, '행 개수=' + board.length);
    for (var y = 0; y < board.length; y += 1) {
      assert(board[y].length === 10, y + '행의 셀 개수=' + board[y].length);
    }
  });

  // --- 결과 표시 ---
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
