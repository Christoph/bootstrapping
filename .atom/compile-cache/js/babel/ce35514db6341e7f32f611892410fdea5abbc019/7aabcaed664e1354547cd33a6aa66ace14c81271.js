function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

require('../spec-helpers');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libParsersLogParser = require('../../lib/parsers/log-parser');

var _libParsersLogParser2 = _interopRequireDefault(_libParsersLogParser);

describe('LogParser', function () {
  var fixturesPath = undefined;

  beforeEach(function () {
    fixturesPath = atom.project.getPaths()[0];
  });

  describe('parse', function () {
    it('returns the expected output path', function () {
      var expectedPath = _path2['default'].resolve('/foo/output/file.pdf');
      var logFile = _path2['default'].join(fixturesPath, 'file.log');
      var texFile = _path2['default'].join(fixturesPath, 'file.tex');
      var parser = new _libParsersLogParser2['default'](logFile, texFile);
      var result = parser.parse();

      expect(result.outputFilePath).toBe(expectedPath);
    });

    it('returns the expected output path when the compiled file contained spaces', function () {
      var expectedPath = _path2['default'].resolve('/foo/output/filename with spaces.pdf');
      var logFile = _path2['default'].join(fixturesPath, 'filename with spaces.log');
      var texFile = _path2['default'].join(fixturesPath, 'filename with spaces.tex');
      var parser = new _libParsersLogParser2['default'](logFile, texFile);
      var result = parser.parse();

      expect(result.outputFilePath).toBe(expectedPath);
    });

    it('parses and returns all errors', function () {
      var logFile = _path2['default'].join(fixturesPath, 'errors.log');
      var texFile = _path2['default'].join(fixturesPath, 'errors.tex');
      var parser = new _libParsersLogParser2['default'](logFile, texFile);
      var result = parser.parse();

      expect(_lodash2['default'].countBy(result.messages, 'type').error).toBe(3);
    });

    it('associates an error with a file path, line number, and message', function () {
      var logFile = _path2['default'].join(fixturesPath, 'errors.log');
      var texFile = _path2['default'].join(fixturesPath, 'errors.tex');
      var parser = new _libParsersLogParser2['default'](logFile, texFile);
      var result = parser.parse();
      var error = result.messages.find(function (message) {
        return message.type === 'error';
      });

      expect(error).toEqual({
        type: 'error',
        logRange: [[196, 0], [196, 84]],
        filePath: texFile,
        range: [[9, 0], [9, 65536]],
        logPath: logFile,
        text: '\\begin{gather*} on input line 8 ended by \\end{gather}'
      });
    });
  });

  describe('getLines', function () {
    it('returns the expected number of lines', function () {
      var logFile = _path2['default'].join(fixturesPath, 'file.log');
      var texFile = _path2['default'].join(fixturesPath, 'file.tex');
      var parser = new _libParsersLogParser2['default'](logFile, texFile);
      var lines = parser.getLines();

      expect(lines.length).toBe(63);
    });

    it('throws an error when passed a filepath that does not exist', function () {
      var logFile = _path2['default'].join(fixturesPath, 'nope.log');
      var texFile = _path2['default'].join(fixturesPath, 'nope.tex');
      var parser = new _libParsersLogParser2['default'](logFile, texFile);

      expect(parser.getLines).toThrow();
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvcGFyc2Vycy9sb2ctcGFyc2VyLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztRQUVPLGlCQUFpQjs7c0JBRVYsUUFBUTs7OztvQkFDTCxNQUFNOzs7O21DQUNELDhCQUE4Qjs7OztBQUVwRCxRQUFRLENBQUMsV0FBVyxFQUFFLFlBQU07QUFDMUIsTUFBSSxZQUFZLFlBQUEsQ0FBQTs7QUFFaEIsWUFBVSxDQUFDLFlBQU07QUFDZixnQkFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDMUMsQ0FBQyxDQUFBOztBQUVGLFVBQVEsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUN0QixNQUFFLENBQUMsa0NBQWtDLEVBQUUsWUFBTTtBQUMzQyxVQUFNLFlBQVksR0FBRyxrQkFBSyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtBQUN6RCxVQUFNLE9BQU8sR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQ25ELFVBQU0sT0FBTyxHQUFHLGtCQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUE7QUFDbkQsVUFBTSxNQUFNLEdBQUcscUNBQWMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQzlDLFVBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTs7QUFFN0IsWUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7S0FDakQsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQywwRUFBMEUsRUFBRSxZQUFNO0FBQ25GLFVBQU0sWUFBWSxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFBO0FBQ3pFLFVBQU0sT0FBTyxHQUFHLGtCQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsMEJBQTBC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VSxDQUFDLENBQUE7QUFDbkQsVUFBTSxPQUFPLEdBQUcsa0JBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUNuRCxVQUFNLE1BQU0sR0FBRyxxQ0FBYyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7O0FBRTlDLFlBQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDbEMsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBO0NBQ0gsQ0FBQyxDQUFBIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvcGFyc2Vycy9sb2ctcGFyc2VyLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCAnLi4vc3BlYy1oZWxwZXJzJ1xuXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IExvZ1BhcnNlciBmcm9tICcuLi8uLi9saWIvcGFyc2Vycy9sb2ctcGFyc2VyJ1xuXG5kZXNjcmliZSgnTG9nUGFyc2VyJywgKCkgPT4ge1xuICBsZXQgZml4dHVyZXNQYXRoXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgZml4dHVyZXNQYXRoID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF1cbiAgfSlcblxuICBkZXNjcmliZSgncGFyc2UnLCAoKSA9PiB7XG4gICAgaXQoJ3JldHVybnMgdGhlIGV4cGVjdGVkIG91dHB1dCBwYXRoJywgKCkgPT4ge1xuICAgICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gcGF0aC5yZXNvbHZlKCcvZm9vL291dHB1dC9maWxlLnBkZicpXG4gICAgICBjb25zdCBsb2dGaWxlID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2ZpbGUubG9nJylcbiAgICAgIGNvbnN0IHRleEZpbGUgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZmlsZS50ZXgnKVxuICAgICAgY29uc3QgcGFyc2VyID0gbmV3IExvZ1BhcnNlcihsb2dGaWxlLCB0ZXhGaWxlKVxuICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VyLnBhcnNlKClcblxuICAgICAgZXhwZWN0KHJlc3VsdC5vdXRwdXRGaWxlUGF0aCkudG9CZShleHBlY3RlZFBhdGgpXG4gICAgfSlcblxuICAgIGl0KCdyZXR1cm5zIHRoZSBleHBlY3RlZCBvdXRwdXQgcGF0aCB3aGVuIHRoZSBjb21waWxlZCBmaWxlIGNvbnRhaW5lZCBzcGFjZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBleHBlY3RlZFBhdGggPSBwYXRoLnJlc29sdmUoJy9mb28vb3V0cHV0L2ZpbGVuYW1lIHdpdGggc3BhY2VzLnBkZicpXG4gICAgICBjb25zdCBsb2dGaWxlID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2ZpbGVuYW1lIHdpdGggc3BhY2VzLmxvZycpXG4gICAgICBjb25zdCB0ZXhGaWxlID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2ZpbGVuYW1lIHdpdGggc3BhY2VzLnRleCcpXG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgTG9nUGFyc2VyKGxvZ0ZpbGUsIHRleEZpbGUpXG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIucGFyc2UoKVxuXG4gICAgICBleHBlY3QocmVzdWx0Lm91dHB1dEZpbGVQYXRoKS50b0JlKGV4cGVjdGVkUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ3BhcnNlcyBhbmQgcmV0dXJucyBhbGwgZXJyb3JzJywgKCkgPT4ge1xuICAgICAgY29uc3QgbG9nRmlsZSA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdlcnJvcnMubG9nJylcbiAgICAgIGNvbnN0IHRleEZpbGUgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZXJyb3JzLnRleCcpXG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgTG9nUGFyc2VyKGxvZ0ZpbGUsIHRleEZpbGUpXG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIucGFyc2UoKVxuXG4gICAgICBleHBlY3QoXy5jb3VudEJ5KHJlc3VsdC5tZXNzYWdlcywgJ3R5cGUnKS5lcnJvcikudG9CZSgzKVxuICAgIH0pXG5cbiAgICBpdCgnYXNzb2NpYXRlcyBhbiBlcnJvciB3aXRoIGEgZmlsZSBwYXRoLCBsaW5lIG51bWJlciwgYW5kIG1lc3NhZ2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCBsb2dGaWxlID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2Vycm9ycy5sb2cnKVxuICAgICAgY29uc3QgdGV4RmlsZSA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdlcnJvcnMudGV4JylcbiAgICAgIGNvbnN0IHBhcnNlciA9IG5ldyBMb2dQYXJzZXIobG9nRmlsZSwgdGV4RmlsZSlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlci5wYXJzZSgpXG4gICAgICBjb25zdCBlcnJvciA9IHJlc3VsdC5tZXNzYWdlcy5maW5kKG1lc3NhZ2UgPT4geyByZXR1cm4gbWVzc2FnZS50eXBlID09PSAnZXJyb3InIH0pXG5cbiAgICAgIGV4cGVjdChlcnJvcikudG9FcXVhbCh7XG4gICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgIGxvZ1JhbmdlOiBbWzE5NiwgMF0sIFsxOTYsIDg0XV0sXG4gICAgICAgIGZpbGVQYXRoOiB0ZXhGaWxlLFxuICAgICAgICByYW5nZTogW1s5LCAwXSwgWzksIDY1NTM2XV0sXG4gICAgICAgIGxvZ1BhdGg6IGxvZ0ZpbGUsXG4gICAgICAgIHRleHQ6ICdcXFxcYmVnaW57Z2F0aGVyKn0gb24gaW5wdXQgbGluZSA4IGVuZGVkIGJ5IFxcXFxlbmR7Z2F0aGVyfSdcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnZ2V0TGluZXMnLCAoKSA9PiB7XG4gICAgaXQoJ3JldHVybnMgdGhlIGV4cGVjdGVkIG51bWJlciBvZiBsaW5lcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGxvZ0ZpbGUgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZmlsZS5sb2cnKVxuICAgICAgY29uc3QgdGV4RmlsZSA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdmaWxlLnRleCcpXG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgTG9nUGFyc2VyKGxvZ0ZpbGUsIHRleEZpbGUpXG4gICAgICBjb25zdCBsaW5lcyA9IHBhcnNlci5nZXRMaW5lcygpXG5cbiAgICAgIGV4cGVjdChsaW5lcy5sZW5ndGgpLnRvQmUoNjMpXG4gICAgfSlcblxuICAgIGl0KCd0aHJvd3MgYW4gZXJyb3Igd2hlbiBwYXNzZWQgYSBmaWxlcGF0aCB0aGF0IGRvZXMgbm90IGV4aXN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgbG9nRmlsZSA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdub3BlLmxvZycpXG4gICAgICBjb25zdCB0ZXhGaWxlID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ25vcGUudGV4JylcbiAgICAgIGNvbnN0IHBhcnNlciA9IG5ldyBMb2dQYXJzZXIobG9nRmlsZSwgdGV4RmlsZSlcblxuICAgICAgZXhwZWN0KHBhcnNlci5nZXRMaW5lcykudG9UaHJvdygpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=