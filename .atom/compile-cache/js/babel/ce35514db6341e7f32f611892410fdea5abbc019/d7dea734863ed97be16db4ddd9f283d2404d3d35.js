function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _specHelpers = require('./spec-helpers');

var _specHelpers2 = _interopRequireDefault(_specHelpers);

var _libMarkerManager = require('../lib/marker-manager');

var _libMarkerManager2 = _interopRequireDefault(_libMarkerManager);

describe('MarkerManager', function () {
  beforeEach(function () {
    waitsForPromise(function () {
      return _specHelpers2['default'].activatePackages();
    });
  });

  describe('addMarkers', function () {
    it('verifies that only messages that have a range and a matching file path are marked', function () {
      var editor = {
        getPath: function getPath() {
          return 'foo.tex';
        },
        onDidDestroy: function onDidDestroy() {
          return { dispose: function dispose() {
              return null;
            } };
        }
      };
      var manager = new _libMarkerManager2['default'](editor);
      var messages = [{
        type: 'error',
        range: [[0, 0], [0, 1]],
        filePath: 'foo.tex'
      }, {
        type: 'warning',
        range: [[0, 0], [0, 1]],
        filePath: 'bar.tex'
      }, {
        type: 'info',
        filePath: 'foo.tex'
      }];
      spyOn(manager, 'addMarker');

      manager.addMarkers(messages, false);

      expect(manager.addMarker).toHaveBeenCalledWith('error', 'foo.tex', [[0, 0], [0, 1]]);
      expect(manager.addMarker.calls.length).toEqual(1);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvbWFya2VyLW1hbmFnZXItc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OzJCQUVvQixnQkFBZ0I7Ozs7Z0NBQ1YsdUJBQXVCOzs7O0FBRWpELFFBQVEsQ0FBQyxlQUFlLEVBQUUsWUFBTTtBQUM5QixZQUFVLENBQUMsWUFBTTtBQUNmLG1CQUFlLENBQUMsWUFBTTtBQUNwQixhQUFPLHlCQUFRLGdCQUFnQixFQUFFLENBQUE7S0FDbEMsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBOztBQUVGLFVBQVEsQ0FBQyxZQUFZLEVBQUUsWUFBTTtBQUMzQixNQUFFLENBQUMsbUZBQW1GLEVBQUUsWUFBTTtBQUM1RixVQUFNLE1BQU0sR0FBRztBQUNiLGVBQU8sRUFBRTtpQkFBTSxTQUFTO1NBQUE7QUFDeEIsb0JBQVksRUFBRSx3QkFBTTtBQUFFLGlCQUFPLEVBQUUsT0FBTyxFQUFFO3FCQUFNLElBQUk7YUFBQSxFQUFFLENBQUE7U0FBRTtPQUN2RCxDQUFBO0FBQ0QsVUFBTSxPQUFPLEdBQUcsa0NBQWtCLE1BQU0sQ0FBQyxDQUFBO0FBQ3pDLFVBQU0sUUFBUSxHQUFHLENBQUM7QUFDaEIsWUFBSSxFQUFFLE9BQU87QUFDYixhQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN2QixnQkFBUSxFQUFFLFNBQVM7T0FDcEIsRUFBRTtBQUNELFlBQUksRUFBRSxTQUFTO0FBQ2YsYUFBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkIsZ0JBQVEsRUFBRSxTQUFTO09BQ3BCLEVBQUU7QUFDRCxZQUFJLEVBQUUsTUFBTTtBQUNaLGdCQUFRLEVBQUUsU0FBUztPQUNwQixDQUFDLENBQUE7QUFDRixXQUFLLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFBOztBQUUzQixhQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQTs7QUFFbkMsWUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3BGLFlBQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDbEQsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBO0NBQ0gsQ0FBQyxDQUFBIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvbWFya2VyLW1hbmFnZXItc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IGhlbHBlcnMgZnJvbSAnLi9zcGVjLWhlbHBlcnMnXG5pbXBvcnQgTWFya2VyTWFuYWdlciBmcm9tICcuLi9saWIvbWFya2VyLW1hbmFnZXInXG5cbmRlc2NyaWJlKCdNYXJrZXJNYW5hZ2VyJywgKCkgPT4ge1xuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgcmV0dXJuIGhlbHBlcnMuYWN0aXZhdGVQYWNrYWdlcygpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnYWRkTWFya2VycycsICgpID0+IHtcbiAgICBpdCgndmVyaWZpZXMgdGhhdCBvbmx5IG1lc3NhZ2VzIHRoYXQgaGF2ZSBhIHJhbmdlIGFuZCBhIG1hdGNoaW5nIGZpbGUgcGF0aCBhcmUgbWFya2VkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0ge1xuICAgICAgICBnZXRQYXRoOiAoKSA9PiAnZm9vLnRleCcsXG4gICAgICAgIG9uRGlkRGVzdHJveTogKCkgPT4geyByZXR1cm4geyBkaXNwb3NlOiAoKSA9PiBudWxsIH0gfVxuICAgICAgfVxuICAgICAgY29uc3QgbWFuYWdlciA9IG5ldyBNYXJrZXJNYW5hZ2VyKGVkaXRvcilcbiAgICAgIGNvbnN0IG1lc3NhZ2VzID0gW3tcbiAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgcmFuZ2U6IFtbMCwgMF0sIFswLCAxXV0sXG4gICAgICAgIGZpbGVQYXRoOiAnZm9vLnRleCdcbiAgICAgIH0sIHtcbiAgICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgICByYW5nZTogW1swLCAwXSwgWzAsIDFdXSxcbiAgICAgICAgZmlsZVBhdGg6ICdiYXIudGV4J1xuICAgICAgfSwge1xuICAgICAgICB0eXBlOiAnaW5mbycsXG4gICAgICAgIGZpbGVQYXRoOiAnZm9vLnRleCdcbiAgICAgIH1dXG4gICAgICBzcHlPbihtYW5hZ2VyLCAnYWRkTWFya2VyJylcblxuICAgICAgbWFuYWdlci5hZGRNYXJrZXJzKG1lc3NhZ2VzLCBmYWxzZSlcblxuICAgICAgZXhwZWN0KG1hbmFnZXIuYWRkTWFya2VyKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnZXJyb3InLCAnZm9vLnRleCcsIFtbMCwgMF0sIFswLCAxXV0pXG4gICAgICBleHBlY3QobWFuYWdlci5hZGRNYXJrZXIuY2FsbHMubGVuZ3RoKS50b0VxdWFsKDEpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=