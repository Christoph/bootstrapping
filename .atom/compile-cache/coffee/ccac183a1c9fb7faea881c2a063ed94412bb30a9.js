(function() {
  var CompositeDisposable, Emitter, SearchModel, addCurrentClassForDecoration, getIndex, getVisibleBufferRange, hoverCounterTimeoutID, ref, ref1, removeCurrentClassForDecoration, replaceDecorationClassBy, smartScrollToBufferPosition;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('./utils'), getVisibleBufferRange = ref1.getVisibleBufferRange, smartScrollToBufferPosition = ref1.smartScrollToBufferPosition, getIndex = ref1.getIndex, replaceDecorationClassBy = ref1.replaceDecorationClassBy;

  hoverCounterTimeoutID = null;

  removeCurrentClassForDecoration = null;

  addCurrentClassForDecoration = null;

  module.exports = SearchModel = (function() {
    SearchModel.prototype.relativeIndex = 0;

    SearchModel.prototype.lastRelativeIndex = null;

    SearchModel.prototype.onDidChangeCurrentMatch = function(fn) {
      return this.emitter.on('did-change-current-match', fn);
    };

    function SearchModel(vimState, options) {
      var ref2;
      this.vimState = vimState;
      this.options = options;
      this.emitter = new Emitter;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.editorElement.onDidChangeScrollTop(this.refreshMarkers.bind(this)));
      this.disposables.add(this.editorElement.onDidChangeScrollLeft(this.refreshMarkers.bind(this)));
      this.markerLayer = this.editor.addMarkerLayer();
      this.decoationByRange = {};
      this.onDidChangeCurrentMatch((function(_this) {
        return function() {
          var classList, point, text, timeout;
          _this.vimState.hoverSearchCounter.reset();
          if (_this.currentMatch == null) {
            if (_this.vimState.getConfig('flashScreenOnSearchHasNoMatch')) {
              _this.vimState.flash(getVisibleBufferRange(_this.editor), {
                type: 'screen'
              });
              atom.beep();
            }
            return;
          }
          if (_this.vimState.getConfig('showHoverSearchCounter')) {
            text = String(_this.currentMatchIndex + 1) + '/' + _this.matches.length;
            point = _this.currentMatch.start;
            classList = _this.classNamesForRange(_this.currentMatch);
            _this.resetHover();
            _this.vimState.hoverSearchCounter.set(text, point, {
              classList: classList
            });
            if (!_this.options.incrementalSearch) {
              timeout = _this.vimState.getConfig('showHoverSearchCounterDuration');
              hoverCounterTimeoutID = setTimeout(_this.resetHover.bind(_this), timeout);
            }
          }
          _this.editor.unfoldBufferRow(_this.currentMatch.start.row);
          smartScrollToBufferPosition(_this.editor, _this.currentMatch.start);
          if (_this.vimState.getConfig('flashOnSearch')) {
            return _this.vimState.flash(_this.currentMatch, {
              type: 'search'
            });
          }
        };
      })(this));
    }

    SearchModel.prototype.resetHover = function() {
      var ref2;
      if (hoverCounterTimeoutID != null) {
        clearTimeout(hoverCounterTimeoutID);
        hoverCounterTimeoutID = null;
      }
      return (ref2 = this.vimState.hoverSearchCounter) != null ? ref2.reset() : void 0;
    };

    SearchModel.prototype.destroy = function() {
      this.markerLayer.destroy();
      this.disposables.dispose();
      return this.decoationByRange = null;
    };

    SearchModel.prototype.clearMarkers = function() {
      this.markerLayer.clear();
      return this.decoationByRange = {};
    };

    SearchModel.prototype.classNamesForRange = function(range) {
      var classNames;
      classNames = [];
      if (range === this.firstMatch) {
        classNames.push('first');
      } else if (range === this.lastMatch) {
        classNames.push('last');
      }
      if (range === this.currentMatch) {
        classNames.push('current');
      }
      return classNames;
    };

    SearchModel.prototype.refreshMarkers = function() {
      var i, len, range, ref2, results;
      this.clearMarkers();
      ref2 = this.getVisibleMatchRanges();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        range = ref2[i];
        if (!range.isEmpty()) {
          results.push(this.decoationByRange[range.toString()] = this.decorateRange(range));
        }
      }
      return results;
    };

    SearchModel.prototype.getVisibleMatchRanges = function() {
      var visibleMatchRanges, visibleRange;
      visibleRange = getVisibleBufferRange(this.editor);
      return visibleMatchRanges = this.matches.filter(function(range) {
        return range.intersectsWith(visibleRange);
      });
    };

    SearchModel.prototype.decorateRange = function(range) {
      var classNames, ref2;
      classNames = this.classNamesForRange(range);
      classNames = (ref2 = ['vim-mode-plus-search-match']).concat.apply(ref2, classNames);
      return this.editor.decorateMarker(this.markerLayer.markBufferRange(range), {
        type: 'highlight',
        "class": classNames.join(' ')
      });
    };

    SearchModel.prototype.search = function(fromPoint, pattern, relativeIndex) {
      var currentMatch, i, j, len, range, ref2, ref3, ref4;
      this.pattern = pattern;
      this.matches = [];
      this.editor.scan(this.pattern, (function(_this) {
        return function(arg) {
          var range;
          range = arg.range;
          return _this.matches.push(range);
        };
      })(this));
      ref2 = this.matches, this.firstMatch = ref2[0], this.lastMatch = ref2[ref2.length - 1];
      currentMatch = null;
      if (relativeIndex >= 0) {
        ref3 = this.matches;
        for (i = 0, len = ref3.length; i < len; i++) {
          range = ref3[i];
          if (!(range.start.isGreaterThan(fromPoint))) {
            continue;
          }
          currentMatch = range;
          break;
        }
        if (currentMatch == null) {
          currentMatch = this.firstMatch;
        }
        relativeIndex--;
      } else {
        ref4 = this.matches;
        for (j = ref4.length - 1; j >= 0; j += -1) {
          range = ref4[j];
          if (!(range.start.isLessThan(fromPoint))) {
            continue;
          }
          currentMatch = range;
          break;
        }
        if (currentMatch == null) {
          currentMatch = this.lastMatch;
        }
        relativeIndex++;
      }
      this.currentMatchIndex = this.matches.indexOf(currentMatch);
      this.updateCurrentMatch(relativeIndex);
      if (this.options.incrementalSearch) {
        this.refreshMarkers();
      }
      this.initialCurrentMatchIndex = this.currentMatchIndex;
      return this.currentMatch;
    };

    SearchModel.prototype.updateCurrentMatch = function(relativeIndex) {
      this.currentMatchIndex = getIndex(this.currentMatchIndex + relativeIndex, this.matches);
      this.currentMatch = this.matches[this.currentMatchIndex];
      return this.emitter.emit('did-change-current-match');
    };

    SearchModel.prototype.visit = function(relativeIndex) {
      var newDecoration, oldDecoration, ref2;
      if (relativeIndex == null) {
        relativeIndex = null;
      }
      if (relativeIndex != null) {
        this.lastRelativeIndex = relativeIndex;
      } else {
        relativeIndex = (ref2 = this.lastRelativeIndex) != null ? ref2 : +1;
      }
      if (!this.matches.length) {
        return;
      }
      oldDecoration = this.decoationByRange[this.currentMatch.toString()];
      this.updateCurrentMatch(relativeIndex);
      newDecoration = this.decoationByRange[this.currentMatch.toString()];
      if (removeCurrentClassForDecoration == null) {
        removeCurrentClassForDecoration = replaceDecorationClassBy.bind(null, function(text) {
          return text.replace(/\s+current(\s+)?$/, '$1');
        });
      }
      if (addCurrentClassForDecoration == null) {
        addCurrentClassForDecoration = replaceDecorationClassBy.bind(null, function(text) {
          return text.replace(/\s+current(\s+)?$/, '$1') + ' current';
        });
      }
      if (oldDecoration != null) {
        removeCurrentClassForDecoration(oldDecoration);
      }
      if (newDecoration != null) {
        return addCurrentClassForDecoration(newDecoration);
      }
    };

    SearchModel.prototype.getRelativeIndex = function() {
      return this.currentMatchIndex - this.initialCurrentMatchIndex;
    };

    return SearchModel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc2VhcmNoLW1vZGVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBaUMsT0FBQSxDQUFRLE1BQVIsQ0FBakMsRUFBQyxxQkFBRCxFQUFVOztFQUNWLE9BS0ksT0FBQSxDQUFRLFNBQVIsQ0FMSixFQUNFLGtEQURGLEVBRUUsOERBRkYsRUFHRSx3QkFIRixFQUlFOztFQUdGLHFCQUFBLEdBQXdCOztFQUN4QiwrQkFBQSxHQUFrQzs7RUFDbEMsNEJBQUEsR0FBK0I7O0VBRS9CLE1BQU0sQ0FBQyxPQUFQLEdBQ007MEJBQ0osYUFBQSxHQUFlOzswQkFDZixpQkFBQSxHQUFtQjs7MEJBQ25CLHVCQUFBLEdBQXlCLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLDBCQUFaLEVBQXdDLEVBQXhDO0lBQVI7O0lBRVoscUJBQUMsUUFBRCxFQUFZLE9BQVo7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFBVyxJQUFDLENBQUEsVUFBRDtNQUN2QixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFFZixPQUE0QixJQUFDLENBQUEsUUFBN0IsRUFBQyxJQUFDLENBQUEsY0FBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLHFCQUFBO01BQ1gsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsYUFBYSxDQUFDLG9CQUFmLENBQW9DLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBcEMsQ0FBakI7TUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxxQkFBZixDQUFxQyxJQUFDLENBQUEsY0FBYyxDQUFDLElB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dUJQLGdCQUFBLEdBQWtCLFNBQUE7YUFDaEIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUMsQ0FBQTtJQUROOzs7OztBQTdKcEIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xue1xuICBnZXRWaXNpYmxlQnVmZmVyUmFuZ2VcbiAgc21hcnRTY3JvbGxUb0J1ZmZlclBvc2l0aW9uXG4gIGdldEluZGV4XG4gIHJlcGxhY2VEZWNvcmF0aW9uQ2xhc3NCeVxufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbmhvdmVyQ291bnRlclRpbWVvdXRJRCA9IG51bGxcbnJlbW92ZUN1cnJlbnRDbGFzc0ZvckRlY29yYXRpb24gPSBudWxsXG5hZGRDdXJyZW50Q2xhc3NGb3JEZWNvcmF0aW9uID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWFyY2hNb2RlbFxuICByZWxhdGl2ZUluZGV4OiAwXG4gIGxhc3RSZWxhdGl2ZUluZGV4OiBudWxsXG4gIG9uRGlkQ2hhbmdlQ3VycmVudE1hdGNoOiAoZm4pIC0+IEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWN1cnJlbnQtbWF0Y2gnLCBmblxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlLCBAb3B0aW9ucykgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnR9ID0gQHZpbVN0YXRlXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZXMuYWRkKEBlZGl0b3JFbGVtZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKEByZWZyZXNoTWFya2Vycy5iaW5kKHRoaXMpKSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkKEBlZGl0b3JFbGVtZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsTGVmdChAcmVmcmVzaE1hcmtlcnMuYmluZCh0aGlzKSkpXG4gICAgQG1hcmtlckxheWVyID0gQGVkaXRvci5hZGRNYXJrZXJMYXllcigpXG4gICAgQGRlY29hdGlvbkJ5UmFuZ2UgPSB7fVxuXG4gICAgQG9uRGlkQ2hhbmdlQ3VycmVudE1hdGNoID0+XG4gICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLnJlc2V0KClcbiAgICAgIHVubGVzcyBAY3VycmVudE1hdGNoP1xuICAgICAgICBpZiBAdmltU3RhdGUuZ2V0Q29uZmlnKCdmbGFzaFNjcmVlbk9uU2VhcmNoSGFzTm9NYXRjaCcpXG4gICAgICAgICAgQHZpbVN0YXRlLmZsYXNoKGdldFZpc2libGVCdWZmZXJSYW5nZShAZWRpdG9yKSwgdHlwZTogJ3NjcmVlbicpXG4gICAgICAgICAgYXRvbS5iZWVwKClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIGlmIEB2aW1TdGF0ZS5nZXRDb25maWcoJ3Nob3dIb3ZlclNlYXJjaENvdW50ZXInKVxuICAgICAgICB0ZXh0ID0gU3RyaW5nKEBjdXJyZW50TWF0Y2hJbmRleCArIDEpICsgJy8nICsgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgIHBvaW50ID0gQGN1cnJlbnRNYXRjaC5zdGFydFxuICAgICAgICBjbGFzc0xpc3QgPSBAY2xhc3NOYW1lc0ZvclJhbmdlKEBjdXJyZW50TWF0Y2gpXG5cbiAgICAgICAgQHJlc2V0SG92ZXIoKVxuICAgICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLnNldCh0ZXh0LCBwb2ludCwge2NsYXNzTGlzdH0pXG5cbiAgICAgICAgdW5sZXNzIEBvcHRpb25zLmluY3JlbWVudGFsU2VhcmNoXG4gICAgICAgICAgdGltZW91dCA9IEB2aW1TdGF0ZS5nZXRDb25maWcoJ3Nob3dIb3ZlclNlYXJjaENvdW50ZXJEdXJhdGlvbicpXG4gICAgICAgICAgaG92ZXJDb3VudGVyVGltZW91dElEID0gc2V0VGltZW91dChAcmVzZXRIb3Zlci5iaW5kKHRoaXMpLCB0aW1lb3V0KVxuXG4gICAgICBAZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhAY3VycmVudE1hdGNoLnN0YXJ0LnJvdylcbiAgICAgIHNtYXJ0U2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBAY3VycmVudE1hdGNoLnN0YXJ0KVxuXG4gICAgICBpZiBAdmltU3RhdGUuZ2V0Q29uZmlnKCdmbGFzaE9uU2VhcmNoJylcbiAgICAgICAgQHZpbVN0YXRlLmZsYXNoKEBjdXJyZW50TWF0Y2gsIHR5cGU6ICdzZWFyY2gnKVxuXG4gIHJlc2V0SG92ZXI6IC0+XG4gICAgaWYgaG92ZXJDb3VudGVyVGltZW91dElEP1xuICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyQ291bnRlclRpbWVvdXRJRClcbiAgICAgIGhvdmVyQ291bnRlclRpbWVvdXRJRCA9IG51bGxcbiAgICAjIFNlZSAjNjc0XG4gICAgIyBUaGlzIG1ldGhvZCBjYWxsZWQgd2l0aCBzZXRUaW1lb3V0XG4gICAgIyBob3ZlclNlYXJjaENvdW50ZXIgbWlnaHQgbm90IGJlIGF2YWlsYWJsZSB3aGVuIGVkaXRvciBkZXN0cm95ZWQuXG4gICAgQHZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlcj8ucmVzZXQoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQG1hcmtlckxheWVyLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAZGVjb2F0aW9uQnlSYW5nZSA9IG51bGxcblxuICBjbGVhck1hcmtlcnM6IC0+XG4gICAgQG1hcmtlckxheWVyLmNsZWFyKClcbiAgICBAZGVjb2F0aW9uQnlSYW5nZSA9IHt9XG5cbiAgY2xhc3NOYW1lc0ZvclJhbmdlOiAocmFuZ2UpIC0+XG4gICAgY2xhc3NOYW1lcyA9IFtdXG4gICAgaWYgcmFuZ2UgaXMgQGZpcnN0TWF0Y2hcbiAgICAgIGNsYXNzTmFtZXMucHVzaCgnZmlyc3QnKVxuICAgIGVsc2UgaWYgcmFuZ2UgaXMgQGxhc3RNYXRjaFxuICAgICAgY2xhc3NOYW1lcy5wdXNoKCdsYXN0JylcblxuICAgIGlmIHJhbmdlIGlzIEBjdXJyZW50TWF0Y2hcbiAgICAgIGNsYXNzTmFtZXMucHVzaCgnY3VycmVudCcpXG5cbiAgICBjbGFzc05hbWVzXG5cbiAgcmVmcmVzaE1hcmtlcnM6IC0+XG4gICAgQGNsZWFyTWFya2VycygpXG4gICAgZm9yIHJhbmdlIGluIEBnZXRWaXNpYmxlTWF0Y2hSYW5nZXMoKSB3aGVuIG5vdCByYW5nZS5pc0VtcHR5KClcbiAgICAgIEBkZWNvYXRpb25CeVJhbmdlW3JhbmdlLnRvU3RyaW5nKCldID0gQGRlY29yYXRlUmFuZ2UocmFuZ2UpXG5cbiAgZ2V0VmlzaWJsZU1hdGNoUmFuZ2VzOiAtPlxuICAgIHZpc2libGVSYW5nZSA9IGdldFZpc2libGVCdWZmZXJSYW5nZShAZWRpdG9yKVxuICAgIHZpc2libGVNYXRjaFJhbmdlcyA9IEBtYXRjaGVzLmZpbHRlciAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5pbnRlcnNlY3RzV2l0aCh2aXNpYmxlUmFuZ2UpXG5cbiAgZGVjb3JhdGVSYW5nZTogKHJhbmdlKSAtPlxuICAgIGNsYXNzTmFtZXMgPSBAY2xhc3NOYW1lc0ZvclJhbmdlKHJhbmdlKVxuICAgIGNsYXNzTmFtZXMgPSBbJ3ZpbS1tb2RlLXBsdXMtc2VhcmNoLW1hdGNoJ10uY29uY2F0KGNsYXNzTmFtZXMuLi4pXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlciBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKHJhbmdlKSxcbiAgICAgIHR5cGU6ICdoaWdobGlnaHQnXG4gICAgICBjbGFzczogY2xhc3NOYW1lcy5qb2luKCcgJylcblxuICBzZWFyY2g6IChmcm9tUG9pbnQsIEBwYXR0ZXJuLCByZWxhdGl2ZUluZGV4KSAtPlxuICAgIEBtYXRjaGVzID0gW11cbiAgICBAZWRpdG9yLnNjYW4gQHBhdHRlcm4sICh7cmFuZ2V9KSA9PlxuICAgICAgQG1hdGNoZXMucHVzaChyYW5nZSlcblxuICAgIFtAZmlyc3RNYXRjaCwgLi4uLCBAbGFzdE1hdGNoXSA9IEBtYXRjaGVzXG5cbiAgICBjdXJyZW50TWF0Y2ggPSBudWxsXG4gICAgaWYgcmVsYXRpdmVJbmRleCA+PSAwXG4gICAgICBmb3IgcmFuZ2UgaW4gQG1hdGNoZXMgd2hlbiByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludClcbiAgICAgICAgY3VycmVudE1hdGNoID0gcmFuZ2VcbiAgICAgICAgYnJlYWtcbiAgICAgIGN1cnJlbnRNYXRjaCA/PSBAZmlyc3RNYXRjaFxuICAgICAgcmVsYXRpdmVJbmRleC0tXG4gICAgZWxzZVxuICAgICAgZm9yIHJhbmdlIGluIEBtYXRjaGVzIGJ5IC0xIHdoZW4gcmFuZ2Uuc3RhcnQuaXNMZXNzVGhhbihmcm9tUG9pbnQpXG4gICAgICAgIGN1cnJlbnRNYXRjaCA9IHJhbmdlXG4gICAgICAgIGJyZWFrXG4gICAgICBjdXJyZW50TWF0Y2ggPz0gQGxhc3RNYXRjaFxuICAgICAgcmVsYXRpdmVJbmRleCsrXG5cbiAgICBAY3VycmVudE1hdGNoSW5kZXggPSBAbWF0Y2hlcy5pbmRleE9mKGN1cnJlbnRNYXRjaClcbiAgICBAdXBkYXRlQ3VycmVudE1hdGNoKHJlbGF0aXZlSW5kZXgpXG4gICAgaWYgQG9wdGlvbnMuaW5jcmVtZW50YWxTZWFyY2hcbiAgICAgIEByZWZyZXNoTWFya2VycygpXG4gICAgQGluaXRpYWxDdXJyZW50TWF0Y2hJbmRleCA9IEBjdXJyZW50TWF0Y2hJbmRleFxuICAgIEBjdXJyZW50TWF0Y2hcblxuICB1cGRhdGVDdXJyZW50TWF0Y2g6IChyZWxhdGl2ZUluZGV4KSAtPlxuICAgIEBjdXJyZW50TWF0Y2hJbmRleCA9IGdldEluZGV4KEBjdXJyZW50TWF0Y2hJbmRleCArIHJlbGF0aXZlSW5kZXgsIEBtYXRjaGVzKVxuICAgIEBjdXJyZW50TWF0Y2ggPSBAbWF0Y2hlc1tAY3VycmVudE1hdGNoSW5kZXhdXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZS1jdXJyZW50LW1hdGNoJylcblxuICB2aXNpdDogKHJlbGF0aXZlSW5kZXg9bnVsbCkgLT5cbiAgICBpZiByZWxhdGl2ZUluZGV4P1xuICAgICAgQGxhc3RSZWxhdGl2ZUluZGV4ID0gcmVsYXRpdmVJbmRleFxuICAgIGVsc2VcbiAgICAgIHJlbGF0aXZlSW5kZXggPSBAbGFzdFJlbGF0aXZlSW5kZXggPyArMVxuXG4gICAgcmV0dXJuIHVubGVzcyBAbWF0Y2hlcy5sZW5ndGhcbiAgICBvbGREZWNvcmF0aW9uID0gQGRlY29hdGlvbkJ5UmFuZ2VbQGN1cnJlbnRNYXRjaC50b1N0cmluZygpXVxuICAgIEB1cGRhdGVDdXJyZW50TWF0Y2gocmVsYXRpdmVJbmRleClcbiAgICBuZXdEZWNvcmF0aW9uID0gQGRlY29hdGlvbkJ5UmFuZ2VbQGN1cnJlbnRNYXRjaC50b1N0cmluZygpXVxuXG4gICAgcmVtb3ZlQ3VycmVudENsYXNzRm9yRGVjb3JhdGlvbiA/PSByZXBsYWNlRGVjb3JhdGlvbkNsYXNzQnkuYmluZCBudWxsICwgKHRleHQpIC0+XG4gICAgICB0ZXh0LnJlcGxhY2UoL1xccytjdXJyZW50KFxccyspPyQvLCAnJDEnKVxuXG4gICAgYWRkQ3VycmVudENsYXNzRm9yRGVjb3JhdGlvbiA/PSByZXBsYWNlRGVjb3JhdGlvbkNsYXNzQnkuYmluZCBudWxsICwgKHRleHQpIC0+XG4gICAgICB0ZXh0LnJlcGxhY2UoL1xccytjdXJyZW50KFxccyspPyQvLCAnJDEnKSArICcgY3VycmVudCdcblxuICAgIGlmIG9sZERlY29yYXRpb24/XG4gICAgICByZW1vdmVDdXJyZW50Q2xhc3NGb3JEZWNvcmF0aW9uKG9sZERlY29yYXRpb24pXG5cbiAgICBpZiBuZXdEZWNvcmF0aW9uP1xuICAgICAgYWRkQ3VycmVudENsYXNzRm9yRGVjb3JhdGlvbihuZXdEZWNvcmF0aW9uKVxuXG4gIGdldFJlbGF0aXZlSW5kZXg6IC0+XG4gICAgQGN1cnJlbnRNYXRjaEluZGV4IC0gQGluaXRpYWxDdXJyZW50TWF0Y2hJbmRleFxuIl19
