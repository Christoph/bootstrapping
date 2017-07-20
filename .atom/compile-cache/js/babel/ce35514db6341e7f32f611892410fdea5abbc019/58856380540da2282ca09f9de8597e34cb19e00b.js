Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */

var _atom = require('atom');

var MarkerManager = (function (_Disposable) {
  _inherits(MarkerManager, _Disposable);

  function MarkerManager(editor) {
    var _this2 = this;

    _classCallCheck(this, MarkerManager);

    _get(Object.getPrototypeOf(MarkerManager.prototype), 'constructor', this).call(this, function () {
      return _this.disposables.dispose();
    });

    this.disposables = new _atom.CompositeDisposable();

    var _this = this;

    this.editor = editor;
    this.markers = [];

    this.disposables.add(latex.log.onMessages(function (messages, reset) {
      return _this2.addMarkers(messages, reset);
    }));
    this.disposables.add(new _atom.Disposable(function () {
      return _this2.clear();
    }));
    this.disposables.add(this.editor.onDidDestroy(function () {
      return _this2.dispose();
    }));
    this.disposables.add(atom.config.onDidChange('latex.loggingLevel', function () {
      return _this2.update();
    }));

    this.addMarkers(latex.log.getMessages());
  }

  _createClass(MarkerManager, [{
    key: 'update',
    value: function update() {
      this.addMarkers(latex.log.getMessages(), true);
    }
  }, {
    key: 'addMarkers',
    value: function addMarkers(messages, reset) {
      if (reset) this.clear();

      var editorPath = this.editor.getPath();
      var isVisible = function isVisible(filePath, range) {
        return filePath && range && editorPath.includes(filePath);
      };

      if (editorPath) {
        for (var message of messages) {
          if (isVisible(message.filePath, message.range)) {
            this.addMarker(message.type, message.filePath, message.range);
          }
          if (isVisible(message.logPath, message.logRange)) {
            this.addMarker(message.type, message.logPath, message.logRange);
          }
        }
      }
    }
  }, {
    key: 'addMarker',
    value: function addMarker(type, filePath, range) {
      var marker = this.editor.markBufferRange(range, { invalidate: 'touch' });
      this.editor.decorateMarker(marker, { type: 'line-number', 'class': 'latex-' + type });
      this.markers.push(marker);
    }
  }, {
    key: 'clear',
    value: function clear() {
      for (var marker of this.markers) {
        marker.destroy();
      }
      this.markers = [];
    }
  }]);

  return MarkerManager;
})(_atom.Disposable);

