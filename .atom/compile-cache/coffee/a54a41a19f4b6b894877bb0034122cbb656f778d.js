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
        "default": 'python, python.exe',
        description: 'Python interpreter for `internal` Pylama.\nComma-separated list of path to Python executables. The first path has a\nhigher priority over the last one. By default linter-pylama will\nautomatically try to find virtual environments or global Python executable.\nIf you use this config, automatic lookup will have lowest priority.\nYou can use `$PROJECT` or `$PROJECT_NAME` substitution for project-specific\npaths.\n\nFor example:\n`~/.venv/$PROJECT_NAME/bin/python, $PROJECT/venv/bin/python, /usr/bin/pytho3, python`',
        order: 1
      },
      executablePath: {
        type: 'string',
        "default": 'pylama, pylama.exe',
        description: "Excutable path for `external` Pylama.\nComma-separated list of path to Pylama executables. The first path has a\nhigher priority over the last one.\nYou can use `$PROJECT` or `$PROJECT_NAME` substitution for project-specific\npaths.\n\nFor example:\n`~/.venv/$PROJECT_NAME/bin/pylama, $PROJECT/venv/bin/pylama, /usr/local/bin/pylama, pylama`",
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
        description: "Comma-separated list of errors and warnings.\nFor example: `ED203,D212,D213,D404,E111,E114,D101,D102,DW0311`\nSee more: https://goo.gl/jeYN96, https://goo.gl/O8xhLM",
        order: 5
      },
      skipFiles: {
        type: 'string',
        "default": '',
        description: "Skip files by masks.\nComma-separated list of a file names.\nFor example: `*/messages.py,*/__init__.py`",
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
      return require('atom-package-deps').install('linter-pylama');
    },
    provideLinter: function() {
      var LinterPylama, provider;
      LinterPylama = require('./linter-pylama.coffee');
      provider = new LinterPylama();
      return {
        grammarScopes: ['source.python', 'source.python.django'],
        name: 'Pylama',
        scope: 'file',
        lint: provider.lint,
        lintsOnChange: provider.isLintOnFly()
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvaW5pdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLE1BQUEsRUFBUTtNQUNOLGFBQUEsRUFBZTtRQUNiLElBQUEsRUFBTSxRQURPO1FBRWIsQ0FBQSxPQUFBLENBQUEsRUFBUyxVQUZJO1FBR2IsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLFVBQUQsRUFBYSxVQUFiLENBSE87UUFJYixXQUFBLEVBQWEsdUpBSkE7UUFPYixLQUFBLEVBQU8sQ0FQTTtPQURUO01BVU4sV0FBQSxFQUFhO1FBQ1gsSUFBQSxFQUFNLFFBREs7UUFFWCxDQUFBLE9BQUEsQ0FBQSxFQUFTLG9CQUZFO1FBR1gsV0FBQSxFQUFhLHFnQkFIRjtRQWFYLEtBQUEsRUFBTyxDQWJJO09BVlA7TUF5Qk4sY0FBQSxFQUFnQjtRQUNkLElBQUEsRUFBTSxRQURRO1FBRWQsQ0FBQSxPQUFBLENBQUEsRUFBUyxvQkFGSztRQUdkLFdBQUEsRUFBYSx1VkFIQztRQVdkLEtBQUEsRUFBTyxDQVhPO09BekJWO01Bc0NOLGNBQUEsRUFBZ0I7UUFDZCxJQUFBLEVBQU0sUUFEUTtRQUVkLENBQUEsT0FBQSxDQUFBLEVBQVMsMEJBRks7UUFHZCxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQ0osMEJBREksRUFFSixtQkFGSSxDQUhRO1FBTWQsS0FBQSxFQUFPLCtCQU5PO1FBT2QsS0FBQSxFQUFPLENBUE87T0F0Q1Y7TUErQ04sY0FBQSxFQUFnQjtRQUNkLElBQUEsRUFBTSxRQURRO1FBRWQsQ0FBQSxPQUFBLENBQUEsRUFBUyxZQUZLO1FBR2QsS0FBQSxFQUFPLHlCQUhPO1FBSWQsS0FBQSxFQUFPLENBSk87T0EvQ1Y7TUFxRE4sdUJBQUEsRUFBeUI7UUFDdkIsSUFBQSxFQUFNLFFBRGlCO1FBRXZCLENBQUEsT0FBQSxDQUFBLEVBQVMscUJBRmM7UUFHdkIsV0FBQSxFQUFhLHNLQUhVO1FBT3ZCLEtBQUEsRUFBTyxDQVBnQjtPQXJEbkI7TUE4RE4sU0FBQSxFQUFXO1FBQ1QsSUFBQSxFQUFNLFFBREc7UUFFVCxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRkE7UUFHVCxXQUFBLEVBQWEseUdBSEo7UUFPVCxLQUFBLEVBQU8sQ0FQRTtPQTlETDtNQXVFTixTQUFBLEVBQVc7UUFDVCxJQUFBLEVBQU0sU0FERztRQUVULENBQUEsT0FBQSxDQUFBLEVBQVMsSUFGQTtRQUdULFdBQUEsRUFBYSxpREFISjtRQUlULEtBQUEsRUFBTyxDQUpFO09BdkVMO01BNkVOLE9BQUEsRUFBUztRQUNQLElBQUEsRUFBTSxTQURDO1FBRVAsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUZGO1FBR1AsS0FBQSxFQUFPLHNCQUhBO1FBSVAsV0FBQSxFQUFhLDBDQUpOO1FBS1AsS0FBQSxFQUFPLENBTEE7T0E3RUg7TUFvRk4sU0FBQSxFQUFXO1FBQ1QsSUFBQSxFQUFNLFNBREc7UUFFVCxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRkE7UUFHVCxLQUFBLEVBQU8sdUJBSEU7UUFJVCxXQUFBLEVBQWEscURBSko7UUFLVCxLQUFBLEVBQU8sQ0FMRTtPQXBGTDtNQTJGTixXQUFBLEVBQWE7UUFDWCxJQUFBLEVBQU0sU0FESztRQUVYLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFGRTtRQUdYLEtBQUEsRUFBTyxjQUhJO1FBSVgsV0FBQSxFQUFhLHNCQUpGO1FBS1gsS0FBQSxFQUFPLEVBTEk7T0EzRlA7TUFrR04sU0FBQSxFQUFXO1FBQ1QsSUFBQSxFQUFNLFNBREc7UUFFVCxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRkE7UUFHVCxLQUFBLEVBQU8sWUFIRTtRQUlULFdBQUEsRUFBYSw0SkFKSjtRQU9ULEtBQUEsRUFBTyxFQVBFO09BbEdMO01BMkdOLFNBQUEsRUFBVztRQUNULElBQUEsRUFBTSxTQURHO1FBRVQsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUZBO1FBR1QsS0FBQSxFQUFPLFlBSEU7UUFJVCxXQUFBLEVBQWEsK0JBSko7UUFLVCxLQUFBLEVBQU8sRUFMRTtPQTNHTDtNQWtITixRQUFBLEVBQVU7UUFDUixJQUFBLEVBQU0sU0FERTtRQUVSLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FGRDtRQUdSLEtBQUEsRUFBTyxXQUhDO1FBSVIsV0FBQSxFQUFhLCtDQUpMO1FBS1IsS0FBQSxFQUFPLEVBTEM7T0FsSEo7TUF5SE4sUUFBQSxFQUFVO1FBQ1IsSUFBQSxFQUFNLFNBREU7UUFFUixDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRkQ7UUFHUixLQUFBLEVBQU8sV0FIQztRQUlSLFdBQUEsRUFBYSwyQkFKTDtRQUtSLEtBQUEsRUFBTyxFQUxDO09BekhKO01BZ0lOLFdBQUEsRUFBYTtRQUNYLElBQUEsRUFBTSxTQURLO1FBRVgsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUZFO1FBR1gsS0FBQSxFQUFPLHNDQUhJO1FBSVgsS0FBQSxFQUFPLEVBSkk7T0FoSVA7S0FETztJQTBJZixRQUFBLEVBQVUsU0FBQTthQUNSLE9BQUEsQ0FBUSxtQkFBUixDQUE0QixDQUFDLE9BQTdCLENBQXFDLGVBQXJDO0lBRFEsQ0ExSUs7SUE4SWYsYUFBQSxFQUFlLFNBQUE7QUFDYixVQUFBO01BQUEsWUFBQSxHQUFlLE9BQUEsQ0FBUSx3QkFBUjtNQUNmLFFBQUEsR0FBZSxJQUFBLFlBQUEsQ0FBQTthQUNmO1FBQ0UsYUFBQSxFQUFlLENBQ2IsZUFEYSxFQUViLHNCQUZhLENBRGpCO1FBS0UsSUFBQSxFQUFNLFFBTFI7UUFNRSxLQUFBLEVBQU8sTUFOVDtRQU9FLElBQUEsRUFBTSxRQUFRLENBQUMsSUFQakI7UUFRRSxhQUFBLEVBQWtCLFFBQVEsQ0FBQyxXQUFaLENBQUEsQ0FSakI7O0lBSGEsQ0E5SUE7O0FBQWpCIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbmZpZzoge1xuICAgIHB5bGFtYVZlcnNpb246IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnaW50ZXJuYWwnXG4gICAgICBlbnVtOiBbJ2V4dGVybmFsJywgJ2ludGVybmFsJ11cbiAgICAgIGRlc2NyaXB0aW9uOiAnU3dpdGNoIGJldHdlZW4gaW50ZXJuYWwgUHlsYW1hICh3aXRoIFZpcnR1YWxlbnYgZGV0ZWN0aW9uXG4gICAgICBhbmQgb3RoZXIgY29vbCB0aGluZ3MpIG9yIGV4dGVybmFsIHN0YWJsZSBQeWxhbWEgKGRvIG5vdCBmb3JnZXQgdG9cbiAgICAgIHNwZWNpZnkgZXhlY3V0YWJsZSBwYXRoKSdcbiAgICAgIG9yZGVyOiAwXG4gICAgfVxuICAgIGludGVycHJldGVyOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ3B5dGhvbiwgcHl0aG9uLmV4ZSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydQeXRob24gaW50ZXJwcmV0ZXIgZm9yIGBpbnRlcm5hbGAgUHlsYW1hLlxuICAgICAgQ29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgcGF0aCB0byBQeXRob24gZXhlY3V0YWJsZXMuIFRoZSBmaXJzdCBwYXRoIGhhcyBhXG4gICAgICBoaWdoZXIgcHJpb3JpdHkgb3ZlciB0aGUgbGFzdCBvbmUuIEJ5IGRlZmF1bHQgbGludGVyLXB5bGFtYSB3aWxsXG4gICAgICBhdXRvbWF0aWNhbGx5IHRyeSB0byBmaW5kIHZpcnR1YWwgZW52aXJvbm1lbnRzIG9yIGdsb2JhbCBQeXRob24gZXhlY3V0YWJsZS5cbiAgICAgIElmIHlvdSB1c2UgdGhpcyBjb25maWcsIGF1dG9tYXRpYyBsb29rdXAgd2lsbCBoYXZlIGxvd2VzdCBwcmlvcml0eS5cbiAgICAgIFlvdSBjYW4gdXNlIGAkUFJPSkVDVGAgb3IgYCRQUk9KRUNUX05BTUVgIHN1YnN0aXR1dGlvbiBmb3IgcHJvamVjdC1zcGVjaWZpY1xuICAgICAgcGF0aHMuXFxuXG4gICAgICBGb3IgZXhhbXBsZTpcbiAgICAgIGB+Ly52ZW52LyRQUk9KRUNUX05BTUUvYmluL3B5dGhvbiwgJFBST0pFQ1QvdmVudi9iaW4vcHl0aG9uLCAvdXNyL2Jpbi9weXRobzMsIHB5dGhvbmBcbiAgICAgICcnJ1xuICAgICAgb3JkZXI6IDFcbiAgICB9XG4gICAgZXhlY3V0YWJsZVBhdGg6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAncHlsYW1hLCBweWxhbWEuZXhlJ1xuICAgICAgZGVzY3JpcHRpb246IFwiXCJcIkV4Y3V0YWJsZSBwYXRoIGZvciBgZXh0ZXJuYWxgIFB5bGFtYS5cbiAgICAgIENvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIHBhdGggdG8gUHlsYW1hIGV4ZWN1dGFibGVzLiBUaGUgZmlyc3QgcGF0aCBoYXMgYVxuICAgICAgaGlnaGVyIHByaW9yaXR5IG92ZXIgdGhlIGxhc3Qgb25lLlxuICAgICAgWW91IGNhbiB1c2UgYCRQUk9KRUNUYCBvciBgJFBST0pFQ1RfTkFNRWAgc3Vic3RpdHV0aW9uIGZvciBwcm9qZWN0LXNwZWNpZmljXG4gICAgICBwYXRocy5cXG5cbiAgICAgIEZvciBleGFtcGxlOlxuICAgICAgYH4vLnZlbnYvJFBST0pFQ1RfTkFNRS9iaW4vcHlsYW1hLCAkUFJPSkVDVC92ZW52L2Jpbi9weWxhbWEsIC91c3IvbG9jYWwvYmluL3B5bGFtYSwgcHlsYW1hYFxuICAgICAgXCJcIlwiXG4gICAgICBvcmRlcjogMlxuICAgIH1cbiAgICBjb25maWdGaWxlTG9hZDoge1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdEb25cXCd0IHVzZSBweWxhbWEgY29uZmlnJ1xuICAgICAgZW51bTogW1xuICAgICAgICAnRG9uXFwndCB1c2UgcHlsYW1hIGNvbmZpZycsXG4gICAgICAgICdVc2UgcHlsYW1hIGNvbmZpZyddXG4gICAgICB0aXRsZTogJ1VzZSBQeWxhbWEgY29uZmlndXJhdGlvbiBmaWxlJ1xuICAgICAgb3JkZXI6IDNcbiAgICB9XG4gICAgY29uZmlnRmlsZU5hbWU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAncHlsYW1hLmluaSdcbiAgICAgIHRpdGxlOiAnQ29uZmlndXJhdGlvbiBmaWxlIG5hbWUnXG4gICAgICBvcmRlcjogNFxuICAgIH1cbiAgICBpZ25vcmVFcnJvcnNBbmRXYXJuaW5nczoge1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdEMjAzLEQyMTIsRDIxMyxENDA0J1xuICAgICAgZGVzY3JpcHRpb246IFwiXCJcIkNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGVycm9ycyBhbmQgd2FybmluZ3MuXG4gICAgICBGb3IgZXhhbXBsZTogYEVEMjAzLEQyMTIsRDIxMyxENDA0LEUxMTEsRTExNCxEMTAxLEQxMDIsRFcwMzExYFxuICAgICAgU2VlIG1vcmU6IGh0dHBzOi8vZ29vLmdsL2plWU45NiwgaHR0cHM6Ly9nb28uZ2wvTzh4aExNXG4gICAgICBcIlwiXCJcbiAgICAgIG9yZGVyOiA1XG4gICAgfVxuICAgIHNraXBGaWxlczoge1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICBkZXNjcmlwdGlvbjogXCJcIlwiU2tpcCBmaWxlcyBieSBtYXNrcy5cbiAgICAgIENvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGEgZmlsZSBuYW1lcy5cbiAgICAgIEZvciBleGFtcGxlOiBgKi9tZXNzYWdlcy5weSwqL19faW5pdF9fLnB5YFxuICAgICAgXCJcIlwiXG4gICAgICBvcmRlcjogNlxuICAgIH1cbiAgICBsaW50T25GbHk6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246IFwiRW5hYmxlIGxpbnRpbmcgb24gdGhlIGZseS4gTmVlZCB0byByZXN0YXJ0IEF0b21cIlxuICAgICAgb3JkZXI6IDdcbiAgICB9XG4gICAgdXNlUGVwODoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICB0aXRsZTogJ1VzZSBweWNvZGVzdHlsZS9wZXA4J1xuICAgICAgZGVzY3JpcHRpb246ICdVc2UgcHljb2Rlc3R5bGUvcGVwOCBzdHlsZSBndWlkZSBjaGVja2VyJ1xuICAgICAgb3JkZXI6IDhcbiAgICB9XG4gICAgdXNlUGVwMjU3OiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIHRpdGxlOiAnVXNlIHB5ZG9jc3R5bGUvcGVwMjU3J1xuICAgICAgZGVzY3JpcHRpb246ICdVc2UgcHlkb2NzdHlsZS9wZXAyNTcgZG9jc3RyaW5nIGNvbnZlbnRpb25zIGNoZWNrZXInXG4gICAgICBvcmRlcjogOVxuICAgIH1cbiAgICB1c2VQeWZsYWtlczoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICB0aXRsZTogJ1VzZSBQeWZsYWtlcydcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIFB5Zmxha2VzIGNoZWNrZXInXG4gICAgICBvcmRlcjogMTBcbiAgICB9XG4gICAgdXNlUHlsaW50OiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICB0aXRsZTogJ1VzZSBQeUxpbnQnXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSBQeUxpbnQgbGludGVyLiBNYXkgYmUgdW5zdGFibGUgZm9yIGludGVybmFsIFB5bGFtYS5cbiAgICAgIEZvciB1c2Ugd2l0aCBleHRlcm5hbCBQeWxhbWEgeW91IHNob3VsZCBpbnN0YWxsIHB5bGFtYV9weWxpbnQgbW9kdWxlXG4gICAgICAoXCJwaXAgaW5zdGFsbCBweWxhbWEtcHlsaW50XCIpJ1xuICAgICAgb3JkZXI6IDExXG4gICAgfVxuICAgIHVzZU1jQ2FiZToge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICB0aXRsZTogJ1VzZSBNY0NhYmUnXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSBNY0NhYmUgY29tcGxleGl0eSBjaGVja2VyJ1xuICAgICAgb3JkZXI6IDEyXG4gICAgfVxuICAgIHVzZVJhZG9uOiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICB0aXRsZTogJ1VzZSBSYWRvbidcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIFJhZG9uIGNvbXBsZXhpdHkgYW5kIGNvZGUgbWV0cmljcyBjaGVja2VyJ1xuICAgICAgb3JkZXI6IDEzXG4gICAgfVxuICAgIHVzZUlzb3J0OiB7XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICB0aXRsZTogJ1VzZSBpc29ydCdcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIGlzb3J0IGltcG9ydHMgY2hlY2tlcidcbiAgICAgIG9yZGVyOiAxNFxuICAgIH1cbiAgICBpc29ydE9uU2F2ZToge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgdGl0bGU6ICdpc29ydCBpbXBvcnRzIG9uIHNhdmUgKGV4cGVyaW1lbnRhbCknXG4gICAgICBvcmRlcjogMTVcbiAgICB9XG4gIH1cblxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIHJlcXVpcmUoJ2F0b20tcGFja2FnZS1kZXBzJykuaW5zdGFsbCAnbGludGVyLXB5bGFtYSdcblxuXG4gIHByb3ZpZGVMaW50ZXI6IC0+XG4gICAgTGludGVyUHlsYW1hID0gcmVxdWlyZSAnLi9saW50ZXItcHlsYW1hLmNvZmZlZSdcbiAgICBwcm92aWRlciA9IG5ldyBMaW50ZXJQeWxhbWEoKVxuICAgIHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcbiAgICAgICAgJ3NvdXJjZS5weXRob24nXG4gICAgICAgICdzb3VyY2UucHl0aG9uLmRqYW5nbydcbiAgICAgIF1cbiAgICAgIG5hbWU6ICdQeWxhbWEnXG4gICAgICBzY29wZTogJ2ZpbGUnXG4gICAgICBsaW50OiBwcm92aWRlci5saW50XG4gICAgICBsaW50c09uQ2hhbmdlOiBkbyBwcm92aWRlci5pc0xpbnRPbkZseVxuICAgIH1cbn1cbiJdfQ==
