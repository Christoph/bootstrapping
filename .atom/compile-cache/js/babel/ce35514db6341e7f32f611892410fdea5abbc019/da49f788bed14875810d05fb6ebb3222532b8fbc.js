Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _werkzeug = require('./werkzeug');

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _atom = require('atom');

var _buildState = require('./build-state');

var _buildState2 = _interopRequireDefault(_buildState);

var _parsersMagicParser = require('./parsers/magic-parser');

var _parsersMagicParser2 = _interopRequireDefault(_parsersMagicParser);

var Composer = (function (_Disposable) {
  _inherits(Composer, _Disposable);

  function Composer() {
    var _this2 = this;

    _classCallCheck(this, Composer);

    _get(Object.getPrototypeOf(Composer.prototype), 'constructor', this).call(this, function () {
      return _this.disposables.dispose();
    });
    this.disposables = new _atom.CompositeDisposable();
    this.cachedBuildStates = new Map();

    var _this = this;

    this.disposables.add(atom.config.onDidChange('latex', function () {
      _this2.rebuildCompleted = new Set();
    }));
  }

  _createClass(Composer, [{
    key: 'initializeBuild',
    value: function initializeBuild(filePath) {
      var allowCached = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      var state = undefined;

      if (allowCached && this.cachedBuildStates.has(filePath)) {
        state = this.cachedBuildStates.get(filePath);
      } else {
        state = new _buildState2['default'](filePath);
        this.initializeBuildStateFromConfig(state);
        this.initializeBuildStateFromMagic(state);
        this.initializeBuildStateFromSettingsFile(state);
        // Check again in case there was a root comment
        var masterFilePath = state.getFilePath();
        if (filePath !== masterFilePath) {
          if (allowCached && this.cachedBuildStates.has(masterFilePath)) {
            state = this.cachedBuildStates.get(masterFilePath);
          }
          state.addSubfile(filePath);
        }
        this.cacheBuildState(state);
      }

      var builder = latex.builderRegistry.getBuilder(state);
      if (!builder) {
        latex.log.warning('No registered LaTeX builder can process ' + state.getFilePath() + '.');
        return state;
      }

      return { state: state, builder: builder };
    }
  }, {
    key: 'cacheBuildState',
    value: function cacheBuildState(state) {
      var filePath = state.getFilePath();
      if (this.cachedBuildStates.has(filePath)) {
        var oldState = this.cachedBuildStates.get(filePath);
        for (var subfile of oldState.getSubfiles()) {
          this.cachedBuildStates['delete'](subfile);
        }
        this.cachedBuildStates['delete'](filePath);
      }

      this.cachedBuildStates.set(filePath, state);
      for (var subfile of state.getSubfiles()) {
        this.cachedBuildStates.set(subfile, state);
      }
    }
  }, {
    key: 'initializeBuildStateFromConfig',
    value: function initializeBuildStateFromConfig(state) {
      this.initializeBuildStateFromProperties(state, atom.config.get('latex'));
    }
  }, {
    key: 'initializeBuildStateFromProperties',
    value: function initializeBuildStateFromProperties(state, properties) {
      if (!properties) return;

      if (properties.cleanPatterns) {
        state.setCleanPatterns(properties.cleanPatterns);
      }

      if ('enableSynctex' in properties) {
        state.setEnableSynctex(properties.enableSynctex);
      }

      if ('enableShellEscape' in properties) {
        state.setEnableShellEscape(properties.enableShellEscape);
      }

      if ('enableExtendedBuildMode' in properties) {
        state.setEnableExtendedBuildMode(properties.enableExtendedBuildMode);
      }

      if (properties.jobNames) {
        state.setJobNames(properties.jobNames);
      } else if (properties.jobnames) {
        // jobnames is for compatibility with magic comments
        state.setJobNames(properties.jobnames);
      } else if (properties.jobname) {
        // jobname is for compatibility with Sublime
        state.setJobNames([properties.jobname]);
      }

      if (properties.customEngine) {
        state.setEngine(properties.customEngine);
      } else if (properties.engine) {
        state.setEngine(properties.engine);
      } else if (properties.program) {
        // program is for compatibility with magic comments
        state.setEngine(properties.program);
      }

      if ('moveResultToSourceDirectory' in properties) {
        state.setMoveResultToSourceDirectory(properties.moveResultToSourceDirectory);
      }

      if (properties.outputFormat) {
        state.setOutputFormat(properties.outputFormat);
      } else if (properties.format) {
        // format is for compatibility with magic comments
        state.setOutputFormat(properties.format);
      }

      if ('outputDirectory' in properties) {
        state.setOutputDirectory(properties.outputDirectory);
      } else if ('output_directory' in properties) {
        // output_directory is for compatibility with Sublime
        state.setOutputDirectory(properties.output_directory);
      }

      if (properties.producer) {
        state.setProducer(properties.producer);
      }
    }
  }, {
    key: 'initializeBuildStateFromMagic',
    value: function initializeBuildStateFromMagic(state) {
      var magic = this.getMagic(state);

      if (magic.root) {
        state.setFilePath(_path2['default'].resolve(state.getProjectPath(), magic.root));
        magic = this.getMagic(state);
      }

      this.initializeBuildStateFromProperties(state, magic);
    }
  }, {
    key: 'getMagic',
    value: function getMagic(state) {
      return new _parsersMagicParser2['default'](state.getFilePath()).parse();
    }
  }, {
    key: 'initializeBuildStateFromSettingsFile',
    value: function initializeBuildStateFromSettingsFile(state) {
      try {
        var _path$parse = _path2['default'].parse(state.getFilePath());

        var dir = _path$parse.dir;
        var _name = _path$parse.name;

        var filePath = _path2['default'].format({ dir: dir, name: _name, ext: '.yaml' });

        if (_fsPlus2['default'].existsSync(filePath)) {
          var config = _jsYaml2['default'].safeLoad(_fsPlus2['default'].readFileSync(filePath));
          this.initializeBuildStateFromProperties(state, config);
        }
      } catch (error) {
        latex.log.error('Parsing of project file failed: ' + error.message);
      }
    }
  }, {
    key: 'build',
    value: _asyncToGenerator(function* (shouldRebuild) {
      var _this3 = this;

      latex.process.killChildProcesses();

      var _getEditorDetails = (0, _werkzeug.getEditorDetails)();

      var editor = _getEditorDetails.editor;
      var filePath = _getEditorDetails.filePath;

      if (!filePath) {
        latex.log.warning('File needs to be saved to disk before it can be TeXified.');
        return false;
      }

      if (editor.isModified()) {
        editor.save(); // TODO: Make this configurable?
      }

      var _initializeBuild = this.initializeBuild(filePath);

      var builder = _initializeBuild.builder;
      var state = _initializeBuild.state;

      if (!builder) return false;
      state.setShouldRebuild(shouldRebuild);

      if (this.rebuildCompleted && !this.rebuildCompleted.has(state.getFilePath())) {
        state.setShouldRebuild(true);
        this.rebuildCompleted.add(state.getFilePath());
      }

      latex.log.clear();
      latex.status.setBusy();

      var jobs = state.getJobStates().map(function (jobState) {
        return _this3.buildJob(builder, jobState);
      });

      yield Promise.all(jobs);

      latex.status.setIdle();
    })
  }, {
    key: 'buildJob',
    value: _asyncToGenerator(function* (builder, jobState) {
      try {
        var statusCode = yield builder.run(jobState);
        builder.parseLogAndFdbFiles(jobState);

        var messages = jobState.getLogMessages() || [];
        for (var message of messages) {
          latex.log.showMessage(message);
        }

        if (statusCode > 0 || !jobState.getLogMessages() || !jobState.getOutputFilePath()) {
          this.showError(jobState);
        } else {
          if (this.shouldMoveResult(jobState)) {
            this.moveResult(jobState);
          }
          this.showResult(jobState);
        }
      } catch (error) {
        latex.log.error(error.message);
      }
    })
  }, {
    key: 'sync',
    value: _asyncToGenerator(function* () {
      var _this4 = this;

      var _getEditorDetails2 = (0, _werkzeug.getEditorDetails)();

      var filePath = _getEditorDetails2.filePath;
      var lineNumber = _getEditorDetails2.lineNumber;

      if (!filePath || !this.isTexFile(filePath)) {
        return;
      }

      var _initializeBuild2 = this.initializeBuild(filePath, true);

      var builder = _initializeBuild2.builder;
      var state = _initializeBuild2.state;

      if (!builder) return false;

      var jobs = state.getJobStates().map(function (jobState) {
        return _this4.syncJob(filePath, lineNumber, builder, jobState);
      });

      yield Promise.all(jobs);
    })
  }, {
    key: 'syncJob',
    value: _asyncToGenerator(function* (filePath, lineNumber, builder, jobState) {
      var outputFilePath = this.resolveOutputFilePath(builder, jobState);
      if (!outputFilePath) {
        latex.log.warning('Could not resolve path to output file associated with the current file.');
        return;
      }

      yield latex.opener.open(outputFilePath, filePath, lineNumber);
    })
  }, {
    key: 'clean',
    value: _asyncToGenerator(function* () {
      var _this5 = this;

      var _getEditorDetails3 = (0, _werkzeug.getEditorDetails)();

      var filePath = _getEditorDetails3.filePath;

      if (!filePath || !this.isTexFile(filePath)) {
        return false;
      }

      var _initializeBuild3 = this.initializeBuild(filePath, true);

      var builder = _initializeBuild3.builder;
      var state = _initializeBuild3.state;

      if (!builder) return false;

      latex.status.setBusy();
      latex.log.clear();

      var jobs = state.getJobStates().map(function (jobState) {
        return _this5.cleanJob(builder, jobState);
      });

      yield Promise.all(jobs);

      latex.status.setIdle();
    })
  }, {
    key: 'cleanJob',
    value: _asyncToGenerator(function* (builder, jobState) {
      var generatedFiles = this.getGeneratedFileList(builder, jobState);
      var files = new Set();

      var patterns = this.getCleanPatterns(builder, jobState);

      for (var pattern of patterns) {
        // If the original pattern is absolute then we use it as a globbing pattern
        // after we join it to the root, otherwise we use it against the list of
        // generated files.
        if (pattern[0] === _path2['default'].sep) {
          var absolutePattern = _path2['default'].join(jobState.getProjectPath(), pattern);
          for (var file of _glob2['default'].sync(absolutePattern)) {
            files.add(_path2['default'].normalize(file));
          }
        } else {
          for (var file of generatedFiles.values()) {
            if ((0, _minimatch2['default'])(file, pattern)) {
              files.add(file);
            }
          }
        }
      }

      var fileNames = Array.from(files.values()).map(function (file) {
        return _path2['default'].basename(file);
      }).join(', ');
      latex.log.info('Cleaned: ' + fileNames);

      for (var file of files.values()) {
        _fsPlus2['default'].removeSync(file);
      }
    })
  }, {
    key: 'getCleanPatterns',
    value: function getCleanPatterns(builder, jobState) {
      var _path$parse2 = _path2['default'].parse(jobState.getFilePath());

      var name = _path$parse2.name;
      var ext = _path$parse2.ext;

      var outputDirectory = jobState.getOutputDirectory();
      var properties = {
        output_dir: outputDirectory ? outputDirectory + _path2['default'].sep : '',
        jobname: jobState.getJobName() || name,
        name: name,
        ext: ext
      };
      var patterns = jobState.getCleanPatterns();

      return patterns.map(function (pattern) {
        return _path2['default'].normalize((0, _werkzeug.replacePropertiesInString)(pattern, properties));
      });
    }
  }, {
    key: 'getGeneratedFileList',
    value: function getGeneratedFileList(builder, jobState) {
      var _path$parse3 = _path2['default'].parse(jobState.getFilePath());

      var dir = _path$parse3.dir;
      var name = _path$parse3.name;

      if (!jobState.getFileDatabase()) {
        builder.parseLogAndFdbFiles(jobState);
      }

      var pattern = _path2['default'].resolve(dir, jobState.getOutputDirectory(), (jobState.getJobName() || name) + '*');
      var files = new Set(_glob2['default'].sync(pattern));
      var fdb = jobState.getFileDatabase();

      if (fdb) {
        var generatedFiles = _lodash2['default'].flatten(_lodash2['default'].map(fdb, function (section) {
          return section.generated || [];
        }));

        for (var file of generatedFiles) {
          files.add(_path2['default'].resolve(dir, file));
        }
      }

      return files;
    }
  }, {
    key: 'moveResult',
    value: function moveResult(jobState) {
      var originalOutputFilePath = jobState.getOutputFilePath();
      var newOutputFilePath = this.alterParentPath(jobState.getFilePath(), originalOutputFilePath);
      jobState.setOutputFilePath(newOutputFilePath);
      if (_fsPlus2['default'].existsSync(originalOutputFilePath)) {
        _fsPlus2['default'].removeSync(newOutputFilePath);
        _fsPlus2['default'].moveSync(originalOutputFilePath, newOutputFilePath);
      }

      var originalSyncFilePath = originalOutputFilePath.replace(/\.pdf$/, '.synctex.gz');
      if (_fsPlus2['default'].existsSync(originalSyncFilePath)) {
        var syncFilePath = this.alterParentPath(jobState.getFilePath(), originalSyncFilePath);
        _fsPlus2['default'].removeSync(syncFilePath);
        _fsPlus2['default'].moveSync(originalSyncFilePath, syncFilePath);
      }
    }
  }, {
    key: 'resolveOutputFilePath',
    value: function resolveOutputFilePath(builder, jobState) {
      var outputFilePath = jobState.getOutputFilePath();
      if (outputFilePath) {
        return outputFilePath;
      }

      builder.parseLogAndFdbFiles(jobState);
      outputFilePath = jobState.getOutputFilePath();
      if (!outputFilePath) {
        latex.log.warning('Log file parsing failed!');
        return null;
      }

      if (this.shouldMoveResult(jobState)) {
        outputFilePath = this.alterParentPath(jobState.getFilePath(), outputFilePath);
        jobState.setOutputFilePath(outputFilePath);
      }

      return outputFilePath;
    }
  }, {
    key: 'showResult',
    value: _asyncToGenerator(function* (jobState) {
      if (!this.shouldOpenResult()) {
        return;
      }

      var _getEditorDetails4 = (0, _werkzeug.getEditorDetails)();

      var filePath = _getEditorDetails4.filePath;
      var lineNumber = _getEditorDetails4.lineNumber;

      yield latex.opener.open(jobState.getOutputFilePath(), filePath, lineNumber);
    })
  }, {
    key: 'showError',
    value: function showError(jobState) {
      if (!jobState.getLogMessages()) {
        latex.log.error('Parsing of log files failed.');
      } else if (!jobState.getOutputFilePath()) {
        latex.log.error('No output file detected.');
      }
    }
  }, {
    key: 'isTexFile',
    value: function isTexFile(filePath) {
      // TODO: Improve will suffice for the time being.
      return !filePath || filePath.search(/\.(tex|lhs|[rs]nw)$/i) > 0;
    }
  }, {
    key: 'alterParentPath',
    value: function alterParentPath(targetPath, originalPath) {
      var targetDir = _path2['default'].dirname(targetPath);
      return _path2['default'].join(targetDir, _path2['default'].basename(originalPath));
    }
  }, {
    key: 'shouldMoveResult',
    value: function shouldMoveResult(jobState) {
      return jobState.getMoveResultToSourceDirectory() && jobState.getOutputDirectory().length > 0;
    }
  }, {
    key: 'shouldOpenResult',
    value: function shouldOpenResult() {
      return atom.config.get('latex.openResultAfterBuild');
    }
  }]);

  return Composer;
})(_atom.Disposable);

