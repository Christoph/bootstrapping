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
    this._chunks = [];
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
      this._chunks = diff.chunks || [];

      // make the last chunk equal size on both screens so the editors retain sync scroll #58
      if (this.getNumDifferences() > 0) {
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

      for (var chunk of this._chunks) {
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
        if (this._selectedChunkIndex >= this.getNumDifferences()) {
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
          this._selectedChunkIndex = this.getNumDifferences() - 1;
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

      for (var lineRange of linesToCopy) {
        for (var diffChunk of this._chunks) {
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
      for (var lineRange of linesToCopy) {
        for (var diffChunk of this._chunks) {
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
      return Array.isArray(this._chunks) ? this._chunks.length : 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2RpZmYtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7a0NBRStCLHdCQUF3Qjs7OzsrQkFDM0IscUJBQXFCOzs7O0FBSGpELFdBQVcsQ0FBQTs7QUFNWCxNQUFNLENBQUMsT0FBTzs7Ozs7QUFJRCxXQUpVLFFBQVEsQ0FJakIsT0FBTyxFQUFFOzBCQUpBLFFBQVE7O0FBSzNCLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQ0FBdUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BFLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQ0FBdUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BFLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7QUFDaEMsUUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztBQUM3QixRQUFJLENBQUMsa0JBQWtCLEdBQUcscUNBQXFDLENBQUM7QUFDaEUsUUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7R0FDekI7Ozs7Ozs7Ozs7OztlQVpvQixRQUFROztXQXVCbEIscUJBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFO0FBQy9GLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7OztBQUdqQyxVQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMvQixZQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3RELFlBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFD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O0FBQy9JLHNCQUFjLEVBQUUsQ0FBQztPQUNsQjs7QUFFRCxhQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFFO0FBQ3hDLFlBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBQyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUM3TSx1QkFBZSxFQUFFLENBQUM7T0FDbkI7S0FDRjs7O1NBOVJvQixRQUFRO0lBK1I5QixDQUFDIiwiZmlsZSI6Ii9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2RpZmYtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCBFZGl0b3JEaWZmRXh0ZW5kZXIgZnJvbSAnLi9lZGl0b3ItZGlmZi1leHRlbmRlcic7XG5pbXBvcnQgQ29tcHV0ZVdvcmREaWZmIGZyb20gJy4vY29tcHV0ZS13b3JkLWRpZmYnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlmZlZpZXcge1xuICAvKlxuICAgKiBAcGFyYW0gZWRpdG9ycyBBcnJheSBvZiBlZGl0b3JzIGJlaW5nIGRpZmZlZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVkaXRvcnMpIHtcbiAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxID0gbmV3IEVkaXRvckRpZmZFeHRlbmRlcihlZGl0b3JzLmVkaXRvcjEpO1xuICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIgPSBuZXcgRWRpdG9yRGlmZkV4dGVuZGVyKGVkaXRvcnMuZWRpdG9yMik7XG4gICAgdGhpcy5fY2h1bmtzID0gW107XG4gICAgdGhpcy5faXNTZWxlY3Rpb25BY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLl9zZWxlY3RlZENodW5rSW5kZXggPSAwO1xuICAgIHRoaXMuX0NPUFlfSEVMUF9NRVNTQUdFID0gJ1BsYWNlIHlvdXIgY3Vyc29yIGluIGEgY2h1bmsgZmlyc3QhJztcbiAgICB0aGlzLl9tYXJrZXJMYXllcnMgPSB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGhpZ2hsaWdodGluZyB0byB0aGUgZWRpdG9ycyB0byBzaG93IHRoZSBkaWZmLlxuICAgKlxuICAgKiBAcGFyYW0gZGlmZiBUaGUgZGlmZiB0byBoaWdobGlnaHQuXG4gICAqIEBwYXJhbSBsZWZ0SGlnaGxpZ2h0VHlwZSBUaGUgdHlwZSBvZiBoaWdobGlnaHQgKGV4OiAnYWRkZWQnKS5cbiAgICogQHBhcmFtIHJpZ2h0SGlnaGxpZ2h0VHlwZSBUaGUgdHlwZSBvZiBoaWdobGlnaHQgKGV4OiAncmVtb3ZlZCcpLlxuICAgKiBAcGFyYW0gaXNXb3JkRGlmZkVuYWJsZWQgV2hldGhlciBkaWZmZXJlbmNlcyBiZXR3ZWVuIHdvcmRzIHBlciBsaW5lIHNob3VsZCBiZSBoaWdobGlnaHRlZC5cbiAgICogQHBhcmFtIGlzV2hpdGVzcGFjZUlnbm9yZWQgV2hldGhlciB3aGl0ZXNwYWNlIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgKi9cbiAgZGlzcGxheURpZmYoZGlmZiwgbGVmdEhpZ2hsaWdodFR5cGUsIHJpZ2h0SGlnaGxpZ2h0VHlwZSwgaXNXb3JkRGlmZkVuYWJsZWQsIGlzV2hpdGVzcGFjZUlnbm9yZWQpIHtcbiAgICB0aGlzLl9jaHVua3MgPSBkaWZmLmNodW5rcyB8fCBbXTtcblxuICAgIC8vIG1ha2UgdGhlIGxhc3QgY2h1bmsgZXF1YWwgc2l6ZSBvbiBib3RoIHNjcmVlbnMgc28gdGhlIGVkaXRvcnMgcmV0YWluIHN5bmMgc2Nyb2xsICM1OFxuICAgIGlmKHRoaXMuZ2V0TnVtRGlmZmVyZW5jZXMoKSA+IDApIHtcbiAgICAgIHZhciBsYXN0Q2h1bmsgPSB0aGlzLl9jaHVua3NbdGhpcy5fY2h1bmtzLmxlbmd0aCAtIDFdO1xuICAgICAgdmFyIG9sZENodW5rUmFuZ2UgPSBsYXN0Q2h1bmsub2xkTGluZUVuZCAtIGxhc3RDaHVuay5vbGRMaW5lU3RhcnQ7XG4gICAgICB2YXIgbmV3Q2h1bmtSYW5nZSA9IGxhc3RDaHVuay5uZXdMaW5lRW5kIC0gbGFzdENodW5rLm5ld0xpbmVTdGFydDtcbiAgICAgIGlmKG9sZENodW5rUmFuZ2UgPiBuZXdDaHVua1JhbmdlKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIG9mZnNldCBhcyBsYXJnZSBhcyBuZWVkZWQgdG8gbWFrZSB0aGUgY2h1bmsgdGhlIHNhbWUgc2l6ZSBpbiBib3RoIGVkaXRvcnNcbiAgICAgICAgZGlmZi5uZXdMaW5lT2Zmc2V0c1tsYXN0Q2h1bmsubmV3TGluZVN0YXJ0ICsgbmV3Q2h1bmtSYW5nZV0gPSBvbGRDaHVua1JhbmdlIC0gbmV3Q2h1bmtSYW5nZTtcbiAgICAgIH0gZWxzZSBpZihuZXdDaHVua1JhbmdlID4gb2xkQ2h1bmtSYW5nZSkge1xuICAgICAgICAvLyBtYWtlIHRoZSBvZmZzZXQgYXMgbGFyZ2UgYXMgbmVlZGVkIHRvIG1ha2UgdGhlIGNodW5rIHRoZSBzYW1lIHNpemUgaW4gYm90aCBlZGl0b3JzXG4gICAgICAgIGRpZmYub2xkTGluZU9mZnNldHNbbGFzdENodW5rLm9sZExpbmVTdGFydCArIG9sZENodW5rUmFuZ2VdID0gbmV3Q2h1bmtSYW5nZSAtIG9sZENodW5rUmFuZ2U7XG4gICAgICB9XG4gICAgfSBcblxuICAgIGZvcih2YXIgY2h1bmsgb2YgdGhpcy5fY2h1bmtzKSB7XG4gICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmhpZ2hsaWdodExpbmVzKGNodW5rLm9sZExpbmVTdGFydCwgY2h1bmsub2xkTGluZUVuZCwgbGVmdEhpZ2hsaWdodFR5cGUpO1xuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5oaWdobGlnaHRMaW5lcyhjaHVuay5uZXdMaW5lU3RhcnQsIGNodW5rLm5ld0xpbmVFbmQsIHJpZ2h0SGlnaGxpZ2h0VHlwZSk7XG5cbiAgICAgIGlmKGlzV29yZERpZmZFbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2hpZ2hsaWdodFdvcmRzSW5DaHVuayhjaHVuaywgbGVmdEhpZ2hsaWdodFR5cGUsIHJpZ2h0SGlnaGxpZ2h0VHlwZSwgaXNXaGl0ZXNwYWNlSWdub3JlZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5zZXRMaW5lT2Zmc2V0cyhkaWZmLm9sZExpbmVPZmZzZXRzKTtcbiAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLnNldExpbmVPZmZzZXRzKGRpZmYubmV3TGluZU9mZnNldHMpO1xuXG4gICAgdGhpcy5fbWFya2VyTGF5ZXJzID0ge1xuICAgICAgZWRpdG9yMToge1xuICAgICAgICBpZDogdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRFZGl0b3IoKS5pZCxcbiAgICAgICAgbGluZU1hcmtlckxheWVyOiB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmdldExpbmVNYXJrZXJMYXllcigpLFxuICAgICAgICBoaWdobGlnaHRUeXBlOiBsZWZ0SGlnaGxpZ2h0VHlwZSxcbiAgICAgICAgc2VsZWN0aW9uTWFya2VyTGF5ZXI6IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0U2VsZWN0aW9uTWFya2VyTGF5ZXIoKVxuICAgICAgfSxcbiAgICAgIGVkaXRvcjI6IHtcbiAgICAgICAgaWQ6IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0RWRpdG9yKCkuaWQsXG4gICAgICAgIGxpbmVNYXJrZXJMYXllcjogdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRMaW5lTWFya2VyTGF5ZXIoKSxcbiAgICAgICAgaGlnaGxpZ2h0VHlwZTogcmlnaHRIaWdobGlnaHRUeXBlLFxuICAgICAgICBzZWxlY3Rpb25NYXJrZXJMYXllcjogdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRTZWxlY3Rpb25NYXJrZXJMYXllcigpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgZGlmZiBoaWdobGlnaHRpbmcgYW5kIG9mZnNldHMgZnJvbSB0aGUgZWRpdG9ycy5cbiAgICovXG4gIGNsZWFyRGlmZigpIHtcbiAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmRlc3Ryb3lNYXJrZXJzKCk7XG4gICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5kZXN0cm95TWFya2VycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB0byBtb3ZlIHRoZSBjdXJyZW50IHNlbGVjdGlvbiBoaWdobGlnaHQgdG8gdGhlIG5leHQgZGlmZiBjaHVuay5cbiAgICovXG4gIG5leHREaWZmKCkge1xuICAgIGlmKHRoaXMuX2lzU2VsZWN0aW9uQWN0aXZlKSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZENodW5rSW5kZXgrKztcbiAgICAgIGlmKHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleCA+PSB0aGlzLmdldE51bURpZmZlcmVuY2VzKCkpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4ID0gMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5faXNTZWxlY3Rpb25BY3RpdmUgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX3NlbGVjdENodW5rKHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleCk7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgdG8gbW92ZSB0aGUgY3VycmVudCBzZWxlY3Rpb24gaGlnaGxpZ2h0IHRvIHRoZSBwcmV2aW91cyBkaWZmIGNodW5rLlxuICAgKi9cbiAgcHJldkRpZmYoKSB7XG4gICAgaWYodGhpcy5faXNTZWxlY3Rpb25BY3RpdmUpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleC0tO1xuICAgICAgaWYodGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4IDwgMCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZENodW5rSW5kZXggPSB0aGlzLmdldE51bURpZmZlcmVuY2VzKCkgLSAxXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2lzU2VsZWN0aW9uQWN0aXZlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZWxlY3RDaHVuayh0aGlzLl9zZWxlY3RlZENodW5rSW5kZXgpO1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZENodW5rSW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZGlmZiBjaHVuayBmcm9tIHRoZSBsZWZ0IGVkaXRvciB0byB0aGUgcmlnaHRcbiAgICogZWRpdG9yLlxuICAgKi9cbiAgY29weVRvUmlnaHQoKSB7XG4gICAgdmFyIGxpbmVzVG9Db3B5ID0gdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRDdXJzb3JEaWZmTGluZXMoKTtcblxuICAgIGlmKGxpbmVzVG9Db3B5Lmxlbmd0aCA9PSAwKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IHRoaXMuX0NPUFlfSEVMUF9NRVNTQUdFLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG4gICAgfVxuXG4gICAgLy8ga2VlcCB0cmFjayBvZiBsaW5lIG9mZnNldCAodXNlZCB3aGVuIHRoZXJlIGFyZSBtdWx0aXBsZSBjaHVua3MgYmVpbmcgbW92ZWQpXG4gICAgdmFyIG9mZnNldCA9IDA7XG5cbiAgICBmb3IodmFyIGxpbmVSYW5nZSBvZiBsaW5lc1RvQ29weSkge1xuICAgICAgZm9yKHZhciBkaWZmQ2h1bmsgb2YgdGhpcy5fY2h1bmtzKSB7XG4gICAgICAgIGlmKGxpbmVSYW5nZS5zdGFydC5yb3cgPT0gZGlmZkNodW5rLm9sZExpbmVTdGFydCkge1xuICAgICAgICAgIHZhciB0ZXh0VG9Db3B5ID0gdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5nZXRFZGl0b3IoKS5nZXRUZXh0SW5CdWZmZXJSYW5nZShbW2RpZmZDaHVuay5vbGRMaW5lU3RhcnQsIDBdLCBbZGlmZkNodW5rLm9sZExpbmVFbmQsIDBdXSk7XG4gICAgICAgICAgdmFyIGxhc3RCdWZmZXJSb3cgPSB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmdldEVkaXRvcigpLmdldExhc3RCdWZmZXJSb3coKTtcblxuICAgICAgICAgIC8vIGluc2VydCBuZXcgbGluZSBpZiB0aGUgY2h1bmsgd2Ugd2FudCB0byBjb3B5IHdpbGwgYmUgYmVsb3cgdGhlIGxhc3QgbGluZSBvZiB0aGUgb3RoZXIgZWRpdG9yXG4gICAgICAgICAgaWYoKGRpZmZDaHVuay5uZXdMaW5lU3RhcnQgKyBvZmZzZXQpID4gbGFzdEJ1ZmZlclJvdykge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRFZGl0b3IoKS5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihbbGFzdEJ1ZmZlclJvdywgMF0sIHthdXRvc2Nyb2xsOiBmYWxzZX0pO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRFZGl0b3IoKS5pbnNlcnROZXdsaW5lKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRFZGl0b3IoKS5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW2RpZmZDaHVuay5uZXdMaW5lU3RhcnQgKyBvZmZzZXQsIDBdLCBbZGlmZkNodW5rLm5ld0xpbmVFbmQgKyBvZmZzZXQsIDBdXSwgdGV4dFRvQ29weSk7XG4gICAgICAgICAgLy8gb2Zmc2V0IHdpbGwgYmUgdGhlIGFtb3VudCBvZiBsaW5lcyB0byBiZSBjb3BpZWQgbWludXMgdGhlIGFtb3VudCBvZiBsaW5lcyBvdmVyd3JpdHRlblxuICAgICAgICAgIG9mZnNldCArPSAoZGlmZkNodW5rLm9sZExpbmVFbmQgLSBkaWZmQ2h1bmsub2xkTGluZVN0YXJ0KSAtIChkaWZmQ2h1bmsubmV3TGluZUVuZCAtIGRpZmZDaHVuay5uZXdMaW5lU3RhcnQpO1xuICAgICAgICAgIC8vIG1vdmUgdGhlIHNlbGVjdGlvbiBwb2ludGVyIGJhY2sgc28gdGhlIG5leHQgZGlmZiBjaHVuayBpcyBub3Qgc2tpcHBlZFxuICAgICAgICAgIGlmKHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuaGFzU2VsZWN0aW9uKCkgfHwgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRDaHVua0luZGV4LS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGRpZmYgY2h1bmsgZnJvbSB0aGUgcmlnaHQgZWRpdG9yIHRvIHRoZSBsZWZ0XG4gICAqIGVkaXRvci5cbiAgICovXG4gIGNvcHlUb0xlZnQoKSB7XG4gICAgdmFyIGxpbmVzVG9Db3B5ID0gdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRDdXJzb3JEaWZmTGluZXMoKTtcblxuICAgIGlmKGxpbmVzVG9Db3B5Lmxlbmd0aCA9PSAwKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IHRoaXMuX0NPUFlfSEVMUF9NRVNTQUdFLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pO1xuICAgIH1cblxuICAgIHZhciBvZmZzZXQgPSAwOyAvLyBrZWVwIHRyYWNrIG9mIGxpbmUgb2Zmc2V0ICh1c2VkIHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlIGNodW5rcyBiZWluZyBtb3ZlZClcbiAgICBmb3IodmFyIGxpbmVSYW5nZSBvZiBsaW5lc1RvQ29weSkge1xuICAgICAgZm9yKHZhciBkaWZmQ2h1bmsgb2YgdGhpcy5fY2h1bmtzKSB7XG4gICAgICAgIGlmKGxpbmVSYW5nZS5zdGFydC5yb3cgPT0gZGlmZkNodW5rLm5ld0xpbmVTdGFydCkge1xuICAgICAgICAgIHZhciB0ZXh0VG9Db3B5ID0gdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5nZXRFZGl0b3IoKS5nZXRUZXh0SW5CdWZmZXJSYW5nZShbW2RpZmZDaHVuay5uZXdMaW5lU3RhcnQsIDBdLCBbZGlmZkNodW5rLm5ld0xpbmVFbmQsIDBdXSk7XG4gICAgICAgICAgdmFyIGxhc3RCdWZmZXJSb3cgPSB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmdldEVkaXRvcigpLmdldExhc3RCdWZmZXJSb3coKTtcbiAgICAgICAgICAvLyBpbnNlcnQgbmV3IGxpbmUgaWYgdGhlIGNodW5rIHdlIHdhbnQgdG8gY29weSB3aWxsIGJlIGJlbG93IHRoZSBsYXN0IGxpbmUgb2YgdGhlIG90aGVyIGVkaXRvclxuICAgICAgICAgIGlmKChkaWZmQ2h1bmsub2xkTGluZVN0YXJ0ICsgb2Zmc2V0KSA+IGxhc3RCdWZmZXJSb3cpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oW2xhc3RCdWZmZXJSb3csIDBdLCB7YXV0b3Njcm9sbDogZmFsc2V9KTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuaW5zZXJ0TmV3bGluZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tkaWZmQ2h1bmsub2xkTGluZVN0YXJ0ICsgb2Zmc2V0LCAwXSwgW2RpZmZDaHVuay5vbGRMaW5lRW5kICsgb2Zmc2V0LCAwXV0sIHRleHRUb0NvcHkpO1xuICAgICAgICAgIC8vIG9mZnNldCB3aWxsIGJlIHRoZSBhbW91bnQgb2YgbGluZXMgdG8gYmUgY29waWVkIG1pbnVzIHRoZSBhbW91bnQgb2YgbGluZXMgb3ZlcndyaXR0ZW5cbiAgICAgICAgICBvZmZzZXQgKz0gKGRpZmZDaHVuay5uZXdMaW5lRW5kIC0gZGlmZkNodW5rLm5ld0xpbmVTdGFydCkgLSAoZGlmZkNodW5rLm9sZExpbmVFbmQgLSBkaWZmQ2h1bmsub2xkTGluZVN0YXJ0KTtcbiAgICAgICAgICAvLyBtb3ZlIHRoZSBzZWxlY3Rpb24gcG9pbnRlciBiYWNrIHNvIHRoZSBuZXh0IGRpZmYgY2h1bmsgaXMgbm90IHNraXBwZWRcbiAgICAgICAgICBpZih0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmhhc1NlbGVjdGlvbigpIHx8IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuaGFzU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkQ2h1bmtJbmRleC0tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgdGhlIGVkaXRvciBpbmRpY2F0ZWQgYnkgaW5kZXguIEEgY2xlYW4gdXAgd2lsbCByZW1vdmUgdGhlIGVkaXRvclxuICAgKiBvciB0aGUgcGFuZSBpZiBuZWNlc3NhcnkuIFR5cGljYWxseSBsZWZ0IGVkaXRvciA9PSAxIGFuZCByaWdodCBlZGl0b3IgPT0gMi5cbiAgICpcbiAgICogQHBhcmFtIGVkaXRvckluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWRpdG9yIHRvIGNsZWFuIHVwLlxuICAgKi9cbiAgY2xlYW5VcEVkaXRvcihlZGl0b3JJbmRleCkge1xuICAgIGlmKGVkaXRvckluZGV4ID09PSAxKSB7XG4gICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmNsZWFuVXAoKTtcbiAgICB9IGVsc2UgaWYoZWRpdG9ySW5kZXggPT09IDIpIHtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuY2xlYW5VcCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZWRpdG9yIGRpZmYgZXh0ZW5kZXJzLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgZWRpdG9ycy5cbiAgICpcbiAgICogQHJldHVybiBpbnQgVGhlIG51bWJlciBvZiBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBlZGl0b3JzLlxuICAgKi9cbiAgZ2V0TnVtRGlmZmVyZW5jZXMoKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodGhpcy5fY2h1bmtzKSA/IHRoaXMuX2NodW5rcy5sZW5ndGggOiAwO1xuICB9XG5cbiAgZ2V0TWFya2VyTGF5ZXJzKCkge1xuICAgIHJldHVybiB0aGlzLl9tYXJrZXJMYXllcnM7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBTZWxlY3RzIGFuZCBoaWdobGlnaHRzIHRoZSBkaWZmIGNodW5rIGluIGJvdGggZWRpdG9ycyBhY2NvcmRpbmcgdG8gdGhlXG4gICAqIGdpdmVuIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBkaWZmIGNodW5rIHRvIGhpZ2hsaWdodCBpbiBib3RoIGVkaXRvcnMuXG4gICAqL1xuICBfc2VsZWN0Q2h1bmsoaW5kZXgpIHtcbiAgICB2YXIgZGlmZkNodW5rID0gdGhpcy5fY2h1bmtzW2luZGV4XTtcbiAgICBpZihkaWZmQ2h1bmsgIT0gbnVsbCkge1xuICAgICAgLy8gZGVzZWxlY3QgcHJldmlvdXMgbmV4dC9wcmV2IGhpZ2hsaWdodHNcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZGVzZWxlY3RBbGxMaW5lcygpO1xuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5kZXNlbGVjdEFsbExpbmVzKCk7XG4gICAgICAvLyBoaWdobGlnaHQgYW5kIHNjcm9sbCBlZGl0b3IgMVxuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5zZWxlY3RMaW5lcyggZGlmZkNodW5rLm9sZExpbmVTdGFydCwgZGlmZkNodW5rLm9sZExpbmVFbmQgKTtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oIFtkaWZmQ2h1bmsub2xkTGluZVN0YXJ0LCAwXSwge2F1dG9zY3JvbGw6IHRydWV9ICk7XG4gICAgICAvLyBoaWdobGlnaHQgYW5kIHNjcm9sbCBlZGl0b3IgMlxuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMi5zZWxlY3RMaW5lcyggZGlmZkNodW5rLm5ld0xpbmVTdGFydCwgZGlmZkNodW5rLm5ld0xpbmVFbmQgKTtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0RWRpdG9yKCkuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oIFtkaWZmQ2h1bmsubmV3TGluZVN0YXJ0LCAwXSwge2F1dG9zY3JvbGw6IHRydWV9ICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhpZ2hsaWdodHMgdGhlIHdvcmQgZGlmZiBvZiB0aGUgY2h1bmsgcGFzc2VkIGluLlxuICAgKlxuICAgKiBAcGFyYW0gY2h1bmsgVGhlIGNodW5rIHRoYXQgc2hvdWxkIGhhdmUgaXRzIHdvcmRzIGhpZ2hsaWdodGVkLlxuICAgKi9cbiAgX2hpZ2hsaWdodFdvcmRzSW5DaHVuayhjaHVuaywgbGVmdEhpZ2hsaWdodFR5cGUsIHJpZ2h0SGlnaGxpZ2h0VHlwZSwgaXNXaGl0ZXNwYWNlSWdub3JlZCkge1xuICAgIHZhciBsZWZ0TGluZU51bWJlciA9IGNodW5rLm9sZExpbmVTdGFydDtcbiAgICB2YXIgcmlnaHRMaW5lTnVtYmVyID0gY2h1bmsubmV3TGluZVN0YXJ0O1xuICAgIC8vIGZvciBlYWNoIGxpbmUgdGhhdCBoYXMgYSBjb3JyZXNwb25kaW5nIGxpbmVcbiAgICB3aGlsZShsZWZ0TGluZU51bWJlciA8IGNodW5rLm9sZExpbmVFbmQgJiYgcmlnaHRMaW5lTnVtYmVyIDwgY2h1bmsubmV3TGluZUVuZCkge1xuICAgICAgdmFyIGVkaXRvcjFMaW5lVGV4dCA9IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkubGluZVRleHRGb3JCdWZmZXJSb3cobGVmdExpbmVOdW1iZXIpO1xuICAgICAgdmFyIGVkaXRvcjJMaW5lVGV4dCA9IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuZ2V0RWRpdG9yKCkubGluZVRleHRGb3JCdWZmZXJSb3cocmlnaHRMaW5lTnVtYmVyKTtcblxuICAgICAgaWYoZWRpdG9yMUxpbmVUZXh0ID09ICcnKSB7XG4gICAgICAgIC8vIGNvbXB1dGVXb3JkRGlmZiByZXR1cm5zIGVtcHR5IGZvciBsaW5lcyB0aGF0IGFyZSBwYWlyZWQgd2l0aCBlbXB0eSBsaW5lc1xuICAgICAgICAvLyBuZWVkIHRvIGZvcmNlIGEgaGlnaGxpZ2h0XG4gICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuc2V0V29yZEhpZ2hsaWdodHMocmlnaHRMaW5lTnVtYmVyLCBbe2NoYW5nZWQ6IHRydWUsIHZhbHVlOiBlZGl0b3IyTGluZVRleHR9XSwgcmlnaHRIaWdobGlnaHRUeXBlLCBpc1doaXRlc3BhY2VJZ25vcmVkKTtcbiAgICAgIH0gZWxzZSBpZiggZWRpdG9yMkxpbmVUZXh0ID09ICcnICkge1xuICAgICAgICAvLyBjb21wdXRlV29yZERpZmYgcmV0dXJucyBlbXB0eSBmb3IgbGluZXMgdGhhdCBhcmUgcGFpcmVkIHdpdGggZW1wdHkgbGluZXNcbiAgICAgICAgLy8gbmVlZCB0byBmb3JjZSBhIGhpZ2hsaWdodFxuICAgICAgICB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIxLnNldFdvcmRIaWdobGlnaHRzKGxlZnRMaW5lTnVtYmVyLCBbe2NoYW5nZWQ6IHRydWUsIHZhbHVlOiBlZGl0b3IxTGluZVRleHR9XSwgbGVmdEhpZ2hsaWdodFR5cGUsIGlzV2hpdGVzcGFjZUlnbm9yZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcGVyZm9ybSByZWd1bGFyIHdvcmQgZGlmZlxuICAgICAgICB2YXIgd29yZERpZmYgPSBDb21wdXRlV29yZERpZmYuY29tcHV0ZVdvcmREaWZmKGVkaXRvcjFMaW5lVGV4dCwgZWRpdG9yMkxpbmVUZXh0KTtcbiAgICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5zZXRXb3JkSGlnaGxpZ2h0cyhsZWZ0TGluZU51bWJlciwgd29yZERpZmYucmVtb3ZlZFdvcmRzLCBsZWZ0SGlnaGxpZ2h0VHlwZSwgaXNXaGl0ZXNwYWNlSWdub3JlZCk7XG4gICAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuc2V0V29yZEhpZ2hsaWdodHMocmlnaHRMaW5lTnVtYmVyLCB3b3JkRGlmZi5hZGRlZFdvcmRzLCByaWdodEhpZ2hsaWdodFR5cGUsIGlzV2hpdGVzcGFjZUlnbm9yZWQpO1xuICAgICAgfVxuXG4gICAgICBsZWZ0TGluZU51bWJlcisrO1xuICAgICAgcmlnaHRMaW5lTnVtYmVyKys7XG4gICAgfVxuXG4gICAgLy8gaGlnaGxpZ2h0IHJlbWFpbmluZyBsaW5lcyBpbiBsZWZ0IGVkaXRvclxuICAgIHdoaWxlKGxlZnRMaW5lTnVtYmVyIDwgY2h1bmsub2xkTGluZUVuZCkge1xuICAgICAgdmFyIGVkaXRvcjFMaW5lVGV4dCA9IHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjEuZ2V0RWRpdG9yKCkubGluZVRleHRGb3JCdWZmZXJSb3cobGVmdExpbmVOdW1iZXIpO1xuICAgICAgdGhpcy5fZWRpdG9yRGlmZkV4dGVuZGVyMS5zZXRXb3JkSGlnaGxpZ2h0cyhsZWZ0TGluZU51bWJlciwgW3tjaGFuZ2VkOiB0cnVlLCB2YWx1ZTogZWRpdG9yMUxpbmVUZXh0fV0sIGxlZnRIaWdobGlnaHRUeXBlLCBpc1doaXRlc3BhY2VJZ25vcmVkKTtcbiAgICAgIGxlZnRMaW5lTnVtYmVyKys7XG4gICAgfVxuICAgIC8vIGhpZ2hsaWdodCByZW1haW5pbmcgbGluZXMgaW4gdGhlIHJpZ2h0IGVkaXRvclxuICAgIHdoaWxlKHJpZ2h0TGluZU51bWJlciA8IGNodW5rLm5ld0xpbmVFbmQpIHtcbiAgICAgIHRoaXMuX2VkaXRvckRpZmZFeHRlbmRlcjIuc2V0V29yZEhpZ2hsaWdodHMocmlnaHRMaW5lTnVtYmVyLCBbe2NoYW5nZWQ6IHRydWUsIHZhbHVlOiB0aGlzLl9lZGl0b3JEaWZmRXh0ZW5kZXIyLmdldEVkaXRvcigpLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJpZ2h0TGluZU51bWJlcil9XSwgcmlnaHRIaWdobGlnaHRUeXBlLCBpc1doaXRlc3BhY2VJZ25vcmVkKTtcbiAgICAgIHJpZ2h0TGluZU51bWJlcisrO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==