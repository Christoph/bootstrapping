Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */
/** @jsx etch.dom */

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

var _atom = require('atom');

var _messageIcon = require('./message-icon');

var _messageIcon2 = _interopRequireDefault(_messageIcon);

var _fileReference = require('./file-reference');

var _fileReference2 = _interopRequireDefault(_fileReference);

var LogMessage = (function () {
  function LogMessage() {
    var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, LogMessage);

    this.properties = properties;
    _etch2['default'].initialize(this);
  }

  _createClass(LogMessage, [{
    key: 'destroy',
    value: _asyncToGenerator(function* () {
      yield _etch2['default'].destroy(this);
    })
  }, {
    key: 'render',
    value: function render() {
      var message = this.properties.message;

      return _etch2['default'].dom(
        'tr',
        { className: this.getClassNames(message) },
        _etch2['default'].dom(
          'td',
          null,
          _etch2['default'].dom(_messageIcon2['default'], { type: message.type })
        ),
        _etch2['default'].dom(
          'td',
          null,
          message.text
        ),
        _etch2['default'].dom(
          'td',
          null,
          _etch2['default'].dom(_fileReference2['default'], { file: message.filePath, range: message.range })
        ),
        _etch2['default'].dom(
          'td',
          null,
          _etch2['default'].dom(_fileReference2['default'], { file: message.logPath, range: message.logRange })
        )
      );
    }
  }, {
    key: 'getClassNames',
    value: function getClassNames(message) {
      var className = 'latex-' + message.type;

      var matchesFilePath = message.filePath && this.properties.filePath === message.filePath;
      var containsPosition = message.range && this.properties.position && _atom.Range.fromObject(message.range).containsPoint(this.properties.position);
      if (matchesFilePath && containsPosition) {
        return className + ' latex-highlight';
      }

      return className;
    }
  }, {
    key: 'update',
    value: function update(properties) {
      this.properties = properties;
      return _etch2['default'].update(this);
    }
  }]);

  return LogMessage;
})();

