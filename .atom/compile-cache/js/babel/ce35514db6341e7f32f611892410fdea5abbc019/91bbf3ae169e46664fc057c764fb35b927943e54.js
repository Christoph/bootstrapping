Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _atom = require('atom');

var _werkzeug = require('./werkzeug');

var _viewsLogDock = require('./views/log-dock');

var _viewsLogDock2 = _interopRequireDefault(_viewsLogDock);

var Logger = (function (_Disposable) {
  _inherits(Logger, _Disposable);

  function Logger() {
    var _this2 = this;

    _classCallCheck(this, Logger);

    _get(Object.getPrototypeOf(Logger.prototype), 'constructor', this).call(this, function () {
      return _this.disposables.dispose();
    });
    this.disposables = new _atom.CompositeDisposable();
    this.emitter = new _atom.Emitter();

    var _this = this;

    this.loggingLevel = atom.config.get('latex.loggingLevel');
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', function () {
      _this2.loggingLevel = atom.config.get('latex.loggingLevel');
      _this2.refresh();
    }));
    this.disposables.add(this.emitter);
    this.disposables.add(atom.workspace.addOpener(function (uri) {
      if (uri === _viewsLogDock2['default'].LOG_DOCK_URI) {
        return new _viewsLogDock2['default']();
      }
    }));

    this.messages = [];
  }

  _createClass(Logger, [{
    key: 'onMessages',
    value: function onMessages(callback) {
      return this.emitter.on('messages', callback);
    }
  }, {
    key: 'error',
    value: function error(text, filePath, range, logPath, logRange) {
      this.showMessage({ type: 'error', text: text, filePath: filePath, range: range, logPath: logPath, logRange: logRange });
    }
  }, {
    key: 'warning',
    value: function warning(text, filePath, range, logPath, logRange) {
      this.showMessage({ type: 'warning', text: text, filePath: filePath, range: range, logPath: logPath, logRange: logRange });
    }
  }, {
    key: 'info',
    value: function info(text, filePath, range, logPath, logRange) {
      this.showMessage({ type: 'info', text: text, filePath: filePath, range: range, logPath: logPath, logRange: logRange });
    }
  }, {
    key: 'showMessage',
    value: function showMessage(message) {
      message = Object.assign({ timestamp: Date.now() }, _lodash2['default'].pickBy(message));
      this.messages.push(message);
      if (this.messageTypeIsVisible(message.type)) {
        this.emitter.emit('messages', [message], false);
      }
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.messages = [];
      this.refresh();
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      this.emitter.emit('messages', this.getMessages(), true);
    }
  }, {
    key: 'getMessages',
    value: function getMessages() {
      var _this3 = this;

      var useFilters = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      return useFilters ? this.messages.filter(function (message) {
        return _this3.messageTypeIsVisible(message.type);
      }) : this.messages;
    }
  }, {
    key: 'setMessages',
    value: function setMessages(messages) {
      this.messages = messages;
      this.emitter.emit('messages', messages, true);
    }
  }, {
    key: 'messageTypeIsVisible',
    value: function messageTypeIsVisible(type) {
      return type === 'error' || this.loggingLevel !== 'error' && type === 'warning' || this.loggingLevel === 'info' && type === 'info';
    }
  }, {
    key: 'sync',
    value: _asyncToGenerator(function* () {
      var _getEditorDetails = (0, _werkzeug.getEditorDetails)();

      var filePath = _getEditorDetails.filePath;
      var position = _getEditorDetails.position;

      if (filePath) {
        var logDock = yield this.show();
        if (logDock) {
          logDock.update({ filePath: filePath, position: position });
        }
      }
    })
  }, {
    key: 'toggle',
    value: _asyncToGenerator(function* () {
      return atom.workspace.toggle(_viewsLogDock2['default'].LOG_DOCK_URI);
    })
  }, {
    key: 'show',
    value: _asyncToGenerator(function* () {
      return atom.workspace.open(_viewsLogDock2['default'].LOG_DOCK_URI);
    })
  }, {
    key: 'hide',
    value: _asyncToGenerator(function* () {
      return atom.workspace.hide(_viewsLogDock2['default'].LOG_DOCK_URI);
    })
  }]);

  return Logger;
})(_atom.Disposable);

