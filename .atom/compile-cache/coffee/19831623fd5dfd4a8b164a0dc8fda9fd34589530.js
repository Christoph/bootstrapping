(function() {
  var CompositeDisposable, LinterPylama, helpers, os, path, realpathSync, ref, regex, statSync,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require("fs"), statSync = ref.statSync, realpathSync = ref.realpathSync;

  os = require('os');

  path = require('path');

  CompositeDisposable = require('atom').CompositeDisposable;

  helpers = require('atom-linter');

  regex = '(?<file_>.+):' + '(?<line>\\d+):' + '(?<col>\\d+):' + '\\s+' + '(((?<type>[ECDFINRW])(?<file>\\d+)(:\\s+|\\s+))|(.*?))' + '(?<message>.+)';

  LinterPylama = (function() {
    function LinterPylama() {
      this.lint = bind(this.lint, this);
      this.lintOnSave = bind(this.lintOnSave, this);
      this.lintFileOnFly = bind(this.lintFileOnFly, this);
      this.makeLintInfo = bind(this.makeLintInfo, this);
      this.initArgs = bind(this.initArgs, this);
      this.initPylama = bind(this.initPylama, this);
      this.isortPath = path.join(path.dirname(__dirname), 'bin', 'isort.py');
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.config.observe('linter-pylama.pylamaVersion', (function(_this) {
        return function(pylamaVersion) {
          if (_this.pylamaVersion) {
            _this.pylamaVersion = pylamaVersion;
            return _this.initPylama();
          } else {
            return _this.pylamaVersion = pylamaVersion;
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.executablePath', (function(_this) {
        return function(executablePath) {
          if (_this.executablePath) {
            _this.executablePath = executablePath;
            return _this.initPylama();
          } else {
            return _this.executablePath = executablePath;
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.interpreter', (function(_this) {
        return function(interpreter) {
          _this.interpreter = interpreter;
          return _this.initPylama();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.ignoreErrorsAndWarnings', (function(_this) {
        return function(ignoreErrorsAndWarnings) {
          if (ignoreErrorsAndWarnings) {
            ignoreErrorsAndWarnings = ignoreErrorsAndWarnings.replace(/\s+/g, '');
          }
          return _this.ignoreErrorsAndWarnings = ignoreErrorsAndWarnings;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.skipFiles', (function(_this) {
        return function(skipFiles) {
          return _this.skipFiles = skipFiles;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.useMcCabe', (function(_this) {
        return function(useMcCabe) {
          _this.useMcCabe = useMcCabe;
          if (_this.useMcCabe) {
            return atom.config.set('linter-pylama.useRadon', false);
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePep8', (function(_this) {
        return function(usePEP8) {
          return _this.usePEP8 = usePEP8;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePep257', (function(_this) {
        return function(usePEP257) {
          return _this.usePEP257 = usePEP257;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePyflakes', (function(_this) {
        return function(usePyFlakes) {
          _this.usePyFlakes = usePyFlakes;
          if (_this.usePyflakes) {
            return atom.config.set('linter-pylama.useRadon', false);
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePylint', (function(_this) {
        return function(usePyLint) {
          return _this.usePyLint = usePyLint;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.useRadon', (function(_this) {
        return function(useRadon) {
          _this.useRadon = useRadon;
          if (_this.useRadon) {
            atom.config.set('linter-pylama.useMcCabe', false);
            return atom.config.set('linter-pylama.usePyflakes', false);
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.useIsort', (function(_this) {
        return function(useIsort) {
          return _this.useIsort = useIsort;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.lintOnFly', (function(_this) {
        return function(lintOnFly) {
          return _this.lintOnFly = lintOnFly;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.configFileLoad', (function(_this) {
        return function(configFileLoad) {
          return _this.configFileLoad = configFileLoad;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.configFileName', (function(_this) {
        return function(configFileName) {
          return _this.configFileName = configFileName;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.isortOnSave', (function(_this) {
        return function(isortOnSave) {
          var ref1;
          if (isortOnSave) {
            return atom.workspace.observeTextEditors(function(editor) {
              return _this.isortOnSave = editor.onDidSave(function() {
                if ((typeof editor.getGrammar === "function" ? editor.getGrammar().scopeName : void 0) === 'source.python') {
                  return helpers.exec(_this.interpreter, [_this.isortPath, editor.getPath()]);
                }
              });
            });
          } else {
            return (ref1 = _this.isortOnSave) != null ? ref1.dispose() : void 0;
          }
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'linter-pylama:isort', (function(_this) {
        return function() {
          var editor;
          editor = atom.workspace.getActiveTextEditor();
          return helpers.exec(_this.interpreter, [_this.isortPath, editor.getPath()]);
        };
      })(this)));
    }

    LinterPylama.prototype.destroy = function() {
      var ref1, ref2;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      return (ref2 = this.isortOnSave) != null ? ref2.dispose() : void 0;
    };

    LinterPylama.prototype.isLintOnFly = function() {
      return this.lintOnFly;
    };

    LinterPylama.prototype.initEnv = function(filePath, projectPath) {
      var env, processPath, pythonPath;
      pythonPath = [];
      if (filePath) {
        pythonPath.push(filePath);
      }
      if (projectPath && indexOf.call(pythonPath, projectPath) < 0) {
        pythonPath.push(projectPath);
      }
      env = Object.create(process.env);
      if (env.PWD) {
        processPath = path.normalize(env.PWD);
        if (processPath && indexOf.call(pythonPath, processPath) < 0) {
          pythonPath.push(processPath);
        }
      }
      env.PYLAMA = pythonPath.join(path.delimiter);
      return env;
    };

    LinterPylama.prototype.initPylama = function() {
      var dir, e, homedir, i, len, processPath, ref1, tmp;
      if (this.pylamaVersion === 'external' && this.executablePath !== this.pylamaPath) {
        this.pylamaPath = '';
        if (/^(pylama|pylama\.exe)$/.test(this.executablePath)) {
          processPath = process.env.PATH || process.env.Path;
          ref1 = processPath.split(path.delimiter);
          for (i = 0, len = ref1.length; i < len; i++) {
            dir = ref1[i];
            tmp = path.join(dir, this.executablePath);
            try {
              if (statSync(tmp).isFile()) {
                this.pylamaPath = tmp;
              }
              break;
            } catch (error) {
              e = error;
            }
          }
        } else {
          if (this.executablePath) {
            homedir = os.homedir();
            if (homedir) {
              this.executablePath = this.executablePath.replace(/^~($|\/|\\)/, homedir + "$1");
            }
            tmp = !path.isAbsolute(this.executablePath) ? path.resolve(this.executablePath) : this.executablePath;
            try {
              if (statSync(tmp).isFile()) {
                this.pylamaPath = tmp;
              }
            } catch (error) {
              e = error;
            }
          }
        }
        if (!this.pylamaPath) {
          return atom.notifications.addError('Pylama executable not found', {
            detail: "[linter-pylama] `" + this.executablePath + "` executable file not found. \nPlease set the correct path to `pylama`."
          });
        }
      } else {
        return this.pylamaPath = path.join(path.dirname(__dirname), 'bin', 'pylama.py');
      }
    };

    LinterPylama.prototype.initArgs = function(curDir) {
      var args, configFilePath, linters, useIsort, useMcCabe, usePEP257, usePEP8, usePyFlakes, usePyLint, useRadon;
      args = ['-F'];
      if (this.configFileLoad[0] === 'U') {
        configFilePath = helpers.findCached(curDir, this.configFileName);
      }
      if (configFilePath) {
        args.push.apply(args, ['--options', configFilePath]);
      } else {
        if (this.ignoreErrorsAndWarnings) {
          args.push.apply(args, ['--ignore', this.ignoreErrorsAndWarnings]);
        }
        if (this.skipFiles) {
          args.push.apply(args, ['--skip', this.skipFiles]);
        }
        usePyLint = this.usePyLint ? 'pylint' : '';
        useMcCabe = this.useMcCabe ? 'mccabe' : '';
        usePEP8 = this.usePEP8 ? 'pep8' : '';
        usePEP257 = this.usePEP257 ? 'pep257' : '';
        usePyFlakes = this.usePyFlakes ? 'pyflakes' : '';
        useRadon = this.useRadon ? 'radon' : '';
        useIsort = this.useIsort ? 'isort' : '';
        linters = [usePEP8, usePEP257, usePyLint, usePyFlakes, useMcCabe, useRadon, useIsort].filter(function(e) {
          return e !== '';
        });
        args.push('--linters');
        if (linters.length) {
          args.push(linters.join());
        } else {
          args.push('none');
        }
      }
      return args;
    };

    LinterPylama.prototype.makeLintInfo = function(fileName, originFileName) {
      var args, command, cwd, env, filePath, info, projectPath;
      if (!originFileName) {
        originFileName = fileName;
      }
      filePath = path.normalize(path.dirname(originFileName));
      projectPath = atom.project.relativizePath(originFileName)[0];
      cwd = fileName !== originFileName ? path.dirname(fileName) : projectPath;
      env = this.initEnv(filePath, projectPath);
      args = this.initArgs(filePath);
      args.push(fileName);
      if (atom.inDevMode()) {
        console.log(this.pylamaPath + " " + args);
      }
      if (this.pylamaVersion === 'external') {
        command = this.pylamaPath;
      } else {
        command = this.interpreter;
        args.unshift(this.pylamaPath);
      }
      return info = {
        fileName: originFileName,
        command: command,
        args: args,
        options: {
          env: env,
          cwd: cwd,
          stream: 'both'
        }
      };
    };

    LinterPylama.prototype.lintFile = function(lintInfo, textEditor) {
      return helpers.exec(lintInfo.command, lintInfo.args, lintInfo.options).then((function(_this) {
        return function(output) {
          if (output['stderr']) {
            atom.notifications.addWarning(output['stderr']);
          }
          if (atom.inDevMode()) {
            console.log(output['stdout']);
          }
          return helpers.parse(output['stdout'], regex).map(function(message) {
            var code, col, colEnd, editorLine, line, ref1;
            if (!message.type) {
              message.type = '';
            }
            if (!message.filePath) {
              message.filePath = '';
            }
            code = "" + message.type + message.filePath;
            message.type = (ref1 = message.type) === 'E' || ref1 === 'F' ? 'Error' : 'Warning';
            message.filePath = lintInfo.fileName;
            message.text = code ? code + " " + message.text : "" + message.text;
            line = message.range[0][0];
            col = message.range[0][1];
            editorLine = textEditor.buffer.lines[line];
            if (!editorLine || !editorLine.length) {
              colEnd = 0;
            } else {
              colEnd = editorLine.indexOf(' ', col + 1);
              if (colEnd === -1) {
                colEnd = editorLine.length;
              } else {
                if (colEnd - col < 3) {
                  colEnd = 3;
                }
                colEnd = colEnd < editorLine.length ? colEnd : editorLine.length;
              }
            }
            message.range = [[line, col], [line, colEnd]];
            return message;
          });
        };
      })(this));
    };

    LinterPylama.prototype.lintFileOnFly = function(textEditor) {
      var fileName, filePath;
      filePath = textEditor.getPath();
      fileName = path.basename(textEditor.getPath());
      return helpers.tempFile(fileName, textEditor.getText(), (function(_this) {
        return function(tmpFilePath) {
          var lintInfo;
          tmpFilePath = realpathSync(tmpFilePath);
          lintInfo = _this.makeLintInfo(tmpFilePath, filePath);
          return _this.lintFile(lintInfo, textEditor);
        };
      })(this));
    };

    LinterPylama.prototype.lintOnSave = function(textEditor) {
      var filePath, lintInfo;
      filePath = textEditor.getPath();
      if (process.platform === 'win32') {
        if (filePath.slice(0, 2) === '\\\\') {
          return this.lintFileOnFly(textEditor);
        }
      }
      lintInfo = this.makeLintInfo(filePath);
      return this.lintFile(lintInfo, textEditor);
    };

    LinterPylama.prototype.lint = function(textEditor) {
      if (!this.pylamaPath) {
        return [];
      }
      if (this.lintOnFly) {
        return this.lintFileOnFly(textEditor);
      }
      return this.lintOnSave(textEditor);
    };

    return LinterPylama;

  })();

  module.exports = LinterPylama;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvbGludGVyLXB5bGFtYS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdGQUFBO0lBQUE7OztFQUFBLE1BQTJCLE9BQUEsQ0FBUSxJQUFSLENBQTNCLEVBQUMsdUJBQUQsRUFBVzs7RUFDWCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVOLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsT0FBQSxHQUFVLE9BQUEsQ0FBUSxhQUFSOztFQUVWLEtBQUEsR0FDRSxlQUFBLEdBQ0EsZ0JBREEsR0FFQSxlQUZBLEdBR0EsTUFIQSxHQUlBLHdEQUpBLEdBS0E7O0VBR0k7SUFDUyxzQkFBQTs7Ozs7OztNQUNYLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsQ0FBVixFQUFtQyxLQUFuQyxFQUEwQyxVQUExQztNQUViLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQiw2QkFBcEIsRUFDbkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLGFBQUQ7VUFDRSxJQUFHLEtBQUMsQ0FBQSxhQUFKO1lBQ0UsS0FBQyxDQUFBLGFBQUQsR0FBaUI7bUJBQ2QsS0FBQyxDQUFBLFVBQUosQ0FBQSxFQUZGO1dBQUEsTUFBQTttQkFJRSxLQUFDLENBQUEsYUFBRCxHQUFpQixjQUpuQjs7UUFERjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEbUIsQ0FBbkI7TUFRQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFB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QUEsUUFBRCxDQUFVLFFBQVYsRUFBb0IsVUFBcEI7SUFOVTs7MkJBU1osSUFBQSxHQUFNLFNBQUMsVUFBRDtNQUNKLElBQWEsQ0FBSSxJQUFDLENBQUEsVUFBbEI7QUFBQSxlQUFPLEdBQVA7O01BQ0EsSUFBb0MsSUFBQyxDQUFBLFNBQXJDO0FBQUEsZUFBTyxJQUFDLENBQUEsYUFBRCxDQUFlLFVBQWYsRUFBUDs7YUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLFVBQVo7SUFISTs7Ozs7O0VBTVIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUE5UWpCIiwic291cmNlc0NvbnRlbnQiOlsie3N0YXRTeW5jLCByZWFscGF0aFN5bmN9ID0gcmVxdWlyZSBcImZzXCJcbm9zID0gcmVxdWlyZSAnb3MnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbmhlbHBlcnMgPSByZXF1aXJlICdhdG9tLWxpbnRlcidcblxucmVnZXggPVxuICAnKD88ZmlsZV8+LispOicgK1xuICAnKD88bGluZT5cXFxcZCspOicgK1xuICAnKD88Y29sPlxcXFxkKyk6JyArXG4gICdcXFxccysnICtcbiAgJygoKD88dHlwZT5bRUNERklOUlddKSg/PGZpbGU+XFxcXGQrKSg6XFxcXHMrfFxcXFxzKykpfCguKj8pKScgK1xuICAnKD88bWVzc2FnZT4uKyknXG5cblxuY2xhc3MgTGludGVyUHlsYW1hXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBpc29ydFBhdGggPSBwYXRoLmpvaW4gcGF0aC5kaXJuYW1lKF9fZGlybmFtZSksICdiaW4nLCAnaXNvcnQucHknXG5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEucHlsYW1hVmVyc2lvbicsXG4gICAgKHB5bGFtYVZlcnNpb24pID0+XG4gICAgICBpZiBAcHlsYW1hVmVyc2lvblxuICAgICAgICBAcHlsYW1hVmVyc2lvbiA9IHB5bGFtYVZlcnNpb25cbiAgICAgICAgZG8gQGluaXRQeWxhbWFcbiAgICAgIGVsc2VcbiAgICAgICAgQHB5bGFtYVZlcnNpb24gPSBweWxhbWFWZXJzaW9uXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5leGVjdXRhYmxlUGF0aCcsXG4gICAgKGV4ZWN1dGFibGVQYXRoKSA9PlxuICAgICAgaWYgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgIEBleGVjdXRhYmxlUGF0aCA9IGV4ZWN1dGFibGVQYXRoXG4gICAgICAgIGRvIEBpbml0UHlsYW1hXG4gICAgICBlbHNlXG4gICAgICAgIEBleGVjdXRhYmxlUGF0aCA9IGV4ZWN1dGFibGVQYXRoXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5pbnRlcnByZXRlcicsXG4gICAgKGludGVycHJldGVyKSA9PlxuICAgICAgQGludGVycHJldGVyID0gaW50ZXJwcmV0ZXJcbiAgICAgIGRvIEBpbml0UHlsYW1hXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5pZ25vcmVFcnJvcnNBbmRXYXJuaW5ncycsXG4gICAgKGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzKSA9PlxuICAgICAgaWdub3JlRXJyb3JzQW5kV2FybmluZ3MgPSBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncy5yZXBsYWNlIC9cXHMrL2csICcnIGlmIGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzXG4gICAgICBAaWdub3JlRXJyb3JzQW5kV2FybmluZ3MgPSBpZ25vcmVFcnJvcnNBbmRXYXJuaW5nc1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuc2tpcEZpbGVzJyxcbiAgICAoc2tpcEZpbGVzKSA9PlxuICAgICAgQHNraXBGaWxlcyA9IHNraXBGaWxlc1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlTWNDYWJlJyxcbiAgICAodXNlTWNDYWJlKSA9PlxuICAgICAgQHVzZU1jQ2FiZSA9IHVzZU1jQ2FiZVxuICAgICAgaWYgQHVzZU1jQ2FiZVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xpbnRlci1weWxhbWEudXNlUmFkb24nLCBmYWxzZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUGVwOCcsXG4gICAgKHVzZVBFUDgpID0+XG4gICAgICBAdXNlUEVQOCA9IHVzZVBFUDhcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVBlcDI1NycsXG4gICAgKHVzZVBFUDI1NykgPT5cbiAgICAgIEB1c2VQRVAyNTcgPSB1c2VQRVAyNTdcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVB5Zmxha2VzJyxcbiAgICAodXNlUHlGbGFrZXMpID0+XG4gICAgICBAdXNlUHlGbGFrZXMgPSB1c2VQeUZsYWtlc1xuICAgICAgaWYgQHVzZVB5Zmxha2VzXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbGludGVyLXB5bGFtYS51c2VSYWRvbicsIGZhbHNlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VQeWxpbnQnLFxuICAgICh1c2VQeUxpbnQpID0+XG4gICAgICBAdXNlUHlMaW50ID0gdXNlUHlMaW50XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VSYWRvbicsXG4gICAgKHVzZVJhZG9uKSA9PlxuICAgICAgQHVzZVJhZG9uID0gdXNlUmFkb25cbiAgICAgIGlmIEB1c2VSYWRvblxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xpbnRlci1weWxhbWEudXNlTWNDYWJlJywgZmFsc2VcbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdsaW50ZXItcHlsYW1hLnVzZVB5Zmxha2VzJywgZmFsc2VcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZUlzb3J0JyxcbiAgICAodXNlSXNvcnQpID0+XG4gICAgICBAdXNlSXNvcnQgPSB1c2VJc29ydFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEubGludE9uRmx5JyxcbiAgICAobGludE9uRmx5KSA9PlxuICAgICAgQGxpbnRPbkZseSA9IGxpbnRPbkZseVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuY29uZmlnRmlsZUxvYWQnLFxuICAgIChjb25maWdGaWxlTG9hZCkgPT5cbiAgICAgIEBjb25maWdGaWxlTG9hZCA9IGNvbmZpZ0ZpbGVMb2FkXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5jb25maWdGaWxlTmFtZScsXG4gICAgKGNvbmZpZ0ZpbGVOYW1lKSA9PlxuICAgICAgQGNvbmZpZ0ZpbGVOYW1lID0gY29uZmlnRmlsZU5hbWVcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmlzb3J0T25TYXZlJyxcbiAgICAoaXNvcnRPblNhdmUpID0+XG4gICAgICBpZiBpc29ydE9uU2F2ZVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgICAgICBAaXNvcnRPblNhdmUgPSBlZGl0b3Iub25EaWRTYXZlID0+XG4gICAgICAgICAgICBpZiBlZGl0b3IuZ2V0R3JhbW1hcj8oKS5zY29wZU5hbWUgaXMgJ3NvdXJjZS5weXRob24nXG4gICAgICAgICAgICAgIGhlbHBlcnMuZXhlYyBAaW50ZXJwcmV0ZXIsIFtAaXNvcnRQYXRoLCBkbyBlZGl0b3IuZ2V0UGF0aF1cbiAgICAgIGVsc2VcbiAgICAgICAgZG8gQGlzb3J0T25TYXZlPy5kaXNwb3NlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2xpbnRlci1weWxhbWE6aXNvcnQnLCA9PlxuICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICBoZWxwZXJzLmV4ZWMgQGludGVycHJldGVyLCBbQGlzb3J0UGF0aCwgZG8gZWRpdG9yLmdldFBhdGhdXG5cblxuICBkZXN0cm95OiAtPlxuICAgIGRvIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlXG4gICAgZG8gQGlzb3J0T25TYXZlPy5kaXNwb3NlXG5cblxuICBpc0xpbnRPbkZseTogLT5cbiAgICByZXR1cm4gQGxpbnRPbkZseVxuXG5cbiAgaW5pdEVudjogKGZpbGVQYXRoLCBwcm9qZWN0UGF0aCkgLT5cbiAgICBweXRob25QYXRoID0gW11cblxuICAgIHB5dGhvblBhdGgucHVzaCBmaWxlUGF0aCBpZiBmaWxlUGF0aFxuICAgIHB5dGhvblBhdGgucHVzaCBwcm9qZWN0UGF0aCBpZiBwcm9qZWN0UGF0aCBhbmQgcHJvamVjdFBhdGggbm90IGluIHB5dGhvblBhdGhcblxuICAgIGVudiA9IE9iamVjdC5jcmVhdGUgcHJvY2Vzcy5lbnZcbiAgICBpZiBlbnYuUFdEXG4gICAgICBwcm9jZXNzUGF0aCA9IHBhdGgubm9ybWFsaXplIGVudi5QV0RcbiAgICAgIHB5dGhvblBhdGgucHVzaCBwcm9jZXNzUGF0aCBpZiBwcm9jZXNzUGF0aCBhbmQgcHJvY2Vzc1BhdGggbm90IGluIHB5dGhvblBhdGhcblxuICAgIGVudi5QWUxBTUEgPSBweXRob25QYXRoLmpvaW4gcGF0aC5kZWxpbWl0ZXJcbiAgICBlbnZcblxuXG4gIGluaXRQeWxhbWE6ID0+XG4gICAgaWYgQHB5bGFtYVZlcnNpb24gaXMgJ2V4dGVybmFsJyBhbmQgQGV4ZWN1dGFibGVQYXRoIGlzbnQgQHB5bGFtYVBhdGhcbiAgICAgIEBweWxhbWFQYXRoID0gJydcbiAgICAgIGlmIC9eKHB5bGFtYXxweWxhbWFcXC5leGUpJC8udGVzdCBAZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgcHJvY2Vzc1BhdGggPSBwcm9jZXNzLmVudi5QQVRIIG9yIHByb2Nlc3MuZW52LlBhdGhcbiAgICAgICAgZm9yIGRpciBpbiBwcm9jZXNzUGF0aC5zcGxpdCBwYXRoLmRlbGltaXRlclxuICAgICAgICAgIHRtcCA9IHBhdGguam9pbiBkaXIsIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgQHB5bGFtYVBhdGggPSB0bXAgaWYgZG8gc3RhdFN5bmModG1wKS5pc0ZpbGVcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2F0Y2ggZVxuICAgICAgZWxzZVxuICAgICAgICBpZiBAZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgICBob21lZGlyID0gb3MuaG9tZWRpcigpXG4gICAgICAgICAgaWYgaG9tZWRpclxuICAgICAgICAgICAgQGV4ZWN1dGFibGVQYXRoID0gQGV4ZWN1dGFibGVQYXRoLnJlcGxhY2UgL15+KCR8XFwvfFxcXFwpLywgXCIje2hvbWVkaXJ9JDFcIlxuICAgICAgICAgIHRtcCA9IGlmIG5vdCBwYXRoLmlzQWJzb2x1dGUgQGV4ZWN1dGFibGVQYXRoIHRoZW4gcGF0aC5yZXNvbHZlIEBleGVjdXRhYmxlUGF0aCBlbHNlIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgQHB5bGFtYVBhdGggPSB0bXAgaWYgZG8gc3RhdFN5bmModG1wKS5pc0ZpbGVcbiAgICAgICAgICBjYXRjaCBlXG5cbiAgICAgIGlmIG5vdCBAcHlsYW1hUGF0aFxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ1B5bGFtYSBleGVjdXRhYmxlIG5vdCBmb3VuZCcsXG4gICAgICAgIGRldGFpbDogXCJbbGludGVyLXB5bGFtYV0gYCN7QGV4ZWN1dGFibGVQYXRofWAgZXhlY3V0YWJsZSBmaWxlIG5vdCBmb3VuZC5cbiAgICAgICAgXFxuUGxlYXNlIHNldCB0aGUgY29ycmVjdCBwYXRoIHRvIGBweWxhbWFgLlwiXG4gICAgZWxzZVxuICAgICAgQHB5bGFtYVBhdGggPSBwYXRoLmpvaW4gcGF0aC5kaXJuYW1lKF9fZGlybmFtZSksICdiaW4nLCAncHlsYW1hLnB5JyxcblxuXG4gIGluaXRBcmdzOiAoY3VyRGlyKSA9PlxuICAgIGFyZ3MgPSBbJy1GJ11cblxuICAgIGlmIEBjb25maWdGaWxlTG9hZFswXSBpcyAnVScgIyAnVXNlIHB5bGFtYSBjb25maWcnXG4gICAgICBjb25maWdGaWxlUGF0aCA9IGhlbHBlcnMuZmluZENhY2hlZCBjdXJEaXIsIEBjb25maWdGaWxlTmFtZVxuXG4gICAgaWYgY29uZmlnRmlsZVBhdGggdGhlbiBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLW9wdGlvbnMnLCBjb25maWdGaWxlUGF0aF1cbiAgICBlbHNlXG4gICAgICBpZiBAaWdub3JlRXJyb3JzQW5kV2FybmluZ3MgdGhlbiBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLWlnbm9yZScsIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5nc11cbiAgICAgIGlmIEBza2lwRmlsZXMgdGhlbiBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLXNraXAnLCBAc2tpcEZpbGVzXVxuXG4gICAgICB1c2VQeUxpbnQgPSBpZiBAdXNlUHlMaW50IHRoZW4gJ3B5bGludCcgZWxzZSAnJ1xuICAgICAgdXNlTWNDYWJlID0gaWYgQHVzZU1jQ2FiZSB0aGVuICdtY2NhYmUnIGVsc2UgJydcbiAgICAgIHVzZVBFUDggPSBpZiBAdXNlUEVQOCB0aGVuICdwZXA4JyBlbHNlICcnXG4gICAgICB1c2VQRVAyNTcgPSBpZiBAdXNlUEVQMjU3IHRoZW4gJ3BlcDI1NycgZWxzZSAnJ1xuICAgICAgdXNlUHlGbGFrZXMgPSBpZiBAdXNlUHlGbGFrZXMgdGhlbiAncHlmbGFrZXMnIGVsc2UgJydcbiAgICAgIHVzZVJhZG9uID0gaWYgQHVzZVJhZG9uIHRoZW4gJ3JhZG9uJyBlbHNlICcnXG4gICAgICB1c2VJc29ydCA9IGlmIEB1c2VJc29ydCB0aGVuICdpc29ydCcgZWxzZSAnJ1xuXG4gICAgICBsaW50ZXJzID0gW3VzZVBFUDgsIHVzZVBFUDI1NywgdXNlUHlMaW50LCB1c2VQeUZsYWtlcywgdXNlTWNDYWJlLCB1c2VSYWRvbiwgdXNlSXNvcnRdLmZpbHRlciAoZSkgLT4gZSBpc250ICcnXG4gICAgICBhcmdzLnB1c2ggJy0tbGludGVycydcbiAgICAgIGlmIGxpbnRlcnMubGVuZ3RoIHRoZW4gYXJncy5wdXNoIGRvIGxpbnRlcnMuam9pbiBlbHNlIGFyZ3MucHVzaCAnbm9uZSdcblxuICAgIGFyZ3NcblxuXG4gIG1ha2VMaW50SW5mbzogKGZpbGVOYW1lLCBvcmlnaW5GaWxlTmFtZSkgPT5cbiAgICBvcmlnaW5GaWxlTmFtZSA9IGZpbGVOYW1lIGlmIG5vdCBvcmlnaW5GaWxlTmFtZVxuICAgIGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUgcGF0aC5kaXJuYW1lKG9yaWdpbkZpbGVOYW1lKVxuICAgIHByb2plY3RQYXRoID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKG9yaWdpbkZpbGVOYW1lKVswXVxuICAgIGN3ZCA9IGlmIGZpbGVOYW1lICE9IG9yaWdpbkZpbGVOYW1lIHRoZW4gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKSBlbHNlIHByb2plY3RQYXRoXG4gICAgZW52ID0gQGluaXRFbnYgZmlsZVBhdGgsIHByb2plY3RQYXRoXG4gICAgYXJncyA9IEBpbml0QXJncyBmaWxlUGF0aFxuICAgIGFyZ3MucHVzaCBmaWxlTmFtZVxuICAgIGNvbnNvbGUubG9nIFwiI3tAcHlsYW1hUGF0aH0gI3thcmdzfVwiIGlmIGRvIGF0b20uaW5EZXZNb2RlXG4gICAgaWYgQHB5bGFtYVZlcnNpb24gaXMgJ2V4dGVybmFsJ1xuICAgICAgY29tbWFuZCA9IEBweWxhbWFQYXRoXG4gICAgZWxzZVxuICAgICAgY29tbWFuZCA9IEBpbnRlcnByZXRlclxuICAgICAgYXJncy51bnNoaWZ0IEBweWxhbWFQYXRoXG4gICAgaW5mbyA9XG4gICAgICBmaWxlTmFtZTogb3JpZ2luRmlsZU5hbWVcbiAgICAgIGNvbW1hbmQ6IGNvbW1hbmRcbiAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgIG9wdGlvbnM6XG4gICAgICAgIGVudjogZW52XG4gICAgICAgIGN3ZDogY3dkXG4gICAgICAgIHN0cmVhbTogJ2JvdGgnXG5cblxuICBsaW50RmlsZTogKGxpbnRJbmZvLCB0ZXh0RWRpdG9yKSAtPlxuICAgIGhlbHBlcnMuZXhlYyhsaW50SW5mby5jb21tYW5kLCBsaW50SW5mby5hcmdzLCBsaW50SW5mby5vcHRpb25zKS50aGVuIChvdXRwdXQpID0+XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBvdXRwdXRbJ3N0ZGVyciddIGlmIG91dHB1dFsnc3RkZXJyJ11cbiAgICAgIGNvbnNvbGUubG9nIG91dHB1dFsnc3Rkb3V0J10gaWYgZG8gYXRvbS5pbkRldk1vZGVcbiAgICAgIGhlbHBlcnMucGFyc2Uob3V0cHV0WydzdGRvdXQnXSwgcmVnZXgpLm1hcCAobWVzc2FnZSkgLT5cbiAgICAgICAgbWVzc2FnZS50eXBlID0gJycgaWYgbm90IG1lc3NhZ2UudHlwZVxuICAgICAgICBtZXNzYWdlLmZpbGVQYXRoID0gJycgaWYgbm90IG1lc3NhZ2UuZmlsZVBhdGhcbiAgICAgICAgY29kZSA9IFwiI3ttZXNzYWdlLnR5cGV9I3ttZXNzYWdlLmZpbGVQYXRofVwiXG4gICAgICAgIG1lc3NhZ2UudHlwZSA9IGlmIG1lc3NhZ2UudHlwZSBpbiBbJ0UnLCAnRiddIHRoZW4gJ0Vycm9yJyBlbHNlICdXYXJuaW5nJ1xuICAgICAgICBtZXNzYWdlLmZpbGVQYXRoID0gbGludEluZm8uZmlsZU5hbWVcbiAgICAgICAgbWVzc2FnZS50ZXh0ID0gaWYgY29kZSB0aGVuIFwiI3tjb2RlfSAje21lc3NhZ2UudGV4dH1cIiBlbHNlIFwiI3ttZXNzYWdlLnRleHR9XCJcbiAgICAgICAgbGluZSA9IG1lc3NhZ2UucmFuZ2VbMF1bMF1cbiAgICAgICAgY29sID0gbWVzc2FnZS5yYW5nZVswXVsxXVxuICAgICAgICBlZGl0b3JMaW5lID0gdGV4dEVkaXRvci5idWZmZXIubGluZXNbbGluZV1cbiAgICAgICAgaWYgbm90IGVkaXRvckxpbmUgb3Igbm90IGVkaXRvckxpbmUubGVuZ3RoXG4gICAgICAgICAgY29sRW5kID0gMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29sRW5kID0gZWRpdG9yTGluZS5pbmRleE9mKCcgJywgY29sKzEpXG4gICAgICAgICAgaWYgY29sRW5kID09IC0xXG4gICAgICAgICAgICBjb2xFbmQgPSBlZGl0b3JMaW5lLmxlbmd0aFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbEVuZCA9IDMgaWYgY29sRW5kIC0gY29sIDwgM1xuICAgICAgICAgICAgY29sRW5kID0gaWYgY29sRW5kIDwgZWRpdG9yTGluZS5sZW5ndGggdGhlbiBjb2xFbmQgZWxzZSBlZGl0b3JMaW5lLmxlbmd0aFxuICAgICAgICBtZXNzYWdlLnJhbmdlID0gW1xuICAgICAgICAgIFtsaW5lLCBjb2xdXG4gICAgICAgICAgW2xpbmUsIGNvbEVuZF1cbiAgICAgICAgXVxuICAgICAgICBtZXNzYWdlXG5cblxuICBsaW50RmlsZU9uRmx5OiAodGV4dEVkaXRvcikgPT5cbiAgICBmaWxlUGF0aCA9IGRvIHRleHRFZGl0b3IuZ2V0UGF0aFxuICAgIGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZSBkbyB0ZXh0RWRpdG9yLmdldFBhdGhcbiAgICBoZWxwZXJzLnRlbXBGaWxlIGZpbGVOYW1lLCBkbyB0ZXh0RWRpdG9yLmdldFRleHQsICh0bXBGaWxlUGF0aCkgPT5cbiAgICAgIHRtcEZpbGVQYXRoID0gcmVhbHBhdGhTeW5jIHRtcEZpbGVQYXRoXG4gICAgICBsaW50SW5mbyA9IEBtYWtlTGludEluZm8gdG1wRmlsZVBhdGgsIGZpbGVQYXRoXG4gICAgICBAbGludEZpbGUgbGludEluZm8sIHRleHRFZGl0b3JcblxuXG4gIGxpbnRPblNhdmU6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGZpbGVQYXRoID0gZG8gdGV4dEVkaXRvci5nZXRQYXRoXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG4gICAgICBpZiBmaWxlUGF0aC5zbGljZSgwLCAyKSA9PSAnXFxcXFxcXFwnXG4gICAgICAgIHJldHVybiBAbGludEZpbGVPbkZseSB0ZXh0RWRpdG9yXG4gICAgbGludEluZm8gPSBAbWFrZUxpbnRJbmZvIGZpbGVQYXRoXG4gICAgQGxpbnRGaWxlIGxpbnRJbmZvLCB0ZXh0RWRpdG9yXG5cblxuICBsaW50OiAodGV4dEVkaXRvcikgPT5cbiAgICByZXR1cm4gW10gaWYgbm90IEBweWxhbWFQYXRoXG4gICAgcmV0dXJuIEBsaW50RmlsZU9uRmx5IHRleHRFZGl0b3IgaWYgQGxpbnRPbkZseVxuICAgIEBsaW50T25TYXZlIHRleHRFZGl0b3JcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbnRlclB5bGFtYVxuIl19
