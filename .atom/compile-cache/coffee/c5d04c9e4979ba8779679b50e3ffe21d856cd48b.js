(function() {
  module.exports = function(colorPicker) {
    return {
      Emitter: (require('../modules/Emitter'))(),
      element: null,
      color: null,
      emitFormatChanged: function(format) {
        return this.Emitter.emit('formatChanged', format);
      },
      onFormatChanged: function(callback) {
        return this.Emitter.on('formatChanged', callback);
      },
      activate: function() {
        this.element = {
          el: (function() {
            var _classPrefix, _el;
            _classPrefix = colorPicker.element.el.className;
            _el = document.createElement('div');
            _el.classList.add(_classPrefix + "-format");
            return _el;
          })(),
          add: function(element) {
            this.el.appendChild(element);
            return this;
          }
        };
        colorPicker.element.add(this.element.el);
        setTimeout((function(_this) {
          return function() {
            var Color, _activeButton, _buttons, _format, i, len, ref, results;
            Color = colorPicker.getExtension('Color');
            _buttons = [];
            _activeButton = null;
            colorPicker.onBeforeOpen(function() {
              var _button, i, len, results;
              results = [];
              for (i = 0, len = _buttons.length; i < len; i++) {
                _button = _buttons[i];
                results.push(_button.deactivate());
              }
              return results;
            });
            Color.onOutputFormat(function(format) {
              var _button, i, len, results;
              results = [];
              for (i = 0, len = _buttons.length; i < len; i++) {
                _button = _buttons[i];
                if (format === _button.format || format === (_button.format + "A")) {
                  _button.activate();
                  results.push(_activeButton = _button);
                } else {
                  results.push(_button.deactivate());
                }
              }
              return results;
            });
            ref = ['RGB', 'HEX', 'HSL', 'HSV', 'VEC'];
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              _format = ref[i];
              results.push((function(_format) {
                var Format, _button, _isClicking, hasChild;
                Format = _this;
                _button = {
                  el: (function() {
                    var _el;
                    _el = document.createElement('button');
                    _el.classList.add(Format.element.el.className + "-button");
                    _el.innerHTML = _format;
                    return _el;
                  })(),
                  format: _format,
                  addClass: function(className) {
                    this.el.classList.add(className);
                    return this;
                  },
                  removeClass: function(className) {
                    this.el.classList.remove(className);
                    return this;
                  },
                  activate: function() {
                    return this.addClass('is--active');
                  },
                  deactivate: function() {
                    return this.removeClass('is--active');
                  }
                };
                _buttons.push(_button);
                if (!_activeButton) {
                  if (_format === atom.config.get('color-picker.preferredFormat')) {
                    _activeButton = _button;
                    _button.activate();
                  }
                }
                hasChild = function(element, child) {
                  var _parent;
                  if (child && (_parent = child.parentNode)) {
                    if (child === element) {
                      return true;
                    } else {
                      return hasChild(element, _parent);
                    }
                  }
                  return false;
                };
                _isClicking = false;
                colorPicker.onMouseDown(function(e, isOnPicker) {
                  if (!(isOnPicker && hasChild(_button.el, e.target))) {
                    return;
                  }
                  e.preventDefault();
                  return _isClicking = true;
                });
                colorPicker.onMouseMove(function(e) {
                  return _isClicking = false;
                });
                colorPicker.onMouseUp(function(e) {
                  if (!_isClicking) {
                    return;
                  }
                  if (_activeButton) {
                    _activeButton.deactivate();
                  }
                  _button.activate();
                  _activeButton = _button;
                  return _this.emitFormatChanged(_format);
                });
                return _this.element.add(_button.el);
              })(_format));
            }
            return results;
          };
        })(this));
        return this;
      }
    };
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvY29sb3ItcGlja2VyL2xpYi9leHRlbnNpb25zL0Zvcm1hdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0k7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLFdBQUQ7V0FDYjtNQUFBLE9BQUEsRUFBUyxDQUFDLE9BQUEsQ0FBUSxvQkFBUixDQUFELENBQUEsQ0FBQSxDQUFUO01BRUEsT0FBQSxFQUFTLElBRlQ7TUFHQSxLQUFBLEVBQU8sSUFIUDtNQVNBLGlCQUFBLEVBQW1CLFNBQUMsTUFBRDtlQUNmLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGVBQWQsRUFBK0IsTUFBL0I7TUFEZSxDQVRuQjtNQVdBLGVBQUEsRUFBaUIsU0FBQyxRQUFEO2VBQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE2QixRQUE3QjtNQURhLENBWGpCO01BaUJBLFFBQUEsRUFBVSxTQUFBO1FBQ04sSUFBQyxDQUFBLE9BQUQsR0FDSTtVQUFBLEVBQUEsRUFBTyxDQUFBLFNBQUE7QUFDSCxnQkFBQTtZQUFBLFlBQUEsR0FBZSxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN0QyxHQUFBLEdBQU0sUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7WUFDTixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWQsQ0FBc0IsWUFBRixHQUFnQixTQUFwQztBQUVBLG1CQUFPO1VBTEosQ0FBQSxDQUFILENBQUEsQ0FBSjtVQVFBLEdBQUEsRUFBSyxTQUFDLE9BQUQ7WUFDRCxJQUFDLENBQUEsRUFBRSxDQUFDLFdBQUosQ0FBZ0IsT0FBaEI7QUFDQSxtQkFBTztVQUZOLENBUkw7O1FBV0osV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFwQixDQUF3QixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQWpDO1FBSUEsVUFBQSxDQUFXLENBQUEsU0FB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O3lCQUNwQixXQUFBLEdBQWM7Z0JBRE0sQ0FBeEI7Z0JBR0EsV0FBVyxDQUFDLFNBQVosQ0FBc0IsU0FBQyxDQUFEO2tCQUNsQixJQUFBLENBQWMsV0FBZDtBQUFBLDJCQUFBOztrQkFFQSxJQUE4QixhQUE5QjtvQkFBQSxhQUFhLENBQUMsVUFBZCxDQUFBLEVBQUE7O2tCQUNBLE9BQU8sQ0FBQyxRQUFSLENBQUE7a0JBQ0EsYUFBQSxHQUFnQjt5QkFFaEIsS0FBQyxDQUFBLGlCQUFELENBQW1CLE9BQW5CO2dCQVBrQixDQUF0Qjt1QkFVQSxLQUFDLENBQUEsT0FBTyxDQUFDLEdBQVQsQ0FBYSxPQUFPLENBQUMsRUFBckI7Y0FyRHVELENBQUEsQ0FBSCxDQUFJLE9BQUo7QUFBeEQ7O1VBdEJPO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYO0FBNEVBLGVBQU87TUE3RkQsQ0FqQlY7O0VBRGE7QUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgIENvbG9yIFBpY2tlci9leHRlbnNpb25zOiBGb3JtYXRcbiMgIFRoZSBlbGVtZW50IHByb3ZpZGluZyBVSSB0byBjb252ZXJ0IGJldHdlZW4gY29sb3IgZm9ybWF0c1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IChjb2xvclBpY2tlcikgLT5cbiAgICAgICAgRW1pdHRlcjogKHJlcXVpcmUgJy4uL21vZHVsZXMvRW1pdHRlcicpKClcblxuICAgICAgICBlbGVtZW50OiBudWxsXG4gICAgICAgIGNvbG9yOiBudWxsXG5cbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICBTZXQgdXAgZXZlbnRzIGFuZCBoYW5kbGluZ1xuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAjIEZvcm1hdCBDaGFuZ2VkIGV2ZW50XG4gICAgICAgIGVtaXRGb3JtYXRDaGFuZ2VkOiAoZm9ybWF0KSAtPlxuICAgICAgICAgICAgQEVtaXR0ZXIuZW1pdCAnZm9ybWF0Q2hhbmdlZCcsIGZvcm1hdFxuICAgICAgICBvbkZvcm1hdENoYW5nZWQ6IChjYWxsYmFjaykgLT5cbiAgICAgICAgICAgIEBFbWl0dGVyLm9uICdmb3JtYXRDaGFuZ2VkJywgY2FsbGJhY2tcblxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgIENyZWF0ZSBhbmQgYWN0aXZhdGUgRm9ybWF0IGVsZW1lbnRcbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgYWN0aXZhdGU6IC0+XG4gICAgICAgICAgICBAZWxlbWVudCA9XG4gICAgICAgICAgICAgICAgZWw6IGRvIC0+XG4gICAgICAgICAgICAgICAgICAgIF9jbGFzc1ByZWZpeCA9IGNvbG9yUGlja2VyLmVsZW1lbnQuZWwuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgIF9lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICAgICAgICAgICAgICAgICAgX2VsLmNsYXNzTGlzdC5hZGQgXCIjeyBfY2xhc3NQcmVmaXggfS1mb3JtYXRcIlxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfZWxcblxuICAgICAgICAgICAgICAgICMgQWRkIGEgY2hpbGQgb24gdGhlIENvbG9yIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBhZGQ6IChlbGVtZW50KSAtPlxuICAgICAgICAgICAgICAgICAgICBAZWwuYXBwZW5kQ2hpbGQgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICAgICAgY29sb3JQaWNrZXIuZWxlbWVudC5hZGQgQGVsZW1lbnQuZWxcblxuICAgICAgICAjICBBZGQgY29udmVyc2lvbiBidXR0b25zICNmZjBcbiAgICAgICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIHNldFRpbWVvdXQgPT5cbiAgICAgICAgICAgICAgICBDb2xvciA9IGNvbG9yUGlja2VyLmdldEV4dGVuc2lvbiAnQ29sb3InXG5cbiAgICAgICAgICAgICAgICBfYnV0dG9ucyA9IFtdXG4gICAgICAgICAgICAgICAgX2FjdGl2ZUJ1dHRvbiA9IG51bGxcblxuICAgICAgICAgICAgICAgICMgT24gY29sb3IgcGlja2VyIG9wZW4sIHJlc2V0XG4gICAgICAgICAgICAgICAgY29sb3JQaWNrZXIub25CZWZvcmVPcGVuIC0+IGZvciBfYnV0dG9uIGluIF9idXR0b25zXG4gICAgICAgICAgICAgICAgICAgIF9idXR0b24uZGVhY3RpdmF0ZSgpXG5cbiAgICAgICAgICAgICAgICAjIE9uIENvbG9yIGVsZW1lbnQgb3V0cHV0IGZvcm1hdCwgYWN0aXZhdGUgYXBwbGljYWJsZSBidXR0b25cbiAgICAgICAgICAgICAgICBDb2xvci5vbk91dHB1dEZvcm1hdCAoZm9ybWF0KSAtPiBmb3IgX2J1dHRvbiBpbiBfYnV0dG9uc1xuICAgICAgICAgICAgICAgICAgICAjIFRPRE8gdGhpcyBpcyBpbmVmZmljaWVudC4gVGhlcmUgc2hvdWxkIGJlIGEgd2F5IHRvIGVhc2lseVxuICAgICAgICAgICAgICAgICAgICAjIGNoZWNrIGlmIGBmb3JtYXRgIGlzIGluIGBfYnV0dG9uLmZvcm1hdGAsIGluY2x1ZGluZyB0aGVcbiAgICAgICAgICAgICAgICAgICAgIyBhbHBoYSBjaGFubmVsXG4gICAgICAgICAgICAgICAgICAgIGlmIGZvcm1hdCBpcyBfYnV0dG9uLmZvcm1hdCBvciBmb3JtYXQgaXMgXCIjeyBfYnV0dG9uLmZvcm1hdCB9QVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBfYnV0dG9uLmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hY3RpdmVCdXR0b24gPSBfYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgX2J1dHRvbi5kZWFjdGl2YXRlKClcblxuICAgICAgICAgICAgICAgICMgQ3JlYXRlIGZvcm1hdHRpbmcgYnV0dG9uc1xuICAgICAgICAgICAgICAgICMgVE9ETyBzYW1lIGFzIHNldHRpbmcsIGdsb2JhbGl6ZVxuICAgICAgICAgICAgICAgIGZvciBfZm9ybWF0IGluIFsnUkdCJywgJ0hFWCcsICdIU0wnLCAnSFNWJywgJ1ZFQyddIHRoZW4gZG8gKF9mb3JtYXQpID0+XG4gICAgICAgICAgICAgICAgICAgIEZvcm1hdCA9IHRoaXNcblxuICAgICAgICAgICAgICAgICAgICAjIENyZWF0ZSB0aGUgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIF9idXR0b24gPVxuICAgICAgICAgICAgICAgICAgICAgICAgZWw6IGRvIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9lbC5jbGFzc0xpc3QuYWRkIFwiI3sgRm9ybWF0LmVsZW1lbnQuZWwuY2xhc3NOYW1lIH0tYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZWwuaW5uZXJIVE1MID0gX2Zvcm1hdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfZWxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogX2Zvcm1hdFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAjIFV0aWxpdHkgZnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDbGFzczogKGNsYXNzTmFtZSkgLT4gQGVsLmNsYXNzTGlzdC5hZGQgY2xhc3NOYW1lOyByZXR1cm4gdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQ2xhc3M6IChjbGFzc05hbWUpIC0+IEBlbC5jbGFzc0xpc3QucmVtb3ZlIGNsYXNzTmFtZTsgcmV0dXJuIHRoaXNcblxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZhdGU6IC0+IEBhZGRDbGFzcyAnaXMtLWFjdGl2ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYWN0aXZhdGU6IC0+IEByZW1vdmVDbGFzcyAnaXMtLWFjdGl2ZSdcbiAgICAgICAgICAgICAgICAgICAgX2J1dHRvbnMucHVzaCBfYnV0dG9uXG5cbiAgICAgICAgICAgICAgICAgICAgIyBTZXQgaW5pdGlhbCBmb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgdW5sZXNzIF9hY3RpdmVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIF9mb3JtYXQgaXMgYXRvbS5jb25maWcuZ2V0ICdjb2xvci1waWNrZXIucHJlZmVycmVkRm9ybWF0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9hY3RpdmVCdXR0b24gPSBfYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2J1dHRvbi5hY3RpdmF0ZSgpXG5cbiAgICAgICAgICAgICAgICAgICAgIyBDaGFuZ2UgY29sb3IgZm9ybWF0IG9uIGNsaWNrXG4gICAgICAgICAgICAgICAgICAgIGhhc0NoaWxkID0gKGVsZW1lbnQsIGNoaWxkKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgY2hpbGQgYW5kIF9wYXJlbnQgPSBjaGlsZC5wYXJlbnROb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgY2hpbGQgaXMgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIGhhc0NoaWxkIGVsZW1lbnQsIF9wYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBfaXNDbGlja2luZyA9IG5vXG5cbiAgICAgICAgICAgICAgICAgICAgY29sb3JQaWNrZXIub25Nb3VzZURvd24gKGUsIGlzT25QaWNrZXIpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIGlzT25QaWNrZXIgYW5kIGhhc0NoaWxkIF9idXR0b24uZWwsIGUudGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIF9pc0NsaWNraW5nID0geWVzXG5cbiAgICAgICAgICAgICAgICAgICAgY29sb3JQaWNrZXIub25Nb3VzZU1vdmUgKGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBfaXNDbGlja2luZyA9IG5vXG5cbiAgICAgICAgICAgICAgICAgICAgY29sb3JQaWNrZXIub25Nb3VzZVVwIChlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyBfaXNDbGlja2luZ1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBfYWN0aXZlQnV0dG9uLmRlYWN0aXZhdGUoKSBpZiBfYWN0aXZlQnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBfYnV0dG9uLmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hY3RpdmVCdXR0b24gPSBfYnV0dG9uXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBlbWl0Rm9ybWF0Q2hhbmdlZCBfZm9ybWF0XG5cbiAgICAgICAgICAgICAgICAgICAgIyBBZGQgYnV0dG9uIHRvIHRoZSBwYXJlbnQgRm9ybWF0IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgQGVsZW1lbnQuYWRkIF9idXR0b24uZWxcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4iXX0=
