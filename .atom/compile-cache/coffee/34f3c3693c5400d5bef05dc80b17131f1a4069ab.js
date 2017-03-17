(function() {
  var Disposable, Point, Range, _, addClassList, adjustRangeToRowRange, buildWordPatternByCursor, collectRangeInBufferRow, cursorIsAtEndOfLineAtNonEmptyRow, cursorIsAtVimEndOfFile, debug, detectScopeStartPositionForScope, ensureEndsWithNewLineForBufferRow, expandRangeToWhiteSpaces, findRangeContainsPoint, findRangeInBufferRow, forEachPaneAxis, fs, getAncestors, getBeginningOfWordBufferPosition, getBufferRangeForRowRange, getBufferRows, getCodeFoldRowRanges, getCodeFoldRowRangesContainesForRow, getEndOfLineForBufferRow, getEndOfWordBufferPosition, getFirstCharacterPositionForBufferRow, getFirstVisibleScreenRow, getIndentLevelForBufferRow, getIndex, getKeyBindingForCommand, getLargestFoldRangeContainsBufferRow, getLastVisibleScreenRow, getLeftCharacterForBufferPosition, getLineTextToBufferPosition, getNonWordCharactersForCursor, getPackage, getRangeByTranslatePointAndClip, getRightCharacterForBufferPosition, getScopesForTokenizedLine, getSubwordPatternAtBufferPosition, getTextInScreenRange, getTokenizedLineForRow, getValidVimBufferRow, getValidVimScreenRow, getVimEofBufferPosition, getVimEofScreenPosition, getVimLastBufferRow, getVimLastScreenRow, getVisibleBufferRange, getVisibleEditors, getWordBufferRangeAndKindAtBufferPosition, getWordBufferRangeAtBufferPosition, getWordPatternAtBufferPosition, haveSomeNonEmptySelection, humanizeBufferRange, include, insertTextAtBufferPosition, isEmpty, isEmptyRow, isEndsWithNewLineForBufferRow, isEscapedCharRange, isFunctionScope, isIncludeFunctionScopeForRow, isLeadingWhiteSpaceRange, isLinewiseRange, isNotEmpty, isNotLeadingWhiteSpaceRange, isNotSingleLineRange, isSingleLineRange, isSingleLineText, limitNumber, matchScopes, modifyClassList, moveCursor, moveCursorDownBuffer, moveCursorDownScreen, moveCursorLeft, moveCursorRight, moveCursorToFirstCharacterAtRow, moveCursorToNextNonWhitespace, moveCursorUpBuffer, moveCursorUpScreen, negateFunction, pointIsAtEndOfLine, pointIsAtEndOfLineAtNonEmptyRow, pointIsAtVimEndOfFile, pointIsOnWhiteSpace, ref, registerElement, removeClassList, saveEditorState, scanEditor, scanEditorInDirection, scanForScopeStart, searchByProjectFind, setBufferColumn, setBufferRow, settings, shouldPreventWrapLine, shrinkRangeEndToBeforeNewLine, smartScrollToBufferPosition, sortRanges, splitTextByNewLine, toggleCaseForCharacter, toggleClassList, translatePointAndClip, trimRange,
    slice = [].slice;

  fs = require('fs-plus');

  settings = require('./settings');

  ref = require('atom'), Disposable = ref.Disposable, Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  getAncestors = function(obj) {
    var ancestors, current, ref1;
    ancestors = [];
    current = obj;
    while (true) {
      ancestors.push(current);
      current = (ref1 = current.__super__) != null ? ref1.constructor : void 0;
      if (!current) {
        break;
      }
    }
    return ancestors;
  };

  getKeyBindingForCommand = function(command, arg) {
    var i, keymap, keymapPath, keymaps, keystrokes, len, packageName, results, selector;
    packageName = arg.packageName;
    results = null;
    keymaps = atom.keymaps.getKeyBindings();
    if (packageName != null) {
      keymapPath = atom.packages.getActivePackage(packageName).getKeymapPaths().pop();
      keymaps = keymaps.filter(function(arg1) {
        var source;
        source = arg1.source;
        return source === keymapPath;
      });
    }
    for (i = 0, len = keymaps.length; i < len; i++) {
      keymap = keymaps[i];
      if (!(keymap.command === command)) {
        continue;
      }
      keystrokes = keymap.keystrokes, selector = keymap.selector;
      keystrokes = keystrokes.replace(/shift-/, '');
      (results != null ? results : results = []).push({
        keystrokes: keystrokes,
        selector: selector
      });
    }
    return results;
  };

  include = function(klass, module) {
    var key, results1, value;
    results1 = [];
    for (key in module) {
      value = module[key];
      results1.push(klass.prototype[key] = value);
    }
    return results1;
  };

  debug = function() {
    var filePath, messages;
    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (!settings.get('debug')) {
      return;
    }
    switch (settings.get('debugOutput')) {
      case 'console':
        return console.log.apply(console, messages);
      case 'file':
        filePath = fs.normalize(settings.get('debugOutputFilePath'));
        if (fs.existsSync(filePath)) {
          return fs.appendFileSync(filePath, messages + "\n");
        }
    }
  };

  saveEditorState = function(editor) {
    var editorElement, foldStartRows, scrollTop;
    editorElement = editor.element;
    scrollTop = editorElement.getScrollTop();
    foldStartRows = editor.displayLayer.foldsMarkerLayer.findMarkers({}).map(function(m) {
      return m.getStartPosition().row;
    });
    return function() {
      var i, len, ref1, row;
      ref1 = foldStartRows.reverse();
      for (i = 0, len = ref1.length; i < len; i++) {
        row = ref1[i];
        if (!editor.isFoldedAtBufferRow(row)) {
          editor.foldBufferRow(row);
        }
      }
      return editorElement.setScrollTop(scrollTop);
    };
  };

  isLinewiseRange = function(arg) {
    var end, ref1, start;
    start = arg.start, end = arg.end;
    return (start.row !== end.row) && ((start.column === (ref1 = end.column) && ref1 === 0));
  };

  isEndsWithNewLineForBufferRow = function(editor, row) {
    var end, ref1, start;
    ref1 = editor.bufferRangeForBufferRow(row, {
      includeNewline: true
    }), start = ref1.start, end = ref1.end;
    return start.row !== end.row;
  };

  haveSomeNonEmptySelection = function(editor) {
    return editor.getSelections().some(isNotEmpty);
  };

  sortRanges = function(collection) {
    return collection.sort(function(a, b) {
      return a.compare(b);
    });
  };

  getIndex = function(index, list) {
    var length;
    length = list.length;
    if (length === 0) {
      return -1;
    } else {
      index = index % length;
      if (index >= 0) {
        return index;
      } else {
        return length + index;
      }
    }
  };

  getVisibleBufferRange = function(editor) {
    var endRow, ref1, startRow;
    ref1 = editor.element.getVisibleRowRange(), startRow = ref1[0], endRow = ref1[1];
    if (!((startRow != null) && (endRow != null))) {
      return null;
    }
    startRow = editor.bufferRowForScreenRow(startRow);
    endRow = editor.bufferRowForScreenRow(endRow);
    return new Range([startRow, 0], [endRow, 2e308]);
  };

  getVisibleEditors = function() {
    var editor, i, len, pane, ref1, results1;
    ref1 = atom.workspace.getPanes();
    results1 = [];
    for (i = 0, len = ref1.length; i < len; i++) {
      pane = ref1[i];
      if (editor = pane.getActiveEditor()) {
        results1.push(editor);
      }
    }
    return results1;
  };

  getEndOfLineForBufferRow = function(editor, row) {
    return editor.bufferRangeForBufferRow(row).end;
  };

  pointIsAtEndOfLine = function(editor, point) {
    point = Point.fromObject(point);
    return getEndOfLineForBufferRow(editor, point.row).isEqual(point);
  };

  pointIsOnWhiteSpace = function(editor, point) {
    var char;
    char = getRightCharacterForBufferPosition(editor, point);
    return !/\S/.test(char);
  };

  pointIsAtEndOfLineAtNonEmptyRow = function(editor, point) {
    point = Point.fromObject(point);
    return point.column !== 0 && pointIsAtEndOfLine(editor, point);
  };

  pointIsAtVimEndOfFile = function(editor, point) {
    return getVimEofBufferPosition(editor).isEqual(point);
  };

  isEmptyRow = function(editor, row) {
    return editor.bufferRangeForBufferRow(row).isEmpty();
  };

  cursorIsAtEndOfLineAtNonEmptyRow = function(cursor) {
    return pointIsAtEndOfLineAtNonEmptyRow(cursor.editor, cursor.getBufferPosition());
  };

  cursorIsAtVimEndOfFile = function(cursor) {
    return pointIsAtVimEndOfFile(cursor.editor, cursor.getBufferPosition());
  };

  getRightCharacterForBufferPosition = function(editor, point, amount) {
    if (amount == null) {
      amount = 1;
    }
    return editor.getTextInBufferRange(Range.fromPointWithDelta(point, 0, amount));
  };

  getLeftCharacterForBufferPosition = function(editor, point, amount) {
    if (amount == null) {
      amount = 1;
    }
    return editor.getTextInBufferRange(Range.fromPointWithDelta(point, 0, -amount));
  };

  getTextInScreenRange = function(editor, screenRange) {
    var bufferRange;
    bufferRange = editor.bufferRangeForScreenRange(screenRange);
    return editor.getTextInBufferRange(bufferRange);
  };

  getNonWordCharactersForCursor = function(cursor) {
    var scope;
    if (cursor.getNonWordCharacters != null) {
      return cursor.getNonWordCharacters();
    } else {
      scope = cursor.getScopeDescriptor().getScopesArray();
      return atom.config.get('editor.nonWordCharacters', {
        scope: scope
      });
    }
  };

  moveCursorToNextNonWhitespace = function(cursor) {
    var editor, originalPoint, point, vimEof;
    originalPoint = cursor.getBufferPosition();
    editor = cursor.editor;
    vimEof = getVimEofBufferPosition(editor);
    while (pointIsOnWhiteSpace(editor, point = cursor.getBufferPosition()) && !point.isGreaterThanOrEqual(vimEof)) {
      cursor.moveRight();
    }
    return !originalPoint.isEqual(cursor.getBufferPosition());
  };

  getBufferRows = function(editor, arg) {
    var direction, endRow, i, j, ref1, ref2, results1, results2, startRow;
    startRow = arg.startRow, direction = arg.direction;
    switch (direction) {
      case 'previous':
        if (startRow <= 0) {
          return [];
        } else {
          return (function() {
            results1 = [];
            for (var i = ref1 = startRow - 1; ref1 <= 0 ? i <= 0 : i >= 0; ref1 <= 0 ? i++ : i--){ results1.push(i); }
            return results1;
          }).apply(this);
        }
        break;
      case 'next':
        endRow = getVimLastBufferRow(editor);
        if (startRow >= endRow) {
          return [];
        } else {
          return (function() {
            results2 = [];
            for (var j = ref2 = startRow + 1; ref2 <= endRow ? j <= endRow : j >= endRow; ref2 <= endRow ? j++ : j--){ results2.push(j); }
            return results2;
          }).apply(this);
        }
    }
  };

  getVimEofBufferPosition = function(editor) {
    var eof;
    eof = editor.getEofBufferPosition();
    if ((eof.row === 0) || (eof.column > 0)) {
      return eof;
    } else {
      return getEndOfLineForBufferRow(editor, eof.row - 1);
    }
  };

  getVimEofScreenPosition = function(editor) {
    return editor.screenPositionForBufferPosition(getVimEofBufferPosition(editor));
  };

  getVimLastBufferRow = function(editor) {
    return getVimEofBufferPosition(editor).row;
  };

  getVimLastScreenRow = function(editor) {
    return getVimEofScreenPosition(editor).row;
  };

  getFirstVisibleScreenRow = function(editor) {
    return editor.element.getFirstVisibleScreenRow();
  };

  getLastVisibleScreenRow = function(editor) {
    return editor.element.getLastVisibleScreenRow();
  };

  getFirstCharacterPositionForBufferRow = function(editor, row) {
    var range, ref1;
    range = findRangeInBufferRow(editor, /\S/, row);
    return (ref1 = range != null ? range.start : void 0) != null ? ref1 : new Point(row, 0);
  };

  trimRange = function(editor, scanRange) {
    var end, pattern, ref1, setEnd, setStart, start;
    pattern = /\S/;
    ref1 = [], start = ref1[0], end = ref1[1];
    setStart = function(arg) {
      var range;
      range = arg.range;
      return start = range.start, range;
    };
    setEnd = function(arg) {
      var range;
      range = arg.range;
      return end = range.end, range;
    };
    editor.scanInBufferRange(pattern, scanRange, setStart);
    if (start != null) {
      editor.backwardsScanInBufferRange(pattern, scanRange, setEnd);
    }
    if ((start != null) && (end != null)) {
      return new Range(start, end);
    } else {
      return scanRange;
    }
  };

  setBufferRow = function(cursor, row, options) {
    var column, ref1;
    column = (ref1 = cursor.goalColumn) != null ? ref1 : cursor.getBufferColumn();
    cursor.setBufferPosition([row, column], options);
    return cursor.goalColumn = column;
  };

  setBufferColumn = function(cursor, column) {
    return cursor.setBufferPosition([cursor.getBufferRow(), column]);
  };

  moveCursor = function(cursor, arg, fn) {
    var goalColumn, preserveGoalColumn;
    preserveGoalColumn = arg.preserveGoalColumn;
    goalColumn = cursor.goalColumn;
    fn(cursor);
    if (preserveGoalColumn && (goalColumn != null)) {
      return cursor.goalColumn = goalColumn;
    }
  };

  shouldPreventWrapLine = function(cursor) {
    var column, ref1, row, tabLength, text;
    ref1 = cursor.getBufferPosition(), row = ref1.row, column = ref1.column;
    if (atom.config.get('editor.softTabs')) {
      tabLength = atom.config.get('editor.tabLength');
      if ((0 < column && column < tabLength)) {
        text = cursor.editor.getTextInBufferRange([[row, 0], [row, tabLength]]);
        return /^\s+$/.test(text);
      } else {
        return false;
      }
    }
  };

  moveCursorLeft = function(cursor, options) {
    var allowWrap, motion, needSpecialCareToPreventWrapLine;
    if (options == null) {
      options = {};
    }
    allowWrap = options.allowWrap, needSpecialCareToPreventWrapLine = options.needSpecialCareToPreventWrapLine;
    delete options.allowWrap;
    if (needSpecialCareToPreventWrapLine) {
      if (shouldPreventWrapLine(cursor)) {
        return;
      }
    }
    if (!cursor.isAtBeginningOfLine() || allowWrap) {
      motion = function(cursor) {
        return cursor.moveLeft();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorRight = function(cursor, options) {
    var allowWrap, motion;
    if (options == null) {
      options = {};
    }
    allowWrap = options.allowWrap;
    delete options.allowWrap;
    if (!cursor.isAtEndOfLine() || allowWrap) {
      motion = function(cursor) {
        return cursor.moveRight();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorUpScreen = function(cursor, options) {
    var motion;
    if (options == null) {
      options = {};
    }
    if (cursor.getScreenRow() !== 0) {
      motion = function(cursor) {
        return cursor.moveUp();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorDownScreen = function(cursor, options) {
    var motion;
    if (options == null) {
      options = {};
    }
    if (getVimLastScreenRow(cursor.editor) !== cursor.getScreenRow()) {
      motion = function(cursor) {
        return cursor.moveDown();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorDownBuffer = function(cursor) {
    var point;
    point = cursor.getBufferPosition();
    if (getVimLastBufferRow(cursor.editor) !== point.row) {
      return cursor.setBufferPosition(point.translate([+1, 0]));
    }
  };

  moveCursorUpBuffer = function(cursor) {
    var point;
    point = cursor.getBufferPosition();
    if (point.row !== 0) {
      return cursor.setBufferPosition(point.translate([-1, 0]));
    }
  };

  moveCursorToFirstCharacterAtRow = function(cursor, row) {
    cursor.setBufferPosition([row, 0]);
    return cursor.moveToFirstCharacterOfLine();
  };

  getValidVimBufferRow = function(editor, row) {
    return limitNumber(row, {
      min: 0,
      max: getVimLastBufferRow(editor)
    });
  };

  getValidVimScreenRow = function(editor, row) {
    return limitNumber(row, {
      min: 0,
      max: getVimLastScreenRow(editor)
    });
  };

  getLineTextToBufferPosition = function(editor, arg, arg1) {
    var column, exclusive, row;
    row = arg.row, column = arg.column;
    exclusive = (arg1 != null ? arg1 : {}).exclusive;
    if (exclusive != null ? exclusive : true) {
      return editor.lineTextForBufferRow(row).slice(0, column);
    } else {
      return editor.lineTextForBufferRow(row).slice(0, +column + 1 || 9e9);
    }
  };

  getIndentLevelForBufferRow = function(editor, row) {
    return editor.indentLevelForLine(editor.lineTextForBufferRow(row));
  };

  getCodeFoldRowRanges = function(editor) {
    var i, ref1, results1;
    return (function() {
      results1 = [];
      for (var i = 0, ref1 = editor.getLastBufferRow(); 0 <= ref1 ? i <= ref1 : i >= ref1; 0 <= ref1 ? i++ : i--){ results1.push(i); }
      return results1;
    }).apply(this).map(function(row) {
      return editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
    }).filter(function(rowRange) {
      return (rowRange != null) && (rowRange[0] != null) && (rowRange[1] != null);
    });
  };

  getCodeFoldRowRangesContainesForRow = function(editor, bufferRow, arg) {
    var includeStartRow;
    includeStartRow = (arg != null ? arg : {}).includeStartRow;
    if (includeStartRow == null) {
      includeStartRow = true;
    }
    return getCodeFoldRowRanges(editor).filter(function(arg1) {
      var endRow, startRow;
      startRow = arg1[0], endRow = arg1[1];
      if (includeStartRow) {
        return (startRow <= bufferRow && bufferRow <= endRow);
      } else {
        return (startRow < bufferRow && bufferRow <= endRow);
      }
    });
  };

  getBufferRangeForRowRange = function(editor, rowRange) {
    var endRange, ref1, startRange;
    ref1 = rowRange.map(function(row) {
      return editor.bufferRangeForBufferRow(row, {
        includeNewline: true
      });
    }), startRange = ref1[0], endRange = ref1[1];
    return startRange.union(endRange);
  };

  getTokenizedLineForRow = function(editor, row) {
    return editor.tokenizedBuffer.tokenizedLineForRow(row);
  };

  getScopesForTokenizedLine = function(line) {
    var i, len, ref1, results1, tag;
    ref1 = line.tags;
    results1 = [];
    for (i = 0, len = ref1.length; i < len; i++) {
      tag = ref1[i];
      if (tag < 0 && (tag % 2 === -1)) {
        results1.push(atom.grammars.scopeForId(tag));
      }
    }
    return results1;
  };

  scanForScopeStart = function(editor, fromPoint, direction, fn) {
    var column, continueScan, i, isValidToken, j, k, len, len1, len2, position, ref1, result, results, row, scanRows, scope, stop, tag, tokenIterator, tokenizedLine;
    fromPoint = Point.fromObject(fromPoint);
    scanRows = (function() {
      var i, j, ref1, ref2, ref3, results1, results2;
      switch (direction) {
        case 'forward':
          return (function() {
            results1 = [];
            for (var i = ref1 = fromPoint.row, ref2 = editor.getLastBufferRow(); ref1 <= ref2 ? i <= ref2 : i >= ref2; ref1 <= ref2 ? i++ : i--){ results1.push(i); }
            return results1;
          }).apply(this);
        case 'backward':
          return (function() {
            results2 = [];
            for (var j = ref3 = fromPoint.row; ref3 <= 0 ? j <= 0 : j >= 0; ref3 <= 0 ? j++ : j--){ results2.push(j); }
            return results2;
          }).apply(this);
      }
    })();
    continueScan = true;
    stop = function() {
      return continueScan = false;
    };
    isValidToken = (function() {
      switch (direction) {
        case 'forward':
          return function(arg) {
            var position;
            position = arg.position;
            return position.isGreaterThan(fromPoint);
          };
        case 'backward':
          return function(arg) {
            var position;
            position = arg.position;
            return position.isLessThan(fromPoint);
          };
      }
    })();
    for (i = 0, len = scanRows.length; i < len; i++) {
      row = scanRows[i];
      if (!(tokenizedLine = getTokenizedLineForRow(editor, row))) {
        continue;
      }
      column = 0;
      results = [];
      tokenIterator = tokenizedLine.getTokenIterator();
      ref1 = tokenizedLine.tags;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        tag = ref1[j];
        tokenIterator.next();
        if (tag < 0) {
          scope = atom.grammars.scopeForId(tag);
          if ((tag % 2) === 0) {
            null;
          } else {
            position = new Point(row, column);
            results.push({
              scope: scope,
              position: position,
              stop: stop
            });
          }
        } else {
          column += tag;
        }
      }
      results = results.filter(isValidToken);
      if (direction === 'backward') {
        results.reverse();
      }
      for (k = 0, len2 = results.length; k < len2; k++) {
        result = results[k];
        fn(result);
        if (!continueScan) {
          return;
        }
      }
      if (!continueScan) {
        return;
      }
    }
  };

  detectScopeStartPositionForScope = function(editor, fromPoint, direction, scope) {
    var point;
    point = null;
    scanForScopeStart(editor, fromPoint, direction, function(info) {
      if (info.scope.search(scope) >= 0) {
        info.stop();
        return point = info.position;
      }
    });
    return point;
  };

  isIncludeFunctionScopeForRow = function(editor, row) {
    var tokenizedLine;
    if (tokenizedLine = getTokenizedLineForRow(editor, row)) {
      return getScopesForTokenizedLine(tokenizedLine).some(function(scope) {
        return isFunctionScope(editor, scope);
      });
    } else {
      return false;
    }
  };

  isFunctionScope = function(editor, scope) {
    var pattern, scopes;
    switch (editor.getGrammar().scopeName) {
      case 'source.go':
      case 'source.elixir':
        scopes = ['entity.name.function'];
        break;
      case 'source.ruby':
        scopes = ['meta.function.', 'meta.class.', 'meta.module.'];
        break;
      default:
        scopes = ['meta.function.', 'meta.class.'];
    }
    pattern = new RegExp('^' + scopes.map(_.escapeRegExp).join('|'));
    return pattern.test(scope);
  };

  smartScrollToBufferPosition = function(editor, point) {
    var center, editorAreaHeight, editorElement, onePageDown, onePageUp, target;
    editorElement = editor.element;
    editorAreaHeight = editor.getLineHeightInPixels() * (editor.getRowsPerPage() - 1);
    onePageUp = editorElement.getScrollTop() - editorAreaHeight;
    onePageDown = editorElement.getScrollBottom() + editorAreaHeight;
    target = editorElement.pixelPositionForBufferPosition(point).top;
    center = (onePageDown < target) || (target < onePageUp);
    return editor.scrollToBufferPosition(point, {
      center: center
    });
  };

  matchScopes = function(editorElement, scopes) {
    var className, classNames, classes, containsCount, i, j, len, len1;
    classes = scopes.map(function(scope) {
      return scope.split('.');
    });
    for (i = 0, len = classes.length; i < len; i++) {
      classNames = classes[i];
      containsCount = 0;
      for (j = 0, len1 = classNames.length; j < len1; j++) {
        className = classNames[j];
        if (editorElement.classList.contains(className)) {
          containsCount += 1;
        }
      }
      if (containsCount === classNames.length) {
        return true;
      }
    }
    return false;
  };

  isSingleLineText = function(text) {
    return text.split(/\n|\r\n/).length === 1;
  };

  getWordBufferRangeAndKindAtBufferPosition = function(editor, point, options) {
    var characterAtPoint, cursor, kind, nonWordCharacters, nonWordRegex, range, ref1, singleNonWordChar, source, wordRegex;
    if (options == null) {
      options = {};
    }
    singleNonWordChar = options.singleNonWordChar, wordRegex = options.wordRegex, nonWordCharacters = options.nonWordCharacters, cursor = options.cursor;
    if ((wordRegex == null) || (nonWordCharacters == null)) {
      if (cursor == null) {
        cursor = editor.getLastCursor();
      }
      ref1 = _.extend(options, buildWordPatternByCursor(cursor, options)), wordRegex = ref1.wordRegex, nonWordCharacters = ref1.nonWordCharacters;
    }
    if (singleNonWordChar == null) {
      singleNonWordChar = true;
    }
    characterAtPoint = getRightCharacterForBufferPosition(editor, point);
    nonWordRegex = new RegExp("[" + (_.escapeRegExp(nonWordCharacters)) + "]+");
    if (/\s/.test(characterAtPoint)) {
      source = "[\t ]+";
      kind = 'white-space';
      wordRegex = new RegExp(source);
    } else if (nonWordRegex.test(characterAtPoint) && !wordRegex.test(characterAtPoint)) {
      kind = 'non-word';
      if (singleNonWordChar) {
        source = _.escapeRegExp(characterAtPoint);
        wordRegex = new RegExp(source);
      } else {
        wordRegex = nonWordRegex;
      }
    } else {
      kind = 'word';
    }
    range = getWordBufferRangeAtBufferPosition(editor, point, {
      wordRegex: wordRegex
    });
    return {
      kind: kind,
      range: range
    };
  };

  getWordPatternAtBufferPosition = function(editor, point, options) {
    var boundarizeForWord, kind, pattern, range, ref1, ref2;
    if (options == null) {
      options = {};
    }
    boundarizeForWord = (ref1 = options.boundarizeForWord) != null ? ref1 : true;
    delete options.boundarizeForWord;
    ref2 = getWordBufferRangeAndKindAtBufferPosition(editor, point, options), range = ref2.range, kind = ref2.kind;
    pattern = _.escapeRegExp(editor.getTextInBufferRange(range));
    if (kind === 'word' && boundarizeForWord) {
      pattern = "\\b" + pattern + "\\b";
    }
    return new RegExp(pattern, 'g');
  };

  getSubwordPatternAtBufferPosition = function(editor, point, options) {
    if (options == null) {
      options = {};
    }
    options = {
      wordRegex: editor.getLastCursor().subwordRegExp(),
      boundarizeForWord: false
    };
    return getWordPatternAtBufferPosition(editor, point, options);
  };

  buildWordPatternByCursor = function(cursor, arg) {
    var nonWordCharacters, wordRegex;
    wordRegex = arg.wordRegex;
    nonWordCharacters = getNonWordCharactersForCursor(cursor);
    if (wordRegex == null) {
      wordRegex = new RegExp("^[\t ]*$|[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+");
    }
    return {
      wordRegex: wordRegex,
      nonWordCharacters: nonWordCharacters
    };
  };

  getBeginningOfWordBufferPosition = function(editor, point, arg) {
    var found, scanRange, wordRegex;
    wordRegex = (arg != null ? arg : {}).wordRegex;
    scanRange = [[point.row, 0], point];
    found = null;
    editor.backwardsScanInBufferRange(wordRegex, scanRange, function(arg1) {
      var matchText, range, stop;
      range = arg1.range, matchText = arg1.matchText, stop = arg1.stop;
      if (matchText === '' && range.start.column !== 0) {
        return;
      }
      if (range.start.isLessThan(point)) {
        if (range.end.isGreaterThanOrEqual(point)) {
          found = range.start;
        }
        return stop();
      }
    });
    return found != null ? found : point;
  };

  getEndOfWordBufferPosition = function(editor, point, arg) {
    var found, scanRange, wordRegex;
    wordRegex = (arg != null ? arg : {}).wordRegex;
    scanRange = [point, [point.row, 2e308]];
    found = null;
    editor.scanInBufferRange(wordRegex, scanRange, function(arg1) {
      var matchText, range, stop;
      range = arg1.range, matchText = arg1.matchText, stop = arg1.stop;
      if (matchText === '' && range.start.column !== 0) {
        return;
      }
      if (range.end.isGreaterThan(point)) {
        if (range.start.isLessThanOrEqual(point)) {
          found = range.end;
        }
        return stop();
      }
    });
    return found != null ? found : point;
  };

  getWordBufferRangeAtBufferPosition = function(editor, position, options) {
    var endPosition, startPosition;
    if (options == null) {
      options = {};
    }
    endPosition = getEndOfWordBufferPosition(editor, position, options);
    startPosition = getBeginningOfWordBufferPosition(editor, endPosition, options);
    return new Range(startPosition, endPosition);
  };

  adjustRangeToRowRange = function(arg, options) {
    var end, endRow, ref1, start;
    start = arg.start, end = arg.end;
    if (options == null) {
      options = {};
    }
    endRow = end.row;
    if (end.column === 0) {
      endRow = limitNumber(end.row - 1, {
        min: start.row
      });
    }
    if ((ref1 = options.endOnly) != null ? ref1 : false) {
      return new Range(start, [endRow, 2e308]);
    } else {
      return new Range([start.row, 0], [endRow, 2e308]);
    }
  };

  shrinkRangeEndToBeforeNewLine = function(range) {
    var end, endRow, start;
    start = range.start, end = range.end;
    if (end.column === 0) {
      endRow = limitNumber(end.row - 1, {
        min: start.row
      });
      return new Range(start, [endRow, 2e308]);
    } else {
      return range;
    }
  };

  scanEditor = function(editor, pattern) {
    var ranges;
    ranges = [];
    editor.scan(pattern, function(arg) {
      var range;
      range = arg.range;
      return ranges.push(range);
    });
    return ranges;
  };

  collectRangeInBufferRow = function(editor, row, pattern) {
    var ranges, scanRange;
    ranges = [];
    scanRange = editor.bufferRangeForBufferRow(row);
    editor.scanInBufferRange(pattern, scanRange, function(arg) {
      var range;
      range = arg.range;
      return ranges.push(range);
    });
    return ranges;
  };

  findRangeInBufferRow = function(editor, pattern, row, arg) {
    var direction, range, scanFunctionName, scanRange;
    direction = (arg != null ? arg : {}).direction;
    if (direction === 'backward') {
      scanFunctionName = 'backwardsScanInBufferRange';
    } else {
      scanFunctionName = 'scanInBufferRange';
    }
    range = null;
    scanRange = editor.bufferRangeForBufferRow(row);
    editor[scanFunctionName](pattern, scanRange, function(event) {
      return range = event.range;
    });
    return range;
  };

  getLargestFoldRangeContainsBufferRow = function(editor, row) {
    var end, endPoint, i, len, marker, markers, ref1, ref2, start, startPoint;
    markers = editor.displayLayer.foldsMarkerLayer.findMarkers({
      intersectsRow: row
    });
    startPoint = null;
    endPoint = null;
    ref1 = markers != null ? markers : [];
    for (i = 0, len = ref1.length; i < len; i++) {
      marker = ref1[i];
      ref2 = marker.getRange(), start = ref2.start, end = ref2.end;
      if (!startPoint) {
        startPoint = start;
        endPoint = end;
        continue;
      }
      if (start.isLessThan(startPoint)) {
        startPoint = start;
        endPoint = end;
      }
    }
    if ((startPoint != null) && (endPoint != null)) {
      return new Range(startPoint, endPoint);
    }
  };

  translatePointAndClip = function(editor, point, direction, arg) {
    var dontClip, eol, newRow, screenPoint, translate;
    translate = (arg != null ? arg : {}).translate;
    if (translate == null) {
      translate = true;
    }
    point = Point.fromObject(point);
    dontClip = false;
    switch (direction) {
      case 'forward':
        if (translate) {
          point = point.translate([0, +1]);
        }
        eol = editor.bufferRangeForBufferRow(point.row).end;
        if (point.isEqual(eol)) {
          dontClip = true;
        }
        if (point.isGreaterThan(eol)) {
          point = new Point(point.row + 1, 0);
          dontClip = true;
        }
        point = Point.min(point, editor.getEofBufferPosition());
        break;
      case 'backward':
        if (translate) {
          point = point.translate([0, -1]);
        }
        if (point.column < 0) {
          newRow = point.row - 1;
          eol = editor.bufferRangeForBufferRow(newRow).end;
          point = new Point(newRow, eol.column);
        }
        point = Point.max(point, Point.ZERO);
    }
    if (dontClip) {
      return point;
    } else {
      screenPoint = editor.screenPositionForBufferPosition(point, {
        clipDirection: direction
      });
      return editor.bufferPositionForScreenPosition(screenPoint);
    }
  };

  getRangeByTranslatePointAndClip = function(editor, range, which, direction, options) {
    var newPoint;
    newPoint = translatePointAndClip(editor, range[which], direction, options);
    switch (which) {
      case 'start':
        return new Range(newPoint, range.end);
      case 'end':
        return new Range(range.start, newPoint);
    }
  };

  registerElement = function(name, options) {
    var Element, element;
    element = document.createElement(name);
    if (element.constructor === HTMLElement) {
      Element = document.registerElement(name, options);
    } else {
      Element = element.constructor;
      if (options.prototype != null) {
        Element.prototype = options.prototype;
      }
    }
    return Element;
  };

  getPackage = function(name, fn) {
    return new Promise(function(resolve) {
      var disposable, pkg;
      if (atom.packages.isPackageActive(name)) {
        pkg = atom.packages.getActivePackage(name);
        return resolve(pkg);
      } else {
        return disposable = atom.packages.onDidActivatePackage(function(pkg) {
          if (pkg.name === name) {
            disposable.dispose();
            return resolve(pkg);
          }
        });
      }
    });
  };

  searchByProjectFind = function(editor, text) {
    atom.commands.dispatch(editor.element, 'project-find:show');
    return getPackage('find-and-replace').then(function(pkg) {
      var projectFindView;
      projectFindView = pkg.mainModule.projectFindView;
      if (projectFindView != null) {
        projectFindView.findEditor.setText(text);
        return projectFindView.confirm();
      }
    });
  };

  limitNumber = function(number, arg) {
    var max, min, ref1;
    ref1 = arg != null ? arg : {}, max = ref1.max, min = ref1.min;
    if (max != null) {
      number = Math.min(number, max);
    }
    if (min != null) {
      number = Math.max(number, min);
    }
    return number;
  };

  findRangeContainsPoint = function(ranges, point) {
    var i, len, range;
    for (i = 0, len = ranges.length; i < len; i++) {
      range = ranges[i];
      if (range.containsPoint(point)) {
        return range;
      }
    }
    return null;
  };

  negateFunction = function(fn) {
    return function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return !fn.apply(null, args);
    };
  };

  isEmpty = function(target) {
    return target.isEmpty();
  };

  isNotEmpty = negateFunction(isEmpty);

  isSingleLineRange = function(range) {
    return range.isSingleLine();
  };

  isNotSingleLineRange = negateFunction(isSingleLineRange);

  isLeadingWhiteSpaceRange = function(editor, range) {
    return /^[\t ]*$/.test(editor.getTextInBufferRange(range));
  };

  isNotLeadingWhiteSpaceRange = negateFunction(isLeadingWhiteSpaceRange);

  isEscapedCharRange = function(editor, range) {
    var chars;
    range = Range.fromObject(range);
    chars = getLeftCharacterForBufferPosition(editor, range.start, 2);
    return chars.endsWith('\\') && !chars.endsWith('\\\\');
  };

  insertTextAtBufferPosition = function(editor, point, text) {
    return editor.setTextInBufferRange([point, point], text);
  };

  ensureEndsWithNewLineForBufferRow = function(editor, row) {
    var eol;
    if (!isEndsWithNewLineForBufferRow(editor, row)) {
      eol = getEndOfLineForBufferRow(editor, row);
      return insertTextAtBufferPosition(editor, eol, "\n");
    }
  };

  forEachPaneAxis = function(fn, base) {
    var child, i, len, ref1, results1;
    if (base == null) {
      base = atom.workspace.getActivePane().getContainer().getRoot();
    }
    if (base.children != null) {
      fn(base);
      ref1 = base.children;
      results1 = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        results1.push(forEachPaneAxis(fn, child));
      }
      return results1;
    }
  };

  modifyClassList = function() {
    var action, classNames, element, ref1;
    action = arguments[0], element = arguments[1], classNames = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    return (ref1 = element.classList)[action].apply(ref1, classNames);
  };

  addClassList = modifyClassList.bind(null, 'add');

  removeClassList = modifyClassList.bind(null, 'remove');

  toggleClassList = modifyClassList.bind(null, 'toggle');

  toggleCaseForCharacter = function(char) {
    var charLower;
    charLower = char.toLowerCase();
    if (charLower === char) {
      return char.toUpperCase();
    } else {
      return charLower;
    }
  };

  splitTextByNewLine = function(text) {
    if (text.endsWith("\n")) {
      return text.trimRight().split(/\r?\n/g);
    } else {
      return text.split(/\r?\n/g);
    }
  };

  humanizeBufferRange = function(editor, range) {
    var end, newEnd, newStart, start;
    if (isSingleLineRange(range) || isLinewiseRange(range)) {
      return range;
    }
    start = range.start, end = range.end;
    if (pointIsAtEndOfLine(editor, start)) {
      newStart = start.traverse([1, 0]);
    }
    if (pointIsAtEndOfLine(editor, end)) {
      newEnd = end.traverse([1, 0]);
    }
    if ((newStart != null) || (newEnd != null)) {
      return new Range(newStart != null ? newStart : start, newEnd != null ? newEnd : end);
    } else {
      return range;
    }
  };

  expandRangeToWhiteSpaces = function(editor, range) {
    var end, newEnd, newStart, scanRange, start;
    start = range.start, end = range.end;
    newEnd = null;
    scanRange = [end, getEndOfLineForBufferRow(editor, end.row)];
    editor.scanInBufferRange(/\S/, scanRange, function(arg) {
      var range;
      range = arg.range;
      return newEnd = range.start;
    });
    if (newEnd != null ? newEnd.isGreaterThan(end) : void 0) {
      return new Range(start, newEnd);
    }
    newStart = null;
    scanRange = [[start.row, 0], range.start];
    editor.backwardsScanInBufferRange(/\S/, scanRange, function(arg) {
      var range;
      range = arg.range;
      return newStart = range.end;
    });
    if (newStart != null ? newStart.isLessThan(start) : void 0) {
      return new Range(newStart, end);
    }
    return range;
  };

  scanEditorInDirection = function(editor, direction, pattern, options, fn) {
    var allowNextLine, from, scanFunction, scanRange;
    if (options == null) {
      options = {};
    }
    allowNextLine = options.allowNextLine, from = options.from, scanRange = options.scanRange;
    if ((from == null) && (scanRange == null)) {
      throw new Error("You must either of 'from' or 'scanRange' options");
    }
    if (scanRange) {
      allowNextLine = true;
    } else {
      if (allowNextLine == null) {
        allowNextLine = true;
      }
    }
    if (from != null) {
      from = Point.fromObject(from);
    }
    switch (direction) {
      case 'forward':
        if (scanRange == null) {
          scanRange = new Range(from, getVimEofBufferPosition(editor));
        }
        scanFunction = 'scanInBufferRange';
        break;
      case 'backward':
        if (scanRange == null) {
          scanRange = new Range([0, 0], from);
        }
        scanFunction = 'backwardsScanInBufferRange';
    }
    return editor[scanFunction](pattern, scanRange, function(event) {
      if (!allowNextLine && event.range.start.row !== from.row) {
        event.stop();
        return;
      }
      return fn(event);
    });
  };

  module.exports = {
    getAncestors: getAncestors,
    getKeyBindingForCommand: getKeyBindingForCommand,
    include: include,
    debug: debug,
    saveEditorState: saveEditorState,
    isLinewiseRange: isLinewiseRange,
    haveSomeNonEmptySelection: haveSomeNonEmptySelection,
    sortRanges: sortRanges,
    getIndex: getIndex,
    getVisibleBufferRange: getVisibleBufferRange,
    getVisibleEditors: getVisibleEditors,
    pointIsAtEndOfLine: pointIsAtEndOfLine,
    pointIsOnWhiteSpace: pointIsOnWhiteSpace,
    pointIsAtEndOfLineAtNonEmptyRow: pointIsAtEndOfLineAtNonEmptyRow,
    pointIsAtVimEndOfFile: pointIsAtVimEndOfFile,
    cursorIsAtVimEndOfFile: cursorIsAtVimEndOfFile,
    getVimEofBufferPosition: getVimEofBufferPosition,
    getVimEofScreenPosition: getVimEofScreenPosition,
    getVimLastBufferRow: getVimLastBufferRow,
    getVimLastScreenRow: getVimLastScreenRow,
    setBufferRow: setBufferRow,
    setBufferColumn: setBufferColumn,
    moveCursorLeft: moveCursorLeft,
    moveCursorRight: moveCursorRight,
    moveCursorUpScreen: moveCursorUpScreen,
    moveCursorDownScreen: moveCursorDownScreen,
    getEndOfLineForBufferRow: getEndOfLineForBufferRow,
    getFirstVisibleScreenRow: getFirstVisibleScreenRow,
    getLastVisibleScreenRow: getLastVisibleScreenRow,
    getValidVimBufferRow: getValidVimBufferRow,
    getValidVimScreenRow: getValidVimScreenRow,
    moveCursorToFirstCharacterAtRow: moveCursorToFirstCharacterAtRow,
    getLineTextToBufferPosition: getLineTextToBufferPosition,
    getIndentLevelForBufferRow: getIndentLevelForBufferRow,
    getTextInScreenRange: getTextInScreenRange,
    moveCursorToNextNonWhitespace: moveCursorToNextNonWhitespace,
    isEmptyRow: isEmptyRow,
    cursorIsAtEndOfLineAtNonEmptyRow: cursorIsAtEndOfLineAtNonEmptyRow,
    getCodeFoldRowRanges: getCodeFoldRowRanges,
    getCodeFoldRowRangesContainesForRow: getCodeFoldRowRangesContainesForRow,
    getBufferRangeForRowRange: getBufferRangeForRowRange,
    trimRange: trimRange,
    getFirstCharacterPositionForBufferRow: getFirstCharacterPositionForBufferRow,
    isIncludeFunctionScopeForRow: isIncludeFunctionScopeForRow,
    detectScopeStartPositionForScope: detectScopeStartPositionForScope,
    getBufferRows: getBufferRows,
    registerElement: registerElement,
    smartScrollToBufferPosition: smartScrollToBufferPosition,
    matchScopes: matchScopes,
    moveCursorDownBuffer: moveCursorDownBuffer,
    moveCursorUpBuffer: moveCursorUpBuffer,
    isSingleLineText: isSingleLineText,
    getWordBufferRangeAtBufferPosition: getWordBufferRangeAtBufferPosition,
    getWordBufferRangeAndKindAtBufferPosition: getWordBufferRangeAndKindAtBufferPosition,
    getWordPatternAtBufferPosition: getWordPatternAtBufferPosition,
    getSubwordPatternAtBufferPosition: getSubwordPatternAtBufferPosition,
    getNonWordCharactersForCursor: getNonWordCharactersForCursor,
    shrinkRangeEndToBeforeNewLine: shrinkRangeEndToBeforeNewLine,
    scanEditor: scanEditor,
    collectRangeInBufferRow: collectRangeInBufferRow,
    findRangeInBufferRow: findRangeInBufferRow,
    getLargestFoldRangeContainsBufferRow: getLargestFoldRangeContainsBufferRow,
    translatePointAndClip: translatePointAndClip,
    getRangeByTranslatePointAndClip: getRangeByTranslatePointAndClip,
    getPackage: getPackage,
    searchByProjectFind: searchByProjectFind,
    limitNumber: limitNumber,
    findRangeContainsPoint: findRangeContainsPoint,
    isEmpty: isEmpty,
    isNotEmpty: isNotEmpty,
    isSingleLineRange: isSingleLineRange,
    isNotSingleLineRange: isNotSingleLineRange,
    insertTextAtBufferPosition: insertTextAtBufferPosition,
    ensureEndsWithNewLineForBufferRow: ensureEndsWithNewLineForBufferRow,
    isLeadingWhiteSpaceRange: isLeadingWhiteSpaceRange,
    isNotLeadingWhiteSpaceRange: isNotLeadingWhiteSpaceRange,
    isEscapedCharRange: isEscapedCharRange,
    forEachPaneAxis: forEachPaneAxis,
    addClassList: addClassList,
    removeClassList: removeClassList,
    toggleClassList: toggleClassList,
    toggleCaseForCharacter: toggleCaseForCharacter,
    splitTextByNewLine: splitTextByNewLine,
    humanizeBufferRange: humanizeBufferRange,
    expandRangeToWhiteSpaces: expandRangeToWhiteSpaces,
    scanEditorInDirection: scanEditorInDirection
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdXRpbHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrekVBQUE7SUFBQTs7RUFBQSxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BQTZCLE9BQUEsQ0FBUSxNQUFSLENBQTdCLEVBQUMsMkJBQUQsRUFBYSxpQkFBYixFQUFvQjs7RUFDcEIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixZQUFBLEdBQWUsU0FBQyxHQUFEO0FBQ2IsUUFBQTtJQUFBLFNBQUEsR0FBWTtJQUNaLE9BQUEsR0FBVTtBQUNWLFdBQUEsSUFBQTtNQUNFLFNBQVMsQ0FBQyxJQUFWLENBQWUsT0FBZjtNQUNBLE9BQUEsNENBQTJCLENBQUU7TUFDN0IsSUFBQSxDQUFhLE9BQWI7QUFBQSxjQUFBOztJQUhGO1dBSUE7RUFQYTs7RUFTZix1QkFBQSxHQUEwQixTQUFDLE9BQUQsRUFBVSxHQUFWO0FBQ3hCLFFBQUE7SUFEbUMsY0FBRDtJQUNsQyxPQUFBLEdBQVU7SUFDVixPQUFBLEdBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQUE7SUFDVixJQUFHLG1CQUFIO01BQ0UsVUFBQSxHQUFhLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsV0FBL0IsQ0FBMkMsQ0FBQyxjQUE1QyxDQUFBLENBQTRELENBQUMsR0FBN0QsQ0FBQTtNQUNiLE9BQUEsR0FBVSxPQUFPLENBQUMsTUFBUixDQUFlLFNBQUMsSUFBRDtBQUFjLFlBQUE7UUFBWixTQUFEO2VBQWEsTUFBQSxLQUFVO01BQXhCLENBQWYsRUFGWjs7QUFJQSxTQUFBLHlDQUFBOztZQUEyQixNQUFNLENBQUMsT0FBUCxLQUFrQjs7O01BQzFDLDhCQUFELEVBQWE7TUFDYixVQUFB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QkFBQSxxQkF2RmU7O0FBOXdCakIiLCJzb3VyY2VzQ29udGVudCI6WyJmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5cbntEaXNwb3NhYmxlLCBSYW5nZSwgUG9pbnR9ID0gcmVxdWlyZSAnYXRvbSdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbmdldEFuY2VzdG9ycyA9IChvYmopIC0+XG4gIGFuY2VzdG9ycyA9IFtdXG4gIGN1cnJlbnQgPSBvYmpcbiAgbG9vcFxuICAgIGFuY2VzdG9ycy5wdXNoKGN1cnJlbnQpXG4gICAgY3VycmVudCA9IGN1cnJlbnQuX19zdXBlcl9fPy5jb25zdHJ1Y3RvclxuICAgIGJyZWFrIHVubGVzcyBjdXJyZW50XG4gIGFuY2VzdG9yc1xuXG5nZXRLZXlCaW5kaW5nRm9yQ29tbWFuZCA9IChjb21tYW5kLCB7cGFja2FnZU5hbWV9KSAtPlxuICByZXN1bHRzID0gbnVsbFxuICBrZXltYXBzID0gYXRvbS5rZXltYXBzLmdldEtleUJpbmRpbmdzKClcbiAgaWYgcGFja2FnZU5hbWU/XG4gICAga2V5bWFwUGF0aCA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZShwYWNrYWdlTmFtZSkuZ2V0S2V5bWFwUGF0aHMoKS5wb3AoKVxuICAgIGtleW1hcHMgPSBrZXltYXBzLmZpbHRlcigoe3NvdXJjZX0pIC0+IHNvdXJjZSBpcyBrZXltYXBQYXRoKVxuXG4gIGZvciBrZXltYXAgaW4ga2V5bWFwcyB3aGVuIGtleW1hcC5jb21tYW5kIGlzIGNvbW1hbmRcbiAgICB7a2V5c3Ryb2tlcywgc2VsZWN0b3J9ID0ga2V5bWFwXG4gICAga2V5c3Ryb2tlcyA9IGtleXN0cm9rZXMucmVwbGFjZSgvc2hpZnQtLywgJycpXG4gICAgKHJlc3VsdHMgPz0gW10pLnB1c2goe2tleXN0cm9rZXMsIHNlbGVjdG9yfSlcbiAgcmVzdWx0c1xuXG4jIEluY2x1ZGUgbW9kdWxlKG9iamVjdCB3aGljaCBub3JtYWx5IHByb3ZpZGVzIHNldCBvZiBtZXRob2RzKSB0byBrbGFzc1xuaW5jbHVkZSA9IChrbGFzcywgbW9kdWxlKSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBtb2R1bGVcbiAgICBrbGFzczo6W2tleV0gPSB2YWx1ZVxuXG5kZWJ1ZyA9IChtZXNzYWdlcy4uLikgLT5cbiAgcmV0dXJuIHVubGVzcyBzZXR0aW5ncy5nZXQoJ2RlYnVnJylcbiAgc3dpdGNoIHNldHRpbmdzLmdldCgnZGVidWdPdXRwdXQnKVxuICAgIHdoZW4gJ2NvbnNvbGUnXG4gICAgICBjb25zb2xlLmxvZyBtZXNzYWdlcy4uLlxuICAgIHdoZW4gJ2ZpbGUnXG4gICAgICBmaWxlUGF0aCA9IGZzLm5vcm1hbGl6ZSBzZXR0aW5ncy5nZXQoJ2RlYnVnT3V0cHV0RmlsZVBhdGgnKVxuICAgICAgaWYgZnMuZXhpc3RzU3luYyhmaWxlUGF0aClcbiAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMgZmlsZVBhdGgsIG1lc3NhZ2VzICsgXCJcXG5cIlxuXG4jIFJldHVybiBmdW5jdGlvbiB0byByZXN0b3JlIGVkaXRvcidzIHNjcm9sbFRvcCBhbmQgZm9sZCBzdGF0ZS5cbnNhdmVFZGl0b3JTdGF0ZSA9IChlZGl0b3IpIC0+XG4gIGVkaXRvckVsZW1lbnQgPSBlZGl0b3IuZWxlbWVudFxuICBzY3JvbGxUb3AgPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbFRvcCgpXG5cbiAgZm9sZFN0YXJ0Um93cyA9IGVkaXRvci5kaXNwbGF5TGF5ZXIuZm9sZHNNYXJrZXJMYXllci5maW5kTWFya2Vycyh7fSkubWFwIChtKSAtPiBtLmdldFN0YXJ0UG9zaXRpb24oKS5yb3dcbiAgLT5cbiAgICBmb3Igcm93IGluIGZvbGRTdGFydFJvd3MucmV2ZXJzZSgpIHdoZW4gbm90IGVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdylcbiAgICAgIGVkaXRvci5mb2xkQnVmZmVyUm93KHJvdylcbiAgICBlZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcChzY3JvbGxUb3ApXG5cbmlzTGluZXdpc2VSYW5nZSA9ICh7c3RhcnQsIGVuZH0pIC0+XG4gIChzdGFydC5yb3cgaXNudCBlbmQucm93KSBhbmQgKHN0YXJ0LmNvbHVtbiBpcyBlbmQuY29sdW1uIGlzIDApXG5cbmlzRW5kc1dpdGhOZXdMaW5lRm9yQnVmZmVyUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICB7c3RhcnQsIGVuZH0gPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93LCBpbmNsdWRlTmV3bGluZTogdHJ1ZSlcbiAgc3RhcnQucm93IGlzbnQgZW5kLnJvd1xuXG5oYXZlU29tZU5vbkVtcHR5U2VsZWN0aW9uID0gKGVkaXRvcikgLT5cbiAgZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5zb21lKGlzTm90RW1wdHkpXG5cbnNvcnRSYW5nZXMgPSAoY29sbGVjdGlvbikgLT5cbiAgY29sbGVjdGlvbi5zb3J0IChhLCBiKSAtPiBhLmNvbXBhcmUoYilcblxuIyBSZXR1cm4gYWRqdXN0ZWQgaW5kZXggZml0IHdoaXRpbiBnaXZlbiBsaXN0J3MgbGVuZ3RoXG4jIHJldHVybiAtMSBpZiBsaXN0IGlzIGVtcHR5LlxuZ2V0SW5kZXggPSAoaW5kZXgsIGxpc3QpIC0+XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoXG4gIGlmIGxlbmd0aCBpcyAwXG4gICAgLTFcbiAgZWxzZVxuICAgIGluZGV4ID0gaW5kZXggJSBsZW5ndGhcbiAgICBpZiBpbmRleCA+PSAwXG4gICAgICBpbmRleFxuICAgIGVsc2VcbiAgICAgIGxlbmd0aCArIGluZGV4XG5cbiMgTk9URTogZW5kUm93IGJlY29tZSB1bmRlZmluZWQgaWYgQGVkaXRvckVsZW1lbnQgaXMgbm90IHlldCBhdHRhY2hlZC5cbiMgZS5nLiBCZWdpbmcgY2FsbGVkIGltbWVkaWF0ZWx5IGFmdGVyIG9wZW4gZmlsZS5cbmdldFZpc2libGVCdWZmZXJSYW5nZSA9IChlZGl0b3IpIC0+XG4gIFtzdGFydFJvdywgZW5kUm93XSA9IGVkaXRvci5lbGVtZW50LmdldFZpc2libGVSb3dSYW5nZSgpXG4gIHJldHVybiBudWxsIHVubGVzcyAoc3RhcnRSb3c/IGFuZCBlbmRSb3c/KVxuICBzdGFydFJvdyA9IGVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coc3RhcnRSb3cpXG4gIGVuZFJvdyA9IGVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coZW5kUm93KVxuICBuZXcgUmFuZ2UoW3N0YXJ0Um93LCAwXSwgW2VuZFJvdywgSW5maW5pdHldKVxuXG5nZXRWaXNpYmxlRWRpdG9ycyA9IC0+XG4gIChlZGl0b3IgZm9yIHBhbmUgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZXMoKSB3aGVuIGVkaXRvciA9IHBhbmUuZ2V0QWN0aXZlRWRpdG9yKCkpXG5cbmdldEVuZE9mTGluZUZvckJ1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdykuZW5kXG5cbiMgUG9pbnQgdXRpbFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5wb2ludElzQXRFbmRPZkxpbmUgPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgcG9pbnQgPSBQb2ludC5mcm9tT2JqZWN0KHBvaW50KVxuICBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3coZWRpdG9yLCBwb2ludC5yb3cpLmlzRXF1YWwocG9pbnQpXG5cbnBvaW50SXNPbldoaXRlU3BhY2UgPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgY2hhciA9IGdldFJpZ2h0Q2hhcmFjdGVyRm9yQnVmZmVyUG9zaXRpb24oZWRpdG9yLCBwb2ludClcbiAgbm90IC9cXFMvLnRlc3QoY2hhcilcblxucG9pbnRJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvdyA9IChlZGl0b3IsIHBvaW50KSAtPlxuICBwb2ludCA9IFBvaW50LmZyb21PYmplY3QocG9pbnQpXG4gIHBvaW50LmNvbHVtbiBpc250IDAgYW5kIHBvaW50SXNBdEVuZE9mTGluZShlZGl0b3IsIHBvaW50KVxuXG5wb2ludElzQXRWaW1FbmRPZkZpbGUgPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oZWRpdG9yKS5pc0VxdWFsKHBvaW50KVxuXG5pc0VtcHR5Um93ID0gKGVkaXRvciwgcm93KSAtPlxuICBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93KS5pc0VtcHR5KClcblxuIyBDdXJzb3Igc3RhdGUgdmFsaWRhdGVpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY3Vyc29ySXNBdEVuZE9mTGluZUF0Tm9uRW1wdHlSb3cgPSAoY3Vyc29yKSAtPlxuICBwb2ludElzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93KGN1cnNvci5lZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuXG5jdXJzb3JJc0F0VmltRW5kT2ZGaWxlID0gKGN1cnNvcikgLT5cbiAgcG9pbnRJc0F0VmltRW5kT2ZGaWxlKGN1cnNvci5lZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmdldFJpZ2h0Q2hhcmFjdGVyRm9yQnVmZmVyUG9zaXRpb24gPSAoZWRpdG9yLCBwb2ludCwgYW1vdW50PTEpIC0+XG4gIGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9pbnQsIDAsIGFtb3VudCkpXG5cbmdldExlZnRDaGFyYWN0ZXJGb3JCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCBhbW91bnQ9MSkgLT5cbiAgZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShwb2ludCwgMCwgLWFtb3VudCkpXG5cbmdldFRleHRJblNjcmVlblJhbmdlID0gKGVkaXRvciwgc2NyZWVuUmFuZ2UpIC0+XG4gIGJ1ZmZlclJhbmdlID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UpXG4gIGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShidWZmZXJSYW5nZSlcblxuZ2V0Tm9uV29yZENoYXJhY3RlcnNGb3JDdXJzb3IgPSAoY3Vyc29yKSAtPlxuICAjIEF0b20gMS4xMS4wLWJldGE1IGhhdmUgdGhpcyBleHBlcmltZW50YWwgbWV0aG9kLlxuICBpZiBjdXJzb3IuZ2V0Tm9uV29yZENoYXJhY3RlcnM/XG4gICAgY3Vyc29yLmdldE5vbldvcmRDaGFyYWN0ZXJzKClcbiAgZWxzZVxuICAgIHNjb3BlID0gY3Vyc29yLmdldFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KClcbiAgICBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycsIHtzY29wZX0pXG5cbiMgRklYTUU6IHJlbW92ZSB0aGlzXG4jIHJldHVybiB0cnVlIGlmIG1vdmVkXG5tb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZSA9IChjdXJzb3IpIC0+XG4gIG9yaWdpbmFsUG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICBlZGl0b3IgPSBjdXJzb3IuZWRpdG9yXG4gIHZpbUVvZiA9IGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKGVkaXRvcilcblxuICB3aGlsZSBwb2ludElzT25XaGl0ZVNwYWNlKGVkaXRvciwgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkgYW5kIG5vdCBwb2ludC5pc0dyZWF0ZXJUaGFuT3JFcXVhbCh2aW1Fb2YpXG4gICAgY3Vyc29yLm1vdmVSaWdodCgpXG4gIG5vdCBvcmlnaW5hbFBvaW50LmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG5cbmdldEJ1ZmZlclJvd3MgPSAoZWRpdG9yLCB7c3RhcnRSb3csIGRpcmVjdGlvbn0pIC0+XG4gIHN3aXRjaCBkaXJlY3Rpb25cbiAgICB3aGVuICdwcmV2aW91cydcbiAgICAgIGlmIHN0YXJ0Um93IDw9IDBcbiAgICAgICAgW11cbiAgICAgIGVsc2VcbiAgICAgICAgWyhzdGFydFJvdyAtIDEpLi4wXVxuICAgIHdoZW4gJ25leHQnXG4gICAgICBlbmRSb3cgPSBnZXRWaW1MYXN0QnVmZmVyUm93KGVkaXRvcilcbiAgICAgIGlmIHN0YXJ0Um93ID49IGVuZFJvd1xuICAgICAgICBbXVxuICAgICAgZWxzZVxuICAgICAgICBbKHN0YXJ0Um93ICsgMSkuLmVuZFJvd11cblxuIyBSZXR1cm4gVmltJ3MgRU9GIHBvc2l0aW9uIHJhdGhlciB0aGFuIEF0b20ncyBFT0YgcG9zaXRpb24uXG4jIFRoaXMgZnVuY3Rpb24gY2hhbmdlIG1lYW5pbmcgb2YgRU9GIGZyb20gbmF0aXZlIFRleHRFZGl0b3I6OmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiMgQXRvbSBpcyBzcGVjaWFsKHN0cmFuZ2UpIGZvciBjdXJzb3IgY2FuIHBhc3QgdmVyeSBsYXN0IG5ld2xpbmUgY2hhcmFjdGVyLlxuIyBCZWNhdXNlIG9mIHRoaXMsIEF0b20ncyBFT0YgcG9zaXRpb24gaXMgW2FjdHVhbExhc3RSb3crMSwgMF0gcHJvdmlkZWQgbGFzdC1ub24tYmxhbmstcm93XG4jIGVuZHMgd2l0aCBuZXdsaW5lIGNoYXIuXG4jIEJ1dCBpbiBWaW0sIGN1cm9yIGNhbiBOT1QgcGFzdCBsYXN0IG5ld2xpbmUuIEVPRiBpcyBuZXh0IHBvc2l0aW9uIG9mIHZlcnkgbGFzdCBjaGFyYWN0ZXIuXG5nZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IpIC0+XG4gIGVvZiA9IGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gIGlmIChlb2Yucm93IGlzIDApIG9yIChlb2YuY29sdW1uID4gMClcbiAgICBlb2ZcbiAgZWxzZVxuICAgIGdldEVuZE9mTGluZUZvckJ1ZmZlclJvdyhlZGl0b3IsIGVvZi5yb3cgLSAxKVxuXG5nZXRWaW1Fb2ZTY3JlZW5Qb3NpdGlvbiA9IChlZGl0b3IpIC0+XG4gIGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKGVkaXRvcikpXG5cbmdldFZpbUxhc3RCdWZmZXJSb3cgPSAoZWRpdG9yKSAtPiBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbihlZGl0b3IpLnJvd1xuZ2V0VmltTGFzdFNjcmVlblJvdyA9IChlZGl0b3IpIC0+IGdldFZpbUVvZlNjcmVlblBvc2l0aW9uKGVkaXRvcikucm93XG5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cgPSAoZWRpdG9yKSAtPiBlZGl0b3IuZWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3cgPSAoZWRpdG9yKSAtPiBlZGl0b3IuZWxlbWVudC5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpXG5cbmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cgPSAoZWRpdG9yLCByb3cpIC0+XG4gIHJhbmdlID0gZmluZFJhbmdlSW5CdWZmZXJSb3coZWRpdG9yLCAvXFxTLywgcm93KVxuICByYW5nZT8uc3RhcnQgPyBuZXcgUG9pbnQocm93LCAwKVxuXG50cmltUmFuZ2UgPSAoZWRpdG9yLCBzY2FuUmFuZ2UpIC0+XG4gIHBhdHRlcm4gPSAvXFxTL1xuICBbc3RhcnQsIGVuZF0gPSBbXVxuICBzZXRTdGFydCA9ICh7cmFuZ2V9KSAtPiB7c3RhcnR9ID0gcmFuZ2VcbiAgc2V0RW5kID0gKHtyYW5nZX0pIC0+IHtlbmR9ID0gcmFuZ2VcbiAgZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlKHBhdHRlcm4sIHNjYW5SYW5nZSwgc2V0U3RhcnQpXG4gIGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZShwYXR0ZXJuLCBzY2FuUmFuZ2UsIHNldEVuZCkgaWYgc3RhcnQ/XG4gIGlmIHN0YXJ0PyBhbmQgZW5kP1xuICAgIG5ldyBSYW5nZShzdGFydCwgZW5kKVxuICBlbHNlXG4gICAgc2NhblJhbmdlXG5cbiMgQ3Vyc29yIG1vdGlvbiB3cmFwcGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSnVzdCB1cGRhdGUgYnVmZmVyUm93IHdpdGgga2VlcGluZyBjb2x1bW4gYnkgcmVzcGVjdGluZyBnb2FsQ29sdW1uXG5zZXRCdWZmZXJSb3cgPSAoY3Vyc29yLCByb3csIG9wdGlvbnMpIC0+XG4gIGNvbHVtbiA9IGN1cnNvci5nb2FsQ29sdW1uID8gY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpXG4gIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcm93LCBjb2x1bW5dLCBvcHRpb25zKVxuICBjdXJzb3IuZ29hbENvbHVtbiA9IGNvbHVtblxuXG5zZXRCdWZmZXJDb2x1bW4gPSAoY3Vyc29yLCBjb2x1bW4pIC0+XG4gIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbY3Vyc29yLmdldEJ1ZmZlclJvdygpLCBjb2x1bW5dKVxuXG5tb3ZlQ3Vyc29yID0gKGN1cnNvciwge3ByZXNlcnZlR29hbENvbHVtbn0sIGZuKSAtPlxuICB7Z29hbENvbHVtbn0gPSBjdXJzb3JcbiAgZm4oY3Vyc29yKVxuICBpZiBwcmVzZXJ2ZUdvYWxDb2x1bW4gYW5kIGdvYWxDb2x1bW4/XG4gICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBnb2FsQ29sdW1uXG5cbiMgV29ya2Fyb3VuZCBpc3N1ZSBmb3IgdDltZC92aW0tbW9kZS1wbHVzIzIyNiBhbmQgYXRvbS9hdG9tIzMxNzRcbiMgSSBjYW5ub3QgZGVwZW5kIGN1cnNvcidzIGNvbHVtbiBzaW5jZSBpdHMgY2xhaW0gMCBhbmQgY2xpcHBpbmcgZW1tdWxhdGlvbiBkb24ndFxuIyByZXR1cm4gd3JhcHBlZCBsaW5lLCBidXQgSXQgYWN0dWFsbHkgd3JhcCwgc28gSSBuZWVkIHRvIGRvIHZlcnkgZGlydHkgd29yayB0b1xuIyBwcmVkaWN0IHdyYXAgaHVyaXN0aWNhbGx5Llxuc2hvdWxkUHJldmVudFdyYXBMaW5lID0gKGN1cnNvcikgLT5cbiAge3JvdywgY29sdW1ufSA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gIGlmIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnNvZnRUYWJzJylcbiAgICB0YWJMZW5ndGggPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci50YWJMZW5ndGgnKVxuICAgIGlmIDAgPCBjb2x1bW4gPCB0YWJMZW5ndGhcbiAgICAgIHRleHQgPSBjdXJzb3IuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtbcm93LCAwXSwgW3JvdywgdGFiTGVuZ3RoXV0pXG4gICAgICAvXlxccyskLy50ZXN0KHRleHQpXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuIyBvcHRpb25zOlxuIyAgIGFsbG93V3JhcDogdG8gY29udHJvbGwgYWxsb3cgd3JhcFxuIyAgIHByZXNlcnZlR29hbENvbHVtbjogcHJlc2VydmUgb3JpZ2luYWwgZ29hbENvbHVtblxubW92ZUN1cnNvckxlZnQgPSAoY3Vyc29yLCBvcHRpb25zPXt9KSAtPlxuICB7YWxsb3dXcmFwLCBuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZX0gPSBvcHRpb25zXG4gIGRlbGV0ZSBvcHRpb25zLmFsbG93V3JhcFxuICBpZiBuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZVxuICAgIHJldHVybiBpZiBzaG91bGRQcmV2ZW50V3JhcExpbmUoY3Vyc29yKVxuXG4gIGlmIG5vdCBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpIG9yIGFsbG93V3JhcFxuICAgIG1vdGlvbiA9IChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlTGVmdCgpXG4gICAgbW92ZUN1cnNvcihjdXJzb3IsIG9wdGlvbnMsIG1vdGlvbilcblxubW92ZUN1cnNvclJpZ2h0ID0gKGN1cnNvciwgb3B0aW9ucz17fSkgLT5cbiAge2FsbG93V3JhcH0gPSBvcHRpb25zXG4gIGRlbGV0ZSBvcHRpb25zLmFsbG93V3JhcFxuICBpZiBub3QgY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSBvciBhbGxvd1dyYXBcbiAgICBtb3Rpb24gPSAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICBtb3ZlQ3Vyc29yKGN1cnNvciwgb3B0aW9ucywgbW90aW9uKVxuXG5tb3ZlQ3Vyc29yVXBTY3JlZW4gPSAoY3Vyc29yLCBvcHRpb25zPXt9KSAtPlxuICB1bmxlc3MgY3Vyc29yLmdldFNjcmVlblJvdygpIGlzIDBcbiAgICBtb3Rpb24gPSAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVVwKClcbiAgICBtb3ZlQ3Vyc29yKGN1cnNvciwgb3B0aW9ucywgbW90aW9uKVxuXG5tb3ZlQ3Vyc29yRG93blNjcmVlbiA9IChjdXJzb3IsIG9wdGlvbnM9e30pIC0+XG4gIHVubGVzcyBnZXRWaW1MYXN0U2NyZWVuUm93KGN1cnNvci5lZGl0b3IpIGlzIGN1cnNvci5nZXRTY3JlZW5Sb3coKVxuICAgIG1vdGlvbiA9IChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlRG93bigpXG4gICAgbW92ZUN1cnNvcihjdXJzb3IsIG9wdGlvbnMsIG1vdGlvbilcblxuIyBGSVhNRVxubW92ZUN1cnNvckRvd25CdWZmZXIgPSAoY3Vyc29yKSAtPlxuICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gIHVubGVzcyBnZXRWaW1MYXN0QnVmZmVyUm93KGN1cnNvci5lZGl0b3IpIGlzIHBvaW50LnJvd1xuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoWysxLCAwXSkpXG5cbiMgRklYTUVcbm1vdmVDdXJzb3JVcEJ1ZmZlciA9IChjdXJzb3IpIC0+XG4gIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgdW5sZXNzIHBvaW50LnJvdyBpcyAwXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYW5zbGF0ZShbLTEsIDBdKSlcblxubW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvdyA9IChjdXJzb3IsIHJvdykgLT5cbiAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFtyb3csIDBdKVxuICBjdXJzb3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG5nZXRWYWxpZFZpbUJ1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT4gbGltaXROdW1iZXIocm93LCBtaW46IDAsIG1heDogZ2V0VmltTGFzdEJ1ZmZlclJvdyhlZGl0b3IpKVxuXG5nZXRWYWxpZFZpbVNjcmVlblJvdyA9IChlZGl0b3IsIHJvdykgLT4gbGltaXROdW1iZXIocm93LCBtaW46IDAsIG1heDogZ2V0VmltTGFzdFNjcmVlblJvdyhlZGl0b3IpKVxuXG4jIEJ5IGRlZmF1bHQgbm90IGluY2x1ZGUgY29sdW1uXG5nZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb24gPSAoZWRpdG9yLCB7cm93LCBjb2x1bW59LCB7ZXhjbHVzaXZlfT17fSkgLT5cbiAgaWYgZXhjbHVzaXZlID8gdHJ1ZVxuICAgIGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpWzAuLi5jb2x1bW5dXG4gIGVsc2VcbiAgICBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVswLi5jb2x1bW5dXG5cbmdldEluZGVudExldmVsRm9yQnVmZmVyUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICBlZGl0b3IuaW5kZW50TGV2ZWxGb3JMaW5lKGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKVxuXG5nZXRDb2RlRm9sZFJvd1JhbmdlcyA9IChlZGl0b3IpIC0+XG4gIFswLi5lZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXVxuICAgIC5tYXAgKHJvdykgLT5cbiAgICAgIGVkaXRvci5sYW5ndWFnZU1vZGUucm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93KHJvdylcbiAgICAuZmlsdGVyIChyb3dSYW5nZSkgLT5cbiAgICAgIHJvd1JhbmdlPyBhbmQgcm93UmFuZ2VbMF0/IGFuZCByb3dSYW5nZVsxXT9cblxuZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3cgPSAoZWRpdG9yLCBidWZmZXJSb3csIHtpbmNsdWRlU3RhcnRSb3d9PXt9KSAtPlxuICBpbmNsdWRlU3RhcnRSb3cgPz0gdHJ1ZVxuICBnZXRDb2RlRm9sZFJvd1JhbmdlcyhlZGl0b3IpLmZpbHRlciAoW3N0YXJ0Um93LCBlbmRSb3ddKSAtPlxuICAgIGlmIGluY2x1ZGVTdGFydFJvd1xuICAgICAgc3RhcnRSb3cgPD0gYnVmZmVyUm93IDw9IGVuZFJvd1xuICAgIGVsc2VcbiAgICAgIHN0YXJ0Um93IDwgYnVmZmVyUm93IDw9IGVuZFJvd1xuXG5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlID0gKGVkaXRvciwgcm93UmFuZ2UpIC0+XG4gIFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gPSByb3dSYW5nZS5tYXAgKHJvdykgLT5cbiAgICBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93LCBpbmNsdWRlTmV3bGluZTogdHJ1ZSlcbiAgc3RhcnRSYW5nZS51bmlvbihlbmRSYW5nZSlcblxuZ2V0VG9rZW5pemVkTGluZUZvclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZWRMaW5lRm9yUm93KHJvdylcblxuZ2V0U2NvcGVzRm9yVG9rZW5pemVkTGluZSA9IChsaW5lKSAtPlxuICBmb3IgdGFnIGluIGxpbmUudGFncyB3aGVuIHRhZyA8IDAgYW5kICh0YWcgJSAyIGlzIC0xKVxuICAgIGF0b20uZ3JhbW1hcnMuc2NvcGVGb3JJZCh0YWcpXG5cbnNjYW5Gb3JTY29wZVN0YXJ0ID0gKGVkaXRvciwgZnJvbVBvaW50LCBkaXJlY3Rpb24sIGZuKSAtPlxuICBmcm9tUG9pbnQgPSBQb2ludC5mcm9tT2JqZWN0KGZyb21Qb2ludClcbiAgc2NhblJvd3MgPSBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgd2hlbiAnZm9yd2FyZCcgdGhlbiBbKGZyb21Qb2ludC5yb3cpLi5lZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXVxuICAgIHdoZW4gJ2JhY2t3YXJkJyB0aGVuIFsoZnJvbVBvaW50LnJvdykuLjBdXG5cbiAgY29udGludWVTY2FuID0gdHJ1ZVxuICBzdG9wID0gLT5cbiAgICBjb250aW51ZVNjYW4gPSBmYWxzZVxuXG4gIGlzVmFsaWRUb2tlbiA9IHN3aXRjaCBkaXJlY3Rpb25cbiAgICB3aGVuICdmb3J3YXJkJyB0aGVuICh7cG9zaXRpb259KSAtPiBwb3NpdGlvbi5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludClcbiAgICB3aGVuICdiYWNrd2FyZCcgdGhlbiAoe3Bvc2l0aW9ufSkgLT4gcG9zaXRpb24uaXNMZXNzVGhhbihmcm9tUG9pbnQpXG5cbiAgZm9yIHJvdyBpbiBzY2FuUm93cyB3aGVuIHRva2VuaXplZExpbmUgPSBnZXRUb2tlbml6ZWRMaW5lRm9yUm93KGVkaXRvciwgcm93KVxuICAgIGNvbHVtbiA9IDBcbiAgICByZXN1bHRzID0gW11cblxuICAgIHRva2VuSXRlcmF0b3IgPSB0b2tlbml6ZWRMaW5lLmdldFRva2VuSXRlcmF0b3IoKVxuICAgIGZvciB0YWcgaW4gdG9rZW5pemVkTGluZS50YWdzXG4gICAgICB0b2tlbkl0ZXJhdG9yLm5leHQoKVxuICAgICAgaWYgdGFnIDwgMCAjIE5lZ2F0aXZlOiBzdGFydC9zdG9wIHRva2VuXG4gICAgICAgIHNjb3BlID0gYXRvbS5ncmFtbWFycy5zY29wZUZvcklkKHRhZylcbiAgICAgICAgaWYgKHRhZyAlIDIpIGlzIDAgIyBFdmVuOiBzY29wZSBzdG9wXG4gICAgICAgICAgbnVsbFxuICAgICAgICBlbHNlICMgT2RkOiBzY29wZSBzdGFydFxuICAgICAgICAgIHBvc2l0aW9uID0gbmV3IFBvaW50KHJvdywgY29sdW1uKVxuICAgICAgICAgIHJlc3VsdHMucHVzaCB7c2NvcGUsIHBvc2l0aW9uLCBzdG9wfVxuICAgICAgZWxzZVxuICAgICAgICBjb2x1bW4gKz0gdGFnXG5cbiAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoaXNWYWxpZFRva2VuKVxuICAgIHJlc3VsdHMucmV2ZXJzZSgpIGlmIGRpcmVjdGlvbiBpcyAnYmFja3dhcmQnXG4gICAgZm9yIHJlc3VsdCBpbiByZXN1bHRzXG4gICAgICBmbihyZXN1bHQpXG4gICAgICByZXR1cm4gdW5sZXNzIGNvbnRpbnVlU2NhblxuICAgIHJldHVybiB1bmxlc3MgY29udGludWVTY2FuXG5cbmRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlID0gKGVkaXRvciwgZnJvbVBvaW50LCBkaXJlY3Rpb24sIHNjb3BlKSAtPlxuICBwb2ludCA9IG51bGxcbiAgc2NhbkZvclNjb3BlU3RhcnQgZWRpdG9yLCBmcm9tUG9pbnQsIGRpcmVjdGlvbiwgKGluZm8pIC0+XG4gICAgaWYgaW5mby5zY29wZS5zZWFyY2goc2NvcGUpID49IDBcbiAgICAgIGluZm8uc3RvcCgpXG4gICAgICBwb2ludCA9IGluZm8ucG9zaXRpb25cbiAgcG9pbnRcblxuaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgIyBbRklYTUVdIEJ1ZyBvZiB1cHN0cmVhbT9cbiAgIyBTb21ldGltZSB0b2tlbml6ZWRMaW5lcyBsZW5ndGggaXMgbGVzcyB0aGFuIGxhc3QgYnVmZmVyIHJvdy5cbiAgIyBTbyB0b2tlbml6ZWRMaW5lIGlzIG5vdCBhY2Nlc3NpYmxlIGV2ZW4gaWYgdmFsaWQgcm93LlxuICAjIEluIHRoYXQgY2FzZSBJIHNpbXBseSByZXR1cm4gZW1wdHkgQXJyYXkuXG4gIGlmIHRva2VuaXplZExpbmUgPSBnZXRUb2tlbml6ZWRMaW5lRm9yUm93KGVkaXRvciwgcm93KVxuICAgIGdldFNjb3Blc0ZvclRva2VuaXplZExpbmUodG9rZW5pemVkTGluZSkuc29tZSAoc2NvcGUpIC0+XG4gICAgICBpc0Z1bmN0aW9uU2NvcGUoZWRpdG9yLCBzY29wZSlcbiAgZWxzZVxuICAgIGZhbHNlXG5cbiMgW0ZJWE1FXSB2ZXJ5IHJvdWdoIHN0YXRlLCBuZWVkIGltcHJvdmVtZW50LlxuaXNGdW5jdGlvblNjb3BlID0gKGVkaXRvciwgc2NvcGUpIC0+XG4gIHN3aXRjaCBlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZVxuICAgIHdoZW4gJ3NvdXJjZS5nbycsICdzb3VyY2UuZWxpeGlyJ1xuICAgICAgc2NvcGVzID0gWydlbnRpdHkubmFtZS5mdW5jdGlvbiddXG4gICAgd2hlbiAnc291cmNlLnJ1YnknXG4gICAgICBzY29wZXMgPSBbJ21ldGEuZnVuY3Rpb24uJywgJ21ldGEuY2xhc3MuJywgJ21ldGEubW9kdWxlLiddXG4gICAgZWxzZVxuICAgICAgc2NvcGVzID0gWydtZXRhLmZ1bmN0aW9uLicsICdtZXRhLmNsYXNzLiddXG4gIHBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeJyArIHNjb3Blcy5tYXAoXy5lc2NhcGVSZWdFeHApLmpvaW4oJ3wnKSlcbiAgcGF0dGVybi50ZXN0KHNjb3BlKVxuXG4jIFNjcm9sbCB0byBidWZmZXJQb3NpdGlvbiB3aXRoIG1pbmltdW0gYW1vdW50IHRvIGtlZXAgb3JpZ2luYWwgdmlzaWJsZSBhcmVhLlxuIyBJZiB0YXJnZXQgcG9zaXRpb24gd29uJ3QgZml0IHdpdGhpbiBvbmVQYWdlVXAgb3Igb25lUGFnZURvd24sIGl0IGNlbnRlciB0YXJnZXQgcG9pbnQuXG5zbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb24gPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgZWRpdG9yRWxlbWVudCA9IGVkaXRvci5lbGVtZW50XG4gIGVkaXRvckFyZWFIZWlnaHQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAoZWRpdG9yLmdldFJvd3NQZXJQYWdlKCkgLSAxKVxuICBvbmVQYWdlVXAgPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbFRvcCgpIC0gZWRpdG9yQXJlYUhlaWdodCAjIE5vIG5lZWQgdG8gbGltaXQgdG8gbWluPTBcbiAgb25lUGFnZURvd24gPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbEJvdHRvbSgpICsgZWRpdG9yQXJlYUhlaWdodFxuICB0YXJnZXQgPSBlZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihwb2ludCkudG9wXG5cbiAgY2VudGVyID0gKG9uZVBhZ2VEb3duIDwgdGFyZ2V0KSBvciAodGFyZ2V0IDwgb25lUGFnZVVwKVxuICBlZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihwb2ludCwge2NlbnRlcn0pXG5cbm1hdGNoU2NvcGVzID0gKGVkaXRvckVsZW1lbnQsIHNjb3BlcykgLT5cbiAgY2xhc3NlcyA9IHNjb3Blcy5tYXAgKHNjb3BlKSAtPiBzY29wZS5zcGxpdCgnLicpXG5cbiAgZm9yIGNsYXNzTmFtZXMgaW4gY2xhc3Nlc1xuICAgIGNvbnRhaW5zQ291bnQgPSAwXG4gICAgZm9yIGNsYXNzTmFtZSBpbiBjbGFzc05hbWVzXG4gICAgICBjb250YWluc0NvdW50ICs9IDEgaWYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKVxuICAgIHJldHVybiB0cnVlIGlmIGNvbnRhaW5zQ291bnQgaXMgY2xhc3NOYW1lcy5sZW5ndGhcbiAgZmFsc2VcblxuaXNTaW5nbGVMaW5lVGV4dCA9ICh0ZXh0KSAtPlxuICB0ZXh0LnNwbGl0KC9cXG58XFxyXFxuLykubGVuZ3RoIGlzIDFcblxuIyBSZXR1cm4gYnVmZmVyUmFuZ2UgYW5kIGtpbmQgWyd3aGl0ZS1zcGFjZScsICdub24td29yZCcsICd3b3JkJ11cbiNcbiMgVGhpcyBmdW5jdGlvbiBtb2RpZnkgd29yZFJlZ2V4IHNvIHRoYXQgaXQgZmVlbCBOQVRVUkFMIGluIFZpbSdzIG5vcm1hbCBtb2RlLlxuIyBJbiBub3JtYWwtbW9kZSwgY3Vyc29yIGlzIHJhY3RhbmdsZShub3QgcGlwZSh8KSBjaGFyKS5cbiMgQ3Vyc29yIGlzIGxpa2UgT04gd29yZCByYXRoZXIgdGhhbiBCRVRXRUVOIHdvcmQuXG4jIFRoZSBtb2RpZmljYXRpb24gaXMgdGFpbG9yZCBsaWtlIHRoaXNcbiMgICAtIE9OIHdoaXRlLXNwYWNlOiBJbmNsdWRzIG9ubHkgd2hpdGUtc3BhY2VzLlxuIyAgIC0gT04gbm9uLXdvcmQ6IEluY2x1ZHMgb25seSBub24gd29yZCBjaGFyKD1leGNsdWRlcyBub3JtYWwgd29yZCBjaGFyKS5cbiNcbiMgVmFsaWQgb3B0aW9uc1xuIyAgLSB3b3JkUmVnZXg6IGluc3RhbmNlIG9mIFJlZ0V4cFxuIyAgLSBub25Xb3JkQ2hhcmFjdGVyczogc3RyaW5nXG5nZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCBvcHRpb25zPXt9KSAtPlxuICB7c2luZ2xlTm9uV29yZENoYXIsIHdvcmRSZWdleCwgbm9uV29yZENoYXJhY3RlcnMsIGN1cnNvcn0gPSBvcHRpb25zXG4gIGlmIG5vdCB3b3JkUmVnZXg/IG9yIG5vdCBub25Xb3JkQ2hhcmFjdGVycz8gIyBDb21wbGVtZW50IGZyb20gY3Vyc29yXG4gICAgY3Vyc29yID89IGVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICB7d29yZFJlZ2V4LCBub25Xb3JkQ2hhcmFjdGVyc30gPSBfLmV4dGVuZChvcHRpb25zLCBidWlsZFdvcmRQYXR0ZXJuQnlDdXJzb3IoY3Vyc29yLCBvcHRpb25zKSlcbiAgc2luZ2xlTm9uV29yZENoYXIgPz0gdHJ1ZVxuXG4gIGNoYXJhY3RlckF0UG9pbnQgPSBnZXRSaWdodENoYXJhY3RlckZvckJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgcG9pbnQpXG4gIG5vbldvcmRSZWdleCA9IG5ldyBSZWdFeHAoXCJbI3tfLmVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XStcIilcblxuICBpZiAvXFxzLy50ZXN0KGNoYXJhY3RlckF0UG9pbnQpXG4gICAgc291cmNlID0gXCJbXFx0IF0rXCJcbiAgICBraW5kID0gJ3doaXRlLXNwYWNlJ1xuICAgIHdvcmRSZWdleCA9IG5ldyBSZWdFeHAoc291cmNlKVxuICBlbHNlIGlmIG5vbldvcmRSZWdleC50ZXN0KGNoYXJhY3RlckF0UG9pbnQpIGFuZCBub3Qgd29yZFJlZ2V4LnRlc3QoY2hhcmFjdGVyQXRQb2ludClcbiAgICBraW5kID0gJ25vbi13b3JkJ1xuICAgIGlmIHNpbmdsZU5vbldvcmRDaGFyXG4gICAgICBzb3VyY2UgPSBfLmVzY2FwZVJlZ0V4cChjaGFyYWN0ZXJBdFBvaW50KVxuICAgICAgd29yZFJlZ2V4ID0gbmV3IFJlZ0V4cChzb3VyY2UpXG4gICAgZWxzZVxuICAgICAgd29yZFJlZ2V4ID0gbm9uV29yZFJlZ2V4XG4gIGVsc2VcbiAgICBraW5kID0gJ3dvcmQnXG5cbiAgcmFuZ2UgPSBnZXRXb3JkQnVmZmVyUmFuZ2VBdEJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgcG9pbnQsIHt3b3JkUmVnZXh9KVxuICB7a2luZCwgcmFuZ2V9XG5cbmdldFdvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCBvcHRpb25zPXt9KSAtPlxuICBib3VuZGFyaXplRm9yV29yZCA9IG9wdGlvbnMuYm91bmRhcml6ZUZvcldvcmQgPyB0cnVlXG4gIGRlbGV0ZSBvcHRpb25zLmJvdW5kYXJpemVGb3JXb3JkXG4gIHtyYW5nZSwga2luZH0gPSBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIHBvaW50LCBvcHRpb25zKVxuICBwYXR0ZXJuID0gXy5lc2NhcGVSZWdFeHAoZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKSlcbiAgaWYga2luZCBpcyAnd29yZCcgYW5kIGJvdW5kYXJpemVGb3JXb3JkXG4gICAgcGF0dGVybiA9IFwiXFxcXGJcIiArIHBhdHRlcm4gKyBcIlxcXFxiXCJcbiAgbmV3IFJlZ0V4cChwYXR0ZXJuLCAnZycpXG5cbmdldFN1YndvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCBvcHRpb25zPXt9KSAtPlxuICBvcHRpb25zID0ge3dvcmRSZWdleDogZWRpdG9yLmdldExhc3RDdXJzb3IoKS5zdWJ3b3JkUmVnRXhwKCksIGJvdW5kYXJpemVGb3JXb3JkOiBmYWxzZX1cbiAgZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgcG9pbnQsIG9wdGlvbnMpXG5cbiMgUmV0dXJuIG9wdGlvbnMgdXNlZCBmb3IgZ2V0V29yZEJ1ZmZlclJhbmdlQXRCdWZmZXJQb3NpdGlvblxuYnVpbGRXb3JkUGF0dGVybkJ5Q3Vyc29yID0gKGN1cnNvciwge3dvcmRSZWdleH0pIC0+XG4gIG5vbldvcmRDaGFyYWN0ZXJzID0gZ2V0Tm9uV29yZENoYXJhY3RlcnNGb3JDdXJzb3IoY3Vyc29yKVxuICB3b3JkUmVnZXggPz0gbmV3IFJlZ0V4cChcIl5bXFx0IF0qJHxbXlxcXFxzI3tfLmVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XStcIilcbiAge3dvcmRSZWdleCwgbm9uV29yZENoYXJhY3RlcnN9XG5cbmdldEJlZ2lubmluZ09mV29yZEJ1ZmZlclBvc2l0aW9uID0gKGVkaXRvciwgcG9pbnQsIHt3b3JkUmVnZXh9PXt9KSAtPlxuICBzY2FuUmFuZ2UgPSBbW3BvaW50LnJvdywgMF0sIHBvaW50XVxuXG4gIGZvdW5kID0gbnVsbFxuICBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2Ugd29yZFJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIG1hdGNoVGV4dCwgc3RvcH0pIC0+XG4gICAgcmV0dXJuIGlmIG1hdGNoVGV4dCBpcyAnJyBhbmQgcmFuZ2Uuc3RhcnQuY29sdW1uIGlzbnQgMFxuXG4gICAgaWYgcmFuZ2Uuc3RhcnQuaXNMZXNzVGhhbihwb2ludClcbiAgICAgIGlmIHJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChwb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZS5zdGFydFxuICAgICAgc3RvcCgpXG5cbiAgZm91bmQgPyBwb2ludFxuXG5nZXRFbmRPZldvcmRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCB7d29yZFJlZ2V4fT17fSkgLT5cbiAgc2NhblJhbmdlID0gW3BvaW50LCBbcG9pbnQucm93LCBJbmZpbml0eV1dXG5cbiAgZm91bmQgPSBudWxsXG4gIGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSB3b3JkUmVnZXgsIHNjYW5SYW5nZSwgKHtyYW5nZSwgbWF0Y2hUZXh0LCBzdG9wfSkgLT5cbiAgICByZXR1cm4gaWYgbWF0Y2hUZXh0IGlzICcnIGFuZCByYW5nZS5zdGFydC5jb2x1bW4gaXNudCAwXG5cbiAgICBpZiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbihwb2ludClcbiAgICAgIGlmIHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW5PckVxdWFsKHBvaW50KVxuICAgICAgICBmb3VuZCA9IHJhbmdlLmVuZFxuICAgICAgc3RvcCgpXG5cbiAgZm91bmQgPyBwb2ludFxuXG5nZXRXb3JkQnVmZmVyUmFuZ2VBdEJ1ZmZlclBvc2l0aW9uID0gKGVkaXRvciwgcG9zaXRpb24sIG9wdGlvbnM9e30pIC0+XG4gIGVuZFBvc2l0aW9uID0gZ2V0RW5kT2ZXb3JkQnVmZmVyUG9zaXRpb24oZWRpdG9yLCBwb3NpdGlvbiwgb3B0aW9ucylcbiAgc3RhcnRQb3NpdGlvbiA9IGdldEJlZ2lubmluZ09mV29yZEJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgZW5kUG9zaXRpb24sIG9wdGlvbnMpXG4gIG5ldyBSYW5nZShzdGFydFBvc2l0aW9uLCBlbmRQb3NpdGlvbilcblxuYWRqdXN0UmFuZ2VUb1Jvd1JhbmdlID0gKHtzdGFydCwgZW5kfSwgb3B0aW9ucz17fSkgLT5cbiAgIyB3aGVuIGxpbmV3aXNlLCBlbmQgcm93IGlzIGF0IGNvbHVtbiAwIG9mIE5FWFQgbGluZVxuICAjIFNvIG5lZWQgYWRqdXN0IHRvIGFjdHVhbGx5IHNlbGVjdGVkIHJvdyBpbiBzYW1lIHdheSBhcyBTZWxlY2l0b246OmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgZW5kUm93ID0gZW5kLnJvd1xuICBpZiBlbmQuY29sdW1uIGlzIDBcbiAgICBlbmRSb3cgPSBsaW1pdE51bWJlcihlbmQucm93IC0gMSwgbWluOiBzdGFydC5yb3cpXG4gIGlmIG9wdGlvbnMuZW5kT25seSA/IGZhbHNlXG4gICAgbmV3IFJhbmdlKHN0YXJ0LCBbZW5kUm93LCBJbmZpbml0eV0pXG4gIGVsc2VcbiAgICBuZXcgUmFuZ2UoW3N0YXJ0LnJvdywgMF0sIFtlbmRSb3csIEluZmluaXR5XSlcblxuIyBXaGVuIHJhbmdlIGlzIGxpbmV3aXNlIHJhbmdlLCByYW5nZSBlbmQgaGF2ZSBjb2x1bW4gMCBvZiBORVhUIHJvdy5cbiMgV2hpY2ggaXMgdmVyeSB1bmludHVpdGl2ZSBhbmQgdW53YW50ZWQgcmVzdWx0Llxuc2hyaW5rUmFuZ2VFbmRUb0JlZm9yZU5ld0xpbmUgPSAocmFuZ2UpIC0+XG4gIHtzdGFydCwgZW5kfSA9IHJhbmdlXG4gIGlmIGVuZC5jb2x1bW4gaXMgMFxuICAgIGVuZFJvdyA9IGxpbWl0TnVtYmVyKGVuZC5yb3cgLSAxLCBtaW46IHN0YXJ0LnJvdylcbiAgICBuZXcgUmFuZ2Uoc3RhcnQsIFtlbmRSb3csIEluZmluaXR5XSlcbiAgZWxzZVxuICAgIHJhbmdlXG5cbnNjYW5FZGl0b3IgPSAoZWRpdG9yLCBwYXR0ZXJuKSAtPlxuICByYW5nZXMgPSBbXVxuICBlZGl0b3Iuc2NhbiBwYXR0ZXJuLCAoe3JhbmdlfSkgLT5cbiAgICByYW5nZXMucHVzaChyYW5nZSlcbiAgcmFuZ2VzXG5cbmNvbGxlY3RSYW5nZUluQnVmZmVyUm93ID0gKGVkaXRvciwgcm93LCBwYXR0ZXJuKSAtPlxuICByYW5nZXMgPSBbXVxuICBzY2FuUmFuZ2UgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93KVxuICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcGF0dGVybiwgc2NhblJhbmdlLCAoe3JhbmdlfSkgLT5cbiAgICByYW5nZXMucHVzaChyYW5nZSlcbiAgcmFuZ2VzXG5cbmZpbmRSYW5nZUluQnVmZmVyUm93ID0gKGVkaXRvciwgcGF0dGVybiwgcm93LCB7ZGlyZWN0aW9ufT17fSkgLT5cbiAgaWYgZGlyZWN0aW9uIGlzICdiYWNrd2FyZCdcbiAgICBzY2FuRnVuY3Rpb25OYW1lID0gJ2JhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlJ1xuICBlbHNlXG4gICAgc2NhbkZ1bmN0aW9uTmFtZSA9ICdzY2FuSW5CdWZmZXJSYW5nZSdcblxuICByYW5nZSA9IG51bGxcbiAgc2NhblJhbmdlID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdylcbiAgZWRpdG9yW3NjYW5GdW5jdGlvbk5hbWVdIHBhdHRlcm4sIHNjYW5SYW5nZSwgKGV2ZW50KSAtPiByYW5nZSA9IGV2ZW50LnJhbmdlXG4gIHJhbmdlXG5cbmdldExhcmdlc3RGb2xkUmFuZ2VDb250YWluc0J1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgbWFya2VycyA9IGVkaXRvci5kaXNwbGF5TGF5ZXIuZm9sZHNNYXJrZXJMYXllci5maW5kTWFya2VycyhpbnRlcnNlY3RzUm93OiByb3cpXG5cbiAgc3RhcnRQb2ludCA9IG51bGxcbiAgZW5kUG9pbnQgPSBudWxsXG5cbiAgZm9yIG1hcmtlciBpbiBtYXJrZXJzID8gW11cbiAgICB7c3RhcnQsIGVuZH0gPSBtYXJrZXIuZ2V0UmFuZ2UoKVxuICAgIHVubGVzcyBzdGFydFBvaW50XG4gICAgICBzdGFydFBvaW50ID0gc3RhcnRcbiAgICAgIGVuZFBvaW50ID0gZW5kXG4gICAgICBjb250aW51ZVxuXG4gICAgaWYgc3RhcnQuaXNMZXNzVGhhbihzdGFydFBvaW50KVxuICAgICAgc3RhcnRQb2ludCA9IHN0YXJ0XG4gICAgICBlbmRQb2ludCA9IGVuZFxuXG4gIGlmIHN0YXJ0UG9pbnQ/IGFuZCBlbmRQb2ludD9cbiAgICBuZXcgUmFuZ2Uoc3RhcnRQb2ludCwgZW5kUG9pbnQpXG5cbnRyYW5zbGF0ZVBvaW50QW5kQ2xpcCA9IChlZGl0b3IsIHBvaW50LCBkaXJlY3Rpb24sIHt0cmFuc2xhdGV9PXt9KSAtPlxuICB0cmFuc2xhdGUgPz0gdHJ1ZVxuICBwb2ludCA9IFBvaW50LmZyb21PYmplY3QocG9pbnQpXG5cbiAgZG9udENsaXAgPSBmYWxzZVxuICBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgd2hlbiAnZm9yd2FyZCdcbiAgICAgIHBvaW50ID0gcG9pbnQudHJhbnNsYXRlKFswLCArMV0pIGlmIHRyYW5zbGF0ZVxuICAgICAgZW9sID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHBvaW50LnJvdykuZW5kXG5cbiAgICAgIGlmIHBvaW50LmlzRXF1YWwoZW9sKVxuICAgICAgICBkb250Q2xpcCA9IHRydWVcblxuICAgICAgaWYgcG9pbnQuaXNHcmVhdGVyVGhhbihlb2wpXG4gICAgICAgIHBvaW50ID0gbmV3IFBvaW50KHBvaW50LnJvdyArIDEsIDApXG4gICAgICAgIGRvbnRDbGlwID0gdHJ1ZVxuXG4gICAgICBwb2ludCA9IFBvaW50Lm1pbihwb2ludCwgZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKCkpXG5cbiAgICB3aGVuICdiYWNrd2FyZCdcbiAgICAgIHBvaW50ID0gcG9pbnQudHJhbnNsYXRlKFswLCAtMV0pIGlmIHRyYW5zbGF0ZVxuXG4gICAgICBpZiBwb2ludC5jb2x1bW4gPCAwXG4gICAgICAgIG5ld1JvdyA9IHBvaW50LnJvdyAtIDFcbiAgICAgICAgZW9sID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KG5ld1JvdykuZW5kXG4gICAgICAgIHBvaW50ID0gbmV3IFBvaW50KG5ld1JvdywgZW9sLmNvbHVtbilcblxuICAgICAgcG9pbnQgPSBQb2ludC5tYXgocG9pbnQsIFBvaW50LlpFUk8pXG5cbiAgaWYgZG9udENsaXBcbiAgICBwb2ludFxuICBlbHNlXG4gICAgc2NyZWVuUG9pbnQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihwb2ludCwgY2xpcERpcmVjdGlvbjogZGlyZWN0aW9uKVxuICAgIGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvaW50KVxuXG5nZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwID0gKGVkaXRvciwgcmFuZ2UsIHdoaWNoLCBkaXJlY3Rpb24sIG9wdGlvbnMpIC0+XG4gIG5ld1BvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKGVkaXRvciwgcmFuZ2Vbd2hpY2hdLCBkaXJlY3Rpb24sIG9wdGlvbnMpXG4gIHN3aXRjaCB3aGljaFxuICAgIHdoZW4gJ3N0YXJ0J1xuICAgICAgbmV3IFJhbmdlKG5ld1BvaW50LCByYW5nZS5lbmQpXG4gICAgd2hlbiAnZW5kJ1xuICAgICAgbmV3IFJhbmdlKHJhbmdlLnN0YXJ0LCBuZXdQb2ludClcblxuIyBSZWxvYWRhYmxlIHJlZ2lzdGVyRWxlbWVudFxucmVnaXN0ZXJFbGVtZW50ID0gKG5hbWUsIG9wdGlvbnMpIC0+XG4gIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpXG4gICMgaWYgY29uc3RydWN0b3IgaXMgSFRNTEVsZW1lbnQsIHdlIGhhdmVuJ3QgcmVnaXN0ZXJkIHlldFxuICBpZiBlbGVtZW50LmNvbnN0cnVjdG9yIGlzIEhUTUxFbGVtZW50XG4gICAgRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChuYW1lLCBvcHRpb25zKVxuICBlbHNlXG4gICAgRWxlbWVudCA9IGVsZW1lbnQuY29uc3RydWN0b3JcbiAgICBFbGVtZW50LnByb3RvdHlwZSA9IG9wdGlvbnMucHJvdG90eXBlIGlmIG9wdGlvbnMucHJvdG90eXBlP1xuICBFbGVtZW50XG5cbmdldFBhY2thZ2UgPSAobmFtZSwgZm4pIC0+XG4gIG5ldyBQcm9taXNlIChyZXNvbHZlKSAtPlxuICAgIGlmIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKG5hbWUpXG4gICAgICBwa2cgPSBhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2UobmFtZSlcbiAgICAgIHJlc29sdmUocGtnKVxuICAgIGVsc2VcbiAgICAgIGRpc3Bvc2FibGUgPSBhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVQYWNrYWdlIChwa2cpIC0+XG4gICAgICAgIGlmIHBrZy5uYW1lIGlzIG5hbWVcbiAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgICAgIHJlc29sdmUocGtnKVxuXG5zZWFyY2hCeVByb2plY3RGaW5kID0gKGVkaXRvciwgdGV4dCkgLT5cbiAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChlZGl0b3IuZWxlbWVudCwgJ3Byb2plY3QtZmluZDpzaG93JylcbiAgZ2V0UGFja2FnZSgnZmluZC1hbmQtcmVwbGFjZScpLnRoZW4gKHBrZykgLT5cbiAgICB7cHJvamVjdEZpbmRWaWV3fSA9IHBrZy5tYWluTW9kdWxlXG4gICAgaWYgcHJvamVjdEZpbmRWaWV3P1xuICAgICAgcHJvamVjdEZpbmRWaWV3LmZpbmRFZGl0b3Iuc2V0VGV4dCh0ZXh0KVxuICAgICAgcHJvamVjdEZpbmRWaWV3LmNvbmZpcm0oKVxuXG5saW1pdE51bWJlciA9IChudW1iZXIsIHttYXgsIG1pbn09e30pIC0+XG4gIG51bWJlciA9IE1hdGgubWluKG51bWJlciwgbWF4KSBpZiBtYXg/XG4gIG51bWJlciA9IE1hdGgubWF4KG51bWJlciwgbWluKSBpZiBtaW4/XG4gIG51bWJlclxuXG5maW5kUmFuZ2VDb250YWluc1BvaW50ID0gKHJhbmdlcywgcG9pbnQpIC0+XG4gIGZvciByYW5nZSBpbiByYW5nZXMgd2hlbiByYW5nZS5jb250YWluc1BvaW50KHBvaW50KVxuICAgIHJldHVybiByYW5nZVxuICBudWxsXG5cbm5lZ2F0ZUZ1bmN0aW9uID0gKGZuKSAtPlxuICAoYXJncy4uLikgLT5cbiAgICBub3QgZm4oYXJncy4uLilcblxuaXNFbXB0eSA9ICh0YXJnZXQpIC0+IHRhcmdldC5pc0VtcHR5KClcbmlzTm90RW1wdHkgPSBuZWdhdGVGdW5jdGlvbihpc0VtcHR5KVxuXG5pc1NpbmdsZUxpbmVSYW5nZSA9IChyYW5nZSkgLT4gcmFuZ2UuaXNTaW5nbGVMaW5lKClcbmlzTm90U2luZ2xlTGluZVJhbmdlID0gbmVnYXRlRnVuY3Rpb24oaXNTaW5nbGVMaW5lUmFuZ2UpXG5cbmlzTGVhZGluZ1doaXRlU3BhY2VSYW5nZSA9IChlZGl0b3IsIHJhbmdlKSAtPiAvXltcXHQgXSokLy50ZXN0KGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSkpXG5pc05vdExlYWRpbmdXaGl0ZVNwYWNlUmFuZ2UgPSBuZWdhdGVGdW5jdGlvbihpc0xlYWRpbmdXaGl0ZVNwYWNlUmFuZ2UpXG5cbmlzRXNjYXBlZENoYXJSYW5nZSA9IChlZGl0b3IsIHJhbmdlKSAtPlxuICByYW5nZSA9IFJhbmdlLmZyb21PYmplY3QocmFuZ2UpXG4gIGNoYXJzID0gZ2V0TGVmdENoYXJhY3RlckZvckJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgcmFuZ2Uuc3RhcnQsIDIpXG4gIGNoYXJzLmVuZHNXaXRoKCdcXFxcJykgYW5kIG5vdCBjaGFycy5lbmRzV2l0aCgnXFxcXFxcXFwnKVxuXG5pbnNlcnRUZXh0QXRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCB0ZXh0KSAtPlxuICBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW3BvaW50LCBwb2ludF0sIHRleHQpXG5cbmVuc3VyZUVuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgdW5sZXNzIGlzRW5kc1dpdGhOZXdMaW5lRm9yQnVmZmVyUm93KGVkaXRvciwgcm93KVxuICAgIGVvbCA9IGdldEVuZE9mTGluZUZvckJ1ZmZlclJvdyhlZGl0b3IsIHJvdylcbiAgICBpbnNlcnRUZXh0QXRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIGVvbCwgXCJcXG5cIilcblxuZm9yRWFjaFBhbmVBeGlzID0gKGZuLCBiYXNlKSAtPlxuICBiYXNlID89IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5nZXRDb250YWluZXIoKS5nZXRSb290KClcbiAgaWYgYmFzZS5jaGlsZHJlbj9cbiAgICBmbihiYXNlKVxuXG4gICAgZm9yIGNoaWxkIGluIGJhc2UuY2hpbGRyZW5cbiAgICAgIGZvckVhY2hQYW5lQXhpcyhmbiwgY2hpbGQpXG5cbm1vZGlmeUNsYXNzTGlzdCA9IChhY3Rpb24sIGVsZW1lbnQsIGNsYXNzTmFtZXMuLi4pIC0+XG4gIGVsZW1lbnQuY2xhc3NMaXN0W2FjdGlvbl0oY2xhc3NOYW1lcy4uLilcblxuYWRkQ2xhc3NMaXN0ID0gbW9kaWZ5Q2xhc3NMaXN0LmJpbmQobnVsbCwgJ2FkZCcpXG5yZW1vdmVDbGFzc0xpc3QgPSBtb2RpZnlDbGFzc0xpc3QuYmluZChudWxsLCAncmVtb3ZlJylcbnRvZ2dsZUNsYXNzTGlzdCA9IG1vZGlmeUNsYXNzTGlzdC5iaW5kKG51bGwsICd0b2dnbGUnKVxuXG50b2dnbGVDYXNlRm9yQ2hhcmFjdGVyID0gKGNoYXIpIC0+XG4gIGNoYXJMb3dlciA9IGNoYXIudG9Mb3dlckNhc2UoKVxuICBpZiBjaGFyTG93ZXIgaXMgY2hhclxuICAgIGNoYXIudG9VcHBlckNhc2UoKVxuICBlbHNlXG4gICAgY2hhckxvd2VyXG5cbnNwbGl0VGV4dEJ5TmV3TGluZSA9ICh0ZXh0KSAtPlxuICBpZiB0ZXh0LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgdGV4dC50cmltUmlnaHQoKS5zcGxpdCgvXFxyP1xcbi9nKVxuICBlbHNlXG4gICAgdGV4dC5zcGxpdCgvXFxyP1xcbi9nKVxuXG4jIE1vZGlmeSByYW5nZSB1c2VkIGZvciB1bmRvL3JlZG8gZmxhc2ggaGlnaGxpZ2h0IHRvIG1ha2UgaXQgZmVlbCBuYXR1cmFsbHkgZm9yIGh1bWFuLlxuIyAgLSBUcmltIHN0YXJ0aW5nIG5ldyBsaW5lKFwiXFxuXCIpXG4jICAgICBcIlxcbmFiY1wiIC0+IFwiYWJjXCJcbiMgIC0gSWYgcmFuZ2UuZW5kIGlzIEVPTCBleHRlbmQgcmFuZ2UgdG8gZmlyc3QgY29sdW1uIG9mIG5leHQgbGluZS5cbiMgICAgIFwiYWJjXCIgLT4gXCJhYmNcXG5cIlxuIyBlLmcuXG4jIC0gd2hlbiAnYycgaXMgYXRFT0w6IFwiXFxuYWJjXCIgLT4gXCJhYmNcXG5cIlxuIyAtIHdoZW4gJ2MnIGlzIE5PVCBhdEVPTDogXCJcXG5hYmNcIiAtPiBcImFiY1wiXG4jXG4jIFNvIGFsd2F5cyB0cmltIGluaXRpYWwgXCJcXG5cIiBwYXJ0IHJhbmdlIGJlY2F1c2UgZmxhc2hpbmcgdHJhaWxpbmcgbGluZSBpcyBjb3VudGVyaW50dWl0aXZlLlxuaHVtYW5pemVCdWZmZXJSYW5nZSA9IChlZGl0b3IsIHJhbmdlKSAtPlxuICBpZiBpc1NpbmdsZUxpbmVSYW5nZShyYW5nZSkgb3IgaXNMaW5ld2lzZVJhbmdlKHJhbmdlKVxuICAgIHJldHVybiByYW5nZVxuXG4gIHtzdGFydCwgZW5kfSA9IHJhbmdlXG4gIGlmIHBvaW50SXNBdEVuZE9mTGluZShlZGl0b3IsIHN0YXJ0KVxuICAgIG5ld1N0YXJ0ID0gc3RhcnQudHJhdmVyc2UoWzEsIDBdKVxuXG4gIGlmIHBvaW50SXNBdEVuZE9mTGluZShlZGl0b3IsIGVuZClcbiAgICBuZXdFbmQgPSBlbmQudHJhdmVyc2UoWzEsIDBdKVxuXG4gIGlmIG5ld1N0YXJ0PyBvciBuZXdFbmQ/XG4gICAgbmV3IFJhbmdlKG5ld1N0YXJ0ID8gc3RhcnQsIG5ld0VuZCA/IGVuZClcbiAgZWxzZVxuICAgIHJhbmdlXG5cbiMgRXhwYW5kIHJhbmdlIHRvIHdoaXRlIHNwYWNlXG4jICAxLiBFeHBhbmQgdG8gZm9yd2FyZCBkaXJlY3Rpb24sIGlmIHN1Y2VlZCByZXR1cm4gbmV3IHJhbmdlLlxuIyAgMi4gRXhwYW5kIHRvIGJhY2t3YXJkIGRpcmVjdGlvbiwgaWYgc3VjY2VlZCByZXR1cm4gbmV3IHJhbmdlLlxuIyAgMy4gV2hlbiBmYWlsZCB0byBleHBhbmQgZWl0aGVyIGRpcmVjdGlvbiwgcmV0dXJuIG9yaWdpbmFsIHJhbmdlLlxuZXhwYW5kUmFuZ2VUb1doaXRlU3BhY2VzID0gKGVkaXRvciwgcmFuZ2UpIC0+XG4gIHtzdGFydCwgZW5kfSA9IHJhbmdlXG5cbiAgbmV3RW5kID0gbnVsbFxuICBzY2FuUmFuZ2UgPSBbZW5kLCBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3coZWRpdG9yLCBlbmQucm93KV1cbiAgZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIC9cXFMvLCBzY2FuUmFuZ2UsICh7cmFuZ2V9KSAtPiBuZXdFbmQgPSByYW5nZS5zdGFydFxuXG4gIGlmIG5ld0VuZD8uaXNHcmVhdGVyVGhhbihlbmQpXG4gICAgcmV0dXJuIG5ldyBSYW5nZShzdGFydCwgbmV3RW5kKVxuXG4gIG5ld1N0YXJ0ID0gbnVsbFxuICBzY2FuUmFuZ2UgPSBbW3N0YXJ0LnJvdywgMF0sIHJhbmdlLnN0YXJ0XVxuICBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgL1xcUy8sIHNjYW5SYW5nZSwgKHtyYW5nZX0pIC0+IG5ld1N0YXJ0ID0gcmFuZ2UuZW5kXG5cbiAgaWYgbmV3U3RhcnQ/LmlzTGVzc1RoYW4oc3RhcnQpXG4gICAgcmV0dXJuIG5ldyBSYW5nZShuZXdTdGFydCwgZW5kKVxuXG4gIHJldHVybiByYW5nZSAjIGZhbGxiYWNrXG5cbnNjYW5FZGl0b3JJbkRpcmVjdGlvbiA9IChlZGl0b3IsIGRpcmVjdGlvbiwgcGF0dGVybiwgb3B0aW9ucz17fSwgZm4pIC0+XG4gIHthbGxvd05leHRMaW5lLCBmcm9tLCBzY2FuUmFuZ2V9ID0gb3B0aW9uc1xuICBpZiBub3QgZnJvbT8gYW5kIG5vdCBzY2FuUmFuZ2U/XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgZWl0aGVyIG9mICdmcm9tJyBvciAnc2NhblJhbmdlJyBvcHRpb25zXCIpXG5cbiAgaWYgc2NhblJhbmdlXG4gICAgYWxsb3dOZXh0TGluZSA9IHRydWVcbiAgZWxzZVxuICAgIGFsbG93TmV4dExpbmUgPz0gdHJ1ZVxuICBmcm9tID0gUG9pbnQuZnJvbU9iamVjdChmcm9tKSBpZiBmcm9tP1xuICBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgd2hlbiAnZm9yd2FyZCdcbiAgICAgIHNjYW5SYW5nZSA/PSBuZXcgUmFuZ2UoZnJvbSwgZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oZWRpdG9yKSlcbiAgICAgIHNjYW5GdW5jdGlvbiA9ICdzY2FuSW5CdWZmZXJSYW5nZSdcbiAgICB3aGVuICdiYWNrd2FyZCdcbiAgICAgIHNjYW5SYW5nZSA/PSBuZXcgUmFuZ2UoWzAsIDBdLCBmcm9tKVxuICAgICAgc2NhbkZ1bmN0aW9uID0gJ2JhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlJ1xuXG4gIGVkaXRvcltzY2FuRnVuY3Rpb25dIHBhdHRlcm4sIHNjYW5SYW5nZSwgKGV2ZW50KSAtPlxuICAgIGlmIG5vdCBhbGxvd05leHRMaW5lIGFuZCBldmVudC5yYW5nZS5zdGFydC5yb3cgaXNudCBmcm9tLnJvd1xuICAgICAgZXZlbnQuc3RvcCgpXG4gICAgICByZXR1cm5cbiAgICBmbihldmVudClcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEFuY2VzdG9yc1xuICBnZXRLZXlCaW5kaW5nRm9yQ29tbWFuZFxuICBpbmNsdWRlXG4gIGRlYnVnXG4gIHNhdmVFZGl0b3JTdGF0ZVxuICBpc0xpbmV3aXNlUmFuZ2VcbiAgaGF2ZVNvbWVOb25FbXB0eVNlbGVjdGlvblxuICBzb3J0UmFuZ2VzXG4gIGdldEluZGV4XG4gIGdldFZpc2libGVCdWZmZXJSYW5nZVxuICBnZXRWaXNpYmxlRWRpdG9yc1xuICBwb2ludElzQXRFbmRPZkxpbmVcbiAgcG9pbnRJc09uV2hpdGVTcGFjZVxuICBwb2ludElzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93XG4gIHBvaW50SXNBdFZpbUVuZE9mRmlsZVxuICBjdXJzb3JJc0F0VmltRW5kT2ZGaWxlXG4gIGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uXG4gIGdldFZpbUVvZlNjcmVlblBvc2l0aW9uXG4gIGdldFZpbUxhc3RCdWZmZXJSb3dcbiAgZ2V0VmltTGFzdFNjcmVlblJvd1xuICBzZXRCdWZmZXJSb3dcbiAgc2V0QnVmZmVyQ29sdW1uXG4gIG1vdmVDdXJzb3JMZWZ0XG4gIG1vdmVDdXJzb3JSaWdodFxuICBtb3ZlQ3Vyc29yVXBTY3JlZW5cbiAgbW92ZUN1cnNvckRvd25TY3JlZW5cbiAgZ2V0RW5kT2ZMaW5lRm9yQnVmZmVyUm93XG4gIGdldEZpcnN0VmlzaWJsZVNjcmVlblJvd1xuICBnZXRMYXN0VmlzaWJsZVNjcmVlblJvd1xuICBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICBnZXRWYWxpZFZpbVNjcmVlblJvd1xuICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93XG4gIGdldExpbmVUZXh0VG9CdWZmZXJQb3NpdGlvblxuICBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvd1xuICBnZXRUZXh0SW5TY3JlZW5SYW5nZVxuICBtb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZVxuICBpc0VtcHR5Um93XG4gIGN1cnNvcklzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93XG4gIGdldENvZGVGb2xkUm93UmFuZ2VzXG4gIGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93XG4gIGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2VcbiAgdHJpbVJhbmdlXG4gIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3dcbiAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvd1xuICBkZXRlY3RTY29wZVN0YXJ0UG9zaXRpb25Gb3JTY29wZVxuICBnZXRCdWZmZXJSb3dzXG4gIHJlZ2lzdGVyRWxlbWVudFxuICBzbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb25cbiAgbWF0Y2hTY29wZXNcbiAgbW92ZUN1cnNvckRvd25CdWZmZXJcbiAgbW92ZUN1cnNvclVwQnVmZmVyXG4gIGlzU2luZ2xlTGluZVRleHRcbiAgZ2V0V29yZEJ1ZmZlclJhbmdlQXRCdWZmZXJQb3NpdGlvblxuICBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvblxuICBnZXRXb3JkUGF0dGVybkF0QnVmZmVyUG9zaXRpb25cbiAgZ2V0U3Vid29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uXG4gIGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yXG4gIHNocmlua1JhbmdlRW5kVG9CZWZvcmVOZXdMaW5lXG4gIHNjYW5FZGl0b3JcbiAgY29sbGVjdFJhbmdlSW5CdWZmZXJSb3dcbiAgZmluZFJhbmdlSW5CdWZmZXJSb3dcbiAgZ2V0TGFyZ2VzdEZvbGRSYW5nZUNvbnRhaW5zQnVmZmVyUm93XG4gIHRyYW5zbGF0ZVBvaW50QW5kQ2xpcFxuICBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwXG4gIGdldFBhY2thZ2VcbiAgc2VhcmNoQnlQcm9qZWN0RmluZFxuICBsaW1pdE51bWJlclxuICBmaW5kUmFuZ2VDb250YWluc1BvaW50XG5cbiAgaXNFbXB0eSwgaXNOb3RFbXB0eVxuICBpc1NpbmdsZUxpbmVSYW5nZSwgaXNOb3RTaW5nbGVMaW5lUmFuZ2VcblxuICBpbnNlcnRUZXh0QXRCdWZmZXJQb3NpdGlvblxuICBlbnN1cmVFbmRzV2l0aE5ld0xpbmVGb3JCdWZmZXJSb3dcbiAgaXNMZWFkaW5nV2hpdGVTcGFjZVJhbmdlXG4gIGlzTm90TGVhZGluZ1doaXRlU3BhY2VSYW5nZVxuICBpc0VzY2FwZWRDaGFyUmFuZ2VcblxuICBmb3JFYWNoUGFuZUF4aXNcbiAgYWRkQ2xhc3NMaXN0XG4gIHJlbW92ZUNsYXNzTGlzdFxuICB0b2dnbGVDbGFzc0xpc3RcbiAgdG9nZ2xlQ2FzZUZvckNoYXJhY3RlclxuICBzcGxpdFRleHRCeU5ld0xpbmVcbiAgaHVtYW5pemVCdWZmZXJSYW5nZVxuICBleHBhbmRSYW5nZVRvV2hpdGVTcGFjZXNcbiAgc2NhbkVkaXRvckluRGlyZWN0aW9uXG59XG4iXX0=
