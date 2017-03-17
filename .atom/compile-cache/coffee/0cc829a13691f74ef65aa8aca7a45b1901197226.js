(function() {
  var CompositeDisposable, Disposable, MinimapGitDiff, MinimapGitDiffBinding, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  MinimapGitDiffBinding = null;

  MinimapGitDiff = (function() {
    MinimapGitDiff.prototype.config = {
      useGutterDecoration: {
        type: 'boolean',
        "default": false,
        description: 'When enabled the gif diffs will be displayed as thin vertical lines on the left side of the minimap.'
      }
    };

    MinimapGitDiff.prototype.pluginActive = false;

    function MinimapGitDiff() {
      this.destroyBindings = bind(this.destroyBindings, this);
      this.createBindings = bind(this.createBindings, this);
      this.activateBinding = bind(this.activateBinding, this);
      this.subscriptions = new CompositeDisposable;
    }

    MinimapGitDiff.prototype.isActive = function() {
      return this.pluginActive;
    };

    MinimapGitDiff.prototype.activate = function() {
      return this.bindings = new WeakMap;
    };

    MinimapGitDiff.prototype.consumeMinimapServiceV1 = function(minimap1) {
      this.minimap = minimap1;
      return this.minimap.registerPlugin('git-diff', this);
    };

    MinimapGitDiff.prototype.deactivate = function() {
      this.destroyBindings();
      return this.minimap = null;
    };

    MinimapGitDiff.prototype.activatePlugin = function() {
      var e;
      if (this.pluginActive) {
        return;
      }
      try {
        this.activateBinding();
        this.pluginActive = true;
        this.subscriptions.add(this.minimap.onDidActivate(this.activateBinding));
        return this.subscriptions.add(this.minimap.onDidDeactivate(this.destroyBindings));
      } catch (error) {
        e = error;
        return console.log(e);
      }
    };

    MinimapGitDiff.prototype.deactivatePlugin = function() {
      if (!this.pluginActive) {
        return;
      }
      this.pluginActive = false;
      this.subscriptions.dispose();
      return this.destroyBindings();
    };

    MinimapGitDiff.prototype.activateBinding = function() {
      if (this.getRepositories().length > 0) {
        this.createBindings();
      }
      return this.subscriptions.add(atom.project.onDidChangePaths((function(_this) {
        return function() {
          if (_this.getRepositories().length > 0) {
            return _this.createBindings();
          } else {
            return _this.destroyBindings();
          }
        };
      })(this)));
    };

    MinimapGitDiff.prototype.createBindings = function() {
      MinimapGitDiffBinding || (MinimapGitDiffBinding = require('./minimap-git-diff-binding'));
      return this.subscriptions.add(this.minimap.observeMinimaps((function(_this) {
        return function(o) {
          var binding, editor, minimap, ref1;
          minimap = (ref1 = o.view) != null ? ref1 : o;
          editor = minimap.getTextEditor();
          if (editor == null) {
            return;
          }
          binding = new MinimapGitDiffBinding(minimap);
          return _this.bindings.set(minimap, binding);
        };
      })(this)));
    };

    MinimapGitDiff.prototype.getRepositories = function() {
      return atom.project.getRepositories().filter(function(repo) {
        return repo != null;
      });
    };

    MinimapGitDiff.prototype.destroyBindings = function() {
      if (!((this.minimap != null) && (this.minimap.editorsMinimaps != null))) {
        return;
      }
      return this.minimap.editorsMinimaps.forEach((function(_this) {
        return function(minimap) {
          var ref1;
          if ((ref1 = _this.bindings.get(minimap)) != null) {
            ref1.destroy();
          }
          return _this.bindings["delete"](minimap);
        };
      })(this));
    };

    return MinimapGitDiff;

  })();

  module.exports = new MinimapGitDiff;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbWluaW1hcC1naXQtZGlmZi9saWIvbWluaW1hcC1naXQtZGlmZi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJFQUFBO0lBQUE7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLE1BQVIsQ0FBcEMsRUFBQyw2Q0FBRCxFQUFzQjs7RUFFdEIscUJBQUEsR0FBd0I7O0VBRWxCOzZCQUVKLE1BQUEsR0FDRTtNQUFBLG1CQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLFdBQUEsRUFBYSxzR0FGYjtPQURGOzs7NkJBS0YsWUFBQSxHQUFjOztJQUNELHdCQUFBOzs7O01BQ1gsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtJQURWOzs2QkFHYixRQUFBLEdBQVUsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs2QkFFVixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBSTtJQURSOzs2QkFHVix1QkFBQSxHQUF5QixTQUFDLFFBQUQ7TUFBQyxJQUFDLENBQUEsVUFBRDthQUN4QixJQUFDLENBQUEsT0FBTyxDQUFDLGNBQVQsQ0FBd0IsVUFBeEIsRUFBb0MsSUFBcEM7SUFEdUI7OzZCQUd6QixVQUFBLEdBQVksU0FBQTtNQUNWLElBQUMsQ0FBQSxlQUFELENBQUE7YUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXO0lBRkQ7OzZCQUlaLGNBQUEsR0FBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxZQUFYO0FBQUEsZUFBQTs7QUFFQTtRQUNFLElBQUMsQ0FBQSxlQUFELENBQUE7UUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQjtRQUVoQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUFULENBQXVCLElBQUMsQ0FBQSxlQUF4QixDQUFuQjtlQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsT0FBTyxDQUFDLGVBQVQsQ0FBeUIsSUFBQyxDQUFBLGVBQTFCLENBQW5CLEVBTEY7T0FBQSxhQUFBO1FBTU07ZUFDSixPQUFPLENBQUMsR0FBUixDQUFZLENBQVosRUFQRjs7SUFIYzs7NkJBWWhCLGdCQUFBLEdBQWtCLFNBQUE7TUFDaEIsSUFBQSxDQUFjLElBQUMsQ0FBQSxZQUFmO0FBQUEsZUFBQTs7TUFFQSxJQUFDLENBQUEsWUFBRCxHQUFnQjtNQUNoQixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTthQUNBLElBQUMsQ0FBQSxlQUFELENBQUE7SUFMZ0I7OzZCQU9sQixlQUFBLEdBQWlCLFNBQUE7TUFDZixJQUFxQixJQUFDLENBQUEsZUFBRCxDQUFBLENBQWtCLENBQUMsTUFBbkIsR0FBNEIsQ0FBakQ7UUFBQSxJQUFDLENBQUEsY0FBRCxDQUFBLEVBQUE7O2FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWIsQ0FBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBRS9DLElBQUcsS0FBQyxDQUFBLGVBQUQsQ0FBQSxDQUFrQixDQUFDLE1BQW5CLEdBQTRCLENBQS9CO21CQUNFLEtBQUMsQ0FBQSxjQUFELENBQUEsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBQyxDQUFBLGVBQUQsQ0FBQSxFQUhGOztRQUYrQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUIsQ0FBbkI7SUFIZTs7NkJBVWpCLGNBQUEsR0FBZ0IsU0FBQTtNQUNkLDBCQUFBLHdCQUEwQixPQUFBLENBQVEsNEJBQVI7YUFFMUIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxPQUFPLENBQUMsZUFBVCxDQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsQ0FBRDtBQUMxQyxjQUFBO1VBQUEsT0FBQSxvQ0FBbUI7VUFDbkIsTUFBQSxHQUFTLE9BQU8sQ0FBQyxhQUFSLENBQUE7VUFFVCxJQUFjLGNBQWQ7QUFBQSxtQkFBQTs7VUFFQSxPQUFBLEdBQWMsSUFBQSxxQkFBQSxDQUFzQixPQUF0QjtpQkFDZCxLQUFDLENBQUEsUUFBUSxDQUFDLEdBQVYsQ0FBYyxPQUFkLEVBQXVCLE9BQXZCO1FBUDBDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QixDQUFuQjtJQUhjOzs2QkFZaEIsZUFBQSxHQUFpQixTQUFBO2FBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFiLENBQUEsQ0FBOEIsQ0FBQyxNQUEvQixDQUFzQyxTQUFDLElBQUQ7ZUFBVTtNQUFWLENBQXRDO0lBQUg7OzZCQUVqQixlQUFBLEdBQWlCLFNBQUE7TUFDZixJQUFBLENBQUEsQ0FBYyxzQkFBQSxJQUFjLHNDQUE1QixDQUFBO0FBQUEsZUFBQTs7YUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUF6QixDQUFpQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRDtBQUMvQixjQUFBOztnQkFBc0IsQ0FBRSxPQUF4QixDQUFBOztpQkFDQSxLQUFDLENBQUEsUUFBUSxFQUFDLE1BQUQsRUFBVCxDQUFpQixPQUFqQjtRQUYrQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakM7SUFGZTs7Ozs7O0VBTW5CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUk7QUE3RXJCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuTWluaW1hcEdpdERpZmZCaW5kaW5nID0gbnVsbFxuXG5jbGFzcyBNaW5pbWFwR2l0RGlmZlxuXG4gIGNvbmZpZzpcbiAgICB1c2VHdXR0ZXJEZWNvcmF0aW9uOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246ICdXaGVuIGVuYWJsZWQgdGhlIGdpZiBkaWZmcyB3aWxsIGJlIGRpc3BsYXllZCBhcyB0aGluIHZlcnRpY2FsIGxpbmVzIG9uIHRoZSBsZWZ0IHNpZGUgb2YgdGhlIG1pbmltYXAuJ1xuXG4gIHBsdWdpbkFjdGl2ZTogZmFsc2VcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGlzQWN0aXZlOiAtPiBAcGx1Z2luQWN0aXZlXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGJpbmRpbmdzID0gbmV3IFdlYWtNYXBcblxuICBjb25zdW1lTWluaW1hcFNlcnZpY2VWMTogKEBtaW5pbWFwKSAtPlxuICAgIEBtaW5pbWFwLnJlZ2lzdGVyUGx1Z2luICdnaXQtZGlmZicsIHRoaXNcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBkZXN0cm95QmluZGluZ3MoKVxuICAgIEBtaW5pbWFwID0gbnVsbFxuXG4gIGFjdGl2YXRlUGx1Z2luOiAtPlxuICAgIHJldHVybiBpZiBAcGx1Z2luQWN0aXZlXG5cbiAgICB0cnlcbiAgICAgIEBhY3RpdmF0ZUJpbmRpbmcoKVxuICAgICAgQHBsdWdpbkFjdGl2ZSA9IHRydWVcblxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtaW5pbWFwLm9uRGlkQWN0aXZhdGUgQGFjdGl2YXRlQmluZGluZ1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtaW5pbWFwLm9uRGlkRGVhY3RpdmF0ZSBAZGVzdHJveUJpbmRpbmdzXG4gICAgY2F0Y2ggZVxuICAgICAgY29uc29sZS5sb2cgZVxuXG4gIGRlYWN0aXZhdGVQbHVnaW46IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGx1Z2luQWN0aXZlXG5cbiAgICBAcGx1Z2luQWN0aXZlID0gZmFsc2VcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAZGVzdHJveUJpbmRpbmdzKClcblxuICBhY3RpdmF0ZUJpbmRpbmc6ID0+XG4gICAgQGNyZWF0ZUJpbmRpbmdzKCkgaWYgQGdldFJlcG9zaXRvcmllcygpLmxlbmd0aCA+IDBcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuXG4gICAgICBpZiBAZ2V0UmVwb3NpdG9yaWVzKCkubGVuZ3RoID4gMFxuICAgICAgICBAY3JlYXRlQmluZGluZ3MoKVxuICAgICAgZWxzZVxuICAgICAgICBAZGVzdHJveUJpbmRpbmdzKClcblxuICBjcmVhdGVCaW5kaW5nczogPT5cbiAgICBNaW5pbWFwR2l0RGlmZkJpbmRpbmcgfHw9IHJlcXVpcmUgJy4vbWluaW1hcC1naXQtZGlmZi1iaW5kaW5nJ1xuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtaW5pbWFwLm9ic2VydmVNaW5pbWFwcyAobykgPT5cbiAgICAgIG1pbmltYXAgPSBvLnZpZXcgPyBvXG4gICAgICBlZGl0b3IgPSBtaW5pbWFwLmdldFRleHRFZGl0b3IoKVxuXG4gICAgICByZXR1cm4gdW5sZXNzIGVkaXRvcj9cblxuICAgICAgYmluZGluZyA9IG5ldyBNaW5pbWFwR2l0RGlmZkJpbmRpbmcgbWluaW1hcFxuICAgICAgQGJpbmRpbmdzLnNldChtaW5pbWFwLCBiaW5kaW5nKVxuXG4gIGdldFJlcG9zaXRvcmllczogLT4gYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpLmZpbHRlciAocmVwbykgLT4gcmVwbz9cblxuICBkZXN0cm95QmluZGluZ3M6ID0+XG4gICAgcmV0dXJuIHVubGVzcyBAbWluaW1hcD8gYW5kIEBtaW5pbWFwLmVkaXRvcnNNaW5pbWFwcz9cbiAgICBAbWluaW1hcC5lZGl0b3JzTWluaW1hcHMuZm9yRWFjaCAobWluaW1hcCkgPT5cbiAgICAgIEBiaW5kaW5ncy5nZXQobWluaW1hcCk/LmRlc3Ryb3koKVxuICAgICAgQGJpbmRpbmdzLmRlbGV0ZShtaW5pbWFwKVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBNaW5pbWFwR2l0RGlmZlxuIl19
