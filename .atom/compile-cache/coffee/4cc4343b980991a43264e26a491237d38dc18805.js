(function() {
  var CompositeDisposable, DiffView, Directory, File, FooterView, LoadingView, SplitDiff, StyleCalculator, SyncScroll, configSchema, path, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Directory = ref.Directory, File = ref.File;

  DiffView = require('./diff-view');

  LoadingView = require('./ui/loading-view');

  FooterView = require('./ui/footer-view');

  SyncScroll = require('./sync-scroll');

  StyleCalculator = require('./style-calculator');

  configSchema = require('./config-schema');

  path = require('path');

  module.exports = SplitDiff = {
    diffView: null,
    config: configSchema,
    subscriptions: null,
    editorSubscriptions: null,
    isEnabled: false,
    wasEditor1Created: false,
    wasEditor2Created: false,
    hasGitRepo: false,
    wasTreeViewOpen: false,
    process: null,
    splitDiffResolves: [],
    options: {},
    activate: function(state) {
      var styleCalculator;
      this.contextForService = this;
      styleCalculator = new StyleCalculator(atom.styles, atom.config);
      styleCalculator.startWatching('split-diff-custom-styles', ['split-diff.colors.addedColor', 'split-diff.colors.removedColor'], function(config) {
        var addedColor, addedWordColor, removedColor, removedWordColor;
        addedColor = config.get('split-diff.colors.addedColor');
        addedColor.alpha = 0.4;
        addedWordColor = addedColor;
        addedWordColor.alpha = 0.5;
        removedColor = config.get('split-diff.colors.removedColor');
        removedColor.alpha = 0.4;
        removedWordColor = removedColor;
        removedWordColor.alpha = 0.5;
        return "\n .split-diff-added-custom {\n \tbackground-color: " + (addedColor.toRGBAString()) + ";\n }\n .split-diff-removed-custom {\n \tbackground-color: " + (removedColor.toRGBAString()) + ";\n }\n .split-diff-word-added-custom .region {\n \tbackground-color: " + (addedWordColor.toRGBAString()) + ";\n }\n .split-diff-word-removed-custom .region {\n \tbackground-color: " + (removedWordColor.toRGBAString()) + ";\n }\n";
      });
      this.subscriptions = new CompositeDisposable();
      return this.subscriptions.add(atom.commands.add('atom-workspace, .tree-view .selected, .tab.texteditor', {
        'split-diff:enable': (function(_this) {
          return function(e) {
            _this.diffPanes(e);
            return e.stopPropagation();
          };
        })(this),
        'split-diff:next-diff': (function(_this) {
          return function() {
            if (_this.isEnabled) {
              return _this.nextDiff();
            } else {
              return _this.diffPanes();
            }
          };
        })(this),
        'split-diff:prev-diff': (function(_this) {
          return function() {
            if (_this.isEnabled) {
              return _this.prevDiff();
            } else {
              return _this.diffPanes();
            }
          };
        })(this),
        'split-diff:copy-to-right': (function(_this) {
          return function() {
            if (_this.isEnabled) {
              return _this.copyToRight();
            }
          };
        })(this),
        'split-diff:copy-to-left': (function(_this) {
          return function() {
            if (_this.isEnabled) {
              return _this.copyToLeft();
            }
          };
        })(this),
        'split-diff:disable': (function(_this) {
          return function() {
            return _this.disable();
          };
        })(this),
        'split-diff:ignore-whitespace': (function(_this) {
          return function() {
            return _this.toggleIgnoreWhitespace();
          };
        })(this),
        'split-diff:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this)
      }));
    },
    deactivate: function() {
      this.disable();
      return this.subscriptions.dispose();
    },
    toggle: function() {
      if (this.isEnabled) {
        return this.disable();
      } else {
        return this.diffPanes();
      }
    },
    disable: function() {
      var hideTreeView, ref1;
      this.isEnabled = false;
      if (this.editorSubscriptions != null) {
        this.editorSubscriptions.dispose();
        this.editorSubscriptions = null;
      }
      if (this.diffView != null) {
        if (this.wasEditor1Created) {
          this.diffView.cleanUpEditor(1);
        }
        if (this.wasEditor2Created) {
          this.diffView.cleanUpEditor(2);
        }
        this.diffView.destroy();
        this.diffView = null;
      }
      if (this.footerView != null) {
        this.footerView.destroy();
        this.footerView = null;
      }
      if (this.loadingView != null) {
        this.loadingView.destroy();
        this.loadingView = null;
      }
      if (this.syncScroll != null) {
        this.syncScroll.dispose();
        this.syncScroll = null;
      }
      hideTreeView = (ref1 = this.options.hideTreeView) != null ? ref1 : this._getConfig('hideTreeView');
      if (hideTreeView && this.wasTreeViewOpen) {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');
      }
      this.wasEditor1Created = false;
      this.wasEditor2Created = false;
      this.hasGitRepo = false;
      return this.wasTreeViewOpen = false;
    },
    toggleIgnoreWhitespace: function() {
      var ignoreWhitespace, ref1;
      if (!(this.options.ignoreWhitespace != null)) {
        ignoreWhitespace = this._getConfig('ignoreWhitespace');
        this._setConfig('ignoreWhitespace', !ignoreWhitespace);
        return (ref1 = this.footerView) != null ? ref1.setIgnoreWhitespace(!ignoreWhitespace) : void 0;
      }
    },
    nextDiff: function() {
      var ref1, selectedIndex;
      if (this.diffView != null) {
        selectedIndex = this.diffView.nextDiff();
        return (ref1 = this.footerView) != null ? ref1.showSelectionCount(selectedIndex + 1) : void 0;
      }
    },
    prevDiff: function() {
      var ref1, selectedIndex;
      if (this.diffView != null) {
        selectedIndex = this.diffView.prevDiff();
        return (ref1 = this.footerView) != null ? ref1.showSelectionCount(selectedIndex + 1) : void 0;
      }
    },
    copyToRight: function() {
      var ref1;
      if (this.diffView != null) {
        this.diffView.copyToRight();
        return (ref1 = this.footerView) != null ? ref1.hideSelectionCount() : void 0;
      }
    },
    copyToLeft: function() {
      var ref1;
      if (this.diffView != null) {
        this.diffView.copyToLeft();
        return (ref1 = this.footerView) != null ? ref1.hideSelectionCount() : void 0;
      }
    },
    diffPanes: function(event, editorsPromise, options) {
      var elemWithPath, params;
      if (options == null) {
        options = {};
      }
      this.options = options;
      this.disable();
      this.editorSubscriptions = new CompositeDisposable();
      if (!editorsPromise) {
        if ((event != null ? event.currentTarget.classList.contains('tab') : void 0) || (event != null ? event.currentTarget.classList.contains('file') : void 0)) {
          elemWithPath = event.currentTarget.querySelector('[data-path]');
          params = {};
          if (elemWithPath) {
            params.path = elemWithPath.dataset.path;
          } else if (event.currentTarget.item) {
            params.editor = event.currentTarget.item;
          }
          editorsPromise = this._getEditorsForDiffWithActive(params);
        } else {
          editorsPromise = this._getEditorsForQuickDiff();
        }
      }
      return editorsPromise.then((function(editors) {
        var ignoreWhitespace, ref1;
        if (editors === null) {
          return;
        }
        this._setupVisibleEditors(editors.editor1, editors.editor2);
        this.diffView = new DiffView(editors);
        this.editorSubscriptions.add(editors.editor1.onDidStopChanging((function(_this) {
          return function() {
            return _this.updateDiff(editors);
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor2.onDidStopChanging((function(_this) {
          return function() {
            return _this.updateDiff(editors);
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor1.onDidDestroy((function(_this) {
          return function() {
            return _this.disable();
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor2.onDidDestroy((function(_this) {
          return function() {
            return _this.disable();
          };
        })(this)));
        this.editorSubscriptions.add(atom.config.onDidChange('split-diff', (function(_this) {
          return function() {
            return _this.updateDiff(editors);
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor1.onDidChangeCursorPosition((function(_this) {
          return function(event) {
            return _this.diffView.handleCursorChange(event.cursor, event.oldBufferPosition, event.newBufferPosition);
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor2.onDidChangeCursorPosition((function(_this) {
          return function(event) {
            return _this.diffView.handleCursorChange(event.cursor, event.oldBufferPosition, event.newBufferPosition);
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor1.onDidAddCursor((function(_this) {
          return function(cursor) {
            return _this.diffView.handleCursorChange(cursor, -1, cursor.getBufferPosition());
          };
        })(this)));
        this.editorSubscriptions.add(editors.editor2.onDidAddCursor((function(_this) {
          return function(cursor) {
            return _this.diffView.handleCursorChange(cursor, -1, cursor.getBufferPosition());
          };
        })(this)));
        if (this.footerView == null) {
          ignoreWhitespace = (ref1 = this.options.ignoreWhitespace) != null ? ref1 : this._getConfig('ignoreWhitespace');
          this.footerView = new FooterView(ignoreWhitespace, (this.options.ignoreWhitespace != null));
          this.footerView.createPanel();
        }
        this.footerView.show();
        if (!this.hasGitRepo) {
          this.updateDiff(editors);
        }
        this.editorSubscriptions.add(atom.menu.add([
          {
            'label': 'Packages',
            'submenu': [
              {
                'label': 'Split Diff',
                'submenu': [
                  {
                    'label': 'Ignore Whitespace',
                    'command': 'split-diff:ignore-whitespace'
                  }, {
                    'label': 'Move to Next Diff',
                    'command': 'split-diff:next-diff'
                  }, {
                    'label': 'Move to Previous Diff',
                    'command': 'split-diff:prev-diff'
                  }, {
                    'label': 'Copy to Right',
                    'command': 'split-diff:copy-to-right'
                  }, {
                    'label': 'Copy to Left',
                    'command': 'split-diff:copy-to-left'
                  }
                ]
              }
            ]
          }
        ]));
        return this.editorSubscriptions.add(atom.contextMenu.add({
          'atom-text-editor': [
            {
              'label': 'Split Diff',
              'submenu': [
                {
                  'label': 'Ignore Whitespace',
                  'command': 'split-diff:ignore-whitespace'
                }, {
                  'label': 'Move to Next Diff',
                  'command': 'split-diff:next-diff'
                }, {
                  'label': 'Move to Previous Diff',
                  'command': 'split-diff:prev-diff'
                }, {
                  'label': 'Copy to Right',
                  'command': 'split-diff:copy-to-right'
                }, {
                  'label': 'Copy to Left',
                  'command': 'split-diff:copy-to-left'
                }
              ]
            }
          ]
        }));
      }).bind(this));
    },
    updateDiff: function(editors) {
      var BufferedNodeProcess, args, command, editorPaths, exit, hideTreeView, ignoreWhitespace, ref1, ref2, stderr, stdout, theOutput;
      this.isEnabled = true;
      hideTreeView = (ref1 = this.options.hideTreeView) != null ? ref1 : this._getConfig('hideTreeView');
      if (document.querySelector('.tree-view') && hideTreeView) {
        this.wasTreeViewOpen = true;
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:toggle');
      }
      if (this.process != null) {
        this.process.kill();
        this.process = null;
      }
      ignoreWhitespace = (ref2 = this.options.ignoreWhitespace) != null ? ref2 : this._getConfig('ignoreWhitespace');
      editorPaths = this._createTempFiles(editors);
      if (this.loadingView == null) {
        this.loadingView = new LoadingView();
        this.loadingView.createModal();
      }
      this.loadingView.show();
      BufferedNodeProcess = require('atom').BufferedNodeProcess;
      command = path.resolve(__dirname, "./compute-diff.js");
      args = [editorPaths.editor1Path, editorPaths.editor2Path, ignoreWhitespace];
      theOutput = '';
      stdout = (function(_this) {
        return function(output) {
          var computedDiff, ref3;
          theOutput = output;
          computedDiff = JSON.parse(output);
          _this.process.kill();
          _this.process = null;
          if ((ref3 = _this.loadingView) != null) {
            ref3.hide();
          }
          return _this._resumeUpdateDiff(editors, computedDiff);
        };
      })(this);
      stderr = (function(_this) {
        return function(err) {
          return theOutput = err;
        };
      })(this);
      exit = (function(_this) {
        return function(code) {
          var ref3;
          if ((ref3 = _this.loadingView) != null) {
            ref3.hide();
          }
          if (code !== 0) {
            console.log('BufferedNodeProcess code was ' + code);
            return console.log(theOutput);
          }
        };
      })(this);
      return this.process = new BufferedNodeProcess({
        command: command,
        args: args,
        stdout: stdout,
        stderr: stderr,
        exit: exit
      });
    },
    _resumeUpdateDiff: function(editors, computedDiff) {
      var addedColorSide, diffWords, ignoreWhitespace, overrideThemeColors, ref1, ref2, ref3, ref4, ref5, ref6, ref7, scrollSyncType;
      if (this.diffView == null) {
        return;
      }
      this.diffView.clearDiff();
      if (this.syncScroll != null) {
        this.syncScroll.dispose();
        this.syncScroll = null;
      }
      addedColorSide = (ref1 = this.options.addedColorSide) != null ? ref1 : this._getConfig('colors.addedColorSide');
      diffWords = (ref2 = this.options.diffWords) != null ? ref2 : this._getConfig('diffWords');
      ignoreWhitespace = (ref3 = this.options.ignoreWhitespace) != null ? ref3 : this._getConfig('ignoreWhitespace');
      overrideThemeColors = (ref4 = this.options.overrideThemeColors) != null ? ref4 : this._getConfig('colors.overrideThemeColors');
      this.diffView.displayDiff(computedDiff, addedColorSide, diffWords, ignoreWhitespace, overrideThemeColors);
      while ((ref5 = this.splitDiffResolves) != null ? ref5.length : void 0) {
        this.splitDiffResolves.pop()(this.diffView.getMarkerLayers());
      }
      if ((ref6 = this.footerView) != null) {
        ref6.setNumDifferences(this.diffView.getNumDifferences());
      }
      scrollSyncType = (ref7 = this.options.scrollSyncType) != null ? ref7 : this._getConfig('scrollSyncType');
      if (scrollSyncType === 'Vertical + Horizontal') {
        this.syncScroll = new SyncScroll(editors.editor1, editors.editor2, true);
        return this.syncScroll.syncPositions();
      } else if (scrollSyncType === 'Vertical') {
        this.syncScroll = new SyncScroll(editors.editor1, editors.editor2, false);
        return this.syncScroll.syncPositions();
      }
    },
    _getEditorsForQuickDiff: function() {
      var activeItem, editor1, editor2, j, len, p, panes, rightPaneIndex;
      editor1 = null;
      editor2 = null;
      panes = atom.workspace.getCenter().getPanes();
      for (j = 0, len = panes.length; j < len; j++) {
        p = panes[j];
        activeItem = p.getActiveItem();
        if (atom.workspace.isTextEditor(activeItem)) {
          if (editor1 === null) {
            editor1 = activeItem;
          } else if (editor2 === null) {
            editor2 = activeItem;
            break;
          }
        }
      }
      if (editor1 === null) {
        editor1 = atom.workspace.buildTextEditor({
          autoHeight: false
        });
        this.wasEditor1Created = true;
        panes[0].addItem(editor1);
        panes[0].activateItem(editor1);
      }
      if (editor2 === null) {
        editor2 = atom.workspace.buildTextEditor({
          autoHeight: false
        });
        this.wasEditor2Created = true;
        editor2.setGrammar(editor1.getGrammar());
        rightPaneIndex = panes.indexOf(atom.workspace.paneForItem(editor1)) + 1;
        if (panes[rightPaneIndex]) {
          panes[rightPaneIndex].addItem(editor2);
          panes[rightPaneIndex].activateItem(editor2);
        } else {
          atom.workspace.paneForItem(editor1).splitRight({
            items: [editor2]
          });
        }
      }
      return Promise.resolve({
        editor1: editor1,
        editor2: editor2
      });
    },
    _getEditorsForDiffWithActive: function(params) {
      var activeEditor, editor1, editor2, editor2Promise, editorWithoutPath, filePath, noActiveEditorMsg, panes, rightPane, rightPaneIndex;
      filePath = params.path;
      editorWithoutPath = params.editor;
      activeEditor = atom.workspace.getCenter().getActiveTextEditor();
      if (activeEditor != null) {
        editor1 = activeEditor;
        this.wasEditor2Created = true;
        panes = atom.workspace.getCenter().getPanes();
        rightPaneIndex = panes.indexOf(atom.workspace.paneForItem(editor1)) + 1;
        rightPane = panes[rightPaneIndex] || atom.workspace.paneForItem(editor1).splitRight();
        if (params.path) {
          filePath = params.path;
          if (editor1.getPath() === filePath) {
            filePath = null;
          }
          editor2Promise = atom.workspace.openURIInPane(filePath, rightPane);
          return editor2Promise.then(function(editor2) {
            return {
              editor1: editor1,
              editor2: editor2
            };
          });
        } else if (editorWithoutPath) {
          editor2 = editorWithoutPath.copy();
          rightPane.addItem(editor2);
          return Promise.resolve({
            editor1: editor1,
            editor2: editor2
          });
        }
      } else {
        noActiveEditorMsg = 'No active file found! (Try focusing a text editor)';
        atom.notifications.addWarning('Split Diff', {
          detail: noActiveEditorMsg,
          dismissable: false,
          icon: 'diff'
        });
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    },
    _setupVisibleEditors: function(editor1, editor2) {
      var BufferExtender, buffer1LineEnding, buffer2LineEnding, lineEndingMsg, muteNotifications, ref1, softWrapMsg;
      BufferExtender = require('./buffer-extender');
      buffer1LineEnding = (new BufferExtender(editor1.getBuffer())).getLineEnding();
      if (this.wasEditor2Created) {
        atom.views.getView(editor1).focus();
        if (buffer1LineEnding === '\n' || buffer1LineEnding === '\r\n') {
          this.editorSubscriptions.add(editor2.onWillInsertText(function() {
            return editor2.getBuffer().setPreferredLineEnding(buffer1LineEnding);
          }));
        }
      }
      this._setupGitRepo(editor1, editor2);
      editor1.unfoldAll();
      editor2.unfoldAll();
      muteNotifications = (ref1 = this.options.muteNotifications) != null ? ref1 : this._getConfig('muteNotifications');
      softWrapMsg = 'Warning: Soft wrap enabled! (Line diffs may not align)';
      if (editor1.isSoftWrapped() && !muteNotifications) {
        atom.notifications.addWarning('Split Diff', {
          detail: softWrapMsg,
          dismissable: false,
          icon: 'diff'
        });
      } else if (editor2.isSoftWrapped() && !muteNotifications) {
        atom.notifications.addWarning('Split Diff', {
          detail: softWrapMsg,
          dismissable: false,
          icon: 'diff'
        });
      }
      buffer2LineEnding = (new BufferExtender(editor2.getBuffer())).getLineEnding();
      if (buffer2LineEnding !== '' && (buffer1LineEnding !== buffer2LineEnding) && editor1.getLineCount() !== 1 && editor2.getLineCount() !== 1 && !muteNotifications) {
        lineEndingMsg = 'Warning: Line endings differ!';
        return atom.notifications.addWarning('Split Diff', {
          detail: lineEndingMsg,
          dismissable: false,
          icon: 'diff'
        });
      }
    },
    _setupGitRepo: function(editor1, editor2) {
      var directory, editor1Path, gitHeadText, i, j, len, projectRepo, ref1, relativeEditor1Path, results;
      editor1Path = editor1.getPath();
      if ((editor1Path != null) && (editor2.getLineCount() === 1 && editor2.lineTextForBufferRow(0) === '')) {
        ref1 = atom.project.getDirectories();
        results = [];
        for (i = j = 0, len = ref1.length; j < len; i = ++j) {
          directory = ref1[i];
          if (editor1Path === directory.getPath() || directory.contains(editor1Path)) {
            projectRepo = atom.project.getRepositories()[i];
            if ((projectRepo != null) && (projectRepo.repo != null)) {
              relativeEditor1Path = projectRepo.relativize(editor1Path);
              gitHeadText = projectRepo.repo.getHeadBlob(relativeEditor1Path);
              if (gitHeadText != null) {
                editor2.selectAll();
                editor2.insertText(gitHeadText);
                this.hasGitRepo = true;
                break;
              } else {
                results.push(void 0);
              }
            } else {
              results.push(void 0);
            }
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    },
    _createTempFiles: function(editors) {
      var editor1Path, editor1TempFile, editor2Path, editor2TempFile, editorPaths, tempFolderPath;
      editor1Path = '';
      editor2Path = '';
      tempFolderPath = atom.getConfigDirPath() + '/split-diff';
      editor1Path = tempFolderPath + '/split-diff 1';
      editor1TempFile = new File(editor1Path);
      editor1TempFile.writeSync(editors.editor1.getText());
      editor2Path = tempFolderPath + '/split-diff 2';
      editor2TempFile = new File(editor2Path);
      editor2TempFile.writeSync(editors.editor2.getText());
      editorPaths = {
        editor1Path: editor1Path,
        editor2Path: editor2Path
      };
      return editorPaths;
    },
    _getConfig: function(config) {
      return atom.config.get("split-diff." + config);
    },
    _setConfig: function(config, value) {
      return atom.config.set("split-diff." + config, value);
    },
    getMarkerLayers: function() {
      return new Promise((function(resolve, reject) {
        return this.splitDiffResolves.push(resolve);
      }).bind(this));
    },
    diffEditors: function(editor1, editor2, options) {
      return this.diffPanes(null, Promise.resolve({
        editor1: editor1,
        editor2: editor2
      }), options);
    },
    provideSplitDiff: function() {
      return {
        getMarkerLayers: this.getMarkerLayers.bind(this.contextForService),
        diffEditors: this.diffEditors.bind(this.contextForService),
        disable: this.disable.bind(this.contextForService)
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvc3BsaXQtZGlmZi9saWIvc3BsaXQtZGlmZi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQXlDLE9BQUEsQ0FBUSxNQUFSLENBQXpDLEVBQUMsNkNBQUQsRUFBc0IseUJBQXRCLEVBQWlDOztFQUNqQyxRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsV0FBQSxHQUFjLE9BQUEsQ0FBUSxtQkFBUjs7RUFDZCxVQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztFQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixlQUFBLEdBQWtCLE9BQUEsQ0FBUSxvQkFBUjs7RUFDbEIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQSxHQUNmO0lBQUEsUUFBQSxFQUFVLElBQVY7SUFDQSxNQUFBLEVBQVEsWUFEUjtJQUVBLGFBQUEsRUFBZSxJQUZmO0lBR0EsbUJBQUEsRUFBcUIsSUFIckI7SUFJQSxTQUFBLEVBQVcsS0FKWDtJQUtBLGlCQUFBLEVBQW1CLEtBTG5CO0lBTUEsaUJBQUEsRUFBbUIsS0FObkI7SUFPQSxVQUFBLEVBQVksS0FQWjtJQVFBLGVBQUEsRUFBaUIsS0FSakI7SUFTQSxPQUFBLEVBQVMsSUFUVDtJQVVBLGlCQUFBLEVBQW1CLEVBVm5CO0lBV0EsT0FBQSxFQUFTLEVBWFQ7SUFhQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQUFBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtNQUVyQixlQUFBLEdBQXNCLElBQUEsZUFBQSxDQUFnQixJQUFJLENBQUMsTUFBckIsRUFBNkIsSUFBSSxDQUFDLE1BQWxDO01BQ3RCLGVBQWUsQ0FBQyxhQUFoQixDQUNJLDBCQURKLEVBRUks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SUFBQyxDQUFBLGlCQUFpQixDQUFDLElBQW5CLENBQXdCLE9BQXhCO01BRFcsQ0FBRCxDQUVYLENBQUMsSUFGVSxDQUVMLElBRkssQ0FBUjtJQURXLENBOWRqQjtJQW1lQSxXQUFBLEVBQWEsU0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixPQUFuQjthQUNYLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBWCxFQUFpQixPQUFPLENBQUMsT0FBUixDQUFnQjtRQUFDLE9BQUEsRUFBUyxPQUFWO1FBQW1CLE9BQUEsRUFBUyxPQUE1QjtPQUFoQixDQUFqQixFQUF3RSxPQUF4RTtJQURXLENBbmViO0lBc2VBLGdCQUFBLEVBQWtCLFNBQUE7YUFDaEI7UUFBQSxlQUFBLEVBQWlCLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsSUFBQyxDQUFBLGlCQUF2QixDQUFqQjtRQUNBLFdBQUEsRUFBYSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsSUFBQyxDQUFBLGlCQUFuQixDQURiO1FBRUEsT0FBQSxFQUFTLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQUMsQ0FBQSxpQkFBZixDQUZUOztJQURnQixDQXRlbEI7O0FBVkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlyZWN0b3J5LCBGaWxlfSA9IHJlcXVpcmUgJ2F0b20nXG5EaWZmVmlldyA9IHJlcXVpcmUgJy4vZGlmZi12aWV3J1xuTG9hZGluZ1ZpZXcgPSByZXF1aXJlICcuL3VpL2xvYWRpbmctdmlldydcbkZvb3RlclZpZXcgPSByZXF1aXJlICcuL3VpL2Zvb3Rlci12aWV3J1xuU3luY1Njcm9sbCA9IHJlcXVpcmUgJy4vc3luYy1zY3JvbGwnXG5TdHlsZUNhbGN1bGF0b3IgPSByZXF1aXJlICcuL3N0eWxlLWNhbGN1bGF0b3InXG5jb25maWdTY2hlbWEgPSByZXF1aXJlICcuL2NvbmZpZy1zY2hlbWEnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxpdERpZmYgPVxuICBkaWZmVmlldzogbnVsbFxuICBjb25maWc6IGNvbmZpZ1NjaGVtYVxuICBzdWJzY3JpcHRpb25zOiBudWxsXG4gIGVkaXRvclN1YnNjcmlwdGlvbnM6IG51bGxcbiAgaXNFbmFibGVkOiBmYWxzZVxuICB3YXNFZGl0b3IxQ3JlYXRlZDogZmFsc2VcbiAgd2FzRWRpdG9yMkNyZWF0ZWQ6IGZhbHNlXG4gIGhhc0dpdFJlcG86IGZhbHNlXG4gIHdhc1RyZWVWaWV3T3BlbjogZmFsc2VcbiAgcHJvY2VzczogbnVsbFxuICBzcGxpdERpZmZSZXNvbHZlczogW11cbiAgb3B0aW9uczoge31cblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIEBjb250ZXh0Rm9yU2VydmljZSA9IHRoaXNcblxuICAgIHN0eWxlQ2FsY3VsYXRvciA9IG5ldyBTdHlsZUNhbGN1bGF0b3IoYXRvbS5zdHlsZXMsIGF0b20uY29uZmlnKVxuICAgIHN0eWxlQ2FsY3VsYXRvci5zdGFydFdhdGNoaW5nKFxuICAgICAgICAnc3BsaXQtZGlmZi1jdXN0b20tc3R5bGVzJyxcbiAgICAgICAgWydzcGxpdC1kaWZmLmNvbG9ycy5hZGRlZENvbG9yJywgJ3NwbGl0LWRpZmYuY29sb3JzLnJlbW92ZWRDb2xvciddLFxuICAgICAgICAoY29uZmlnKSAtPlxuICAgICAgICAgIGFkZGVkQ29sb3IgPSBjb25maWcuZ2V0KCdzcGxpdC1kaWZmLmNvbG9ycy5hZGRlZENvbG9yJylcbiAgICAgICAgICBhZGRlZENvbG9yLmFscGhhID0gMC40XG4gICAgICAgICAgYWRkZWRXb3JkQ29sb3IgPSBhZGRlZENvbG9yXG4gICAgICAgICAgYWRkZWRXb3JkQ29sb3IuYWxwaGEgPSAwLjVcbiAgICAgICAgICByZW1vdmVkQ29sb3IgPSBjb25maWcuZ2V0KCdzcGxpdC1kaWZmLmNvbG9ycy5yZW1vdmVkQ29sb3InKVxuICAgICAgICAgIHJlbW92ZWRDb2xvci5hbHBoYSA9IDAuNFxuICAgICAgICAgIHJlbW92ZWRXb3JkQ29sb3IgPSByZW1vdmVkQ29sb3JcbiAgICAgICAgICByZW1vdmVkV29yZENvbG9yLmFscGhhID0gMC41XG4gICAgICAgICAgXCJcXG5cbiAgICAgICAgICAuc3BsaXQtZGlmZi1hZGRlZC1jdXN0b20ge1xcblxuICAgICAgICAgICAgXFx0YmFja2dyb3VuZC1jb2xvcjogI3thZGRlZENvbG9yLnRvUkdCQVN0cmluZygpfTtcXG5cbiAgICAgICAgICB9XFxuXG4gICAgICAgICAgLnNwbGl0LWRpZmYtcmVtb3ZlZC1jdXN0b20ge1xcblxuICAgICAgICAgICAgXFx0YmFja2dyb3VuZC1jb2xvcjogI3tyZW1vdmVkQ29sb3IudG9SR0JBU3RyaW5nKCl9O1xcblxuICAgICAgICAgIH1cXG5cbiAgICAgICAgICAuc3BsaXQtZGlmZi13b3JkLWFkZGVkLWN1c3RvbSAucmVnaW9uIHtcXG5cbiAgICAgICAgICAgIFxcdGJhY2tncm91bmQtY29sb3I6ICN7YWRkZWRXb3JkQ29sb3IudG9SR0JBU3RyaW5nKCl9O1xcblxuICAgICAgICAgIH1cXG5cbiAgICAgICAgICAuc3BsaXQtZGlmZi13b3JkLXJlbW92ZWQtY3VzdG9tIC5yZWdpb24ge1xcblxuICAgICAgICAgICAgXFx0YmFja2dyb3VuZC1jb2xvcjogI3tyZW1vdmVkV29yZENvbG9yLnRvUkdCQVN0cmluZygpfTtcXG5cbiAgICAgICAgICB9XFxuXCJcbiAgICApXG5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlLCAudHJlZS12aWV3IC5zZWxlY3RlZCwgLnRhYi50ZXh0ZWRpdG9yJyxcbiAgICAgICdzcGxpdC1kaWZmOmVuYWJsZSc6IChlKSA9PlxuICAgICAgICBAZGlmZlBhbmVzKGUpXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICdzcGxpdC1kaWZmOm5leHQtZGlmZic6ID0+XG4gICAgICAgIGlmIEBpc0VuYWJsZWRcbiAgICAgICAgICBAbmV4dERpZmYoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGRpZmZQYW5lcygpXG4gICAgICAnc3BsaXQtZGlmZjpwcmV2LWRpZmYnOiA9PlxuICAgICAgICBpZiBAaXNFbmFibGVkXG4gICAgICAgICAgQHByZXZEaWZmKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBkaWZmUGFuZXMoKVxuICAgICAgJ3NwbGl0LWRpZmY6Y29weS10by1yaWdodCc6ID0+XG4gICAgICAgIGlmIEBpc0VuYWJsZWRcbiAgICAgICAgICBAY29weVRvUmlnaHQoKVxuICAgICAgJ3NwbGl0LWRpZmY6Y29weS10by1sZWZ0JzogPT5cbiAgICAgICAgaWYgQGlzRW5hYmxlZFxuICAgICAgICAgIEBjb3B5VG9MZWZ0KClcbiAgICAgICdzcGxpdC1kaWZmOmRpc2FibGUnOiA9PiBAZGlzYWJsZSgpXG4gICAgICAnc3BsaXQtZGlmZjppZ25vcmUtd2hpdGVzcGFjZSc6ID0+IEB0b2dnbGVJZ25vcmVXaGl0ZXNwYWNlKClcbiAgICAgICdzcGxpdC1kaWZmOnRvZ2dsZSc6ID0+IEB0b2dnbGUoKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGRpc2FibGUoKVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gICMgY2FsbGVkIGJ5IFwidG9nZ2xlXCIgY29tbWFuZFxuICAjIHRvZ2dsZXMgc3BsaXQgZGlmZlxuICB0b2dnbGU6ICgpIC0+XG4gICAgaWYgQGlzRW5hYmxlZFxuICAgICAgQGRpc2FibGUoKVxuICAgIGVsc2VcbiAgICAgIEBkaWZmUGFuZXMoKVxuXG4gICMgY2FsbGVkIGJ5IFwiRGlzYWJsZVwiIGNvbW1hbmRcbiAgIyByZW1vdmVzIGRpZmYgYW5kIHN5bmMgc2Nyb2xsLCBkaXNwb3NlcyBvZiBzdWJzY3JpcHRpb25zXG4gIGRpc2FibGU6ICgpIC0+XG4gICAgQGlzRW5hYmxlZCA9IGZhbHNlXG5cbiAgICAjIHJlbW92ZSBsaXN0ZW5lcnNcbiAgICBpZiBAZWRpdG9yU3Vic2NyaXB0aW9ucz9cbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICBpZiBAZGlmZlZpZXc/XG4gICAgICBpZiBAd2FzRWRpdG9yMUNyZWF0ZWRcbiAgICAgICAgQGRpZmZWaWV3LmNsZWFuVXBFZGl0b3IoMSlcbiAgICAgIGlmIEB3YXNFZGl0b3IyQ3JlYXRlZFxuICAgICAgICBAZGlmZlZpZXcuY2xlYW5VcEVkaXRvcigyKVxuICAgICAgQGRpZmZWaWV3LmRlc3Ryb3koKVxuICAgICAgQGRpZmZWaWV3ID0gbnVsbFxuXG4gICAgIyByZW1vdmUgdmlld3NcbiAgICBpZiBAZm9vdGVyVmlldz9cbiAgICAgIEBmb290ZXJWaWV3LmRlc3Ryb3koKVxuICAgICAgQGZvb3RlclZpZXcgPSBudWxsXG4gICAgaWYgQGxvYWRpbmdWaWV3P1xuICAgICAgQGxvYWRpbmdWaWV3LmRlc3Ryb3koKVxuICAgICAgQGxvYWRpbmdWaWV3ID0gbnVsbFxuXG4gICAgaWYgQHN5bmNTY3JvbGw/XG4gICAgICBAc3luY1Njcm9sbC5kaXNwb3NlKClcbiAgICAgIEBzeW5jU2Nyb2xsID0gbnVsbFxuXG4gICAgIyBhdXRvIGhpZGUgdHJlZSB2aWV3IHdoaWxlIGRpZmZpbmcgIzgyXG4gICAgaGlkZVRyZWVWaWV3ID0gQG9wdGlvbnMuaGlkZVRyZWVWaWV3ID8gQF9nZXRDb25maWcoJ2hpZGVUcmVlVmlldycpXG4gICAgaWYgaGlkZVRyZWVWaWV3ICYmIEB3YXNUcmVlVmlld09wZW5cbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ3RyZWUtdmlldzpzaG93JylcblxuICAgICMgcmVzZXQgYWxsIHZhcmlhYmxlc1xuICAgIEB3YXNFZGl0b3IxQ3JlYXRlZCA9IGZhbHNlXG4gICAgQHdhc0VkaXRvcjJDcmVhdGVkID0gZmFsc2VcbiAgICBAaGFzR2l0UmVwbyA9IGZhbHNlXG4gICAgQHdhc1RyZWVWaWV3T3BlbiA9IGZhbHNlXG5cbiAgIyBjYWxsZWQgYnkgXCJ0b2dnbGUgaWdub3JlIHdoaXRlc3BhY2VcIiBjb21tYW5kXG4gIHRvZ2dsZUlnbm9yZVdoaXRlc3BhY2U6IC0+XG4gICAgIyBpZiBpZ25vcmVXaGl0ZXNwYWNlIGlzIG5vdCBiZWluZyBvdmVycmlkZGVuXG4gICAgaWYgIShAb3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlPylcbiAgICAgIGlnbm9yZVdoaXRlc3BhY2UgPSBAX2dldENvbmZpZygnaWdub3JlV2hpdGVzcGFjZScpXG4gICAgICBAX3NldENvbmZpZygnaWdub3JlV2hpdGVzcGFjZScsICFpZ25vcmVXaGl0ZXNwYWNlKVxuICAgICAgQGZvb3RlclZpZXc/LnNldElnbm9yZVdoaXRlc3BhY2UoIWlnbm9yZVdoaXRlc3BhY2UpXG5cbiAgIyBjYWxsZWQgYnkgXCJNb3ZlIHRvIG5leHQgZGlmZlwiIGNvbW1hbmRcbiAgbmV4dERpZmY6IC0+XG4gICAgaWYgQGRpZmZWaWV3P1xuICAgICAgc2VsZWN0ZWRJbmRleCA9IEBkaWZmVmlldy5uZXh0RGlmZigpXG4gICAgICBAZm9vdGVyVmlldz8uc2hvd1NlbGVjdGlvbkNvdW50KCBzZWxlY3RlZEluZGV4ICsgMSApXG5cbiAgIyBjYWxsZWQgYnkgXCJNb3ZlIHRvIHByZXZpb3VzIGRpZmZcIiBjb21tYW5kXG4gIHByZXZEaWZmOiAtPlxuICAgIGlmIEBkaWZmVmlldz9cbiAgICAgIHNlbGVjdGVkSW5kZXggPSBAZGlmZlZpZXcucHJldkRpZmYoKVxuICAgICAgQGZvb3RlclZpZXc/LnNob3dTZWxlY3Rpb25Db3VudCggc2VsZWN0ZWRJbmRleCArIDEgKVxuXG4gICMgY2FsbGVkIGJ5IFwiQ29weSB0byByaWdodFwiIGNvbW1hbmRcbiAgY29weVRvUmlnaHQ6IC0+XG4gICAgaWYgQGRpZmZWaWV3P1xuICAgICAgQGRpZmZWaWV3LmNvcHlUb1JpZ2h0KClcbiAgICAgIEBmb290ZXJWaWV3Py5oaWRlU2VsZWN0aW9uQ291bnQoKVxuXG4gICMgY2FsbGVkIGJ5IFwiQ29weSB0byBsZWZ0XCIgY29tbWFuZFxuICBjb3B5VG9MZWZ0OiAtPlxuICAgIGlmIEBkaWZmVmlldz9cbiAgICAgIEBkaWZmVmlldy5jb3B5VG9MZWZ0KClcbiAgICAgIEBmb290ZXJWaWV3Py5oaWRlU2VsZWN0aW9uQ291bnQoKVxuXG4gICMgY2FsbGVkIGJ5IHRoZSBjb21tYW5kcyBlbmFibGUvdG9nZ2xlIHRvIGRvIGluaXRpYWwgZGlmZlxuICAjIHNldHMgdXAgc3Vic2NyaXB0aW9ucyBmb3IgYXV0byBkaWZmIGFuZCBkaXNhYmxpbmcgd2hlbiBhIHBhbmUgaXMgZGVzdHJveWVkXG4gICMgZXZlbnQgaXMgYW4gb3B0aW9uYWwgYXJndW1lbnQgb2YgYSBmaWxlIHBhdGggdG8gZGlmZiB3aXRoIGN1cnJlbnRcbiAgIyBlZGl0b3JzUHJvbWlzZSBpcyBhbiBvcHRpb25hbCBhcmd1bWVudCBvZiBhIHByb21pc2UgdGhhdCByZXR1cm5zIHdpdGggMiBlZGl0b3JzXG4gICMgb3B0aW9ucyBpcyBhbiBvcHRpb25hbCBhcmd1bWVudCB3aXRoIG9wdGlvbmFsIHByb3BlcnRpZXMgdGhhdCBhcmUgdXNlZCB0byBvdmVycmlkZSB1c2VyJ3Mgc2V0dGluZ3NcbiAgZGlmZlBhbmVzOiAoZXZlbnQsIGVkaXRvcnNQcm9taXNlLCBvcHRpb25zID0ge30pIC0+XG4gICAgQG9wdGlvbnMgPSBvcHRpb25zXG4gICAgIyBpbiBjYXNlIGVuYWJsZSB3YXMgY2FsbGVkIGFnYWluXG4gICAgQGRpc2FibGUoKVxuXG4gICAgQGVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICBpZiAhZWRpdG9yc1Byb21pc2VcbiAgICAgIGlmIGV2ZW50Py5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygndGFiJykgfHwgZXZlbnQ/LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaWxlJylcbiAgICAgICAgZWxlbVdpdGhQYXRoID0gZXZlbnQuY3VycmVudFRhcmdldC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1wYXRoXScpXG4gICAgICAgIHBhcmFtcyA9IHt9XG5cbiAgICAgICAgaWYgZWxlbVdpdGhQYXRoXG4gICAgICAgICAgcGFyYW1zLnBhdGggPSBlbGVtV2l0aFBhdGguZGF0YXNldC5wYXRoXG4gICAgICAgIGVsc2UgaWYgZXZlbnQuY3VycmVudFRhcmdldC5pdGVtXG4gICAgICAgICAgcGFyYW1zLmVkaXRvciA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuaXRlbVxuXG4gICAgICAgIGVkaXRvcnNQcm9taXNlID0gQF9nZXRFZGl0b3JzRm9yRGlmZldpdGhBY3RpdmUocGFyYW1zKVxuICAgICAgZWxzZVxuICAgICAgICBlZGl0b3JzUHJvbWlzZSA9IEBfZ2V0RWRpdG9yc0ZvclF1aWNrRGlmZigpXG5cbiAgICBlZGl0b3JzUHJvbWlzZS50aGVuICgoZWRpdG9ycykgLT5cbiAgICAgIGlmIGVkaXRvcnMgPT0gbnVsbFxuICAgICAgICByZXR1cm5cbiAgICAgIEBfc2V0dXBWaXNpYmxlRWRpdG9ycyhlZGl0b3JzLmVkaXRvcjEsIGVkaXRvcnMuZWRpdG9yMilcbiAgICAgIEBkaWZmVmlldyA9IG5ldyBEaWZmVmlldyhlZGl0b3JzKVxuXG4gICAgICAjIGFkZCBsaXN0ZW5lcnNcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjEub25EaWRTdG9wQ2hhbmdpbmcgPT5cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjIub25EaWRTdG9wQ2hhbmdpbmcgPT5cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjEub25EaWREZXN0cm95ID0+XG4gICAgICAgIEBkaXNhYmxlKClcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjIub25EaWREZXN0cm95ID0+XG4gICAgICAgIEBkaXNhYmxlKClcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnc3BsaXQtZGlmZicsICgpID0+XG4gICAgICAgIEB1cGRhdGVEaWZmKGVkaXRvcnMpXG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQgZWRpdG9ycy5lZGl0b3IxLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gKGV2ZW50KSA9PlxuICAgICAgICBAZGlmZlZpZXcuaGFuZGxlQ3Vyc29yQ2hhbmdlKGV2ZW50LmN1cnNvciwgZXZlbnQub2xkQnVmZmVyUG9zaXRpb24sIGV2ZW50Lm5ld0J1ZmZlclBvc2l0aW9uKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcnMuZWRpdG9yMi5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uIChldmVudCkgPT5cbiAgICAgICAgQGRpZmZWaWV3LmhhbmRsZUN1cnNvckNoYW5nZShldmVudC5jdXJzb3IsIGV2ZW50Lm9sZEJ1ZmZlclBvc2l0aW9uLCBldmVudC5uZXdCdWZmZXJQb3NpdGlvbilcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjEub25EaWRBZGRDdXJzb3IgKGN1cnNvcikgPT5cbiAgICAgICAgQGRpZmZWaWV3LmhhbmRsZUN1cnNvckNoYW5nZShjdXJzb3IsIC0xLCBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjIub25EaWRBZGRDdXJzb3IgKGN1cnNvcikgPT5cbiAgICAgICAgQGRpZmZWaWV3LmhhbmRsZUN1cnNvckNoYW5nZShjdXJzb3IsIC0xLCBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcblxuICAgICAgIyBhZGQgdGhlIGJvdHRvbSBVSSBwYW5lbFxuICAgICAgaWYgIUBmb290ZXJWaWV3P1xuICAgICAgICBpZ25vcmVXaGl0ZXNwYWNlID0gQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSA/IEBfZ2V0Q29uZmlnKCdpZ25vcmVXaGl0ZXNwYWNlJylcbiAgICAgICAgQGZvb3RlclZpZXcgPSBuZXcgRm9vdGVyVmlldyhpZ25vcmVXaGl0ZXNwYWNlLCAoQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZT8pKVxuICAgICAgICBAZm9vdGVyVmlldy5jcmVhdGVQYW5lbCgpXG4gICAgICBAZm9vdGVyVmlldy5zaG93KClcblxuICAgICAgIyB1cGRhdGUgZGlmZiBpZiB0aGVyZSBpcyBubyBnaXQgcmVwbyAobm8gb25jaGFuZ2UgZmlyZWQpXG4gICAgICBpZiAhQGhhc0dpdFJlcG9cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcblxuICAgICAgIyBhZGQgYXBwbGljYXRpb24gbWVudSBpdGVtc1xuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGF0b20ubWVudS5hZGQgW1xuICAgICAgICB7XG4gICAgICAgICAgJ2xhYmVsJzogJ1BhY2thZ2VzJ1xuICAgICAgICAgICdzdWJtZW51JzogW1xuICAgICAgICAgICAgJ2xhYmVsJzogJ1NwbGl0IERpZmYnXG4gICAgICAgICAgICAnc3VibWVudSc6IFtcbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnSWdub3JlIFdoaXRlc3BhY2UnLCAnY29tbWFuZCc6ICdzcGxpdC1kaWZmOmlnbm9yZS13aGl0ZXNwYWNlJyB9XG4gICAgICAgICAgICAgIHsgJ2xhYmVsJzogJ01vdmUgdG8gTmV4dCBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpuZXh0LWRpZmYnIH1cbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnTW92ZSB0byBQcmV2aW91cyBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpwcmV2LWRpZmYnIH1cbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnQ29weSB0byBSaWdodCcsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6Y29weS10by1yaWdodCd9XG4gICAgICAgICAgICAgIHsgJ2xhYmVsJzogJ0NvcHkgdG8gTGVmdCcsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6Y29weS10by1sZWZ0J31cbiAgICAgICAgICAgIF1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbnRleHRNZW51LmFkZCB7XG4gICAgICAgICdhdG9tLXRleHQtZWRpdG9yJzogW3tcbiAgICAgICAgICAnbGFiZWwnOiAnU3BsaXQgRGlmZicsXG4gICAgICAgICAgJ3N1Ym1lbnUnOiBbXG4gICAgICAgICAgICB7ICdsYWJlbCc6ICdJZ25vcmUgV2hpdGVzcGFjZScsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6aWdub3JlLXdoaXRlc3BhY2UnIH1cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ01vdmUgdG8gTmV4dCBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpuZXh0LWRpZmYnIH1cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ01vdmUgdG8gUHJldmlvdXMgRGlmZicsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6cHJldi1kaWZmJyB9XG4gICAgICAgICAgICB7ICdsYWJlbCc6ICdDb3B5IHRvIFJpZ2h0JywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpjb3B5LXRvLXJpZ2h0J31cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ0NvcHkgdG8gTGVmdCcsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6Y29weS10by1sZWZ0J31cbiAgICAgICAgICBdXG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgKS5iaW5kKHRoaXMpICMgbWFrZSBzdXJlIHRoZSBzY29wZSBpcyBjb3JyZWN0XG5cbiAgIyBjYWxsZWQgYnkgYm90aCBkaWZmUGFuZXMgYW5kIHRoZSBlZGl0b3Igc3Vic2NyaXB0aW9uIHRvIHVwZGF0ZSB0aGUgZGlmZlxuICB1cGRhdGVEaWZmOiAoZWRpdG9ycykgLT5cbiAgICBAaXNFbmFibGVkID0gdHJ1ZVxuXG4gICAgIyBhdXRvIGhpZGUgdHJlZSB2aWV3IHdoaWxlIGRpZmZpbmcgIzgyXG4gICAgaGlkZVRyZWVWaWV3ID0gQG9wdGlvbnMuaGlkZVRyZWVWaWV3ID8gQF9nZXRDb25maWcoJ2hpZGVUcmVlVmlldycpXG4gICAgaWYgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRyZWUtdmlldycpICYmIGhpZGVUcmVlVmlld1xuICAgICAgQHdhc1RyZWVWaWV3T3BlbiA9IHRydWVcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ3RyZWUtdmlldzp0b2dnbGUnKVxuXG4gICAgIyBpZiB0aGVyZSBpcyBhIGRpZmYgYmVpbmcgY29tcHV0ZWQgaW4gdGhlIGJhY2tncm91bmQsIGNhbmNlbCBpdFxuICAgIGlmIEBwcm9jZXNzP1xuICAgICAgQHByb2Nlc3Mua2lsbCgpXG4gICAgICBAcHJvY2VzcyA9IG51bGxcblxuICAgIGlnbm9yZVdoaXRlc3BhY2UgPSBAb3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlID8gQF9nZXRDb25maWcoJ2lnbm9yZVdoaXRlc3BhY2UnKVxuICAgIGVkaXRvclBhdGhzID0gQF9jcmVhdGVUZW1wRmlsZXMoZWRpdG9ycylcblxuICAgICMgY3JlYXRlIHRoZSBsb2FkaW5nIHZpZXcgaWYgaXQgZG9lc24ndCBleGlzdCB5ZXRcbiAgICBpZiAhQGxvYWRpbmdWaWV3P1xuICAgICAgQGxvYWRpbmdWaWV3ID0gbmV3IExvYWRpbmdWaWV3KClcbiAgICAgIEBsb2FkaW5nVmlldy5jcmVhdGVNb2RhbCgpXG4gICAgQGxvYWRpbmdWaWV3LnNob3coKVxuXG4gICAgIyAtLS0ga2ljayBvZmYgYmFja2dyb3VuZCBwcm9jZXNzIHRvIGNvbXB1dGUgZGlmZiAtLS1cbiAgICB7QnVmZmVyZWROb2RlUHJvY2Vzc30gPSByZXF1aXJlICdhdG9tJ1xuICAgIGNvbW1hbmQgPSBwYXRoLnJlc29sdmUgX19kaXJuYW1lLCBcIi4vY29tcHV0ZS1kaWZmLmpzXCJcbiAgICBhcmdzID0gW2VkaXRvclBhdGhzLmVkaXRvcjFQYXRoLCBlZGl0b3JQYXRocy5lZGl0b3IyUGF0aCwgaWdub3JlV2hpdGVzcGFjZV1cbiAgICB0aGVPdXRwdXQgPSAnJ1xuICAgIHN0ZG91dCA9IChvdXRwdXQpID0+XG4gICAgICB0aGVPdXRwdXQgPSBvdXRwdXRcbiAgICAgIGNvbXB1dGVkRGlmZiA9IEpTT04ucGFyc2Uob3V0cHV0KVxuICAgICAgQHByb2Nlc3Mua2lsbCgpXG4gICAgICBAcHJvY2VzcyA9IG51bGxcbiAgICAgIEBsb2FkaW5nVmlldz8uaGlkZSgpXG4gICAgICBAX3Jlc3VtZVVwZGF0ZURpZmYoZWRpdG9ycywgY29tcHV0ZWREaWZmKVxuICAgIHN0ZGVyciA9IChlcnIpID0+XG4gICAgICB0aGVPdXRwdXQgPSBlcnJcbiAgICBleGl0ID0gKGNvZGUpID0+XG4gICAgICBAbG9hZGluZ1ZpZXc/LmhpZGUoKVxuXG4gICAgICBpZiBjb2RlICE9IDBcbiAgICAgICAgY29uc29sZS5sb2coJ0J1ZmZlcmVkTm9kZVByb2Nlc3MgY29kZSB3YXMgJyArIGNvZGUpXG4gICAgICAgIGNvbnNvbGUubG9nKHRoZU91dHB1dClcbiAgICBAcHJvY2VzcyA9IG5ldyBCdWZmZXJlZE5vZGVQcm9jZXNzKHtjb21tYW5kLCBhcmdzLCBzdGRvdXQsIHN0ZGVyciwgZXhpdH0pXG4gICAgIyAtLS0ga2ljayBvZmYgYmFja2dyb3VuZCBwcm9jZXNzIHRvIGNvbXB1dGUgZGlmZiAtLS1cblxuICAjIHJlc3VtZXMgYWZ0ZXIgdGhlIGNvbXB1dGUgZGlmZiBwcm9jZXNzIHJldHVybnNcbiAgX3Jlc3VtZVVwZGF0ZURpZmY6IChlZGl0b3JzLCBjb21wdXRlZERpZmYpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZGlmZlZpZXc/XG5cbiAgICBAZGlmZlZpZXcuY2xlYXJEaWZmKClcbiAgICBpZiBAc3luY1Njcm9sbD9cbiAgICAgIEBzeW5jU2Nyb2xsLmRpc3Bvc2UoKVxuICAgICAgQHN5bmNTY3JvbGwgPSBudWxsXG5cbiAgICAjIGdyYWIgdGhlIHNldHRpbmdzIGZvciB0aGUgZGlmZlxuICAgIGFkZGVkQ29sb3JTaWRlID0gQG9wdGlvbnMuYWRkZWRDb2xvclNpZGUgPyBAX2dldENvbmZpZygnY29sb3JzLmFkZGVkQ29sb3JTaWRlJylcbiAgICBkaWZmV29yZHMgPSBAb3B0aW9ucy5kaWZmV29yZHMgPyBAX2dldENvbmZpZygnZGlmZldvcmRzJylcbiAgICBpZ25vcmVXaGl0ZXNwYWNlID0gQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSA/IEBfZ2V0Q29uZmlnKCdpZ25vcmVXaGl0ZXNwYWNlJylcbiAgICBvdmVycmlkZVRoZW1lQ29sb3JzID0gQG9wdGlvbnMub3ZlcnJpZGVUaGVtZUNvbG9ycyA/IEBfZ2V0Q29uZmlnKCdjb2xvcnMub3ZlcnJpZGVUaGVtZUNvbG9ycycpXG5cbiAgICBAZGlmZlZpZXcuZGlzcGxheURpZmYoY29tcHV0ZWREaWZmLCBhZGRlZENvbG9yU2lkZSwgZGlmZldvcmRzLCBpZ25vcmVXaGl0ZXNwYWNlLCBvdmVycmlkZVRoZW1lQ29sb3JzKVxuXG4gICAgIyBnaXZlIHRoZSBtYXJrZXIgbGF5ZXJzIHRvIHRob3NlIHJlZ2lzdGVyZWQgd2l0aCB0aGUgc2VydmljZVxuICAgIHdoaWxlIEBzcGxpdERpZmZSZXNvbHZlcz8ubGVuZ3RoXG4gICAgICBAc3BsaXREaWZmUmVzb2x2ZXMucG9wKCkoQGRpZmZWaWV3LmdldE1hcmtlckxheWVycygpKVxuXG4gICAgQGZvb3RlclZpZXc/LnNldE51bURpZmZlcmVuY2VzKEBkaWZmVmlldy5nZXROdW1EaWZmZXJlbmNlcygpKVxuXG4gICAgc2Nyb2xsU3luY1R5cGUgPSBAb3B0aW9ucy5zY3JvbGxTeW5jVHlwZSA/IEBfZ2V0Q29uZmlnKCdzY3JvbGxTeW5jVHlwZScpXG4gICAgaWYgc2Nyb2xsU3luY1R5cGUgPT0gJ1ZlcnRpY2FsICsgSG9yaXpvbnRhbCdcbiAgICAgIEBzeW5jU2Nyb2xsID0gbmV3IFN5bmNTY3JvbGwoZWRpdG9ycy5lZGl0b3IxLCBlZGl0b3JzLmVkaXRvcjIsIHRydWUpXG4gICAgICBAc3luY1Njcm9sbC5zeW5jUG9zaXRpb25zKClcbiAgICBlbHNlIGlmIHNjcm9sbFN5bmNUeXBlID09ICdWZXJ0aWNhbCdcbiAgICAgIEBzeW5jU2Nyb2xsID0gbmV3IFN5bmNTY3JvbGwoZWRpdG9ycy5lZGl0b3IxLCBlZGl0b3JzLmVkaXRvcjIsIGZhbHNlKVxuICAgICAgQHN5bmNTY3JvbGwuc3luY1Bvc2l0aW9ucygpXG5cbiAgIyBHZXRzIHRoZSBmaXJzdCB0d28gdmlzaWJsZSBlZGl0b3JzIGZvdW5kIG9yIGNyZWF0ZXMgdGhlbSBhcyBuZWVkZWQuXG4gICMgUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggeWllbGRzIGEgdmFsdWUgb2Yge2VkaXRvcjE6IFRleHRFZGl0b3IsIGVkaXRvcjI6IFRleHRFZGl0b3J9XG4gIF9nZXRFZGl0b3JzRm9yUXVpY2tEaWZmOiAoKSAtPlxuICAgIGVkaXRvcjEgPSBudWxsXG4gICAgZWRpdG9yMiA9IG51bGxcblxuICAgICMgdHJ5IHRvIGZpbmQgdGhlIGZpcnN0IHR3byBlZGl0b3JzXG4gICAgcGFuZXMgPSBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRQYW5lcygpXG4gICAgZm9yIHAgaW4gcGFuZXNcbiAgICAgIGFjdGl2ZUl0ZW0gPSBwLmdldEFjdGl2ZUl0ZW0oKVxuICAgICAgaWYgYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGFjdGl2ZUl0ZW0pXG4gICAgICAgIGlmIGVkaXRvcjEgPT0gbnVsbFxuICAgICAgICAgIGVkaXRvcjEgPSBhY3RpdmVJdGVtXG4gICAgICAgIGVsc2UgaWYgZWRpdG9yMiA9PSBudWxsXG4gICAgICAgICAgZWRpdG9yMiA9IGFjdGl2ZUl0ZW1cbiAgICAgICAgICBicmVha1xuXG4gICAgIyBhdXRvIG9wZW4gZWRpdG9yIHBhbmVzIHNvIHdlIGhhdmUgdHdvIHRvIGRpZmYgd2l0aFxuICAgIGlmIGVkaXRvcjEgPT0gbnVsbFxuICAgICAgZWRpdG9yMSA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcih7YXV0b0hlaWdodDogZmFsc2V9KVxuICAgICAgQHdhc0VkaXRvcjFDcmVhdGVkID0gdHJ1ZVxuICAgICAgIyBhZGQgZmlyc3QgZWRpdG9yIHRvIHRoZSBmaXJzdCBwYW5lXG4gICAgICBwYW5lc1swXS5hZGRJdGVtKGVkaXRvcjEpXG4gICAgICBwYW5lc1swXS5hY3RpdmF0ZUl0ZW0oZWRpdG9yMSlcbiAgICBpZiBlZGl0b3IyID09IG51bGxcbiAgICAgIGVkaXRvcjIgPSBhdG9tLndvcmtzcGFjZS5idWlsZFRleHRFZGl0b3Ioe2F1dG9IZWlnaHQ6IGZhbHNlfSlcbiAgICAgIEB3YXNFZGl0b3IyQ3JlYXRlZCA9IHRydWVcbiAgICAgIGVkaXRvcjIuc2V0R3JhbW1hcihlZGl0b3IxLmdldEdyYW1tYXIoKSlcbiAgICAgIHJpZ2h0UGFuZUluZGV4ID0gcGFuZXMuaW5kZXhPZihhdG9tLndvcmtzcGFjZS5wYW5lRm9ySXRlbShlZGl0b3IxKSkgKyAxXG4gICAgICBpZiBwYW5lc1tyaWdodFBhbmVJbmRleF1cbiAgICAgICAgIyBhZGQgc2Vjb25kIGVkaXRvciB0byBleGlzdGluZyBwYW5lIHRvIHRoZSByaWdodCBvZiBmaXJzdCBlZGl0b3JcbiAgICAgICAgcGFuZXNbcmlnaHRQYW5lSW5kZXhdLmFkZEl0ZW0oZWRpdG9yMilcbiAgICAgICAgcGFuZXNbcmlnaHRQYW5lSW5kZXhdLmFjdGl2YXRlSXRlbShlZGl0b3IyKVxuICAgICAgZWxzZVxuICAgICAgICAjIG5vIGV4aXN0aW5nIHBhbmUgc28gc3BsaXQgcmlnaHRcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yMSkuc3BsaXRSaWdodCh7aXRlbXM6IFtlZGl0b3IyXX0pXG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtlZGl0b3IxOiBlZGl0b3IxLCBlZGl0b3IyOiBlZGl0b3IyfSlcblxuICAjIEdldHMgdGhlIGFjdGl2ZSBlZGl0b3IgYW5kIG9wZW5zIHRoZSBzcGVjaWZpZWQgZmlsZSB0byB0aGUgcmlnaHQgb2YgaXRcbiAgIyBSZXR1cm5zIGEgUHJvbWlzZSB3aGljaCB5aWVsZHMgYSB2YWx1ZSBvZiB7ZWRpdG9yMTogVGV4dEVkaXRvciwgZWRpdG9yMjogVGV4dEVkaXRvcn1cbiAgX2dldEVkaXRvcnNGb3JEaWZmV2l0aEFjdGl2ZTogKHBhcmFtcykgLT5cbiAgICBmaWxlUGF0aCA9IHBhcmFtcy5wYXRoXG4gICAgZWRpdG9yV2l0aG91dFBhdGggPSBwYXJhbXMuZWRpdG9yXG4gICAgYWN0aXZlRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0Q2VudGVyKCkuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICBpZiBhY3RpdmVFZGl0b3I/XG4gICAgICBlZGl0b3IxID0gYWN0aXZlRWRpdG9yXG4gICAgICBAd2FzRWRpdG9yMkNyZWF0ZWQgPSB0cnVlXG4gICAgICBwYW5lcyA9IGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldFBhbmVzKClcbiAgICAgICMgZ2V0IGluZGV4IG9mIHBhbmUgZm9sbG93aW5nIGFjdGl2ZSBlZGl0b3IgcGFuZVxuICAgICAgcmlnaHRQYW5lSW5kZXggPSBwYW5lcy5pbmRleE9mKGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGVkaXRvcjEpKSArIDFcbiAgICAgICMgcGFuZSBpcyBjcmVhdGVkIGlmIHRoZXJlIGlzIG5vdCBvbmUgdG8gdGhlIHJpZ2h0IG9mIHRoZSBhY3RpdmUgZWRpdG9yXG4gICAgICByaWdodFBhbmUgPSBwYW5lc1tyaWdodFBhbmVJbmRleF0gfHwgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yMSkuc3BsaXRSaWdodCgpXG5cbiAgICAgIGlmIHBhcmFtcy5wYXRoXG4gICAgICAgIGZpbGVQYXRoID0gcGFyYW1zLnBhdGhcbiAgICAgICAgaWYgZWRpdG9yMS5nZXRQYXRoKCkgPT0gZmlsZVBhdGhcbiAgICAgICAgICAjIGlmIGRpZmZpbmcgd2l0aCBpdHNlbGYsIHNldCBmaWxlUGF0aCB0byBudWxsIHNvIGFuIGVtcHR5IGVkaXRvciBpc1xuICAgICAgICAgICMgb3BlbmVkLCB3aGljaCB3aWxsIGNhdXNlIGEgZ2l0IGRpZmZcbiAgICAgICAgICBmaWxlUGF0aCA9IG51bGxcbiAgICAgICAgZWRpdG9yMlByb21pc2UgPSBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lKGZpbGVQYXRoLCByaWdodFBhbmUpXG5cbiAgICAgICAgcmV0dXJuIGVkaXRvcjJQcm9taXNlLnRoZW4gKGVkaXRvcjIpIC0+XG4gICAgICAgICAgcmV0dXJuIHtlZGl0b3IxOiBlZGl0b3IxLCBlZGl0b3IyOiBlZGl0b3IyfVxuICAgICAgZWxzZSBpZiBlZGl0b3JXaXRob3V0UGF0aFxuICAgICAgICBlZGl0b3IyID0gZWRpdG9yV2l0aG91dFBhdGguY29weSgpXG4gICAgICAgIHJpZ2h0UGFuZS5hZGRJdGVtKGVkaXRvcjIpXG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7ZWRpdG9yMTogZWRpdG9yMSwgZWRpdG9yMjogZWRpdG9yMn0pXG4gICAgZWxzZVxuICAgICAgbm9BY3RpdmVFZGl0b3JNc2cgPSAnTm8gYWN0aXZlIGZpbGUgZm91bmQhIChUcnkgZm9jdXNpbmcgYSB0ZXh0IGVkaXRvciknXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IG5vQWN0aXZlRWRpdG9yTXNnLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgX3NldHVwVmlzaWJsZUVkaXRvcnM6IChlZGl0b3IxLCBlZGl0b3IyKSAtPlxuICAgIEJ1ZmZlckV4dGVuZGVyID0gcmVxdWlyZSAnLi9idWZmZXItZXh0ZW5kZXInXG4gICAgYnVmZmVyMUxpbmVFbmRpbmcgPSAobmV3IEJ1ZmZlckV4dGVuZGVyKGVkaXRvcjEuZ2V0QnVmZmVyKCkpKS5nZXRMaW5lRW5kaW5nKClcblxuICAgIGlmIEB3YXNFZGl0b3IyQ3JlYXRlZFxuICAgICAgIyB3YW50IHRvIHNjcm9sbCBhIG5ld2x5IGNyZWF0ZWQgZWRpdG9yIHRvIHRoZSBmaXJzdCBlZGl0b3IncyBwb3NpdGlvblxuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcjEpLmZvY3VzKClcbiAgICAgICMgc2V0IHRoZSBwcmVmZXJyZWQgbGluZSBlbmRpbmcgYmVmb3JlIGluc2VydGluZyB0ZXh0ICMzOVxuICAgICAgaWYgYnVmZmVyMUxpbmVFbmRpbmcgPT0gJ1xcbicgfHwgYnVmZmVyMUxpbmVFbmRpbmcgPT0gJ1xcclxcbidcbiAgICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcjIub25XaWxsSW5zZXJ0VGV4dCAoKSAtPlxuICAgICAgICAgIGVkaXRvcjIuZ2V0QnVmZmVyKCkuc2V0UHJlZmVycmVkTGluZUVuZGluZyhidWZmZXIxTGluZUVuZGluZylcblxuICAgIEBfc2V0dXBHaXRSZXBvKGVkaXRvcjEsIGVkaXRvcjIpXG5cbiAgICAjIHVuZm9sZCBhbGwgbGluZXMgc28gZGlmZnMgcHJvcGVybHkgYWxpZ25cbiAgICBlZGl0b3IxLnVuZm9sZEFsbCgpXG4gICAgZWRpdG9yMi51bmZvbGRBbGwoKVxuXG4gICAgbXV0ZU5vdGlmaWNhdGlvbnMgPSBAb3B0aW9ucy5tdXRlTm90aWZpY2F0aW9ucyA/IEBfZ2V0Q29uZmlnKCdtdXRlTm90aWZpY2F0aW9ucycpXG4gICAgc29mdFdyYXBNc2cgPSAnV2FybmluZzogU29mdCB3cmFwIGVuYWJsZWQhIChMaW5lIGRpZmZzIG1heSBub3QgYWxpZ24pJ1xuICAgIGlmIGVkaXRvcjEuaXNTb2Z0V3JhcHBlZCgpICYmICFtdXRlTm90aWZpY2F0aW9uc1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ1NwbGl0IERpZmYnLCB7ZGV0YWlsOiBzb2Z0V3JhcE1zZywgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KVxuICAgIGVsc2UgaWYgZWRpdG9yMi5pc1NvZnRXcmFwcGVkKCkgJiYgIW11dGVOb3RpZmljYXRpb25zXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IHNvZnRXcmFwTXNnLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG5cbiAgICBidWZmZXIyTGluZUVuZGluZyA9IChuZXcgQnVmZmVyRXh0ZW5kZXIoZWRpdG9yMi5nZXRCdWZmZXIoKSkpLmdldExpbmVFbmRpbmcoKVxuICAgIGlmIGJ1ZmZlcjJMaW5lRW5kaW5nICE9ICcnICYmIChidWZmZXIxTGluZUVuZGluZyAhPSBidWZmZXIyTGluZUVuZGluZykgJiYgZWRpdG9yMS5nZXRMaW5lQ291bnQoKSAhPSAxICYmIGVkaXRvcjIuZ2V0TGluZUNvdW50KCkgIT0gMSAmJiAhbXV0ZU5vdGlmaWNhdGlvbnNcbiAgICAgICMgcG9wIHdhcm5pbmcgaWYgdGhlIGxpbmUgZW5kaW5ncyBkaWZmZXIgYW5kIHdlIGhhdmVuJ3QgZG9uZSBhbnl0aGluZyBhYm91dCBpdFxuICAgICAgbGluZUVuZGluZ01zZyA9ICdXYXJuaW5nOiBMaW5lIGVuZGluZ3MgZGlmZmVyISdcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKCdTcGxpdCBEaWZmJywge2RldGFpbDogbGluZUVuZGluZ01zZywgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KVxuXG4gIF9zZXR1cEdpdFJlcG86IChlZGl0b3IxLCBlZGl0b3IyKSAtPlxuICAgIGVkaXRvcjFQYXRoID0gZWRpdG9yMS5nZXRQYXRoKClcbiAgICAjIG9ubHkgc2hvdyBnaXQgY2hhbmdlcyBpZiB0aGUgcmlnaHQgZWRpdG9yIGlzIGVtcHR5XG4gICAgaWYgZWRpdG9yMVBhdGg/ICYmIChlZGl0b3IyLmdldExpbmVDb3VudCgpID09IDEgJiYgZWRpdG9yMi5saW5lVGV4dEZvckJ1ZmZlclJvdygwKSA9PSAnJylcbiAgICAgIGZvciBkaXJlY3RvcnksIGkgaW4gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClcbiAgICAgICAgaWYgZWRpdG9yMVBhdGggaXMgZGlyZWN0b3J5LmdldFBhdGgoKSBvciBkaXJlY3RvcnkuY29udGFpbnMoZWRpdG9yMVBhdGgpXG4gICAgICAgICAgcHJvamVjdFJlcG8gPSBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbaV1cbiAgICAgICAgICBpZiBwcm9qZWN0UmVwbz8gJiYgcHJvamVjdFJlcG8ucmVwbz9cbiAgICAgICAgICAgIHJlbGF0aXZlRWRpdG9yMVBhdGggPSBwcm9qZWN0UmVwby5yZWxhdGl2aXplKGVkaXRvcjFQYXRoKVxuICAgICAgICAgICAgZ2l0SGVhZFRleHQgPSBwcm9qZWN0UmVwby5yZXBvLmdldEhlYWRCbG9iKHJlbGF0aXZlRWRpdG9yMVBhdGgpXG4gICAgICAgICAgICBpZiBnaXRIZWFkVGV4dD9cbiAgICAgICAgICAgICAgZWRpdG9yMi5zZWxlY3RBbGwoKVxuICAgICAgICAgICAgICBlZGl0b3IyLmluc2VydFRleHQoZ2l0SGVhZFRleHQpXG4gICAgICAgICAgICAgIEBoYXNHaXRSZXBvID0gdHJ1ZVxuICAgICAgICAgICAgICBicmVha1xuXG4gICMgY3JlYXRlcyB0ZW1wIGZpbGVzIHNvIHRoZSBjb21wdXRlIGRpZmYgcHJvY2VzcyBjYW4gZ2V0IHRoZSB0ZXh0IGVhc2lseVxuICBfY3JlYXRlVGVtcEZpbGVzOiAoZWRpdG9ycykgLT5cbiAgICBlZGl0b3IxUGF0aCA9ICcnXG4gICAgZWRpdG9yMlBhdGggPSAnJ1xuICAgIHRlbXBGb2xkZXJQYXRoID0gYXRvbS5nZXRDb25maWdEaXJQYXRoKCkgKyAnL3NwbGl0LWRpZmYnXG5cbiAgICBlZGl0b3IxUGF0aCA9IHRlbXBGb2xkZXJQYXRoICsgJy9zcGxpdC1kaWZmIDEnXG4gICAgZWRpdG9yMVRlbXBGaWxlID0gbmV3IEZpbGUoZWRpdG9yMVBhdGgpXG4gICAgZWRpdG9yMVRlbXBGaWxlLndyaXRlU3luYyhlZGl0b3JzLmVkaXRvcjEuZ2V0VGV4dCgpKVxuXG4gICAgZWRpdG9yMlBhdGggPSB0ZW1wRm9sZGVyUGF0aCArICcvc3BsaXQtZGlmZiAyJ1xuICAgIGVkaXRvcjJUZW1wRmlsZSA9IG5ldyBGaWxlKGVkaXRvcjJQYXRoKVxuICAgIGVkaXRvcjJUZW1wRmlsZS53cml0ZVN5bmMoZWRpdG9ycy5lZGl0b3IyLmdldFRleHQoKSlcblxuICAgIGVkaXRvclBhdGhzID1cbiAgICAgIGVkaXRvcjFQYXRoOiBlZGl0b3IxUGF0aFxuICAgICAgZWRpdG9yMlBhdGg6IGVkaXRvcjJQYXRoXG5cbiAgICByZXR1cm4gZWRpdG9yUGF0aHNcblxuXG4gIF9nZXRDb25maWc6IChjb25maWcpIC0+XG4gICAgYXRvbS5jb25maWcuZ2V0KFwic3BsaXQtZGlmZi4je2NvbmZpZ31cIilcblxuICBfc2V0Q29uZmlnOiAoY29uZmlnLCB2YWx1ZSkgLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQoXCJzcGxpdC1kaWZmLiN7Y29uZmlnfVwiLCB2YWx1ZSlcblxuXG4gICMgLS0tIFNFUlZJQ0UgQVBJIC0tLVxuICBnZXRNYXJrZXJMYXllcnM6ICgpIC0+XG4gICAgbmV3IFByb21pc2UgKChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICBAc3BsaXREaWZmUmVzb2x2ZXMucHVzaChyZXNvbHZlKVxuICAgICkuYmluZCh0aGlzKVxuXG4gIGRpZmZFZGl0b3JzOiAoZWRpdG9yMSwgZWRpdG9yMiwgb3B0aW9ucykgLT5cbiAgICBAZGlmZlBhbmVzKG51bGwsIFByb21pc2UucmVzb2x2ZSh7ZWRpdG9yMTogZWRpdG9yMSwgZWRpdG9yMjogZWRpdG9yMn0pLCBvcHRpb25zKVxuXG4gIHByb3ZpZGVTcGxpdERpZmY6IC0+XG4gICAgZ2V0TWFya2VyTGF5ZXJzOiBAZ2V0TWFya2VyTGF5ZXJzLmJpbmQoQGNvbnRleHRGb3JTZXJ2aWNlKVxuICAgIGRpZmZFZGl0b3JzOiBAZGlmZkVkaXRvcnMuYmluZChAY29udGV4dEZvclNlcnZpY2UpXG4gICAgZGlzYWJsZTogQGRpc2FibGUuYmluZChAY29udGV4dEZvclNlcnZpY2UpXG4iXX0=
