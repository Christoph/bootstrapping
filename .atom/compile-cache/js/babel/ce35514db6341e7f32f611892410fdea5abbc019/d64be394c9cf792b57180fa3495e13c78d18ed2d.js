Object.defineProperty(exports, '__esModule', {
  value: true
});

var stat = _asyncToGenerator(function* (pathname) {
  return new Promise(function (resolve, reject) {
    _fs2['default'].stat(pathname, function (err, stats) {
      if (err) {
        return reject(err);
      }
      return resolve(stats);
    });
  });
}

/**
 * Shim for TSLint v3 interoperability
 * @param {Function} Linter TSLint v3 linter
 * @return {Function} TSLint v4-compatible linter
 */
);

var getLocalLinter = _asyncToGenerator(function* (basedir) {
  return new Promise(function (resolve) {
    if (!requireResolve) {
      requireResolve = require('resolve');
    }
    requireResolve(tslintModuleName, { basedir: basedir }, function (err, linterPath, pkg) {
      var linter = undefined;
      if (!err && pkg && /^3|4|5\./.test(pkg.version)) {
        if (pkg.version.startsWith('3')) {
          // eslint-disable-next-line import/no-dynamic-require
          linter = shim(require('loophole').allowUnsafeNewFunction(function () {
            return require(linterPath);
          }));
        } else {
          // eslint-disable-next-line import/no-dynamic-require
          linter = require('loophole').allowUnsafeNewFunction(function () {
            return require(linterPath).Linter;
          });
        }
      } else {
        linter = tslintDef;
      }
      tslintCache.set(basedir, linter);
      return resolve(linter);
    });
  });
});

var getLinter = _asyncToGenerator(function* (filePath) {
  var basedir = _path2['default'].dirname(filePath);
  if (tslintCache.has(basedir)) {
    return tslintCache.get(basedir);
  }

  // Initialize the default instance if it hasn't already been initialized
  loadDefaultTSLint();

  if (config.useLocalTslint) {
    return getLocalLinter(basedir);
  }

  tslintCache.set(basedir, tslintDef);
  return tslintDef;
});

var getProgram = _asyncToGenerator(function* (Linter, configurationPath) {
  var program = undefined;
  var configurationDir = _path2['default'].dirname(configurationPath);
  var tsconfigPath = _path2['default'].resolve(configurationDir, 'tsconfig.json');
  try {
    var stats = yield stat(tsconfigPath);
    if (stats.isFile()) {
      program = Linter.createProgram('tsconfig.json', configurationDir);
    }
  } catch (err) {
    // no-op
  }
  return program;
}

/**
 * Lint the provided TypeScript content
 * @param content {string} The content of the TypeScript file
 * @param filePath {string} File path of the TypeScript filePath
 * @param options {Object} Linter options
 * @return Array of lint results
 */
);

