(function() {
  var CompositeDisposable, MinimapGitDiffBinding, repositoryForPath,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  repositoryForPath = require('./helpers').repositoryForPath;

  module.exports = MinimapGitDiffBinding = (function() {
    MinimapGitDiffBinding.prototype.active = false;

    function MinimapGitDiffBinding(minimap) {
      var repository;
      this.minimap = minimap;
      this.destroy = bind(this.destroy, this);
      this.updateDiffs = bind(this.updateDiffs, this);
      this.decorations = {};
      this.markers = null;
      this.subscriptions = new CompositeDisposable;
      if (this.minimap == null) {
        return console.warn('minimap-git-diff binding created without a minimap');
      }
      this.editor = this.minimap.getTextEditor();
      this.subscriptions.add(this.minimap.onDidDestroy(this.destroy));
      if (repository = this.getRepo()) {
        this.subscriptions.add(this.editor.getBuffer().onDidStopChanging(this.updateDiffs));
        this.subscriptions.add(repository.onDidChangeStatuses((function(_this) {
          return function() {
            return _this.scheduleUpdate();
          };
        })(this)));
        this.subscriptions.add(repository.onDidChangeStatus((function(_this) {
          return function(changedPath) {
            if (changedPath === _this.editor.getPath()) {
              return _this.scheduleUpdate();
            }
          };
        })(this)));
        this.subscriptions.add(repository.onDidDestroy((function(_this) {
          return function() {
            return _this.destroy();
          };
        })(this)));
        this.subscriptions.add(atom.config.observe('minimap-git-diff.useGutterDecoration', (function(_this) {
          return function(useGutterDecoration) {
            _this.useGutterDecoration = useGutterDecoration;
            return _this.scheduleUpdate();
          };
        })(this)));
      }
      this.scheduleUpdate();
    }

    MinimapGitDiffBinding.prototype.cancelUpdate = function() {
      return clearImmediate(this.immediateId);
    };

    MinimapGitDiffBinding.prototype.scheduleUpdate = function() {
      this.cancelUpdate();
      return this.immediateId = setImmediate(this.updateDiffs);
    };

    MinimapGitDiffBinding.prototype.updateDiffs = function() {
      this.removeDecorations();
      if (this.getPath() && (this.diffs = this.getDiffs())) {
        return this.addDecorations(this.diffs);
      }
    };

    MinimapGitDiffBinding.prototype.addDecorations = function(diffs) {
      var endRow, i, len, newLines, newStart, oldLines, oldStart, ref, results, startRow;
      results = [];
      for (i = 0, len = diffs.length; i < len; i++) {
        ref = diffs[i], oldStart = ref.oldStart, newStart = ref.newStart, oldLines = ref.oldLines, newLines = ref.newLines;
        startRow = newStart - 1;
        endRow = newStart + newLines - 2;
        if (oldLines === 0 && newLines > 0) {
          results.push(this.markRange(startRow, endRow, '.git-line-added'));
        } else if (newLines === 0 && oldLines > 0) {
          results.push(this.markRange(startRow, startRow, '.git-line-removed'));
        } else {
          results.push(this.markRange(startRow, endRow, '.git-line-modified'));
        }
      }
      return results;
    };

    MinimapGitDiffBinding.prototype.removeDecorations = function() {
      var i, len, marker, ref;
      if (this.markers == null) {
        return;
      }
      ref = this.markers;
      for (i = 0, len = ref.length; i < len; i++) {
        marker = ref[i];
        marker.destroy();
      }
      return this.markers = null;
    };

    MinimapGitDiffBinding.prototype.markRange = function(startRow, endRow, scope) {
      var marker, type;
      if (this.editor.isDestroyed()) {
        return;
      }
      marker = this.editor.markBufferRange([[startRow, 0], [endRow, 2e308]], {
        invalidate: 'never'
      });
      type = this.useGutterDecoration ? 'gutter' : 'line';
      this.minimap.decorateMarker(marker, {
        type: type,
        scope: ".minimap ." + type + " " + scope,
        plugin: 'git-diff'
      });
      if (this.markers == null) {
        this.markers = [];
      }
      return this.markers.push(marker);
    };

    MinimapGitDiffBinding.prototype.destroy = function() {
      this.removeDecorations();
      this.subscriptions.dispose();
      this.diffs = null;
      return this.minimap = null;
    };

    MinimapGitDiffBinding.prototype.getPath = function() {
      var ref;
      return (ref = this.editor.getBuffer()) != null ? ref.getPath() : void 0;
    };

    MinimapGitDiffBinding.prototype.getRepositories = function() {
      return atom.project.getRepositories().filter(function(repo) {
        return repo != null;
      });
    };

    MinimapGitDiffBinding.prototype.getRepo = function() {
      return this.repository != null ? this.repository : this.repository = repositoryForPath(this.editor.getPath());
    };

    MinimapGitDiffBinding.prototype.getDiffs = function() {
      var e, ref;
      try {
        return (ref = this.getRepo()) != null ? ref.getLineDiffs(this.getPath(), this.editor.getBuffer().getText()) : void 0;
      } catch (error) {
        e = error;
        return null;
      }
    };

    return MinimapGitDiffBinding;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbWluaW1hcC1naXQtZGlmZi9saWIvbWluaW1hcC1naXQtZGlmZi1iaW5kaW5nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkRBQUE7SUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3ZCLG9CQUFxQixPQUFBLENBQVEsV0FBUjs7RUFFdEIsTUFBTSxDQUFDLE9BQVAsR0FDTTtvQ0FFSixNQUFBLEdBQVE7O0lBRUssK0JBQUMsT0FBRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsVUFBRDs7O01BQ1osSUFBQyxDQUFBLFdBQUQsR0FBZTtNQUNmLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BRXJCLElBQU8sb0JBQVA7QUFDRSxlQUFPLE9BQU8sQ0FBQyxJQUFSLENBQWEsb0RBQWIsRUFEVDs7TUFHQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBVCxDQUFBO01BRVYsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxDQUFzQixJQUFDLENBQUEsT0FBdkIsQ0FBbkI7TUFFQSxJQUFHLFVBQUEsR0FBYSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQWhCO1FBQ0UsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBLENBQW1CLENBQUMsaUJBQXBCLENBQXNDLElBQUMsQ0FBQSxXQUF2QyxDQUFuQjtRQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixVQUFVLENBQUMsbUJBQVgsQ0FBK0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDaEQsS0FBQyxDQUFBLGNBQUQsQ0FBQTtVQURnRDtRQUFBLENBQUEs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T0FBQSxhQUFBO1FBRU07QUFDSixlQUFPLEtBSFQ7O0lBRFE7Ozs7O0FBakZaIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntyZXBvc2l0b3J5Rm9yUGF0aH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE1pbmltYXBHaXREaWZmQmluZGluZ1xuXG4gIGFjdGl2ZTogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKEBtaW5pbWFwKSAtPlxuICAgIEBkZWNvcmF0aW9ucyA9IHt9XG4gICAgQG1hcmtlcnMgPSBudWxsXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgdW5sZXNzIEBtaW5pbWFwP1xuICAgICAgcmV0dXJuIGNvbnNvbGUud2FybiAnbWluaW1hcC1naXQtZGlmZiBiaW5kaW5nIGNyZWF0ZWQgd2l0aG91dCBhIG1pbmltYXAnXG5cbiAgICBAZWRpdG9yID0gQG1pbmltYXAuZ2V0VGV4dEVkaXRvcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1pbmltYXAub25EaWREZXN0cm95IEBkZXN0cm95XG5cbiAgICBpZiByZXBvc2l0b3J5ID0gQGdldFJlcG8oKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTdG9wQ2hhbmdpbmcgQHVwZGF0ZURpZmZzXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzID0+XG4gICAgICAgIEBzY2hlZHVsZVVwZGF0ZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1cyAoY2hhbmdlZFBhdGgpID0+XG4gICAgICAgIEBzY2hlZHVsZVVwZGF0ZSgpIGlmIGNoYW5nZWRQYXRoIGlzIEBlZGl0b3IuZ2V0UGF0aCgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcmVwb3NpdG9yeS5vbkRpZERlc3Ryb3kgPT5cbiAgICAgICAgQGRlc3Ryb3koKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ21pbmltYXAtZ2l0LWRpZmYudXNlR3V0dGVyRGVjb3JhdGlvbicsIChAdXNlR3V0dGVyRGVjb3JhdGlvbikgPT5cbiAgICAgICAgQHNjaGVkdWxlVXBkYXRlKClcblxuICAgIEBzY2hlZHVsZVVwZGF0ZSgpXG5cbiAgY2FuY2VsVXBkYXRlOiAtPlxuICAgIGNsZWFySW1tZWRpYXRlKEBpbW1lZGlhdGVJZClcblxuICBzY2hlZHVsZVVwZGF0ZTogLT5cbiAgICBAY2FuY2VsVXBkYXRlKClcbiAgICBAaW1tZWRpYXRlSWQgPSBzZXRJbW1lZGlhdGUoQHVwZGF0ZURpZmZzKVxuXG4gIHVwZGF0ZURpZmZzOiA9PlxuICAgIEByZW1vdmVEZWNvcmF0aW9ucygpXG4gICAgaWYgQGdldFBhdGgoKSBhbmQgQGRpZmZzID0gQGdldERpZmZzKClcbiAgICAgIEBhZGREZWNvcmF0aW9ucyhAZGlmZnMpXG5cbiAgYWRkRGVjb3JhdGlvbnM6IChkaWZmcykgLT5cbiAgICBmb3Ige29sZFN0YXJ0LCBuZXdTdGFydCwgb2xkTGluZXMsIG5ld0xpbmVzfSBpbiBkaWZmc1xuICAgICAgc3RhcnRSb3cgPSBuZXdTdGFydCAtIDFcbiAgICAgIGVuZFJvdyA9IG5ld1N0YXJ0ICsgbmV3TGluZXMgLSAyXG4gICAgICBpZiBvbGRMaW5lcyBpcyAwIGFuZCBuZXdMaW5lcyA+IDBcbiAgICAgICAgQG1hcmtSYW5nZShzdGFydFJvdywgZW5kUm93LCAnLmdpdC1saW5lLWFkZGVkJylcbiAgICAgIGVsc2UgaWYgbmV3TGluZXMgaXMgMCBhbmQgb2xkTGluZXMgPiAwXG4gICAgICAgIEBtYXJrUmFuZ2Uoc3RhcnRSb3csIHN0YXJ0Um93LCAnLmdpdC1saW5lLXJlbW92ZWQnKVxuICAgICAgZWxzZVxuICAgICAgICBAbWFya1JhbmdlKHN0YXJ0Um93LCBlbmRSb3csICcuZ2l0LWxpbmUtbW9kaWZpZWQnKVxuXG4gIHJlbW92ZURlY29yYXRpb25zOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQG1hcmtlcnM/XG4gICAgbWFya2VyLmRlc3Ryb3koKSBmb3IgbWFya2VyIGluIEBtYXJrZXJzXG4gICAgQG1hcmtlcnMgPSBudWxsXG5cbiAgbWFya1JhbmdlOiAoc3RhcnRSb3csIGVuZFJvdywgc2NvcGUpIC0+XG4gICAgcmV0dXJuIGlmIEBlZGl0b3IuaXNEZXN0cm95ZWQoKVxuICAgIG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclJhbmdlKFtbc3RhcnRSb3csIDBdLCBbZW5kUm93LCBJbmZpbml0eV1dLCBpbnZhbGlkYXRlOiAnbmV2ZXInKVxuICAgIHR5cGUgPSBpZiBAdXNlR3V0dGVyRGVjb3JhdGlvbiB0aGVuICdndXR0ZXInIGVsc2UgJ2xpbmUnXG4gICAgQG1pbmltYXAuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7dHlwZSwgc2NvcGU6IFwiLm1pbmltYXAgLiN7dHlwZX0gI3tzY29wZX1cIiwgcGx1Z2luOiAnZ2l0LWRpZmYnfSlcbiAgICBAbWFya2VycyA/PSBbXVxuICAgIEBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gIGRlc3Ryb3k6ID0+XG4gICAgQHJlbW92ZURlY29yYXRpb25zKClcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAZGlmZnMgPSBudWxsXG4gICAgQG1pbmltYXAgPSBudWxsXG5cbiAgZ2V0UGF0aDogLT4gQGVkaXRvci5nZXRCdWZmZXIoKT8uZ2V0UGF0aCgpXG5cbiAgZ2V0UmVwb3NpdG9yaWVzOiAtPiBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkuZmlsdGVyIChyZXBvKSAtPiByZXBvP1xuXG4gIGdldFJlcG86IC0+IEByZXBvc2l0b3J5ID89IHJlcG9zaXRvcnlGb3JQYXRoKEBlZGl0b3IuZ2V0UGF0aCgpKVxuXG4gIGdldERpZmZzOiAtPlxuICAgIHRyeVxuICAgICAgcmV0dXJuIEBnZXRSZXBvKCk/LmdldExpbmVEaWZmcyhAZ2V0UGF0aCgpLCBAZWRpdG9yLmdldEJ1ZmZlcigpLmdldFRleHQoKSlcbiAgICBjYXRjaCBlXG4gICAgICByZXR1cm4gbnVsbFxuIl19
