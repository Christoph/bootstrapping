(function() {
  var fs, path;

  fs = require("fs-plus");

  path = require("path");

  module.exports = {
    repositoryForPath: function(goalPath) {
      var directory, i, j, len, ref;
      ref = atom.project.getDirectories();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        directory = ref[i];
        if (goalPath === directory.getPath() || directory.contains(goalPath)) {
          return atom.project.getRepositories()[i];
        }
      }
      return null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbWluaW1hcC1naXQtZGlmZi9saWIvaGVscGVycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLGlCQUFBLEVBQW1CLFNBQUMsUUFBRDtBQUNqQixVQUFBO0FBQUE7QUFBQSxXQUFBLDZDQUFBOztRQUNFLElBQUcsUUFBQSxLQUFZLFNBQVMsQ0FBQyxPQUFWLENBQUEsQ0FBWixJQUFtQyxTQUFTLENBQUMsUUFBVixDQUFtQixRQUFuQixDQUF0QztBQUNFLGlCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBYixDQUFBLENBQStCLENBQUEsQ0FBQSxFQUR4Qzs7QUFERjthQUdBO0lBSmlCLENBQW5COztBQUpGIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlIFwiZnMtcGx1c1wiXG5wYXRoID0gcmVxdWlyZSBcInBhdGhcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHJlcG9zaXRvcnlGb3JQYXRoOiAoZ29hbFBhdGgpIC0+XG4gICAgZm9yIGRpcmVjdG9yeSwgaSBpbiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVxuICAgICAgaWYgZ29hbFBhdGggaXMgZGlyZWN0b3J5LmdldFBhdGgoKSBvciBkaXJlY3RvcnkuY29udGFpbnMoZ29hbFBhdGgpXG4gICAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbaV1cbiAgICBudWxsXG4iXX0=
