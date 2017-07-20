(function() {
  var CompositeDisposable, LinterPylama, exec, findCached, helpers, linter_paths, linters, os, path, readFile, realpathSync, ref, ref1, ref2, statSync, tempFile,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  os = require('os');

  path = require('path');

  ref = require("fs"), readFile = ref.readFile, statSync = ref.statSync, realpathSync = ref.realpathSync;

  helpers = require('./helpers');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref1 = require('atom-linter'), exec = ref1.exec, findCached = ref1.findCached, tempFile = ref1.tempFile;

  ref2 = require('./constants.coffee'), linters = ref2.linters, linter_paths = ref2.linter_paths;

  LinterPylama = (function() {
    function LinterPylama() {
      this.lint = bind(this.lint, this);
      this.lintOnSave = bind(this.lintOnSave, this);
      this.lintFileOnFly = bind(this.lintFileOnFly, this);
      this.makeLintInfo = bind(this.makeLintInfo, this);
      this.initArgs = bind(this.initArgs, this);
      this.initPylamaLinters = bind(this.initPylamaLinters, this);
      this.initPylama = bind(this.initPylama, this);
      this.isortOnFly = bind(this.isortOnFly, this);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.config.observe('linter-pylama.pylamaVersion', (function(_this) {
        return function(pylamaVersion) {
          if (_this.pylamaVersion) {
            _this.pylamaVersion = pylamaVersion;
            return _this.pylamaPath = null;
          } else {
            return _this.pylamaVersion = pylamaVersion;
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.executablePath', (function(_this) {
        return function(executablePath) {
          if (_this.executablePath) {
            _this.executablePath = executablePath;
            return _this.pylamaPath = null;
          } else {
            return _this.executablePath = executablePath;
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.interpreter', (function(_this) {
        return function(interpreter) {
          if (_this.interpreter) {
            _this.interpreterPath = _this.interpreter = interpreter;
            return _this.pylamaPath = null;
          } else {
            return _this.interpreterPath = _this.interpreter = interpreter;
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.ignoreErrorsAndWarnings', (function(_this) {
        return function(ignoreErrorsAndWarnings) {
          if (ignoreErrorsAndWarnings) {
            return _this.ignoreErrorsAndWarnings = ignoreErrorsAndWarnings.replace(/\s+/g, '');
          }
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
            atom.config.set('linter-pylama.useRadon', false);
          }
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePep8', (function(_this) {
        return function(usePEP8) {
          _this.usePEP8 = usePEP8;
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePep257', (function(_this) {
        return function(usePEP257) {
          _this.usePEP257 = usePEP257;
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePyflakes', (function(_this) {
        return function(usePyFlakes) {
          _this.usePyFlakes = usePyFlakes;
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.usePylint', (function(_this) {
        return function(usePyLint) {
          _this.usePyLint = usePyLint;
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.useRadon', (function(_this) {
        return function(useRadon) {
          _this.useRadon = useRadon;
          if (_this.useRadon) {
            atom.config.set('linter-pylama.useMcCabe', false);
          }
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('linter-pylama.useIsort', (function(_this) {
        return function(useIsort) {
          _this.useIsort = useIsort;
          if (_this.pylamaLinters) {
            return _this.pylamaLinters = _this.initPylamaLinters();
          }
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
          var ref3;
          if (isortOnSave) {
            return atom.workspace.observeTextEditors(function(editor) {
              return _this.isortOnSave = editor.onDidSave(function() {
                if ((typeof editor.getGrammar === "function" ? editor.getGrammar().scopeName : void 0) === 'source.python') {
                  return exec(_this.interpreter, [linter_paths.isort, editor.getPath()]);
                }
              });
            });
          } else {
            return (ref3 = _this.isortOnSave) != null ? ref3.dispose() : void 0;
          }
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'linter-pylama:isort', (function(_this) {
        return function() {
          return _this.isortOnFly(atom.workspace.getActiveTextEditor());
        };
      })(this)));
    }

    LinterPylama.prototype.destroy = function() {
      var ref3, ref4;
      if ((ref3 = this.subscriptions) != null) {
        ref3.dispose();
      }
      return (ref4 = this.isortOnSave) != null ? ref4.dispose() : void 0;
    };

    LinterPylama.prototype.isLintOnFly = function() {
      return this.lintOnFly;
    };

    LinterPylama.prototype.isortOnFly = function(textEditor) {
      var bufferText, cursorPosition, fileName;
      fileName = path.basename(textEditor.getPath());
      cursorPosition = textEditor.getCursorBufferPosition();
      bufferText = textEditor.getText();
      return tempFile(fileName, bufferText, (function(_this) {
        return function(tmpFilePath) {
          tmpFilePath = realpathSync(tmpFilePath);
          return exec(_this.interpreter, [linter_paths.isort, tmpFilePath]).then(function(output) {
            return readFile(tmpFilePath, function(err, data) {
              var dataStr;
              if (err) {
                return console.log(err);
              } else if (data) {
                dataStr = data.toString();
                if (dataStr !== bufferText) {
                  textEditor.setText(data.toString());
                  return textEditor.setCursorBufferPosition(cursorPosition);
                }
              }
            });
          });
        };
      })(this));
    };

    LinterPylama.prototype.initPylama = function() {
      var ref3, ref4;
      if (this.pylamaVersion === 'external') {
        ref3 = helpers.getExecutable(this.executablePath), this.pylamaPath = ref3[0], this.virtualEnv = ref3[1];
        if (!this.pylamaPath) {
          return atom.notifications.addError('Pylama executable not found', {
            detail: "[linter-pylama] Pylama executable not found in `" + this.executablePath + "`. \nPlease set the correct path to `pylama`."
          });
        }
      } else {
        ref4 = helpers.getExecutable(this.interpreter), this.interpreter = ref4[0], this.virtualEnv = ref4[1];
        this.pylamaPath = linter_paths.pylama;
        if (!this.interpreter) {
          return atom.notifications.addError('Python executable not found', {
            detail: "[linter-pylama] Python executable not found in `" + this.interpreterPath + "`. \nPlease set the correct path to `python`."
          });
        }
      }
    };

    LinterPylama.prototype.initPylamaLinters = function() {
      var linters_args;
      linters_args = [this.usePyLint ? linters.pylint : '', this.useMcCabe ? linters.mccabe : '', this.usePEP8 ? linters.pep8 : '', this.usePEP257 ? linters.pep257 : '', this.usePyFlakes ? linters.pyflakes : '', this.useRadon ? linters.radon : '', this.useIsort ? linters.isort : ''].filter(function(e) {
        return e !== '';
      });
      return linters_args.join();
    };

    LinterPylama.prototype.initArgs = function(curDir) {
      var args, configFilePath;
      args = ['-F'];
      if (this.configFileLoad[0] === 'U') {
        configFilePath = findCached(curDir, this.configFileName);
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
        if (!this.pylamaLinters) {
          this.pylamaLinters = this.initPylamaLinters();
        }
        args.push('--linters');
        if (this.pylamaLinters) {
          args.push(this.pylamaLinters);
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
      if (fileName !== originFileName) {
        cwd = path.dirname(fileName);
      } else {
        cwd = projectPath;
      }
      env = helpers.initEnv(filePath, projectPath, this.virtualEnv);
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

    LinterPylama.prototype.lintFileOnFly = function(textEditor) {
      var fileName, filePath;
      filePath = textEditor.getPath();
      fileName = path.basename(textEditor.getPath());
      return tempFile(fileName, textEditor.getText(), (function(_this) {
        return function(tmpFilePath) {
          var lintInfo;
          tmpFilePath = realpathSync(tmpFilePath);
          lintInfo = _this.makeLintInfo(tmpFilePath, filePath);
          return helpers.lintFile(lintInfo, textEditor);
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
      return helpers.lintFile(lintInfo, textEditor);
    };

    LinterPylama.prototype.lint = function(textEditor) {
      if (!this.pylamaPath) {
        this.initPylama();
      }
      if (!this.pylamaPath) {
        return [];
      }
      if (this.lintOnFly) {
        return this.lintFileOnFly(textEditor);
      } else {
        return this.lintOnSave(textEditor);
      }
    };

    return LinterPylama;

  })();

  module.exports = LinterPylama;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvbGludGVyLXB5bGFtYS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBKQUFBO0lBQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUF1QyxPQUFBLENBQVEsSUFBUixDQUF2QyxFQUFFLHVCQUFGLEVBQVksdUJBQVosRUFBc0I7O0VBRXRCLE9BQUEsR0FBVSxPQUFBLENBQVEsV0FBUjs7RUFDUixzQkFBd0IsT0FBQSxDQUFRLE1BQVI7O0VBQzFCLE9BQWlDLE9BQUEsQ0FBUSxhQUFSLENBQWpDLEVBQUUsZ0JBQUYsRUFBUSw0QkFBUixFQUFvQjs7RUFDcEIsT0FBNEIsT0FBQSxDQUFRLG9CQUFSLENBQTVCLEVBQUUsc0JBQUYsRUFBVzs7RUFHTDtJQUNTLHNCQUFBOzs7Ozs7Ozs7TUFDWCxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQiw2QkFBcEIsRUFBbUQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLGFBQUQ7VUFDakQsSUFBRyxLQUFDLENBQUEsYUFBSjtZQUNFLEtBQUMsQ0FBQSxhQUFELEdBQWlCO21CQUNqQixLQUFDLENBQUEsVUFBRCxHQUFjLEtBRmhCO1dBQUEsTUFBQTttQkFJRSxLQUFDLENBQUEsYUFBRCxHQUFpQixjQUpuQjs7UUFEaUQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5ELENBREE7TUFRQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FDQSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsOEJBQXBCLEVBQW9ELENBQUEsU0FBQSxLQUFBO2VBQUEs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QyxDQUFBLFlBQUQsQ0FBYyxXQUFkLEVBQTJCLFFBQTNCO2lCQUNYLE9BQU8sQ0FBQyxRQUFSLENBQWlCLFFBQWpCLEVBQTJCLFVBQTNCO1FBSHdDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQztJQUhhOzsyQkFTZixVQUFBLEdBQVksU0FBQyxVQUFEO0FBQ1YsVUFBQTtNQUFBLFFBQUEsR0FBYyxVQUFVLENBQUMsT0FBZCxDQUFBO01BQ1gsSUFBRyxPQUFPLENBQUMsUUFBUixLQUFvQixPQUF2QjtRQUNFLElBQUcsUUFBUSxDQUFDLEtBQVQsQ0FBZSxDQUFmLEVBQWtCLENBQWxCLENBQUEsS0FBd0IsTUFBM0I7QUFDRSxpQkFBTyxJQUFDLENBQUEsYUFBRCxDQUFlLFVBQWYsRUFEVDtTQURGOztNQUdBLFFBQUEsR0FBVyxJQUFDLENBQUEsWUFBRCxDQUFjLFFBQWQ7YUFDWCxPQUFPLENBQUMsUUFBUixDQUFpQixRQUFqQixFQUEyQixVQUEzQjtJQU5VOzsyQkFTWixJQUFBLEdBQU0sU0FBQyxVQUFEO01BQ0osSUFBa0IsQ0FBSSxJQUFDLENBQUEsVUFBdkI7UUFBRyxJQUFDLENBQUEsVUFBSixDQUFBLEVBQUE7O01BQ0EsSUFBYSxDQUFJLElBQUMsQ0FBQSxVQUFsQjtBQUFBLGVBQU8sR0FBUDs7TUFDQSxJQUFHLElBQUMsQ0FBQSxTQUFKO2VBQW1CLElBQUMsQ0FBQSxhQUFELENBQWUsVUFBZixFQUFuQjtPQUFBLE1BQUE7ZUFBa0QsSUFBQyxDQUFBLFVBQUQsQ0FBWSxVQUFaLEVBQWxEOztJQUhJOzs7Ozs7RUFNUixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQWxQakIiLCJzb3VyY2VzQ29udGVudCI6WyJvcyA9IHJlcXVpcmUgJ29zJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG57IHJlYWRGaWxlLCBzdGF0U3luYywgcmVhbHBhdGhTeW5jIH0gPSByZXF1aXJlIFwiZnNcIlxuXG5oZWxwZXJzID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xueyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gPSByZXF1aXJlICdhdG9tJ1xueyBleGVjLCBmaW5kQ2FjaGVkLCB0ZW1wRmlsZSB9ID0gcmVxdWlyZSAnYXRvbS1saW50ZXInXG57IGxpbnRlcnMsIGxpbnRlcl9wYXRocyB9ID0gcmVxdWlyZSAnLi9jb25zdGFudHMuY29mZmVlJ1xuXG5cbmNsYXNzIExpbnRlclB5bGFtYVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIFxcXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5weWxhbWFWZXJzaW9uJywgKHB5bGFtYVZlcnNpb24pID0+XG4gICAgICBpZiBAcHlsYW1hVmVyc2lvblxuICAgICAgICBAcHlsYW1hVmVyc2lvbiA9IHB5bGFtYVZlcnNpb25cbiAgICAgICAgQHB5bGFtYVBhdGggPSBudWxsXG4gICAgICBlbHNlXG4gICAgICAgIEBweWxhbWFWZXJzaW9uID0gcHlsYW1hVmVyc2lvblxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIFxcXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5leGVjdXRhYmxlUGF0aCcsIChleGVjdXRhYmxlUGF0aCkgPT5cbiAgICAgIGlmIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICBAZXhlY3V0YWJsZVBhdGggPSBleGVjdXRhYmxlUGF0aFxuICAgICAgICBAcHlsYW1hUGF0aCA9IG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgQGV4ZWN1dGFibGVQYXRoID0gZXhlY3V0YWJsZVBhdGhcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBcXFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuaW50ZXJwcmV0ZXInLCAoaW50ZXJwcmV0ZXIpID0+XG4gICAgICBpZiBAaW50ZXJwcmV0ZXJcbiAgICAgICAgQGludGVycHJldGVyUGF0aCA9IEBpbnRlcnByZXRlciA9IGludGVycHJldGVyXG4gICAgICAgIEBweWxhbWFQYXRoID0gbnVsbFxuICAgICAgZWxzZVxuICAgICAgICBAaW50ZXJwcmV0ZXJQYXRoID0gQGludGVycHJldGVyID0gaW50ZXJwcmV0ZXJcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBcXFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuaWdub3JlRXJyb3JzQW5kV2FybmluZ3MnLFxuICAgIChpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncykgPT5cbiAgICAgIGlmIGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzXG4gICAgICAgIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyA9IGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzLnJlcGxhY2UgL1xccysvZywgJydcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBcXFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuc2tpcEZpbGVzJywgKHNraXBGaWxlcykgPT5cbiAgICAgIEBza2lwRmlsZXMgPSBza2lwRmlsZXNcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBcXFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlTWNDYWJlJywgKHVzZU1jQ2FiZSkgPT5cbiAgICAgIEB1c2VNY0NhYmUgPSB1c2VNY0NhYmVcbiAgICAgIGlmIEB1c2VNY0NhYmVcbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdsaW50ZXItcHlsYW1hLnVzZVJhZG9uJywgZmFsc2VcbiAgICAgIEBweWxhbWFMaW50ZXJzID0gZG8gQGluaXRQeWxhbWFMaW50ZXJzIGlmIEBweWxhbWFMaW50ZXJzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgXFxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVBlcDgnLCAodXNlUEVQOCkgPT5cbiAgICAgIEB1c2VQRVA4ID0gdXNlUEVQOFxuICAgICAgQHB5bGFtYUxpbnRlcnMgPSBkbyBAaW5pdFB5bGFtYUxpbnRlcnMgaWYgQHB5bGFtYUxpbnRlcnNcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBcXFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUGVwMjU3JywgKHVzZVBFUDI1NykgPT5cbiAgICAgIEB1c2VQRVAyNTcgPSB1c2VQRVAyNTdcbiAgICAgIEBweWxhbWFMaW50ZXJzID0gZG8gQGluaXRQeWxhbWFMaW50ZXJzIGlmIEBweWxhbWFMaW50ZXJzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgXFxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVB5Zmxha2VzJywgKHVzZVB5Rmxha2VzKSA9PlxuICAgICAgQHVzZVB5Rmxha2VzID0gdXNlUHlGbGFrZXNcbiAgICAgIEBweWxhbWFMaW50ZXJzID0gZG8gQGluaXRQeWxhbWFMaW50ZXJzIGlmIEBweWxhbWFMaW50ZXJzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgXFxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZVB5bGludCcsICh1c2VQeUxpbnQpID0+XG4gICAgICBAdXNlUHlMaW50ID0gdXNlUHlMaW50XG4gICAgICBAcHlsYW1hTGludGVycyA9IGRvIEBpbml0UHlsYW1hTGludGVycyBpZiBAcHlsYW1hTGludGVyc1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIFxcXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VSYWRvbicsICh1c2VSYWRvbikgPT5cbiAgICAgIEB1c2VSYWRvbiA9IHVzZVJhZG9uXG4gICAgICBpZiBAdXNlUmFkb25cbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdsaW50ZXItcHlsYW1hLnVzZU1jQ2FiZScsIGZhbHNlXG4gICAgICBAcHlsYW1hTGludGVycyA9IGRvIEBpbml0UHlsYW1hTGludGVycyBpZiBAcHlsYW1hTGludGVyc1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIFxcXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VJc29ydCcsICh1c2VJc29ydCkgPT5cbiAgICAgIEB1c2VJc29ydCA9IHVzZUlzb3J0XG4gICAgICBAcHlsYW1hTGludGVycyA9IGRvIEBpbml0UHlsYW1hTGludGVycyBpZiBAcHlsYW1hTGludGVyc1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIFxcXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5saW50T25GbHknLCAobGludE9uRmx5KSA9PlxuICAgICAgQGxpbnRPbkZseSA9IGxpbnRPbkZseVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIFxcXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5jb25maWdGaWxlTG9hZCcsIChjb25maWdGaWxlTG9hZCkgPT5cbiAgICAgIEBjb25maWdGaWxlTG9hZCA9IGNvbmZpZ0ZpbGVMb2FkXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgXFxcbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmNvbmZpZ0ZpbGVOYW1lJywgKGNvbmZpZ0ZpbGVOYW1lKSA9PlxuICAgICAgQGNvbmZpZ0ZpbGVOYW1lID0gY29uZmlnRmlsZU5hbWVcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBcXFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuaXNvcnRPblNhdmUnLCAoaXNvcnRPblNhdmUpID0+XG4gICAgICBpZiBpc29ydE9uU2F2ZVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgICAgICBAaXNvcnRPblNhdmUgPSBlZGl0b3Iub25EaWRTYXZlID0+XG4gICAgICAgICAgICBpZiBlZGl0b3IuZ2V0R3JhbW1hcj8oKS5zY29wZU5hbWUgaXMgJ3NvdXJjZS5weXRob24nXG4gICAgICAgICAgICAgIGV4ZWMgQGludGVycHJldGVyLCBbbGludGVyX3BhdGhzLmlzb3J0LCBkbyBlZGl0b3IuZ2V0UGF0aF1cbiAgICAgIGVsc2VcbiAgICAgICAgZG8gQGlzb3J0T25TYXZlPy5kaXNwb3NlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgXFxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdsaW50ZXItcHlsYW1hOmlzb3J0JywgPT5cbiAgICAgICAgQGlzb3J0T25GbHkgZG8gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvclxuXG5cbiAgZGVzdHJveTogLT5cbiAgICBkbyBAc3Vic2NyaXB0aW9ucz8uZGlzcG9zZVxuICAgIGRvIEBpc29ydE9uU2F2ZT8uZGlzcG9zZVxuXG5cbiAgaXNMaW50T25GbHk6IC0+XG4gICAgcmV0dXJuIEBsaW50T25GbHlcblxuXG4gIGlzb3J0T25GbHk6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZSBkbyB0ZXh0RWRpdG9yLmdldFBhdGhcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGRvIHRleHRFZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25cbiAgICBidWZmZXJUZXh0ID0gZG8gdGV4dEVkaXRvci5nZXRUZXh0XG4gICAgdGVtcEZpbGUgZmlsZU5hbWUsIGJ1ZmZlclRleHQsICh0bXBGaWxlUGF0aCkgPT5cbiAgICAgIHRtcEZpbGVQYXRoID0gcmVhbHBhdGhTeW5jIHRtcEZpbGVQYXRoXG4gICAgICBleGVjKEBpbnRlcnByZXRlciwgW2xpbnRlcl9wYXRocy5pc29ydCwgdG1wRmlsZVBhdGhdKS50aGVuIChvdXRwdXQpIC0+XG4gICAgICAgIHJlYWRGaWxlIHRtcEZpbGVQYXRoLCAoZXJyLCBkYXRhKSAtPlxuICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgY29uc29sZS5sb2cgZXJyXG4gICAgICAgICAgZWxzZSBpZiBkYXRhXG4gICAgICAgICAgICBkYXRhU3RyID0gZG8gZGF0YS50b1N0cmluZ1xuICAgICAgICAgICAgaWYgZGF0YVN0ciBpc250IGJ1ZmZlclRleHRcbiAgICAgICAgICAgICAgdGV4dEVkaXRvci5zZXRUZXh0IGRvIGRhdGEudG9TdHJpbmdcbiAgICAgICAgICAgICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiBjdXJzb3JQb3NpdGlvblxuXG5cbiAgaW5pdFB5bGFtYTogPT5cbiAgICBpZiBAcHlsYW1hVmVyc2lvbiBpcyAnZXh0ZXJuYWwnXG4gICAgICBbQHB5bGFtYVBhdGgsIEB2aXJ0dWFsRW52XSA9IGhlbHBlcnMuZ2V0RXhlY3V0YWJsZSBAZXhlY3V0YWJsZVBhdGhcbiAgICAgIGlmIG5vdCBAcHlsYW1hUGF0aFxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ1B5bGFtYSBleGVjdXRhYmxlIG5vdCBmb3VuZCcsIHtcbiAgICAgICAgICAgIGRldGFpbDogXCJbbGludGVyLXB5bGFtYV0gUHlsYW1hIGV4ZWN1dGFibGUgbm90IGZvdW5kIGluIGAje0BleGVjdXRhYmxlUGF0aH1gLlxuICAgICAgICAgICAgXFxuUGxlYXNlIHNldCB0aGUgY29ycmVjdCBwYXRoIHRvIGBweWxhbWFgLlwiXG4gICAgICAgICAgfVxuICAgIGVsc2VcbiAgICAgIFtAaW50ZXJwcmV0ZXIsIEB2aXJ0dWFsRW52XSA9IGhlbHBlcnMuZ2V0RXhlY3V0YWJsZSBAaW50ZXJwcmV0ZXJcbiAgICAgIEBweWxhbWFQYXRoID0gbGludGVyX3BhdGhzLnB5bGFtYVxuICAgICAgaWYgbm90IEBpbnRlcnByZXRlclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ1B5dGhvbiBleGVjdXRhYmxlIG5vdCBmb3VuZCcsIHtcbiAgICAgICAgICAgIGRldGFpbDogXCJbbGludGVyLXB5bGFtYV0gUHl0aG9uIGV4ZWN1dGFibGUgbm90IGZvdW5kIGluIGAje0BpbnRlcnByZXRlclBhdGh9YC5cbiAgICAgICAgICAgIFxcblBsZWFzZSBzZXQgdGhlIGNvcnJlY3QgcGF0aCB0byBgcHl0aG9uYC5cIlxuICAgICAgICAgIH1cblxuXG4gIGluaXRQeWxhbWFMaW50ZXJzOiA9PlxuICAgIGxpbnRlcnNfYXJncyA9IFtcbiAgICAgIGlmIEB1c2VQeUxpbnQgdGhlbiBsaW50ZXJzLnB5bGludCBlbHNlICcnXG4gICAgICBpZiBAdXNlTWNDYWJlIHRoZW4gbGludGVycy5tY2NhYmUgZWxzZSAnJ1xuICAgICAgaWYgQHVzZVBFUDggdGhlbiBsaW50ZXJzLnBlcDggZWxzZSAnJ1xuICAgICAgaWYgQHVzZVBFUDI1NyB0aGVuIGxpbnRlcnMucGVwMjU3IGVsc2UgJydcbiAgICAgIGlmIEB1c2VQeUZsYWtlcyB0aGVuIGxpbnRlcnMucHlmbGFrZXMgZWxzZSAnJ1xuICAgICAgaWYgQHVzZVJhZG9uIHRoZW4gbGludGVycy5yYWRvbiBlbHNlICcnXG4gICAgICBpZiBAdXNlSXNvcnQgdGhlbiBsaW50ZXJzLmlzb3J0IGVsc2UgJydcbiAgICBdLmZpbHRlciAoZSkgLT4gZSBpc250ICcnXG4gICAgZG8gbGludGVyc19hcmdzLmpvaW5cblxuXG4gIGluaXRBcmdzOiAoY3VyRGlyKSA9PlxuICAgIGFyZ3MgPSBbJy1GJ11cblxuICAgIGlmIEBjb25maWdGaWxlTG9hZFswXSBpcyAnVScgIyAnVXNlIHB5bGFtYSBjb25maWcnXG4gICAgICBjb25maWdGaWxlUGF0aCA9IGZpbmRDYWNoZWQgY3VyRGlyLCBAY29uZmlnRmlsZU5hbWVcblxuICAgIGlmIGNvbmZpZ0ZpbGVQYXRoXG4gICAgICBhcmdzLnB1c2guYXBwbHkgYXJncywgWyctLW9wdGlvbnMnLCBjb25maWdGaWxlUGF0aF1cbiAgICBlbHNlXG4gICAgICBpZiBAaWdub3JlRXJyb3JzQW5kV2FybmluZ3NcbiAgICAgICAgYXJncy5wdXNoLmFwcGx5IGFyZ3MsIFsnLS1pZ25vcmUnLCBAaWdub3JlRXJyb3JzQW5kV2FybmluZ3NdXG4gICAgICBpZiBAc2tpcEZpbGVzIHRoZW4gYXJncy5wdXNoLmFwcGx5IGFyZ3MsIFsnLS1za2lwJywgQHNraXBGaWxlc11cblxuICAgICAgaWYgbm90IEBweWxhbWFMaW50ZXJzIHRoZW4gQHB5bGFtYUxpbnRlcnMgPSBkbyBAaW5pdFB5bGFtYUxpbnRlcnNcbiAgICAgIGFyZ3MucHVzaCAnLS1saW50ZXJzJ1xuICAgICAgaWYgQHB5bGFtYUxpbnRlcnMgdGhlbiBhcmdzLnB1c2ggQHB5bGFtYUxpbnRlcnMgZWxzZSBhcmdzLnB1c2ggJ25vbmUnXG4gICAgYXJnc1xuXG5cbiAgbWFrZUxpbnRJbmZvOiAoZmlsZU5hbWUsIG9yaWdpbkZpbGVOYW1lKSA9PlxuICAgIG9yaWdpbkZpbGVOYW1lID0gZmlsZU5hbWUgaWYgbm90IG9yaWdpbkZpbGVOYW1lXG4gICAgZmlsZVBhdGggPSBwYXRoLm5vcm1hbGl6ZSBwYXRoLmRpcm5hbWUob3JpZ2luRmlsZU5hbWUpXG4gICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgob3JpZ2luRmlsZU5hbWUpWzBdXG4gICAgaWYgZmlsZU5hbWUgIT0gb3JpZ2luRmlsZU5hbWVcbiAgICAgIGN3ZCA9IHBhdGguZGlybmFtZShmaWxlTmFtZSlcbiAgICBlbHNlXG4gICAgICBjd2QgPSBwcm9qZWN0UGF0aFxuICAgIGVudiA9IGhlbHBlcnMuaW5pdEVudiBmaWxlUGF0aCwgcHJvamVjdFBhdGgsIEB2aXJ0dWFsRW52XG4gICAgYXJncyA9IEBpbml0QXJncyBmaWxlUGF0aFxuICAgIGFyZ3MucHVzaCBmaWxlTmFtZVxuICAgIGNvbnNvbGUubG9nIFwiI3tAcHlsYW1hUGF0aH0gI3thcmdzfVwiIGlmIGRvIGF0b20uaW5EZXZNb2RlXG4gICAgaWYgQHB5bGFtYVZlcnNpb24gaXMgJ2V4dGVybmFsJ1xuICAgICAgY29tbWFuZCA9IEBweWxhbWFQYXRoXG4gICAgZWxzZVxuICAgICAgY29tbWFuZCA9IEBpbnRlcnByZXRlclxuICAgICAgYXJncy51bnNoaWZ0IEBweWxhbWFQYXRoXG4gICAgaW5mbyA9IHtcbiAgICAgIGZpbGVOYW1lOiBvcmlnaW5GaWxlTmFtZVxuICAgICAgY29tbWFuZDogY29tbWFuZFxuICAgICAgYXJnczogYXJnc1xuICAgICAgb3B0aW9uczoge1xuICAgICAgICBlbnY6IGVudlxuICAgICAgICBjd2Q6IGN3ZFxuICAgICAgICBzdHJlYW06ICdib3RoJ1xuICAgICAgfVxuICAgIH1cblxuXG4gIGxpbnRGaWxlT25GbHk6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGZpbGVQYXRoID0gZG8gdGV4dEVkaXRvci5nZXRQYXRoXG4gICAgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lIGRvIHRleHRFZGl0b3IuZ2V0UGF0aFxuICAgIHRlbXBGaWxlIGZpbGVOYW1lLCBkbyB0ZXh0RWRpdG9yLmdldFRleHQsICh0bXBGaWxlUGF0aCkgPT5cbiAgICAgIHRtcEZpbGVQYXRoID0gcmVhbHBhdGhTeW5jIHRtcEZpbGVQYXRoXG4gICAgICBsaW50SW5mbyA9IEBtYWtlTGludEluZm8gdG1wRmlsZVBhdGgsIGZpbGVQYXRoXG4gICAgICBoZWxwZXJzLmxpbnRGaWxlIGxpbnRJbmZvLCB0ZXh0RWRpdG9yXG5cblxuICBsaW50T25TYXZlOiAodGV4dEVkaXRvcikgPT5cbiAgICBmaWxlUGF0aCA9IGRvIHRleHRFZGl0b3IuZ2V0UGF0aFxuICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICAgICAgaWYgZmlsZVBhdGguc2xpY2UoMCwgMikgPT0gJ1xcXFxcXFxcJ1xuICAgICAgICByZXR1cm4gQGxpbnRGaWxlT25GbHkgdGV4dEVkaXRvclxuICAgIGxpbnRJbmZvID0gQG1ha2VMaW50SW5mbyBmaWxlUGF0aFxuICAgIGhlbHBlcnMubGludEZpbGUgbGludEluZm8sIHRleHRFZGl0b3JcblxuXG4gIGxpbnQ6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGRvIEBpbml0UHlsYW1hIGlmIG5vdCBAcHlsYW1hUGF0aFxuICAgIHJldHVybiBbXSBpZiBub3QgQHB5bGFtYVBhdGhcbiAgICBpZiBAbGludE9uRmx5IHRoZW4gQGxpbnRGaWxlT25GbHkgdGV4dEVkaXRvciBlbHNlIEBsaW50T25TYXZlIHRleHRFZGl0b3JcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbnRlclB5bGFtYVxuIl19
