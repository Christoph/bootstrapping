(function() {
  var Base, CompositeDisposable, Delegato, Input, OperationAbortedError, _, getEditorState, getFirstCharacterPositionForBufferRow, getVimEofBufferPosition, getVimLastBufferRow, getVimLastScreenRow, getWordBufferRangeAndKindAtBufferPosition, ref, scanEditorInDirection, selectList, swrap, vimStateMethods,
    slice = [].slice,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  Delegato = require('delegato');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('./utils'), getVimEofBufferPosition = ref.getVimEofBufferPosition, getVimLastBufferRow = ref.getVimLastBufferRow, getVimLastScreenRow = ref.getVimLastScreenRow, getWordBufferRangeAndKindAtBufferPosition = ref.getWordBufferRangeAndKindAtBufferPosition, getFirstCharacterPositionForBufferRow = ref.getFirstCharacterPositionForBufferRow, scanEditorInDirection = ref.scanEditorInDirection;

  swrap = require('./selection-wrapper');

  Input = require('./input');

  selectList = null;

  getEditorState = null;

  OperationAbortedError = require('./errors').OperationAbortedError;

  vimStateMethods = ["onDidChangeSearch", "onDidConfirmSearch", "onDidCancelSearch", "onDidCommandSearch", "onDidSetTarget", "emitDidSetTarget", "onWillSelectTarget", "emitWillSelectTarget", "onDidSelectTarget", "emitDidSelectTarget", "onDidFailSelectTarget", "emitDidFailSelectTarget", "onDidRestoreCursorPositions", "emitDidRestoreCursorPositions", "onWillFinishMutation", "emitWillFinishMutation", "onDidFinishMutation", "emitDidFinishMutation", "onDidFinishOperation", "onDidResetOperationStack", "onDidSetOperatorModifier", "onWillActivateMode", "onDidActivateMode", "preemptWillDeactivateMode", "onWillDeactivateMode", "onDidDeactivateMode", "onDidCancelSelectList", "subscribe", "isMode", "getBlockwiseSelections", "getLastBlockwiseSelection", "addToClassList", "getConfig"];

  Base = (function() {
    var registries;

    Delegato.includeInto(Base);

    Base.delegatesMethods.apply(Base, slice.call(vimStateMethods).concat([{
      toProperty: 'vimState'
    }]));

    function Base(vimState1, properties) {
      var ref1;
      this.vimState = vimState1;
      if (properties == null) {
        properties = null;
      }
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement, this.globalState = ref1.globalState;
      if (properties != null) {
        _.extend(this, properties);
      }
    }

    Base.prototype.initialize = function() {};

    Base.prototype.isComplete = function() {
      var ref1;
      if (this.isRequireInput() && !this.hasInput()) {
        return false;
      } else if (this.isRequireTarget()) {
        return (ref1 = this.getTarget()) != null ? typeof ref1.isComplete === "function" ? ref1.isComplete() : void 0 : void 0;
      } else {
        return true;
      }
    };

    Base.prototype.target = null;

    Base.prototype.hasTarget = function() {
      return this.target != null;
    };

    Base.prototype.getTarget = function() {
      return this.target;
    };

    Base.prototype.requireTarget = false;

    Base.prototype.isRequireTarget = function() {
      return this.requireTarget;
    };

    Base.prototype.requireInput = false;

    Base.prototype.isRequireInput = function() {
      return this.requireInput;
    };

    Base.prototype.recordable = false;

    Base.prototype.isRecordable = function() {
      return this.recordable;
    };

    Base.prototype.repeated = false;

    Base.prototype.isRepeated = function() {
      return this.repeated;
    };

    Base.prototype.setRepeated = function() {
      return this.repeated = true;
    };

    Base.prototype.operator = null;

    Base.prototype.getOperator = function() {
      return this.operator;
    };

    Base.prototype.setOperator = function(operator) {
      this.operator = operator;
      return this.operator;
    };

    Base.prototype.isAsTargetExceptSelect = function() {
      return (this.operator != null) && !this.operator["instanceof"]('Select');
    };

    Base.prototype.abort = function() {
      throw new OperationAbortedError('aborted');
    };

    Base.prototype.count = null;

    Base.prototype.defaultCount = 1;

    Base.prototype.getCount = function(offset) {
      var ref1;
      if (offset == null) {
        offset = 0;
      }
      if (this.count == null) {
        this.count = (ref1 = this.vimState.getCount()) != null ? ref1 : this.defaultCount;
      }
      return this.count + offset;
    };

    Base.prototype.resetCount = function() {
      return this.count = null;
    };

    Base.prototype.isDefaultCount = function() {
      return this.count === this.defaultCount;
    };

    Base.prototype.countTimes = function(last, fn) {
      var count, i, isFinal, ref1, results, stop, stopped;
      if (last < 1) {
        return;
      }
      stopped = false;
      stop = function() {
        return stopped = true;
      };
      results = [];
      for (count = i = 1, ref1 = last; 1 <= ref1 ? i <= ref1 : i >= ref1; count = 1 <= ref1 ? ++i : --i) {
        isFinal = count === last;
        fn({
          count: count,
          isFinal: isFinal,
          stop: stop
        });
        if (stopped) {
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Base.prototype.activateMode = function(mode, submode) {
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.vimState.activate(mode, submode);
        };
      })(this));
    };

    Base.prototype.activateModeIfNecessary = function(mode, submode) {
      if (!this.vimState.isMode(mode, submode)) {
        return this.activateMode(mode, submode);
      }
    };

    Base.prototype["new"] = function(name, properties) {
      var klass;
      klass = Base.getClass(name);
      return new klass(this.vimState, properties);
    };

    Base.prototype.newInputUI = function() {
      return new Input(this.vimState);
    };

    Base.prototype.clone = function(vimState) {
      var excludeProperties, key, klass, properties, ref1, value;
      properties = {};
      excludeProperties = ['editor', 'editorElement', 'globalState', 'vimState', 'operator'];
      ref1 = this;
      for (key in ref1) {
        if (!hasProp.call(ref1, key)) continue;
        value = ref1[key];
        if (indexOf.call(excludeProperties, key) < 0) {
          properties[key] = value;
        }
      }
      klass = this.constructor;
      return new klass(vimState, properties);
    };

    Base.prototype.cancelOperation = function() {
      return this.vimState.operationStack.cancel();
    };

    Base.prototype.processOperation = function() {
      return this.vimState.operationStack.process();
    };

    Base.prototype.focusSelectList = function(options) {
      if (options == null) {
        options = {};
      }
      this.onDidCancelSelectList((function(_this) {
        return function() {
          return _this.cancelOperation();
        };
      })(this));
      if (selectList == null) {
        selectList = require('./select-list');
      }
      return selectList.show(this.vimState, options);
    };

    Base.prototype.input = null;

    Base.prototype.hasInput = function() {
      return this.input != null;
    };

    Base.prototype.getInput = function() {
      return this.input;
    };

    Base.prototype.focusInput = function(charsMax) {
      var inputUI;
      inputUI = this.newInputUI();
      inputUI.onDidConfirm((function(_this) {
        return function(input1) {
          _this.input = input1;
          return _this.processOperation();
        };
      })(this));
      if (charsMax > 1) {
        inputUI.onDidChange((function(_this) {
          return function(input) {
            return _this.vimState.hover.set(input);
          };
        })(this));
      }
      inputUI.onDidCancel(this.cancelOperation.bind(this));
      return inputUI.focus(charsMax);
    };

    Base.prototype.getVimEofBufferPosition = function() {
      return getVimEofBufferPosition(this.editor);
    };

    Base.prototype.getVimLastBufferRow = function() {
      return getVimLastBufferRow(this.editor);
    };

    Base.prototype.getVimLastScreenRow = function() {
      return getVimLastScreenRow(this.editor);
    };

    Base.prototype.getWordBufferRangeAndKindAtBufferPosition = function(point, options) {
      return getWordBufferRangeAndKindAtBufferPosition(this.editor, point, options);
    };

    Base.prototype.getFirstCharacterPositionForBufferRow = function(row) {
      return getFirstCharacterPositionForBufferRow(this.editor, row);
    };

    Base.prototype.scanForward = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return scanEditorInDirection.apply(null, [this.editor, 'forward'].concat(slice.call(args)));
    };

    Base.prototype.scanBackward = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return scanEditorInDirection.apply(null, [this.editor, 'backward'].concat(slice.call(args)));
    };

    Base.prototype["instanceof"] = function(klassName) {
      return this instanceof Base.getClass(klassName);
    };

    Base.prototype.is = function(klassName) {
      return this.constructor === Base.getClass(klassName);
    };

    Base.prototype.isOperator = function() {
      return this["instanceof"]('Operator');
    };

    Base.prototype.isMotion = function() {
      return this["instanceof"]('Motion');
    };

    Base.prototype.isTextObject = function() {
      return this["instanceof"]('TextObject');
    };

    Base.prototype.canBecomeTarget = function() {
      return this.isMotion() || this.isTextObject();
    };

    Base.prototype.getName = function() {
      return this.constructor.name;
    };

    Base.prototype.getCursorBufferPosition = function() {
      if (this.isMode('visual')) {
        return this.getCursorPositionForSelection(this.editor.getLastSelection());
      } else {
        return this.editor.getCursorBufferPosition();
      }
    };

    Base.prototype.getCursorBufferPositions = function() {
      if (this.isMode('visual')) {
        return this.editor.getSelections().map(this.getCursorPositionForSelection.bind(this));
      } else {
        return this.editor.getCursorBufferPositions();
      }
    };

    Base.prototype.getBufferPositionForCursor = function(cursor) {
      if (this.isMode('visual')) {
        return this.getCursorPositionForSelection(cursor.selection);
      } else {
        return cursor.getBufferPosition();
      }
    };

    Base.prototype.getCursorPositionForSelection = function(selection) {
      var options;
      options = {
        fromProperty: true,
        allowFallback: true
      };
      return swrap(selection).getBufferPositionFor('head', options);
    };

    Base.prototype.toString = function() {
      var str;
      str = this.getName();
      if (this.hasTarget()) {
        str += ", target=" + (this.getTarget().toString());
      }
      return str;
    };

    Base.init = function(service) {
      var __, klass, ref1;
      getEditorState = service.getEditorState;
      this.subscriptions = new CompositeDisposable();
      ['./operator', './operator-insert', './operator-transform-string', './motion', './motion-search', './text-object', './insert-mode', './misc-command'].forEach(require);
      ref1 = this.getRegistries();
      for (__ in ref1) {
        klass = ref1[__];
        if (klass.isCommand()) {
          this.subscriptions.add(klass.registerCommand());
        }
      }
      return this.subscriptions;
    };

    Base.reset = function() {
      var __, klass, ref1, results;
      this.subscriptions.dispose();
      this.subscriptions = new CompositeDisposable();
      ref1 = this.getRegistries();
      results = [];
      for (__ in ref1) {
        klass = ref1[__];
        if (klass.isCommand()) {
          results.push(this.subscriptions.add(klass.registerCommand()));
        }
      }
      return results;
    };

    registries = {
      Base: Base
    };

    Base.extend = function(command) {
      this.command = command != null ? command : true;
      if ((this.name in registries) && (!this.suppressWarning)) {
        console.warn("Duplicate constructor " + this.name);
      }
      return registries[this.name] = this;
    };

    Base.getClass = function(name) {
      var klass;
      if ((klass = registries[name]) != null) {
        return klass;
      } else {
        throw new Error("class '" + name + "' not found");
      }
    };

    Base.getRegistries = function() {
      return registries;
    };

    Base.isCommand = function() {
      return this.command;
    };

    Base.commandPrefix = 'vim-mode-plus';

    Base.getCommandName = function() {
      return this.commandPrefix + ':' + _.dasherize(this.name);
    };

    Base.getCommandNameWithoutPrefix = function() {
      return _.dasherize(this.name);
    };

    Base.commandScope = 'atom-text-editor';

    Base.getCommandScope = function() {
      return this.commandScope;
    };

    Base.getDesctiption = function() {
      if (this.hasOwnProperty("description")) {
        return this.description;
      } else {
        return null;
      }
    };

    Base.registerCommand = function() {
      var klass;
      klass = this;
      return atom.commands.add(this.getCommandScope(), this.getCommandName(), function(event) {
        var ref1, vimState;
        vimState = (ref1 = getEditorState(this.getModel())) != null ? ref1 : getEditorState(atom.workspace.getActiveTextEditor());
        if (vimState != null) {
          vimState._event = event;
          vimState.operationStack.run(klass);
        }
        return event.stopPropagation();
      });
    };

    return Base;

  })();

  module.exports = Base;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvYmFzZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHlTQUFBO0lBQUE7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7RUFDVixzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BT0ksT0FBQSxDQUFRLFNBQVIsQ0FQSixFQUNFLHFEQURGLEVBRUUsNkNBRkYsRUFHRSw2Q0FIRixFQUlFLHlGQUpGLEVBS0UsaUZBTEYsRUFNRTs7RUFFRixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixVQUFBLEdBQWE7O0VBQ2IsY0FBQSxHQUFpQjs7RUFDaEIsd0JBQXlCLE9BQUEsQ0FBUSxVQUFSOztFQUUxQixlQUFBLEdBQWtCLENBQ2hCLG1CQURnQixFQUVoQixvQkFGZ0IsRUFHaEIsbUJBSGdCLEVBSWhCLG9CQUpnQixFQU9oQixnQkFQZ0IsRUFRaEIsa0JBUmdCLEVBU1osb0JBVFksRUFVWixzQkFWWSxFQVdaLG1CQVhZLEVBWVoscUJBWlksRUFjWix1QkFkWSxFQWVaLHlCQWZZLEVBaUJaLDZCQWpCWSxFQWtCWiwrQkFsQlksRUFtQmQsc0JBbkJjLEVBb0JkLHdCQXBCYyxFQXFCZCxxQkFyQmMsRUFzQmQsdUJBdEJjLEVBdUJoQixzQkF2QmdCLEVBd0JoQiwwQkF4QmdCLEVBMEJoQiwwQkExQmdCLEVBNEJoQixvQkE1QmdCLEVBNkJoQixtQkE3QmdCLEVBOEJoQiwyQkE5QmdCLEVBK0JoQixzQkEvQmdCLEVBZ0NoQixxQkFoQ2dCLEVBa0NoQix1QkFsQ2dCLEVBbUNoQixXQW5DZ0IsRUFvQ2hCLFFBcENnQixFQXFDaEIsd0JBckNnQixFQXNDaEIsMkJBdENn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QUFBLGNBQUQsQ0FBZ0IsYUFBaEIsQ0FBSDtlQUNFLElBQUMsQ0FBQSxZQURIO09BQUEsTUFBQTtlQUdFLEtBSEY7O0lBRGU7O0lBTWpCLElBQUMsQ0FBQSxlQUFELEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQUFBLEtBQUEsR0FBUTthQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsZUFBRCxDQUFBLENBQWxCLEVBQXNDLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBdEMsRUFBeUQsU0FBQyxLQUFEO0FBQ3ZELFlBQUE7UUFBQSxRQUFBLDZEQUF5QyxjQUFBLENBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQWY7UUFDekMsSUFBRyxnQkFBSDtVQUNFLFFBQVEsQ0FBQyxNQUFULEdBQWtCO1VBQ2xCLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBeEIsQ0FBNEIsS0FBNUIsRUFGRjs7ZUFHQSxLQUFLLENBQUMsZUFBTixDQUFBO01BTHVELENBQXpEO0lBRmdCOzs7Ozs7RUFTcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF6VWpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbkRlbGVnYXRvID0gcmVxdWlyZSAnZGVsZWdhdG8nXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xue1xuICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvblxuICBnZXRWaW1MYXN0QnVmZmVyUm93XG4gIGdldFZpbUxhc3RTY3JlZW5Sb3dcbiAgZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb25cbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvd1xuICBzY2FuRWRpdG9ySW5EaXJlY3Rpb25cbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuSW5wdXQgPSByZXF1aXJlICcuL2lucHV0J1xuc2VsZWN0TGlzdCA9IG51bGxcbmdldEVkaXRvclN0YXRlID0gbnVsbCAjIHNldCBieSBCYXNlLmluaXQoKVxue09wZXJhdGlvbkFib3J0ZWRFcnJvcn0gPSByZXF1aXJlICcuL2Vycm9ycydcblxudmltU3RhdGVNZXRob2RzID0gW1xuICBcIm9uRGlkQ2hhbmdlU2VhcmNoXCJcbiAgXCJvbkRpZENvbmZpcm1TZWFyY2hcIlxuICBcIm9uRGlkQ2FuY2VsU2VhcmNoXCJcbiAgXCJvbkRpZENvbW1hbmRTZWFyY2hcIlxuXG4gICMgTGlmZSBjeWNsZVxuICBcIm9uRGlkU2V0VGFyZ2V0XCJcbiAgXCJlbWl0RGlkU2V0VGFyZ2V0XCJcbiAgICAgIFwib25XaWxsU2VsZWN0VGFyZ2V0XCJcbiAgICAgIFwiZW1pdFdpbGxTZWxlY3RUYXJnZXRcIlxuICAgICAgXCJvbkRpZFNlbGVjdFRhcmdldFwiXG4gICAgICBcImVtaXREaWRTZWxlY3RUYXJnZXRcIlxuXG4gICAgICBcIm9uRGlkRmFpbFNlbGVjdFRhcmdldFwiXG4gICAgICBcImVtaXREaWRGYWlsU2VsZWN0VGFyZ2V0XCJcblxuICAgICAgXCJvbkRpZFJlc3RvcmVDdXJzb3JQb3NpdGlvbnNcIlxuICAgICAgXCJlbWl0RGlkUmVzdG9yZUN1cnNvclBvc2l0aW9uc1wiXG4gICAgXCJvbldpbGxGaW5pc2hNdXRhdGlvblwiXG4gICAgXCJlbWl0V2lsbEZpbmlzaE11dGF0aW9uXCJcbiAgICBcIm9uRGlkRmluaXNoTXV0YXRpb25cIlxuICAgIFwiZW1pdERpZEZpbmlzaE11dGF0aW9uXCJcbiAgXCJvbkRpZEZpbmlzaE9wZXJhdGlvblwiXG4gIFwib25EaWRSZXNldE9wZXJhdGlvblN0YWNrXCJcblxuICBcIm9uRGlkU2V0T3BlcmF0b3JNb2RpZmllclwiXG5cbiAgXCJvbldpbGxBY3RpdmF0ZU1vZGVcIlxuICBcIm9uRGlkQWN0aXZhdGVNb2RlXCJcbiAgXCJwcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlXCJcbiAgXCJvbldpbGxEZWFjdGl2YXRlTW9kZVwiXG4gIFwib25EaWREZWFjdGl2YXRlTW9kZVwiXG5cbiAgXCJvbkRpZENhbmNlbFNlbGVjdExpc3RcIlxuICBcInN1YnNjcmliZVwiXG4gIFwiaXNNb2RlXCJcbiAgXCJnZXRCbG9ja3dpc2VTZWxlY3Rpb25zXCJcbiAgXCJnZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uXCJcbiAgXCJhZGRUb0NsYXNzTGlzdFwiXG4gIFwiZ2V0Q29uZmlnXCJcbl1cblxuY2xhc3MgQmFzZVxuICBEZWxlZ2F0by5pbmNsdWRlSW50byh0aGlzKVxuICBAZGVsZWdhdGVzTWV0aG9kcyh2aW1TdGF0ZU1ldGhvZHMuLi4sIHRvUHJvcGVydHk6ICd2aW1TdGF0ZScpXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUsIHByb3BlcnRpZXM9bnVsbCkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBnbG9iYWxTdGF0ZX0gPSBAdmltU3RhdGVcbiAgICBfLmV4dGVuZCh0aGlzLCBwcm9wZXJ0aWVzKSBpZiBwcm9wZXJ0aWVzP1xuXG4gICMgVG8gb3ZlcnJpZGVcbiAgaW5pdGlhbGl6ZTogLT5cblxuICAjIE9wZXJhdGlvbiBwcm9jZXNzb3IgZXhlY3V0ZSBvbmx5IHdoZW4gaXNDb21wbGV0ZSgpIHJldHVybiB0cnVlLlxuICAjIElmIGZhbHNlLCBvcGVyYXRpb24gcHJvY2Vzc29yIHBvc3Rwb25lIGl0cyBleGVjdXRpb24uXG4gIGlzQ29tcGxldGU6IC0+XG4gICAgaWYgQGlzUmVxdWlyZUlucHV0KCkgYW5kIG5vdCBAaGFzSW5wdXQoKVxuICAgICAgZmFsc2VcbiAgICBlbHNlIGlmIEBpc1JlcXVpcmVUYXJnZXQoKVxuICAgICAgIyBXaGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGluIEJhc2U6OmNvbnN0cnVjdG9yXG4gICAgICAjIHRhZ2VydCBpcyBzdGlsbCBzdHJpbmcgbGlrZSBgTW92ZVRvUmlnaHRgLCBpbiB0aGlzIGNhc2UgaXNDb21wbGV0ZVxuICAgICAgIyBpcyBub3QgYXZhaWxhYmxlLlxuICAgICAgQGdldFRhcmdldCgpPy5pc0NvbXBsZXRlPygpXG4gICAgZWxzZVxuICAgICAgdHJ1ZVxuXG4gIHRhcmdldDogbnVsbFxuICBoYXNUYXJnZXQ6IC0+IEB0YXJnZXQ/XG4gIGdldFRhcmdldDogLT4gQHRhcmdldFxuXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIGlzUmVxdWlyZVRhcmdldDogLT4gQHJlcXVpcmVUYXJnZXRcblxuICByZXF1aXJlSW5wdXQ6IGZhbHNlXG4gIGlzUmVxdWlyZUlucHV0OiAtPiBAcmVxdWlyZUlucHV0XG5cbiAgcmVjb3JkYWJsZTogZmFsc2VcbiAgaXNSZWNvcmRhYmxlOiAtPiBAcmVjb3JkYWJsZVxuXG4gIHJlcGVhdGVkOiBmYWxzZVxuICBpc1JlcGVhdGVkOiAtPiBAcmVwZWF0ZWRcbiAgc2V0UmVwZWF0ZWQ6IC0+IEByZXBlYXRlZCA9IHRydWVcblxuICAjIEludGVuZGVkIHRvIGJlIHVzZWQgYnkgVGV4dE9iamVjdCBvciBNb3Rpb25cbiAgb3BlcmF0b3I6IG51bGxcbiAgZ2V0T3BlcmF0b3I6IC0+IEBvcGVyYXRvclxuICBzZXRPcGVyYXRvcjogKEBvcGVyYXRvcikgLT4gQG9wZXJhdG9yXG4gIGlzQXNUYXJnZXRFeGNlcHRTZWxlY3Q6IC0+XG4gICAgQG9wZXJhdG9yPyBhbmQgbm90IEBvcGVyYXRvci5pbnN0YW5jZW9mKCdTZWxlY3QnKVxuXG4gIGFib3J0OiAtPlxuICAgIHRocm93IG5ldyBPcGVyYXRpb25BYm9ydGVkRXJyb3IoJ2Fib3J0ZWQnKVxuXG4gICMgQ291bnRcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvdW50OiBudWxsXG4gIGRlZmF1bHRDb3VudDogMVxuICBnZXRDb3VudDogKG9mZnNldD0wKSAtPlxuICAgIEBjb3VudCA/PSBAdmltU3RhdGUuZ2V0Q291bnQoKSA/IEBkZWZhdWx0Q291bnRcbiAgICBAY291bnQgKyBvZmZzZXRcblxuICByZXNldENvdW50OiAtPlxuICAgIEBjb3VudCA9IG51bGxcblxuICBpc0RlZmF1bHRDb3VudDogLT5cbiAgICBAY291bnQgaXMgQGRlZmF1bHRDb3VudFxuXG4gICMgTWlzY1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY291bnRUaW1lczogKGxhc3QsIGZuKSAtPlxuICAgIHJldHVybiBpZiBsYXN0IDwgMVxuXG4gICAgc3RvcHBlZCA9IGZhbHNlXG4gICAgc3RvcCA9IC0+IHN0b3BwZWQgPSB0cnVlXG4gICAgZm9yIGNvdW50IGluIFsxLi5sYXN0XVxuICAgICAgaXNGaW5hbCA9IGNvdW50IGlzIGxhc3RcbiAgICAgIGZuKHtjb3VudCwgaXNGaW5hbCwgc3RvcH0pXG4gICAgICBicmVhayBpZiBzdG9wcGVkXG5cbiAgYWN0aXZhdGVNb2RlOiAobW9kZSwgc3VibW9kZSkgLT5cbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZShtb2RlLCBzdWJtb2RlKVxuXG4gIGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5OiAobW9kZSwgc3VibW9kZSkgLT5cbiAgICB1bmxlc3MgQHZpbVN0YXRlLmlzTW9kZShtb2RlLCBzdWJtb2RlKVxuICAgICAgQGFjdGl2YXRlTW9kZShtb2RlLCBzdWJtb2RlKVxuXG4gIG5ldzogKG5hbWUsIHByb3BlcnRpZXMpIC0+XG4gICAga2xhc3MgPSBCYXNlLmdldENsYXNzKG5hbWUpXG4gICAgbmV3IGtsYXNzKEB2aW1TdGF0ZSwgcHJvcGVydGllcylcblxuICBuZXdJbnB1dFVJOiAtPlxuICAgIG5ldyBJbnB1dChAdmltU3RhdGUpXG5cbiAgIyBGSVhNRTogVGhpcyBpcyB1c2VkIHRvIGNsb25lIE1vdGlvbjo6U2VhcmNoIHRvIHN1cHBvcnQgYG5gIGFuZCBgTmBcbiAgIyBCdXQgbWFudWFsIHJlc2V0aW5nIGFuZCBvdmVycmlkaW5nIHByb3BlcnR5IGlzIGJ1ZyBwcm9uZS5cbiAgIyBTaG91bGQgZXh0cmFjdCBhcyBzZWFyY2ggc3BlYyBvYmplY3QgYW5kIHVzZSBpdCBieVxuICAjIGNyZWF0aW5nIGNsZWFuIGluc3RhbmNlIG9mIFNlYXJjaC5cbiAgY2xvbmU6ICh2aW1TdGF0ZSkgLT5cbiAgICBwcm9wZXJ0aWVzID0ge31cbiAgICBleGNsdWRlUHJvcGVydGllcyA9IFsnZWRpdG9yJywgJ2VkaXRvckVsZW1lbnQnLCAnZ2xvYmFsU3RhdGUnLCAndmltU3RhdGUnLCAnb3BlcmF0b3InXVxuICAgIGZvciBvd24ga2V5LCB2YWx1ZSBvZiB0aGlzIHdoZW4ga2V5IG5vdCBpbiBleGNsdWRlUHJvcGVydGllc1xuICAgICAgcHJvcGVydGllc1trZXldID0gdmFsdWVcbiAgICBrbGFzcyA9IHRoaXMuY29uc3RydWN0b3JcbiAgICBuZXcga2xhc3ModmltU3RhdGUsIHByb3BlcnRpZXMpXG5cbiAgY2FuY2VsT3BlcmF0aW9uOiAtPlxuICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5jYW5jZWwoKVxuXG4gIHByb2Nlc3NPcGVyYXRpb246IC0+XG4gICAgQHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnByb2Nlc3MoKVxuXG4gIGZvY3VzU2VsZWN0TGlzdDogKG9wdGlvbnM9e30pIC0+XG4gICAgQG9uRGlkQ2FuY2VsU2VsZWN0TGlzdCA9PlxuICAgICAgQGNhbmNlbE9wZXJhdGlvbigpXG4gICAgc2VsZWN0TGlzdCA/PSByZXF1aXJlICcuL3NlbGVjdC1saXN0J1xuICAgIHNlbGVjdExpc3Quc2hvdyhAdmltU3RhdGUsIG9wdGlvbnMpXG5cbiAgaW5wdXQ6IG51bGxcbiAgaGFzSW5wdXQ6IC0+IEBpbnB1dD9cbiAgZ2V0SW5wdXQ6IC0+IEBpbnB1dFxuXG4gIGZvY3VzSW5wdXQ6IChjaGFyc01heCkgLT5cbiAgICBpbnB1dFVJID0gQG5ld0lucHV0VUkoKVxuICAgIGlucHV0VUkub25EaWRDb25maXJtIChAaW5wdXQpID0+XG4gICAgICBAcHJvY2Vzc09wZXJhdGlvbigpXG5cbiAgICBpZiBjaGFyc01heCA+IDFcbiAgICAgIGlucHV0VUkub25EaWRDaGFuZ2UgKGlucHV0KSA9PlxuICAgICAgICBAdmltU3RhdGUuaG92ZXIuc2V0KGlucHV0KVxuXG4gICAgaW5wdXRVSS5vbkRpZENhbmNlbChAY2FuY2VsT3BlcmF0aW9uLmJpbmQodGhpcykpXG4gICAgaW5wdXRVSS5mb2N1cyhjaGFyc01heClcblxuICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbihAZWRpdG9yKVxuXG4gIGdldFZpbUxhc3RCdWZmZXJSb3c6IC0+XG4gICAgZ2V0VmltTGFzdEJ1ZmZlclJvdyhAZWRpdG9yKVxuXG4gIGdldFZpbUxhc3RTY3JlZW5Sb3c6IC0+XG4gICAgZ2V0VmltTGFzdFNjcmVlblJvdyhAZWRpdG9yKVxuXG4gIGdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uOiAocG9pbnQsIG9wdGlvbnMpIC0+XG4gICAgZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24oQGVkaXRvciwgcG9pbnQsIG9wdGlvbnMpXG5cbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdzogKHJvdykgLT5cbiAgICBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KEBlZGl0b3IsIHJvdylcblxuICBzY2FuRm9yd2FyZDogKGFyZ3MuLi4pIC0+XG4gICAgc2NhbkVkaXRvckluRGlyZWN0aW9uKEBlZGl0b3IsICdmb3J3YXJkJywgYXJncy4uLilcblxuICBzY2FuQmFja3dhcmQ6IChhcmdzLi4uKSAtPlxuICAgIHNjYW5FZGl0b3JJbkRpcmVjdGlvbihAZWRpdG9yLCAnYmFja3dhcmQnLCBhcmdzLi4uKVxuXG4gIGluc3RhbmNlb2Y6IChrbGFzc05hbWUpIC0+XG4gICAgdGhpcyBpbnN0YW5jZW9mIEJhc2UuZ2V0Q2xhc3Moa2xhc3NOYW1lKVxuXG4gIGlzOiAoa2xhc3NOYW1lKSAtPlxuICAgIHRoaXMuY29uc3RydWN0b3IgaXMgQmFzZS5nZXRDbGFzcyhrbGFzc05hbWUpXG5cbiAgaXNPcGVyYXRvcjogLT5cbiAgICBAaW5zdGFuY2VvZignT3BlcmF0b3InKVxuXG4gIGlzTW90aW9uOiAtPlxuICAgIEBpbnN0YW5jZW9mKCdNb3Rpb24nKVxuXG4gIGlzVGV4dE9iamVjdDogLT5cbiAgICBAaW5zdGFuY2VvZignVGV4dE9iamVjdCcpXG5cbiAgY2FuQmVjb21lVGFyZ2V0OiAtPlxuICAgIEBpc01vdGlvbigpIG9yIEBpc1RleHRPYmplY3QoKVxuXG4gIGdldE5hbWU6IC0+XG4gICAgQGNvbnN0cnVjdG9yLm5hbWVcblxuICBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuXG4gIGdldEN1cnNvckJ1ZmZlclBvc2l0aW9uczogLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkubWFwKEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbi5iaW5kKHRoaXMpKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcblxuICBnZXRCdWZmZXJQb3NpdGlvbkZvckN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKGN1cnNvci5zZWxlY3Rpb24pXG4gICAgZWxzZVxuICAgICAgY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBvcHRpb25zID0ge2Zyb21Qcm9wZXJ0eTogdHJ1ZSwgYWxsb3dGYWxsYmFjazogdHJ1ZX1cbiAgICBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgb3B0aW9ucylcblxuICB0b1N0cmluZzogLT5cbiAgICBzdHIgPSBAZ2V0TmFtZSgpXG4gICAgc3RyICs9IFwiLCB0YXJnZXQ9I3tAZ2V0VGFyZ2V0KCkudG9TdHJpbmcoKX1cIiBpZiBAaGFzVGFyZ2V0KClcbiAgICBzdHJcblxuICAjIENsYXNzIG1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBpbml0OiAoc2VydmljZSkgLT5cbiAgICB7Z2V0RWRpdG9yU3RhdGV9ID0gc2VydmljZVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgW1xuICAgICAgJy4vb3BlcmF0b3InLCAnLi9vcGVyYXRvci1pbnNlcnQnLCAnLi9vcGVyYXRvci10cmFuc2Zvcm0tc3RyaW5nJyxcbiAgICAgICcuL21vdGlvbicsICcuL21vdGlvbi1zZWFyY2gnLFxuICAgICAgJy4vdGV4dC1vYmplY3QnLFxuICAgICAgJy4vaW5zZXJ0LW1vZGUnLCAnLi9taXNjLWNvbW1hbmQnXG4gICAgXS5mb3JFYWNoKHJlcXVpcmUpXG5cbiAgICBmb3IgX18sIGtsYXNzIG9mIEBnZXRSZWdpc3RyaWVzKCkgd2hlbiBrbGFzcy5pc0NvbW1hbmQoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKGtsYXNzLnJlZ2lzdGVyQ29tbWFuZCgpKVxuICAgIEBzdWJzY3JpcHRpb25zXG5cbiAgIyBGb3IgZGV2ZWxvcG1lbnQgZWFzaW5lc3Mgd2l0aG91dCByZWxvYWRpbmcgdmltLW1vZGUtcGx1c1xuICBAcmVzZXQ6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgZm9yIF9fLCBrbGFzcyBvZiBAZ2V0UmVnaXN0cmllcygpIHdoZW4ga2xhc3MuaXNDb21tYW5kKClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZChrbGFzcy5yZWdpc3RlckNvbW1hbmQoKSlcblxuICByZWdpc3RyaWVzID0ge0Jhc2V9XG4gIEBleHRlbmQ6IChAY29tbWFuZD10cnVlKSAtPlxuICAgIGlmIChAbmFtZSBvZiByZWdpc3RyaWVzKSBhbmQgKG5vdCBAc3VwcHJlc3NXYXJuaW5nKVxuICAgICAgY29uc29sZS53YXJuKFwiRHVwbGljYXRlIGNvbnN0cnVjdG9yICN7QG5hbWV9XCIpXG4gICAgcmVnaXN0cmllc1tAbmFtZV0gPSB0aGlzXG5cbiAgQGdldENsYXNzOiAobmFtZSkgLT5cbiAgICBpZiAoa2xhc3MgPSByZWdpc3RyaWVzW25hbWVdKT9cbiAgICAgIGtsYXNzXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2xhc3MgJyN7bmFtZX0nIG5vdCBmb3VuZFwiKVxuXG4gIEBnZXRSZWdpc3RyaWVzOiAtPlxuICAgIHJlZ2lzdHJpZXNcblxuICBAaXNDb21tYW5kOiAtPlxuICAgIEBjb21tYW5kXG5cbiAgQGNvbW1hbmRQcmVmaXg6ICd2aW0tbW9kZS1wbHVzJ1xuICBAZ2V0Q29tbWFuZE5hbWU6IC0+XG4gICAgQGNvbW1hbmRQcmVmaXggKyAnOicgKyBfLmRhc2hlcml6ZShAbmFtZSlcblxuICBAZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4OiAtPlxuICAgIF8uZGFzaGVyaXplKEBuYW1lKVxuXG4gIEBjb21tYW5kU2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yJ1xuICBAZ2V0Q29tbWFuZFNjb3BlOiAtPlxuICAgIEBjb21tYW5kU2NvcGVcblxuICBAZ2V0RGVzY3RpcHRpb246IC0+XG4gICAgaWYgQGhhc093blByb3BlcnR5KFwiZGVzY3JpcHRpb25cIilcbiAgICAgIEBkZXNjcmlwdGlvblxuICAgIGVsc2VcbiAgICAgIG51bGxcblxuICBAcmVnaXN0ZXJDb21tYW5kOiAtPlxuICAgIGtsYXNzID0gdGhpc1xuICAgIGF0b20uY29tbWFuZHMuYWRkIEBnZXRDb21tYW5kU2NvcGUoKSwgQGdldENvbW1hbmROYW1lKCksIChldmVudCkgLT5cbiAgICAgIHZpbVN0YXRlID0gZ2V0RWRpdG9yU3RhdGUoQGdldE1vZGVsKCkpID8gZ2V0RWRpdG9yU3RhdGUoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgaWYgdmltU3RhdGU/ICMgUG9zc2libHkgdW5kZWZpbmVkIFNlZSAjODVcbiAgICAgICAgdmltU3RhdGUuX2V2ZW50ID0gZXZlbnRcbiAgICAgICAgdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKGtsYXNzKVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlXG4iXX0=
