function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _specHelpers = require('./spec-helpers');

var _specHelpers2 = _interopRequireDefault(_specHelpers);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libWerkzeug = require('../lib/werkzeug');

var _libWerkzeug2 = _interopRequireDefault(_libWerkzeug);

var _libComposer = require('../lib/composer');

var _libComposer2 = _interopRequireDefault(_libComposer);

var _libBuildState = require('../lib/build-state');

var _libBuildState2 = _interopRequireDefault(_libBuildState);

describe('Composer', function () {
  beforeEach(function () {
    waitsForPromise(function () {
      return _specHelpers2['default'].activatePackages();
    });
  });

  describe('build', function () {
    var editor = undefined,
        builder = undefined,
        composer = undefined;

    function initializeSpies(filePath) {
      var jobNames = arguments.length <= 1 || arguments[1] === undefined ? [null] : arguments[1];
      var statusCode = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      editor = jasmine.createSpyObj('MockEditor', ['save', 'isModified']);
      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(function (state) {
        state.setJobNames(jobNames);
      });
      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andReturn({ editor: editor, filePath: filePath });

      builder = jasmine.createSpyObj('MockBuilder', ['run', 'constructArgs', 'parseLogAndFdbFiles']);
      builder.run.andCallFake(function () {
        switch (statusCode) {
          case 0:
            {
              return Promise.resolve(statusCode);
            }
        }

        return Promise.reject(statusCode);
      });
      spyOn(latex.builderRegistry, 'getBuilder').andReturn(builder);
    }

    beforeEach(function () {
      composer = new _libComposer2['default']();
      spyOn(composer, 'showResult').andReturn();
      spyOn(composer, 'showError').andReturn();
    });

    it('does nothing for new, unsaved files', function () {
      initializeSpies(null);

      var result = 'aaaaaaaaaaaa';
      waitsForPromise(function () {
        return composer.build().then(function (r) {
          result = r;
        });
      });

      runs(function () {
        expect(result).toBe(false);
        expect(composer.showResult).not.toHaveBeenCalled();
        expect(composer.showError).not.toHaveBeenCalled();
      });
    });

    it('does nothing for unsupported file extensions', function () {
      initializeSpies('foo.bar');
      latex.builderRegistry.getBuilder.andReturn(null);

      var result = undefined;
      waitsForPromise(function () {
        return composer.build().then(function (r) {
          result = r;
        });
      });

      runs(function () {
        expect(result).toBe(false);
        expect(composer.showResult).not.toHaveBeenCalled();
        expect(composer.showError).not.toHaveBeenCalled();
      });
    });

    it('saves the file before building, if modified', function () {
      initializeSpies('file.tex');
      editor.isModified.andReturn(true);

      builder.parseLogAndFdbFiles.andReturn({
        outputFilePath: 'file.pdf',
        messages: []
      });

      waitsForPromise(function () {
        return composer.build();
      });

      runs(function () {
        expect(editor.isModified).toHaveBeenCalled();
        expect(editor.save).toHaveBeenCalled();
      });
    });

    it('runs the build two times with multiple job names', function () {
      initializeSpies('file.tex', ['foo', 'bar']);

      builder.parseLogAndFdbFiles.andReturn({
        outputFilePath: 'file.pdf',
        messages: []
      });

      waitsForPromise(function () {
        return composer.build();
      });

      runs(function () {
        expect(builder.run.callCount).toBe(2);
      });
    });

    it('invokes `showResult` after a successful build, with expected log parsing result', function () {
      initializeSpies('file.tex');
      builder.parseLogAndFdbFiles.andCallFake(function (state) {
        state.setLogMessages([]);
        state.setOutputFilePath('file.pdf');
      });

      waitsForPromise(function () {
        return composer.build();
      });

      runs(function () {
        expect(composer.showResult).toHaveBeenCalled();
      });
    });

    it('treats missing output file data in log file as an error', function () {
      initializeSpies('file.tex');
      builder.parseLogAndFdbFiles.andCallFake(function (state) {
        state.setLogMessages([]);
      });

      waitsForPromise(function () {
        return composer.build()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(composer.showError).toHaveBeenCalled();
      });
    });

    it('treats missing result from parser as an error', function () {
      initializeSpies('file.tex');
      builder.parseLogAndFdbFiles.andCallFake(function (state) {});

      waitsForPromise(function () {
        return composer.build()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(composer.showError).toHaveBeenCalled();
      });
    });

    it('handles active item not being a text editor', function () {
      spyOn(atom.workspace, 'getActiveTextEditor').andReturn();
      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andCallThrough();

      waitsForPromise(function () {
        return composer.build()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_libWerkzeug2['default'].getEditorDetails).toHaveBeenCalled();
      });
    });
  });

  describe('clean', function () {
    var fixturesPath = undefined,
        composer = undefined;

    function initializeSpies(filePath) {
      var jobNames = arguments.length <= 1 || arguments[1] === undefined ? [null] : arguments[1];

      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(function (state) {
        state.setJobNames(jobNames);
      });
      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andReturn({ filePath: filePath });
      spyOn(composer, 'getGeneratedFileList').andCallFake(function (builder, state) {
        var _path$parse = _path2['default'].parse(state.getFilePath());

        var dir = _path$parse.dir;
        var name = _path$parse.name;

        if (state.getOutputDirectory()) {
          dir = _path2['default'].resolve(dir, state.getOutputDirectory());
        }
        if (state.getJobName()) name = state.getJobName();
        return new Set([_path2['default'].format({ dir: dir, name: name, ext: '.log' }), _path2['default'].format({ dir: dir, name: name, ext: '.aux' })]);
      });
    }

    beforeEach(function () {
      composer = new _libComposer2['default']();
      fixturesPath = _specHelpers2['default'].cloneFixtures();
      spyOn(_fsPlus2['default'], 'removeSync').andCallThrough();
      atom.config.set('latex.cleanPatterns', ['**/*.aux', '/_minted-{jobname}']);
    });

    it('deletes aux file but leaves log file when log file is not in cleanPatterns', function () {
      initializeSpies(_path2['default'].join(fixturesPath, 'foo.tex'));

      waitsForPromise(function () {
        return composer.clean()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(fixturesPath, 'foo.aux'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, '_minted-foo'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, 'foo.log'));
      });
    });

    it('deletes aux file but leaves log file when log file is not in cleanPatterns with output directory', function () {
      var outdir = 'build';
      atom.config.set('latex.outputDirectory', outdir);
      initializeSpies(_path2['default'].join(fixturesPath, 'foo.tex'));

      waitsForPromise(function () {
        return composer.clean()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(fixturesPath, outdir, 'foo.aux'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, '_minted-foo'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, outdir, 'foo.log'));
      });
    });

    it('deletes aux file but leaves log file when log file is not in cleanPatterns with relative output directory', function () {
      var outdir = _path2['default'].join('..', 'build');
      atom.config.set('latex.outputDirectory', outdir);
      initializeSpies(_path2['default'].join(fixturesPath, 'foo.tex'));

      waitsForPromise(function () {
        return composer.clean()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(fixturesPath, outdir, 'foo.aux'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, '_minted-foo'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, outdir, 'foo.log'));
      });
    });

    it('deletes aux file but leaves log file when log file is not in cleanPatterns with absolute output directory', function () {
      var outdir = process.platform === 'win32' ? 'c:\\build' : '/build';
      atom.config.set('latex.outputDirectory', outdir);
      initializeSpies(_path2['default'].join(fixturesPath, 'foo.tex'));

      waitsForPromise(function () {
        return composer.clean()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(outdir, 'foo.aux'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, '_minted-foo'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(outdir, 'foo.log'));
      });
    });

    it('deletes aux files but leaves log files when log file is not in cleanPatterns with jobnames', function () {
      initializeSpies(_path2['default'].join(fixturesPath, 'foo.tex'), ['bar', 'wibble']);

      waitsForPromise(function () {
        return composer.clean()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(fixturesPath, 'bar.aux'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, 'bar.log'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, '_minted-bar'));
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(fixturesPath, 'wibble.aux'));
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalledWith(_path2['default'].join(fixturesPath, 'wibble.log'));
        expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(_path2['default'].join(fixturesPath, '_minted-wibble'));
      });
    });

    it('stops immediately if the file is not a TeX document', function () {
      var filePath = 'foo.bar';
      initializeSpies(filePath, []);

      waitsForPromise(function () {
        return composer.clean()['catch'](function (r) {
          return r;
        });
      });

      runs(function () {
        expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalled();
      });
    });
  });

  describe('shouldMoveResult', function () {
    var composer = undefined,
        state = undefined,
        jobState = undefined;
    var rootFilePath = '/wibble/gronk.tex';

    function initializeSpies() {
      var outputDirectory = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      composer = new _libComposer2['default']();
      state = new _libBuildState2['default'](rootFilePath);
      state.setOutputDirectory(outputDirectory);
      jobState = state.getJobStates()[0];
    }

    it('should return false when using neither an output directory, nor the move option', function () {
      initializeSpies();
      state.setMoveResultToSourceDirectory(false);

      expect(composer.shouldMoveResult(jobState)).toBe(false);
    });

    it('should return false when not using an output directory, but using the move option', function () {
      initializeSpies();
      state.setMoveResultToSourceDirectory(true);

      expect(composer.shouldMoveResult(jobState)).toBe(false);
    });

    it('should return false when not using the move option, but using an output directory', function () {
      initializeSpies('baz');
      state.setMoveResultToSourceDirectory(false);

      expect(composer.shouldMoveResult(jobState)).toBe(false);
    });

    it('should return true when using both an output directory and the move option', function () {
      initializeSpies('baz');
      state.setMoveResultToSourceDirectory(true);

      expect(composer.shouldMoveResult(jobState)).toBe(true);
    });
  });

  describe('sync', function () {
    var composer = undefined;

    beforeEach(function () {
      composer = new _libComposer2['default']();
    });

    it('silently does nothing when the current editor is transient', function () {
      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andReturn({ filePath: null });
      spyOn(composer, 'resolveOutputFilePath').andCallThrough();
      spyOn(latex.opener, 'open').andReturn(true);

      waitsForPromise(function () {
        return composer.sync();
      });

      runs(function () {
        expect(composer.resolveOutputFilePath).not.toHaveBeenCalled();
        expect(latex.opener.open).not.toHaveBeenCalled();
      });
    });

    it('logs a warning and returns when an output file cannot be resolved', function () {
      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andReturn({ filePath: 'file.tex', lineNumber: 1 });
      spyOn(composer, 'resolveOutputFilePath').andReturn();
      spyOn(latex.opener, 'open').andReturn(true);
      spyOn(latex.log, 'warning').andCallThrough();

      waitsForPromise(function () {
        return composer.sync();
      });

      runs(function () {
        expect(latex.log.warning).toHaveBeenCalled();
        expect(latex.opener.open).not.toHaveBeenCalled();
      });
    });

    it('launches the opener using editor metadata and resolved output file', function () {
      var filePath = 'file.tex';
      var lineNumber = 1;
      var outputFilePath = 'file.pdf';
      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andReturn({ filePath: filePath, lineNumber: lineNumber });
      spyOn(composer, 'resolveOutputFilePath').andReturn(outputFilePath);

      spyOn(latex.opener, 'open').andReturn(true);

      waitsForPromise(function () {
        return composer.sync();
      });

      runs(function () {
        expect(latex.opener.open).toHaveBeenCalledWith(outputFilePath, filePath, lineNumber);
      });
    });

    it('launches the opener using editor metadata and resolved output file with jobnames', function () {
      var filePath = 'file.tex';
      var lineNumber = 1;
      var jobNames = ['foo', 'bar'];

      spyOn(_libWerkzeug2['default'], 'getEditorDetails').andReturn({ filePath: filePath, lineNumber: lineNumber });
      spyOn(composer, 'resolveOutputFilePath').andCallFake(function (builder, state) {
        return state.getJobName() + '.pdf';
      });
      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(function (state) {
        state.setJobNames(jobNames);
      });

      spyOn(latex.opener, 'open').andReturn(true);

      waitsForPromise(function () {
        return composer.sync();
      });

      runs(function () {
        expect(latex.opener.open).toHaveBeenCalledWith('foo.pdf', filePath, lineNumber);
        expect(latex.opener.open).toHaveBeenCalledWith('bar.pdf', filePath, lineNumber);
      });
    });
  });

  describe('moveResult', function () {
    var composer = undefined,
        state = undefined,
        jobState = undefined;
    var texFilePath = _path2['default'].normalize('/angle/gronk.tex');
    var outputFilePath = _path2['default'].normalize('/angle/dangle/gronk.pdf');

    beforeEach(function () {
      composer = new _libComposer2['default']();
      state = new _libBuildState2['default'](texFilePath);
      jobState = state.getJobStates()[0];
      jobState.setOutputFilePath(outputFilePath);
      spyOn(_fsPlus2['default'], 'removeSync');
      spyOn(_fsPlus2['default'], 'moveSync');
    });

    it('verifies that the output file and the synctex file are moved when they exist', function () {
      var destOutputFilePath = _path2['default'].normalize('/angle/gronk.pdf');
      var syncTexPath = _path2['default'].normalize('/angle/dangle/gronk.synctex.gz');
      var destSyncTexPath = _path2['default'].normalize('/angle/gronk.synctex.gz');

      spyOn(_fsPlus2['default'], 'existsSync').andReturn(true);

      composer.moveResult(jobState);
      expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(destOutputFilePath);
      expect(_fsPlus2['default'].removeSync).toHaveBeenCalledWith(destSyncTexPath);
      expect(_fsPlus2['default'].moveSync).toHaveBeenCalledWith(outputFilePath, destOutputFilePath);
      expect(_fsPlus2['default'].moveSync).toHaveBeenCalledWith(syncTexPath, destSyncTexPath);
    });

    it('verifies that the output file and the synctex file are not moved when they do not exist', function () {
      spyOn(_fsPlus2['default'], 'existsSync').andReturn(false);

      composer.moveResult(jobState);
      expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalled();
      expect(_fsPlus2['default'].removeSync).not.toHaveBeenCalled();
      expect(_fsPlus2['default'].moveSync).not.toHaveBeenCalled();
      expect(_fsPlus2['default'].moveSync).not.toHaveBeenCalled();
    });
  });

  describe('initializeBuildStateFromProperties', function () {
    var state = undefined,
        composer = undefined;
    var primaryString = 'primary';
    var secondaryString = 'secondary';
    var primaryArray = [primaryString];
    var secondaryArray = [secondaryString];

    beforeEach(function () {
      state = new _libBuildState2['default']('gronk.tex');
      composer = new _libComposer2['default']();
    });

    it('verifies that first level properties override second level properties', function () {
      var properties = {
        cleanPatterns: primaryArray,
        enableExtendedBuildMode: true,
        enableShellEscape: true,
        enableSynctex: true,
        jobNames: primaryArray,
        jobnames: secondaryArray,
        jobname: secondaryString,
        customEngine: primaryString,
        engine: secondaryString,
        program: secondaryString,
        moveResultToSourceDirectory: true,
        outputFormat: primaryString,
        format: secondaryString,
        outputDirectory: primaryString,
        output_directory: secondaryString,
        producer: primaryString
      };

      composer.initializeBuildStateFromProperties(state, properties);

      expect(state.getCleanPatterns()).toEqual(primaryArray, 'cleanPatterns to be set');
      expect(state.getEnableExtendedBuildMode()).toBe(true, 'enableExtendedBuildMode to be set');
      expect(state.getEnableShellEscape()).toBe(true, 'enableShellEscape to be set');
      expect(state.getEnableSynctex()).toBe(true, 'enableSynctex to be set');
      expect(state.getJobNames()).toEqual(primaryArray, 'jobNames to set by jobNames property not by jobnames or jobname property');
      expect(state.getEngine()).toBe(primaryString, 'engine to be set by customEngine property not by engine or program property');
      expect(state.getMoveResultToSourceDirectory()).toBe(true, 'moveResultToSourceDirectory to be set');
      expect(state.getOutputFormat()).toBe(primaryString, 'outputFormat to be set by outputFormat property not by format property');
      expect(state.getOutputDirectory()).toBe(primaryString, 'outputDirectory to be set by outputDirectory property not by output_directory property');
      expect(state.getProducer()).toBe(primaryString, 'producer to be set');
    });

    it('verifies that second level properties override third level properties', function () {
      var properties = {
        jobnames: primaryArray,
        jobname: secondaryString,
        engine: primaryString,
        program: secondaryString,
        format: primaryString,
        output_directory: primaryString
      };

      composer.initializeBuildStateFromProperties(state, properties);

      expect(state.getJobNames()).toEqual(primaryArray, 'jobNames to be set');
      expect(state.getEngine()).toBe(primaryString, 'engine to be set by engine property not by program property');
      expect(state.getOutputFormat()).toBe(primaryString, 'outputFormat to be set');
      expect(state.getOutputDirectory()).toBe(primaryString, 'outputDirectory to be set');
    });

    it('verifies that third level properties are set', function () {
      var properties = {
        jobname: primaryString,
        program: primaryString
      };

      composer.initializeBuildStateFromProperties(state, properties);

      expect(state.getJobNames()).toEqual(primaryArray, 'jobNames to be set');
      expect(state.getEngine()).toBe(primaryString, 'engine to be set');
    });
  });

  describe('initializeBuildStateFromConfig', function () {
    it('verifies that build state loaded from config settings is correct', function () {
      var state = new _libBuildState2['default']('foo.tex');
      var composer = new _libComposer2['default']();
      var outputDirectory = 'build';
      var cleanPatterns = ['**/*.foo'];

      atom.config.set('latex.outputDirectory', outputDirectory);
      atom.config.set('latex.cleanPatterns', cleanPatterns);
      atom.config.set('latex.enableShellEscape', true);

      composer.initializeBuildStateFromConfig(state);

      expect(state.getOutputDirectory()).toEqual(outputDirectory);
      expect(state.getOutputFormat()).toEqual('pdf');
      expect(state.getProducer()).toEqual('dvipdfmx');
      expect(state.getEngine()).toEqual('pdflatex');
      expect(state.getCleanPatterns()).toEqual(cleanPatterns);
      expect(state.getEnableShellEscape()).toBe(true);
      expect(state.getEnableSynctex()).toBe(true);
      expect(state.getEnableExtendedBuildMode()).toBe(true);
      expect(state.getMoveResultToSourceDirectory()).toBe(true);
    });
  });

  describe('initializeBuildStateFromMagic', function () {
    it('detects magic and overrides build state values', function () {
      var filePath = _path2['default'].join(__dirname, 'fixtures', 'magic-comments', 'override-settings.tex');
      var state = new _libBuildState2['default'](filePath);
      var composer = new _libComposer2['default']();

      composer.initializeBuildStateFromMagic(state);

      expect(state.getOutputDirectory()).toEqual('wibble');
      expect(state.getOutputFormat()).toEqual('ps');
      expect(state.getProducer()).toEqual('xdvipdfmx');
      expect(state.getEngine()).toEqual('lualatex');
      expect(state.getJobNames()).toEqual(['foo bar', 'snafu']);
      expect(state.getCleanPatterns()).toEqual(['**/*.quux', 'foo/bar']);
      expect(state.getEnableShellEscape()).toBe(true);
      expect(state.getEnableSynctex()).toBe(true);
      expect(state.getEnableExtendedBuildMode()).toBe(true);
      expect(state.getMoveResultToSourceDirectory()).toBe(true);
    });

    it('detect root magic comment and loads remaining magic comments from root', function () {
      var filePath = _path2['default'].join(__dirname, 'fixtures', 'magic-comments', 'multiple-magic-comments.tex');
      var state = new _libBuildState2['default'](filePath);
      var composer = new _libComposer2['default']();

      composer.initializeBuildStateFromMagic(state);

      expect(state.getEngine()).not.toEqual('lualatex');
    });
  });

  describe('initializeBuild', function () {
    it('verifies that build state is cached and that old cached state is removed', function () {
      var composer = new _libComposer2['default']();
      var fixturesPath = _specHelpers2['default'].cloneFixtures();
      var filePath = _path2['default'].join(fixturesPath, 'file.tex');
      var subFilePath = _path2['default'].join(fixturesPath, 'magic-comments', 'multiple-magic-comments.tex');
      var engine = 'lualatex';

      var build = composer.initializeBuild(subFilePath);
      // Set engine as a flag to indicate the cached state
      build.state.setEngine(engine);
      expect(build.state.getFilePath()).toBe(filePath);
      expect(build.state.hasSubfile(subFilePath)).toBe(true);

      build = composer.initializeBuild(filePath, true);
      expect(build.state.getEngine()).toBe(engine);
      expect(build.state.hasSubfile(subFilePath)).toBe(true);

      build = composer.initializeBuild(filePath);
      expect(build.state.getEngine()).not.toBe(engine);
      expect(build.state.hasSubfile(subFilePath)).toBe(false);
    });

    it('verifies that magic properties override config properties', function () {
      var filePath = _path2['default'].join(__dirname, 'fixtures', 'magic-comments', 'override-settings.tex');
      var composer = new _libComposer2['default']();

      atom.config.set('latex.enableShellEscape', false);
      atom.config.set('latex.enableExtendedBuildMode', false);
      atom.config.set('latex.moveResultToSourceDirectory', false);

      spyOn(composer, 'initializeBuildStateFromSettingsFile').andCallFake(function () {});

      var _composer$initializeBuild = composer.initializeBuild(filePath);

      var state = _composer$initializeBuild.state;

      expect(state.getOutputDirectory()).toEqual('wibble');
      expect(state.getOutputFormat()).toEqual('ps');
      expect(state.getProducer()).toEqual('xdvipdfmx');
      expect(state.getEngine()).toEqual('lualatex');
      expect(state.getJobNames()).toEqual(['foo bar', 'snafu']);
      expect(state.getCleanPatterns()).toEqual(['**/*.quux', 'foo/bar']);
      expect(state.getEnableShellEscape()).toBe(true);
      expect(state.getEnableSynctex()).toBe(true);
      expect(state.getEnableExtendedBuildMode()).toBe(true);
      expect(state.getMoveResultToSourceDirectory()).toBe(true);
    });

    it('verifies that settings file properties override config properties', function () {
      var filePath = _path2['default'].join(__dirname, 'fixtures', 'magic-comments', 'override-settings.tex');
      var composer = new _libComposer2['default']();

      atom.config.set('latex.enableShellEscape', false);
      atom.config.set('latex.enableExtendedBuildMode', false);
      atom.config.set('latex.moveResultToSourceDirectory', false);

      spyOn(composer, 'initializeBuildStateFromMagic').andCallFake(function () {});

      var _composer$initializeBuild2 = composer.initializeBuild(filePath);

      var state = _composer$initializeBuild2.state;

      expect(state.getOutputDirectory()).toEqual('foo');
      expect(state.getOutputFormat()).toEqual('dvi');
      expect(state.getProducer()).toEqual('ps2pdf');
      expect(state.getEngine()).toEqual('xelatex');
      expect(state.getJobNames()).toEqual(['wibble', 'quux']);
      expect(state.getCleanPatterns()).toEqual(['**/*.snafu', 'foo/bar/bax']);
      expect(state.getEnableShellEscape()).toBe(true);
      expect(state.getEnableSynctex()).toBe(true);
      expect(state.getEnableExtendedBuildMode()).toBe(true);
      expect(state.getMoveResultToSourceDirectory()).toBe(true);
    });

    it('verifies that settings file properties override magic properties', function () {
      var filePath = _path2['default'].join(__dirname, 'fixtures', 'magic-comments', 'override-settings.tex');
      var composer = new _libComposer2['default']();

      atom.config.set('latex.enableShellEscape', false);
      atom.config.set('latex.enableExtendedBuildMode', false);
      atom.config.set('latex.moveResultToSourceDirectory', false);

      var _composer$initializeBuild3 = composer.initializeBuild(filePath);

      var state = _composer$initializeBuild3.state;

      expect(state.getOutputDirectory()).toEqual('foo');
      expect(state.getOutputFormat()).toEqual('dvi');
      expect(state.getProducer()).toEqual('ps2pdf');
      expect(state.getEngine()).toEqual('xelatex');
      expect(state.getJobNames()).toEqual(['wibble', 'quux']);
      expect(state.getCleanPatterns()).toEqual(['**/*.snafu', 'foo/bar/bax']);
    });
  });

  describe('resolveOutputFilePath', function () {
    var builder = undefined,
        state = undefined,
        jobState = undefined,
        composer = undefined;

    beforeEach(function () {
      composer = new _libComposer2['default']();
      state = new _libBuildState2['default']('foo.tex');
      jobState = state.getJobStates()[0];
      builder = jasmine.createSpyObj('MockBuilder', ['parseLogAndFdbFiles']);
    });

    it('returns outputFilePath if already set in jobState', function () {
      var outputFilePath = 'foo.pdf';

      jobState.setOutputFilePath(outputFilePath);

      expect(composer.resolveOutputFilePath(builder, jobState)).toEqual(outputFilePath);
    });

    it('returns outputFilePath returned by parseLogAndFdbFiles', function () {
      var outputFilePath = 'foo.pdf';

      builder.parseLogAndFdbFiles.andCallFake(function (state) {
        state.setOutputFilePath(outputFilePath);
      });

      expect(composer.resolveOutputFilePath(builder, jobState)).toEqual(outputFilePath);
    });

    it('returns null returned if parseLogAndFdbFiles fails', function () {
      expect(composer.resolveOutputFilePath(builder, jobState)).toEqual(null);
    });

    it('updates outputFilePath if moveResultToSourceDirectory is set', function () {
      var outputFilePath = 'foo.pdf';
      var outputDirectory = 'bar';

      state.setOutputDirectory(outputDirectory);
      state.setMoveResultToSourceDirectory(true);

      builder.parseLogAndFdbFiles.andCallFake(function (state) {
        state.setOutputFilePath(_path2['default'].join(outputDirectory, outputFilePath));
      });

      expect(composer.resolveOutputFilePath(builder, jobState)).toEqual(outputFilePath);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xhdGV4L3NwZWMvY29tcG9zZXItc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OzJCQUVvQixnQkFBZ0I7Ozs7c0JBQ3JCLFNBQVM7Ozs7b0JBQ1AsTUFBTTs7OzsyQkFDRixpQkFBaUI7Ozs7MkJBQ2pCLGlCQUFpQjs7Ozs2QkFDZixvQkFBb0I7Ozs7QUFFM0MsUUFBUSxDQUFDLFVBQVUsRUFBRSxZQUFNO0FBQ3pCLFlBQVUsQ0FBQyxZQUFNO0FBQ2YsbUJBQWUsQ0FBQzthQUFNLHlCQUFRLGdCQUFnQixFQUFFO0tBQUEsQ0FBQyxDQUFBO0dBQ2xELENBQUMsQ0FBQTs7QUFFRixVQUFRLENBQUMsT0FBTyxFQUFFLFlBQU07QUFDdEIsUUFBSSxNQUFNLFlBQUE7UUFBRSxPQUFPLFlBQUE7UUFBRSxRQUFRLFlBQUEsQ0FBQTs7QUFFN0IsYUFBUyxlQUFlLENBQUUsUUFBUSxFQUFxQztVQUFuQyxRQUFRLHlEQUFHLENBQUMsSUFBSSxDQUFDO1VBQUUsVUFBVSx5REFBRyxDQUFDOztBQUNuRSxZQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQTtBQUNuRSxXQUFLLENBQUMsUUFBUSxFQUFFLCtCQUErQixDQUFDLENBQUMsV0FBVyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3BFLGFBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7T0FDNUIsQ0FBQyxDQUFBO0FBQ0YsV0FBSywyQkFBVyxrQkFBa0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBTixNQUFNLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxDQUFDLENBQUE7O0FBRW5FLGFBQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFBO0FB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QUFNLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtLQUNsRixDQUFDLENBQUE7R0FDSCxDQUFDLENBQUE7Q0FDSCxDQUFDLENBQUEiLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGF0ZXgvc3BlYy9jb21wb3Nlci1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgaGVscGVycyBmcm9tICcuL3NwZWMtaGVscGVycydcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB3ZXJremV1ZyBmcm9tICcuLi9saWIvd2Vya3pldWcnXG5pbXBvcnQgQ29tcG9zZXIgZnJvbSAnLi4vbGliL2NvbXBvc2VyJ1xuaW1wb3J0IEJ1aWxkU3RhdGUgZnJvbSAnLi4vbGliL2J1aWxkLXN0YXRlJ1xuXG5kZXNjcmliZSgnQ29tcG9zZXInLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBoZWxwZXJzLmFjdGl2YXRlUGFja2FnZXMoKSlcbiAgfSlcblxuICBkZXNjcmliZSgnYnVpbGQnLCAoKSA9PiB7XG4gICAgbGV0IGVkaXRvciwgYnVpbGRlciwgY29tcG9zZXJcblxuICAgIGZ1bmN0aW9uIGluaXRpYWxpemVTcGllcyAoZmlsZVBhdGgsIGpvYk5hbWVzID0gW251bGxdLCBzdGF0dXNDb2RlID0gMCkge1xuICAgICAgZWRpdG9yID0gamFzbWluZS5jcmVhdGVTcHlPYmooJ01vY2tFZGl0b3InLCBbJ3NhdmUnLCAnaXNNb2RpZmllZCddKVxuICAgICAgc3B5T24oY29tcG9zZXIsICdpbml0aWFsaXplQnVpbGRTdGF0ZUZyb21NYWdpYycpLmFuZENhbGxGYWtlKHN0YXRlID0+IHtcbiAgICAgICAgc3RhdGUuc2V0Sm9iTmFtZXMoam9iTmFtZXMpXG4gICAgICB9KVxuICAgICAgc3B5T24od2Vya3pldWcsICdnZXRFZGl0b3JEZXRhaWxzJykuYW5kUmV0dXJuKHsgZWRpdG9yLCBmaWxlUGF0aCB9KVxuXG4gICAgICBidWlsZGVyID0gamFzbWluZS5jcmVhdGVTcHlPYmooJ01vY2tCdWlsZGVyJywgWydydW4nLCAnY29uc3RydWN0QXJncycsICdwYXJzZUxvZ0FuZEZkYkZpbGVzJ10pXG4gICAgICBidWlsZGVyLnJ1bi5hbmRDYWxsRmFrZSgoKSA9PiB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzQ29kZSkge1xuICAgICAgICAgIGNhc2UgMDogeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN0YXR1c0NvZGUpIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChzdGF0dXNDb2RlKVxuICAgICAgfSlcbiAgICAgIHNweU9uKGxhdGV4LmJ1aWxkZXJSZWdpc3RyeSwgJ2dldEJ1aWxkZXInKS5hbmRSZXR1cm4oYnVpbGRlcilcbiAgICB9XG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGNvbXBvc2VyID0gbmV3IENvbXBvc2VyKClcbiAgICAgIHNweU9uKGNvbXBvc2VyLCAnc2hvd1Jlc3VsdCcpLmFuZFJldHVybigpXG4gICAgICBzcHlPbihjb21wb3NlciwgJ3Nob3dFcnJvcicpLmFuZFJldHVybigpXG4gICAgfSlcblxuICAgIGl0KCdkb2VzIG5vdGhpbmcgZm9yIG5ldywgdW5zYXZlZCBmaWxlcycsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcyhudWxsKVxuXG4gICAgICBsZXQgcmVzdWx0ID0gJ2FhYWFhYWFhYWFhYSdcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBjb21wb3Nlci5idWlsZCgpLnRoZW4ociA9PiB7IHJlc3VsdCA9IHIgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlKGZhbHNlKVxuICAgICAgICBleHBlY3QoY29tcG9zZXIuc2hvd1Jlc3VsdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoY29tcG9zZXIuc2hvd0Vycm9yKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZG9lcyBub3RoaW5nIGZvciB1bnN1cHBvcnRlZCBmaWxlIGV4dGVuc2lvbnMnLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplU3BpZXMoJ2Zvby5iYXInKVxuICAgICAgbGF0ZXguYnVpbGRlclJlZ2lzdHJ5LmdldEJ1aWxkZXIuYW5kUmV0dXJuKG51bGwpXG5cbiAgICAgIGxldCByZXN1bHRcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBjb21wb3Nlci5idWlsZCgpLnRoZW4ociA9PiB7IHJlc3VsdCA9IHIgfSlcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlKGZhbHNlKVxuICAgICAgICBleHBlY3QoY29tcG9zZXIuc2hvd1Jlc3VsdCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoY29tcG9zZXIuc2hvd0Vycm9yKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2F2ZXMgdGhlIGZpbGUgYmVmb3JlIGJ1aWxkaW5nLCBpZiBtb2RpZmllZCcsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcygnZmlsZS50ZXgnKVxuICAgICAgZWRpdG9yLmlzTW9kaWZpZWQuYW5kUmV0dXJuKHRydWUpXG5cbiAgICAgIGJ1aWxkZXIucGFyc2VMb2dBbmRGZGJGaWxlcy5hbmRSZXR1cm4oe1xuICAgICAgICBvdXRwdXRGaWxlUGF0aDogJ2ZpbGUucGRmJyxcbiAgICAgICAgbWVzc2FnZXM6IFtdXG4gICAgICB9KVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuYnVpbGQoKVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChlZGl0b3IuaXNNb2RpZmllZCkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChlZGl0b3Iuc2F2ZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgncnVucyB0aGUgYnVpbGQgdHdvIHRpbWVzIHdpdGggbXVsdGlwbGUgam9iIG5hbWVzJywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZVNwaWVzKCdmaWxlLnRleCcsIFsnZm9vJywgJ2JhciddKVxuXG4gICAgICBidWlsZGVyLnBhcnNlTG9nQW5kRmRiRmlsZXMuYW5kUmV0dXJuKHtcbiAgICAgICAgb3V0cHV0RmlsZVBhdGg6ICdmaWxlLnBkZicsXG4gICAgICAgIG1lc3NhZ2VzOiBbXVxuICAgICAgfSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbXBvc2VyLmJ1aWxkKClcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnVpbGRlci5ydW4uY2FsbENvdW50KS50b0JlKDIpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnaW52b2tlcyBgc2hvd1Jlc3VsdGAgYWZ0ZXIgYSBzdWNjZXNzZnVsIGJ1aWxkLCB3aXRoIGV4cGVjdGVkIGxvZyBwYXJzaW5nIHJlc3VsdCcsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcygnZmlsZS50ZXgnKVxuICAgICAgYnVpbGRlci5wYXJzZUxvZ0FuZEZkYkZpbGVzLmFuZENhbGxGYWtlKHN0YXRlID0+IHtcbiAgICAgICAgc3RhdGUuc2V0TG9nTWVzc2FnZXMoW10pXG4gICAgICAgIHN0YXRlLnNldE91dHB1dEZpbGVQYXRoKCdmaWxlLnBkZicpXG4gICAgICB9KVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuYnVpbGQoKVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChjb21wb3Nlci5zaG93UmVzdWx0KS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCd0cmVhdHMgbWlzc2luZyBvdXRwdXQgZmlsZSBkYXRhIGluIGxvZyBmaWxlIGFzIGFuIGVycm9yJywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZVNwaWVzKCdmaWxlLnRleCcpXG4gICAgICBidWlsZGVyLnBhcnNlTG9nQW5kRmRiRmlsZXMuYW5kQ2FsbEZha2Uoc3RhdGUgPT4ge1xuICAgICAgICBzdGF0ZS5zZXRMb2dNZXNzYWdlcyhbXSlcbiAgICAgIH0pXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBjb21wb3Nlci5idWlsZCgpLmNhdGNoKHIgPT4gcilcbiAgICAgIH0pXG5cbiAgICAgIHJ1bnMoKCkgPT4ge1xuICAgICAgICBleHBlY3QoY29tcG9zZXIuc2hvd0Vycm9yKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCd0cmVhdHMgbWlzc2luZyByZXN1bHQgZnJvbSBwYXJzZXIgYXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBpbml0aWFsaXplU3BpZXMoJ2ZpbGUudGV4JylcbiAgICAgIGJ1aWxkZXIucGFyc2VMb2dBbmRGZGJGaWxlcy5hbmRDYWxsRmFrZShzdGF0ZSA9PiB7fSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbXBvc2VyLmJ1aWxkKCkuY2F0Y2gociA9PiByKVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChjb21wb3Nlci5zaG93RXJyb3IpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ2hhbmRsZXMgYWN0aXZlIGl0ZW0gbm90IGJlaW5nIGEgdGV4dCBlZGl0b3InLCAoKSA9PiB7XG4gICAgICBzcHlPbihhdG9tLndvcmtzcGFjZSwgJ2dldEFjdGl2ZVRleHRFZGl0b3InKS5hbmRSZXR1cm4oKVxuICAgICAgc3B5T24od2Vya3pldWcsICdnZXRFZGl0b3JEZXRhaWxzJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuYnVpbGQoKS5jYXRjaChyID0+IHIpXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KHdlcmt6ZXVnLmdldEVkaXRvckRldGFpbHMpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdjbGVhbicsICgpID0+IHtcbiAgICBsZXQgZml4dHVyZXNQYXRoLCBjb21wb3NlclxuXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZVNwaWVzIChmaWxlUGF0aCwgam9iTmFtZXMgPSBbbnVsbF0pIHtcbiAgICAgIHNweU9uKGNvbXBvc2VyLCAnaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tTWFnaWMnKS5hbmRDYWxsRmFrZShzdGF0ZSA9PiB7XG4gICAgICAgIHN0YXRlLnNldEpvYk5hbWVzKGpvYk5hbWVzKVxuICAgICAgfSlcbiAgICAgIHNweU9uKHdlcmt6ZXVnLCAnZ2V0RWRpdG9yRGV0YWlscycpLmFuZFJldHVybih7IGZpbGVQYXRoIH0pXG4gICAgICBzcHlPbihjb21wb3NlciwgJ2dldEdlbmVyYXRlZEZpbGVMaXN0JykuYW5kQ2FsbEZha2UoKGJ1aWxkZXIsIHN0YXRlKSA9PiB7XG4gICAgICAgIGxldCB7IGRpciwgbmFtZSB9ID0gcGF0aC5wYXJzZShzdGF0ZS5nZXRGaWxlUGF0aCgpKVxuICAgICAgICBpZiAoc3RhdGUuZ2V0T3V0cHV0RGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBkaXIgPSBwYXRoLnJlc29sdmUoZGlyLCBzdGF0ZS5nZXRPdXRwdXREaXJlY3RvcnkoKSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdGUuZ2V0Sm9iTmFtZSgpKSBuYW1lID0gc3RhdGUuZ2V0Sm9iTmFtZSgpXG4gICAgICAgIHJldHVybiBuZXcgU2V0KFtcbiAgICAgICAgICBwYXRoLmZvcm1hdCh7IGRpciwgbmFtZSwgZXh0OiAnLmxvZycgfSksXG4gICAgICAgICAgcGF0aC5mb3JtYXQoeyBkaXIsIG5hbWUsIGV4dDogJy5hdXgnIH0pXG4gICAgICAgIF0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgY29tcG9zZXIgPSBuZXcgQ29tcG9zZXIoKVxuICAgICAgZml4dHVyZXNQYXRoID0gaGVscGVycy5jbG9uZUZpeHR1cmVzKClcbiAgICAgIHNweU9uKGZzLCAncmVtb3ZlU3luYycpLmFuZENhbGxUaHJvdWdoKClcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXguY2xlYW5QYXR0ZXJucycsIFsnKiovKi5hdXgnLCAnL19taW50ZWQte2pvYm5hbWV9J10pXG4gICAgfSlcblxuICAgIGl0KCdkZWxldGVzIGF1eCBmaWxlIGJ1dCBsZWF2ZXMgbG9nIGZpbGUgd2hlbiBsb2cgZmlsZSBpcyBub3QgaW4gY2xlYW5QYXR0ZXJucycsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcyhwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZm9vLnRleCcpKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuY2xlYW4oKS5jYXRjaChyID0+IHIpXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdmb28uYXV4JykpXG4gICAgICAgIGV4cGVjdChmcy5yZW1vdmVTeW5jKS5ub3QudG9IYXZlQmVlbkNhbGxlZFdpdGgocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ19taW50ZWQtZm9vJykpXG4gICAgICAgIGV4cGVjdChmcy5yZW1vdmVTeW5jKS5ub3QudG9IYXZlQmVlbkNhbGxlZFdpdGgocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2Zvby5sb2cnKSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdkZWxldGVzIGF1eCBmaWxlIGJ1dCBsZWF2ZXMgbG9nIGZpbGUgd2hlbiBsb2cgZmlsZSBpcyBub3QgaW4gY2xlYW5QYXR0ZXJucyB3aXRoIG91dHB1dCBkaXJlY3RvcnknLCAoKSA9PiB7XG4gICAgICBjb25zdCBvdXRkaXIgPSAnYnVpbGQnXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4Lm91dHB1dERpcmVjdG9yeScsIG91dGRpcilcbiAgICAgIGluaXRpYWxpemVTcGllcyhwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZm9vLnRleCcpKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuY2xlYW4oKS5jYXRjaChyID0+IHIpXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsIG91dGRpciwgJ2Zvby5hdXgnKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkV2l0aChwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnX21pbnRlZC1mb28nKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkV2l0aChwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCBvdXRkaXIsICdmb28ubG9nJykpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZGVsZXRlcyBhdXggZmlsZSBidXQgbGVhdmVzIGxvZyBmaWxlIHdoZW4gbG9nIGZpbGUgaXMgbm90IGluIGNsZWFuUGF0dGVybnMgd2l0aCByZWxhdGl2ZSBvdXRwdXQgZGlyZWN0b3J5JywgKCkgPT4ge1xuICAgICAgY29uc3Qgb3V0ZGlyID0gcGF0aC5qb2luKCcuLicsICdidWlsZCcpXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4Lm91dHB1dERpcmVjdG9yeScsIG91dGRpcilcbiAgICAgIGluaXRpYWxpemVTcGllcyhwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZm9vLnRleCcpKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuY2xlYW4oKS5jYXRjaChyID0+IHIpXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsIG91dGRpciwgJ2Zvby5hdXgnKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkV2l0aChwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnX21pbnRlZC1mb28nKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkV2l0aChwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCBvdXRkaXIsICdmb28ubG9nJykpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZGVsZXRlcyBhdXggZmlsZSBidXQgbGVhdmVzIGxvZyBmaWxlIHdoZW4gbG9nIGZpbGUgaXMgbm90IGluIGNsZWFuUGF0dGVybnMgd2l0aCBhYnNvbHV0ZSBvdXRwdXQgZGlyZWN0b3J5JywgKCkgPT4ge1xuICAgICAgY29uc3Qgb3V0ZGlyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/ICdjOlxcXFxidWlsZCcgOiAnL2J1aWxkJ1xuICAgICAgYXRvbS5jb25maWcuc2V0KCdsYXRleC5vdXRwdXREaXJlY3RvcnknLCBvdXRkaXIpXG4gICAgICBpbml0aWFsaXplU3BpZXMocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2Zvby50ZXgnKSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbXBvc2VyLmNsZWFuKCkuY2F0Y2gociA9PiByKVxuICAgICAgfSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChmcy5yZW1vdmVTeW5jKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChwYXRoLmpvaW4ob3V0ZGlyLCAnZm9vLmF1eCcpKVxuICAgICAgICBleHBlY3QoZnMucmVtb3ZlU3luYykubm90LnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdfbWludGVkLWZvbycpKVxuICAgICAgICBleHBlY3QoZnMucmVtb3ZlU3luYykubm90LnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihvdXRkaXIsICdmb28ubG9nJykpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnZGVsZXRlcyBhdXggZmlsZXMgYnV0IGxlYXZlcyBsb2cgZmlsZXMgd2hlbiBsb2cgZmlsZSBpcyBub3QgaW4gY2xlYW5QYXR0ZXJucyB3aXRoIGpvYm5hbWVzJywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZVNwaWVzKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdmb28udGV4JyksIFsnYmFyJywgJ3dpYmJsZSddKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuY2xlYW4oKS5jYXRjaChyID0+IHIpXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdiYXIuYXV4JykpXG4gICAgICAgIGV4cGVjdChmcy5yZW1vdmVTeW5jKS5ub3QudG9IYXZlQmVlbkNhbGxlZFdpdGgocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2Jhci5sb2cnKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkV2l0aChwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnX21pbnRlZC1iYXInKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICd3aWJibGUuYXV4JykpXG4gICAgICAgIGV4cGVjdChmcy5yZW1vdmVTeW5jKS5ub3QudG9IYXZlQmVlbkNhbGxlZFdpdGgocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ3dpYmJsZS5sb2cnKSlcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdfbWludGVkLXdpYmJsZScpKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3N0b3BzIGltbWVkaWF0ZWx5IGlmIHRoZSBmaWxlIGlzIG5vdCBhIFRlWCBkb2N1bWVudCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gJ2Zvby5iYXInXG4gICAgICBpbml0aWFsaXplU3BpZXMoZmlsZVBhdGgsIFtdKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4ge1xuICAgICAgICByZXR1cm4gY29tcG9zZXIuY2xlYW4oKS5jYXRjaChyID0+IHIpXG4gICAgICB9KVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnc2hvdWxkTW92ZVJlc3VsdCcsICgpID0+IHtcbiAgICBsZXQgY29tcG9zZXIsIHN0YXRlLCBqb2JTdGF0ZVxuICAgIGNvbnN0IHJvb3RGaWxlUGF0aCA9ICcvd2liYmxlL2dyb25rLnRleCdcblxuICAgIGZ1bmN0aW9uIGluaXRpYWxpemVTcGllcyAob3V0cHV0RGlyZWN0b3J5ID0gJycpIHtcbiAgICAgIGNvbXBvc2VyID0gbmV3IENvbXBvc2VyKClcbiAgICAgIHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUocm9vdEZpbGVQYXRoKVxuICAgICAgc3RhdGUuc2V0T3V0cHV0RGlyZWN0b3J5KG91dHB1dERpcmVjdG9yeSlcbiAgICAgIGpvYlN0YXRlID0gc3RhdGUuZ2V0Sm9iU3RhdGVzKClbMF1cbiAgICB9XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSB3aGVuIHVzaW5nIG5laXRoZXIgYW4gb3V0cHV0IGRpcmVjdG9yeSwgbm9yIHRoZSBtb3ZlIG9wdGlvbicsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcygpXG4gICAgICBzdGF0ZS5zZXRNb3ZlUmVzdWx0VG9Tb3VyY2VEaXJlY3RvcnkoZmFsc2UpXG5cbiAgICAgIGV4cGVjdChjb21wb3Nlci5zaG91bGRNb3ZlUmVzdWx0KGpvYlN0YXRlKSkudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2Ugd2hlbiBub3QgdXNpbmcgYW4gb3V0cHV0IGRpcmVjdG9yeSwgYnV0IHVzaW5nIHRoZSBtb3ZlIG9wdGlvbicsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcygpXG4gICAgICBzdGF0ZS5zZXRNb3ZlUmVzdWx0VG9Tb3VyY2VEaXJlY3RvcnkodHJ1ZSlcblxuICAgICAgZXhwZWN0KGNvbXBvc2VyLnNob3VsZE1vdmVSZXN1bHQoam9iU3RhdGUpKS50b0JlKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSB3aGVuIG5vdCB1c2luZyB0aGUgbW92ZSBvcHRpb24sIGJ1dCB1c2luZyBhbiBvdXRwdXQgZGlyZWN0b3J5JywgKCkgPT4ge1xuICAgICAgaW5pdGlhbGl6ZVNwaWVzKCdiYXonKVxuICAgICAgc3RhdGUuc2V0TW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5KGZhbHNlKVxuXG4gICAgICBleHBlY3QoY29tcG9zZXIuc2hvdWxkTW92ZVJlc3VsdChqb2JTdGF0ZSkpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB1c2luZyBib3RoIGFuIG91dHB1dCBkaXJlY3RvcnkgYW5kIHRoZSBtb3ZlIG9wdGlvbicsICgpID0+IHtcbiAgICAgIGluaXRpYWxpemVTcGllcygnYmF6JylcbiAgICAgIHN0YXRlLnNldE1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeSh0cnVlKVxuXG4gICAgICBleHBlY3QoY29tcG9zZXIuc2hvdWxkTW92ZVJlc3VsdChqb2JTdGF0ZSkpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdzeW5jJywgKCkgPT4ge1xuICAgIGxldCBjb21wb3NlclxuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBjb21wb3NlciA9IG5ldyBDb21wb3NlcigpXG4gICAgfSlcblxuICAgIGl0KCdzaWxlbnRseSBkb2VzIG5vdGhpbmcgd2hlbiB0aGUgY3VycmVudCBlZGl0b3IgaXMgdHJhbnNpZW50JywgKCkgPT4ge1xuICAgICAgc3B5T24od2Vya3pldWcsICdnZXRFZGl0b3JEZXRhaWxzJykuYW5kUmV0dXJuKHsgZmlsZVBhdGg6IG51bGwgfSlcbiAgICAgIHNweU9uKGNvbXBvc2VyLCAncmVzb2x2ZU91dHB1dEZpbGVQYXRoJykuYW5kQ2FsbFRocm91Z2goKVxuICAgICAgc3B5T24obGF0ZXgub3BlbmVyLCAnb3BlbicpLmFuZFJldHVybih0cnVlKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gY29tcG9zZXIuc3luYygpKVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGNvbXBvc2VyLnJlc29sdmVPdXRwdXRGaWxlUGF0aCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QobGF0ZXgub3BlbmVyLm9wZW4pLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdsb2dzIGEgd2FybmluZyBhbmQgcmV0dXJucyB3aGVuIGFuIG91dHB1dCBmaWxlIGNhbm5vdCBiZSByZXNvbHZlZCcsICgpID0+IHtcbiAgICAgIHNweU9uKHdlcmt6ZXVnLCAnZ2V0RWRpdG9yRGV0YWlscycpLmFuZFJldHVybih7IGZpbGVQYXRoOiAnZmlsZS50ZXgnLCBsaW5lTnVtYmVyOiAxIH0pXG4gICAgICBzcHlPbihjb21wb3NlciwgJ3Jlc29sdmVPdXRwdXRGaWxlUGF0aCcpLmFuZFJldHVybigpXG4gICAgICBzcHlPbihsYXRleC5vcGVuZXIsICdvcGVuJykuYW5kUmV0dXJuKHRydWUpXG4gICAgICBzcHlPbihsYXRleC5sb2csICd3YXJuaW5nJykuYW5kQ2FsbFRocm91Z2goKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gY29tcG9zZXIuc3luYygpKVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGxhdGV4LmxvZy53YXJuaW5nKS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgZXhwZWN0KGxhdGV4Lm9wZW5lci5vcGVuKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnbGF1bmNoZXMgdGhlIG9wZW5lciB1c2luZyBlZGl0b3IgbWV0YWRhdGEgYW5kIHJlc29sdmVkIG91dHB1dCBmaWxlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZVBhdGggPSAnZmlsZS50ZXgnXG4gICAgICBjb25zdCBsaW5lTnVtYmVyID0gMVxuICAgICAgY29uc3Qgb3V0cHV0RmlsZVBhdGggPSAnZmlsZS5wZGYnXG4gICAgICBzcHlPbih3ZXJremV1ZywgJ2dldEVkaXRvckRldGFpbHMnKS5hbmRSZXR1cm4oeyBmaWxlUGF0aCwgbGluZU51bWJlciB9KVxuICAgICAgc3B5T24oY29tcG9zZXIsICdyZXNvbHZlT3V0cHV0RmlsZVBhdGgnKS5hbmRSZXR1cm4ob3V0cHV0RmlsZVBhdGgpXG5cbiAgICAgIHNweU9uKGxhdGV4Lm9wZW5lciwgJ29wZW4nKS5hbmRSZXR1cm4odHJ1ZSlcblxuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IGNvbXBvc2VyLnN5bmMoKSlcblxuICAgICAgcnVucygoKSA9PiB7XG4gICAgICAgIGV4cGVjdChsYXRleC5vcGVuZXIub3BlbikudG9IYXZlQmVlbkNhbGxlZFdpdGgob3V0cHV0RmlsZVBhdGgsIGZpbGVQYXRoLCBsaW5lTnVtYmVyKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ2xhdW5jaGVzIHRoZSBvcGVuZXIgdXNpbmcgZWRpdG9yIG1ldGFkYXRhIGFuZCByZXNvbHZlZCBvdXRwdXQgZmlsZSB3aXRoIGpvYm5hbWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZVBhdGggPSAnZmlsZS50ZXgnXG4gICAgICBjb25zdCBsaW5lTnVtYmVyID0gMVxuICAgICAgY29uc3Qgam9iTmFtZXMgPSBbJ2ZvbycsICdiYXInXVxuXG4gICAgICBzcHlPbih3ZXJremV1ZywgJ2dldEVkaXRvckRldGFpbHMnKS5hbmRSZXR1cm4oeyBmaWxlUGF0aCwgbGluZU51bWJlciB9KVxuICAgICAgc3B5T24oY29tcG9zZXIsICdyZXNvbHZlT3V0cHV0RmlsZVBhdGgnKS5hbmRDYWxsRmFrZSgoYnVpbGRlciwgc3RhdGUpID0+IHN0YXRlLmdldEpvYk5hbWUoKSArICcucGRmJylcbiAgICAgIHNweU9uKGNvbXBvc2VyLCAnaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tTWFnaWMnKS5hbmRDYWxsRmFrZShzdGF0ZSA9PiB7XG4gICAgICAgIHN0YXRlLnNldEpvYk5hbWVzKGpvYk5hbWVzKVxuICAgICAgfSlcblxuICAgICAgc3B5T24obGF0ZXgub3BlbmVyLCAnb3BlbicpLmFuZFJldHVybih0cnVlKVxuXG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gY29tcG9zZXIuc3luYygpKVxuXG4gICAgICBydW5zKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGxhdGV4Lm9wZW5lci5vcGVuKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnZm9vLnBkZicsIGZpbGVQYXRoLCBsaW5lTnVtYmVyKVxuICAgICAgICBleHBlY3QobGF0ZXgub3BlbmVyLm9wZW4pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdiYXIucGRmJywgZmlsZVBhdGgsIGxpbmVOdW1iZXIpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ21vdmVSZXN1bHQnLCAoKSA9PiB7XG4gICAgbGV0IGNvbXBvc2VyLCBzdGF0ZSwgam9iU3RhdGVcbiAgICBjb25zdCB0ZXhGaWxlUGF0aCA9IHBhdGgubm9ybWFsaXplKCcvYW5nbGUvZ3JvbmsudGV4JylcbiAgICBjb25zdCBvdXRwdXRGaWxlUGF0aCA9IHBhdGgubm9ybWFsaXplKCcvYW5nbGUvZGFuZ2xlL2dyb25rLnBkZicpXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGNvbXBvc2VyID0gbmV3IENvbXBvc2VyKClcbiAgICAgIHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUodGV4RmlsZVBhdGgpXG4gICAgICBqb2JTdGF0ZSA9IHN0YXRlLmdldEpvYlN0YXRlcygpWzBdXG4gICAgICBqb2JTdGF0ZS5zZXRPdXRwdXRGaWxlUGF0aChvdXRwdXRGaWxlUGF0aClcbiAgICAgIHNweU9uKGZzLCAncmVtb3ZlU3luYycpXG4gICAgICBzcHlPbihmcywgJ21vdmVTeW5jJylcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgdGhlIG91dHB1dCBmaWxlIGFuZCB0aGUgc3luY3RleCBmaWxlIGFyZSBtb3ZlZCB3aGVuIHRoZXkgZXhpc3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBkZXN0T3V0cHV0RmlsZVBhdGggPSBwYXRoLm5vcm1hbGl6ZSgnL2FuZ2xlL2dyb25rLnBkZicpXG4gICAgICBjb25zdCBzeW5jVGV4UGF0aCA9IHBhdGgubm9ybWFsaXplKCcvYW5nbGUvZGFuZ2xlL2dyb25rLnN5bmN0ZXguZ3onKVxuICAgICAgY29uc3QgZGVzdFN5bmNUZXhQYXRoID0gcGF0aC5ub3JtYWxpemUoJy9hbmdsZS9ncm9uay5zeW5jdGV4Lmd6JylcblxuICAgICAgc3B5T24oZnMsICdleGlzdHNTeW5jJykuYW5kUmV0dXJuKHRydWUpXG5cbiAgICAgIGNvbXBvc2VyLm1vdmVSZXN1bHQoam9iU3RhdGUpXG4gICAgICBleHBlY3QoZnMucmVtb3ZlU3luYykudG9IYXZlQmVlbkNhbGxlZFdpdGgoZGVzdE91dHB1dEZpbGVQYXRoKVxuICAgICAgZXhwZWN0KGZzLnJlbW92ZVN5bmMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKGRlc3RTeW5jVGV4UGF0aClcbiAgICAgIGV4cGVjdChmcy5tb3ZlU3luYykudG9IYXZlQmVlbkNhbGxlZFdpdGgob3V0cHV0RmlsZVBhdGgsIGRlc3RPdXRwdXRGaWxlUGF0aClcbiAgICAgIGV4cGVjdChmcy5tb3ZlU3luYykudG9IYXZlQmVlbkNhbGxlZFdpdGgoc3luY1RleFBhdGgsIGRlc3RTeW5jVGV4UGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgdGhlIG91dHB1dCBmaWxlIGFuZCB0aGUgc3luY3RleCBmaWxlIGFyZSBub3QgbW92ZWQgd2hlbiB0aGV5IGRvIG5vdCBleGlzdCcsICgpID0+IHtcbiAgICAgIHNweU9uKGZzLCAnZXhpc3RzU3luYycpLmFuZFJldHVybihmYWxzZSlcblxuICAgICAgY29tcG9zZXIubW92ZVJlc3VsdChqb2JTdGF0ZSlcbiAgICAgIGV4cGVjdChmcy5yZW1vdmVTeW5jKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3QoZnMucmVtb3ZlU3luYykubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KGZzLm1vdmVTeW5jKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3QoZnMubW92ZVN5bmMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdpbml0aWFsaXplQnVpbGRTdGF0ZUZyb21Qcm9wZXJ0aWVzJywgKCkgPT4ge1xuICAgIGxldCBzdGF0ZSwgY29tcG9zZXJcbiAgICBjb25zdCBwcmltYXJ5U3RyaW5nID0gJ3ByaW1hcnknXG4gICAgY29uc3Qgc2Vjb25kYXJ5U3RyaW5nID0gJ3NlY29uZGFyeSdcbiAgICBjb25zdCBwcmltYXJ5QXJyYXkgPSBbcHJpbWFyeVN0cmluZ11cbiAgICBjb25zdCBzZWNvbmRhcnlBcnJheSA9IFtzZWNvbmRhcnlTdHJpbmddXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ2dyb25rLnRleCcpXG4gICAgICBjb21wb3NlciA9IG5ldyBDb21wb3NlcigpXG4gICAgfSlcblxuICAgIGl0KCd2ZXJpZmllcyB0aGF0IGZpcnN0IGxldmVsIHByb3BlcnRpZXMgb3ZlcnJpZGUgc2Vjb25kIGxldmVsIHByb3BlcnRpZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwcm9wZXJ0aWVzID0ge1xuICAgICAgICBjbGVhblBhdHRlcm5zOiBwcmltYXJ5QXJyYXksXG4gICAgICAgIGVuYWJsZUV4dGVuZGVkQnVpbGRNb2RlOiB0cnVlLFxuICAgICAgICBlbmFibGVTaGVsbEVzY2FwZTogdHJ1ZSxcbiAgICAgICAgZW5hYmxlU3luY3RleDogdHJ1ZSxcbiAgICAgICAgam9iTmFtZXM6IHByaW1hcnlBcnJheSxcbiAgICAgICAgam9ibmFtZXM6IHNlY29uZGFyeUFycmF5LFxuICAgICAgICBqb2JuYW1lOiBzZWNvbmRhcnlTdHJpbmcsXG4gICAgICAgIGN1c3RvbUVuZ2luZTogcHJpbWFyeVN0cmluZyxcbiAgICAgICAgZW5naW5lOiBzZWNvbmRhcnlTdHJpbmcsXG4gICAgICAgIHByb2dyYW06IHNlY29uZGFyeVN0cmluZyxcbiAgICAgICAgbW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5OiB0cnVlLFxuICAgICAgICBvdXRwdXRGb3JtYXQ6IHByaW1hcnlTdHJpbmcsXG4gICAgICAgIGZvcm1hdDogc2Vjb25kYXJ5U3RyaW5nLFxuICAgICAgICBvdXRwdXREaXJlY3Rvcnk6IHByaW1hcnlTdHJpbmcsXG4gICAgICAgIG91dHB1dF9kaXJlY3Rvcnk6IHNlY29uZGFyeVN0cmluZyxcbiAgICAgICAgcHJvZHVjZXI6IHByaW1hcnlTdHJpbmdcbiAgICAgIH1cblxuICAgICAgY29tcG9zZXIuaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tUHJvcGVydGllcyhzdGF0ZSwgcHJvcGVydGllcylcblxuICAgICAgZXhwZWN0KHN0YXRlLmdldENsZWFuUGF0dGVybnMoKSkudG9FcXVhbChwcmltYXJ5QXJyYXksICdjbGVhblBhdHRlcm5zIHRvIGJlIHNldCcpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUoKSkudG9CZSh0cnVlLCAnZW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUgdG8gYmUgc2V0JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmFibGVTaGVsbEVzY2FwZSgpKS50b0JlKHRydWUsICdlbmFibGVTaGVsbEVzY2FwZSB0byBiZSBzZXQnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuYWJsZVN5bmN0ZXgoKSkudG9CZSh0cnVlLCAnZW5hYmxlU3luY3RleCB0byBiZSBzZXQnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEpvYk5hbWVzKCkpLnRvRXF1YWwocHJpbWFyeUFycmF5LCAnam9iTmFtZXMgdG8gc2V0IGJ5IGpvYk5hbWVzIHByb3BlcnR5IG5vdCBieSBqb2JuYW1lcyBvciBqb2JuYW1lIHByb3BlcnR5JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmdpbmUoKSkudG9CZShwcmltYXJ5U3RyaW5nLCAnZW5naW5lIHRvIGJlIHNldCBieSBjdXN0b21FbmdpbmUgcHJvcGVydHkgbm90IGJ5IGVuZ2luZSBvciBwcm9ncmFtIHByb3BlcnR5JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRNb3ZlUmVzdWx0VG9Tb3VyY2VEaXJlY3RvcnkoKSkudG9CZSh0cnVlLCAnbW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5IHRvIGJlIHNldCcpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0T3V0cHV0Rm9ybWF0KCkpLnRvQmUocHJpbWFyeVN0cmluZywgJ291dHB1dEZvcm1hdCB0byBiZSBzZXQgYnkgb3V0cHV0Rm9ybWF0IHByb3BlcnR5IG5vdCBieSBmb3JtYXQgcHJvcGVydHknKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldE91dHB1dERpcmVjdG9yeSgpKS50b0JlKHByaW1hcnlTdHJpbmcsICdvdXRwdXREaXJlY3RvcnkgdG8gYmUgc2V0IGJ5IG91dHB1dERpcmVjdG9yeSBwcm9wZXJ0eSBub3QgYnkgb3V0cHV0X2RpcmVjdG9yeSBwcm9wZXJ0eScpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0UHJvZHVjZXIoKSkudG9CZShwcmltYXJ5U3RyaW5nLCAncHJvZHVjZXIgdG8gYmUgc2V0JylcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgc2Vjb25kIGxldmVsIHByb3BlcnRpZXMgb3ZlcnJpZGUgdGhpcmQgbGV2ZWwgcHJvcGVydGllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7XG4gICAgICAgIGpvYm5hbWVzOiBwcmltYXJ5QXJyYXksXG4gICAgICAgIGpvYm5hbWU6IHNlY29uZGFyeVN0cmluZyxcbiAgICAgICAgZW5naW5lOiBwcmltYXJ5U3RyaW5nLFxuICAgICAgICBwcm9ncmFtOiBzZWNvbmRhcnlTdHJpbmcsXG4gICAgICAgIGZvcm1hdDogcHJpbWFyeVN0cmluZyxcbiAgICAgICAgb3V0cHV0X2RpcmVjdG9yeTogcHJpbWFyeVN0cmluZ1xuICAgICAgfVxuXG4gICAgICBjb21wb3Nlci5pbml0aWFsaXplQnVpbGRTdGF0ZUZyb21Qcm9wZXJ0aWVzKHN0YXRlLCBwcm9wZXJ0aWVzKVxuXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0Sm9iTmFtZXMoKSkudG9FcXVhbChwcmltYXJ5QXJyYXksICdqb2JOYW1lcyB0byBiZSBzZXQnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuZ2luZSgpKS50b0JlKHByaW1hcnlTdHJpbmcsICdlbmdpbmUgdG8gYmUgc2V0IGJ5IGVuZ2luZSBwcm9wZXJ0eSBub3QgYnkgcHJvZ3JhbSBwcm9wZXJ0eScpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0T3V0cHV0Rm9ybWF0KCkpLnRvQmUocHJpbWFyeVN0cmluZywgJ291dHB1dEZvcm1hdCB0byBiZSBzZXQnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldE91dHB1dERpcmVjdG9yeSgpKS50b0JlKHByaW1hcnlTdHJpbmcsICdvdXRwdXREaXJlY3RvcnkgdG8gYmUgc2V0JylcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgdGhpcmQgbGV2ZWwgcHJvcGVydGllcyBhcmUgc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3QgcHJvcGVydGllcyA9IHtcbiAgICAgICAgam9ibmFtZTogcHJpbWFyeVN0cmluZyxcbiAgICAgICAgcHJvZ3JhbTogcHJpbWFyeVN0cmluZ1xuICAgICAgfVxuXG4gICAgICBjb21wb3Nlci5pbml0aWFsaXplQnVpbGRTdGF0ZUZyb21Qcm9wZXJ0aWVzKHN0YXRlLCBwcm9wZXJ0aWVzKVxuXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0Sm9iTmFtZXMoKSkudG9FcXVhbChwcmltYXJ5QXJyYXksICdqb2JOYW1lcyB0byBiZSBzZXQnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuZ2luZSgpKS50b0JlKHByaW1hcnlTdHJpbmcsICdlbmdpbmUgdG8gYmUgc2V0JylcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdpbml0aWFsaXplQnVpbGRTdGF0ZUZyb21Db25maWcnLCAoKSA9PiB7XG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgYnVpbGQgc3RhdGUgbG9hZGVkIGZyb20gY29uZmlnIHNldHRpbmdzIGlzIGNvcnJlY3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IG5ldyBCdWlsZFN0YXRlKCdmb28udGV4JylcbiAgICAgIGNvbnN0IGNvbXBvc2VyID0gbmV3IENvbXBvc2VyKClcbiAgICAgIGNvbnN0IG91dHB1dERpcmVjdG9yeSA9ICdidWlsZCdcbiAgICAgIGNvbnN0IGNsZWFuUGF0dGVybnMgPSBbJyoqLyouZm9vJ11cblxuICAgICAgYXRvbS5jb25maWcuc2V0KCdsYXRleC5vdXRwdXREaXJlY3RvcnknLCBvdXRwdXREaXJlY3RvcnkpXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4LmNsZWFuUGF0dGVybnMnLCBjbGVhblBhdHRlcm5zKVxuICAgICAgYXRvbS5jb25maWcuc2V0KCdsYXRleC5lbmFibGVTaGVsbEVzY2FwZScsIHRydWUpXG5cbiAgICAgIGNvbXBvc2VyLmluaXRpYWxpemVCdWlsZFN0YXRlRnJvbUNvbmZpZyhzdGF0ZSlcblxuICAgICAgZXhwZWN0KHN0YXRlLmdldE91dHB1dERpcmVjdG9yeSgpKS50b0VxdWFsKG91dHB1dERpcmVjdG9yeSlcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRPdXRwdXRGb3JtYXQoKSkudG9FcXVhbCgncGRmJylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRQcm9kdWNlcigpKS50b0VxdWFsKCdkdmlwZGZteCcpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5naW5lKCkpLnRvRXF1YWwoJ3BkZmxhdGV4JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRDbGVhblBhdHRlcm5zKCkpLnRvRXF1YWwoY2xlYW5QYXR0ZXJucylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmFibGVTaGVsbEVzY2FwZSgpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5hYmxlU3luY3RleCgpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUoKSkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldE1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeSgpKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tTWFnaWMnLCAoKSA9PiB7XG4gICAgaXQoJ2RldGVjdHMgbWFnaWMgYW5kIG92ZXJyaWRlcyBidWlsZCBzdGF0ZSB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycsICdtYWdpYy1jb21tZW50cycsICdvdmVycmlkZS1zZXR0aW5ncy50ZXgnKVxuICAgICAgY29uc3Qgc3RhdGUgPSBuZXcgQnVpbGRTdGF0ZShmaWxlUGF0aClcbiAgICAgIGNvbnN0IGNvbXBvc2VyID0gbmV3IENvbXBvc2VyKClcblxuICAgICAgY29tcG9zZXIuaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tTWFnaWMoc3RhdGUpXG5cbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRPdXRwdXREaXJlY3RvcnkoKSkudG9FcXVhbCgnd2liYmxlJylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRPdXRwdXRGb3JtYXQoKSkudG9FcXVhbCgncHMnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldFByb2R1Y2VyKCkpLnRvRXF1YWwoJ3hkdmlwZGZteCcpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5naW5lKCkpLnRvRXF1YWwoJ2x1YWxhdGV4JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRKb2JOYW1lcygpKS50b0VxdWFsKFsnZm9vIGJhcicsICdzbmFmdSddKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldENsZWFuUGF0dGVybnMoKSkudG9FcXVhbChbJyoqLyoucXV1eCcsICdmb28vYmFyJ10pXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5hYmxlU2hlbGxFc2NhcGUoKSkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuYWJsZVN5bmN0ZXgoKSkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuYWJsZUV4dGVuZGVkQnVpbGRNb2RlKCkpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRNb3ZlUmVzdWx0VG9Tb3VyY2VEaXJlY3RvcnkoKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnZGV0ZWN0IHJvb3QgbWFnaWMgY29tbWVudCBhbmQgbG9hZHMgcmVtYWluaW5nIG1hZ2ljIGNvbW1lbnRzIGZyb20gcm9vdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJywgJ21hZ2ljLWNvbW1lbnRzJywgJ211bHRpcGxlLW1hZ2ljLWNvbW1lbnRzLnRleCcpXG4gICAgICBjb25zdCBzdGF0ZSA9IG5ldyBCdWlsZFN0YXRlKGZpbGVQYXRoKVxuICAgICAgY29uc3QgY29tcG9zZXIgPSBuZXcgQ29tcG9zZXIoKVxuXG4gICAgICBjb21wb3Nlci5pbml0aWFsaXplQnVpbGRTdGF0ZUZyb21NYWdpYyhzdGF0ZSlcblxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuZ2luZSgpKS5ub3QudG9FcXVhbCgnbHVhbGF0ZXgnKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2luaXRpYWxpemVCdWlsZCcsICgpID0+IHtcbiAgICBpdCgndmVyaWZpZXMgdGhhdCBidWlsZCBzdGF0ZSBpcyBjYWNoZWQgYW5kIHRoYXQgb2xkIGNhY2hlZCBzdGF0ZSBpcyByZW1vdmVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29tcG9zZXIgPSBuZXcgQ29tcG9zZXIoKVxuICAgICAgY29uc3QgZml4dHVyZXNQYXRoID0gaGVscGVycy5jbG9uZUZpeHR1cmVzKClcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2ZpbGUudGV4JylcbiAgICAgIGNvbnN0IHN1YkZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ21hZ2ljLWNvbW1lbnRzJywgJ211bHRpcGxlLW1hZ2ljLWNvbW1lbnRzLnRleCcpXG4gICAgICBjb25zdCBlbmdpbmUgPSAnbHVhbGF0ZXgnXG5cbiAgICAgIGxldCBidWlsZCA9IGNvbXBvc2VyLmluaXRpYWxpemVCdWlsZChzdWJGaWxlUGF0aClcbiAgICAgIC8vIFNldCBlbmdpbmUgYXMgYSBmbGFnIHRvIGluZGljYXRlIHRoZSBjYWNoZWQgc3RhdGVcbiAgICAgIGJ1aWxkLnN0YXRlLnNldEVuZ2luZShlbmdpbmUpXG4gICAgICBleHBlY3QoYnVpbGQuc3RhdGUuZ2V0RmlsZVBhdGgoKSkudG9CZShmaWxlUGF0aClcbiAgICAgIGV4cGVjdChidWlsZC5zdGF0ZS5oYXNTdWJmaWxlKHN1YkZpbGVQYXRoKSkudG9CZSh0cnVlKVxuXG4gICAgICBidWlsZCA9IGNvbXBvc2VyLmluaXRpYWxpemVCdWlsZChmaWxlUGF0aCwgdHJ1ZSlcbiAgICAgIGV4cGVjdChidWlsZC5zdGF0ZS5nZXRFbmdpbmUoKSkudG9CZShlbmdpbmUpXG4gICAgICBleHBlY3QoYnVpbGQuc3RhdGUuaGFzU3ViZmlsZShzdWJGaWxlUGF0aCkpLnRvQmUodHJ1ZSlcblxuICAgICAgYnVpbGQgPSBjb21wb3Nlci5pbml0aWFsaXplQnVpbGQoZmlsZVBhdGgpXG4gICAgICBleHBlY3QoYnVpbGQuc3RhdGUuZ2V0RW5naW5lKCkpLm5vdC50b0JlKGVuZ2luZSlcbiAgICAgIGV4cGVjdChidWlsZC5zdGF0ZS5oYXNTdWJmaWxlKHN1YkZpbGVQYXRoKSkudG9CZShmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgbWFnaWMgcHJvcGVydGllcyBvdmVycmlkZSBjb25maWcgcHJvcGVydGllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJywgJ21hZ2ljLWNvbW1lbnRzJywgJ292ZXJyaWRlLXNldHRpbmdzLnRleCcpXG4gICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlcigpXG5cbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXguZW5hYmxlU2hlbGxFc2NhcGUnLCBmYWxzZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXguZW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUnLCBmYWxzZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXgubW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5JywgZmFsc2UpXG5cbiAgICAgIHNweU9uKGNvbXBvc2VyLCAnaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tU2V0dGluZ3NGaWxlJykuYW5kQ2FsbEZha2UoKCkgPT4ge30pXG5cbiAgICAgIGNvbnN0IHsgc3RhdGUgfSA9IGNvbXBvc2VyLmluaXRpYWxpemVCdWlsZChmaWxlUGF0aClcblxuICAgICAgZXhwZWN0KHN0YXRlLmdldE91dHB1dERpcmVjdG9yeSgpKS50b0VxdWFsKCd3aWJibGUnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldE91dHB1dEZvcm1hdCgpKS50b0VxdWFsKCdwcycpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0UHJvZHVjZXIoKSkudG9FcXVhbCgneGR2aXBkZm14JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmdpbmUoKSkudG9FcXVhbCgnbHVhbGF0ZXgnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEpvYk5hbWVzKCkpLnRvRXF1YWwoWydmb28gYmFyJywgJ3NuYWZ1J10pXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0Q2xlYW5QYXR0ZXJucygpKS50b0VxdWFsKFsnKiovKi5xdXV4JywgJ2Zvby9iYXInXSlcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmFibGVTaGVsbEVzY2FwZSgpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5hYmxlU3luY3RleCgpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0RW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUoKSkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldE1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeSgpKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCd2ZXJpZmllcyB0aGF0IHNldHRpbmdzIGZpbGUgcHJvcGVydGllcyBvdmVycmlkZSBjb25maWcgcHJvcGVydGllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzJywgJ21hZ2ljLWNvbW1lbnRzJywgJ292ZXJyaWRlLXNldHRpbmdzLnRleCcpXG4gICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlcigpXG5cbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXguZW5hYmxlU2hlbGxFc2NhcGUnLCBmYWxzZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXguZW5hYmxlRXh0ZW5kZWRCdWlsZE1vZGUnLCBmYWxzZSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGF0ZXgubW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5JywgZmFsc2UpXG5cbiAgICAgIHNweU9uKGNvbXBvc2VyLCAnaW5pdGlhbGl6ZUJ1aWxkU3RhdGVGcm9tTWFnaWMnKS5hbmRDYWxsRmFrZSgoKSA9PiB7fSlcblxuICAgICAgY29uc3QgeyBzdGF0ZSB9ID0gY29tcG9zZXIuaW5pdGlhbGl6ZUJ1aWxkKGZpbGVQYXRoKVxuXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0T3V0cHV0RGlyZWN0b3J5KCkpLnRvRXF1YWwoJ2ZvbycpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0T3V0cHV0Rm9ybWF0KCkpLnRvRXF1YWwoJ2R2aScpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0UHJvZHVjZXIoKSkudG9FcXVhbCgncHMycGRmJylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmdpbmUoKSkudG9FcXVhbCgneGVsYXRleCcpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0Sm9iTmFtZXMoKSkudG9FcXVhbChbJ3dpYmJsZScsICdxdXV4J10pXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0Q2xlYW5QYXR0ZXJucygpKS50b0VxdWFsKFsnKiovKi5zbmFmdScsICdmb28vYmFyL2JheCddKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuYWJsZVNoZWxsRXNjYXBlKCkpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmFibGVTeW5jdGV4KCkpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRFbmFibGVFeHRlbmRlZEJ1aWxkTW9kZSgpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qoc3RhdGUuZ2V0TW92ZVJlc3VsdFRvU291cmNlRGlyZWN0b3J5KCkpLnRvQmUodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3ZlcmlmaWVzIHRoYXQgc2V0dGluZ3MgZmlsZSBwcm9wZXJ0aWVzIG92ZXJyaWRlIG1hZ2ljIHByb3BlcnRpZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycsICdtYWdpYy1jb21tZW50cycsICdvdmVycmlkZS1zZXR0aW5ncy50ZXgnKVxuICAgICAgY29uc3QgY29tcG9zZXIgPSBuZXcgQ29tcG9zZXIoKVxuXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4LmVuYWJsZVNoZWxsRXNjYXBlJywgZmFsc2UpXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4LmVuYWJsZUV4dGVuZGVkQnVpbGRNb2RlJywgZmFsc2UpXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xhdGV4Lm1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeScsIGZhbHNlKVxuXG4gICAgICBjb25zdCB7IHN0YXRlIH0gPSBjb21wb3Nlci5pbml0aWFsaXplQnVpbGQoZmlsZVBhdGgpXG5cbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRPdXRwdXREaXJlY3RvcnkoKSkudG9FcXVhbCgnZm9vJylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRPdXRwdXRGb3JtYXQoKSkudG9FcXVhbCgnZHZpJylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRQcm9kdWNlcigpKS50b0VxdWFsKCdwczJwZGYnKVxuICAgICAgZXhwZWN0KHN0YXRlLmdldEVuZ2luZSgpKS50b0VxdWFsKCd4ZWxhdGV4JylcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRKb2JOYW1lcygpKS50b0VxdWFsKFsnd2liYmxlJywgJ3F1dXgnXSlcbiAgICAgIGV4cGVjdChzdGF0ZS5nZXRDbGVhblBhdHRlcm5zKCkpLnRvRXF1YWwoWycqKi8qLnNuYWZ1JywgJ2Zvby9iYXIvYmF4J10pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgncmVzb2x2ZU91dHB1dEZpbGVQYXRoJywgKCkgPT4ge1xuICAgIGxldCBidWlsZGVyLCBzdGF0ZSwgam9iU3RhdGUsIGNvbXBvc2VyXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGNvbXBvc2VyID0gbmV3IENvbXBvc2VyKClcbiAgICAgIHN0YXRlID0gbmV3IEJ1aWxkU3RhdGUoJ2Zvby50ZXgnKVxuICAgICAgam9iU3RhdGUgPSBzdGF0ZS5nZXRKb2JTdGF0ZXMoKVswXVxuICAgICAgYnVpbGRlciA9IGphc21pbmUuY3JlYXRlU3B5T2JqKCdNb2NrQnVpbGRlcicsIFsncGFyc2VMb2dBbmRGZGJGaWxlcyddKVxuICAgIH0pXG5cbiAgICBpdCgncmV0dXJucyBvdXRwdXRGaWxlUGF0aCBpZiBhbHJlYWR5IHNldCBpbiBqb2JTdGF0ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IG91dHB1dEZpbGVQYXRoID0gJ2Zvby5wZGYnXG5cbiAgICAgIGpvYlN0YXRlLnNldE91dHB1dEZpbGVQYXRoKG91dHB1dEZpbGVQYXRoKVxuXG4gICAgICBleHBlY3QoY29tcG9zZXIucmVzb2x2ZU91dHB1dEZpbGVQYXRoKGJ1aWxkZXIsIGpvYlN0YXRlKSkudG9FcXVhbChvdXRwdXRGaWxlUGF0aClcbiAgICB9KVxuXG4gICAgaXQoJ3JldHVybnMgb3V0cHV0RmlsZVBhdGggcmV0dXJuZWQgYnkgcGFyc2VMb2dBbmRGZGJGaWxlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IG91dHB1dEZpbGVQYXRoID0gJ2Zvby5wZGYnXG5cbiAgICAgIGJ1aWxkZXIucGFyc2VMb2dBbmRGZGJGaWxlcy5hbmRDYWxsRmFrZShzdGF0ZSA9PiB7XG4gICAgICAgIHN0YXRlLnNldE91dHB1dEZpbGVQYXRoKG91dHB1dEZpbGVQYXRoKVxuICAgICAgfSlcblxuICAgICAgZXhwZWN0KGNvbXBvc2VyLnJlc29sdmVPdXRwdXRGaWxlUGF0aChidWlsZGVyLCBqb2JTdGF0ZSkpLnRvRXF1YWwob3V0cHV0RmlsZVBhdGgpXG4gICAgfSlcblxuICAgIGl0KCdyZXR1cm5zIG51bGwgcmV0dXJuZWQgaWYgcGFyc2VMb2dBbmRGZGJGaWxlcyBmYWlscycsICgpID0+IHtcbiAgICAgIGV4cGVjdChjb21wb3Nlci5yZXNvbHZlT3V0cHV0RmlsZVBhdGgoYnVpbGRlciwgam9iU3RhdGUpKS50b0VxdWFsKG51bGwpXG4gICAgfSlcblxuICAgIGl0KCd1cGRhdGVzIG91dHB1dEZpbGVQYXRoIGlmIG1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeSBpcyBzZXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvdXRwdXRGaWxlUGF0aCA9ICdmb28ucGRmJ1xuICAgICAgY29uc3Qgb3V0cHV0RGlyZWN0b3J5ID0gJ2JhcidcblxuICAgICAgc3RhdGUuc2V0T3V0cHV0RGlyZWN0b3J5KG91dHB1dERpcmVjdG9yeSlcbiAgICAgIHN0YXRlLnNldE1vdmVSZXN1bHRUb1NvdXJjZURpcmVjdG9yeSh0cnVlKVxuXG4gICAgICBidWlsZGVyLnBhcnNlTG9nQW5kRmRiRmlsZXMuYW5kQ2FsbEZha2Uoc3RhdGUgPT4ge1xuICAgICAgICBzdGF0ZS5zZXRPdXRwdXRGaWxlUGF0aChwYXRoLmpvaW4ob3V0cHV0RGlyZWN0b3J5LCBvdXRwdXRGaWxlUGF0aCkpXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QoY29tcG9zZXIucmVzb2x2ZU91dHB1dEZpbGVQYXRoKGJ1aWxkZXIsIGpvYlN0YXRlKSkudG9FcXVhbChvdXRwdXRGaWxlUGF0aClcbiAgICB9KVxuICB9KVxufSlcbiJdfQ==