exports['default'] = Logger;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi9sb2dnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NCQUVjLFFBQVE7Ozs7b0JBQ21DLE1BQU07O3dCQUM5QixZQUFZOzs0QkFDekIsa0JBQWtCOzs7O0lBRWpCLE1BQU07WUFBTixNQUFNOztBQUliLFdBSk8sTUFBTSxHQUlWOzs7MEJBSkksTUFBTTs7QUFLdkIsK0JBTGlCLE1BQU0sNkNBS2pCO2FBQU0sTUFBSyxXQUFXLENBQUMsT0FBTyxFQUFFO0tBQUEsRUFBQztTQUp6QyxXQUFXLEdBQUcsK0JBQXlCO1NBQ3ZDLE9BQU8sR0FBRyxtQkFBYTs7OztBQUlyQixRQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFDekQsUUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsWUFBTTtBQUN2RSxhQUFLLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBQ3pELGFBQUssT0FBTyxFQUFFLENBQUE7S0FDZixDQUFDLENBQUMsQ0FBQTtBQUNILFFBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNsQyxRQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFBLEdBQUcsRUFBSTtBQUNuRCxVQUFJLEdBQUcsS0FBSywwQkFBUSxZQUFZLEVBQUU7QUFDaEMsZUFBTywrQkFBYSxDQUFBO09BQ3JCO0tBQ0YsQ0FBQyxDQUFDLENBQUE7O0FBRUgsUUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7R0FDbkI7O2VBbkJrQixNQUFNOztXQXFCZCxv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QkFFVSxhQUFHOzhCQUNtQixpQ0FBa0I7O1VBQXpDLFFBQVEscUJBQVIsUUFBUTtVQUFFLFFBQVEscUJBQVIsUUFBUTs7QUFDMUIsVUFBSSxRQUFRLEVBQUU7QUFDWixZQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNqQyxZQUFJLE9BQU8sRUFBRTtBQUNYLGlCQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFFLENBQUMsQ0FBQTtTQUN2QztPQUNGO0tBQ0Y7Ozs2QkFFWSxhQUFHO0FBQ2QsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQywwQkFBUSxZQUFZLENBQUMsQ0FBQTtLQUNuRDs7OzZCQUVVLGFBQUc7QUFDWixhQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDBCQUFRLFlBQVksQ0FBQyxDQUFBO0tBQ2pEOzs7NkJBRVUsYUFBRztBQUNaLGFBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsMEJBQVEsWUFBWSxDQUFDLENBQUE7S0FDakQ7OztTQTNGa0IsTUFBTTs7O3FCQUFOLE1BQU0iLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGF0ZXgvbGliL2xvZ2dlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgRW1pdHRlciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBnZXRFZGl0b3JEZXRhaWxzIH0gZnJvbSAnLi93ZXJremV1ZydcbmltcG9ydCBMb2dEb2NrIGZyb20gJy4vdmlld3MvbG9nLWRvY2snXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExvZ2dlciBleHRlbmRzIERpc3Bvc2FibGUge1xuICBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKCkgPT4gdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKCkpXG4gICAgdGhpcy5sb2dnaW5nTGV2ZWwgPSBhdG9tLmNvbmZpZy5nZXQoJ2xhdGV4LmxvZ2dpbmdMZXZlbCcpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2xhdGV4LmxvZ2dpbmdMZXZlbCcsICgpID0+IHtcbiAgICAgIHRoaXMubG9nZ2luZ0xldmVsID0gYXRvbS5jb25maWcuZ2V0KCdsYXRleC5sb2dnaW5nTGV2ZWwnKVxuICAgICAgdGhpcy5yZWZyZXNoKClcbiAgICB9KSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZCh0aGlzLmVtaXR0ZXIpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKHVyaSA9PiB7XG4gICAgICBpZiAodXJpID09PSBMb2dEb2NrLkxPR19ET0NLX1VSSSkge1xuICAgICAgICByZXR1cm4gbmV3IExvZ0RvY2soKVxuICAgICAgfVxuICAgIH0pKVxuXG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gIH1cblxuICBvbk1lc3NhZ2VzIChjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ21lc3NhZ2VzJywgY2FsbGJhY2spXG4gIH1cblxuICBlcnJvciAodGV4dCwgZmlsZVBhdGgsIHJhbmdlLCBsb2dQYXRoLCBsb2dSYW5nZSkge1xuICAgIHRoaXMuc2hvd01lc3NhZ2UoeyB0eXBlOiAnZXJyb3InLCB0ZXh0LCBmaWxlUGF0aCwgcmFuZ2UsIGxvZ1BhdGgsIGxvZ1JhbmdlIH0pXG4gIH1cblxuICB3YXJuaW5nICh0ZXh0LCBmaWxlUGF0aCwgcmFuZ2UsIGxvZ1BhdGgsIGxvZ1JhbmdlKSB7XG4gICAgdGhpcy5zaG93TWVzc2FnZSh7IHR5cGU6ICd3YXJuaW5nJywgdGV4dCwgZmlsZVBhdGgsIHJhbmdlLCBsb2dQYXRoLCBsb2dSYW5nZSB9KVxuICB9XG5cbiAgaW5mbyAodGV4dCwgZmlsZVBhdGgsIHJhbmdlLCBsb2dQYXRoLCBsb2dSYW5nZSkge1xuICAgIHRoaXMuc2hvd01lc3NhZ2UoeyB0eXBlOiAnaW5mbycsIHRleHQsIGZpbGVQYXRoLCByYW5nZSwgbG9nUGF0aCwgbG9nUmFuZ2UgfSlcbiAgfVxuXG4gIHNob3dNZXNzYWdlIChtZXNzYWdlKSB7XG4gICAgbWVzc2FnZSA9IE9iamVjdC5hc3NpZ24oeyB0aW1lc3RhbXA6IERhdGUubm93KCkgfSwgXy5waWNrQnkobWVzc2FnZSkpXG4gICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpXG4gICAgaWYgKHRoaXMubWVzc2FnZVR5cGVJc1Zpc2libGUobWVzc2FnZS50eXBlKSkge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ21lc3NhZ2VzJywgW21lc3NhZ2VdLCBmYWxzZSlcbiAgICB9XG4gIH1cblxuICBjbGVhciAoKSB7XG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgdGhpcy5yZWZyZXNoKClcbiAgfVxuXG4gIHJlZnJlc2ggKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdtZXNzYWdlcycsIHRoaXMuZ2V0TWVzc2FnZXMoKSwgdHJ1ZSlcbiAgfVxuXG4gIGdldE1lc3NhZ2VzICh1c2VGaWx0ZXJzID0gdHJ1ZSkge1xuICAgIHJldHVybiB1c2VGaWx0ZXJzXG4gICAgICA/IHRoaXMubWVzc2FnZXMuZmlsdGVyKG1lc3NhZ2UgPT4gdGhpcy5tZXNzYWdlVHlwZUlzVmlzaWJsZShtZXNzYWdlLnR5cGUpKVxuICAgICAgOiB0aGlzLm1lc3NhZ2VzXG4gIH1cblxuICBzZXRNZXNzYWdlcyAobWVzc2FnZXMpIHtcbiAgICB0aGlzLm1lc3NhZ2VzID0gbWVzc2FnZXNcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnbWVzc2FnZXMnLCBtZXNzYWdlcywgdHJ1ZSlcbiAgfVxuXG4gIG1lc3NhZ2VUeXBlSXNWaXNpYmxlICh0eXBlKSB7XG4gICAgcmV0dXJuIHR5cGUgPT09ICdlcnJvcicgfHxcbiAgICAgICh0aGlzLmxvZ2dpbmdMZXZlbCAhPT0gJ2Vycm9yJyAmJiB0eXBlID09PSAnd2FybmluZycpIHx8XG4gICAgICAodGhpcy5sb2dnaW5nTGV2ZWwgPT09ICdpbmZvJyAmJiB0eXBlID09PSAnaW5mbycpXG4gIH1cblxuICBhc3luYyBzeW5jICgpIHtcbiAgICBjb25zdCB7IGZpbGVQYXRoLCBwb3NpdGlvbiB9ID0gZ2V0RWRpdG9yRGV0YWlscygpXG4gICAgaWYgKGZpbGVQYXRoKSB7XG4gICAgICBjb25zdCBsb2dEb2NrID0gYXdhaXQgdGhpcy5zaG93KClcbiAgICAgIGlmIChsb2dEb2NrKSB7XG4gICAgICAgIGxvZ0RvY2sudXBkYXRlKHsgZmlsZVBhdGgsIHBvc2l0aW9uIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgdG9nZ2xlICgpIHtcbiAgICByZXR1cm4gYXRvbS53b3Jrc3BhY2UudG9nZ2xlKExvZ0RvY2suTE9HX0RPQ0tfVVJJKVxuICB9XG5cbiAgYXN5bmMgc2hvdyAoKSB7XG4gICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLm9wZW4oTG9nRG9jay5MT0dfRE9DS19VUkkpXG4gIH1cblxuICBhc3luYyBoaWRlICgpIHtcbiAgICByZXR1cm4gYXRvbS53b3Jrc3BhY2UuaGlkZShMb2dEb2NrLkxPR19ET0NLX1VSSSlcbiAgfVxufVxuIl19