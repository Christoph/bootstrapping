(function() {
  var BlockwiseSelection, Range, _, getBufferRows, isEmpty, ref, sortRanges, swrap;

  Range = require('atom').Range;

  _ = require('underscore-plus');

  ref = require('./utils'), sortRanges = ref.sortRanges, getBufferRows = ref.getBufferRows, isEmpty = ref.isEmpty;

  swrap = require('./selection-wrapper');

  BlockwiseSelection = (function() {
    BlockwiseSelection.prototype.editor = null;

    BlockwiseSelection.prototype.selections = null;

    BlockwiseSelection.prototype.goalColumn = null;

    BlockwiseSelection.prototype.reversed = false;

    function BlockwiseSelection(selection) {
      var i, len, memberSelection, ref1;
      this.editor = selection.editor;
      this.initialize(selection);
      ref1 = this.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        memberSelection = ref1[i];
        swrap(memberSelection).saveProperties();
        swrap(memberSelection).setWise('blockwise');
      }
    }

    BlockwiseSelection.prototype.getSelections = function() {
      return this.selections;
    };

    BlockwiseSelection.prototype.isEmpty = function() {
      return this.getSelections().every(isEmpty);
    };

    BlockwiseSelection.prototype.initialize = function(selection) {
      var end, i, j, len, range, ranges, ref1, ref2, results, reversed, start, wasReversed;
      this.goalColumn = selection.cursor.goalColumn;
      this.selections = [selection];
      wasReversed = reversed = selection.isReversed();
      range = selection.getBufferRange();
      if (range.end.column === 0) {
        range.end.row -= 1;
      }
      if (this.goalColumn != null) {
        if (wasReversed) {
          range.start.column = this.goalColumn;
        } else {
          range.end.column = this.goalColumn + 1;
        }
      }
      if (range.start.column >= range.end.column) {
        reversed = !reversed;
        range = range.translate([0, 1], [0, -1]);
      }
      start = range.start, end = range.end;
      ranges = (function() {
        results = [];
        for (var i = ref1 = start.row, ref2 = end.row; ref1 <= ref2 ? i <= ref2 : i >= ref2; ref1 <= ref2 ? i++ : i--){ results.push(i); }
        return results;
      }).apply(this).map(function(row) {
        return [[row, start.column], [row, end.column]];
      });
      selection.setBufferRange(ranges.shift(), {
        reversed: reversed
      });
      for (j = 0, len = ranges.length; j < len; j++) {
        range = ranges[j];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      if (wasReversed) {
        this.reverse();
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.isReversed = function() {
      return this.reversed;
    };

    BlockwiseSelection.prototype.reverse = function() {
      return this.reversed = !this.reversed;
    };

    BlockwiseSelection.prototype.updateGoalColumn = function() {
      var i, len, ref1, results, selection;
      if (this.goalColumn != null) {
        ref1 = this.selections;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          selection = ref1[i];
          results.push(selection.cursor.goalColumn = this.goalColumn);
        }
        return results;
      }
    };

    BlockwiseSelection.prototype.isSingleRow = function() {
      return this.selections.length === 1;
    };

    BlockwiseSelection.prototype.getHeight = function() {
      var endRow, ref1, startRow;
      ref1 = this.getBufferRowRange(), startRow = ref1[0], endRow = ref1[1];
      return (endRow - startRow) + 1;
    };

    BlockwiseSelection.prototype.getStartSelection = function() {
      return this.selections[0];
    };

    BlockwiseSelection.prototype.getEndSelection = function() {
      return _.last(this.selections);
    };

    BlockwiseSelection.prototype.getHeadSelection = function() {
      if (this.isReversed()) {
        return this.getStartSelection();
      } else {
        return this.getEndSelection();
      }
    };

    BlockwiseSelection.prototype.getTailSelection = function() {
      if (this.isReversed()) {
        return this.getEndSelection();
      } else {
        return this.getStartSelection();
      }
    };

    BlockwiseSelection.prototype.getHeadBufferPosition = function() {
      return this.getHeadSelection().getHeadBufferPosition();
    };

    BlockwiseSelection.prototype.getTailBufferPosition = function() {
      return this.getTailSelection().getTailBufferPosition();
    };

    BlockwiseSelection.prototype.getStartBufferPosition = function() {
      return this.getStartSelection().getBufferRange().start;
    };

    BlockwiseSelection.prototype.getEndBufferPosition = function() {
      return this.getEndSelection().getBufferRange().end;
    };

    BlockwiseSelection.prototype.getBufferRowRange = function() {
      var endRow, startRow;
      startRow = this.getStartSelection().getBufferRowRange()[0];
      endRow = this.getEndSelection().getBufferRowRange()[0];
      return [startRow, endRow];
    };

    BlockwiseSelection.prototype.headReversedStateIsInSync = function() {
      return this.isReversed() === this.getHeadSelection().isReversed();
    };

    BlockwiseSelection.prototype.setSelectedBufferRanges = function(ranges, arg) {
      var i, len, range, reversed;
      reversed = arg.reversed;
      sortRanges(ranges);
      range = ranges.shift();
      this.setHeadBufferRange(range, {
        reversed: reversed
      });
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.setPositionForSelections = function(which) {
      var i, len, ref1, results, selection;
      ref1 = this.selections;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        results.push(swrap(selection).setBufferPositionTo(which));
      }
      return results;
    };

    BlockwiseSelection.prototype.clearSelections = function(arg) {
      var except, i, len, ref1, results, selection;
      except = (arg != null ? arg : {}).except;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection !== except) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.setHeadBufferPosition = function(point) {
      var head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      return head.cursor.setBufferPosition(point);
    };

    BlockwiseSelection.prototype.removeSelection = function(selection) {
      _.remove(this.selections, selection);
      return selection.destroy();
    };

    BlockwiseSelection.prototype.setHeadBufferRange = function(range, options) {
      var base, goalColumn, head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      head.setBufferRange(range, options);
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    BlockwiseSelection.prototype.getCharacterwiseProperties = function() {
      var end, head, ref1, ref2, start, tail;
      head = this.getHeadBufferPosition();
      tail = this.getTailBufferPosition();
      if (this.isReversed()) {
        ref1 = [head, tail], start = ref1[0], end = ref1[1];
      } else {
        ref2 = [tail, head], start = ref2[0], end = ref2[1];
      }
      if (!(this.isSingleRow() || this.headReversedStateIsInSync())) {
        start.column -= 1;
        end.column += 1;
      }
      return {
        head: head,
        tail: tail
      };
    };

    BlockwiseSelection.prototype.getBufferRange = function() {
      var end, start;
      if (this.headReversedStateIsInSync()) {
        start = this.getStartSelection.getBufferrange().start;
        end = this.getEndSelection.getBufferrange().end;
      } else {
        start = this.getStartSelection.getBufferrange().end.translate([0, -1]);
        end = this.getEndSelection.getBufferrange().start.translate([0, +1]);
      }
      return {
        start: start,
        end: end
      };
    };

    BlockwiseSelection.prototype.restoreCharacterwise = function() {
      var base, goalColumn, head, properties;
      if (this.isEmpty()) {
        return;
      }
      properties = this.getCharacterwiseProperties();
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      swrap(head).selectByProperties(properties);
      if (head.getBufferRange().end.column === 0) {
        swrap(head).translateSelectionEndAndClip('forward');
      }
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    BlockwiseSelection.prototype.autoscroll = function(options) {
      return this.getHeadSelection().autoscroll(options);
    };

    BlockwiseSelection.prototype.autoscrollIfReversed = function(options) {
      if (this.isReversed()) {
        return this.autoscroll(options);
      }
    };

    return BlockwiseSelection;

  })();

  module.exports = BlockwiseSelection;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvYmxvY2t3aXNlLXNlbGVjdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixNQUF1QyxPQUFBLENBQVEsU0FBUixDQUF2QyxFQUFDLDJCQUFELEVBQWEsaUNBQWIsRUFBNEI7O0VBQzVCLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBRUY7aUNBQ0osTUFBQSxHQUFROztpQ0FDUixVQUFBLEdBQVk7O2lDQUNaLFVBQUEsR0FBWTs7aUNBQ1osUUFBQSxHQUFVOztJQUVHLDRCQUFDLFNBQUQ7QUFDWCxVQUFBO01BQUMsSUFBQyxDQUFBLFNBQVUsVUFBVjtNQUNGLElBQUMsQ0FBQSxVQUFELENBQVksU0FBWjtBQUVBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxLQUFBLENBQU0sZUFBTixDQUFzQixDQUFDLGNBQXZCLENBQUE7UUFDQSxLQUFBLENBQU0sZUFBTixDQUFzQixDQUFDLE9BQXZCLENBQStCLFdBQS9CO0FBRkY7SUFKVzs7aUNBUWIsYUFBQSxHQUFlLFNBQUE7YUFDYixJQUFDLENBQUE7SUFEWTs7aUNBR2YsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsYUFBRCxDQUFBLENBQWdCLENBQUMsS0FBakIsQ0FBdUIsT0FBdkI7SUFETzs7aUNBR1QsVUFBQSxHQUFZLFNBQUMsU0FBRDtBQUNWLFVBQUE7TUFBQyxJQUFDLENBQUEsYUFBYyxTQUFTLENBQUMsT0FBeEI7TUFDRixJQUFDLENBQUEsVUFBRCxHQUFjLENBQUMsU0FBRDtNQUNkLFdBQUEsR0FBYyxRQUFBLEdBQVcsU0FBUyxDQUFDLFVBQVYsQ0FBQTtNQUV6QixLQUFBLEdBQVEsU0FBUyxDQUFDLGNBQVYs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Q0FVaEIsb0JBQUEsR0FBc0IsU0FBQTtBQUdwQixVQUFBO01BQUEsSUFBVSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVY7QUFBQSxlQUFBOztNQUVBLFVBQUEsR0FBYSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtNQUNiLElBQUEsR0FBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtNQUNQLElBQUMsQ0FBQSxlQUFELENBQWlCO1FBQUEsTUFBQSxFQUFRLElBQVI7T0FBakI7TUFDQyxhQUFjLElBQUksQ0FBQztNQUNwQixLQUFBLENBQU0sSUFBTixDQUFXLENBQUMsa0JBQVosQ0FBK0IsVUFBL0I7TUFFQSxJQUFHLElBQUksQ0FBQyxjQUFMLENBQUEsQ0FBcUIsQ0FBQyxHQUFHLENBQUMsTUFBMUIsS0FBb0MsQ0FBdkM7UUFDRSxLQUFBLENBQU0sSUFBTixDQUFXLENBQUMsNEJBQVosQ0FBeUMsU0FBekMsRUFERjs7TUFHQSxJQUF3QyxrQkFBeEM7NkRBQVcsQ0FBQyxpQkFBRCxDQUFDLGFBQWMsV0FBMUI7O0lBZG9COztpQ0FnQnRCLFVBQUEsR0FBWSxTQUFDLE9BQUQ7YUFDVixJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQUFtQixDQUFDLFVBQXBCLENBQStCLE9BQS9CO0lBRFU7O2lDQUdaLG9CQUFBLEdBQXNCLFNBQUMsT0FBRDtNQUdwQixJQUF3QixJQUFDLENBQUEsVUFBRCxDQUFBLENBQXhCO2VBQUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaLEVBQUE7O0lBSG9COzs7Ozs7RUFLeEIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF0TWpCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG57c29ydFJhbmdlcywgZ2V0QnVmZmVyUm93cywgaXNFbXB0eX0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG5jbGFzcyBCbG9ja3dpc2VTZWxlY3Rpb25cbiAgZWRpdG9yOiBudWxsXG4gIHNlbGVjdGlvbnM6IG51bGxcbiAgZ29hbENvbHVtbjogbnVsbFxuICByZXZlcnNlZDogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKHNlbGVjdGlvbikgLT5cbiAgICB7QGVkaXRvcn0gPSBzZWxlY3Rpb25cbiAgICBAaW5pdGlhbGl6ZShzZWxlY3Rpb24pXG5cbiAgICBmb3IgbWVtYmVyU2VsZWN0aW9uIGluIEBnZXRTZWxlY3Rpb25zKClcbiAgICAgIHN3cmFwKG1lbWJlclNlbGVjdGlvbikuc2F2ZVByb3BlcnRpZXMoKVxuICAgICAgc3dyYXAobWVtYmVyU2VsZWN0aW9uKS5zZXRXaXNlKCdibG9ja3dpc2UnKVxuXG4gIGdldFNlbGVjdGlvbnM6IC0+XG4gICAgQHNlbGVjdGlvbnNcblxuICBpc0VtcHR5OiAtPlxuICAgIEBnZXRTZWxlY3Rpb25zKCkuZXZlcnkoaXNFbXB0eSlcblxuICBpbml0aWFsaXplOiAoc2VsZWN0aW9uKSAtPlxuICAgIHtAZ29hbENvbHVtbn0gPSBzZWxlY3Rpb24uY3Vyc29yXG4gICAgQHNlbGVjdGlvbnMgPSBbc2VsZWN0aW9uXVxuICAgIHdhc1JldmVyc2VkID0gcmV2ZXJzZWQgPSBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG5cbiAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgaWYgcmFuZ2UuZW5kLmNvbHVtbiBpcyAwXG4gICAgICByYW5nZS5lbmQucm93IC09IDFcblxuICAgIGlmIEBnb2FsQ29sdW1uP1xuICAgICAgaWYgd2FzUmV2ZXJzZWRcbiAgICAgICAgcmFuZ2Uuc3RhcnQuY29sdW1uID0gQGdvYWxDb2x1bW5cbiAgICAgIGVsc2VcbiAgICAgICAgcmFuZ2UuZW5kLmNvbHVtbiA9IEBnb2FsQ29sdW1uICsgMVxuXG4gICAgaWYgcmFuZ2Uuc3RhcnQuY29sdW1uID49IHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgIHJldmVyc2VkID0gbm90IHJldmVyc2VkXG4gICAgICByYW5nZSA9IHJhbmdlLnRyYW5zbGF0ZShbMCwgMV0sIFswLCAtMV0pXG5cbiAgICB7c3RhcnQsIGVuZH0gPSByYW5nZVxuICAgIHJhbmdlcyA9IFtzdGFydC5yb3cuLmVuZC5yb3ddLm1hcCAocm93KSAtPlxuICAgICAgW1tyb3csIHN0YXJ0LmNvbHVtbl0sIFtyb3csIGVuZC5jb2x1bW5dXVxuXG4gICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlcy5zaGlmdCgpLCB7cmV2ZXJzZWR9KVxuICAgIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICAgIEBzZWxlY3Rpb25zLnB1c2goQGVkaXRvci5hZGRTZWxlY3Rpb25Gb3JCdWZmZXJSYW5nZShyYW5nZSwge3JldmVyc2VkfSkpXG4gICAgQHJldmVyc2UoKSBpZiB3YXNSZXZlcnNlZFxuICAgIEB1cGRhdGVHb2FsQ29sdW1uKClcblxuICBpc1JldmVyc2VkOiAtPlxuICAgIEByZXZlcnNlZFxuXG4gIHJldmVyc2U6IC0+XG4gICAgQHJldmVyc2VkID0gbm90IEByZXZlcnNlZFxuXG4gIHVwZGF0ZUdvYWxDb2x1bW46IC0+XG4gICAgaWYgQGdvYWxDb2x1bW4/XG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBzZWxlY3Rpb25zXG4gICAgICAgIHNlbGVjdGlvbi5jdXJzb3IuZ29hbENvbHVtbiA9IEBnb2FsQ29sdW1uXG5cbiAgaXNTaW5nbGVSb3c6IC0+XG4gICAgQHNlbGVjdGlvbnMubGVuZ3RoIGlzIDFcblxuICBnZXRIZWlnaHQ6IC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gQGdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICAoZW5kUm93IC0gc3RhcnRSb3cpICsgMVxuXG4gIGdldFN0YXJ0U2VsZWN0aW9uOiAtPlxuICAgIEBzZWxlY3Rpb25zWzBdXG5cbiAgZ2V0RW5kU2VsZWN0aW9uOiAtPlxuICAgIF8ubGFzdChAc2VsZWN0aW9ucylcblxuICBnZXRIZWFkU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc1JldmVyc2VkKClcbiAgICAgIEBnZXRTdGFydFNlbGVjdGlvbigpXG4gICAgZWxzZVxuICAgICAgQGdldEVuZFNlbGVjdGlvbigpXG5cbiAgZ2V0VGFpbFNlbGVjdGlvbjogLT5cbiAgICBpZiBAaXNSZXZlcnNlZCgpXG4gICAgICBAZ2V0RW5kU2VsZWN0aW9uKClcbiAgICBlbHNlXG4gICAgICBAZ2V0U3RhcnRTZWxlY3Rpb24oKVxuXG4gIGdldEhlYWRCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0SGVhZFNlbGVjdGlvbigpLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRUYWlsU2VsZWN0aW9uKCkuZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICBnZXRTdGFydEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRTdGFydFNlbGVjdGlvbigpLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnRcblxuICBnZXRFbmRCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0RW5kU2VsZWN0aW9uKCkuZ2V0QnVmZmVyUmFuZ2UoKS5lbmRcblxuICBnZXRCdWZmZXJSb3dSYW5nZTogLT5cbiAgICBzdGFydFJvdyA9IEBnZXRTdGFydFNlbGVjdGlvbigpLmdldEJ1ZmZlclJvd1JhbmdlKClbMF1cbiAgICBlbmRSb3cgPSBAZ2V0RW5kU2VsZWN0aW9uKCkuZ2V0QnVmZmVyUm93UmFuZ2UoKVswXVxuICAgIFtzdGFydFJvdywgZW5kUm93XVxuXG4gIGhlYWRSZXZlcnNlZFN0YXRlSXNJblN5bmM6IC0+XG4gICAgQGlzUmV2ZXJzZWQoKSBpcyBAZ2V0SGVhZFNlbGVjdGlvbigpLmlzUmV2ZXJzZWQoKVxuXG4gICMgW05PVEVdIFVzZWQgYnkgcGx1Z2luIHBhY2thZ2Ugdm1wOm1vdmUtc2VsZWN0ZWQtdGV4dFxuICBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlczogKHJhbmdlcywge3JldmVyc2VkfSkgLT5cbiAgICBzb3J0UmFuZ2VzKHJhbmdlcylcbiAgICByYW5nZSA9IHJhbmdlcy5zaGlmdCgpXG4gICAgQHNldEhlYWRCdWZmZXJSYW5nZShyYW5nZSwge3JldmVyc2VkfSlcbiAgICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgICBAc2VsZWN0aW9ucy5wdXNoIEBlZGl0b3IuYWRkU2VsZWN0aW9uRm9yQnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZH0pXG4gICAgQHVwZGF0ZUdvYWxDb2x1bW4oKVxuXG4gICMgd2hpY2ggbXVzdCBvbmUgb2YgWydzdGFydCcsICdlbmQnLCAnaGVhZCcsICd0YWlsJ11cbiAgc2V0UG9zaXRpb25Gb3JTZWxlY3Rpb25zOiAod2hpY2gpIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAc2VsZWN0aW9uc1xuICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJQb3NpdGlvblRvKHdoaWNoKVxuXG4gIGNsZWFyU2VsZWN0aW9uczogKHtleGNlcHR9PXt9KSAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQHNlbGVjdGlvbnMuc2xpY2UoKSB3aGVuIChzZWxlY3Rpb24gaXNudCBleGNlcHQpXG4gICAgICBAcmVtb3ZlU2VsZWN0aW9uKHNlbGVjdGlvbilcblxuICBzZXRIZWFkQnVmZmVyUG9zaXRpb246IChwb2ludCkgLT5cbiAgICBoZWFkID0gQGdldEhlYWRTZWxlY3Rpb24oKVxuICAgIEBjbGVhclNlbGVjdGlvbnMoZXhjZXB0OiBoZWFkKVxuICAgIGhlYWQuY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIHJlbW92ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBfLnJlbW92ZShAc2VsZWN0aW9ucywgc2VsZWN0aW9uKVxuICAgIHNlbGVjdGlvbi5kZXN0cm95KClcblxuICBzZXRIZWFkQnVmZmVyUmFuZ2U6IChyYW5nZSwgb3B0aW9ucykgLT5cbiAgICBoZWFkID0gQGdldEhlYWRTZWxlY3Rpb24oKVxuICAgIEBjbGVhclNlbGVjdGlvbnMoZXhjZXB0OiBoZWFkKVxuICAgIHtnb2FsQ29sdW1ufSA9IGhlYWQuY3Vyc29yXG4gICAgIyBXaGVuIHJldmVyc2VkIHN0YXRlIG9mIHNlbGVjdGlvbiBjaGFuZ2UsIGdvYWxDb2x1bW4gaXMgY2xlYXJlZC5cbiAgICAjIEJ1dCBoZXJlIGZvciBibG9ja3dpc2UsIEkgd2FudCB0byBrZWVwIGdvYWxDb2x1bW4gdW5jaGFuZ2VkLlxuICAgICMgVGhpcyBiZWhhdmlvciBpcyBub3QgaWRlbnRpY2FsIHRvIHB1cmUgVmltIEkga25vdy5cbiAgICAjIEJ1dCBJIGJlbGlldmUgdGhpcyBpcyBtb3JlIHVubm9pc3kgYW5kIGxlc3MgY29uZnVzaW9uIHdoaWxlIG1vdmluZ1xuICAgICMgY3Vyc29yIGluIHZpc3VhbC1ibG9jayBtb2RlLlxuICAgIGhlYWQuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIG9wdGlvbnMpXG4gICAgaGVhZC5jdXJzb3IuZ29hbENvbHVtbiA/PSBnb2FsQ29sdW1uIGlmIGdvYWxDb2x1bW4/XG5cbiAgZ2V0Q2hhcmFjdGVyd2lzZVByb3BlcnRpZXM6IC0+XG4gICAgaGVhZCA9IEBnZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIHRhaWwgPSBAZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmIEBpc1JldmVyc2VkKClcbiAgICAgIFtzdGFydCwgZW5kXSA9IFtoZWFkLCB0YWlsXVxuICAgIGVsc2VcbiAgICAgIFtzdGFydCwgZW5kXSA9IFt0YWlsLCBoZWFkXVxuXG4gICAgdW5sZXNzIChAaXNTaW5nbGVSb3coKSBvciBAaGVhZFJldmVyc2VkU3RhdGVJc0luU3luYygpKVxuICAgICAgc3RhcnQuY29sdW1uIC09IDFcbiAgICAgIGVuZC5jb2x1bW4gKz0gMVxuICAgIHtoZWFkLCB0YWlsfVxuXG4gIGdldEJ1ZmZlclJhbmdlOiAtPlxuICAgIGlmIEBoZWFkUmV2ZXJzZWRTdGF0ZUlzSW5TeW5jKClcbiAgICAgIHN0YXJ0ID0gQGdldFN0YXJ0U2VsZWN0aW9uLmdldEJ1ZmZlcnJhbmdlKCkuc3RhcnRcbiAgICAgIGVuZCA9IEBnZXRFbmRTZWxlY3Rpb24uZ2V0QnVmZmVycmFuZ2UoKS5lbmRcbiAgICBlbHNlXG4gICAgICBzdGFydCA9IEBnZXRTdGFydFNlbGVjdGlvbi5nZXRCdWZmZXJyYW5nZSgpLmVuZC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIGVuZCA9IEBnZXRFbmRTZWxlY3Rpb24uZ2V0QnVmZmVycmFuZ2UoKS5zdGFydC50cmFuc2xhdGUoWzAsICsxXSlcbiAgICB7c3RhcnQsIGVuZH1cblxuICAjIFtGSVhNRV0gZHVwbGljYXRlIGNvZGVzIHdpdGggc2V0SGVhZEJ1ZmZlclJhbmdlXG4gIHJlc3RvcmVDaGFyYWN0ZXJ3aXNlOiAtPlxuICAgICMgV2hlbiBhbGwgc2VsZWN0aW9uIGlzIGVtcHR5LCB3ZSBkb24ndCB3YW50IHRvIGxvb3NlIG11bHRpLWN1cnNvclxuICAgICMgYnkgcmVzdG9yZWluZyBjaGFyYWN0ZXJ3aXNlIHJhbmdlLlxuICAgIHJldHVybiBpZiBAaXNFbXB0eSgpXG5cbiAgICBwcm9wZXJ0aWVzID0gQGdldENoYXJhY3Rlcndpc2VQcm9wZXJ0aWVzKClcbiAgICBoZWFkID0gQGdldEhlYWRTZWxlY3Rpb24oKVxuICAgIEBjbGVhclNlbGVjdGlvbnMoZXhjZXB0OiBoZWFkKVxuICAgIHtnb2FsQ29sdW1ufSA9IGhlYWQuY3Vyc29yXG4gICAgc3dyYXAoaGVhZCkuc2VsZWN0QnlQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG5cbiAgICBpZiBoZWFkLmdldEJ1ZmZlclJhbmdlKCkuZW5kLmNvbHVtbiBpcyAwXG4gICAgICBzd3JhcChoZWFkKS50cmFuc2xhdGVTZWxlY3Rpb25FbmRBbmRDbGlwKCdmb3J3YXJkJylcblxuICAgIGhlYWQuY3Vyc29yLmdvYWxDb2x1bW4gPz0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uP1xuXG4gIGF1dG9zY3JvbGw6IChvcHRpb25zKSAtPlxuICAgIEBnZXRIZWFkU2VsZWN0aW9uKCkuYXV0b3Njcm9sbChvcHRpb25zKVxuXG4gIGF1dG9zY3JvbGxJZlJldmVyc2VkOiAob3B0aW9ucykgLT5cbiAgICAjIFNlZSAjNTQ2IGN1cnNvciBvdXQtb2Ytc2NyZWVuIGlzc3VlIGhhcHBlbnMgb25seSBpbiByZXZlcnNlZC5cbiAgICAjIFNvIHNraXAgaGVyZSBmb3IgcGVyZm9ybWFuY2UoYnV0IGRvbid0IGtub3cgaWYgaXQncyB3b3J0aClcbiAgICBAYXV0b3Njcm9sbChvcHRpb25zKSBpZiBAaXNSZXZlcnNlZCgpXG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2t3aXNlU2VsZWN0aW9uXG4iXX0=