exports['default'] = Composer;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L2xpYi9jb21wb3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBRWMsUUFBUTs7OztzQkFDUCxTQUFTOzs7O29CQUNQLE1BQU07Ozs7d0JBQ3FDLFlBQVk7O3lCQUNsRCxXQUFXOzs7O29CQUNoQixNQUFNOzs7O3NCQUNOLFNBQVM7Ozs7b0JBQ3NCLE1BQU07OzBCQUMvQixlQUFlOzs7O2tDQUNkLHdCQUF3Qjs7OztJQUUzQixRQUFRO1lBQVIsUUFBUTs7QUFJZixXQUpPLFFBQVEsR0FJWjs7OzBCQUpJLFFBQVE7O0FBS3pCLCtCQUxpQixRQUFRLDZDQUtuQjthQUFNLE1BQUssV0FBVyxDQUFDLE9BQU8sRUFBRTtLQUFBLEVBQUM7U0FKekMsV0FBVyxHQUFHLCtCQUF5QjtTQUN2QyxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBRTs7OztBQUkzQixRQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUMxRCxhQUFLLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7S0FDbEMsQ0FBQyxDQUFDLENBQUE7R0FDSjs7ZUFUa0IsUUFBUTs7V0FXWCx5QkFBQyxRQUFRLEVBQXVCO1VBQXJCLFdBQVcseURBQUcsS0FBSzs7QUFDNUMsVUFBSSxLQUFLLFlBQUEsQ0FBQTs7QUFFVCxVQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3ZELGFBQUssR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO09BQzdDLE1BQU07QUFDTCxhQUFLLEdBQUcsNEJBQWUsUUFBUSxDQUFDLENBQUE7QUFDaEMsWUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzFD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QU0sU0FBUyxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUMxQyxhQUFPLGtCQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsa0JBQUssUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUE7S0FDekQ7OztXQUVnQiwwQkFBQyxRQUFRLEVBQUU7QUFDMUIsYUFBTyxRQUFRLENBQUMsOEJBQThCLEVBQUUsSUFBSSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0tBQzdGOzs7V0FFZ0IsNEJBQUc7QUFBRSxhQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUE7S0FBRTs7O1NBaFl6RCxRQUFROzs7cUJBQVIsUUFBUSIsImZpbGUiOiIvaG9tZS9jaHJpcy8uYXRvbS9wYWNrYWdlcy9sYXRleC9saWIvY29tcG9zZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGdldEVkaXRvckRldGFpbHMsIHJlcGxhY2VQcm9wZXJ0aWVzSW5TdHJpbmcgfSBmcm9tICcuL3dlcmt6ZXVnJ1xuaW1wb3J0IG1pbmltYXRjaCBmcm9tICdtaW5pbWF0Y2gnXG5pbXBvcnQgZ2xvYiBmcm9tICdnbG9iJ1xuaW1wb3J0IHlhbWwgZnJvbSAnanMteWFtbCdcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IEJ1aWxkU3RhdGUgZnJvbSAnLi9idWlsZC1zdGF0ZSdcbmltcG9ydCBNYWdpY1BhcnNlciBmcm9tICcuL3BhcnNlcnMvbWFnaWMtcGFyc2VyJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21wb3NlciBleHRlbmRzIERpc3Bvc2FibGUge1xuICBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgY2FjaGVkQnVpbGRTdGF0ZXMgPSBuZXcgTWFwKClcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKCkgPT4gdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKCkpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2xhdGV4JywgKCkgPT4ge1xuICAgICAgdGhpcy5yZWJ1aWxkQ29tcGxldGVkID0gbmV3IFNldCgpXG4gICAgfSkpXG4gIH1cblxuICBpbml0aWFsaXplQnVpbGQgKGZpbGVQYXRoLCBhbGxvd0NhY2hlZCA9IGZhbHNlKSB7XG4gICAgbGV0IHN0YXRlXG5cbiAgICBpZiAoYWxsb3dDYWNoZWQgJiYgdGhpcy5jYWNoZWRCdWlsZFN0YXRlcy5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICBzdGF0ZSA9IHRoaXMuY2FjaGVkQnVpbGRTdGF0ZXMuZ2V0KGZpbGVQYXRoKVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZSA9IG5ldyBCdWlsZFN0YXRlKGZpbGVQYXRoKVxuICAgICAgdGhpcy5pbml0aWFsaXplQnVpbGRTdGF0ZUZyb21Db25maWcoc3RhdGUpXG4gICAgICB0aGlzLmluaXRpYWxpemVCdWlsZFN0YXRlRnJvbU1hZ2ljKHN0YXRlKVxuICAgICAgdGhpcy5pbml0aWFsaXplQnVpbGRTdGF0ZUZyb21TZXR0aW5nc0ZpbGUoc3RhdGUpXG4gICAgICAvLyBDaGVjayBhZ2FpbiBpbiBjYXNlIHRoZXJlIHdhcyBhIHJvb3QgY29tbWVudFxuICAgICAgY29uc3QgbWFzdGVyRmlsZVBhdGggPSBzdGF0ZS5nZXRGaWxlUGF0aCgpXG4gICAgICBpZiAoZmlsZVBhdGggIT09IG1hc3RlckZpbGVQYXRoKSB7XG4gICAgICAgIGlmIChhbGxvd0NhY2hlZCAmJiB0aGlzLmNhY2hlZEJ1aWxkU3RhdGVzLmhhcyhtYXN0ZXJGaWxlUGF0aCkpIHtcbiAgICAgICAgICBzdGF0ZSA9IHRoaXMuY2FjaGVkQnVpbGRTdGF0ZXMuZ2V0KG1hc3RlckZpbGVQYXRoKVxuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmFkZFN1YmZpbGUoZmlsZVBhdGgpXG4gICAgICB9XG4gICAgICB0aGlzLmNhY2hlQnVpbGRTdGF0ZShzdGF0ZSlcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZGVyID0gbGF0ZXguYnVpbGRlclJlZ2lzdHJ5LmdldEJ1aWxkZXIoc3RhdGUpXG4gICAgaWYgKCFidWlsZGVyKSB7XG4gICAgICBsYXRleC5sb2cud2FybmluZyhgTm8gcmVnaXN0ZXJlZCBMYVRlWCBidWlsZGVyIGNhbiBwcm9jZXNzICR7c3RhdGUuZ2V0RmlsZVBhdGgoKX0uYClcbiAgICAgIHJldHVybiBzdGF0ZVxuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXRlLCBidWlsZGVyIH1cbiAgfVxuXG4gIGNhY2hlQnVpbGRTdGF0ZSAoc3RhdGUpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHN0YXRlLmdldEZpbGVQYXRoKClcbiAgICBpZiAodGhpcy5jYWNoZWRCdWlsZFN0YXRlcy5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuY2FjaGVkQnVpbGRTdGF0ZXMuZ2V0KGZpbGVQYXRoKVxuICAgICAgZm9yIChjb25zdCBzdWJmaWxlIG9mIG9sZFN0YXRlLmdldFN1YmZpbGVzKCkpIHtcbiAgICAgICAgdGhpcy5jYWNoZWRCdWlsZFN0YXRlcy5kZWxldGUoc3ViZmlsZSlcbiAgICAgIH1cbiAgICAgIHRoaXMuY2FjaGVkQnVpbGRTdGF0ZXMuZGVsZXRlKGZpbGVQYXRoKVxuICAgIH1cblxuICAgIHRoaXMuY2FjaGVkQnVpbGRTdGF0ZXMuc2V0KGZpbGVQYXRoLCBzdGF0ZSlcbiAgICBmb3IgKGNvbnN0IHN1YmZpbGUgb2Ygc3RhdGUuZ2V0U3ViZmlsZXMoKSkge1xuICAgICAgdGhpcy5jYWNoZWRCdWlsZFN0YXRlcy5zZXQoc3ViZmlsZSwgc3RhdGUpXG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tQ29uZmlnIChzdGF0ZSkge1xuICAgIHRoaXMuaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tUHJvcGVydGllcyhzdGF0ZSwgYXRvbS5jb25maWcuZ2V0KCdsYXRleCcpKVxuICB9XG5cbiAgaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tUHJvcGVydGllcyAoc3RhdGUsIHByb3BlcnRpZXMpIHtcbiAgICBpZiAoIXByb3BlcnRpZXMpIHJldHVyblxuXG4gICAgaWYgKHByb3BlcnRpZXMuY2xlYW5QYXR0ZXJucykge1xuICAgICAgc3RhdGUuc2V0Q2xlYW5QYXR0ZXJucyhwcm9wZXJ0aWVzLmNsZWFuUGF0dGVybnMpXG4gICAgfVxuXG4gICAgaWYgKCdlbmFibGVTeW5jdGV4JyBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICBzdGF0ZS5zZXRFbmFibGVTeW5jdGV4KHByb3BlcnRpZXMuZW5hYmxlU3luY3RleClcbiAgICB9XG5cbiAgICBpZiAoJ2VuYWJsZVNoZWxsRXNjYXBlJyBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICBzdGF0ZS5zZXRFbmFibGVTaGVsbEVzY2FwZShwcm9wZXJ0aWVzLmVuYWJsZVNoZWxsRXNjYXBlKVxuICAgIH1cblxuICAgIGlmICgnZW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUnIGluIHByb3BlcnRpZXMpIHtcbiAgICAgIHN0YXRlLnNldEVuYWJsZUV4dGVuZGVkQnVpbGRNb2RlKHByb3BlcnRpZXMuZW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUpXG4gICAgfVxuXG4gICAgaWYgKHByb3BlcnRpZXMuam9iTmFtZXMpIHtcbiAgICAgIHN0YXRlLnNldEpvYk5hbWVzKHByb3BlcnRpZXMuam9iTmFtZXMpXG4gICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzLmpvYm5hbWVzKSB7XG4gICAgICAvLyBqb2JuYW1lcyBpcyBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG1hZ2ljIGNvbW1lbnRzXG4gICAgICBzdGF0ZS5zZXRKb2JOYW1lcyhwcm9wZXJ0aWVzLmpvYm5hbWVzKVxuICAgIH0gZWxzZSBpZiAocHJvcGVydGllcy5qb2JuYW1lKSB7XG4gICAgICAvLyBqb2JuYW1lIGlzIGZvciBjb21wYXRpYmlsaXR5IHdpdGggU3VibGltZVxuICAgICAgc3RhdGUuc2V0Sm9iTmFtZXMoW3Byb3BlcnRpZXMuam9ibmFtZV0pXG4gICAgfVxuXG4gICAgaWYgKHByb3BlcnRpZXMuY3VzdG9tRW5naW5lKSB7XG4gICAgICBzdGF0ZS5zZXRFbmdpbmUocHJvcGVydGllcy5jdXN0b21FbmdpbmUpXG4gICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzLmVuZ2luZSkge1xuICAgICAgc3RhdGUuc2V0RW5naW5lKHByb3BlcnRpZXMuZW5naW5lKVxuICAgIH0gZWxzZSBpZiAocHJvcGVydGllcy5wcm9ncmFtKSB7XG4gICAgICAvLyBwcm9ncmFtIGlzIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbWFnaWMgY29tbWVudHNcbiAgICAgIHN0YXRlLnNldEVuZ2luZShwcm9wZXJ0aWVzLnByb2dyYW0pXG4gICAgfVxuXG4gICAgaWYgKCdtb3ZlUmVzdWx0VG9Tb3VyY2VEaXJlY3RvcnknIGluIHByb3BlcnRpZXMpIHtcbiAgICAgIHN0YXRlLnNldE1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeShwcm9wZXJ0aWVzLm1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeSlcbiAgICB9XG5cbiAgICBpZiAocHJvcGVydGllcy5vdXRwdXRGb3JtYXQpIHtcbiAgICAgIHN0YXRlLnNldE91dHB1dEZvcm1hdChwcm9wZXJ0aWVzLm91dHB1dEZvcm1hdClcbiAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXMuZm9ybWF0KSB7XG4gICAgICAvLyBmb3JtYXQgaXMgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBtYWdpYyBjb21tZW50c1xuICAgICAgc3RhdGUuc2V0T3V0cHV0Rm9ybWF0KHByb3BlcnRpZXMuZm9ybWF0KVxuICAgIH1cblxuICAgIGlmICgnb3V0cHV0RGlyZWN0b3J5JyBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICBzdGF0ZS5zZXRPdXRwdXREaXJlY3RvcnkocHJvcGVydGllcy5vdXRwdXREaXJlY3RvcnkpXG4gICAgfSBlbHNlIGlmICgnb3V0cHV0X2RpcmVjdG9yeScgaW4gcHJvcGVydGllcykge1xuICAgICAgLy8gb3V0cHV0X2RpcmVjdG9yeSBpcyBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIFN1YmxpbWVcbiAgICAgIHN0YXRlLnNldE91dHB1dERpcmVjdG9yeShwcm9wZXJ0aWVzLm91dHB1dF9kaXJlY3RvcnkpXG4gICAgfVxuXG4gICAgaWYgKHByb3BlcnRpZXMucHJvZHVjZXIpIHtcbiAgICAgIHN0YXRlLnNldFByb2R1Y2VyKHByb3BlcnRpZXMucHJvZHVjZXIpXG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tTWFnaWMgKHN0YXRlKSB7XG4gICAgbGV0IG1hZ2ljID0gdGhpcy5nZXRNYWdpYyhzdGF0ZSlcblxuICAgIGlmIChtYWdpYy5yb290KSB7XG4gICAgICBzdGF0ZS5zZXRGaWxlUGF0aChwYXRoLnJlc29sdmUoc3RhdGUuZ2V0UHJvamVjdFBhdGgoKSwgbWFnaWMucm9vdCkpXG4gICAgICBtYWdpYyA9IHRoaXMuZ2V0TWFnaWMoc3RhdGUpXG4gICAgfVxuXG4gICAgdGhpcy5pbml0aWFsaXplQnVpbGRTdGF0ZUZyb21Qcm9wZXJ0aWVzKHN0YXRlLCBtYWdpYylcbiAgfVxuXG4gIGdldE1hZ2ljIChzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgTWFnaWNQYXJzZXIoc3RhdGUuZ2V0RmlsZVBhdGgoKSkucGFyc2UoKVxuICB9XG5cbiAgaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tU2V0dGluZ3NGaWxlIChzdGF0ZSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGRpciwgbmFtZSB9ID0gcGF0aC5wYXJzZShzdGF0ZS5nZXRGaWxlUGF0aCgpKVxuICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmZvcm1hdCh7IGRpciwgbmFtZSwgZXh0OiAnLnlhbWwnIH0pXG5cbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB5YW1sLnNhZmVMb2FkKGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCkpXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tUHJvcGVydGllcyhzdGF0ZSwgY29uZmlnKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsYXRleC5sb2cuZXJyb3IoYFBhcnNpbmcgb2YgcHJvamVjdCBmaWxlIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfWApXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYnVpbGQgKHNob3VsZFJlYnVpbGQpIHtcbiAgICBsYXRleC5wcm9jZXNzLmtpbGxDaGlsZFByb2Nlc3NlcygpXG5cbiAgICBjb25zdCB7IGVkaXRvciwgZmlsZVBhdGggfSA9IGdldEVkaXRvckRldGFpbHMoKVxuXG4gICAgaWYgKCFmaWxlUGF0aCkge1xuICAgICAgbGF0ZXgubG9nLndhcm5pbmcoJ0ZpbGUgbmVlZHMgdG8gYmUgc2F2ZWQgdG8gZGlzayBiZWZvcmUgaXQgY2FuIGJlIFRlWGlmaWVkLicpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBpZiAoZWRpdG9yLmlzTW9kaWZpZWQoKSkge1xuICAgICAgZWRpdG9yLnNhdmUoKSAvLyBUT0RPOiBNYWtlIHRoaXMgY29uZmlndXJhYmxlP1xuICAgIH1cblxuICAgIGNvbnN0IHsgYnVpbGRlciwgc3RhdGUgfSA9IHRoaXMuaW5pdGlhbGl6ZUJ1aWxkKGZpbGVQYXRoKVxuICAgIGlmICghYnVpbGRlcikgcmV0dXJuIGZhbHNlXG4gICAgc3RhdGUuc2V0U2hvdWxkUmVidWlsZChzaG91bGRSZWJ1aWxkKVxuXG4gICAgaWYgKHRoaXMucmVidWlsZENvbXBsZXRlZCAmJiAhdGhpcy5yZWJ1aWxkQ29tcGxldGVkLmhhcyhzdGF0ZS5nZXRGaWxlUGF0aCgpKSkge1xuICAgICAgc3RhdGUuc2V0U2hvdWxkUmVidWlsZCh0cnVlKVxuICAgICAgdGhpcy5yZWJ1aWxkQ29tcGxldGVkLmFkZChzdGF0ZS5nZXRGaWxlUGF0aCgpKVxuICAgIH1cblxuICAgIGxhdGV4LmxvZy5jbGVhcigpXG4gICAgbGF0ZXguc3RhdHVzLnNldEJ1c3koKVxuXG4gICAgY29uc3Qgam9icyA9IHN0YXRlLmdldEpvYlN0YXRlcygpLm1hcChqb2JTdGF0ZSA9PiB0aGlzLmJ1aWxkSm9iKGJ1aWxkZXIsIGpvYlN0YXRlKSlcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKGpvYnMpXG5cbiAgICBsYXRleC5zdGF0dXMuc2V0SWRsZSgpXG4gIH1cblxuICBhc3luYyBidWlsZEpvYiAoYnVpbGRlciwgam9iU3RhdGUpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdHVzQ29kZSA9IGF3YWl0IGJ1aWxkZXIucnVuKGpvYlN0YXRlKVxuICAgICAgYnVpbGRlci5wYXJzZUxvZ0FuZEZkYkZpbGVzKGpvYlN0YXRlKVxuXG4gICAgICBjb25zdCBtZXNzYWdlcyA9IGpvYlN0YXRlLmdldExvZ01lc3NhZ2VzKCkgfHwgW11cbiAgICAgIGZvciAoY29uc3QgbWVzc2FnZSBvZiBtZXNzYWdlcykge1xuICAgICAgICBsYXRleC5sb2cuc2hvd01lc3NhZ2UobWVzc2FnZSlcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXR1c0NvZGUgPiAwIHx8ICFqb2JTdGF0ZS5nZXRMb2dNZXNzYWdlcygpIHx8ICFqb2JTdGF0ZS5nZXRPdXRwdXRGaWxlUGF0aCgpKSB7XG4gICAgICAgIHRoaXMuc2hvd0Vycm9yKGpvYlN0YXRlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkTW92ZVJlc3VsdChqb2JTdGF0ZSkpIHtcbiAgICAgICAgICB0aGlzLm1vdmVSZXN1bHQoam9iU3RhdGUpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaG93UmVzdWx0KGpvYlN0YXRlKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsYXRleC5sb2cuZXJyb3IoZXJyb3IubWVzc2FnZSlcbiAgICB9XG4gIH1cblxuICBhc3luYyBzeW5jICgpIHtcbiAgICBjb25zdCB7IGZpbGVQYXRoLCBsaW5lTnVtYmVyIH0gPSBnZXRFZGl0b3JEZXRhaWxzKClcbiAgICBpZiAoIWZpbGVQYXRoIHx8ICF0aGlzLmlzVGV4RmlsZShmaWxlUGF0aCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgYnVpbGRlciwgc3RhdGUgfSA9IHRoaXMuaW5pdGlhbGl6ZUJ1aWxkKGZpbGVQYXRoLCB0cnVlKVxuICAgIGlmICghYnVpbGRlcikgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBqb2JzID0gc3RhdGUuZ2V0Sm9iU3RhdGVzKCkubWFwKGpvYlN0YXRlID0+IHRoaXMuc3luY0pvYihmaWxlUGF0aCwgbGluZU51bWJlciwgYnVpbGRlciwgam9iU3RhdGUpKVxuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoam9icylcbiAgfVxuXG4gIGFzeW5jIHN5bmNKb2IgKGZpbGVQYXRoLCBsaW5lTnVtYmVyLCBidWlsZGVyLCBqb2JTdGF0ZSkge1xuICAgIGNvbnN0IG91dHB1dEZpbGVQYXRoID0gdGhpcy5yZXNvbHZlT3V0cHV0RmlsZVBhdGgoYnVpbGRlciwgam9iU3RhdGUpXG4gICAgaWYgKCFvdXRwdXRGaWxlUGF0aCkge1xuICAgICAgbGF0ZXgubG9nLndhcm5pbmcoJ0NvdWxkIG5vdCByZXNvbHZlIHBhdGggdG8gb3V0cHV0IGZpbGUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGZpbGUuJylcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGF3YWl0IGxhdGV4Lm9wZW5lci5vcGVuKG91dHB1dEZpbGVQYXRoLCBmaWxlUGF0aCwgbGluZU51bWJlcilcbiAgfVxuXG4gIGFzeW5jIGNsZWFuICgpIHtcbiAgICBjb25zdCB7IGZpbGVQYXRoIH0gPSBnZXRFZGl0b3JEZXRhaWxzKClcbiAgICBpZiAoIWZpbGVQYXRoIHx8ICF0aGlzLmlzVGV4RmlsZShmaWxlUGF0aCkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGNvbnN0IHsgYnVpbGRlciwgc3RhdGUgfSA9IHRoaXMuaW5pdGlhbGl6ZUJ1aWxkKGZpbGVQYXRoLCB0cnVlKVxuICAgIGlmICghYnVpbGRlcikgcmV0dXJuIGZhbHNlXG5cbiAgICBsYXRleC5zdGF0dXMuc2V0QnVzeSgpXG4gICAgbGF0ZXgubG9nLmNsZWFyKClcblxuICAgIGNvbnN0IGpvYnMgPSBzdGF0ZS5nZXRKb2JTdGF0ZXMoKS5tYXAoam9iU3RhdGUgPT4gdGhpcy5jbGVhbkpvYihidWlsZGVyLCBqb2JTdGF0ZSkpXG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChqb2JzKVxuXG4gICAgbGF0ZXguc3RhdHVzLnNldElkbGUoKVxuICB9XG5cbiAgYXN5bmMgY2xlYW5Kb2IgKGJ1aWxkZXIsIGpvYlN0YXRlKSB7XG4gICAgY29uc3QgZ2VuZXJhdGVkRmlsZXMgPSB0aGlzLmdldEdlbmVyYXRlZEZpbGVMaXN0KGJ1aWxkZXIsIGpvYlN0YXRlKVxuICAgIGxldCBmaWxlcyA9IG5ldyBTZXQoKVxuXG4gICAgY29uc3QgcGF0dGVybnMgPSB0aGlzLmdldENsZWFuUGF0dGVybnMoYnVpbGRlciwgam9iU3RhdGUpXG5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCBwYXR0ZXJuIGlzIGFic29sdXRlIHRoZW4gd2UgdXNlIGl0IGFzIGEgZ2xvYmJpbmcgcGF0dGVyblxuICAgICAgLy8gYWZ0ZXIgd2Ugam9pbiBpdCB0byB0aGUgcm9vdCwgb3RoZXJ3aXNlIHdlIHVzZSBpdCBhZ2FpbnN0IHRoZSBsaXN0IG9mXG4gICAgICAvLyBnZW5lcmF0ZWQgZmlsZXMuXG4gICAgICBpZiAocGF0dGVyblswXSA9PT0gcGF0aC5zZXApIHtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVQYXR0ZXJuID0gcGF0aC5qb2luKGpvYlN0YXRlLmdldFByb2plY3RQYXRoKCksIHBhdHRlcm4pXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBnbG9iLnN5bmMoYWJzb2x1dGVQYXR0ZXJuKSkge1xuICAgICAgICAgIGZpbGVzLmFkZChwYXRoLm5vcm1hbGl6ZShmaWxlKSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGdlbmVyYXRlZEZpbGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgaWYgKG1pbmltYXRjaChmaWxlLCBwYXR0ZXJuKSkge1xuICAgICAgICAgICAgZmlsZXMuYWRkKGZpbGUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZU5hbWVzID0gQXJyYXkuZnJvbShmaWxlcy52YWx1ZXMoKSkubWFwKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSkuam9pbignLCAnKVxuICAgIGxhdGV4LmxvZy5pbmZvKCdDbGVhbmVkOiAnICsgZmlsZU5hbWVzKVxuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzLnZhbHVlcygpKSB7XG4gICAgICBmcy5yZW1vdmVTeW5jKGZpbGUpXG4gICAgfVxuICB9XG5cbiAgZ2V0Q2xlYW5QYXR0ZXJucyAoYnVpbGRlciwgam9iU3RhdGUpIHtcbiAgICBjb25zdCB7IG5hbWUsIGV4dCB9ID0gcGF0aC5wYXJzZShqb2JTdGF0ZS5nZXRGaWxlUGF0aCgpKVxuICAgIGNvbnN0IG91dHB1dERpcmVjdG9yeSA9IGpvYlN0YXRlLmdldE91dHB1dERpcmVjdG9yeSgpXG4gICAgY29uc3QgcHJvcGVydGllcyA9IHtcbiAgICAgIG91dHB1dF9kaXI6IG91dHB1dERpcmVjdG9yeSA/IG91dHB1dERpcmVjdG9yeSArIHBhdGguc2VwIDogJycsXG4gICAgICBqb2JuYW1lOiBqb2JTdGF0ZS5nZXRKb2JOYW1lKCkgfHwgbmFtZSxcbiAgICAgIG5hbWUsXG4gICAgICBleHRcbiAgICB9XG4gICAgY29uc3QgcGF0dGVybnMgPSBqb2JTdGF0ZS5nZXRDbGVhblBhdHRlcm5zKClcblxuICAgIHJldHVybiBwYXR0ZXJucy5tYXAocGF0dGVybiA9PiBwYXRoLm5vcm1hbGl6ZShyZXBsYWNlUHJvcGVydGllc0luU3RyaW5nKHBhdHRlcm4sIHByb3BlcnRpZXMpKSlcbiAgfVxuXG4gIGdldEdlbmVyYXRlZEZpbGVMaXN0IChidWlsZGVyLCBqb2JTdGF0ZSkge1xuICAgIGNvbnN0IHsgZGlyLCBuYW1lIH0gPSBwYXRoLnBhcnNlKGpvYlN0YXRlLmdldEZpbGVQYXRoKCkpXG4gICAgaWYgKCFqb2JTdGF0ZS5nZXRGaWxlRGF0YWJhc2UoKSkge1xuICAgICAgYnVpbGRlci5wYXJzZUxvZ0FuZEZkYkZpbGVzKGpvYlN0YXRlKVxuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm4gPSBwYXRoLnJlc29sdmUoZGlyLCBqb2JTdGF0ZS5nZXRPdXRwdXREaXJlY3RvcnkoKSwgYCR7am9iU3RhdGUuZ2V0Sm9iTmFtZSgpIHx8IG5hbWV9KmApXG4gICAgY29uc3QgZmlsZXMgPSBuZXcgU2V0KGdsb2Iuc3luYyhwYXR0ZXJuKSlcbiAgICBjb25zdCBmZGIgPSBqb2JTdGF0ZS5nZXRGaWxlRGF0YWJhc2UoKVxuXG4gICAgaWYgKGZkYikge1xuICAgICAgY29uc3QgZ2VuZXJhdGVkRmlsZXMgPSBfLmZsYXR0ZW4oXy5tYXAoZmRiLCBzZWN0aW9uID0+IHNlY3Rpb24uZ2VuZXJhdGVkIHx8IFtdKSlcblxuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGdlbmVyYXRlZEZpbGVzKSB7XG4gICAgICAgIGZpbGVzLmFkZChwYXRoLnJlc29sdmUoZGlyLCBmaWxlKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXNcbiAgfVxuXG4gIG1vdmVSZXN1bHQgKGpvYlN0YXRlKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxPdXRwdXRGaWxlUGF0aCA9IGpvYlN0YXRlLmdldE91dHB1dEZpbGVQYXRoKClcbiAgICBjb25zdCBuZXdPdXRwdXRGaWxlUGF0aCA9IHRoaXMuYWx0ZXJQYXJlbnRQYXRoKGpvYlN0YXRlLmdldEZpbGVQYXRoKCksIG9yaWdpbmFsT3V0cHV0RmlsZVBhdGgpXG4gICAgam9iU3RhdGUuc2V0T3V0cHV0RmlsZVBhdGgobmV3T3V0cHV0RmlsZVBhdGgpXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMob3JpZ2luYWxPdXRwdXRGaWxlUGF0aCkpIHtcbiAgICAgIGZzLnJlbW92ZVN5bmMobmV3T3V0cHV0RmlsZVBhdGgpXG4gICAgICBmcy5tb3ZlU3luYyhvcmlnaW5hbE91dHB1dEZpbGVQYXRoLCBuZXdPdXRwdXRGaWxlUGF0aClcbiAgICB9XG5cbiAgICBjb25zdCBvcmlnaW5hbFN5bmNGaWxlUGF0aCA9IG9yaWdpbmFsT3V0cHV0RmlsZVBhdGgucmVwbGFjZSgvXFwucGRmJC8sICcuc3luY3RleC5neicpXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMob3JpZ2luYWxTeW5jRmlsZVBhdGgpKSB7XG4gICAgICBjb25zdCBzeW5jRmlsZVBhdGggPSB0aGlzLmFsdGVyUGFyZW50UGF0aChqb2JTdGF0ZS5nZXRGaWxlUGF0aCgpLCBvcmlnaW5hbFN5bmNGaWxlUGF0aClcbiAgICAgIGZzLnJlbW92ZVN5bmMoc3luY0ZpbGVQYXRoKVxuICAgICAgZnMubW92ZVN5bmMob3JpZ2luYWxTeW5jRmlsZVBhdGgsIHN5bmNGaWxlUGF0aClcbiAgICB9XG4gIH1cblxuICByZXNvbHZlT3V0cHV0RmlsZVBhdGggKGJ1aWxkZXIsIGpvYlN0YXRlKSB7XG4gICAgbGV0IG91dHB1dEZpbGVQYXRoID0gam9iU3RhdGUuZ2V0T3V0cHV0RmlsZVBhdGgoKVxuICAgIGlmIChvdXRwdXRGaWxlUGF0aCkge1xuICAgICAgcmV0dXJuIG91dHB1dEZpbGVQYXRoXG4gICAgfVxuXG4gICAgYnVpbGRlci5wYXJzZUxvZ0FuZEZkYkZpbGVzKGpvYlN0YXRlKVxuICAgIG91dHB1dEZpbGVQYXRoID0gam9iU3RhdGUuZ2V0T3V0cHV0RmlsZVBhdGgoKVxuICAgIGlmICghb3V0cHV0RmlsZVBhdGgpIHtcbiAgICAgIGxhdGV4LmxvZy53YXJuaW5nKCdMb2cgZmlsZSBwYXJzaW5nIGZhaWxlZCEnKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zaG91bGRNb3ZlUmVzdWx0KGpvYlN0YXRlKSkge1xuICAgICAgb3V0cHV0RmlsZVBhdGggPSB0aGlzLmFsdGVyUGFyZW50UGF0aChqb2JTdGF0ZS5nZXRGaWxlUGF0aCgpLCBvdXRwdXRGaWxlUGF0aClcbiAgICAgIGpvYlN0YXRlLnNldE91dHB1dEZpbGVQYXRoKG91dHB1dEZpbGVQYXRoKVxuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXRGaWxlUGF0aFxuICB9XG5cbiAgYXN5bmMgc2hvd1Jlc3VsdCAoam9iU3RhdGUpIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkT3BlblJlc3VsdCgpKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCB7IGZpbGVQYXRoLCBsaW5lTnVtYmVyIH0gPSBnZXRFZGl0b3JEZXRhaWxzKClcbiAgICBhd2FpdCBsYXRleC5vcGVuZXIub3Blbihqb2JTdGF0ZS5nZXRPdXRwdXRGaWxlUGF0aCgpLCBmaWxlUGF0aCwgbGluZU51bWJlcilcbiAgfVxuXG4gIHNob3dFcnJvciAoam9iU3RhdGUpIHtcbiAgICBpZiAoIWpvYlN0YXRlLmdldExvZ01lc3NhZ2VzKCkpIHtcbiAgICAgIGxhdGV4LmxvZy5lcnJvcignUGFyc2luZyBvZiBsb2cgZmlsZXMgZmFpbGVkLicpXG4gICAgfSBlbHNlIGlmICgham9iU3RhdGUuZ2V0T3V0cHV0RmlsZVBhdGgoKSkge1xuICAgICAgbGF0ZXgubG9nLmVycm9yKCdObyBvdXRwdXQgZmlsZSBkZXRlY3RlZC4nKVxuICAgIH1cbiAgfVxuXG4gIGlzVGV4RmlsZSAoZmlsZVBhdGgpIHtcbiAgICAvLyBUT0RPOiBJbXByb3ZlIHdpbGwgc3VmZmljZSBmb3IgdGhlIHRpbWUgYmVpbmcuXG4gICAgcmV0dXJuICFmaWxlUGF0aCB8fCBmaWxlUGF0aC5zZWFyY2goL1xcLih0ZXh8bGhzfFtyc11udykkL2kpID4gMFxuICB9XG5cbiAgYWx0ZXJQYXJlbnRQYXRoICh0YXJnZXRQYXRoLCBvcmlnaW5hbFBhdGgpIHtcbiAgICBjb25zdCB0YXJnZXREaXIgPSBwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aClcbiAgICByZXR1cm4gcGF0aC5qb2luKHRhcmdldERpciwgcGF0aC5iYXNlbmFtZShvcmlnaW5hbFBhdGgpKVxuICB9XG5cbiAgc2hvdWxkTW92ZVJlc3VsdCAoam9iU3RhdGUpIHtcbiAgICByZXR1cm4gam9iU3RhdGUuZ2V0TW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5KCkgJiYgam9iU3RhdGUuZ2V0T3V0cHV0RGlyZWN0b3J5KCkubGVuZ3RoID4gMFxuICB9XG5cbiAgc2hvdWxkT3BlblJlc3VsdCAoKSB7IHJldHVybiBhdG9tLmNvbmZpZy5nZXQoJ2xhdGV4Lm9wZW5SZXN1bHRBZnRlckJ1aWxkJykgfVxufVxuIl19