exports['default'] = MarkerManager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi9tYXJrZXItbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztvQkFFZ0QsTUFBTTs7SUFFakMsYUFBYTtZQUFiLGFBQWE7O0FBR3BCLFdBSE8sYUFBYSxDQUduQixNQUFNLEVBQUU7OzswQkFIRixhQUFhOztBQUk5QiwrQkFKaUIsYUFBYSw2Q0FJeEI7YUFBTSxNQUFLLFdBQVcsQ0FBQyxPQUFPLEVBQUU7S0FBQSxFQUFDOztTQUh6QyxXQUFXLEdBQUcsK0JBQXlCOzs7O0FBS3JDLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0FBQ3BCLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBOztBQUVqQixRQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFDLFFBQVEsRUFBRSxLQUFLO2FBQUssT0FBSyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQztLQUFBLENBQUMsQ0FBQyxDQUFBO0FBQ2pHLFFBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFlO2FBQU0sT0FBSyxLQUFLLEVBQUU7S0FBQSxDQUFDLENBQUMsQ0FBQTtBQUN4RCxRQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQzthQUFNLE9BQUssT0FBTyxFQUFFO0tBQUEsQ0FBQyxDQUFDLENBQUE7QUFDcEUsUUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUU7YUFBTSxPQUFLLE1BQU0sRUFBRTtLQUFBLENBQUMsQ0FBQyxDQUFBOztBQUV4RixRQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQTtHQUN6Qzs7ZUFma0IsYUFBYTs7V0FpQnpCLGtCQUFHO0FBQ1IsVUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO0tBQy9DOzs7V0FFVSxvQkFBQyxRQUFRLEVBQUUsS0FBSyxFQUFFO0FBQzNCLFVBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTs7QUFFdkIsVUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUN4QyxVQUFNLFNBQVMsR0FBRyxTQUFaLFNBQVMsQ0FBSSxRQUFRLEVBQUUsS0FBSztlQUFLLFFBQVEsSUFBSSxLQUFLLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7T0FBQSxDQUFBOztBQUV6RixVQUFJLFVBQVUsRUFBRTtBQUNkLGFBQUssSUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO0FBQzlCLGNBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzlDLGdCQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7V0FDOUQ7QUFDRCxjQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNoRCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1dBQ2hFO1NBQ0Y7T0FDRjtLQUNGOzs7V0FFUyxtQkFBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRTtBQUNoQyxVQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtBQUMxRSxVQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLG9CQUFnQixJQUFJLEFBQUUsRUFBRSxDQUFDLENBQUE7QUFDbkYsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7S0FDMUI7OztXQUVLLGlCQUFHO0FBQ1AsV0FBSyxJQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2pDLGNBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNqQjtBQUNELFVBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBO0tBQ2xCOzs7U0FsRGtCLGFBQWE7OztxQkFBYixhQUFhIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi9tYXJrZXItbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hcmtlck1hbmFnZXIgZXh0ZW5kcyBEaXNwb3NhYmxlIHtcbiAgZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgY29uc3RydWN0b3IgKGVkaXRvcikge1xuICAgIHN1cGVyKCgpID0+IHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpKVxuXG4gICAgdGhpcy5lZGl0b3IgPSBlZGl0b3JcbiAgICB0aGlzLm1hcmtlcnMgPSBbXVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQobGF0ZXgubG9nLm9uTWVzc2FnZXMoKG1lc3NhZ2VzLCByZXNldCkgPT4gdGhpcy5hZGRNYXJrZXJzKG1lc3NhZ2VzLCByZXNldCkpKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHRoaXMuY2xlYXIoKSkpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy5lZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHRoaXMuZGlzcG9zZSgpKSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnbGF0ZXgubG9nZ2luZ0xldmVsJywgKCkgPT4gdGhpcy51cGRhdGUoKSkpXG5cbiAgICB0aGlzLmFkZE1hcmtlcnMobGF0ZXgubG9nLmdldE1lc3NhZ2VzKCkpXG4gIH1cblxuICB1cGRhdGUgKCkge1xuICAgIHRoaXMuYWRkTWFya2VycyhsYXRleC5sb2cuZ2V0TWVzc2FnZXMoKSwgdHJ1ZSlcbiAgfVxuXG4gIGFkZE1hcmtlcnMgKG1lc3NhZ2VzLCByZXNldCkge1xuICAgIGlmIChyZXNldCkgdGhpcy5jbGVhcigpXG5cbiAgICBjb25zdCBlZGl0b3JQYXRoID0gdGhpcy5lZGl0b3IuZ2V0UGF0aCgpXG4gICAgY29uc3QgaXNWaXNpYmxlID0gKGZpbGVQYXRoLCByYW5nZSkgPT4gZmlsZVBhdGggJiYgcmFuZ2UgJiYgZWRpdG9yUGF0aC5pbmNsdWRlcyhmaWxlUGF0aClcblxuICAgIGlmIChlZGl0b3JQYXRoKSB7XG4gICAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbWVzc2FnZXMpIHtcbiAgICAgICAgaWYgKGlzVmlzaWJsZShtZXNzYWdlLmZpbGVQYXRoLCBtZXNzYWdlLnJhbmdlKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWFya2VyKG1lc3NhZ2UudHlwZSwgbWVzc2FnZS5maWxlUGF0aCwgbWVzc2FnZS5yYW5nZSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWaXNpYmxlKG1lc3NhZ2UubG9nUGF0aCwgbWVzc2FnZS5sb2dSYW5nZSkpIHtcbiAgICAgICAgICB0aGlzLmFkZE1hcmtlcihtZXNzYWdlLnR5cGUsIG1lc3NhZ2UubG9nUGF0aCwgbWVzc2FnZS5sb2dSYW5nZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFkZE1hcmtlciAodHlwZSwgZmlsZVBhdGgsIHJhbmdlKSB7XG4gICAgY29uc3QgbWFya2VyID0gdGhpcy5lZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlLCB7IGludmFsaWRhdGU6ICd0b3VjaCcgfSlcbiAgICB0aGlzLmVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogJ2xpbmUtbnVtYmVyJywgY2xhc3M6IGBsYXRleC0ke3R5cGV9YCB9KVxuICAgIHRoaXMubWFya2Vycy5wdXNoKG1hcmtlcilcbiAgfVxuXG4gIGNsZWFyICgpIHtcbiAgICBmb3IgKGNvbnN0IG1hcmtlciBvZiB0aGlzLm1hcmtlcnMpIHtcbiAgICAgIG1hcmtlci5kZXN0cm95KClcbiAgICB9XG4gICAgdGhpcy5tYXJrZXJzID0gW11cbiAgfVxufVxuIl19