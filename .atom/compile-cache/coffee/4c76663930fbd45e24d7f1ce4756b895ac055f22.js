(function() {
  var HoverManager, swrap;

  swrap = require('./selection-wrapper');

  module.exports = HoverManager = (function() {
    function HoverManager(vimState) {
      var ref;
      this.vimState = vimState;
      ref = this.vimState, this.editor = ref.editor, this.editorElement = ref.editorElement;
      this.container = document.createElement('div');
      this.decorationOptions = {
        type: 'overlay',
        item: this.container
      };
      this.reset();
    }

    HoverManager.prototype.getPoint = function() {
      var swrapOptions;
      if (this.vimState.isMode('visual', 'blockwise')) {
        return this.vimState.getLastBlockwiseSelection().getHeadSelection().getHeadBufferPosition();
      } else {
        swrapOptions = {
          fromProperty: true,
          allowFallback: true
        };
        return swrap(this.editor.getLastSelection()).getBufferPositionFor('head', swrapOptions);
      }
    };

    HoverManager.prototype.set = function(text, point, options) {
      var ref, ref1;
      if (point == null) {
        point = this.getPoint();
      }
      if (options == null) {
        options = {};
      }
      if (this.marker == null) {
        this.marker = this.editor.markBufferPosition(point);
        this.editor.decorateMarker(this.marker, this.decorationOptions);
      }
      if ((ref = options.classList) != null ? ref.length : void 0) {
        (ref1 = this.container.classList).add.apply(ref1, options.classList);
      }
      return this.container.textContent = text;
    };

    HoverManager.prototype.reset = function() {
      var ref;
      this.container.className = 'vim-mode-plus-hover';
      if ((ref = this.marker) != null) {
        ref.destroy();
      }
      return this.marker = null;
    };

    HoverManager.prototype.destroy = function() {
      this.vimState = {}.vimState;
      return this.reset();
    };

    return HoverManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvaG92ZXItbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBRVIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHNCQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixNQUE0QixJQUFDLENBQUEsUUFBN0IsRUFBQyxJQUFDLENBQUEsYUFBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLG9CQUFBO01BQ1gsSUFBQyxDQUFBLFNBQUQsR0FBYSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNiLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtRQUFDLElBQUEsRUFBTSxTQUFQO1FBQWtCLElBQUEsRUFBTSxJQUFDLENBQUEsU0FBekI7O01BQ3JCLElBQUMsQ0FBQSxLQUFELENBQUE7SUFKVzs7MkJBTWIsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsUUFBakIsRUFBMkIsV0FBM0IsQ0FBSDtlQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMseUJBQVYsQ0FBQSxDQUFxQyxDQUFDLGdCQUF0QyxDQUFBLENBQXdELENBQUMscUJBQXpELENBQUEsRUFERjtPQUFBLE1BQUE7UUFHRSxZQUFBLEdBQWU7VUFBQyxZQUFBLEVBQWMsSUFBZjtVQUFxQixhQUFBLEVBQWUsSUFBcEM7O2VBQ2YsS0FBQSxDQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUFOLENBQWlDLENBQUMsb0JBQWxDLENBQXVELE1BQXZELEVBQStELFlBQS9ELEVBSkY7O0lBRFE7OzJCQU9WLEdBQUEsR0FBSyxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQTBCLE9BQTFCO0FBQ0gsVUFBQTs7UUFEVSxRQUFNLElBQUMsQ0FBQSxRQUFELENBQUE7OztRQUFhLFVBQVE7O01BQ3JDLElBQU8sbUJBQVA7UUFDRSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBMkIsS0FBM0I7UUFDVixJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsSUFBQyxDQUFBLE1BQXhCLEVBQWdDLElBQUMsQ0FBQSxpQkFBakMsRUFGRjs7TUFJQSwyQ0FBb0IsQ0FBRSxlQUF0QjtRQUNFLFFBQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxTQUFYLENBQW9CLENBQUMsR0FBckIsYUFBeUIsT0FBTyxDQUFDLFNBQWpDLEVBREY7O2FBRUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxXQUFYLEdBQXlCO0lBUHRCOzsyQkFTTCxLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7O1dBQ2hCLENBQUUsT0FBVCxDQUFBOzthQUNBLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFITDs7MkJBS1AsT0FBQSxHQUFTLFNBQUE7TUFDTixJQUFDLENBQUEsV0FBWSxHQUFaO2FBQ0YsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUZPOzs7OztBQS9CWCIsInNvdXJjZXNDb250ZW50IjpbInN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSG92ZXJNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudH0gPSBAdmltU3RhdGVcbiAgICBAY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAZGVjb3JhdGlvbk9wdGlvbnMgPSB7dHlwZTogJ292ZXJsYXknLCBpdGVtOiBAY29udGFpbmVyfVxuICAgIEByZXNldCgpXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgaWYgQHZpbVN0YXRlLmlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgICBAdmltU3RhdGUuZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbigpLmdldEhlYWRTZWxlY3Rpb24oKS5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIGVsc2VcbiAgICAgIHN3cmFwT3B0aW9ucyA9IHtmcm9tUHJvcGVydHk6IHRydWUsIGFsbG93RmFsbGJhY2s6IHRydWV9XG4gICAgICBzd3JhcChAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ2hlYWQnLCBzd3JhcE9wdGlvbnMpXG5cbiAgc2V0OiAodGV4dCwgcG9pbnQ9QGdldFBvaW50KCksIG9wdGlvbnM9e30pIC0+XG4gICAgdW5sZXNzIEBtYXJrZXI/XG4gICAgICBAbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICBAZWRpdG9yLmRlY29yYXRlTWFya2VyKEBtYXJrZXIsIEBkZWNvcmF0aW9uT3B0aW9ucylcblxuICAgIGlmIG9wdGlvbnMuY2xhc3NMaXN0Py5sZW5ndGhcbiAgICAgIEBjb250YWluZXIuY2xhc3NMaXN0LmFkZChvcHRpb25zLmNsYXNzTGlzdC4uLilcbiAgICBAY29udGFpbmVyLnRleHRDb250ZW50ID0gdGV4dFxuXG4gIHJlc2V0OiAtPlxuICAgIEBjb250YWluZXIuY2xhc3NOYW1lID0gJ3ZpbS1tb2RlLXBsdXMtaG92ZXInXG4gICAgQG1hcmtlcj8uZGVzdHJveSgpXG4gICAgQG1hcmtlciA9IG51bGxcblxuICBkZXN0cm95OiAtPlxuICAgIHtAdmltU3RhdGV9ID0ge31cbiAgICBAcmVzZXQoKVxuIl19
