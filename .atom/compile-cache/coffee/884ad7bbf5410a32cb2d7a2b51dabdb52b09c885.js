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
      var args, command, env, filePath, info, projectPath, tmpFilePath;
      if (!originFileName) {
        originFileName = fileName;
      }
      filePath = path.normalize(path.dirname(originFileName));
      tmpFilePath = fileName !== originFileName ? path.dirname(fileName) : filePath;
      projectPath = atom.project.relativizePath(originFileName)[0];
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
          cwd: tmpFilePath,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvbGludGVyLXB5bGFtYS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdGQUFBO0lBQUE7OztFQUFBLE1BQTJCLE9BQUEsQ0FBUSxJQUFSLENBQTNCLEVBQUMsdUJBQUQsRUFBVzs7RUFDWCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVOLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsT0FBQSxHQUFVLE9BQUEsQ0FBUSxhQUFSOztFQUVWLEtBQUEsR0FDRSxlQUFBLEdBQ0EsZ0JBREEsR0FFQSxlQUZBLEdBR0EsTUFIQSxHQUlBLHdEQUpBLEdBS0E7O0VBR0k7SUFDUyxzQkFBQTs7Ozs7OztNQUNYLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsQ0FBVixFQUFtQyxLQUFuQyxFQUEwQyxVQUExQztNQUViLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQiw2QkFBcEIsRUFDbkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLGFBQUQ7VUFDRSxJQUFHLEtBQUMsQ0FBQSxhQUFKO1lBQ0UsS0FBQyxDQUFBLGFBQUQsR0FBaUI7bUJBQ2QsS0FBQyxDQUFBLFVBQUosQ0FBQSxFQUZGO1dBQUEsTUFBQTttQkFJRSxLQUFDLENBQUEsYUFBRCxHQUFpQixjQUpuQjs7UUFERjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEbUIsQ0FBbkI7TUFRQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFB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QUFBLFFBQUQsQ0FBVSxRQUFWLEVBQW9CLFVBQXBCO0lBTlU7OzJCQVNaLElBQUEsR0FBTSxTQUFDLFVBQUQ7TUFDSixJQUFhLENBQUksSUFBQyxDQUFBLFVBQWxCO0FBQUEsZUFBTyxHQUFQOztNQUNBLElBQW9DLElBQUMsQ0FBQSxTQUFyQztBQUFBLGVBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxVQUFmLEVBQVA7O2FBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxVQUFaO0lBSEk7Ozs7OztFQU1SLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBOVFqQiIsInNvdXJjZXNDb250ZW50IjpbIntzdGF0U3luYywgcmVhbHBhdGhTeW5jfSA9IHJlcXVpcmUgXCJmc1wiXG5vcyA9IHJlcXVpcmUgJ29zJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5oZWxwZXJzID0gcmVxdWlyZSAnYXRvbS1saW50ZXInXG5cbnJlZ2V4ID1cbiAgJyg/PGZpbGVfPi4rKTonICtcbiAgJyg/PGxpbmU+XFxcXGQrKTonICtcbiAgJyg/PGNvbD5cXFxcZCspOicgK1xuICAnXFxcXHMrJyArXG4gICcoKCg/PHR5cGU+W0VDREZJTlJXXSkoPzxmaWxlPlxcXFxkKykoOlxcXFxzK3xcXFxccyspKXwoLio/KSknICtcbiAgJyg/PG1lc3NhZ2U+LispJ1xuXG5cbmNsYXNzIExpbnRlclB5bGFtYVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAaXNvcnRQYXRoID0gcGF0aC5qb2luIHBhdGguZGlybmFtZShfX2Rpcm5hbWUpLCAnYmluJywgJ2lzb3J0LnB5J1xuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnB5bGFtYVZlcnNpb24nLFxuICAgIChweWxhbWFWZXJzaW9uKSA9PlxuICAgICAgaWYgQHB5bGFtYVZlcnNpb25cbiAgICAgICAgQHB5bGFtYVZlcnNpb24gPSBweWxhbWFWZXJzaW9uXG4gICAgICAgIGRvIEBpbml0UHlsYW1hXG4gICAgICBlbHNlXG4gICAgICAgIEBweWxhbWFWZXJzaW9uID0gcHlsYW1hVmVyc2lvblxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuZXhlY3V0YWJsZVBhdGgnLFxuICAgIChleGVjdXRhYmxlUGF0aCkgPT5cbiAgICAgIGlmIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICBAZXhlY3V0YWJsZVBhdGggPSBleGVjdXRhYmxlUGF0aFxuICAgICAgICBkbyBAaW5pdFB5bGFtYVxuICAgICAgZWxzZVxuICAgICAgICBAZXhlY3V0YWJsZVBhdGggPSBleGVjdXRhYmxlUGF0aFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuaW50ZXJwcmV0ZXInLFxuICAgIChpbnRlcnByZXRlcikgPT5cbiAgICAgIEBpbnRlcnByZXRlciA9IGludGVycHJldGVyXG4gICAgICBkbyBAaW5pdFB5bGFtYVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuaWdub3JlRXJyb3JzQW5kV2FybmluZ3MnLFxuICAgIChpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncykgPT5cbiAgICAgIGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzID0gaWdub3JlRXJyb3JzQW5kV2FybmluZ3MucmVwbGFjZSAvXFxzKy9nLCAnJyBpZiBpZ25vcmVFcnJvcnNBbmRXYXJuaW5nc1xuICAgICAgQGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzID0gaWdub3JlRXJyb3JzQW5kV2FybmluZ3NcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnNraXBGaWxlcycsXG4gICAgKHNraXBGaWxlcykgPT5cbiAgICAgIEBza2lwRmlsZXMgPSBza2lwRmlsZXNcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZU1jQ2FiZScsXG4gICAgKHVzZU1jQ2FiZSkgPT5cbiAgICAgIEB1c2VNY0NhYmUgPSB1c2VNY0NhYmVcbiAgICAgIGlmIEB1c2VNY0NhYmVcbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdsaW50ZXItcHlsYW1hLnVzZVJhZG9uJywgZmFsc2VcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVBlcDgnLFxuICAgICh1c2VQRVA4KSA9PlxuICAgICAgQHVzZVBFUDggPSB1c2VQRVA4XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VQZXAyNTcnLFxuICAgICh1c2VQRVAyNTcpID0+XG4gICAgICBAdXNlUEVQMjU3ID0gdXNlUEVQMjU3XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VQeWZsYWtlcycsXG4gICAgKHVzZVB5Rmxha2VzKSA9PlxuICAgICAgQHVzZVB5Rmxha2VzID0gdXNlUHlGbGFrZXNcbiAgICAgIGlmIEB1c2VQeWZsYWtlc1xuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xpbnRlci1weWxhbWEudXNlUmFkb24nLCBmYWxzZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUHlsaW50JyxcbiAgICAodXNlUHlMaW50KSA9PlxuICAgICAgQHVzZVB5TGludCA9IHVzZVB5TGludFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUmFkb24nLFxuICAgICh1c2VSYWRvbikgPT5cbiAgICAgIEB1c2VSYWRvbiA9IHVzZVJhZG9uXG4gICAgICBpZiBAdXNlUmFkb25cbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdsaW50ZXItcHlsYW1hLnVzZU1jQ2FiZScsIGZhbHNlXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbGludGVyLXB5bGFtYS51c2VQeWZsYWtlcycsIGZhbHNlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VJc29ydCcsXG4gICAgKHVzZUlzb3J0KSA9PlxuICAgICAgQHVzZUlzb3J0ID0gdXNlSXNvcnRcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmxpbnRPbkZseScsXG4gICAgKGxpbnRPbkZseSkgPT5cbiAgICAgIEBsaW50T25GbHkgPSBsaW50T25GbHlcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmNvbmZpZ0ZpbGVMb2FkJyxcbiAgICAoY29uZmlnRmlsZUxvYWQpID0+XG4gICAgICBAY29uZmlnRmlsZUxvYWQgPSBjb25maWdGaWxlTG9hZFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuY29uZmlnRmlsZU5hbWUnLFxuICAgIChjb25maWdGaWxlTmFtZSkgPT5cbiAgICAgIEBjb25maWdGaWxlTmFtZSA9IGNvbmZpZ0ZpbGVOYW1lXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5pc29ydE9uU2F2ZScsXG4gICAgKGlzb3J0T25TYXZlKSA9PlxuICAgICAgaWYgaXNvcnRPblNhdmVcbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG4gICAgICAgICAgQGlzb3J0T25TYXZlID0gZWRpdG9yLm9uRGlkU2F2ZSA9PlxuICAgICAgICAgICAgaWYgZWRpdG9yLmdldEdyYW1tYXI/KCkuc2NvcGVOYW1lIGlzICdzb3VyY2UucHl0aG9uJ1xuICAgICAgICAgICAgICBoZWxwZXJzLmV4ZWMgQGludGVycHJldGVyLCBbQGlzb3J0UGF0aCwgZG8gZWRpdG9yLmdldFBhdGhdXG4gICAgICBlbHNlXG4gICAgICAgIGRvIEBpc29ydE9uU2F2ZT8uZGlzcG9zZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdsaW50ZXItcHlsYW1hOmlzb3J0JywgPT5cbiAgICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgaGVscGVycy5leGVjIEBpbnRlcnByZXRlciwgW0Bpc29ydFBhdGgsIGRvIGVkaXRvci5nZXRQYXRoXVxuXG5cbiAgZGVzdHJveTogLT5cbiAgICBkbyBAc3Vic2NyaXB0aW9ucz8uZGlzcG9zZVxuICAgIGRvIEBpc29ydE9uU2F2ZT8uZGlzcG9zZVxuXG5cbiAgaXNMaW50T25GbHk6IC0+XG4gICAgcmV0dXJuIEBsaW50T25GbHlcblxuXG4gIGluaXRFbnY6IChmaWxlUGF0aCwgcHJvamVjdFBhdGgpIC0+XG4gICAgcHl0aG9uUGF0aCA9IFtdXG5cbiAgICBweXRob25QYXRoLnB1c2ggZmlsZVBhdGggaWYgZmlsZVBhdGhcbiAgICBweXRob25QYXRoLnB1c2ggcHJvamVjdFBhdGggaWYgcHJvamVjdFBhdGggYW5kIHByb2plY3RQYXRoIG5vdCBpbiBweXRob25QYXRoXG5cbiAgICBlbnYgPSBPYmplY3QuY3JlYXRlIHByb2Nlc3MuZW52XG4gICAgaWYgZW52LlBXRFxuICAgICAgcHJvY2Vzc1BhdGggPSBwYXRoLm5vcm1hbGl6ZSBlbnYuUFdEXG4gICAgICBweXRob25QYXRoLnB1c2ggcHJvY2Vzc1BhdGggaWYgcHJvY2Vzc1BhdGggYW5kIHByb2Nlc3NQYXRoIG5vdCBpbiBweXRob25QYXRoXG5cbiAgICBlbnYuUFlMQU1BID0gcHl0aG9uUGF0aC5qb2luIHBhdGguZGVsaW1pdGVyXG4gICAgZW52XG5cblxuICBpbml0UHlsYW1hOiA9PlxuICAgIGlmIEBweWxhbWFWZXJzaW9uIGlzICdleHRlcm5hbCcgYW5kIEBleGVjdXRhYmxlUGF0aCBpc250IEBweWxhbWFQYXRoXG4gICAgICBAcHlsYW1hUGF0aCA9ICcnXG4gICAgICBpZiAvXihweWxhbWF8cHlsYW1hXFwuZXhlKSQvLnRlc3QgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgIHByb2Nlc3NQYXRoID0gcHJvY2Vzcy5lbnYuUEFUSCBvciBwcm9jZXNzLmVudi5QYXRoXG4gICAgICAgIGZvciBkaXIgaW4gcHJvY2Vzc1BhdGguc3BsaXQgcGF0aC5kZWxpbWl0ZXJcbiAgICAgICAgICB0bXAgPSBwYXRoLmpvaW4gZGlyLCBAZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgIEBweWxhbWFQYXRoID0gdG1wIGlmIGRvIHN0YXRTeW5jKHRtcCkuaXNGaWxlXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhdGNoIGVcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgICAgaG9tZWRpciA9IG9zLmhvbWVkaXIoKTtcbiAgICAgICAgICBpZiBob21lZGlyXG4gICAgICAgICAgICBAZXhlY3V0YWJsZVBhdGggPSBAZXhlY3V0YWJsZVBhdGgucmVwbGFjZSAvXn4oJHxcXC98XFxcXCkvLCBcIiN7aG9tZWRpcn0kMVwiXG4gICAgICAgICAgdG1wID0gaWYgbm90IHBhdGguaXNBYnNvbHV0ZSBAZXhlY3V0YWJsZVBhdGggdGhlbiBwYXRoLnJlc29sdmUgQGV4ZWN1dGFibGVQYXRoIGVsc2UgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBAcHlsYW1hUGF0aCA9IHRtcCBpZiBkbyBzdGF0U3luYyh0bXApLmlzRmlsZVxuICAgICAgICAgIGNhdGNoIGVcblxuICAgICAgaWYgbm90IEBweWxhbWFQYXRoXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciAnUHlsYW1hIGV4ZWN1dGFibGUgbm90IGZvdW5kJyxcbiAgICAgICAgZGV0YWlsOiBcIltsaW50ZXItcHlsYW1hXSBgI3tAZXhlY3V0YWJsZVBhdGh9YCBleGVjdXRhYmxlIGZpbGUgbm90IGZvdW5kLlxuICAgICAgICBcXG5QbGVhc2Ugc2V0IHRoZSBjb3JyZWN0IHBhdGggdG8gYHB5bGFtYWAuXCJcbiAgICBlbHNlXG4gICAgICBAcHlsYW1hUGF0aCA9IHBhdGguam9pbiBwYXRoLmRpcm5hbWUoX19kaXJuYW1lKSwgJ2JpbicsICdweWxhbWEucHknLFxuXG5cbiAgaW5pdEFyZ3M6IChjdXJEaXIpID0+XG4gICAgYXJncyA9IFsnLUYnXVxuXG4gICAgaWYgQGNvbmZpZ0ZpbGVMb2FkWzBdIGlzICdVJyAjICdVc2UgcHlsYW1hIGNvbmZpZydcbiAgICAgIGNvbmZpZ0ZpbGVQYXRoID0gaGVscGVycy5maW5kQ2FjaGVkIGN1ckRpciwgQGNvbmZpZ0ZpbGVOYW1lXG5cbiAgICBpZiBjb25maWdGaWxlUGF0aCB0aGVuIGFyZ3MucHVzaC5hcHBseSBhcmdzLCBbJy0tb3B0aW9ucycsIGNvbmZpZ0ZpbGVQYXRoXVxuICAgIGVsc2VcbiAgICAgIGlmIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyB0aGVuIGFyZ3MucHVzaC5hcHBseSBhcmdzLCBbJy0taWdub3JlJywgQGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzXVxuICAgICAgaWYgQHNraXBGaWxlcyB0aGVuIGFyZ3MucHVzaC5hcHBseSBhcmdzLCBbJy0tc2tpcCcsIEBza2lwRmlsZXNdXG5cbiAgICAgIHVzZVB5TGludCA9IGlmIEB1c2VQeUxpbnQgdGhlbiAncHlsaW50JyBlbHNlICcnXG4gICAgICB1c2VNY0NhYmUgPSBpZiBAdXNlTWNDYWJlIHRoZW4gJ21jY2FiZScgZWxzZSAnJ1xuICAgICAgdXNlUEVQOCA9IGlmIEB1c2VQRVA4IHRoZW4gJ3BlcDgnIGVsc2UgJydcbiAgICAgIHVzZVBFUDI1NyA9IGlmIEB1c2VQRVAyNTcgdGhlbiAncGVwMjU3JyBlbHNlICcnXG4gICAgICB1c2VQeUZsYWtlcyA9IGlmIEB1c2VQeUZsYWtlcyB0aGVuICdweWZsYWtlcycgZWxzZSAnJ1xuICAgICAgdXNlUmFkb24gPSBpZiBAdXNlUmFkb24gdGhlbiAncmFkb24nIGVsc2UgJydcbiAgICAgIHVzZUlzb3J0ID0gaWYgQHVzZUlzb3J0IHRoZW4gJ2lzb3J0JyBlbHNlICcnXG5cbiAgICAgIGxpbnRlcnMgPSBbdXNlUEVQOCwgdXNlUEVQMjU3LCB1c2VQeUxpbnQsIHVzZVB5Rmxha2VzLCB1c2VNY0NhYmUsIHVzZVJhZG9uLCB1c2VJc29ydF0uZmlsdGVyIChlKSAtPiBlIGlzbnQgJydcbiAgICAgIGFyZ3MucHVzaCAnLS1saW50ZXJzJ1xuICAgICAgaWYgbGludGVycy5sZW5ndGggdGhlbiBhcmdzLnB1c2ggZG8gbGludGVycy5qb2luIGVsc2UgYXJncy5wdXNoICdub25lJ1xuXG4gICAgYXJnc1xuXG5cbiAgbWFrZUxpbnRJbmZvOiAoZmlsZU5hbWUsIG9yaWdpbkZpbGVOYW1lKSA9PlxuICAgIG9yaWdpbkZpbGVOYW1lID0gZmlsZU5hbWUgaWYgbm90IG9yaWdpbkZpbGVOYW1lXG4gICAgZmlsZVBhdGggPSBwYXRoLm5vcm1hbGl6ZSBwYXRoLmRpcm5hbWUob3JpZ2luRmlsZU5hbWUpXG4gICAgdG1wRmlsZVBhdGggPSAgaWYgZmlsZU5hbWUgIT0gb3JpZ2luRmlsZU5hbWUgdGhlbiBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpIGVsc2UgZmlsZVBhdGhcbiAgICBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChvcmlnaW5GaWxlTmFtZSlbMF1cbiAgICBlbnYgPSBAaW5pdEVudiBmaWxlUGF0aCwgcHJvamVjdFBhdGhcbiAgICBhcmdzID0gQGluaXRBcmdzIGZpbGVQYXRoXG4gICAgYXJncy5wdXNoIGZpbGVOYW1lXG4gICAgY29uc29sZS5sb2cgXCIje0BweWxhbWFQYXRofSAje2FyZ3N9XCIgaWYgZG8gYXRvbS5pbkRldk1vZGVcbiAgICBpZiBAcHlsYW1hVmVyc2lvbiBpcyAnZXh0ZXJuYWwnXG4gICAgICBjb21tYW5kID0gQHB5bGFtYVBhdGhcbiAgICBlbHNlXG4gICAgICBjb21tYW5kID0gQGludGVycHJldGVyXG4gICAgICBhcmdzLnVuc2hpZnQgQHB5bGFtYVBhdGhcbiAgICBpbmZvID1cbiAgICAgIGZpbGVOYW1lOiBvcmlnaW5GaWxlTmFtZVxuICAgICAgY29tbWFuZDogY29tbWFuZFxuICAgICAgYXJnczogYXJnc1xuICAgICAgb3B0aW9uczpcbiAgICAgICAgZW52OiBlbnZcbiAgICAgICAgY3dkOiB0bXBGaWxlUGF0aFxuICAgICAgICBzdHJlYW06ICdib3RoJ1xuXG5cbiAgbGludEZpbGU6IChsaW50SW5mbywgdGV4dEVkaXRvcikgLT5cbiAgICBoZWxwZXJzLmV4ZWMobGludEluZm8uY29tbWFuZCwgbGludEluZm8uYXJncywgbGludEluZm8ub3B0aW9ucykudGhlbiAob3V0cHV0KSA9PlxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgb3V0cHV0WydzdGRlcnInXSBpZiBvdXRwdXRbJ3N0ZGVyciddXG4gICAgICBjb25zb2xlLmxvZyBvdXRwdXRbJ3N0ZG91dCddIGlmIGRvIGF0b20uaW5EZXZNb2RlXG4gICAgICBoZWxwZXJzLnBhcnNlKG91dHB1dFsnc3Rkb3V0J10sIHJlZ2V4KS5tYXAgKG1lc3NhZ2UpIC0+XG4gICAgICAgIG1lc3NhZ2UudHlwZSA9ICcnIGlmIG5vdCBtZXNzYWdlLnR5cGVcbiAgICAgICAgbWVzc2FnZS5maWxlUGF0aCA9ICcnIGlmIG5vdCBtZXNzYWdlLmZpbGVQYXRoXG4gICAgICAgIGNvZGUgPSBcIiN7bWVzc2FnZS50eXBlfSN7bWVzc2FnZS5maWxlUGF0aH1cIlxuICAgICAgICBtZXNzYWdlLnR5cGUgPSBpZiBtZXNzYWdlLnR5cGUgaW4gWydFJywgJ0YnXSB0aGVuICdFcnJvcicgZWxzZSAnV2FybmluZydcbiAgICAgICAgbWVzc2FnZS5maWxlUGF0aCA9IGxpbnRJbmZvLmZpbGVOYW1lXG4gICAgICAgIG1lc3NhZ2UudGV4dCA9IGlmIGNvZGUgdGhlbiBcIiN7Y29kZX0gI3ttZXNzYWdlLnRleHR9XCIgZWxzZSBcIiN7bWVzc2FnZS50ZXh0fVwiXG4gICAgICAgIGxpbmUgPSBtZXNzYWdlLnJhbmdlWzBdWzBdXG4gICAgICAgIGNvbCA9IG1lc3NhZ2UucmFuZ2VbMF1bMV1cbiAgICAgICAgZWRpdG9yTGluZSA9IHRleHRFZGl0b3IuYnVmZmVyLmxpbmVzW2xpbmVdXG4gICAgICAgIGlmIG5vdCBlZGl0b3JMaW5lIG9yIG5vdCBlZGl0b3JMaW5lLmxlbmd0aFxuICAgICAgICAgIGNvbEVuZCA9IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbEVuZCA9IGVkaXRvckxpbmUuaW5kZXhPZignICcsIGNvbCsxKVxuICAgICAgICAgIGlmIGNvbEVuZCA9PSAtMVxuICAgICAgICAgICAgY29sRW5kID0gZWRpdG9yTGluZS5sZW5ndGhcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2xFbmQgPSAzIGlmIGNvbEVuZCAtIGNvbCA8IDNcbiAgICAgICAgICAgIGNvbEVuZCA9IGlmIGNvbEVuZCA8IGVkaXRvckxpbmUubGVuZ3RoIHRoZW4gY29sRW5kIGVsc2UgZWRpdG9yTGluZS5sZW5ndGhcbiAgICAgICAgbWVzc2FnZS5yYW5nZSA9IFtcbiAgICAgICAgICBbbGluZSwgY29sXVxuICAgICAgICAgIFtsaW5lLCBjb2xFbmRdXG4gICAgICAgIF1cbiAgICAgICAgbWVzc2FnZVxuXG5cbiAgbGludEZpbGVPbkZseTogKHRleHRFZGl0b3IpID0+XG4gICAgZmlsZVBhdGggPSBkbyB0ZXh0RWRpdG9yLmdldFBhdGhcbiAgICBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUgZG8gdGV4dEVkaXRvci5nZXRQYXRoXG4gICAgaGVscGVycy50ZW1wRmlsZSBmaWxlTmFtZSwgZG8gdGV4dEVkaXRvci5nZXRUZXh0LCAodG1wRmlsZVBhdGgpID0+XG4gICAgICB0bXBGaWxlUGF0aCA9IHJlYWxwYXRoU3luYyB0bXBGaWxlUGF0aFxuICAgICAgbGludEluZm8gPSBAbWFrZUxpbnRJbmZvIHRtcEZpbGVQYXRoLCBmaWxlUGF0aFxuICAgICAgQGxpbnRGaWxlIGxpbnRJbmZvLCB0ZXh0RWRpdG9yXG5cblxuICBsaW50T25TYXZlOiAodGV4dEVkaXRvcikgPT5cbiAgICBmaWxlUGF0aCA9IGRvIHRleHRFZGl0b3IuZ2V0UGF0aFxuICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICAgICAgaWYgZmlsZVBhdGguc2xpY2UoMCwgMikgPT0gJ1xcXFxcXFxcJ1xuICAgICAgICByZXR1cm4gQGxpbnRGaWxlT25GbHkgdGV4dEVkaXRvclxuICAgIGxpbnRJbmZvID0gQG1ha2VMaW50SW5mbyBmaWxlUGF0aFxuICAgIEBsaW50RmlsZSBsaW50SW5mbywgdGV4dEVkaXRvclxuXG5cbiAgbGludDogKHRleHRFZGl0b3IpID0+XG4gICAgcmV0dXJuIFtdIGlmIG5vdCBAcHlsYW1hUGF0aFxuICAgIHJldHVybiBAbGludEZpbGVPbkZseSB0ZXh0RWRpdG9yIGlmIEBsaW50T25GbHlcbiAgICBAbGludE9uU2F2ZSB0ZXh0RWRpdG9yXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMaW50ZXJQeWxhbWFcbiJdfQ==