exports['default'] = LogMessage;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi92aWV3cy9sb2ctbWVzc2FnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7b0JBR2lCLE1BQU07Ozs7b0JBQ0QsTUFBTTs7MkJBQ0osZ0JBQWdCOzs7OzZCQUNkLGtCQUFrQjs7OztJQUV2QixVQUFVO0FBQ2pCLFdBRE8sVUFBVSxHQUNDO1FBQWpCLFVBQVUseURBQUcsRUFBRTs7MEJBRFQsVUFBVTs7QUFFM0IsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7QUFDNUIsc0JBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQ3RCOztlQUprQixVQUFVOzs2QkFNZixhQUFHO0FBQ2YsWUFBTSxrQkFBSyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDekI7OztXQUVNLGtCQUFHO0FBQ1IsVUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUE7O0FBRXZDLGFBQ0U7O1VBQUksU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEFBQUM7UUFDekM7OztVQUFJLGtEQUFhLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxBQUFDLEdBQUc7U0FBSztRQUM1Qzs7O1VBQUssT0FBTyxDQUFDLElBQUk7U0FBTTtRQUN2Qjs7O1VBQUksb0RBQWUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxRQUFRLEFBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssQUFBQyxHQUFHO1NBQUs7UUFDeEU7OztVQUFJLG9EQUFlLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxBQUFDLEVBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEFBQUMsR0FBRztTQUFLO09BQ3ZFLENBQ047S0FDRjs7O1dBRWEsdUJBQUMsT0FBTyxFQUFFO0FBQ3RCLFVBQU0sU0FBUyxjQUFZLE9BQU8sQ0FBQyxJQUFJLEFBQUUsQ0FBQTs7QUFFekMsVUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUMsUUFBUSxDQUFBO0FBQ3pGLFVBQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsSUFBSSxZQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDN0ksVUFBSSxlQUFlLElBQUksZ0JBQWdCLEVBQUU7QUFDdkMsZUFBVSxTQUFTLHNCQUFrQjtPQUN0Qzs7QUFFRCxhQUFPLFNBQVMsQ0FBQTtLQUNqQjs7O1dBRU0sZ0JBQUMsVUFBVSxFQUFFO0FBQ2xCLFVBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0FBQzVCLGFBQU8sa0JBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ3pCOzs7U0F0Q2tCLFVBQVU7OztxQkFBVixVQUFVIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi92aWV3cy9sb2ctbWVzc2FnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cbi8qKiBAanN4IGV0Y2guZG9tICovXG5cbmltcG9ydCBldGNoIGZyb20gJ2V0Y2gnXG5pbXBvcnQgeyBSYW5nZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgTWVzc2FnZUljb24gZnJvbSAnLi9tZXNzYWdlLWljb24nXG5pbXBvcnQgRmlsZVJlZmVyZW5jZSBmcm9tICcuL2ZpbGUtcmVmZXJlbmNlJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2dNZXNzYWdlIHtcbiAgY29uc3RydWN0b3IgKHByb3BlcnRpZXMgPSB7fSkge1xuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXNcbiAgICBldGNoLmluaXRpYWxpemUodGhpcylcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3kgKCkge1xuICAgIGF3YWl0IGV0Y2guZGVzdHJveSh0aGlzKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5wcm9wZXJ0aWVzLm1lc3NhZ2VcblxuICAgIHJldHVybiAoXG4gICAgICA8dHIgY2xhc3NOYW1lPXt0aGlzLmdldENsYXNzTmFtZXMobWVzc2FnZSl9PlxuICAgICAgICA8dGQ+PE1lc3NhZ2VJY29uIHR5cGU9e21lc3NhZ2UudHlwZX0gLz48L3RkPlxuICAgICAgICA8dGQ+e21lc3NhZ2UudGV4dH08L3RkPlxuICAgICAgICA8dGQ+PEZpbGVSZWZlcmVuY2UgZmlsZT17bWVzc2FnZS5maWxlUGF0aH0gcmFuZ2U9e21lc3NhZ2UucmFuZ2V9IC8+PC90ZD5cbiAgICAgICAgPHRkPjxGaWxlUmVmZXJlbmNlIGZpbGU9e21lc3NhZ2UubG9nUGF0aH0gcmFuZ2U9e21lc3NhZ2UubG9nUmFuZ2V9IC8+PC90ZD5cbiAgICAgIDwvdHI+XG4gICAgKVxuICB9XG5cbiAgZ2V0Q2xhc3NOYW1lcyAobWVzc2FnZSkge1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGBsYXRleC0ke21lc3NhZ2UudHlwZX1gXG5cbiAgICBjb25zdCBtYXRjaGVzRmlsZVBhdGggPSBtZXNzYWdlLmZpbGVQYXRoICYmIHRoaXMucHJvcGVydGllcy5maWxlUGF0aCA9PT0gbWVzc2FnZS5maWxlUGF0aFxuICAgIGNvbnN0IGNvbnRhaW5zUG9zaXRpb24gPSBtZXNzYWdlLnJhbmdlICYmIHRoaXMucHJvcGVydGllcy5wb3NpdGlvbiAmJiBSYW5nZS5mcm9tT2JqZWN0KG1lc3NhZ2UucmFuZ2UpLmNvbnRhaW5zUG9pbnQodGhpcy5wcm9wZXJ0aWVzLnBvc2l0aW9uKVxuICAgIGlmIChtYXRjaGVzRmlsZVBhdGggJiYgY29udGFpbnNQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIGAke2NsYXNzTmFtZX0gbGF0ZXgtaGlnaGxpZ2h0YFxuICAgIH1cblxuICAgIHJldHVybiBjbGFzc05hbWVcbiAgfVxuXG4gIHVwZGF0ZSAocHJvcGVydGllcykge1xuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXNcbiAgICByZXR1cm4gZXRjaC51cGRhdGUodGhpcylcbiAgfVxufVxuIl19