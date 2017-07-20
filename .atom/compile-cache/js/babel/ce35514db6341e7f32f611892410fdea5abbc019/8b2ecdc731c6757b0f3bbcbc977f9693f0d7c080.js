function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _specHelpers = require('../spec-helpers');

var _specHelpers2 = _interopRequireDefault(_specHelpers);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libBuildersLatexmk = require('../../lib/builders/latexmk');

var _libBuildersLatexmk2 = _interopRequireDefault(_libBuildersLatexmk);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _libBuildState = require('../../lib/build-state');

var _libBuildState2 = _interopRequireDefault(_libBuildState);

describe('LatexmkBuilder', function () {
  var builder = undefined,
      fixturesPath = undefined,
      filePath = undefined,
      extendedOutputPaths = undefined,
      state = undefined,
      jobState = undefined;

  beforeEach(function () {
    waitsForPromise(function () {
      return _specHelpers2['default'].activatePackages();
    });
    builder = new _libBuildersLatexmk2['default']();
    fixturesPath = _specHelpers2['default'].cloneFixtures();
    filePath = _path2['default'].join(fixturesPath, 'file.tex');
    state = new _libBuildState2['default'](filePath);
    state.setEngine('pdflatex');
    state.setOutputFormat('pdf');
    state.setOutputDirectory('');
    state.setEnableSynctex(true);
    state.setEnableExtendedBuildMode(true);
    jobState = state.getJobStates()[0];
  });

  function initializeExtendedBuild(name, extensions) {
    var outputDirectory = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

    var dir = _path2['default'].join(fixturesPath, 'latexmk');
    filePath = _path2['default'].format({ dir: dir, name: name, ext: '.tex' });
    state.setFilePath(filePath);
    dir = _path2['default'].join(dir, outputDirectory);
    state.setOutputDirectory(outputDirectory);
    extendedOutputPaths = extensions.map(function (ext) {
      return _path2['default'].format({ dir: dir, name: name, ext: ext });
    });
  }

  function expectExistenceOfExtendedOutputs() {
    for (var output of extendedOutputPaths) {
      expect(_fsPlus2['default'].existsSync(output)).toBe(true, 'Check the existence of ' + output + ' file.');
    }
  }

  describe('constructArgs', function () {
    it('produces default arguments when package has default config values', function () {
      var latexmkrcPath = _path2['default'].resolve(__dirname, '..', '..', 'resources', 'latexmkrc');
      var expectedArgs = ['-interaction=nonstopmode', '-f', '-cd', '-file-line-error', '-synctex=1', '-r "' + latexmkrcPath + '"', '-pdf', '"' + filePath + '"'];
      var args = builder.constructArgs(jobState);

      expect(args).toEqual(expectedArgs);
    });

    it('adds -g flag when rebuild is passed', function () {
      state.setShouldRebuild(true);
      expect(builder.constructArgs(jobState)).toContain('-g');
    });

    it('adds -shell-escape flag when package config value is set', function () {
      state.setEnableShellEscape(true);
      expect(builder.constructArgs(jobState)).toContain('-shell-escape');
    });

    it('disables synctex according to package config', function () {
      state.setEnableSynctex(false);
      expect(builder.constructArgs(jobState)).not.toContain('-synctex=1');
    });

    it('adds -outdir=<path> argument according to package config', function () {
      var outdir = 'bar';
      var expectedArg = '-outdir="' + outdir + '"';
      state.setOutputDirectory(outdir);

      expect(builder.constructArgs(jobState)).toContain(expectedArg);
    });

    it('adds lualatex argument according to package config', function () {
      state.setEngine('lualatex');
      expect(builder.constructArgs(jobState)).toContain('-lualatex');
    });

    it('adds xelatex argument according to package config', function () {
      state.setEngine('xelatex');
      expect(builder.constructArgs(jobState)).toContain('-xelatex');
    });

    it('adds a custom engine string according to package config', function () {
      state.setEngine('pdflatex %O %S');
      expect(builder.constructArgs(jobState)).toContain('-pdflatex="pdflatex %O %S"');
    });

    it('adds -ps and removes -pdf arguments according to package config', function () {
      state.setOutputFormat('ps');
      var args = builder.constructArgs(jobState);
      expect(args).toContain('-ps');
      expect(args).not.toContain('-pdf');
    });

    it('adds -dvi and removes -pdf arguments according to package config', function () {
      state.setOutputFormat('dvi');
      var args = builder.constructArgs(jobState);
      expect(args).toContain('-dvi');
      expect(args).not.toContain('-pdf');
    });

    it('adds latex dvipdfmx arguments according to package config', function () {
      state.setEngine('uplatex');
      state.setProducer('dvipdfmx');
      var args = builder.constructArgs(jobState);
      expect(args).toContain('-latex="uplatex"');
      expect(args).toContain('-pdfdvi -e "$dvipdf = \'dvipdfmx %O -o %D %S\';"');
      expect(args).not.toContain('-pdf');
    });

    it('adds latex dvipdf arguments according to package config', function () {
      state.setEngine('uplatex');
      state.setProducer('dvipdf');
      var args = builder.constructArgs(jobState);
      expect(args).toContain('-latex="uplatex"');
      expect(args).toContain('-pdfdvi -e "$dvipdf = \'dvipdf %O %S %D\';"');
      expect(args).not.toContain('-pdf');
    });

    it('adds latex ps arguments according to package config', function () {
      state.setEngine('uplatex');
      state.setProducer('ps2pdf');
      var args = builder.constructArgs(jobState);
      expect(args).toContain('-latex="uplatex"');
      expect(args).toContain('-pdfps');
      expect(args).not.toContain('-pdf');
    });

    it('removes latexmkrc argument according to package config', function () {
      state.setEnableExtendedBuildMode(false);
      var args = builder.constructArgs(jobState);
      var latexmkrcPath = _path2['default'].resolve(__dirname, '..', '..', 'resources', 'latexmkrc');
      expect(args).not.toContain('-r "' + latexmkrcPath + '"');
    });

    it('adds a jobname argument when passed a non-null jobname', function () {
      state.setJobNames(['foo']);
      jobState = state.getJobStates()[0];
      expect(builder.constructArgs(jobState)).toContain('-jobname="foo"');
    });
  });

  describe('run', function () {
    var exitCode = undefined;

    beforeEach(function () {
      spyOn(builder, 'logStatusCode').andCallThrough();
    });

    it('successfully executes latexmk when given a valid TeX file', function () {
      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expect(exitCode).toBe(0);
      });
    });

    it('successfully executes latexmk when given a file path containing spaces', function () {
      filePath = _path2['default'].join(fixturesPath, 'filename with spaces.tex');
      state.setFilePath(filePath);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expect(exitCode).toBe(0);
      });
    });

    it('successfully executes latexmk when given a jobname', function () {
      state.setJobNames(['foo']);
      jobState = state.getJobStates()[0];

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expect(exitCode).toBe(0);
      });
    });

    it('successfully executes latexmk when given a jobname with spaces', function () {
      state.setJobNames(['foo bar']);
      jobState = state.getJobStates()[0];

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expect(exitCode).toBe(0);
      });
    });

    it('fails with code 12 and various errors, warnings and info messages are produced in log file', function () {
      filePath = _path2['default'].join(fixturesPath, 'error-warning.tex');
      state.setFilePath(filePath);
      var subFilePath = _path2['default'].join(fixturesPath, 'sub', 'wibble.tex');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
          builder.parseLogFile(jobState);
        });
      });

      runs(function () {
        var logMessages = jobState.getLogMessages();
        var messages = [{ type: 'error', text: 'There\'s no line here to end' }, { type: 'error', text: 'Argument of \\@sect has an extra }' }, { type: 'error', text: 'Paragraph ended before \\@sect was complete' }, { type: 'error', text: 'Extra alignment tab has been changed to \\cr' }, { type: 'warning', text: 'Reference `tab:snafu\' on page 1 undefined' }, { type: 'error', text: 'Class foo: Significant class issue' }, { type: 'warning', text: 'Class foo: Class issue' }, { type: 'warning', text: 'Class foo: Nebulous class issue' }, { type: 'info', text: 'Class foo: Insignificant class issue' }, { type: 'error', text: 'Package bar: Significant package issue' }, { type: 'warning', text: 'Package bar: Package issue' }, { type: 'warning', text: 'Package bar: Nebulous package issue' }, { type: 'info', text: 'Package bar: Insignificant package issue' }, { type: 'warning', text: 'There were undefined references' }];

        // Loop through the required messages and make sure that each one appears
        // in the parsed log output. We do not do a direct one-to-one comparison
        // since there will likely be font messages which may be dependent on
        // which TeX distribution is being used or which fonts are currently
        // installed.

        var _loop = function (message) {
          expect(logMessages.some(function (logMessage) {
            return message.type === logMessage.type && message.text === logMessage.text;
          })).toBe(true, 'Message = ' + message.text);
        };

        for (var message of messages) {
          _loop(message);
        }

        expect(logMessages.every(function (logMessage) {
          return !logMessage.filePath || logMessage.filePath === filePath || logMessage.filePath === subFilePath;
        })).toBe(true, 'Incorrect file path resolution in log.');

        expect(builder.logStatusCode).toHaveBeenCalled();
        expect(exitCode).toBe(12);
      });
    });

    it('fails to execute latexmk when given invalid arguments', function () {
      spyOn(builder, 'constructArgs').andReturn(['-invalid-argument']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(10);
        expect(builder.logStatusCode).toHaveBeenCalled();
      });
    });

    it('fails to execute latexmk when given invalid file path', function () {
      state.setFilePath(_path2['default'].join(fixturesPath, 'foo.tex'));
      var args = builder.constructArgs(jobState);

      // Need to remove the 'force' flag to trigger the desired failure.
      var removed = args.splice(1, 1);
      expect(removed).toEqual(['-f']);

      spyOn(builder, 'constructArgs').andReturn(args);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(11);
        expect(builder.logStatusCode).toHaveBeenCalled();
      });
    });

    it('successfully creates asymptote files when using the asymptote package', function () {
      initializeExtendedBuild('asymptote-test', ['-1.tex', '.pdf']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates asymptote files when using the asymptote package with an output directory', function () {
      initializeExtendedBuild('asymptote-test', ['-1.tex', '.pdf'], 'build');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates glossary files when using the glossaries package', function () {
      initializeExtendedBuild('glossaries-test', ['.acn', '.acr', '.glo', '.gls', '.pdf']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates glossary files when using the glossaries package with an output directory', function () {
      initializeExtendedBuild('glossaries-test', ['.acn', '.acr', '.glo', '.gls', '.pdf'], 'build');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates metapost files when using the feynmp package', function () {
      initializeExtendedBuild('mpost-test', ['-feynmp.1', '.pdf']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates metapost files when using the feynmp package with an output directory', function () {
      initializeExtendedBuild('mpost-test', ['-feynmp.1', '.pdf'], 'build');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates nomenclature files when using the nomencl package', function () {
      initializeExtendedBuild('nomencl-test', ['.nlo', '.nls', '.pdf']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates nomenclature files when using the nomencl package with an output directory', function () {
      initializeExtendedBuild('nomencl-test', ['.nlo', '.nls', '.pdf'], 'build');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates index files when using the index package', function () {
      initializeExtendedBuild('index-test', ['.idx', '.ind', '.ldx', '.lnd', '.pdf']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates index files when using the index package with an output directory', function () {
      initializeExtendedBuild('index-test', ['.idx', '.ind', '.ldx', '.lnd', '.pdf'], 'build');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    // Sage only runs in a VM on Windows and installing Sage at 1GB for two tests
    // is excessive.
    if (process.platform === 'win32' || process.env.CI) return;

    it('successfully creates SageTeX files when using the sagetex package', function () {
      initializeExtendedBuild('sagetex-test', ['.sagetex.sage', '.sagetex.sout', '.pdf']);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });

    it('successfully creates SageTeX files when using the sagetex package with an output directory', function () {
      initializeExtendedBuild('sagetex-test', ['.sagetex.sage', '.sagetex.sout', '.pdf'], 'build');

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expectExistenceOfExtendedOutputs();
      });
    });
  });

  describe('canProcess', function () {
    it('returns true when given a file path with a .tex extension', function () {
      var canProcess = _libBuildersLatexmk2['default'].canProcess(state);
      expect(canProcess).toBe(true);
    });
  });

  describe('logStatusCode', function () {
    it('handles latexmk specific status codes', function () {
      var messages = [];
      spyOn(latex.log, 'error').andCallFake(function (message) {
        return messages.push(message);
      });

      var statusCodes = [10, 11, 12, 13, 20];
      statusCodes.forEach(function (statusCode) {
        return builder.logStatusCode(statusCode);
      });

      var startsWithPrefix = function startsWithPrefix(str) {
        return str.startsWith('latexmk:');
      };

      expect(messages.length).toBe(statusCodes.length);
      expect(messages.filter(startsWithPrefix).length).toBe(statusCodes.length);
    });

    it('passes through to superclass when given non-latexmk status codes', function () {
      var stderr = 'wibble';
      var superclass = Object.getPrototypeOf(builder);
      spyOn(superclass, 'logStatusCode').andCallThrough();

      var statusCode = 1;
      builder.logStatusCode(statusCode, stderr);

      expect(superclass.logStatusCode).toHaveBeenCalledWith(statusCode, stderr);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvYnVpbGRlcnMvbGF0ZXhtay1zcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7MkJBRW9CLGlCQUFpQjs7OztvQkFDcEIsTUFBTTs7OztrQ0FDSSw0QkFBNEI7Ozs7c0JBQ3hDLFNBQVM7Ozs7NkJBQ0QsdUJBQXVCOzs7O0FBRTlDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxZQUFNO0FBQy9CLE1BQUksT0FBTyxZQUFBO01BQUUsWUFBWSxZQUFBO01BQUUsUUFBUSxZQUFBO01BQUUsbUJBQW1CLFlBQUE7TUFBRSxLQUFLLFlBQUE7TUFBRSxRQUFRLFlBQUEsQ0FBQTs7QUFFekUsWUFBVSxDQUFDLFlBQU07QUFDZixtQkFBZSxDQUFDLFlBQU07QUFDcEIsYUFBTyx5QkFBUSxnQkFBZ0IsRUFBRSxDQUFBO0tBQ2xDLENBQUMsQ0FBQTtBQUNGLFdBQU8sR0FBRyxxQ0FBb0IsQ0FBQTtBQUM5QixnQkFBWSxHQUFHLHlCQUFRLGFBQWEsRUFBRSxDQUFBO0FBQ3RDLFlBQVEsR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQzlDLFNBQUssR0FBRywrQkFBZSxRQUFRLENBQUMsQ0FBQTtBQUNoQyxTQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQzNCLFNBQUssQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDNUIsU0FBSyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQzVCLFNBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUM1QixTQUFLLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDdEMsWUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUNuQyxDQUFDLENBQUE7O0FBRUYsV0FBUyx1QkFBdUIsQ0FBRSxJQUFJLEVBQUUs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TSxDQUFDLENBQUE7O0FBRXpDLFlBQU0sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0tBQzFFLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTtDQUNILENBQUMsQ0FBQSIsImZpbGUiOiIvaG9tZS9jaHJpcy8uYXRvbS9wYWNrYWdlcy9sYXRleC9zcGVjL2J1aWxkZXJzL2xhdGV4bWstc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IGhlbHBlcnMgZnJvbSAnLi4vc3BlYy1oZWxwZXJzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBMYXRleG1rQnVpbGRlciBmcm9tICcuLi8uLi9saWIvYnVpbGRlcnMvbGF0ZXhtaydcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJ1xuaW1wb3J0IEJ1aWxkU3RhdGUgZnJvbSAnLi4vLi4vbGliL2J1aWxkLXN0YXRlJ1xuXG5kZXNjcmliZSgnTGF0ZXhta0J1aWxkZXInLCAoKSA9PiB7XG4gIGxldCBidWlsZGVyLCBmaXh0dXJlc1BhdGgsIGZpbGVQYXRoLCBleHRlbmRlZE91dHB1dFBhdGhzLCBzdGF0ZSwgam9iU3RhdGVcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgcmV0dXJuIGhlbHBlcnMuYWN0aXZhdGVQYWNrYWdlcygpXG4gICAgfSlcbiAgICBidWlsZGVyID0gbmV3IExhdGV4bWtCdWlsZGVyKClcbiAgICBmaXh0dXJlc1BhdGggPSBoZWxwZXJzLmNsb25lRml4dHVyZXMoKVxuICAgIGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2ZpbGUudGV4JylcbiAgICBzdGF0ZSA9IG5ldyBCdWlsZFN0YXRlKGZpbGVQYXRoKVxuICAgIHN0YXRlLnNldEVuZ2luZSgncGRmbGF0ZXgnKVxuICAgIHN0YXRlLnNldE91dHB1dEZvcm1hdCgncGRmJylcbiAgICBzdGF0ZS5zZXRPdXRwdXREaXJlY3RvcnkoJycpXG4gICAgc3RhdGUuc2V0RW5hYmxlU3luY3RleCh0cnVlKVxuICAgIHN0YXRlLnNldEVuYWJsZUV4dGVuZGVkQnVpbGRNb2RlKHRydWUpXG4gICAgam9iU3RhdGUgPSBzdGF0ZS5nZXRKb2JTdGF0ZXMoKVswXVxuICB9KVxuXG4gIGZ1bmN0aW9uIGluaXRpYWxpemVFeHRlbmRlZEJ1aWxkIChuYW1lLCBleHRlbnNpb25zLCBvdXRwdXREaXJlY3RvcnkgPSAnJykge1xuICAgIGxldCBkaXIgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnbGF0ZXhtaycpXG4gICAgZmlsZVBhdGggPSBwYXRoLmZvcm1hdCh7IGRpciwgbmFtZSwgZXh0OiAnLnRleCcgfSlcbiAgICBzdGF0ZS5zZXRGaWxlUGF0aChmaWxlUGF0aClcbiAgICBkaXIgPSBwYXRoLmpvaW4oZGlyLCBvdXRwdXREaXJlY3RvcnkpXG4gICAgc3RhdGUuc2V0T3V0cHV0RGlyZWN0b3J5KG91dHB1dERpcmVjdG9yeSlcbiAgICBleHRlbmRlZE91dHB1dFBhdGhzID0gZXh0ZW5zaW9ucy5tYXAoZXh0ID0+IHBhdGguZm9ybWF0KHsgZGlyLCBuYW1lLCBleHQgfSkpXG4gIH1cblxuICBmdW5jdGlvbiBleHBlY3RFeGlzdGVuY2VPZkV4dGVuZGVkT3V0cHV0cyAoKSB7XG4gICAgZm9yIChjb25zdCBvdXRwdXQgb2YgZXh0ZW5kZWRPdXRwdXRQYXRocykge1xuICAgICAgZXhwZWN0KGZzLmV4aXN0c1N5bmMob3V0cHV0KSkudG9CZSh0cnVlLCBgQ2hlY2sgdGhlIGV4aXN0ZW5jZSBvZiAke291dHB1dH0gZmlsZS5gKVxuICAgIH1cbiAgfVxuXG4gIGRlc2NyaWJlKCdjb25zdHJ1Y3RBcmdzJywgKCkgPT4ge1xuICAgIGl0KCdwcm9kdWNlcyBkZWZhdWx0IGFyZ3VtZW50cyB3aGVuIHBhY2thZ2UgaGFzIGRlZmF1bHQgY29uZmlnIHZhbHVlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGxhdGV4bWtyY1BhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncmVzb3VyY2VzJywgJ2xhdGV4bWtyYycpXG4gICAgICBjb25zdCBleHBlY3RlZEFyZ3MgPSBbXG4gICAgICAgICctaW50ZXJhY3Rpb249bm9uc3RvcG1vZGUnLFxuICAgICAgICAnLWYnLFxuICAgICAgICAnLWNkJyxcbiAgICAgICAgJy1maWxlLWxpbmUtZXJyb3InLFxuICAgICAgICAnLXN5bmN0ZXg9MScsXG4gICAgICAgIGAtciBcIiR7bGF0ZXhta3JjUGF0aH1cImAsXG4gICAgICAgICctcGRmJyxcbiAgICAgICAgYFwiJHtmaWxlUGF0aH1cImBcbiAgICAgIF1cbiAgICAgIGNvbnN0IGFyZ3MgPSBidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpXG5cbiAgICAgIGV4cGVjdChhcmdzKS50b0VxdWFsKGV4cGVjdGVkQXJncylcbiAgICB9KVxuXG4gICAgaXQoJ2FkZHMgLWcgZmxhZyB3aGVuIHJlYnVpbGQgaXMgcGFzc2VkJywgKCkgPT4ge1xuICAgICAgc3RhdGUuc2V0U2hvdWxkUmVidWlsZCh0cnVlKVxuICAgICAgZXhwZWN0KGJ1aWxkZXIuY29uc3RydWN0QXJncyhqb2JTdGF0ZSkpLnRvQ29udGFpbignLWcnKVxuICAgIH0pXG5cbiAgICBpdCgnYWRkcyAtc2hlbGwtZXNjYXBlIGZsYWcgd2hlbiBwYWNrYWdlIGNvbmZpZyB2YWx1ZSBpcyBzZXQnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRFbmFibGVTaGVsbEVzY2FwZSh0cnVlKVxuICAgICAgZXhwZWN0KGJ1aWxkZXIuY29uc3RydWN0QXJncyhqb2JTdGF0ZSkpLnRvQ29udGFpbignLXNoZWxsLWVzY2FwZScpXG4gICAgfSlcblxuICAgIGl0KCdkaXNhYmxlcyBzeW5jdGV4IGFjY29yZGluZyB0byBwYWNrYWdlIGNvbmZpZycsICgpID0+IHtcbiAgICAgIHN0YXRlLnNldEVuYWJsZVN5bmN0ZXgoZmFsc2UpXG4gICAgICBleHBlY3QoYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKSkubm90LnRvQ29udGFpbignLXN5bmN0ZXg9MScpXG4gICAgfSlcblxuICAgIGl0KCdhZGRzIC1vdXRkaXI9PHBhdGg+IGFyZ3VtZW50IGFjY29yZGluZyB0byBwYWNrYWdlIGNvbmZpZycsICgpID0+IHtcbiAgICAgIGNvbnN0IG91dGRpciA9ICdiYXInXG4gICAgICBjb25zdCBleHBlY3RlZEFyZyA9IGAtb3V0ZGlyPVwiJHtvdXRkaXJ9XCJgXG4gICAgICBzdGF0ZS5zZXRPdXRwdXREaXJlY3Rvcnkob3V0ZGlyKVxuXG4gICAgICBleHBlY3QoYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKSkudG9Db250YWluKGV4cGVjdGVkQXJnKVxuICAgIH0pXG5cbiAgICBpdCgnYWRkcyBsdWFsYXRleCBhcmd1bWVudCBhY2NvcmRpbmcgdG8gcGFja2FnZSBjb25maWcnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRFbmdpbmUoJ2x1YWxhdGV4JylcbiAgICAgIGV4cGVjdChidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpKS50b0NvbnRhaW4oJy1sdWFsYXRleCcpXG4gICAgfSlcblxuICAgIGl0KCdhZGRzIHhlbGF0ZXggYXJndW1lbnQgYWNjb3JkaW5nIHRvIHBhY2thZ2UgY29uZmlnJywgKCkgPT4ge1xuICAgICAgc3RhdGUuc2V0RW5naW5lKCd4ZWxhdGV4JylcbiAgICAgIGV4cGVjdChidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpKS50b0NvbnRhaW4oJy14ZWxhdGV4JylcbiAgICB9KVxuXG4gICAgaXQoJ2FkZHMgYSBjdXN0b20gZW5naW5lIHN0cmluZyBhY2NvcmRpbmcgdG8gcGFja2FnZSBjb25maWcnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRFbmdpbmUoJ3BkZmxhdGV4ICVPICVTJylcbiAgICAgIGV4cGVjdChidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpKS50b0NvbnRhaW4oJy1wZGZsYXRleD1cInBkZmxhdGV4ICVPICVTXCInKVxuICAgIH0pXG5cbiAgICBpdCgnYWRkcyAtcHMgYW5kIHJlbW92ZXMgLXBkZiBhcmd1bWVudHMgYWNjb3JkaW5nIHRvIHBhY2thZ2UgY29uZmlnJywgKCkgPT4ge1xuICAgICAgc3RhdGUuc2V0T3V0cHV0Rm9ybWF0KCdwcycpXG4gICAgICBjb25zdCBhcmdzID0gYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKVxuICAgICAgZXhwZWN0KGFyZ3MpLnRvQ29udGFpbignLXBzJylcbiAgICAgIGV4cGVjdChhcmdzKS5ub3QudG9Db250YWluKCctcGRmJylcbiAgICB9KVxuXG4gICAgaXQoJ2FkZHMgLWR2aSBhbmQgcmVtb3ZlcyAtcGRmIGFyZ3VtZW50cyBhY2NvcmRpbmcgdG8gcGFja2FnZSBjb25maWcnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRPdXRwdXRGb3JtYXQoJ2R2aScpXG4gICAgICBjb25zdCBhcmdzID0gYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKVxuICAgICAgZXhwZWN0KGFyZ3MpLnRvQ29udGFpbignLWR2aScpXG4gICAgICBleHBlY3QoYXJncykubm90LnRvQ29udGFpbignLXBkZicpXG4gICAgfSlcblxuICAgIGl0KCdhZGRzIGxhdGV4IGR2aXBkZm14IGFyZ3VtZW50cyBhY2NvcmRpbmcgdG8gcGFja2FnZSBjb25maWcnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRFbmdpbmUoJ3VwbGF0ZXgnKVxuICAgICAgc3RhdGUuc2V0UHJvZHVjZXIoJ2R2aXBkZm14JylcbiAgICAgIGNvbnN0IGFyZ3MgPSBidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpXG4gICAgICBleHBlY3QoYXJncykudG9Db250YWluKCctbGF0ZXg9XCJ1cGxhdGV4XCInKVxuICAgICAgZXhwZWN0KGFyZ3MpLnRvQ29udGFpbignLXBkZmR2aSAtZSBcIiRkdmlwZGYgPSBcXCdkdmlwZGZteCAlTyAtbyAlRCAlU1xcJztcIicpXG4gICAgICBleHBlY3QoYXJncykubm90LnRvQ29udGFpbignLXBkZicpXG4gICAgfSlcblxuICAgIGl0KCdhZGRzIGxhdGV4IGR2aXBkZiBhcmd1bWVudHMgYWNjb3JkaW5nIHRvIHBhY2thZ2UgY29uZmlnJywgKCkgPT4ge1xuICAgICAgc3RhdGUuc2V0RW5naW5lKCd1cGxhdGV4JylcbiAgICAgIHN0YXRlLnNldFByb2R1Y2VyKCdkdmlwZGYnKVxuICAgICAgY29uc3QgYXJncyA9IGJ1aWxkZXIuY29uc3RydWN0QXJncyhqb2JTdGF0ZSlcbiAgICAgIGV4cGVjdChhcmdzKS50b0NvbnRhaW4oJy1sYXRleD1cInVwbGF0ZXhcIicpXG4gICAgICBleHBlY3QoYXJncykudG9Db250YWluKCctcGRmZHZpIC1lIFwiJGR2aXBkZiA9IFxcJ2R2aXBkZiAlTyAlUyAlRFxcJztcIicpXG4gICAgICBleHBlY3QoYXJncykubm90LnRvQ29udGFpbignLXBkZicpXG4gICAgfSlcblxuICAgIGl0KCdhZGRzIGxhdGV4IHBzIGFyZ3VtZW50cyBhY2NvcmRpbmcgdG8gcGFja2FnZSBjb25maWcnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRFbmdpbmUoJ3VwbGF0ZXgnKVxuICAgICAgc3RhdGUuc2V0UHJvZHVjZXIoJ3BzMnBkZicpXG4gICAgICBjb25zdCBhcmdzID0gYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKVxuICAgICAgZXhwZWN0KGFyZ3MpLnRvQ29udGFpbignLWxhdGV4PVwidXBsYXRleFwiJylcbiAgICAgIGV4cGVjdChhcmdzKS50b0NvbnRhaW4oJy1wZGZwcycpXG4gICAgICBleHBlY3QoYXJncykubm90LnRvQ29udGFpbignLXBkZicpXG4gICAgfSlcblxuICAgIGl0KCdyZW1vdmVzIGxhdGV4bWtyYyBhcmd1bWVudCBhY2NvcmRpbmcgdG8gcGFja2FnZSBjb25maWcnLCAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZXRFbmFibGVFeHRlbmRlZEJ1aWxkTW9kZShmYWxzZSlcbiAgICAgIGNvbnN0IGFyZ3MgPSBidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpXG4gICAgICBjb25zdCBsYXRleG1rcmNQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3Jlc291cmNlcycsICdsYXRleG1rcmMnKVxuICAgICAgZXhwZWN0KGFyZ3MpLm5vdC50b0NvbnRhaW4oYC1yIFwiJHtsYXRleG1rcmNQYXRofVwiYClcbiAgICB9KVxuXG4gICAgaXQoJ2FkZHMgYSBqb2JuYW1lIGFyZ3VtZW50IHdoZW4gcGFzc2VkIGEgbm9uLW51bGwgam9ibmFtZScsICgpID0+IHtcbiAgICAgIHN0YXRlLnNldEpvYk5hbWVzKFsnZm9vJ10pXG4gICAgICBqb2JTdGF0ZSA9IHN0YXRlLmdldEpvYlN0YXRlcygpWzBdXG4gICAgICBleHBlY3QoYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKSkudG9Db250YWluKCctam9ibmFtZT1cImZvb1wiJylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdydW4nLCAoKSA9PiB7XG4gICAgbGV0IGV4aXRDb2RlXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNweU9uKGJ1aWxkZXIsICdsb2dTdGF0dXNDb2RlJykuYW5kQ2FsbFRocm91Z2goKVxuICAgIH0pXG5cbiAgICBpdCgnc3VjY2Vzc2Z1bGx5IGV4ZWN1dGVzIGxhdGV4bWsgd2hlbiBnaXZlbiBhIHZhbGlkIFRlWCBmaWxlJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIucnVuKGpvYlN0YXRlKS50aGVuKGNvZGUgPT4geyBleGl0Q29kZSA9IGNvZGUgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3N1Y2Nlc3NmdWxseSBleGVjdXRlcyBsYXRleG1rIHdoZW4gZ2l2ZW4gYSBmaWxlIHBhdGggY29udGFpbmluZyBzcGFjZXMnLCAoKSA9PiB7XG4gICAgICBmaWxlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdmaWxlbmFtZSB3aXRoIHNwYWNlcy50ZXgnKVxuICAgICAgc3RhdGUuc2V0RmlsZVBhdGgoZmlsZVBhdGgpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoZXhpdENvZGUpLnRvQmUoMClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgZXhlY3V0ZXMgbGF0ZXhtayB3aGVuIGdpdmVuIGEgam9ibmFtZScsICgpID0+IHtcbiAgICAgIHN0YXRlLnNldEpvYk5hbWVzKFsnZm9vJ10pXG4gICAgICBqb2JTdGF0ZSA9IHN0YXRlLmdldEpvYlN0YXRlcygpWzBdXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoZXhpdENvZGUpLnRvQmUoMClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgZXhlY3V0ZXMgbGF0ZXhtayB3aGVuIGdpdmVuIGEgam9ibmFtZSB3aXRoIHNwYWNlcycsICgpID0+IHtcbiAgICAgIHN0YXRlLnNldEpvYk5hbWVzKFsnZm9vIGJhciddKVxuICAgICAgam9iU3RhdGUgPSBzdGF0ZS5nZXRKb2JTdGF0ZXMoKVswXVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDApXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZmFpbHMgd2l0aCBjb2RlIDEyIGFuZCB2YXJpb3VzIGVycm9ycywgd2FybmluZ3MgYW5kIGluZm8gbWVzc2FnZXMgYXJlIHByb2R1Y2VkIGluIGxvZyBmaWxlJywgKCkgPT4ge1xuICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZXJyb3Itd2FybmluZy50ZXgnKVxuICAgICAgc3RhdGUuc2V0RmlsZVBhdGgoZmlsZVBhdGgpXG4gICAgICBjb25zdCBzdWJGaWxlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdzdWInLCAnd2liYmxlLnRleCcpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHtcbiAgICAgICAgICBleGl0Q29kZSA9IGNvZGVcbiAgICAgICAgICBidWlsZGVyLnBhcnNlTG9nRmlsZShqb2JTdGF0ZSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBjb25zdCBsb2dNZXNzYWdlcyA9IGpvYlN0YXRlLmdldExvZ01lc3NhZ2VzKClcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBbXG4gICAgICAgICAgeyB0eXBlOiAnZXJyb3InLCB0ZXh0OiAnVGhlcmVcXCdzIG5vIGxpbmUgaGVyZSB0byBlbmQnIH0sXG4gICAgICAgICAgeyB0eXBlOiAnZXJyb3InLCB0ZXh0OiAnQXJndW1lbnQgb2YgXFxcXEBzZWN0IGhhcyBhbiBleHRyYSB9JyB9LFxuICAgICAgICAgIHsgdHlwZTogJ2Vycm9yJywgdGV4dDogJ1BhcmFncmFwaCBlbmRlZCBiZWZvcmUgXFxcXEBzZWN0IHdhcyBjb21wbGV0ZScgfSxcbiAgICAgICAgICB7IHR5cGU6ICdlcnJvcicsIHRleHQ6ICdFeHRyYSBhbGlnbm1lbnQgdGFiIGhhcyBiZWVuIGNoYW5nZWQgdG8gXFxcXGNyJyB9LFxuICAgICAgICAgIHsgdHlwZTogJ3dhcm5pbmcnLCB0ZXh0OiAnUmVmZXJlbmNlIGB0YWI6c25hZnVcXCcgb24gcGFnZSAxIHVuZGVmaW5lZCcgfSxcbiAgICAgICAgICB7IHR5cGU6ICdlcnJvcicsIHRleHQ6ICdDbGFzcyBmb286IFNpZ25pZmljYW50IGNsYXNzIGlzc3VlJyB9LFxuICAgICAgICAgIHsgdHlwZTogJ3dhcm5pbmcnLCB0ZXh0OiAnQ2xhc3MgZm9vOiBDbGFzcyBpc3N1ZScgfSxcbiAgICAgICAgICB7IHR5cGU6ICd3YXJuaW5nJywgdGV4dDogJ0NsYXNzIGZvbzogTmVidWxvdXMgY2xhc3MgaXNzdWUnIH0sXG4gICAgICAgICAgeyB0eXBlOiAnaW5mbycsIHRleHQ6ICdDbGFzcyBmb286IEluc2lnbmlmaWNhbnQgY2xhc3MgaXNzdWUnIH0sXG4gICAgICAgICAgeyB0eXBlOiAnZXJyb3InLCB0ZXh0OiAnUGFja2FnZSBiYXI6IFNpZ25pZmljYW50IHBhY2thZ2UgaXNzdWUnIH0sXG4gICAgICAgICAgeyB0eXBlOiAnd2FybmluZycsIHRleHQ6ICdQYWNrYWdlIGJhcjogUGFja2FnZSBpc3N1ZScgfSxcbiAgICAgICAgICB7IHR5cGU6ICd3YXJuaW5nJywgdGV4dDogJ1BhY2thZ2UgYmFyOiBOZWJ1bG91cyBwYWNrYWdlIGlzc3VlJyB9LFxuICAgICAgICAgIHsgdHlwZTogJ2luZm8nLCB0ZXh0OiAnUGFja2FnZSBiYXI6IEluc2lnbmlmaWNhbnQgcGFja2FnZSBpc3N1ZScgfSxcbiAgICAgICAgICB7IHR5cGU6ICd3YXJuaW5nJywgdGV4dDogJ1RoZXJlIHdlcmUgdW5kZWZpbmVkIHJlZmVyZW5jZXMnIH1cbiAgICAgICAgXVxuXG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgcmVxdWlyZWQgbWVzc2FnZXMgYW5kIG1ha2Ugc3VyZSB0aGF0IGVhY2ggb25lIGFwcGVhcnNcbiAgICAgICAgLy8gaW4gdGhlIHBhcnNlZCBsb2cgb3V0cHV0LiBXZSBkbyBub3QgZG8gYSBkaXJlY3Qgb25lLXRvLW9uZSBjb21wYXJpc29uXG4gICAgICAgIC8vIHNpbmNlIHRoZXJlIHdpbGwgbGlrZWx5IGJlIGZvbnQgbWVzc2FnZXMgd2hpY2ggbWF5IGJlIGRlcGVuZGVudCBvblxuICAgICAgICAvLyB3aGljaCBUZVggZGlzdHJpYnV0aW9uIGlzIGJlaW5nIHVzZWQgb3Igd2hpY2ggZm9udHMgYXJlIGN1cnJlbnRseVxuICAgICAgICAvLyBpbnN0YWxsZWQuXG4gICAgICAgIGZvciAoY29uc3QgbWVzc2FnZSBvZiBtZXNzYWdlcykge1xuICAgICAgICAgIGV4cGVjdChsb2dNZXNzYWdlcy5zb21lKFxuICAgICAgICAgICAgbG9nTWVzc2FnZSA9PiBtZXNzYWdlLnR5cGUgPT09IGxvZ01lc3NhZ2UudHlwZSAmJiBtZXNzYWdlLnRleHQgPT09IGxvZ01lc3NhZ2UudGV4dCkpLnRvQmUodHJ1ZSwgYE1lc3NhZ2UgPSAke21lc3NhZ2UudGV4dH1gKVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KGxvZ01lc3NhZ2VzLmV2ZXJ5KFxuICAgICAgICAgIGxvZ01lc3NhZ2UgPT4gIWxvZ01lc3NhZ2UuZmlsZVBhdGggfHwgbG9nTWVzc2FnZS5maWxlUGF0aCA9PT0gZmlsZVBhdGggfHwgbG9nTWVzc2FnZS5maWxlUGF0aCA9PT0gc3ViRmlsZVBhdGgpKVxuICAgICAgICAgIC50b0JlKHRydWUsICdJbmNvcnJlY3QgZmlsZSBwYXRoIHJlc29sdXRpb24gaW4gbG9nLicpXG5cbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgxMilcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdmYWlscyB0byBleGVjdXRlIGxhdGV4bWsgd2hlbiBnaXZlbiBpbnZhbGlkIGFyZ3VtZW50cycsICgpID0+IHtcbiAgICAgIHNweU9uKGJ1aWxkZXIsICdjb25zdHJ1Y3RBcmdzJykuYW5kUmV0dXJuKFsnLWludmFsaWQtYXJndW1lbnQnXSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIucnVuKGpvYlN0YXRlKS50aGVuKGNvZGUgPT4geyBleGl0Q29kZSA9IGNvZGUgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoZXhpdENvZGUpLnRvQmUoMTApXG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ2ZhaWxzIHRvIGV4ZWN1dGUgbGF0ZXhtayB3aGVuIGdpdmVuIGludmFsaWQgZmlsZSBwYXRoJywgKCkgPT4ge1xuICAgICAgc3RhdGUuc2V0RmlsZVBhdGgocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2Zvby50ZXgnKSlcbiAgICAgIGNvbnN0IGFyZ3MgPSBidWlsZGVyLmNvbnN0cnVjdEFyZ3Moam9iU3RhdGUpXG5cbiAgICAgIC8vIE5lZWQgdG8gcmVtb3ZlIHRoZSAnZm9yY2UnIGZsYWcgdG8gdHJpZ2dlciB0aGUgZGVzaXJlZCBmYWlsdXJlLlxuICAgICAgY29uc3QgcmVtb3ZlZCA9IGFyZ3Muc3BsaWNlKDEsIDEpXG4gICAgICBleHBlY3QocmVtb3ZlZCkudG9FcXVhbChbJy1mJ10pXG5cbiAgICAgIHNweU9uKGJ1aWxkZXIsICdjb25zdHJ1Y3RBcmdzJykuYW5kUmV0dXJuKGFyZ3MpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDExKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgY3JlYXRlcyBhc3ltcHRvdGUgZmlsZXMgd2hlbiB1c2luZyB0aGUgYXN5bXB0b3RlIHBhY2thZ2UnLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplRXh0ZW5kZWRCdWlsZCgnYXN5bXB0b3RlLXRlc3QnLFxuICAgICAgICBbJy0xLnRleCcsICcucGRmJ10pXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDApXG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0RXhpc3RlbmNlT2ZFeHRlbmRlZE91dHB1dHMoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3N1Y2Nlc3NmdWxseSBjcmVhdGVzIGFzeW1wdG90ZSBmaWxlcyB3aGVuIHVzaW5nIHRoZSBhc3ltcHRvdGUgcGFja2FnZSB3aXRoIGFuIG91dHB1dCBkaXJlY3RvcnknLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplRXh0ZW5kZWRCdWlsZCgnYXN5bXB0b3RlLXRlc3QnLFxuICAgICAgICBbJy0xLnRleCcsICcucGRmJ10sXG4gICAgICAgICdidWlsZCcpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDApXG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0RXhpc3RlbmNlT2ZFeHRlbmRlZE91dHB1dHMoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3N1Y2Nlc3NmdWxseSBjcmVhdGVzIGdsb3NzYXJ5IGZpbGVzIHdoZW4gdXNpbmcgdGhlIGdsb3NzYXJpZXMgcGFja2FnZScsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVFeHRlbmRlZEJ1aWxkKCdnbG9zc2FyaWVzLXRlc3QnLFxuICAgICAgICBbJy5hY24nLCAnLmFjcicsICcuZ2xvJywgJy5nbHMnLCAnLnBkZiddKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdEV4aXN0ZW5jZU9mRXh0ZW5kZWRPdXRwdXRzKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgY3JlYXRlcyBnbG9zc2FyeSBmaWxlcyB3aGVuIHVzaW5nIHRoZSBnbG9zc2FyaWVzIHBhY2thZ2Ugd2l0aCBhbiBvdXRwdXQgZGlyZWN0b3J5JywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZUV4dGVuZGVkQnVpbGQoJ2dsb3NzYXJpZXMtdGVzdCcsXG4gICAgICAgIFsnLmFjbicsICcuYWNyJywgJy5nbG8nLCAnLmdscycsICcucGRmJ10sXG4gICAgICAgICdidWlsZCcpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDApXG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0RXhpc3RlbmNlT2ZFeHRlbmRlZE91dHB1dHMoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3N1Y2Nlc3NmdWxseSBjcmVhdGVzIG1ldGFwb3N0IGZpbGVzIHdoZW4gdXNpbmcgdGhlIGZleW5tcCBwYWNrYWdlJywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZUV4dGVuZGVkQnVpbGQoJ21wb3N0LXRlc3QnLFxuICAgICAgICBbJy1mZXlubXAuMScsICcucGRmJ10pXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBidWlsZGVyLnJ1bihqb2JTdGF0ZSkudGhlbihjb2RlID0+IHsgZXhpdENvZGUgPSBjb2RlIH0pXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDApXG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0RXhpc3RlbmNlT2ZFeHRlbmRlZE91dHB1dHMoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3N1Y2Nlc3NmdWxseSBjcmVhdGVzIG1ldGFwb3N0IGZpbGVzIHdoZW4gdXNpbmcgdGhlIGZleW5tcCBwYWNrYWdlIHdpdGggYW4gb3V0cHV0IGRpcmVjdG9yeScsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVFeHRlbmRlZEJ1aWxkKCdtcG9zdC10ZXN0JyxcbiAgICAgICAgWyctZmV5bm1wLjEnLCAnLnBkZiddLFxuICAgICAgICAnYnVpbGQnKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdEV4aXN0ZW5jZU9mRXh0ZW5kZWRPdXRwdXRzKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgY3JlYXRlcyBub21lbmNsYXR1cmUgZmlsZXMgd2hlbiB1c2luZyB0aGUgbm9tZW5jbCBwYWNrYWdlJywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZUV4dGVuZGVkQnVpbGQoJ25vbWVuY2wtdGVzdCcsXG4gICAgICAgIFsnLm5sbycsICcubmxzJywgJy5wZGYnXSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIucnVuKGpvYlN0YXRlKS50aGVuKGNvZGUgPT4geyBleGl0Q29kZSA9IGNvZGUgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoZXhpdENvZGUpLnRvQmUoMClcbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3RFeGlzdGVuY2VPZkV4dGVuZGVkT3V0cHV0cygpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc3VjY2Vzc2Z1bGx5IGNyZWF0ZXMgbm9tZW5jbGF0dXJlIGZpbGVzIHdoZW4gdXNpbmcgdGhlIG5vbWVuY2wgcGFja2FnZSB3aXRoIGFuIG91dHB1dCBkaXJlY3RvcnknLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplRXh0ZW5kZWRCdWlsZCgnbm9tZW5jbC10ZXN0JyxcbiAgICAgICAgWycubmxvJywgJy5ubHMnLCAnLnBkZiddLFxuICAgICAgICAnYnVpbGQnKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdEV4aXN0ZW5jZU9mRXh0ZW5kZWRPdXRwdXRzKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgY3JlYXRlcyBpbmRleCBmaWxlcyB3aGVuIHVzaW5nIHRoZSBpbmRleCBwYWNrYWdlJywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZUV4dGVuZGVkQnVpbGQoJ2luZGV4LXRlc3QnLFxuICAgICAgICBbJy5pZHgnLCAnLmluZCcsICcubGR4JywgJy5sbmQnLCAnLnBkZiddKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdEV4aXN0ZW5jZU9mRXh0ZW5kZWRPdXRwdXRzKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgY3JlYXRlcyBpbmRleCBmaWxlcyB3aGVuIHVzaW5nIHRoZSBpbmRleCBwYWNrYWdlIHdpdGggYW4gb3V0cHV0IGRpcmVjdG9yeScsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVFeHRlbmRlZEJ1aWxkKCdpbmRleC10ZXN0JyxcbiAgICAgICAgWycuaWR4JywgJy5pbmQnLCAnLmxkeCcsICcubG5kJywgJy5wZGYnXSxcbiAgICAgICAgJ2J1aWxkJylcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIucnVuKGpvYlN0YXRlKS50aGVuKGNvZGUgPT4geyBleGl0Q29kZSA9IGNvZGUgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoZXhpdENvZGUpLnRvQmUoMClcbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3RFeGlzdGVuY2VPZkV4dGVuZGVkT3V0cHV0cygpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICAvLyBTYWdlIG9ubHkgcnVucyBpbiBhIFZNIG9uIFdpbmRvd3MgYW5kIGluc3RhbGxpbmcgU2FnZSBhdCAxR0IgZm9yIHR3byB0ZXN0c1xuICAgIC8vIGlzIGV4Y2Vzc2l2ZS5cbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyB8fCBwcm9jZXNzLmVudi5DSSkgcmV0dXJuXG5cbiAgICBpdCgnc3VjY2Vzc2Z1bGx5IGNyZWF0ZXMgU2FnZVRlWCBmaWxlcyB3aGVuIHVzaW5nIHRoZSBzYWdldGV4IHBhY2thZ2UnLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplRXh0ZW5kZWRCdWlsZCgnc2FnZXRleC10ZXN0JyxcbiAgICAgICAgWycuc2FnZXRleC5zYWdlJywgJy5zYWdldGV4LnNvdXQnLCAnLnBkZiddKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdEV4aXN0ZW5jZU9mRXh0ZW5kZWRPdXRwdXRzKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzdWNjZXNzZnVsbHkgY3JlYXRlcyBTYWdlVGVYIGZpbGVzIHdoZW4gdXNpbmcgdGhlIHNhZ2V0ZXggcGFja2FnZSB3aXRoIGFuIG91dHB1dCBkaXJlY3RvcnknLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplRXh0ZW5kZWRCdWlsZCgnc2FnZXRleC10ZXN0JyxcbiAgICAgICAgWycuc2FnZXRleC5zYWdlJywgJy5zYWdldGV4LnNvdXQnLCAnLnBkZiddLFxuICAgICAgICAnYnVpbGQnKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgwKVxuICAgICAgICBleHBlY3QoYnVpbGRlci5sb2dTdGF0dXNDb2RlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdEV4aXN0ZW5jZU9mRXh0ZW5kZWRPdXRwdXRzKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnY2FuUHJvY2VzcycsICgpID0+IHtcbiAgICBpdCgncmV0dXJucyB0cnVlIHdoZW4gZ2l2ZW4gYSBmaWxlIHBhdGggd2l0aCBhIC50ZXggZXh0ZW5zaW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY2FuUHJvY2VzcyA9IExhdGV4bWtCdWlsZGVyLmNhblByb2Nlc3Moc3RhdGUpXG4gICAgICBleHBlY3QoY2FuUHJvY2VzcykudG9CZSh0cnVlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2xvZ1N0YXR1c0NvZGUnLCAoKSA9PiB7XG4gICAgaXQoJ2hhbmRsZXMgbGF0ZXhtayBzcGVjaWZpYyBzdGF0dXMgY29kZXMnLCAoKSA9PiB7XG4gICAgICBsZXQgbWVzc2FnZXMgPSBbXVxuICAgICAgc3B5T24obGF0ZXgubG9nLCAnZXJyb3InKS5hbmRDYWxsRmFrZShtZXNzYWdlID0+IG1lc3NhZ2VzLnB1c2gobWVzc2FnZSkpXG5cbiAgICAgIGNvbnN0IHN0YXR1c0NvZGVzID0gWzEwLCAxMSwgMTIsIDEzLCAyMF1cbiAgICAgIHN0YXR1c0NvZGVzLmZvckVhY2goc3RhdHVzQ29kZSA9PiBidWlsZGVyLmxvZ1N0YXR1c0NvZGUoc3RhdHVzQ29kZSkpXG5cbiAgICAgIGNvbnN0IHN0YXJ0c1dpdGhQcmVmaXggPSBzdHIgPT4gc3RyLnN0YXJ0c1dpdGgoJ2xhdGV4bWs6JylcblxuICAgICAgZXhwZWN0KG1lc3NhZ2VzLmxlbmd0aCkudG9CZShzdGF0dXNDb2Rlcy5sZW5ndGgpXG4gICAgICBleHBlY3QobWVzc2FnZXMuZmlsdGVyKHN0YXJ0c1dpdGhQcmVmaXgpLmxlbmd0aCkudG9CZShzdGF0dXNDb2Rlcy5sZW5ndGgpXG4gICAgfSlcblxuICAgIGl0KCdwYXNzZXMgdGhyb3VnaCB0byBzdXBlcmNsYXNzIHdoZW4gZ2l2ZW4gbm9uLWxhdGV4bWsgc3RhdHVzIGNvZGVzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RkZXJyID0gJ3dpYmJsZSdcbiAgICAgIGNvbnN0IHN1cGVyY2xhc3MgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYnVpbGRlcilcbiAgICAgIHNweU9uKHN1cGVyY2xhc3MsICdsb2dTdGF0dXNDb2RlJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICBjb25zdCBzdGF0dXNDb2RlID0gMVxuICAgICAgYnVpbGRlci5sb2dTdGF0dXNDb2RlKHN0YXR1c0NvZGUsIHN0ZGVycilcblxuICAgICAgZXhwZWN0KHN1cGVyY2xhc3MubG9nU3RhdHVzQ29kZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoc3RhdHVzQ29kZSwgc3RkZXJyKVxuICAgIH0pXG4gIH0pXG59KVxuIl19