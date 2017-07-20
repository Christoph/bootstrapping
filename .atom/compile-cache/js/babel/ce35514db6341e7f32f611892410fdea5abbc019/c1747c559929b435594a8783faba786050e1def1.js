function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _path = require('path');

var path = _interopRequireWildcard(_path);

// NOTE: If using 'fit' you must add it to the list below!

var _jasmineFix = require('jasmine-fix');

// eslint-disable-line import/no-extraneous-dependencies

var _libMain = require('../lib/main');

var _libMain2 = _interopRequireDefault(_libMain);

// Fixture paths
'use babel';

var invalidPath = path.join(__dirname, 'fixtures', 'invalid', 'invalid.ts');
var noConfigPath = path.join(__dirname, 'fixtures', 'no-config', 'noConfig.ts');
var validPath = path.join(__dirname, 'fixtures', 'valid', 'valid.ts');
var validTypecheckedPath = path.join(__dirname, 'fixtures', 'valid-typechecked', 'valid-typechecked.ts');
var invalidTypecheckedPath = path.join(__dirname, 'fixtures', 'invalid-typechecked', 'invalid-typechecked.ts');

describe('The TSLint provider for Linter', function () {
  var lint = _libMain2['default'].provideLinter().lint;

  (0, _jasmineFix.beforeEach)(_asyncToGenerator(function* () {
    yield atom.packages.activatePackage('linter-tslint');
  }));

  describe('When the package is activated', function () {
    describe('When dealing with typechecking off (no semantic rules)', function () {
      (0, _jasmineFix.it)('finds nothing wrong with a valid file', _asyncToGenerator(function* () {
        var editor = yield atom.workspace.open(validPath);
        var result = yield lint(editor);
        expect(result.length).toBe(0);
      }));

      (0, _jasmineFix.it)('handles messages from TSLint', _asyncToGenerator(function* () {
        var expectedMsgRegEx = /Missing semicolon \(<a href=".*">semicolon<\/a>\)/;
        var editor = yield atom.workspace.open(invalidPath);
        var result = yield lint(editor);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('warning');
        expect(expectedMsgRegEx.test(result[0].html)).toBeTruthy();
        expect(result[0].text).not.toBeDefined();
        expect(result[0].filePath).toBe(invalidPath);
        expect(result[0].range).toEqual([[0, 14], [0, 14]]);
      }));

      (0, _jasmineFix.it)('handles undefined filepath', _asyncToGenerator(function* () {
        var editor = yield atom.workspace.open();
        var result = yield lint(editor);
        expect(result).toBeNull();
      }));

      (0, _jasmineFix.it)('finishes validatation even when there is no tslint.json', _asyncToGenerator(function* () {
        var editor = yield atom.workspace.open(noConfigPath);
        yield lint(editor);
      }));
    });

    describe('When dealing with typechecking on (with semantic rules)', function () {
      (0, _jasmineFix.beforeEach)(function () {
        atom.config.set('linter-tslint.enableSemanticRules', true);
      });

      afterEach(function () {
        atom.config.set('linter-tslint.enableSemanticRules', false);
      });

      (0, _jasmineFix.it)('finds nothing wrong with a valid file', _asyncToGenerator(function* () {
        var editor = yield atom.workspace.open(validTypecheckedPath);
        var result = yield lint(editor);
        expect(result.length).toBe(0);
      }));

      (0, _jasmineFix.it)('handles messages from TSLint', _asyncToGenerator(function* () {
        var expectedMsgRegEx = /This expression is unnecessarily compared to a boolean. Just use it directly. \(<a href=".*">no-boolean-literal-compare<\/a>\)/;
        var editor = yield atom.workspace.open(invalidTypecheckedPath);
        var result = yield lint(editor);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('error');
        expect(expectedMsgRegEx.test(result[0].html)).toBeTruthy();
        expect(result[0].text).not.toBeDefined();
        expect(result[0].filePath).toBe(invalidTypecheckedPath);
        expect(result[0].range).toEqual([[1, 0], [1, 1]]);
      }));
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10c2xpbnQvc3BlYy9saW50ZXItdHNsaW50LXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUVzQixNQUFNOztJQUFoQixJQUFJOzs7OzBCQUVlLGFBQWE7Ozs7dUJBQ25CLGFBQWE7Ozs7O0FBTHRDLFdBQVcsQ0FBQzs7QUFRWixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlFLElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDbEYsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RSxJQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0FBQzNHLElBQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixFQUFFLHdCQUF3QixDQUFDLENBQUM7O0FBRWpILFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRSxZQUFNO0FBQy9DLE1BQU0sSUFBSSxHQUFHLHFCQUFhLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQzs7QUFFL0MsZ0RBQVcsYUFBWTtBQUNyQixVQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0dBQ3RELEVBQUMsQ0FBQzs7QUFFSCxVQUFRLENBQUMsK0JBQStCLEVBQUUsWUFBTTtBQUM5QyxZQUFRLENBQUMsd0RBQXdELEVBQUUsWUFBTTtBQUN2RSwwQkFBRyx1Q0FBdUMs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OztBQUVILDBCQUFHLDhCQUE4QixvQkFBRSxhQUFZO0FBQzdDLFlBQU0sZ0JBQWdCLEdBQUcsZ0lBQWdJLENBQUM7QUFDMUosWUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ2pFLFlBQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLGNBQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLGNBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JDLGNBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDM0QsY0FBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDekMsY0FBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN4RCxjQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNuRCxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7Q0FDSixDQUFDLENBQUMiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXRzbGludC9zcGVjL2xpbnRlci10c2xpbnQtc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuLy8gTk9URTogSWYgdXNpbmcgJ2ZpdCcgeW91IG11c3QgYWRkIGl0IHRvIHRoZSBsaXN0IGJlbG93IVxuaW1wb3J0IHsgYmVmb3JlRWFjaCwgaXQgfSBmcm9tICdqYXNtaW5lLWZpeCc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgbGludGVyVHNsaW50IGZyb20gJy4uL2xpYi9tYWluJztcblxuLy8gRml4dHVyZSBwYXRoc1xuY29uc3QgaW52YWxpZFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnLCAnaW52YWxpZCcsICdpbnZhbGlkLnRzJyk7XG5jb25zdCBub0NvbmZpZ1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnLCAnbm8tY29uZmlnJywgJ25vQ29uZmlnLnRzJyk7XG5jb25zdCB2YWxpZFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnLCAndmFsaWQnLCAndmFsaWQudHMnKTtcbmNvbnN0IHZhbGlkVHlwZWNoZWNrZWRQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJywgJ3ZhbGlkLXR5cGVjaGVja2VkJywgJ3ZhbGlkLXR5cGVjaGVja2VkLnRzJyk7XG5jb25zdCBpbnZhbGlkVHlwZWNoZWNrZWRQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJywgJ2ludmFsaWQtdHlwZWNoZWNrZWQnLCAnaW52YWxpZC10eXBlY2hlY2tlZC50cycpO1xuXG5kZXNjcmliZSgnVGhlIFRTTGludCBwcm92aWRlciBmb3IgTGludGVyJywgKCkgPT4ge1xuICBjb25zdCBsaW50ID0gbGludGVyVHNsaW50LnByb3ZpZGVMaW50ZXIoKS5saW50O1xuXG4gIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsaW50ZXItdHNsaW50Jyk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdXaGVuIHRoZSBwYWNrYWdlIGlzIGFjdGl2YXRlZCcsICgpID0+IHtcbiAgICBkZXNjcmliZSgnV2hlbiBkZWFsaW5nIHdpdGggdHlwZWNoZWNraW5nIG9mZiAobm8gc2VtYW50aWMgcnVsZXMpJywgKCkgPT4ge1xuICAgICAgaXQoJ2ZpbmRzIG5vdGhpbmcgd3Jvbmcgd2l0aCBhIHZhbGlkIGZpbGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4odmFsaWRQYXRoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbGludChlZGl0b3IpO1xuICAgICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG9CZSgwKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnaGFuZGxlcyBtZXNzYWdlcyBmcm9tIFRTTGludCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRNc2dSZWdFeCA9IC9NaXNzaW5nIHNlbWljb2xvbiBcXCg8YSBocmVmPVwiLipcIj5zZW1pY29sb248XFwvYT5cXCkvO1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGludmFsaWRQYXRoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbGludChlZGl0b3IpO1xuICAgICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdFswXS50eXBlKS50b0JlKCd3YXJuaW5nJyk7XG4gICAgICAgIGV4cGVjdChleHBlY3RlZE1zZ1JlZ0V4LnRlc3QocmVzdWx0WzBdLmh0bWwpKS50b0JlVHJ1dGh5KCk7XG4gICAgICAgIGV4cGVjdChyZXN1bHRbMF0udGV4dCkubm90LnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChyZXN1bHRbMF0uZmlsZVBhdGgpLnRvQmUoaW52YWxpZFBhdGgpO1xuICAgICAgICBleHBlY3QocmVzdWx0WzBdLnJhbmdlKS50b0VxdWFsKFtbMCwgMTRdLCBbMCwgMTRdXSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2hhbmRsZXMgdW5kZWZpbmVkIGZpbGVwYXRoJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxpbnQoZWRpdG9yKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZU51bGwoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnZmluaXNoZXMgdmFsaWRhdGF0aW9uIGV2ZW4gd2hlbiB0aGVyZSBpcyBubyB0c2xpbnQuanNvbicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3Blbihub0NvbmZpZ1BhdGgpO1xuICAgICAgICBhd2FpdCBsaW50KGVkaXRvcik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdXaGVuIGRlYWxpbmcgd2l0aCB0eXBlY2hlY2tpbmcgb24gKHdpdGggc2VtYW50aWMgcnVsZXMpJywgKCkgPT4ge1xuICAgICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLXRzbGludC5lbmFibGVTZW1hbnRpY1J1bGVzJywgdHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItdHNsaW50LmVuYWJsZVNlbWFudGljUnVsZXMnLCBmYWxzZSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2ZpbmRzIG5vdGhpbmcgd3Jvbmcgd2l0aCBhIHZhbGlkIGZpbGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4odmFsaWRUeXBlY2hlY2tlZFBhdGgpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsaW50KGVkaXRvcik7XG4gICAgICAgIGV4cGVjdChyZXN1bHQubGVuZ3RoKS50b0JlKDApO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdoYW5kbGVzIG1lc3NhZ2VzIGZyb20gVFNMaW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBleHBlY3RlZE1zZ1JlZ0V4ID0gL1RoaXMgZXhwcmVzc2lvbiBpcyB1bm5lY2Vzc2FyaWx5IGNvbXBhcmVkIHRvIGEgYm9vbGVhbi4gSnVzdCB1c2UgaXQgZGlyZWN0bHkuIFxcKDxhIGhyZWY9XCIuKlwiPm5vLWJvb2xlYW4tbGl0ZXJhbC1jb21wYXJlPFxcL2E+XFwpLztcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihpbnZhbGlkVHlwZWNoZWNrZWRQYXRoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbGludChlZGl0b3IpO1xuICAgICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdFswXS50eXBlKS50b0JlKCdlcnJvcicpO1xuICAgICAgICBleHBlY3QoZXhwZWN0ZWRNc2dSZWdFeC50ZXN0KHJlc3VsdFswXS5odG1sKSkudG9CZVRydXRoeSgpO1xuICAgICAgICBleHBlY3QocmVzdWx0WzBdLnRleHQpLm5vdC50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QocmVzdWx0WzBdLmZpbGVQYXRoKS50b0JlKGludmFsaWRUeXBlY2hlY2tlZFBhdGgpO1xuICAgICAgICBleHBlY3QocmVzdWx0WzBdLnJhbmdlKS50b0VxdWFsKFtbMSwgMF0sIFsxLCAxXV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=