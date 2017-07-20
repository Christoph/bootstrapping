function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _specHelpers = require('../spec-helpers');

var _specHelpers2 = _interopRequireDefault(_specHelpers);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libBuildersKnitr = require('../../lib/builders/knitr');

var _libBuildersKnitr2 = _interopRequireDefault(_libBuildersKnitr);

var _libBuildState = require('../../lib/build-state');

var _libBuildState2 = _interopRequireDefault(_libBuildState);

function getRawFile(filePath) {
  return _fsPlus2['default'].readFileSync(filePath, { encoding: 'utf-8' });
}

describe('KnitrBuilder', function () {
  var builder = undefined,
      fixturesPath = undefined,
      filePath = undefined,
      state = undefined,
      jobState = undefined;

  beforeEach(function () {
    waitsForPromise(function () {
      return _specHelpers2['default'].activatePackages();
    });
    builder = new _libBuildersKnitr2['default']();
    spyOn(builder, 'logStatusCode').andCallThrough();
    fixturesPath = _specHelpers2['default'].cloneFixtures();
    filePath = _path2['default'].join(fixturesPath, 'knitr', 'file.Rnw');
    state = new _libBuildState2['default'](filePath);
    state.setEngine('pdflatex');
    state.setOutputFormat('pdf');
    state.setOutputDirectory('');
    jobState = state.getJobStates()[0];
  });

  describe('constructArgs', function () {
    it('produces default arguments containing expected file path', function () {
      var expectedArgs = ['-e "library(knitr)"', '-e "opts_knit$set(concordance = TRUE)"', '-e "knit(\'' + filePath.replace(/\\/g, '\\\\') + '\')"'];

      var args = builder.constructArgs(jobState);
      expect(args).toEqual(expectedArgs);
    });
  });

  describe('constructPatchSynctexArgs', function () {
    it('produces default arguments containing expected file path', function () {
      var escapedFilePath = filePath.replace(/\\/g, '\\\\');
      var escapedSynctexPath = escapedFilePath.replace(/\.[^.]+$/, '');
      var expectedArgs = ['-e "library(patchSynctex)"', '-e "patchSynctex(\'' + escapedFilePath + '\',syncfile=\'' + escapedSynctexPath + '\')"'];

      var args = builder.constructPatchSynctexArgs(jobState);
      expect(args).toEqual(expectedArgs);
    });
  });

  describe('run', function () {
    var exitCode = undefined;

    it('successfully executes knitr when given a valid R Sweave file', function () {
      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        var outputFilePath = _path2['default'].join(fixturesPath, 'knitr', 'file.tex');

        expect(exitCode).toBe(0);
        expect(builder.logStatusCode).not.toHaveBeenCalled();
        expect(getRawFile(outputFilePath)).toContain('$\\tau \\approx 6.2831853$');
      });
    });

    it('fails to execute knitr when given an invalid file path', function () {
      filePath = _path2['default'].join(fixturesPath, 'foo.Rnw');
      state.setFilePath(filePath);

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(1);
        expect(builder.logStatusCode).toHaveBeenCalled();
      });
    });

    it('detects missing knitr library and logs an error', function () {
      var directoryPath = _path2['default'].dirname(filePath);
      var env = { 'R_LIBS_USER': '/dev/null', 'R_LIBS_SITE': '/dev/null' };
      var options = builder.constructChildProcessOptions(directoryPath);
      Object.assign(options.env, env);
      spyOn(builder, 'constructChildProcessOptions').andReturn(options);
      spyOn(latex.log, 'showMessage').andCallThrough();

      waitsForPromise(function () {
        return builder.run(jobState).then(function (code) {
          exitCode = code;
        });
      });

      runs(function () {
        expect(exitCode).toBe(-1);
        expect(builder.logStatusCode).toHaveBeenCalled();
        expect(latex.log.showMessage).toHaveBeenCalledWith({
          type: 'error',
          text: 'The R package "knitr" could not be loaded.'
        });
      });
    });
  });

  describe('resolveOutputPath', function () {
    var sourcePath = undefined,
        resultPath = undefined;

    beforeEach(function () {
      sourcePath = _path2['default'].resolve('/var/foo.Rnw');
      resultPath = _path2['default'].resolve('/var/foo.tex');
    });

    it('detects an absolute path and returns it unchanged', function () {
      var stdout = 'foo\nbar\n\n[1] "' + resultPath + '"';
      var resolvedPath = builder.resolveOutputPath(sourcePath, stdout);

      expect(resolvedPath).toBe(resultPath);
    });

    it('detects a relative path and makes it absolute with respect to the source file', function () {
      var stdout = 'foo\nbar\n\n[1] "' + _path2['default'].basename(resultPath) + '"';
      var resolvedPath = builder.resolveOutputPath(sourcePath, stdout);

      expect(resolvedPath).toBe(resultPath);
    });
  });

  describe('canProcess', function () {
    it('returns true when given a file path with a .Rnw extension', function () {
      var canProcess = _libBuildersKnitr2['default'].canProcess(state);
      expect(canProcess).toBe(true);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvYnVpbGRlcnMva25pdHItc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OzJCQUVvQixpQkFBaUI7Ozs7c0JBQ3RCLFNBQVM7Ozs7b0JBQ1AsTUFBTTs7OztnQ0FDRSwwQkFBMEI7Ozs7NkJBQzVCLHVCQUF1Qjs7OztBQUU5QyxTQUFTLFVBQVUsQ0FBRSxRQUFRLEVBQUU7QUFDN0IsU0FBTyxvQkFBRyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUE7Q0FDdEQ7O0FBRUQsUUFBUSxDQUFDLGNBQWMsRUFBRSxZQUFNO0FBQzdCLE1BQUksT0FBTyxZQUFBO01BQUUsWUFBWSxZQUFBO01BQUUsUUFBUSxZQUFBO01BQUUsS0FBSyxZQUFBO01BQUUsUUFBUSxZQUFBLENBQUE7O0FBRXBELFlBQVUsQ0FBQyxZQUFNO0FBQ2YsbUJBQWUsQ0FBQyxZQUFNO0FBQ3BCLGFBQU8seUJBQVEsZ0JBQWdCLEVBQUUsQ0FBQTtLQUNsQyxDQUFDLENBQUE7QUFDRixXQUFPLEdBQUcsbUNBQWtCLENBQUE7QUFDNUIsU0FBSyxDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNoRCxnQkFBWSxHQUFHLHlCQUFRLGFBQWEsRUFBRSxDQUFBO0FBQ3RDLFlBQVEsR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUN2RCxTQUFLLEdBQUcsK0JBQWUsUUFBUSxDQUFDLENBQUE7QUFDaEMsU0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUMzQixTQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzVCLFNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUM1QixZQUFRLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxD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QUFBLENBQUE7O0FBRTFCLGNBQVUsQ0FBQyxZQUFNO0FBQ2YsZ0JBQVUsR0FBRyxrQkFBSyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDekMsZ0JBQVUsR0FBRyxrQkFBSyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7S0FDMUMsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyxtREFBbUQsRUFBRSxZQUFNO0FBQzVELFVBQU0sTUFBTSx5QkFBdUIsVUFBVSxNQUFHLENBQUE7QUFDaEQsVUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQTs7QUFFbEUsWUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUN0QyxDQUFDLENBQUE7O0FBRUYsTUFBRSxDQUFDLCtFQUErRSxFQUFFLFlBQU07QUFDeEYsVUFBTSxNQUFNLHlCQUF1QixrQkFBSyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQUcsQ0FBQTtBQUMvRCxVQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFBOztBQUVsRSxZQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0tBQ3RDLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTs7QUFFRixVQUFRLENBQUMsWUFBWSxFQUFFLFlBQU07QUFDM0IsTUFBRSxDQUFDLDJEQUEyRCxFQUFFLFlBQU07QUFDcEUsVUFBTSxVQUFVLEdBQUcsOEJBQWEsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ2pELFlBQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDOUIsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBO0NBQ0gsQ0FBQyxDQUFBIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvYnVpbGRlcnMva25pdHItc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IGhlbHBlcnMgZnJvbSAnLi4vc3BlYy1oZWxwZXJzJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzLXBsdXMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IEtuaXRyQnVpbGRlciBmcm9tICcuLi8uLi9saWIvYnVpbGRlcnMva25pdHInXG5pbXBvcnQgQnVpbGRTdGF0ZSBmcm9tICcuLi8uLi9saWIvYnVpbGQtc3RhdGUnXG5cbmZ1bmN0aW9uIGdldFJhd0ZpbGUgKGZpbGVQYXRoKSB7XG4gIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsIHtlbmNvZGluZzogJ3V0Zi04J30pXG59XG5cbmRlc2NyaWJlKCdLbml0ckJ1aWxkZXInLCAoKSA9PiB7XG4gIGxldCBidWlsZGVyLCBmaXh0dXJlc1BhdGgsIGZpbGVQYXRoLCBzdGF0ZSwgam9iU3RhdGVcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgcmV0dXJuIGhlbHBlcnMuYWN0aXZhdGVQYWNrYWdlcygpXG4gICAgfSlcbiAgICBidWlsZGVyID0gbmV3IEtuaXRyQnVpbGRlcigpXG4gICAgc3B5T24oYnVpbGRlciwgJ2xvZ1N0YXR1c0NvZGUnKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgZml4dHVyZXNQYXRoID0gaGVscGVycy5jbG9uZUZpeHR1cmVzKClcbiAgICBmaWxlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdrbml0cicsICdmaWxlLlJudycpXG4gICAgc3RhdGUgPSBuZXcgQnVpbGRTdGF0ZShmaWxlUGF0aClcbiAgICBzdGF0ZS5zZXRFbmdpbmUoJ3BkZmxhdGV4JylcbiAgICBzdGF0ZS5zZXRPdXRwdXRGb3JtYXQoJ3BkZicpXG4gICAgc3RhdGUuc2V0T3V0cHV0RGlyZWN0b3J5KCcnKVxuICAgIGpvYlN0YXRlID0gc3RhdGUuZ2V0Sm9iU3RhdGVzKClbMF1cbiAgfSlcblxuICBkZXNjcmliZSgnY29uc3RydWN0QXJncycsICgpID0+IHtcbiAgICBpdCgncHJvZHVjZXMgZGVmYXVsdCBhcmd1bWVudHMgY29udGFpbmluZyBleHBlY3RlZCBmaWxlIHBhdGgnLCAoKSA9PiB7XG4gICAgICBjb25zdCBleHBlY3RlZEFyZ3MgPSBbXG4gICAgICAgICctZSBcImxpYnJhcnkoa25pdHIpXCInLFxuICAgICAgICAnLWUgXCJvcHRzX2tuaXQkc2V0KGNvbmNvcmRhbmNlID0gVFJVRSlcIicsXG4gICAgICAgIGAtZSBcImtuaXQoJyR7ZmlsZVBhdGgucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKX0nKVwiYFxuICAgICAgXVxuXG4gICAgICBjb25zdCBhcmdzID0gYnVpbGRlci5jb25zdHJ1Y3RBcmdzKGpvYlN0YXRlKVxuICAgICAgZXhwZWN0KGFyZ3MpLnRvRXF1YWwoZXhwZWN0ZWRBcmdzKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2NvbnN0cnVjdFBhdGNoU3luY3RleEFyZ3MnLCAoKSA9PiB7XG4gICAgaXQoJ3Byb2R1Y2VzIGRlZmF1bHQgYXJndW1lbnRzIGNvbnRhaW5pbmcgZXhwZWN0ZWQgZmlsZSBwYXRoJywgKCkgPT4ge1xuICAgICAgY29uc3QgZXNjYXBlZEZpbGVQYXRoID0gZmlsZVBhdGgucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKVxuICAgICAgY29uc3QgZXNjYXBlZFN5bmN0ZXhQYXRoID0gZXNjYXBlZEZpbGVQYXRoLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKVxuICAgICAgY29uc3QgZXhwZWN0ZWRBcmdzID0gW1xuICAgICAgICAnLWUgXCJsaWJyYXJ5KHBhdGNoU3luY3RleClcIicsXG4gICAgICAgIGAtZSBcInBhdGNoU3luY3RleCgnJHtlc2NhcGVkRmlsZVBhdGh9JyxzeW5jZmlsZT0nJHtlc2NhcGVkU3luY3RleFBhdGh9JylcImBcbiAgICAgIF1cblxuICAgICAgY29uc3QgYXJncyA9IGJ1aWxkZXIuY29uc3RydWN0UGF0Y2hTeW5jdGV4QXJncyhqb2JTdGF0ZSlcbiAgICAgIGV4cGVjdChhcmdzKS50b0VxdWFsKGV4cGVjdGVkQXJncylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdydW4nLCAoKSA9PiB7XG4gICAgbGV0IGV4aXRDb2RlXG5cbiAgICBpdCgnc3VjY2Vzc2Z1bGx5IGV4ZWN1dGVzIGtuaXRyIHdoZW4gZ2l2ZW4gYSB2YWxpZCBSIFN3ZWF2ZSBmaWxlJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIucnVuKGpvYlN0YXRlKS50aGVuKGNvZGUgPT4geyBleGl0Q29kZSA9IGNvZGUgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBjb25zdCBvdXRwdXRGaWxlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdrbml0cicsICdmaWxlLnRleCcpXG5cbiAgICAgICAgZXhwZWN0KGV4aXRDb2RlKS50b0JlKDApXG4gICAgICAgIGV4cGVjdChidWlsZGVyLmxvZ1N0YXR1c0NvZGUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0KGdldFJhd0ZpbGUob3V0cHV0RmlsZVBhdGgpKS50b0NvbnRhaW4oJyRcXFxcdGF1IFxcXFxhcHByb3ggNi4yODMxODUzJCcpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZmFpbHMgdG8gZXhlY3V0ZSBrbml0ciB3aGVuIGdpdmVuIGFuIGludmFsaWQgZmlsZSBwYXRoJywgKCkgPT4ge1xuICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZm9vLlJudycpXG4gICAgICBzdGF0ZS5zZXRGaWxlUGF0aChmaWxlUGF0aClcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIucnVuKGpvYlN0YXRlKS50aGVuKGNvZGUgPT4geyBleGl0Q29kZSA9IGNvZGUgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoZXhpdENvZGUpLnRvQmUoMSlcbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZGV0ZWN0cyBtaXNzaW5nIGtuaXRyIGxpYnJhcnkgYW5kIGxvZ3MgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBjb25zdCBkaXJlY3RvcnlQYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKVxuICAgICAgY29uc3QgZW52ID0geyAnUl9MSUJTX1VTRVInOiAnL2Rldi9udWxsJywgJ1JfTElCU19TSVRFJzogJy9kZXYvbnVsbCcgfVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IGJ1aWxkZXIuY29uc3RydWN0Q2hpbGRQcm9jZXNzT3B0aW9ucyhkaXJlY3RvcnlQYXRoKVxuICAgICAgT2JqZWN0LmFzc2lnbihvcHRpb25zLmVudiwgZW52KVxuICAgICAgc3B5T24oYnVpbGRlciwgJ2NvbnN0cnVjdENoaWxkUHJvY2Vzc09wdGlvbnMnKS5hbmRSZXR1cm4ob3B0aW9ucylcbiAgICAgIHNweU9uKGxhdGV4LmxvZywgJ3Nob3dNZXNzYWdlJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gYnVpbGRlci5ydW4oam9iU3RhdGUpLnRoZW4oY29kZSA9PiB7IGV4aXRDb2RlID0gY29kZSB9KVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChleGl0Q29kZSkudG9CZSgtMSlcbiAgICAgICAgZXhwZWN0KGJ1aWxkZXIubG9nU3RhdHVzQ29kZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChsYXRleC5sb2cuc2hvd01lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgIHRleHQ6ICdUaGUgUiBwYWNrYWdlIFwia25pdHJcIiBjb3VsZCBub3QgYmUgbG9hZGVkLidcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgncmVzb2x2ZU91dHB1dFBhdGgnLCAoKSA9PiB7XG4gICAgbGV0IHNvdXJjZVBhdGgsIHJlc3VsdFBhdGhcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc291cmNlUGF0aCA9IHBhdGgucmVzb2x2ZSgnL3Zhci9mb28uUm53JylcbiAgICAgIHJlc3VsdFBhdGggPSBwYXRoLnJlc29sdmUoJy92YXIvZm9vLnRleCcpXG4gICAgfSlcblxuICAgIGl0KCdkZXRlY3RzIGFuIGFic29sdXRlIHBhdGggYW5kIHJldHVybnMgaXQgdW5jaGFuZ2VkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc3Rkb3V0ID0gYGZvb1xcbmJhclxcblxcblsxXSBcIiR7cmVzdWx0UGF0aH1cImBcbiAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IGJ1aWxkZXIucmVzb2x2ZU91dHB1dFBhdGgoc291cmNlUGF0aCwgc3Rkb3V0KVxuXG4gICAgICBleHBlY3QocmVzb2x2ZWRQYXRoKS50b0JlKHJlc3VsdFBhdGgpXG4gICAgfSlcblxuICAgIGl0KCdkZXRlY3RzIGEgcmVsYXRpdmUgcGF0aCBhbmQgbWFrZXMgaXQgYWJzb2x1dGUgd2l0aCByZXNwZWN0IHRvIHRoZSBzb3VyY2UgZmlsZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0ZG91dCA9IGBmb29cXG5iYXJcXG5cXG5bMV0gXCIke3BhdGguYmFzZW5hbWUocmVzdWx0UGF0aCl9XCJgXG4gICAgICBjb25zdCByZXNvbHZlZFBhdGggPSBidWlsZGVyLnJlc29sdmVPdXRwdXRQYXRoKHNvdXJjZVBhdGgsIHN0ZG91dClcblxuICAgICAgZXhwZWN0KHJlc29sdmVkUGF0aCkudG9CZShyZXN1bHRQYXRoKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2NhblByb2Nlc3MnLCAoKSA9PiB7XG4gICAgaXQoJ3JldHVybnMgdHJ1ZSB3aGVuIGdpdmVuIGEgZmlsZSBwYXRoIHdpdGggYSAuUm53IGV4dGVuc2lvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGNhblByb2Nlc3MgPSBLbml0ckJ1aWxkZXIuY2FuUHJvY2VzcyhzdGF0ZSlcbiAgICAgIGV4cGVjdChjYW5Qcm9jZXNzKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=