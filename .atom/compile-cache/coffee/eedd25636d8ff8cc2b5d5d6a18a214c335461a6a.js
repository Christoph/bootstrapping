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

    MinimapHighlightSelected.prototype.activate = function(state) {};

    MinimapHighlightSelected.prototype.consumeMinimapServiceV1 = function(minimap) {
      this.minimap = minimap;
      return this.minimap.registerPlugin('highlight-selected', this);
    };

    MinimapHighlightSelected.prototype.consumeHighlightSelectedServiceV1 = function(highlightSelected) {
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
      this.highlightSelected.onDidAddMarker((function(_this) {
        return function(marker) {
          return _this.markerCreated(marker);
        };
      })(this));
      this.highlightSelected.onDidAddSelectedMarker((function(_this) {
        return function(marker) {
          return _this.markerCreated(marker, true);
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

    MinimapHighlightSelected.prototype.markerCreated = function(marker, selected) {
      var activeMinimap, className, decoration;
      if (selected == null) {
        selected = false;
      }
      activeMinimap = this.minimap.getActiveMinimap();
      if (activeMinimap == null) {
        return;
      }
      className = 'highlight-selected';
      if (selected) {
        className += ' selected';
      }
      decoration = activeMinimap.decorateMarker(marker, {
        type: 'highlight',
        "class": className
      });
      return this.decorations.push(decoration);
    };

    MinimapHighlightSelected.prototype.markersDestroyed = function() {
      this.decorations.forEach(function(decoration) {
        return decoration.destroy();
      });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbWluaW1hcC1oaWdobGlnaHQtc2VsZWN0ZWQvbGliL21pbmltYXAtaGlnaGxpZ2h0LXNlbGVjdGVkLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOERBQUE7SUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLFdBQVI7O0VBQ3ZCLGtCQUFtQixPQUFBLENBQVEsWUFBUjs7RUFFZDtJQUNTLGtDQUFBOzs7OztNQUNYLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7SUFEVjs7dUNBR2IsUUFBQSxHQUFVLFNBQUMsS0FBRCxHQUFBOzt1Q0FFVix1QkFBQSxHQUF5QixTQUFDLE9BQUQ7TUFBQyxJQUFDLENBQUEsVUFBRDthQUN4QixJQUFDLENBQUEsT0FBTyxDQUFDLGNBQVQsQ0FBd0Isb0JBQXhCLEVBQThDLElBQTlDO0lBRHVCOzt1Q0FHekIsaUNBQUEsR0FBbUMsU0FBQyxpQkFBRDtNQUFDLElBQUMsQ0FBQSxvQkFBRDtNQUNsQyxJQUFXLHNCQUFBLElBQWMscUJBQXpCO2VBQUEsSUFBQyxDQUFBLElBQUQsQ0FBQSxFQUFBOztJQURpQzs7dUNBR25DLFVBQUEsR0FBWSxTQUFBO01BQ1YsSUFBQyxDQUFBLGdCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsY0FBRCxHQUFrQjtNQUNsQixJQUFDLENBQUEsd0JBQUQsR0FBNEI7TUFDNUIsSUFBQyxDQUFBLGlCQUFELEdBQXFCO2FBQ3JCLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFMRDs7dUNBT1osUUFBQSxHQUFVLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7dUNBRVYsY0FBQSxHQUFnQixTQUFBO01BQ2QsSUFBVSxJQUFDLENBQUEsTUFBWDtBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBVCxDQUF1QixJQUFDLENBQUEsSUFBeEIsQ0FBbkI7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxlQUFULENBQXlCLElBQUMsQ0FBQSxPQUExQixDQUFuQjtNQUVBLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFFVixJQUFXLDhCQUFYO2VBQUEsSUFBQyxDQUFBLElBQUQsQ0FBQSxFQUFBOztJQVJjOzt1Q0FVaEIsSUFBQSxHQUFNLFNBQUE7TUFDSixJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLGlCQUFpQixDQUFDLGNBQW5CLENBQWtDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO2lCQUFZLEtBQUMsQ0FBQSxhQUFELENBQWUsTUFBZjtRQUFaO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFsQztNQUNBLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxzQkFBbkIsQ0FBMEMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7aUJBQVksS0FBQyxDQUFBLGFBQUQsQ0FBZSxNQUFmLEVBQXVCLElBQXZCO1FBQVo7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFDO2FBQ0EsSUFBQyxDQUFBLGlCQUFpQixDQUFDLHFCQUFuQixDQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGdCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekM7SUFKSTs7dUNBTU4sT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBOztXQUFZLENBQUUsT0FBZCxDQUFzQixTQUFDLFVBQUQ7aUJBQWdCLFVBQVUsQ0FBQyxPQUFYLENBQUE7UUFBaEIsQ0FBdEI7O2FBQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZTtJQUZSOzt1Q0FJVCxhQUFBLEdBQWUsU0FBQyxNQUFELEVBQVMsUUFBVDtBQUNiLFVBQUE7O1FBRHNCLFdBQVc7O01BQ2pDLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxnQkFBVCxDQUFBO01BQ2hCLElBQWMscUJBQWQ7QUFBQSxlQUFBOztNQUNBLFNBQUEsR0FBYTtNQUNiLElBQTRCLFFBQTVCO1FBQUEsU0FBQSxJQUFhLFlBQWI7O01BRUEsVUFBQSxHQUFhLGFBQWEsQ0FBQyxjQUFkLENBQTZCLE1BQTdCLEVBQ1g7UUFBQyxJQUFBLEVBQU0sV0FBUDtRQUFvQixDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQTNCO09BRFc7YUFFYixJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsVUFBbEI7SUFSYTs7dUNBVWYsZ0JBQUEsR0FBa0IsU0FBQTtNQUNoQixJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBcUIsU0FBQyxVQUFEO2VBQWdCLFVBQVUsQ0FBQyxPQUFYLENBQUE7TUFBaEIsQ0FBckI7YUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlO0lBRkM7O3VDQUlsQixnQkFBQSxHQUFrQixTQUFBO01BQ2hCLElBQUEsQ0FBYyxJQUFDLENBQUEsTUFBZjtBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLE1BQUQsR0FBVTtNQUNWLElBQUMsQ0FBQSxPQUFELENBQUE7YUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQUxnQjs7Ozs7O0VBT3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUk7QUFqRXJCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xue3JlcXVpcmVQYWNrYWdlc30gPSByZXF1aXJlICdhdG9tLXV0aWxzJ1xuXG5jbGFzcyBNaW5pbWFwSGlnaGxpZ2h0U2VsZWN0ZWRcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG5cbiAgY29uc3VtZU1pbmltYXBTZXJ2aWNlVjE6IChAbWluaW1hcCkgLT5cbiAgICBAbWluaW1hcC5yZWdpc3RlclBsdWdpbiAnaGlnaGxpZ2h0LXNlbGVjdGVkJywgdGhpc1xuXG4gIGNvbnN1bWVIaWdobGlnaHRTZWxlY3RlZFNlcnZpY2VWMTogKEBoaWdobGlnaHRTZWxlY3RlZCkgLT5cbiAgICBAaW5pdCgpIGlmIEBtaW5pbWFwPyBhbmQgQGFjdGl2ZT9cblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBkZWFjdGl2YXRlUGx1Z2luKClcbiAgICBAbWluaW1hcFBhY2thZ2UgPSBudWxsXG4gICAgQGhpZ2hsaWdodFNlbGVjdGVkUGFja2FnZSA9IG51bGxcbiAgICBAaGlnaGxpZ2h0U2VsZWN0ZWQgPSBudWxsXG4gICAgQG1pbmltYXAgPSBudWxsXG5cbiAgaXNBY3RpdmU6IC0+IEBhY3RpdmVcblxuICBhY3RpdmF0ZVBsdWdpbjogLT5cbiAgICByZXR1cm4gaWYgQGFjdGl2ZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtaW5pbWFwLm9uRGlkQWN0aXZhdGUgQGluaXRcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1pbmltYXAub25EaWREZWFjdGl2YXRlIEBkaXNwb3NlXG5cbiAgICBAYWN0aXZlID0gdHJ1ZVxuXG4gICAgQGluaXQoKSBpZiBAaGlnaGxpZ2h0U2VsZWN0ZWQ/XG5cbiAgaW5pdDogPT5cbiAgICBAZGVjb3JhdGlvbnMgPSBbXVxuICAgIEBoaWdobGlnaHRTZWxlY3RlZC5vbkRpZEFkZE1hcmtlciAobWFya2VyKSA9PiBAbWFya2VyQ3JlYXRlZChtYXJrZXIpXG4gICAgQGhpZ2hsaWdodFNlbGVjdGVkLm9uRGlkQWRkU2VsZWN0ZWRNYXJrZXIgKG1hcmtlcikgPT4gQG1hcmtlckNyZWF0ZWQobWFya2VyLCB0cnVlKVxuICAgIEBoaWdobGlnaHRTZWxlY3RlZC5vbkRpZFJlbW92ZUFsbE1hcmtlcnMgPT4gQG1hcmtlcnNEZXN0cm95ZWQoKVxuXG4gIGRpc3Bvc2U6ID0+XG4gICAgQGRlY29yYXRpb25zPy5mb3JFYWNoIChkZWNvcmF0aW9uKSAtPiBkZWNvcmF0aW9uLmRlc3Ryb3koKVxuICAgIEBkZWNvcmF0aW9ucyA9IG51bGxcblxuICBtYXJrZXJDcmVhdGVkOiAobWFya2VyLCBzZWxlY3RlZCA9IGZhbHNlKSA9PlxuICAgIGFjdGl2ZU1pbmltYXAgPSBAbWluaW1hcC5nZXRBY3RpdmVNaW5pbWFwKClcbiAgICByZXR1cm4gdW5sZXNzIGFjdGl2ZU1pbmltYXA/XG4gICAgY2xhc3NOYW1lICA9ICdoaWdobGlnaHQtc2VsZWN0ZWQnXG4gICAgY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnIGlmIHNlbGVjdGVkXG5cbiAgICBkZWNvcmF0aW9uID0gYWN0aXZlTWluaW1hcC5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsXG4gICAgICB7dHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiBjbGFzc05hbWUgfSlcbiAgICBAZGVjb3JhdGlvbnMucHVzaCBkZWNvcmF0aW9uXG5cbiAgbWFya2Vyc0Rlc3Ryb3llZDogPT5cbiAgICBAZGVjb3JhdGlvbnMuZm9yRWFjaCAoZGVjb3JhdGlvbikgLT4gZGVjb3JhdGlvbi5kZXN0cm95KClcbiAgICBAZGVjb3JhdGlvbnMgPSBbXVxuXG4gIGRlYWN0aXZhdGVQbHVnaW46IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYWN0aXZlXG5cbiAgICBAYWN0aXZlID0gZmFsc2VcbiAgICBAZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IE1pbmltYXBIaWdobGlnaHRTZWxlY3RlZFxuIl19
