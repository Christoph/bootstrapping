(function() {
  var contextPackageFinder, git, notifier;

  contextPackageFinder = require('../../context-package-finder');

  git = require('../../git');

  notifier = require('../../notifier');

  module.exports = function() {
    var path, ref;
    if (path = (ref = contextPackageFinder.get()) != null ? ref.selectedPath : void 0) {
      return git.getRepoForPath(path).then(function(repo) {
        var file;
        file = repo.relativize(path);
        if (file === '') {
          file = '.';
        }
        return git.cmd(['reset', 'HEAD', '--', file], {
          cwd: repo.getWorkingDirectory()
        }).then(notifier.addSuccess)["catch"](notifier.addError);
      });
    } else {
      return notifier.addInfo("No file selected to unstage");
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL21vZGVscy9jb250ZXh0L2dpdC11bnN0YWdlLWZpbGUtY29udGV4dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLG9CQUFBLEdBQXVCLE9BQUEsQ0FBUSw4QkFBUjs7RUFDdkIsR0FBQSxHQUFNLE9BQUEsQ0FBUSxXQUFSOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsZ0JBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQTtBQUNmLFFBQUE7SUFBQSxJQUFHLElBQUEsbURBQWlDLENBQUUscUJBQXRDO2FBQ0UsR0FBRyxDQUFDLGNBQUosQ0FBbUIsSUFBbkIsQ0FBd0IsQ0FBQyxJQUF6QixDQUE4QixTQUFDLElBQUQ7QUFDNUIsWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFoQjtRQUNQLElBQWMsSUFBQSxLQUFRLEVBQXRCO1VBQUEsSUFBQSxHQUFPLElBQVA7O2VBQ0EsR0FBRyxDQUFDLEdBQUosQ0FBUSxDQUFDLE9BQUQsRUFBVSxNQUFWLEVBQWtCLElBQWxCLEVBQXdCLElBQXhCLENBQVIsRUFBdUM7VUFBQSxHQUFBLEVBQUssSUFBSSxDQUFDLG1CQUFMLENBQUEsQ0FBTDtTQUF2QyxDQUNBLENBQUMsSUFERCxDQUNNLFFBQVEsQ0FBQyxVQURmLENBRUEsRUFBQyxLQUFELEVBRkEsQ0FFTyxRQUFRLENBQUMsUUFGaEI7TUFINEIsQ0FBOUIsRUFERjtLQUFBLE1BQUE7YUFRRSxRQUFRLENBQUMsT0FBVCxDQUFpQiw2QkFBakIsRUFSRjs7RUFEZTtBQUpqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnRleHRQYWNrYWdlRmluZGVyID0gcmVxdWlyZSAnLi4vLi4vY29udGV4dC1wYWNrYWdlLWZpbmRlcidcbmdpdCA9IHJlcXVpcmUgJy4uLy4uL2dpdCdcbm5vdGlmaWVyID0gcmVxdWlyZSAnLi4vLi4vbm90aWZpZXInXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgaWYgcGF0aCA9IGNvbnRleHRQYWNrYWdlRmluZGVyLmdldCgpPy5zZWxlY3RlZFBhdGhcbiAgICBnaXQuZ2V0UmVwb0ZvclBhdGgocGF0aCkudGhlbiAocmVwbykgLT5cbiAgICAgIGZpbGUgPSByZXBvLnJlbGF0aXZpemUocGF0aClcbiAgICAgIGZpbGUgPSAnLicgaWYgZmlsZSBpcyAnJ1xuICAgICAgZ2l0LmNtZChbJ3Jlc2V0JywgJ0hFQUQnLCAnLS0nLCBmaWxlXSwgY3dkOiByZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKSlcbiAgICAgIC50aGVuKG5vdGlmaWVyLmFkZFN1Y2Nlc3MpXG4gICAgICAuY2F0Y2gobm90aWZpZXIuYWRkRXJyb3IpXG4gIGVsc2VcbiAgICBub3RpZmllci5hZGRJbmZvIFwiTm8gZmlsZSBzZWxlY3RlZCB0byB1bnN0YWdlXCJcbiJdfQ==
