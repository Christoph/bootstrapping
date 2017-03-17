(function() {
  var CompositeDisposable, ConfigSchema, isOpeningTagLikePattern,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  isOpeningTagLikePattern = /<(?![\!\/])([a-z]{1}[^>\s=\'\"]*)[^>]*>$/i;

  ConfigSchema = require('./configuration.coffee');

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = {
    config: ConfigSchema.config,
    neverClose: [],
    forceInline: [],
    forceBlock: [],
    makeNeverCloseSelfClosing: false,
    ignoreGrammar: false,
    legacyMode: false,
    activate: function() {
      this.autocloseHTMLEvents = new CompositeDisposable;
      atom.commands.add('atom-text-editor', {
        'autoclose-html:close-and-complete': (function(_this) {
          return function(e) {
            if (_this.legacyMode) {
              console.log(e);
              return e.abortKeyBinding();
            } else {
              atom.workspace.getActiveTextEditor().insertText(">");
              return _this.execAutoclose();
            }
          };
        })(this)
      });
      atom.config.observe('autoclose-html.neverClose', (function(_this) {
        return function(value) {
          return _this.neverClose = value;
        };
      })(this));
      atom.config.observe('autoclose-html.forceInline', (function(_this) {
        return function(value) {
          return _this.forceInline = value;
        };
      })(this));
      atom.config.observe('autoclose-html.forceBlock', (function(_this) {
        return function(value) {
          return _this.forceBlock = value;
        };
      })(this));
      atom.config.observe('autoclose-html.makeNeverCloseSelfClosing', (function(_this) {
        return function(value) {
          return _this.makeNeverCloseSelfClosing = value;
        };
      })(this));
      return atom.config.observe('autoclose-html.legacyMode', (function(_this) {
        return function(value) {
          _this.legacyMode = value;
          if (_this.legacyMode) {
            return _this._events();
          } else {
            return _this._unbindEvents();
          }
        };
      })(this));
    },
    deactivate: function() {
      if (this.legacyMode) {
        return this._unbindEvents();
      }
    },
    isInline: function(eleTag) {
      var ele, ref, ref1, ref2, ret;
      if (this.forceInline.indexOf("*") > -1) {
        return true;
      }
      try {
        ele = document.createElement(eleTag);
      } catch (error) {
        return false;
      }
      if (ref = eleTag.toLowerCase(), indexOf.call(this.forceBlock, ref) >= 0) {
        return false;
      } else if (ref1 = eleTag.toLowerCase(), indexOf.call(this.forceInline, ref1) >= 0) {
        return true;
      }
      document.body.appendChild(ele);
      ret = (ref2 = window.getComputedStyle(ele).getPropertyValue('display')) === 'inline' || ref2 === 'inline-block' || ref2 === 'none';
      document.body.removeChild(ele);
      return ret;
    },
    isNeverClosed: function(eleTag) {
      var ref;
      return ref = eleTag.toLowerCase(), indexOf.call(this.neverClose, ref) >= 0;
    },
    execAutoclose: function() {
      var doubleQuotes, editor, eleTag, index, isInline, line, matches, oddDoubleQuotes, oddSingleQuotes, partial, range, singleQuotes, tag;
      editor = atom.workspace.getActiveTextEditor();
      range = editor.selections[0].getBufferRange();
      line = editor.buffer.getLines()[range.end.row];
      partial = line.substr(0, range.start.column);
      partial = partial.substr(partial.lastIndexOf('<'));
      if (partial.substr(partial.length - 1, 1) === '/') {
        return;
      }
      singleQuotes = partial.match(/\'/g);
      doubleQuotes = partial.match(/\"/g);
      oddSingleQuotes = singleQuotes && (singleQuotes.length % 2);
      oddDoubleQuotes = doubleQuotes && (doubleQuotes.length % 2);
      if (oddSingleQuotes || oddDoubleQuotes) {
        return;
      }
      index = -1;
      while ((index = partial.indexOf('"')) !== -1) {
        partial = partial.slice(0, index) + partial.slice(partial.indexOf('"', index + 1) + 1);
      }
      while ((index = partial.indexOf("'")) !== -1) {
        partial = partial.slice(0, index) + partial.slice(partial.indexOf("'", index + 1) + 1);
      }
      if ((matches = partial.match(isOpeningTagLikePattern)) == null) {
        return;
      }
      eleTag = matches[matches.length - 1];
      if (this.isNeverClosed(eleTag)) {
        if (this.makeNeverCloseSelfClosing) {
          tag = '/>';
          if (partial.substr(partial.length - 1, 1 !== ' ')) {
            tag = ' ' + tag;
          }
          editor.backspace();
          editor.insertText(tag);
        }
        return;
      }
      isInline = this.isInline(eleTag);
      if (!isInline) {
        editor.insertNewline();
        editor.insertNewline();
      }
      editor.insertText('</' + eleTag + '>');
      if (isInline) {
        return editor.setCursorBufferPosition(range.end);
      } else {
        editor.autoIndentBufferRow(range.end.row + 1);
        return editor.setCursorBufferPosition([range.end.row + 1, atom.workspace.getActivePaneItem().getTabText().length * atom.workspace.getActivePaneItem().indentationForBufferRow(range.end.row + 1)]);
      }
    },
    _events: function() {
      return atom.workspace.observeTextEditors((function(_this) {
        return function(textEditor) {
          return textEditor.observeGrammar(function(grammar) {
            if (textEditor.autocloseHTMLbufferEvent != null) {
              textEditor.autocloseHTMLbufferEvent.dispose();
            }
            if (atom.views.getView(textEditor).getAttribute('data-grammar').split(' ').indexOf('html') > -1) {
              textEditor.autocloseHTMLbufferEvent = textEditor.buffer.onDidChange(function(e) {
                if ((e != null ? e.newText : void 0) === '>' && textEditor === atom.workspace.getActiveTextEditor()) {
                  return setTimeout(function() {
                    return _this.execAutoclose();
                  });
                }
              });
              return _this.autocloseHTMLEvents.add(textEditor.autocloseHTMLbufferEvent);
            }
          });
        };
      })(this));
    },
    _unbindEvents: function() {
      return this.autocloseHTMLEvents.dispose();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXV0b2Nsb3NlLWh0bWwvbGliL2F1dG9jbG9zZS1odG1sLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMERBQUE7SUFBQTs7RUFBQSx1QkFBQSxHQUEwQjs7RUFFMUIsWUFBQSxHQUFlLE9BQUEsQ0FBUSx3QkFBUjs7RUFDZCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ0k7SUFBQSxNQUFBLEVBQVEsWUFBWSxDQUFDLE1BQXJCO0lBRUEsVUFBQSxFQUFXLEVBRlg7SUFHQSxXQUFBLEVBQWEsRUFIYjtJQUlBLFVBQUEsRUFBWSxFQUpaO0lBS0EseUJBQUEsRUFBMkIsS0FMM0I7SUFNQSxhQUFBLEVBQWUsS0FOZjtJQU9BLFVBQUEsRUFBWSxLQVBaO0lBU0EsUUFBQSxFQUFVLFNBQUE7TUFFTixJQUFDLENBQUEsbUJBQUQsR0FBdUIsSUFBSTtNQUUzQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQ0k7UUFBQSxtQ0FBQSxFQUFxQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7WUFDakMsSUFBRyxLQUFDLENBQUEsVUFBSjtjQUNJLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBWjtxQkFDQSxDQUFDLENBQUMsZUFBRixDQUFBLEVBRko7YUFBQSxNQUFBO2NBSUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQW9DLENBQUMsVUFBckMsQ0FBZ0QsR0FBaEQ7cUJBQ0EsS0FBSSxDQUFDLGFBQUwsQ0FBQSxFQUxKOztVQURpQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckM7T0FESjtNQVVBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQiwyQkFBcEIsRUFBaUQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7aUJBQzdD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IC88KD8hW1xcIVxcL10pKFthLXpdezF9W14+XFxzPVxcJ1xcXCJdKilbXj5dKj4kL2lcblxuQ29uZmlnU2NoZW1hID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLmNvZmZlZScpXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgY29uZmlnOiBDb25maWdTY2hlbWEuY29uZmlnXG5cbiAgICBuZXZlckNsb3NlOltdXG4gICAgZm9yY2VJbmxpbmU6IFtdXG4gICAgZm9yY2VCbG9jazogW11cbiAgICBtYWtlTmV2ZXJDbG9zZVNlbGZDbG9zaW5nOiBmYWxzZVxuICAgIGlnbm9yZUdyYW1tYXI6IGZhbHNlXG4gICAgbGVnYWN5TW9kZTogZmFsc2VcblxuICAgIGFjdGl2YXRlOiAoKSAtPlxuXG4gICAgICAgIEBhdXRvY2xvc2VIVE1MRXZlbnRzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAgICAgICAnYXV0b2Nsb3NlLWh0bWw6Y2xvc2UtYW5kLWNvbXBsZXRlJzogKGUpID0+XG4gICAgICAgICAgICAgICAgaWYgQGxlZ2FjeU1vZGVcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcbiAgICAgICAgICAgICAgICAgICAgZS5hYm9ydEtleUJpbmRpbmcoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLmluc2VydFRleHQoXCI+XCIpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhlY0F1dG9jbG9zZSgpXG5cblxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlICdhdXRvY2xvc2UtaHRtbC5uZXZlckNsb3NlJywgKHZhbHVlKSA9PlxuICAgICAgICAgICAgQG5ldmVyQ2xvc2UgPSB2YWx1ZVxuXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2F1dG9jbG9zZS1odG1sLmZvcmNlSW5saW5lJywgKHZhbHVlKSA9PlxuICAgICAgICAgICAgQGZvcmNlSW5saW5lID0gdmFsdWVcblxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlICdhdXRvY2xvc2UtaHRtbC5mb3JjZUJsb2NrJywgKHZhbHVlKSA9PlxuICAgICAgICAgICAgQGZvcmNlQmxvY2sgPSB2YWx1ZVxuXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2F1dG9jbG9zZS1odG1sLm1ha2VOZXZlckNsb3NlU2VsZkNsb3NpbmcnLCAodmFsdWUpID0+XG4gICAgICAgICAgICBAbWFrZU5ldmVyQ2xvc2VTZWxmQ2xvc2luZyA9IHZhbHVlXG5cbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnYXV0b2Nsb3NlLWh0bWwubGVnYWN5TW9kZScsICh2YWx1ZSkgPT5cbiAgICAgICAgICAgIEBsZWdhY3lNb2RlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIEBsZWdhY3lNb2RlXG4gICAgICAgICAgICAgICAgQF9ldmVudHMoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBfdW5iaW5kRXZlbnRzKClcblxuXG4gICAgZGVhY3RpdmF0ZTogLT5cbiAgICAgICAgaWYgQGxlZ2FjeU1vZGVcbiAgICAgICAgICAgIEBfdW5iaW5kRXZlbnRzKClcblxuICAgIGlzSW5saW5lOiAoZWxlVGFnKSAtPlxuICAgICAgICBpZiBAZm9yY2VJbmxpbmUuaW5kZXhPZihcIipcIikgPiAtMVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGVsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgZWxlVGFnXG4gICAgICAgIGNhdGNoXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICBpZiBlbGVUYWcudG9Mb3dlckNhc2UoKSBpbiBAZm9yY2VCbG9ja1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGVsc2UgaWYgZWxlVGFnLnRvTG93ZXJDYXNlKCkgaW4gQGZvcmNlSW5saW5lXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgZWxlXG4gICAgICAgIHJldCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZSkuZ2V0UHJvcGVydHlWYWx1ZSgnZGlzcGxheScpIGluIFsnaW5saW5lJywgJ2lubGluZS1ibG9jaycsICdub25lJ11cbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCBlbGVcblxuICAgICAgICByZXRcblxuICAgIGlzTmV2ZXJDbG9zZWQ6IChlbGVUYWcpIC0+XG4gICAgICAgIGVsZVRhZy50b0xvd2VyQ2FzZSgpIGluIEBuZXZlckNsb3NlXG5cbiAgICBleGVjQXV0b2Nsb3NlOiAoKSAtPlxuICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgcmFuZ2UgPSBlZGl0b3Iuc2VsZWN0aW9uc1swXS5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgIGxpbmUgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVzKClbcmFuZ2UuZW5kLnJvd11cbiAgICAgICAgcGFydGlhbCA9IGxpbmUuc3Vic3RyIDAsIHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgICBwYXJ0aWFsID0gcGFydGlhbC5zdWJzdHIocGFydGlhbC5sYXN0SW5kZXhPZignPCcpKVxuXG4gICAgICAgIHJldHVybiBpZiBwYXJ0aWFsLnN1YnN0cihwYXJ0aWFsLmxlbmd0aCAtIDEsIDEpIGlzICcvJ1xuXG4gICAgICAgIHNpbmdsZVF1b3RlcyA9IHBhcnRpYWwubWF0Y2goL1xcJy9nKVxuICAgICAgICBkb3VibGVRdW90ZXMgPSBwYXJ0aWFsLm1hdGNoKC9cXFwiL2cpXG4gICAgICAgIG9kZFNpbmdsZVF1b3RlcyA9IHNpbmdsZVF1b3RlcyAmJiAoc2luZ2xlUXVvdGVzLmxlbmd0aCAlIDIpXG4gICAgICAgIG9kZERvdWJsZVF1b3RlcyA9IGRvdWJsZVF1b3RlcyAmJiAoZG91YmxlUXVvdGVzLmxlbmd0aCAlIDIpXG5cbiAgICAgICAgcmV0dXJuIGlmIG9kZFNpbmdsZVF1b3RlcyBvciBvZGREb3VibGVRdW90ZXNcblxuICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgIHdoaWxlKChpbmRleCA9IHBhcnRpYWwuaW5kZXhPZignXCInKSkgaXNudCAtMSlcbiAgICAgICAgICAgIHBhcnRpYWwgPSBwYXJ0aWFsLnNsaWNlKDAsIGluZGV4KSArIHBhcnRpYWwuc2xpY2UocGFydGlhbC5pbmRleE9mKCdcIicsIGluZGV4ICsgMSkgKyAxKVxuXG4gICAgICAgIHdoaWxlKChpbmRleCA9IHBhcnRpYWwuaW5kZXhPZihcIidcIikpIGlzbnQgLTEpXG4gICAgICAgICAgICBwYXJ0aWFsID0gcGFydGlhbC5zbGljZSgwLCBpbmRleCkgKyBwYXJ0aWFsLnNsaWNlKHBhcnRpYWwuaW5kZXhPZihcIidcIiwgaW5kZXggKyAxKSArIDEpXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCAobWF0Y2hlcyA9IHBhcnRpYWwubWF0Y2goaXNPcGVuaW5nVGFnTGlrZVBhdHRlcm4pKT9cblxuICAgICAgICBlbGVUYWcgPSBtYXRjaGVzW21hdGNoZXMubGVuZ3RoIC0gMV1cblxuICAgICAgICBpZiBAaXNOZXZlckNsb3NlZChlbGVUYWcpXG4gICAgICAgICAgICBpZiBAbWFrZU5ldmVyQ2xvc2VTZWxmQ2xvc2luZ1xuICAgICAgICAgICAgICAgIHRhZyA9ICcvPidcbiAgICAgICAgICAgICAgICBpZiBwYXJ0aWFsLnN1YnN0ciBwYXJ0aWFsLmxlbmd0aCAtIDEsIDEgaXNudCAnICdcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gJyAnICsgdGFnXG4gICAgICAgICAgICAgICAgZWRpdG9yLmJhY2tzcGFjZSgpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmluc2VydFRleHQgdGFnXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpc0lubGluZSA9IEBpc0lubGluZSBlbGVUYWdcblxuICAgICAgICBpZiBub3QgaXNJbmxpbmVcbiAgICAgICAgICAgIGVkaXRvci5pbnNlcnROZXdsaW5lKClcbiAgICAgICAgICAgIGVkaXRvci5pbnNlcnROZXdsaW5lKClcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQoJzwvJyArIGVsZVRhZyArICc+JylcbiAgICAgICAgaWYgaXNJbmxpbmVcbiAgICAgICAgICAgIGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiByYW5nZS5lbmRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZWRpdG9yLmF1dG9JbmRlbnRCdWZmZXJSb3cgcmFuZ2UuZW5kLnJvdyArIDFcbiAgICAgICAgICAgIGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiBbcmFuZ2UuZW5kLnJvdyArIDEsIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCkuZ2V0VGFiVGV4dCgpLmxlbmd0aCAqIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCkuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocmFuZ2UuZW5kLnJvdyArIDEpXVxuXG4gICAgX2V2ZW50czogKCkgLT5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzICh0ZXh0RWRpdG9yKSA9PlxuICAgICAgICAgICAgdGV4dEVkaXRvci5vYnNlcnZlR3JhbW1hciAoZ3JhbW1hcikgPT5cbiAgICAgICAgICAgICAgICB0ZXh0RWRpdG9yLmF1dG9jbG9zZUhUTUxidWZmZXJFdmVudC5kaXNwb3NlKCkgaWYgdGV4dEVkaXRvci5hdXRvY2xvc2VIVE1MYnVmZmVyRXZlbnQ/XG4gICAgICAgICAgICAgICAgaWYgYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpLmdldEF0dHJpYnV0ZSgnZGF0YS1ncmFtbWFyJykuc3BsaXQoJyAnKS5pbmRleE9mKCdodG1sJykgPiAtMVxuICAgICAgICAgICAgICAgICAgICAgdGV4dEVkaXRvci5hdXRvY2xvc2VIVE1MYnVmZmVyRXZlbnQgPSB0ZXh0RWRpdG9yLmJ1ZmZlci5vbkRpZENoYW5nZSAoZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiBlPy5uZXdUZXh0IGlzICc+JyAmJiB0ZXh0RWRpdG9yID09IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZXhlY0F1dG9jbG9zZSgpXG4gICAgICAgICAgICAgICAgICAgICBAYXV0b2Nsb3NlSFRNTEV2ZW50cy5hZGQodGV4dEVkaXRvci5hdXRvY2xvc2VIVE1MYnVmZmVyRXZlbnQpXG5cbiAgICBfdW5iaW5kRXZlbnRzOiAoKSAtPlxuICAgICAgICBAYXV0b2Nsb3NlSFRNTEV2ZW50cy5kaXNwb3NlKClcbiJdfQ==
