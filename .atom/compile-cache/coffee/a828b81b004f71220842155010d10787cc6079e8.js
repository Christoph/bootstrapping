(function() {
  var packagePath, path;

  path = require('path');

  packagePath = path.dirname(__dirname);

  module.exports = {
    linter_paths: {
      isort: path.join(packagePath, 'bin', 'isort.py'),
      pylama: path.join(packagePath, 'bin', 'pylama.py')
    },
    linters: {
      pylint: 'pylint',
      mccabe: 'mccabe',
      pep8: 'pep8',
      pep257: 'pep257',
      pyflakes: 'pyflakes',
      radon: 'radon',
      isort: 'isort'
    },
    regex: '(?<file_>.+):' + '(?<line>\\d+):' + '(?<col>\\d+):' + '\\s+' + '(((?<type>[ECDFINRW])(?<file>\\d+)(:\\s+|\\s+))|(.*?))' + '(?<message>.+)'
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvY29uc3RhbnRzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLFdBQUEsR0FBYyxJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWI7O0VBRWQsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZixZQUFBLEVBQWM7TUFDWixLQUFBLEVBQU8sSUFBSSxDQUFDLElBQUwsQ0FBVSxXQUFWLEVBQXVCLEtBQXZCLEVBQThCLFVBQTlCLENBREs7TUFFWixNQUFBLEVBQVEsSUFBSSxDQUFDLElBQUwsQ0FBVSxXQUFWLEVBQXVCLEtBQXZCLEVBQThCLFdBQTlCLENBRkk7S0FEQztJQU1mLE9BQUEsRUFBUztNQUNQLE1BQUEsRUFBUSxRQUREO01BRVAsTUFBQSxFQUFRLFFBRkQ7TUFHUCxJQUFBLEVBQU0sTUFIQztNQUlQLE1BQUEsRUFBUSxRQUpEO01BS1AsUUFBQSxFQUFVLFVBTEg7TUFNUCxLQUFBLEVBQU8sT0FOQTtNQU9QLEtBQUEsRUFBTyxPQVBBO0tBTk07SUFnQmYsS0FBQSxFQUNFLGVBQUEsR0FDQSxnQkFEQSxHQUVBLGVBRkEsR0FHQSxNQUhBLEdBSUEsd0RBSkEsR0FLQSxnQkF0QmE7O0FBSmpCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbnBhY2thZ2VQYXRoID0gcGF0aC5kaXJuYW1lKF9fZGlybmFtZSlcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGxpbnRlcl9wYXRoczoge1xuICAgIGlzb3J0OiBwYXRoLmpvaW4gcGFja2FnZVBhdGgsICdiaW4nLCAnaXNvcnQucHknXG4gICAgcHlsYW1hOiBwYXRoLmpvaW4gcGFja2FnZVBhdGgsICdiaW4nLCAncHlsYW1hLnB5J1xuICB9XG5cbiAgbGludGVyczoge1xuICAgIHB5bGludDogJ3B5bGludCdcbiAgICBtY2NhYmU6ICdtY2NhYmUnXG4gICAgcGVwODogJ3BlcDgnXG4gICAgcGVwMjU3OiAncGVwMjU3J1xuICAgIHB5Zmxha2VzOiAncHlmbGFrZXMnXG4gICAgcmFkb246ICdyYWRvbidcbiAgICBpc29ydDogJ2lzb3J0J1xuICB9XG5cbiAgcmVnZXg6XG4gICAgJyg/PGZpbGVfPi4rKTonICtcbiAgICAnKD88bGluZT5cXFxcZCspOicgK1xuICAgICcoPzxjb2w+XFxcXGQrKTonICtcbiAgICAnXFxcXHMrJyArXG4gICAgJygoKD88dHlwZT5bRUNERklOUlddKSg/PGZpbGU+XFxcXGQrKSg6XFxcXHMrfFxcXFxzKykpfCguKj8pKScgK1xuICAgICcoPzxtZXNzYWdlPi4rKSdcbn1cbiJdfQ==
