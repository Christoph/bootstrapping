'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

module.exports = (function () {
  function EditorDiffExtender(editor) {
    _classCallCheck(this, EditorDiffExtender);

    this._editor = editor;
    this._lineMarkerLayer = this._editor.addMarkerLayer();
    this._miscMarkers = [];
    this._selectionMarkerLayer = this._editor.addMarkerLayer();
    this._oldPlaceholderText = editor.getPlaceholderText();
    editor.setPlaceholderText('Paste what you want to diff here!');
    // add split-diff css selector to editors for keybindings #73
    atom.views.getView(this._editor).classList.add('split-diff');
  }

  /**
   * Adds offsets (blank lines) into the editor.
   *
   * @param lineOffsets An array of offsets (blank lines) to insert into this editor.
   */

  _createClass(EditorDiffExtender, [{
    key: 'setLineOffsets',
    value: function setLineOffsets(lineOffsets) {
      var offsetLineNumbers = Object.keys(lineOffsets).map(function (lineNumber) {
        return parseInt(lineNumber, 10);
      }).sort(function (x, y) {
        return x - y;
      });

      for (var offsetLineNumber of offsetLineNumbers) {
        if (offsetLineNumber == 0) {
          // add block decoration before if adding to line 0
          this._addOffsetDecoration(offsetLineNumber - 1, lineOffsets[offsetLineNumber], 'before');
        } else {
          // add block decoration after if adding to lines > 0
          this._addOffsetDecoration(offsetLineNumber - 1, lineOffsets[offsetLineNumber], 'after');
        }
      }
    }

    /**
     * Creates marker for line highlight.
     *
     * @param startIndex The start index of the line chunk to highlight.
     * @param endIndex The end index of the line chunk to highlight.
     * @param highlightType The type of highlight to be applied to the line.
     */
  }, {
    key: 'highlightLines',
    value: function highlightLines(startIndex, endIndex, highlightType) {
      if (startIndex != endIndex) {
        var highlightClass = 'split-diff-' + highlightType;
        this._createLineMarker(this._lineMarkerLayer, startIndex, endIndex, highlightClass);
      }
    }

    /**
     * The line marker layer holds all added/removed line markers.
     *
     * @return The line marker layer.
     */
  }, {
    key: 'getLineMarkerLayer',
    value: function getLineMarkerLayer() {
      return this._lineMarkerLayer;
    }

    /**
     * The selection marker layer holds all line highlight selection markers.
     *
     * @return The selection marker layer.
     */
  }, {
    key: 'getSelectionMarkerLayer',
    value: function getSelectionMarkerLayer() {
      return this._selectionMarkerLayer;
    }

    /**
     * Highlights words in a given line.
     *
     * @param lineNumber The line number to highlight words on.
     * @param wordDiff An array of objects which look like...
     *    added: boolean (not used)
     *    count: number (not used)
     *    removed: boolean (not used)
     *    value: string
     *    changed: boolean
     * @param type The type of highlight to be applied to the words.
     */
  }, {
    key: 'setWordHighlights',
    value: function setWordHighlights(lineNumber, wordDiff, type, isWhitespaceIgnored) {
      if (wordDiff === undefined) wordDiff = [];

      var klass = 'split-diff-word-' + type;
      var count = 0;

      for (var i = 0; i < wordDiff.length; i++) {
        if (wordDiff[i].value) {
          // fix for #49
          // if there was a change
          // AND one of these is true:
          // if the string is not spaces, highlight
          // OR
          // if the string is spaces and whitespace not ignored, highlight
          if (wordDiff[i].changed && (/\S/.test(wordDiff[i].value) || !/\S/.test(wordDiff[i].value) && !isWhitespaceIgnored)) {
            var marker = this._editor.markBufferRange([[lineNumber, count], [lineNumber, count + wordDiff[i].value.length]], { invalidate: 'never' });
            this._editor.decorateMarker(marker, { type: 'highlight', 'class': klass });
            this._miscMarkers.push(marker);
          }
          count += wordDiff[i].value.length;
        }
      }
    }

    /**
     * Destroys all markers added to this editor by split-diff.
     */
  }, {
    key: 'destroyMarkers',
    value: function destroyMarkers() {
      this._lineMarkerLayer.clear();

      this._miscMarkers.forEach(function (marker) {
        marker.destroy();
      });
      this._miscMarkers = [];

      this._selectionMarkerLayer.clear();
    }

    /**
     * Destroys the instance of the EditorDiffExtender and cleans up after itself.
     */
  }, {
    key: 'destroy',
    value: function destroy() {
      this.destroyMarkers();
      this._lineMarkerLayer.destroy();
      this._editor.setPlaceholderText(this._oldPlaceholderText);
      // remove split-diff css selector from editors for keybindings #73
      atom.views.getView(this._editor).classList.remove('split-diff');
    }

    /**
     * Selects lines.
     *
     * @param startLine The line number that the selection starts at.
     * @param endLine The line number that the selection ends at (non-inclusive).
     */
  }, {
    key: 'selectLines',
    value: function selectLines(startLine, endLine) {
      // don't want to highlight if they are the same (same numbers means chunk is
      // just pointing to a location to copy-to-right/copy-to-left)
      if (startLine < endLine) {
        this._createLineMarker(this._selectionMarkerLayer, startLine, endLine, 'split-diff-selected');
      }
    }

    /**
     * Destroy the selection markers.
     */
  }, {
    key: 'deselectAllLines',
    value: function deselectAllLines() {
      this._selectionMarkerLayer.clear();
    }

    /**
     * Used to test whether there is currently an active selection highlight in
     * the editor.
     *
     * @return A boolean signifying whether there is an active selection highlight.
     */
  }, {
    key: 'hasSelection',
    value: function hasSelection() {
      if (this._selectionMarkerLayer.getMarkerCount() > 0) {
        return true;
      }
      return false;
    }

    /**
     * Enable soft wrap for this editor.
     */
  }, {
    key: 'enableSoftWrap',
    value: function enableSoftWrap() {
      try {
        this._editor.setSoftWrapped(true);
      } catch (e) {
        //console.log('Soft wrap was enabled on a text editor that does not exist.');
      }
    }

    /**
     * Removes the text editor without prompting a save.
     */
  }, {
    key: 'cleanUp',
    value: function cleanUp() {
      // if the pane that this editor was in is now empty, we will destroy it
      var editorPane = atom.workspace.paneForItem(this._editor);
      if (typeof editorPane !== 'undefined' && editorPane != null && editorPane.getItems().length == 1) {
        editorPane.destroy();
      } else {
        this._editor.destroy();
      }
    }

    /**
     * Finds cursor-touched line ranges that are marked as different in an editor
     * view.
     *
     * @return The line ranges of diffs that are touched by a cursor.
     */
  }, {
    key: 'getCursorDiffLines',
    value: function getCursorDiffLines() {
      var cursorPositions = this._editor.getCursorBufferPositions();
      var touchedLines = [];
      var lineMarkers = this._lineMarkerLayer.getMarkers();

      for (var i = 0; i < cursorPositions.length; i++) {
        for (var j = 0; j < lineMarkers.length; j++) {
          var markerRange = lineMarkers[j].getBufferRange();

          if (cursorPositions[i].row >= markerRange.start.row && cursorPositions[i].row < markerRange.end.row) {
            touchedLines.push(markerRange);
            break;
          }
        }
      }

      // put the chunks in order so the copy function doesn't mess up
      touchedLines.sort(function (lineA, lineB) {
        return lineA.start.row - lineB.start.row;
      });

      return touchedLines;
    }

    /**
     * Used to get the Text Editor object for this view. Helpful for calling basic
     * Atom Text Editor functions.
     *
     * @return The Text Editor object for this view.
     */
  }, {
    key: 'getEditor',
    value: function getEditor() {
      return this._editor;
    }

    // ----------------------------------------------------------------------- //
    // --------------------------- PRIVATE METHODS --------------------------- //
    // ----------------------------------------------------------------------- //

    /**
     * Creates a marker and decorates its line and line number.
     *
     * @param markerLayer The marker layer to put the marker in.
     * @param startLineNumber A buffer line number to start highlighting at.
     * @param endLineNumber A buffer line number to end highlighting at.
     * @param highlightClass The type of highlight to be applied to the line.
     *    Could be a value of: ['split-diff-insert', 'split-diff-delete',
     *    'split-diff-select'].
     * @return The created line marker.
     */
  }, {
    key: '_createLineMarker',
    value: function _createLineMarker(markerLayer, startLineNumber, endLineNumber, highlightClass) {
      var marker = markerLayer.markBufferRange([[startLineNumber, 0], [endLineNumber, 0]], { invalidate: 'never' });

      this._editor.decorateMarker(marker, { type: 'line-number', 'class': highlightClass });
      this._editor.decorateMarker(marker, { type: 'line', 'class': highlightClass });

      return marker;
    }

    /**
     * Creates a decoration for an offset.
     *
     * @param lineNumber The line number to add the block decoration to.
     * @param numberOfLines The number of lines that the block decoration's height will be.
     * @param blockPosition Specifies whether to put the decoration before the line or after.
     */
  }, {
    key: '_addOffsetDecoration',
    value: function _addOffsetDecoration(lineNumber, numberOfLines, blockPosition) {
      var element = document.createElement('div');
      element.className += 'split-diff-offset';
      // if no text, set height for blank lines
      element.style.minHeight = numberOfLines * this._editor.getLineHeightInPixels() + 'px';

      var marker = this._editor.markScreenPosition([lineNumber, 0], { invalidate: 'never' });
      this._editor.decorateMarker(marker, { type: 'block', position: blockPosition, item: element });
      this._miscMarkers.push(marker);
    }
  }]);

  return EditorDiffExtender;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2VkaXRvci1kaWZmLWV4dGVuZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7O0FBRVgsTUFBTSxDQUFDLE9BQU87QUFFRCxXQUZVLGtCQUFrQixDQUUzQixNQUFNLEVBQUU7MEJBRkMsa0JBQWtCOztBQUdyQyxRQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUN0QixRQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN0RCxRQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUN2QixRQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMzRCxRQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDdkQsVUFBTSxDQUFDLGtCQUFrQixDQUFDLG1DQUFtQyxDQUFDLENBQUM7O0FBRS9ELFFBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0dBQzlEOzs7Ozs7OztlQVhvQixrQkFBa0I7O1dBa0J6Qix3QkFBQyxXQUFXLEVBQUU7QUFDMUIsVUFBSSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFBLFVBQVU7ZUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQztlQUFLLENBQUMsR0FBRyxDQUFDO09BQUEsQ0FBQyxDQUFDOztBQUVuSCxXQUFJLElBQUksZ0JBQWdCLElBQUksaUJBQWlCLEVBQUU7QUFDN0MsWUFBRyxnQkFBZ0IsSUFBSSxDQUFDLEVBQUU7O0FBRXhCLGNBQUksQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsR0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDeEYsTUFBTTs7QUFFTCxjQUFJLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEdBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZGO09BQ0Y7S0FDRjs7Ozs7Ozs7Ozs7V0FTYSx3QkFBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRTtBQUNsRCxVQUFHLFVBQVUsSUFBSSxRQUFRLEVBQUU7QUFDekIsWUFBSSxjQUFjLEdBQUcsYUFBYSxHQUFHLGFBQWEsQ0FBQztBQUNuRCxZQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7T0FDckY7S0FDRjs7Ozs7Ozs7O1dBT2lCLDhCQUFHO0FBQ25CLGFBQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO0tBQzlCOzs7Ozs7Ozs7V0FPc0IsbUNBQUc7QUFDeEIsYUFBTyxJQUFJLENBQUMscUJBQXFCLENBQUM7S0FDbkM7Ozs7Ozs7Ozs7Ozs7Ozs7V0FjZ0IsMkJBQUMsVUFBVSxFQUFFLFFBQVEsRUFBTyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7VUFBMUMsUUFBUSxnQkFBUixRQUFRLEdBQUcsRUFBRTs7QUFDekMsVUFBSSxLQUFLLEdBQUcsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQ3RDLFVBQUksS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFZCxXQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNuQyxZQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUU7Ozs7Ozs7QUFNcEIsY0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxLQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFDNUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEFBQUMsRUFBRTtBQUM3RCxnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRyxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUUsQ0FBQyxFQUFFLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUE7QUFDekksZ0JBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsU0FBTyxLQUFLLEVBQUMsQ0FBQyxDQUFDO0FBQ3ZFLGdCQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztXQUNoQztBQUNELGVBQUssSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztTQUNuQztPQUNGO0tBQ0Y7Ozs7Ozs7V0FLYSwwQkFBRztBQUNmLFVBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7QUFFOUIsVUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBUyxNQUFNLEVBQUU7QUFDekMsY0FBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQ2xCLENBQUMsQ0FBQztBQUNILFVBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDOztBQUV2QixVQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDcEM7Ozs7Ozs7V0FLTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN0QixVQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDaEMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7QUFFMUQsVUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDakU7Ozs7Ozs7Ozs7V0FRVSxxQkFBQyxTQUFTLEVBQUUsT0FBTyxFQUFFOzs7QUFHOUIsVUFBRyxTQUFTLEdBQUcsT0FBTyxFQUFFO0FBQ3RCLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO09BQy9GO0tBQ0Y7Ozs7Ozs7V0FLZSw0QkFBRztBQUNqQixVQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDcEM7Ozs7Ozs7Ozs7V0FRVyx3QkFBRztBQUNiLFVBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNsRCxlQUFPLElBQUksQ0FBQztPQUNiO0FBQ0QsYUFBTyxLQUFLLENBQUM7S0FDZDs7Ozs7OztXQUthLDBCQUFHO0FBQ2YsVUFBSTtBQUNGLFlBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ25DLENBQUMsT0FBTyxDQUFDLEVBQUU7O09BRVg7S0FDRjs7Ozs7OztXQUtNLG1CQUFHOztBQUVSLFVBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxRCxVQUFHLE9BQU8sVUFBVSxLQUFLLFdBQVcsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQy9GLGtCQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDdEIsTUFBTTtBQUNMLFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDeEI7S0FDRjs7Ozs7Ozs7OztXQVFpQiw4QkFBRztBQUNuQixVQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLENBQUM7QUFDOUQsVUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLFVBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFckQsV0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUMsYUFBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDdEMsY0FBSSxXQUFXLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUVsRCxjQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQzdDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7QUFDakQsd0JBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDL0Isa0JBQU07V0FDUDtTQUNGO09BQ0Y7OztBQUdELGtCQUFZLENBQUMsSUFBSSxDQUFDLFVBQVMsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUN2QyxlQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO09BQzFDLENBQUMsQ0FBQzs7QUFFSCxhQUFPLFlBQVksQ0FBQztLQUNyQjs7Ozs7Ozs7OztXQVFRLHFCQUFHO0FBQ1YsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0tBQ3JCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBaUJnQiwyQkFBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUU7QUFDN0UsVUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQTs7QUFFM0csVUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxTQUFPLGNBQWMsRUFBQyxDQUFDLENBQUM7QUFDbEYsVUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxTQUFPLGNBQWMsRUFBQyxDQUFDLENBQUM7O0FBRTNFLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7Ozs7Ozs7Ozs7O1dBU21CLDhCQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFO0FBQzdELFVBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUMsYUFBTyxDQUFDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQzs7QUFFekMsYUFBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQUFBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxHQUFJLElBQUksQ0FBQzs7QUFFeEYsVUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO0FBQ3JGLFVBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztBQUM3RixVQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNoQzs7O1NBdlFvQixrQkFBa0I7SUF3UXhDLENBQUMiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvc3BsaXQtZGlmZi9saWIvZWRpdG9yLWRpZmYtZXh0ZW5kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRvckRpZmZFeHRlbmRlciB7XG5cbiAgY29uc3RydWN0b3IoZWRpdG9yKSB7XG4gICAgdGhpcy5fZWRpdG9yID0gZWRpdG9yO1xuICAgIHRoaXMuX2xpbmVNYXJrZXJMYXllciA9IHRoaXMuX2VkaXRvci5hZGRNYXJrZXJMYXllcigpO1xuICAgIHRoaXMuX21pc2NNYXJrZXJzID0gW107XG4gICAgdGhpcy5fc2VsZWN0aW9uTWFya2VyTGF5ZXIgPSB0aGlzLl9lZGl0b3IuYWRkTWFya2VyTGF5ZXIoKTtcbiAgICB0aGlzLl9vbGRQbGFjZWhvbGRlclRleHQgPSBlZGl0b3IuZ2V0UGxhY2Vob2xkZXJUZXh0KCk7XG4gICAgZWRpdG9yLnNldFBsYWNlaG9sZGVyVGV4dCgnUGFzdGUgd2hhdCB5b3Ugd2FudCB0byBkaWZmIGhlcmUhJyk7XG4gICAgLy8gYWRkIHNwbGl0LWRpZmYgY3NzIHNlbGVjdG9yIHRvIGVkaXRvcnMgZm9yIGtleWJpbmRpbmdzICM3M1xuICAgIGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLl9lZGl0b3IpLmNsYXNzTGlzdC5hZGQoJ3NwbGl0LWRpZmYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG9mZnNldHMgKGJsYW5rIGxpbmVzKSBpbnRvIHRoZSBlZGl0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsaW5lT2Zmc2V0cyBBbiBhcnJheSBvZiBvZmZzZXRzIChibGFuayBsaW5lcykgdG8gaW5zZXJ0IGludG8gdGhpcyBlZGl0b3IuXG4gICAqL1xuICBzZXRMaW5lT2Zmc2V0cyhsaW5lT2Zmc2V0cykge1xuICAgIHZhciBvZmZzZXRMaW5lTnVtYmVycyA9IE9iamVjdC5rZXlzKGxpbmVPZmZzZXRzKS5tYXAobGluZU51bWJlciA9PiBwYXJzZUludChsaW5lTnVtYmVyLCAxMCkpLnNvcnQoKHgsIHkpID0+IHggLSB5KTtcblxuICAgIGZvcih2YXIgb2Zmc2V0TGluZU51bWJlciBvZiBvZmZzZXRMaW5lTnVtYmVycykge1xuICAgICAgaWYob2Zmc2V0TGluZU51bWJlciA9PSAwKSB7XG4gICAgICAgIC8vIGFkZCBibG9jayBkZWNvcmF0aW9uIGJlZm9yZSBpZiBhZGRpbmcgdG8gbGluZSAwXG4gICAgICAgIHRoaXMuX2FkZE9mZnNldERlY29yYXRpb24ob2Zmc2V0TGluZU51bWJlci0xLCBsaW5lT2Zmc2V0c1tvZmZzZXRMaW5lTnVtYmVyXSwgJ2JlZm9yZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWRkIGJsb2NrIGRlY29yYXRpb24gYWZ0ZXIgaWYgYWRkaW5nIHRvIGxpbmVzID4gMFxuICAgICAgICB0aGlzLl9hZGRPZmZzZXREZWNvcmF0aW9uKG9mZnNldExpbmVOdW1iZXItMSwgbGluZU9mZnNldHNbb2Zmc2V0TGluZU51bWJlcl0sICdhZnRlcicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG1hcmtlciBmb3IgbGluZSBoaWdobGlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydEluZGV4IFRoZSBzdGFydCBpbmRleCBvZiB0aGUgbGluZSBjaHVuayB0byBoaWdobGlnaHQuXG4gICAqIEBwYXJhbSBlbmRJbmRleCBUaGUgZW5kIGluZGV4IG9mIHRoZSBsaW5lIGNodW5rIHRvIGhpZ2hsaWdodC5cbiAgICogQHBhcmFtIGhpZ2hsaWdodFR5cGUgVGhlIHR5cGUgb2YgaGlnaGxpZ2h0IHRvIGJlIGFwcGxpZWQgdG8gdGhlIGxpbmUuXG4gICAqL1xuICBoaWdobGlnaHRMaW5lcyhzdGFydEluZGV4LCBlbmRJbmRleCwgaGlnaGxpZ2h0VHlwZSkge1xuICAgIGlmKHN0YXJ0SW5kZXggIT0gZW5kSW5kZXgpIHtcbiAgICAgIHZhciBoaWdobGlnaHRDbGFzcyA9ICdzcGxpdC1kaWZmLScgKyBoaWdobGlnaHRUeXBlO1xuICAgICAgdGhpcy5fY3JlYXRlTGluZU1hcmtlcih0aGlzLl9saW5lTWFya2VyTGF5ZXIsIHN0YXJ0SW5kZXgsIGVuZEluZGV4LCBoaWdobGlnaHRDbGFzcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaW5lIG1hcmtlciBsYXllciBob2xkcyBhbGwgYWRkZWQvcmVtb3ZlZCBsaW5lIG1hcmtlcnMuXG4gICAqXG4gICAqIEByZXR1cm4gVGhlIGxpbmUgbWFya2VyIGxheWVyLlxuICAgKi9cbiAgZ2V0TGluZU1hcmtlckxheWVyKCkge1xuICAgIHJldHVybiB0aGlzLl9saW5lTWFya2VyTGF5ZXI7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNlbGVjdGlvbiBtYXJrZXIgbGF5ZXIgaG9sZHMgYWxsIGxpbmUgaGlnaGxpZ2h0IHNlbGVjdGlvbiBtYXJrZXJzLlxuICAgKlxuICAgKiBAcmV0dXJuIFRoZSBzZWxlY3Rpb24gbWFya2VyIGxheWVyLlxuICAgKi9cbiAgZ2V0U2VsZWN0aW9uTWFya2VyTGF5ZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbk1hcmtlckxheWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZ2hsaWdodHMgd29yZHMgaW4gYSBnaXZlbiBsaW5lLlxuICAgKlxuICAgKiBAcGFyYW0gbGluZU51bWJlciBUaGUgbGluZSBudW1iZXIgdG8gaGlnaGxpZ2h0IHdvcmRzIG9uLlxuICAgKiBAcGFyYW0gd29yZERpZmYgQW4gYXJyYXkgb2Ygb2JqZWN0cyB3aGljaCBsb29rIGxpa2UuLi5cbiAgICogICAgYWRkZWQ6IGJvb2xlYW4gKG5vdCB1c2VkKVxuICAgKiAgICBjb3VudDogbnVtYmVyIChub3QgdXNlZClcbiAgICogICAgcmVtb3ZlZDogYm9vbGVhbiAobm90IHVzZWQpXG4gICAqICAgIHZhbHVlOiBzdHJpbmdcbiAgICogICAgY2hhbmdlZDogYm9vbGVhblxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBoaWdobGlnaHQgdG8gYmUgYXBwbGllZCB0byB0aGUgd29yZHMuXG4gICAqL1xuICBzZXRXb3JkSGlnaGxpZ2h0cyhsaW5lTnVtYmVyLCB3b3JkRGlmZiA9IFtdLCB0eXBlLCBpc1doaXRlc3BhY2VJZ25vcmVkKSB7XG4gICAgdmFyIGtsYXNzID0gJ3NwbGl0LWRpZmYtd29yZC0nICsgdHlwZTtcbiAgICB2YXIgY291bnQgPSAwO1xuXG4gICAgZm9yKHZhciBpPTA7IGk8d29yZERpZmYubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKHdvcmREaWZmW2ldLnZhbHVlKSB7IC8vIGZpeCBmb3IgIzQ5XG4gICAgICAgIC8vIGlmIHRoZXJlIHdhcyBhIGNoYW5nZVxuICAgICAgICAvLyBBTkQgb25lIG9mIHRoZXNlIGlzIHRydWU6XG4gICAgICAgIC8vIGlmIHRoZSBzdHJpbmcgaXMgbm90IHNwYWNlcywgaGlnaGxpZ2h0XG4gICAgICAgIC8vIE9SXG4gICAgICAgIC8vIGlmIHRoZSBzdHJpbmcgaXMgc3BhY2VzIGFuZCB3aGl0ZXNwYWNlIG5vdCBpZ25vcmVkLCBoaWdobGlnaHRcbiAgICAgICAgaWYod29yZERpZmZbaV0uY2hhbmdlZFxuICAgICAgICAgICYmICgvXFxTLy50ZXN0KHdvcmREaWZmW2ldLnZhbHVlKVxuICAgICAgICAgIHx8ICghL1xcUy8udGVzdCh3b3JkRGlmZltpXS52YWx1ZSkgJiYgIWlzV2hpdGVzcGFjZUlnbm9yZWQpKSkge1xuICAgICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLl9lZGl0b3IubWFya0J1ZmZlclJhbmdlKFtbbGluZU51bWJlciwgY291bnRdLCBbbGluZU51bWJlciwgKGNvdW50ICsgd29yZERpZmZbaV0udmFsdWUubGVuZ3RoKV1dLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pXG4gICAgICAgICAgdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczoga2xhc3N9KTtcbiAgICAgICAgICB0aGlzLl9taXNjTWFya2Vycy5wdXNoKG1hcmtlcik7XG4gICAgICAgIH1cbiAgICAgICAgY291bnQgKz0gd29yZERpZmZbaV0udmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbGwgbWFya2VycyBhZGRlZCB0byB0aGlzIGVkaXRvciBieSBzcGxpdC1kaWZmLlxuICAgKi9cbiAgZGVzdHJveU1hcmtlcnMoKSB7XG4gICAgdGhpcy5fbGluZU1hcmtlckxheWVyLmNsZWFyKCk7XG5cbiAgICB0aGlzLl9taXNjTWFya2Vycy5mb3JFYWNoKGZ1bmN0aW9uKG1hcmtlcikge1xuICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICB9KTtcbiAgICB0aGlzLl9taXNjTWFya2VycyA9IFtdO1xuXG4gICAgdGhpcy5fc2VsZWN0aW9uTWFya2VyTGF5ZXIuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIEVkaXRvckRpZmZFeHRlbmRlciBhbmQgY2xlYW5zIHVwIGFmdGVyIGl0c2VsZi5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZXN0cm95TWFya2VycygpO1xuICAgIHRoaXMuX2xpbmVNYXJrZXJMYXllci5kZXN0cm95KCk7XG4gICAgdGhpcy5fZWRpdG9yLnNldFBsYWNlaG9sZGVyVGV4dCh0aGlzLl9vbGRQbGFjZWhvbGRlclRleHQpO1xuICAgIC8vIHJlbW92ZSBzcGxpdC1kaWZmIGNzcyBzZWxlY3RvciBmcm9tIGVkaXRvcnMgZm9yIGtleWJpbmRpbmdzICM3M1xuICAgIGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLl9lZGl0b3IpLmNsYXNzTGlzdC5yZW1vdmUoJ3NwbGl0LWRpZmYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3RzIGxpbmVzLlxuICAgKlxuICAgKiBAcGFyYW0gc3RhcnRMaW5lIFRoZSBsaW5lIG51bWJlciB0aGF0IHRoZSBzZWxlY3Rpb24gc3RhcnRzIGF0LlxuICAgKiBAcGFyYW0gZW5kTGluZSBUaGUgbGluZSBudW1iZXIgdGhhdCB0aGUgc2VsZWN0aW9uIGVuZHMgYXQgKG5vbi1pbmNsdXNpdmUpLlxuICAgKi9cbiAgc2VsZWN0TGluZXMoc3RhcnRMaW5lLCBlbmRMaW5lKSB7XG4gICAgLy8gZG9uJ3Qgd2FudCB0byBoaWdobGlnaHQgaWYgdGhleSBhcmUgdGhlIHNhbWUgKHNhbWUgbnVtYmVycyBtZWFucyBjaHVuayBpc1xuICAgIC8vIGp1c3QgcG9pbnRpbmcgdG8gYSBsb2NhdGlvbiB0byBjb3B5LXRvLXJpZ2h0L2NvcHktdG8tbGVmdClcbiAgICBpZihzdGFydExpbmUgPCBlbmRMaW5lKSB7XG4gICAgICB0aGlzLl9jcmVhdGVMaW5lTWFya2VyKHRoaXMuX3NlbGVjdGlvbk1hcmtlckxheWVyLCBzdGFydExpbmUsIGVuZExpbmUsICdzcGxpdC1kaWZmLXNlbGVjdGVkJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIHNlbGVjdGlvbiBtYXJrZXJzLlxuICAgKi9cbiAgZGVzZWxlY3RBbGxMaW5lcygpIHtcbiAgICB0aGlzLl9zZWxlY3Rpb25NYXJrZXJMYXllci5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gdGVzdCB3aGV0aGVyIHRoZXJlIGlzIGN1cnJlbnRseSBhbiBhY3RpdmUgc2VsZWN0aW9uIGhpZ2hsaWdodCBpblxuICAgKiB0aGUgZWRpdG9yLlxuICAgKlxuICAgKiBAcmV0dXJuIEEgYm9vbGVhbiBzaWduaWZ5aW5nIHdoZXRoZXIgdGhlcmUgaXMgYW4gYWN0aXZlIHNlbGVjdGlvbiBoaWdobGlnaHQuXG4gICAqL1xuICBoYXNTZWxlY3Rpb24oKSB7XG4gICAgaWYodGhpcy5fc2VsZWN0aW9uTWFya2VyTGF5ZXIuZ2V0TWFya2VyQ291bnQoKSA+IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHNvZnQgd3JhcCBmb3IgdGhpcyBlZGl0b3IuXG4gICAqL1xuICBlbmFibGVTb2Z0V3JhcCgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ1NvZnQgd3JhcCB3YXMgZW5hYmxlZCBvbiBhIHRleHQgZWRpdG9yIHRoYXQgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHRleHQgZWRpdG9yIHdpdGhvdXQgcHJvbXB0aW5nIGEgc2F2ZS5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgLy8gaWYgdGhlIHBhbmUgdGhhdCB0aGlzIGVkaXRvciB3YXMgaW4gaXMgbm93IGVtcHR5LCB3ZSB3aWxsIGRlc3Ryb3kgaXRcbiAgICB2YXIgZWRpdG9yUGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKHRoaXMuX2VkaXRvcik7XG4gICAgaWYodHlwZW9mIGVkaXRvclBhbmUgIT09ICd1bmRlZmluZWQnICYmIGVkaXRvclBhbmUgIT0gbnVsbCAmJiBlZGl0b3JQYW5lLmdldEl0ZW1zKCkubGVuZ3RoID09IDEpIHtcbiAgICAgIGVkaXRvclBhbmUuZGVzdHJveSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9lZGl0b3IuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyBjdXJzb3ItdG91Y2hlZCBsaW5lIHJhbmdlcyB0aGF0IGFyZSBtYXJrZWQgYXMgZGlmZmVyZW50IGluIGFuIGVkaXRvclxuICAgKiB2aWV3LlxuICAgKlxuICAgKiBAcmV0dXJuIFRoZSBsaW5lIHJhbmdlcyBvZiBkaWZmcyB0aGF0IGFyZSB0b3VjaGVkIGJ5IGEgY3Vyc29yLlxuICAgKi9cbiAgZ2V0Q3Vyc29yRGlmZkxpbmVzKCkge1xuICAgIHZhciBjdXJzb3JQb3NpdGlvbnMgPSB0aGlzLl9lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKCk7XG4gICAgdmFyIHRvdWNoZWRMaW5lcyA9IFtdO1xuICAgIHZhciBsaW5lTWFya2VycyA9IHRoaXMuX2xpbmVNYXJrZXJMYXllci5nZXRNYXJrZXJzKCk7XG5cbiAgICBmb3IodmFyIGk9MDsgaTxjdXJzb3JQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZvcih2YXIgaj0wOyBqPGxpbmVNYXJrZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBtYXJrZXJSYW5nZSA9IGxpbmVNYXJrZXJzW2pdLmdldEJ1ZmZlclJhbmdlKCk7XG5cbiAgICAgICAgaWYoY3Vyc29yUG9zaXRpb25zW2ldLnJvdyA+PSBtYXJrZXJSYW5nZS5zdGFydC5yb3dcbiAgICAgICAgICAmJiBjdXJzb3JQb3NpdGlvbnNbaV0ucm93IDwgbWFya2VyUmFuZ2UuZW5kLnJvdykge1xuICAgICAgICAgIHRvdWNoZWRMaW5lcy5wdXNoKG1hcmtlclJhbmdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHB1dCB0aGUgY2h1bmtzIGluIG9yZGVyIHNvIHRoZSBjb3B5IGZ1bmN0aW9uIGRvZXNuJ3QgbWVzcyB1cFxuICAgIHRvdWNoZWRMaW5lcy5zb3J0KGZ1bmN0aW9uKGxpbmVBLCBsaW5lQikge1xuICAgICAgcmV0dXJuIGxpbmVBLnN0YXJ0LnJvdyAtIGxpbmVCLnN0YXJ0LnJvdztcbiAgICB9KTtcblxuICAgIHJldHVybiB0b3VjaGVkTGluZXM7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBnZXQgdGhlIFRleHQgRWRpdG9yIG9iamVjdCBmb3IgdGhpcyB2aWV3LiBIZWxwZnVsIGZvciBjYWxsaW5nIGJhc2ljXG4gICAqIEF0b20gVGV4dCBFZGl0b3IgZnVuY3Rpb25zLlxuICAgKlxuICAgKiBAcmV0dXJuIFRoZSBUZXh0IEVkaXRvciBvYmplY3QgZm9yIHRoaXMgdmlldy5cbiAgICovXG4gIGdldEVkaXRvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fZWRpdG9yO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG1hcmtlciBhbmQgZGVjb3JhdGVzIGl0cyBsaW5lIGFuZCBsaW5lIG51bWJlci5cbiAgICpcbiAgICogQHBhcmFtIG1hcmtlckxheWVyIFRoZSBtYXJrZXIgbGF5ZXIgdG8gcHV0IHRoZSBtYXJrZXIgaW4uXG4gICAqIEBwYXJhbSBzdGFydExpbmVOdW1iZXIgQSBidWZmZXIgbGluZSBudW1iZXIgdG8gc3RhcnQgaGlnaGxpZ2h0aW5nIGF0LlxuICAgKiBAcGFyYW0gZW5kTGluZU51bWJlciBBIGJ1ZmZlciBsaW5lIG51bWJlciB0byBlbmQgaGlnaGxpZ2h0aW5nIGF0LlxuICAgKiBAcGFyYW0gaGlnaGxpZ2h0Q2xhc3MgVGhlIHR5cGUgb2YgaGlnaGxpZ2h0IHRvIGJlIGFwcGxpZWQgdG8gdGhlIGxpbmUuXG4gICAqICAgIENvdWxkIGJlIGEgdmFsdWUgb2Y6IFsnc3BsaXQtZGlmZi1pbnNlcnQnLCAnc3BsaXQtZGlmZi1kZWxldGUnLFxuICAgKiAgICAnc3BsaXQtZGlmZi1zZWxlY3QnXS5cbiAgICogQHJldHVybiBUaGUgY3JlYXRlZCBsaW5lIG1hcmtlci5cbiAgICovXG4gIF9jcmVhdGVMaW5lTWFya2VyKG1hcmtlckxheWVyLCBzdGFydExpbmVOdW1iZXIsIGVuZExpbmVOdW1iZXIsIGhpZ2hsaWdodENsYXNzKSB7XG4gICAgdmFyIG1hcmtlciA9IG1hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShbW3N0YXJ0TGluZU51bWJlciwgMF0sIFtlbmRMaW5lTnVtYmVyLCAwXV0sIHtpbnZhbGlkYXRlOiAnbmV2ZXInfSlcblxuICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogaGlnaGxpZ2h0Q2xhc3N9KTtcbiAgICB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7dHlwZTogJ2xpbmUnLCBjbGFzczogaGlnaGxpZ2h0Q2xhc3N9KTtcblxuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlY29yYXRpb24gZm9yIGFuIG9mZnNldC5cbiAgICpcbiAgICogQHBhcmFtIGxpbmVOdW1iZXIgVGhlIGxpbmUgbnVtYmVyIHRvIGFkZCB0aGUgYmxvY2sgZGVjb3JhdGlvbiB0by5cbiAgICogQHBhcmFtIG51bWJlck9mTGluZXMgVGhlIG51bWJlciBvZiBsaW5lcyB0aGF0IHRoZSBibG9jayBkZWNvcmF0aW9uJ3MgaGVpZ2h0IHdpbGwgYmUuXG4gICAqIEBwYXJhbSBibG9ja1Bvc2l0aW9uIFNwZWNpZmllcyB3aGV0aGVyIHRvIHB1dCB0aGUgZGVjb3JhdGlvbiBiZWZvcmUgdGhlIGxpbmUgb3IgYWZ0ZXIuXG4gICAqL1xuICBfYWRkT2Zmc2V0RGVjb3JhdGlvbihsaW5lTnVtYmVyLCBudW1iZXJPZkxpbmVzLCBibG9ja1Bvc2l0aW9uKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAnc3BsaXQtZGlmZi1vZmZzZXQnO1xuICAgIC8vIGlmIG5vIHRleHQsIHNldCBoZWlnaHQgZm9yIGJsYW5rIGxpbmVzXG4gICAgZWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSAobnVtYmVyT2ZMaW5lcyAqIHRoaXMuX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSkgKyAncHgnO1xuXG4gICAgdmFyIG1hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrU2NyZWVuUG9zaXRpb24oW2xpbmVOdW1iZXIsIDBdLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pO1xuICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnYmxvY2snLCBwb3NpdGlvbjogYmxvY2tQb3NpdGlvbiwgaXRlbTogZWxlbWVudH0pO1xuICAgIHRoaXMuX21pc2NNYXJrZXJzLnB1c2gobWFya2VyKTtcbiAgfVxufTtcbiJdfQ==