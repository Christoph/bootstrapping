(function() {
  var Base, CompositeDisposable, Disposable, Emitter, ModeManager, Range, _, moveCursorLeft, ref, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Range = ref.Range, CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Base = require('./base');

  swrap = require('./selection-wrapper');

  moveCursorLeft = require('./utils').moveCursorLeft;

  ModeManager = (function() {
    ModeManager.prototype.mode = 'insert';

    ModeManager.prototype.submode = null;

    ModeManager.prototype.replacedCharsBySelection = null;

    function ModeManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
      this.mode = 'insert';
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
    }

    ModeManager.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    ModeManager.prototype.isMode = function(mode, submodes) {
      var ref1;
      if (submodes != null) {
        return (this.mode === mode) && (ref1 = this.submode, indexOf.call([].concat(submodes), ref1) >= 0);
      } else {
        return this.mode === mode;
      }
    };

    ModeManager.prototype.onWillActivateMode = function(fn) {
      return this.emitter.on('will-activate-mode', fn);
    };

    ModeManager.prototype.onDidActivateMode = function(fn) {
      return this.emitter.on('did-activate-mode', fn);
    };

    ModeManager.prototype.onWillDeactivateMode = function(fn) {
      return this.emitter.on('will-deactivate-mode', fn);
    };

    ModeManager.prototype.preemptWillDeactivateMode = function(fn) {
      return this.emitter.preempt('will-deactivate-mode', fn);
    };

    ModeManager.prototype.onDidDeactivateMode = function(fn) {
      return this.emitter.on('did-deactivate-mode', fn);
    };

    ModeManager.prototype.activate = function(newMode, newSubmode) {
      var ref1, ref2;
      if (newSubmode == null) {
        newSubmode = null;
      }
      if ((newMode === 'visual') && this.editor.isEmpty()) {
        return;
      }
      this.emitter.emit('will-activate-mode', {
        mode: newMode,
        submode: newSubmode
      });
      if ((newMode === 'visual') && (newSubmode === this.submode)) {
        ref1 = ['normal', null], newMode = ref1[0], newSubmode = ref1[1];
      }
      if (newMode !== this.mode) {
        this.deactivate();
      }
      this.deactivator = (function() {
        switch (newMode) {
          case 'normal':
            return this.activateNormalMode();
          case 'operator-pending':
            return this.activateOperatorPendingMode();
          case 'insert':
            return this.activateInsertMode(newSubmode);
          case 'visual':
            return this.activateVisualMode(newSubmode);
        }
      }).call(this);
      this.editorElement.classList.remove(this.mode + "-mode");
      this.editorElement.classList.remove(this.submode);
      ref2 = [newMode, newSubmode], this.mode = ref2[0], this.submode = ref2[1];
      this.editorElement.classList.add(this.mode + "-mode");
      if (this.submode != null) {
        this.editorElement.classList.add(this.submode);
      }
      if (this.mode === 'visual') {
        this.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.statusBarManager.update(this.mode, this.submode);
      this.vimState.updateCursorsVisibility();
      return this.emitter.emit('did-activate-mode', {
        mode: this.mode,
        submode: this.submode
      });
    };

    ModeManager.prototype.deactivate = function() {
      var ref1, ref2;
      if (!((ref1 = this.deactivator) != null ? ref1.disposed : void 0)) {
        this.emitter.emit('will-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
        if ((ref2 = this.deactivator) != null) {
          ref2.dispose();
        }
        this.editorElement.classList.remove(this.mode + "-mode");
        this.editorElement.classList.remove(this.submode);
        return this.emitter.emit('did-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
      }
    };

    ModeManager.prototype.activateNormalMode = function() {
      var ref1;
      this.vimState.reset();
      if ((ref1 = this.editorElement.component) != null) {
        ref1.setInputEnabled(false);
      }
      return new Disposable;
    };

    ModeManager.prototype.activateOperatorPendingMode = function() {
      return new Disposable;
    };

    ModeManager.prototype.activateInsertMode = function(submode) {
      var replaceModeDeactivator;
      if (submode == null) {
        submode = null;
      }
      this.editorElement.component.setInputEnabled(true);
      if (submode === 'replace') {
        replaceModeDeactivator = this.activateReplaceMode();
      }
      return new Disposable((function(_this) {
        return function() {
          var cursor, i, len, needSpecialCareToPreventWrapLine, ref1, ref2, results;
          if (replaceModeDeactivator != null) {
            replaceModeDeactivator.dispose();
          }
          replaceModeDeactivator = null;
          needSpecialCareToPreventWrapLine = (ref1 = atom.config.get('editor.atomicSoftTabs')) != null ? ref1 : true;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            results.push(moveCursorLeft(cursor, {
              needSpecialCareToPreventWrapLine: needSpecialCareToPreventWrapLine
            }));
          }
          return results;
        };
      })(this));
    };

    ModeManager.prototype.activateReplaceMode = function() {
      var subs;
      this.replacedCharsBySelection = {};
      subs = new CompositeDisposable;
      subs.add(this.editor.onWillInsertText((function(_this) {
        return function(arg) {
          var cancel, text;
          text = arg.text, cancel = arg.cancel;
          cancel();
          return _this.editor.getSelections().forEach(function(selection) {
            var base, char, i, len, name, ref1, ref2, results;
            ref2 = (ref1 = text.split('')) != null ? ref1 : [];
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              char = ref2[i];
              if ((char !== "\n") && (!selection.cursor.isAtEndOfLine())) {
                selection.selectRight();
              }
              if ((base = _this.replacedCharsBySelection)[name = selection.id] == null) {
                base[name] = [];
              }
              results.push(_this.replacedCharsBySelection[selection.id].push(swrap(selection).replace(char)));
            }
            return results;
          });
        };
      })(this)));
      subs.add(new Disposable((function(_this) {
        return function() {
          return _this.replacedCharsBySelection = null;
        };
      })(this)));
      return subs;
    };

    ModeManager.prototype.getReplacedCharForSelection = function(selection) {
      var ref1;
      return (ref1 = this.replacedCharsBySelection[selection.id]) != null ? ref1.pop() : void 0;
    };

    ModeManager.prototype.activateVisualMode = function(newSubmode) {
      this.normalizeSelections();
      swrap.applyWise(this.editor, 'characterwise');
      switch (newSubmode) {
        case 'linewise':
          swrap.applyWise(this.editor, 'linewise');
          break;
        case 'blockwise':
          this.vimState.selectBlockwise();
      }
      return new Disposable((function(_this) {
        return function() {
          var i, len, ref1, selection;
          _this.normalizeSelections();
          ref1 = _this.editor.getSelections();
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            selection.clear({
              autoscroll: false
            });
          }
          return _this.updateNarrowedState(false);
        };
      })(this));
    };

    ModeManager.prototype.normalizeSelections = function() {
      var bs, i, len, ref1;
      if (this.submode === 'blockwise') {
        ref1 = this.vimState.getBlockwiseSelections();
        for (i = 0, len = ref1.length; i < len; i++) {
          bs = ref1[i];
          bs.restoreCharacterwise();
        }
        this.vimState.clearBlockwiseSelections();
      }
      return swrap.normalize(this.editor);
    };

    ModeManager.prototype.hasMultiLineSelection = function() {
      var ref1;
      if (this.isMode('visual', 'blockwise')) {
        return !((ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.isSingleRow() : void 0);
      } else {
        return !swrap(this.editor.getLastSelection()).isSingleRow();
      }
    };

    ModeManager.prototype.updateNarrowedState = function(value) {
      if (value == null) {
        value = null;
      }
      return this.editorElement.classList.toggle('is-narrowed', value != null ? value : this.hasMultiLineSelection());
    };

    ModeManager.prototype.isNarrowed = function() {
      return this.editorElement.classList.contains('is-narrowed');
    };

    return ModeManager;

  })();

  module.exports = ModeManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW9kZS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsaUdBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQW9ELE9BQUEsQ0FBUSxNQUFSLENBQXBELEVBQUMscUJBQUQsRUFBVSxpQkFBVixFQUFpQiw2Q0FBakIsRUFBc0M7O0VBQ3RDLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNQLGlCQUFrQixPQUFBLENBQVEsU0FBUjs7RUFFYjswQkFDSixJQUFBLEdBQU07OzBCQUNOLE9BQUEsR0FBUzs7MEJBQ1Qsd0JBQUEsR0FBMEI7O0lBRWIscUJBQUMsUUFBRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsV0FBRDtNQUNaLE9BQTRCLElBQUMsQ0FBQSxRQUE3QixFQUFDLElBQUMsQ0FBQSxjQUFBLE1BQUYsRUFBVSxJQUFDLENBQUEscUJBQUE7TUFDWCxJQUFDLENBQUEsSUFBRCxHQUFRO01BQ1IsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLENBQXVCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBdkIsQ0FBbkI7SUFMVzs7MEJBT2IsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQURPOzswQkFHVCxNQUFBLEdBQVEsU0FBQyxJQUFELEVBQU8sUUFBUDtBQUNOLFVBQUE7TUFBQSxJQUFHLGdCQUFIO2VBQ0UsQ0FBQyxJQUFDLENBQUEsSUFBRCxLQUFTLElBQVYsQ0FBQSxJQUFvQixRQUFDLElBQUMsQ0FBQSxPQUFELEVBQUEsYUFBWSxFQUFFLENBQUMsTUFBSCxDQUFVLFFBQVYsQ0FBWixFQUFBLElBQUEsTUFBRCxFQUR0QjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsSUFBRCxLQUFTLEtBSFg7O0lBRE07OzBCQVFSLGtCQUFBLEdBQW9CLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLG9CQUFaLEVBQWtDLEVBQWxDO0lBQVI7OzBCQUNwQixpQkFBQSxHQUFtQixTQUFDLEVBQUQ7YUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxtQkFBWixFQUFpQyxFQUFqQztJQUFSOzswQkFDbkIsb0JBQUEsR0FBc0IsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksc0JBQVosRUFBb0MsRUFBcEM7SUFBUjs7MEJBQ3RCLHlCQUFBLEdBQTJCLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFpQixzQkFBakIsRUFBeUMsRUFBekM7SUFBUjs7MEJBQzNCLG1CQUFBLEdBQXFCLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLHFCQUFaLEVBQW1DLEVBQW5DO0lBQVI7OzBCQUtyQixRQUFBLEdBQVUsU0FBQyxPQUFELEVBQVUsVUFBVjtBQUVSLFVBQUE7O1FBRmtCLGFBQVc7O01BRTdCLElBQVUsQ0FBQyxPQUFBLEtBQVcsUUFBWixDQUFBLElBQTBCLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBLENBQXBDO0FBQUEsZUFBQTs7TUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxvQkFBZCxFQUFvQztRQUFBLElBQUEsRUFBTSxPQUFOO1FBQWUsT0FBQSxFQUFTLFVBQXhCO09BQXBDO01BRUEsSUFBRyxDQUFDLE9BQUEsS0FBVyxRQUFaLENBQUEsSUFBMEIsQ0FBQyxVQUFBLEtBQWMsSUFBQyxDQUFBLE9BQWhCLENBQTdCO1FBQ0UsT0FBd0IsQ0FBQyxRQUFELEVBQVcsSUFBWCxDQUF4QixFQUFDLGlCQUFELEVBQVUscUJBRFo7O01BR0EsSUFBa0IsT0FBQSxLQUFhLElBQUMsQ0FBQSxJQUFoQztRQUFBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFBQTs7TUFFQSxJQUFDLENBQUEsV0FBRDtBQUFlLGdCQUFPLE9BQVA7QUFBQSxlQUNSLFFBRFE7bUJBQ00sSUFBQyxDQUFBLGtCQUFELENBQUE7QUFETixlQUVSLGtCQUZRO21CQUVnQixJQUFDLENBQUEsMkJBQUQsQ0FBQTtBQUZoQixlQUdSLFFBSFE7bUJBR00sSUFBQyxDQUFBLGtCQUFELENBQW9CLFVBQXBCO0FBSE4sZUFJUixRQUpRO21CQUlNLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixVQUFwQjtBQUpOOztNQU1mLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQXpCLENBQW1DLElBQUMsQ0FBQSxJQUFGLEdBQU8sT0FBekM7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUF6QixDQUFnQyxJQUFDLENBQUEsT0FBakM7TUFFQSxPQUFvQixDQUFDLE9BQUQsRUFBVSxVQUFWLENBQXBCLEVBQUMsSUFBQyxDQUFBLGNBQUYsRUFBUSxJQUFDLENBQUE7TUFFVCxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUF6QixDQUFnQyxJQUFDLENBQUEsSUFBRixHQUFPLE9BQXRDO01BQ0EsSUFBMEMsb0JBQTFDO1FBQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBekIsQ0FBNkIsSUFBQyxDQUFBLE9BQTlCLEVBQUE7O01BRUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7UUFDRSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsdUJBQVYsQ0FBQSxFQUZGOztNQUlBLElBQUMsQ0FBQSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBM0IsQ0FBa0MsSUFBQyxDQUFBLElBQW5DLEVBQXlDLElBQUMsQ0FBQSxPQUExQztNQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsdUJBQVYsQ0FBQTthQUVBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLG1CQUFkLEVBQW1DO1FBQUUsTUFBRCxJQUFDLENBQUEsSUFBRjtRQUFTLFNBQUQsSUFBQyxDQUFBLE9BQVQ7T0FBbkM7SUFoQ1E7OzBCQWtDVixVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFBLDBDQUFtQixDQUFFLGtCQUFyQjtRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLHNCQUFkLEVBQXNDO1VBQUUsTUFBRCxJQUFDLENBQUEsSUFBRjtVQUFTLFNBQUQsSUFBQyxDQUFBLE9BQVQ7U0FBdEM7O2NBQ1ksQ0FBRSxPQUFkLENBQUE7O1FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBekIsQ0FBbUMsSUFBQyxDQUFBLElBQUYsR0FBTyxPQUF6QztRQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQXpCLENBQWdDLElBQUMsQ0FBQSxPQUFqQztlQUVBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLHFCQUFkLEVBQXFDO1VBQUUsTUFBRCxJQUFDLENBQUEsSUFBRjtVQUFTLFNBQUQsSUFBQyxDQUFBLE9BQVQ7U0FBckMsRUFQRjs7SUFEVTs7MEJBWVosa0JBQUEsR0FBb0IsU0FBQTtBQUNsQixVQUFBO01BQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFWLENBQUE7O1lBRXdCLENBQUUsZUFBMUIsQ0FBMEMsS0FBMUM7O2FBQ0EsSUFBSTtJQUpjOzswQkFRcEIsMkJBQUEsR0FBNkIsU0FBQTthQUMzQixJQUFJO0lBRHVCOzswQkFLN0Isa0JBQUEsR0FBb0IsU0FBQyxPQUFEO0FBQ2xCLFVBQUE7O1FBRG1CLFVBQVE7O01BQzNCLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLGVBQXpCLENBQXlDLElBQXpDO01BQ0EsSUFBbUQsT0FBQSxLQUFXLFNBQTlEO1FBQUEsc0JBQUEsR0FBeUIsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFBekI7O2FBRUksSUFBQSxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ2IsY0FBQTs7WUFBQSxzQkFBc0IsQ0FBRSxPQUF4QixDQUFBOztVQUNBLHNCQUFBLEdBQXlCO1VBR3pCLGdDQUFBLHNFQUE4RTtBQUM5RTtBQUFBO2VBQUEsc0NBQUE7O3lCQUNFLGNBQUEsQ0FBZSxNQUFmLEVBQXVCO2NBQUMsa0NBQUEsZ0NBQUQ7YUFBdkI7QUFERjs7UUFOYTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWDtJQUpjOzswQkFhcEIsbUJBQUEsR0FBcUIsU0FBQTtBQUNuQixVQUFBO01BQUEsSUFBQyxDQUFBLHdCQUFELEdBQTRCO01BQzVCLElBQUEsR0FBTyxJQUFJO01BQ1gsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQXlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQ2hDLGNBQUE7VUFEa0MsaUJBQU07VUFDeEMsTUFBQSxDQUFBO2lCQUNBLEtBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsU0FBQyxTQUFEO0FBQzlCLGdCQUFBO0FBQUE7QUFBQTtpQkFBQSxzQ0FBQTs7Y0FDRSxJQUFHLENBQUMsSUFBQSxLQUFVLElBQVgsQ0FBQSxJQUFxQixDQUFDLENBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFqQixDQUFBLENBQUwsQ0FBeEI7Z0JBQ0UsU0FBUyxDQUFDLFdBQVYsQ0FBQSxFQURGOzs7NkJBRTJDOzsyQkFDM0MsS0FBQyxDQUFBLHdCQUF5QixDQUFBLFNBQVMsQ0FBQyxFQUFWLENBQWEsQ0FBQyxJQUF4QyxDQUE2QyxLQUFBLENBQU0sU0FBTixDQUFnQixDQUFDLE9BQWpCLENBQXlCLElBQXpCLENBQTdDO0FBSkY7O1VBRDhCLENBQWhDO1FBRmdDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QixDQUFUO01BU0EsSUFBSSxDQUFDLEdBQUwsQ0FBYSxJQUFBLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ3RCLEtBQUMsQ0FBQSx3QkFBRCxHQUE0QjtRQUROO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLENBQWI7YUFFQTtJQWRtQjs7MEJBZ0JyQiwyQkFBQSxHQUE2QixTQUFDLFNBQUQ7QUFDM0IsVUFBQTtnRkFBdUMsQ0FBRSxHQUF6QyxDQUFBO0lBRDJCOzswQkFtQjdCLGtCQUFBLEdBQW9CLFNBQUMsVUFBRDtNQUNsQixJQUFDLENBQUEsbUJBQUQsQ0FBQTtNQUNBLEtBQUssQ0FBQyxTQUFOLENBQWdCLElBQUMsQ0FBQSxNQUFqQixFQUF5QixlQUF6QjtBQUVBLGNBQU8sVUFBUDtBQUFBLGFBQ08sVUFEUDtVQUVJLEtBQUssQ0FBQyxTQUFOLENBQWdCLElBQUMsQ0FBQSxNQUFqQixFQUF5QixVQUF6QjtBQURHO0FBRFAsYUFHTyxXQUhQO1VBSUksSUFBQyxDQUFBLFFBQVEsQ0FBQyxlQUFWLENBQUE7QUFKSjthQU1JLElBQUEsVUFBQSxDQUFXLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNiLGNBQUE7VUFBQSxLQUFDLENBQUEsbUJBQUQsQ0FBQTtBQUNBO0FBQUEsZUFBQSxzQ0FBQTs7WUFBQSxTQUFTLENBQUMsS0FBVixDQUFnQjtjQUFBLFVBQUEsRUFBWSxLQUFaO2FBQWhCO0FBQUE7aUJBQ0EsS0FBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCO1FBSGE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVg7SUFWYzs7MEJBZXBCLG1CQUFBLEdBQXFCLFNBQUE7QUFDbkIsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLE9BQUQsS0FBWSxXQUFmO0FBQ0U7QUFBQSxhQUFBLHNDQUFBOztVQUNFLEVBQUUsQ0FBQyxvQkFBSCxDQUFBO0FBREY7UUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLHdCQUFWLENBQUEsRUFIRjs7YUFLQSxLQUFLLENBQUMsU0FBTixDQUFnQixJQUFDLENBQUEsTUFBakI7SUFObUI7OzBCQVVyQixxQkFBQSxHQUF1QixTQUFBO0FBQ3JCLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixFQUFrQixXQUFsQixDQUFIO2VBRUUsbUVBQXlDLENBQUUsV0FBdkMsQ0FBQSxZQUZOO09BQUEsTUFBQTtlQUlFLENBQUksS0FBQSxDQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUFOLENBQWlDLENBQUMsV0FBbEMsQ0FBQSxFQUpOOztJQURxQjs7MEJBT3ZCLG1CQUFBLEdBQXFCLFNBQUMsS0FBRDs7UUFBQyxRQUFNOzthQUMxQixJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUF6QixDQUFnQyxhQUFoQyxrQkFBK0MsUUFBUSxJQUFDLENBQUEscUJBQUQsQ0FBQSxDQUF2RDtJQURtQjs7MEJBR3JCLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsUUFBekIsQ0FBa0MsYUFBbEM7SUFEVTs7Ozs7O0VBR2QsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF2TGpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyLCBSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcbnttb3ZlQ3Vyc29yTGVmdH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5jbGFzcyBNb2RlTWFuYWdlclxuICBtb2RlOiAnaW5zZXJ0JyAjIE5hdGl2ZSBhdG9tIGlzIG5vdCBtb2RhbCBlZGl0b3IgYW5kIGl0cyBkZWZhdWx0IGlzICdpbnNlcnQnXG4gIHN1Ym1vZGU6IG51bGxcbiAgcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIEBtb2RlID0gJ2luc2VydCdcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBpc01vZGU6IChtb2RlLCBzdWJtb2RlcykgLT5cbiAgICBpZiBzdWJtb2Rlcz9cbiAgICAgIChAbW9kZSBpcyBtb2RlKSBhbmQgKEBzdWJtb2RlIGluIFtdLmNvbmNhdChzdWJtb2RlcykpXG4gICAgZWxzZVxuICAgICAgQG1vZGUgaXMgbW9kZVxuXG4gICMgRXZlbnRcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG9uV2lsbEFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5vbignd2lsbC1hY3RpdmF0ZS1tb2RlJywgZm4pXG4gIG9uRGlkQWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtYWN0aXZhdGUtbW9kZScsIGZuKVxuICBvbldpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5vbignd2lsbC1kZWFjdGl2YXRlLW1vZGUnLCBmbilcbiAgcHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5wcmVlbXB0KCd3aWxsLWRlYWN0aXZhdGUtbW9kZScsIGZuKVxuICBvbkRpZERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtZGVhY3RpdmF0ZS1tb2RlJywgZm4pXG5cbiAgIyBhY3RpdmF0ZTogUHVibGljXG4gICMgIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgbW9kZSwgRE9OVCB1c2Ugb3RoZXIgZGlyZWN0IG1ldGhvZC5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFjdGl2YXRlOiAobmV3TW9kZSwgbmV3U3VibW9kZT1udWxsKSAtPlxuICAgICMgQXZvaWQgb2RkIHN0YXRlKD12aXN1YWwtbW9kZSBidXQgc2VsZWN0aW9uIGlzIGVtcHR5KVxuICAgIHJldHVybiBpZiAobmV3TW9kZSBpcyAndmlzdWFsJykgYW5kIEBlZGl0b3IuaXNFbXB0eSgpXG5cbiAgICBAZW1pdHRlci5lbWl0KCd3aWxsLWFjdGl2YXRlLW1vZGUnLCBtb2RlOiBuZXdNb2RlLCBzdWJtb2RlOiBuZXdTdWJtb2RlKVxuXG4gICAgaWYgKG5ld01vZGUgaXMgJ3Zpc3VhbCcpIGFuZCAobmV3U3VibW9kZSBpcyBAc3VibW9kZSlcbiAgICAgIFtuZXdNb2RlLCBuZXdTdWJtb2RlXSA9IFsnbm9ybWFsJywgbnVsbF1cblxuICAgIEBkZWFjdGl2YXRlKCkgaWYgKG5ld01vZGUgaXNudCBAbW9kZSlcblxuICAgIEBkZWFjdGl2YXRvciA9IHN3aXRjaCBuZXdNb2RlXG4gICAgICB3aGVuICdub3JtYWwnIHRoZW4gQGFjdGl2YXRlTm9ybWFsTW9kZSgpXG4gICAgICB3aGVuICdvcGVyYXRvci1wZW5kaW5nJyB0aGVuIEBhY3RpdmF0ZU9wZXJhdG9yUGVuZGluZ01vZGUoKVxuICAgICAgd2hlbiAnaW5zZXJ0JyB0aGVuIEBhY3RpdmF0ZUluc2VydE1vZGUobmV3U3VibW9kZSlcbiAgICAgIHdoZW4gJ3Zpc3VhbCcgdGhlbiBAYWN0aXZhdGVWaXN1YWxNb2RlKG5ld1N1Ym1vZGUpXG5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiI3tAbW9kZX0tbW9kZVwiKVxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoQHN1Ym1vZGUpXG5cbiAgICBbQG1vZGUsIEBzdWJtb2RlXSA9IFtuZXdNb2RlLCBuZXdTdWJtb2RlXVxuXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIiN7QG1vZGV9LW1vZGVcIilcbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKEBzdWJtb2RlKSBpZiBAc3VibW9kZT9cblxuICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICBAdXBkYXRlTmFycm93ZWRTdGF0ZSgpXG4gICAgICBAdmltU3RhdGUudXBkYXRlUHJldmlvdXNTZWxlY3Rpb24oKVxuXG4gICAgQHZpbVN0YXRlLnN0YXR1c0Jhck1hbmFnZXIudXBkYXRlKEBtb2RlLCBAc3VibW9kZSlcbiAgICBAdmltU3RhdGUudXBkYXRlQ3Vyc29yc1Zpc2liaWxpdHkoKVxuXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWFjdGl2YXRlLW1vZGUnLCB7QG1vZGUsIEBzdWJtb2RlfSlcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIHVubGVzcyBAZGVhY3RpdmF0b3I/LmRpc3Bvc2VkXG4gICAgICBAZW1pdHRlci5lbWl0KCd3aWxsLWRlYWN0aXZhdGUtbW9kZScsIHtAbW9kZSwgQHN1Ym1vZGV9KVxuICAgICAgQGRlYWN0aXZhdG9yPy5kaXNwb3NlKClcbiAgICAgICMgUmVtb3ZlIGNzcyBjbGFzcyBoZXJlIGluLWNhc2UgQGRlYWN0aXZhdGUoKSBjYWxsZWQgc29sZWx5KG9jY3VycmVuY2UgaW4gdmlzdWFsLW1vZGUpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiI3tAbW9kZX0tbW9kZVwiKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShAc3VibW9kZSlcblxuICAgICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWRlYWN0aXZhdGUtbW9kZScsIHtAbW9kZSwgQHN1Ym1vZGV9KVxuXG4gICMgTm9ybWFsXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhY3RpdmF0ZU5vcm1hbE1vZGU6IC0+XG4gICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICAjIENvbXBvbmVudCBpcyBub3QgbmVjZXNzYXJ5IGF2YWlhYmxlIHNlZSAjOTguXG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50Py5zZXRJbnB1dEVuYWJsZWQoZmFsc2UpXG4gICAgbmV3IERpc3Bvc2FibGVcblxuICAjIE9wZXJhdG9yIFBlbmRpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFjdGl2YXRlT3BlcmF0b3JQZW5kaW5nTW9kZTogLT5cbiAgICBuZXcgRGlzcG9zYWJsZVxuXG4gICMgSW5zZXJ0XG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhY3RpdmF0ZUluc2VydE1vZGU6IChzdWJtb2RlPW51bGwpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50LnNldElucHV0RW5hYmxlZCh0cnVlKVxuICAgIHJlcGxhY2VNb2RlRGVhY3RpdmF0b3IgPSBAYWN0aXZhdGVSZXBsYWNlTW9kZSgpIGlmIHN1Ym1vZGUgaXMgJ3JlcGxhY2UnXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgcmVwbGFjZU1vZGVEZWFjdGl2YXRvcj8uZGlzcG9zZSgpXG4gICAgICByZXBsYWNlTW9kZURlYWN0aXZhdG9yID0gbnVsbFxuXG4gICAgICAjIFdoZW4gZXNjYXBlIGZyb20gaW5zZXJ0LW1vZGUsIGN1cnNvciBtb3ZlIExlZnQuXG4gICAgICBuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZSA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLmF0b21pY1NvZnRUYWJzJykgPyB0cnVlXG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgIG1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge25lZWRTcGVjaWFsQ2FyZVRvUHJldmVudFdyYXBMaW5lfSlcblxuICBhY3RpdmF0ZVJlcGxhY2VNb2RlOiAtPlxuICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24gPSB7fVxuICAgIHN1YnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIHN1YnMuYWRkIEBlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dCAoe3RleHQsIGNhbmNlbH0pID0+XG4gICAgICBjYW5jZWwoKVxuICAgICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSA9PlxuICAgICAgICBmb3IgY2hhciBpbiB0ZXh0LnNwbGl0KCcnKSA/IFtdXG4gICAgICAgICAgaWYgKGNoYXIgaXNudCBcIlxcblwiKSBhbmQgKG5vdCBzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSlcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZWxlY3RSaWdodCgpXG4gICAgICAgICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbltzZWxlY3Rpb24uaWRdID89IFtdXG4gICAgICAgICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbltzZWxlY3Rpb24uaWRdLnB1c2goc3dyYXAoc2VsZWN0aW9uKS5yZXBsYWNlKGNoYXIpKVxuXG4gICAgc3Vicy5hZGQgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24gPSBudWxsXG4gICAgc3Vic1xuXG4gIGdldFJlcGxhY2VkQ2hhckZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uW3NlbGVjdGlvbi5pZF0/LnBvcCgpXG5cbiAgIyBWaXN1YWxcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgV2UgdHJlYXQgYWxsIHNlbGVjdGlvbiBpcyBpbml0aWFsbHkgTk9UIG5vcm1hbGl6ZWRcbiAgI1xuICAjIDEuIEZpcnN0IHdlIG5vcm1hbGl6ZSBzZWxlY3Rpb25cbiAgIyAyLiBUaGVuIHVwZGF0ZSBzZWxlY3Rpb24gb3JpZW50YXRpb24oPXdpc2UpLlxuICAjXG4gICMgUmVnYXJkbGVzcyBvZiBzZWxlY3Rpb24gaXMgbW9kaWZpZWQgYnkgdm1wLWNvbW1hbmQgb3Igb3V0ZXItdm1wLWNvbW1hbmQgbGlrZSBgY21kLWxgLlxuICAjIFdoZW4gbm9ybWFsaXplLCB3ZSBtb3ZlIGN1cnNvciB0byBsZWZ0KHNlbGVjdExlZnQgZXF1aXZhbGVudCkuXG4gICMgU2luY2UgVmltJ3MgdmlzdWFsLW1vZGUgaXMgYWx3YXlzIHNlbGVjdFJpZ2h0ZWQuXG4gICNcbiAgIyAtIHVuLW5vcm1hbGl6ZWQgc2VsZWN0aW9uOiBUaGlzIGlzIHRoZSByYW5nZSB3ZSBzZWUgaW4gdmlzdWFsLW1vZGUuKCBTbyBub3JtYWwgdmlzdWFsLW1vZGUgcmFuZ2UgaW4gdXNlciBwZXJzcGVjdGl2ZSApLlxuICAjIC0gbm9ybWFsaXplZCBzZWxlY3Rpb246IE9uZSBjb2x1bW4gbGVmdCBzZWxjdGVkIGF0IHNlbGVjdGlvbiBlbmQgcG9zaXRpb25cbiAgIyAtIFdoZW4gc2VsZWN0UmlnaHQgYXQgZW5kIHBvc2l0aW9uIG9mIG5vcm1hbGl6ZWQtc2VsZWN0aW9uLCBpdCBiZWNvbWUgdW4tbm9ybWFsaXplZCBzZWxlY3Rpb25cbiAgIyAgIHdoaWNoIGlzIHRoZSByYW5nZSBpbiB2aXN1YWwtbW9kZS5cbiAgI1xuICBhY3RpdmF0ZVZpc3VhbE1vZGU6IChuZXdTdWJtb2RlKSAtPlxuICAgIEBub3JtYWxpemVTZWxlY3Rpb25zKClcbiAgICBzd3JhcC5hcHBseVdpc2UoQGVkaXRvciwgJ2NoYXJhY3Rlcndpc2UnKVxuXG4gICAgc3dpdGNoIG5ld1N1Ym1vZGVcbiAgICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgICBzd3JhcC5hcHBseVdpc2UoQGVkaXRvciwgJ2xpbmV3aXNlJylcbiAgICAgIHdoZW4gJ2Jsb2Nrd2lzZSdcbiAgICAgICAgQHZpbVN0YXRlLnNlbGVjdEJsb2Nrd2lzZSgpXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQG5vcm1hbGl6ZVNlbGVjdGlvbnMoKVxuICAgICAgc2VsZWN0aW9uLmNsZWFyKGF1dG9zY3JvbGw6IGZhbHNlKSBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAdXBkYXRlTmFycm93ZWRTdGF0ZShmYWxzZSlcblxuICBub3JtYWxpemVTZWxlY3Rpb25zOiAtPlxuICAgIGlmIEBzdWJtb2RlIGlzICdibG9ja3dpc2UnXG4gICAgICBmb3IgYnMgaW4gQHZpbVN0YXRlLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKVxuICAgICAgICBicy5yZXN0b3JlQ2hhcmFjdGVyd2lzZSgpXG4gICAgICBAdmltU3RhdGUuY2xlYXJCbG9ja3dpc2VTZWxlY3Rpb25zKClcblxuICAgIHN3cmFwLm5vcm1hbGl6ZShAZWRpdG9yKVxuXG4gICMgTmFycm93IHRvIHNlbGVjdGlvblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaGFzTXVsdGlMaW5lU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgIyBbRklYTUVdIHdoeSBJIG5lZWQgbnVsbCBndWFyZCBoZXJlXG4gICAgICBub3QgQHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKT8uaXNTaW5nbGVSb3coKVxuICAgIGVsc2VcbiAgICAgIG5vdCBzd3JhcChAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuaXNTaW5nbGVSb3coKVxuXG4gIHVwZGF0ZU5hcnJvd2VkU3RhdGU6ICh2YWx1ZT1udWxsKSAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLW5hcnJvd2VkJywgdmFsdWUgPyBAaGFzTXVsdGlMaW5lU2VsZWN0aW9uKCkpXG5cbiAgaXNOYXJyb3dlZDogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2lzLW5hcnJvd2VkJylcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlTWFuYWdlclxuIl19
