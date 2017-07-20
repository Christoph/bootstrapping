function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libParsersMagicParser = require('../../lib/parsers/magic-parser');

var _libParsersMagicParser2 = _interopRequireDefault(_libParsersMagicParser);

describe('MagicParser', function () {
  var fixturesPath = undefined;

  beforeEach(function () {
    fixturesPath = atom.project.getPaths()[0];
  });

  describe('parse', function () {
    it('returns an empty object when file contains no magic comments', function () {
      var filePath = _path2['default'].join(fixturesPath, 'file.tex');
      var parser = new _libParsersMagicParser2['default'](filePath);
      var result = parser.parse();

      expect(result).toEqual({});
    });

    it('returns path to root file when file contains magic root comment', function () {
      var filePath = _path2['default'].join(fixturesPath, 'magic-comments', 'root-comment.tex');
      var parser = new _libParsersMagicParser2['default'](filePath);
      var result = parser.parse();

      expect(result).toEqual({
        'root': '../file.tex'
      });
    });

    it('returns path to root file when file contains magic root comment when magic comment is not on the first line', function () {
      var filePath = _path2['default'].join(fixturesPath, 'magic-comments', 'not-first-line.tex');
      var parser = new _libParsersMagicParser2['default'](filePath);
      var result = parser.parse();

      expect(result).toEqual({
        'root': '../file.tex'
      });
    });

    it('handles magic comments without optional whitespace', function () {
      var filePath = _path2['default'].join(fixturesPath, 'magic-comments', 'no-whitespace.tex');
      var parser = new _libParsersMagicParser2['default'](filePath);
      var result = parser.parse();

      expect(result).not.toEqual({});
    });
    it('detects multiple object information when multiple magice comments are defined', function () {
      var filePath = _path2['default'].join(fixturesPath, 'magic-comments', 'multiple-magic-comments.tex');
      var parser = new _libParsersMagicParser2['default'](filePath);
      var result = parser.parse();

      expect(result).toEqual({
        'root': '../file.tex',
        'program': 'lualatex'
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvcGFyc2Vycy9tYWdpYy1wYXJzZXItc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O29CQUVpQixNQUFNOzs7O3FDQUNDLGdDQUFnQzs7OztBQUV4RCxRQUFRLENBQUMsYUFBYSxFQUFFLFlBQU07QUFDNUIsTUFBSSxZQUFZLFlBQUEsQ0FBQTs7QUFFaEIsWUFBVSxDQUFDLFlBQU07QUFDZixnQkFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDMUMsQ0FBQyxDQUFBOztBQUVGLFVBQVEsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUN0QixNQUFFLENBQUMsOERBQThELEVBQUUsWUFBTTtBQUN2RSxVQUFNLFFBQVEsR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQ3BELFVBQU0sTUFBTSxHQUFHLHVDQUFnQixRQUFRLENBQUMsQ0FBQTtBQUN4QyxVQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7O0FBRTdCLFlBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7S0FDM0IsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyxpRUFBaUUsRUFBRSxZQUFNO0FBQzFFLFVBQU0sUUFBUSxHQUFHLGtCQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtBQUM5RSxVQUFNLE1BQU0sR0FBRyx1Q0FBZ0IsUUFBUSxDQUFDLENBQUE7QUFDeEMsVUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFBOztBQUU3QixZQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ3JCLGNBQU0sRUFBRSxhQUFhO09BQ3RCLENBQUMsQ0FBQTtLQUNILENBQUMsQ0FBQTs7QUFFRixNQUFFLENBQUMsNkdBQTZHLEVBQUUsWUFBTTtBQUN0SCxVQUFNLFFBQVEsR0FBRyxrQkFBSyxJQUFJLENBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUE7QUFDaEYsVUFBTSxNQUFNLEdBQUcsdUNBQWdCLFFBQVEsQ0FBQyxDQUFBO0FBQ3hDLFVBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTs7QUFFN0IsWUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUNyQixjQUFNLEVBQUUsYUFBYTtPQUN0QixDQUFDLENBQUE7S0FDSCxDQUFDLENBQUE7O0FBRUYsTUFBRSxDQUFDLG9EQUFvRCxFQUFFLFlBQU07QUFDN0QsVUFBTSxRQUFRLEdBQUcsa0JBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO0FBQy9FLFVBQU0sTUFBTSxHQUFHLHVDQUFnQixRQUFRLENBQUMsQ0FBQTtBQUN4QyxVQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7O0FBRTdCLFlBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0tBQy9CLENBQUMsQ0FBQTtBQUNGLE1BQUUsQ0FBQywrRUFBK0UsRUFBRSxZQUFNO0FBQ3hGLFVBQU0sUUFBUSxHQUFHLGtCQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsNkJBQTZCLENBQUMsQ0FBQTtBQUN6RixVQUFNLE1BQU0sR0FBRyx1Q0FBZ0IsUUFBUSxDQUFDLENBQUE7QUFDeEMsVUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFBOztBQUU3QixZQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ3JCLGNBQU0sRUFBRSxhQUFhO0FBQ3JCLGlCQUFTLEVBQUUsVUFBVTtPQUN0QixDQUFDLENBQUE7S0FDSCxDQUFDLENBQUE7R0FDSCxDQUFDLENBQUE7Q0FDSCxDQUFDLENBQUEiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGF0ZXgvc3BlYy9wYXJzZXJzL21hZ2ljLXBhcnNlci1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IE1hZ2ljUGFyc2VyIGZyb20gJy4uLy4uL2xpYi9wYXJzZXJzL21hZ2ljLXBhcnNlcidcblxuZGVzY3JpYmUoJ01hZ2ljUGFyc2VyJywgKCkgPT4ge1xuICBsZXQgZml4dHVyZXNQYXRoXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgZml4dHVyZXNQYXRoID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF1cbiAgfSlcblxuICBkZXNjcmliZSgncGFyc2UnLCAoKSA9PiB7XG4gICAgaXQoJ3JldHVybnMgYW4gZW1wdHkgb2JqZWN0IHdoZW4gZmlsZSBjb250YWlucyBubyBtYWdpYyBjb21tZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2ZpbGUudGV4JylcbiAgICAgIGNvbnN0IHBhcnNlciA9IG5ldyBNYWdpY1BhcnNlcihmaWxlUGF0aClcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlci5wYXJzZSgpXG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoe30pXG4gICAgfSlcblxuICAgIGl0KCdyZXR1cm5zIHBhdGggdG8gcm9vdCBmaWxlIHdoZW4gZmlsZSBjb250YWlucyBtYWdpYyByb290IGNvbW1lbnQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdtYWdpYy1jb21tZW50cycsICdyb290LWNvbW1lbnQudGV4JylcbiAgICAgIGNvbnN0IHBhcnNlciA9IG5ldyBNYWdpY1BhcnNlcihmaWxlUGF0aClcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlci5wYXJzZSgpXG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoe1xuICAgICAgICAncm9vdCc6ICcuLi9maWxlLnRleCdcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdyZXR1cm5zIHBhdGggdG8gcm9vdCBmaWxlIHdoZW4gZmlsZSBjb250YWlucyBtYWdpYyByb290IGNvbW1lbnQgd2hlbiBtYWdpYyBjb21tZW50IGlzIG5vdCBvbiB0aGUgZmlyc3QgbGluZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ21hZ2ljLWNvbW1lbnRzJywgJ25vdC1maXJzdC1saW5lLnRleCcpXG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgTWFnaWNQYXJzZXIoZmlsZVBhdGgpXG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIucGFyc2UoKVxuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKHtcbiAgICAgICAgJ3Jvb3QnOiAnLi4vZmlsZS50ZXgnXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnaGFuZGxlcyBtYWdpYyBjb21tZW50cyB3aXRob3V0IG9wdGlvbmFsIHdoaXRlc3BhY2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdtYWdpYy1jb21tZW50cycsICduby13aGl0ZXNwYWNlLnRleCcpXG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgTWFnaWNQYXJzZXIoZmlsZVBhdGgpXG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIucGFyc2UoKVxuXG4gICAgICBleHBlY3QocmVzdWx0KS5ub3QudG9FcXVhbCh7fSlcbiAgICB9KVxuICAgIGl0KCdkZXRlY3RzIG11bHRpcGxlIG9iamVjdCBpbmZvcm1hdGlvbiB3aGVuIG11bHRpcGxlIG1hZ2ljZSBjb21tZW50cyBhcmUgZGVmaW5lZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ21hZ2ljLWNvbW1lbnRzJywgJ211bHRpcGxlLW1hZ2ljLWNvbW1lbnRzLnRleCcpXG4gICAgICBjb25zdCBwYXJzZXIgPSBuZXcgTWFnaWNQYXJzZXIoZmlsZVBhdGgpXG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIucGFyc2UoKVxuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKHtcbiAgICAgICAgJ3Jvb3QnOiAnLi4vZmlsZS50ZXgnLFxuICAgICAgICAncHJvZ3JhbSc6ICdsdWFsYXRleCdcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=