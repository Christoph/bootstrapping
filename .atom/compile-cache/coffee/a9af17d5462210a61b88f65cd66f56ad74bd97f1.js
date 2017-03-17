(function() {
  var DjangoTemplates;

  DjangoTemplates = (function() {
    function DjangoTemplates() {}

    DjangoTemplates.prototype.desc = "defaultToDjangoTemplatesForFilePathsContaining";

    DjangoTemplates.prototype.configKey = "django-templates." + DjangoTemplates.prototype.desc;

    DjangoTemplates.prototype.config = {
      defaultToDjangoTemplatesForFilePathsContaining: {
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        }
      }
    };

    DjangoTemplates.prototype.activate = function(state) {
      return this.watchEditors();
    };

    DjangoTemplates.prototype.watchEditors = function() {
      return atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var frag, grammar, i, len, matches, path, ref;
          path = editor.getPath();
          if (path) {
            if (path.indexOf('.html') !== -1) {
              matches = false;
              ref = atom.config.get(_this.configKey);
              for (i = 0, len = ref.length; i < len; i++) {
                frag = ref[i];
                if (path.indexOf(frag)) {
                  matches = true;
                  break;
                }
              }
              if (matches) {
                grammar = atom.grammars.grammarForScopeName('text.html.django');
                return editor.setGrammar(grammar);
              }
            }
          }
        };
      })(this));
    };

    return DjangoTemplates;

  })();

  module.exports = new DjangoTemplates;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvZGphbmdvLXRlbXBsYXRlcy9kamFuZ28tdGVtcGxhdGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQU07Ozs4QkFDSixJQUFBLEdBQU07OzhCQUVOLFNBQUEsR0FBVyxtQkFBQSxHQUFxQixlQUFlLENBQUMsU0FBUyxDQUFDOzs4QkFFMUQsTUFBQSxHQUNFO01BQUEsOENBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxPQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQURUO1FBRUEsS0FBQSxFQUNFO1VBQUEsSUFBQSxFQUFNLFFBQU47U0FIRjtPQURGOzs7OEJBTUYsUUFBQSxHQUFVLFNBQUMsS0FBRDthQUNSLElBQUMsQ0FBQSxZQUFELENBQUE7SUFEUTs7OEJBR1YsWUFBQSxHQUFjLFNBQUE7YUFDWixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQWtDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO0FBQ2hDLGNBQUE7VUFBQSxJQUFBLEdBQU8sTUFBTSxDQUFDLE9BQVAsQ0FBQTtVQUNQLElBQUcsSUFBSDtZQUNFLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxPQUFiLENBQUEsS0FBMkIsQ0FBQyxDQUEvQjtjQUNFLE9BQUEsR0FBVTtBQUNWO0FBQUEsbUJBQUEscUNBQUE7O2dCQUNFLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFiLENBQUg7a0JBQ0UsT0FBQSxHQUFVO0FBQ1Ysd0JBRkY7O0FBREY7Y0FJQSxJQUFHLE9BQUg7Z0JBQ0UsT0FBQSxHQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0Msa0JBQWxDO3VCQUNWLE1BQU0sQ0FBQyxVQUFQLENBQWtCLE9BQWxCLEVBRkY7ZUFORjthQURGOztRQUZnQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEM7SUFEWTs7Ozs7O0VBY2hCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUk7QUE3QnJCIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRGphbmdvVGVtcGxhdGVzXG4gIGRlc2M6IFwiZGVmYXVsdFRvRGphbmdvVGVtcGxhdGVzRm9yRmlsZVBhdGhzQ29udGFpbmluZ1wiXG5cbiAgY29uZmlnS2V5OiBcImRqYW5nby10ZW1wbGF0ZXMuI3sgRGphbmdvVGVtcGxhdGVzLnByb3RvdHlwZS5kZXNjIH1cIlxuXG4gIGNvbmZpZzpcbiAgICBkZWZhdWx0VG9EamFuZ29UZW1wbGF0ZXNGb3JGaWxlUGF0aHNDb250YWluaW5nOlxuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGl0ZW1zOlxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQHdhdGNoRWRpdG9ycygpXG5cbiAgd2F0Y2hFZGl0b3JzOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSA9PlxuICAgICAgcGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICAgIGlmIHBhdGhcbiAgICAgICAgaWYgcGF0aC5pbmRleE9mKCcuaHRtbCcpIGlzbnQgLTFcbiAgICAgICAgICBtYXRjaGVzID0gZmFsc2VcbiAgICAgICAgICBmb3IgZnJhZyBpbiBhdG9tLmNvbmZpZy5nZXQgQGNvbmZpZ0tleVxuICAgICAgICAgICAgaWYgcGF0aC5pbmRleE9mKGZyYWcpXG4gICAgICAgICAgICAgIG1hdGNoZXMgPSB0cnVlXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgaWYgbWF0Y2hlc1xuICAgICAgICAgICAgZ3JhbW1hciA9IGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZSgndGV4dC5odG1sLmRqYW5nbycpXG4gICAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBEamFuZ29UZW1wbGF0ZXNcbiJdfQ==
