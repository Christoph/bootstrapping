Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */

var _libBuilder = require('../lib/builder');

var _libBuilder2 = _interopRequireDefault(_libBuilder);

var _libLogger = require('../lib/logger');

var _libLogger2 = _interopRequireDefault(_libLogger);

var _libOpener = require('../lib/opener');

var _libOpener2 = _interopRequireDefault(_libOpener);

var NullBuilder = (function (_Builder) {
  _inherits(NullBuilder, _Builder);

  function NullBuilder() {
    _classCallCheck(this, NullBuilder);

    _get(Object.getPrototypeOf(NullBuilder.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(NullBuilder, null, [{
    key: 'canProcess',
    value: function canProcess(filePath) {
      return filePath.endsWith(NullBuilder.extension);
    }
  }, {
    key: 'extension',
    value: '.tex',
    enumerable: true
  }]);

  return NullBuilder;
})(_libBuilder2['default']);

exports.NullBuilder = NullBuilder;

var NullLogger = (function (_Logger) {
  _inherits(NullLogger, _Logger);

  function NullLogger() {
    _classCallCheck(this, NullLogger);

    _get(Object.getPrototypeOf(NullLogger.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(NullLogger, [{
    key: 'error',
    value: function error() {}
  }, {
    key: 'warning',
    value: function warning() {}
  }, {
    key: 'info',
    value: function info() {}
  }]);

  return NullLogger;
})(_libLogger2['default']);

exports.NullLogger = NullLogger;

var NullOpener = (function (_Opener) {
  _inherits(NullOpener, _Opener);

  function NullOpener() {
    _classCallCheck(this, NullOpener);

    _get(Object.getPrototypeOf(NullOpener.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(NullOpener, [{
    key: 'open',
    value: function open() {}
  }]);

  return NullOpener;
})(_libOpener2['default']);

exports.NullOpener = NullOpener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvc3R1YnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OzswQkFFb0IsZ0JBQWdCOzs7O3lCQUNqQixlQUFlOzs7O3lCQUNmLGVBQWU7Ozs7SUFFckIsV0FBVztZQUFYLFdBQVc7O1dBQVgsV0FBVzswQkFBWCxXQUFXOzsrQkFBWCxXQUFXOzs7ZUFBWCxXQUFXOztXQUVKLG9CQUFDLFFBQVEsRUFBRTtBQUFFLGFBQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUE7S0FBRTs7O1dBRDdELE1BQU07Ozs7U0FEZCxXQUFXOzs7OztJQUtYLFVBQVU7WUFBVixVQUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7O2VBQVYsVUFBVTs7V0FDZixpQkFBRyxFQUFFOzs7V0FDSCxtQkFBRyxFQUFFOzs7V0FDUixnQkFBRyxFQUFFOzs7U0FIQyxVQUFVOzs7OztJQU1WLFVBQVU7WUFBVixVQUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7O2VBQVYsVUFBVTs7V0FDaEIsZ0JBQUcsRUFBRTs7O1NBREMsVUFBVSIsImZpbGUiOiIvaG9tZS9jaHJpcy8uYXRvbS9wYWNrYWdlcy9sYXRleC9zcGVjL3N0dWJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgQnVpbGRlciBmcm9tICcuLi9saWIvYnVpbGRlcidcbmltcG9ydCBMb2dnZXIgZnJvbSAnLi4vbGliL2xvZ2dlcidcbmltcG9ydCBPcGVuZXIgZnJvbSAnLi4vbGliL29wZW5lcidcblxuZXhwb3J0IGNsYXNzIE51bGxCdWlsZGVyIGV4dGVuZHMgQnVpbGRlciB7XG4gIHN0YXRpYyBleHRlbnNpb24gPSAnLnRleCdcbiAgc3RhdGljIGNhblByb2Nlc3MgKGZpbGVQYXRoKSB7IHJldHVybiBmaWxlUGF0aC5lbmRzV2l0aChOdWxsQnVpbGRlci5leHRlbnNpb24pIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bGxMb2dnZXIgZXh0ZW5kcyBMb2dnZXIge1xuICBlcnJvciAoKSB7fVxuICB3YXJuaW5nICgpIHt9XG4gIGluZm8gKCkge31cbn1cblxuZXhwb3J0IGNsYXNzIE51bGxPcGVuZXIgZXh0ZW5kcyBPcGVuZXIge1xuICBvcGVuICgpIHt9XG59XG4iXX0=