var lint = _asyncToGenerator(function* (content, filePath, options) {
  if (filePath === null || filePath === undefined) {
    return null;
  }

  var lintResult = undefined;
  try {
    var Linter = yield getLinter(filePath);
    var configurationPath = Linter.findConfigurationPath(null, filePath);
    var configuration = Linter.loadConfigurationFromPath(configurationPath);

    var rulesDirectory = configuration.rulesDirectory;

    if (rulesDirectory && configurationPath) {
      (function () {
        var configurationDir = _path2['default'].dirname(configurationPath);
        if (!Array.isArray(rulesDirectory)) {
          rulesDirectory = [rulesDirectory];
        }
        rulesDirectory = rulesDirectory.map(function (dir) {
          if (_path2['default'].isAbsolute(dir)) {
            return dir;
          }
          return _path2['default'].join(configurationDir, dir);
        });

        if (config.rulesDirectory) {
          rulesDirectory.push(config.rulesDirectory);
        }
      })();
    }

    var program = undefined;
    if (config.enableSemanticRules && configurationPath) {
      program = yield getProgram(Linter, configurationPath);
    }

    var linter = new Linter(Object.assign({
      formatter: 'json',
      rulesDirectory: rulesDirectory
    }, options), program);

    linter.lint(filePath, content, configuration);
    lintResult = linter.getResult();
  } catch (err) {
    console.error(err.message, err.stack); // eslint-disable-line no-console
    lintResult = {};
  }

  if (
  // tslint@<5
  !lintResult.failureCount &&
  // tslint@>=5
  !lintResult.errorCount && !lintResult.warningCount && !lintResult.infoCount) {
    return [];
  }

  return lintResult.failures.map(function (failure) {
    var ruleUri = (0, _tslintRuleDocumentation.getRuleUri)(failure.getRuleName());
    var startPosition = failure.getStartPosition().getLineAndCharacter();
    var endPosition = failure.getEndPosition().getLineAndCharacter();
    return {
      type: failure.ruleSeverity || 'warning',
      html: (0, _escapeHtml2['default'])(failure.getFailure()) + ' (<a href="' + ruleUri.uri + '">' + failure.getRuleName() + '</a>)',
      filePath: _path2['default'].normalize(failure.getFileName()),
      range: [[startPosition.line, startPosition.character], [endPosition.line, endPosition.character]]
    };
  });
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* global emit */

var _escapeHtml = require('escape-html');

var _escapeHtml2 = _interopRequireDefault(_escapeHtml);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _tslintRuleDocumentation = require('tslint-rule-documentation');

'use babel';

process.title = 'linter-tslint worker';

var tslintModuleName = 'tslint';
var tslintCache = new Map();
var config = {
  useLocalTslint: false
};

var tslintDef = undefined;
var requireResolve = undefined;

function shim(Linter) {
  function LinterShim(options) {
    this.options = options;
    this.results = {};
  }

  // Assign class properties
  Object.assign(LinterShim, Linter);

  // Assign instance methods
  LinterShim.prototype = Object.assign({}, Linter.prototype, {
    lint: function lint(filePath, text, configuration) {
      var options = Object.assign({}, this.options, { configuration: configuration });
      var linter = new Linter(filePath, text, options);
      this.results = linter.lint();
    },
    getResult: function getResult() {
      return this.results;
    }
  });

  return LinterShim;
}

function loadDefaultTSLint() {
  if (!tslintDef) {
    // eslint-disable-next-line import/no-dynamic-require
    tslintDef = require(tslintModuleName).Linter;
  }
}

exports['default'] = _asyncToGenerator(function* (initialConfig) {
  config.useLocalTslint = initialConfig.useLocalTslint;
  config.enableSemanticRules = initialConfig.enableSemanticRules;

  process.on('message', _asyncToGenerator(function* (message) {
    if (message.messageType === 'config') {
      config[message.message.key] = message.message.value;

      if (message.message.key === 'useLocalTslint') {
        tslintCache.clear();
      }
    } else {
      var _message$message = message.message;
      var emitKey = _message$message.emitKey;
      var jobType = _message$message.jobType;
      var content = _message$message.content;
      var filePath = _message$message.filePath;

      var options = jobType === 'fix' ? { fix: true } : {};

      var results = yield lint(content, filePath, options);
      emit(emitKey, results);
    }
  }));
});
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10c2xpbnQvbGliL3dvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBb0JlLElBQUkscUJBQW5CLFdBQW9CLFFBQVEsRUFBRTtBQUM1QixTQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN0QyxvQkFBRyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQUMsR0FBRyxFQUFFLEtBQUssRUFBSztBQUNoQyxVQUFJLEdBQUcsRUFBRTtBQUNQLGVBQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ3BCO0FBQ0QsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdkIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0o7Ozs7Ozs7OztJQXNDYyxjQUFjLHFCQUE3QixXQUE4QixPQUFPLEVBQUU7QUFDckMsU0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBSztBQUM5QixRQUFJLENBQUMsY0FBYyxFQUFFO0FBQ25CLG9CQUFjLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ3JDO0FBQ0Qsa0JBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsRUFDMUMsVUFBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBSztBQUN4QixVQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsVUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDL0MsWUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTs7QUFFL0IsZ0JBQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDO21CQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUM7V0FBQSxDQUFDLENBQUMsQ0FBQztTQUN0RixNQUFNOztBQUVMLGdCQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDO21CQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNO1dBQUEsQ0FBQyxDQUFDO1NBQ3ZGO09BQ0YsTUFBTTtBQUNMLGNBQU0sR0FBRyxTQUFTLENBQUM7T0FDcEI7QUFDRCxpQkFBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDakMsYUFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDeEIsQ0FDRixDQUFDO0dBQ0gsQ0FBQyxDQUFDO0NBQ0o7O0lBRWMsU0FBUyxxQkFBeEIsV0FBeUIsUUFBUSxFQUFFO0FBQ2pDLE1BQU0sT0FBTyxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QyxNQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDNUIsV0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0dBQ2pDOzs7QUFHRCxtQkFBaUIsRUFBRSxDQUFDOztBQUVwQixNQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUU7QUFDekIsV0FBTyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7R0FDaEM7O0FBRUQsYUFBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDcEMsU0FBTyxTQUFTLENBQUM7Q0FDbEI7O0lBRWMsVUFBVSxxQkFBekIsV0FBMEIsTUFBTSxFQUFFLGlCQUFpQixFQUFFO0FBQ25ELE1BQUksT0FBTyxZQUFBLENBQUM7QUFDWixNQUFNLGdCQUFnQixHQUFHLGtCQUFLLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUNyRSxNQUFJO0FBQ0YsUUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdkMsUUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUU7QUFDbEIsYUFBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7S0FDbkU7R0FDRixDQUFDLE9BQU8sR0FBRyxFQUFFOztHQUViO0FBQ0QsU0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7Ozs7O0lBU2MsSUFBSSxxQkFBbkIsV0FBb0IsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUU7QUFDOUMsTUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7QUFDL0MsV0FBTyxJQUFJLENBQUM7R0FDYjs7QUFFRCxNQUFJLFVBQVUsWUFBQSxDQUFDO0FBQ2YsTUFBSTtBQUNGLFFBQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLFFBQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN2RSxRQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7UUFFcEUsY0FBYyxHQUFLLGFBQWEsQ0FBaEMsY0FBYzs7QUFDcEIsUUFBSSxjQUFjLElBQUksaUJBQWlCLEVBQUU7O0FBQ3ZDLFlBQU0sZ0JBQWdCLEdBQUcsa0JBQUssT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekQsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUU7QUFDbEMsd0JBQWMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ25DO0FBQ0Qsc0JBQWMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLFVBQUMsR0FBRyxFQUFLO0FBQzNDLGNBQUksa0JBQUssVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3hCLG1CQUFPLEdBQUcsQ0FBQztXQUNaO0FBQ0QsaUJBQU8sa0JBQUssSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3pDLENBQUMsQ0FBQzs7QUFFSCxZQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUU7QUFDekIsd0JBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQzVDOztLQUNGOztBQUVELFFBQUksT0FBTyxZQUFBLENBQUM7QUFDWixRQUFJLE1BQU0sQ0FBQyxtQkFBbUIsSUFBSSxpQkFBaUIsRUFBRTtBQUNuRCxhQUFPLEdBQUcsTUFBTSxVQUFVLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7S0FDdkQ7O0FBRUQsUUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUN0QyxlQUFTLEVBQUUsTUFBTTtBQUNqQixvQkFBYyxFQUFkLGNBQWM7S0FDZixFQUFFLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDOztBQUV0QixVQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDOUMsY0FBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztHQUNqQyxDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQ1osV0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0QyxjQUFVLEdBQUcsRUFBRSxDQUFDO0dBQ2pCOztBQUVEOztBQUVFLEdBQUMsVUFBVSxDQUFDLFlBQVk7O0FBRXhCLEdBQUMsVUFBVSxDQUFDLFVBQVUsSUFDdEIsQ0FBQyxVQUFVLENBQUMsWUFBWSxJQUN4QixDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQ3JCO0FBQ0EsV0FBTyxFQUFFLENBQUM7R0FDWDs7QUFFRCxTQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUMsT0FBTyxFQUFLO0FBQzFDLFFBQU0sT0FBTyxHQUFHLHlDQUFXLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ2xELFFBQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDdkUsUUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDbkUsV0FBTztBQUNMLFVBQUksRUFBRSxPQUFPLENBQUMsWUFBWSxJQUFJLFNBQVM7QUFDdkMsVUFBSSxFQUFLLDZCQUFXLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxtQkFBYyxPQUFPLENBQUMsR0FBRyxVQUFLLE9BQU8sQ0FBQyxXQUFXLEVBQUUsVUFBTztBQUNuRyxjQUFRLEVBQUUsa0JBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMvQyxXQUFLLEVBQUUsQ0FDTCxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUM3QyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUMxQztLQUNGLENBQUM7R0FDSCxDQUFDLENBQUM7Q0FDSjs7Ozs7Ozs7MEJBdk1zQixhQUFhOzs7O2tCQUNyQixJQUFJOzs7O29CQUNGLE1BQU07Ozs7dUNBQ0ksMkJBQTJCOztBQVB0RCxXQUFXLENBQUM7O0FBU1osT0FBTyxDQUFDLEtBQUssR0FBRyxzQkFBc0IsQ0FBQzs7QUFFdkMsSUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7QUFDbEMsSUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUM5QixJQUFNLE1BQU0sR0FBRztBQUNiLGdCQUFjLEVBQUUsS0FBSztDQUN0QixDQUFDOztBQUVGLElBQUksU0FBUyxZQUFBLENBQUM7QUFDZCxJQUFJLGNBQWMsWUFBQSxDQUFDOztBQWtCbkIsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3BCLFdBQVMsVUFBVSxDQUFDLE9BQU8sRUFBRTtBQUMzQixRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN2QixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztHQUNuQjs7O0FBR0QsUUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7OztBQUdsQyxZQUFVLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUU7QUFDekQsUUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUU7QUFDbEMsVUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBYixhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQ25FLFVBQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbkQsVUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDOUI7QUFDRCxhQUFTLEVBQUEscUJBQUc7QUFDVixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7S0FDckI7R0FDRixDQUFDLENBQUM7O0FBRUgsU0FBTyxVQUFVLENBQUM7Q0FDbkI7O0FBRUQsU0FBUyxpQkFBaUIsR0FBRztBQUMzQixNQUFJLENBQUMsU0FBUyxFQUFFOztBQUVkLGFBQVMsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLENBQUM7R0FDOUM7Q0FDRjs7dUNBNEljLFdBQWdCLGFBQWEsRUFBRTtBQUM1QyxRQUFNLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQyxjQUFjLENBQUM7QUFDckQsUUFBTSxDQUFDLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQzs7QUFFL0QsU0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLG9CQUFFLFdBQU8sT0FBTyxFQUFLO0FBQ3ZDLFFBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQUU7QUFDcEMsWUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7O0FBRXBELFVBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEtBQUssZ0JBQWdCLEVBQUU7QUFDNUMsbUJBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztPQUNyQjtLQUNGLE1BQU07NkJBQzJDLE9BQU8sQ0FBQyxPQUFPO1VBQXZELE9BQU8sb0JBQVAsT0FBTztVQUFFLE9BQU8sb0JBQVAsT0FBTztVQUFFLE9BQU8sb0JBQVAsT0FBTztVQUFFLFFBQVEsb0JBQVIsUUFBUTs7QUFDM0MsVUFBTSxPQUFPLEdBQUcsT0FBTyxLQUFLLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7O0FBRXZELFVBQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDdkQsVUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN4QjtHQUNGLEVBQUMsQ0FBQztDQUNKIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10c2xpbnQvbGliL3dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG4vKiBnbG9iYWwgZW1pdCAqL1xuXG5pbXBvcnQgZXNjYXBlSFRNTCBmcm9tICdlc2NhcGUtaHRtbCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBnZXRSdWxlVXJpIH0gZnJvbSAndHNsaW50LXJ1bGUtZG9jdW1lbnRhdGlvbic7XG5cbnByb2Nlc3MudGl0bGUgPSAnbGludGVyLXRzbGludCB3b3JrZXInO1xuXG5jb25zdCB0c2xpbnRNb2R1bGVOYW1lID0gJ3RzbGludCc7XG5jb25zdCB0c2xpbnRDYWNoZSA9IG5ldyBNYXAoKTtcbmNvbnN0IGNvbmZpZyA9IHtcbiAgdXNlTG9jYWxUc2xpbnQ6IGZhbHNlLFxufTtcblxubGV0IHRzbGludERlZjtcbmxldCByZXF1aXJlUmVzb2x2ZTtcblxuYXN5bmMgZnVuY3Rpb24gc3RhdChwYXRobmFtZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGZzLnN0YXQocGF0aG5hbWUsIChlcnIsIHN0YXRzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNvbHZlKHN0YXRzKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogU2hpbSBmb3IgVFNMaW50IHYzIGludGVyb3BlcmFiaWxpdHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IExpbnRlciBUU0xpbnQgdjMgbGludGVyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVFNMaW50IHY0LWNvbXBhdGlibGUgbGludGVyXG4gKi9cbmZ1bmN0aW9uIHNoaW0oTGludGVyKSB7XG4gIGZ1bmN0aW9uIExpbnRlclNoaW0ob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5yZXN1bHRzID0ge307XG4gIH1cblxuICAvLyBBc3NpZ24gY2xhc3MgcHJvcGVydGllc1xuICBPYmplY3QuYXNzaWduKExpbnRlclNoaW0sIExpbnRlcik7XG5cbiAgLy8gQXNzaWduIGluc3RhbmNlIG1ldGhvZHNcbiAgTGludGVyU2hpbS5wcm90b3R5cGUgPSBPYmplY3QuYXNzaWduKHt9LCBMaW50ZXIucHJvdG90eXBlLCB7XG4gICAgbGludChmaWxlUGF0aCwgdGV4dCwgY29uZmlndXJhdGlvbikge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0aW9ucywgeyBjb25maWd1cmF0aW9uIH0pO1xuICAgICAgY29uc3QgbGludGVyID0gbmV3IExpbnRlcihmaWxlUGF0aCwgdGV4dCwgb3B0aW9ucyk7XG4gICAgICB0aGlzLnJlc3VsdHMgPSBsaW50ZXIubGludCgpO1xuICAgIH0sXG4gICAgZ2V0UmVzdWx0KCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVzdWx0cztcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gTGludGVyU2hpbTtcbn1cblxuZnVuY3Rpb24gbG9hZERlZmF1bHRUU0xpbnQoKSB7XG4gIGlmICghdHNsaW50RGVmKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1keW5hbWljLXJlcXVpcmVcbiAgICB0c2xpbnREZWYgPSByZXF1aXJlKHRzbGludE1vZHVsZU5hbWUpLkxpbnRlcjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRMb2NhbExpbnRlcihiYXNlZGlyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGlmICghcmVxdWlyZVJlc29sdmUpIHtcbiAgICAgIHJlcXVpcmVSZXNvbHZlID0gcmVxdWlyZSgncmVzb2x2ZScpO1xuICAgIH1cbiAgICByZXF1aXJlUmVzb2x2ZSh0c2xpbnRNb2R1bGVOYW1lLCB7IGJhc2VkaXIgfSxcbiAgICAgIChlcnIsIGxpbnRlclBhdGgsIHBrZykgPT4ge1xuICAgICAgICBsZXQgbGludGVyO1xuICAgICAgICBpZiAoIWVyciAmJiBwa2cgJiYgL14zfDR8NVxcLi8udGVzdChwa2cudmVyc2lvbikpIHtcbiAgICAgICAgICBpZiAocGtnLnZlcnNpb24uc3RhcnRzV2l0aCgnMycpKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWR5bmFtaWMtcmVxdWlyZVxuICAgICAgICAgICAgbGludGVyID0gc2hpbShyZXF1aXJlKCdsb29waG9sZScpLmFsbG93VW5zYWZlTmV3RnVuY3Rpb24oKCkgPT4gcmVxdWlyZShsaW50ZXJQYXRoKSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWR5bmFtaWMtcmVxdWlyZVxuICAgICAgICAgICAgbGludGVyID0gcmVxdWlyZSgnbG9vcGhvbGUnKS5hbGxvd1Vuc2FmZU5ld0Z1bmN0aW9uKCgpID0+IHJlcXVpcmUobGludGVyUGF0aCkuTGludGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGludGVyID0gdHNsaW50RGVmO1xuICAgICAgICB9XG4gICAgICAgIHRzbGludENhY2hlLnNldChiYXNlZGlyLCBsaW50ZXIpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZShsaW50ZXIpO1xuICAgICAgfSxcbiAgICApO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TGludGVyKGZpbGVQYXRoKSB7XG4gIGNvbnN0IGJhc2VkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICBpZiAodHNsaW50Q2FjaGUuaGFzKGJhc2VkaXIpKSB7XG4gICAgcmV0dXJuIHRzbGludENhY2hlLmdldChiYXNlZGlyKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIGRlZmF1bHQgaW5zdGFuY2UgaWYgaXQgaGFzbid0IGFscmVhZHkgYmVlbiBpbml0aWFsaXplZFxuICBsb2FkRGVmYXVsdFRTTGludCgpO1xuXG4gIGlmIChjb25maWcudXNlTG9jYWxUc2xpbnQpIHtcbiAgICByZXR1cm4gZ2V0TG9jYWxMaW50ZXIoYmFzZWRpcik7XG4gIH1cblxuICB0c2xpbnRDYWNoZS5zZXQoYmFzZWRpciwgdHNsaW50RGVmKTtcbiAgcmV0dXJuIHRzbGludERlZjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0UHJvZ3JhbShMaW50ZXIsIGNvbmZpZ3VyYXRpb25QYXRoKSB7XG4gIGxldCBwcm9ncmFtO1xuICBjb25zdCBjb25maWd1cmF0aW9uRGlyID0gcGF0aC5kaXJuYW1lKGNvbmZpZ3VyYXRpb25QYXRoKTtcbiAgY29uc3QgdHNjb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKGNvbmZpZ3VyYXRpb25EaXIsICd0c2NvbmZpZy5qc29uJyk7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBzdGF0KHRzY29uZmlnUGF0aCk7XG4gICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICBwcm9ncmFtID0gTGludGVyLmNyZWF0ZVByb2dyYW0oJ3RzY29uZmlnLmpzb24nLCBjb25maWd1cmF0aW9uRGlyKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIG5vLW9wXG4gIH1cbiAgcmV0dXJuIHByb2dyYW07XG59XG5cbi8qKlxuICogTGludCB0aGUgcHJvdmlkZWQgVHlwZVNjcmlwdCBjb250ZW50XG4gKiBAcGFyYW0gY29udGVudCB7c3RyaW5nfSBUaGUgY29udGVudCBvZiB0aGUgVHlwZVNjcmlwdCBmaWxlXG4gKiBAcGFyYW0gZmlsZVBhdGgge3N0cmluZ30gRmlsZSBwYXRoIG9mIHRoZSBUeXBlU2NyaXB0IGZpbGVQYXRoXG4gKiBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fSBMaW50ZXIgb3B0aW9uc1xuICogQHJldHVybiBBcnJheSBvZiBsaW50IHJlc3VsdHNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbGludChjb250ZW50LCBmaWxlUGF0aCwgb3B0aW9ucykge1xuICBpZiAoZmlsZVBhdGggPT09IG51bGwgfHwgZmlsZVBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbGV0IGxpbnRSZXN1bHQ7XG4gIHRyeSB7XG4gICAgY29uc3QgTGludGVyID0gYXdhaXQgZ2V0TGludGVyKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjb25maWd1cmF0aW9uUGF0aCA9IExpbnRlci5maW5kQ29uZmlndXJhdGlvblBhdGgobnVsbCwgZmlsZVBhdGgpO1xuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb24gPSBMaW50ZXIubG9hZENvbmZpZ3VyYXRpb25Gcm9tUGF0aChjb25maWd1cmF0aW9uUGF0aCk7XG5cbiAgICBsZXQgeyBydWxlc0RpcmVjdG9yeSB9ID0gY29uZmlndXJhdGlvbjtcbiAgICBpZiAocnVsZXNEaXJlY3RvcnkgJiYgY29uZmlndXJhdGlvblBhdGgpIHtcbiAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25EaXIgPSBwYXRoLmRpcm5hbWUoY29uZmlndXJhdGlvblBhdGgpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJ1bGVzRGlyZWN0b3J5KSkge1xuICAgICAgICBydWxlc0RpcmVjdG9yeSA9IFtydWxlc0RpcmVjdG9yeV07XG4gICAgICB9XG4gICAgICBydWxlc0RpcmVjdG9yeSA9IHJ1bGVzRGlyZWN0b3J5Lm1hcCgoZGlyKSA9PiB7XG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGguam9pbihjb25maWd1cmF0aW9uRGlyLCBkaXIpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChjb25maWcucnVsZXNEaXJlY3RvcnkpIHtcbiAgICAgICAgcnVsZXNEaXJlY3RvcnkucHVzaChjb25maWcucnVsZXNEaXJlY3RvcnkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwcm9ncmFtO1xuICAgIGlmIChjb25maWcuZW5hYmxlU2VtYW50aWNSdWxlcyAmJiBjb25maWd1cmF0aW9uUGF0aCkge1xuICAgICAgcHJvZ3JhbSA9IGF3YWl0IGdldFByb2dyYW0oTGludGVyLCBjb25maWd1cmF0aW9uUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgbGludGVyID0gbmV3IExpbnRlcihPYmplY3QuYXNzaWduKHtcbiAgICAgIGZvcm1hdHRlcjogJ2pzb24nLFxuICAgICAgcnVsZXNEaXJlY3RvcnksXG4gICAgfSwgb3B0aW9ucyksIHByb2dyYW0pO1xuXG4gICAgbGludGVyLmxpbnQoZmlsZVBhdGgsIGNvbnRlbnQsIGNvbmZpZ3VyYXRpb24pO1xuICAgIGxpbnRSZXN1bHQgPSBsaW50ZXIuZ2V0UmVzdWx0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyLm1lc3NhZ2UsIGVyci5zdGFjayk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIGxpbnRSZXN1bHQgPSB7fTtcbiAgfVxuXG4gIGlmIChcbiAgICAvLyB0c2xpbnRAPDVcbiAgICAhbGludFJlc3VsdC5mYWlsdXJlQ291bnQgJiZcbiAgICAvLyB0c2xpbnRAPj01XG4gICAgIWxpbnRSZXN1bHQuZXJyb3JDb3VudCAmJlxuICAgICFsaW50UmVzdWx0Lndhcm5pbmdDb3VudCAmJlxuICAgICFsaW50UmVzdWx0LmluZm9Db3VudFxuICApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gbGludFJlc3VsdC5mYWlsdXJlcy5tYXAoKGZhaWx1cmUpID0+IHtcbiAgICBjb25zdCBydWxlVXJpID0gZ2V0UnVsZVVyaShmYWlsdXJlLmdldFJ1bGVOYW1lKCkpO1xuICAgIGNvbnN0IHN0YXJ0UG9zaXRpb24gPSBmYWlsdXJlLmdldFN0YXJ0UG9zaXRpb24oKS5nZXRMaW5lQW5kQ2hhcmFjdGVyKCk7XG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSBmYWlsdXJlLmdldEVuZFBvc2l0aW9uKCkuZ2V0TGluZUFuZENoYXJhY3RlcigpO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBmYWlsdXJlLnJ1bGVTZXZlcml0eSB8fCAnd2FybmluZycsXG4gICAgICBodG1sOiBgJHtlc2NhcGVIVE1MKGZhaWx1cmUuZ2V0RmFpbHVyZSgpKX0gKDxhIGhyZWY9XCIke3J1bGVVcmkudXJpfVwiPiR7ZmFpbHVyZS5nZXRSdWxlTmFtZSgpfTwvYT4pYCxcbiAgICAgIGZpbGVQYXRoOiBwYXRoLm5vcm1hbGl6ZShmYWlsdXJlLmdldEZpbGVOYW1lKCkpLFxuICAgICAgcmFuZ2U6IFtcbiAgICAgICAgW3N0YXJ0UG9zaXRpb24ubGluZSwgc3RhcnRQb3NpdGlvbi5jaGFyYWN0ZXJdLFxuICAgICAgICBbZW5kUG9zaXRpb24ubGluZSwgZW5kUG9zaXRpb24uY2hhcmFjdGVyXSxcbiAgICAgIF0sXG4gICAgfTtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIChpbml0aWFsQ29uZmlnKSB7XG4gIGNvbmZpZy51c2VMb2NhbFRzbGludCA9IGluaXRpYWxDb25maWcudXNlTG9jYWxUc2xpbnQ7XG4gIGNvbmZpZy5lbmFibGVTZW1hbnRpY1J1bGVzID0gaW5pdGlhbENvbmZpZy5lbmFibGVTZW1hbnRpY1J1bGVzO1xuXG4gIHByb2Nlc3Mub24oJ21lc3NhZ2UnLCBhc3luYyAobWVzc2FnZSkgPT4ge1xuICAgIGlmIChtZXNzYWdlLm1lc3NhZ2VUeXBlID09PSAnY29uZmlnJykge1xuICAgICAgY29uZmlnW21lc3NhZ2UubWVzc2FnZS5rZXldID0gbWVzc2FnZS5tZXNzYWdlLnZhbHVlO1xuXG4gICAgICBpZiAobWVzc2FnZS5tZXNzYWdlLmtleSA9PT0gJ3VzZUxvY2FsVHNsaW50Jykge1xuICAgICAgICB0c2xpbnRDYWNoZS5jbGVhcigpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB7IGVtaXRLZXksIGpvYlR5cGUsIGNvbnRlbnQsIGZpbGVQYXRoIH0gPSBtZXNzYWdlLm1lc3NhZ2U7XG4gICAgICBjb25zdCBvcHRpb25zID0gam9iVHlwZSA9PT0gJ2ZpeCcgPyB7IGZpeDogdHJ1ZSB9IDoge307XG5cbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBsaW50KGNvbnRlbnQsIGZpbGVQYXRoLCBvcHRpb25zKTtcbiAgICAgIGVtaXQoZW1pdEtleSwgcmVzdWx0cyk7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==