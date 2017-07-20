Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies

var _atom = require('atom');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _workerHelper = require('./workerHelper');

var workerHelper = _interopRequireWildcard(_workerHelper);

'use babel';

var grammarScopes = ['source.ts', 'source.tsx'];
var editorClass = 'linter-tslint-compatible-editor';
var idleCallbacks = new Set();
var config = {
  rulesDirectory: null,
  useLocalTslint: false
};

// Worker still hasn't initialized, since the queued idle callbacks are
// done in order, waiting on a newly queued idle callback will ensure that
// the worker has been initialized
var waitOnIdle = _asyncToGenerator(function* () {
  return new Promise(function (resolve) {
    var callbackID = window.requestIdleCallback(function () {
      idleCallbacks['delete'](callbackID);
      resolve();
    });
    idleCallbacks.add(callbackID);
  });
});

exports['default'] = {
  activate: function activate() {
    var _this = this;

    var depsCallbackID = undefined;
    var lintertslintDeps = function lintertslintDeps() {
      idleCallbacks['delete'](depsCallbackID);
      // Install package dependencies
      require('atom-package-deps').install('linter-tslint');
    };
    depsCallbackID = window.requestIdleCallback(lintertslintDeps);
    idleCallbacks.add(depsCallbackID);

    this.subscriptions = new _atom.CompositeDisposable();

    // Config subscriptions
    this.subscriptions.add(atom.config.observe('linter-tslint.rulesDirectory', function (dir) {
      if (dir && _path2['default'].isAbsolute(dir)) {
        _fs2['default'].stat(dir, function (err, stats) {
          if (stats && stats.isDirectory()) {
            config.rulesDirectory = dir;
            workerHelper.changeConfig('rulesDirectory', dir);
          }
        });
      }
    }), atom.config.observe('linter-tslint.useLocalTslint', function (use) {
      config.useLocalTslint = use;
      workerHelper.changeConfig('useLocalTslint', use);
    }), atom.config.observe('linter-tslint.enableSemanticRules', function (enableSemanticRules) {
      config.enableSemanticRules = enableSemanticRules;
      workerHelper.changeConfig('enableSemanticRules', enableSemanticRules);
    }), atom.config.observe('linter-tslint.ignoreTypings', function (ignoreTypings) {
      _this.ignoreTypings = ignoreTypings;
    }));

    // Marks each TypeScript editor with a CSS class so that
    // we can enable commands only for TypeScript editors.
    this.subscriptions.add(atom.workspace.observeTextEditors(function (textEditor) {
      if (textEditor.getRootScopeDescriptor().getScopesArray().some(function (scope) {
        return grammarScopes.includes(scope);
      })) {
        atom.views.getView(textEditor).classList.add(editorClass);
        textEditor.onDidSave(_asyncToGenerator(function* () {
          if (atom.config.get('linter-tslint.fixOnSave')) {
            yield workerHelper.requestJob('fix', textEditor);
          }
        }));
      }
    }));

    // Command subscriptions
    this.subscriptions.add(atom.commands.add('atom-text-editor.' + editorClass, {
      'linter-tslint:fix-file': _asyncToGenerator(function* () {
        var textEditor = atom.workspace.getActiveTextEditor();

        if (!textEditor || textEditor.isModified()) {
          // Abort for invalid or unsaved text editors
          atom.notifications.addError('Linter-TSLint: Please save before fixing');
          return;
        }

        // The fix replaces the file content and the cursor can jump automatically
        // to the beginning of the file, so save current cursor position
        var cursorPosition = textEditor.getCursorBufferPosition();

        try {
          var results = yield workerHelper.requestJob('fix', textEditor);

          var notificationText = results && results.length === 0 ? 'Linter-TSLint: Fix complete.' : 'Linter-TSLint: Fix attempt complete, but linting errors remain.';

          atom.notifications.addSuccess(notificationText);
        } catch (err) {
          atom.notifications.addWarning(err.message);
        } finally {
          // Restore cursor to the position before fix job
          textEditor.setCursorBufferPosition(cursorPosition);
        }
      })
    }));

    var createWorkerCallback = window.requestIdleCallback(function () {
      _this.worker = new _atom.Task(require.resolve('./worker.js'));
      idleCallbacks['delete'](createWorkerCallback);
    });
    idleCallbacks.add(createWorkerCallback);
  },

  deactivate: function deactivate() {
    idleCallbacks.forEach(function (callbackID) {
      return window.cancelIdleCallback(callbackID);
    });
    idleCallbacks.clear();
    this.subscriptions.dispose();

    workerHelper.terminateWorker();
    this.worker = null;
  },

  provideLinter: function provideLinter() {
    var _this2 = this;

    return {
      name: 'TSLint',
      grammarScopes: grammarScopes,
      scope: 'file',
      lintOnFly: true,
      lint: _asyncToGenerator(function* (textEditor) {
        if (_this2.ignoreTypings && textEditor.getPath().toLowerCase().endsWith('.d.ts')) {
          return [];
        }

        if (!_this2.worker) {
          yield waitOnIdle();
        }

        workerHelper.startWorker(_this2.worker, config);

        var text = textEditor.getText();
        var results = yield workerHelper.requestJob('lint', textEditor);

        if (textEditor.getText() !== text) {
          // Text has been modified since the lint was triggered, tell linter not to update
          return null;
        }

        return results;
      })
    };
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10c2xpbnQvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O29CQUcwQyxNQUFNOztvQkFDL0IsTUFBTTs7OztrQkFDUixJQUFJOzs7OzRCQUNXLGdCQUFnQjs7SUFBbEMsWUFBWTs7QUFOeEIsV0FBVyxDQUFDOztBQVFaLElBQU0sYUFBYSxHQUFHLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2xELElBQU0sV0FBVyxHQUFHLGlDQUFpQyxDQUFDO0FBQ3RELElBQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDaEMsSUFBTSxNQUFNLEdBQUc7QUFDYixnQkFBYyxFQUFFLElBQUk7QUFDcEIsZ0JBQWMsRUFBRSxLQUFLO0NBQ3RCLENBQUM7Ozs7O0FBS0YsSUFBTSxVQUFVLHFCQUFHO1NBQ2pCLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFLO0FBQ3ZCLFFBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxZQUFNO0FBQ2xELG1CQUFhLFVBQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqQyxhQUFPLEVBQUUsQ0FBQztLQUNYLENBQUMsQ0FBQztBQUNILGlCQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0dBQy9CLENBQUM7Q0FBQSxDQUFBLENBQUM7O3FCQUVVO0FBQ2IsVUFBUSxFQUFBLG9CQUFHOzs7QUFDVCxRQUFJLGNBQWMsWUFBQSxDQUFDO0FBQ25CLFFBQU0sZ0JBQWdCLEdBQUcsU0FBbkIsZ0JBQWdCLEdBQVM7QUFDN0IsbUJBQWEsVUFBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUVyQyxhQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDdkQsQ0FBQztBQUNGLGtCQUFjLEdBQUcsTUFBTSxDQUFDLG1C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QkFBYSxFQUFiLGFBQWE7QUFDYixXQUFLLEVBQUUsTUFBTTtBQUNiLGVBQVMsRUFBRSxJQUFJO0FBQ2YsVUFBSSxvQkFBRSxXQUFPLFVBQVUsRUFBSztBQUMxQixZQUFJLE9BQUssYUFBYSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDOUUsaUJBQU8sRUFBRSxDQUFDO1NBQ1g7O0FBRUQsWUFBSSxDQUFDLE9BQUssTUFBTSxFQUFFO0FBQ2hCLGdCQUFNLFVBQVUsRUFBRSxDQUFDO1NBQ3BCOztBQUVELG9CQUFZLENBQUMsV0FBVyxDQUFDLE9BQUssTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUU5QyxZQUFNLElBQUksR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEMsWUFBTSxPQUFPLEdBQUcsTUFBTSxZQUFZLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQzs7QUFFbEUsWUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFOztBQUVqQyxpQkFBTyxJQUFJLENBQUM7U0FDYjs7QUFFRCxlQUFPLE9BQU8sQ0FBQztPQUNoQixDQUFBO0tBQ0YsQ0FBQztHQUNIO0NBQ0YiLCJmaWxlIjoiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvbGludGVyLXRzbGludC9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L2V4dGVuc2lvbnMsIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgVGFzayB9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgd29ya2VySGVscGVyIGZyb20gJy4vd29ya2VySGVscGVyJztcblxuY29uc3QgZ3JhbW1hclNjb3BlcyA9IFsnc291cmNlLnRzJywgJ3NvdXJjZS50c3gnXTtcbmNvbnN0IGVkaXRvckNsYXNzID0gJ2xpbnRlci10c2xpbnQtY29tcGF0aWJsZS1lZGl0b3InO1xuY29uc3QgaWRsZUNhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmNvbnN0IGNvbmZpZyA9IHtcbiAgcnVsZXNEaXJlY3Rvcnk6IG51bGwsXG4gIHVzZUxvY2FsVHNsaW50OiBmYWxzZSxcbn07XG5cbi8vIFdvcmtlciBzdGlsbCBoYXNuJ3QgaW5pdGlhbGl6ZWQsIHNpbmNlIHRoZSBxdWV1ZWQgaWRsZSBjYWxsYmFja3MgYXJlXG4vLyBkb25lIGluIG9yZGVyLCB3YWl0aW5nIG9uIGEgbmV3bHkgcXVldWVkIGlkbGUgY2FsbGJhY2sgd2lsbCBlbnN1cmUgdGhhdFxuLy8gdGhlIHdvcmtlciBoYXMgYmVlbiBpbml0aWFsaXplZFxuY29uc3Qgd2FpdE9uSWRsZSA9IGFzeW5jICgpID0+XG4gIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY29uc3QgY2FsbGJhY2tJRCA9IHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgIGlkbGVDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrSUQpO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICAgIGlkbGVDYWxsYmFja3MuYWRkKGNhbGxiYWNrSUQpO1xuICB9KTtcblxuZXhwb3J0IGRlZmF1bHQge1xuICBhY3RpdmF0ZSgpIHtcbiAgICBsZXQgZGVwc0NhbGxiYWNrSUQ7XG4gICAgY29uc3QgbGludGVydHNsaW50RGVwcyA9ICgpID0+IHtcbiAgICAgIGlkbGVDYWxsYmFja3MuZGVsZXRlKGRlcHNDYWxsYmFja0lEKTtcbiAgICAgIC8vIEluc3RhbGwgcGFja2FnZSBkZXBlbmRlbmNpZXNcbiAgICAgIHJlcXVpcmUoJ2F0b20tcGFja2FnZS1kZXBzJykuaW5zdGFsbCgnbGludGVyLXRzbGludCcpO1xuICAgIH07XG4gICAgZGVwc0NhbGxiYWNrSUQgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhsaW50ZXJ0c2xpbnREZXBzKTtcbiAgICBpZGxlQ2FsbGJhY2tzLmFkZChkZXBzQ2FsbGJhY2tJRCk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgLy8gQ29uZmlnIHN1YnNjcmlwdGlvbnNcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXRzbGludC5ydWxlc0RpcmVjdG9yeScsIChkaXIpID0+IHtcbiAgICAgICAgaWYgKGRpciAmJiBwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgIGZzLnN0YXQoZGlyLCAoZXJyLCBzdGF0cykgPT4ge1xuICAgICAgICAgICAgaWYgKHN0YXRzICYmIHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnJ1bGVzRGlyZWN0b3J5ID0gZGlyO1xuICAgICAgICAgICAgICB3b3JrZXJIZWxwZXIuY2hhbmdlQ29uZmlnKCdydWxlc0RpcmVjdG9yeScsIGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXRzbGludC51c2VMb2NhbFRzbGludCcsICh1c2UpID0+IHtcbiAgICAgICAgY29uZmlnLnVzZUxvY2FsVHNsaW50ID0gdXNlO1xuICAgICAgICB3b3JrZXJIZWxwZXIuY2hhbmdlQ29uZmlnKCd1c2VMb2NhbFRzbGludCcsIHVzZSk7XG4gICAgICB9KSxcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci10c2xpbnQuZW5hYmxlU2VtYW50aWNSdWxlcycsIChlbmFibGVTZW1hbnRpY1J1bGVzKSA9PiB7XG4gICAgICAgIGNvbmZpZy5lbmFibGVTZW1hbnRpY1J1bGVzID0gZW5hYmxlU2VtYW50aWNSdWxlcztcbiAgICAgICAgd29ya2VySGVscGVyLmNoYW5nZUNvbmZpZygnZW5hYmxlU2VtYW50aWNSdWxlcycsIGVuYWJsZVNlbWFudGljUnVsZXMpO1xuICAgICAgfSksXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdHNsaW50Lmlnbm9yZVR5cGluZ3MnLCAoaWdub3JlVHlwaW5ncykgPT4ge1xuICAgICAgICB0aGlzLmlnbm9yZVR5cGluZ3MgPSBpZ25vcmVUeXBpbmdzO1xuICAgICAgfSksXG4gICAgKTtcblxuICAgIC8vIE1hcmtzIGVhY2ggVHlwZVNjcmlwdCBlZGl0b3Igd2l0aCBhIENTUyBjbGFzcyBzbyB0aGF0XG4gICAgLy8gd2UgY2FuIGVuYWJsZSBjb21tYW5kcyBvbmx5IGZvciBUeXBlU2NyaXB0IGVkaXRvcnMuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygodGV4dEVkaXRvcikgPT4ge1xuICAgICAgICBpZiAodGV4dEVkaXRvci5nZXRSb290U2NvcGVEZXNjcmlwdG9yKCkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgICAuc29tZShzY29wZSA9PiBncmFtbWFyU2NvcGVzLmluY2x1ZGVzKHNjb3BlKSkpIHtcbiAgICAgICAgICBhdG9tLnZpZXdzLmdldFZpZXcodGV4dEVkaXRvcikuY2xhc3NMaXN0LmFkZChlZGl0b3JDbGFzcyk7XG4gICAgICAgICAgdGV4dEVkaXRvci5vbkRpZFNhdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnbGludGVyLXRzbGludC5maXhPblNhdmUnKSkge1xuICAgICAgICAgICAgICBhd2FpdCB3b3JrZXJIZWxwZXIucmVxdWVzdEpvYignZml4JywgdGV4dEVkaXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBDb21tYW5kIHN1YnNjcmlwdGlvbnNcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoYGF0b20tdGV4dC1lZGl0b3IuJHtlZGl0b3JDbGFzc31gLCB7XG4gICAgICAgICdsaW50ZXItdHNsaW50OmZpeC1maWxlJzogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICAgICAgICBpZiAoIXRleHRFZGl0b3IgfHwgdGV4dEVkaXRvci5pc01vZGlmaWVkKCkpIHtcbiAgICAgICAgICAgIC8vIEFib3J0IGZvciBpbnZhbGlkIG9yIHVuc2F2ZWQgdGV4dCBlZGl0b3JzXG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ0xpbnRlci1UU0xpbnQ6IFBsZWFzZSBzYXZlIGJlZm9yZSBmaXhpbmcnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBUaGUgZml4IHJlcGxhY2VzIHRoZSBmaWxlIGNvbnRlbnQgYW5kIHRoZSBjdXJzb3IgY2FuIGp1bXAgYXV0b21hdGljYWxseVxuICAgICAgICAgIC8vIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGUsIHNvIHNhdmUgY3VycmVudCBjdXJzb3IgcG9zaXRpb25cbiAgICAgICAgICBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IHRleHRFZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgd29ya2VySGVscGVyLnJlcXVlc3RKb2IoJ2ZpeCcsIHRleHRFZGl0b3IpO1xuXG4gICAgICAgICAgICBjb25zdCBub3RpZmljYXRpb25UZXh0ID0gcmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA9PT0gMCA/XG4gICAgICAgICAgICAgICdMaW50ZXItVFNMaW50OiBGaXggY29tcGxldGUuJyA6XG4gICAgICAgICAgICAgICdMaW50ZXItVFNMaW50OiBGaXggYXR0ZW1wdCBjb21wbGV0ZSwgYnV0IGxpbnRpbmcgZXJyb3JzIHJlbWFpbi4nO1xuXG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2Vzcyhub3RpZmljYXRpb25UZXh0KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgLy8gUmVzdG9yZSBjdXJzb3IgdG8gdGhlIHBvc2l0aW9uIGJlZm9yZSBmaXggam9iXG4gICAgICAgICAgICB0ZXh0RWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKGN1cnNvclBvc2l0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgY29uc3QgY3JlYXRlV29ya2VyQ2FsbGJhY2sgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICB0aGlzLndvcmtlciA9IG5ldyBUYXNrKHJlcXVpcmUucmVzb2x2ZSgnLi93b3JrZXIuanMnKSk7XG4gICAgICBpZGxlQ2FsbGJhY2tzLmRlbGV0ZShjcmVhdGVXb3JrZXJDYWxsYmFjayk7XG4gICAgfSk7XG4gICAgaWRsZUNhbGxiYWNrcy5hZGQoY3JlYXRlV29ya2VyQ2FsbGJhY2spO1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgaWRsZUNhbGxiYWNrcy5mb3JFYWNoKGNhbGxiYWNrSUQgPT4gd2luZG93LmNhbmNlbElkbGVDYWxsYmFjayhjYWxsYmFja0lEKSk7XG4gICAgaWRsZUNhbGxiYWNrcy5jbGVhcigpO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG5cbiAgICB3b3JrZXJIZWxwZXIudGVybWluYXRlV29ya2VyKCk7XG4gICAgdGhpcy53b3JrZXIgPSBudWxsO1xuICB9LFxuXG4gIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6ICdUU0xpbnQnLFxuICAgICAgZ3JhbW1hclNjb3BlcyxcbiAgICAgIHNjb3BlOiAnZmlsZScsXG4gICAgICBsaW50T25GbHk6IHRydWUsXG4gICAgICBsaW50OiBhc3luYyAodGV4dEVkaXRvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVUeXBpbmdzICYmIHRleHRFZGl0b3IuZ2V0UGF0aCgpLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoJy5kLnRzJykpIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMud29ya2VyKSB7XG4gICAgICAgICAgYXdhaXQgd2FpdE9uSWRsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgd29ya2VySGVscGVyLnN0YXJ0V29ya2VyKHRoaXMud29ya2VyLCBjb25maWcpO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSB0ZXh0RWRpdG9yLmdldFRleHQoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHdvcmtlckhlbHBlci5yZXF1ZXN0Sm9iKCdsaW50JywgdGV4dEVkaXRvcik7XG5cbiAgICAgICAgaWYgKHRleHRFZGl0b3IuZ2V0VGV4dCgpICE9PSB0ZXh0KSB7XG4gICAgICAgICAgLy8gVGV4dCBoYXMgYmVlbiBtb2RpZmllZCBzaW5jZSB0aGUgbGludCB3YXMgdHJpZ2dlcmVkLCB0ZWxsIGxpbnRlciBub3QgdG8gdXBkYXRlXG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=