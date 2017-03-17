(function() {
  var CompositeDisposable, CursorStyleManager, Disposable, Point, getCursorNode, getOffset, isSpecMode, lineHeight, ref, setStyle, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Point = ref.Point, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  swrap = require('./selection-wrapper');

  isSpecMode = atom.inSpecMode();

  lineHeight = null;

  getCursorNode = function(editorElement, cursor) {
    var cursorsComponent;
    cursorsComponent = editorElement.component.linesComponent.cursorsComponent;
    return cursorsComponent.cursorNodesById[cursor.id];
  };

  getOffset = function(submode, cursor) {
    var bufferPoint, editor, offset, screenPoint, selection;
    selection = cursor.selection;
    switch (submode) {
      case 'characterwise':
        if (selection.isReversed()) {
          return;
        }
        if (cursor.isAtBeginningOfLine()) {
          return new Point(-1, 0);
        } else {
          return new Point(0, -1);
        }
        break;
      case 'blockwise':
        if (cursor.isAtBeginningOfLine() || selection.isReversed()) {
          return;
        }
        return new Point(0, -1);
      case 'linewise':
        bufferPoint = swrap(selection).getBufferPositionFor('head', {
          fromProperty: true
        });
        editor = cursor.editor;
        if (selection.isReversed()) {
          bufferPoint.row = selection.getBufferRange().start.row;
        }
        if (editor.isSoftWrapped()) {
          screenPoint = editor.screenPositionForBufferPosition(bufferPoint);
          offset = screenPoint.traversalFrom(cursor.getScreenPosition());
        } else {
          offset = bufferPoint.traversalFrom(cursor.getBufferPosition());
        }
        if (!selection.isReversed() && cursor.isAtBeginningOfLine()) {
          offset.row = -1;
        }
        return offset;
    }
  };

  setStyle = function(style, arg) {
    var column, row;
    row = arg.row, column = arg.column;
    if (row !== 0) {
      style.setProperty('top', (row * lineHeight) + "em");
    }
    if (column !== 0) {
      style.setProperty('left', column + "ch");
    }
    return new Disposable(function() {
      style.removeProperty('top');
      return style.removeProperty('left');
    });
  };

  CursorStyleManager = (function() {
    function CursorStyleManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editorElement = ref1.editorElement, this.editor = ref1.editor;
      this.lineHeightObserver = atom.config.observe('editor.lineHeight', (function(_this) {
        return function(newValue) {
          lineHeight = newValue;
          return _this.refresh();
        };
      })(this));
    }

    CursorStyleManager.prototype.destroy = function() {
      var ref1, ref2;
      if ((ref1 = this.styleDisporser) != null) {
        ref1.dispose();
      }
      this.lineHeightObserver.dispose();
      return ref2 = {}, this.styleDisporser = ref2.styleDisporser, this.lineHeightObserver = ref2.lineHeightObserver, ref2;
    };

    CursorStyleManager.prototype.refresh = function() {
      var cursor, cursorNode, cursors, cursorsToShow, i, j, len, len1, mode, offset, ref1, ref2, results, submode;
      ref1 = this.vimState, mode = ref1.mode, submode = ref1.submode;
      if ((ref2 = this.styleDisporser) != null) {
        ref2.dispose();
      }
      this.styleDisporser = new CompositeDisposable;
      if (!(mode === 'visual' && this.vimState.getConfig('showCursorInVisualMode'))) {
        return;
      }
      cursors = cursorsToShow = this.editor.getCursors();
      if (submode === 'blockwise') {
        cursorsToShow = this.vimState.getBlockwiseSelections().map(function(bs) {
          return bs.getHeadSelection().cursor;
        });
      }
      for (i = 0, len = cursors.length; i < len; i++) {
        cursor = cursors[i];
        if (indexOf.call(cursorsToShow, cursor) >= 0) {
          if (!cursor.isVisible()) {
            cursor.setVisible(true);
          }
        } else {
          if (cursor.isVisible()) {
            cursor.setVisible(false);
          }
        }
      }
      if (isSpecMode) {
        return;
      }
      this.editorElement.component.updateSync();
      results = [];
      for (j = 0, len1 = cursorsToShow.length; j < len1; j++) {
        cursor = cursorsToShow[j];
        if (offset = getOffset(submode, cursor)) {
          if (cursorNode = getCursorNode(this.editorElement, cursor)) {
            results.push(this.styleDisporser.add(setStyle(cursorNode.style, offset)));
          } else {
            results.push(void 0);
          }
        }
      }
      return results;
    };

    return CursorStyleManager;

  })();

  module.exports = CursorStyleManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvY3Vyc29yLXN0eWxlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxrSUFBQTtJQUFBOztFQUFBLE1BQTJDLE9BQUEsQ0FBUSxNQUFSLENBQTNDLEVBQUMsaUJBQUQsRUFBUSwyQkFBUixFQUFvQjs7RUFFcEIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFDUixVQUFBLEdBQWEsSUFBSSxDQUFDLFVBQUwsQ0FBQTs7RUFDYixVQUFBLEdBQWE7O0VBRWIsYUFBQSxHQUFnQixTQUFDLGFBQUQsRUFBZ0IsTUFBaEI7QUFDZCxRQUFBO0lBQUEsZ0JBQUEsR0FBbUIsYUFBYSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7V0FDMUQsZ0JBQWdCLENBQUMsZUFBZ0IsQ0FBQSxNQUFNLENBQUMsRUFBUDtFQUZuQjs7RUFNaEIsU0FBQSxHQUFZLFNBQUMsT0FBRCxFQUFVLE1BQVY7QUFDVixRQUFBO0lBQUMsWUFBYTtBQUNkLFlBQU8sT0FBUDtBQUFBLFdBQ08sZUFEUDtRQUVJLElBQVUsU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUFWO0FBQUEsaUJBQUE7O1FBQ0EsSUFBRyxNQUFNLENBQUMsbUJBQVAsQ0FBQSxDQUFIO2lCQUNNLElBQUEsS0FBQSxDQUFNLENBQUMsQ0FBUCxFQUFVLENBQVYsRUFETjtTQUFBLE1BQUE7aUJBR00sSUFBQSxLQUFBLENBQU0sQ0FBTixFQUFTLENBQUMsQ0FBVixFQUhOOztBQUZHO0FBRFAsV0FRTyxXQVJQO1FBU0ksSUFBVSxNQUFNLENBQUMsbUJBQVAsQ0FBQSxDQUFBLElBQWdDLFNBQVMsQ0FBQyxVQUFWLENBQUEsQ0FBMUM7QUFBQSxpQkFBQTs7ZUFDSSxJQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBQyxDQUFWO0FBVlIsV0FZTyxVQVpQO1FBYUks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LFNBQUMsRUFBRDtpQkFBUSxFQUFFLENBQUMsZ0JBQUgsQ0FBQSxDQUFxQixDQUFDO1FBQTlCLENBQXZDLEVBRGxCOztBQUlBLFdBQUEseUNBQUE7O1FBQ0UsSUFBRyxhQUFVLGFBQVYsRUFBQSxNQUFBLE1BQUg7VUFDRSxJQUFBLENBQStCLE1BQU0sQ0FBQyxTQUFQLENBQUEsQ0FBL0I7WUFBQSxNQUFNLENBQUMsVUFBUCxDQUFrQixJQUFsQixFQUFBO1dBREY7U0FBQSxNQUFBO1VBR0UsSUFBNEIsTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUE1QjtZQUFBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLEtBQWxCLEVBQUE7V0FIRjs7QUFERjtNQU9BLElBQVUsVUFBVjtBQUFBLGVBQUE7O01BU0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsVUFBekIsQ0FBQTtBQUVBO1dBQUEsaURBQUE7O1lBQWlDLE1BQUEsR0FBUyxTQUFBLENBQVUsT0FBVixFQUFtQixNQUFuQjtVQUN4QyxJQUFHLFVBQUEsR0FBYSxhQUFBLENBQWMsSUFBQyxDQUFBLGFBQWYsRUFBOEIsTUFBOUIsQ0FBaEI7eUJBQ0UsSUFBQyxDQUFBLGNBQWMsQ0FBQyxHQUFoQixDQUFvQixRQUFBLENBQVMsVUFBVSxDQUFDLEtBQXBCLEVBQTJCLE1BQTNCLENBQXBCLEdBREY7V0FBQSxNQUFBO2lDQUFBOzs7QUFERjs7SUE3Qk87Ozs7OztFQWlDWCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQWpHakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7UG9pbnQsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuaXNTcGVjTW9kZSA9IGF0b20uaW5TcGVjTW9kZSgpXG5saW5lSGVpZ2h0ID0gbnVsbFxuXG5nZXRDdXJzb3JOb2RlID0gKGVkaXRvckVsZW1lbnQsIGN1cnNvcikgLT5cbiAgY3Vyc29yc0NvbXBvbmVudCA9IGVkaXRvckVsZW1lbnQuY29tcG9uZW50LmxpbmVzQ29tcG9uZW50LmN1cnNvcnNDb21wb25lbnRcbiAgY3Vyc29yc0NvbXBvbmVudC5jdXJzb3JOb2Rlc0J5SWRbY3Vyc29yLmlkXVxuXG4jIFJldHVybiBjdXJzb3Igc3R5bGUgb2Zmc2V0KHRvcCwgbGVmdClcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5nZXRPZmZzZXQgPSAoc3VibW9kZSwgY3Vyc29yKSAtPlxuICB7c2VsZWN0aW9ufSA9IGN1cnNvclxuICBzd2l0Y2ggc3VibW9kZVxuICAgIHdoZW4gJ2NoYXJhY3Rlcndpc2UnXG4gICAgICByZXR1cm4gaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgaWYgY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKVxuICAgICAgICBuZXcgUG9pbnQoLTEsIDApXG4gICAgICBlbHNlXG4gICAgICAgIG5ldyBQb2ludCgwLCAtMSlcblxuICAgIHdoZW4gJ2Jsb2Nrd2lzZSdcbiAgICAgIHJldHVybiBpZiBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpIG9yIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIG5ldyBQb2ludCgwLCAtMSlcblxuICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgYnVmZmVyUG9pbnQgPSBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgZnJvbVByb3BlcnR5OiB0cnVlKVxuICAgICAgZWRpdG9yID0gY3Vyc29yLmVkaXRvclxuXG4gICAgICAjIEZJWE1FOiBUaGlzIGFkanVzdG1lbnQgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnkgaWYgc2VsZWN0aW9uIHByb3BlcnR5IGlzIGFsd2F5cyBiZWxpZXZhYmxlLlxuICAgICAgaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgICBidWZmZXJQb2ludC5yb3cgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydC5yb3dcblxuICAgICAgaWYgZWRpdG9yLmlzU29mdFdyYXBwZWQoKVxuICAgICAgICBzY3JlZW5Qb2ludCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclBvaW50KVxuICAgICAgICBvZmZzZXQgPSBzY3JlZW5Qb2ludC50cmF2ZXJzYWxGcm9tKGN1cnNvci5nZXRTY3JlZW5Qb3NpdGlvbigpKVxuICAgICAgZWxzZVxuICAgICAgICBvZmZzZXQgPSBidWZmZXJQb2ludC50cmF2ZXJzYWxGcm9tKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgaWYgbm90IHNlbGVjdGlvbi5pc1JldmVyc2VkKCkgYW5kIGN1cnNvci5pc0F0QmVnaW5uaW5nT2ZMaW5lKClcbiAgICAgICAgb2Zmc2V0LnJvdyA9IC0xXG4gICAgICBvZmZzZXRcblxuc2V0U3R5bGUgPSAoc3R5bGUsIHtyb3csIGNvbHVtbn0pIC0+XG4gIHN0eWxlLnNldFByb3BlcnR5KCd0b3AnLCBcIiN7cm93ICogbGluZUhlaWdodH1lbVwiKSB1bmxlc3Mgcm93IGlzIDBcbiAgc3R5bGUuc2V0UHJvcGVydHkoJ2xlZnQnLCBcIiN7Y29sdW1ufWNoXCIpIHVubGVzcyBjb2x1bW4gaXMgMFxuICBuZXcgRGlzcG9zYWJsZSAtPlxuICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KCd0b3AnKVxuICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KCdsZWZ0JylcblxuIyBEaXNwbGF5IGN1cnNvciBpbiB2aXN1YWwgbW9kZS5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQ3Vyc29yU3R5bGVNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yRWxlbWVudCwgQGVkaXRvcn0gPSBAdmltU3RhdGVcbiAgICBAbGluZUhlaWdodE9ic2VydmVyID0gYXRvbS5jb25maWcub2JzZXJ2ZSAnZWRpdG9yLmxpbmVIZWlnaHQnLCAobmV3VmFsdWUpID0+XG4gICAgICBsaW5lSGVpZ2h0ID0gbmV3VmFsdWVcbiAgICAgIEByZWZyZXNoKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdHlsZURpc3BvcnNlcj8uZGlzcG9zZSgpXG4gICAgQGxpbmVIZWlnaHRPYnNlcnZlci5kaXNwb3NlKClcbiAgICB7QHN0eWxlRGlzcG9yc2VyLCBAbGluZUhlaWdodE9ic2VydmVyfSA9IHt9XG5cbiAgcmVmcmVzaDogLT5cbiAgICB7bW9kZSwgc3VibW9kZX0gPSBAdmltU3RhdGVcbiAgICBAc3R5bGVEaXNwb3JzZXI/LmRpc3Bvc2UoKVxuICAgIEBzdHlsZURpc3BvcnNlciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgcmV0dXJuIHVubGVzcyBtb2RlIGlzICd2aXN1YWwnIGFuZCBAdmltU3RhdGUuZ2V0Q29uZmlnKCdzaG93Q3Vyc29ySW5WaXN1YWxNb2RlJylcblxuICAgIGN1cnNvcnMgPSBjdXJzb3JzVG9TaG93ID0gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBpZiBzdWJtb2RlIGlzICdibG9ja3dpc2UnXG4gICAgICBjdXJzb3JzVG9TaG93ID0gQHZpbVN0YXRlLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKS5tYXAgKGJzKSAtPiBicy5nZXRIZWFkU2VsZWN0aW9uKCkuY3Vyc29yXG5cbiAgICAjIHVwZGF0ZSB2aXNpYmlsaXR5XG4gICAgZm9yIGN1cnNvciBpbiBjdXJzb3JzXG4gICAgICBpZiBjdXJzb3IgaW4gY3Vyc29yc1RvU2hvd1xuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZSh0cnVlKSB1bmxlc3MgY3Vyc29yLmlzVmlzaWJsZSgpXG4gICAgICBlbHNlXG4gICAgICAgIGN1cnNvci5zZXRWaXNpYmxlKGZhbHNlKSBpZiBjdXJzb3IuaXNWaXNpYmxlKClcblxuICAgICMgW0ZJWE1FXSBJbiBzcGVjIG1vZGUsIHdlIHNraXAgaGVyZSBzaW5jZSBub3QgYWxsIHNwZWMgaGF2ZSBkb20gYXR0YWNoZWQuXG4gICAgcmV0dXJuIGlmIGlzU3BlY01vZGVcblxuICAgICMgW05PVEVdIEluIEJsb2Nrd2lzZVNlbGVjdCB3ZSBhZGQgc2VsZWN0aW9ucyhhbmQgY29ycmVzcG9uZGluZyBjdXJzb3JzKSBpbiBibHVrLlxuICAgICMgQnV0IGNvcnJlc3BvbmRpbmcgY3Vyc29yc0NvbXBvbmVudChIVE1MIGVsZW1lbnQpIGlzIGFkZGVkIGluIHN5bmMuXG4gICAgIyBTbyB0byBtb2RpZnkgc3R5bGUgb2YgY3Vyc29yc0NvbXBvbmVudCwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgY29ycmVzcG9uZGluZyBjdXJzb3JzQ29tcG9uZW50XG4gICAgIyBpcyBhdmFpbGFibGUgYnkgY29tcG9uZW50IGluIHN5bmMgdG8gbW9kZWwuXG4gICAgIyBbRklYTUVdXG4gICAgIyBXaGVuIGN0cmwtZiwgYiwgZCwgdSBpbiB2TCBtb2RlLCBJIGhhZCB0byBjYWxsIHVwZGF0ZVN5bmMgdG8gc2hvdyBjdXJzb3IgY29ycmVjdGx5XG4gICAgIyBCdXQgaXQgd2Fzbid0IG5lY2Vzc2FyeSBiZWZvcmUgSSBpaW50cm9kdWNlIGBtb3ZlVG9GaXJzdENoYXJhY3Rlck9uVmVydGljYWxNb3Rpb25gIGZvciBgY3RybC1mYFxuICAgIEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC51cGRhdGVTeW5jKClcblxuICAgIGZvciBjdXJzb3IgaW4gY3Vyc29yc1RvU2hvdyB3aGVuIG9mZnNldCA9IGdldE9mZnNldChzdWJtb2RlLCBjdXJzb3IpXG4gICAgICBpZiBjdXJzb3JOb2RlID0gZ2V0Q3Vyc29yTm9kZShAZWRpdG9yRWxlbWVudCwgY3Vyc29yKVxuICAgICAgICBAc3R5bGVEaXNwb3JzZXIuYWRkIHNldFN0eWxlKGN1cnNvck5vZGUuc3R5bGUsIG9mZnNldClcblxubW9kdWxlLmV4cG9ydHMgPSBDdXJzb3JTdHlsZU1hbmFnZXJcbiJdfQ==
