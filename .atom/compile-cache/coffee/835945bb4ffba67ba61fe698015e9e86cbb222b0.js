(function() {
  var CompositeDisposable, MinimapHighlightSelected, requirePackages,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('event-kit').CompositeDisposable;

  requirePackages = require('atom-utils').requirePackages;

  MinimapHighlightSelected = (function() {
    function MinimapHighlightSelected() {
      this.markersDestroyed = bind(this.markersDestroyed, this);
      this.markerCreated = bind(this.markerCreated, this);
      this.dispose = bind(this.dispose, this);
      this.init = bind(this.init, this);
      this.subscriptions = new CompositeDisposable;
    }

    MinimapHighlightSelected.prototype.activate = function(state) {
      if (!atom.inSpecMode()) {
        return require('atom-package-deps').install('minimap-highlight-selected', true);
      }
    };

    MinimapHighlightSelected.prototype.consumeMinimapServiceV1 = function(minimap1) {
      this.minimap = minimap1;
      return this.minimap.registerPlugin('highlight-selected', this);
    };

    MinimapHighlightSelected.prototype.consumeHighlightSelectedServiceV2 = function(highlightSelected) {
      this.highlightSelected = highlightSelected;
      if ((this.minimap != null) && (this.active != null)) {
        return this.init();
      }
    };

    MinimapHighlightSelected.prototype.deactivate = function() {
      this.deactivatePlugin();
      this.minimapPackage = null;
      this.highlightSelectedPackage = null;
      this.highlightSelected = null;
      return this.minimap = null;
    };

    MinimapHighlightSelected.prototype.isActive = function() {
      return this.active;
    };

    MinimapHighlightSelected.prototype.activatePlugin = function() {
      if (this.active) {
        return;
      }
      this.subscriptions.add(this.minimap.onDidActivate(this.init));
      this.subscriptions.add(this.minimap.onDidDeactivate(this.dispose));
      this.active = true;
      if (this.highlightSelected != null) {
        return this.init();
      }
    };

    MinimapHighlightSelected.prototype.init = function() {
      this.decorations = [];
      this.highlightSelected.onDidAddMarkerForEditor((function(_this) {
        return function(options) {
          return _this.markerCreated(options);
        };
      })(this));
      this.highlightSelected.onDidAddSelectedMarkerForEditor((function(_this) {
        return function(options) {
          return _this.markerCreated(options, true);
        };
      })(this));
      return this.highlightSelected.onDidRemoveAllMarkers((function(_this) {
        return function() {
          return _this.markersDestroyed();
        };
      })(this));
    };

    MinimapHighlightSelected.prototype.dispose = function() {
      var ref;
      if ((ref = this.decorations) != null) {
        ref.forEach(function(decoration) {
          return decoration.destroy();
        });
      }
      return this.decorations = null;
    };

    MinimapHighlightSelected.prototype.markerCreated = function(options, selected) {
      var className, decoration, minimap;
      if (selected == null) {
        selected = false;
      }
      minimap = this.minimap.minimapForEditor(options.editor);
      if (minimap == null) {
        return;
      }
      className = 'highlight-selected';
      if (selected) {
        className += ' selected';
      }
      decoration = minimap.decorateMarker(options.marker, {
        type: 'highlight',
        "class": className
      });
      return this.decorations.push(decoration);
    };

    MinimapHighlightSelected.prototype.markersDestroyed = function() {
      var ref;
      if ((ref = this.decorations) != null) {
        ref.forEach(function(decoration) {
          return decoration.destroy();
        });
      }
      return this.decorations = [];
    };

    MinimapHighlightSelected.prototype.deactivatePlugin = function() {
      if (!this.active) {
        return;
      }
      this.active = false;
      this.dispose();
      return this.subscriptions.dispose();
    };

    return MinimapHighlightSelected;

  })();

  module.exports = new MinimapHighlightSelected;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvbWluaW1hcC1oaWdobGlnaHQtc2VsZWN0ZWQvbGliL21pbmltYXAtaGlnaGxpZ2h0LXNlbGVjdGVkLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOERBQUE7SUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLFdBQVI7O0VBQ3ZCLGtCQUFtQixPQUFBLENBQVEsWUFBUjs7RUFFZDtJQUNTLGtDQUFBOzs7OztNQUNYLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7SUFEVjs7dUNBR2IsUUFBQSxHQUFVLFNBQUMsS0FBRDtNQUNSLElBQUEsQ0FBTyxJQUFJLENBQUMsVUFBTCxDQUFBLENBQVA7ZUFDRSxPQUFBLENBQVEsbUJBQVIsQ0FBNEIsQ0FBQyxPQUE3QixDQUFxQyw0QkFBckMsRUFBbUUsSUFBbkUsRUFERjs7SUFEUTs7dUNBSVYsdUJBQUEsR0FBeUIsU0FBQyxRQUFEO01BQUMsSUFBQyxDQUFBLFVBQUQ7YUFDeEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxjQUFULENBQXdCLG9CQUF4QixFQUE4QyxJQUE5QztJQUR1Qjs7dUNBR3pCLGlDQUFBLEdBQW1DLFNBQUMsaUJBQUQ7TUFBQyxJQUFDLENBQUEsb0JBQUQ7TUFDbEMsSUFBVyxzQkFBQSxJQUFjLHFCQUF6QjtlQUFBLElBQUMsQ0FBQSxJQUFELENBQUEsRUFBQTs7SUFEaUM7O3VDQUduQyxVQUFBLEdBQVksU0FBQTtNQUNWLElBQUMsQ0FBQSxnQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLGNBQUQsR0FBa0I7TUFDbEIsSUFBQyxDQUFBLHdCQUFELEdBQTRCO01BQzVCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjthQUNyQixJQUFDLENBQUEsT0FBRCxHQUFXO0lBTEQ7O3VDQU9aLFFBQUEsR0FBVSxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O3VDQUVWLGNBQUEsR0FBZ0IsU0FBQTtNQUNkLElBQVUsSUFBQyxDQUFBLE1BQVg7QUFBQSxlQUFBOztNQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsT0FBTyxDQUFDLGFBQVQsQ0FBdUIsSUFBQyxDQUFBLElBQXhCLENBQW5CO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxPQUFPLENBQUMsZUFBVCxDQUF5QixJQUFDLENBQUEsT0FBMUIsQ0FBbkI7TUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVO01BRVYsSUFBVyw4QkFBWDtlQUFBLElBQUMsQ0FBQSxJQUFELENBQUEsRUFBQTs7SUFSYzs7dUNBVWhCLElBQUEsR0FBTSxTQUFBO01BQ0osSUFBQyxDQUFBLFdBQUQsR0FBZTtNQUNmLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyx1QkFBbkIsQ0FBMkMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE9BQUQ7aUJBQWEsS0FBQyxDQUFBLGFBQUQsQ0FBZSxPQUFmO1FBQWI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNDO01BQ0EsSUFBQyxDQUFBLGlCQUFpQixDQUFDLCtCQUFuQixDQUFtRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRDtpQkFBYSxLQUFDLENBQUEsYUFBRCxDQUFlLE9BQWYsRUFBd0IsSUFBeEI7UUFBYjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkQ7YUFDQSxJQUFDLENBQUEsaUJBQWlCLENBQUMscUJBQW5CLENBQXlDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsZ0JBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QztJQUpJOzt1Q0FNTixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7O1dBQVksQ0FBRSxPQUFkLENBQXNCLFNBQUMsVUFBRDtpQkFBZ0IsVUFBVSxDQUFDLE9BQVgsQ0FBQTtRQUFoQixDQUF0Qjs7YUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlO0lBRlI7O3VDQUlULGFBQUEsR0FBZSxTQUFDLE9BQUQsRUFBVSxRQUFWO0FBQ2IsVUFBQTs7UUFEdUIsV0FBVzs7TUFDbEMsT0FBQSxHQUFVLElBQUMsQ0FBQSxPQUFPLENBQUMsZ0JBQVQsQ0FBMEIsT0FBTyxDQUFDLE1BQWxDO01BQ1YsSUFBYyxlQUFkO0FBQUEsZUFBQTs7TUFDQSxTQUFBLEdBQWE7TUFDYixJQUE0QixRQUE1QjtRQUFBLFNBQUEsSUFBYSxZQUFiOztNQUVBLFVBQUEsR0FBYSxPQUFPLENBQUMsY0FBUixDQUF1QixPQUFPLENBQUMsTUFBL0IsRUFDWDtRQUFDLElBQUEsRUFBTSxXQUFQO1FBQW9CLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBM0I7T0FEVzthQUViLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixVQUFsQjtJQVJhOzt1Q0FVZixnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7O1dBQVksQ0FBRSxPQUFkLENBQXNCLFNBQUMsVUFBRDtpQkFBZ0IsVUFBVSxDQUFDLE9BQVgsQ0FBQTtRQUFoQixDQUF0Qjs7YUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlO0lBRkM7O3VDQUlsQixnQkFBQSxHQUFrQixTQUFBO01BQ2hCLElBQUEsQ0FBYyxJQUFDLENBQUEsTUFBZjtBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLE1BQUQsR0FBVTtNQUNWLElBQUMsQ0FBQSxPQUFELENBQUE7YUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQUxnQjs7Ozs7O0VBT3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUk7QUFuRXJCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xue3JlcXVpcmVQYWNrYWdlc30gPSByZXF1aXJlICdhdG9tLXV0aWxzJ1xuXG5jbGFzcyBNaW5pbWFwSGlnaGxpZ2h0U2VsZWN0ZWRcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgdW5sZXNzIGF0b20uaW5TcGVjTW9kZSgpXG4gICAgICByZXF1aXJlKCdhdG9tLXBhY2thZ2UtZGVwcycpLmluc3RhbGwgJ21pbmltYXAtaGlnaGxpZ2h0LXNlbGVjdGVkJywgdHJ1ZVxuXG4gIGNvbnN1bWVNaW5pbWFwU2VydmljZVYxOiAoQG1pbmltYXApIC0+XG4gICAgQG1pbmltYXAucmVnaXN0ZXJQbHVnaW4gJ2hpZ2hsaWdodC1zZWxlY3RlZCcsIHRoaXNcblxuICBjb25zdW1lSGlnaGxpZ2h0U2VsZWN0ZWRTZXJ2aWNlVjI6IChAaGlnaGxpZ2h0U2VsZWN0ZWQpIC0+XG4gICAgQGluaXQoKSBpZiBAbWluaW1hcD8gYW5kIEBhY3RpdmU/XG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZGVhY3RpdmF0ZVBsdWdpbigpXG4gICAgQG1pbmltYXBQYWNrYWdlID0gbnVsbFxuICAgIEBoaWdobGlnaHRTZWxlY3RlZFBhY2thZ2UgPSBudWxsXG4gICAgQGhpZ2hsaWdodFNlbGVjdGVkID0gbnVsbFxuICAgIEBtaW5pbWFwID0gbnVsbFxuXG4gIGlzQWN0aXZlOiAtPiBAYWN0aXZlXG5cbiAgYWN0aXZhdGVQbHVnaW46IC0+XG4gICAgcmV0dXJuIGlmIEBhY3RpdmVcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbWluaW1hcC5vbkRpZEFjdGl2YXRlIEBpbml0XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtaW5pbWFwLm9uRGlkRGVhY3RpdmF0ZSBAZGlzcG9zZVxuXG4gICAgQGFjdGl2ZSA9IHRydWVcblxuICAgIEBpbml0KCkgaWYgQGhpZ2hsaWdodFNlbGVjdGVkP1xuXG4gIGluaXQ6ID0+XG4gICAgQGRlY29yYXRpb25zID0gW11cbiAgICBAaGlnaGxpZ2h0U2VsZWN0ZWQub25EaWRBZGRNYXJrZXJGb3JFZGl0b3IgKG9wdGlvbnMpID0+IEBtYXJrZXJDcmVhdGVkKG9wdGlvbnMpXG4gICAgQGhpZ2hsaWdodFNlbGVjdGVkLm9uRGlkQWRkU2VsZWN0ZWRNYXJrZXJGb3JFZGl0b3IgKG9wdGlvbnMpID0+IEBtYXJrZXJDcmVhdGVkKG9wdGlvbnMsIHRydWUpXG4gICAgQGhpZ2hsaWdodFNlbGVjdGVkLm9uRGlkUmVtb3ZlQWxsTWFya2VycyA9PiBAbWFya2Vyc0Rlc3Ryb3llZCgpXG5cbiAgZGlzcG9zZTogPT5cbiAgICBAZGVjb3JhdGlvbnM/LmZvckVhY2ggKGRlY29yYXRpb24pIC0+IGRlY29yYXRpb24uZGVzdHJveSgpXG4gICAgQGRlY29yYXRpb25zID0gbnVsbFxuXG4gIG1hcmtlckNyZWF0ZWQ6IChvcHRpb25zLCBzZWxlY3RlZCA9IGZhbHNlKSA9PlxuICAgIG1pbmltYXAgPSBAbWluaW1hcC5taW5pbWFwRm9yRWRpdG9yKG9wdGlvbnMuZWRpdG9yKVxuICAgIHJldHVybiB1bmxlc3MgbWluaW1hcD9cbiAgICBjbGFzc05hbWUgID0gJ2hpZ2hsaWdodC1zZWxlY3RlZCdcbiAgICBjbGFzc05hbWUgKz0gJyBzZWxlY3RlZCcgaWYgc2VsZWN0ZWRcblxuICAgIGRlY29yYXRpb24gPSBtaW5pbWFwLmRlY29yYXRlTWFya2VyKG9wdGlvbnMubWFya2VyLFxuICAgICAge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogY2xhc3NOYW1lIH0pXG4gICAgQGRlY29yYXRpb25zLnB1c2ggZGVjb3JhdGlvblxuXG4gIG1hcmtlcnNEZXN0cm95ZWQ6ID0+XG4gICAgQGRlY29yYXRpb25zPy5mb3JFYWNoIChkZWNvcmF0aW9uKSAtPiBkZWNvcmF0aW9uLmRlc3Ryb3koKVxuICAgIEBkZWNvcmF0aW9ucyA9IFtdXG5cbiAgZGVhY3RpdmF0ZVBsdWdpbjogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBhY3RpdmVcblxuICAgIEBhY3RpdmUgPSBmYWxzZVxuICAgIEBkaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTWluaW1hcEhpZ2hsaWdodFNlbGVjdGVkXG4iXX0=
