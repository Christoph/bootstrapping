(function() {
  var AAngleBracket, AAngleBracketAllowForwarding, AAnyPair, AAnyPairAllowForwarding, AAnyQuote, ABackTick, AComment, ACurlyBracket, ACurlyBracketAllowForwarding, ACurrentLine, ADoubleQuote, AEdge, AEntire, AFold, AFunction, AIndentation, ALatestChange, APair, AParagraph, AParenthesis, AParenthesisAllowForwarding, APersistentSelection, ASingleQuote, ASmartWord, ASquareBracket, ASquareBracketAllowForwarding, ASubword, ATag, AVisibleArea, AWholeWord, AWord, All, AngleBracket, AnyPair, AnyPairAllowForwarding, AnyQuote, BackTick, Base, BracketFinder, Comment, CurlyBracket, CurrentLine, DoubleQuote, Edge, Empty, Entire, Fold, Function, Indentation, InnerAngleBracket, InnerAngleBracketAllowForwarding, InnerAnyPair, InnerAnyPairAllowForwarding, InnerAnyQuote, InnerBackTick, InnerComment, InnerCurlyBracket, InnerCurlyBracketAllowForwarding, InnerCurrentLine, InnerDoubleQuote, InnerEdge, InnerEntire, InnerFold, InnerFunction, InnerIndentation, InnerLatestChange, InnerParagraph, InnerParenthesis, InnerParenthesisAllowForwarding, InnerPersistentSelection, InnerSingleQuote, InnerSmartWord, InnerSquareBracket, InnerSquareBracketAllowForwarding, InnerSubword, InnerTag, InnerVisibleArea, InnerWholeWord, InnerWord, LatestChange, Pair, Paragraph, Parenthesis, PersistentSelection, Point, PreviousSelection, Quote, QuoteFinder, Range, SearchMatchBackward, SearchMatchForward, SingleQuote, SmartWord, SquareBracket, Subword, Tag, TagFinder, TextObject, VisibleArea, WholeWord, Word, _, expandRangeToWhiteSpaces, getBufferRangeForRowRange, getBufferRows, getCodeFoldRowRangesContainesForRow, getIndentLevelForBufferRow, getLineTextToBufferPosition, getValidVimBufferRow, getVisibleBufferRange, isIncludeFunctionScopeForRow, pointIsAtEndOfLine, ref, ref1, ref2, sortRanges, swrap, translatePointAndClip, trimRange,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  Base = require('./base');

  swrap = require('./selection-wrapper');

  ref1 = require('./utils'), getLineTextToBufferPosition = ref1.getLineTextToBufferPosition, getIndentLevelForBufferRow = ref1.getIndentLevelForBufferRow, getCodeFoldRowRangesContainesForRow = ref1.getCodeFoldRowRangesContainesForRow, getBufferRangeForRowRange = ref1.getBufferRangeForRowRange, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, expandRangeToWhiteSpaces = ref1.expandRangeToWhiteSpaces, getVisibleBufferRange = ref1.getVisibleBufferRange, translatePointAndClip = ref1.translatePointAndClip, getBufferRows = ref1.getBufferRows, getValidVimBufferRow = ref1.getValidVimBufferRow, trimRange = ref1.trimRange, sortRanges = ref1.sortRanges, pointIsAtEndOfLine = ref1.pointIsAtEndOfLine;

  ref2 = require('./pair-finder.coffee'), BracketFinder = ref2.BracketFinder, QuoteFinder = ref2.QuoteFinder, TagFinder = ref2.TagFinder;

  TextObject = (function(superClass) {
    extend(TextObject, superClass);

    TextObject.extend(false);

    TextObject.prototype.wise = null;

    TextObject.prototype.supportCount = false;

    function TextObject() {
      this.constructor.prototype.inner = this.getName().startsWith('Inner');
      TextObject.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    TextObject.prototype.isInner = function() {
      return this.inner;
    };

    TextObject.prototype.isA = function() {
      return !this.isInner();
    };

    TextObject.prototype.isSuportCount = function() {
      return this.supportCount;
    };

    TextObject.prototype.getWise = function() {
      if ((this.wise != null) && this.getOperator().isOccurrence()) {
        return 'characterwise';
      } else {
        return this.wise;
      }
    };

    TextObject.prototype.isCharacterwise = function() {
      return this.getWise() === 'characterwise';
    };

    TextObject.prototype.isLinewise = function() {
      return this.getWise() === 'linewise';
    };

    TextObject.prototype.isBlockwise = function() {
      return this.getWise() === 'blockwise';
    };

    TextObject.prototype.getNormalizedHeadBufferPosition = function(selection) {
      var head;
      head = selection.getHeadBufferPosition();
      if (this.isMode('visual') && !selection.isReversed()) {
        head = translatePointAndClip(this.editor, head, 'backward');
      }
      return head;
    };

    TextObject.prototype.getNormalizedHeadScreenPosition = function(selection) {
      var bufferPosition;
      bufferPosition = this.getNormalizedHeadBufferPosition(selection);
      return this.editor.screenPositionForBufferPosition(bufferPosition);
    };

    TextObject.prototype.needToKeepColumn = function() {
      return this.wise === 'linewise' && this.getConfig('keepColumnOnSelectTextObject') && this.getOperator()["instanceof"]('Select');
    };

    TextObject.prototype.execute = function() {
      if (this.operator != null) {
        return this.select();
      } else {
        throw new Error('in TextObject: Must not happen');
      }
    };

    TextObject.prototype.select = function() {
      var i, len, ref3, selectResults, selection;
      selectResults = [];
      this.countTimes(this.getCount(), (function(_this) {
        return function(arg) {
          var i, len, ref3, selection, stop;
          stop = arg.stop;
          _this.stopSelection = stop;
          ref3 = _this.editor.getSelections();
          for (i = 0, len = ref3.length; i < len; i++) {
            selection = ref3[i];
            selectResults.push(_this.selectTextObject(selection));
          }
          if (!_this.isSuportCount()) {
            return stop();
          }
        };
      })(this));
      if (this.needToKeepColumn()) {
        ref3 = this.editor.getSelections();
        for (i = 0, len = ref3.length; i < len; i++) {
          selection = ref3[i];
          swrap(selection).clipPropertiesTillEndOfLine();
        }
      }
      this.editor.mergeIntersectingSelections();
      if (this.isMode('visual') && this.wise === 'characterwise') {
        swrap.saveProperties(this.editor);
      }
      if (selectResults.some(function(value) {
        return value;
      })) {
        return this.wise != null ? this.wise : this.wise = swrap.detectVisualModeSubmode(this.editor);
      } else {
        return this.wise = null;
      }
    };

    TextObject.prototype.selectTextObject = function(selection) {
      var needToKeepColumn, newRange, oldRange, options, range;
      if (range = this.getRange(selection)) {
        oldRange = selection.getBufferRange();
        needToKeepColumn = this.needToKeepColumn();
        if (needToKeepColumn && !this.isMode('visual', 'linewise')) {
          this.vimState.modeManager.activate('visual', 'linewise');
        }
        options = {
          autoscroll: selection.isLastSelection() && !this.getOperator().supportEarlySelect,
          keepGoalColumn: needToKeepColumn
        };
        swrap(selection).setBufferRangeSafely(range, options);
        newRange = selection.getBufferRange();
        if (newRange.isEqual(oldRange)) {
          this.stopSelection();
        }
        return true;
      } else {
        this.stopSelection();
        return false;
      }
    };

    TextObject.prototype.getRange = function() {};

    return TextObject;

  })(Base);

  Word = (function(superClass) {
    extend(Word, superClass);

    function Word() {
      return Word.__super__.constructor.apply(this, arguments);
    }

    Word.extend(false);

    Word.prototype.getRange = function(selection) {
      var point, range;
      point = this.getNormalizedHeadBufferPosition(selection);
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

  AWord = (function(superClass) {
    extend(AWord, superClass);

    function AWord() {
      return AWord.__super__.constructor.apply(this, arguments);
    }

    AWord.extend();

    return AWord;

  })(Word);

  InnerWord = (function(superClass) {
    extend(InnerWord, superClass);

    function InnerWord() {
      return InnerWord.__super__.constructor.apply(this, arguments);
    }

    InnerWord.extend();

    return InnerWord;

  })(Word);

  WholeWord = (function(superClass) {
    extend(WholeWord, superClass);

    function WholeWord() {
      return WholeWord.__super__.constructor.apply(this, arguments);
    }

    WholeWord.extend(false);

    WholeWord.prototype.wordRegex = /\S+/;

    return WholeWord;

  })(Word);

  AWholeWord = (function(superClass) {
    extend(AWholeWord, superClass);

    function AWholeWord() {
      return AWholeWord.__super__.constructor.apply(this, arguments);
    }

    AWholeWord.extend();

    return AWholeWord;

  })(WholeWord);

  InnerWholeWord = (function(superClass) {
    extend(InnerWholeWord, superClass);

    function InnerWholeWord() {
      return InnerWholeWord.__super__.constructor.apply(this, arguments);
    }

    InnerWholeWord.extend();

    return InnerWholeWord;

  })(WholeWord);

  SmartWord = (function(superClass) {
    extend(SmartWord, superClass);

    function SmartWord() {
      return SmartWord.__super__.constructor.apply(this, arguments);
    }

    SmartWord.extend(false);

    SmartWord.prototype.wordRegex = /[\w-]+/;

    return SmartWord;

  })(Word);

  ASmartWord = (function(superClass) {
    extend(ASmartWord, superClass);

    function ASmartWord() {
      return ASmartWord.__super__.constructor.apply(this, arguments);
    }

    ASmartWord.description = "A word that consists of alphanumeric chars(`/[A-Za-z0-9_]/`) and hyphen `-`";

    ASmartWord.extend();

    return ASmartWord;

  })(SmartWord);

  InnerSmartWord = (function(superClass) {
    extend(InnerSmartWord, superClass);

    function InnerSmartWord() {
      return InnerSmartWord.__super__.constructor.apply(this, arguments);
    }

    InnerSmartWord.description = "Currently No diff from `a-smart-word`";

    InnerSmartWord.extend();

    return InnerSmartWord;

  })(SmartWord);

  Subword = (function(superClass) {
    extend(Subword, superClass);

    function Subword() {
      return Subword.__super__.constructor.apply(this, arguments);
    }

    Subword.extend(false);

    Subword.prototype.getRange = function(selection) {
      this.wordRegex = selection.cursor.subwordRegExp();
      return Subword.__super__.getRange.apply(this, arguments);
    };

    return Subword;

  })(Word);

  ASubword = (function(superClass) {
    extend(ASubword, superClass);

    function ASubword() {
      return ASubword.__super__.constructor.apply(this, arguments);
    }

    ASubword.extend();

    return ASubword;

  })(Subword);

  InnerSubword = (function(superClass) {
    extend(InnerSubword, superClass);

    function InnerSubword() {
      return InnerSubword.__super__.constructor.apply(this, arguments);
    }

    InnerSubword.extend();

    return InnerSubword;

  })(Subword);

  Pair = (function(superClass) {
    extend(Pair, superClass);

    Pair.extend(false);

    Pair.prototype.allowNextLine = null;

    Pair.prototype.adjustInnerRange = true;

    Pair.prototype.pair = null;

    Pair.prototype.wise = 'characterwise';

    Pair.prototype.supportCount = true;

    Pair.prototype.isAllowNextLine = function() {
      var ref3;
      return (ref3 = this.allowNextLine) != null ? ref3 : (this.pair != null) && this.pair[0] !== this.pair[1];
    };

    function Pair() {
      if (this.allowForwarding == null) {
        this.allowForwarding = this.getName().endsWith('AllowForwarding');
      }
      Pair.__super__.constructor.apply(this, arguments);
    }

    Pair.prototype.adjustRange = function(arg) {
      var end, start;
      start = arg.start, end = arg.end;
      if (pointIsAtEndOfLine(this.editor, start)) {
        start = start.traverse([1, 0]);
      }
      if (getLineTextToBufferPosition(this.editor, end).match(/^\s*$/)) {
        if (this.isMode('visual')) {
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
        pair: this.pair
      };
      if (this.pair[0] === this.pair[1]) {
        return new QuoteFinder(this.editor, options);
      } else {
        return new BracketFinder(this.editor, options);
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

    Pair.prototype.getPointToSearchFrom = function(selection, searchFrom) {
      switch (searchFrom) {
        case 'head':
          return this.getNormalizedHeadBufferPosition(selection);
        case 'start':
          return swrap(selection).getBufferPositionFor('start');
      }
    };

    Pair.prototype.getRange = function(selection, options) {
      var allowForwarding, originalRange, pairInfo, searchFrom;
      if (options == null) {
        options = {};
      }
      allowForwarding = options.allowForwarding, searchFrom = options.searchFrom;
      if (searchFrom == null) {
        searchFrom = 'head';
      }
      if (allowForwarding != null) {
        this.allowForwarding = allowForwarding;
      }
      originalRange = selection.getBufferRange();
      pairInfo = this.getPairInfo(this.getPointToSearchFrom(selection, searchFrom));
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

    AnyPair.prototype.allowForwarding = false;

    AnyPair.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick', 'CurlyBracket', 'AngleBracket', 'SquareBracket', 'Parenthesis'];

    AnyPair.prototype.getRangeBy = function(klass, selection) {
      return this["new"](klass).getRange(selection, {
        allowForwarding: this.allowForwarding,
        searchFrom: this.searchFrom
      });
    };

    AnyPair.prototype.getRanges = function(selection) {
      var i, klass, len, prefix, range, ranges, ref3;
      prefix = this.isInner() ? 'Inner' : 'A';
      ranges = [];
      ref3 = this.member;
      for (i = 0, len = ref3.length; i < len; i++) {
        klass = ref3[i];
        if (range = this.getRangeBy(prefix + klass, selection)) {
          ranges.push(range);
        }
      }
      return ranges;
    };

    AnyPair.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.last(sortRanges(ranges));
      }
    };

    return AnyPair;

  })(Pair);

  AAnyPair = (function(superClass) {
    extend(AAnyPair, superClass);

    function AAnyPair() {
      return AAnyPair.__super__.constructor.apply(this, arguments);
    }

    AAnyPair.extend();

    return AAnyPair;

  })(AnyPair);

  InnerAnyPair = (function(superClass) {
    extend(InnerAnyPair, superClass);

    function InnerAnyPair() {
      return InnerAnyPair.__super__.constructor.apply(this, arguments);
    }

    InnerAnyPair.extend();

    return InnerAnyPair;

  })(AnyPair);

  AnyPairAllowForwarding = (function(superClass) {
    extend(AnyPairAllowForwarding, superClass);

    function AnyPairAllowForwarding() {
      return AnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AnyPairAllowForwarding.extend(false);

    AnyPairAllowForwarding.description = "Range surrounded by auto-detected paired chars from enclosed and forwarding area";

    AnyPairAllowForwarding.prototype.allowForwarding = true;

    AnyPairAllowForwarding.prototype.searchFrom = 'start';

    AnyPairAllowForwarding.prototype.getRange = function(selection) {
      var enclosingRange, enclosingRanges, forwardingRanges, from, ranges, ref3;
      ranges = this.getRanges(selection);
      from = selection.cursor.getBufferPosition();
      ref3 = _.partition(ranges, function(range) {
        return range.start.isGreaterThanOrEqual(from);
      }), forwardingRanges = ref3[0], enclosingRanges = ref3[1];
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

  AAnyPairAllowForwarding = (function(superClass) {
    extend(AAnyPairAllowForwarding, superClass);

    function AAnyPairAllowForwarding() {
      return AAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AAnyPairAllowForwarding.extend();

    return AAnyPairAllowForwarding;

  })(AnyPairAllowForwarding);

  InnerAnyPairAllowForwarding = (function(superClass) {
    extend(InnerAnyPairAllowForwarding, superClass);

    function InnerAnyPairAllowForwarding() {
      return InnerAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerAnyPairAllowForwarding.extend();

    return InnerAnyPairAllowForwarding;

  })(AnyPairAllowForwarding);

  AnyQuote = (function(superClass) {
    extend(AnyQuote, superClass);

    function AnyQuote() {
      return AnyQuote.__super__.constructor.apply(this, arguments);
    }

    AnyQuote.extend(false);

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

  AAnyQuote = (function(superClass) {
    extend(AAnyQuote, superClass);

    function AAnyQuote() {
      return AAnyQuote.__super__.constructor.apply(this, arguments);
    }

    AAnyQuote.extend();

    return AAnyQuote;

  })(AnyQuote);

  InnerAnyQuote = (function(superClass) {
    extend(InnerAnyQuote, superClass);

    function InnerAnyQuote() {
      return InnerAnyQuote.__super__.constructor.apply(this, arguments);
    }

    InnerAnyQuote.extend();

    return InnerAnyQuote;

  })(AnyQuote);

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

    DoubleQuote.prototype.pair = ['"', '"'];

    return DoubleQuote;

  })(Quote);

  ADoubleQuote = (function(superClass) {
    extend(ADoubleQuote, superClass);

    function ADoubleQuote() {
      return ADoubleQuote.__super__.constructor.apply(this, arguments);
    }

    ADoubleQuote.extend();

    return ADoubleQuote;

  })(DoubleQuote);

  InnerDoubleQuote = (function(superClass) {
    extend(InnerDoubleQuote, superClass);

    function InnerDoubleQuote() {
      return InnerDoubleQuote.__super__.constructor.apply(this, arguments);
    }

    InnerDoubleQuote.extend();

    return InnerDoubleQuote;

  })(DoubleQuote);

  SingleQuote = (function(superClass) {
    extend(SingleQuote, superClass);

    function SingleQuote() {
      return SingleQuote.__super__.constructor.apply(this, arguments);
    }

    SingleQuote.extend(false);

    SingleQuote.prototype.pair = ["'", "'"];

    return SingleQuote;

  })(Quote);

  ASingleQuote = (function(superClass) {
    extend(ASingleQuote, superClass);

    function ASingleQuote() {
      return ASingleQuote.__super__.constructor.apply(this, arguments);
    }

    ASingleQuote.extend();

    return ASingleQuote;

  })(SingleQuote);

  InnerSingleQuote = (function(superClass) {
    extend(InnerSingleQuote, superClass);

    function InnerSingleQuote() {
      return InnerSingleQuote.__super__.constructor.apply(this, arguments);
    }

    InnerSingleQuote.extend();

    return InnerSingleQuote;

  })(SingleQuote);

  BackTick = (function(superClass) {
    extend(BackTick, superClass);

    function BackTick() {
      return BackTick.__super__.constructor.apply(this, arguments);
    }

    BackTick.extend(false);

    BackTick.prototype.pair = ['`', '`'];

    return BackTick;

  })(Quote);

  ABackTick = (function(superClass) {
    extend(ABackTick, superClass);

    function ABackTick() {
      return ABackTick.__super__.constructor.apply(this, arguments);
    }

    ABackTick.extend();

    return ABackTick;

  })(BackTick);

  InnerBackTick = (function(superClass) {
    extend(InnerBackTick, superClass);

    function InnerBackTick() {
      return InnerBackTick.__super__.constructor.apply(this, arguments);
    }

    InnerBackTick.extend();

    return InnerBackTick;

  })(BackTick);

  CurlyBracket = (function(superClass) {
    extend(CurlyBracket, superClass);

    function CurlyBracket() {
      return CurlyBracket.__super__.constructor.apply(this, arguments);
    }

    CurlyBracket.extend(false);

    CurlyBracket.prototype.pair = ['{', '}'];

    return CurlyBracket;

  })(Pair);

  ACurlyBracket = (function(superClass) {
    extend(ACurlyBracket, superClass);

    function ACurlyBracket() {
      return ACurlyBracket.__super__.constructor.apply(this, arguments);
    }

    ACurlyBracket.extend();

    return ACurlyBracket;

  })(CurlyBracket);

  InnerCurlyBracket = (function(superClass) {
    extend(InnerCurlyBracket, superClass);

    function InnerCurlyBracket() {
      return InnerCurlyBracket.__super__.constructor.apply(this, arguments);
    }

    InnerCurlyBracket.extend();

    return InnerCurlyBracket;

  })(CurlyBracket);

  ACurlyBracketAllowForwarding = (function(superClass) {
    extend(ACurlyBracketAllowForwarding, superClass);

    function ACurlyBracketAllowForwarding() {
      return ACurlyBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ACurlyBracketAllowForwarding.extend();

    return ACurlyBracketAllowForwarding;

  })(CurlyBracket);

  InnerCurlyBracketAllowForwarding = (function(superClass) {
    extend(InnerCurlyBracketAllowForwarding, superClass);

    function InnerCurlyBracketAllowForwarding() {
      return InnerCurlyBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerCurlyBracketAllowForwarding.extend();

    return InnerCurlyBracketAllowForwarding;

  })(CurlyBracket);

  SquareBracket = (function(superClass) {
    extend(SquareBracket, superClass);

    function SquareBracket() {
      return SquareBracket.__super__.constructor.apply(this, arguments);
    }

    SquareBracket.extend(false);

    SquareBracket.prototype.pair = ['[', ']'];

    return SquareBracket;

  })(Pair);

  ASquareBracket = (function(superClass) {
    extend(ASquareBracket, superClass);

    function ASquareBracket() {
      return ASquareBracket.__super__.constructor.apply(this, arguments);
    }

    ASquareBracket.extend();

    return ASquareBracket;

  })(SquareBracket);

  InnerSquareBracket = (function(superClass) {
    extend(InnerSquareBracket, superClass);

    function InnerSquareBracket() {
      return InnerSquareBracket.__super__.constructor.apply(this, arguments);
    }

    InnerSquareBracket.extend();

    return InnerSquareBracket;

  })(SquareBracket);

  ASquareBracketAllowForwarding = (function(superClass) {
    extend(ASquareBracketAllowForwarding, superClass);

    function ASquareBracketAllowForwarding() {
      return ASquareBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ASquareBracketAllowForwarding.extend();

    return ASquareBracketAllowForwarding;

  })(SquareBracket);

  InnerSquareBracketAllowForwarding = (function(superClass) {
    extend(InnerSquareBracketAllowForwarding, superClass);

    function InnerSquareBracketAllowForwarding() {
      return InnerSquareBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerSquareBracketAllowForwarding.extend();

    return InnerSquareBracketAllowForwarding;

  })(SquareBracket);

  Parenthesis = (function(superClass) {
    extend(Parenthesis, superClass);

    function Parenthesis() {
      return Parenthesis.__super__.constructor.apply(this, arguments);
    }

    Parenthesis.extend(false);

    Parenthesis.prototype.pair = ['(', ')'];

    return Parenthesis;

  })(Pair);

  AParenthesis = (function(superClass) {
    extend(AParenthesis, superClass);

    function AParenthesis() {
      return AParenthesis.__super__.constructor.apply(this, arguments);
    }

    AParenthesis.extend();

    return AParenthesis;

  })(Parenthesis);

  InnerParenthesis = (function(superClass) {
    extend(InnerParenthesis, superClass);

    function InnerParenthesis() {
      return InnerParenthesis.__super__.constructor.apply(this, arguments);
    }

    InnerParenthesis.extend();

    return InnerParenthesis;

  })(Parenthesis);

  AParenthesisAllowForwarding = (function(superClass) {
    extend(AParenthesisAllowForwarding, superClass);

    function AParenthesisAllowForwarding() {
      return AParenthesisAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AParenthesisAllowForwarding.extend();

    return AParenthesisAllowForwarding;

  })(Parenthesis);

  InnerParenthesisAllowForwarding = (function(superClass) {
    extend(InnerParenthesisAllowForwarding, superClass);

    function InnerParenthesisAllowForwarding() {
      return InnerParenthesisAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerParenthesisAllowForwarding.extend();

    return InnerParenthesisAllowForwarding;

  })(Parenthesis);

  AngleBracket = (function(superClass) {
    extend(AngleBracket, superClass);

    function AngleBracket() {
      return AngleBracket.__super__.constructor.apply(this, arguments);
    }

    AngleBracket.extend(false);

    AngleBracket.prototype.pair = ['<', '>'];

    return AngleBracket;

  })(Pair);

  AAngleBracket = (function(superClass) {
    extend(AAngleBracket, superClass);

    function AAngleBracket() {
      return AAngleBracket.__super__.constructor.apply(this, arguments);
    }

    AAngleBracket.extend();

    return AAngleBracket;

  })(AngleBracket);

  InnerAngleBracket = (function(superClass) {
    extend(InnerAngleBracket, superClass);

    function InnerAngleBracket() {
      return InnerAngleBracket.__super__.constructor.apply(this, arguments);
    }

    InnerAngleBracket.extend();

    return InnerAngleBracket;

  })(AngleBracket);

  AAngleBracketAllowForwarding = (function(superClass) {
    extend(AAngleBracketAllowForwarding, superClass);

    function AAngleBracketAllowForwarding() {
      return AAngleBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AAngleBracketAllowForwarding.extend();

    return AAngleBracketAllowForwarding;

  })(AngleBracket);

  InnerAngleBracketAllowForwarding = (function(superClass) {
    extend(InnerAngleBracketAllowForwarding, superClass);

    function InnerAngleBracketAllowForwarding() {
      return InnerAngleBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerAngleBracketAllowForwarding.extend();

    return InnerAngleBracketAllowForwarding;

  })(AngleBracket);

  Tag = (function(superClass) {
    extend(Tag, superClass);

    function Tag() {
      return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.extend(false);

    Tag.prototype.allowNextLine = true;

    Tag.prototype.allowForwarding = true;

    Tag.prototype.adjustInnerRange = false;

    Tag.prototype.getTagStartPoint = function(from) {
      var pattern, tagRange;
      tagRange = null;
      pattern = TagFinder.prototype.pattern;
      this.scanForward(pattern, {
        from: [from.row, 0]
      }, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.containsPoint(from, true)) {
          tagRange = range;
          return stop();
        }
      });
      return tagRange != null ? tagRange.start : void 0;
    };

    Tag.prototype.getFinder = function() {
      return new TagFinder(this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding
      });
    };

    Tag.prototype.getPairInfo = function(from) {
      var ref3;
      return Tag.__super__.getPairInfo.call(this, (ref3 = this.getTagStartPoint(from)) != null ? ref3 : from);
    };

    return Tag;

  })(Pair);

  ATag = (function(superClass) {
    extend(ATag, superClass);

    function ATag() {
      return ATag.__super__.constructor.apply(this, arguments);
    }

    ATag.extend();

    return ATag;

  })(Tag);

  InnerTag = (function(superClass) {
    extend(InnerTag, superClass);

    function InnerTag() {
      return InnerTag.__super__.constructor.apply(this, arguments);
    }

    InnerTag.extend();

    return InnerTag;

  })(Tag);

  Paragraph = (function(superClass) {
    extend(Paragraph, superClass);

    function Paragraph() {
      return Paragraph.__super__.constructor.apply(this, arguments);
    }

    Paragraph.extend(false);

    Paragraph.prototype.wise = 'linewise';

    Paragraph.prototype.supportCount = true;

    Paragraph.prototype.findRow = function(fromRow, direction, fn) {
      var foundRow, i, len, ref3, row;
      if (typeof fn.reset === "function") {
        fn.reset();
      }
      foundRow = fromRow;
      ref3 = getBufferRows(this.editor, {
        startRow: fromRow,
        direction: direction
      });
      for (i = 0, len = ref3.length; i < len; i++) {
        row = ref3[i];
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
      fromRow = this.getNormalizedHeadBufferPosition(selection).row;
      if (this.isMode('visual', 'linewise')) {
        if (selection.isReversed()) {
          fromRow--;
        } else {
          fromRow++;
        }
        fromRow = getValidVimBufferRow(this.editor, fromRow);
      }
      rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(getBufferRangeForRowRange(this.editor, rowRange));
    };

    return Paragraph;

  })(TextObject);

  AParagraph = (function(superClass) {
    extend(AParagraph, superClass);

    function AParagraph() {
      return AParagraph.__super__.constructor.apply(this, arguments);
    }

    AParagraph.extend();

    return AParagraph;

  })(Paragraph);

  InnerParagraph = (function(superClass) {
    extend(InnerParagraph, superClass);

    function InnerParagraph() {
      return InnerParagraph.__super__.constructor.apply(this, arguments);
    }

    InnerParagraph.extend();

    return InnerParagraph;

  })(Paragraph);

  Indentation = (function(superClass) {
    extend(Indentation, superClass);

    function Indentation() {
      return Indentation.__super__.constructor.apply(this, arguments);
    }

    Indentation.extend(false);

    Indentation.prototype.getRange = function(selection) {
      var baseIndentLevel, fromRow, predict, rowRange;
      fromRow = this.getNormalizedHeadBufferPosition(selection).row;
      baseIndentLevel = getIndentLevelForBufferRow(this.editor, fromRow);
      predict = (function(_this) {
        return function(row) {
          if (_this.editor.isBufferRowBlank(row)) {
            return _this.isA();
          } else {
            return getIndentLevelForBufferRow(_this.editor, row) >= baseIndentLevel;
          }
        };
      })(this);
      rowRange = this.findRowRangeBy(fromRow, predict);
      return getBufferRangeForRowRange(this.editor, rowRange);
    };

    return Indentation;

  })(Paragraph);

  AIndentation = (function(superClass) {
    extend(AIndentation, superClass);

    function AIndentation() {
      return AIndentation.__super__.constructor.apply(this, arguments);
    }

    AIndentation.extend();

    return AIndentation;

  })(Indentation);

  InnerIndentation = (function(superClass) {
    extend(InnerIndentation, superClass);

    function InnerIndentation() {
      return InnerIndentation.__super__.constructor.apply(this, arguments);
    }

    InnerIndentation.extend();

    return InnerIndentation;

  })(Indentation);

  Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.extend(false);

    Comment.prototype.wise = 'linewise';

    Comment.prototype.getRange = function(selection) {
      var row, rowRange;
      row = swrap(selection).getStartRow();
      rowRange = this.editor.languageMode.rowRangeForCommentAtBufferRow(row);
      if (this.editor.isBufferRowCommented(row)) {
        if (rowRange == null) {
          rowRange = [row, row];
        }
      }
      if (rowRange) {
        return getBufferRangeForRowRange(selection.editor, rowRange);
      }
    };

    return Comment;

  })(TextObject);

  AComment = (function(superClass) {
    extend(AComment, superClass);

    function AComment() {
      return AComment.__super__.constructor.apply(this, arguments);
    }

    AComment.extend();

    return AComment;

  })(Comment);

  InnerComment = (function(superClass) {
    extend(InnerComment, superClass);

    function InnerComment() {
      return InnerComment.__super__.constructor.apply(this, arguments);
    }

    InnerComment.extend();

    return InnerComment;

  })(Comment);

  Fold = (function(superClass) {
    extend(Fold, superClass);

    function Fold() {
      return Fold.__super__.constructor.apply(this, arguments);
    }

    Fold.extend(false);

    Fold.prototype.wise = 'linewise';

    Fold.prototype.adjustRowRange = function(rowRange) {
      var endRow, endRowIndentLevel, startRow, startRowIndentLevel;
      if (!this.isInner()) {
        return rowRange;
      }
      startRow = rowRange[0], endRow = rowRange[1];
      startRowIndentLevel = getIndentLevelForBufferRow(this.editor, startRow);
      endRowIndentLevel = getIndentLevelForBufferRow(this.editor, endRow);
      if (startRowIndentLevel === endRowIndentLevel) {
        endRow -= 1;
      }
      startRow += 1;
      return [startRow, endRow];
    };

    Fold.prototype.getFoldRowRangesContainsForRow = function(row) {
      return getCodeFoldRowRangesContainesForRow(this.editor, row, {
        includeStartRow: true
      }).reverse();
    };

    Fold.prototype.getRange = function(selection) {
      var range, rowRanges;
      rowRanges = this.getFoldRowRangesContainsForRow(swrap(selection).getStartRow());
      if (!rowRanges.length) {
        return;
      }
      range = getBufferRangeForRowRange(this.editor, this.adjustRowRange(rowRanges.shift()));
      if (rowRanges.length && range.isEqual(selection.getBufferRange())) {
        range = getBufferRangeForRowRange(this.editor, this.adjustRowRange(rowRanges.shift()));
      }
      return range;
    };

    return Fold;

  })(TextObject);

  AFold = (function(superClass) {
    extend(AFold, superClass);

    function AFold() {
      return AFold.__super__.constructor.apply(this, arguments);
    }

    AFold.extend();

    return AFold;

  })(Fold);

  InnerFold = (function(superClass) {
    extend(InnerFold, superClass);

    function InnerFold() {
      return InnerFold.__super__.constructor.apply(this, arguments);
    }

    InnerFold.extend();

    return InnerFold;

  })(Fold);

  Function = (function(superClass) {
    extend(Function, superClass);

    function Function() {
      return Function.__super__.constructor.apply(this, arguments);
    }

    Function.extend(false);

    Function.prototype.scopeNamesOmittingEndRow = ['source.go', 'source.elixir'];

    Function.prototype.getFoldRowRangesContainsForRow = function(row) {
      var ref3, rowRanges;
      rowRanges = (ref3 = getCodeFoldRowRangesContainesForRow(this.editor, row)) != null ? ref3.reverse() : void 0;
      return rowRanges != null ? rowRanges.filter((function(_this) {
        return function(rowRange) {
          return isIncludeFunctionScopeForRow(_this.editor, rowRange[0]);
        };
      })(this)) : void 0;
    };

    Function.prototype.adjustRowRange = function(rowRange) {
      var endRow, ref3, ref4, startRow;
      ref3 = Function.__super__.adjustRowRange.apply(this, arguments), startRow = ref3[0], endRow = ref3[1];
      if (this.isA() && (ref4 = this.editor.getGrammar().scopeName, indexOf.call(this.scopeNamesOmittingEndRow, ref4) >= 0)) {
        endRow += 1;
      }
      return [startRow, endRow];
    };

    return Function;

  })(Fold);

  AFunction = (function(superClass) {
    extend(AFunction, superClass);

    function AFunction() {
      return AFunction.__super__.constructor.apply(this, arguments);
    }

    AFunction.extend();

    return AFunction;

  })(Function);

  InnerFunction = (function(superClass) {
    extend(InnerFunction, superClass);

    function InnerFunction() {
      return InnerFunction.__super__.constructor.apply(this, arguments);
    }

    InnerFunction.extend();

    return InnerFunction;

  })(Function);

  CurrentLine = (function(superClass) {
    extend(CurrentLine, superClass);

    function CurrentLine() {
      return CurrentLine.__super__.constructor.apply(this, arguments);
    }

    CurrentLine.extend(false);

    CurrentLine.prototype.getRange = function(selection) {
      var range, row;
      row = this.getNormalizedHeadBufferPosition(selection).row;
      range = this.editor.bufferRangeForBufferRow(row);
      if (this.isA()) {
        return range;
      } else {
        return trimRange(this.editor, range);
      }
    };

    return CurrentLine;

  })(TextObject);

  ACurrentLine = (function(superClass) {
    extend(ACurrentLine, superClass);

    function ACurrentLine() {
      return ACurrentLine.__super__.constructor.apply(this, arguments);
    }

    ACurrentLine.extend();

    return ACurrentLine;

  })(CurrentLine);

  InnerCurrentLine = (function(superClass) {
    extend(InnerCurrentLine, superClass);

    function InnerCurrentLine() {
      return InnerCurrentLine.__super__.constructor.apply(this, arguments);
    }

    InnerCurrentLine.extend();

    return InnerCurrentLine;

  })(CurrentLine);

  Entire = (function(superClass) {
    extend(Entire, superClass);

    function Entire() {
      return Entire.__super__.constructor.apply(this, arguments);
    }

    Entire.extend(false);

    Entire.prototype.getRange = function(selection) {
      this.stopSelection();
      return this.editor.buffer.getRange();
    };

    return Entire;

  })(TextObject);

  AEntire = (function(superClass) {
    extend(AEntire, superClass);

    function AEntire() {
      return AEntire.__super__.constructor.apply(this, arguments);
    }

    AEntire.extend();

    return AEntire;

  })(Entire);

  InnerEntire = (function(superClass) {
    extend(InnerEntire, superClass);

    function InnerEntire() {
      return InnerEntire.__super__.constructor.apply(this, arguments);
    }

    InnerEntire.extend();

    return InnerEntire;

  })(Entire);

  All = (function(superClass) {
    extend(All, superClass);

    function All() {
      return All.__super__.constructor.apply(this, arguments);
    }

    All.extend(false);

    return All;

  })(Entire);

  Empty = (function(superClass) {
    extend(Empty, superClass);

    function Empty() {
      return Empty.__super__.constructor.apply(this, arguments);
    }

    Empty.extend(false);

    return Empty;

  })(TextObject);

  LatestChange = (function(superClass) {
    extend(LatestChange, superClass);

    function LatestChange() {
      return LatestChange.__super__.constructor.apply(this, arguments);
    }

    LatestChange.extend(false);

    LatestChange.prototype.getRange = function() {
      this.stopSelection();
      return this.vimState.mark.getRange('[', ']');
    };

    return LatestChange;

  })(TextObject);

  ALatestChange = (function(superClass) {
    extend(ALatestChange, superClass);

    function ALatestChange() {
      return ALatestChange.__super__.constructor.apply(this, arguments);
    }

    ALatestChange.extend();

    return ALatestChange;

  })(LatestChange);

  InnerLatestChange = (function(superClass) {
    extend(InnerLatestChange, superClass);

    function InnerLatestChange() {
      return InnerLatestChange.__super__.constructor.apply(this, arguments);
    }

    InnerLatestChange.extend();

    return InnerLatestChange;

  })(LatestChange);

  SearchMatchForward = (function(superClass) {
    extend(SearchMatchForward, superClass);

    function SearchMatchForward() {
      return SearchMatchForward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchForward.extend();

    SearchMatchForward.prototype.backward = false;

    SearchMatchForward.prototype.findMatch = function(fromPoint, pattern) {
      var found;
      if (this.isMode('visual')) {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "forward");
      }
      found = null;
      this.scanForward(pattern, {
        from: [fromPoint.row, 0]
      }, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
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
      var fromPoint, pattern, range, ref3, whichIsHead;
      pattern = this.globalState.get('lastSearchPattern');
      if (pattern == null) {
        return;
      }
      fromPoint = selection.getHeadBufferPosition();
      ref3 = this.findMatch(fromPoint, pattern), range = ref3.range, whichIsHead = ref3.whichIsHead;
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
        return new Range(tail, head).union(swrap(selection).getTailBufferRange());
      }
    };

    SearchMatchForward.prototype.selectTextObject = function(selection) {
      var range, ref3, reversed;
      if (!(range = this.getRange(selection))) {
        return;
      }
      reversed = (ref3 = this.reversed) != null ? ref3 : this.backward;
      swrap(selection).setBufferRange(range, {
        reversed: reversed
      });
      selection.cursor.autoscroll();
      return true;
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
      if (this.isMode('visual')) {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "backward");
      }
      found = null;
      this.scanBackward(pattern, {
        from: [fromPoint.row, 2e308]
      }, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
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

    PreviousSelection.prototype.select = function() {
      var properties, ref3, selection, submode;
      ref3 = this.vimState.previousSelection, properties = ref3.properties, submode = ref3.submode;
      if ((properties != null) && (submode != null)) {
        selection = this.editor.getLastSelection();
        swrap(selection).selectByProperties(properties);
        return this.wise = submode;
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

    PersistentSelection.prototype.select = function() {
      var persistentSelection;
      persistentSelection = this.vimState.persistentSelection;
      if (!persistentSelection.isEmpty()) {
        persistentSelection.setSelectedBufferRanges();
        return this.wise = swrap.detectVisualModeSubmode(this.editor);
      }
    };

    return PersistentSelection;

  })(TextObject);

  APersistentSelection = (function(superClass) {
    extend(APersistentSelection, superClass);

    function APersistentSelection() {
      return APersistentSelection.__super__.constructor.apply(this, arguments);
    }

    APersistentSelection.extend();

    return APersistentSelection;

  })(PersistentSelection);

  InnerPersistentSelection = (function(superClass) {
    extend(InnerPersistentSelection, superClass);

    function InnerPersistentSelection() {
      return InnerPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    InnerPersistentSelection.extend();

    return InnerPersistentSelection;

  })(PersistentSelection);

  VisibleArea = (function(superClass) {
    extend(VisibleArea, superClass);

    function VisibleArea() {
      return VisibleArea.__super__.constructor.apply(this, arguments);
    }

    VisibleArea.extend(false);

    VisibleArea.prototype.getRange = function(selection) {
      var bufferRange;
      this.stopSelection();
      bufferRange = getVisibleBufferRange(this.editor);
      if (bufferRange.getRows() > this.editor.getRowsPerPage()) {
        return bufferRange.translate([+1, 0], [-3, 0]);
      } else {
        return bufferRange;
      }
    };

    return VisibleArea;

  })(TextObject);

  AVisibleArea = (function(superClass) {
    extend(AVisibleArea, superClass);

    function AVisibleArea() {
      return AVisibleArea.__super__.constructor.apply(this, arguments);
    }

    AVisibleArea.extend();

    return AVisibleArea;

  })(VisibleArea);

  InnerVisibleArea = (function(superClass) {
    extend(InnerVisibleArea, superClass);

    function InnerVisibleArea() {
      return InnerVisibleArea.__super__.constructor.apply(this, arguments);
    }

    InnerVisibleArea.extend();

    return InnerVisibleArea;

  })(VisibleArea);

  Edge = (function(superClass) {
    extend(Edge, superClass);

    function Edge() {
      return Edge.__super__.constructor.apply(this, arguments);
    }

    Edge.extend(false);

    Edge.prototype.wise = 'linewise';

    Edge.prototype.getRange = function(selection) {
      var endScreenPoint, fromPoint, moveDownToEdge, moveUpToEdge, range, screenRange, startScreenPoint;
      fromPoint = this.getNormalizedHeadScreenPosition(selection);
      moveUpToEdge = this["new"]('MoveUpToEdge');
      moveDownToEdge = this["new"]('MoveDownToEdge');
      if (!moveUpToEdge.isStoppablePoint(fromPoint)) {
        return;
      }
      startScreenPoint = endScreenPoint = null;
      if (moveUpToEdge.isEdge(fromPoint)) {
        startScreenPoint = endScreenPoint = fromPoint;
      }
      if (moveUpToEdge.isStoppablePoint(fromPoint.translate([-1, 0]))) {
        startScreenPoint = moveUpToEdge.getPoint(fromPoint);
      }
      if (moveDownToEdge.isStoppablePoint(fromPoint.translate([+1, 0]))) {
        endScreenPoint = moveDownToEdge.getPoint(fromPoint);
      }
      if ((startScreenPoint != null) && (endScreenPoint != null)) {
        screenRange = new Range(startScreenPoint, endScreenPoint);
        range = this.editor.bufferRangeForScreenRange(screenRange);
        return getBufferRangeForRowRange(this.editor, [range.start.row, range.end.row]);
      }
    };

    return Edge;

  })(TextObject);

  AEdge = (function(superClass) {
    extend(AEdge, superClass);

    function AEdge() {
      return AEdge.__super__.constructor.apply(this, arguments);
    }

    AEdge.extend();

    return AEdge;

  })(Edge);

  InnerEdge = (function(superClass) {
    extend(InnerEdge, superClass);

    function InnerEdge() {
      return InnerEdge.__super__.constructor.apply(this, arguments);
    }

    InnerEdge.extend();

    return InnerEdge;

  })(Edge);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdGV4dC1vYmplY3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4d0RBQUE7SUFBQTs7OztFQUFBLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQU9KLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLE9BZUksT0FBQSxDQUFRLFNBQVIsQ0FmSixFQUNFLDhEQURGLEVBRUUsNERBRkYsRUFHRSw4RUFIRixFQUlFLDBEQUpGLEVBS0UsZ0VBTEYsRUFNRSx3REFORixFQU9FLGtEQVBGLEVBUUUsa0RBUkYsRUFTRSxrQ0FURixFQVVFLGdEQVZGLEVBV0UsMEJBWEYsRUFhRSw0QkFiRixFQWNFOztFQUVGLE9BQTBDLE9BQUEsQ0FBUSxzQkFBUixDQUExQyxFQUFDLGtDQUFELEVBQWdCLDhCQUFoQixFQUE2Qjs7RUFFdkI7OztJQUNKLFVBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7eUJBQ0EsSUFBQSxHQUFNOzt5QkFDTixZQUFBLEdBQWM7O0lBRUQsb0JBQUE7TUFDWCxJQUFDLENBQUEsV0FBVyxDQUFBLFNBQUUsQ0FBQSxLQUFkLEdBQXNCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVSxDQUFDLFVBQVgsQ0FBc0IsT0FBdEI7TUFDdEIsNkNBQUEsU0FBQTtNQUNBLElBQUMsQ0FBQSxVQUFELENBQUE7SUFIVzs7eUJBS2IsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUE7SUFETTs7eUJBR1QsR0FBQSxHQUFLLFNBQUE7YUFDSCxDQUFJLElBQUMsQ0FBQSxPQUFELENBQUE7SUFERDs7eUJBR0wsYUFBQSxHQUFlLFNBQUE7YUFDYixJQUFD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LENBQUwsQ0FBcEIsQ0FBOUIsQ0FBSDtRQUNFLGdCQUFBLEdBQW1CLFlBQVksQ0FBQyxRQUFiLENBQXNCLFNBQXRCLEVBRHJCOztNQUdBLElBQUcsY0FBYyxDQUFDLGdCQUFmLENBQWdDLFNBQVMsQ0FBQyxTQUFWLENBQW9CLENBQUMsQ0FBQyxDQUFGLEVBQUssQ0FBTCxDQUFwQixDQUFoQyxDQUFIO1FBQ0UsY0FBQSxHQUFpQixjQUFjLENBQUMsUUFBZixDQUF3QixTQUF4QixFQURuQjs7TUFHQSxJQUFHLDBCQUFBLElBQXNCLHdCQUF6QjtRQUNFLFdBQUEsR0FBa0IsSUFBQSxLQUFBLENBQU0sZ0JBQU4sRUFBd0IsY0FBeEI7UUFDbEIsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMseUJBQVIsQ0FBa0MsV0FBbEM7ZUFDUix5QkFBQSxDQUEwQixJQUFDLENBQUEsTUFBM0IsRUFBbUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQWIsRUFBa0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUE1QixDQUFuQyxFQUhGOztJQWhCUTs7OztLQUpPOztFQXlCYjs7Ozs7OztJQUNKLEtBQUMsQ0FBQSxNQUFELENBQUE7Ozs7S0FEa0I7O0VBRWQ7Ozs7Ozs7SUFDSixTQUFDLENBQUEsTUFBRCxDQUFBOzs7O0tBRHNCO0FBcHlCeEIiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG4jIFtUT0RPXSBOZWVkIG92ZXJoYXVsXG4jICAtIFsgXSBtdXN0IGhhdmUgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSAtPlxuIyAgLSBbIF0gUmVtb3ZlIHNlbGVjdFRleHRPYmplY3Q/XG4jICAtIFsgXSBNYWtlIGV4cGFuZGFibGUgYnkgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkudW5pb24oQGdldFJhbmdlKHNlbGVjdGlvbikpXG4jICAtIFsgXSBDb3VudCBzdXBwb3J0KHByaW9yaXR5IGxvdyk/XG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xue1xuICBnZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb25cbiAgZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3dcbiAgZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3dcbiAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZVxuICBpc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93XG4gIGV4cGFuZFJhbmdlVG9XaGl0ZVNwYWNlc1xuICBnZXRWaXNpYmxlQnVmZmVyUmFuZ2VcbiAgdHJhbnNsYXRlUG9pbnRBbmRDbGlwXG4gIGdldEJ1ZmZlclJvd3NcbiAgZ2V0VmFsaWRWaW1CdWZmZXJSb3dcbiAgdHJpbVJhbmdlXG5cbiAgc29ydFJhbmdlc1xuICBwb2ludElzQXRFbmRPZkxpbmVcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xue0JyYWNrZXRGaW5kZXIsIFF1b3RlRmluZGVyLCBUYWdGaW5kZXJ9ID0gcmVxdWlyZSAnLi9wYWlyLWZpbmRlci5jb2ZmZWUnXG5cbmNsYXNzIFRleHRPYmplY3QgZXh0ZW5kcyBCYXNlXG4gIEBleHRlbmQoZmFsc2UpXG4gIHdpc2U6IG51bGxcbiAgc3VwcG9ydENvdW50OiBmYWxzZSAjIEZJWE1FICM0NzIsICM2NlxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjb25zdHJ1Y3Rvcjo6aW5uZXIgPSBAZ2V0TmFtZSgpLnN0YXJ0c1dpdGgoJ0lubmVyJylcbiAgICBzdXBlclxuICAgIEBpbml0aWFsaXplKClcblxuICBpc0lubmVyOiAtPlxuICAgIEBpbm5lclxuXG4gIGlzQTogLT5cbiAgICBub3QgQGlzSW5uZXIoKVxuXG4gIGlzU3Vwb3J0Q291bnQ6IC0+XG4gICAgQHN1cHBvcnRDb3VudFxuXG4gIGdldFdpc2U6IC0+XG4gICAgaWYgQHdpc2U/IGFuZCBAZ2V0T3BlcmF0b3IoKS5pc09jY3VycmVuY2UoKVxuICAgICAgJ2NoYXJhY3Rlcndpc2UnXG4gICAgZWxzZVxuICAgICAgQHdpc2VcblxuICBpc0NoYXJhY3Rlcndpc2U6IC0+XG4gICAgQGdldFdpc2UoKSBpcyAnY2hhcmFjdGVyd2lzZSdcblxuICBpc0xpbmV3aXNlOiAtPlxuICAgIEBnZXRXaXNlKCkgaXMgJ2xpbmV3aXNlJ1xuXG4gIGlzQmxvY2t3aXNlOiAtPlxuICAgIEBnZXRXaXNlKCkgaXMgJ2Jsb2Nrd2lzZSdcblxuICBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIGhlYWQgPSBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKSBhbmQgbm90IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIGhlYWQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgaGVhZCwgJ2JhY2t3YXJkJylcbiAgICBoZWFkXG5cbiAgZ2V0Tm9ybWFsaXplZEhlYWRTY3JlZW5Qb3NpdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBidWZmZXJQb3NpdGlvbiA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbilcbiAgICBAZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pXG5cbiAgbmVlZFRvS2VlcENvbHVtbjogLT5cbiAgICBAd2lzZSBpcyAnbGluZXdpc2UnIGFuZFxuICAgICAgQGdldENvbmZpZygna2VlcENvbHVtbk9uU2VsZWN0VGV4dE9iamVjdCcpIGFuZFxuICAgICAgQGdldE9wZXJhdG9yKCkuaW5zdGFuY2VvZignU2VsZWN0JylcblxuICBleGVjdXRlOiAtPlxuICAgICMgV2hlbm5ldmVyIFRleHRPYmplY3QgaXMgZXhlY3V0ZWQsIGl0IGhhcyBAb3BlcmF0b3JcbiAgICAjIENhbGxlZCBmcm9tIE9wZXJhdG9yOjpzZWxlY3RUYXJnZXQoKVxuICAgICMgIC0gYHYgaSBwYCwgaXMgYFNlbGVjdGAgb3BlcmF0b3Igd2l0aCBAdGFyZ2V0ID0gYElubmVyUGFyYWdyYXBoYC5cbiAgICAjICAtIGBkIGkgcGAsIGlzIGBEZWxldGVgIG9wZXJhdG9yIHdpdGggQHRhcmdldCA9IGBJbm5lclBhcmFncmFwaGAuXG4gICAgaWYgQG9wZXJhdG9yP1xuICAgICAgQHNlbGVjdCgpXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbiBUZXh0T2JqZWN0OiBNdXN0IG5vdCBoYXBwZW4nKVxuXG4gIHNlbGVjdDogLT5cbiAgICBzZWxlY3RSZXN1bHRzID0gW11cbiAgICBAY291bnRUaW1lcyBAZ2V0Q291bnQoKSwgKHtzdG9wfSkgPT5cbiAgICAgIEBzdG9wU2VsZWN0aW9uID0gc3RvcFxuXG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgIHNlbGVjdFJlc3VsdHMucHVzaChAc2VsZWN0VGV4dE9iamVjdChzZWxlY3Rpb24pKVxuXG4gICAgICB1bmxlc3MgQGlzU3Vwb3J0Q291bnQoKVxuICAgICAgICBzdG9wKCkgIyBGSVhNRTogcXVpY2stZml4IGZvciAjNTYwXG5cbiAgICBpZiBAbmVlZFRvS2VlcENvbHVtbigpXG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgIHN3cmFwKHNlbGVjdGlvbikuY2xpcFByb3BlcnRpZXNUaWxsRW5kT2ZMaW5lKClcblxuICAgIEBlZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKSBhbmQgQHdpc2UgaXMgJ2NoYXJhY3Rlcndpc2UnXG4gICAgICBzd3JhcC5zYXZlUHJvcGVydGllcyhAZWRpdG9yKVxuXG4gICAgaWYgc2VsZWN0UmVzdWx0cy5zb21lKCh2YWx1ZSkgLT4gdmFsdWUpXG4gICAgICBAd2lzZSA/PSBzd3JhcC5kZXRlY3RWaXN1YWxNb2RlU3VibW9kZShAZWRpdG9yKVxuICAgIGVsc2VcbiAgICAgIEB3aXNlID0gbnVsbFxuXG4gIHNlbGVjdFRleHRPYmplY3Q6IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgcmFuZ2UgPSBAZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgb2xkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuXG4gICAgICBuZWVkVG9LZWVwQ29sdW1uID0gQG5lZWRUb0tlZXBDb2x1bW4oKVxuICAgICAgaWYgbmVlZFRvS2VlcENvbHVtbiBhbmQgbm90IEBpc01vZGUoJ3Zpc3VhbCcsICdsaW5ld2lzZScpXG4gICAgICAgIEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5hY3RpdmF0ZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcblxuICAgICAgIyBQcmV2ZW50IGF1dG9zY3JvbGwgdG8gY2xvc2luZyBjaGFyIG9uIGBjaGFuZ2Utc3Vycm91bmQtYW55LXBhaXJgLlxuICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgYXV0b3Njcm9sbDogc2VsZWN0aW9uLmlzTGFzdFNlbGVjdGlvbigpIGFuZCBub3QgQGdldE9wZXJhdG9yKCkuc3VwcG9ydEVhcmx5U2VsZWN0XG4gICAgICAgIGtlZXBHb2FsQ29sdW1uOiBuZWVkVG9LZWVwQ29sdW1uXG4gICAgICB9XG4gICAgICBzd3JhcChzZWxlY3Rpb24pLnNldEJ1ZmZlclJhbmdlU2FmZWx5KHJhbmdlLCBvcHRpb25zKVxuXG4gICAgICBuZXdSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICBpZiBuZXdSYW5nZS5pc0VxdWFsKG9sZFJhbmdlKVxuICAgICAgICBAc3RvcFNlbGVjdGlvbigpICMgRklYTUU6IHF1aWNrLWZpeCBmb3IgIzU2MFxuXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgQHN0b3BTZWxlY3Rpb24oKSAjIEZJWE1FOiBxdWljay1maXggZm9yICM1NjBcbiAgICAgIGZhbHNlXG5cbiAgZ2V0UmFuZ2U6IC0+XG4gICAgIyBJIHdhbnQgdG9cbiAgICAjIHRocm93IG5ldyBFcnJvcigndGV4dC1vYmplY3QgbXVzdCByZXNwb25kIHRvIHJhbmdlIGJ5IGdldFJhbmdlKCkhJylcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBXb3JkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHBvaW50ID0gQGdldE5vcm1hbGl6ZWRIZWFkQnVmZmVyUG9zaXRpb24oc2VsZWN0aW9uKVxuICAgIHtyYW5nZX0gPSBAZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24ocG9pbnQsIHtAd29yZFJlZ2V4fSlcbiAgICBpZiBAaXNBKClcbiAgICAgIGV4cGFuZFJhbmdlVG9XaGl0ZVNwYWNlcyhAZWRpdG9yLCByYW5nZSlcbiAgICBlbHNlXG4gICAgICByYW5nZVxuXG5jbGFzcyBBV29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lcldvcmQgZXh0ZW5kcyBXb3JkXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFdob2xlV29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgd29yZFJlZ2V4OiAvXFxTKy9cblxuY2xhc3MgQVdob2xlV29yZCBleHRlbmRzIFdob2xlV29yZFxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyV2hvbGVXb3JkIGV4dGVuZHMgV2hvbGVXb3JkXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFNtYXJ0V29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9cblxuY2xhc3MgQVNtYXJ0V29yZCBleHRlbmRzIFNtYXJ0V29yZFxuICBAZGVzY3JpcHRpb246IFwiQSB3b3JkIHRoYXQgY29uc2lzdHMgb2YgYWxwaGFudW1lcmljIGNoYXJzKGAvW0EtWmEtejAtOV9dL2ApIGFuZCBoeXBoZW4gYC1gXCJcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lclNtYXJ0V29yZCBleHRlbmRzIFNtYXJ0V29yZFxuICBAZGVzY3JpcHRpb246IFwiQ3VycmVudGx5IE5vIGRpZmYgZnJvbSBgYS1zbWFydC13b3JkYFwiXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFN1YndvcmQgZXh0ZW5kcyBXb3JkXG4gIEBleHRlbmQoZmFsc2UpXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIEB3b3JkUmVnZXggPSBzZWxlY3Rpb24uY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHN1cGVyXG5cbmNsYXNzIEFTdWJ3b3JkIGV4dGVuZHMgU3Vid29yZFxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyU3Vid29yZCBleHRlbmRzIFN1YndvcmRcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgUGFpciBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgYWxsb3dOZXh0TGluZTogbnVsbFxuICBhZGp1c3RJbm5lclJhbmdlOiB0cnVlXG4gIHBhaXI6IG51bGxcbiAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gIHN1cHBvcnRDb3VudDogdHJ1ZVxuXG4gIGlzQWxsb3dOZXh0TGluZTogLT5cbiAgICBAYWxsb3dOZXh0TGluZSA/IChAcGFpcj8gYW5kIEBwYWlyWzBdIGlzbnQgQHBhaXJbMV0pXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgIyBhdXRvLXNldCBwcm9wZXJ0eSBmcm9tIGNsYXNzIG5hbWUuXG4gICAgQGFsbG93Rm9yd2FyZGluZyA/PSBAZ2V0TmFtZSgpLmVuZHNXaXRoKCdBbGxvd0ZvcndhcmRpbmcnKVxuICAgIHN1cGVyXG5cbiAgYWRqdXN0UmFuZ2U6ICh7c3RhcnQsIGVuZH0pIC0+XG4gICAgIyBEaXJ0eSB3b3JrIHRvIGZlZWwgbmF0dXJhbCBmb3IgaHVtYW4sIHRvIGJlaGF2ZSBjb21wYXRpYmxlIHdpdGggcHVyZSBWaW0uXG4gICAgIyBXaGVyZSB0aGlzIGFkanVzdG1lbnQgYXBwZWFyIGlzIGluIGZvbGxvd2luZyBzaXR1YXRpb24uXG4gICAgIyBvcC0xOiBgY2l7YCByZXBsYWNlIG9ubHkgMm5kIGxpbmVcbiAgICAjIG9wLTI6IGBkaXtgIGRlbGV0ZSBvbmx5IDJuZCBsaW5lLlxuICAgICMgdGV4dDpcbiAgICAjICB7XG4gICAgIyAgICBhYWFcbiAgICAjICB9XG4gICAgaWYgcG9pbnRJc0F0RW5kT2ZMaW5lKEBlZGl0b3IsIHN0YXJ0KVxuICAgICAgc3RhcnQgPSBzdGFydC50cmF2ZXJzZShbMSwgMF0pXG5cbiAgICBpZiBnZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb24oQGVkaXRvciwgZW5kKS5tYXRjaCgvXlxccyokLylcbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICAgICMgVGhpcyBpcyBzbGlnaHRseSBpbm5jb25zaXN0ZW50IHdpdGggcmVndWxhciBWaW1cbiAgICAgICAgIyAtIHJlZ3VsYXIgVmltOiBzZWxlY3QgbmV3IGxpbmUgYWZ0ZXIgRU9MXG4gICAgICAgICMgLSB2aW0tbW9kZS1wbHVzOiBzZWxlY3QgdG8gRU9MKGJlZm9yZSBuZXcgbGluZSlcbiAgICAgICAgIyBUaGlzIGlzIGludGVudGlvbmFsIHNpbmNlIHRvIG1ha2Ugc3VibW9kZSBgY2hhcmFjdGVyd2lzZWAgd2hlbiBhdXRvLWRldGVjdCBzdWJtb2RlXG4gICAgICAgICMgaW5uZXJFbmQgPSBuZXcgUG9pbnQoaW5uZXJFbmQucm93IC0gMSwgSW5maW5pdHkpXG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93IC0gMSwgSW5maW5pdHkpXG4gICAgICBlbHNlXG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93LCAwKVxuXG4gICAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG5cbiAgZ2V0RmluZGVyOiAtPlxuICAgIG9wdGlvbnMgPSB7YWxsb3dOZXh0TGluZTogQGlzQWxsb3dOZXh0TGluZSgpLCBAYWxsb3dGb3J3YXJkaW5nLCBAcGFpcn1cbiAgICBpZiBAcGFpclswXSBpcyBAcGFpclsxXVxuICAgICAgbmV3IFF1b3RlRmluZGVyKEBlZGl0b3IsIG9wdGlvbnMpXG4gICAgZWxzZVxuICAgICAgbmV3IEJyYWNrZXRGaW5kZXIoQGVkaXRvciwgb3B0aW9ucylcblxuICBnZXRQYWlySW5mbzogKGZyb20pIC0+XG4gICAgcGFpckluZm8gPSBAZ2V0RmluZGVyKCkuZmluZChmcm9tKVxuICAgIHVubGVzcyBwYWlySW5mbz9cbiAgICAgIHJldHVybiBudWxsXG4gICAgcGFpckluZm8uaW5uZXJSYW5nZSA9IEBhZGp1c3RSYW5nZShwYWlySW5mby5pbm5lclJhbmdlKSBpZiBAYWRqdXN0SW5uZXJSYW5nZVxuICAgIHBhaXJJbmZvLnRhcmdldFJhbmdlID0gaWYgQGlzSW5uZXIoKSB0aGVuIHBhaXJJbmZvLmlubmVyUmFuZ2UgZWxzZSBwYWlySW5mby5hUmFuZ2VcbiAgICBwYWlySW5mb1xuXG4gIGdldFBvaW50VG9TZWFyY2hGcm9tOiAoc2VsZWN0aW9uLCBzZWFyY2hGcm9tKSAtPlxuICAgIHN3aXRjaCBzZWFyY2hGcm9tXG4gICAgICB3aGVuICdoZWFkJyB0aGVuIEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbilcbiAgICAgIHdoZW4gJ3N0YXJ0JyB0aGVuIHN3cmFwKHNlbGVjdGlvbikuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ3N0YXJ0JylcblxuICAjIEFsbG93IG92ZXJyaWRlIEBhbGxvd0ZvcndhcmRpbmcgYnkgMm5kIGFyZ3VtZW50LlxuICBnZXRSYW5nZTogKHNlbGVjdGlvbiwgb3B0aW9ucz17fSkgLT5cbiAgICB7YWxsb3dGb3J3YXJkaW5nLCBzZWFyY2hGcm9tfSA9IG9wdGlvbnNcbiAgICBzZWFyY2hGcm9tID89ICdoZWFkJ1xuICAgIEBhbGxvd0ZvcndhcmRpbmcgPSBhbGxvd0ZvcndhcmRpbmcgaWYgYWxsb3dGb3J3YXJkaW5nP1xuICAgIG9yaWdpbmFsUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIHBhaXJJbmZvID0gQGdldFBhaXJJbmZvKEBnZXRQb2ludFRvU2VhcmNoRnJvbShzZWxlY3Rpb24sIHNlYXJjaEZyb20pKVxuICAgICMgV2hlbiByYW5nZSB3YXMgc2FtZSwgdHJ5IHRvIGV4cGFuZCByYW5nZVxuICAgIGlmIHBhaXJJbmZvPy50YXJnZXRSYW5nZS5pc0VxdWFsKG9yaWdpbmFsUmFuZ2UpXG4gICAgICBwYWlySW5mbyA9IEBnZXRQYWlySW5mbyhwYWlySW5mby5hUmFuZ2UuZW5kKVxuICAgIHBhaXJJbmZvPy50YXJnZXRSYW5nZVxuXG4jIFVzZWQgYnkgRGVsZXRlU3Vycm91bmRcbmNsYXNzIEFQYWlyIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEFueVBhaXIgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIGFsbG93Rm9yd2FyZGluZzogZmFsc2VcbiAgbWVtYmVyOiBbXG4gICAgJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJyxcbiAgICAnQ3VybHlCcmFja2V0JywgJ0FuZ2xlQnJhY2tldCcsICdTcXVhcmVCcmFja2V0JywgJ1BhcmVudGhlc2lzJ1xuICBdXG5cbiAgZ2V0UmFuZ2VCeTogKGtsYXNzLCBzZWxlY3Rpb24pIC0+XG4gICAgQG5ldyhrbGFzcykuZ2V0UmFuZ2Uoc2VsZWN0aW9uLCB7QGFsbG93Rm9yd2FyZGluZywgQHNlYXJjaEZyb219KVxuXG4gIGdldFJhbmdlczogKHNlbGVjdGlvbikgLT5cbiAgICBwcmVmaXggPSBpZiBAaXNJbm5lcigpIHRoZW4gJ0lubmVyJyBlbHNlICdBJ1xuICAgIHJhbmdlcyA9IFtdXG4gICAgZm9yIGtsYXNzIGluIEBtZW1iZXIgd2hlbiByYW5nZSA9IEBnZXRSYW5nZUJ5KHByZWZpeCArIGtsYXNzLCBzZWxlY3Rpb24pXG4gICAgICByYW5nZXMucHVzaChyYW5nZSlcbiAgICByYW5nZXNcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZXMgPSBAZ2V0UmFuZ2VzKHNlbGVjdGlvbilcbiAgICBfLmxhc3Qoc29ydFJhbmdlcyhyYW5nZXMpKSBpZiByYW5nZXMubGVuZ3RoXG5cbmNsYXNzIEFBbnlQYWlyIGV4dGVuZHMgQW55UGFpclxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyQW55UGFpciBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlc2NyaXB0aW9uOiBcIlJhbmdlIHN1cnJvdW5kZWQgYnkgYXV0by1kZXRlY3RlZCBwYWlyZWQgY2hhcnMgZnJvbSBlbmNsb3NlZCBhbmQgZm9yd2FyZGluZyBhcmVhXCJcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG4gIHNlYXJjaEZyb206ICdzdGFydCdcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2VzID0gQGdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgZnJvbSA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIFtmb3J3YXJkaW5nUmFuZ2VzLCBlbmNsb3NpbmdSYW5nZXNdID0gXy5wYXJ0aXRpb24gcmFuZ2VzLCAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChmcm9tKVxuICAgIGVuY2xvc2luZ1JhbmdlID0gXy5sYXN0KHNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKSlcbiAgICBmb3J3YXJkaW5nUmFuZ2VzID0gc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgIyBXaGVuIGVuY2xvc2luZ1JhbmdlIGlzIGV4aXN0cyxcbiAgICAjIFdlIGRvbid0IGdvIGFjcm9zcyBlbmNsb3NpbmdSYW5nZS5lbmQuXG4gICAgIyBTbyBjaG9vc2UgZnJvbSByYW5nZXMgY29udGFpbmVkIGluIGVuY2xvc2luZ1JhbmdlLlxuICAgIGlmIGVuY2xvc2luZ1JhbmdlXG4gICAgICBmb3J3YXJkaW5nUmFuZ2VzID0gZm9yd2FyZGluZ1Jhbmdlcy5maWx0ZXIgKHJhbmdlKSAtPlxuICAgICAgICBlbmNsb3NpbmdSYW5nZS5jb250YWluc1JhbmdlKHJhbmdlKVxuXG4gICAgZm9yd2FyZGluZ1Jhbmdlc1swXSBvciBlbmNsb3NpbmdSYW5nZVxuXG5jbGFzcyBBQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFueVBhaXJBbGxvd0ZvcndhcmRpbmdcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckFueVBhaXJBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBBbnlQYWlyQWxsb3dGb3J3YXJkaW5nXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEFueVF1b3RlIGV4dGVuZHMgQW55UGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcbiAgbWVtYmVyOiBbJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJ11cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2VzID0gQGdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgIyBQaWNrIHJhbmdlIHdoaWNoIGVuZC5jb2x1bSBpcyBsZWZ0bW9zdChtZWFuLCBjbG9zZWQgZmlyc3QpXG4gICAgXy5maXJzdChfLnNvcnRCeShyYW5nZXMsIChyKSAtPiByLmVuZC5jb2x1bW4pKSBpZiByYW5nZXMubGVuZ3RoXG5cbmNsYXNzIEFBbnlRdW90ZSBleHRlbmRzIEFueVF1b3RlXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJBbnlRdW90ZSBleHRlbmRzIEFueVF1b3RlXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFF1b3RlIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBEb3VibGVRdW90ZSBleHRlbmRzIFF1b3RlXG4gIEBleHRlbmQoZmFsc2UpXG4gIHBhaXI6IFsnXCInLCAnXCInXVxuXG5jbGFzcyBBRG91YmxlUXVvdGUgZXh0ZW5kcyBEb3VibGVRdW90ZVxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyRG91YmxlUXVvdGUgZXh0ZW5kcyBEb3VibGVRdW90ZVxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTaW5nbGVRdW90ZSBleHRlbmRzIFF1b3RlXG4gIEBleHRlbmQoZmFsc2UpXG4gIHBhaXI6IFtcIidcIiwgXCInXCJdXG5cbmNsYXNzIEFTaW5nbGVRdW90ZSBleHRlbmRzIFNpbmdsZVF1b3RlXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJTaW5nbGVRdW90ZSBleHRlbmRzIFNpbmdsZVF1b3RlXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEJhY2tUaWNrIGV4dGVuZHMgUXVvdGVcbiAgQGV4dGVuZChmYWxzZSlcbiAgcGFpcjogWydgJywgJ2AnXVxuXG5jbGFzcyBBQmFja1RpY2sgZXh0ZW5kcyBCYWNrVGlja1xuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyQmFja1RpY2sgZXh0ZW5kcyBCYWNrVGlja1xuICBAZXh0ZW5kKClcblxuIyBQYWlyIGV4cGFuZHMgbXVsdGktbGluZXNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQ3VybHlCcmFja2V0IGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJ3snLCAnfSddXG5cbmNsYXNzIEFDdXJseUJyYWNrZXQgZXh0ZW5kcyBDdXJseUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckN1cmx5QnJhY2tldCBleHRlbmRzIEN1cmx5QnJhY2tldFxuICBAZXh0ZW5kKClcbmNsYXNzIEFDdXJseUJyYWNrZXRBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBDdXJseUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckN1cmx5QnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEN1cmx5QnJhY2tldFxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTcXVhcmVCcmFja2V0IGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJ1snLCAnXSddXG5cbmNsYXNzIEFTcXVhcmVCcmFja2V0IGV4dGVuZHMgU3F1YXJlQnJhY2tldFxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyU3F1YXJlQnJhY2tldCBleHRlbmRzIFNxdWFyZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5jbGFzcyBBU3F1YXJlQnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIFNxdWFyZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lclNxdWFyZUJyYWNrZXRBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBTcXVhcmVCcmFja2V0XG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFBhcmVudGhlc2lzIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJygnLCAnKSddXG5cbmNsYXNzIEFQYXJlbnRoZXNpcyBleHRlbmRzIFBhcmVudGhlc2lzXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJQYXJlbnRoZXNpcyBleHRlbmRzIFBhcmVudGhlc2lzXG4gIEBleHRlbmQoKVxuY2xhc3MgQVBhcmVudGhlc2lzQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgUGFyZW50aGVzaXNcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lclBhcmVudGhlc2lzQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgUGFyZW50aGVzaXNcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQW5nbGVCcmFja2V0IGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJzwnLCAnPiddXG5cbmNsYXNzIEFBbmdsZUJyYWNrZXQgZXh0ZW5kcyBBbmdsZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckFuZ2xlQnJhY2tldCBleHRlbmRzIEFuZ2xlQnJhY2tldFxuICBAZXh0ZW5kKClcbmNsYXNzIEFBbmdsZUJyYWNrZXRBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBBbmdsZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckFuZ2xlQnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFuZ2xlQnJhY2tldFxuICBAZXh0ZW5kKClcblxuIyBUYWdcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgVGFnIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd05leHRMaW5lOiB0cnVlXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBhZGp1c3RJbm5lclJhbmdlOiBmYWxzZVxuXG4gIGdldFRhZ1N0YXJ0UG9pbnQ6IChmcm9tKSAtPlxuICAgIHRhZ1JhbmdlID0gbnVsbFxuICAgIHBhdHRlcm4gPSBUYWdGaW5kZXI6OnBhdHRlcm5cbiAgICBAc2NhbkZvcndhcmQgcGF0dGVybiwge2Zyb206IFtmcm9tLnJvdywgMF19LCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmNvbnRhaW5zUG9pbnQoZnJvbSwgdHJ1ZSlcbiAgICAgICAgdGFnUmFuZ2UgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB0YWdSYW5nZT8uc3RhcnRcblxuICBnZXRGaW5kZXI6IC0+XG4gICAgbmV3IFRhZ0ZpbmRlcihAZWRpdG9yLCB7YWxsb3dOZXh0TGluZTogQGlzQWxsb3dOZXh0TGluZSgpLCBAYWxsb3dGb3J3YXJkaW5nfSlcblxuICBnZXRQYWlySW5mbzogKGZyb20pIC0+XG4gICAgc3VwZXIoQGdldFRhZ1N0YXJ0UG9pbnQoZnJvbSkgPyBmcm9tKVxuXG5jbGFzcyBBVGFnIGV4dGVuZHMgVGFnXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJUYWcgZXh0ZW5kcyBUYWdcbiAgQGV4dGVuZCgpXG5cbiMgUGFyYWdyYXBoXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgUGFyYWdyYXBoIGlzIGRlZmluZWQgYXMgY29uc2VjdXRpdmUgKG5vbi0pYmxhbmstbGluZS5cbmNsYXNzIFBhcmFncmFwaCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBzdXBwb3J0Q291bnQ6IHRydWVcblxuICBmaW5kUm93OiAoZnJvbVJvdywgZGlyZWN0aW9uLCBmbikgLT5cbiAgICBmbi5yZXNldD8oKVxuICAgIGZvdW5kUm93ID0gZnJvbVJvd1xuICAgIGZvciByb3cgaW4gZ2V0QnVmZmVyUm93cyhAZWRpdG9yLCB7c3RhcnRSb3c6IGZyb21Sb3csIGRpcmVjdGlvbn0pXG4gICAgICBicmVhayB1bmxlc3MgZm4ocm93LCBkaXJlY3Rpb24pXG4gICAgICBmb3VuZFJvdyA9IHJvd1xuXG4gICAgZm91bmRSb3dcblxuICBmaW5kUm93UmFuZ2VCeTogKGZyb21Sb3csIGZuKSAtPlxuICAgIHN0YXJ0Um93ID0gQGZpbmRSb3coZnJvbVJvdywgJ3ByZXZpb3VzJywgZm4pXG4gICAgZW5kUm93ID0gQGZpbmRSb3coZnJvbVJvdywgJ25leHQnLCBmbilcbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuICBnZXRQcmVkaWN0RnVuY3Rpb246IChmcm9tUm93LCBzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvd1Jlc3VsdCA9IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhmcm9tUm93KVxuXG4gICAgaWYgQGlzSW5uZXIoKVxuICAgICAgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT5cbiAgICAgICAgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgaXMgZnJvbVJvd1Jlc3VsdFxuICAgIGVsc2VcbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgZGlyZWN0aW9uVG9FeHRlbmQgPSAncHJldmlvdXMnXG4gICAgICBlbHNlXG4gICAgICAgIGRpcmVjdGlvblRvRXh0ZW5kID0gJ25leHQnXG5cbiAgICAgIGZsaXAgPSBmYWxzZVxuICAgICAgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT5cbiAgICAgICAgcmVzdWx0ID0gQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgaXMgZnJvbVJvd1Jlc3VsdFxuICAgICAgICBpZiBmbGlwXG4gICAgICAgICAgbm90IHJlc3VsdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgKG5vdCByZXN1bHQpIGFuZCAoZGlyZWN0aW9uIGlzIGRpcmVjdGlvblRvRXh0ZW5kKVxuICAgICAgICAgICAgZmxpcCA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgcmVzdWx0XG5cbiAgICAgIHByZWRpY3QucmVzZXQgPSAtPlxuICAgICAgICBmbGlwID0gZmFsc2VcbiAgICBwcmVkaWN0XG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgb3JpZ2luYWxSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgZnJvbVJvdyA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbikucm93XG5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgICAgaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgICBmcm9tUm93LS1cbiAgICAgIGVsc2VcbiAgICAgICAgZnJvbVJvdysrXG4gICAgICBmcm9tUm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgZnJvbVJvdylcblxuICAgIHJvd1JhbmdlID0gQGZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIEBnZXRQcmVkaWN0RnVuY3Rpb24oZnJvbVJvdywgc2VsZWN0aW9uKSlcbiAgICBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS51bmlvbihnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIHJvd1JhbmdlKSlcblxuY2xhc3MgQVBhcmFncmFwaCBleHRlbmRzIFBhcmFncmFwaFxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyUGFyYWdyYXBoIGV4dGVuZHMgUGFyYWdyYXBoXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluZGVudGF0aW9uIGV4dGVuZHMgUGFyYWdyYXBoXG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvdyA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbikucm93XG5cbiAgICBiYXNlSW5kZW50TGV2ZWwgPSBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCBmcm9tUm93KVxuICAgIHByZWRpY3QgPSAocm93KSA9PlxuICAgICAgaWYgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICAgICAgQGlzQSgpXG4gICAgICBlbHNlXG4gICAgICAgIGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KEBlZGl0b3IsIHJvdykgPj0gYmFzZUluZGVudExldmVsXG5cbiAgICByb3dSYW5nZSA9IEBmaW5kUm93UmFuZ2VCeShmcm9tUm93LCBwcmVkaWN0KVxuICAgIGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UoQGVkaXRvciwgcm93UmFuZ2UpXG5cbmNsYXNzIEFJbmRlbnRhdGlvbiBleHRlbmRzIEluZGVudGF0aW9uXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJJbmRlbnRhdGlvbiBleHRlbmRzIEluZGVudGF0aW9uXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIENvbW1lbnQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByb3cgPSBzd3JhcChzZWxlY3Rpb24pLmdldFN0YXJ0Um93KClcbiAgICByb3dSYW5nZSA9IEBlZGl0b3IubGFuZ3VhZ2VNb2RlLnJvd1JhbmdlRm9yQ29tbWVudEF0QnVmZmVyUm93KHJvdylcbiAgICByb3dSYW5nZSA/PSBbcm93LCByb3ddIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQocm93KVxuICAgIGlmIHJvd1JhbmdlXG4gICAgICBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKHNlbGVjdGlvbi5lZGl0b3IsIHJvd1JhbmdlKVxuXG5jbGFzcyBBQ29tbWVudCBleHRlbmRzIENvbW1lbnRcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckNvbW1lbnQgZXh0ZW5kcyBDb21tZW50XG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEZvbGQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBhZGp1c3RSb3dSYW5nZTogKHJvd1JhbmdlKSAtPlxuICAgIHJldHVybiByb3dSYW5nZSB1bmxlc3MgQGlzSW5uZXIoKVxuXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gcm93UmFuZ2VcbiAgICBzdGFydFJvd0luZGVudExldmVsID0gZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coQGVkaXRvciwgc3RhcnRSb3cpXG4gICAgZW5kUm93SW5kZW50TGV2ZWwgPSBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCBlbmRSb3cpXG4gICAgZW5kUm93IC09IDEgaWYgKHN0YXJ0Um93SW5kZW50TGV2ZWwgaXMgZW5kUm93SW5kZW50TGV2ZWwpXG4gICAgc3RhcnRSb3cgKz0gMVxuICAgIFtzdGFydFJvdywgZW5kUm93XVxuXG4gIGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdzogKHJvdykgLT5cbiAgICBnZXRDb2RlRm9sZFJvd1Jhbmdlc0NvbnRhaW5lc0ZvclJvdyhAZWRpdG9yLCByb3csIGluY2x1ZGVTdGFydFJvdzogdHJ1ZSkucmV2ZXJzZSgpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcm93UmFuZ2VzID0gQGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdyhzd3JhcChzZWxlY3Rpb24pLmdldFN0YXJ0Um93KCkpXG4gICAgcmV0dXJuIHVubGVzcyByb3dSYW5nZXMubGVuZ3RoXG5cbiAgICByYW5nZSA9IGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UoQGVkaXRvciwgQGFkanVzdFJvd1JhbmdlKHJvd1Jhbmdlcy5zaGlmdCgpKSlcbiAgICBpZiByb3dSYW5nZXMubGVuZ3RoIGFuZCByYW5nZS5pc0VxdWFsKHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpKVxuICAgICAgcmFuZ2UgPSBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIEBhZGp1c3RSb3dSYW5nZShyb3dSYW5nZXMuc2hpZnQoKSkpXG4gICAgcmFuZ2VcblxuY2xhc3MgQUZvbGQgZXh0ZW5kcyBGb2xkXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJGb2xkIGV4dGVuZHMgRm9sZFxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE5PVEU6IEZ1bmN0aW9uIHJhbmdlIGRldGVybWluYXRpb24gaXMgZGVwZW5kaW5nIG9uIGZvbGQuXG5jbGFzcyBGdW5jdGlvbiBleHRlbmRzIEZvbGRcbiAgQGV4dGVuZChmYWxzZSlcblxuICAjIFNvbWUgbGFuZ3VhZ2UgZG9uJ3QgaW5jbHVkZSBjbG9zaW5nIGB9YCBpbnRvIGZvbGQuXG4gIHNjb3BlTmFtZXNPbWl0dGluZ0VuZFJvdzogWydzb3VyY2UuZ28nLCAnc291cmNlLmVsaXhpciddXG5cbiAgZ2V0Rm9sZFJvd1Jhbmdlc0NvbnRhaW5zRm9yUm93OiAocm93KSAtPlxuICAgIHJvd1JhbmdlcyA9IGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93KEBlZGl0b3IsIHJvdyk/LnJldmVyc2UoKVxuICAgIHJvd1Jhbmdlcz8uZmlsdGVyIChyb3dSYW5nZSkgPT5cbiAgICAgIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3coQGVkaXRvciwgcm93UmFuZ2VbMF0pXG5cbiAgYWRqdXN0Um93UmFuZ2U6IChyb3dSYW5nZSkgLT5cbiAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBzdXBlclxuICAgIGlmIEBpc0EoKSBhbmQgQGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lIGluIEBzY29wZU5hbWVzT21pdHRpbmdFbmRSb3dcbiAgICAgIGVuZFJvdyArPSAxXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddXG5cbmNsYXNzIEFGdW5jdGlvbiBleHRlbmRzIEZ1bmN0aW9uXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJGdW5jdGlvbiBleHRlbmRzIEZ1bmN0aW9uXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEN1cnJlbnRMaW5lIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByb3cgPSBAZ2V0Tm9ybWFsaXplZEhlYWRCdWZmZXJQb3NpdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIHJhbmdlID0gQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhyb3cpXG4gICAgaWYgQGlzQSgpXG4gICAgICByYW5nZVxuICAgIGVsc2VcbiAgICAgIHRyaW1SYW5nZShAZWRpdG9yLCByYW5nZSlcblxuY2xhc3MgQUN1cnJlbnRMaW5lIGV4dGVuZHMgQ3VycmVudExpbmVcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckN1cnJlbnRMaW5lIGV4dGVuZHMgQ3VycmVudExpbmVcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgRW50aXJlIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBzdG9wU2VsZWN0aW9uKClcbiAgICBAZWRpdG9yLmJ1ZmZlci5nZXRSYW5nZSgpXG5cbmNsYXNzIEFFbnRpcmUgZXh0ZW5kcyBFbnRpcmVcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckVudGlyZSBleHRlbmRzIEVudGlyZVxuICBAZXh0ZW5kKClcbmNsYXNzIEFsbCBleHRlbmRzIEVudGlyZSAjIEFsaWFzIGFzIGFjY2Vzc2libGUgbmFtZVxuICBAZXh0ZW5kKGZhbHNlKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEVtcHR5IGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIExhdGVzdENoYW5nZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgZ2V0UmFuZ2U6IC0+XG4gICAgQHN0b3BTZWxlY3Rpb24oKVxuICAgIEB2aW1TdGF0ZS5tYXJrLmdldFJhbmdlKCdbJywgJ10nKVxuXG5jbGFzcyBBTGF0ZXN0Q2hhbmdlIGV4dGVuZHMgTGF0ZXN0Q2hhbmdlXG4gIEBleHRlbmQoKVxuY2xhc3MgSW5uZXJMYXRlc3RDaGFuZ2UgZXh0ZW5kcyBMYXRlc3RDaGFuZ2UgIyBObyBkaWZmIGZyb20gQUxhdGVzdENoYW5nZVxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTZWFyY2hNYXRjaEZvcndhcmQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZDogZmFsc2VcblxuICBmaW5kTWF0Y2g6IChmcm9tUG9pbnQsIHBhdHRlcm4pIC0+XG4gICAgZnJvbVBvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGZyb21Qb2ludCwgXCJmb3J3YXJkXCIpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgZm91bmQgPSBudWxsXG4gICAgQHNjYW5Gb3J3YXJkIHBhdHRlcm4sIHtmcm9tOiBbZnJvbVBvaW50LnJvdywgMF19LCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB7cmFuZ2U6IGZvdW5kLCB3aGljaElzSGVhZDogJ2VuZCd9XG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcGF0dGVybiA9IEBnbG9iYWxTdGF0ZS5nZXQoJ2xhc3RTZWFyY2hQYXR0ZXJuJylcbiAgICByZXR1cm4gdW5sZXNzIHBhdHRlcm4/XG5cbiAgICBmcm9tUG9pbnQgPSBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB7cmFuZ2UsIHdoaWNoSXNIZWFkfSA9IEBmaW5kTWF0Y2goZnJvbVBvaW50LCBwYXR0ZXJuKVxuICAgIGlmIHJhbmdlP1xuICAgICAgQHVuaW9uUmFuZ2VBbmREZXRlcm1pbmVSZXZlcnNlZFN0YXRlKHNlbGVjdGlvbiwgcmFuZ2UsIHdoaWNoSXNIZWFkKVxuXG4gIHVuaW9uUmFuZ2VBbmREZXRlcm1pbmVSZXZlcnNlZFN0YXRlOiAoc2VsZWN0aW9uLCBmb3VuZCwgd2hpY2hJc0hlYWQpIC0+XG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgZm91bmRcbiAgICBlbHNlXG4gICAgICBoZWFkID0gZm91bmRbd2hpY2hJc0hlYWRdXG4gICAgICB0YWlsID0gc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIGlmIEBiYWNrd2FyZFxuICAgICAgICBoZWFkID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGhlYWQsICdmb3J3YXJkJykgaWYgdGFpbC5pc0xlc3NUaGFuKGhlYWQpXG4gICAgICBlbHNlXG4gICAgICAgIGhlYWQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgaGVhZCwgJ2JhY2t3YXJkJykgaWYgaGVhZC5pc0xlc3NUaGFuKHRhaWwpXG5cbiAgICAgIEByZXZlcnNlZCA9IGhlYWQuaXNMZXNzVGhhbih0YWlsKVxuICAgICAgbmV3IFJhbmdlKHRhaWwsIGhlYWQpLnVuaW9uKHN3cmFwKHNlbGVjdGlvbikuZ2V0VGFpbEJ1ZmZlclJhbmdlKCkpXG5cbiAgc2VsZWN0VGV4dE9iamVjdDogKHNlbGVjdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJhbmdlID0gQGdldFJhbmdlKHNlbGVjdGlvbilcbiAgICByZXZlcnNlZCA9IEByZXZlcnNlZCA/IEBiYWNrd2FyZFxuICAgIHN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZH0pXG4gICAgc2VsZWN0aW9uLmN1cnNvci5hdXRvc2Nyb2xsKClcbiAgICB0cnVlXG5cbmNsYXNzIFNlYXJjaE1hdGNoQmFja3dhcmQgZXh0ZW5kcyBTZWFyY2hNYXRjaEZvcndhcmRcbiAgQGV4dGVuZCgpXG4gIGJhY2t3YXJkOiB0cnVlXG5cbiAgZmluZE1hdGNoOiAoZnJvbVBvaW50LCBwYXR0ZXJuKSAtPlxuICAgIGZyb21Qb2ludCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCBmcm9tUG9pbnQsIFwiYmFja3dhcmRcIikgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICBmb3VuZCA9IG51bGxcbiAgICBAc2NhbkJhY2t3YXJkIHBhdHRlcm4sIHtmcm9tOiBbZnJvbVBvaW50LnJvdywgSW5maW5pdHldfSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBpZiByYW5nZS5zdGFydC5pc0xlc3NUaGFuKGZyb21Qb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB7cmFuZ2U6IGZvdW5kLCB3aGljaElzSGVhZDogJ3N0YXJ0J31cblxuIyBbTGltaXRhdGlvbjogd29uJ3QgZml4XTogU2VsZWN0ZWQgcmFuZ2UgaXMgbm90IHN1Ym1vZGUgYXdhcmUuIGFsd2F5cyBjaGFyYWN0ZXJ3aXNlLlxuIyBTbyBldmVuIGlmIG9yaWdpbmFsIHNlbGVjdGlvbiB3YXMgdkwgb3IgdkIsIHNlbGVjdGVkIHJhbmdlIGJ5IHRoaXMgdGV4dC1vYmplY3RcbiMgaXMgYWx3YXlzIHZDIHJhbmdlLlxuY2xhc3MgUHJldmlvdXNTZWxlY3Rpb24gZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuXG4gIHNlbGVjdDogLT5cbiAgICB7cHJvcGVydGllcywgc3VibW9kZX0gPSBAdmltU3RhdGUucHJldmlvdXNTZWxlY3Rpb25cbiAgICBpZiBwcm9wZXJ0aWVzPyBhbmQgc3VibW9kZT9cbiAgICAgIHNlbGVjdGlvbiA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpXG4gICAgICBzd3JhcChzZWxlY3Rpb24pLnNlbGVjdEJ5UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuICAgICAgQHdpc2UgPSBzdWJtb2RlXG5cbmNsYXNzIFBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgc2VsZWN0OiAtPlxuICAgIHtwZXJzaXN0ZW50U2VsZWN0aW9ufSA9IEB2aW1TdGF0ZVxuICAgIHVubGVzcyBwZXJzaXN0ZW50U2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgcGVyc2lzdGVudFNlbGVjdGlvbi5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpXG4gICAgICBAd2lzZSA9IHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpXG5cbmNsYXNzIEFQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgUGVyc2lzdGVudFNlbGVjdGlvblxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIFBlcnNpc3RlbnRTZWxlY3Rpb25cbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgVmlzaWJsZUFyZWEgZXh0ZW5kcyBUZXh0T2JqZWN0ICMgODIyIHRvIDg2M1xuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBzdG9wU2VsZWN0aW9uKClcbiAgICAjIFtCVUc/XSBOZWVkIHRyYW5zbGF0ZSB0byBzaGlsbmsgdG9wIGFuZCBib3R0b20gdG8gZml0IGFjdHVhbCByb3cuXG4gICAgIyBUaGUgcmVhc29uIEkgbmVlZCAtMiBhdCBib3R0b20gaXMgYmVjYXVzZSBvZiBzdGF0dXMgYmFyP1xuICAgIGJ1ZmZlclJhbmdlID0gZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlKEBlZGl0b3IpXG4gICAgaWYgYnVmZmVyUmFuZ2UuZ2V0Um93cygpID4gQGVkaXRvci5nZXRSb3dzUGVyUGFnZSgpXG4gICAgICBidWZmZXJSYW5nZS50cmFuc2xhdGUoWysxLCAwXSwgWy0zLCAwXSlcbiAgICBlbHNlXG4gICAgICBidWZmZXJSYW5nZVxuXG5jbGFzcyBBVmlzaWJsZUFyZWEgZXh0ZW5kcyBWaXNpYmxlQXJlYVxuICBAZXh0ZW5kKClcbmNsYXNzIElubmVyVmlzaWJsZUFyZWEgZXh0ZW5kcyBWaXNpYmxlQXJlYVxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtGSVhNRV0gd2lzZSBtaXNtYXRjaCBzY2VlblBvc2l0aW9uIHZzIGJ1ZmZlclBvc2l0aW9uXG5jbGFzcyBFZGdlIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICB3aXNlOiAnbGluZXdpc2UnXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVBvaW50ID0gQGdldE5vcm1hbGl6ZWRIZWFkU2NyZWVuUG9zaXRpb24oc2VsZWN0aW9uKVxuXG4gICAgbW92ZVVwVG9FZGdlID0gQG5ldygnTW92ZVVwVG9FZGdlJylcbiAgICBtb3ZlRG93blRvRWRnZSA9IEBuZXcoJ01vdmVEb3duVG9FZGdlJylcbiAgICByZXR1cm4gdW5sZXNzIG1vdmVVcFRvRWRnZS5pc1N0b3BwYWJsZVBvaW50KGZyb21Qb2ludClcblxuICAgIHN0YXJ0U2NyZWVuUG9pbnQgPSBlbmRTY3JlZW5Qb2ludCA9IG51bGxcbiAgICBzdGFydFNjcmVlblBvaW50ID0gZW5kU2NyZWVuUG9pbnQgPSBmcm9tUG9pbnQgaWYgbW92ZVVwVG9FZGdlLmlzRWRnZShmcm9tUG9pbnQpXG5cbiAgICBpZiBtb3ZlVXBUb0VkZ2UuaXNTdG9wcGFibGVQb2ludChmcm9tUG9pbnQudHJhbnNsYXRlKFstMSwgMF0pKVxuICAgICAgc3RhcnRTY3JlZW5Qb2ludCA9IG1vdmVVcFRvRWRnZS5nZXRQb2ludChmcm9tUG9pbnQpXG5cbiAgICBpZiBtb3ZlRG93blRvRWRnZS5pc1N0b3BwYWJsZVBvaW50KGZyb21Qb2ludC50cmFuc2xhdGUoWysxLCAwXSkpXG4gICAgICBlbmRTY3JlZW5Qb2ludCA9IG1vdmVEb3duVG9FZGdlLmdldFBvaW50KGZyb21Qb2ludClcblxuICAgIGlmIHN0YXJ0U2NyZWVuUG9pbnQ/IGFuZCBlbmRTY3JlZW5Qb2ludD9cbiAgICAgIHNjcmVlblJhbmdlID0gbmV3IFJhbmdlKHN0YXJ0U2NyZWVuUG9pbnQsIGVuZFNjcmVlblBvaW50KVxuICAgICAgcmFuZ2UgPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UpXG4gICAgICBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIFtyYW5nZS5zdGFydC5yb3csIHJhbmdlLmVuZC5yb3ddKVxuXG5jbGFzcyBBRWRnZSBleHRlbmRzIEVkZ2VcbiAgQGV4dGVuZCgpXG5jbGFzcyBJbm5lckVkZ2UgZXh0ZW5kcyBFZGdlXG4gIEBleHRlbmQoKVxuIl19
