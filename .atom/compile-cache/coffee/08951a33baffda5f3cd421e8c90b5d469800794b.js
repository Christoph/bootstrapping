(function() {
  var CompositeDisposable, LinterPylama, helpers, os, path, readFile, realpathSync, ref, regex, statSync,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require("fs"), readFile = ref.readFile, statSync = ref.statSync, realpathSync = ref.realpathSync;

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
      this.isortOnFly = bind(this.isortOnFly, this);
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
          return _this.usePyFlakes = usePyFlakes;
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
            return atom.config.set('linter-pylama.useMcCabe', false);
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
          return _this.isortOnFly(atom.workspace.getActiveTextEditor());
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

    LinterPylama.prototype.isortOnFly = function(textEditor) {
      var bufferText, cursorPosition, fileName;
      fileName = path.basename(textEditor.getPath());
      cursorPosition = textEditor.getCursorBufferPosition();
      bufferText = textEditor.getText();
      return helpers.tempFile(fileName, bufferText, (function(_this) {
        return function(tmpFilePath) {
          tmpFilePath = realpathSync(tmpFilePath);
          return helpers.exec(_this.interpreter, [_this.isortPath, tmpFilePath]).then(function(output) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvbGludGVyLXB5bGFtYS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtHQUFBO0lBQUE7OztFQUFBLE1BQXFDLE9BQUEsQ0FBUSxJQUFSLENBQXJDLEVBQUMsdUJBQUQsRUFBVyx1QkFBWCxFQUFxQjs7RUFDckIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFTixzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE9BQUEsR0FBVSxPQUFBLENBQVEsYUFBUjs7RUFFVixLQUFBLEdBQ0UsZUFBQSxHQUNBLGdCQURBLEdBRUEsZUFGQSxHQUdBLE1BSEEsR0FJQSx3REFKQSxHQUtBOztFQUdJO0lBQ1Msc0JBQUE7Ozs7Ozs7O01BQ1gsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixDQUFWLEVBQW1DLEtBQW5DLEVBQTBDLFVBQTFDO01BRWIsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLDZCQUFwQixFQUNuQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsYUFBRDtVQUNFLElBQUcsS0FBQyxDQUFBLGFBQUo7WUFDRSxLQUFDLENBQUEsYUFBRCxHQUFpQjttQkFDZCxLQUFDLENBQUEsVUFBSixDQUFBLEVBRkY7V0FBQSxNQUFBO21CQUlFLEtBQUMsQ0FBQSxhQUFELEdBQWlCLGNBSm5COztRQURGO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURtQixDQUFuQjtNQVFBLElBQUMsQ0FBQSxhQUFhLENBQUMs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UUFBUixDQUFpQixRQUFqQixFQUE4QixVQUFVLENBQUMsT0FBZCxDQUFBLENBQTNCLEVBQWtELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxXQUFEO0FBQ2hELGNBQUE7VUFBQSxXQUFBLEdBQWMsWUFBQSxDQUFhLFdBQWI7VUFDZCxRQUFBLEdBQVcsS0FBQyxDQUFBLFlBQUQsQ0FBYyxXQUFkLEVBQTJCLFFBQTNCO2lCQUNYLEtBQUMsQ0FBQSxRQUFELENBQVUsUUFBVixFQUFvQixVQUFwQjtRQUhnRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEQ7SUFIYTs7MkJBU2YsVUFBQSxHQUFZLFNBQUMsVUFBRDtBQUNWLFVBQUE7TUFBQSxRQUFBLEdBQWMsVUFBVSxDQUFDLE9BQWQsQ0FBQTtNQUNYLElBQUcsT0FBTyxDQUFDLFFBQVIsS0FBb0IsT0FBdkI7UUFDRSxJQUFHLFFBQVEsQ0FBQyxLQUFULENBQWUsQ0FBZixFQUFrQixDQUFsQixDQUFBLEtBQXdCLE1BQTNCO0FBQ0UsaUJBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxVQUFmLEVBRFQ7U0FERjs7TUFHQSxRQUFBLEdBQVcsSUFBQyxDQUFBLFlBQUQsQ0FBYyxRQUFkO2FBQ1gsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFWLEVBQW9CLFVBQXBCO0lBTlU7OzJCQVNaLElBQUEsR0FBTSxTQUFDLFVBQUQ7TUFDSixJQUFhLENBQUksSUFBQyxDQUFBLFVBQWxCO0FBQUEsZUFBTyxHQUFQOztNQUNBLElBQW9DLElBQUMsQ0FBQSxTQUFyQztBQUFBLGVBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxVQUFmLEVBQVA7O2FBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxVQUFaO0lBSEk7Ozs7OztFQU1SLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBM1JqQiIsInNvdXJjZXNDb250ZW50IjpbIntyZWFkRmlsZSwgc3RhdFN5bmMsIHJlYWxwYXRoU3luY30gPSByZXF1aXJlIFwiZnNcIlxub3MgPSByZXF1aXJlICdvcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuaGVscGVycyA9IHJlcXVpcmUgJ2F0b20tbGludGVyJ1xuXG5yZWdleCA9XG4gICcoPzxmaWxlXz4uKyk6JyArXG4gICcoPzxsaW5lPlxcXFxkKyk6JyArXG4gICcoPzxjb2w+XFxcXGQrKTonICtcbiAgJ1xcXFxzKycgK1xuICAnKCgoPzx0eXBlPltFQ0RGSU5SV10pKD88ZmlsZT5cXFxcZCspKDpcXFxccyt8XFxcXHMrKSl8KC4qPykpJyArXG4gICcoPzxtZXNzYWdlPi4rKSdcblxuXG5jbGFzcyBMaW50ZXJQeWxhbWFcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGlzb3J0UGF0aCA9IHBhdGguam9pbiBwYXRoLmRpcm5hbWUoX19kaXJuYW1lKSwgJ2JpbicsICdpc29ydC5weSdcblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5weWxhbWFWZXJzaW9uJyxcbiAgICAocHlsYW1hVmVyc2lvbikgPT5cbiAgICAgIGlmIEBweWxhbWFWZXJzaW9uXG4gICAgICAgIEBweWxhbWFWZXJzaW9uID0gcHlsYW1hVmVyc2lvblxuICAgICAgICBkbyBAaW5pdFB5bGFtYVxuICAgICAgZWxzZVxuICAgICAgICBAcHlsYW1hVmVyc2lvbiA9IHB5bGFtYVZlcnNpb25cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmV4ZWN1dGFibGVQYXRoJyxcbiAgICAoZXhlY3V0YWJsZVBhdGgpID0+XG4gICAgICBpZiBAZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgQGV4ZWN1dGFibGVQYXRoID0gZXhlY3V0YWJsZVBhdGhcbiAgICAgICAgZG8gQGluaXRQeWxhbWFcbiAgICAgIGVsc2VcbiAgICAgICAgQGV4ZWN1dGFibGVQYXRoID0gZXhlY3V0YWJsZVBhdGhcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmludGVycHJldGVyJyxcbiAgICAoaW50ZXJwcmV0ZXIpID0+XG4gICAgICBAaW50ZXJwcmV0ZXIgPSBpbnRlcnByZXRlclxuICAgICAgZG8gQGluaXRQeWxhbWFcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmlnbm9yZUVycm9yc0FuZFdhcm5pbmdzJyxcbiAgICAoaWdub3JlRXJyb3JzQW5kV2FybmluZ3MpID0+XG4gICAgICBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyA9IGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzLnJlcGxhY2UgL1xccysvZywgJycgaWYgaWdub3JlRXJyb3JzQW5kV2FybmluZ3NcbiAgICAgIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyA9IGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5za2lwRmlsZXMnLFxuICAgIChza2lwRmlsZXMpID0+XG4gICAgICBAc2tpcEZpbGVzID0gc2tpcEZpbGVzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VNY0NhYmUnLFxuICAgICh1c2VNY0NhYmUpID0+XG4gICAgICBAdXNlTWNDYWJlID0gdXNlTWNDYWJlXG4gICAgICBpZiBAdXNlTWNDYWJlXG4gICAgICAgIGF0b20uY29uZmlnLnNldCAnbGludGVyLXB5bGFtYS51c2VSYWRvbicsIGZhbHNlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VQZXA4JyxcbiAgICAodXNlUEVQOCkgPT5cbiAgICAgIEB1c2VQRVA4ID0gdXNlUEVQOFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUGVwMjU3JyxcbiAgICAodXNlUEVQMjU3KSA9PlxuICAgICAgQHVzZVBFUDI1NyA9IHVzZVBFUDI1N1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEudXNlUHlmbGFrZXMnLFxuICAgICh1c2VQeUZsYWtlcykgPT5cbiAgICAgIEB1c2VQeUZsYWtlcyA9IHVzZVB5Rmxha2VzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VQeWxpbnQnLFxuICAgICh1c2VQeUxpbnQpID0+XG4gICAgICBAdXNlUHlMaW50ID0gdXNlUHlMaW50XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS51c2VSYWRvbicsXG4gICAgKHVzZVJhZG9uKSA9PlxuICAgICAgQHVzZVJhZG9uID0gdXNlUmFkb25cbiAgICAgIGlmIEB1c2VSYWRvblxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ2xpbnRlci1weWxhbWEudXNlTWNDYWJlJywgZmFsc2VcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLnVzZUlzb3J0JyxcbiAgICAodXNlSXNvcnQpID0+XG4gICAgICBAdXNlSXNvcnQgPSB1c2VJc29ydFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEubGludE9uRmx5JyxcbiAgICAobGludE9uRmx5KSA9PlxuICAgICAgQGxpbnRPbkZseSA9IGxpbnRPbkZseVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2xpbnRlci1weWxhbWEuY29uZmlnRmlsZUxvYWQnLFxuICAgIChjb25maWdGaWxlTG9hZCkgPT5cbiAgICAgIEBjb25maWdGaWxlTG9hZCA9IGNvbmZpZ0ZpbGVMb2FkXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLXB5bGFtYS5jb25maWdGaWxlTmFtZScsXG4gICAgKGNvbmZpZ0ZpbGVOYW1lKSA9PlxuICAgICAgQGNvbmZpZ0ZpbGVOYW1lID0gY29uZmlnRmlsZU5hbWVcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsaW50ZXItcHlsYW1hLmlzb3J0T25TYXZlJyxcbiAgICAoaXNvcnRPblNhdmUpID0+XG4gICAgICBpZiBpc29ydE9uU2F2ZVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgICAgICBAaXNvcnRPblNhdmUgPSBlZGl0b3Iub25EaWRTYXZlID0+XG4gICAgICAgICAgICBpZiBlZGl0b3IuZ2V0R3JhbW1hcj8oKS5zY29wZU5hbWUgaXMgJ3NvdXJjZS5weXRob24nXG4gICAgICAgICAgICAgIGhlbHBlcnMuZXhlYyBAaW50ZXJwcmV0ZXIsIFtAaXNvcnRQYXRoLCBkbyBlZGl0b3IuZ2V0UGF0aF1cbiAgICAgIGVsc2VcbiAgICAgICAgZG8gQGlzb3J0T25TYXZlPy5kaXNwb3NlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2xpbnRlci1weWxhbWE6aXNvcnQnLCA9PlxuICAgICAgQGlzb3J0T25GbHkgZG8gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvclxuXG5cbiAgZGVzdHJveTogLT5cbiAgICBkbyBAc3Vic2NyaXB0aW9ucz8uZGlzcG9zZVxuICAgIGRvIEBpc29ydE9uU2F2ZT8uZGlzcG9zZVxuXG5cbiAgaXNMaW50T25GbHk6IC0+XG4gICAgcmV0dXJuIEBsaW50T25GbHlcblxuXG4gIGlzb3J0T25GbHk6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZSBkbyB0ZXh0RWRpdG9yLmdldFBhdGhcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGRvIHRleHRFZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25cbiAgICBidWZmZXJUZXh0ID0gZG8gdGV4dEVkaXRvci5nZXRUZXh0XG4gICAgaGVscGVycy50ZW1wRmlsZSBmaWxlTmFtZSwgYnVmZmVyVGV4dCwgKHRtcEZpbGVQYXRoKSA9PlxuICAgICAgdG1wRmlsZVBhdGggPSByZWFscGF0aFN5bmMgdG1wRmlsZVBhdGhcbiAgICAgIGhlbHBlcnMuZXhlYyhAaW50ZXJwcmV0ZXIsIFtAaXNvcnRQYXRoLCB0bXBGaWxlUGF0aF0pLnRoZW4gKG91dHB1dCkgPT5cbiAgICAgICAgcmVhZEZpbGUgdG1wRmlsZVBhdGgsIChlcnIsIGRhdGEpID0+XG4gICAgICAgICAgaWYgZXJyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyBlcnJcbiAgICAgICAgICBlbHNlIGlmIGRhdGFcbiAgICAgICAgICAgIGRhdGFTdHIgPSBkbyBkYXRhLnRvU3RyaW5nXG4gICAgICAgICAgICBpZiBkYXRhU3RyIGlzbnQgYnVmZmVyVGV4dFxuICAgICAgICAgICAgICB0ZXh0RWRpdG9yLnNldFRleHQgZG8gZGF0YS50b1N0cmluZ1xuICAgICAgICAgICAgICB0ZXh0RWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIGN1cnNvclBvc2l0aW9uXG5cblxuICBpbml0RW52OiAoZmlsZVBhdGgsIHByb2plY3RQYXRoKSAtPlxuICAgIHB5dGhvblBhdGggPSBbXVxuXG4gICAgcHl0aG9uUGF0aC5wdXNoIGZpbGVQYXRoIGlmIGZpbGVQYXRoXG4gICAgcHl0aG9uUGF0aC5wdXNoIHByb2plY3RQYXRoIGlmIHByb2plY3RQYXRoIGFuZCBwcm9qZWN0UGF0aCBub3QgaW4gcHl0aG9uUGF0aFxuXG4gICAgZW52ID0gT2JqZWN0LmNyZWF0ZSBwcm9jZXNzLmVudlxuICAgIGlmIGVudi5QV0RcbiAgICAgIHByb2Nlc3NQYXRoID0gcGF0aC5ub3JtYWxpemUgZW52LlBXRFxuICAgICAgcHl0aG9uUGF0aC5wdXNoIHByb2Nlc3NQYXRoIGlmIHByb2Nlc3NQYXRoIGFuZCBwcm9jZXNzUGF0aCBub3QgaW4gcHl0aG9uUGF0aFxuXG4gICAgZW52LlBZTEFNQSA9IHB5dGhvblBhdGguam9pbiBwYXRoLmRlbGltaXRlclxuICAgIGVudlxuXG5cbiAgaW5pdFB5bGFtYTogPT5cbiAgICBpZiBAcHlsYW1hVmVyc2lvbiBpcyAnZXh0ZXJuYWwnIGFuZCBAZXhlY3V0YWJsZVBhdGggaXNudCBAcHlsYW1hUGF0aFxuICAgICAgQHB5bGFtYVBhdGggPSAnJ1xuICAgICAgaWYgL14ocHlsYW1hfHB5bGFtYVxcLmV4ZSkkLy50ZXN0IEBleGVjdXRhYmxlUGF0aFxuICAgICAgICBwcm9jZXNzUGF0aCA9IHByb2Nlc3MuZW52LlBBVEggb3IgcHJvY2Vzcy5lbnYuUGF0aFxuICAgICAgICBmb3IgZGlyIGluIHByb2Nlc3NQYXRoLnNwbGl0IHBhdGguZGVsaW1pdGVyXG4gICAgICAgICAgdG1wID0gcGF0aC5qb2luIGRpciwgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBAcHlsYW1hUGF0aCA9IHRtcCBpZiBkbyBzdGF0U3luYyh0bXApLmlzRmlsZVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXRjaCBlXG4gICAgICBlbHNlXG4gICAgICAgIGlmIEBleGVjdXRhYmxlUGF0aFxuICAgICAgICAgIGhvbWVkaXIgPSBvcy5ob21lZGlyKClcbiAgICAgICAgICBpZiBob21lZGlyXG4gICAgICAgICAgICBAZXhlY3V0YWJsZVBhdGggPSBAZXhlY3V0YWJsZVBhdGgucmVwbGFjZSAvXn4oJHxcXC98XFxcXCkvLCBcIiN7aG9tZWRpcn0kMVwiXG4gICAgICAgICAgdG1wID0gaWYgbm90IHBhdGguaXNBYnNvbHV0ZSBAZXhlY3V0YWJsZVBhdGggdGhlbiBwYXRoLnJlc29sdmUgQGV4ZWN1dGFibGVQYXRoIGVsc2UgQGV4ZWN1dGFibGVQYXRoXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBAcHlsYW1hUGF0aCA9IHRtcCBpZiBkbyBzdGF0U3luYyh0bXApLmlzRmlsZVxuICAgICAgICAgIGNhdGNoIGVcblxuICAgICAgaWYgbm90IEBweWxhbWFQYXRoXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciAnUHlsYW1hIGV4ZWN1dGFibGUgbm90IGZvdW5kJyxcbiAgICAgICAgZGV0YWlsOiBcIltsaW50ZXItcHlsYW1hXSBgI3tAZXhlY3V0YWJsZVBhdGh9YCBleGVjdXRhYmxlIGZpbGUgbm90IGZvdW5kLlxuICAgICAgICBcXG5QbGVhc2Ugc2V0IHRoZSBjb3JyZWN0IHBhdGggdG8gYHB5bGFtYWAuXCJcbiAgICBlbHNlXG4gICAgICBAcHlsYW1hUGF0aCA9IHBhdGguam9pbiBwYXRoLmRpcm5hbWUoX19kaXJuYW1lKSwgJ2JpbicsICdweWxhbWEucHknLFxuXG5cbiAgaW5pdEFyZ3M6IChjdXJEaXIpID0+XG4gICAgYXJncyA9IFsnLUYnXVxuXG4gICAgaWYgQGNvbmZpZ0ZpbGVMb2FkWzBdIGlzICdVJyAjICdVc2UgcHlsYW1hIGNvbmZpZydcbiAgICAgIGNvbmZpZ0ZpbGVQYXRoID0gaGVscGVycy5maW5kQ2FjaGVkIGN1ckRpciwgQGNvbmZpZ0ZpbGVOYW1lXG5cbiAgICBpZiBjb25maWdGaWxlUGF0aCB0aGVuIGFyZ3MucHVzaC5hcHBseSBhcmdzLCBbJy0tb3B0aW9ucycsIGNvbmZpZ0ZpbGVQYXRoXVxuICAgIGVsc2VcbiAgICAgIGlmIEBpZ25vcmVFcnJvcnNBbmRXYXJuaW5ncyB0aGVuIGFyZ3MucHVzaC5hcHBseSBhcmdzLCBbJy0taWdub3JlJywgQGlnbm9yZUVycm9yc0FuZFdhcm5pbmdzXVxuICAgICAgaWYgQHNraXBGaWxlcyB0aGVuIGFyZ3MucHVzaC5hcHBseSBhcmdzLCBbJy0tc2tpcCcsIEBza2lwRmlsZXNdXG5cbiAgICAgIHVzZVB5TGludCA9IGlmIEB1c2VQeUxpbnQgdGhlbiAncHlsaW50JyBlbHNlICcnXG4gICAgICB1c2VNY0NhYmUgPSBpZiBAdXNlTWNDYWJlIHRoZW4gJ21jY2FiZScgZWxzZSAnJ1xuICAgICAgdXNlUEVQOCA9IGlmIEB1c2VQRVA4IHRoZW4gJ3BlcDgnIGVsc2UgJydcbiAgICAgIHVzZVBFUDI1NyA9IGlmIEB1c2VQRVAyNTcgdGhlbiAncGVwMjU3JyBlbHNlICcnXG4gICAgICB1c2VQeUZsYWtlcyA9IGlmIEB1c2VQeUZsYWtlcyB0aGVuICdweWZsYWtlcycgZWxzZSAnJ1xuICAgICAgdXNlUmFkb24gPSBpZiBAdXNlUmFkb24gdGhlbiAncmFkb24nIGVsc2UgJydcbiAgICAgIHVzZUlzb3J0ID0gaWYgQHVzZUlzb3J0IHRoZW4gJ2lzb3J0JyBlbHNlICcnXG5cbiAgICAgIGxpbnRlcnMgPSBbdXNlUEVQOCwgdXNlUEVQMjU3LCB1c2VQeUxpbnQsIHVzZVB5Rmxha2VzLCB1c2VNY0NhYmUsIHVzZVJhZG9uLCB1c2VJc29ydF0uZmlsdGVyIChlKSAtPiBlIGlzbnQgJydcbiAgICAgIGFyZ3MucHVzaCAnLS1saW50ZXJzJ1xuICAgICAgaWYgbGludGVycy5sZW5ndGggdGhlbiBhcmdzLnB1c2ggZG8gbGludGVycy5qb2luIGVsc2UgYXJncy5wdXNoICdub25lJ1xuXG4gICAgYXJnc1xuXG5cbiAgbWFrZUxpbnRJbmZvOiAoZmlsZU5hbWUsIG9yaWdpbkZpbGVOYW1lKSA9PlxuICAgIG9yaWdpbkZpbGVOYW1lID0gZmlsZU5hbWUgaWYgbm90IG9yaWdpbkZpbGVOYW1lXG4gICAgZmlsZVBhdGggPSBwYXRoLm5vcm1hbGl6ZSBwYXRoLmRpcm5hbWUob3JpZ2luRmlsZU5hbWUpXG4gICAgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgob3JpZ2luRmlsZU5hbWUpWzBdXG4gICAgY3dkID0gaWYgZmlsZU5hbWUgIT0gb3JpZ2luRmlsZU5hbWUgdGhlbiBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpIGVsc2UgcHJvamVjdFBhdGhcbiAgICBlbnYgPSBAaW5pdEVudiBmaWxlUGF0aCwgcHJvamVjdFBhdGhcbiAgICBhcmdzID0gQGluaXRBcmdzIGZpbGVQYXRoXG4gICAgYXJncy5wdXNoIGZpbGVOYW1lXG4gICAgY29uc29sZS5sb2cgXCIje0BweWxhbWFQYXRofSAje2FyZ3N9XCIgaWYgZG8gYXRvbS5pbkRldk1vZGVcbiAgICBpZiBAcHlsYW1hVmVyc2lvbiBpcyAnZXh0ZXJuYWwnXG4gICAgICBjb21tYW5kID0gQHB5bGFtYVBhdGhcbiAgICBlbHNlXG4gICAgICBjb21tYW5kID0gQGludGVycHJldGVyXG4gICAgICBhcmdzLnVuc2hpZnQgQHB5bGFtYVBhdGhcbiAgICBpbmZvID1cbiAgICAgIGZpbGVOYW1lOiBvcmlnaW5GaWxlTmFtZVxuICAgICAgY29tbWFuZDogY29tbWFuZFxuICAgICAgYXJnczogYXJnc1xuICAgICAgb3B0aW9uczpcbiAgICAgICAgZW52OiBlbnZcbiAgICAgICAgY3dkOiBjd2RcbiAgICAgICAgc3RyZWFtOiAnYm90aCdcblxuXG4gIGxpbnRGaWxlOiAobGludEluZm8sIHRleHRFZGl0b3IpIC0+XG4gICAgaGVscGVycy5leGVjKGxpbnRJbmZvLmNvbW1hbmQsIGxpbnRJbmZvLmFyZ3MsIGxpbnRJbmZvLm9wdGlvbnMpLnRoZW4gKG91dHB1dCkgPT5cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIG91dHB1dFsnc3RkZXJyJ10gaWYgb3V0cHV0WydzdGRlcnInXVxuICAgICAgY29uc29sZS5sb2cgb3V0cHV0WydzdGRvdXQnXSBpZiBkbyBhdG9tLmluRGV2TW9kZVxuICAgICAgaGVscGVycy5wYXJzZShvdXRwdXRbJ3N0ZG91dCddLCByZWdleCkubWFwIChtZXNzYWdlKSAtPlxuICAgICAgICBtZXNzYWdlLnR5cGUgPSAnJyBpZiBub3QgbWVzc2FnZS50eXBlXG4gICAgICAgIG1lc3NhZ2UuZmlsZVBhdGggPSAnJyBpZiBub3QgbWVzc2FnZS5maWxlUGF0aFxuICAgICAgICBjb2RlID0gXCIje21lc3NhZ2UudHlwZX0je21lc3NhZ2UuZmlsZVBhdGh9XCJcbiAgICAgICAgbWVzc2FnZS50eXBlID0gaWYgbWVzc2FnZS50eXBlIGluIFsnRScsICdGJ10gdGhlbiAnRXJyb3InIGVsc2UgJ1dhcm5pbmcnXG4gICAgICAgIG1lc3NhZ2UuZmlsZVBhdGggPSBsaW50SW5mby5maWxlTmFtZVxuICAgICAgICBtZXNzYWdlLnRleHQgPSBpZiBjb2RlIHRoZW4gXCIje2NvZGV9ICN7bWVzc2FnZS50ZXh0fVwiIGVsc2UgXCIje21lc3NhZ2UudGV4dH1cIlxuICAgICAgICBsaW5lID0gbWVzc2FnZS5yYW5nZVswXVswXVxuICAgICAgICBjb2wgPSBtZXNzYWdlLnJhbmdlWzBdWzFdXG4gICAgICAgIGVkaXRvckxpbmUgPSB0ZXh0RWRpdG9yLmJ1ZmZlci5saW5lc1tsaW5lXVxuICAgICAgICBpZiBub3QgZWRpdG9yTGluZSBvciBub3QgZWRpdG9yTGluZS5sZW5ndGhcbiAgICAgICAgICBjb2xFbmQgPSAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjb2xFbmQgPSBlZGl0b3JMaW5lLmluZGV4T2YoJyAnLCBjb2wrMSlcbiAgICAgICAgICBpZiBjb2xFbmQgPT0gLTFcbiAgICAgICAgICAgIGNvbEVuZCA9IGVkaXRvckxpbmUubGVuZ3RoXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sRW5kID0gMyBpZiBjb2xFbmQgLSBjb2wgPCAzXG4gICAgICAgICAgICBjb2xFbmQgPSBpZiBjb2xFbmQgPCBlZGl0b3JMaW5lLmxlbmd0aCB0aGVuIGNvbEVuZCBlbHNlIGVkaXRvckxpbmUubGVuZ3RoXG4gICAgICAgIG1lc3NhZ2UucmFuZ2UgPSBbXG4gICAgICAgICAgW2xpbmUsIGNvbF1cbiAgICAgICAgICBbbGluZSwgY29sRW5kXVxuICAgICAgICBdXG4gICAgICAgIG1lc3NhZ2VcblxuXG4gIGxpbnRGaWxlT25GbHk6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIGZpbGVQYXRoID0gZG8gdGV4dEVkaXRvci5nZXRQYXRoXG4gICAgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lIGRvIHRleHRFZGl0b3IuZ2V0UGF0aFxuICAgIGhlbHBlcnMudGVtcEZpbGUgZmlsZU5hbWUsIGRvIHRleHRFZGl0b3IuZ2V0VGV4dCwgKHRtcEZpbGVQYXRoKSA9PlxuICAgICAgdG1wRmlsZVBhdGggPSByZWFscGF0aFN5bmMgdG1wRmlsZVBhdGhcbiAgICAgIGxpbnRJbmZvID0gQG1ha2VMaW50SW5mbyB0bXBGaWxlUGF0aCwgZmlsZVBhdGhcbiAgICAgIEBsaW50RmlsZSBsaW50SW5mbywgdGV4dEVkaXRvclxuXG5cbiAgbGludE9uU2F2ZTogKHRleHRFZGl0b3IpID0+XG4gICAgZmlsZVBhdGggPSBkbyB0ZXh0RWRpdG9yLmdldFBhdGhcbiAgICBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMidcbiAgICAgIGlmIGZpbGVQYXRoLnNsaWNlKDAsIDIpID09ICdcXFxcXFxcXCdcbiAgICAgICAgcmV0dXJuIEBsaW50RmlsZU9uRmx5IHRleHRFZGl0b3JcbiAgICBsaW50SW5mbyA9IEBtYWtlTGludEluZm8gZmlsZVBhdGhcbiAgICBAbGludEZpbGUgbGludEluZm8sIHRleHRFZGl0b3JcblxuXG4gIGxpbnQ6ICh0ZXh0RWRpdG9yKSA9PlxuICAgIHJldHVybiBbXSBpZiBub3QgQHB5bGFtYVBhdGhcbiAgICByZXR1cm4gQGxpbnRGaWxlT25GbHkgdGV4dEVkaXRvciBpZiBAbGludE9uRmx5XG4gICAgQGxpbnRPblNhdmUgdGV4dEVkaXRvclxuXG5cbm1vZHVsZS5leHBvcnRzID0gTGludGVyUHlsYW1hXG4iXX0=
