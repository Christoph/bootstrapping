(function() {
  var slice = [].slice;

  module.exports = function() {
    return {
      bindings: {},
      emit: function() {
        var _bindings, _callback, args, event, i, len;
        event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        if (!(_bindings = this.bindings[event])) {
          return;
        }
        for (i = 0, len = _bindings.length; i < len; i++) {
          _callback = _bindings[i];
          _callback.apply(null, args);
        }
      },
      on: function(event, callback) {
        if (!this.bindings[event]) {
          this.bindings[event] = [];
        }
        this.bindings[event].push(callback);
        return callback;
      },
      off: function(event, callback) {
        var _binding, _bindings, _i;
        if (!(_bindings = this.bindings[event])) {
          return;
        }
        _i = _bindings.length;
        while (_i-- && (_binding = _bindings[_i])) {
          if (_binding === callback) {
            _bindings.splice(_i, 1);
          }
        }
      }
    };
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvY29sb3ItcGlja2VyL2xpYi9tb2R1bGVzL0VtaXR0ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtJO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFBO1dBQ2I7TUFBQSxRQUFBLEVBQVUsRUFBVjtNQUVBLElBQUEsRUFBTSxTQUFBO0FBQ0YsWUFBQTtRQURHLHNCQUFPO1FBQ1YsSUFBQSxDQUFjLENBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxRQUFTLENBQUEsS0FBQSxDQUF0QixDQUFkO0FBQUEsaUJBQUE7O0FBQ0EsYUFBQSwyQ0FBQTs7VUFBQSxTQUFTLENBQUMsS0FBVixDQUFnQixJQUFoQixFQUFzQixJQUF0QjtBQUFBO01BRkUsQ0FGTjtNQU9BLEVBQUEsRUFBSSxTQUFDLEtBQUQsRUFBUSxRQUFSO1FBQ0EsSUFBQSxDQUE2QixJQUFDLENBQUEsUUFBUyxDQUFBLEtBQUEsQ0FBdkM7VUFBQSxJQUFDLENBQUEsUUFBUyxDQUFBLEtBQUEsQ0FBVixHQUFtQixHQUFuQjs7UUFDQSxJQUFDLENBQUEsUUFBUyxDQUFBLEtBQUEsQ0FBTSxDQUFDLElBQWpCLENBQXNCLFFBQXRCO0FBQ0EsZUFBTztNQUhQLENBUEo7TUFZQSxHQUFBLEVBQUssU0FBQyxLQUFELEVBQVEsUUFBUjtBQUNELFlBQUE7UUFBQSxJQUFBLENBQWMsQ0FBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFFBQVMsQ0FBQSxLQUFBLENBQXRCLENBQWQ7QUFBQSxpQkFBQTs7UUFFQSxFQUFBLEdBQUssU0FBUyxDQUFDO0FBQVEsZUFBTSxFQUFBLEVBQUEsSUFBUyxDQUFBLFFBQUEsR0FBVyxTQUFVLENBQUEsRUFBQSxDQUFyQixDQUFmO1VBQ25CLElBQUcsUUFBQSxLQUFZLFFBQWY7WUFBNkIsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsRUFBakIsRUFBcUIsQ0FBckIsRUFBN0I7O1FBRG1CO01BSHRCLENBWkw7O0VBRGE7QUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgIEVtaXR0ZXJcbiMgIGEgcmVhbGx5IGxpZ2h0d2VpZ2h0IHRha2Ugb24gYW4gRW1pdHRlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IC0+XG4gICAgICAgIGJpbmRpbmdzOiB7fVxuXG4gICAgICAgIGVtaXQ6IChldmVudCwgYXJncy4uLikgLT5cbiAgICAgICAgICAgIHJldHVybiB1bmxlc3MgX2JpbmRpbmdzID0gQGJpbmRpbmdzW2V2ZW50XVxuICAgICAgICAgICAgX2NhbGxiYWNrLmFwcGx5IG51bGwsIGFyZ3MgZm9yIF9jYWxsYmFjayBpbiBfYmluZGluZ3NcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIG9uOiAoZXZlbnQsIGNhbGxiYWNrKSAtPlxuICAgICAgICAgICAgQGJpbmRpbmdzW2V2ZW50XSA9IFtdIHVubGVzcyBAYmluZGluZ3NbZXZlbnRdXG4gICAgICAgICAgICBAYmluZGluZ3NbZXZlbnRdLnB1c2ggY2FsbGJhY2tcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFja1xuXG4gICAgICAgIG9mZjogKGV2ZW50LCBjYWxsYmFjaykgLT5cbiAgICAgICAgICAgIHJldHVybiB1bmxlc3MgX2JpbmRpbmdzID0gQGJpbmRpbmdzW2V2ZW50XVxuXG4gICAgICAgICAgICBfaSA9IF9iaW5kaW5ncy5sZW5ndGg7IHdoaWxlIF9pLS0gYW5kIF9iaW5kaW5nID0gX2JpbmRpbmdzW19pXVxuICAgICAgICAgICAgICAgIGlmIF9iaW5kaW5nIGlzIGNhbGxiYWNrIHRoZW4gX2JpbmRpbmdzLnNwbGljZSBfaSwgMVxuICAgICAgICAgICAgcmV0dXJuXG4iXX0=
