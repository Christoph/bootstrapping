(function() {
  var AddBlankLineAbove, AddBlankLineBelow, AddPresetOccurrenceFromLastOccurrencePattern, Base, CreatePersistentSelection, Decrease, DecrementNumber, Delete, DeleteLeft, DeleteLine, DeleteRight, DeleteToLastCharacterOfLine, Increase, IncrementNumber, Operator, PutAfter, PutBefore, Select, SelectLatestChange, SelectOccurrence, SelectPersistentSelection, SelectPreviousSelection, TogglePersistentSelection, TogglePresetOccurrence, TogglePresetSubwordOccurrence, Yank, YankLine, YankToLastCharacterOfLine, _, ensureEndsWithNewLineForBufferRow, getSubwordPatternAtBufferPosition, getValidVimBufferRow, getWordPatternAtBufferPosition, haveSomeNonEmptySelection, insertTextAtBufferPosition, isEmptyRow, moveCursorToFirstCharacterAtRow, ref, setBufferRow, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  ref = require('./utils'), haveSomeNonEmptySelection = ref.haveSomeNonEmptySelection, getValidVimBufferRow = ref.getValidVimBufferRow, isEmptyRow = ref.isEmptyRow, getWordPatternAtBufferPosition = ref.getWordPatternAtBufferPosition, getSubwordPatternAtBufferPosition = ref.getSubwordPatternAtBufferPosition, insertTextAtBufferPosition = ref.insertTextAtBufferPosition, setBufferRow = ref.setBufferRow, moveCursorToFirstCharacterAtRow = ref.moveCursorToFirstCharacterAtRow, ensureEndsWithNewLineForBufferRow = ref.ensureEndsWithNewLineForBufferRow;

  swrap = require('./selection-wrapper');

  Base = require('./base');

  Operator = (function(superClass) {
    extend(Operator, superClass);

    Operator.extend(false);

    Operator.prototype.requireTarget = true;

    Operator.prototype.recordable = true;

    Operator.prototype.wise = null;

    Operator.prototype.occurrence = false;

    Operator.prototype.occurrenceType = 'base';

    Operator.prototype.flashTarget = true;

    Operator.prototype.flashCheckpoint = 'did-finish';

    Operator.prototype.flashType = 'operator';

    Operator.prototype.flashTypeForOccurrence = 'operator-occurrence';

    Operator.prototype.trackChange = false;

    Operator.prototype.patternForOccurrence = null;

    Operator.prototype.stayAtSamePosition = null;

    Operator.prototype.stayOptionName = null;

    Operator.prototype.stayByMarker = false;

    Operator.prototype.restorePositions = true;

    Operator.prototype.acceptPresetOccurrence = true;

    Operator.prototype.acceptPersistentSelection = true;

    Operator.prototype.acceptCurrentSelection = true;

    Operator.prototype.bufferCheckpointByPurpose = null;

    Operator.prototype.mutateSelectionOrderd = false;

    Operator.prototype.supportEarlySelect = false;

    Operator.prototype.targetSelected = null;

    Operator.prototype.canEarlySelect = function() {
      return this.supportEarlySelect && !this.isRepeated();
    };

    Operator.prototype.resetState = function() {
      this.targetSelected = null;
      return this.occurrenceSelected = false;
    };

    Operator.prototype.createBufferCheckpoint = function(purpose) {
      if (this.bufferCheckpointByPurpose == null) {
        this.bufferCheckpointByPurpose = {};
      }
      return this.bufferCheckpointByPurpose[purpose] = this.editor.createCheckpoint();
    };

    Operator.prototype.getBufferCheckpoint = function(purpose) {
      var ref1;
      return (ref1 = this.bufferCheckpointByPurpose) != null ? ref1[purpose] : void 0;
    };

    Operator.prototype.deleteBufferCheckpoint = function(purpose) {
      if (this.bufferCheckpointByPurpose != null) {
        return delete this.bufferCheckpointByPurpose[purpose];
      }
    };

    Operator.prototype.groupChangesSinceBufferCheckpoint = function(purpose) {
      var checkpoint;
      if (checkpoint = this.getBufferCheckpoint(purpose)) {
        this.editor.groupChangesSinceCheckpoint(checkpoint);
        return this.deleteBufferCheckpoint(purpose);
      }
    };

    Operator.prototype.needStay = function() {
      var ref1;
      return ((ref1 = this.stayAtSamePosition) != null ? ref1 : this.isOccurrence() && this.getConfig('stayOnOccurrence')) || this.getConfig(this.stayOptionName);
    };

    Operator.prototype.needStayOnRestore = function() {
      var ref1;
      return ((ref1 = this.stayAtSamePosition) != null ? ref1 : this.isOccurrence() && this.getConfig('stayOnOccurrence') && this.occurrenceSelected) || this.getConfig(this.stayOptionName);
    };

    Operator.prototype.isOccurrence = function() {
      return this.occurrence;
    };

    Operator.prototype.setOccurrence = function(occurrence) {
      this.occurrence = occurrence;
      return this.occurrence;
    };

    Operator.prototype.setMarkForChange = function(range) {
      return this.vimState.mark.setRange('[', ']', range);
    };

    Operator.prototype.needFlash = function() {
      var mode, ref1, ref2, submode;
      if (!this.flashTarget) {
        return;
      }
      ref1 = this.vimState, mode = ref1.mode, submode = ref1.submode;
      if (mode !== 'visual' || (this.target.isMotion() && submode !== this.target.wise)) {
        return this.getConfig('flashOnOperate') && (ref2 = this.getName(), indexOf.call(this.getConfig('flashOnOperateBlacklist'), ref2) < 0);
      }
    };

    Operator.prototype.flashIfNecessary = function(ranges) {
      if (!this.needFlash()) {
        return;
      }
      return this.vimState.flash(ranges, {
        type: this.getFlashType()
      });
    };

    Operator.prototype.flashChangeIfNecessary = function() {
      if (!this.needFlash()) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var ranges;
          if (_this.flashCheckpoint === 'did-finish') {
            ranges = _this.mutationManager.getMarkerBufferRanges().filter(function(range) {
              return !range.isEmpty();
            });
          } else {
            ranges = _this.mutationManager.getBufferRangesForCheckpoint(_this.flashCheckpoint);
          }
          return _this.vimState.flash(ranges, {
            type: _this.getFlashType()
          });
        };
      })(this));
    };

    Operator.prototype.getFlashType = function() {
      if (this.occurrenceSelected) {
        return this.flashTypeForOccurrence;
      } else {
        return this.flashType;
      }
    };

    Operator.prototype.trackChangeIfNecessary = function() {
      if (!this.trackChange) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var marker, ref1;
          if (marker = (ref1 = _this.mutationManager.getMutationForSelection(_this.editor.getLastSelection())) != null ? ref1.marker : void 0) {
            return _this.setMarkForChange(marker.getBufferRange());
          }
        };
      })(this));
    };

    function Operator() {
      var ref1, ref2;
      Operator.__super__.constructor.apply(this, arguments);
      ref1 = this.vimState, this.mutationManager = ref1.mutationManager, this.occurrenceManager = ref1.occurrenceManager, this.persistentSelection = ref1.persistentSelection;
      this.subscribeResetOccurrencePatternIfNeeded();
      this.initialize();
      this.onDidSetOperatorModifier(this.setModifier.bind(this));
      if (this.acceptPresetOccurrence && this.occurrenceManager.hasMarkers()) {
        this.setOccurrence(true);
      }
      if (this.isOccurrence() && !this.occurrenceManager.hasMarkers()) {
        this.occurrenceManager.addPattern((ref2 = this.patternForOccurrence) != null ? ref2 : this.getPatternForOccurrenceType(this.occurrenceType));
      }
      if (this.selectPersistentSelectionIfNecessary()) {
        if (this.isMode('visual')) {
          null;
        } else {
          this.vimState.modeManager.activate('visual', swrap.detectVisualModeSubmode(this.editor));
        }
      }
      if (this.isMode('visual') && this.acceptCurrentSelection) {
        this.target = 'CurrentSelection';
      }
      if (_.isString(this.target)) {
        this.setTarget(this["new"](this.target));
      }
    }

    Operator.prototype.subscribeResetOccurrencePatternIfNeeded = function() {
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        return this.onDidResetOperationStack((function(_this) {
          return function() {
            return _this.occurrenceManager.resetPatterns();
          };
        })(this));
      }
    };

    Operator.prototype.setModifier = function(options) {
      var pattern;
      if (options.wise != null) {
        this.wise = options.wise;
        return;
      }
      if (options.occurrence != null) {
        this.setOccurrence(options.occurrence);
        if (this.isOccurrence()) {
          this.occurrenceType = options.occurrenceType;
          pattern = this.getPatternForOccurrenceType(this.occurrenceType);
          this.occurrenceManager.addPattern(pattern, {
            reset: true,
            occurrenceType: this.occurrenceType
          });
          return this.onDidResetOperationStack((function(_this) {
            return function() {
              return _this.occurrenceManager.resetPatterns();
            };
          })(this));
        }
      }
    };

    Operator.prototype.selectPersistentSelectionIfNecessary = function() {
      if (this.acceptPersistentSelection && this.getConfig('autoSelectPersistentSelectionOnOperate') && !this.persistentSelection.isEmpty()) {
        this.persistentSelection.select();
        this.editor.mergeIntersectingSelections();
        swrap.saveProperties(this.editor);
        return true;
      } else {
        return false;
      }
    };

    Operator.prototype.getPatternForOccurrenceType = function(occurrenceType) {
      switch (occurrenceType) {
        case 'base':
          return getWordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
        case 'subword':
          return getSubwordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
      }
    };

    Operator.prototype.setTarget = function(target) {
      this.target = target;
      this.target.setOperator(this);
      this.emitDidSetTarget(this);
      if (this.canEarlySelect()) {
        this.normalizeSelectionsIfNecessary();
        this.createBufferCheckpoint('undo');
        this.selectTarget();
      }
      return this;
    };

    Operator.prototype.setTextToRegisterForSelection = function(selection) {
      return this.setTextToRegister(selection.getText(), selection);
    };

    Operator.prototype.setTextToRegister = function(text, selection) {
      if (this.target.isLinewise() && (!text.endsWith('\n'))) {
        text += "\n";
      }
      if (text) {
        return this.vimState.register.set({
          text: text,
          selection: selection
        });
      }
    };

    Operator.prototype.normalizeSelectionsIfNecessary = function() {
      var ref1;
      if (((ref1 = this.target) != null ? ref1.isMotion() : void 0) && this.isMode('visual')) {
        return this.vimState.modeManager.normalizeSelections();
      }
    };

    Operator.prototype.startMutation = function(fn) {
      if (this.canEarlySelect()) {
        fn();
        this.emitWillFinishMutation();
        this.groupChangesSinceBufferCheckpoint('undo');
      } else {
        this.normalizeSelectionsIfNecessary();
        this.editor.transact((function(_this) {
          return function() {
            fn();
            return _this.emitWillFinishMutation();
          };
        })(this));
      }
      return this.emitDidFinishMutation();
    };

    Operator.prototype.execute = function() {
      this.startMutation((function(_this) {
        return function() {
          var i, len, selection, selections;
          if (_this.selectTarget()) {
            if (_this.mutateSelectionOrderd) {
              selections = _this.editor.getSelectionsOrderedByBufferPosition();
            } else {
              selections = _this.editor.getSelections();
            }
            for (i = 0, len = selections.length; i < len; i++) {
              selection = selections[i];
              _this.mutateSelection(selection);
            }
            return _this.restoreCursorPositionsIfNecessary();
          }
        };
      })(this));
      return this.activateMode('normal');
    };

    Operator.prototype.selectTarget = function() {
      var base;
      if (this.targetSelected != null) {
        return this.targetSelected;
      }
      this.mutationManager.init({
        useMarker: this.needStay() && this.stayByMarker
      });
      if (this.wise != null) {
        if (typeof (base = this.target).forceWise === "function") {
          base.forceWise(this.wise);
        }
      }
      this.emitWillSelectTarget();
      this.mutationManager.setCheckpoint('will-select');
      if (this.isRepeated() && this.isOccurrence() && !this.occurrenceManager.hasMarkers()) {
        this.occurrenceManager.addPattern(this.patternForOccurrence, {
          occurrenceType: this.occurrenceType
        });
      }
      this.target.execute();
      this.mutationManager.setCheckpoint('did-select');
      if (this.isOccurrence()) {
        if (this.patternForOccurrence == null) {
          this.patternForOccurrence = this.occurrenceManager.buildPattern();
        }
        if (this.occurrenceManager.select()) {
          swrap.clearProperties(this.editor);
          this.occurrenceSelected = true;
          this.mutationManager.setCheckpoint('did-select-occurrence');
        }
      }
      if (haveSomeNonEmptySelection(this.editor) || this.target.getName() === "Empty") {
        this.emitDidSelectTarget();
        this.flashChangeIfNecessary();
        this.trackChangeIfNecessary();
        this.targetSelected = true;
        return true;
      } else {
        this.emitDidFailSelectTarget();
        this.targetSelected = false;
        return false;
      }
    };

    Operator.prototype.restoreCursorPositionsIfNecessary = function() {
      var options, ref1;
      if (!this.restorePositions) {
        return;
      }
      options = {
        stay: this.needStayOnRestore(),
        occurrenceSelected: this.occurrenceSelected,
        isBlockwise: (ref1 = this.target) != null ? typeof ref1.isBlockwise === "function" ? ref1.isBlockwise() : void 0 : void 0
      };
      this.mutationManager.restoreCursorPositions(options);
      return this.emitDidRestoreCursorPositions();
    };

    return Operator;

  })(Base);

  Select = (function(superClass) {
    extend(Select, superClass);

    function Select() {
      return Select.__super__.constructor.apply(this, arguments);
    }

    Select.extend(false);

    Select.prototype.flashTarget = false;

    Select.prototype.recordable = false;

    Select.prototype.acceptPresetOccurrence = false;

    Select.prototype.acceptPersistentSelection = false;

    Select.prototype.execute = function() {
      var wise;
      this.startMutation(this.selectTarget.bind(this));
      if (this.target.isTextObject() && (wise = this.target.getWise())) {
        return this.activateModeIfNecessary('visual', wise);
      }
    };

    return Select;

  })(Operator);

  SelectLatestChange = (function(superClass) {
    extend(SelectLatestChange, superClass);

    function SelectLatestChange() {
      return SelectLatestChange.__super__.constructor.apply(this, arguments);
    }

    SelectLatestChange.extend();

    SelectLatestChange.description = "Select latest yanked or changed range";

    SelectLatestChange.prototype.target = 'ALatestChange';

    return SelectLatestChange;

  })(Select);

  SelectPreviousSelection = (function(superClass) {
    extend(SelectPreviousSelection, superClass);

    function SelectPreviousSelection() {
      return SelectPreviousSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPreviousSelection.extend();

    SelectPreviousSelection.prototype.target = "PreviousSelection";

    return SelectPreviousSelection;

  })(Select);

  SelectPersistentSelection = (function(superClass) {
    extend(SelectPersistentSelection, superClass);

    function SelectPersistentSelection() {
      return SelectPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPersistentSelection.extend();

    SelectPersistentSelection.description = "Select persistent-selection and clear all persistent-selection, it's like convert to real-selection";

    SelectPersistentSelection.prototype.target = "APersistentSelection";

    return SelectPersistentSelection;

  })(Select);

  SelectOccurrence = (function(superClass) {
    extend(SelectOccurrence, superClass);

    function SelectOccurrence() {
      return SelectOccurrence.__super__.constructor.apply(this, arguments);
    }

    SelectOccurrence.extend();

    SelectOccurrence.description = "Add selection onto each matching word within target range";

    SelectOccurrence.prototype.occurrence = true;

    SelectOccurrence.prototype.execute = function() {
      return this.startMutation((function(_this) {
        return function() {
          var submode;
          if (_this.selectTarget()) {
            submode = swrap.detectVisualModeSubmode(_this.editor);
            return _this.activateModeIfNecessary('visual', submode);
          }
        };
      })(this));
    };

    return SelectOccurrence;

  })(Operator);

  CreatePersistentSelection = (function(superClass) {
    extend(CreatePersistentSelection, superClass);

    function CreatePersistentSelection() {
      return CreatePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    CreatePersistentSelection.extend();

    CreatePersistentSelection.prototype.flashTarget = false;

    CreatePersistentSelection.prototype.stayAtSamePosition = true;

    CreatePersistentSelection.prototype.acceptPresetOccurrence = false;

    CreatePersistentSelection.prototype.acceptPersistentSelection = false;

    CreatePersistentSelection.prototype.execute = function() {
      this.restorePositions = !this.isMode('visual', 'blockwise');
      return CreatePersistentSelection.__super__.execute.apply(this, arguments);
    };

    CreatePersistentSelection.prototype.mutateSelection = function(selection) {
      return this.persistentSelection.markBufferRange(selection.getBufferRange());
    };

    return CreatePersistentSelection;

  })(Operator);

  TogglePersistentSelection = (function(superClass) {
    extend(TogglePersistentSelection, superClass);

    function TogglePersistentSelection() {
      return TogglePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    TogglePersistentSelection.extend();

    TogglePersistentSelection.prototype.isComplete = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      this.markerToRemove = this.persistentSelection.getMarkerAtPoint(point);
      if (this.markerToRemove) {
        return true;
      } else {
        return TogglePersistentSelection.__super__.isComplete.apply(this, arguments);
      }
    };

    TogglePersistentSelection.prototype.execute = function() {
      if (this.markerToRemove) {
        return this.markerToRemove.destroy();
      } else {
        return TogglePersistentSelection.__super__.execute.apply(this, arguments);
      }
    };

    return TogglePersistentSelection;

  })(CreatePersistentSelection);

  TogglePresetOccurrence = (function(superClass) {
    extend(TogglePresetOccurrence, superClass);

    function TogglePresetOccurrence() {
      return TogglePresetOccurrence.__super__.constructor.apply(this, arguments);
    }

    TogglePresetOccurrence.extend();

    TogglePresetOccurrence.prototype.flashTarget = false;

    TogglePresetOccurrence.prototype.requireTarget = false;

    TogglePresetOccurrence.prototype.acceptPresetOccurrence = false;

    TogglePresetOccurrence.prototype.acceptPersistentSelection = false;

    TogglePresetOccurrence.prototype.occurrenceType = 'base';

    TogglePresetOccurrence.prototype.execute = function() {
      var isNarrowed, marker, pattern;
      if (marker = this.occurrenceManager.getMarkerAtPoint(this.editor.getCursorBufferPosition())) {
        return this.occurrenceManager.destroyMarkers([marker]);
      } else {
        pattern = null;
        isNarrowed = this.vimState.modeManager.isNarrowed();
        if (this.isMode('visual') && !isNarrowed) {
          this.occurrenceType = 'base';
          pattern = new RegExp(_.escapeRegExp(this.editor.getSelectedText()), 'g');
        } else {
          pattern = this.getPatternForOccurrenceType(this.occurrenceType);
        }
        this.occurrenceManager.addPattern(pattern, {
          occurrenceType: this.occurrenceType
        });
        this.occurrenceManager.saveLastPattern(this.occurrenceType);
        if (!isNarrowed) {
          return this.activateMode('normal');
        }
      }
    };

    return TogglePresetOccurrence;

  })(Operator);

  TogglePresetSubwordOccurrence = (function(superClass) {
    extend(TogglePresetSubwordOccurrence, superClass);

    function TogglePresetSubwordOccurrence() {
      return TogglePresetSubwordOccurrence.__super__.constructor.apply(this, arguments);
    }

    TogglePresetSubwordOccurrence.extend();

    TogglePresetSubwordOccurrence.prototype.occurrenceType = 'subword';

    return TogglePresetSubwordOccurrence;

  })(TogglePresetOccurrence);

  AddPresetOccurrenceFromLastOccurrencePattern = (function(superClass) {
    extend(AddPresetOccurrenceFromLastOccurrencePattern, superClass);

    function AddPresetOccurrenceFromLastOccurrencePattern() {
      return AddPresetOccurrenceFromLastOccurrencePattern.__super__.constructor.apply(this, arguments);
    }

    AddPresetOccurrenceFromLastOccurrencePattern.extend();

    AddPresetOccurrenceFromLastOccurrencePattern.prototype.execute = function() {
      var occurrenceType, pattern;
      this.occurrenceManager.resetPatterns();
      if (pattern = this.vimState.globalState.get('lastOccurrencePattern')) {
        occurrenceType = this.vimState.globalState.get("lastOccurrenceType");
        this.occurrenceManager.addPattern(pattern, {
          occurrenceType: occurrenceType
        });
        return this.activateMode('normal');
      }
    };

    return AddPresetOccurrenceFromLastOccurrencePattern;

  })(TogglePresetOccurrence);

  Delete = (function(superClass) {
    extend(Delete, superClass);

    function Delete() {
      this.mutateSelection = bind(this.mutateSelection, this);
      return Delete.__super__.constructor.apply(this, arguments);
    }

    Delete.extend();

    Delete.prototype.trackChange = true;

    Delete.prototype.flashCheckpoint = 'did-select-occurrence';

    Delete.prototype.flashTypeForOccurrence = 'operator-remove-occurrence';

    Delete.prototype.stayOptionName = 'stayOnDelete';

    Delete.prototype.execute = function() {
      this.onDidSelectTarget((function(_this) {
        return function() {
          if (_this.occurrenceSelected) {
            return;
          }
          if (_this.target.isLinewise()) {
            return _this.onDidRestoreCursorPositions(function() {
              var cursor, i, len, ref1, results;
              ref1 = _this.editor.getCursors();
              results = [];
              for (i = 0, len = ref1.length; i < len; i++) {
                cursor = ref1[i];
                results.push(_this.adjustCursor(cursor));
              }
              return results;
            });
          }
        };
      })(this));
      return Delete.__super__.execute.apply(this, arguments);
    };

    Delete.prototype.mutateSelection = function(selection) {
      this.setTextToRegisterForSelection(selection);
      return selection.deleteSelectedText();
    };

    Delete.prototype.adjustCursor = function(cursor) {
      var point, row;
      row = getValidVimBufferRow(this.editor, cursor.getBufferRow());
      if (this.needStayOnRestore()) {
        point = this.mutationManager.getInitialPointForSelection(cursor.selection);
        return cursor.setBufferPosition([row, point.column]);
      } else {
        return cursor.setBufferPosition(this.getFirstCharacterPositionForBufferRow(row));
      }
    };

    return Delete;

  })(Operator);

  DeleteRight = (function(superClass) {
    extend(DeleteRight, superClass);

    function DeleteRight() {
      return DeleteRight.__super__.constructor.apply(this, arguments);
    }

    DeleteRight.extend();

    DeleteRight.prototype.target = 'MoveRight';

    return DeleteRight;

  })(Delete);

  DeleteLeft = (function(superClass) {
    extend(DeleteLeft, superClass);

    function DeleteLeft() {
      return DeleteLeft.__super__.constructor.apply(this, arguments);
    }

    DeleteLeft.extend();

    DeleteLeft.prototype.target = 'MoveLeft';

    return DeleteLeft;

  })(Delete);

  DeleteToLastCharacterOfLine = (function(superClass) {
    extend(DeleteToLastCharacterOfLine, superClass);

    function DeleteToLastCharacterOfLine() {
      return DeleteToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    DeleteToLastCharacterOfLine.extend();

    DeleteToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    DeleteToLastCharacterOfLine.prototype.initialize = function() {
      if (this.isMode('visual', 'blockwise')) {
        this.acceptCurrentSelection = false;
        swrap.setReversedState(this.editor, false);
      }
      return DeleteToLastCharacterOfLine.__super__.initialize.apply(this, arguments);
    };

    return DeleteToLastCharacterOfLine;

  })(Delete);

  DeleteLine = (function(superClass) {
    extend(DeleteLine, superClass);

    function DeleteLine() {
      return DeleteLine.__super__.constructor.apply(this, arguments);
    }

    DeleteLine.extend();

    DeleteLine.prototype.wise = 'linewise';

    DeleteLine.prototype.target = "MoveToRelativeLine";

    return DeleteLine;

  })(Delete);

  Yank = (function(superClass) {
    extend(Yank, superClass);

    function Yank() {
      return Yank.__super__.constructor.apply(this, arguments);
    }

    Yank.extend();

    Yank.prototype.trackChange = true;

    Yank.prototype.stayOptionName = 'stayOnYank';

    Yank.prototype.mutateSelection = function(selection) {
      return this.setTextToRegisterForSelection(selection);
    };

    return Yank;

  })(Operator);

  YankLine = (function(superClass) {
    extend(YankLine, superClass);

    function YankLine() {
      return YankLine.__super__.constructor.apply(this, arguments);
    }

    YankLine.extend();

    YankLine.prototype.wise = 'linewise';

    YankLine.prototype.target = "MoveToRelativeLine";

    return YankLine;

  })(Yank);

  YankToLastCharacterOfLine = (function(superClass) {
    extend(YankToLastCharacterOfLine, superClass);

    function YankToLastCharacterOfLine() {
      return YankToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    YankToLastCharacterOfLine.extend();

    YankToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    return YankToLastCharacterOfLine;

  })(Yank);

  Increase = (function(superClass) {
    extend(Increase, superClass);

    function Increase() {
      return Increase.__super__.constructor.apply(this, arguments);
    }

    Increase.extend();

    Increase.prototype.target = "InnerCurrentLine";

    Increase.prototype.flashTarget = false;

    Increase.prototype.restorePositions = false;

    Increase.prototype.step = 1;

    Increase.prototype.execute = function() {
      var ref1;
      this.newRanges = [];
      Increase.__super__.execute.apply(this, arguments);
      if (this.newRanges.length) {
        if (this.getConfig('flashOnOperate') && (ref1 = this.getName(), indexOf.call(this.getConfig('flashOnOperateBlacklist'), ref1) < 0)) {
          return this.vimState.flash(this.newRanges, {
            type: this.flashTypeForOccurrence
          });
        }
      }
    };

    Increase.prototype.replaceNumberInBufferRange = function(scanRange, fn) {
      var newRanges;
      if (fn == null) {
        fn = null;
      }
      newRanges = [];
      if (this.pattern == null) {
        this.pattern = RegExp("" + (this.getConfig('numberRegex')), "g");
      }
      this.scanForward(this.pattern, {
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var matchText, nextNumber, replace;
          if ((fn != null) && !fn(event)) {
            return;
          }
          matchText = event.matchText, replace = event.replace;
          nextNumber = _this.getNextNumber(matchText);
          return newRanges.push(replace(String(nextNumber)));
        };
      })(this));
      return newRanges;
    };

    Increase.prototype.mutateSelection = function(selection) {
      var initialPoint, newRanges, point, ref1, ref2, ref3, scanRange;
      scanRange = selection.getBufferRange();
      if (this["instanceof"]('IncrementNumber') || this.target.is('CurrentSelection')) {
        (ref1 = this.newRanges).push.apply(ref1, this.replaceNumberInBufferRange(scanRange));
        return selection.cursor.setBufferPosition(scanRange.start);
      } else {
        initialPoint = this.mutationManager.getInitialPointForSelection(selection);
        newRanges = this.replaceNumberInBufferRange(scanRange, function(arg) {
          var range, stop;
          range = arg.range, stop = arg.stop;
          if (range.end.isGreaterThan(initialPoint)) {
            stop();
            return true;
          } else {
            return false;
          }
        });
        point = (ref2 = (ref3 = newRanges[0]) != null ? ref3.end.translate([0, -1]) : void 0) != null ? ref2 : initialPoint;
        return selection.cursor.setBufferPosition(point);
      }
    };

    Increase.prototype.getNextNumber = function(numberString) {
      return Number.parseInt(numberString, 10) + this.step * this.getCount();
    };

    return Increase;

  })(Operator);

  Decrease = (function(superClass) {
    extend(Decrease, superClass);

    function Decrease() {
      return Decrease.__super__.constructor.apply(this, arguments);
    }

    Decrease.extend();

    Decrease.prototype.step = -1;

    return Decrease;

  })(Increase);

  IncrementNumber = (function(superClass) {
    extend(IncrementNumber, superClass);

    function IncrementNumber() {
      return IncrementNumber.__super__.constructor.apply(this, arguments);
    }

    IncrementNumber.extend();

    IncrementNumber.prototype.baseNumber = null;

    IncrementNumber.prototype.target = null;

    IncrementNumber.prototype.mutateSelectionOrderd = true;

    IncrementNumber.prototype.getNextNumber = function(numberString) {
      if (this.baseNumber != null) {
        this.baseNumber += this.step * this.getCount();
      } else {
        this.baseNumber = Number.parseInt(numberString, 10);
      }
      return this.baseNumber;
    };

    return IncrementNumber;

  })(Increase);

  DecrementNumber = (function(superClass) {
    extend(DecrementNumber, superClass);

    function DecrementNumber() {
      return DecrementNumber.__super__.constructor.apply(this, arguments);
    }

    DecrementNumber.extend();

    DecrementNumber.prototype.step = -1;

    return DecrementNumber;

  })(IncrementNumber);

  PutBefore = (function(superClass) {
    extend(PutBefore, superClass);

    function PutBefore() {
      return PutBefore.__super__.constructor.apply(this, arguments);
    }

    PutBefore.extend();

    PutBefore.prototype.location = 'before';

    PutBefore.prototype.target = 'Empty';

    PutBefore.prototype.flashType = 'operator-long';

    PutBefore.prototype.restorePositions = false;

    PutBefore.prototype.flashTarget = true;

    PutBefore.prototype.trackChange = false;

    PutBefore.prototype.execute = function() {
      var ref1, text, type;
      this.mutationsBySelection = new Map();
      ref1 = this.vimState.register.get(null, this.editor.getLastSelection()), text = ref1.text, type = ref1.type;
      if (!text) {
        return;
      }
      this.onDidFinishMutation(this.adjustCursorPosition.bind(this));
      this.onDidFinishOperation((function(_this) {
        return function() {
          var newRange, ref2, toRange;
          if (newRange = _this.mutationsBySelection.get(_this.editor.getLastSelection())) {
            _this.setMarkForChange(newRange);
          }
          if (_this.getConfig('flashOnOperate') && (ref2 = _this.getName(), indexOf.call(_this.getConfig('flashOnOperateBlacklist'), ref2) < 0)) {
            toRange = function(selection) {
              return _this.mutationsBySelection.get(selection);
            };
            return _this.vimState.flash(_this.editor.getSelections().map(toRange), {
              type: _this.getFlashType()
            });
          }
        };
      })(this));
      return PutBefore.__super__.execute.apply(this, arguments);
    };

    PutBefore.prototype.adjustCursorPosition = function() {
      var cursor, end, i, len, newRange, ref1, ref2, results, selection, start;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        cursor = selection.cursor;
        ref2 = newRange = this.mutationsBySelection.get(selection), start = ref2.start, end = ref2.end;
        if (this.linewisePaste) {
          results.push(moveCursorToFirstCharacterAtRow(cursor, start.row));
        } else {
          if (newRange.isSingleLine()) {
            results.push(cursor.setBufferPosition(end.translate([0, -1])));
          } else {
            results.push(cursor.setBufferPosition(start));
          }
        }
      }
      return results;
    };

    PutBefore.prototype.mutateSelection = function(selection) {
      var newRange, ref1, text, type;
      ref1 = this.vimState.register.get(null, selection), text = ref1.text, type = ref1.type;
      text = _.multiplyString(text, this.getCount());
      this.linewisePaste = type === 'linewise' || this.isMode('visual', 'linewise');
      newRange = this.paste(selection, text, {
        linewisePaste: this.linewisePaste
      });
      return this.mutationsBySelection.set(selection, newRange);
    };

    PutBefore.prototype.paste = function(selection, text, arg) {
      var linewisePaste;
      linewisePaste = arg.linewisePaste;
      if (linewisePaste) {
        return this.pasteLinewise(selection, text);
      } else {
        return this.pasteCharacterwise(selection, text);
      }
    };

    PutBefore.prototype.pasteCharacterwise = function(selection, text) {
      var cursor;
      cursor = selection.cursor;
      if (selection.isEmpty() && this.location === 'after' && !isEmptyRow(this.editor, cursor.getBufferRow())) {
        cursor.moveRight();
      }
      return selection.insertText(text);
    };

    PutBefore.prototype.pasteLinewise = function(selection, text) {
      var cursor, cursorRow, newRange;
      cursor = selection.cursor;
      cursorRow = cursor.getBufferRow();
      if (!text.endsWith("\n")) {
        text += "\n";
      }
      newRange = null;
      if (selection.isEmpty()) {
        if (this.location === 'before') {
          newRange = insertTextAtBufferPosition(this.editor, [cursorRow, 0], text);
          setBufferRow(cursor, newRange.start.row);
        } else if (this.location === 'after') {
          ensureEndsWithNewLineForBufferRow(this.editor, cursorRow);
          newRange = insertTextAtBufferPosition(this.editor, [cursorRow + 1, 0], text);
        }
      } else {
        if (!this.isMode('visual', 'linewise')) {
          selection.insertText("\n");
        }
        newRange = selection.insertText(text);
      }
      return newRange;
    };

    return PutBefore;

  })(Operator);

  PutAfter = (function(superClass) {
    extend(PutAfter, superClass);

    function PutAfter() {
      return PutAfter.__super__.constructor.apply(this, arguments);
    }

    PutAfter.extend();

    PutAfter.prototype.location = 'after';

    return PutAfter;

  })(PutBefore);

  AddBlankLineBelow = (function(superClass) {
    extend(AddBlankLineBelow, superClass);

    function AddBlankLineBelow() {
      return AddBlankLineBelow.__super__.constructor.apply(this, arguments);
    }

    AddBlankLineBelow.extend();

    AddBlankLineBelow.prototype.flashTarget = false;

    AddBlankLineBelow.prototype.target = "Empty";

    AddBlankLineBelow.prototype.stayAtSamePosition = true;

    AddBlankLineBelow.prototype.stayByMarker = true;

    AddBlankLineBelow.prototype.where = 'below';

    AddBlankLineBelow.prototype.mutateSelection = function(selection) {
      var point, row;
      row = selection.getHeadBufferPosition().row;
      if (this.where === 'below') {
        row += 1;
      }
      point = [row, 0];
      return this.editor.setTextInBufferRange([point, point], "\n".repeat(this.getCount()));
    };

    return AddBlankLineBelow;

  })(Operator);

  AddBlankLineAbove = (function(superClass) {
    extend(AddBlankLineAbove, superClass);

    function AddBlankLineAbove() {
      return AddBlankLineAbove.__super__.constructor.apply(this, arguments);
    }

    AddBlankLineAbove.extend();

    AddBlankLineAbove.prototype.where = 'above';

    return AddBlankLineAbove;

  })(AddBlankLineBelow);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4dUJBQUE7SUFBQTs7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BVUksT0FBQSxDQUFRLFNBQVIsQ0FWSixFQUNFLHlEQURGLEVBRUUsK0NBRkYsRUFHRSwyQkFIRixFQUlFLG1FQUpGLEVBS0UseUVBTEYsRUFNRSwyREFORixFQU9FLCtCQVBGLEVBUUUscUVBUkYsRUFTRTs7RUFFRixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFRDs7O0lBQ0osUUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOzt1QkFDQSxhQUFBLEdBQWU7O3VCQUNmLFVBQUEsR0FBWTs7dUJBRVosSUFBQSxHQUFNOzt1QkFDTixVQUFBLEdBQVk7O3VCQUNaLGNBQUEsR0FBZ0I7O3VCQUVoQixXQUFBLEdBQWE7O3VCQUNiLGVBQUEsR0FBaUI7O3VCQUNqQixTQUFBLEdBQVc7O3VCQUNYLHNCQUFBLEdBQXdCOzt1QkFDeEIsV0FBQSxHQUFhOzt1QkFFYixvQkFBQSxHQUFzQjs7dUJBQ3RCLGtCQUFBLEdBQW9COzt1QkFDcEIsY0FBQSxHQUFnQjs7dUJBQ2hCLFlBQUEsR0FBYzs7dUJBQ2QsZ0JBQUEsR0FBa0I7O3VCQUVsQixzQkFBQSxHQUF3Qjs7dUJBQ3hCLHlCQUFBLEdBQTJCOzt1QkFDM0Isc0JBQUEsR0FBd0I7O3VCQUV4Qix5QkFBQSxHQUEyQjs7dUJBQzNCLHFCQUFBLEdBQXVCOzt1QkFJdkIsa0JBQUEsR0FBb0I7O3VCQUNwQixjQUFBLEdBQWdCOzt1QkFDaEIsY0FBQSxHQUFnQixTQUFBO2FBQ2QsSUFBQyxDQUFBLGtCQUFELElBQXdCLENBQUksSUFBQyxDQUFB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QUZXOztFQUlqQjs7Ozs7OztJQUNKLGlCQUFDLENBQUEsTUFBRCxDQUFBOztnQ0FDQSxXQUFBLEdBQWE7O2dDQUNiLE1BQUEsR0FBUTs7Z0NBQ1Isa0JBQUEsR0FBb0I7O2dDQUNwQixZQUFBLEdBQWM7O2dDQUNkLEtBQUEsR0FBTzs7Z0NBRVAsZUFBQSxHQUFpQixTQUFDLFNBQUQ7QUFDZixVQUFBO01BQUEsR0FBQSxHQUFNLFNBQVMsQ0FBQyxxQkFBVixDQUFBLENBQWlDLENBQUM7TUFDeEMsSUFBWSxJQUFDLENBQUEsS0FBRCxLQUFVLE9BQXRCO1FBQUEsR0FBQSxJQUFPLEVBQVA7O01BQ0EsS0FBQSxHQUFRLENBQUMsR0FBRCxFQUFNLENBQU47YUFDUixJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLENBQUMsS0FBRCxFQUFRLEtBQVIsQ0FBN0IsRUFBNkMsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVosQ0FBN0M7SUFKZTs7OztLQVJhOztFQWMxQjs7Ozs7OztJQUNKLGlCQUFDLENBQUEsTUFBRCxDQUFBOztnQ0FDQSxLQUFBLEdBQU87Ozs7S0FGdUI7QUFocUJoQyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57XG4gIGhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb25cbiAgZ2V0VmFsaWRWaW1CdWZmZXJSb3dcbiAgaXNFbXB0eVJvd1xuICBnZXRXb3JkUGF0dGVybkF0QnVmZmVyUG9zaXRpb25cbiAgZ2V0U3Vid29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uXG4gIGluc2VydFRleHRBdEJ1ZmZlclBvc2l0aW9uXG4gIHNldEJ1ZmZlclJvd1xuICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93XG4gIGVuc3VyZUVuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvd1xufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xuXG5jbGFzcyBPcGVyYXRvciBleHRlbmRzIEJhc2VcbiAgQGV4dGVuZChmYWxzZSlcbiAgcmVxdWlyZVRhcmdldDogdHJ1ZVxuICByZWNvcmRhYmxlOiB0cnVlXG5cbiAgd2lzZTogbnVsbFxuICBvY2N1cnJlbmNlOiBmYWxzZVxuICBvY2N1cnJlbmNlVHlwZTogJ2Jhc2UnXG5cbiAgZmxhc2hUYXJnZXQ6IHRydWVcbiAgZmxhc2hDaGVja3BvaW50OiAnZGlkLWZpbmlzaCdcbiAgZmxhc2hUeXBlOiAnb3BlcmF0b3InXG4gIGZsYXNoVHlwZUZvck9jY3VycmVuY2U6ICdvcGVyYXRvci1vY2N1cnJlbmNlJ1xuICB0cmFja0NoYW5nZTogZmFsc2VcblxuICBwYXR0ZXJuRm9yT2NjdXJyZW5jZTogbnVsbFxuICBzdGF5QXRTYW1lUG9zaXRpb246IG51bGxcbiAgc3RheU9wdGlvbk5hbWU6IG51bGxcbiAgc3RheUJ5TWFya2VyOiBmYWxzZVxuICByZXN0b3JlUG9zaXRpb25zOiB0cnVlXG5cbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogdHJ1ZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uOiB0cnVlXG4gIGFjY2VwdEN1cnJlbnRTZWxlY3Rpb246IHRydWVcblxuICBidWZmZXJDaGVja3BvaW50QnlQdXJwb3NlOiBudWxsXG4gIG11dGF0ZVNlbGVjdGlvbk9yZGVyZDogZmFsc2VcblxuICAjIEV4cGVyaW1lbnRhbHkgYWxsb3cgc2VsZWN0VGFyZ2V0IGJlZm9yZSBpbnB1dCBDb21wbGV0ZVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VwcG9ydEVhcmx5U2VsZWN0OiBmYWxzZVxuICB0YXJnZXRTZWxlY3RlZDogbnVsbFxuICBjYW5FYXJseVNlbGVjdDogLT5cbiAgICBAc3VwcG9ydEVhcmx5U2VsZWN0IGFuZCBub3QgQGlzUmVwZWF0ZWQoKVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIENhbGxlZCB3aGVuIG9wZXJhdGlvbiBmaW5pc2hlZFxuICAjIFRoaXMgaXMgZXNzZW50aWFsbHkgdG8gcmVzZXQgc3RhdGUgZm9yIGAuYCByZXBlYXQuXG4gIHJlc2V0U3RhdGU6IC0+XG4gICAgQHRhcmdldFNlbGVjdGVkID0gbnVsbFxuICAgIEBvY2N1cnJlbmNlU2VsZWN0ZWQgPSBmYWxzZVxuXG4gICMgVHdvIGNoZWNrcG9pbnQgZm9yIGRpZmZlcmVudCBwdXJwb3NlXG4gICMgLSBvbmUgZm9yIHVuZG8oaGFuZGxlZCBieSBtb2RlTWFuYWdlcilcbiAgIyAtIG9uZSBmb3IgcHJlc2VydmUgbGFzdCBpbnNlcnRlZCB0ZXh0XG4gIGNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQ6IChwdXJwb3NlKSAtPlxuICAgIEBidWZmZXJDaGVja3BvaW50QnlQdXJwb3NlID89IHt9XG4gICAgQGJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2VbcHVycG9zZV0gPSBAZWRpdG9yLmNyZWF0ZUNoZWNrcG9pbnQoKVxuXG4gIGdldEJ1ZmZlckNoZWNrcG9pbnQ6IChwdXJwb3NlKSAtPlxuICAgIEBidWZmZXJDaGVja3BvaW50QnlQdXJwb3NlP1twdXJwb3NlXVxuXG4gIGRlbGV0ZUJ1ZmZlckNoZWNrcG9pbnQ6IChwdXJwb3NlKSAtPlxuICAgIGlmIEBidWZmZXJDaGVja3BvaW50QnlQdXJwb3NlP1xuICAgICAgZGVsZXRlIEBidWZmZXJDaGVja3BvaW50QnlQdXJwb3NlW3B1cnBvc2VdXG5cbiAgZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBpZiBjaGVja3BvaW50ID0gQGdldEJ1ZmZlckNoZWNrcG9pbnQocHVycG9zZSlcbiAgICAgIEBlZGl0b3IuZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50KGNoZWNrcG9pbnQpXG4gICAgICBAZGVsZXRlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKVxuXG4gIG5lZWRTdGF5OiAtPlxuICAgIEBzdGF5QXRTYW1lUG9zaXRpb24gP1xuICAgICAgKEBpc09jY3VycmVuY2UoKSBhbmQgQGdldENvbmZpZygnc3RheU9uT2NjdXJyZW5jZScpKSBvciBAZ2V0Q29uZmlnKEBzdGF5T3B0aW9uTmFtZSlcblxuICBuZWVkU3RheU9uUmVzdG9yZTogLT5cbiAgICBAc3RheUF0U2FtZVBvc2l0aW9uID9cbiAgICAgIChAaXNPY2N1cnJlbmNlKCkgYW5kIEBnZXRDb25maWcoJ3N0YXlPbk9jY3VycmVuY2UnKSBhbmQgQG9jY3VycmVuY2VTZWxlY3RlZCkgb3IgQGdldENvbmZpZyhAc3RheU9wdGlvbk5hbWUpXG5cbiAgaXNPY2N1cnJlbmNlOiAtPlxuICAgIEBvY2N1cnJlbmNlXG5cbiAgc2V0T2NjdXJyZW5jZTogKEBvY2N1cnJlbmNlKSAtPlxuICAgIEBvY2N1cnJlbmNlXG5cbiAgc2V0TWFya0ZvckNoYW5nZTogKHJhbmdlKSAtPlxuICAgIEB2aW1TdGF0ZS5tYXJrLnNldFJhbmdlKCdbJywgJ10nLCByYW5nZSlcblxuICBuZWVkRmxhc2g6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZmxhc2hUYXJnZXRcbiAgICB7bW9kZSwgc3VibW9kZX0gPSBAdmltU3RhdGVcbiAgICBpZiBtb2RlIGlzbnQgJ3Zpc3VhbCcgb3IgKEB0YXJnZXQuaXNNb3Rpb24oKSBhbmQgc3VibW9kZSBpc250IEB0YXJnZXQud2lzZSlcbiAgICAgIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlJykgYW5kIChAZ2V0TmFtZSgpIG5vdCBpbiBAZ2V0Q29uZmlnKCdmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdCcpKVxuXG4gIGZsYXNoSWZOZWNlc3Nhcnk6IChyYW5nZXMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbmVlZEZsYXNoKClcbiAgICBAdmltU3RhdGUuZmxhc2gocmFuZ2VzLCB0eXBlOiBAZ2V0Rmxhc2hUeXBlKCkpXG5cbiAgZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBuZWVkRmxhc2goKVxuXG4gICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICBpZiBAZmxhc2hDaGVja3BvaW50IGlzICdkaWQtZmluaXNoJ1xuICAgICAgICByYW5nZXMgPSBAbXV0YXRpb25NYW5hZ2VyLmdldE1hcmtlckJ1ZmZlclJhbmdlcygpLmZpbHRlciAocmFuZ2UpIC0+IG5vdCByYW5nZS5pc0VtcHR5KClcbiAgICAgIGVsc2VcbiAgICAgICAgcmFuZ2VzID0gQG11dGF0aW9uTWFuYWdlci5nZXRCdWZmZXJSYW5nZXNGb3JDaGVja3BvaW50KEBmbGFzaENoZWNrcG9pbnQpXG4gICAgICBAdmltU3RhdGUuZmxhc2gocmFuZ2VzLCB0eXBlOiBAZ2V0Rmxhc2hUeXBlKCkpXG5cbiAgZ2V0Rmxhc2hUeXBlOiAtPlxuICAgIGlmIEBvY2N1cnJlbmNlU2VsZWN0ZWRcbiAgICAgIEBmbGFzaFR5cGVGb3JPY2N1cnJlbmNlXG4gICAgZWxzZVxuICAgICAgQGZsYXNoVHlwZVxuXG4gIHRyYWNrQ2hhbmdlSWZOZWNlc3Nhcnk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAdHJhY2tDaGFuZ2VcblxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgaWYgbWFya2VyID0gQG11dGF0aW9uTWFuYWdlci5nZXRNdXRhdGlvbkZvclNlbGVjdGlvbihAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSk/Lm1hcmtlclxuICAgICAgICBAc2V0TWFya0ZvckNoYW5nZShtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlclxuICAgIHtAbXV0YXRpb25NYW5hZ2VyLCBAb2NjdXJyZW5jZU1hbmFnZXIsIEBwZXJzaXN0ZW50U2VsZWN0aW9ufSA9IEB2aW1TdGF0ZVxuICAgIEBzdWJzY3JpYmVSZXNldE9jY3VycmVuY2VQYXR0ZXJuSWZOZWVkZWQoKVxuICAgIEBpbml0aWFsaXplKClcbiAgICBAb25EaWRTZXRPcGVyYXRvck1vZGlmaWVyKEBzZXRNb2RpZmllci5iaW5kKHRoaXMpKVxuXG4gICAgIyBXaGVuIHByZXNldC1vY2N1cnJlbmNlIHdhcyBleGlzdHMsIG9wZXJhdGUgb24gb2NjdXJyZW5jZS13aXNlXG4gICAgaWYgQGFjY2VwdFByZXNldE9jY3VycmVuY2UgYW5kIEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcbiAgICAgIEBzZXRPY2N1cnJlbmNlKHRydWUpXG5cbiAgICAjIFtGSVhNRV0gT1JERVItTUFUVEVSXG4gICAgIyBUbyBwaWNrIGN1cnNvci13b3JkIHRvIGZpbmQgb2NjdXJyZW5jZSBiYXNlIHBhdHRlcm4uXG4gICAgIyBUaGlzIGhhcyB0byBiZSBkb25lIEJFRk9SRSBjb252ZXJ0aW5nIHBlcnNpc3RlbnQtc2VsZWN0aW9uIGludG8gcmVhbC1zZWxlY3Rpb24uXG4gICAgIyBTaW5jZSB3aGVuIHBlcnNpc3RlbnQtc2VsZWN0aW9uIGlzIGFjdHVhbGwgc2VsZWN0ZWQsIGl0IGNoYW5nZSBjdXJzb3IgcG9zaXRpb24uXG4gICAgaWYgQGlzT2NjdXJyZW5jZSgpIGFuZCBub3QgQG9jY3VycmVuY2VNYW5hZ2VyLmhhc01hcmtlcnMoKVxuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4oQHBhdHRlcm5Gb3JPY2N1cnJlbmNlID8gQGdldFBhdHRlcm5Gb3JPY2N1cnJlbmNlVHlwZShAb2NjdXJyZW5jZVR5cGUpKVxuXG4gICAgIyBUaGlzIGNoYW5nZSBjdXJzb3IgcG9zaXRpb24uXG4gICAgaWYgQHNlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb25JZk5lY2Vzc2FyeSgpXG4gICAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgICAjIFtGSVhNRV0gU3luYyBzZWxlY3Rpb24td2lzZSB0aGlzIHBoYXNlP1xuICAgICAgICAjIGUuZy4gc2VsZWN0ZWQgcGVyc2lzdGVkIHNlbGVjdGlvbiBjb252ZXJ0IHRvIHZCIHNlbCBpbiB2Qi1tb2RlP1xuICAgICAgICBudWxsXG4gICAgICBlbHNlXG4gICAgICAgIEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5hY3RpdmF0ZSgndmlzdWFsJywgc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoQGVkaXRvcikpXG5cbiAgICBAdGFyZ2V0ID0gJ0N1cnJlbnRTZWxlY3Rpb24nIGlmIEBpc01vZGUoJ3Zpc3VhbCcpIGFuZCBAYWNjZXB0Q3VycmVudFNlbGVjdGlvblxuICAgIEBzZXRUYXJnZXQoQG5ldyhAdGFyZ2V0KSkgaWYgXy5pc1N0cmluZyhAdGFyZ2V0KVxuXG4gIHN1YnNjcmliZVJlc2V0T2NjdXJyZW5jZVBhdHRlcm5JZk5lZWRlZDogLT5cbiAgICAjIFtDQVVUSU9OXVxuICAgICMgVGhpcyBtZXRob2QgaGFzIHRvIGJlIGNhbGxlZCBpbiBQUk9QRVIgdGltaW5nLlxuICAgICMgSWYgb2NjdXJyZW5jZSBpcyB0cnVlIGJ1dCBubyBwcmVzZXQtb2NjdXJyZW5jZVxuICAgICMgVHJlYXQgdGhhdCBgb2NjdXJyZW5jZWAgaXMgQk9VTkRFRCB0byBvcGVyYXRvciBpdHNlbGYsIHNvIGNsZWFucCBhdCBmaW5pc2hlZC5cbiAgICBpZiBAb2NjdXJyZW5jZSBhbmQgbm90IEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcbiAgICAgIEBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2soPT4gQG9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSlcblxuICBzZXRNb2RpZmllcjogKG9wdGlvbnMpIC0+XG4gICAgaWYgb3B0aW9ucy53aXNlP1xuICAgICAgQHdpc2UgPSBvcHRpb25zLndpc2VcbiAgICAgIHJldHVyblxuXG4gICAgaWYgb3B0aW9ucy5vY2N1cnJlbmNlP1xuICAgICAgQHNldE9jY3VycmVuY2Uob3B0aW9ucy5vY2N1cnJlbmNlKVxuICAgICAgaWYgQGlzT2NjdXJyZW5jZSgpXG4gICAgICAgIEBvY2N1cnJlbmNlVHlwZSA9IG9wdGlvbnMub2NjdXJyZW5jZVR5cGVcbiAgICAgICAgIyBUaGlzIGlzIG8gbW9kaWZpZXIgY2FzZShlLmcuIGBjIG8gcGAsIGBkIE8gZmApXG4gICAgICAgICMgV2UgUkVTRVQgZXhpc3Rpbmcgb2NjdXJlbmNlLW1hcmtlciB3aGVuIGBvYCBvciBgT2AgbW9kaWZpZXIgaXMgdHlwZWQgYnkgdXNlci5cbiAgICAgICAgcGF0dGVybiA9IEBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGUoQG9jY3VycmVuY2VUeXBlKVxuICAgICAgICBAb2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybihwYXR0ZXJuLCB7cmVzZXQ6IHRydWUsIEBvY2N1cnJlbmNlVHlwZX0pXG4gICAgICAgIEBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2soPT4gQG9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSlcblxuICAjIHJldHVybiB0cnVlL2ZhbHNlIHRvIGluZGljYXRlIHN1Y2Nlc3NcbiAgc2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbklmTmVjZXNzYXJ5OiAtPlxuICAgIGlmIEBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uIGFuZFxuICAgICAgICBAZ2V0Q29uZmlnKCdhdXRvU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbk9uT3BlcmF0ZScpIGFuZFxuICAgICAgICBub3QgQHBlcnNpc3RlbnRTZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiAgICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLnNlbGVjdCgpXG4gICAgICBAZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgICBzd3JhcC5zYXZlUHJvcGVydGllcyhAZWRpdG9yKVxuXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGU6IChvY2N1cnJlbmNlVHlwZSkgLT5cbiAgICBzd2l0Y2ggb2NjdXJyZW5jZVR5cGVcbiAgICAgIHdoZW4gJ2Jhc2UnXG4gICAgICAgIGdldFdvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBAZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIHdoZW4gJ3N1YndvcmQnXG4gICAgICAgIGdldFN1YndvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBAZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcblxuICAjIHRhcmdldCBpcyBUZXh0T2JqZWN0IG9yIE1vdGlvbiB0byBvcGVyYXRlIG9uLlxuICBzZXRUYXJnZXQ6IChAdGFyZ2V0KSAtPlxuICAgIEB0YXJnZXQuc2V0T3BlcmF0b3IodGhpcylcbiAgICBAZW1pdERpZFNldFRhcmdldCh0aGlzKVxuXG4gICAgaWYgQGNhbkVhcmx5U2VsZWN0KClcbiAgICAgIEBub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKVxuICAgICAgQGNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQoJ3VuZG8nKVxuICAgICAgQHNlbGVjdFRhcmdldCgpXG4gICAgdGhpc1xuXG4gIHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBzZXRUZXh0VG9SZWdpc3RlcihzZWxlY3Rpb24uZ2V0VGV4dCgpLCBzZWxlY3Rpb24pXG5cbiAgc2V0VGV4dFRvUmVnaXN0ZXI6ICh0ZXh0LCBzZWxlY3Rpb24pIC0+XG4gICAgdGV4dCArPSBcIlxcblwiIGlmIChAdGFyZ2V0LmlzTGluZXdpc2UoKSBhbmQgKG5vdCB0ZXh0LmVuZHNXaXRoKCdcXG4nKSkpXG4gICAgQHZpbVN0YXRlLnJlZ2lzdGVyLnNldCh7dGV4dCwgc2VsZWN0aW9ufSkgaWYgdGV4dFxuXG4gIG5vcm1hbGl6ZVNlbGVjdGlvbnNJZk5lY2Vzc2FyeTogLT5cbiAgICBpZiBAdGFyZ2V0Py5pc01vdGlvbigpIGFuZCBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLm5vcm1hbGl6ZVNlbGVjdGlvbnMoKVxuXG4gIHN0YXJ0TXV0YXRpb246IChmbikgLT5cbiAgICBpZiBAY2FuRWFybHlTZWxlY3QoKVxuICAgICAgIyAtIFNraXAgc2VsZWN0aW9uIG5vcm1hbGl6YXRpb246IGFscmVhZHkgbm9ybWFsaXplZCBiZWZvcmUgQHNlbGVjdFRhcmdldCgpXG4gICAgICAjIC0gTWFudWFsIGNoZWNrcG9pbnQgZ3JvdXBpbmc6IHRvIGNyZWF0ZSBjaGVja3BvaW50IGJlZm9yZSBAc2VsZWN0VGFyZ2V0KClcbiAgICAgIGZuKClcbiAgICAgIEBlbWl0V2lsbEZpbmlzaE11dGF0aW9uKClcbiAgICAgIEBncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQoJ3VuZG8nKVxuXG4gICAgZWxzZVxuICAgICAgQG5vcm1hbGl6ZVNlbGVjdGlvbnNJZk5lY2Vzc2FyeSgpXG4gICAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIGZuKClcbiAgICAgICAgQGVtaXRXaWxsRmluaXNoTXV0YXRpb24oKVxuXG4gICAgQGVtaXREaWRGaW5pc2hNdXRhdGlvbigpXG5cbiAgIyBNYWluXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHN0YXJ0TXV0YXRpb24gPT5cbiAgICAgIGlmIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgICBpZiBAbXV0YXRlU2VsZWN0aW9uT3JkZXJkXG4gICAgICAgICAgc2VsZWN0aW9ucyA9IEBlZGl0b3IuZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNlbGVjdGlvbnMgPSBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNcbiAgICAgICAgICBAbXV0YXRlU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgICAgQHJlc3RvcmVDdXJzb3JQb3NpdGlvbnNJZk5lY2Vzc2FyeSgpXG5cbiAgICAjIEV2ZW4gdGhvdWdoIHdlIGZhaWwgdG8gc2VsZWN0IHRhcmdldCBhbmQgZmFpbCB0byBtdXRhdGUsXG4gICAgIyB3ZSBoYXZlIHRvIHJldHVybiB0byBub3JtYWwtbW9kZSBmcm9tIG9wZXJhdG9yLXBlbmRpbmcgb3IgdmlzdWFsXG4gICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJylcblxuICAjIFJldHVybiB0cnVlIHVubGVzcyBhbGwgc2VsZWN0aW9uIGlzIGVtcHR5LlxuICBzZWxlY3RUYXJnZXQ6IC0+XG4gICAgcmV0dXJuIEB0YXJnZXRTZWxlY3RlZCBpZiBAdGFyZ2V0U2VsZWN0ZWQ/XG4gICAgQG11dGF0aW9uTWFuYWdlci5pbml0KHVzZU1hcmtlcjogQG5lZWRTdGF5KCkgYW5kIEBzdGF5QnlNYXJrZXIpXG5cbiAgICAjIEN1cnJlbnRseSBvbmx5IG1vdGlvbiBoYXZlIGZvcmNlV2lzZSBtZXRob2RzXG4gICAgQHRhcmdldC5mb3JjZVdpc2U/KEB3aXNlKSBpZiBAd2lzZT9cbiAgICBAZW1pdFdpbGxTZWxlY3RUYXJnZXQoKVxuXG4gICAgIyBBbGxvdyBjdXJzb3IgcG9zaXRpb24gYWRqdXN0bWVudCAnb24td2lsbC1zZWxlY3QtdGFyZ2V0JyBob29rLlxuICAgICMgc28gY2hlY2twb2ludCBjb21lcyBBRlRFUiBAZW1pdFdpbGxTZWxlY3RUYXJnZXQoKVxuICAgIEBtdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludCgnd2lsbC1zZWxlY3QnKVxuXG4gICAgIyBOT1RFXG4gICAgIyBTaW5jZSBNb3ZlVG9OZXh0T2NjdXJyZW5jZSwgTW92ZVRvUHJldmlvdXNPY2N1cnJlbmNlIG1vdGlvbiBtb3ZlIGJ5XG4gICAgIyAgb2NjdXJyZW5jZS1tYXJrZXIsIG9jY3VycmVuY2UtbWFya2VyIGhhcyB0byBiZSBjcmVhdGVkIEJFRk9SRSBgQHRhcmdldC5leGVjdXRlKClgXG4gICAgIyBBbmQgd2hlbiByZXBlYXRlZCwgb2NjdXJyZW5jZSBwYXR0ZXJuIGlzIGFscmVhZHkgY2FjaGVkIGF0IEBwYXR0ZXJuRm9yT2NjdXJyZW5jZVxuICAgIGlmIEBpc1JlcGVhdGVkKCkgYW5kIEBpc09jY3VycmVuY2UoKSBhbmQgbm90IEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcbiAgICAgIEBvY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKEBwYXR0ZXJuRm9yT2NjdXJyZW5jZSwge0BvY2N1cnJlbmNlVHlwZX0pXG5cbiAgICBAdGFyZ2V0LmV4ZWN1dGUoKVxuXG4gICAgQG11dGF0aW9uTWFuYWdlci5zZXRDaGVja3BvaW50KCdkaWQtc2VsZWN0JylcbiAgICBpZiBAaXNPY2N1cnJlbmNlKClcbiAgICAgICMgVG8gcmVwb2VhdChgLmApIG9wZXJhdGlvbiB3aGVyZSBtdWx0aXBsZSBvY2N1cnJlbmNlIHBhdHRlcm5zIHdhcyBzZXQuXG4gICAgICAjIEhlcmUgd2Ugc2F2ZSBwYXR0ZXJucyB3aGljaCByZXByZXNlbnQgdW5pb25lZCByZWdleCB3aGljaCBAb2NjdXJyZW5jZU1hbmFnZXIga25vd3MuXG4gICAgICBAcGF0dGVybkZvck9jY3VycmVuY2UgPz0gQG9jY3VycmVuY2VNYW5hZ2VyLmJ1aWxkUGF0dGVybigpXG5cbiAgICAgIGlmIEBvY2N1cnJlbmNlTWFuYWdlci5zZWxlY3QoKVxuICAgICAgICAjIFRvIHNraXAgcmVzdG9yZWluZyBwb3NpdGlvbiBmcm9tIHNlbGVjdGlvbiBwcm9wIHdoZW4gc2hpZnQgdmlzdWFsLW1vZGUgc3VibW9kZSBvbiBTZWxlY3RPY2N1cnJlbmNlXG4gICAgICAgIHN3cmFwLmNsZWFyUHJvcGVydGllcyhAZWRpdG9yKVxuXG4gICAgICAgIEBvY2N1cnJlbmNlU2VsZWN0ZWQgPSB0cnVlXG4gICAgICAgIEBtdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludCgnZGlkLXNlbGVjdC1vY2N1cnJlbmNlJylcblxuICAgIGlmIGhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb24oQGVkaXRvcikgb3IgQHRhcmdldC5nZXROYW1lKCkgaXMgXCJFbXB0eVwiXG4gICAgICBAZW1pdERpZFNlbGVjdFRhcmdldCgpXG4gICAgICBAZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgICBAdHJhY2tDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgICBAdGFyZ2V0U2VsZWN0ZWQgPSB0cnVlXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgQGVtaXREaWRGYWlsU2VsZWN0VGFyZ2V0KClcbiAgICAgIEB0YXJnZXRTZWxlY3RlZCA9IGZhbHNlXG4gICAgICBmYWxzZVxuXG4gIHJlc3RvcmVDdXJzb3JQb3NpdGlvbnNJZk5lY2Vzc2FyeTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEByZXN0b3JlUG9zaXRpb25zXG4gICAgb3B0aW9ucyA9XG4gICAgICBzdGF5OiBAbmVlZFN0YXlPblJlc3RvcmUoKVxuICAgICAgb2NjdXJyZW5jZVNlbGVjdGVkOiBAb2NjdXJyZW5jZVNlbGVjdGVkXG4gICAgICBpc0Jsb2Nrd2lzZTogQHRhcmdldD8uaXNCbG9ja3dpc2U/KClcblxuICAgIEBtdXRhdGlvbk1hbmFnZXIucmVzdG9yZUN1cnNvclBvc2l0aW9ucyhvcHRpb25zKVxuICAgIEBlbWl0RGlkUmVzdG9yZUN1cnNvclBvc2l0aW9ucygpXG5cbiMgU2VsZWN0XG4jIFdoZW4gdGV4dC1vYmplY3QgaXMgaW52b2tlZCBmcm9tIG5vcm1hbCBvciB2aXVzYWwtbW9kZSwgb3BlcmF0aW9uIHdvdWxkIGJlXG4jICA9PiBTZWxlY3Qgb3BlcmF0b3Igd2l0aCB0YXJnZXQ9dGV4dC1vYmplY3RcbiMgV2hlbiBtb3Rpb24gaXMgaW52b2tlZCBmcm9tIHZpc3VhbC1tb2RlLCBvcGVyYXRpb24gd291bGQgYmVcbiMgID0+IFNlbGVjdCBvcGVyYXRvciB3aXRoIHRhcmdldD1tb3Rpb24pXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTZWxlY3QgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKGZhbHNlKVxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgcmVjb3JkYWJsZTogZmFsc2VcbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogZmFsc2VcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbjogZmFsc2VcblxuICBleGVjdXRlOiAtPlxuICAgIEBzdGFydE11dGF0aW9uKEBzZWxlY3RUYXJnZXQuYmluZCh0aGlzKSlcbiAgICBpZiBAdGFyZ2V0LmlzVGV4dE9iamVjdCgpIGFuZCB3aXNlID0gQHRhcmdldC5nZXRXaXNlKClcbiAgICAgIEBhY3RpdmF0ZU1vZGVJZk5lY2Vzc2FyeSgndmlzdWFsJywgd2lzZSlcblxuY2xhc3MgU2VsZWN0TGF0ZXN0Q2hhbmdlIGV4dGVuZHMgU2VsZWN0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU2VsZWN0IGxhdGVzdCB5YW5rZWQgb3IgY2hhbmdlZCByYW5nZVwiXG4gIHRhcmdldDogJ0FMYXRlc3RDaGFuZ2UnXG5cbmNsYXNzIFNlbGVjdFByZXZpb3VzU2VsZWN0aW9uIGV4dGVuZHMgU2VsZWN0XG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiUHJldmlvdXNTZWxlY3Rpb25cIlxuXG5jbGFzcyBTZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgU2VsZWN0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU2VsZWN0IHBlcnNpc3RlbnQtc2VsZWN0aW9uIGFuZCBjbGVhciBhbGwgcGVyc2lzdGVudC1zZWxlY3Rpb24sIGl0J3MgbGlrZSBjb252ZXJ0IHRvIHJlYWwtc2VsZWN0aW9uXCJcbiAgdGFyZ2V0OiBcIkFQZXJzaXN0ZW50U2VsZWN0aW9uXCJcblxuY2xhc3MgU2VsZWN0T2NjdXJyZW5jZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiQWRkIHNlbGVjdGlvbiBvbnRvIGVhY2ggbWF0Y2hpbmcgd29yZCB3aXRoaW4gdGFyZ2V0IHJhbmdlXCJcbiAgb2NjdXJyZW5jZTogdHJ1ZVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHN0YXJ0TXV0YXRpb24gPT5cbiAgICAgIGlmIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgICBzdWJtb2RlID0gc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoQGVkaXRvcilcbiAgICAgICAgQGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCd2aXN1YWwnLCBzdWJtb2RlKVxuXG4jIFBlcnNpc3RlbnQgU2VsZWN0aW9uXG4jID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIENyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG4gIHN0YXlBdFNhbWVQb3NpdGlvbjogdHJ1ZVxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlOiBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uOiBmYWxzZVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHJlc3RvcmVQb3NpdGlvbnMgPSBub3QgQGlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgc3VwZXJcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgQHBlcnNpc3RlbnRTZWxlY3Rpb24ubWFya0J1ZmZlclJhbmdlKHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpKVxuXG5jbGFzcyBUb2dnbGVQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgQ3JlYXRlUGVyc2lzdGVudFNlbGVjdGlvblxuICBAZXh0ZW5kKClcblxuICBpc0NvbXBsZXRlOiAtPlxuICAgIHBvaW50ID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgQG1hcmtlclRvUmVtb3ZlID0gQHBlcnNpc3RlbnRTZWxlY3Rpb24uZ2V0TWFya2VyQXRQb2ludChwb2ludClcbiAgICBpZiBAbWFya2VyVG9SZW1vdmVcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBzdXBlclxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQG1hcmtlclRvUmVtb3ZlXG4gICAgICBAbWFya2VyVG9SZW1vdmUuZGVzdHJveSgpXG4gICAgZWxzZVxuICAgICAgc3VwZXJcblxuIyBQcmVzZXQgT2NjdXJyZW5jZVxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBUb2dnbGVQcmVzZXRPY2N1cnJlbmNlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICByZXF1aXJlVGFyZ2V0OiBmYWxzZVxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlOiBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uOiBmYWxzZVxuICBvY2N1cnJlbmNlVHlwZTogJ2Jhc2UnXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBpZiBtYXJrZXIgPSBAb2NjdXJyZW5jZU1hbmFnZXIuZ2V0TWFya2VyQXRQb2ludChAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBAb2NjdXJyZW5jZU1hbmFnZXIuZGVzdHJveU1hcmtlcnMoW21hcmtlcl0pXG4gICAgZWxzZVxuICAgICAgcGF0dGVybiA9IG51bGxcbiAgICAgIGlzTmFycm93ZWQgPSBAdmltU3RhdGUubW9kZU1hbmFnZXIuaXNOYXJyb3dlZCgpXG5cbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpIGFuZCBub3QgaXNOYXJyb3dlZFxuICAgICAgICBAb2NjdXJyZW5jZVR5cGUgPSAnYmFzZSdcbiAgICAgICAgcGF0dGVybiA9IG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAoQGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKSksICdnJylcbiAgICAgIGVsc2VcbiAgICAgICAgcGF0dGVybiA9IEBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGUoQG9jY3VycmVuY2VUeXBlKVxuXG4gICAgICBAb2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybihwYXR0ZXJuLCB7QG9jY3VycmVuY2VUeXBlfSlcbiAgICAgIEBvY2N1cnJlbmNlTWFuYWdlci5zYXZlTGFzdFBhdHRlcm4oQG9jY3VycmVuY2VUeXBlKVxuXG4gICAgICBAYWN0aXZhdGVNb2RlKCdub3JtYWwnKSB1bmxlc3MgaXNOYXJyb3dlZFxuXG5jbGFzcyBUb2dnbGVQcmVzZXRTdWJ3b3JkT2NjdXJyZW5jZSBleHRlbmRzIFRvZ2dsZVByZXNldE9jY3VycmVuY2VcbiAgQGV4dGVuZCgpXG4gIG9jY3VycmVuY2VUeXBlOiAnc3Vid29yZCdcblxuIyBXYW50IHRvIHJlbmFtZSBSZXN0b3JlT2NjdXJyZW5jZU1hcmtlclxuY2xhc3MgQWRkUHJlc2V0T2NjdXJyZW5jZUZyb21MYXN0T2NjdXJyZW5jZVBhdHRlcm4gZXh0ZW5kcyBUb2dnbGVQcmVzZXRPY2N1cnJlbmNlXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIEBvY2N1cnJlbmNlTWFuYWdlci5yZXNldFBhdHRlcm5zKClcbiAgICBpZiBwYXR0ZXJuID0gQHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldCgnbGFzdE9jY3VycmVuY2VQYXR0ZXJuJylcbiAgICAgIG9jY3VycmVuY2VUeXBlID0gQHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldChcImxhc3RPY2N1cnJlbmNlVHlwZVwiKVxuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4ocGF0dGVybiwge29jY3VycmVuY2VUeXBlfSlcbiAgICAgIEBhY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG5cbiMgRGVsZXRlXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEZWxldGUgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgdHJhY2tDaGFuZ2U6IHRydWVcbiAgZmxhc2hDaGVja3BvaW50OiAnZGlkLXNlbGVjdC1vY2N1cnJlbmNlJ1xuICBmbGFzaFR5cGVGb3JPY2N1cnJlbmNlOiAnb3BlcmF0b3ItcmVtb3ZlLW9jY3VycmVuY2UnXG4gIHN0YXlPcHRpb25OYW1lOiAnc3RheU9uRGVsZXRlJ1xuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG9uRGlkU2VsZWN0VGFyZ2V0ID0+XG4gICAgICByZXR1cm4gaWYgQG9jY3VycmVuY2VTZWxlY3RlZFxuICAgICAgaWYgQHRhcmdldC5pc0xpbmV3aXNlKClcbiAgICAgICAgQG9uRGlkUmVzdG9yZUN1cnNvclBvc2l0aW9ucyA9PlxuICAgICAgICAgIEBhZGp1c3RDdXJzb3IoY3Vyc29yKSBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgc3VwZXJcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pID0+XG4gICAgQHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBzZWxlY3Rpb24uZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICBhZGp1c3RDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgIGlmIEBuZWVkU3RheU9uUmVzdG9yZSgpXG4gICAgICBwb2ludCA9IEBtdXRhdGlvbk1hbmFnZXIuZ2V0SW5pdGlhbFBvaW50Rm9yU2VsZWN0aW9uKGN1cnNvci5zZWxlY3Rpb24pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3JvdywgcG9pbnQuY29sdW1uXSlcbiAgICBlbHNlXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cocm93KSlcblxuY2xhc3MgRGVsZXRlUmlnaHQgZXh0ZW5kcyBEZWxldGVcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogJ01vdmVSaWdodCdcblxuY2xhc3MgRGVsZXRlTGVmdCBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZUxlZnQnXG5cbmNsYXNzIERlbGV0ZVRvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnLCAnYmxvY2t3aXNlJylcbiAgICAgICMgRklYTUUgTWF5YmUgYmVjYXVzZSBvZiBidWcgb2YgQ3VycmVudFNlbGVjdGlvbixcbiAgICAgICMgd2UgdXNlIE1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgYXMgdGFyZ2V0XG4gICAgICBAYWNjZXB0Q3VycmVudFNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICBzd3JhcC5zZXRSZXZlcnNlZFN0YXRlKEBlZGl0b3IsIGZhbHNlKSAjIEVuc3VyZSBhbGwgc2VsZWN0aW9ucyB0byB1bi1yZXZlcnNlZFxuICAgIHN1cGVyXG5cbmNsYXNzIERlbGV0ZUxpbmUgZXh0ZW5kcyBEZWxldGVcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgdGFyZ2V0OiBcIk1vdmVUb1JlbGF0aXZlTGluZVwiXG5cbiMgWWFua1xuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBZYW5rIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIHRyYWNrQ2hhbmdlOiB0cnVlXG4gIHN0YXlPcHRpb25OYW1lOiAnc3RheU9uWWFuaydcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgQHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcblxuY2xhc3MgWWFua0xpbmUgZXh0ZW5kcyBZYW5rXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIHRhcmdldDogXCJNb3ZlVG9SZWxhdGl2ZUxpbmVcIlxuXG5jbGFzcyBZYW5rVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgWWFua1xuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtjdHJsLWFdXG5jbGFzcyBJbmNyZWFzZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiSW5uZXJDdXJyZW50TGluZVwiICMgY3RybC1hIGluIG5vcm1hbC1tb2RlIGZpbmQgdGFyZ2V0IG51bWJlciBpbiBDdXJyZW50TGluZVxuICBmbGFzaFRhcmdldDogZmFsc2UgIyBkbyBtYW51YWxseVxuICByZXN0b3JlUG9zaXRpb25zOiBmYWxzZSAjIGRvIG1hbnVhbGx5XG4gIHN0ZXA6IDFcblxuICBleGVjdXRlOiAtPlxuICAgIEBuZXdSYW5nZXMgPSBbXVxuICAgIHN1cGVyXG4gICAgaWYgQG5ld1Jhbmdlcy5sZW5ndGhcbiAgICAgIGlmIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlJykgYW5kIChAZ2V0TmFtZSgpIG5vdCBpbiBAZ2V0Q29uZmlnKCdmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdCcpKVxuICAgICAgICBAdmltU3RhdGUuZmxhc2goQG5ld1JhbmdlcywgdHlwZTogQGZsYXNoVHlwZUZvck9jY3VycmVuY2UpXG5cbiAgcmVwbGFjZU51bWJlckluQnVmZmVyUmFuZ2U6IChzY2FuUmFuZ2UsIGZuPW51bGwpIC0+XG4gICAgbmV3UmFuZ2VzID0gW11cbiAgICBAcGF0dGVybiA/PSAvLy8je0BnZXRDb25maWcoJ251bWJlclJlZ2V4Jyl9Ly8vZ1xuICAgIEBzY2FuRm9yd2FyZCBAcGF0dGVybiwge3NjYW5SYW5nZX0sIChldmVudCkgPT5cbiAgICAgIHJldHVybiBpZiBmbj8gYW5kIG5vdCBmbihldmVudClcbiAgICAgIHttYXRjaFRleHQsIHJlcGxhY2V9ID0gZXZlbnRcbiAgICAgIG5leHROdW1iZXIgPSBAZ2V0TmV4dE51bWJlcihtYXRjaFRleHQpXG4gICAgICBuZXdSYW5nZXMucHVzaChyZXBsYWNlKFN0cmluZyhuZXh0TnVtYmVyKSkpXG4gICAgbmV3UmFuZ2VzXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHNjYW5SYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgaWYgQGluc3RhbmNlb2YoJ0luY3JlbWVudE51bWJlcicpIG9yIEB0YXJnZXQuaXMoJ0N1cnJlbnRTZWxlY3Rpb24nKVxuICAgICAgQG5ld1Jhbmdlcy5wdXNoKEByZXBsYWNlTnVtYmVySW5CdWZmZXJSYW5nZShzY2FuUmFuZ2UpLi4uKVxuICAgICAgc2VsZWN0aW9uLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihzY2FuUmFuZ2Uuc3RhcnQpXG4gICAgZWxzZVxuICAgICAgIyBjdHJsLWEsIGN0cmwteCBpbiBgbm9ybWFsLW1vZGVgXG4gICAgICBpbml0aWFsUG9pbnQgPSBAbXV0YXRpb25NYW5hZ2VyLmdldEluaXRpYWxQb2ludEZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICBuZXdSYW5nZXMgPSBAcmVwbGFjZU51bWJlckluQnVmZmVyUmFuZ2Ugc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4oaW5pdGlhbFBvaW50KVxuICAgICAgICAgIHN0b3AoKVxuICAgICAgICAgIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZhbHNlXG5cbiAgICAgIHBvaW50ID0gbmV3UmFuZ2VzWzBdPy5lbmQudHJhbnNsYXRlKFswLCAtMV0pID8gaW5pdGlhbFBvaW50XG4gICAgICBzZWxlY3Rpb24uY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIGdldE5leHROdW1iZXI6IChudW1iZXJTdHJpbmcpIC0+XG4gICAgTnVtYmVyLnBhcnNlSW50KG51bWJlclN0cmluZywgMTApICsgQHN0ZXAgKiBAZ2V0Q291bnQoKVxuXG4jIFtjdHJsLXhdXG5jbGFzcyBEZWNyZWFzZSBleHRlbmRzIEluY3JlYXNlXG4gIEBleHRlbmQoKVxuICBzdGVwOiAtMVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgW2cgY3RybC1hXVxuY2xhc3MgSW5jcmVtZW50TnVtYmVyIGV4dGVuZHMgSW5jcmVhc2VcbiAgQGV4dGVuZCgpXG4gIGJhc2VOdW1iZXI6IG51bGxcbiAgdGFyZ2V0OiBudWxsXG4gIG11dGF0ZVNlbGVjdGlvbk9yZGVyZDogdHJ1ZVxuXG4gIGdldE5leHROdW1iZXI6IChudW1iZXJTdHJpbmcpIC0+XG4gICAgaWYgQGJhc2VOdW1iZXI/XG4gICAgICBAYmFzZU51bWJlciArPSBAc3RlcCAqIEBnZXRDb3VudCgpXG4gICAgZWxzZVxuICAgICAgQGJhc2VOdW1iZXIgPSBOdW1iZXIucGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMClcbiAgICBAYmFzZU51bWJlclxuXG4jIFtnIGN0cmwteF1cbmNsYXNzIERlY3JlbWVudE51bWJlciBleHRlbmRzIEluY3JlbWVudE51bWJlclxuICBAZXh0ZW5kKClcbiAgc3RlcDogLTFcblxuIyBQdXRcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDdXJzb3IgcGxhY2VtZW50OlxuIyAtIHBsYWNlIGF0IGVuZCBvZiBtdXRhdGlvbjogcGFzdGUgbm9uLW11bHRpbGluZSBjaGFyYWN0ZXJ3aXNlIHRleHRcbiMgLSBwbGFjZSBhdCBzdGFydCBvZiBtdXRhdGlvbjogbm9uLW11bHRpbGluZSBjaGFyYWN0ZXJ3aXNlIHRleHQoY2hhcmFjdGVyd2lzZSwgbGluZXdpc2UpXG5jbGFzcyBQdXRCZWZvcmUgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgbG9jYXRpb246ICdiZWZvcmUnXG4gIHRhcmdldDogJ0VtcHR5J1xuICBmbGFzaFR5cGU6ICdvcGVyYXRvci1sb25nJ1xuICByZXN0b3JlUG9zaXRpb25zOiBmYWxzZSAjIG1hbmFnZSBtYW51YWxseVxuICBmbGFzaFRhcmdldDogdHJ1ZSAjIG1hbmFnZSBtYW51YWxseVxuICB0cmFja0NoYW5nZTogZmFsc2UgIyBtYW5hZ2UgbWFudWFsbHlcblxuICBleGVjdXRlOiAtPlxuICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbiA9IG5ldyBNYXAoKVxuICAgIHt0ZXh0LCB0eXBlfSA9IEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXQobnVsbCwgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpXG4gICAgcmV0dXJuIHVubGVzcyB0ZXh0XG4gICAgQG9uRGlkRmluaXNoTXV0YXRpb24oQGFkanVzdEN1cnNvclBvc2l0aW9uLmJpbmQodGhpcykpXG5cbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgICMgVHJhY2tDaGFuZ2VcbiAgICAgIGlmIG5ld1JhbmdlID0gQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSlcbiAgICAgICAgQHNldE1hcmtGb3JDaGFuZ2UobmV3UmFuZ2UpXG5cbiAgICAgICMgRmxhc2hcbiAgICAgIGlmIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlJykgYW5kIChAZ2V0TmFtZSgpIG5vdCBpbiBAZ2V0Q29uZmlnKCdmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdCcpKVxuICAgICAgICB0b1JhbmdlID0gKHNlbGVjdGlvbikgPT4gQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICAgIEB2aW1TdGF0ZS5mbGFzaChAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5tYXAodG9SYW5nZSksIHR5cGU6IEBnZXRGbGFzaFR5cGUoKSlcblxuICAgIHN1cGVyXG5cbiAgYWRqdXN0Q3Vyc29yUG9zaXRpb246IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICAgIHtzdGFydCwgZW5kfSA9IG5ld1JhbmdlID0gQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICBpZiBAbGluZXdpc2VQYXN0ZVxuICAgICAgICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93KGN1cnNvciwgc3RhcnQucm93KVxuICAgICAgZWxzZVxuICAgICAgICBpZiBuZXdSYW5nZS5pc1NpbmdsZUxpbmUoKVxuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihlbmQudHJhbnNsYXRlKFswLCAtMV0pKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHN0YXJ0KVxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB7dGV4dCwgdHlwZX0gPSBAdmltU3RhdGUucmVnaXN0ZXIuZ2V0KG51bGwsIHNlbGVjdGlvbilcbiAgICB0ZXh0ID0gXy5tdWx0aXBseVN0cmluZyh0ZXh0LCBAZ2V0Q291bnQoKSlcbiAgICBAbGluZXdpc2VQYXN0ZSA9IHR5cGUgaXMgJ2xpbmV3aXNlJyBvciBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgIG5ld1JhbmdlID0gQHBhc3RlKHNlbGVjdGlvbiwgdGV4dCwge0BsaW5ld2lzZVBhc3RlfSlcbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgbmV3UmFuZ2UpXG5cbiAgcGFzdGU6IChzZWxlY3Rpb24sIHRleHQsIHtsaW5ld2lzZVBhc3RlfSkgLT5cbiAgICBpZiBsaW5ld2lzZVBhc3RlXG4gICAgICBAcGFzdGVMaW5ld2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgZWxzZVxuICAgICAgQHBhc3RlQ2hhcmFjdGVyd2lzZShzZWxlY3Rpb24sIHRleHQpXG5cbiAgcGFzdGVDaGFyYWN0ZXJ3aXNlOiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIHtjdXJzb3J9ID0gc2VsZWN0aW9uXG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKSBhbmQgQGxvY2F0aW9uIGlzICdhZnRlcicgYW5kIG5vdCBpc0VtcHR5Um93KEBlZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJSb3coKSlcbiAgICAgIGN1cnNvci5tb3ZlUmlnaHQoKVxuICAgIHJldHVybiBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuXG4gICMgUmV0dXJuIG5ld1JhbmdlXG4gIHBhc3RlTGluZXdpc2U6IChzZWxlY3Rpb24sIHRleHQpIC0+XG4gICAge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICB0ZXh0ICs9IFwiXFxuXCIgdW5sZXNzIHRleHQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICBuZXdSYW5nZSA9IG51bGxcbiAgICBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBpZiBAbG9jYXRpb24gaXMgJ2JlZm9yZSdcbiAgICAgICAgbmV3UmFuZ2UgPSBpbnNlcnRUZXh0QXRCdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBbY3Vyc29yUm93LCAwXSwgdGV4dClcbiAgICAgICAgc2V0QnVmZmVyUm93KGN1cnNvciwgbmV3UmFuZ2Uuc3RhcnQucm93KVxuICAgICAgZWxzZSBpZiBAbG9jYXRpb24gaXMgJ2FmdGVyJ1xuICAgICAgICBlbnN1cmVFbmRzV2l0aE5ld0xpbmVGb3JCdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yUm93KVxuICAgICAgICBuZXdSYW5nZSA9IGluc2VydFRleHRBdEJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IsIFtjdXJzb3JSb3cgKyAxLCAwXSwgdGV4dClcbiAgICBlbHNlXG4gICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChcIlxcblwiKSB1bmxlc3MgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICAgIG5ld1JhbmdlID0gc2VsZWN0aW9uLmluc2VydFRleHQodGV4dClcblxuICAgIHJldHVybiBuZXdSYW5nZVxuXG5jbGFzcyBQdXRBZnRlciBleHRlbmRzIFB1dEJlZm9yZVxuICBAZXh0ZW5kKClcbiAgbG9jYXRpb246ICdhZnRlcidcblxuY2xhc3MgQWRkQmxhbmtMaW5lQmVsb3cgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG4gIHRhcmdldDogXCJFbXB0eVwiXG4gIHN0YXlBdFNhbWVQb3NpdGlvbjogdHJ1ZVxuICBzdGF5QnlNYXJrZXI6IHRydWVcbiAgd2hlcmU6ICdiZWxvdydcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgcm93ID0gc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpLnJvd1xuICAgIHJvdyArPSAxIGlmIEB3aGVyZSBpcyAnYmVsb3cnXG4gICAgcG9pbnQgPSBbcm93LCAwXVxuICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW3BvaW50LCBwb2ludF0sIFwiXFxuXCIucmVwZWF0KEBnZXRDb3VudCgpKSlcblxuY2xhc3MgQWRkQmxhbmtMaW5lQWJvdmUgZXh0ZW5kcyBBZGRCbGFua0xpbmVCZWxvd1xuICBAZXh0ZW5kKClcbiAgd2hlcmU6ICdhYm92ZSdcbiJdfQ==
