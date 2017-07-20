(function() {
  var Dialog, TextEditorView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), TextEditorView = ref.TextEditorView, View = ref.View;

  module.exports = Dialog = (function(superClass) {
    extend(Dialog, superClass);

    function Dialog() {
      return Dialog.__super__.constructor.apply(this, arguments);
    }

    Dialog.content = function(arg) {
      var prompt;
      prompt = (arg != null ? arg : {}).prompt;
      return this.div({
        "class": 'platformio-ide-terminal-dialog'
      }, (function(_this) {
        return function() {
          _this.label(prompt, {
            "class": 'icon',
            outlet: 'promptText'
          });
          _this.subview('miniEditor', new TextEditorView({
            mini: true
          }));
          _this.label('Escape (Esc) to exit', {
            style: 'float: left;'
          });
          return _this.label('Enter (\u21B5) to confirm', {
            style: 'float: right;'
          });
        };
      })(this));
    };

    Dialog.prototype.initialize = function(arg) {
      var iconClass, placeholderText, ref1, stayOpen;
      ref1 = arg != null ? arg : {}, iconClass = ref1.iconClass, placeholderText = ref1.placeholderText, stayOpen = ref1.stayOpen;
      if (iconClass) {
        this.promptText.addClass(iconClass);
      }
      atom.commands.add(this.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.onConfirm(_this.miniEditor.getText());
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this)
      });
      if (!stayOpen) {
        this.miniEditor.on('blur', (function(_this) {
          return function() {
            return _this.close();
          };
        })(this));
      }
      if (placeholderText) {
        this.miniEditor.getModel().setText(placeholderText);
        return this.miniEditor.getModel().selectAll();
      }
    };

    Dialog.prototype.attach = function() {
      this.panel = atom.workspace.addModalPanel({
        item: this.element
      });
      this.miniEditor.focus();
      return this.miniEditor.getModel().scrollToCursorPosition();
    };

    Dialog.prototype.close = function() {
      var panelToDestroy;
      panelToDestroy = this.panel;
      this.panel = null;
      if (panelToDestroy != null) {
        panelToDestroy.destroy();
      }
      return atom.workspace.getActivePane().activate();
    };

    Dialog.prototype.cancel = function() {
      return this.close();
    };

    return Dialog;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL2RpYWxvZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlDQUFBO0lBQUE7OztFQUFBLE1BQXlCLE9BQUEsQ0FBUSxzQkFBUixDQUF6QixFQUFDLG1DQUFELEVBQWlCOztFQUVqQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osTUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEdBQUQ7QUFDUixVQUFBO01BRFUsd0JBQUQsTUFBVzthQUNwQixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtPQUFMLEVBQThDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUM1QyxLQUFDLENBQUEsS0FBRCxDQUFPLE1BQVAsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sTUFBUDtZQUFlLE1BQUEsRUFBUSxZQUF2QjtXQUFmO1VBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULEVBQTJCLElBQUEsY0FBQSxDQUFlO1lBQUEsSUFBQSxFQUFNLElBQU47V0FBZixDQUEzQjtVQUNBLEtBQUMsQ0FBQSxLQUFELENBQU8sc0JBQVAsRUFBK0I7WUFBQSxLQUFBLEVBQU8sY0FBUDtXQUEvQjtpQkFDQSxLQUFDLENBQUEsS0FBRCxDQUFPLDJCQUFQLEVBQW9DO1lBQUEsS0FBQSxFQUFPLGVBQVA7V0FBcEM7UUFKNEM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlDO0lBRFE7O3FCQU9WLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixVQUFBOzJCQURXLE1BQXlDLElBQXhDLDRCQUFXLHdDQUFpQjtNQUN4QyxJQUFtQyxTQUFuQztRQUFBLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixTQUFyQixFQUFBOztNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsT0FBbkIsRUFDRTtRQUFBLGNBQUEsRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsU0FBRCxDQUFXLEtBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFBLENBQVg7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEI7UUFDQSxhQUFBLEVBQWUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRGY7T0FERjtNQUlBLElBQUEsQ0FBTyxRQUFQO1FBQ0UsSUFBQyxDQUFBLFVBQVUsQ0FBQyxFQUFaLENBQWUsTUFBZixFQUF1QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxLQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkIsRUFERjs7TUFHQSxJQUFHLGVBQUg7UUFDRSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBQSxDQUFzQixDQUFDLE9BQXZCLENBQStCLGVBQS9CO2VBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQUEsQ0FBc0IsQ0FBQyxTQUF2QixDQUFBLEVBRkY7O0lBVFU7O3FCQWFaLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7UUFBQSxJQUFBLEVBQU0sSUFBSSxDQUFDLE9BQVg7T0FBN0I7TUFDVCxJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBQTthQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFBLENBQXNCLENBQUMsc0JBQXZCLENBQUE7SUFITTs7cUJBS1IsS0FBQSxHQUFPLFNBQUE7QUFDTCxVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFDLENBQUE7TUFDbEIsSUFBQyxDQUFBLEtBQUQsR0FBUzs7UUFDVCxjQUFjLENBQUUsT0FBaEIsQ0FBQTs7YUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBQSxDQUE4QixDQUFDLFFBQS9CLENBQUE7SUFKSzs7cUJBTVAsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsS0FBRCxDQUFBO0lBRE07Ozs7S0FoQ1c7QUFIckIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGV4dEVkaXRvclZpZXcsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIERpYWxvZyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6ICh7cHJvbXB0fSA9IHt9KSAtPlxuICAgIEBkaXYgY2xhc3M6ICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC1kaWFsb2cnLCA9PlxuICAgICAgQGxhYmVsIHByb21wdCwgY2xhc3M6ICdpY29uJywgb3V0bGV0OiAncHJvbXB0VGV4dCdcbiAgICAgIEBzdWJ2aWV3ICdtaW5pRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUpXG4gICAgICBAbGFiZWwgJ0VzY2FwZSAoRXNjKSB0byBleGl0Jywgc3R5bGU6ICdmbG9hdDogbGVmdDsnXG4gICAgICBAbGFiZWwgJ0VudGVyIChcXHUyMUI1KSB0byBjb25maXJtJywgc3R5bGU6ICdmbG9hdDogcmlnaHQ7J1xuXG4gIGluaXRpYWxpemU6ICh7aWNvbkNsYXNzLCBwbGFjZWhvbGRlclRleHQsIHN0YXlPcGVufSA9IHt9KSAtPlxuICAgIEBwcm9tcHRUZXh0LmFkZENsYXNzKGljb25DbGFzcykgaWYgaWNvbkNsYXNzXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgQGVsZW1lbnQsXG4gICAgICAnY29yZTpjb25maXJtJzogPT4gQG9uQ29uZmlybShAbWluaUVkaXRvci5nZXRUZXh0KCkpXG4gICAgICAnY29yZTpjYW5jZWwnOiA9PiBAY2FuY2VsKClcblxuICAgIHVubGVzcyBzdGF5T3BlblxuICAgICAgQG1pbmlFZGl0b3Iub24gJ2JsdXInLCA9PiBAY2xvc2UoKVxuXG4gICAgaWYgcGxhY2Vob2xkZXJUZXh0XG4gICAgICBAbWluaUVkaXRvci5nZXRNb2RlbCgpLnNldFRleHQgcGxhY2Vob2xkZXJUZXh0XG4gICAgICBAbWluaUVkaXRvci5nZXRNb2RlbCgpLnNlbGVjdEFsbCgpXG5cbiAgYXR0YWNoOiAtPlxuICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcy5lbGVtZW50KVxuICAgIEBtaW5pRWRpdG9yLmZvY3VzKClcbiAgICBAbWluaUVkaXRvci5nZXRNb2RlbCgpLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKVxuXG4gIGNsb3NlOiAtPlxuICAgIHBhbmVsVG9EZXN0cm95ID0gQHBhbmVsXG4gICAgQHBhbmVsID0gbnVsbFxuICAgIHBhbmVsVG9EZXN0cm95Py5kZXN0cm95KClcbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKVxuXG4gIGNhbmNlbDogLT5cbiAgICBAY2xvc2UoKVxuIl19
