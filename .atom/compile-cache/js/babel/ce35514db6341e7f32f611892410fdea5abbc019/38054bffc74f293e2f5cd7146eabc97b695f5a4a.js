function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

require('../spec-helpers');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libParsersFdbParser = require('../../lib/parsers/fdb-parser');

var _libParsersFdbParser2 = _interopRequireDefault(_libParsersFdbParser);

describe('FdbParser', function () {
  var fixturesPath = undefined,
      fdbFile = undefined,
      texFile = undefined;

  beforeEach(function () {
    fixturesPath = atom.project.getPaths()[0];
    fdbFile = _path2['default'].join(fixturesPath, 'log-parse', 'file-pdfps.fdb_latexmk');
    texFile = _path2['default'].join(fixturesPath, 'file.tex');
  });

  describe('parse', function () {
    it('returns the expected parsed fdb', function () {
      var parser = new _libParsersFdbParser2['default'](fdbFile, texFile);
      var result = parser.parse();
      var expectedResult = {
        dvips: {
          source: ['log-parse/file-pdfps.dvi'],
          generated: ['log-parse/file-pdfps.ps']
        },
        latex: {
          source: ['file-pdfps.aux', 'file.tex'],
          generated: ['log-parse/file-pdfps.aux', 'log-parse/file-pdfps.log', 'log-parse/file-pdfps.dvi']
        },
        ps2pdf: {
          source: ['log-parse/file-pdfps.ps'],
          generated: ['log-parse/file-pdfps.pdf']
        }
      };

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getLines', function () {
    it('returns the expected number of lines', function () {
      var parser = new _libParsersFdbParser2['default'](fdbFile, texFile);
      var lines = parser.getLines();

      expect(lines.length).toBe(17);
    });

    it('throws an error when passed a filepath that does not exist', function () {
      var fdbFile = _path2['default'].join(fixturesPath, 'nope.fdb_latexmk');
      var texFile = _path2['default'].join(fixturesPath, 'nope.tex');
      var parser = new _libParsersFdbParser2['default'](fdbFile, texFile);

      expect(parser.getLines).toThrow();
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvcGFyc2Vycy9mZGItcGFyc2VyLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztRQUVPLGlCQUFpQjs7b0JBRVAsTUFBTTs7OzttQ0FDRCw4QkFBOEI7Ozs7QUFFcEQsUUFBUSxDQUFDLFdBQVcsRUFBRSxZQUFNO0FBQzFCLE1BQUksWUFBWSxZQUFBO01BQUUsT0FBTyxZQUFBO01BQUUsT0FBTyxZQUFBLENBQUE7O0FBRWxDLFlBQVUsQ0FBQyxZQUFNO0FBQ2YsZ0JBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pDLFdBQU8sR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO0FBQ3hFLFdBQU8sR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0dBQzlDLENBQUMsQ0FBQTs7QUFFRixVQUFRLENBQUMsT0FBTyxFQUFFLFlBQU07QUFDdEIsTUFBRSxDQUFDLGlDQUFpQyxFQUFFLFlBQU07QUFDMUMsVUFBTSxNQUFNLEdBQUcscUNBQWMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQzlDLFVBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUM3QixVQUFNLGNBQWMsR0FBRztBQUNyQixhQUFLLEVBQUU7QUFDTCxnQkFBTSxFQUFFLENBQUMsMEJBQTBCLENBQUM7QUFDcEMsbUJBQVMsRUFBRSxDQUFDLHlCQUF5QixDQUFDO1NBQ3ZDO0FBQ0QsYUFBSyxFQUFFO0FBQ0wsZ0JBQU0sRUFBRSxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQztBQUN0QyxtQkFBUyxFQUFFLENBQUMsMEJBQTBCLEVBQUUsMEJBQTBCLEVBQUUsMEJBQTBCLENBQUM7U0FDaEc7QUFDRCxjQUFNLEVBQUU7QUFDTixnQkFBTSxFQUFFLENBQUMseUJBQXlCLENBQUM7QUFDbkMsbUJBQVMsRUFBRSxDQUFDLDBCQUEwQixDQUFDO1NBQ3hDO09BQ0YsQ0FBQTs7QUFFRCxZQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0tBQ3ZDLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTs7QUFFRixVQUFRLENBQUMsVUFBVSxFQUFFLFlBQU07QUFDekIsTUFBRSxDQUFDLHNDQUFzQyxFQUFFLFlBQU07QUFDL0MsVUFBTSxNQUFNLEdBQUcscUNBQWMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQzlDLFVBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTs7QUFFL0IsWUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7S0FDOUIsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyw0REFBNEQsRUFBRSxZQUFNO0FBQ3JFLFVBQU0sT0FBTyxHQUFHLGtCQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtBQUMzRCxVQUFNLE9BQU8sR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQ25ELFVBQU0sTUFBTSxHQUFHLHFDQUFjLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQTs7QUFFOUMsWUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUNsQyxDQUFDLENBQUE7R0FDSCxDQUFDLENBQUE7Q0FDSCxDQUFDLENBQUEiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGF0ZXgvc3BlYy9wYXJzZXJzL2ZkYi1wYXJzZXItc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0ICcuLi9zcGVjLWhlbHBlcnMnXG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgRmRiUGFyc2VyIGZyb20gJy4uLy4uL2xpYi9wYXJzZXJzL2ZkYi1wYXJzZXInXG5cbmRlc2NyaWJlKCdGZGJQYXJzZXInLCAoKSA9PiB7XG4gIGxldCBmaXh0dXJlc1BhdGgsIGZkYkZpbGUsIHRleEZpbGVcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBmaXh0dXJlc1BhdGggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXVxuICAgIGZkYkZpbGUgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnbG9nLXBhcnNlJywgJ2ZpbGUtcGRmcHMuZmRiX2xhdGV4bWsnKVxuICAgIHRleEZpbGUgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZmlsZS50ZXgnKVxuICB9KVxuXG4gIGRlc2NyaWJlKCdwYXJzZScsICgpID0+IHtcbiAgICBpdCgncmV0dXJucyB0aGUgZXhwZWN0ZWQgcGFyc2VkIGZkYicsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlciA9IG5ldyBGZGJQYXJzZXIoZmRiRmlsZSwgdGV4RmlsZSlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlci5wYXJzZSgpXG4gICAgICBjb25zdCBleHBlY3RlZFJlc3VsdCA9IHtcbiAgICAgICAgZHZpcHM6IHtcbiAgICAgICAgICBzb3VyY2U6IFsnbG9nLXBhcnNlL2ZpbGUtcGRmcHMuZHZpJ10sXG4gICAgICAgICAgZ2VuZXJhdGVkOiBbJ2xvZy1wYXJzZS9maWxlLXBkZnBzLnBzJ11cbiAgICAgICAgfSxcbiAgICAgICAgbGF0ZXg6IHtcbiAgICAgICAgICBzb3VyY2U6IFsnZmlsZS1wZGZwcy5hdXgnLCAnZmlsZS50ZXgnXSxcbiAgICAgICAgICBnZW5lcmF0ZWQ6IFsnbG9nLXBhcnNlL2ZpbGUtcGRmcHMuYXV4JywgJ2xvZy1wYXJzZS9maWxlLXBkZnBzLmxvZycsICdsb2ctcGFyc2UvZmlsZS1wZGZwcy5kdmknXVxuICAgICAgICB9LFxuICAgICAgICBwczJwZGY6IHtcbiAgICAgICAgICBzb3VyY2U6IFsnbG9nLXBhcnNlL2ZpbGUtcGRmcHMucHMnXSxcbiAgICAgICAgICBnZW5lcmF0ZWQ6IFsnbG9nLXBhcnNlL2ZpbGUtcGRmcHMucGRmJ11cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKGV4cGVjdGVkUmVzdWx0KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2dldExpbmVzJywgKCkgPT4ge1xuICAgIGl0KCdyZXR1cm5zIHRoZSBleHBlY3RlZCBudW1iZXIgb2YgbGluZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgRmRiUGFyc2VyKGZkYkZpbGUsIHRleEZpbGUpXG4gICAgICBjb25zdCBsaW5lcyA9IHBhcnNlci5nZXRMaW5lcygpXG5cbiAgICAgIGV4cGVjdChsaW5lcy5sZW5ndGgpLnRvQmUoMTcpXG4gICAgfSlcblxuICAgIGl0KCd0aHJvd3MgYW4gZXJyb3Igd2hlbiBwYXNzZWQgYSBmaWxlcGF0aCB0aGF0IGRvZXMgbm90IGV4aXN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmRiRmlsZSA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdub3BlLmZkYl9sYXRleG1rJylcbiAgICAgIGNvbnN0IHRleEZpbGUgPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnbm9wZS50ZXgnKVxuICAgICAgY29uc3QgcGFyc2VyID0gbmV3IEZkYlBhcnNlcihmZGJGaWxlLCB0ZXhGaWxlKVxuXG4gICAgICBleHBlY3QocGFyc2VyLmdldExpbmVzKS50b1Rocm93KClcbiAgICB9KVxuICB9KVxufSlcbiJdfQ==