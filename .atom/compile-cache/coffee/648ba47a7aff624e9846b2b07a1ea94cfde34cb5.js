(function() {
  var APair, AngleBracket, AnyPair, AnyPairAllowForwarding, AnyQuote, Arguments, BackTick, Base, Comment, CommentOrParagraph, CurlyBracket, CurrentLine, DoubleQuote, Empty, Entire, Fold, Function, Indentation, LatestChange, Pair, PairFinder, Paragraph, Parenthesis, PersistentSelection, Point, PreviousSelection, Quote, Range, SearchMatchBackward, SearchMatchForward, SingleQuote, SmartWord, SquareBracket, Subword, Tag, TextObject, VisibleArea, WholeWord, Word, _, expandRangeToWhiteSpaces, getBufferRows, getCodeFoldRowRangesContainesForRow, getLineTextToBufferPosition, getValidVimBufferRow, getVisibleBufferRange, isIncludeFunctionScopeForRow, pointIsAtEndOfLine, ref, ref1, sortRanges, splitArguments, translatePointAndClip, traverseTextFromPoint, trimRange,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  Base = require('./base');

  ref1 = require('./utils'), getLineTextToBufferPosition = ref1.getLineTextToBufferPosition, getCodeFoldRowRangesContainesForRow = ref1.getCodeFoldRowRangesContainesForRow, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, expandRangeToWhiteSpaces = ref1.expandRangeToWhiteSpaces, getVisibleBufferRange = ref1.getVisibleBufferRange, translatePointAndClip = ref1.translatePointAndClip, getBufferRows = ref1.getBufferRows, getValidVimBufferRow = ref1.getValidVimBufferRow, trimRange = ref1.trimRange, sortRanges = ref1.sortRanges, pointIsAtEndOfLine = ref1.pointIsAtEndOfLine, splitArguments = ref1.splitArguments, traverseTextFromPoint = ref1.traverseTextFromPoint;

  PairFinder = null;

  TextObject = (function(superClass) {
    extend(TextObject, superClass);

    TextObject.extend(false);

    TextObject.operationKind = 'text-object';

    TextObject.prototype.wise = 'characterwise';

    TextObject.prototype.supportCount = false;

    TextObject.prototype.selectOnce = false;

    TextObject.deriveInnerAndA = function() {
      this.generateClass("A" + this.name, false);
      return this.generateClass("Inner" + this.name, true);
    };

    TextObject.deriveInnerAndAForAllowForwarding = function() {
      this.generateClass("A" + this.name + "AllowForwarding", false, true);
      return this.generateClass("Inner" + this.name + "AllowForwarding", true, true);
    };

    TextObject.generateClass = function(klassName, inner, allowForwarding) {
      var klass;
      klass = (function(superClass1) {
        extend(_Class, superClass1);

        function _Class() {
          return _Class.__super__.constructor.apply(this, arguments);
        }

        return _Class;

      })(this);
      Object.defineProperty(klass, 'name', {
        get: function() {
          return klassName;
        }
      });
      klass.prototype.inner = inner;
      if (allowForwarding) {
        klass.prototype.allowForwarding = true;
      }
      return klass.extend();
    };

    function TextObject() {
      TextObject.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    TextObject.prototype.isInner = function() {
      return this.inner;
    };

    TextObject.prototype.isA = function() {
      return !this.inner;
    };

    TextObject.prototype.isLinewise = function() {
      return this.wise === 'linewise';
    };

    TextObject.prototype.isBlockwise = function() {
      return this.wise === 'blockwise';
    };

    TextObject.prototype.forceWise = function(wise) {
      return this.wise = wise;
    };

    TextObject.prototype.resetState = function() {
      return this.selectSucceeded = null;
    };

    TextObject.prototype.execute = function() {
      this.resetState();
      if (this.operator != null) {
        return this.select();
      } else {
        throw new Error('in TextObject: Must not happen');
      }
    };

    TextObject.prototype.select = function() {
      var $selection, i, j, k, len, len1, len2, ref2, ref3, ref4, results;
      if (this.isMode('visual', 'blockwise')) {
        this.swrap.normalize(this.editor);
      }
      this.countTimes(this.getCount(), (function(_this) {
        return function(arg1) {
          var i, len, oldRange, ref2, results, selection, stop;
          stop = arg1.stop;
          if (!_this.supportCount) {
            stop();
          }
          ref2 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            selection = ref2[i];
            oldRange = selection.getBufferRange();
            if (_this.selectTextObject(selection)) {
              _this.selectSucceeded = true;
            }
            if (selection.getBufferRange().isEqual(oldRange)) {
              stop();
            }
            if (_this.selectOnce) {
              break;
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
      this.editor.mergeIntersectingSelections();
      if (this.wise == null) {
        this.wise = this.swrap.detectWise(this.editor);
      }
      if (this.mode === 'visual') {
        if (this.selectSucceeded) {
          switch (this.wise) {
            case 'characterwise':
              ref2 = this.swrap.getSelections(this.editor);
              for (i = 0, len = ref2.length; i < len; i++) {
                $selection = ref2[i];
                $selection.saveProperties();
              }
              break;
            case 'linewise':
              ref3 = this.swrap.getSelections(this.editor);
              for (j = 0, len1 = ref3.length; j < len1; j++) {
                $selection = ref3[j];
                if (this.getConfig('keepColumnOnSelectTextObject')) {
                  if (!$selection.hasProperties()) {
                    $selection.saveProperties();
                  }
                } else {
                  $selection.saveProperties();
                }
                $selection.fixPropertyRowToRowRange();
              }
          }
        }
        if (this.submode === 'blockwise') {
          ref4 = this.swrap.getSelections(this.editor);
          results = [];
          for (k = 0, len2 = ref4.length; k < len2; k++) {
            $selection = ref4[k];
            $selection.normalize();
            results.push($selection.applyWise('blockwise'));
          }
          return results;
        }
      }
    };

    TextObject.prototype.selectTextObject = function(selection) {
      var range;
      if (range = this.getRange(selection)) {
        this.swrap(selection).setBufferRange(range);
        return true;
      }
    };

    TextObject.prototype.getRange = function(selection) {
      return null;
    };

    return TextObject;

  })(Base);

  Word = (function(superClass) {
    extend(Word, superClass);

    function Word() {
      return Word.__super__.constructor.apply(this, arguments);
    }

    Word.extend(false);

    Word.deriveInnerAndA();

    Word.prototype.getRange = function(selection) {
      var point, range;
      point = this.getCursorPositionForSelection(selection);
      range = this.getWordBufferRangeAndKindAtBufferPosition(point, {
        wordRegex: this.wordRegex
      }).range;
      if (this.isA()) {
        return expandRangeToWhiteSpaces(this.editor, range);
      } else {
        return range;
      }
    };

    return Word;

  })(TextObject);

  WholeWord = (function(superClass) {
    extend(WholeWord, superClass);

    function WholeWord() {
      return WholeWord.__super__.constructor.apply(this, arguments);
    }

    WholeWord.extend(false);

    WholeWord.deriveInnerAndA();

    WholeWord.prototype.wordRegex = /\S+/;

    return WholeWord;

  })(Word);

  SmartWord = (function(superClass) {
    extend(SmartWord, superClass);

    function SmartWord() {
      return SmartWord.__super__.constructor.apply(this, arguments);
    }

    SmartWord.extend(false);

    SmartWord.deriveInnerAndA();

    SmartWord.description = "A word that consists of alphanumeric chars(`/[A-Za-z0-9_]/`) and hyphen `-`";

    SmartWord.prototype.wordRegex = /[\w-]+/;

    return SmartWord;

  })(Word);

  Subword = (function(superClass) {
    extend(Subword, superClass);

    function Subword() {
      return Subword.__super__.constructor.apply(this, arguments);
    }

    Subword.extend(false);

    Subword.deriveInnerAndA();

    Subword.prototype.getRange = function(selection) {
      this.wordRegex = selection.cursor.subwordRegExp();
      return Subword.__super__.getRange.apply(this, arguments);
    };

    return Subword;

  })(Word);

  Pair = (function(superClass) {
    extend(Pair, superClass);

    function Pair() {
      return Pair.__super__.constructor.apply(this, arguments);
    }

    Pair.extend(false);

    Pair.prototype.supportCount = true;

    Pair.prototype.allowNextLine = null;

    Pair.prototype.adjustInnerRange = true;

    Pair.prototype.pair = null;

    Pair.prototype.inclusive = true;

    Pair.prototype.initialize = function() {
      if (PairFinder == null) {
        PairFinder = require('./pair-finder.coffee');
      }
      return Pair.__super__.initialize.apply(this, arguments);
    };

    Pair.prototype.isAllowNextLine = function() {
      var ref2;
      return (ref2 = this.allowNextLine) != null ? ref2 : (this.pair != null) && this.pair[0] !== this.pair[1];
    };

    Pair.prototype.adjustRange = function(arg1) {
      var end, start;
      start = arg1.start, end = arg1.end;
      if (pointIsAtEndOfLine(this.editor, start)) {
        start = start.traverse([1, 0]);
      }
      if (getLineTextToBufferPosition(this.editor, end).match(/^\s*$/)) {
        if (this.mode === 'visual') {
          end = new Point(end.row - 1, 2e308);
        } else {
          end = new Point(end.row, 0);
        }
      }
      return new Range(start, end);
    };

    Pair.prototype.getFinder = function() {
      var options;
      options = {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        pair: this.pair,
        inclusive: this.inclusive
      };
      if (this.pair[0] === this.pair[1]) {
        return new PairFinder.QuoteFinder(this.editor, options);
      } else {
        return new PairFinder.BracketFinder(this.editor, options);
      }
    };

    Pair.prototype.getPairInfo = function(from) {
      var pairInfo;
      pairInfo = this.getFinder().find(from);
      if (pairInfo == null) {
        return null;
      }
      if (this.adjustInnerRange) {
        pairInfo.innerRange = this.adjustRange(pairInfo.innerRange);
      }
      pairInfo.targetRange = this.isInner() ? pairInfo.innerRange : pairInfo.aRange;
      return pairInfo;
    };

    Pair.prototype.getRange = function(selection) {
      var originalRange, pairInfo;
      originalRange = selection.getBufferRange();
      pairInfo = this.getPairInfo(this.getCursorPositionForSelection(selection));
      if (pairInfo != null ? pairInfo.targetRange.isEqual(originalRange) : void 0) {
        pairInfo = this.getPairInfo(pairInfo.aRange.end);
      }
      return pairInfo != null ? pairInfo.targetRange : void 0;
    };

    return Pair;

  })(TextObject);

  APair = (function(superClass) {
    extend(APair, superClass);

    function APair() {
      return APair.__super__.constructor.apply(this, arguments);
    }

    APair.extend(false);

    return APair;

  })(Pair);

  AnyPair = (function(superClass) {
    extend(AnyPair, superClass);

    function AnyPair() {
      return AnyPair.__super__.constructor.apply(this, arguments);
    }

    AnyPair.extend(false);

    AnyPair.deriveInnerAndA();

    AnyPair.prototype.allowForwarding = false;

    AnyPair.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick', 'CurlyBracket', 'AngleBracket', 'SquareBracket', 'Parenthesis'];

    AnyPair.prototype.getRanges = function(selection) {
      return this.member.map((function(_this) {
        return function(klass) {
          return _this["new"](klass, {
            inner: _this.inner,
            allowForwarding: _this.allowForwarding,
            inclusive: _this.inclusive
          }).getRange(selection);
        };
      })(this)).filter(function(range) {
        return range != null;
      });
    };

    AnyPair.prototype.getRange = function(selection) {
      return _.last(sortRanges(this.getRanges(selection)));
    };

    return AnyPair;

  })(Pair);

  AnyPairAllowForwarding = (function(superClass) {
    extend(AnyPairAllowForwarding, superClass);

    function AnyPairAllowForwarding() {
      return AnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AnyPairAllowForwarding.extend(false);

    AnyPairAllowForwarding.deriveInnerAndA();

    AnyPairAllowForwarding.description = "Range surrounded by auto-detected paired chars from enclosed and forwarding area";

    AnyPairAllowForwarding.prototype.allowForwarding = true;

    AnyPairAllowForwarding.prototype.getRange = function(selection) {
      var enclosingRange, enclosingRanges, forwardingRanges, from, ranges, ref2;
      ranges = this.getRanges(selection);
      from = selection.cursor.getBufferPosition();
      ref2 = _.partition(ranges, function(range) {
        return range.start.isGreaterThanOrEqual(from);
      }), forwardingRanges = ref2[0], enclosingRanges = ref2[1];
      enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function(range) {
          return enclosingRange.containsRange(range);
        });
      }
      return forwardingRanges[0] || enclosingRange;
    };

    return AnyPairAllowForwarding;

  })(AnyPair);

  AnyQuote = (function(superClass) {
    extend(AnyQuote, superClass);

    function AnyQuote() {
      return AnyQuote.__super__.constructor.apply(this, arguments);
    }

    AnyQuote.extend(false);

    AnyQuote.deriveInnerAndA();

    AnyQuote.prototype.allowForwarding = true;

    AnyQuote.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick'];

    AnyQuote.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.first(_.sortBy(ranges, function(r) {
          return r.end.column;
        }));
      }
    };

    return AnyQuote;

  })(AnyPair);

  Quote = (function(superClass) {
    extend(Quote, superClass);

    function Quote() {
      return Quote.__super__.constructor.apply(this, arguments);
    }

    Quote.extend(false);

    Quote.prototype.allowForwarding = true;

    return Quote;

  })(Pair);

  DoubleQuote = (function(superClass) {
    extend(DoubleQuote, superClass);

    function DoubleQuote() {
      return DoubleQuote.__super__.constructor.apply(this, arguments);
    }

    DoubleQuote.extend(false);

    DoubleQuote.deriveInnerAndA();

    DoubleQuote.prototype.pair = ['"', '"'];

    return DoubleQuote;

  })(Quote);

  SingleQuote = (function(superClass) {
    extend(SingleQuote, superClass);

    function SingleQuote() {
      return SingleQuote.__super__.constructor.apply(this, arguments);
    }

    SingleQuote.extend(false);

    SingleQuote.deriveInnerAndA();

    SingleQuote.prototype.pair = ["'", "'"];

    return SingleQuote;

  })(Quote);

  BackTick = (function(superClass) {
    extend(BackTick, superClass);

    function BackTick() {
      return BackTick.__super__.constructor.apply(this, arguments);
    }

    BackTick.extend(false);

    BackTick.deriveInnerAndA();

    BackTick.prototype.pair = ['`', '`'];

    return BackTick;

  })(Quote);

  CurlyBracket = (function(superClass) {
    extend(CurlyBracket, superClass);

    function CurlyBracket() {
      return CurlyBracket.__super__.constructor.apply(this, arguments);
    }

    CurlyBracket.extend(false);

    CurlyBracket.deriveInnerAndA();

    CurlyBracket.deriveInnerAndAForAllowForwarding();

    CurlyBracket.prototype.pair = ['{', '}'];

    return CurlyBracket;

  })(Pair);

  SquareBracket = (function(superClass) {
    extend(SquareBracket, superClass);

    function SquareBracket() {
      return SquareBracket.__super__.constructor.apply(this, arguments);
    }

    SquareBracket.extend(false);

    SquareBracket.deriveInnerAndA();

    SquareBracket.deriveInnerAndAForAllowForwarding();

    SquareBracket.prototype.pair = ['[', ']'];

    return SquareBracket;

  })(Pair);

  Parenthesis = (function(superClass) {
    extend(Parenthesis, superClass);

    function Parenthesis() {
      return Parenthesis.__super__.constructor.apply(this, arguments);
    }

    Parenthesis.extend(false);

    Parenthesis.deriveInnerAndA();

    Parenthesis.deriveInnerAndAForAllowForwarding();

    Parenthesis.prototype.pair = ['(', ')'];

    return Parenthesis;

  })(Pair);

  AngleBracket = (function(superClass) {
    extend(AngleBracket, superClass);

    function AngleBracket() {
      return AngleBracket.__super__.constructor.apply(this, arguments);
    }

    AngleBracket.extend(false);

    AngleBracket.deriveInnerAndA();

    AngleBracket.deriveInnerAndAForAllowForwarding();

    AngleBracket.prototype.pair = ['<', '>'];

    return AngleBracket;

  })(Pair);

  Tag = (function(superClass) {
    extend(Tag, superClass);

    function Tag() {
      return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.extend(false);

    Tag.deriveInnerAndA();

    Tag.prototype.allowNextLine = true;

    Tag.prototype.allowForwarding = true;

    Tag.prototype.adjustInnerRange = false;

    Tag.prototype.getTagStartPoint = function(from) {
      var pattern, tagRange;
      tagRange = null;
      pattern = PairFinder.TagFinder.prototype.pattern;
      this.scanForward(pattern, {
        from: [from.row, 0]
      }, function(arg1) {
        var range, stop;
        range = arg1.range, stop = arg1.stop;
        if (range.containsPoint(from, true)) {
          tagRange = range;
          return stop();
        }
      });
      return tagRange != null ? tagRange.start : void 0;
    };

    Tag.prototype.getFinder = function() {
      return new PairFinder.TagFinder(this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        inclusive: this.inclusive
      });
    };

    Tag.prototype.getPairInfo = function(from) {
      var ref2;
      return Tag.__super__.getPairInfo.call(this, (ref2 = this.getTagStartPoint(from)) != null ? ref2 : from);
    };

    return Tag;

  })(Pair);

  Paragraph = (function(superClass) {
    extend(Paragraph, superClass);

    function Paragraph() {
      return Paragraph.__super__.constructor.apply(this, arguments);
    }

    Paragraph.extend(false);

    Paragraph.deriveInnerAndA();

    Paragraph.prototype.wise = 'linewise';

    Paragraph.prototype.supportCount = true;

    Paragraph.prototype.findRow = function(fromRow, direction, fn) {
      var foundRow, i, len, ref2, row;
      if (typeof fn.reset === "function") {
        fn.reset();
      }
      foundRow = fromRow;
      ref2 = getBufferRows(this.editor, {
        startRow: fromRow,
        direction: direction
      });
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (!fn(row, direction)) {
          break;
        }
        foundRow = row;
      }
      return foundRow;
    };

    Paragraph.prototype.findRowRangeBy = function(fromRow, fn) {
      var endRow, startRow;
      startRow = this.findRow(fromRow, 'previous', fn);
      endRow = this.findRow(fromRow, 'next', fn);
      return [startRow, endRow];
    };

    Paragraph.prototype.getPredictFunction = function(fromRow, selection) {
      var directionToExtend, flip, fromRowResult, predict;
      fromRowResult = this.editor.isBufferRowBlank(fromRow);
      if (this.isInner()) {
        predict = (function(_this) {
          return function(row, direction) {
            return _this.editor.isBufferRowBlank(row) === fromRowResult;
          };
        })(this);
      } else {
        if (selection.isReversed()) {
          directionToExtend = 'previous';
        } else {
          directionToExtend = 'next';
        }
        flip = false;
        predict = (function(_this) {
          return function(row, direction) {
            var result;
            result = _this.editor.isBufferRowBlank(row) === fromRowResult;
            if (flip) {
              return !result;
            } else {
              if ((!result) && (direction === directionToExtend)) {
                flip = true;
                return true;
              }
              return result;
            }
          };
        })(this);
        predict.reset = function() {
          return flip = false;
        };
      }
      return predict;
    };

    Paragraph.prototype.getRange = function(selection) {
      var fromRow, originalRange, rowRange;
      originalRange = selection.getBufferRange();
      fromRow = this.getCursorPositionForSelection(selection).row;
      if (this.isMode('visual', 'linewise')) {
        if (selection.isReversed()) {
          fromRow--;
        } else {
          fromRow++;
        }
        fromRow = getValidVimBufferRow(this.editor, fromRow);
      }
      rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(this.getBufferRangeForRowRange(rowRange));
    };

    return Paragraph;

  })(TextObject);

  Indentation = (function(superClass) {
    extend(Indentation, superClass);

    function Indentation() {
      return Indentation.__super__.constructor.apply(this, arguments);
    }

    Indentation.extend(false);

    Indentation.deriveInnerAndA();

    Indentation.prototype.getRange = function(selection) {
      var baseIndentLevel, fromRow, predict, rowRange;
      fromRow = this.getCursorPositionForSelection(selection).row;
      baseIndentLevel = this.getIndentLevelForBufferRow(fromRow);
      predict = (function(_this) {
        return function(row) {
          if (_this.editor.isBufferRowBlank(row)) {
            return _this.isA();
          } else {
            return _this.getIndentLevelForBufferRow(row) >= baseIndentLevel;
          }
        };
      })(this);
      rowRange = this.findRowRangeBy(fromRow, predict);
      return this.getBufferRangeForRowRange(rowRange);
    };

    return Indentation;

  })(Paragraph);

  Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.extend(false);

    Comment.deriveInnerAndA();

    Comment.prototype.wise = 'linewise';

    Comment.prototype.getRange = function(selection) {
      var row, rowRange;
      row = this.getCursorPositionForSelection(selection).row;
      rowRange = this.editor.languageMode.rowRangeForCommentAtBufferRow(row);
      if (this.editor.isBufferRowCommented(row)) {
        if (rowRange == null) {
          rowRange = [row, row];
        }
      }
      if (rowRange != null) {
        return this.getBufferRangeForRowRange(rowRange);
      }
    };

    return Comment;

  })(TextObject);

  CommentOrParagraph = (function(superClass) {
    extend(CommentOrParagraph, superClass);

    function CommentOrParagraph() {
      return CommentOrParagraph.__super__.constructor.apply(this, arguments);
    }

    CommentOrParagraph.extend(false);

    CommentOrParagraph.deriveInnerAndA();

    CommentOrParagraph.prototype.wise = 'linewise';

    CommentOrParagraph.prototype.getRange = function(selection) {
      var i, klass, len, range, ref2;
      ref2 = ['Comment', 'Paragraph'];
      for (i = 0, len = ref2.length; i < len; i++) {
        klass = ref2[i];
        if (range = this["new"](klass, {
          inner: this.inner
        }).getRange(selection)) {
          return range;
        }
      }
    };

    return CommentOrParagraph;

  })(TextObject);

  Fold = (function(superClass) {
    extend(Fold, superClass);

    function Fold() {
      return Fold.__super__.constructor.apply(this, arguments);
    }

    Fold.extend(false);

    Fold.deriveInnerAndA();

    Fold.prototype.wise = 'linewise';

    Fold.prototype.adjustRowRange = function(rowRange) {
      var endRow, startRow;
      if (this.isA()) {
        return rowRange;
      }
      startRow = rowRange[0], endRow = rowRange[1];
      if (this.getIndentLevelForBufferRow(startRow) === this.getIndentLevelForBufferRow(endRow)) {
        endRow -= 1;
      }
      startRow += 1;
      return [startRow, endRow];
    };

    Fold.prototype.getFoldRowRangesContainsForRow = function(row) {
      return getCodeFoldRowRangesContainesForRow(this.editor, row).reverse();
    };

    Fold.prototype.getRange = function(selection) {
      var i, len, range, ref2, row, rowRange, selectedRange;
      row = this.getCursorPositionForSelection(selection).row;
      selectedRange = selection.getBufferRange();
      ref2 = this.getFoldRowRangesContainsForRow(row);
      for (i = 0, len = ref2.length; i < len; i++) {
        rowRange = ref2[i];
        range = this.getBufferRangeForRowRange(this.adjustRowRange(rowRange));
        if (!selectedRange.containsRange(range)) {
          return range;
        }
      }
    };

    return Fold;

  })(TextObject);

  Function = (function(superClass) {
    extend(Function, superClass);

    function Function() {
      return Function.__super__.constructor.apply(this, arguments);
    }

    Function.extend(false);

    Function.deriveInnerAndA();

    Function.prototype.scopeNamesOmittingEndRow = ['source.go', 'source.elixir'];

    Function.prototype.getFoldRowRangesContainsForRow = function(row) {
      return (Function.__super__.getFoldRowRangesContainsForRow.apply(this, arguments)).filter((function(_this) {
        return function(rowRange) {
          return isIncludeFunctionScopeForRow(_this.editor, rowRange[0]);
        };
      })(this));
    };

    Function.prototype.adjustRowRange = function(rowRange) {
      var endRow, ref2, ref3, startRow;
      ref2 = Function.__super__.adjustRowRange.apply(this, arguments), startRow = ref2[0], endRow = ref2[1];
      if (this.isA() && (ref3 = this.editor.getGrammar().scopeName, indexOf.call(this.scopeNamesOmittingEndRow, ref3) >= 0)) {
        endRow += 1;
      }
      return [startRow, endRow];
    };

    return Function;

  })(Fold);

  Arguments = (function(superClass) {
    extend(Arguments, superClass);

    function Arguments() {
      return Arguments.__super__.constructor.apply(this, arguments);
    }

    Arguments.extend(false);

    Arguments.deriveInnerAndA();

    Arguments.prototype.newArgInfo = function(argStart, arg, separator) {
      var aRange, argEnd, argRange, innerRange, separatorEnd, separatorRange;
      argEnd = traverseTextFromPoint(argStart, arg);
      argRange = new Range(argStart, argEnd);
      separatorEnd = traverseTextFromPoint(argEnd, separator != null ? separator : '');
      separatorRange = new Range(argEnd, separatorEnd);
      innerRange = argRange;
      aRange = argRange.union(separatorRange);
      return {
        argRange: argRange,
        separatorRange: separatorRange,
        innerRange: innerRange,
        aRange: aRange
      };
    };

    Arguments.prototype.getArgumentsRangeForSelection = function(selection) {
      var member;
      member = ['CurlyBracket', 'SquareBracket', 'Parenthesis'];
      return this["new"]("InnerAnyPair", {
        inclusive: false,
        member: member
      }).getRange(selection);
    };

    Arguments.prototype.getRange = function(selection) {
      var aRange, allTokens, argInfo, argInfos, argStart, i, innerRange, lastArgInfo, len, pairRangeFound, point, range, ref2, ref3, separator, text, token;
      range = this.getArgumentsRangeForSelection(selection);
      pairRangeFound = range != null;
      if (range == null) {
        range = this["new"]("InnerCurrentLine").getRange(selection);
      }
      if (!range) {
        return;
      }
      range = trimRange(this.editor, range);
      text = this.editor.getTextInBufferRange(range);
      allTokens = splitArguments(text, pairRangeFound);
      argInfos = [];
      argStart = range.start;
      if (allTokens.length && allTokens[0].type === 'separator') {
        token = allTokens.shift();
        argStart = traverseTextFromPoint(argStart, token.text);
      }
      while (allTokens.length) {
        token = allTokens.shift();
        if (token.type === 'argument') {
          separator = (ref2 = allTokens.shift()) != null ? ref2.text : void 0;
          argInfo = this.newArgInfo(argStart, token.text, separator);
          if ((allTokens.length === 0) && (lastArgInfo = _.last(argInfos))) {
            argInfo.aRange = argInfo.argRange.union(lastArgInfo.separatorRange);
          }
          argStart = argInfo.aRange.end;
          argInfos.push(argInfo);
        } else {
          throw new Error('must not happen');
        }
      }
      point = this.getCursorPositionForSelection(selection);
      for (i = 0, len = argInfos.length; i < len; i++) {
        ref3 = argInfos[i], innerRange = ref3.innerRange, aRange = ref3.aRange;
        if (innerRange.end.isGreaterThanOrEqual(point)) {
          if (this.isInner()) {
            return innerRange;
          } else {
            return aRange;
          }
        }
      }
      return null;
    };

    return Arguments;

  })(TextObject);

  CurrentLine = (function(superClass) {
    extend(CurrentLine, superClass);

    function CurrentLine() {
      return CurrentLine.__super__.constructor.apply(this, arguments);
    }

    CurrentLine.extend(false);

    CurrentLine.deriveInnerAndA();

    CurrentLine.prototype.getRange = function(selection) {
      var range, row;
      row = this.getCursorPositionForSelection(selection).row;
      range = this.editor.bufferRangeForBufferRow(row);
      if (this.isA()) {
        return range;
      } else {
        return trimRange(this.editor, range);
      }
    };

    return CurrentLine;

  })(TextObject);

  Entire = (function(superClass) {
    extend(Entire, superClass);

    function Entire() {
      return Entire.__super__.constructor.apply(this, arguments);
    }

    Entire.extend(false);

    Entire.deriveInnerAndA();

    Entire.prototype.wise = 'linewise';

    Entire.prototype.selectOnce = true;

    Entire.prototype.getRange = function(selection) {
      return this.editor.buffer.getRange();
    };

    return Entire;

  })(TextObject);

  Empty = (function(superClass) {
    extend(Empty, superClass);

    function Empty() {
      return Empty.__super__.constructor.apply(this, arguments);
    }

    Empty.extend(false);

    Empty.prototype.selectOnce = true;

    return Empty;

  })(TextObject);

  LatestChange = (function(superClass) {
    extend(LatestChange, superClass);

    function LatestChange() {
      return LatestChange.__super__.constructor.apply(this, arguments);
    }

    LatestChange.extend(false);

    LatestChange.deriveInnerAndA();

    LatestChange.prototype.wise = null;

    LatestChange.prototype.selectOnce = true;

    LatestChange.prototype.getRange = function(selection) {
      var end, start;
      start = this.vimState.mark.get('[');
      end = this.vimState.mark.get(']');
      if ((start != null) && (end != null)) {
        return new Range(start, end);
      }
    };

    return LatestChange;

  })(TextObject);

  SearchMatchForward = (function(superClass) {
    extend(SearchMatchForward, superClass);

    function SearchMatchForward() {
      return SearchMatchForward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchForward.extend();

    SearchMatchForward.prototype.backward = false;

    SearchMatchForward.prototype.findMatch = function(fromPoint, pattern) {
      var found;
      if (this.mode === 'visual') {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "forward");
      }
      found = null;
      this.scanForward(pattern, {
        from: [fromPoint.row, 0]
      }, function(arg1) {
        var range, stop;
        range = arg1.range, stop = arg1.stop;
        if (range.end.isGreaterThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'end'
      };
    };

    SearchMatchForward.prototype.getRange = function(selection) {
      var fromPoint, pattern, range, ref2, whichIsHead;
      pattern = this.globalState.get('lastSearchPattern');
      if (pattern == null) {
        return;
      }
      fromPoint = selection.getHeadBufferPosition();
      ref2 = this.findMatch(fromPoint, pattern), range = ref2.range, whichIsHead = ref2.whichIsHead;
      if (range != null) {
        return this.unionRangeAndDetermineReversedState(selection, range, whichIsHead);
      }
    };

    SearchMatchForward.prototype.unionRangeAndDetermineReversedState = function(selection, found, whichIsHead) {
      var head, tail;
      if (selection.isEmpty()) {
        return found;
      } else {
        head = found[whichIsHead];
        tail = selection.getTailBufferPosition();
        if (this.backward) {
          if (tail.isLessThan(head)) {
            head = translatePointAndClip(this.editor, head, 'forward');
          }
        } else {
          if (head.isLessThan(tail)) {
            head = translatePointAndClip(this.editor, head, 'backward');
          }
        }
        this.reversed = head.isLessThan(tail);
        return new Range(tail, head).union(this.swrap(selection).getTailBufferRange());
      }
    };

    SearchMatchForward.prototype.selectTextObject = function(selection) {
      var range, ref2;
      if (range = this.getRange(selection)) {
        this.swrap(selection).setBufferRange(range, {
          reversed: (ref2 = this.reversed) != null ? ref2 : this.backward
        });
        return true;
      }
    };

    return SearchMatchForward;

  })(TextObject);

  SearchMatchBackward = (function(superClass) {
    extend(SearchMatchBackward, superClass);

    function SearchMatchBackward() {
      return SearchMatchBackward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchBackward.extend();

    SearchMatchBackward.prototype.backward = true;

    SearchMatchBackward.prototype.findMatch = function(fromPoint, pattern) {
      var found;
      if (this.mode === 'visual') {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "backward");
      }
      found = null;
      this.scanBackward(pattern, {
        from: [fromPoint.row, 2e308]
      }, function(arg1) {
        var range, stop;
        range = arg1.range, stop = arg1.stop;
        if (range.start.isLessThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'start'
      };
    };

    return SearchMatchBackward;

  })(SearchMatchForward);

  PreviousSelection = (function(superClass) {
    extend(PreviousSelection, superClass);

    function PreviousSelection() {
      return PreviousSelection.__super__.constructor.apply(this, arguments);
    }

    PreviousSelection.extend();

    PreviousSelection.prototype.wise = null;

    PreviousSelection.prototype.selectOnce = true;

    PreviousSelection.prototype.selectTextObject = function(selection) {
      var properties, ref2, submode;
      ref2 = this.vimState.previousSelection, properties = ref2.properties, submode = ref2.submode;
      if ((properties != null) && (submode != null)) {
        this.wise = submode;
        this.swrap(this.editor.getLastSelection()).selectByProperties(properties);
        return true;
      }
    };

    return PreviousSelection;

  })(TextObject);

  PersistentSelection = (function(superClass) {
    extend(PersistentSelection, superClass);

    function PersistentSelection() {
      return PersistentSelection.__super__.constructor.apply(this, arguments);
    }

    PersistentSelection.extend(false);

    PersistentSelection.deriveInnerAndA();

    PersistentSelection.prototype.wise = null;

    PersistentSelection.prototype.selectOnce = true;

    PersistentSelection.prototype.selectTextObject = function(selection) {
      if (this.vimState.hasPersistentSelections()) {
        this.vimState.persistentSelection.setSelectedBufferRanges();
        return true;
      }
    };

    return PersistentSelection;

  })(TextObject);

  VisibleArea = (function(superClass) {
    extend(VisibleArea, superClass);

    function VisibleArea() {
      return VisibleArea.__super__.constructor.apply(this, arguments);
    }

    VisibleArea.extend(false);

    VisibleArea.deriveInnerAndA();

    VisibleArea.prototype.selectOnce = true;

    VisibleArea.prototype.getRange = function(selection) {
      var bufferRange;
      bufferRange = getVisibleBufferRange(this.editor);
      if (bufferRange.getRows() > this.editor.getRowsPerPage()) {
        return bufferRange.translate([+1, 0], [-3, 0]);
      } else {
        return bufferRange;
      }
    };

    return VisibleArea;

  })(TextObject);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdGV4dC1vYmplY3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxvdkJBQUE7SUFBQTs7OztFQUFBLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUtKLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxPQWNJLE9BQUEsQ0FBUSxTQUFSLENBZEosRUFDRSw4REFERixFQUVFLDhFQUZGLEVBR0UsZ0VBSEYsRUFJRSx3REFKRixFQUtFLGtEQUxGLEVBTUUsa0RBTkYsRUFPRSxrQ0FQRixFQVFFLGdEQVJGLEVBU0UsMEJBVEYsRUFVRSw0QkFWRixFQVdFLDRDQVhGLEVBWUUsb0NBWkYsRUFhRTs7RUFFRixVQUFBLEdBQWE7O0VBRVA7OztJQUNKLFVBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7SUFDQSxVQUFDLENBQUEsYUFBRCxHQUFnQjs7eUJBQ2hCLElBQUEsR0FBTTs7eUJBQ04sWUFBQSxHQUFjOzt5QkFDZCxVQUFBLEdBQVk7O0lBRVosVUFBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQTtNQUNoQixJQUFDLENBQUEsYUFBRCxDQUFlLEdBQUEsR0FBTSxJQUFDLENBQUEsSUFBdEIsRUFBNEIsS0FBNUI7YUFDQSxJQUFDLENBQUEsYUFBRCxDQUFlLE9BQUEsR0FBVSxJQUFDLENBQUEsSUFBMUIsRUFBZ0MsSUFBaEM7SUFGZ0I7O0lBSWxCLFVBQUMsQ0FBQSxpQ0FBRCxHQUFvQyxTQUFBO01BQ2xDLElBQUMsQ0FBQSxhQUFELENBQWUsR0FBQSxHQUFNLElBQUMsQ0FBQSxJQUFQLEdBQWMsaUJBQTdCLEVBQWdELEtBQWhELEVBQXVELElBQXZEO2FBQ0EsSUFBQyxD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UUFDRSxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBUCxDQUFrQyxDQUFDLGtCQUFuQyxDQUFzRCxVQUF0RDtBQUNBLGVBQU8sS0FIVDs7SUFGZ0I7Ozs7S0FMWTs7RUFZMUI7Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztJQUNBLG1CQUFDLENBQUEsZUFBRCxDQUFBOztrQ0FDQSxJQUFBLEdBQU07O2tDQUNOLFVBQUEsR0FBWTs7a0NBRVosZ0JBQUEsR0FBa0IsU0FBQyxTQUFEO01BQ2hCLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyx1QkFBVixDQUFBLENBQUg7UUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLG1CQUFtQixDQUFDLHVCQUE5QixDQUFBO0FBQ0EsZUFBTyxLQUZUOztJQURnQjs7OztLQU5jOztFQVc1Qjs7Ozs7OztJQUNKLFdBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7SUFDQSxXQUFDLENBQUEsZUFBRCxDQUFBOzswQkFDQSxVQUFBLEdBQVk7OzBCQUVaLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFHUixVQUFBO01BQUEsV0FBQSxHQUFjLHFCQUFBLENBQXNCLElBQUMsQ0FBQSxNQUF2QjtNQUNkLElBQUcsV0FBVyxDQUFDLE9BQVosQ0FBQSxDQUFBLEdBQXdCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBLENBQTNCO2VBQ0UsV0FBVyxDQUFDLFNBQVosQ0FBc0IsQ0FBQyxDQUFDLENBQUYsRUFBSyxDQUFMLENBQXRCLEVBQStCLENBQUMsQ0FBQyxDQUFGLEVBQUssQ0FBTCxDQUEvQixFQURGO09BQUEsTUFBQTtlQUdFLFlBSEY7O0lBSlE7Ozs7S0FMYztBQXBxQjFCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuIyBbVE9ET10gTmVlZCBvdmVyaGF1bFxuIyAgLSBbIF0gTWFrZSBleHBhbmRhYmxlIGJ5IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnVuaW9uKEBnZXRSYW5nZShzZWxlY3Rpb24pKVxuIyAgLSBbIF0gQ291bnQgc3VwcG9ydChwcmlvcml0eSBsb3cpP1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbntcbiAgZ2V0TGluZVRleHRUb0J1ZmZlclBvc2l0aW9uXG4gIGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93XG4gIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3dcbiAgZXhwYW5kUmFuZ2VUb1doaXRlU3BhY2VzXG4gIGdldFZpc2libGVCdWZmZXJSYW5nZVxuICB0cmFuc2xhdGVQb2ludEFuZENsaXBcbiAgZ2V0QnVmZmVyUm93c1xuICBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICB0cmltUmFuZ2VcbiAgc29ydFJhbmdlc1xuICBwb2ludElzQXRFbmRPZkxpbmVcbiAgc3BsaXRBcmd1bWVudHNcbiAgdHJhdmVyc2VUZXh0RnJvbVBvaW50XG59ID0gcmVxdWlyZSAnLi91dGlscydcblBhaXJGaW5kZXIgPSBudWxsXG5cbmNsYXNzIFRleHRPYmplY3QgZXh0ZW5kcyBCYXNlXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBvcGVyYXRpb25LaW5kOiAndGV4dC1vYmplY3QnXG4gIHdpc2U6ICdjaGFyYWN0ZXJ3aXNlJ1xuICBzdXBwb3J0Q291bnQ6IGZhbHNlICMgRklYTUUgIzQ3MiwgIzY2XG4gIHNlbGVjdE9uY2U6IGZhbHNlXG5cbiAgQGRlcml2ZUlubmVyQW5kQTogLT5cbiAgICBAZ2VuZXJhdGVDbGFzcyhcIkFcIiArIEBuYW1lLCBmYWxzZSlcbiAgICBAZ2VuZXJhdGVDbGFzcyhcIklubmVyXCIgKyBAbmFtZSwgdHJ1ZSlcblxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nOiAtPlxuICAgIEBnZW5lcmF0ZUNsYXNzKFwiQVwiICsgQG5hbWUgKyBcIkFsbG93Rm9yd2FyZGluZ1wiLCBmYWxzZSwgdHJ1ZSlcbiAgICBAZ2VuZXJhdGVDbGFzcyhcIklubmVyXCIgKyBAbmFtZSArIFwiQWxsb3dGb3J3YXJkaW5nXCIsIHRydWUsIHRydWUpXG5cbiAgQGdlbmVyYXRlQ2xhc3M6IChrbGFzc05hbWUsIGlubmVyLCBhbGxvd0ZvcndhcmRpbmcpIC0+XG4gICAga2xhc3MgPSBjbGFzcyBleHRlbmRzIHRoaXNcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkga2xhc3MsICduYW1lJywgZ2V0OiAtPiBrbGFzc05hbWVcbiAgICBrbGFzczo6aW5uZXIgPSBpbm5lclxuICAgIGtsYXNzOjphbGxvd0ZvcndhcmRpbmcgPSB0cnVlIGlmIGFsbG93Rm9yd2FyZGluZ1xuICAgIGtsYXNzLmV4dGVuZCgpXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICBAaW5pdGlhbGl6ZSgpXG5cbiAgaXNJbm5lcjogLT5cbiAgICBAaW5uZXJcblxuICBpc0E6IC0+XG4gICAgbm90IEBpbm5lclxuXG4gIGlzTGluZXdpc2U6IC0+IEB3aXNlIGlzICdsaW5ld2lzZSdcbiAgaXNCbG9ja3dpc2U6IC0+IEB3aXNlIGlzICdibG9ja3dpc2UnXG5cbiAgZm9yY2VXaXNlOiAod2lzZSkgLT5cbiAgICBAd2lzZSA9IHdpc2UgIyBGSVhNRSBjdXJyZW50bHkgbm90IHdlbGwgc3VwcG9ydGVkXG5cbiAgcmVzZXRTdGF0ZTogLT5cbiAgICBAc2VsZWN0U3VjY2VlZGVkID0gbnVsbFxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHJlc2V0U3RhdGUoKVxuXG4gICAgIyBXaGVubmV2ZXIgVGV4dE9iamVjdCBpcyBleGVjdXRlZCwgaXQgaGFzIEBvcGVyYXRvclxuICAgICMgQ2FsbGVkIGZyb20gT3BlcmF0b3I6OnNlbGVjdFRhcmdldCgpXG4gICAgIyAgLSBgdiBpIHBgLCBpcyBgU2VsZWN0YCBvcGVyYXRvciB3aXRoIEB0YXJnZXQgPSBgSW5uZXJQYXJhZ3JhcGhgLlxuICAgICMgIC0gYGQgaSBwYCwgaXMgYERlbGV0ZWAgb3BlcmF0b3Igd2l0aCBAdGFyZ2V0ID0gYElubmVyUGFyYWdyYXBoYC5cbiAgICBpZiBAb3BlcmF0b3I/XG4gICAgICBAc2VsZWN0KClcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luIFRleHRPYmplY3Q6IE11c3Qgbm90IGhhcHBlbicpXG5cbiAgc2VsZWN0OiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgQHN3cmFwLm5vcm1hbGl6ZShAZWRpdG9yKVxuXG4gICAgQGNvdW50VGltZXMgQGdldENvdW50KCksICh7c3RvcH0pID0+XG4gICAgICBzdG9wKCkgdW5sZXNzIEBzdXBwb3J0Q291bnQgIyBxdWljay1maXggZm9yICM1NjBcbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgb2xkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBpZiBAc2VsZWN0VGV4dE9iamVjdChzZWxlY3Rpb24pXG4gICAgICAgICAgQHNlbGVjdFN1Y2NlZWRlZCA9IHRydWVcbiAgICAgICAgc3RvcCgpIGlmIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmlzRXF1YWwob2xkUmFuZ2UpXG4gICAgICAgIGJyZWFrIGlmIEBzZWxlY3RPbmNlXG5cbiAgICBAZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgIyBTb21lIFRleHRPYmplY3QncyB3aXNlIGlzIE5PVCBkZXRlcm1pbmlzdGljLiBJdCBoYXMgdG8gYmUgZGV0ZWN0ZWQgZnJvbSBzZWxlY3RlZCByYW5nZS5cbiAgICBAd2lzZSA/PSBAc3dyYXAuZGV0ZWN0V2lzZShAZWRpdG9yKVxuXG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIGlmIEBzZWxlY3RTdWNjZWVkZWRcbiAgICAgICAgc3dpdGNoIEB3aXNlXG4gICAgICAgICAgd2hlbiAnY2hhcmFjdGVyd2lzZSdcbiAgICAgICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXMoKSBmb3IgJHNlbGVjdGlvbiBpbiBAc3dyYXAuZ2V0U2VsZWN0aW9ucyhAZWRpdG9yKVxuICAgICAgICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgICAgICAgIyBXaGVuIHRhcmdldCBpcyBwZXJzaXN0ZW50LXNlbGVjdGlvbiwgbmV3IHNlbGVjdGlvbiBpcyBhZGRlZCBhZnRlciBzZWxlY3RUZXh0T2JqZWN0LlxuICAgICAgICAgICAgIyBTbyB3ZSBoYXZlIHRvIGFzc3VyZSBhbGwgc2VsZWN0aW9uIGhhdmUgc2VsY3Rpb24gcHJvcGVydHkuXG4gICAgICAgICAgICAjIE1heWJlIHRoaXMgbG9naWMgY2FuIGJlIG1vdmVkIHRvIG9wZXJhdGlvbiBzdGFjay5cbiAgICAgICAgICAgIGZvciAkc2VsZWN0aW9uIGluIEBzd3JhcC5nZXRTZWxlY3Rpb25zKEBlZGl0b3IpXG4gICAgICAgICAgICAgIGlmIEBnZXRDb25maWcoJ2tlZXBDb2x1bW5PblNlbGVjdFRleHRPYmplY3QnKVxuICAgICAgICAgICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXMoKSB1bmxlc3MgJHNlbGVjdGlvbi5oYXNQcm9wZXJ0aWVzKClcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXMoKVxuICAgICAgICAgICAgICAkc2VsZWN0aW9uLmZpeFByb3BlcnR5Um93VG9Sb3dSYW5nZSgpXG5cbiAgICAgIGlmIEBzdWJtb2RlIGlzICdibG9ja3dpc2UnXG4gICAgICAgIGZvciAkc2VsZWN0aW9uIGluIEBzd3JhcC5nZXRTZWxlY3Rpb25zKEBlZGl0b3IpXG4gICAgICAgICAgJHNlbGVjdGlvbi5ub3JtYWxpemUoKVxuICAgICAgICAgICRzZWxlY3Rpb24uYXBwbHlXaXNlKCdibG9ja3dpc2UnKVxuXG4gICMgUmV0dXJuIHRydWUgb3IgZmFsc2VcbiAgc2VsZWN0VGV4dE9iamVjdDogKHNlbGVjdGlvbikgLT5cbiAgICBpZiByYW5nZSA9IEBnZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgICBAc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgIyB0byBvdmVycmlkZVxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBudWxsXG5cbiMgU2VjdGlvbjogV29yZFxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBXb3JkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBwb2ludCA9IEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAge3JhbmdlfSA9IEBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbihwb2ludCwge0B3b3JkUmVnZXh9KVxuICAgIGlmIEBpc0EoKVxuICAgICAgZXhwYW5kUmFuZ2VUb1doaXRlU3BhY2VzKEBlZGl0b3IsIHJhbmdlKVxuICAgIGVsc2VcbiAgICAgIHJhbmdlXG5cbmNsYXNzIFdob2xlV29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIHdvcmRSZWdleDogL1xcUysvXG5cbiMgSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFNtYXJ0V29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIEBkZXNjcmlwdGlvbjogXCJBIHdvcmQgdGhhdCBjb25zaXN0cyBvZiBhbHBoYW51bWVyaWMgY2hhcnMoYC9bQS1aYS16MC05X10vYCkgYW5kIGh5cGhlbiBgLWBcIlxuICB3b3JkUmVnZXg6IC9bXFx3LV0rL1xuXG4jIEp1c3QgaW5jbHVkZSBfLCAtXG5jbGFzcyBTdWJ3b3JkIGV4dGVuZHMgV29yZFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgQHdvcmRSZWdleCA9IHNlbGVjdGlvbi5jdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgc3VwZXJcblxuIyBTZWN0aW9uOiBQYWlyXG4jID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFBhaXIgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIHN1cHBvcnRDb3VudDogdHJ1ZVxuICBhbGxvd05leHRMaW5lOiBudWxsXG4gIGFkanVzdElubmVyUmFuZ2U6IHRydWVcbiAgcGFpcjogbnVsbFxuICBpbmNsdXNpdmU6IHRydWVcblxuICBpbml0aWFsaXplOiAtPlxuICAgIFBhaXJGaW5kZXIgPz0gcmVxdWlyZSAnLi9wYWlyLWZpbmRlci5jb2ZmZWUnXG4gICAgc3VwZXJcblxuXG4gIGlzQWxsb3dOZXh0TGluZTogLT5cbiAgICBAYWxsb3dOZXh0TGluZSA/IChAcGFpcj8gYW5kIEBwYWlyWzBdIGlzbnQgQHBhaXJbMV0pXG5cbiAgYWRqdXN0UmFuZ2U6ICh7c3RhcnQsIGVuZH0pIC0+XG4gICAgIyBEaXJ0eSB3b3JrIHRvIGZlZWwgbmF0dXJhbCBmb3IgaHVtYW4sIHRvIGJlaGF2ZSBjb21wYXRpYmxlIHdpdGggcHVyZSBWaW0uXG4gICAgIyBXaGVyZSB0aGlzIGFkanVzdG1lbnQgYXBwZWFyIGlzIGluIGZvbGxvd2luZyBzaXR1YXRpb24uXG4gICAgIyBvcC0xOiBgY2l7YCByZXBsYWNlIG9ubHkgMm5kIGxpbmVcbiAgICAjIG9wLTI6IGBkaXtgIGRlbGV0ZSBvbmx5IDJuZCBsaW5lLlxuICAgICMgdGV4dDpcbiAgICAjICB7XG4gICAgIyAgICBhYWFcbiAgICAjICB9XG4gICAgaWYgcG9pbnRJc0F0RW5kT2ZMaW5lKEBlZGl0b3IsIHN0YXJ0KVxuICAgICAgc3RhcnQgPSBzdGFydC50cmF2ZXJzZShbMSwgMF0pXG5cbiAgICBpZiBnZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb24oQGVkaXRvciwgZW5kKS5tYXRjaCgvXlxccyokLylcbiAgICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICAgICMgVGhpcyBpcyBzbGlnaHRseSBpbm5jb25zaXN0ZW50IHdpdGggcmVndWxhciBWaW1cbiAgICAgICAgIyAtIHJlZ3VsYXIgVmltOiBzZWxlY3QgbmV3IGxpbmUgYWZ0ZXIgRU9MXG4gICAgICAgICMgLSB2aW0tbW9kZS1wbHVzOiBzZWxlY3QgdG8gRU9MKGJlZm9yZSBuZXcgbGluZSlcbiAgICAgICAgIyBUaGlzIGlzIGludGVudGlvbmFsIHNpbmNlIHRvIG1ha2Ugc3VibW9kZSBgY2hhcmFjdGVyd2lzZWAgd2hlbiBhdXRvLWRldGVjdCBzdWJtb2RlXG4gICAgICAgICMgaW5uZXJFbmQgPSBuZXcgUG9pbnQoaW5uZXJFbmQucm93IC0gMSwgSW5maW5pdHkpXG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93IC0gMSwgSW5maW5pdHkpXG4gICAgICBlbHNlXG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93LCAwKVxuXG4gICAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG5cbiAgZ2V0RmluZGVyOiAtPlxuICAgIG9wdGlvbnMgPSB7YWxsb3dOZXh0TGluZTogQGlzQWxsb3dOZXh0TGluZSgpLCBAYWxsb3dGb3J3YXJkaW5nLCBAcGFpciwgQGluY2x1c2l2ZX1cbiAgICBpZiBAcGFpclswXSBpcyBAcGFpclsxXVxuICAgICAgbmV3IFBhaXJGaW5kZXIuUXVvdGVGaW5kZXIoQGVkaXRvciwgb3B0aW9ucylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFpckZpbmRlci5CcmFja2V0RmluZGVyKEBlZGl0b3IsIG9wdGlvbnMpXG5cbiAgZ2V0UGFpckluZm86IChmcm9tKSAtPlxuICAgIHBhaXJJbmZvID0gQGdldEZpbmRlcigpLmZpbmQoZnJvbSlcbiAgICB1bmxlc3MgcGFpckluZm8/XG4gICAgICByZXR1cm4gbnVsbFxuICAgIHBhaXJJbmZvLmlubmVyUmFuZ2UgPSBAYWRqdXN0UmFuZ2UocGFpckluZm8uaW5uZXJSYW5nZSkgaWYgQGFkanVzdElubmVyUmFuZ2VcbiAgICBwYWlySW5mby50YXJnZXRSYW5nZSA9IGlmIEBpc0lubmVyKCkgdGhlbiBwYWlySW5mby5pbm5lclJhbmdlIGVsc2UgcGFpckluZm8uYVJhbmdlXG4gICAgcGFpckluZm9cblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBwYWlySW5mbyA9IEBnZXRQYWlySW5mbyhAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKSlcbiAgICAjIFdoZW4gcmFuZ2Ugd2FzIHNhbWUsIHRyeSB0byBleHBhbmQgcmFuZ2VcbiAgICBpZiBwYWlySW5mbz8udGFyZ2V0UmFuZ2UuaXNFcXVhbChvcmlnaW5hbFJhbmdlKVxuICAgICAgcGFpckluZm8gPSBAZ2V0UGFpckluZm8ocGFpckluZm8uYVJhbmdlLmVuZClcbiAgICBwYWlySW5mbz8udGFyZ2V0UmFuZ2VcblxuIyBVc2VkIGJ5IERlbGV0ZVN1cnJvdW5kXG5jbGFzcyBBUGFpciBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcblxuY2xhc3MgQW55UGFpciBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIGFsbG93Rm9yd2FyZGluZzogZmFsc2VcbiAgbWVtYmVyOiBbXG4gICAgJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJyxcbiAgICAnQ3VybHlCcmFja2V0JywgJ0FuZ2xlQnJhY2tldCcsICdTcXVhcmVCcmFja2V0JywgJ1BhcmVudGhlc2lzJ1xuICBdXG5cbiAgZ2V0UmFuZ2VzOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBtZW1iZXJcbiAgICAgIC5tYXAgKGtsYXNzKSA9PiBAbmV3KGtsYXNzLCB7QGlubmVyLCBAYWxsb3dGb3J3YXJkaW5nLCBAaW5jbHVzaXZlfSkuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgLmZpbHRlciAocmFuZ2UpIC0+IHJhbmdlP1xuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIF8ubGFzdChzb3J0UmFuZ2VzKEBnZXRSYW5nZXMoc2VsZWN0aW9uKSkpXG5cbmNsYXNzIEFueVBhaXJBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBBbnlQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVzY3JpcHRpb246IFwiUmFuZ2Ugc3Vycm91bmRlZCBieSBhdXRvLWRldGVjdGVkIHBhaXJlZCBjaGFycyBmcm9tIGVuY2xvc2VkIGFuZCBmb3J3YXJkaW5nIGFyZWFcIlxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2VzID0gQGdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgZnJvbSA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIFtmb3J3YXJkaW5nUmFuZ2VzLCBlbmNsb3NpbmdSYW5nZXNdID0gXy5wYXJ0aXRpb24gcmFuZ2VzLCAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChmcm9tKVxuICAgIGVuY2xvc2luZ1JhbmdlID0gXy5sYXN0KHNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKSlcbiAgICBmb3J3YXJkaW5nUmFuZ2VzID0gc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgIyBXaGVuIGVuY2xvc2luZ1JhbmdlIGlzIGV4aXN0cyxcbiAgICAjIFdlIGRvbid0IGdvIGFjcm9zcyBlbmNsb3NpbmdSYW5nZS5lbmQuXG4gICAgIyBTbyBjaG9vc2UgZnJvbSByYW5nZXMgY29udGFpbmVkIGluIGVuY2xvc2luZ1JhbmdlLlxuICAgIGlmIGVuY2xvc2luZ1JhbmdlXG4gICAgICBmb3J3YXJkaW5nUmFuZ2VzID0gZm9yd2FyZGluZ1Jhbmdlcy5maWx0ZXIgKHJhbmdlKSAtPlxuICAgICAgICBlbmNsb3NpbmdSYW5nZS5jb250YWluc1JhbmdlKHJhbmdlKVxuXG4gICAgZm9yd2FyZGluZ1Jhbmdlc1swXSBvciBlbmNsb3NpbmdSYW5nZVxuXG5jbGFzcyBBbnlRdW90ZSBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBtZW1iZXI6IFsnRG91YmxlUXVvdGUnLCAnU2luZ2xlUXVvdGUnLCAnQmFja1RpY2snXVxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZXMgPSBAZ2V0UmFuZ2VzKHNlbGVjdGlvbilcbiAgICAjIFBpY2sgcmFuZ2Ugd2hpY2ggZW5kLmNvbHVtIGlzIGxlZnRtb3N0KG1lYW4sIGNsb3NlZCBmaXJzdClcbiAgICBfLmZpcnN0KF8uc29ydEJ5KHJhbmdlcywgKHIpIC0+IHIuZW5kLmNvbHVtbikpIGlmIHJhbmdlcy5sZW5ndGhcblxuY2xhc3MgUXVvdGUgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG5jbGFzcyBEb3VibGVRdW90ZSBleHRlbmRzIFF1b3RlXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBwYWlyOiBbJ1wiJywgJ1wiJ11cblxuY2xhc3MgU2luZ2xlUXVvdGUgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgcGFpcjogW1wiJ1wiLCBcIidcIl1cblxuY2xhc3MgQmFja1RpY2sgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgcGFpcjogWydgJywgJ2AnXVxuXG5jbGFzcyBDdXJseUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKClcbiAgcGFpcjogWyd7JywgJ30nXVxuXG5jbGFzcyBTcXVhcmVCcmFja2V0IGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgQGRlcml2ZUlubmVyQW5kQUZvckFsbG93Rm9yd2FyZGluZygpXG4gIHBhaXI6IFsnWycsICddJ11cblxuY2xhc3MgUGFyZW50aGVzaXMgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKClcbiAgcGFpcjogWycoJywgJyknXVxuXG5jbGFzcyBBbmdsZUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKClcbiAgcGFpcjogWyc8JywgJz4nXVxuXG5jbGFzcyBUYWcgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBhbGxvd05leHRMaW5lOiB0cnVlXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBhZGp1c3RJbm5lclJhbmdlOiBmYWxzZVxuXG4gIGdldFRhZ1N0YXJ0UG9pbnQ6IChmcm9tKSAtPlxuICAgIHRhZ1JhbmdlID0gbnVsbFxuICAgIHBhdHRlcm4gPSBQYWlyRmluZGVyLlRhZ0ZpbmRlcjo6cGF0dGVyblxuICAgIEBzY2FuRm9yd2FyZCBwYXR0ZXJuLCB7ZnJvbTogW2Zyb20ucm93LCAwXX0sICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuY29udGFpbnNQb2ludChmcm9tLCB0cnVlKVxuICAgICAgICB0YWdSYW5nZSA9IHJhbmdlXG4gICAgICAgIHN0b3AoKVxuICAgIHRhZ1JhbmdlPy5zdGFydFxuXG4gIGdldEZpbmRlcjogLT5cbiAgICBuZXcgUGFpckZpbmRlci5UYWdGaW5kZXIoQGVkaXRvciwge2FsbG93TmV4dExpbmU6IEBpc0FsbG93TmV4dExpbmUoKSwgQGFsbG93Rm9yd2FyZGluZywgQGluY2x1c2l2ZX0pXG5cbiAgZ2V0UGFpckluZm86IChmcm9tKSAtPlxuICAgIHN1cGVyKEBnZXRUYWdTdGFydFBvaW50KGZyb20pID8gZnJvbSlcblxuIyBTZWN0aW9uOiBQYXJhZ3JhcGhcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuIyBQYXJhZ3JhcGggaXMgZGVmaW5lZCBhcyBjb25zZWN1dGl2ZSAobm9uLSlibGFuay1saW5lLlxuY2xhc3MgUGFyYWdyYXBoIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBzdXBwb3J0Q291bnQ6IHRydWVcblxuICBmaW5kUm93OiAoZnJvbVJvdywgZGlyZWN0aW9uLCBmbikgLT5cbiAgICBmbi5yZXNldD8oKVxuICAgIGZvdW5kUm93ID0gZnJvbVJvd1xuICAgIGZvciByb3cgaW4gZ2V0QnVmZmVyUm93cyhAZWRpdG9yLCB7c3RhcnRSb3c6IGZyb21Sb3csIGRpcmVjdGlvbn0pXG4gICAgICBicmVhayB1bmxlc3MgZm4ocm93LCBkaXJlY3Rpb24pXG4gICAgICBmb3VuZFJvdyA9IHJvd1xuXG4gICAgZm91bmRSb3dcblxuICBmaW5kUm93UmFuZ2VCeTogKGZyb21Sb3csIGZuKSAtPlxuICAgIHN0YXJ0Um93ID0gQGZpbmRSb3coZnJvbVJvdywgJ3ByZXZpb3VzJywgZm4pXG4gICAgZW5kUm93ID0gQGZpbmRSb3coZnJvbVJvdywgJ25leHQnLCBmbilcbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuICBnZXRQcmVkaWN0RnVuY3Rpb246IChmcm9tUm93LCBzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvd1Jlc3VsdCA9IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhmcm9tUm93KVxuXG4gICAgaWYgQGlzSW5uZXIoKVxuICAgICAgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT5cbiAgICAgICAgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgaXMgZnJvbVJvd1Jlc3VsdFxuICAgIGVsc2VcbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgZGlyZWN0aW9uVG9FeHRlbmQgPSAncHJldmlvdXMnXG4gICAgICBlbHNlXG4gICAgICAgIGRpcmVjdGlvblRvRXh0ZW5kID0gJ25leHQnXG5cbiAgICAgIGZsaXAgPSBmYWxzZVxuICAgICAgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT5cbiAgICAgICAgcmVzdWx0ID0gQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgaXMgZnJvbVJvd1Jlc3VsdFxuICAgICAgICBpZiBmbGlwXG4gICAgICAgICAgbm90IHJlc3VsdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgKG5vdCByZXN1bHQpIGFuZCAoZGlyZWN0aW9uIGlzIGRpcmVjdGlvblRvRXh0ZW5kKVxuICAgICAgICAgICAgZmxpcCA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgcmVzdWx0XG5cbiAgICAgIHByZWRpY3QucmVzZXQgPSAtPlxuICAgICAgICBmbGlwID0gZmFsc2VcbiAgICBwcmVkaWN0XG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgb3JpZ2luYWxSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgZnJvbVJvdyA9IEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdsaW5ld2lzZScpXG4gICAgICBpZiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICAgIGZyb21Sb3ctLVxuICAgICAgZWxzZVxuICAgICAgICBmcm9tUm93KytcbiAgICAgIGZyb21Sb3cgPSBnZXRWYWxpZFZpbUJ1ZmZlclJvdyhAZWRpdG9yLCBmcm9tUm93KVxuXG4gICAgcm93UmFuZ2UgPSBAZmluZFJvd1JhbmdlQnkoZnJvbVJvdywgQGdldFByZWRpY3RGdW5jdGlvbihmcm9tUm93LCBzZWxlY3Rpb24pKVxuICAgIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnVuaW9uKEBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKHJvd1JhbmdlKSlcblxuY2xhc3MgSW5kZW50YXRpb24gZXh0ZW5kcyBQYXJhZ3JhcGhcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvdyA9IEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuXG4gICAgYmFzZUluZGVudExldmVsID0gQGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KGZyb21Sb3cpXG4gICAgcHJlZGljdCA9IChyb3cpID0+XG4gICAgICBpZiBAZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KVxuICAgICAgICBAaXNBKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KHJvdykgPj0gYmFzZUluZGVudExldmVsXG5cbiAgICByb3dSYW5nZSA9IEBmaW5kUm93UmFuZ2VCeShmcm9tUm93LCBwcmVkaWN0KVxuICAgIEBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKHJvd1JhbmdlKVxuXG4jIFNlY3Rpb246IENvbW1lbnRcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ29tbWVudCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByb3cgPSBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICByb3dSYW5nZSA9IEBlZGl0b3IubGFuZ3VhZ2VNb2RlLnJvd1JhbmdlRm9yQ29tbWVudEF0QnVmZmVyUm93KHJvdylcbiAgICByb3dSYW5nZSA/PSBbcm93LCByb3ddIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQocm93KVxuICAgIGlmIHJvd1JhbmdlP1xuICAgICAgQGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2Uocm93UmFuZ2UpXG5cbmNsYXNzIENvbW1lbnRPclBhcmFncmFwaCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBmb3Iga2xhc3MgaW4gWydDb21tZW50JywgJ1BhcmFncmFwaCddXG4gICAgICBpZiByYW5nZSA9IEBuZXcoa2xhc3MsIHtAaW5uZXJ9KS5nZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgICAgIHJldHVybiByYW5nZVxuXG4jIFNlY3Rpb246IEZvbGRcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRm9sZCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBhZGp1c3RSb3dSYW5nZTogKHJvd1JhbmdlKSAtPlxuICAgIHJldHVybiByb3dSYW5nZSBpZiBAaXNBKClcblxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IHJvd1JhbmdlXG4gICAgaWYgQGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KHN0YXJ0Um93KSBpcyBAZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coZW5kUm93KVxuICAgICAgZW5kUm93IC09IDFcbiAgICBzdGFydFJvdyArPSAxXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddXG5cbiAgZ2V0Rm9sZFJvd1Jhbmdlc0NvbnRhaW5zRm9yUm93OiAocm93KSAtPlxuICAgIGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93KEBlZGl0b3IsIHJvdykucmV2ZXJzZSgpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcm93ID0gQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikucm93XG4gICAgc2VsZWN0ZWRSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgZm9yIHJvd1JhbmdlIGluIEBnZXRGb2xkUm93UmFuZ2VzQ29udGFpbnNGb3JSb3cocm93KVxuICAgICAgcmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShAYWRqdXN0Um93UmFuZ2Uocm93UmFuZ2UpKVxuXG4gICAgICAjIERvbid0IGNoYW5nZSB0byBgaWYgcmFuZ2UuY29udGFpbnNSYW5nZShzZWxlY3RlZFJhbmdlLCB0cnVlKWBcbiAgICAgICMgVGhlcmUgaXMgYmVoYXZpb3IgZGlmZiB3aGVuIGN1cnNvciBpcyBhdCBiZWdpbm5pbmcgb2YgbGluZSggY29sdW1uIDAgKS5cbiAgICAgIHVubGVzcyBzZWxlY3RlZFJhbmdlLmNvbnRhaW5zUmFuZ2UocmFuZ2UpXG4gICAgICAgIHJldHVybiByYW5nZVxuXG4jIE5PVEU6IEZ1bmN0aW9uIHJhbmdlIGRldGVybWluYXRpb24gaXMgZGVwZW5kaW5nIG9uIGZvbGQuXG5jbGFzcyBGdW5jdGlvbiBleHRlbmRzIEZvbGRcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gICMgU29tZSBsYW5ndWFnZSBkb24ndCBpbmNsdWRlIGNsb3NpbmcgYH1gIGludG8gZm9sZC5cbiAgc2NvcGVOYW1lc09taXR0aW5nRW5kUm93OiBbJ3NvdXJjZS5nbycsICdzb3VyY2UuZWxpeGlyJ11cblxuICBnZXRGb2xkUm93UmFuZ2VzQ29udGFpbnNGb3JSb3c6IChyb3cpIC0+XG4gICAgKHN1cGVyKS5maWx0ZXIgKHJvd1JhbmdlKSA9PlxuICAgICAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhAZWRpdG9yLCByb3dSYW5nZVswXSlcblxuICBhZGp1c3RSb3dSYW5nZTogKHJvd1JhbmdlKSAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IHN1cGVyXG4gICAgIyBOT1RFOiBUaGlzIGFkanVzdG1lbnQgc2hvdWQgbm90IGJlIG5lY2Vzc2FyeSBpZiBsYW5ndWFnZS1zeW50YXggaXMgcHJvcGVybHkgZGVmaW5lZC5cbiAgICBpZiBAaXNBKCkgYW5kIEBlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSBpbiBAc2NvcGVOYW1lc09taXR0aW5nRW5kUm93XG4gICAgICBlbmRSb3cgKz0gMVxuICAgIFtzdGFydFJvdywgZW5kUm93XVxuXG4jIFNlY3Rpb246IE90aGVyXG4jID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEFyZ3VtZW50cyBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG5cbiAgbmV3QXJnSW5mbzogKGFyZ1N0YXJ0LCBhcmcsIHNlcGFyYXRvcikgLT5cbiAgICBhcmdFbmQgPSB0cmF2ZXJzZVRleHRGcm9tUG9pbnQoYXJnU3RhcnQsIGFyZylcbiAgICBhcmdSYW5nZSA9IG5ldyBSYW5nZShhcmdTdGFydCwgYXJnRW5kKVxuXG4gICAgc2VwYXJhdG9yRW5kID0gdHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ0VuZCwgc2VwYXJhdG9yID8gJycpXG4gICAgc2VwYXJhdG9yUmFuZ2UgPSBuZXcgUmFuZ2UoYXJnRW5kLCBzZXBhcmF0b3JFbmQpXG5cbiAgICBpbm5lclJhbmdlID0gYXJnUmFuZ2VcbiAgICBhUmFuZ2UgPSBhcmdSYW5nZS51bmlvbihzZXBhcmF0b3JSYW5nZSlcbiAgICB7YXJnUmFuZ2UsIHNlcGFyYXRvclJhbmdlLCBpbm5lclJhbmdlLCBhUmFuZ2V9XG5cbiAgZ2V0QXJndW1lbnRzUmFuZ2VGb3JTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgbWVtYmVyID0gW1xuICAgICAgJ0N1cmx5QnJhY2tldCdcbiAgICAgICdTcXVhcmVCcmFja2V0J1xuICAgICAgJ1BhcmVudGhlc2lzJ1xuICAgIF1cbiAgICBAbmV3KFwiSW5uZXJBbnlQYWlyXCIsIHtpbmNsdXNpdmU6IGZhbHNlLCBtZW1iZXI6IG1lbWJlcn0pLmdldFJhbmdlKHNlbGVjdGlvbilcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZSA9IEBnZXRBcmd1bWVudHNSYW5nZUZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgcGFpclJhbmdlRm91bmQgPSByYW5nZT9cbiAgICByYW5nZSA/PSBAbmV3KFwiSW5uZXJDdXJyZW50TGluZVwiKS5nZXRSYW5nZShzZWxlY3Rpb24pICMgZmFsbGJhY2tcbiAgICByZXR1cm4gdW5sZXNzIHJhbmdlXG5cbiAgICByYW5nZSA9IHRyaW1SYW5nZShAZWRpdG9yLCByYW5nZSlcblxuICAgIHRleHQgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIGFsbFRva2VucyA9IHNwbGl0QXJndW1lbnRzKHRleHQsIHBhaXJSYW5nZUZvdW5kKVxuXG4gICAgYXJnSW5mb3MgPSBbXVxuICAgIGFyZ1N0YXJ0ID0gcmFuZ2Uuc3RhcnRcblxuICAgICMgU2tpcCBzdGFydGluZyBzZXBhcmF0b3JcbiAgICBpZiBhbGxUb2tlbnMubGVuZ3RoIGFuZCBhbGxUb2tlbnNbMF0udHlwZSBpcyAnc2VwYXJhdG9yJ1xuICAgICAgdG9rZW4gPSBhbGxUb2tlbnMuc2hpZnQoKVxuICAgICAgYXJnU3RhcnQgPSB0cmF2ZXJzZVRleHRGcm9tUG9pbnQoYXJnU3RhcnQsIHRva2VuLnRleHQpXG5cbiAgICB3aGlsZSBhbGxUb2tlbnMubGVuZ3RoXG4gICAgICB0b2tlbiA9IGFsbFRva2Vucy5zaGlmdCgpXG4gICAgICBpZiB0b2tlbi50eXBlIGlzICdhcmd1bWVudCdcbiAgICAgICAgc2VwYXJhdG9yID0gYWxsVG9rZW5zLnNoaWZ0KCk/LnRleHRcbiAgICAgICAgYXJnSW5mbyA9IEBuZXdBcmdJbmZvKGFyZ1N0YXJ0LCB0b2tlbi50ZXh0LCBzZXBhcmF0b3IpXG5cbiAgICAgICAgaWYgKGFsbFRva2Vucy5sZW5ndGggaXMgMCkgYW5kIChsYXN0QXJnSW5mbyA9IF8ubGFzdChhcmdJbmZvcykpXG4gICAgICAgICAgYXJnSW5mby5hUmFuZ2UgPSBhcmdJbmZvLmFyZ1JhbmdlLnVuaW9uKGxhc3RBcmdJbmZvLnNlcGFyYXRvclJhbmdlKVxuXG4gICAgICAgIGFyZ1N0YXJ0ID0gYXJnSW5mby5hUmFuZ2UuZW5kXG4gICAgICAgIGFyZ0luZm9zLnB1c2goYXJnSW5mbylcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtdXN0IG5vdCBoYXBwZW4nKVxuXG4gICAgcG9pbnQgPSBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGZvciB7aW5uZXJSYW5nZSwgYVJhbmdlfSBpbiBhcmdJbmZvc1xuICAgICAgaWYgaW5uZXJSYW5nZS5lbmQuaXNHcmVhdGVyVGhhbk9yRXF1YWwocG9pbnQpXG4gICAgICAgIHJldHVybiBpZiBAaXNJbm5lcigpIHRoZW4gaW5uZXJSYW5nZSBlbHNlIGFSYW5nZVxuICAgIG51bGxcblxuY2xhc3MgQ3VycmVudExpbmUgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJvdyA9IEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIHJhbmdlID0gQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhyb3cpXG4gICAgaWYgQGlzQSgpXG4gICAgICByYW5nZVxuICAgIGVsc2VcbiAgICAgIHRyaW1SYW5nZShAZWRpdG9yLCByYW5nZSlcblxuY2xhc3MgRW50aXJlIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBzZWxlY3RPbmNlOiB0cnVlXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgQGVkaXRvci5idWZmZXIuZ2V0UmFuZ2UoKVxuXG5jbGFzcyBFbXB0eSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgc2VsZWN0T25jZTogdHJ1ZVxuXG5jbGFzcyBMYXRlc3RDaGFuZ2UgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICB3aXNlOiBudWxsXG4gIHNlbGVjdE9uY2U6IHRydWVcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgc3RhcnQgPSBAdmltU3RhdGUubWFyay5nZXQoJ1snKVxuICAgIGVuZCA9IEB2aW1TdGF0ZS5tYXJrLmdldCgnXScpXG4gICAgaWYgc3RhcnQ/IGFuZCBlbmQ/XG4gICAgICBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcblxuY2xhc3MgU2VhcmNoTWF0Y2hGb3J3YXJkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmQ6IGZhbHNlXG5cbiAgZmluZE1hdGNoOiAoZnJvbVBvaW50LCBwYXR0ZXJuKSAtPlxuICAgIGZyb21Qb2ludCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCBmcm9tUG9pbnQsIFwiZm9yd2FyZFwiKSBpZiAoQG1vZGUgaXMgJ3Zpc3VhbCcpXG4gICAgZm91bmQgPSBudWxsXG4gICAgQHNjYW5Gb3J3YXJkIHBhdHRlcm4sIHtmcm9tOiBbZnJvbVBvaW50LnJvdywgMF19LCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB7cmFuZ2U6IGZvdW5kLCB3aGljaElzSGVhZDogJ2VuZCd9XG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcGF0dGVybiA9IEBnbG9iYWxTdGF0ZS5nZXQoJ2xhc3RTZWFyY2hQYXR0ZXJuJylcbiAgICByZXR1cm4gdW5sZXNzIHBhdHRlcm4/XG5cbiAgICBmcm9tUG9pbnQgPSBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB7cmFuZ2UsIHdoaWNoSXNIZWFkfSA9IEBmaW5kTWF0Y2goZnJvbVBvaW50LCBwYXR0ZXJuKVxuICAgIGlmIHJhbmdlP1xuICAgICAgQHVuaW9uUmFuZ2VBbmREZXRlcm1pbmVSZXZlcnNlZFN0YXRlKHNlbGVjdGlvbiwgcmFuZ2UsIHdoaWNoSXNIZWFkKVxuXG4gIHVuaW9uUmFuZ2VBbmREZXRlcm1pbmVSZXZlcnNlZFN0YXRlOiAoc2VsZWN0aW9uLCBmb3VuZCwgd2hpY2hJc0hlYWQpIC0+XG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgZm91bmRcbiAgICBlbHNlXG4gICAgICBoZWFkID0gZm91bmRbd2hpY2hJc0hlYWRdXG4gICAgICB0YWlsID0gc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIGlmIEBiYWNrd2FyZFxuICAgICAgICBoZWFkID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGhlYWQsICdmb3J3YXJkJykgaWYgdGFpbC5pc0xlc3NUaGFuKGhlYWQpXG4gICAgICBlbHNlXG4gICAgICAgIGhlYWQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgaGVhZCwgJ2JhY2t3YXJkJykgaWYgaGVhZC5pc0xlc3NUaGFuKHRhaWwpXG5cbiAgICAgIEByZXZlcnNlZCA9IGhlYWQuaXNMZXNzVGhhbih0YWlsKVxuICAgICAgbmV3IFJhbmdlKHRhaWwsIGhlYWQpLnVuaW9uKEBzd3JhcChzZWxlY3Rpb24pLmdldFRhaWxCdWZmZXJSYW5nZSgpKVxuXG4gIHNlbGVjdFRleHRPYmplY3Q6IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgcmFuZ2UgPSBAZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgQHN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZDogQHJldmVyc2VkID8gQGJhY2t3YXJkfSlcbiAgICAgIHJldHVybiB0cnVlXG5cbmNsYXNzIFNlYXJjaE1hdGNoQmFja3dhcmQgZXh0ZW5kcyBTZWFyY2hNYXRjaEZvcndhcmRcbiAgQGV4dGVuZCgpXG4gIGJhY2t3YXJkOiB0cnVlXG5cbiAgZmluZE1hdGNoOiAoZnJvbVBvaW50LCBwYXR0ZXJuKSAtPlxuICAgIGZyb21Qb2ludCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCBmcm9tUG9pbnQsIFwiYmFja3dhcmRcIikgaWYgKEBtb2RlIGlzICd2aXN1YWwnKVxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBzY2FuQmFja3dhcmQgcGF0dGVybiwge2Zyb206IFtmcm9tUG9pbnQucm93LCBJbmZpbml0eV19LCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oZnJvbVBvaW50KVxuICAgICAgICBmb3VuZCA9IHJhbmdlXG4gICAgICAgIHN0b3AoKVxuICAgIHtyYW5nZTogZm91bmQsIHdoaWNoSXNIZWFkOiAnc3RhcnQnfVxuXG4jIFtMaW1pdGF0aW9uOiB3b24ndCBmaXhdOiBTZWxlY3RlZCByYW5nZSBpcyBub3Qgc3VibW9kZSBhd2FyZS4gYWx3YXlzIGNoYXJhY3Rlcndpc2UuXG4jIFNvIGV2ZW4gaWYgb3JpZ2luYWwgc2VsZWN0aW9uIHdhcyB2TCBvciB2Qiwgc2VsZWN0ZWQgcmFuZ2UgYnkgdGhpcyB0ZXh0LW9iamVjdFxuIyBpcyBhbHdheXMgdkMgcmFuZ2UuXG5jbGFzcyBQcmV2aW91c1NlbGVjdGlvbiBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZCgpXG4gIHdpc2U6IG51bGxcbiAgc2VsZWN0T25jZTogdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3Q6IChzZWxlY3Rpb24pIC0+XG4gICAge3Byb3BlcnRpZXMsIHN1Ym1vZGV9ID0gQHZpbVN0YXRlLnByZXZpb3VzU2VsZWN0aW9uXG4gICAgaWYgcHJvcGVydGllcz8gYW5kIHN1Ym1vZGU/XG4gICAgICBAd2lzZSA9IHN1Ym1vZGVcbiAgICAgIEBzd3JhcChAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuc2VsZWN0QnlQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG4gICAgICByZXR1cm4gdHJ1ZVxuXG5jbGFzcyBQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogbnVsbFxuICBzZWxlY3RPbmNlOiB0cnVlXG5cbiAgc2VsZWN0VGV4dE9iamVjdDogKHNlbGVjdGlvbikgLT5cbiAgICBpZiBAdmltU3RhdGUuaGFzUGVyc2lzdGVudFNlbGVjdGlvbnMoKVxuICAgICAgQHZpbVN0YXRlLnBlcnNpc3RlbnRTZWxlY3Rpb24uc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoKVxuICAgICAgcmV0dXJuIHRydWVcblxuY2xhc3MgVmlzaWJsZUFyZWEgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBzZWxlY3RPbmNlOiB0cnVlXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgIyBbQlVHP10gTmVlZCB0cmFuc2xhdGUgdG8gc2hpbG5rIHRvcCBhbmQgYm90dG9tIHRvIGZpdCBhY3R1YWwgcm93LlxuICAgICMgVGhlIHJlYXNvbiBJIG5lZWQgLTIgYXQgYm90dG9tIGlzIGJlY2F1c2Ugb2Ygc3RhdHVzIGJhcj9cbiAgICBidWZmZXJSYW5nZSA9IGdldFZpc2libGVCdWZmZXJSYW5nZShAZWRpdG9yKVxuICAgIGlmIGJ1ZmZlclJhbmdlLmdldFJvd3MoKSA+IEBlZGl0b3IuZ2V0Um93c1BlclBhZ2UoKVxuICAgICAgYnVmZmVyUmFuZ2UudHJhbnNsYXRlKFsrMSwgMF0sIFstMywgMF0pXG4gICAgZWxzZVxuICAgICAgYnVmZmVyUmFuZ2VcbiJdfQ==
