'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

module.exports = (function () {
  function BufferExtender(buffer) {
    _classCallCheck(this, BufferExtender);

    this._buffer = buffer;
  }

  /**
   * Gets the line ending for the buffer.
   *
   * @return The line ending as a string.
   */

  _createClass(BufferExtender, [{
    key: 'getLineEnding',
    value: function getLineEnding() {
      var lineEndings = new Set();
      for (var i = 0; i < this._buffer.getLineCount() - 1; i++) {
        lineEndings.add(this._buffer.lineEndingForRow(i));
      }

      if (lineEndings.size > 1) {
        return 'Mixed';
      } else if (lineEndings.has('\n')) {
        return '\n';
      } else if (lineEndings.has('\r\n')) {
        return '\r\n';
      } else if (lineEndings.has('\r')) {
        return '\r';
      } else {
        return '';
      }
    }
  }]);

  return BufferExtender;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2J1ZmZlci1leHRlbmRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7OztBQUVYLE1BQU0sQ0FBQyxPQUFPO0FBR0QsV0FIVSxjQUFjLENBR3ZCLE1BQU0sRUFBRTswQkFIQyxjQUFjOztBQUlqQyxRQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztHQUN2Qjs7Ozs7Ozs7ZUFMb0IsY0FBYzs7V0FZdEIseUJBQVc7QUFDdEIsVUFBSSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUM1QixXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDeEQsbUJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ25EOztBQUVELFVBQUksV0FBVyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUU7QUFDeEIsZUFBTyxPQUFPLENBQUM7T0FDaEIsTUFBTSxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEMsZUFBTyxJQUFJLENBQUM7T0FDYixNQUFNLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNsQyxlQUFPLE1BQU0sQ0FBQztPQUNmLE1BQU0sSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2hDLGVBQU8sSUFBSSxDQUFDO09BQ2IsTUFBTTtBQUNMLGVBQU8sRUFBRSxDQUFDO09BQ1g7S0FDRjs7O1NBN0JvQixjQUFjO0lBOEJwQyxDQUFDIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL3NwbGl0LWRpZmYvbGliL2J1ZmZlci1leHRlbmRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQnVmZmVyRXh0ZW5kZXIge1xuICBfYnVmZmVyOiBPYmplY3Q7XG5cbiAgY29uc3RydWN0b3IoYnVmZmVyKSB7XG4gICAgdGhpcy5fYnVmZmVyID0gYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGxpbmUgZW5kaW5nIGZvciB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBAcmV0dXJuIFRoZSBsaW5lIGVuZGluZyBhcyBhIHN0cmluZy5cbiAgICovXG4gIGdldExpbmVFbmRpbmcoKTogc3RyaW5nIHtcbiAgICBsZXQgbGluZUVuZGluZ3MgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9idWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxOyBpKyspIHtcbiAgICAgIGxpbmVFbmRpbmdzLmFkZCh0aGlzLl9idWZmZXIubGluZUVuZGluZ0ZvclJvdyhpKSk7XG4gICAgfVxuXG4gICAgaWYgKGxpbmVFbmRpbmdzLnNpemUgPiAxKSB7XG4gICAgICByZXR1cm4gJ01peGVkJztcbiAgICB9IGVsc2UgaWYgKGxpbmVFbmRpbmdzLmhhcygnXFxuJykpIHtcbiAgICAgIHJldHVybiAnXFxuJztcbiAgICB9IGVsc2UgaWYgKGxpbmVFbmRpbmdzLmhhcygnXFxyXFxuJykpIHtcbiAgICAgIHJldHVybiAnXFxyXFxuJztcbiAgICB9IGVsc2UgaWYgKGxpbmVFbmRpbmdzLmhhcygnXFxyJykpIHtcbiAgICAgIHJldHVybiAnXFxyJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==