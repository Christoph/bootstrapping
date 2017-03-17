var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _editorDiffExtender = require('./editor-diff-extender');

var _editorDiffExtender2 = _interopRequireDefault(_editorDiffExtender);

var _computeWordDiff = require('./compute-word-diff');

var _computeWordDiff2 = _interopRequireDefault(_computeWordDiff);

'use babel';

module.exports = (function () {
  /*
   * @param editors Array of editors being diffed.
   */

  function DiffView(editors) {
    _classCallCheck(this, DiffView);

    this._editorDiffExtender1 = new _editorDiffExtender2['default'](editors.editor1);
    this._editorDiffExtender2 = new _editorDiffExtender2['default'](editors.editor2);
    this._chunks = null;
    this._isSelectionActive = false;
    this._selectedChunkIndex = 0;
    this._COPY_HELP_MESSAGE = 'Place your cursor in a chunk first!';
    this._markerLayers = {};
  }

  /**
   * Adds highlighting to the editors to show the diff.
   *
   * @param diff The diff to highlight.
   * @param leftHighlightType The type of highlight (ex: 'added').
   * @param rightHighlightType The type of highlight (ex: 'removed').
   * @param isWordDiffEnabled Whether differences between words per line should be highlighted.
   * @param isWhitespaceIgnored Whether whitespace should be ignored.
   */

  _createClass(DiffView, [{
    key: 'displayDiff',
    value: function displayDiff(diff, leftHighlightType, rightHighlightType, isWordDiffEnabled, isWhitespaceIgnored) {
      this._chunks = diff.chunks;

      // make the last chunk equal size on both screens so the editors retain sync scroll #58
      if (this._chunks.length > 0) {
        var lastChunk = this._chunks[this._chunks.length - 1];
        var oldChunkRange = lastChunk.oldLineEnd - lastChunk.oldLineStart;
        var newChunkRange = lastChunk.newLineEnd - lastChunk.newLineStart;
        if (oldChunkRange > newChunkRange) {
          // make the offset as large as needed to make the chunk the same size in both editors
          diff.newLineOffsets[lastChunk.newLineStart + newChunkRange] = oldChunkRange - newChunkRange;
        } else if (newChunkRange > oldChunkRange) {
          // make the offset as large as needed to make the chunk the same size in both editors
          diff.oldLineOffsets[lastChunk.oldLineStart + oldChunkRange] = newChunkRange - oldChunkRange;
        }
      }

      for (chunk of this._chunks) {
        this._editorDiffExtender1.highlightLines(chunk.oldLineStart, chunk.oldLineEnd, leftHighlightType);
        this._editorDiffExtender2.highlightLines(chunk.newLineStart, chunk.newLineEnd, rightHighlightType);

        if (isWordDiffEnabled) {
          this._highlightWordsInChunk(chunk, leftHighlightType, rightHighlightType, isWhitespaceIgnored);
        }
      }

      this._editorDiffExtender1.setLineOffsets(diff.oldLineOffsets);
      this._editorDiffExtender2.setLineOffsets(diff.newLineOffsets);

      this._markerLayers = {
        editor1: {
          id: this._editorDiffExtender1.getEditor().id,
          lineMarkerLayer: this._editorDiffExtender1.getLineMarkerLayer(),
          highlightType: leftHighlightType,
          selectionMarkerLayer: this._editorDiffExtender1.getSelectionMarkerLayer()
        },
        editor2: {
          id: this._editorDiffExtender2.getEditor().id,
          lineMarkerLayer: this._editorDiffExtender2.getLineMarkerLayer(),
          highlightType: rightHighlightType,
          selectionMarkerLayer: this._editorDiffExtender2.getSelectionMarkerLayer()
        }
      };
    }

    /**
     * Clears the diff highlighting and offsets from the editors.
     */
  }, {
    key: 'clearDiff',
    value: function clearDiff() {
      this._editorDiffExtender1.destroyMarkers();
      this._editorDiffExtender2.destroyMarkers();
    }

    /**
     * Called to move the current selection highlight to the next diff chunk.
     */
  }, {
    key: 'nextDiff',
    value: function nextDiff() {
      if (this._isSelectionActive) {
        this._selectedChunkIndex++;
        if (this._selectedChunkIndex >= this._chunks.length) {
          this._selectedChunkIndex = 0;
        }
      } else {
        this._isSelectionActive = true;
      }

      this._selectChunk(this._selectedChunkIndex);
      return this._selectedChunkIndex;
    }

    /**
     * Called to move the current selection highlight to the previous diff chunk.
     */
  }, {
    key: 'prevDiff',
    value: function prevDiff() {
      if (this._isSelectionActive) {
        this._selectedChunkIndex--;
        if (this._selectedChunkIndex < 0) {
          this._selectedChunkIndex = this._chunks.length - 1;
        }
      } else {
        this._isSelectionActive = true;
      }

      this._selectChunk(this._selectedChunkIndex);
      return this._selectedChunkIndex;
    }

    /**
     * Copies the currently selected diff chunk from the left editor to the right
     * editor.
     */
  }, {
    key: 'copyToRight',
    value: function copyToRight() {
      var linesToCopy = this._editorDiffExtender1.getCursorDiffLines();

      if (linesToCopy.length == 0) {
        atom.notifications.addWarning('Split Diff', { detail: this._COPY_HELP_MESSAGE, dismissable: false, icon: 'diff' });
      }

      // keep track of line offset (used when there are multiple chunks being moved)
      var offset = 0;

      for (lineRange of linesToCopy) {
        for (diffChunk of this._chunks) {
          if (lineRange.start.row == diffChunk.oldLineStart) {
            var textToCopy = this._editorDiffExtender1.getEditor().getTextInBufferRange([[diffChunk.oldLineStart, 0], [diffChunk.oldLineEnd, 0]]);
            var lastBufferRow = this._editorDiffExtender2.getEditor().getLastBufferRow();

            // insert new line if the chunk we want to copy will be below the last line of the other editor
            if (diffChunk.newLineStart + offset > lastBufferRow) {
              this._editorDiffExtender2.getEditor().setCursorBufferPosition([lastBufferRow, 0], { autoscroll: false });
              this._editorDiffExtender2.getEditor().insertNewline();
            }

            this._editorDiffExtender2.getEditor().setTextInBufferRange([[diffChunk.newLineStart + offset, 0], [diffChunk.newLineEnd + offset, 0]], textToCopy);
            // offset will be the amount of lines to be copied minus the amount of lines overwritten
            offset += diffChunk.oldLineEnd - diffChunk.oldLineStart - (diffChunk.newLineEnd - diffChunk.newLineStart);
            // move the selection pointer back so the next diff chunk is not skipped
            if (this._editorDiffExtender1.hasSelection() || this._editorDiffExtender2.hasSelection()) {
              this._selectedChunkIndex--;
            }
          }
        }
      }
    }

    /**
     * Copies the currently selected diff chunk from the right editor to the left
     * editor.
     */
  }, {
    key: 'copyToLeft',
    value: function copyToLeft() {
      var linesToCopy = this._editorDiffExtender2.getCursorDiffLines();

      if (linesToCopy.length == 0) {
        atom.notifications.addWarning('Split Diff', { detail: this._COPY_HELP_MESSAGE, dismissable: false, icon: 'diff' });
      }

      var offset = 0; // keep track of line offset (used when there are multiple chunks being moved)
      for (lineRange of linesToCopy) {
        for (diffChunk of this._chunks) {
          if (lineRange.start.row == diffChunk.newLineStart) {
            var textToCopy = this._editorDiffExtender2.getEditor().getTextInBufferRange([[diffChunk.newLineStart, 0], [diffChunk.newLineEnd, 0]]);
            var lastBufferRow = this._editorDiffExtender1.getEditor().getLastBufferRow();
            // insert new line if the chunk we want to copy will be below the last line of the other editor
            if (diffChunk.oldLineStart + offset > lastBufferRow) {
              this._editorDiffExtender1.getEditor().setCursorBufferPosition([lastBufferRow, 0], { autoscroll: false });
              this._editorDiffExtender1.getEditor().insertNewline();
            }

            this._editorDiffExtender1.getEditor().setTextInBufferRange([[diffChunk.oldLineStart + offset, 0], [diffChunk.oldLineEnd + offset, 0]], textToCopy);
            // offset will be the amount of lines to be copied minus the amount of lines overwritten
            offset += diffChunk.newLineEnd - diffChunk.newLineStart - (diffChunk.oldLineEnd - diffChunk.oldLineStart);
            // move the selection pointer back so the next diff chunk is not skipped
            if (this._editorDiffExtender1.hasSelection() || this._editorDiffExtender2.hasSelection()) {
              this._selectedChunkIndex--;
            }
          }
        }
      }
    }

    /**
     * Cleans up the editor indicated by index. A clean up will remove the editor
     * or the pane if necessary. Typically left editor == 1 and right editor == 2.
     *
     * @param editorIndex The index of the editor to clean up.
     */
  }, {
    key: 'cleanUpEditor',
    value: function cleanUpEditor(editorIndex) {
      if (editorIndex === 1) {
        this._editorDiffExtender1.cleanUp();
      } else if (editorIndex === 2) {
        this._editorDiffExtender2.cleanUp();
      }
    }

    /**
     * Destroys the editor diff extenders.
     */
  }, {
    key: 'destroy',
    value: function destroy() {
      this._editorDiffExtender1.destroy();
      this._editorDiffExtender2.destroy();
    }

    /**
     * Gets the number of differences between the editors.
     *
     * @return int The number of differences between the editors.
     */
  }, {
    key: 'getNumDifferences',
    value: function getNumDifferences() {
      return this._chunks.length;
    }
  }, {
    key: 'getMarkerLayers',
    value: function getMarkerLayers() {
      return this._markerLayers;
    }

    // ----------------------------------------------------------------------- //
    // --------------------------- PRIVATE METHODS --------------------------- //
    // ----------------------------------------------------------------------- //

    /**
     * Selects and highlights the diff chunk in both editors according to the
     * given index.
     *
     * @param index The index of the diff chunk to highlight in both editors.
     */
  }, {
    key: '_selectChunk',
    value: function _selectChunk(index) {
      var diffChunk = this._chunks[index];
      if (diffChunk != null) {
        // deselect previous next/prev highlights
        this._editorDiffExtender1.deselectAllLines();
        this._editorDiffExtender2.deselectAllLines();
        // highlight and scroll editor 1
        this._editorDiffExtender1.selectLines(diffChunk.oldLineStart, diffChunk.oldLineEnd);
        this._editorDiffExtender1.getEditor().setCursorBufferPosition([diffChunk.oldLineStart, 0], { autoscroll: true });
        // highlight and scroll editor 2
        this._editorDiffExtender2.selectLines(diffChunk.newLineStart, diffChunk.newLineEnd);
        this._editorDiffExtender2.getEditor().setCursorBufferPosition([diffChunk.newLineStart, 0], { autoscroll: true });
      }
    }

    /**
     * Highlights the word diff of the chunk passed in.
     *
     * @param chunk The chunk that should have its words highlighted.
     */
  }, {
    key: '_highlightWordsInChunk',
    value: function _highlightWordsInChunk(chunk, leftHighlightType, rightHighlightType, isWhitespaceIgnored) {
      var leftLineNumber = chunk.oldLineStart;
      var rightLineNumber = chunk.newLineStart;
      // for each line that has a corresponding line
      while (leftLineNumber < chunk.oldLineEnd && rightLineNumber < chunk.newLineEnd) {
        var editor1LineText = this._editorDiffExtender1.getEditor().lineTextForBufferRow(leftLineNumber);
        var editor2LineText = this._editorDiffExtender2.getEditor().lineTextForBufferRow(rightLineNumber);

        if (editor1LineText == '') {
          // computeWordDiff returns empty for lines that are paired with empty lines
          // need to force a highlight
          this._editorDiffExtender2.setWordHighlights(rightLineNumber, [{ changed: true, value: editor2LineText }], rightHighlightType, isWhitespaceIgnored);
        } else if (editor2LineText == '') {
          // computeWordDiff returns empty for lines that are paired with empty lines
          // need to force a highlight
          this._editorDiffExtender1.setWordHighlights(leftLineNumber, [{ changed: true, value: editor1LineText }], leftHighlightType, isWhitespaceIgnored);
        } else {
          // perform regular word diff
          var wordDiff = _computeWordDiff2['default'].computeWordDiff(editor1LineText, editor2LineText);
          this._editorDiffExtender1.setWordHighlights(leftLineNumber, wordDiff.removedWords, leftHighlightType, isWhitespaceIgnored);
          this._editorDiffExtender2.setWordHighlights(rightLineNumber, wordDiff.addedWords, rightHighlightType, isWhitespaceIgnored);
        }

        leftLineNumber++;
        rightLineNumber++;
      }

      // highlight remaining lines in left editor
      while (leftLineNumber < chunk.oldLineEnd) {
        var editor1LineText = this._editorDiffExtender1.getEditor().lineTextForBufferRow(leftLineNumber);
        this._editorDiffExtender1.setWordHighlights(leftLineNumber, [{ changed: true, value: editor1LineText }], leftHighlightType, isWhitespaceIgnored);
        leftLineNumber++;
      }
      // highlight remaining lines in the right editor
      while (rightLineNumber < chunk.newLineEnd) {
        this._editorDiffExtender2.setWordHighlights(rightLineNumber, [{ changed: true, value: this._editorDiffExtender2.getEditor().lineTextForBufferRow(rightLineNumber) }], rightHighlightType, isWhitespaceIgnored);
        rightLineNumber++;
      }
    }
  }]);

  return DiffView;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2RpZmYtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7a0NBRStCLHdCQUF3Qjs7OzsrQkFDM0IscUJBQXFCOzs7O0FBSGpELFdBQVcsQ0FBQTs7QUFNWCxNQUFNLENBQUMsT0FBTzs7Ozs7QUFJRCxXQUpVLFFBQVEsQ0FJakIsT0FBTyxFQUFFOzBCQUpBLFFBQVE7O0FBSzNCLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQ0FBdUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BFLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQ0FBdUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BFLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7QUFDaEMsUUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztBQUM3QixRQUFJLENBQUMsa0JBQWtCLEdBQUcscUNBQXFDLENBQUM7QUFDaEUsUUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7R0FDekI7Ozs7Ozs7Ozs7OztlQVpvQixRQUFROztXQXVCbEIscUJBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFO0FBQy9GLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7O0FBRzNCLFVBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzFCLFlBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdEQsWUFBSSxhQUFhLEdBQUcsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDO0FBQ2xFLFlBQUksYUFBYSxH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aUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBQyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUM3TSx1QkFBZSxFQUFFLENBQUM7T0FDbkI7S0FDRjs7O1NBOVJvQixRQUFRO0lBK1I5QixDQUFDIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2RpZmYtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCBFZGl0b3JEaWZmRXh0ZW5kZXIgZnJvbSAnLi9lZGl0b3ItZGlmZi1leHRlbmRlcic7XG5pbXBvcnQgQ29tcHV0ZVdvcmREaWZmIGZyb20gJy4vY29tcHV0ZS13b3JkLWRpZmYnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlmZlZpZXcge1xuICAvKlxuICAgKiBAcGFyYW0gZWRpdG9ycyBBcnJheSBvZiBlZGl0b3JzIGJlaW5nIGRpZmZlZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVkaXRvcnMpIHtcbiAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxID0gbmV3IEVkaXRvckRpZmZFeHRlbmRlcihlZGl0b3JzLmVkaXRvcjEpO1xuICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIgPSBuZXcgRWRpdG9yRGlmZkV4dGVuZGVyKGVkaXRvcnMuZWRpdG9yMik7XG4gICAgdGhpcy5fY2h1bmtzID0gbnVsbDtcbiAgICB0aGlzLl9pc1NlbGVjdGlvbkFjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleCA9IDA7XG4gICAgdGhpcy5fQ09QWV9IRUxQX01FU1NBR0UgPSAnUGxhY2UgeW91ciBjdXJzb3IgaW4gYSBjaHVuayBmaXJzdCEnO1xuICAgIHRoaXMuX21hcmtlckxheWVycyA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgaGlnaGxpZ2h0aW5nIHRvIHRoZSBlZGl0b3JzIHRvIHNob3cgdGhlIGRpZmYuXG4gICAqXG4gICAqIEBwYXJhbSBkaWZmIFRoZSBkaWZmIHRvIGhpZ2hsaWdodC5cbiAgICogQHBhcmFtIGxlZnRIaWdobGlnaHRUeXBlIFRoZSB0eXBlIG9mIGhpZ2hsaWdodCAoZXg6ICdhZGRlZCcpLlxuICAgKiBAcGFyYW0gcmlnaHRIaWdobGlnaHRUeXBlIFRoZSB0eXBlIG9mIGhpZ2hsaWdodCAoZXg6ICdyZW1vdmVkJykuXG4gICAqIEBwYXJhbSBpc1dvcmREaWZmRW5hYmxlZCBXaGV0aGVyIGRpZmZlcmVuY2VzIGJldHdlZW4gd29yZHMgcGVyIGxpbmUgc2hvdWxkIGJlIGhpZ2hsaWdodGVkLlxuICAgKiBAcGFyYW0gaXNXaGl0ZXNwYWNlSWdub3JlZCBXaGV0aGVyIHdoaXRlc3BhY2Ugc2hvdWxkIGJlIGlnbm9yZWQuXG4gICAqL1xuICBkaXNwbGF5RGlmZihkaWZmLCBsZWZ0SGlnaGxpZ2h0VHlwZSwgcmlnaHRIaWdobGlnaHRUeXBlLCBpc1dvcmREaWZmRW5hYmxlZCwgaXNXaGl0ZXNwYWNlSWdub3JlZCkge1xuICAgIHRoaXMuX2NodW5rcyA9IGRpZmYuY2h1bmtzO1xuXG4gICAgLy8gbWFrZSB0aGUgbGFzdCBjaHVuayBlcXVhbCBzaXplIG9uIGJvdGggc2NyZWVucyBzbyB0aGUgZWRpdG9ycyByZXRhaW4gc3luYyBzY3JvbGwgIzU4XG4gICAgaWYodGhpcy5fY2h1bmtzLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBsYXN0Q2h1bmsgPSB0aGlzLl9jaHVua3NbdGhpcy5fY2h1bmtzLmxlbmd0aCAtIDFdO1xuICAgICAgdmFyIG9sZENodW5rUmFuZ2UgPSBsYXN0Q2h1bmsub2xkTGluZUVuZCAtIGxhc3RDaHVuay5vbGRMaW5lU3RhcnQ7XG4gICAgICB2YXIgbmV3Q2h1bmtSYW5nZSA9IGxhc3RDaHVuay5uZXdMaW5lRW5kIC0gbGFzdENodW5rLm5ld0xpbmVTdGFydDtcbiAgICAgIGlmKG9sZENodW5rUmFuZ2UgPiBuZXdDaHVua1JhbmdlKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIG9mZnNldCBhcyBsYXJnZSBhcyBuZWVkZWQgdG8gbWFrZSB0aGUgY2h1bmsgdGhlIHNhbWUgc2l6ZSBpbiBib3RoIGVkaXRvcnNcbiAgICAgICAgZGlmZi5uZXdMaW5lT2Zmc2V0c1tsYXN0Q2h1bmsubmV3TGluZVN0YXJ0ICsgbmV3Q2h1bmtSYW5nZV0gPSBvbGRDaHVua1JhbmdlIC0gbmV3Q2h1bmtSYW5nZTtcbiAgICAgIH0gZWxzZSBpZihuZXdDaHVua1JhbmdlID4gb2xkQ2h1bmtSYW5nZSkge1xuICAgICAgICAvLyBtYWtlIHRoZSBvZmZzZXQgYXMgbGFyZ2UgYXMgbmVlZGVkIHRvIG1ha2UgdGhlIGNodW5rIHRoZSBzYW1lIHNpemUgaW4gYm90aCBlZGl0b3JzXG4gICAgICAgIGRpZmYub2xkTGluZU9mZnNldHNbbGFzdENodW5rLm9sZExpbmVTdGFydCArIG9sZENodW5rUmFuZ2VdID0gbmV3Q2h1bmtSYW5nZSAtIG9sZENodW5rUmFuZ2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yKGNodW5rIG9mIHRoaXMuX2NodW5rcykge1xuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5oaWdobGlnaHRMaW5lcyhjaHVuay5vbGRMaW5lU3RhcnQsIGNodW5rLm9sZExpbmVFbmQsIGxlZnRIaWdobGlnaHRUeXBlKTtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuaGlnaGxpZ2h0TGluZXMoY2h1bmsubmV3TGluZVN0YXJ0LCBjaHVuay5uZXdMaW5lRW5kLCByaWdodEhpZ2hsaWdodFR5cGUpO1xuXG4gICAgICBpZihpc1dvcmREaWZmRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9oaWdobGlnaHRXb3Jkc0luQ2h1bmsoY2h1bmssIGxlZnRIaWdobGlnaHRUeXBlLCByaWdodEhpZ2hsaWdodFR5cGUsIGlzV2hpdGVzcGFjZUlnbm9yZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuc2V0TGluZU9mZnNldHMoZGlmZi5vbGRMaW5lT2Zmc2V0cyk7XG4gICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5zZXRMaW5lT2Zmc2V0cyhkaWZmLm5ld0xpbmVPZmZzZXRzKTtcblxuICAgIHRoaXMuX21hcmtlckxheWVycyA9IHtcbiAgICAgIGVkaXRvcjE6IHtcbiAgICAgICAgaWQ6IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuaWQsXG4gICAgICAgIGxpbmVNYXJrZXJMYXllcjogdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRMaW5lTWFya2VyTGF5ZXIoKSxcbiAgICAgICAgaGlnaGxpZ2h0VHlwZTogbGVmdEhpZ2hsaWdodFR5cGUsXG4gICAgICAgIHNlbGVjdGlvbk1hcmtlckxheWVyOiB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmdldFNlbGVjdGlvbk1hcmtlckxheWVyKClcbiAgICAgIH0sXG4gICAgICBlZGl0b3IyOiB7XG4gICAgICAgIGlkOiB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmdldEVkaXRvcigpLmlkLFxuICAgICAgICBsaW5lTWFya2VyTGF5ZXI6IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0TGluZU1hcmtlckxheWVyKCksXG4gICAgICAgIGhpZ2hsaWdodFR5cGU6IHJpZ2h0SGlnaGxpZ2h0VHlwZSxcbiAgICAgICAgc2VsZWN0aW9uTWFya2VyTGF5ZXI6IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0U2VsZWN0aW9uTWFya2VyTGF5ZXIoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGRpZmYgaGlnaGxpZ2h0aW5nIGFuZCBvZmZzZXRzIGZyb20gdGhlIGVkaXRvcnMuXG4gICAqL1xuICBjbGVhckRpZmYoKSB7XG4gICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5kZXN0cm95TWFya2VycygpO1xuICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZGVzdHJveU1hcmtlcnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgdG8gbW92ZSB0aGUgY3VycmVudCBzZWxlY3Rpb24gaGlnaGxpZ2h0IHRvIHRoZSBuZXh0IGRpZmYgY2h1bmsuXG4gICAqL1xuICBuZXh0RGlmZigpIHtcbiAgICBpZih0aGlzLl9pc1NlbGVjdGlvbkFjdGl2ZSkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4Kys7XG4gICAgICBpZih0aGlzLl9zZWxlY3RlZENodW5rSW5kZXggPj0gdGhpcy5fY2h1bmtzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZENodW5rSW5kZXggPSAwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9pc1NlbGVjdGlvbkFjdGl2ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fc2VsZWN0Q2h1bmsodGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4KTtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB0byBtb3ZlIHRoZSBjdXJyZW50IHNlbGVjdGlvbiBoaWdobGlnaHQgdG8gdGhlIHByZXZpb3VzIGRpZmYgY2h1bmsuXG4gICAqL1xuICBwcmV2RGlmZigpIHtcbiAgICBpZih0aGlzLl9pc1NlbGVjdGlvbkFjdGl2ZSkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4LS07XG4gICAgICBpZih0aGlzLl9zZWxlY3RlZENodW5rSW5kZXggPCAwKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleCA9IHRoaXMuX2NodW5rcy5sZW5ndGggLSAxXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2lzU2VsZWN0aW9uQWN0aXZlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZWxlY3RDaHVuayh0aGlzLl9zZWxlY3RlZENodW5rSW5kZXgpO1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZENodW5rSW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZGlmZiBjaHVuayBmcm9tIHRoZSBsZWZ0IGVkaXRvciB0byB0aGUgcmlnaHRcbiAgICogZWRpdG9yLlxuICAgKi9cbiAgY29weVRvUmlnaHQoKSB7XG4gICAgdmFyIGxpbmVzVG9Db3B5ID0gdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRDdXJzb3JEaWZmTGluZXMoKTtcblxuICAgIGlmKGxpbmVzVG9Db3B5Lmxlbmd0aCA9PSAwKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IHRoaXMuX0NPUFlfSEVMUF9NRVNTQUdFLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG4gICAgfVxuXG4gICAgLy8ga2VlcCB0cmFjayBvZiBsaW5lIG9mZnNldCAodXNlZCB3aGVuIHRoZXJlIGFyZSBtdWx0aXBsZSBjaHVua3MgYmVpbmcgbW92ZWQpXG4gICAgdmFyIG9mZnNldCA9IDA7XG5cbiAgICBmb3IobGluZVJhbmdlIG9mIGxpbmVzVG9Db3B5KSB7XG4gICAgICBmb3IoZGlmZkNodW5rIG9mIHRoaXMuX2NodW5rcykge1xuICAgICAgICBpZihsaW5lUmFuZ2Uuc3RhcnQucm93ID09IGRpZmZDaHVuay5vbGRMaW5lU3RhcnQpIHtcbiAgICAgICAgICB2YXIgdGV4dFRvQ29weSA9IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tkaWZmQ2h1bmsub2xkTGluZVN0YXJ0LCAwXSwgW2RpZmZDaHVuay5vbGRMaW5lRW5kLCAwXV0pO1xuICAgICAgICAgIHZhciBsYXN0QnVmZmVyUm93ID0gdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRFZGl0b3IoKS5nZXRMYXN0QnVmZmVyUm93KCk7XG5cbiAgICAgICAgICAvLyBpbnNlcnQgbmV3IGxpbmUgaWYgdGhlIGNodW5rIHdlIHdhbnQgdG8gY29weSB3aWxsIGJlIGJlbG93IHRoZSBsYXN0IGxpbmUgb2YgdGhlIG90aGVyIGVkaXRvclxuICAgICAgICAgIGlmKChkaWZmQ2h1bmsubmV3TGluZVN0YXJ0ICsgb2Zmc2V0KSA+IGxhc3RCdWZmZXJSb3cpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0RWRpdG9yKCkuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oW2xhc3RCdWZmZXJSb3csIDBdLCB7YXV0b3Njcm9sbDogZmFsc2V9KTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0RWRpdG9yKCkuaW5zZXJ0TmV3bGluZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0RWRpdG9yKCkuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tkaWZmQ2h1bmsubmV3TGluZVN0YXJ0ICsgb2Zmc2V0LCAwXSwgW2RpZmZDaHVuay5uZXdMaW5lRW5kICsgb2Zmc2V0LCAwXV0sIHRleHRUb0NvcHkpO1xuICAgICAgICAgIC8vIG9mZnNldCB3aWxsIGJlIHRoZSBhbW91bnQgb2YgbGluZXMgdG8gYmUgY29waWVkIG1pbnVzIHRoZSBhbW91bnQgb2YgbGluZXMgb3ZlcndyaXR0ZW5cbiAgICAgICAgICBvZmZzZXQgKz0gKGRpZmZDaHVuay5vbGRMaW5lRW5kIC0gZGlmZkNodW5rLm9sZExpbmVTdGFydCkgLSAoZGlmZkNodW5rLm5ld0xpbmVFbmQgLSBkaWZmQ2h1bmsubmV3TGluZVN0YXJ0KTtcbiAgICAgICAgICAvLyBtb3ZlIHRoZSBzZWxlY3Rpb24gcG9pbnRlciBiYWNrIHNvIHRoZSBuZXh0IGRpZmYgY2h1bmsgaXMgbm90IHNraXBwZWRcbiAgICAgICAgICBpZih0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmhhc1NlbGVjdGlvbigpIHx8IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuaGFzU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleC0tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBkaWZmIGNodW5rIGZyb20gdGhlIHJpZ2h0IGVkaXRvciB0byB0aGUgbGVmdFxuICAgKiBlZGl0b3IuXG4gICAqL1xuICBjb3B5VG9MZWZ0KCkge1xuICAgIHZhciBsaW5lc1RvQ29weSA9IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0Q3Vyc29yRGlmZkxpbmVzKCk7XG5cbiAgICBpZihsaW5lc1RvQ29weS5sZW5ndGggPT0gMCkge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ1NwbGl0IERpZmYnLCB7ZGV0YWlsOiB0aGlzLl9DT1BZX0hFTFBfTUVTU0FHRSwgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KTtcbiAgICB9XG5cbiAgICB2YXIgb2Zmc2V0ID0gMDsgLy8ga2VlcCB0cmFjayBvZiBsaW5lIG9mZnNldCAodXNlZCB3aGVuIHRoZXJlIGFyZSBtdWx0aXBsZSBjaHVua3MgYmVpbmcgbW92ZWQpXG4gICAgZm9yKGxpbmVSYW5nZSBvZiBsaW5lc1RvQ29weSkge1xuICAgICAgZm9yKGRpZmZDaHVuayBvZiB0aGlzLl9jaHVua3MpIHtcbiAgICAgICAgaWYobGluZVJhbmdlLnN0YXJ0LnJvdyA9PSBkaWZmQ2h1bmsubmV3TGluZVN0YXJ0KSB7XG4gICAgICAgICAgdmFyIHRleHRUb0NvcHkgPSB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmdldEVkaXRvcigpLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtbZGlmZkNodW5rLm5ld0xpbmVTdGFydCwgMF0sIFtkaWZmQ2h1bmsubmV3TGluZUVuZCwgMF1dKTtcbiAgICAgICAgICB2YXIgbGFzdEJ1ZmZlclJvdyA9IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuZ2V0TGFzdEJ1ZmZlclJvdygpO1xuICAgICAgICAgIC8vIGluc2VydCBuZXcgbGluZSBpZiB0aGUgY2h1bmsgd2Ugd2FudCB0byBjb3B5IHdpbGwgYmUgYmVsb3cgdGhlIGxhc3QgbGluZSBvZiB0aGUgb3RoZXIgZWRpdG9yXG4gICAgICAgICAgaWYoKGRpZmZDaHVuay5vbGRMaW5lU3RhcnQgKyBvZmZzZXQpID4gbGFzdEJ1ZmZlclJvdykge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRFZGl0b3IoKS5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihbbGFzdEJ1ZmZlclJvdywgMF0sIHthdXRvc2Nyb2xsOiBmYWxzZX0pO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRFZGl0b3IoKS5pbnNlcnROZXdsaW5lKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRFZGl0b3IoKS5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW2RpZmZDaHVuay5vbGRMaW5lU3RhcnQgKyBvZmZzZXQsIDBdLCBbZGlmZkNodW5rLm9sZExpbmVFbmQgKyBvZmZzZXQsIDBdXSwgdGV4dFRvQ29weSk7XG4gICAgICAgICAgLy8gb2Zmc2V0IHdpbGwgYmUgdGhlIGFtb3VudCBvZiBsaW5lcyB0byBiZSBjb3BpZWQgbWludXMgdGhlIGFtb3VudCBvZiBsaW5lcyBvdmVyd3JpdHRlblxuICAgICAgICAgIG9mZnNldCArPSAoZGlmZkNodW5rLm5ld0xpbmVFbmQgLSBkaWZmQ2h1bmsubmV3TGluZVN0YXJ0KSAtIChkaWZmQ2h1bmsub2xkTGluZUVuZCAtIGRpZmZDaHVuay5vbGRMaW5lU3RhcnQpO1xuICAgICAgICAgIC8vIG1vdmUgdGhlIHNlbGVjdGlvbiBwb2ludGVyIGJhY2sgc28gdGhlIG5leHQgZGlmZiBjaHVuayBpcyBub3Qgc2tpcHBlZFxuICAgICAgICAgIGlmKHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuaGFzU2VsZWN0aW9uKCkgfHwgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4LS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgZWRpdG9yIGluZGljYXRlZCBieSBpbmRleC4gQSBjbGVhbiB1cCB3aWxsIHJlbW92ZSB0aGUgZWRpdG9yXG4gICAqIG9yIHRoZSBwYW5lIGlmIG5lY2Vzc2FyeS4gVHlwaWNhbGx5IGxlZnQgZWRpdG9yID09IDEgYW5kIHJpZ2h0IGVkaXRvciA9PSAyLlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBlZGl0b3IgdG8gY2xlYW4gdXAuXG4gICAqL1xuICBjbGVhblVwRWRpdG9yKGVkaXRvckluZGV4KSB7XG4gICAgaWYoZWRpdG9ySW5kZXggPT09IDEpIHtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuY2xlYW5VcCgpO1xuICAgIH0gZWxzZSBpZihlZGl0b3JJbmRleCA9PT0gMikge1xuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5jbGVhblVwKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBlZGl0b3IgZGlmZiBleHRlbmRlcnMuXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZGVzdHJveSgpO1xuICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZGVzdHJveSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBlZGl0b3JzLlxuICAgKlxuICAgKiBAcmV0dXJuIGludCBUaGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIGVkaXRvcnMuXG4gICAqL1xuICBnZXROdW1EaWZmZXJlbmNlcygpIHtcbiAgICByZXR1cm4gdGhpcy5fY2h1bmtzLmxlbmd0aDtcbiAgfVxuXG4gIGdldE1hcmtlckxheWVycygpIHtcbiAgICByZXR1cm4gdGhpcy5fbWFya2VyTGF5ZXJzO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogU2VsZWN0cyBhbmQgaGlnaGxpZ2h0cyB0aGUgZGlmZiBjaHVuayBpbiBib3RoIGVkaXRvcnMgYWNjb3JkaW5nIHRvIHRoZVxuICAgKiBnaXZlbiBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZGlmZiBjaHVuayB0byBoaWdobGlnaHQgaW4gYm90aCBlZGl0b3JzLlxuICAgKi9cbiAgX3NlbGVjdENodW5rKGluZGV4KSB7XG4gICAgdmFyIGRpZmZDaHVuayA9IHRoaXMuX2NodW5rc1tpbmRleF07XG4gICAgaWYoZGlmZkNodW5rICE9IG51bGwpIHtcbiAgICAgIC8vIGRlc2VsZWN0IHByZXZpb3VzIG5leHQvcHJldiBoaWdobGlnaHRzXG4gICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmRlc2VsZWN0QWxsTGluZXMoKTtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZGVzZWxlY3RBbGxMaW5lcygpO1xuICAgICAgLy8gaGlnaGxpZ2h0IGFuZCBzY3JvbGwgZWRpdG9yIDFcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuc2VsZWN0TGluZXMoIGRpZmZDaHVuay5vbGRMaW5lU3RhcnQsIGRpZmZDaHVuay5vbGRMaW5lRW5kICk7XG4gICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmdldEVkaXRvcigpLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCBbZGlmZkNodW5rLm9sZExpbmVTdGFydCwgMF0sIHthdXRvc2Nyb2xsOiB0cnVlfSApO1xuICAgICAgLy8gaGlnaGxpZ2h0IGFuZCBzY3JvbGwgZWRpdG9yIDJcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuc2VsZWN0TGluZXMoIGRpZmZDaHVuay5uZXdMaW5lU3RhcnQsIGRpZmZDaHVuay5uZXdMaW5lRW5kICk7XG4gICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmdldEVkaXRvcigpLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCBbZGlmZkNodW5rLm5ld0xpbmVTdGFydCwgMF0sIHthdXRvc2Nyb2xsOiB0cnVlfSApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIaWdobGlnaHRzIHRoZSB3b3JkIGRpZmYgb2YgdGhlIGNodW5rIHBhc3NlZCBpbi5cbiAgICpcbiAgICogQHBhcmFtIGNodW5rIFRoZSBjaHVuayB0aGF0IHNob3VsZCBoYXZlIGl0cyB3b3JkcyBoaWdobGlnaHRlZC5cbiAgICovXG4gIF9oaWdobGlnaHRXb3Jkc0luQ2h1bmsoY2h1bmssIGxlZnRIaWdobGlnaHRUeXBlLCByaWdodEhpZ2hsaWdodFR5cGUsIGlzV2hpdGVzcGFjZUlnbm9yZWQpIHtcbiAgICB2YXIgbGVmdExpbmVOdW1iZXIgPSBjaHVuay5vbGRMaW5lU3RhcnQ7XG4gICAgdmFyIHJpZ2h0TGluZU51bWJlciA9IGNodW5rLm5ld0xpbmVTdGFydDtcbiAgICAvLyBmb3IgZWFjaCBsaW5lIHRoYXQgaGFzIGEgY29ycmVzcG9uZGluZyBsaW5lXG4gICAgd2hpbGUobGVmdExpbmVOdW1iZXIgPCBjaHVuay5vbGRMaW5lRW5kICYmIHJpZ2h0TGluZU51bWJlciA8IGNodW5rLm5ld0xpbmVFbmQpIHtcbiAgICAgIHZhciBlZGl0b3IxTGluZVRleHQgPSB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmdldEVkaXRvcigpLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGxlZnRMaW5lTnVtYmVyKTtcbiAgICAgIHZhciBlZGl0b3IyTGluZVRleHQgPSB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmdldEVkaXRvcigpLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJpZ2h0TGluZU51bWJlcik7XG5cbiAgICAgIGlmKGVkaXRvcjFMaW5lVGV4dCA9PSAnJykge1xuICAgICAgICAvLyBjb21wdXRlV29yZERpZmYgcmV0dXJucyBlbXB0eSBmb3IgbGluZXMgdGhhdCBhcmUgcGFpcmVkIHdpdGggZW1wdHkgbGluZXNcbiAgICAgICAgLy8gbmVlZCB0byBmb3JjZSBhIGhpZ2hsaWdodFxuICAgICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLnNldFdvcmRIaWdobGlnaHRzKHJpZ2h0TGluZU51bWJlciwgW3tjaGFuZ2VkOiB0cnVlLCB2YWx1ZTogZWRpdG9yMkxpbmVUZXh0fV0sIHJpZ2h0SGlnaGxpZ2h0VHlwZSwgaXNXaGl0ZXNwYWNlSWdub3JlZCk7XG4gICAgICB9IGVsc2UgaWYoIGVkaXRvcjJMaW5lVGV4dCA9PSAnJyApIHtcbiAgICAgICAgLy8gY29tcHV0ZVdvcmREaWZmIHJldHVybnMgZW1wdHkgZm9yIGxpbmVzIHRoYXQgYXJlIHBhaXJlZCB3aXRoIGVtcHR5IGxpbmVzXG4gICAgICAgIC8vIG5lZWQgdG8gZm9yY2UgYSBoaWdobGlnaHRcbiAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5zZXRXb3JkSGlnaGxpZ2h0cyhsZWZ0TGluZU51bWJlciwgW3tjaGFuZ2VkOiB0cnVlLCB2YWx1ZTogZWRpdG9yMUxpbmVUZXh0fV0sIGxlZnRIaWdobGlnaHRUeXBlLCBpc1doaXRlc3BhY2VJZ25vcmVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHBlcmZvcm0gcmVndWxhciB3b3JkIGRpZmZcbiAgICAgICAgdmFyIHdvcmREaWZmID0gQ29tcHV0ZVdvcmREaWZmLmNvbXB1dGVXb3JkRGlmZihlZGl0b3IxTGluZVRleHQsIGVkaXRvcjJMaW5lVGV4dCk7XG4gICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuc2V0V29yZEhpZ2hsaWdodHMobGVmdExpbmVOdW1iZXIsIHdvcmREaWZmLnJlbW92ZWRXb3JkcywgbGVmdEhpZ2hsaWdodFR5cGUsIGlzV2hpdGVzcGFjZUlnbm9yZWQpO1xuICAgICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLnNldFdvcmRIaWdobGlnaHRzKHJpZ2h0TGluZU51bWJlciwgd29yZERpZmYuYWRkZWRXb3JkcywgcmlnaHRIaWdobGlnaHRUeXBlLCBpc1doaXRlc3BhY2VJZ25vcmVkKTtcbiAgICAgIH1cblxuICAgICAgbGVmdExpbmVOdW1iZXIrKztcbiAgICAgIHJpZ2h0TGluZU51bWJlcisrO1xuICAgIH1cblxuICAgIC8vIGhpZ2hsaWdodCByZW1haW5pbmcgbGluZXMgaW4gbGVmdCBlZGl0b3JcbiAgICB3aGlsZShsZWZ0TGluZU51bWJlciA8IGNodW5rLm9sZExpbmVFbmQpIHtcbiAgICAgIHZhciBlZGl0b3IxTGluZVRleHQgPSB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmdldEVkaXRvcigpLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGxlZnRMaW5lTnVtYmVyKTtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuc2V0V29yZEhpZ2hsaWdodHMobGVmdExpbmVOdW1iZXIsIFt7Y2hhbmdlZDogdHJ1ZSwgdmFsdWU6IGVkaXRvcjFMaW5lVGV4dH1dLCBsZWZ0SGlnaGxpZ2h0VHlwZSwgaXNXaGl0ZXNwYWNlSWdub3JlZCk7XG4gICAgICBsZWZ0TGluZU51bWJlcisrO1xuICAgIH1cbiAgICAvLyBoaWdobGlnaHQgcmVtYWluaW5nIGxpbmVzIGluIHRoZSByaWdodCBlZGl0b3JcbiAgICB3aGlsZShyaWdodExpbmVOdW1iZXIgPCBjaHVuay5uZXdMaW5lRW5kKSB7XG4gICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLnNldFdvcmRIaWdobGlnaHRzKHJpZ2h0TGluZU51bWJlciwgW3tjaGFuZ2VkOiB0cnVlLCB2YWx1ZTogdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRFZGl0b3IoKS5saW5lVGV4dEZvckJ1ZmZlclJvdyhyaWdodExpbmVOdW1iZXIpfV0sIHJpZ2h0SGlnaGxpZ2h0VHlwZSwgaXNXaGl0ZXNwYWNlSWdub3JlZCk7XG4gICAgICByaWdodExpbmVOdW1iZXIrKztcbiAgICB9XG4gIH1cbn07XG4iXX0=