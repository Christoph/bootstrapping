function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _specHelpers = require('./spec-helpers');

var _specHelpers2 = _interopRequireDefault(_specHelpers);

var _stubs = require('./stubs');

var _libBuilderRegistry = require('../lib/builder-registry');

var _libBuilderRegistry2 = _interopRequireDefault(_libBuilderRegistry);

var _libBuildState = require('../lib/build-state');

var _libBuildState2 = _interopRequireDefault(_libBuildState);

describe('BuilderRegistry', function () {
  var builderRegistry = undefined;

  beforeEach(function () {
    waitsForPromise(function () {
      return _specHelpers2['default'].activatePackages();
    });

    atom.config.set('latex.builder', 'latexmk');
    builderRegistry = new _libBuilderRegistry2['default']();
  });

  describe('getBuilderImplementation', function () {
    it('returns null when no builders are associated with the given file', function () {
      var state = new _libBuildState2['default']('quux.txt');
      expect(builderRegistry.getBuilderImplementation(state)).toBeNull();
    });

    it('returns the configured builder when given a regular .tex file', function () {
      var state = new _libBuildState2['default']('foo.tex');
      expect(builderRegistry.getBuilderImplementation(state).name).toEqual('LatexmkBuilder');
    });

    it('throws an error when unable to resolve ambiguous builder registration', function () {
      var allBuilders = builderRegistry.getAllBuilders().push(_stubs.NullBuilder);
      var state = new _libBuildState2['default']('foo.tex');
      spyOn(builderRegistry, 'getAllBuilders').andReturn(allBuilders);
      expect(function () {
        builderRegistry.getBuilderImplementation(state);
      }).toThrow();
    });

    it('returns the Knitr builder when presented with an .Rnw file', function () {
      var state = new _libBuildState2['default']('bar.Rnw');
      expect(builderRegistry.getBuilderImplementation(state).name).toEqual('KnitrBuilder');
    });
  });

  describe('getBuilder', function () {
    beforeEach(function () {
      atom.config.set('latex.builder', 'latexmk');
    });

    it('returns null when passed an unhandled file type', function () {
      var state = new _libBuildState2['default']('quux.txt');
      expect(builderRegistry.getBuilder(state)).toBeNull();
    });

    it('returns a builder instance as configured for regular .tex files', function () {
      var state = new _libBuildState2['default']('foo.tex');
      expect(builderRegistry.getBuilder(state).constructor.name).toEqual('LatexmkBuilder');
    });

    it('returns a builder instance as configured for knitr files', function () {
      var state = new _libBuildState2['default']('bar.Rnw');
      expect(builderRegistry.getBuilder(state).constructor.name).toEqual('KnitrBuilder');
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvYnVpbGQtcmVnaXN0cnktc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OzJCQUVvQixnQkFBZ0I7Ozs7cUJBQ1IsU0FBUzs7a0NBQ1QseUJBQXlCOzs7OzZCQUM5QixvQkFBb0I7Ozs7QUFFM0MsUUFBUSxDQUFDLGlCQUFpQixFQUFFLFlBQU07QUFDaEMsTUFBSSxlQUFlLFlBQUEsQ0FBQTs7QUFFbkIsWUFBVSxDQUFDLFlBQU07QUFDZixtQkFBZSxDQUFDO2FBQU0seUJBQVEsZ0JBQWdCLEVBQUU7S0FBQSxDQUFDLENBQUE7O0FBRWpELFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUMzQyxtQkFBZSxHQUFHLHFDQUFxQixDQUFBO0dBQ3hDLENBQUMsQ0FBQTs7QUFFRixVQUFRLENBQUMsMEJBQTBCLEVBQUUsWUFBTTtBQUN6QyxNQUFFLENBQUMsa0VBQWtFLEVBQUUsWUFBTTtBQUMzRSxVQUFNLEtBQUssR0FBRywrQkFBZSxVQUFVLENBQUMsQ0FBQTtBQUN4QyxZQUFNLENBQUMsZUFBZSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7S0FDbkUsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQywrREFBK0QsRUFBRSxZQUFNO0FBQ3hFLFVBQU0sS0FBSyxHQUFHLCtCQUFlLFNBQVMsQ0FBQyxDQUFBO0FBQ3ZDLFlBQU0sQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7S0FDdkYsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyx1RUFBdUUsRUFBRSxZQUFNO0FBQ2hGLFVBQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLG9CQUFhLENBQUE7QUFDdEUsVUFBTSxLQUFLLEdBQUcsK0JBQWUsU0FBUyxDQUFDLENBQUE7QUFDdkMsV0FBSyxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUMvRCxZQUFNLENBQUMsWUFBTTtBQUFFLHVCQUFlLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUE7T0FBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDNUUsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyw0REFBNEQsRUFBRSxZQUFNO0FBQ3JFLFVBQU0sS0FBSyxHQUFHLCtCQUFlLFNBQVMsQ0FBQyxDQUFBO0FBQ3ZDLFlBQU0sQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0tBQ3JGLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTs7QUFFRixVQUFRLENBQUMsWUFBWSxFQUFFLFlBQU07QUFDM0IsY0FBVSxDQUFDLFlBQU07QUFDZixVQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUE7S0FDNUMsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyxpREFBaUQsRUFBRSxZQUFNO0FBQzFELFVBQU0sS0FBSyxHQUFHLCtCQUFlLFVBQVUsQ0FBQyxDQUFBO0FBQ3hDLFlBQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7S0FDckQsQ0FBQyxDQUFBOztBQUVGLE1BQUUsQ0FBQyxpRUFBaUUsRUFBRSxZQUFNO0FBQzFFLFVBQU0sS0FBSyxHQUFHLCtCQUFlLFNBQVMsQ0FBQyxDQUFBO0FBQ3ZDLFlBQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtLQUNyRixDQUFDLENBQUE7O0FBRUYsTUFBRSxDQUFDLDBEQUEwRCxFQUFFLFlBQU07QUFDbkUsVUFBTSxLQUFLLEdBQUcsK0JBQWUsU0FBUyxDQUFDLENBQUE7QUFDdkMsWUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtLQUNuRixDQUFDLENBQUE7R0FDSCxDQUFDLENBQUE7Q0FDSCxDQUFDLENBQUEiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGF0ZXgvc3BlYy9idWlsZC1yZWdpc3RyeS1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgaGVscGVycyBmcm9tICcuL3NwZWMtaGVscGVycydcbmltcG9ydCB7IE51bGxCdWlsZGVyIH0gZnJvbSAnLi9zdHVicydcbmltcG9ydCBCdWlsZGVyUmVnaXN0cnkgZnJvbSAnLi4vbGliL2J1aWxkZXItcmVnaXN0cnknXG5pbXBvcnQgQnVpbGRTdGF0ZSBmcm9tICcuLi9saWIvYnVpbGQtc3RhdGUnXG5cbmRlc2NyaWJlKCdCdWlsZGVyUmVnaXN0cnknLCAoKSA9PiB7XG4gIGxldCBidWlsZGVyUmVnaXN0cnlcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gaGVscGVycy5hY3RpdmF0ZVBhY2thZ2VzKCkpXG5cbiAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4LmJ1aWxkZXInLCAnbGF0ZXhtaycpXG4gICAgYnVpbGRlclJlZ2lzdHJ5ID0gbmV3IEJ1aWxkZXJSZWdpc3RyeSgpXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2dldEJ1aWxkZXJJbXBsZW1lbnRhdGlvbicsICgpID0+IHtcbiAgICBpdCgncmV0dXJucyBudWxsIHdoZW4gbm8gYnVpbGRlcnMgYXJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gZmlsZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ3F1dXgudHh0JylcbiAgICAgIGV4cGVjdChidWlsZGVyUmVnaXN0cnkuZ2V0QnVpbGRlckltcGxlbWVudGF0aW9uKHN0YXRlKSkudG9CZU51bGwoKVxuICAgIH0pXG5cbiAgICBpdCgncmV0dXJucyB0aGUgY29uZmlndXJlZCBidWlsZGVyIHdoZW4gZ2l2ZW4gYSByZWd1bGFyIC50ZXggZmlsZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ2Zvby50ZXgnKVxuICAgICAgZXhwZWN0KGJ1aWxkZXJSZWdpc3RyeS5nZXRCdWlsZGVySW1wbGVtZW50YXRpb24oc3RhdGUpLm5hbWUpLnRvRXF1YWwoJ0xhdGV4bWtCdWlsZGVyJylcbiAgICB9KVxuXG4gICAgaXQoJ3Rocm93cyBhbiBlcnJvciB3aGVuIHVuYWJsZSB0byByZXNvbHZlIGFtYmlndW91cyBidWlsZGVyIHJlZ2lzdHJhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGFsbEJ1aWxkZXJzID0gYnVpbGRlclJlZ2lzdHJ5LmdldEFsbEJ1aWxkZXJzKCkucHVzaChOdWxsQnVpbGRlcilcbiAgICAgIGNvbnN0IHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ2Zvby50ZXgnKVxuICAgICAgc3B5T24oYnVpbGRlclJlZ2lzdHJ5LCAnZ2V0QWxsQnVpbGRlcnMnKS5hbmRSZXR1cm4oYWxsQnVpbGRlcnMpXG4gICAgICBleHBlY3QoKCkgPT4geyBidWlsZGVyUmVnaXN0cnkuZ2V0QnVpbGRlckltcGxlbWVudGF0aW9uKHN0YXRlKSB9KS50b1Rocm93KClcbiAgICB9KVxuXG4gICAgaXQoJ3JldHVybnMgdGhlIEtuaXRyIGJ1aWxkZXIgd2hlbiBwcmVzZW50ZWQgd2l0aCBhbiAuUm53IGZpbGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IG5ldyBCdWlsZFN0YXRlKCdiYXIuUm53JylcbiAgICAgIGV4cGVjdChidWlsZGVyUmVnaXN0cnkuZ2V0QnVpbGRlckltcGxlbWVudGF0aW9uKHN0YXRlKS5uYW1lKS50b0VxdWFsKCdLbml0ckJ1aWxkZXInKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2dldEJ1aWxkZXInLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4LmJ1aWxkZXInLCAnbGF0ZXhtaycpXG4gICAgfSlcblxuICAgIGl0KCdyZXR1cm5zIG51bGwgd2hlbiBwYXNzZWQgYW4gdW5oYW5kbGVkIGZpbGUgdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ3F1dXgudHh0JylcbiAgICAgIGV4cGVjdChidWlsZGVyUmVnaXN0cnkuZ2V0QnVpbGRlcihzdGF0ZSkpLnRvQmVOdWxsKClcbiAgICB9KVxuXG4gICAgaXQoJ3JldHVybnMgYSBidWlsZGVyIGluc3RhbmNlIGFzIGNvbmZpZ3VyZWQgZm9yIHJlZ3VsYXIgLnRleCBmaWxlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ2Zvby50ZXgnKVxuICAgICAgZXhwZWN0KGJ1aWxkZXJSZWdpc3RyeS5nZXRCdWlsZGVyKHN0YXRlKS5jb25zdHJ1Y3Rvci5uYW1lKS50b0VxdWFsKCdMYXRleG1rQnVpbGRlcicpXG4gICAgfSlcblxuICAgIGl0KCdyZXR1cm5zIGEgYnVpbGRlciBpbnN0YW5jZSBhcyBjb25maWd1cmVkIGZvciBrbml0ciBmaWxlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ2Jhci5SbncnKVxuICAgICAgZXhwZWN0KGJ1aWxkZXJSZWdpc3RyeS5nZXRCdWlsZGVyKHN0YXRlKS5jb25zdHJ1Y3Rvci5uYW1lKS50b0VxdWFsKCdLbml0ckJ1aWxkZXInKVxuICAgIH0pXG4gIH0pXG59KVxuIl19