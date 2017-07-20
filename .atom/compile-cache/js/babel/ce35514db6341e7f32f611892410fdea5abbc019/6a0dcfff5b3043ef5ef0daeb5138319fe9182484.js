function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _specHelpers = require('./spec-helpers');

var _specHelpers2 = _interopRequireDefault(_specHelpers);

describe('Latex', function () {
  beforeEach(function () {
    waitsForPromise(function () {
      return _specHelpers2['default'].activatePackages();
    });
  });

  describe('initialize', function () {
    it('initializes all properties', function () {
      expect(latex.log).toBeDefined();
      expect(latex.opener).toBeDefined();
      expect(latex.process).toBeDefined();
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvbGF0ZXgtc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OzJCQUVvQixnQkFBZ0I7Ozs7QUFFcEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxZQUFNO0FBQ3RCLFlBQVUsQ0FBQyxZQUFNO0FBQ2YsbUJBQWUsQ0FBQyxZQUFNO0FBQ3BCLGFBQU8seUJBQVEsZ0JBQWdCLEVBQUUsQ0FBQTtLQUNsQyxDQUFDLENBQUE7R0FDSCxDQUFDLENBQUE7O0FBRUYsVUFBUSxDQUFDLFlBQVksRUFBRSxZQUFNO0FBQzNCLE1BQUUsQ0FBQyw0QkFBNEIsRUFBRSxZQUFNO0FBQ3JDLFlBQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDL0IsWUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNsQyxZQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO0tBQ3BDLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTtDQUNILENBQUMsQ0FBQSIsImZpbGUiOiIvaG9tZS9jaHJpcy8uYXRvbS9wYWNrYWdlcy9sYXRleC9zcGVjL2xhdGV4LXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCBoZWxwZXJzIGZyb20gJy4vc3BlYy1oZWxwZXJzJ1xuXG5kZXNjcmliZSgnTGF0ZXgnLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICByZXR1cm4gaGVscGVycy5hY3RpdmF0ZVBhY2thZ2VzKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdpbml0aWFsaXplJywgKCkgPT4ge1xuICAgIGl0KCdpbml0aWFsaXplcyBhbGwgcHJvcGVydGllcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChsYXRleC5sb2cpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChsYXRleC5vcGVuZXIpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChsYXRleC5wcm9jZXNzKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=