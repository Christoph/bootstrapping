Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions

var _atom = require('atom');

var _atomLinter = require('atom-linter');

var helpers = _interopRequireWildcard(_atomLinter);

var _path = require('path');

// Local variables
'use babel';var regex = /line (\d+) column (\d+) - (Warning|Error): (.+)/g;
var defaultExecutableArguments = ['-language', 'en', '-quiet', '-errors', '--tab-size', '1'];
// Settings
var grammarScopes = [];
var executablePath = undefined;
var configExecutableArguments = undefined;

exports['default'] = {
  activate: function activate() {
    require('atom-package-deps').install('linter-tidy');

    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-tidy.executablePath', function (value) {
      executablePath = value;
    }));

    this.subscriptions.add(atom.config.observe('linter-tidy.executableArguments', function (value) {
      configExecutableArguments = value;
    }));

    // Add a listener to update the list of grammar scopes linted when the
    // config value changes.
    this.subscriptions.add(atom.config.observe('linter-tidy.grammarScopes', function (configScopes) {
      grammarScopes.splice(0, grammarScopes.length);
      grammarScopes.push.apply(grammarScopes, _toConsumableArray(configScopes));
    }));
  },

  deactivate: function deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter: function provideLinter() {
    return {
      grammarScopes: grammarScopes,
      name: 'tidy',
      scope: 'file',
      lintOnFly: true,
      lint: _asyncToGenerator(function* (textEditor) {
        var filePath = textEditor.getPath();
        var fileText = textEditor.getText();

        var parameters = defaultExecutableArguments.concat(configExecutableArguments);

        var _atom$project$relativizePath = atom.project.relativizePath(filePath);

        var _atom$project$relativizePath2 = _slicedToArray(_atom$project$relativizePath, 1);

        var projectPath = _atom$project$relativizePath2[0];

        var execOptions = {
          stream: 'stderr',
          stdin: fileText,
          cwd: projectPath !== null ? projectPath : (0, _path.dirname)(filePath),
          allowEmptyStderr: true
        };

        var output = yield helpers.exec(executablePath, parameters, execOptions);

        if (textEditor.getText() !== fileText) {
          // Editor contents have changed, don't update the messages
          return null;
        }

        var messages = [];
        var match = regex.exec(output);
        while (match !== null) {
          var line = Number.parseInt(match[1], 10) - 1;
          var col = Number.parseInt(match[2], 10) - 1;
          messages.push({
            type: match[3],
            text: match[4],
            filePath: filePath,
            range: helpers.generateRange(textEditor, line, col)
          });
          match = regex.exec(output);
        }
        return messages;
      })
    };
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10aWR5L2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O29CQUdvQyxNQUFNOzswQkFDakIsYUFBYTs7SUFBMUIsT0FBTzs7b0JBQ0ssTUFBTTs7O0FBTDlCLFdBQVcsQ0FBQyxBQVFaLElBQU0sS0FBSyxHQUFHLGtEQUFrRCxDQUFDO0FBQ2pFLElBQU0sMEJBQTBCLEdBQUcsQ0FDakMsV0FBVyxFQUFFLElBQUksRUFDakIsUUFBUSxFQUNSLFNBQVMsRUFDVCxZQUFZLEVBQUUsR0FBRyxDQUNsQixDQUFDOztBQUVGLElBQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUN6QixJQUFJLGNBQWMsWUFBQSxDQUFDO0FBQ25CLElBQUkseUJBQXlCLFlBQUEsQ0FBQzs7cUJBRWY7QUFDYixVQUFRLEVBQUEsb0JBQUc7QUFDVCxXQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7O0FBRXBELFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUM7QUFDL0MsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLDRCQUE0QixFQUFFLFVBQUMsS0FBSyxFQUFLO0FBQzNELG9CQUFjLEdBQUcsS0FBSyxDQUFDO0tBQ3hCLENBQUMsQ0FDSCxDQUFDOztBQUVGLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQ0FBaUMsRUFBRSxVQUFDLEtBQUssRUFBSztBQUNoRSwrQkFBeUIsR0FBRyxLQUFLLENBQUM7S0FDbkMsQ0FBQyxDQUNILENBQUM7Ozs7QUFJRixRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsMkJBQTJCLEVBQUUsVUFBQyxZQUFZLEVBQUs7QUFDakUsbUJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QyxtQkFBYSxDQUFDLElBQUksTUFBQSxDQUFsQixhQUFhLHFCQUFTLFlBQVksRUFBQyxDQUFDO0tBQ3JDLENBQUMsQ0FDSCxDQUFDO0dBQ0g7O0FBRUQsWUFBVSxFQUFBLHNCQUFHO0FBQ1gsUUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUM5Qjs7QUFFRCxlQUFhLEVBQUEseUJBQUc7QUFDZCxXQUFPO0FBQ0wsbUJBQWEsRUFBYixhQUFhO0FBQ2IsVUFBSSxFQUFFLE1BQU07QUFDWixXQUFLLEVBQUUsTUFBTTtBQUNiLGVBQVMsRUFBRSxJQUFJO0FBQ2YsVUFBSSxvQkFBRSxXQUFPLFVBQVUsRUFBSztBQUMxQixZQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEMsWUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUV0QyxZQUFNLFVBQVUsR0FBRywwQkFBMEIsQ0FBQyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQzs7MkNBRTFELElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQzs7OztZQUFwRCxXQUFXOztBQUNsQixZQUFNLFdBQVcsR0FBRztBQUNsQixnQkFBTSxFQUFFLFFBQVE7QUFDaEIsZUFBSyxFQUFFLFFBQVE7QUFDZixhQUFHLEVBQUUsV0FBVyxLQUFLLElBQUksR0FBRyxXQUFXLEdBQUcsbUJBQVEsUUFBUSxDQUFDO0FBQzNELDBCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQzs7QUFFRixZQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFM0UsWUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssUUFBUSxFQUFFOztBQUVyQyxpQkFBTyxJQUFJLENBQUM7U0FDYjs7QUFFRCxZQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDcEIsWUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQixlQUFPLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDckIsY0FBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9DLGNBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QyxrQkFBUSxDQUFDLElBQUksQ0FBQztBQUNaLGdCQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNkLGdCQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNkLG9CQUFRLEVBQVIsUUFBUTtBQUNSLGlCQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQztXQUNwRCxDQUFDLENBQUM7QUFDSCxlQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM1QjtBQUNELGVBQU8sUUFBUSxDQUFDO09BQ2pCLENBQUE7S0FDRixDQUFDO0dBQ0g7Q0FDRiIsImZpbGUiOiIvaG9tZS9jaHJpcy9zb3VyY2UvYm9vdHN0cmFwcGluZy8uYXRvbS9wYWNrYWdlcy9saW50ZXItdGlkeS9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzLCBpbXBvcnQvZXh0ZW5zaW9uc1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICdhdG9tLWxpbnRlcic7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5cbi8vIExvY2FsIHZhcmlhYmxlc1xuY29uc3QgcmVnZXggPSAvbGluZSAoXFxkKykgY29sdW1uIChcXGQrKSAtIChXYXJuaW5nfEVycm9yKTogKC4rKS9nO1xuY29uc3QgZGVmYXVsdEV4ZWN1dGFibGVBcmd1bWVudHMgPSBbXG4gICctbGFuZ3VhZ2UnLCAnZW4nLFxuICAnLXF1aWV0JyxcbiAgJy1lcnJvcnMnLFxuICAnLS10YWItc2l6ZScsICcxJyxcbl07XG4vLyBTZXR0aW5nc1xuY29uc3QgZ3JhbW1hclNjb3BlcyA9IFtdO1xubGV0IGV4ZWN1dGFibGVQYXRoO1xubGV0IGNvbmZpZ0V4ZWN1dGFibGVBcmd1bWVudHM7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgYWN0aXZhdGUoKSB7XG4gICAgcmVxdWlyZSgnYXRvbS1wYWNrYWdlLWRlcHMnKS5pbnN0YWxsKCdsaW50ZXItdGlkeScpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXRpZHkuZXhlY3V0YWJsZVBhdGgnLCAodmFsdWUpID0+IHtcbiAgICAgICAgZXhlY3V0YWJsZVBhdGggPSB2YWx1ZTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXRpZHkuZXhlY3V0YWJsZUFyZ3VtZW50cycsICh2YWx1ZSkgPT4ge1xuICAgICAgICBjb25maWdFeGVjdXRhYmxlQXJndW1lbnRzID0gdmFsdWU7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gQWRkIGEgbGlzdGVuZXIgdG8gdXBkYXRlIHRoZSBsaXN0IG9mIGdyYW1tYXIgc2NvcGVzIGxpbnRlZCB3aGVuIHRoZVxuICAgIC8vIGNvbmZpZyB2YWx1ZSBjaGFuZ2VzLlxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdGlkeS5ncmFtbWFyU2NvcGVzJywgKGNvbmZpZ1Njb3BlcykgPT4ge1xuICAgICAgICBncmFtbWFyU2NvcGVzLnNwbGljZSgwLCBncmFtbWFyU2NvcGVzLmxlbmd0aCk7XG4gICAgICAgIGdyYW1tYXJTY29wZXMucHVzaCguLi5jb25maWdTY29wZXMpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfSxcblxuICBkZWFjdGl2YXRlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gIH0sXG5cbiAgcHJvdmlkZUxpbnRlcigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ3JhbW1hclNjb3BlcyxcbiAgICAgIG5hbWU6ICd0aWR5JyxcbiAgICAgIHNjb3BlOiAnZmlsZScsXG4gICAgICBsaW50T25GbHk6IHRydWUsXG4gICAgICBsaW50OiBhc3luYyAodGV4dEVkaXRvcikgPT4ge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICBjb25zdCBmaWxlVGV4dCA9IHRleHRFZGl0b3IuZ2V0VGV4dCgpO1xuXG4gICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBkZWZhdWx0RXhlY3V0YWJsZUFyZ3VtZW50cy5jb25jYXQoY29uZmlnRXhlY3V0YWJsZUFyZ3VtZW50cyk7XG5cbiAgICAgICAgY29uc3QgW3Byb2plY3RQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IGV4ZWNPcHRpb25zID0ge1xuICAgICAgICAgIHN0cmVhbTogJ3N0ZGVycicsXG4gICAgICAgICAgc3RkaW46IGZpbGVUZXh0LFxuICAgICAgICAgIGN3ZDogcHJvamVjdFBhdGggIT09IG51bGwgPyBwcm9qZWN0UGF0aCA6IGRpcm5hbWUoZmlsZVBhdGgpLFxuICAgICAgICAgIGFsbG93RW1wdHlTdGRlcnI6IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgaGVscGVycy5leGVjKGV4ZWN1dGFibGVQYXRoLCBwYXJhbWV0ZXJzLCBleGVjT3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHRleHRFZGl0b3IuZ2V0VGV4dCgpICE9PSBmaWxlVGV4dCkge1xuICAgICAgICAgIC8vIEVkaXRvciBjb250ZW50cyBoYXZlIGNoYW5nZWQsIGRvbid0IHVwZGF0ZSB0aGUgbWVzc2FnZXNcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gW107XG4gICAgICAgIGxldCBtYXRjaCA9IHJlZ2V4LmV4ZWMob3V0cHV0KTtcbiAgICAgICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbGluZSA9IE51bWJlci5wYXJzZUludChtYXRjaFsxXSwgMTApIC0gMTtcbiAgICAgICAgICBjb25zdCBjb2wgPSBOdW1iZXIucGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDE7XG4gICAgICAgICAgbWVzc2FnZXMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiBtYXRjaFszXSxcbiAgICAgICAgICAgIHRleHQ6IG1hdGNoWzRdLFxuICAgICAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgICAgICByYW5nZTogaGVscGVycy5nZW5lcmF0ZVJhbmdlKHRleHRFZGl0b3IsIGxpbmUsIGNvbCksXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lc3NhZ2VzO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==