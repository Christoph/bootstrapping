(function() {
  var Base, CompositeDisposable, Disposable, MoveToRelativeLine, OperationAbortedError, OperationStack, Select, moveCursorLeft, ref, ref1, swrap;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  Base = require('./base');

  moveCursorLeft = require('./utils').moveCursorLeft;

  ref1 = {}, Select = ref1.Select, MoveToRelativeLine = ref1.MoveToRelativeLine;

  OperationAbortedError = require('./errors').OperationAbortedError;

  swrap = require('./selection-wrapper');

  OperationStack = (function() {
    Object.defineProperty(OperationStack.prototype, 'mode', {
      get: function() {
        return this.modeManager.mode;
      }
    });

    Object.defineProperty(OperationStack.prototype, 'submode', {
      get: function() {
        return this.modeManager.submode;
      }
    });

    function OperationStack(vimState) {
      var ref2;
      this.vimState = vimState;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement, this.modeManager = ref2.modeManager;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      if (Select == null) {
        Select = Base.getClass('Select');
      }
      if (MoveToRelativeLine == null) {
        MoveToRelativeLine = Base.getClass('MoveToRelativeLine');
      }
      this.reset();
    }

    OperationStack.prototype.subscribe = function(handler) {
      this.operationSubscriptions.add(handler);
      return handler;
    };

    OperationStack.prototype.reset = function() {
      var ref2;
      this.resetCount();
      this.stack = [];
      this.processing = false;
      this.vimState.emitDidResetOperationStack();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return this.operationSubscriptions = new CompositeDisposable;
    };

    OperationStack.prototype.destroy = function() {
      var ref2, ref3;
      this.subscriptions.dispose();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return ref3 = {}, this.stack = ref3.stack, this.operationSubscriptions = ref3.operationSubscriptions, ref3;
    };

    OperationStack.prototype.peekTop = function() {
      return this.stack[this.stack.length - 1];
    };

    OperationStack.prototype.isEmpty = function() {
      return this.stack.length === 0;
    };

    OperationStack.prototype.run = function(klass, properties) {
      var error, operation, ref2, type;
      try {
        if (this.isEmpty()) {
          this.vimState.init();
        }
        type = typeof klass;
        if (type === 'object') {
          operation = klass;
        } else {
          if (type === 'string') {
            klass = Base.getClass(klass);
          }
          if (((ref2 = this.peekTop()) != null ? ref2.constructor : void 0) === klass) {
            operation = new MoveToRelativeLine(this.vimState);
          } else {
            operation = new klass(this.vimState, properties);
          }
        }
        if (operation.isTextObject() && this.mode !== 'operator-pending' || operation.isMotion() && this.mode === 'visual') {
          operation = new Select(this.vimState).setTarget(operation);
        }
        if (this.isEmpty() || (this.peekTop().isOperator() && operation.canBecomeTarget())) {
          this.stack.push(operation);
          return this.process();
        } else {
          this.vimState.emitDidFailToPushToOperationStack();
          return this.vimState.resetNormalMode();
        }
      } catch (error1) {
        error = error1;
        return this.handleError(error);
      }
    };

    OperationStack.prototype.runRecorded = function() {
      var count, operation, ref2;
      if (operation = this.recordedOperation) {
        operation.setRepeated();
        if (this.hasCount()) {
          count = this.getCount();
          operation.count = count;
          if ((ref2 = operation.target) != null) {
            ref2.count = count;
          }
        }
        operation.subscribeResetOccurrencePatternIfNeeded();
        return this.run(operation);
      }
    };

    OperationStack.prototype.runRecordedMotion = function(key, arg) {
      var operation, reverse;
      reverse = (arg != null ? arg : {}).reverse;
      if (!(operation = this.vimState.globalState.get(key))) {
        return;
      }
      operation = operation.clone(this.vimState);
      operation.setRepeated();
      operation.resetCount();
      if (reverse) {
        operation.backwards = !operation.backwards;
      }
      return this.run(operation);
    };

    OperationStack.prototype.runCurrentFind = function(options) {
      return this.runRecordedMotion('currentFind', options);
    };

    OperationStack.prototype.runCurrentSearch = function(options) {
      return this.runRecordedMotion('currentSearch', options);
    };

    OperationStack.prototype.handleError = function(error) {
      this.vimState.reset();
      if (!(error instanceof OperationAbortedError)) {
        throw error;
      }
    };

    OperationStack.prototype.isProcessing = function() {
      return this.processing;
    };

    OperationStack.prototype.process = function() {
      var base, commandName, operation, top;
      this.processing = true;
      if (this.stack.length === 2) {
        if (!this.peekTop().isComplete()) {
          return;
        }
        operation = this.stack.pop();
        this.peekTop().setTarget(operation);
      }
      top = this.peekTop();
      if (top.isComplete()) {
        return this.execute(this.stack.pop());
      } else {
        if (this.mode === 'normal' && top.isOperator()) {
          this.modeManager.activate('operator-pending');
        }
        if (commandName = typeof (base = top.constructor).getCommandNameWithoutPrefix === "function" ? base.getCommandNameWithoutPrefix() : void 0) {
          return this.addToClassList(commandName + "-pending");
        }
      }
    };

    OperationStack.prototype.execute = function(operation) {
      var execution;
      if (this.mode === 'visual') {
        this.vimState.updatePreviousSelection();
      }
      execution = operation.execute();
      if (execution instanceof Promise) {
        return execution.then((function(_this) {
          return function() {
            return _this.finish(operation);
          };
        })(this))["catch"]((function(_this) {
          return function() {
            return _this.handleError();
          };
        })(this));
      } else {
        return this.finish(operation);
      }
    };

    OperationStack.prototype.cancel = function() {
      var ref2;
      if ((ref2 = this.mode) !== 'visual' && ref2 !== 'insert') {
        this.vimState.resetNormalMode();
        this.vimState.restoreOriginalCursorPosition();
      }
      return this.finish();
    };

    OperationStack.prototype.finish = function(operation) {
      if (operation == null) {
        operation = null;
      }
      if (operation != null ? operation.isRecordable() : void 0) {
        this.recordedOperation = operation;
      }
      this.vimState.emitDidFinishOperation();
      if (operation != null ? operation.isOperator() : void 0) {
        operation.resetState();
      }
      if (this.mode === 'normal') {
        swrap.clearProperties(this.editor);
        this.ensureAllSelectionsAreEmpty(operation);
        this.ensureAllCursorsAreNotAtEndOfLine();
      } else if (this.mode === 'visual') {
        this.modeManager.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.updateCursorsVisibility();
      return this.vimState.reset();
    };

    OperationStack.prototype.ensureAllSelectionsAreEmpty = function(operation) {
      this.vimState.clearBlockwiseSelections();
      if (!this.editor.getLastSelection().isEmpty()) {
        if (this.vimState.getConfig('devThrowErrorOnNonEmptySelectionInNormalMode')) {
          throw new Error("Selection is not empty in normal-mode: " + (operation.toString()));
        } else {
          return this.vimState.clearSelections();
        }
      }
    };

    OperationStack.prototype.ensureAllCursorsAreNotAtEndOfLine = function() {
      var cursor, i, len, ref2, results;
      ref2 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        if (cursor.isAtEndOfLine()) {
          results.push(moveCursorLeft(cursor, {
            preserveGoalColumn: true
          }));
        }
      }
      return results;
    };

    OperationStack.prototype.addToClassList = function(className) {
      this.editorElement.classList.add(className);
      return this.subscribe(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.classList.remove(className);
        };
      })(this)));
    };

    OperationStack.prototype.hasCount = function() {
      return (this.count['normal'] != null) || (this.count['operator-pending'] != null);
    };

    OperationStack.prototype.getCount = function() {
      var ref2, ref3;
      if (this.hasCount()) {
        return ((ref2 = this.count['normal']) != null ? ref2 : 1) * ((ref3 = this.count['operator-pending']) != null ? ref3 : 1);
      } else {
        return null;
      }
    };

    OperationStack.prototype.setCount = function(number) {
      var base, mode;
      mode = 'normal';
      if (this.mode === 'operator-pending') {
        mode = this.mode;
      }
      if ((base = this.count)[mode] == null) {
        base[mode] = 0;
      }
      this.count[mode] = (this.count[mode] * 10) + number;
      this.vimState.hover.set(this.buildCountString());
      return this.vimState.toggleClassList('with-count', true);
    };

    OperationStack.prototype.buildCountString = function() {
      return [this.count['normal'], this.count['operator-pending']].filter(function(count) {
        return count != null;
      }).map(function(count) {
        return String(count);
      }).join('x');
    };

    OperationStack.prototype.resetCount = function() {
      this.count = {};
      return this.vimState.toggleClassList('with-count', false);
    };

    return OperationStack;

  })();

  module.exports = OperationStack;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0aW9uLXN0YWNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLE1BQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUNiLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDTixpQkFBa0IsT0FBQSxDQUFRLFNBQVI7O0VBQ25CLE9BQStCLEVBQS9CLEVBQUMsb0JBQUQsRUFBUzs7RUFDUix3QkFBeUIsT0FBQSxDQUFRLFVBQVI7O0VBQzFCLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBWUY7SUFDSixNQUFNLENBQUMsY0FBUCxDQUFzQixjQUFDLENBQUEsU0FBdkIsRUFBa0MsTUFBbEMsRUFBMEM7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFBaEIsQ0FBTDtLQUExQzs7SUFDQSxNQUFNLENBQUMsY0FBUCxDQUFzQixjQUFDLENBQUEsU0FBdkIsRUFBa0MsU0FBbEMsRUFBNkM7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFBaEIsQ0FBTDtLQUE3Qzs7SUFFYSx3QkFBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osT0FBMEMsSUFBQyxDQUFBLFFBQTNDLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQSxhQUFYLEVBQTBCLElBQUMsQ0FBQSxtQkFBQTtNQUUzQixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUF2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fSA9IHJlcXVpcmUgJ2F0b20nXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xue21vdmVDdXJzb3JMZWZ0fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG57U2VsZWN0LCBNb3ZlVG9SZWxhdGl2ZUxpbmV9ID0ge31cbntPcGVyYXRpb25BYm9ydGVkRXJyb3J9ID0gcmVxdWlyZSAnLi9lcnJvcnMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbiMgb3ByYXRpb24gbGlmZSBpbiBvcGVyYXRpb25TdGFja1xuIyAxLiBydW5cbiMgICAgaW5zdGFudGlhdGVkIGJ5IG5ldy5cbiMgICAgY29tcGxpbWVudCBpbXBsaWNpdCBPcGVyYXRvci5TZWxlY3Qgb3BlcmF0b3IgaWYgbmVjZXNzYXJ5LlxuIyAgICBwdXNoIG9wZXJhdGlvbiB0byBzdGFjay5cbiMgMi4gcHJvY2Vzc1xuIyAgICByZWR1Y2Ugc3RhY2sgYnksIHBvcHBpbmcgdG9wIG9mIHN0YWNrIHRoZW4gc2V0IGl0IGFzIHRhcmdldCBvZiBuZXcgdG9wLlxuIyAgICBjaGVjayBpZiByZW1haW5pbmcgdG9wIG9mIHN0YWNrIGlzIGV4ZWN1dGFibGUgYnkgY2FsbGluZyBpc0NvbXBsZXRlKClcbiMgICAgaWYgZXhlY3V0YWJsZSwgdGhlbiBwb3Agc3RhY2sgdGhlbiBleGVjdXRlKHBvcHBlZE9wZXJhdGlvbilcbiMgICAgaWYgbm90IGV4ZWN1dGFibGUsIGVudGVyIFwib3BlcmF0b3ItcGVuZGluZy1tb2RlXCJcbmNsYXNzIE9wZXJhdGlvblN0YWNrXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBAcHJvdG90eXBlLCAnbW9kZScsIGdldDogLT4gQG1vZGVNYW5hZ2VyLm1vZGVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsICdzdWJtb2RlJywgZ2V0OiAtPiBAbW9kZU1hbmFnZXIuc3VibW9kZVxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQG1vZGVNYW5hZ2VyfSA9IEB2aW1TdGF0ZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgICBTZWxlY3QgPz0gQmFzZS5nZXRDbGFzcygnU2VsZWN0JylcbiAgICBNb3ZlVG9SZWxhdGl2ZUxpbmUgPz0gQmFzZS5nZXRDbGFzcygnTW92ZVRvUmVsYXRpdmVMaW5lJylcblxuICAgIEByZXNldCgpXG5cbiAgIyBSZXR1cm4gaGFuZGxlclxuICBzdWJzY3JpYmU6IChoYW5kbGVyKSAtPlxuICAgIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zLmFkZChoYW5kbGVyKVxuICAgIGhhbmRsZXIgIyBET05UIFJFTU9WRVxuXG4gIHJlc2V0OiAtPlxuICAgIEByZXNldENvdW50KClcbiAgICBAc3RhY2sgPSBbXVxuICAgIEBwcm9jZXNzaW5nID0gZmFsc2VcblxuICAgICMgdGhpcyBoYXMgdG8gYmUgQkVGT1JFIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEB2aW1TdGF0ZS5lbWl0RGlkUmVzZXRPcGVyYXRpb25TdGFjaygpXG5cbiAgICBAb3BlcmF0aW9uU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIHtAc3RhY2ssIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zfSA9IHt9XG5cbiAgcGVla1RvcDogLT5cbiAgICBAc3RhY2tbQHN0YWNrLmxlbmd0aCAtIDFdXG5cbiAgaXNFbXB0eTogLT5cbiAgICBAc3RhY2subGVuZ3RoIGlzIDBcblxuICAjIE1haW5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bjogKGtsYXNzLCBwcm9wZXJ0aWVzKSAtPlxuICAgIHRyeVxuICAgICAgQHZpbVN0YXRlLmluaXQoKSBpZiBAaXNFbXB0eSgpXG4gICAgICB0eXBlID0gdHlwZW9mKGtsYXNzKVxuICAgICAgaWYgdHlwZSBpcyAnb2JqZWN0JyAjIC4gcmVwZWF0IGNhc2Ugd2UgY2FuIGV4ZWN1dGUgYXMtaXQtaXMuXG4gICAgICAgIG9wZXJhdGlvbiA9IGtsYXNzXG4gICAgICBlbHNlXG4gICAgICAgIGtsYXNzID0gQmFzZS5nZXRDbGFzcyhrbGFzcykgaWYgdHlwZSBpcyAnc3RyaW5nJ1xuICAgICAgICAjIFJlcGxhY2Ugb3BlcmF0b3Igd2hlbiBpZGVudGljYWwgb25lIHJlcGVhdGVkLCBlLmcuIGBkZGAsIGBjY2AsIGBnVWdVYFxuICAgICAgICBpZiBAcGVla1RvcCgpPy5jb25zdHJ1Y3RvciBpcyBrbGFzc1xuICAgICAgICAgIG9wZXJhdGlvbiA9IG5ldyBNb3ZlVG9SZWxhdGl2ZUxpbmUoQHZpbVN0YXRlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgb3BlcmF0aW9uID0gbmV3IGtsYXNzKEB2aW1TdGF0ZSwgcHJvcGVydGllcylcblxuICAgICAgIyBDb21wbGltZW50IGltcGxpY2l0IFNlbGVjdCBvcGVyYXRvclxuICAgICAgaWYgb3BlcmF0aW9uLmlzVGV4dE9iamVjdCgpIGFuZCBAbW9kZSBpc250ICdvcGVyYXRvci1wZW5kaW5nJyBvciBvcGVyYXRpb24uaXNNb3Rpb24oKSBhbmQgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgICAgb3BlcmF0aW9uID0gbmV3IFNlbGVjdChAdmltU3RhdGUpLnNldFRhcmdldChvcGVyYXRpb24pXG5cbiAgICAgIGlmIEBpc0VtcHR5KCkgb3IgKEBwZWVrVG9wKCkuaXNPcGVyYXRvcigpIGFuZCBvcGVyYXRpb24uY2FuQmVjb21lVGFyZ2V0KCkpXG4gICAgICAgIEBzdGFjay5wdXNoKG9wZXJhdGlvbilcbiAgICAgICAgQHByb2Nlc3MoKVxuICAgICAgZWxzZVxuICAgICAgICBAdmltU3RhdGUuZW1pdERpZEZhaWxUb1B1c2hUb09wZXJhdGlvblN0YWNrKClcbiAgICAgICAgQHZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBoYW5kbGVFcnJvcihlcnJvcilcblxuICBydW5SZWNvcmRlZDogLT5cbiAgICBpZiBvcGVyYXRpb24gPSBAcmVjb3JkZWRPcGVyYXRpb25cbiAgICAgIG9wZXJhdGlvbi5zZXRSZXBlYXRlZCgpXG4gICAgICBpZiBAaGFzQ291bnQoKVxuICAgICAgICBjb3VudCA9IEBnZXRDb3VudCgpXG4gICAgICAgIG9wZXJhdGlvbi5jb3VudCA9IGNvdW50XG4gICAgICAgIG9wZXJhdGlvbi50YXJnZXQ/LmNvdW50ID0gY291bnQgIyBTb21lIG9wZWFydG9yIGhhdmUgbm8gdGFyZ2V0IGxpa2UgY3RybC1hKGluY3JlYXNlKS5cblxuICAgICAgb3BlcmF0aW9uLnN1YnNjcmliZVJlc2V0T2NjdXJyZW5jZVBhdHRlcm5JZk5lZWRlZCgpXG4gICAgICBAcnVuKG9wZXJhdGlvbilcblxuICBydW5SZWNvcmRlZE1vdGlvbjogKGtleSwge3JldmVyc2V9PXt9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgb3BlcmF0aW9uID0gQHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldChrZXkpXG5cbiAgICBvcGVyYXRpb24gPSBvcGVyYXRpb24uY2xvbmUoQHZpbVN0YXRlKVxuICAgIG9wZXJhdGlvbi5zZXRSZXBlYXRlZCgpXG4gICAgb3BlcmF0aW9uLnJlc2V0Q291bnQoKVxuICAgIGlmIHJldmVyc2VcbiAgICAgIG9wZXJhdGlvbi5iYWNrd2FyZHMgPSBub3Qgb3BlcmF0aW9uLmJhY2t3YXJkc1xuICAgIEBydW4ob3BlcmF0aW9uKVxuXG4gIHJ1bkN1cnJlbnRGaW5kOiAob3B0aW9ucykgLT5cbiAgICBAcnVuUmVjb3JkZWRNb3Rpb24oJ2N1cnJlbnRGaW5kJywgb3B0aW9ucylcblxuICBydW5DdXJyZW50U2VhcmNoOiAob3B0aW9ucykgLT5cbiAgICBAcnVuUmVjb3JkZWRNb3Rpb24oJ2N1cnJlbnRTZWFyY2gnLCBvcHRpb25zKVxuXG4gIGhhbmRsZUVycm9yOiAoZXJyb3IpIC0+XG4gICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICB1bmxlc3MgZXJyb3IgaW5zdGFuY2VvZiBPcGVyYXRpb25BYm9ydGVkRXJyb3JcbiAgICAgIHRocm93IGVycm9yXG5cbiAgaXNQcm9jZXNzaW5nOiAtPlxuICAgIEBwcm9jZXNzaW5nXG5cbiAgcHJvY2VzczogLT5cbiAgICBAcHJvY2Vzc2luZyA9IHRydWVcbiAgICBpZiBAc3RhY2subGVuZ3RoIGlzIDJcbiAgICAgICMgW0ZJWE1FIGlkZWFsbHldXG4gICAgICAjIElmIHRhcmdldCBpcyBub3QgY29tcGxldGUsIHdlIHBvc3Rwb25lIGNvbXBvc2luZyB0YXJnZXQgd2l0aCBvcGVyYXRvciB0byBrZWVwIHNpdHVhdGlvbiBzaW1wbGUuXG4gICAgICAjIFNvIHRoYXQgd2UgY2FuIGFzc3VtZSB3aGVuIHRhcmdldCBpcyBzZXQgdG8gb3BlcmF0b3IgaXQncyBjb21wbGV0ZS5cbiAgICAgICMgZS5nLiBgeSBzIHQgYScoc3Vycm91bmQgZm9yIHJhbmdlIGZyb20gaGVyZSB0byB0aWxsIGEpXG4gICAgICByZXR1cm4gdW5sZXNzIEBwZWVrVG9wKCkuaXNDb21wbGV0ZSgpXG5cbiAgICAgIG9wZXJhdGlvbiA9IEBzdGFjay5wb3AoKVxuICAgICAgQHBlZWtUb3AoKS5zZXRUYXJnZXQob3BlcmF0aW9uKVxuXG4gICAgdG9wID0gQHBlZWtUb3AoKVxuXG4gICAgaWYgdG9wLmlzQ29tcGxldGUoKVxuICAgICAgQGV4ZWN1dGUoQHN0YWNrLnBvcCgpKVxuICAgIGVsc2VcbiAgICAgIGlmIEBtb2RlIGlzICdub3JtYWwnIGFuZCB0b3AuaXNPcGVyYXRvcigpXG4gICAgICAgIEBtb2RlTWFuYWdlci5hY3RpdmF0ZSgnb3BlcmF0b3ItcGVuZGluZycpXG5cbiAgICAgICMgVGVtcG9yYXJ5IHNldCB3aGlsZSBjb21tYW5kIGlzIHJ1bm5pbmdcbiAgICAgIGlmIGNvbW1hbmROYW1lID0gdG9wLmNvbnN0cnVjdG9yLmdldENvbW1hbmROYW1lV2l0aG91dFByZWZpeD8oKVxuICAgICAgICBAYWRkVG9DbGFzc0xpc3QoY29tbWFuZE5hbWUgKyBcIi1wZW5kaW5nXCIpXG5cbiAgZXhlY3V0ZTogKG9wZXJhdGlvbikgLT5cbiAgICBAdmltU3RhdGUudXBkYXRlUHJldmlvdXNTZWxlY3Rpb24oKSBpZiBAbW9kZSBpcyAndmlzdWFsJ1xuICAgIGV4ZWN1dGlvbiA9IG9wZXJhdGlvbi5leGVjdXRlKClcbiAgICBpZiBleGVjdXRpb24gaW5zdGFuY2VvZiBQcm9taXNlXG4gICAgICBleGVjdXRpb25cbiAgICAgICAgLnRoZW4gPT4gQGZpbmlzaChvcGVyYXRpb24pXG4gICAgICAgIC5jYXRjaCA9PiBAaGFuZGxlRXJyb3IoKVxuICAgIGVsc2VcbiAgICAgIEBmaW5pc2gob3BlcmF0aW9uKVxuXG4gIGNhbmNlbDogLT5cbiAgICBpZiBAbW9kZSBub3QgaW4gWyd2aXN1YWwnLCAnaW5zZXJ0J11cbiAgICAgIEB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKVxuICAgICAgQHZpbVN0YXRlLnJlc3RvcmVPcmlnaW5hbEN1cnNvclBvc2l0aW9uKClcbiAgICBAZmluaXNoKClcblxuICBmaW5pc2g6IChvcGVyYXRpb249bnVsbCkgLT5cbiAgICBAcmVjb3JkZWRPcGVyYXRpb24gPSBvcGVyYXRpb24gaWYgb3BlcmF0aW9uPy5pc1JlY29yZGFibGUoKVxuICAgIEB2aW1TdGF0ZS5lbWl0RGlkRmluaXNoT3BlcmF0aW9uKClcbiAgICBpZiBvcGVyYXRpb24/LmlzT3BlcmF0b3IoKVxuICAgICAgb3BlcmF0aW9uLnJlc2V0U3RhdGUoKVxuXG4gICAgaWYgQG1vZGUgaXMgJ25vcm1hbCdcbiAgICAgIHN3cmFwLmNsZWFyUHJvcGVydGllcyhAZWRpdG9yKVxuICAgICAgQGVuc3VyZUFsbFNlbGVjdGlvbnNBcmVFbXB0eShvcGVyYXRpb24pXG4gICAgICBAZW5zdXJlQWxsQ3Vyc29yc0FyZU5vdEF0RW5kT2ZMaW5lKClcbiAgICBlbHNlIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICBAbW9kZU1hbmFnZXIudXBkYXRlTmFycm93ZWRTdGF0ZSgpXG4gICAgICBAdmltU3RhdGUudXBkYXRlUHJldmlvdXNTZWxlY3Rpb24oKVxuICAgIEB2aW1TdGF0ZS51cGRhdGVDdXJzb3JzVmlzaWJpbGl0eSgpXG4gICAgQHZpbVN0YXRlLnJlc2V0KClcblxuICBlbnN1cmVBbGxTZWxlY3Rpb25zQXJlRW1wdHk6IChvcGVyYXRpb24pIC0+XG4gICAgIyBXaGVuIEB2aW1TdGF0ZS5zZWxlY3RCbG9ja3dpc2UoKSBpcyBjYWxsZWQgaW4gbm9uLXZpc3VhbC1tb2RlLlxuICAgICMgZS5nLiBgLmAgcmVwZWF0IG9mIG9wZXJhdGlvbiB0YXJnZXRlZCBibG9ja3dpc2UgYEN1cnJlbnRTZWxlY3Rpb25gLlxuICAgICMgV2UgbmVlZCB0byBtYW51YWxseSBjbGVhciBibG9ja3dpc2VTZWxlY3Rpb24uXG4gICAgIyBTZWUgIzY0N1xuICAgIEB2aW1TdGF0ZS5jbGVhckJsb2Nrd2lzZVNlbGVjdGlvbnMoKVxuXG4gICAgdW5sZXNzIEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLmlzRW1wdHkoKVxuICAgICAgaWYgQHZpbVN0YXRlLmdldENvbmZpZygnZGV2VGhyb3dFcnJvck9uTm9uRW1wdHlTZWxlY3Rpb25Jbk5vcm1hbE1vZGUnKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3Rpb24gaXMgbm90IGVtcHR5IGluIG5vcm1hbC1tb2RlOiAje29wZXJhdGlvbi50b1N0cmluZygpfVwiKVxuICAgICAgZWxzZVxuICAgICAgICBAdmltU3RhdGUuY2xlYXJTZWxlY3Rpb25zKClcblxuICBlbnN1cmVBbGxDdXJzb3JzQXJlTm90QXRFbmRPZkxpbmU6IC0+XG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcbiAgICAgIG1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge3ByZXNlcnZlR29hbENvbHVtbjogdHJ1ZX0pXG5cbiAgYWRkVG9DbGFzc0xpc3Q6IChjbGFzc05hbWUpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpXG4gICAgQHN1YnNjcmliZSBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpXG5cbiAgIyBDb3VudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBrZXlzdHJva2UgYDNkMndgIGRlbGV0ZSA2KDMqMikgd29yZHMuXG4gICMgIDJuZCBudW1iZXIoMiBpbiB0aGlzIGNhc2UpIGlzIGFsd2F5cyBlbnRlcmQgaW4gb3BlcmF0b3ItcGVuZGluZy1tb2RlLlxuICAjICBTbyBjb3VudCBoYXZlIHR3byB0aW1pbmcgdG8gYmUgZW50ZXJlZC4gdGhhdCdzIHdoeSBoZXJlIHdlIG1hbmFnZSBjb3VudGVyIGJ5IG1vZGUuXG4gIGhhc0NvdW50OiAtPlxuICAgIEBjb3VudFsnbm9ybWFsJ10/IG9yIEBjb3VudFsnb3BlcmF0b3ItcGVuZGluZyddP1xuXG4gIGdldENvdW50OiAtPlxuICAgIGlmIEBoYXNDb3VudCgpXG4gICAgICAoQGNvdW50Wydub3JtYWwnXSA/IDEpICogKEBjb3VudFsnb3BlcmF0b3ItcGVuZGluZyddID8gMSlcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgc2V0Q291bnQ6IChudW1iZXIpIC0+XG4gICAgbW9kZSA9ICdub3JtYWwnXG4gICAgbW9kZSA9IEBtb2RlIGlmIEBtb2RlIGlzICdvcGVyYXRvci1wZW5kaW5nJ1xuICAgIEBjb3VudFttb2RlXSA/PSAwXG4gICAgQGNvdW50W21vZGVdID0gKEBjb3VudFttb2RlXSAqIDEwKSArIG51bWJlclxuICAgIEB2aW1TdGF0ZS5ob3Zlci5zZXQoQGJ1aWxkQ291bnRTdHJpbmcoKSlcbiAgICBAdmltU3RhdGUudG9nZ2xlQ2xhc3NMaXN0KCd3aXRoLWNvdW50JywgdHJ1ZSlcblxuICBidWlsZENvdW50U3RyaW5nOiAtPlxuICAgIFtAY291bnRbJ25vcm1hbCddLCBAY291bnRbJ29wZXJhdG9yLXBlbmRpbmcnXV1cbiAgICAgIC5maWx0ZXIgKGNvdW50KSAtPiBjb3VudD9cbiAgICAgIC5tYXAgKGNvdW50KSAtPiBTdHJpbmcoY291bnQpXG4gICAgICAuam9pbigneCcpXG5cbiAgcmVzZXRDb3VudDogLT5cbiAgICBAY291bnQgPSB7fVxuICAgIEB2aW1TdGF0ZS50b2dnbGVDbGFzc0xpc3QoJ3dpdGgtY291bnQnLCBmYWxzZSlcblxubW9kdWxlLmV4cG9ydHMgPSBPcGVyYXRpb25TdGFja1xuIl19
