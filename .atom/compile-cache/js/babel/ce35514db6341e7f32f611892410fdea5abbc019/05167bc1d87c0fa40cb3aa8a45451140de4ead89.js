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

  var lintResult = undefined;
  try {
    linter.lint(filePath, content, configuration);
    lintResult = linter.getResult();
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10c2xpbnQvbGliL3dvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBb0JlLElBQUkscUJBQW5CLFdBQW9CLFFBQVEsRUFBRTtBQUM1QixTQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN0QyxvQkFBRyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQUMsR0FBRyxFQUFFLEtBQUssRUFBSztBQUNoQyxVQUFJLEdBQUcsRUFBRTtBQUNQLGVBQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ3BCO0FBQ0QsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdkIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0o7Ozs7Ozs7OztJQXNDYyxjQUFjLHFCQUE3QixXQUE4QixPQUFPLEVBQUU7QUFDckMsU0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBSztBQUM5QixRQUFJLENBQUMsY0FBYyxFQUFFO0FBQ25CLG9CQUFjLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ3JDO0FBQ0Qsa0JBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsRUFDMUMsVUFBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBSztBQUN4QixVQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsVUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDL0MsWUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTs7QUFFL0IsZ0JBQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDO21CQUFNLE9BQU8sQ0FBQyxV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Q0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDOztBQUVwRCxVQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxLQUFLLGdCQUFnQixFQUFFO0FBQzVDLG1CQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7T0FDckI7S0FDRixNQUFNOzZCQUMyQyxPQUFPLENBQUMsT0FBTztVQUF2RCxPQUFPLG9CQUFQLE9BQU87VUFBRSxPQUFPLG9CQUFQLE9BQU87VUFBRSxPQUFPLG9CQUFQLE9BQU87VUFBRSxRQUFRLG9CQUFSLFFBQVE7O0FBQzNDLFVBQU0sT0FBTyxHQUFHLE9BQU8sS0FBSyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDOztBQUV2RCxVQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELFVBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDeEI7R0FDRixFQUFDLENBQUM7Q0FDSiIsImZpbGUiOiIvaG9tZS9jaHJpcy9zb3VyY2UvYm9vdHN0cmFwcGluZy8uYXRvbS9wYWNrYWdlcy9saW50ZXItdHNsaW50L2xpYi93b3JrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuLyogZ2xvYmFsIGVtaXQgKi9cblxuaW1wb3J0IGVzY2FwZUhUTUwgZnJvbSAnZXNjYXBlLWh0bWwnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZ2V0UnVsZVVyaSB9IGZyb20gJ3RzbGludC1ydWxlLWRvY3VtZW50YXRpb24nO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2xpbnRlci10c2xpbnQgd29ya2VyJztcblxuY29uc3QgdHNsaW50TW9kdWxlTmFtZSA9ICd0c2xpbnQnO1xuY29uc3QgdHNsaW50Q2FjaGUgPSBuZXcgTWFwKCk7XG5jb25zdCBjb25maWcgPSB7XG4gIHVzZUxvY2FsVHNsaW50OiBmYWxzZSxcbn07XG5cbmxldCB0c2xpbnREZWY7XG5sZXQgcmVxdWlyZVJlc29sdmU7XG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXQocGF0aG5hbWUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBmcy5zdGF0KHBhdGhuYW1lLCAoZXJyLCBzdGF0cykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZShzdGF0cyk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFNoaW0gZm9yIFRTTGludCB2MyBpbnRlcm9wZXJhYmlsaXR5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBMaW50ZXIgVFNMaW50IHYzIGxpbnRlclxuICogQHJldHVybiB7RnVuY3Rpb259IFRTTGludCB2NC1jb21wYXRpYmxlIGxpbnRlclxuICovXG5mdW5jdGlvbiBzaGltKExpbnRlcikge1xuICBmdW5jdGlvbiBMaW50ZXJTaGltKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMucmVzdWx0cyA9IHt9O1xuICB9XG5cbiAgLy8gQXNzaWduIGNsYXNzIHByb3BlcnRpZXNcbiAgT2JqZWN0LmFzc2lnbihMaW50ZXJTaGltLCBMaW50ZXIpO1xuXG4gIC8vIEFzc2lnbiBpbnN0YW5jZSBtZXRob2RzXG4gIExpbnRlclNoaW0ucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbih7fSwgTGludGVyLnByb3RvdHlwZSwge1xuICAgIGxpbnQoZmlsZVBhdGgsIHRleHQsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMsIHsgY29uZmlndXJhdGlvbiB9KTtcbiAgICAgIGNvbnN0IGxpbnRlciA9IG5ldyBMaW50ZXIoZmlsZVBhdGgsIHRleHQsIG9wdGlvbnMpO1xuICAgICAgdGhpcy5yZXN1bHRzID0gbGludGVyLmxpbnQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIExpbnRlclNoaW07XG59XG5cbmZ1bmN0aW9uIGxvYWREZWZhdWx0VFNMaW50KCkge1xuICBpZiAoIXRzbGludERlZikge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZHluYW1pYy1yZXF1aXJlXG4gICAgdHNsaW50RGVmID0gcmVxdWlyZSh0c2xpbnRNb2R1bGVOYW1lKS5MaW50ZXI7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TG9jYWxMaW50ZXIoYmFzZWRpcikge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBpZiAoIXJlcXVpcmVSZXNvbHZlKSB7XG4gICAgICByZXF1aXJlUmVzb2x2ZSA9IHJlcXVpcmUoJ3Jlc29sdmUnKTtcbiAgICB9XG4gICAgcmVxdWlyZVJlc29sdmUodHNsaW50TW9kdWxlTmFtZSwgeyBiYXNlZGlyIH0sXG4gICAgICAoZXJyLCBsaW50ZXJQYXRoLCBwa2cpID0+IHtcbiAgICAgICAgbGV0IGxpbnRlcjtcbiAgICAgICAgaWYgKCFlcnIgJiYgcGtnICYmIC9eM3w0fDVcXC4vLnRlc3QocGtnLnZlcnNpb24pKSB7XG4gICAgICAgICAgaWYgKHBrZy52ZXJzaW9uLnN0YXJ0c1dpdGgoJzMnKSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1keW5hbWljLXJlcXVpcmVcbiAgICAgICAgICAgIGxpbnRlciA9IHNoaW0ocmVxdWlyZSgnbG9vcGhvbGUnKS5hbGxvd1Vuc2FmZU5ld0Z1bmN0aW9uKCgpID0+IHJlcXVpcmUobGludGVyUGF0aCkpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1keW5hbWljLXJlcXVpcmVcbiAgICAgICAgICAgIGxpbnRlciA9IHJlcXVpcmUoJ2xvb3Bob2xlJykuYWxsb3dVbnNhZmVOZXdGdW5jdGlvbigoKSA9PiByZXF1aXJlKGxpbnRlclBhdGgpLkxpbnRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbnRlciA9IHRzbGludERlZjtcbiAgICAgICAgfVxuICAgICAgICB0c2xpbnRDYWNoZS5zZXQoYmFzZWRpciwgbGludGVyKTtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUobGludGVyKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldExpbnRlcihmaWxlUGF0aCkge1xuICBjb25zdCBiYXNlZGlyID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgaWYgKHRzbGludENhY2hlLmhhcyhiYXNlZGlyKSkge1xuICAgIHJldHVybiB0c2xpbnRDYWNoZS5nZXQoYmFzZWRpcik7XG4gIH1cblxuICAvLyBJbml0aWFsaXplIHRoZSBkZWZhdWx0IGluc3RhbmNlIGlmIGl0IGhhc24ndCBhbHJlYWR5IGJlZW4gaW5pdGlhbGl6ZWRcbiAgbG9hZERlZmF1bHRUU0xpbnQoKTtcblxuICBpZiAoY29uZmlnLnVzZUxvY2FsVHNsaW50KSB7XG4gICAgcmV0dXJuIGdldExvY2FsTGludGVyKGJhc2VkaXIpO1xuICB9XG5cbiAgdHNsaW50Q2FjaGUuc2V0KGJhc2VkaXIsIHRzbGludERlZik7XG4gIHJldHVybiB0c2xpbnREZWY7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFByb2dyYW0oTGludGVyLCBjb25maWd1cmF0aW9uUGF0aCkge1xuICBsZXQgcHJvZ3JhbTtcbiAgY29uc3QgY29uZmlndXJhdGlvbkRpciA9IHBhdGguZGlybmFtZShjb25maWd1cmF0aW9uUGF0aCk7XG4gIGNvbnN0IHRzY29uZmlnUGF0aCA9IHBhdGgucmVzb2x2ZShjb25maWd1cmF0aW9uRGlyLCAndHNjb25maWcuanNvbicpO1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgc3RhdCh0c2NvbmZpZ1BhdGgpO1xuICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgcHJvZ3JhbSA9IExpbnRlci5jcmVhdGVQcm9ncmFtKCd0c2NvbmZpZy5qc29uJywgY29uZmlndXJhdGlvbkRpcik7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBuby1vcFxuICB9XG4gIHJldHVybiBwcm9ncmFtO1xufVxuXG4vKipcbiAqIExpbnQgdGhlIHByb3ZpZGVkIFR5cGVTY3JpcHQgY29udGVudFxuICogQHBhcmFtIGNvbnRlbnQge3N0cmluZ30gVGhlIGNvbnRlbnQgb2YgdGhlIFR5cGVTY3JpcHQgZmlsZVxuICogQHBhcmFtIGZpbGVQYXRoIHtzdHJpbmd9IEZpbGUgcGF0aCBvZiB0aGUgVHlwZVNjcmlwdCBmaWxlUGF0aFxuICogQHBhcmFtIG9wdGlvbnMge09iamVjdH0gTGludGVyIG9wdGlvbnNcbiAqIEByZXR1cm4gQXJyYXkgb2YgbGludCByZXN1bHRzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxpbnQoY29udGVudCwgZmlsZVBhdGgsIG9wdGlvbnMpIHtcbiAgaWYgKGZpbGVQYXRoID09PSBudWxsIHx8IGZpbGVQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IExpbnRlciA9IGF3YWl0IGdldExpbnRlcihmaWxlUGF0aCk7XG4gIGNvbnN0IGNvbmZpZ3VyYXRpb25QYXRoID0gTGludGVyLmZpbmRDb25maWd1cmF0aW9uUGF0aChudWxsLCBmaWxlUGF0aCk7XG4gIGNvbnN0IGNvbmZpZ3VyYXRpb24gPSBMaW50ZXIubG9hZENvbmZpZ3VyYXRpb25Gcm9tUGF0aChjb25maWd1cmF0aW9uUGF0aCk7XG5cbiAgbGV0IHsgcnVsZXNEaXJlY3RvcnkgfSA9IGNvbmZpZ3VyYXRpb247XG4gIGlmIChydWxlc0RpcmVjdG9yeSAmJiBjb25maWd1cmF0aW9uUGF0aCkge1xuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25EaXIgPSBwYXRoLmRpcm5hbWUoY29uZmlndXJhdGlvblBhdGgpO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShydWxlc0RpcmVjdG9yeSkpIHtcbiAgICAgIHJ1bGVzRGlyZWN0b3J5ID0gW3J1bGVzRGlyZWN0b3J5XTtcbiAgICB9XG4gICAgcnVsZXNEaXJlY3RvcnkgPSBydWxlc0RpcmVjdG9yeS5tYXAoKGRpcikgPT4ge1xuICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShkaXIpKSB7XG4gICAgICAgIHJldHVybiBkaXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGF0aC5qb2luKGNvbmZpZ3VyYXRpb25EaXIsIGRpcik7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLnJ1bGVzRGlyZWN0b3J5KSB7XG4gICAgICBydWxlc0RpcmVjdG9yeS5wdXNoKGNvbmZpZy5ydWxlc0RpcmVjdG9yeSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHByb2dyYW07XG4gIGlmIChjb25maWcuZW5hYmxlU2VtYW50aWNSdWxlcyAmJiBjb25maWd1cmF0aW9uUGF0aCkge1xuICAgIHByb2dyYW0gPSBhd2FpdCBnZXRQcm9ncmFtKExpbnRlciwgY29uZmlndXJhdGlvblBhdGgpO1xuICB9XG4gIGNvbnN0IGxpbnRlciA9IG5ldyBMaW50ZXIoT2JqZWN0LmFzc2lnbih7XG4gICAgZm9ybWF0dGVyOiAnanNvbicsXG4gICAgcnVsZXNEaXJlY3RvcnksXG4gIH0sIG9wdGlvbnMpLCBwcm9ncmFtKTtcblxuICBsZXQgbGludFJlc3VsdDtcbiAgdHJ5IHtcbiAgICBsaW50ZXIubGludChmaWxlUGF0aCwgY29udGVudCwgY29uZmlndXJhdGlvbik7XG4gICAgbGludFJlc3VsdCA9IGxpbnRlci5nZXRSZXN1bHQoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICBsaW50UmVzdWx0ID0ge307XG4gIH1cblxuICBpZiAoXG4gICAgLy8gdHNsaW50QDw1XG4gICAgIWxpbnRSZXN1bHQuZmFpbHVyZUNvdW50ICYmXG4gICAgLy8gdHNsaW50QD49NVxuICAgICFsaW50UmVzdWx0LmVycm9yQ291bnQgJiZcbiAgICAhbGludFJlc3VsdC53YXJuaW5nQ291bnQgJiZcbiAgICAhbGludFJlc3VsdC5pbmZvQ291bnRcbiAgKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGxpbnRSZXN1bHQuZmFpbHVyZXMubWFwKChmYWlsdXJlKSA9PiB7XG4gICAgY29uc3QgcnVsZVVyaSA9IGdldFJ1bGVVcmkoZmFpbHVyZS5nZXRSdWxlTmFtZSgpKTtcbiAgICBjb25zdCBzdGFydFBvc2l0aW9uID0gZmFpbHVyZS5nZXRTdGFydFBvc2l0aW9uKCkuZ2V0TGluZUFuZENoYXJhY3RlcigpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gZmFpbHVyZS5nZXRFbmRQb3NpdGlvbigpLmdldExpbmVBbmRDaGFyYWN0ZXIoKTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogZmFpbHVyZS5ydWxlU2V2ZXJpdHkgfHwgJ3dhcm5pbmcnLFxuICAgICAgaHRtbDogYCR7ZXNjYXBlSFRNTChmYWlsdXJlLmdldEZhaWx1cmUoKSl9ICg8YSBocmVmPVwiJHtydWxlVXJpLnVyaX1cIj4ke2ZhaWx1cmUuZ2V0UnVsZU5hbWUoKX08L2E+KWAsXG4gICAgICBmaWxlUGF0aDogcGF0aC5ub3JtYWxpemUoZmFpbHVyZS5nZXRGaWxlTmFtZSgpKSxcbiAgICAgIHJhbmdlOiBbXG4gICAgICAgIFtzdGFydFBvc2l0aW9uLmxpbmUsIHN0YXJ0UG9zaXRpb24uY2hhcmFjdGVyXSxcbiAgICAgICAgW2VuZFBvc2l0aW9uLmxpbmUsIGVuZFBvc2l0aW9uLmNoYXJhY3Rlcl0sXG4gICAgICBdLFxuICAgIH07XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiAoaW5pdGlhbENvbmZpZykge1xuICBjb25maWcudXNlTG9jYWxUc2xpbnQgPSBpbml0aWFsQ29uZmlnLnVzZUxvY2FsVHNsaW50O1xuICBjb25maWcuZW5hYmxlU2VtYW50aWNSdWxlcyA9IGluaXRpYWxDb25maWcuZW5hYmxlU2VtYW50aWNSdWxlcztcblxuICBwcm9jZXNzLm9uKCdtZXNzYWdlJywgYXN5bmMgKG1lc3NhZ2UpID0+IHtcbiAgICBpZiAobWVzc2FnZS5tZXNzYWdlVHlwZSA9PT0gJ2NvbmZpZycpIHtcbiAgICAgIGNvbmZpZ1ttZXNzYWdlLm1lc3NhZ2Uua2V5XSA9IG1lc3NhZ2UubWVzc2FnZS52YWx1ZTtcblxuICAgICAgaWYgKG1lc3NhZ2UubWVzc2FnZS5rZXkgPT09ICd1c2VMb2NhbFRzbGludCcpIHtcbiAgICAgICAgdHNsaW50Q2FjaGUuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgeyBlbWl0S2V5LCBqb2JUeXBlLCBjb250ZW50LCBmaWxlUGF0aCB9ID0gbWVzc2FnZS5tZXNzYWdlO1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGpvYlR5cGUgPT09ICdmaXgnID8geyBmaXg6IHRydWUgfSA6IHt9O1xuXG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgbGludChjb250ZW50LCBmaWxlUGF0aCwgb3B0aW9ucyk7XG4gICAgICBlbWl0KGVtaXRLZXksIHJlc3VsdHMpO1xuICAgIH1cbiAgfSk7XG59XG4iXX0=