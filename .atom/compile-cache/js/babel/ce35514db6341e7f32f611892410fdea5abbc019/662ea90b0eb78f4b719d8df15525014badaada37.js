function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _temp = require('temp');

var _temp2 = _interopRequireDefault(_temp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libProcessManager = require('../lib/process-manager');

var _libProcessManager2 = _interopRequireDefault(_libProcessManager);

describe('ProcessManager', function () {
  var processManager = undefined;

  function constructCommand(fileName) {
    var tempPath = _fsPlus2['default'].realpathSync(_temp2['default'].mkdirSync('latex'));
    var filePath = _path2['default'].join(tempPath, fileName);
    return 'latexmk -cd -f -pdf "' + filePath + '"';
  }

  beforeEach(function () {
    processManager = new _libProcessManager2['default']();
  });

  describe('ProcessManager', function () {
    it('kills latexmk when given non-existant file', function () {
      var killed = false;

      processManager.executeChildProcess(constructCommand('foo.tex'), { allowKill: true }).then(function (result) {
        killed = true;
      });
      processManager.killChildProcesses();

      waitsFor(function () {
        return killed;
      }, 5000);
    });

    it('kills old latexmk instances, but not ones created after the kill command', function () {
      var oldKilled = false;
      var newKilled = false;

      processManager.executeChildProcess(constructCommand('old.tex'), { allowKill: true }).then(function (result) {
        oldKilled = true;
      });
      processManager.killChildProcesses();
      processManager.executeChildProcess(constructCommand('new.tex'), { allowKill: true }).then(function (result) {
        newKilled = true;
      });

      waitsFor(function () {
        return oldKilled;
      }, 5000);

      runs(function () {
        expect(newKilled).toBe(false);
        processManager.killChildProcesses();
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvcHJvY2Vzcy1tYW5hZ2VyLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztzQkFFZSxTQUFTOzs7O29CQUNQLE1BQU07Ozs7b0JBQ04sTUFBTTs7OztpQ0FDSSx3QkFBd0I7Ozs7QUFFbkQsUUFBUSxDQUFDLGdCQUFnQixFQUFFLFlBQU07QUFDL0IsTUFBSSxjQUFjLFlBQUEsQ0FBQTs7QUFFbEIsV0FBUyxnQkFBZ0IsQ0FBRSxRQUFRLEVBQUU7QUFDbkMsUUFBTSxRQUFRLEdBQUcsb0JBQUcsWUFBWSxDQUFDLGtCQUFLLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO0FBQ3pELFFBQU0sUUFBUSxHQUFHLGtCQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDOUMscUNBQStCLFFBQVEsT0FBRztHQUMzQzs7QUFFRCxZQUFVLENBQUMsWUFBTTtBQUNmLGtCQUFjLEdBQUcsb0NBQW9CLENBQUE7R0FDdEMsQ0FBQyxDQUFBOztBQUVGLFVBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxZQUFNO0FBQy9CLE1BQUUsQ0FBQyw0Q0FBNEMsRUFBRSxZQUFNO0FBQ3JELFVBQUksTUFBTSxHQUFHLEtBQUssQ0FBQTs7QUFFbEIsb0JBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUFFLGNBQU0sR0FBRyxJQUFJLENBQUE7T0FBRSxDQUFDLENBQUE7QUFDdEgsb0JBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBOztBQUVuQyxjQUFRLENBQUM7ZUFBTSxNQUFNO09BQUEsRUFBRSxJQUFJLENBQUMsQ0FBQTtLQUM3QixDQUFDLENBQUE7O0FBRUYsTUFBRSxDQUFDLDBFQUEwRSxFQUFFLFlBQU07QUFDbkYsVUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFVBQUksU0FBUyxHQUFHLEtBQUssQ0FBQTs7QUFFckIsb0JBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUFFLGlCQUFTLEdBQUcsSUFBSSxDQUFBO09BQUUsQ0FBQyxDQUFBO0FBQ3pILG9CQUFjLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtBQUNuQyxvQkFBYyxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQUUsaUJBQVMsR0FBRyxJQUFJLENBQUE7T0FBRSxDQUFDLENBQUE7O0FBRXpILGNBQVEsQ0FBQztlQUFNLFNBQVM7T0FBQSxFQUFFLElBQUksQ0FBQyxDQUFBOztBQUUvQixVQUFJLENBQUMsWUFBTTtBQUNULGNBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDN0Isc0JBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO09BQ3BDLENBQUMsQ0FBQTtLQUNILENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTtDQUNILENBQUMsQ0FBQSIsImZpbGUiOiIvaG9tZS9jaHJpcy8uYXRvbS9wYWNrYWdlcy9sYXRleC9zcGVjL3Byb2Nlc3MtbWFuYWdlci1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMtcGx1cydcbmltcG9ydCB0ZW1wIGZyb20gJ3RlbXAnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IFByb2Nlc3NNYW5hZ2VyIGZyb20gJy4uL2xpYi9wcm9jZXNzLW1hbmFnZXInXG5cbmRlc2NyaWJlKCdQcm9jZXNzTWFuYWdlcicsICgpID0+IHtcbiAgbGV0IHByb2Nlc3NNYW5hZ2VyXG5cbiAgZnVuY3Rpb24gY29uc3RydWN0Q29tbWFuZCAoZmlsZU5hbWUpIHtcbiAgICBjb25zdCB0ZW1wUGF0aCA9IGZzLnJlYWxwYXRoU3luYyh0ZW1wLm1rZGlyU3luYygnbGF0ZXgnKSlcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0ZW1wUGF0aCwgZmlsZU5hbWUpXG4gICAgcmV0dXJuIGBsYXRleG1rIC1jZCAtZiAtcGRmIFwiJHtmaWxlUGF0aH1cImBcbiAgfVxuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHByb2Nlc3NNYW5hZ2VyID0gbmV3IFByb2Nlc3NNYW5hZ2VyKClcbiAgfSlcblxuICBkZXNjcmliZSgnUHJvY2Vzc01hbmFnZXInLCAoKSA9PiB7XG4gICAgaXQoJ2tpbGxzIGxhdGV4bWsgd2hlbiBnaXZlbiBub24tZXhpc3RhbnQgZmlsZScsICgpID0+IHtcbiAgICAgIGxldCBraWxsZWQgPSBmYWxzZVxuXG4gICAgICBwcm9jZXNzTWFuYWdlci5leGVjdXRlQ2hpbGRQcm9jZXNzKGNvbnN0cnVjdENvbW1hbmQoJ2Zvby50ZXgnKSwgeyBhbGxvd0tpbGw6IHRydWUgfSkudGhlbihyZXN1bHQgPT4geyBraWxsZWQgPSB0cnVlIH0pXG4gICAgICBwcm9jZXNzTWFuYWdlci5raWxsQ2hpbGRQcm9jZXNzZXMoKVxuXG4gICAgICB3YWl0c0ZvcigoKSA9PiBraWxsZWQsIDUwMDApXG4gICAgfSlcblxuICAgIGl0KCdraWxscyBvbGQgbGF0ZXhtayBpbnN0YW5jZXMsIGJ1dCBub3Qgb25lcyBjcmVhdGVkIGFmdGVyIHRoZSBraWxsIGNvbW1hbmQnLCAoKSA9PiB7XG4gICAgICBsZXQgb2xkS2lsbGVkID0gZmFsc2VcbiAgICAgIGxldCBuZXdLaWxsZWQgPSBmYWxzZVxuXG4gICAgICBwcm9jZXNzTWFuYWdlci5leGVjdXRlQ2hpbGRQcm9jZXNzKGNvbnN0cnVjdENvbW1hbmQoJ29sZC50ZXgnKSwgeyBhbGxvd0tpbGw6IHRydWUgfSkudGhlbihyZXN1bHQgPT4geyBvbGRLaWxsZWQgPSB0cnVlIH0pXG4gICAgICBwcm9jZXNzTWFuYWdlci5raWxsQ2hpbGRQcm9jZXNzZXMoKVxuICAgICAgcHJvY2Vzc01hbmFnZXIuZXhlY3V0ZUNoaWxkUHJvY2Vzcyhjb25zdHJ1Y3RDb21tYW5kKCduZXcudGV4JyksIHsgYWxsb3dLaWxsOiB0cnVlIH0pLnRoZW4ocmVzdWx0ID0+IHsgbmV3S2lsbGVkID0gdHJ1ZSB9KVxuXG4gICAgICB3YWl0c0ZvcigoKSA9PiBvbGRLaWxsZWQsIDUwMDApXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QobmV3S2lsbGVkKS50b0JlKGZhbHNlKVxuICAgICAgICBwcm9jZXNzTWFuYWdlci5raWxsQ2hpbGRQcm9jZXNzZXMoKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxufSlcbiJdfQ==