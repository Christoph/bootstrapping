(function() {
  var CompositeDisposable, LinterPylama, helpers, path, realpathSync, ref, regex, statSync,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require("fs"), statSync = ref.statSync, realpathSync = ref.realpathSync;

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
      var dir, e, i, len, processPath, ref1, tmp;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvbGludGVyLXB5bGFtYS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG9GQUFBO0lBQUE7OztFQUFBLE1BQTJCLE9BQUEsQ0FBUSxJQUFSLENBQTNCLEVBQUMsdUJBQUQsRUFBVzs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRU4sc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixPQUFBLEdBQVUsT0FBQSxDQUFRLGFBQVI7O0VBRVYsS0FBQSxHQUNFLGVBQUEsR0FDQSxnQkFEQSxHQUVBLGVBRkEsR0FHQSxNQUhBLEdBSUEsd0RBSkEsR0FLQTs7RUFHSTtJQUNTLHNCQUFBOzs7Ozs7O01BQ1gsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixDQUFWLEVBQW1DLEtBQW5DLEVBQTBDLFVBQTFDO01BRWIsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLDZCQUFwQixFQUNuQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsYUFBRDtVQUNFLElBQUcsS0FBQyxDQUFBLGFBQUo7WUFDRSxLQUFDLENBQUEsYUFBRCxHQUFpQjttQkFDZCxLQUFDLENBQUEsVUFBSixDQUFBLEVBRkY7V0FBQSxNQUFBO21CQUlFLEtBQUMsQ0FBQSxhQUFELEdBQWlCLGNBSm5COztRQURGO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURtQixDQUFuQjtNQVFBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsOEJBQXBCLEVBQ25CLENBQUEsU0FBQSxL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RCxDQUFZLFVBQVo7SUFISTs7Ozs7O0VBTVIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUExUWpCIiwic291cmNlc0NvbnRlbnQiOlsie3N0YXRTeW5jLCByZWFscGF0aFN5bmN9ID0gcmVxdWlyZSBcImZzXCJcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuaGVscGVycyA9IHJlcXVpcmUgJ2F0b20tbGludGVyJ1xuXG5yZWdleCA9XG4gICcoPzxmaWxlXz4uKyk6JyArXG4gICcoPzxsaW5lPlxcXFxkKyk6JyArXG4gICcoPzxjb2w+XFxcXGQrKTonICtcbiAgJ1xcXFxzKycgK1xuICAnKCgoPzx0eXBlPltFQ0RGSU5SV10pKD88ZmlsZT5cXFxcZCspKDpcXFxccyt8XFxcXHMrKSl8KC4qPykpJyArXG4gICcoPzxtZXNzYWdlPi4rKSdcblxuXG5jbGFzcyBMaW50ZXJQeWxhbWFcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGlzb3J0UGF0aCA9IHBhdGguam9pbiBwYXRoLmRpcm5hbWUoX19kaXJuYW1lKSwgJ2JpbicsICdpc29ydC5weSdcblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5weWxhbWFWZXJzaW9uJyxcbiAgICAocHlsYW1hVmVyc2lvbikgPT5cbiAgICAgIGlmIEBweWxhbWFWZXJzaW9uXG4gICAgICAgIEBweWxhbWFWZXJzaW9uID0gcHlsYW1hVmVyc2lvblxuICAgICAgICBkbyBAaW5pdFB5bGFtYVxuICAgICAgZWxzZVxuICAgICAgICBAcHlsYW1hVmVyc2lvbiA9IHB5bGFtYVZlcnNpb25cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmV4ZWN1dGFibGVQYXRoJyxcbiAgICAoZXhlY3V0YWJsZVBhdGgpID0+XG4gICAgICBpZiBAZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgQGV4ZWN1dGFibGVQYXRoID0gZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgZG8gQGluaXRQeWxhbWFcbiAgICAgIGVsc2VcbiAgICAgICAgQGV4ZWN1dGFibGVQYXRoID0gZXhlY3V0YWJsZVBhdGhcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmludGVycHJldGVyJyxcbiAgICAoaW50ZXJwcmV0ZXIpID0+XG4gICAgICBAaW50ZXJwcmV0ZXIgPSBpbnRlcnByZXRlclxuICAgICAgZG8gQGluaXRQeWxhbWFcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmlnbm9yZUVycm9yc0FuZFdhcm5pbmdzJyxcbiAgICAoaWdub3JlRXJyb3JzQW5kV2FybmluZ3MpID0+XG4gICAgICBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyA9IGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzLnJlcGxhY2UgL1xccysvZywgJycgaWYgaWdub3JlRXJyb3JzQW5kV2FybmluZ3NcbiAgICAgIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyA9IGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5za2lwRmlsZXMnLFxuICAgIChza2lwRmlsZXMpID0+XG4gICAgICBAc2tpcEZpbGVzID0gc2tpcEZpbGVzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VNY0NhYmUnLFxuICAgICh1c2VNY0NhYmUpID0+XG4gICAgICBAdXNlTWNDYWJlID0gdXNlTWNDYWJlXG4gICAgICBpZiBAdXNlTWNDYWJlXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbGludGVyLXB5bGFtYS51c2VSYWRvbicsIGZhbHNlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VQZXA4JyxcbiAgICAodXNlUEVQOCkgPT5cbiAgICAgIEB1c2VQRVA4ID0gdXNlUEVQOFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUGVwMjU3JyxcbiAgICAodXNlUEVQMjU3KSA9PlxuICAgICAgQHVzZVBFUDI1NyA9IHVzZVBFUDI1N1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUHlmbGFrZXMnLFxuICAgICh1c2VQeUZsYWtlcykgPT5cbiAgICAgIEB1c2VQeUZsYWtlcyA9IHVzZVB5Rmxha2VzXG4gICAgICBpZiBAdXNlUHlmbGFrZXNcbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdsaW50ZXItcHlsYW1hLnVzZVJhZG9uJywgZmFsc2VcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVB5bGludCcsXG4gICAgKHVzZVB5TGludCkgPT5cbiAgICAgIEB1c2VQeUxpbnQgPSB1c2VQeUxpbnRcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVJhZG9uJyxcbiAgICAodXNlUmFkb24pID0+XG4gICAgICBAdXNlUmFkb24gPSB1c2VSYWRvblxuICAgICAgaWYgQHVzZVJhZG9uXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbGludGVyLXB5bGFtYS51c2VNY0NhYmUnLCBmYWxzZVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xpbnRlci1weWxhbWEudXNlUHlmbGFrZXMnLCBmYWxzZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlSXNvcnQnLFxuICAgICh1c2VJc29ydCkgPT5cbiAgICAgIEB1c2VJc29ydCA9IHVzZUlzb3J0XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5saW50T25GbHknLFxuICAgIChsaW50T25GbHkpID0+XG4gICAgICBAbGludE9uRmx5ID0gbGludE9uRmx5XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5jb25maWdGaWxlTG9hZCcsXG4gICAgKGNvbmZpZ0ZpbGVMb2FkKSA9PlxuICAgICAgQGNvbmZpZ0ZpbGVMb2FkID0gY29uZmlnRmlsZUxvYWRcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmNvbmZpZ0ZpbGVOYW1lJyxcbiAgICAoY29uZmlnRmlsZU5hbWUpID0+XG4gICAgICBAY29uZmlnRmlsZU5hbWUgPSBjb25maWdGaWxlTmFtZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuaXNvcnRPblNhdmUnLFxuICAgIChpc29ydE9uU2F2ZSkgPT5cbiAgICAgIGlmIGlzb3J0T25TYXZlXG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSA9PlxuICAgICAgICAgIEBpc29ydE9uU2F2ZSA9IGVkaXRvci5vbkRpZFNhdmUgPT5cbiAgICAgICAgICAgIGlmIGVkaXRvci5nZXRHcmFtbWFyPygpLnNjb3BlTmFtZSBpcyAnc291cmNlLnB5dGhvbidcbiAgICAgICAgICAgICAgaGVscGVycy5leGVjIEBpbnRlcnByZXRlciwgW0Bpc29ydFBhdGgsIGRvIGVkaXRvci5nZXRQYXRoXVxuICAgICAgZWxzZVxuICAgICAgICBkbyBAaXNvcnRPblNhdmU/LmRpc3Bvc2VcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnbGludGVyLXB5bGFtYTppc29ydCcsID0+XG4gICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIGhlbHBlcnMuZXhlYyBAaW50ZXJwcmV0ZXIsIFtAaXNvcnRQYXRoLCBkbyBlZGl0b3IuZ2V0UGF0aF1cblxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgZG8gQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2VcbiAgICBkbyBAaXNvcnRPblNhdmU/LmRpc3Bvc2VcblxuXG4gIGlzTGludE9uRmx5OiAtPlxuICAgIHJldHVybiBAbGludE9uRmx5XG5cblxuICBpbml0RW52OiAoZmlsZVBhdGgsIHByb2plY3RQYXRoKSAtPlxuICAgIHB5dGhvblBhdGggPSBbXVxuXG4gICAgcHl0aG9uUGF0aC5wdXNoIGZpbGVQYXRoIGlmIGZpbGVQYXRoXG4gICAgcHl0aG9uUGF0aC5wdXNoIHByb2plY3RQYXRoIGlmIHByb2plY3RQYXRoIGFuZCBwcm9qZWN0UGF0aCBub3QgaW4gcHl0aG9uUGF0aFxuXG4gICAgZW52ID0gT2JqZWN0LmNyZWF0ZSBwcm9jZXNzLmVudlxuICAgIGlmIGVudi5QV0RcbiAgICAgIHByb2Nlc3NQYXRoID0gcGF0aC5ub3JtYWxpemUgZW52LlBXRFxuICAgICAgcHl0aG9uUGF0aC5wdXNoIHByb2Nlc3NQYXRoIGlmIHByb2Nlc3NQYXRoIGFuZCBwcm9jZXNzUGF0aCBub3QgaW4gcHl0aG9uUGF0aFxuXG4gICAgZW52LlBZTEFNQSA9IHB5dGhvblBhdGguam9pbiBwYXRoLmRlbGltaXRlclxuICAgIGVudlxuXG5cbiAgaW5pdFB5bGFtYTogPT5cbiAgICBpZiBAcHlsYW1hVmVyc2lvbiBpcyAnZXh0ZXJuYWwnIGFuZCBAZXhlY3V0YWJsZVBhdGggaXNudCBAcHlsYW1hUGF0aFxuICAgICAgQHB5bGFtYVBhdGggPSAnJ1xuICAgICAgaWYgL14ocHlsYW1hfHB5bGFtYVxcLmV4ZSkkLy50ZXN0IEBleGVjdXRhYmxlUGF0aFxuICAgICAgICBwcm9jZXNzUGF0aCA9IHByb2Nlc3MuZW52LlBBVEggb3IgcHJvY2Vzcy5lbnYuUGF0aFxuICAgICAgICBmb3IgZGlyIGluIHByb2Nlc3NQYXRoLnNwbGl0IHBhdGguZGVsaW1pdGVyXG4gICAgICAgICAgdG1wID0gcGF0aC5qb2luIGRpciwgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBAcHlsYW1hUGF0aCA9IHRtcCBpZiBkbyBzdGF0U3luYyh0bXApLmlzRmlsZVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXRjaCBlXG4gICAgICBlbHNlXG4gICAgICAgIGlmIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICAgIHRtcCA9IGlmIG5vdCBwYXRoLmlzQWJzb2x1dGUgQGV4ZWN1dGFibGVQYXRoIHRoZW4gcGF0aC5yZXNvbHZlIEBleGVjdXRhYmxlUGF0aCBlbHNlIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgQHB5bGFtYVBhdGggPSB0bXAgaWYgZG8gc3RhdFN5bmModG1wKS5pc0ZpbGVcbiAgICAgICAgICBjYXRjaCBlXG5cbiAgICAgIGlmIG5vdCBAcHlsYW1hUGF0aFxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ1B5bGFtYSBleGVjdXRhYmxlIG5vdCBmb3VuZCcsXG4gICAgICAgIGRldGFpbDogXCJbbGludGVyLXB5bGFtYV0gYCN7QGV4ZWN1dGFibGVQYXRofWAgZXhlY3V0YWJsZSBmaWxlIG5vdCBmb3VuZC5cbiAgICAgICAgXFxuUGxlYXNlIHNldCB0aGUgY29ycmVjdCBwYXRoIHRvIGBweWxhbWFgLlwiXG4gICAgZWxzZVxuICAgICAgQHB5bGFtYVBhdGggPSBwYXRoLmpvaW4gcGF0aC5kaXJuYW1lKF9fZGlybmFtZSksICdiaW4nLCAncHlsYW1hLnB5JyxcblxuXG4gIGluaXRBcmdzOiAoY3VyRGlyKSA9PlxuICAgIGFyZ3MgPSBbJy1GJ11cblxuICAgIGlmIEBjb25maWdGaWxlTG9hZFswXSBpcyAnVScgIyAnVXNlIHB5bGFtYSBjb25maWcnXG4gICAgICBjb25maWdGaWxlUGF0aCA9IGhlbHBlcnMuZmluZENhY2hlZCBjdXJEaXIsIEBjb25maWdGaWxlTmFtZVxuXG4gICAgaWYgY29uZmlnRmlsZVBhdGggdGhlbiBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLW9wdGlvbnMnLCBjb25maWdGaWxlUGF0aF1cbiAgICBlbHNlXG4gICAgICBpZiBAaWdub3JlRXJyb3JzQW5kV2FybmluZ3MgdGhlbiBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLWlnbm9yZScsIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5nc11cbiAgICAgIGlmIEBza2lwRmlsZXMgdGhlbiBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLXNraXAnLCBAc2tpcEZpbGVzXVxuXG4gICAgICB1c2VQeUxpbnQgPSBpZiBAdXNlUHlMaW50IHRoZW4gJ3B5bGludCcgZWxzZSAnJ1xuICAgICAgdXNlTWNDYWJlID0gaWYgQHVzZU1jQ2FiZSB0aGVuICdtY2NhYmUnIGVsc2UgJydcbiAgICAgIHVzZVBFUDggPSBpZiBAdXNlUEVQOCB0aGVuICdwZXA4JyBlbHNlICcnXG4gICAgICB1c2VQRVAyNTcgPSBpZiBAdXNlUEVQMjU3IHRoZW4gJ3BlcDI1NycgZWxzZSAnJ1xuICAgICAgdXNlUHlGbGFrZXMgPSBpZiBAdXNlUHlGbGFrZXMgdGhlbiAncHlmbGFrZXMnIGVsc2UgJydcbiAgICAgIHVzZVJhZG9uID0gaWYgQHVzZVJhZG9uIHRoZW4gJ3JhZG9uJyBlbHNlICcnXG4gICAgICB1c2VJc29ydCA9IGlmIEB1c2VJc29ydCB0aGVuICdpc29ydCcgZWxzZSAnJ1xuXG4gICAgICBsaW50ZXJzID0gW3VzZVBFUDgsIHVzZVBFUDI1NywgdXNlUHlMaW50LCB1c2VQeUZsYWtlcywgdXNlTWNDYWJlLCB1c2VSYWRvbiwgdXNlSXNvcnRdLmZpbHRlciAoZSkgLT4gZSBpc250ICcnXG4gICAgICBhcmdzLnB1c2ggJy0tbGludGVycydcbiAgICAgIGlmIGxpbnRlcnMubGVuZ3RoIHRoZW4gYXJncy5wdXNoIGRvIGxpbnRlcnMuam9pbiBlbHNlIGFyZ3MucHVzaCAnbm9uZSdcblxuICAgIGFyZ3NcblxuXG4gIG1ha2VMaW50SW5mbzogKGZpbGVOYW1lLCBvcmlnaW5GaWxlTmFtZSkgPT5cbiAgICBvcmlnaW5GaWxlTmFtZSA9IGZpbGVOYW1lIGlmIG5vdCBvcmlnaW5GaWxlTmFtZVxuICAgIGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUgcGF0aC5kaXJuYW1lKG9yaWdpbkZpbGVOYW1lKVxuICAgIHRtcEZpbGVQYXRoID0gIGlmIGZpbGVOYW1lICE9IG9yaWdpbkZpbGVOYW1lIHRoZW4gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKSBlbHNlIGZpbGVQYXRoXG4gICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgob3JpZ2luRmlsZU5hbWUpWzBdXG4gICAgZW52ID0gQGluaXRFbnYgZmlsZVBhdGgsIHByb2plY3RQYXRoXG4gICAgYXJncyA9IEBpbml0QXJncyBmaWxlUGF0aFxuICAgIGFyZ3MucHVzaCBmaWxlTmFtZVxuICAgIGNvbnNvbGUubG9nIFwiI3tAcHlsYW1hUGF0aH0gI3thcmdzfVwiIGlmIGRvIGF0b20uaW5EZXZNb2RlXG4gICAgaWYgQHB5bGFtYVZlcnNpb24gaXMgJ2V4dGVybmFsJ1xuICAgICAgY29tbWFuZCA9IEBweWxhbWFQYXRoXG4gICAgZWxzZVxuICAgICAgY29tbWFuZCA9IEBpbnRlcnByZXRlclxuICAgICAgYXJncy51bnNoaWZ0IEBweWxhbWFQYXRoXG4gICAgaW5mbyA9XG4gICAgICBmaWxlTmFtZTogb3JpZ2luRmlsZU5hbWVcbiAgICAgIGNvbW1hbmQ6IGNvbW1hbmRcbiAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgIG9wdGlvbnM6XG4gICAgICAgIGVudjogZW52XG4gICAgICAgIGN3ZDogdG1wRmlsZVBhdGhcbiAgICAgICAgc3RyZWFtOiAnYm90aCdcblxuXG4gIGxpbnRGaWxlOiAobGludEluZm8sIHRleHRFZGl0b3IpIC0+XG4gICAgaGVscGVycy5leGVjKGxpbnRJbmZvLmNvbW1hbmQsIGxpbnRJbmZvLmFyZ3MsIGxpbnRJbmZvLm9wdGlvbnMpLnRoZW4gKG91dHB1dCkgPT5cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIG91dHB1dFsnc3RkZXJyJ10gaWYgb3V0cHV0WydzdGRlcnInXVxuICAgICAgY29uc29sZS5sb2cgb3V0cHV0WydzdGRvdXQnXSBpZiBkbyBhdG9tLmluRGV2TW9kZVxuICAgICAgaGVscGVycy5wYXJzZShvdXRwdXRbJ3N0ZG91dCddLCByZWdleCkubWFwIChtZXNzYWdlKSAtPlxuICAgICAgICBtZXNzYWdlLnR5cGUgPSAnJyBpZiBub3QgbWVzc2FnZS50eXBlXG4gICAgICAgIG1lc3NhZ2UuZmlsZVBhdGggPSAnJyBpZiBub3QgbWVzc2FnZS5maWxlUGF0aFxuICAgICAgICBjb2RlID0gXCIje21lc3NhZ2UudHlwZX0je21lc3NhZ2UuZmlsZVBhdGh9XCJcbiAgICAgICAgbWVzc2FnZS50eXBlID0gaWYgbWVzc2FnZS50eXBlIGluIFsnRScsICdGJ10gdGhlbiAnRXJyb3InIGVsc2UgJ1dhcm5pbmcnXG4gICAgICAgIG1lc3NhZ2UuZmlsZVBhdGggPSBsaW50SW5mby5maWxlTmFtZVxuICAgICAgICBtZXNzYWdlLnRleHQgPSBpZiBjb2RlIHRoZW4gXCIje2NvZGV9ICN7bWVzc2FnZS50ZXh0fVwiIGVsc2UgXCIje21lc3NhZ2UudGV4dH1cIlxuICAgICAgICBsaW5lID0gbWVzc2FnZS5yYW5nZVswXVswXVxuICAgICAgICBjb2wgPSBtZXNzYWdlLnJhbmdlWzBdWzFdXG4gICAgICAgIGVkaXRvckxpbmUgPSB0ZXh0RWRpdG9yLmJ1ZmZlci5saW5lc1tsaW5lXVxuICAgICAgICBpZiBub3QgZWRpdG9yTGluZSBvciBub3QgZWRpdG9yTGluZS5sZW5ndGhcbiAgICAgICAgICBjb2xFbmQgPSAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjb2xFbmQgPSBlZGl0b3JMaW5lLmluZGV4T2YoJyAnLCBjb2wrMSlcbiAgICAgICAgICBpZiBjb2xFbmQgPT0gLTFcbiAgICAgICAgICAgIGNvbEVuZCA9IGVkaXRvckxpbmUubGVuZ3RoXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sRW5kID0gMyBpZiBjb2xFbmQgLSBjb2wgPCAzXG4gICAgICAgICAgICBjb2xFbmQgPSBpZiBjb2xFbmQgPCBlZGl0b3JMaW5lLmxlbmd0aCB0aGVuIGNvbEVuZCBlbHNlIGVkaXRvckxpbmUubGVuZ3RoXG4gICAgICAgIG1lc3NhZ2UucmFuZ2UgPSBbXG4gICAgICAgICAgW2xpbmUsIGNvbF1cbiAgICAgICAgICBbbGluZSwgY29sRW5kXVxuICAgICAgICBdXG4gICAgICAgIG1lc3NhZ2VcblxuXG4gIGxpbnRGaWxlT25GbHk6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGZpbGVQYXRoID0gZG8gdGV4dEVkaXRvci5nZXRQYXRoXG4gICAgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lIGRvIHRleHRFZGl0b3IuZ2V0UGF0aFxuICAgIGhlbHBlcnMudGVtcEZpbGUgZmlsZU5hbWUsIGRvIHRleHRFZGl0b3IuZ2V0VGV4dCwgKHRtcEZpbGVQYXRoKSA9PlxuICAgICAgdG1wRmlsZVBhdGggPSByZWFscGF0aFN5bmMgdG1wRmlsZVBhdGhcbiAgICAgIGxpbnRJbmZvID0gQG1ha2VMaW50SW5mbyB0bXBGaWxlUGF0aCwgZmlsZVBhdGhcbiAgICAgIEBsaW50RmlsZSBsaW50SW5mbywgdGV4dEVkaXRvclxuXG5cbiAgbGludE9uU2F2ZTogKHRleHRFZGl0b3IpID0+XG4gICAgZmlsZVBhdGggPSBkbyB0ZXh0RWRpdG9yLmdldFBhdGhcbiAgICBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMidcbiAgICAgIGlmIGZpbGVQYXRoLnNsaWNlKDAsIDIpID09ICdcXFxcXFxcXCdcbiAgICAgICAgcmV0dXJuIEBsaW50RmlsZU9uRmx5IHRleHRFZGl0b3JcbiAgICBsaW50SW5mbyA9IEBtYWtlTGludEluZm8gZmlsZVBhdGhcbiAgICBAbGludEZpbGUgbGludEluZm8sIHRleHRFZGl0b3JcblxuXG4gIGxpbnQ6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIHJldHVybiBbXSBpZiBub3QgQHB5bGFtYVBhdGhcbiAgICByZXR1cm4gQGxpbnRGaWxlT25GbHkgdGV4dEVkaXRvciBpZiBAbGludE9uRmx5XG4gICAgQGxpbnRPblNhdmUgdGV4dEVkaXRvclxuXG5cbm1vZHVsZS5leHBvcnRzID0gTGludGVyUHlsYW1hXG4iXX0=
