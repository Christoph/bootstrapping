(function() {
  var ActivateInsertMode, ActivateReplaceMode, Change, ChangeLine, ChangeOccurrence, ChangeToLastCharacterOfLine, InsertAboveWithNewline, InsertAfter, InsertAfterEndOfLine, InsertAtBeginningOfLine, InsertAtEndOfOccurrence, InsertAtEndOfSmartWord, InsertAtEndOfTarget, InsertAtFirstCharacterOfLine, InsertAtLastInsert, InsertAtNextFoldStart, InsertAtPreviousFoldStart, InsertAtStartOfOccurrence, InsertAtStartOfSmartWord, InsertAtStartOfTarget, InsertBelowWithNewline, InsertByTarget, Operator, Range, Substitute, SubstituteLine, _, limitNumber, moveCursorLeft, moveCursorRight, ref, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  Range = require('atom').Range;

  ref = require('./utils'), moveCursorLeft = ref.moveCursorLeft, moveCursorRight = ref.moveCursorRight, limitNumber = ref.limitNumber;

  swrap = require('./selection-wrapper');

  Operator = require('./base').getClass('Operator');

  ActivateInsertMode = (function(superClass) {
    extend(ActivateInsertMode, superClass);

    function ActivateInsertMode() {
      return ActivateInsertMode.__super__.constructor.apply(this, arguments);
    }

    ActivateInsertMode.extend();

    ActivateInsertMode.prototype.requireTarget = false;

    ActivateInsertMode.prototype.flashTarget = false;

    ActivateInsertMode.prototype.finalSubmode = null;

    ActivateInsertMode.prototype.supportInsertionCount = true;

    ActivateInsertMode.prototype.flashCheckpoint = 'custom';

    ActivateInsertMode.prototype.observeWillDeactivateMode = function() {
      var disposable;
      return disposable = this.vimState.modeManager.preemptWillDeactivateMode((function(_this) {
        return function(arg) {
          var change, changedRange, mode, textByUserInput;
          mode = arg.mode;
          if (mode !== 'insert') {
            return;
          }
          disposable.dispose();
          _this.vimState.mark.set('^', _this.editor.getCursorBufferPosition());
          textByUserInput = '';
          if (change = _this.getChangeSinceCheckpoint('insert')) {
            _this.lastChange = change;
            changedRange = new Range(change.start, change.start.traverse(change.newExtent));
            _this.vimState.mark.setRange('[', ']', changedRange);
            textByUserInput = change.newText;
          }
          _this.vimState.register.set('.', {
            text: textByUserInput
          });
          _.times(_this.getInsertionCount(), function() {
            var i, len, ref1, results, selection, text;
            text = _this.textByOperator + textByUserInput;
            ref1 = _this.editor.getSelections();
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              results.push(selection.insertText(text, {
                autoIndent: true
              }));
            }
            return results;
          });
          if (_this.getConfig('clearMultipleCursorsOnEscapeInsertMode')) {
            _this.vimState.clearSelections();
          }
          if (_this.getConfig('groupChangesWhenLeavingInsertMode')) {
            return _this.groupChangesSinceBufferCheckpoint('undo');
          }
        };
      })(this));
    };

    ActivateInsertMode.prototype.getChangeSinceCheckpoint = function(purpose) {
      var checkpoint;
      checkpoint = this.getBufferCheckpoint(purpose);
      return this.editor.buffer.getChangesSinceCheckpoint(checkpoint)[0];
    };

    ActivateInsertMode.prototype.replayLastChange = function(selection) {
      var deletionEnd, deletionStart, newExtent, newText, oldExtent, ref1, start, traversalToStartOfDelete;
      if (this.lastChange != null) {
        ref1 = this.lastChange, start = ref1.start, newExtent = ref1.newExtent, oldExtent = ref1.oldExtent, newText = ref1.newText;
        if (!oldExtent.isZero()) {
          traversalToStartOfDelete = start.traversalFrom(this.topCursorPositionAtInsertionStart);
          deletionStart = selection.cursor.getBufferPosition().traverse(traversalToStartOfDelete);
          deletionEnd = deletionStart.traverse(oldExtent);
          selection.setBufferRange([deletionStart, deletionEnd]);
        }
      } else {
        newText = '';
      }
      return selection.insertText(newText, {
        autoIndent: true
      });
    };

    ActivateInsertMode.prototype.repeatInsert = function(selection, text) {
      return this.replayLastChange(selection);
    };

    ActivateInsertMode.prototype.getInsertionCount = function() {
      if (this.insertionCount == null) {
        this.insertionCount = this.supportInsertionCount ? this.getCount(-1) : 0;
      }
      return limitNumber(this.insertionCount, {
        max: 100
      });
    };

    ActivateInsertMode.prototype.execute = function() {
      var ref1, ref2, topCursor;
      if (this.isRepeated()) {
        this.flashTarget = this.trackChange = true;
        this.startMutation((function(_this) {
          return function() {
            var i, len, mutatedRanges, ref1, ref2, ref3, selection;
            if (_this.isRequireTarget()) {
              _this.selectTarget();
            }
            if (typeof _this.mutateText === "function") {
              _this.mutateText();
            }
            mutatedRanges = [];
            ref1 = _this.editor.getSelections();
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              mutatedRanges.push(_this.repeatInsert(selection, (ref2 = (ref3 = _this.lastChange) != null ? ref3.newText : void 0) != null ? ref2 : ''));
              moveCursorLeft(selection.cursor);
            }
            return _this.mutationManager.setBufferRangesForCustomCheckpoint(mutatedRanges);
          };
        })(this));
        if (this.getConfig('clearMultipleCursorsOnEscapeInsertMode')) {
          return this.vimState.clearSelections();
        }
      } else {
        if (this.isRequireTarget()) {
          this.normalizeSelectionsIfNecessary();
        }
        this.createBufferCheckpoint('undo');
        if (this.isRequireTarget()) {
          this.selectTarget();
        }
        this.observeWillDeactivateMode();
        if (typeof this.mutateText === "function") {
          this.mutateText();
        }
        if (this.getInsertionCount() > 0) {
          this.textByOperator = (ref1 = (ref2 = this.getChangeSinceCheckpoint('undo')) != null ? ref2.newText : void 0) != null ? ref1 : '';
        }
        this.createBufferCheckpoint('insert');
        topCursor = this.editor.getCursorsOrderedByBufferPosition()[0];
        this.topCursorPositionAtInsertionStart = topCursor.getBufferPosition();
        return this.vimState.activate('insert', this.finalSubmode);
      }
    };

    return ActivateInsertMode;

  })(Operator);

  ActivateReplaceMode = (function(superClass) {
    extend(ActivateReplaceMode, superClass);

    function ActivateReplaceMode() {
      return ActivateReplaceMode.__super__.constructor.apply(this, arguments);
    }

    ActivateReplaceMode.extend();

    ActivateReplaceMode.prototype.finalSubmode = 'replace';

    ActivateReplaceMode.prototype.repeatInsert = function(selection, text) {
      var char, i, len;
      for (i = 0, len = text.length; i < len; i++) {
        char = text[i];
        if (!(char !== "\n")) {
          continue;
        }
        if (selection.cursor.isAtEndOfLine()) {
          break;
        }
        selection.selectRight();
      }
      return selection.insertText(text, {
        autoIndent: false
      });
    };

    return ActivateReplaceMode;

  })(ActivateInsertMode);

  InsertAfter = (function(superClass) {
    extend(InsertAfter, superClass);

    function InsertAfter() {
      return InsertAfter.__super__.constructor.apply(this, arguments);
    }

    InsertAfter.extend();

    InsertAfter.prototype.execute = function() {
      var cursor, i, len, ref1;
      ref1 = this.editor.getCursors();
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        moveCursorRight(cursor);
      }
      return InsertAfter.__super__.execute.apply(this, arguments);
    };

    return InsertAfter;

  })(ActivateInsertMode);

  InsertAtBeginningOfLine = (function(superClass) {
    extend(InsertAtBeginningOfLine, superClass);

    function InsertAtBeginningOfLine() {
      return InsertAtBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAtBeginningOfLine.extend();

    InsertAtBeginningOfLine.prototype.execute = function() {
      if (this.isMode('visual', ['characterwise', 'linewise'])) {
        this.editor.splitSelectionsIntoLines();
      }
      this.editor.moveToBeginningOfLine();
      return InsertAtBeginningOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAtBeginningOfLine;

  })(ActivateInsertMode);

  InsertAfterEndOfLine = (function(superClass) {
    extend(InsertAfterEndOfLine, superClass);

    function InsertAfterEndOfLine() {
      return InsertAfterEndOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAfterEndOfLine.extend();

    InsertAfterEndOfLine.prototype.execute = function() {
      this.editor.moveToEndOfLine();
      return InsertAfterEndOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAfterEndOfLine;

  })(ActivateInsertMode);

  InsertAtFirstCharacterOfLine = (function(superClass) {
    extend(InsertAtFirstCharacterOfLine, superClass);

    function InsertAtFirstCharacterOfLine() {
      return InsertAtFirstCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAtFirstCharacterOfLine.extend();

    InsertAtFirstCharacterOfLine.prototype.execute = function() {
      this.editor.moveToBeginningOfLine();
      this.editor.moveToFirstCharacterOfLine();
      return InsertAtFirstCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAtFirstCharacterOfLine;

  })(ActivateInsertMode);

  InsertAtLastInsert = (function(superClass) {
    extend(InsertAtLastInsert, superClass);

    function InsertAtLastInsert() {
      return InsertAtLastInsert.__super__.constructor.apply(this, arguments);
    }

    InsertAtLastInsert.extend();

    InsertAtLastInsert.prototype.execute = function() {
      var point;
      if ((point = this.vimState.mark.get('^'))) {
        this.editor.setCursorBufferPosition(point);
        this.editor.scrollToCursorPosition({
          center: true
        });
      }
      return InsertAtLastInsert.__super__.execute.apply(this, arguments);
    };

    return InsertAtLastInsert;

  })(ActivateInsertMode);

  InsertAboveWithNewline = (function(superClass) {
    extend(InsertAboveWithNewline, superClass);

    function InsertAboveWithNewline() {
      return InsertAboveWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertAboveWithNewline.extend();

    InsertAboveWithNewline.prototype.groupChangesSinceBufferCheckpoint = function() {
      var cursorPosition, lastCursor;
      lastCursor = this.editor.getLastCursor();
      cursorPosition = lastCursor.getBufferPosition();
      lastCursor.setBufferPosition(this.vimState.getOriginalCursorPositionByMarker());
      InsertAboveWithNewline.__super__.groupChangesSinceBufferCheckpoint.apply(this, arguments);
      return lastCursor.setBufferPosition(cursorPosition);
    };

    InsertAboveWithNewline.prototype.mutateText = function() {
      return this.editor.insertNewlineAbove();
    };

    InsertAboveWithNewline.prototype.repeatInsert = function(selection, text) {
      return selection.insertText(text.trimLeft(), {
        autoIndent: true
      });
    };

    return InsertAboveWithNewline;

  })(ActivateInsertMode);

  InsertBelowWithNewline = (function(superClass) {
    extend(InsertBelowWithNewline, superClass);

    function InsertBelowWithNewline() {
      return InsertBelowWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertBelowWithNewline.extend();

    InsertBelowWithNewline.prototype.mutateText = function() {
      return this.editor.insertNewlineBelow();
    };

    return InsertBelowWithNewline;

  })(InsertAboveWithNewline);

  InsertByTarget = (function(superClass) {
    extend(InsertByTarget, superClass);

    function InsertByTarget() {
      return InsertByTarget.__super__.constructor.apply(this, arguments);
    }

    InsertByTarget.extend(false);

    InsertByTarget.prototype.requireTarget = true;

    InsertByTarget.prototype.which = null;

    InsertByTarget.prototype.initialize = function() {
      this.getCount();
      return InsertByTarget.__super__.initialize.apply(this, arguments);
    };

    InsertByTarget.prototype.execute = function() {
      this.onDidSelectTarget((function(_this) {
        return function() {
          var i, len, ref1, results, selection;
          if (_this.vimState.isMode('visual')) {
            _this.modifySelection();
          }
          ref1 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            results.push(swrap(selection).setBufferPositionTo(_this.which));
          }
          return results;
        };
      })(this));
      return InsertByTarget.__super__.execute.apply(this, arguments);
    };

    InsertByTarget.prototype.modifySelection = function() {
      var i, len, methodName, ref1, results, selection;
      switch (this.vimState.submode) {
        case 'characterwise':
          this.vimState.selectBlockwise();
          return this.vimState.clearBlockwiseSelections();
        case 'linewise':
          this.editor.splitSelectionsIntoLines();
          methodName = this.which === 'start' ? 'setStartToFirstCharacterOfLine' : this.which === 'end' ? 'shrinkEndToBeforeNewLine' : void 0;
          ref1 = this.editor.getSelections();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            results.push(swrap(selection)[methodName]());
          }
          return results;
      }
    };

    return InsertByTarget;

  })(ActivateInsertMode);

  InsertAtStartOfTarget = (function(superClass) {
    extend(InsertAtStartOfTarget, superClass);

    function InsertAtStartOfTarget() {
      return InsertAtStartOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfTarget.extend();

    InsertAtStartOfTarget.prototype.which = 'start';

    return InsertAtStartOfTarget;

  })(InsertByTarget);

  InsertAtEndOfTarget = (function(superClass) {
    extend(InsertAtEndOfTarget, superClass);

    function InsertAtEndOfTarget() {
      return InsertAtEndOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfTarget.extend();

    InsertAtEndOfTarget.prototype.which = 'end';

    return InsertAtEndOfTarget;

  })(InsertByTarget);

  InsertAtStartOfOccurrence = (function(superClass) {
    extend(InsertAtStartOfOccurrence, superClass);

    function InsertAtStartOfOccurrence() {
      return InsertAtStartOfOccurrence.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfOccurrence.extend();

    InsertAtStartOfOccurrence.prototype.which = 'start';

    InsertAtStartOfOccurrence.prototype.occurrence = true;

    return InsertAtStartOfOccurrence;

  })(InsertByTarget);

  InsertAtEndOfOccurrence = (function(superClass) {
    extend(InsertAtEndOfOccurrence, superClass);

    function InsertAtEndOfOccurrence() {
      return InsertAtEndOfOccurrence.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfOccurrence.extend();

    InsertAtEndOfOccurrence.prototype.which = 'end';

    InsertAtEndOfOccurrence.prototype.occurrence = true;

    return InsertAtEndOfOccurrence;

  })(InsertByTarget);

  InsertAtStartOfSmartWord = (function(superClass) {
    extend(InsertAtStartOfSmartWord, superClass);

    function InsertAtStartOfSmartWord() {
      return InsertAtStartOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfSmartWord.extend();

    InsertAtStartOfSmartWord.prototype.which = 'start';

    InsertAtStartOfSmartWord.prototype.target = "MoveToPreviousSmartWord";

    return InsertAtStartOfSmartWord;

  })(InsertByTarget);

  InsertAtEndOfSmartWord = (function(superClass) {
    extend(InsertAtEndOfSmartWord, superClass);

    function InsertAtEndOfSmartWord() {
      return InsertAtEndOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfSmartWord.extend();

    InsertAtEndOfSmartWord.prototype.which = 'end';

    InsertAtEndOfSmartWord.prototype.target = "MoveToEndOfSmartWord";

    return InsertAtEndOfSmartWord;

  })(InsertByTarget);

  InsertAtPreviousFoldStart = (function(superClass) {
    extend(InsertAtPreviousFoldStart, superClass);

    function InsertAtPreviousFoldStart() {
      return InsertAtPreviousFoldStart.__super__.constructor.apply(this, arguments);
    }

    InsertAtPreviousFoldStart.extend();

    InsertAtPreviousFoldStart.description = "Move to previous fold start then enter insert-mode";

    InsertAtPreviousFoldStart.prototype.which = 'start';

    InsertAtPreviousFoldStart.prototype.target = 'MoveToPreviousFoldStart';

    return InsertAtPreviousFoldStart;

  })(InsertByTarget);

  InsertAtNextFoldStart = (function(superClass) {
    extend(InsertAtNextFoldStart, superClass);

    function InsertAtNextFoldStart() {
      return InsertAtNextFoldStart.__super__.constructor.apply(this, arguments);
    }

    InsertAtNextFoldStart.extend();

    InsertAtNextFoldStart.description = "Move to next fold start then enter insert-mode";

    InsertAtNextFoldStart.prototype.which = 'end';

    InsertAtNextFoldStart.prototype.target = 'MoveToNextFoldStart';

    return InsertAtNextFoldStart;

  })(InsertByTarget);

  Change = (function(superClass) {
    extend(Change, superClass);

    function Change() {
      return Change.__super__.constructor.apply(this, arguments);
    }

    Change.extend();

    Change.prototype.requireTarget = true;

    Change.prototype.trackChange = true;

    Change.prototype.supportInsertionCount = false;

    Change.prototype.mutateText = function() {
      var i, isLinewiseTarget, len, ref1, results, selection;
      isLinewiseTarget = swrap.detectVisualModeSubmode(this.editor) === 'linewise';
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        this.setTextToRegisterForSelection(selection);
        if (isLinewiseTarget) {
          selection.insertText("\n", {
            autoIndent: true
          });
          results.push(selection.cursor.moveLeft());
        } else {
          results.push(selection.insertText('', {
            autoIndent: true
          }));
        }
      }
      return results;
    };

    return Change;

  })(ActivateInsertMode);

  ChangeOccurrence = (function(superClass) {
    extend(ChangeOccurrence, superClass);

    function ChangeOccurrence() {
      return ChangeOccurrence.__super__.constructor.apply(this, arguments);
    }

    ChangeOccurrence.extend();

    ChangeOccurrence.description = "Change all matching word within target range";

    ChangeOccurrence.prototype.occurrence = true;

    return ChangeOccurrence;

  })(Change);

  Substitute = (function(superClass) {
    extend(Substitute, superClass);

    function Substitute() {
      return Substitute.__super__.constructor.apply(this, arguments);
    }

    Substitute.extend();

    Substitute.prototype.target = 'MoveRight';

    return Substitute;

  })(Change);

  SubstituteLine = (function(superClass) {
    extend(SubstituteLine, superClass);

    function SubstituteLine() {
      return SubstituteLine.__super__.constructor.apply(this, arguments);
    }

    SubstituteLine.extend();

    SubstituteLine.prototype.wise = 'linewise';

    SubstituteLine.prototype.target = 'MoveToRelativeLine';

    return SubstituteLine;

  })(Change);

  ChangeLine = (function(superClass) {
    extend(ChangeLine, superClass);

    function ChangeLine() {
      return ChangeLine.__super__.constructor.apply(this, arguments);
    }

    ChangeLine.extend();

    return ChangeLine;

  })(SubstituteLine);

  ChangeToLastCharacterOfLine = (function(superClass) {
    extend(ChangeToLastCharacterOfLine, superClass);

    function ChangeToLastCharacterOfLine() {
      return ChangeToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    ChangeToLastCharacterOfLine.extend();

    ChangeToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    ChangeToLastCharacterOfLine.prototype.initialize = function() {
      if (this.isMode('visual', 'blockwise')) {
        this.acceptCurrentSelection = false;
        swrap.setReversedState(this.editor, false);
      }
      return ChangeToLastCharacterOfLine.__super__.initialize.apply(this, arguments);
    };

    return ChangeToLastCharacterOfLine;

  })(Change);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3ItaW5zZXJ0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsc2tCQUFBO0lBQUE7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFFVixNQUlJLE9BQUEsQ0FBUSxTQUFSLENBSkosRUFDRSxtQ0FERixFQUVFLHFDQUZGLEVBR0U7O0VBRUYsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFDUixRQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxRQUFsQixDQUEyQixVQUEzQjs7RUFNTDs7Ozs7OztJQUNKLGtCQUFDLENBQUEsTUFBRCxDQUFBOztpQ0FDQSxhQUFBLEdBQWU7O2lDQUNmLFdBQUEsR0FBYTs7aUNBQ2IsWUFBQSxHQUFjOztpQ0FDZCxxQkFBQSxHQUF1Qjs7aUNBQ3ZCLGVBQUEsR0FBaUI7O2lDQUVqQix5QkFBQSxHQUEyQixTQUFBO0FBQ3pCLFVBQUE7YUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFXLENBQUMseUJBQXRCLENBQWdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQzNELGNBQUE7VUFENkQsT0FBRDtVQUM1RCxJQUFjLElBQUEsS0FBUSxRQUF0QjtBQUFBLG1CQUFBOztVQUNBLFVBQVUsQ0FBQyxPQUFYLENBQUE7VUFFQSxLQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLEdBQW5CLEVBQXdCLEtBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUF4QjtVQUNBLGVBQUEsR0FBa0I7VUFDbEIsSUFBRyxNQUFBLEdBQVMsS0FBQyxDQUFBLHdCQUFELENBQTBCLFFBQTFCLENBQVo7WUFDRSxLQUFDLENBQUEsVUFB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WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue1JhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbntcbiAgbW92ZUN1cnNvckxlZnRcbiAgbW92ZUN1cnNvclJpZ2h0XG4gIGxpbWl0TnVtYmVyXG59ID0gcmVxdWlyZSAnLi91dGlscydcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcbk9wZXJhdG9yID0gcmVxdWlyZSgnLi9iYXNlJykuZ2V0Q2xhc3MoJ09wZXJhdG9yJylcblxuIyBJbnNlcnQgZW50ZXJpbmcgb3BlcmF0aW9uXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgW05PVEVdXG4jIFJ1bGU6IERvbid0IG1ha2UgYW55IHRleHQgbXV0YXRpb24gYmVmb3JlIGNhbGxpbmcgYEBzZWxlY3RUYXJnZXQoKWAuXG5jbGFzcyBBY3RpdmF0ZUluc2VydE1vZGUgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG4gIGZpbmFsU3VibW9kZTogbnVsbFxuICBzdXBwb3J0SW5zZXJ0aW9uQ291bnQ6IHRydWVcbiAgZmxhc2hDaGVja3BvaW50OiAnY3VzdG9tJ1xuXG4gIG9ic2VydmVXaWxsRGVhY3RpdmF0ZU1vZGU6IC0+XG4gICAgZGlzcG9zYWJsZSA9IEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5wcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlICh7bW9kZX0pID0+XG4gICAgICByZXR1cm4gdW5sZXNzIG1vZGUgaXMgJ2luc2VydCdcbiAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG5cbiAgICAgIEB2aW1TdGF0ZS5tYXJrLnNldCgnXicsIEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkgIyBMYXN0IGluc2VydC1tb2RlIHBvc2l0aW9uXG4gICAgICB0ZXh0QnlVc2VySW5wdXQgPSAnJ1xuICAgICAgaWYgY2hhbmdlID0gQGdldENoYW5nZVNpbmNlQ2hlY2twb2ludCgnaW5zZXJ0JylcbiAgICAgICAgQGxhc3RDaGFuZ2UgPSBjaGFuZ2VcbiAgICAgICAgY2hhbmdlZFJhbmdlID0gbmV3IFJhbmdlKGNoYW5nZS5zdGFydCwgY2hhbmdlLnN0YXJ0LnRyYXZlcnNlKGNoYW5nZS5uZXdFeHRlbnQpKVxuICAgICAgICBAdmltU3RhdGUubWFyay5zZXRSYW5nZSgnWycsICddJywgY2hhbmdlZFJhbmdlKVxuICAgICAgICB0ZXh0QnlVc2VySW5wdXQgPSBjaGFuZ2UubmV3VGV4dFxuICAgICAgQHZpbVN0YXRlLnJlZ2lzdGVyLnNldCgnLicsIHRleHQ6IHRleHRCeVVzZXJJbnB1dCkgIyBMYXN0IGluc2VydGVkIHRleHRcblxuICAgICAgXy50aW1lcyBAZ2V0SW5zZXJ0aW9uQ291bnQoKSwgPT5cbiAgICAgICAgdGV4dCA9IEB0ZXh0QnlPcGVyYXRvciArIHRleHRCeVVzZXJJbnB1dFxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwgYXV0b0luZGVudDogdHJ1ZSlcblxuICAgICAgIyBUaGlzIGN1cnNvciBzdGF0ZSBpcyByZXN0b3JlZCBvbiB1bmRvLlxuICAgICAgIyBTbyBjdXJzb3Igc3RhdGUgaGFzIHRvIGJlIHVwZGF0ZWQgYmVmb3JlIG5leHQgZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50KClcbiAgICAgIGlmIEBnZXRDb25maWcoJ2NsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlJylcbiAgICAgICAgQHZpbVN0YXRlLmNsZWFyU2VsZWN0aW9ucygpXG5cbiAgICAgICMgZ3JvdXBpbmcgY2hhbmdlcyBmb3IgdW5kbyBjaGVja3BvaW50IG5lZWQgdG8gY29tZSBsYXN0XG4gICAgICBpZiBAZ2V0Q29uZmlnKCdncm91cENoYW5nZXNXaGVuTGVhdmluZ0luc2VydE1vZGUnKVxuICAgICAgICBAZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50KCd1bmRvJylcblxuICAjIFdoZW4gZWFjaCBtdXRhaW9uJ3MgZXh0ZW50IGlzIG5vdCBpbnRlcnNlY3RpbmcsIG11aXRpcGxlIGNoYW5nZXMgYXJlIHJlY29yZGVkXG4gICMgZS5nXG4gICMgIC0gTXVsdGljdXJzb3JzIGVkaXRcbiAgIyAgLSBDdXJzb3IgbW92ZWQgaW4gaW5zZXJ0LW1vZGUoZS5nIGN0cmwtZiwgY3RybC1iKVxuICAjIEJ1dCBJIGRvbid0IGNhcmUgbXVsdGlwbGUgY2hhbmdlcyBqdXN0IGJlY2F1c2UgSSdtIGxhenkoc28gbm90IHBlcmZlY3QgaW1wbGVtZW50YXRpb24pLlxuICAjIEkgb25seSB0YWtlIGNhcmUgb2Ygb25lIGNoYW5nZSBoYXBwZW5lZCBhdCBlYXJsaWVzdCh0b3BDdXJzb3IncyBjaGFuZ2UpIHBvc2l0aW9uLlxuICAjIFRoYXRzJyB3aHkgSSBzYXZlIHRvcEN1cnNvcidzIHBvc2l0aW9uIHRvIEB0b3BDdXJzb3JQb3NpdGlvbkF0SW5zZXJ0aW9uU3RhcnQgdG8gY29tcGFyZSB0cmF2ZXJzYWwgdG8gZGVsZXRpb25TdGFydFxuICAjIFdoeSBJIHVzZSB0b3BDdXJzb3IncyBjaGFuZ2U/IEp1c3QgYmVjYXVzZSBpdCdzIGVhc3kgdG8gdXNlIGZpcnN0IGNoYW5nZSByZXR1cm5lZCBieSBnZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQoKS5cbiAgZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBjaGVja3BvaW50ID0gQGdldEJ1ZmZlckNoZWNrcG9pbnQocHVycG9zZSlcbiAgICBAZWRpdG9yLmJ1ZmZlci5nZXRDaGFuZ2VzU2luY2VDaGVja3BvaW50KGNoZWNrcG9pbnQpWzBdXG5cbiAgIyBbQlVHLUJVVC1PS10gUmVwbGF5aW5nIHRleHQtZGVsZXRpb24tb3BlcmF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHRvIHB1cmUgVmltLlxuICAjIFB1cmUgVmltIHJlY29yZCBhbGwgb3BlcmF0aW9uIGluIGluc2VydC1tb2RlIGFzIGtleXN0cm9rZSBsZXZlbCBhbmQgY2FuIGRpc3Rpbmd1aXNoXG4gICMgY2hhcmFjdGVyIGRlbGV0ZWQgYnkgYERlbGV0ZWAgb3IgYnkgYGN0cmwtdWAuXG4gICMgQnV0IEkgY2FuIG5vdCBhbmQgZG9uJ3QgdHJ5aW5nIHRvIG1pbmljIHRoaXMgbGV2ZWwgb2YgY29tcGF0aWJpbGl0eS5cbiAgIyBTbyBiYXNpY2FsbHkgZGVsZXRpb24tZG9uZS1pbi1vbmUgaXMgZXhwZWN0ZWQgdG8gd29yayB3ZWxsLlxuICByZXBsYXlMYXN0Q2hhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGlmIEBsYXN0Q2hhbmdlP1xuICAgICAge3N0YXJ0LCBuZXdFeHRlbnQsIG9sZEV4dGVudCwgbmV3VGV4dH0gPSBAbGFzdENoYW5nZVxuICAgICAgdW5sZXNzIG9sZEV4dGVudC5pc1plcm8oKVxuICAgICAgICB0cmF2ZXJzYWxUb1N0YXJ0T2ZEZWxldGUgPSBzdGFydC50cmF2ZXJzYWxGcm9tKEB0b3BDdXJzb3JQb3NpdGlvbkF0SW5zZXJ0aW9uU3RhcnQpXG4gICAgICAgIGRlbGV0aW9uU3RhcnQgPSBzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkudHJhdmVyc2UodHJhdmVyc2FsVG9TdGFydE9mRGVsZXRlKVxuICAgICAgICBkZWxldGlvbkVuZCA9IGRlbGV0aW9uU3RhcnQudHJhdmVyc2Uob2xkRXh0ZW50KVxuICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UoW2RlbGV0aW9uU3RhcnQsIGRlbGV0aW9uRW5kXSlcbiAgICBlbHNlXG4gICAgICBuZXdUZXh0ID0gJydcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChuZXdUZXh0LCBhdXRvSW5kZW50OiB0cnVlKVxuXG4gICMgY2FsbGVkIHdoZW4gcmVwZWF0ZWRcbiAgIyBbRklYTUVdIHRvIHVzZSByZXBsYXlMYXN0Q2hhbmdlIGluIHJlcGVhdEluc2VydCBvdmVycmlkaW5nIHN1YmNsYXNzcy5cbiAgcmVwZWF0SW5zZXJ0OiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIEByZXBsYXlMYXN0Q2hhbmdlKHNlbGVjdGlvbilcblxuICBnZXRJbnNlcnRpb25Db3VudDogLT5cbiAgICBAaW5zZXJ0aW9uQ291bnQgPz0gaWYgQHN1cHBvcnRJbnNlcnRpb25Db3VudCB0aGVuIEBnZXRDb3VudCgtMSkgZWxzZSAwXG4gICAgIyBBdm9pZCBmcmVlemluZyBieSBhY2NjaWRlbnRhbCBiaWcgY291bnQoZS5nLiBgNTU1NTU1NTU1NTU1NWlgKSwgU2VlICM1NjAsICM1OTZcbiAgICBsaW1pdE51bWJlcihAaW5zZXJ0aW9uQ291bnQsIG1heDogMTAwKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQGlzUmVwZWF0ZWQoKVxuICAgICAgQGZsYXNoVGFyZ2V0ID0gQHRyYWNrQ2hhbmdlID0gdHJ1ZVxuXG4gICAgICBAc3RhcnRNdXRhdGlvbiA9PlxuICAgICAgICBAc2VsZWN0VGFyZ2V0KCkgaWYgQGlzUmVxdWlyZVRhcmdldCgpXG4gICAgICAgIEBtdXRhdGVUZXh0PygpXG4gICAgICAgIG11dGF0ZWRSYW5nZXMgPSBbXVxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgbXV0YXRlZFJhbmdlcy5wdXNoKEByZXBlYXRJbnNlcnQoc2VsZWN0aW9uLCBAbGFzdENoYW5nZT8ubmV3VGV4dCA/ICcnKSlcbiAgICAgICAgICBtb3ZlQ3Vyc29yTGVmdChzZWxlY3Rpb24uY3Vyc29yKVxuICAgICAgICBAbXV0YXRpb25NYW5hZ2VyLnNldEJ1ZmZlclJhbmdlc0ZvckN1c3RvbUNoZWNrcG9pbnQobXV0YXRlZFJhbmdlcylcblxuICAgICAgaWYgQGdldENvbmZpZygnY2xlYXJNdWx0aXBsZUN1cnNvcnNPbkVzY2FwZUluc2VydE1vZGUnKVxuICAgICAgICBAdmltU3RhdGUuY2xlYXJTZWxlY3Rpb25zKClcblxuICAgIGVsc2VcbiAgICAgIEBub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKSBpZiBAaXNSZXF1aXJlVGFyZ2V0KClcbiAgICAgIEBjcmVhdGVCdWZmZXJDaGVja3BvaW50KCd1bmRvJylcbiAgICAgIEBzZWxlY3RUYXJnZXQoKSBpZiBAaXNSZXF1aXJlVGFyZ2V0KClcbiAgICAgIEBvYnNlcnZlV2lsbERlYWN0aXZhdGVNb2RlKClcblxuICAgICAgQG11dGF0ZVRleHQ/KClcblxuICAgICAgaWYgQGdldEluc2VydGlvbkNvdW50KCkgPiAwXG4gICAgICAgIEB0ZXh0QnlPcGVyYXRvciA9IEBnZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQoJ3VuZG8nKT8ubmV3VGV4dCA/ICcnXG5cbiAgICAgIEBjcmVhdGVCdWZmZXJDaGVja3BvaW50KCdpbnNlcnQnKVxuICAgICAgdG9wQ3Vyc29yID0gQGVkaXRvci5nZXRDdXJzb3JzT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKVswXVxuICAgICAgQHRvcEN1cnNvclBvc2l0aW9uQXRJbnNlcnRpb25TdGFydCA9IHRvcEN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAdmltU3RhdGUuYWN0aXZhdGUoJ2luc2VydCcsIEBmaW5hbFN1Ym1vZGUpXG5cbmNsYXNzIEFjdGl2YXRlUmVwbGFjZU1vZGUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGZpbmFsU3VibW9kZTogJ3JlcGxhY2UnXG5cbiAgcmVwZWF0SW5zZXJ0OiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIGZvciBjaGFyIGluIHRleHQgd2hlbiAoY2hhciBpc250IFwiXFxuXCIpXG4gICAgICBicmVhayBpZiBzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCBhdXRvSW5kZW50OiBmYWxzZSlcblxuY2xhc3MgSW5zZXJ0QWZ0ZXIgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvcikgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgIHN1cGVyXG5cbiMga2V5OiAnZyBJJyBpbiBhbGwgbW9kZVxuY2xhc3MgSW5zZXJ0QXRCZWdpbm5pbmdPZkxpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgWydjaGFyYWN0ZXJ3aXNlJywgJ2xpbmV3aXNlJ10pXG4gICAgICBAZWRpdG9yLnNwbGl0U2VsZWN0aW9uc0ludG9MaW5lcygpXG4gICAgQGVkaXRvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgIHN1cGVyXG5cbiMga2V5OiBub3JtYWwgJ0EnXG5jbGFzcyBJbnNlcnRBZnRlckVuZE9mTGluZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yLm1vdmVUb0VuZE9mTGluZSgpXG4gICAgc3VwZXJcblxuIyBrZXk6IG5vcm1hbCAnSSdcbmNsYXNzIEluc2VydEF0Rmlyc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgIEBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuICAgIHN1cGVyXG5cbmNsYXNzIEluc2VydEF0TGFzdEluc2VydCBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBpZiAocG9pbnQgPSBAdmltU3RhdGUubWFyay5nZXQoJ14nKSlcbiAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICBAZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oe2NlbnRlcjogdHJ1ZX0pXG4gICAgc3VwZXJcblxuY2xhc3MgSW5zZXJ0QWJvdmVXaXRoTmV3bGluZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcblxuICAjIFRoaXMgaXMgZm9yIGBvYCBhbmQgYE9gIG9wZXJhdG9yLlxuICAjIE9uIHVuZG8vcmVkbyBwdXQgY3Vyc29yIGF0IG9yaWdpbmFsIHBvaW50IHdoZXJlIHVzZXIgdHlwZSBgb2Agb3IgYE9gLlxuICBncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQ6IC0+XG4gICAgbGFzdEN1cnNvciA9IEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgY3Vyc29yUG9zaXRpb24gPSBsYXN0Q3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKEB2aW1TdGF0ZS5nZXRPcmlnaW5hbEN1cnNvclBvc2l0aW9uQnlNYXJrZXIoKSlcblxuICAgIHN1cGVyXG5cbiAgICBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGN1cnNvclBvc2l0aW9uKVxuXG4gIG11dGF0ZVRleHQ6IC0+XG4gICAgQGVkaXRvci5pbnNlcnROZXdsaW5lQWJvdmUoKVxuXG4gIHJlcGVhdEluc2VydDogKHNlbGVjdGlvbiwgdGV4dCkgLT5cbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LnRyaW1MZWZ0KCksIGF1dG9JbmRlbnQ6IHRydWUpXG5cbmNsYXNzIEluc2VydEJlbG93V2l0aE5ld2xpbmUgZXh0ZW5kcyBJbnNlcnRBYm92ZVdpdGhOZXdsaW5lXG4gIEBleHRlbmQoKVxuICBtdXRhdGVUZXh0OiAtPlxuICAgIEBlZGl0b3IuaW5zZXJ0TmV3bGluZUJlbG93KClcblxuIyBBZHZhbmNlZCBJbnNlcnRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgSW5zZXJ0QnlUYXJnZXQgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZChmYWxzZSlcbiAgcmVxdWlyZVRhcmdldDogdHJ1ZVxuICB3aGljaDogbnVsbCAjIG9uZSBvZiBbJ3N0YXJ0JywgJ2VuZCcsICdoZWFkJywgJ3RhaWwnXVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgIyBIQUNLXG4gICAgIyBXaGVuIGcgaSBpcyBtYXBwZWQgdG8gYGluc2VydC1hdC1zdGFydC1vZi10YXJnZXRgLlxuICAgICMgYGcgaSAzIGxgIHN0YXJ0IGluc2VydCBhdCAzIGNvbHVtbiByaWdodCBwb3NpdGlvbi5cbiAgICAjIEluIHRoaXMgY2FzZSwgd2UgZG9uJ3Qgd2FudCByZXBlYXQgaW5zZXJ0aW9uIDMgdGltZXMuXG4gICAgIyBUaGlzIEBnZXRDb3VudCgpIGNhbGwgY2FjaGUgbnVtYmVyIGF0IHRoZSB0aW1pbmcgQkVGT1JFICczJyBpcyBzcGVjaWZpZWQuXG4gICAgQGdldENvdW50KClcbiAgICBzdXBlclxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG9uRGlkU2VsZWN0VGFyZ2V0ID0+XG4gICAgICBAbW9kaWZ5U2VsZWN0aW9uKCkgaWYgQHZpbVN0YXRlLmlzTW9kZSgndmlzdWFsJylcbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJQb3NpdGlvblRvKEB3aGljaClcbiAgICBzdXBlclxuXG4gIG1vZGlmeVNlbGVjdGlvbjogLT5cbiAgICBzd2l0Y2ggQHZpbVN0YXRlLnN1Ym1vZGVcbiAgICAgIHdoZW4gJ2NoYXJhY3Rlcndpc2UnXG4gICAgICAgICMgYEkob3IgQSlgIGlzIHNob3J0LWhhbmQgb2YgYGN0cmwtdiBJKG9yIEEpYFxuICAgICAgICBAdmltU3RhdGUuc2VsZWN0QmxvY2t3aXNlKClcbiAgICAgICAgQHZpbVN0YXRlLmNsZWFyQmxvY2t3aXNlU2VsZWN0aW9ucygpICMganVzdCByZXNldCB2aW1TdGF0ZSdzIHN0b3JhZ2UuXG5cbiAgICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgICBAZWRpdG9yLnNwbGl0U2VsZWN0aW9uc0ludG9MaW5lcygpXG4gICAgICAgIG1ldGhvZE5hbWUgPVxuICAgICAgICAgIGlmIEB3aGljaCBpcyAnc3RhcnQnXG4gICAgICAgICAgICAnc2V0U3RhcnRUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lJ1xuICAgICAgICAgIGVsc2UgaWYgQHdoaWNoIGlzICdlbmQnXG4gICAgICAgICAgICAnc2hyaW5rRW5kVG9CZWZvcmVOZXdMaW5lJ1xuXG4gICAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pW21ldGhvZE5hbWVdKClcblxuIyBrZXk6ICdJJywgVXNlZCBpbiAndmlzdWFsLW1vZGUuY2hhcmFjdGVyd2lzZScsIHZpc3VhbC1tb2RlLmJsb2Nrd2lzZVxuY2xhc3MgSW5zZXJ0QXRTdGFydE9mVGFyZ2V0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAnc3RhcnQnXG5cbiMga2V5OiAnQScsIFVzZWQgaW4gJ3Zpc3VhbC1tb2RlLmNoYXJhY3Rlcndpc2UnLCAndmlzdWFsLW1vZGUuYmxvY2t3aXNlJ1xuY2xhc3MgSW5zZXJ0QXRFbmRPZlRhcmdldCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ2VuZCdcblxuY2xhc3MgSW5zZXJ0QXRTdGFydE9mT2NjdXJyZW5jZSBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ3N0YXJ0J1xuICBvY2N1cnJlbmNlOiB0cnVlXG5cbmNsYXNzIEluc2VydEF0RW5kT2ZPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAnZW5kJ1xuICBvY2N1cnJlbmNlOiB0cnVlXG5cbmNsYXNzIEluc2VydEF0U3RhcnRPZlNtYXJ0V29yZCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ3N0YXJ0J1xuICB0YXJnZXQ6IFwiTW92ZVRvUHJldmlvdXNTbWFydFdvcmRcIlxuXG5jbGFzcyBJbnNlcnRBdEVuZE9mU21hcnRXb3JkIGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAnZW5kJ1xuICB0YXJnZXQ6IFwiTW92ZVRvRW5kT2ZTbWFydFdvcmRcIlxuXG5jbGFzcyBJbnNlcnRBdFByZXZpb3VzRm9sZFN0YXJ0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZvbGQgc3RhcnQgdGhlbiBlbnRlciBpbnNlcnQtbW9kZVwiXG4gIHdoaWNoOiAnc3RhcnQnXG4gIHRhcmdldDogJ01vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0J1xuXG5jbGFzcyBJbnNlcnRBdE5leHRGb2xkU3RhcnQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBmb2xkIHN0YXJ0IHRoZW4gZW50ZXIgaW5zZXJ0LW1vZGVcIlxuICB3aGljaDogJ2VuZCdcbiAgdGFyZ2V0OiAnTW92ZVRvTmV4dEZvbGRTdGFydCdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDaGFuZ2UgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIHJlcXVpcmVUYXJnZXQ6IHRydWVcbiAgdHJhY2tDaGFuZ2U6IHRydWVcbiAgc3VwcG9ydEluc2VydGlvbkNvdW50OiBmYWxzZVxuXG4gIG11dGF0ZVRleHQ6IC0+XG4gICAgIyBBbGx3YXlzIGR5bmFtaWNhbGx5IGRldGVybWluZSBzZWxlY3Rpb24gd2lzZSB3dGhvdXQgY29uc3VsdGluZyB0YXJnZXQud2lzZVxuICAgICMgUmVhc29uOiB3aGVuIGBjIGkge2AsIHdpc2UgaXMgJ2NoYXJhY3Rlcndpc2UnLCBidXQgYWN0dWFsbHkgc2VsZWN0ZWQgcmFuZ2UgaXMgJ2xpbmV3aXNlJ1xuICAgICMgICB7XG4gICAgIyAgICAgYVxuICAgICMgICB9XG4gICAgaXNMaW5ld2lzZVRhcmdldCA9IHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpIGlzICdsaW5ld2lzZSdcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAc2V0VGV4dFRvUmVnaXN0ZXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgaWYgaXNMaW5ld2lzZVRhcmdldFxuICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChcIlxcblwiLCBhdXRvSW5kZW50OiB0cnVlKVxuICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KClcbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoJycsIGF1dG9JbmRlbnQ6IHRydWUpXG5cbmNsYXNzIENoYW5nZU9jY3VycmVuY2UgZXh0ZW5kcyBDaGFuZ2VcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJDaGFuZ2UgYWxsIG1hdGNoaW5nIHdvcmQgd2l0aGluIHRhcmdldCByYW5nZVwiXG4gIG9jY3VycmVuY2U6IHRydWVcblxuY2xhc3MgU3Vic3RpdHV0ZSBleHRlbmRzIENoYW5nZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVJpZ2h0J1xuXG5jbGFzcyBTdWJzdGl0dXRlTGluZSBleHRlbmRzIENoYW5nZVxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJyAjIFtGSVhNRV0gdG8gcmUtb3ZlcnJpZGUgdGFyZ2V0Lndpc2UgaW4gdmlzdWFsLW1vZGVcbiAgdGFyZ2V0OiAnTW92ZVRvUmVsYXRpdmVMaW5lJ1xuXG4jIGFsaWFzXG5jbGFzcyBDaGFuZ2VMaW5lIGV4dGVuZHMgU3Vic3RpdHV0ZUxpbmVcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIENoYW5nZVRvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIENoYW5nZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcblxuICBpbml0aWFsaXplOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgIyBGSVhNRSBNYXliZSBiZWNhdXNlIG9mIGJ1ZyBvZiBDdXJyZW50U2VsZWN0aW9uLFxuICAgICAgIyB3ZSB1c2UgTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSBhcyB0YXJnZXRcbiAgICAgIEBhY2NlcHRDdXJyZW50U2VsZWN0aW9uID0gZmFsc2VcbiAgICAgIHN3cmFwLnNldFJldmVyc2VkU3RhdGUoQGVkaXRvciwgZmFsc2UpICMgRW5zdXJlIGFsbCBzZWxlY3Rpb25zIHRvIHVuLXJldmVyc2VkXG4gICAgc3VwZXJcbiJdfQ==
