(function() {
  module.exports = {
    config: {
      pylamaVersion: {
        type: 'string',
        "default": 'internal',
        "enum": ['external', 'internal'],
        description: 'Switch between internal Pylama (with Virtualenv detection and other cool things) or external stable Pylama (do not forget to specify executable path)',
        order: 0
      },
      interpreter: {
        type: 'string',
        "default": 'python',
        description: 'Python interpreter for internal Pylama (python, python3, /usr/bin/python, /usr/local/bin/python3, etc.)',
        order: 1
      },
      executablePath: {
        type: 'string',
        "default": 'pylama',
        description: 'Excutable path for external Pylama. Example: /usr/local/bin/pylama',
        order: 2
      },
      configFileLoad: {
        type: 'string',
        "default": 'Don\'t use pylama config',
        "enum": ['Don\'t use pylama config', 'Use pylama config'],
        title: 'Use Pylama configuration file',
        order: 3
      },
      configFileName: {
        type: 'string',
        "default": 'pylama.ini',
        title: 'Configuration file name',
        order: 4
      },
      ignoreErrorsAndWarnings: {
        type: 'string',
        "default": 'D203,D212,D213,D404',
        description: 'Comma-separated list of errors and warnings. Example: ED203,D212,D213,D404,111,E114,D101,D102,DW0311. See more: https://goo.gl/jeYN96, https://goo.gl/O8xhLM',
        order: 5
      },
      skipFiles: {
        type: 'string',
        "default": '',
        description: 'Skip files by masks. Comma-separated list of a file names. Example: */messages.py,*/__init__.py',
        order: 6
      },
      lintOnFly: {
        type: 'boolean',
        "default": true,
        description: "Enable linting on the fly. Need to restart Atom",
        order: 7
      },
      usePep8: {
        type: 'boolean',
        "default": true,
        title: 'Use pycodestyle/pep8',
        description: 'Use pycodestyle/pep8 style guide checker',
        order: 8
      },
      usePep257: {
        type: 'boolean',
        "default": true,
        title: 'Use pydocstyle/pep257',
        description: 'Use pydocstyle/pep257 docstring conventions checker',
        order: 9
      },
      usePyflakes: {
        type: 'boolean',
        "default": true,
        title: 'Use Pyflakes',
        description: 'Use Pyflakes checker',
        order: 10
      },
      usePylint: {
        type: 'boolean',
        "default": false,
        title: 'Use PyLint',
        description: 'Use PyLint linter. May be unstable for internal Pylama. For use with external Pylama you should install pylama_pylint module ("pip install pylama-pylint")',
        order: 11
      },
      useMcCabe: {
        type: 'boolean',
        "default": true,
        title: 'Use McCabe',
        description: 'Use McCabe complexity checker',
        order: 12
      },
      useRadon: {
        type: 'boolean',
        "default": false,
        title: 'Use Radon',
        description: 'Use Radon complexity and code metrics checker',
        order: 13
      },
      useIsort: {
        type: 'boolean',
        "default": false,
        title: 'Use isort',
        description: 'Use isort imports checker',
        order: 14
      },
      isortOnSave: {
        type: 'boolean',
        "default": false,
        title: 'isort imports on save (experimental)',
        order: 15
      }
    },
    activate: function() {
      require('atom-package-deps').install('linter-pylama');
      return console.log('Linter-Pylama: package loaded, ready to get initialized by AtomLinter.');
    },
    provideLinter: function() {
      var LinterPylama;
      LinterPylama = require('./linter-pylama.coffee');
      this.provider = new LinterPylama();
      return {
        grammarScopes: ['source.python', 'source.python.django'],
        scope: 'file',
        lint: this.provider.lint,
        lintOnFly: this.provider.isLintOnFly()
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvaW5pdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsTUFBQSxFQUNFO01BQUEsYUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFVBRFQ7UUFFQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsVUFBRCxFQUFhLFVBQWIsQ0FGTjtRQUdBLFdBQUEsRUFBYSx1SkFIYjtRQU1BLEtBQUEsRUFBTyxDQU5QO09BREY7TUFRQSxXQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsUUFEVDtRQUVBLFdBQUEsRUFBYSx5R0FGYjtRQUlBLEtBQUEsRUFBTyxDQUpQO09BVEY7TUFjQSxjQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsUUFEVDtRQUVBLFdBQUEsRUFBYSxvRUFGYjtRQUlBLEtBQUEsRUFBTyxDQUpQO09BZkY7TUFvQkEsY0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLDBCQURUO1FBRUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUNKLDBCQURJLEVBRUosbUJBRkksQ0FGTjtRQUtBLEtBQUEsRUFBTywrQkFMUDtRQU1BLEtBQUEsRUFBTyxDQU5QO09BckJGO01BNEJBLGNBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxZQURUO1FBRUEsS0FBQSxFQUFPLHlCQUZQO1FBR0EsS0FBQSxFQUFPLENBSFA7T0E3QkY7TUFpQ0EsdUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxxQkFEVDtRQUVBLFdBQUEsRUFBYSw4SkFGYjtRQUtBLEtBQUEsRUFBTyxDQUxQO09BbENGO01Bd0NBLFNBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQURUO1FBRUEsV0FBQSxFQUFhLGlHQUZiO1FBS0EsS0FBQSxFQUFPLENBTFA7T0F6Q0Y7TUErQ0EsU0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxXQUFBLEVBQWEsaURBRmI7UUFHQSxLQUFBLEVBQU8sQ0FIUDtPQWhERjtNQW9EQSxPQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLEtBQUEsRUFBTyxzQkFGUDtRQUdBLFdBQUEsRUFBYSwwQ0FIYjtRQUlBLEtBQUEsRUFBTyxDQUpQO09BckRGO01BMERBLFNBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsS0FBQSxFQUFPLHVCQUZQO1FBR0EsV0FBQSxFQUFhLHFEQUhiO1FBSUEsS0FBQSxFQUFPLENBSlA7T0EzREY7TUFnRUEsV0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxLQUFBLEVBQU8sY0FGUDtRQUdBLFdBQUEsRUFBYSxzQkFIYjtRQUlBLEtBQUEsRUFBTyxFQUpQO09BakVGO01Bc0VBLFNBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsS0FBQSxFQUFPLFlBRlA7UUFHQSxXQUFBLEVBQWEsNEpBSGI7UUFNQSxLQUFBLEVBQU8sRUFOUDtPQXZFRjtNQThFQSxTQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLEtBQUEsRUFBTyxZQUZQO1FBR0EsV0FBQSxFQUFhLCtCQUhiO1FBSUEsS0FBQSxFQUFPLEVBSlA7T0EvRUY7TUFvRkEsUUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7UUFFQSxLQUFBLEVBQU8sV0FGUDtRQUdBLFdBQUEsRUFBYSwrQ0FIYjtRQUlBLEtBQUEsRUFBTyxFQUpQO09BckZGO01BMEZBLFFBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsS0FBQSxFQUFPLFdBRlA7UUFHQSxXQUFBLEVBQWEsMkJBSGI7UUFJQSxLQUFBLEVBQU8sRUFKUDtPQTNGRjtNQWdHQSxXQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLEtBQUEsRUFBTyxzQ0FGUDtRQUdBLEtBQUEsRUFBTyxFQUhQO09BakdGO0tBREY7SUF3R0EsUUFBQSxFQUFVLFNBQUE7TUFDUixPQUFBLENBQVEsbUJBQVIsQ0FBNEIsQ0FBQyxPQUE3QixDQUFxQyxlQUFyQzthQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksd0VBQVo7SUFGUSxDQXhHVjtJQThHQSxhQUFBLEVBQWUsU0FBQTtBQUNiLFVBQUE7TUFBQSxZQUFBLEdBQWUsT0FBQSxDQUFRLHdCQUFSO01BQ2YsSUFBQyxDQUFBLFFBQUQsR0FBZ0IsSUFBQSxZQUFBLENBQUE7YUFDaEI7UUFDRSxhQUFBLEVBQWUsQ0FDYixlQURhLEVBRWIsc0JBRmEsQ0FEakI7UUFLRSxLQUFBLEVBQU8sTUFMVDtRQU1FLElBQUEsRUFBTSxJQUFDLENBQUEsUUFBUSxDQUFDLElBTmxCO1FBT0UsU0FBQSxFQUFjLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBYixDQUFBLENBUGI7O0lBSGEsQ0E5R2Y7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIGNvbmZpZzpcbiAgICBweWxhbWFWZXJzaW9uOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdpbnRlcm5hbCdcbiAgICAgIGVudW06IFsnZXh0ZXJuYWwnLCAnaW50ZXJuYWwnXVxuICAgICAgZGVzY3JpcHRpb246ICdTd2l0Y2ggYmV0d2VlbiBpbnRlcm5hbCBQeWxhbWEgKHdpdGggVmlydHVhbGVudiBkZXRlY3Rpb25cbiAgICAgIGFuZCBvdGhlciBjb29sIHRoaW5ncykgb3IgZXh0ZXJuYWwgc3RhYmxlIFB5bGFtYSAoZG8gbm90IGZvcmdldCB0b1xuICAgICAgc3BlY2lmeSBleGVjdXRhYmxlIHBhdGgpJ1xuICAgICAgb3JkZXI6IDBcbiAgICBpbnRlcnByZXRlcjpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAncHl0aG9uJ1xuICAgICAgZGVzY3JpcHRpb246ICdQeXRob24gaW50ZXJwcmV0ZXIgZm9yIGludGVybmFsIFB5bGFtYVxuICAgICAgKHB5dGhvbiwgcHl0aG9uMywgL3Vzci9iaW4vcHl0aG9uLCAvdXNyL2xvY2FsL2Jpbi9weXRob24zLCBldGMuKSdcbiAgICAgIG9yZGVyOiAxXG4gICAgZXhlY3V0YWJsZVBhdGg6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ3B5bGFtYSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnRXhjdXRhYmxlIHBhdGggZm9yIGV4dGVybmFsIFB5bGFtYS5cbiAgICAgIEV4YW1wbGU6IC91c3IvbG9jYWwvYmluL3B5bGFtYSdcbiAgICAgIG9yZGVyOiAyXG4gICAgY29uZmlnRmlsZUxvYWQ6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ0RvblxcJ3QgdXNlIHB5bGFtYSBjb25maWcnXG4gICAgICBlbnVtOiBbXG4gICAgICAgICdEb25cXCd0IHVzZSBweWxhbWEgY29uZmlnJyxcbiAgICAgICAgJ1VzZSBweWxhbWEgY29uZmlnJ11cbiAgICAgIHRpdGxlOiAnVXNlIFB5bGFtYSBjb25maWd1cmF0aW9uIGZpbGUnXG4gICAgICBvcmRlcjogM1xuICAgIGNvbmZpZ0ZpbGVOYW1lOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdweWxhbWEuaW5pJ1xuICAgICAgdGl0bGU6ICdDb25maWd1cmF0aW9uIGZpbGUgbmFtZSdcbiAgICAgIG9yZGVyOiA0XG4gICAgaWdub3JlRXJyb3JzQW5kV2FybmluZ3M6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ0QyMDMsRDIxMixEMjEzLEQ0MDQnXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGVycm9ycyBhbmQgd2FybmluZ3MuXG4gICAgICBFeGFtcGxlOiBFRDIwMyxEMjEyLEQyMTMsRDQwNCwxMTEsRTExNCxEMTAxLEQxMDIsRFcwMzExLlxuICAgICAgU2VlIG1vcmU6IGh0dHBzOi8vZ29vLmdsL2plWU45NiwgaHR0cHM6Ly9nb28uZ2wvTzh4aExNJ1xuICAgICAgb3JkZXI6IDVcbiAgICBza2lwRmlsZXM6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJydcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2tpcCBmaWxlcyBieSBtYXNrcy5cbiAgICAgIENvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGEgZmlsZSBuYW1lcy5cbiAgICAgIEV4YW1wbGU6ICovbWVzc2FnZXMucHksKi9fX2luaXRfXy5weSdcbiAgICAgIG9yZGVyOiA2XG4gICAgbGludE9uRmx5OlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogXCJFbmFibGUgbGludGluZyBvbiB0aGUgZmx5LiBOZWVkIHRvIHJlc3RhcnQgQXRvbVwiXG4gICAgICBvcmRlcjogN1xuICAgIHVzZVBlcDg6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIHRpdGxlOiAnVXNlIHB5Y29kZXN0eWxlL3BlcDgnXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSBweWNvZGVzdHlsZS9wZXA4IHN0eWxlIGd1aWRlIGNoZWNrZXInXG4gICAgICBvcmRlcjogOFxuICAgIHVzZVBlcDI1NzpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgdGl0bGU6ICdVc2UgcHlkb2NzdHlsZS9wZXAyNTcnXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSBweWRvY3N0eWxlL3BlcDI1NyBkb2NzdHJpbmcgY29udmVudGlvbnMgY2hlY2tlcidcbiAgICAgIG9yZGVyOiA5XG4gICAgdXNlUHlmbGFrZXM6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIHRpdGxlOiAnVXNlIFB5Zmxha2VzJ1xuICAgICAgZGVzY3JpcHRpb246ICdVc2UgUHlmbGFrZXMgY2hlY2tlcidcbiAgICAgIG9yZGVyOiAxMFxuICAgIHVzZVB5bGludDpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIHRpdGxlOiAnVXNlIFB5TGludCdcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIFB5TGludCBsaW50ZXIuIE1heSBiZSB1bnN0YWJsZSBmb3IgaW50ZXJuYWwgUHlsYW1hLlxuICAgICAgRm9yIHVzZSB3aXRoIGV4dGVybmFsIFB5bGFtYSB5b3Ugc2hvdWxkIGluc3RhbGwgcHlsYW1hX3B5bGludCBtb2R1bGVcbiAgICAgIChcInBpcCBpbnN0YWxsIHB5bGFtYS1weWxpbnRcIiknXG4gICAgICBvcmRlcjogMTFcbiAgICB1c2VNY0NhYmU6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIHRpdGxlOiAnVXNlIE1jQ2FiZSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIE1jQ2FiZSBjb21wbGV4aXR5IGNoZWNrZXInXG4gICAgICBvcmRlcjogMTJcbiAgICB1c2VSYWRvbjpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIHRpdGxlOiAnVXNlIFJhZG9uJ1xuICAgICAgZGVzY3JpcHRpb246ICdVc2UgUmFkb24gY29tcGxleGl0eSBhbmQgY29kZSBtZXRyaWNzIGNoZWNrZXInXG4gICAgICBvcmRlcjogMTNcbiAgICB1c2VJc29ydDpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIHRpdGxlOiAnVXNlIGlzb3J0J1xuICAgICAgZGVzY3JpcHRpb246ICdVc2UgaXNvcnQgaW1wb3J0cyBjaGVja2VyJ1xuICAgICAgb3JkZXI6IDE0XG4gICAgaXNvcnRPblNhdmU6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICB0aXRsZTogJ2lzb3J0IGltcG9ydHMgb24gc2F2ZSAoZXhwZXJpbWVudGFsKSdcbiAgICAgIG9yZGVyOiAxNVxuXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgcmVxdWlyZSgnYXRvbS1wYWNrYWdlLWRlcHMnKS5pbnN0YWxsICdsaW50ZXItcHlsYW1hJ1xuICAgIGNvbnNvbGUubG9nICdMaW50ZXItUHlsYW1hOiBwYWNrYWdlIGxvYWRlZCxcbiAgICAgICAgICAgICAgICAgcmVhZHkgdG8gZ2V0IGluaXRpYWxpemVkIGJ5IEF0b21MaW50ZXIuJ1xuXG5cbiAgcHJvdmlkZUxpbnRlcjogLT5cbiAgICBMaW50ZXJQeWxhbWEgPSByZXF1aXJlICcuL2xpbnRlci1weWxhbWEuY29mZmVlJ1xuICAgIEBwcm92aWRlciA9IG5ldyBMaW50ZXJQeWxhbWEoKVxuICAgIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcbiAgICAgICAgJ3NvdXJjZS5weXRob24nXG4gICAgICAgICdzb3VyY2UucHl0aG9uLmRqYW5nbydcbiAgICAgIF1cbiAgICAgIHNjb3BlOiAnZmlsZSdcbiAgICAgIGxpbnQ6IEBwcm92aWRlci5saW50XG4gICAgICBsaW50T25GbHk6IGRvIEBwcm92aWRlci5pc0xpbnRPbkZseVxuICAgIH1cbiJdfQ==
