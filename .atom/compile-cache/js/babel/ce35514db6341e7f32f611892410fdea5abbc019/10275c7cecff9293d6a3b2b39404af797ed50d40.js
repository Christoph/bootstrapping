Object.defineProperty(exports, '__esModule', {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/** @babel */

var _atom = require('atom');

exports['default'] = {
  activate: function activate(serialized) {
    var _this = this;

    this.bootstrap();

    if (serialized && serialized.messages) {
      latex.log.setMessages(serialized.messages);
    }

    this.disposables.add(atom.commands.add('atom-workspace', {
      'latex:build': function latexBuild() {
        return latex.composer.build(false);
      },
      'latex:check-runtime': function latexCheckRuntime() {
        return _this.checkRuntime();
      },
      'latex:clean': function latexClean() {
        return latex.composer.clean();
      },
      'latex:clear-log': function latexClearLog() {
        return latex.log.clear();
      },
      'latex:hide-log': function latexHideLog() {
        return latex.log.hide();
      },
      'latex:kill': function latexKill() {
        return latex.process.killChildProcesses();
      },
      'latex:rebuild': function latexRebuild() {
        return latex.composer.build(true);
      },
      'latex:show-log': function latexShowLog() {
        return latex.log.show();
      },
      'latex:sync-log': function latexSyncLog() {
        return latex.log.sync();
      },
      'latex:sync': function latexSync() {
        return latex.composer.sync();
      },
      'latex:toggle-log': function latexToggleLog() {
        return latex.log.toggle();
      }
    }));

    this.disposables.add(atom.workspace.observeTextEditors(function (editor) {
      _this.disposables.add(editor.onDidSave(function () {
        // Let's play it safe; only trigger builds for the active editor.
        var activeEditor = atom.workspace.getActiveTextEditor();
        if (editor === activeEditor && atom.config.get('latex.buildOnSave')) {
          latex.composer.build();
        }
      }));
    }));

    var MarkerManager = require('./marker-manager');
    this.disposables.add(atom.workspace.observeTextEditors(function (editor) {
      _this.disposables.add(new MarkerManager(editor));
    }));

    if (!atom.inSpecMode()) {
      var checkConfigAndMigrate = require('./config-migrator');
      checkConfigAndMigrate();
    }
  },

  deactivate: function deactivate() {
    if (this.disposables) {
      this.disposables.dispose();
      delete this.disposables;
    }

    delete global.latex;
  },

  serialize: function serialize() {
    return { messages: latex.log.getMessages(false) };
  },

  consumeStatusBar: function consumeStatusBar(statusBar) {
    this.bootstrap();
    latex.status.attachStatusBar(statusBar);
    return new _atom.Disposable(function () {
      if (latex) latex.status.detachStatusBar();
    });
  },

  deserializeLog: function deserializeLog(serialized) {
    this.bootstrap();
    var LogDock = require('./views/log-dock');
    return new LogDock();
  },

  bootstrap: function bootstrap() {
    if (!this.disposables) {
      this.disposables = new _atom.CompositeDisposable();
    }

    if (global.latex) {
      return;
    }

    var Latex = require('./latex');
    global.latex = new Latex();
    this.disposables.add(global.latex);
  },

  checkRuntime: _asyncToGenerator(function* () {
    // latex.log.group('LaTeX Check')
    latex.log.clear();
    yield latex.builderRegistry.checkRuntimeDependencies();
    latex.opener.checkRuntimeDependencies();
    // latex.log.groupEnd()
  })
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUVnRCxNQUFNOztxQkFFdkM7QUFDYixVQUFRLEVBQUMsa0JBQUMsVUFBVSxFQUFFOzs7QUFDcEIsUUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBOztBQUVoQixRQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFO0FBQ3JDLFdBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtLQUMzQzs7QUFFRCxRQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtBQUN2RCxtQkFBYSxFQUFFO2VBQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO09BQUE7QUFDaEQsMkJBQXFCLEVBQUU7ZUFBTSxNQUFLLFlBQVksRUFBRTtPQUFBO0FBQ2hELG1CQUFhLEVBQUU7ZUFBTSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRTtPQUFBO0FBQzNDLHVCQUFpQixFQUFFO2VBQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUU7T0FBQTtBQUMxQyxzQkFBZ0IsRUFBRTtlQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO09BQUE7QUFDeEMsa0JBQVksRUFBRTtlQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUU7T0FBQTtBQUN0RCxxQkFBZSxFQUFFO2VBQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO09BQUE7QUFDakQsc0JBQWdCLEVBQUU7ZUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRTtPQUFBO0FBQ3hDLHNCQUFnQixFQUFFO2VBQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7T0FBQTtB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QUFDLGFBQUc7O0FBRXBCLFNBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDakIsVUFBTSxLQUFLLENBQUMsZUFBZSxDQUFDLHdCQUF3QixFQUFFLENBQUE7QUFDdEQsU0FBSyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFBOztHQUV4QyxDQUFBO0NBQ0YiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGF0ZXgvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGFjdGl2YXRlIChzZXJpYWxpemVkKSB7XG4gICAgdGhpcy5ib290c3RyYXAoKVxuXG4gICAgaWYgKHNlcmlhbGl6ZWQgJiYgc2VyaWFsaXplZC5tZXNzYWdlcykge1xuICAgICAgbGF0ZXgubG9nLnNldE1lc3NhZ2VzKHNlcmlhbGl6ZWQubWVzc2FnZXMpXG4gICAgfVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywge1xuICAgICAgJ2xhdGV4OmJ1aWxkJzogKCkgPT4gbGF0ZXguY29tcG9zZXIuYnVpbGQoZmFsc2UpLFxuICAgICAgJ2xhdGV4OmNoZWNrLXJ1bnRpbWUnOiAoKSA9PiB0aGlzLmNoZWNrUnVudGltZSgpLFxuICAgICAgJ2xhdGV4OmNsZWFuJzogKCkgPT4gbGF0ZXguY29tcG9zZXIuY2xlYW4oKSxcbiAgICAgICdsYXRleDpjbGVhci1sb2cnOiAoKSA9PiBsYXRleC5sb2cuY2xlYXIoKSxcbiAgICAgICdsYXRleDpoaWRlLWxvZyc6ICgpID0+IGxhdGV4LmxvZy5oaWRlKCksXG4gICAgICAnbGF0ZXg6a2lsbCc6ICgpID0+IGxhdGV4LnByb2Nlc3Mua2lsbENoaWxkUHJvY2Vzc2VzKCksXG4gICAgICAnbGF0ZXg6cmVidWlsZCc6ICgpID0+IGxhdGV4LmNvbXBvc2VyLmJ1aWxkKHRydWUpLFxuICAgICAgJ2xhdGV4OnNob3ctbG9nJzogKCkgPT4gbGF0ZXgubG9nLnNob3coKSxcbiAgICAgICdsYXRleDpzeW5jLWxvZyc6ICgpID0+IGxhdGV4LmxvZy5zeW5jKCksXG4gICAgICAnbGF0ZXg6c3luYyc6ICgpID0+IGxhdGV4LmNvbXBvc2VyLnN5bmMoKSxcbiAgICAgICdsYXRleDp0b2dnbGUtbG9nJzogKCkgPT4gbGF0ZXgubG9nLnRvZ2dsZSgpXG4gICAgfSkpXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoZWRpdG9yID0+IHtcbiAgICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xuICAgICAgICAvLyBMZXQncyBwbGF5IGl0IHNhZmU7IG9ubHkgdHJpZ2dlciBidWlsZHMgZm9yIHRoZSBhY3RpdmUgZWRpdG9yLlxuICAgICAgICBjb25zdCBhY3RpdmVFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgaWYgKGVkaXRvciA9PT0gYWN0aXZlRWRpdG9yICYmIGF0b20uY29uZmlnLmdldCgnbGF0ZXguYnVpbGRPblNhdmUnKSkge1xuICAgICAgICAgIGxhdGV4LmNvbXBvc2VyLmJ1aWxkKClcbiAgICAgICAgfVxuICAgICAgfSkpXG4gICAgfSkpXG5cbiAgICBjb25zdCBNYXJrZXJNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYXJrZXItbWFuYWdlcicpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKGVkaXRvciA9PiB7XG4gICAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChuZXcgTWFya2VyTWFuYWdlcihlZGl0b3IpKVxuICAgIH0pKVxuXG4gICAgaWYgKCFhdG9tLmluU3BlY01vZGUoKSkge1xuICAgICAgY29uc3QgY2hlY2tDb25maWdBbmRNaWdyYXRlID0gcmVxdWlyZSgnLi9jb25maWctbWlncmF0b3InKVxuICAgICAgY2hlY2tDb25maWdBbmRNaWdyYXRlKClcbiAgICB9XG4gIH0sXG5cbiAgZGVhY3RpdmF0ZSAoKSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zYWJsZXMpIHtcbiAgICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgICBkZWxldGUgdGhpcy5kaXNwb3NhYmxlc1xuICAgIH1cblxuICAgIGRlbGV0ZSBnbG9iYWwubGF0ZXhcbiAgfSxcblxuICBzZXJpYWxpemUgKCkge1xuICAgIHJldHVybiB7IG1lc3NhZ2VzOiBsYXRleC5sb2cuZ2V0TWVzc2FnZXMoZmFsc2UpIH1cbiAgfSxcblxuICBjb25zdW1lU3RhdHVzQmFyIChzdGF0dXNCYXIpIHtcbiAgICB0aGlzLmJvb3RzdHJhcCgpXG4gICAgbGF0ZXguc3RhdHVzLmF0dGFjaFN0YXR1c0JhcihzdGF0dXNCYXIpXG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmIChsYXRleCkgbGF0ZXguc3RhdHVzLmRldGFjaFN0YXR1c0JhcigpXG4gICAgfSlcbiAgfSxcblxuICBkZXNlcmlhbGl6ZUxvZyAoc2VyaWFsaXplZCkge1xuICAgIHRoaXMuYm9vdHN0cmFwKClcbiAgICBjb25zdCBMb2dEb2NrID0gcmVxdWlyZSgnLi92aWV3cy9sb2ctZG9jaycpXG4gICAgcmV0dXJuIG5ldyBMb2dEb2NrKClcbiAgfSxcblxuICBib290c3RyYXAgKCkge1xuICAgIGlmICghdGhpcy5kaXNwb3NhYmxlcykge1xuICAgICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB9XG5cbiAgICBpZiAoZ2xvYmFsLmxhdGV4KSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBMYXRleCA9IHJlcXVpcmUoJy4vbGF0ZXgnKVxuICAgIGdsb2JhbC5sYXRleCA9IG5ldyBMYXRleCgpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoZ2xvYmFsLmxhdGV4KVxuICB9LFxuXG4gIGFzeW5jIGNoZWNrUnVudGltZSAoKSB7XG4gICAgLy8gbGF0ZXgubG9nLmdyb3VwKCdMYVRlWCBDaGVjaycpXG4gICAgbGF0ZXgubG9nLmNsZWFyKClcbiAgICBhd2FpdCBsYXRleC5idWlsZGVyUmVnaXN0cnkuY2hlY2tSdW50aW1lRGVwZW5kZW5jaWVzKClcbiAgICBsYXRleC5vcGVuZXIuY2hlY2tSdW50aW1lRGVwZW5kZW5jaWVzKClcbiAgICAvLyBsYXRleC5sb2cuZ3JvdXBFbmQoKVxuICB9XG59XG4iXX0=