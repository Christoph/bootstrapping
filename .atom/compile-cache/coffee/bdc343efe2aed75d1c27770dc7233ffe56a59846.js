(function() {
  var TouchBar, TouchBarButton, TouchBarLabel, TouchBarSpacer, spinning;

  TouchBar = require('remote').TouchBar;

  TouchBarLabel = TouchBar.TouchBarLabel, TouchBarButton = TouchBar.TouchBarButton, TouchBarSpacer = TouchBar.TouchBarSpacer;

  spinning = false;

  module.exports = {
    update: function(data) {
      var button, touchBar, window;
      if (!TouchBar) {
        return;
      }
      button = new TouchBarButton({
        label: data.text + ": " + (data.description.trim().split('\n')[0]),
        backgroundColor: '#353232',
        click: (function(_this) {
          return function() {
            var promise;
            promise = atom.workspace.open(data.fileName);
            return promise.then(function(editor) {
              editor.setCursorBufferPosition([data.line, data.column]);
              return editor.scrollToCursorPosition();
            });
          };
        })(this)
      });
      touchBar = new TouchBar([
        button, new TouchBarSpacer({
          size: 'small'
        })
      ]);
      window = atom.getCurrentWindow();
      return window.setTouchBar(touchBar);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLXB5dGhvbi9saWIvdG91Y2hiYXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxXQUFZLE9BQUEsQ0FBUSxRQUFSOztFQUNaLHNDQUFELEVBQWdCLHdDQUFoQixFQUFnQzs7RUFFaEMsUUFBQSxHQUFXOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxNQUFBLEVBQVEsU0FBQyxJQUFEO0FBQ04sVUFBQTtNQUFBLElBQUcsQ0FBSSxRQUFQO0FBQ0UsZUFERjs7TUFFQSxNQUFBLEdBQWEsSUFBQSxjQUFBLENBQWU7UUFDMUIsS0FBQSxFQUFVLElBQUksQ0FBQyxJQUFOLEdBQVcsSUFBWCxHQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFqQixDQUFBLENBQXVCLENBQUMsS0FBeEIsQ0FBOEIsSUFBOUIsQ0FBb0MsQ0FBQSxDQUFBLENBQXJDLENBREc7UUFFMUIsZUFBQSxFQUFpQixTQUZTO1FBRzFCLEtBQUEsRUFBTyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO0FBQ0wsZ0JBQUE7WUFBQSxPQUFBLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLElBQUksQ0FBQyxRQUF6QjttQkFDVixPQUFPLENBQUMsSUFBUixDQUFhLFNBQUMsTUFBRDtjQUNYLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixDQUFDLElBQUksQ0FBQyxJQUFOLEVBQVksSUFBSSxDQUFDLE1BQWpCLENBQS9CO3FCQUNBLE1BQU0sQ0FBQyxzQkFBUCxDQUFBO1lBRlcsQ0FBYjtVQUZLO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUhtQjtPQUFmO01BU2IsUUFBQSxHQUFlLElBQUEsUUFBQSxDQUFTO1FBQ3RCLE1BRHNCLEVBRWxCLElBQUEsY0FBQSxDQUFlO1VBQUMsSUFBQSxFQUFNLE9BQVA7U0FBZixDQUZrQjtPQUFUO01BSWYsTUFBQSxHQUFTLElBQUksQ0FBQyxnQkFBTCxDQUFBO2FBQ1QsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsUUFBbkI7SUFqQk0sQ0FBUjs7QUFORiIsInNvdXJjZXNDb250ZW50IjpbIntUb3VjaEJhcn0gPSByZXF1aXJlKCdyZW1vdGUnKVxue1RvdWNoQmFyTGFiZWwsIFRvdWNoQmFyQnV0dG9uLCBUb3VjaEJhclNwYWNlcn0gPSBUb3VjaEJhclxuXG5zcGlubmluZyA9IGZhbHNlXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgdXBkYXRlOiAoZGF0YSkgLT5cbiAgICBpZiBub3QgVG91Y2hCYXJcbiAgICAgIHJldHVyblxuICAgIGJ1dHRvbiA9IG5ldyBUb3VjaEJhckJ1dHRvbih7XG4gICAgICBsYWJlbDogXCIje2RhdGEudGV4dH06ICN7ZGF0YS5kZXNjcmlwdGlvbi50cmltKCkuc3BsaXQoJ1xcbicpWzBdfVwiLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzM1MzIzMicsXG4gICAgICBjbGljazogKCkgPT5cbiAgICAgICAgcHJvbWlzZSA9IGF0b20ud29ya3NwYWNlLm9wZW4oZGF0YS5maWxlTmFtZSlcbiAgICAgICAgcHJvbWlzZS50aGVuIChlZGl0b3IpIC0+XG4gICAgICAgICAgZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKFtkYXRhLmxpbmUsIGRhdGEuY29sdW1uXSlcbiAgICAgICAgICBlZGl0b3Iuc2Nyb2xsVG9DdXJzb3JQb3NpdGlvbigpXG4gICAgfSlcbiAgICB0b3VjaEJhciA9IG5ldyBUb3VjaEJhcihbXG4gICAgICBidXR0b24sXG4gICAgICBuZXcgVG91Y2hCYXJTcGFjZXIoe3NpemU6ICdzbWFsbCd9KSxcbiAgICBdKVxuICAgIHdpbmRvdyA9IGF0b20uZ2V0Q3VycmVudFdpbmRvdygpXG4gICAgd2luZG93LnNldFRvdWNoQmFyKHRvdWNoQmFyKVxuIl19
