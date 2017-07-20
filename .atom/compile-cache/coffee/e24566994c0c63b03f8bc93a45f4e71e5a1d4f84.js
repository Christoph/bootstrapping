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
      var filePath;
      if (options == null) {
        options = {};
      }
      this.options = options;
      this.disable();
      this.editorSubscriptions = new CompositeDisposable();
      if (!editorsPromise) {
        if (event != null ? event.currentTarget.classList.contains('tab') : void 0) {
          filePath = event.currentTarget.path;
          editorsPromise = this._getEditorsForDiffWithActive(filePath);
        } else if ((event != null ? event.currentTarget.classList.contains('list-item') : void 0) && (event != null ? event.currentTarget.classList.contains('file') : void 0)) {
          filePath = event.currentTarget.getPath();
          editorsPromise = this._getEditorsForDiffWithActive(filePath);
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
        editor1 = atom.workspace.buildTextEditor();
        this.wasEditor1Created = true;
        panes[0].addItem(editor1);
        panes[0].activateItem(editor1);
      }
      if (editor2 === null) {
        editor2 = atom.workspace.buildTextEditor();
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
    _getEditorsForDiffWithActive: function(filePath) {
      var activeEditor, editor1, editor2Promise, noActiveEditorMsg, panes, rightPane, rightPaneIndex;
      activeEditor = atom.workspace.getCenter().getActiveTextEditor();
      if (activeEditor != null) {
        editor1 = activeEditor;
        this.wasEditor2Created = true;
        panes = atom.workspace.getCenter().getPanes();
        rightPaneIndex = panes.indexOf(atom.workspace.paneForItem(editor1)) + 1;
        rightPane = panes[rightPaneIndex] || atom.workspace.paneForItem(editor1).splitRight();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvc3BsaXQtZGlmZi9saWIvc3BsaXQtZGlmZi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQXlDLE9BQUEsQ0FBUSxNQUFSLENBQXpDLEVBQUMsNkNBQUQsRUFBc0IseUJBQXRCLEVBQWlDOztFQUNqQyxRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsV0FBQSxHQUFjLE9BQUEsQ0FBUSxtQkFBUjs7RUFDZCxVQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztFQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixlQUFBLEdBQWtCLE9BQUEsQ0FBUSxvQkFBUjs7RUFDbEIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQSxHQUNmO0lBQUEsUUFBQSxFQUFVLElBQVY7SUFDQSxNQUFBLEVBQVEsWUFEUjtJQUVBLGFBQUEsRUFBZSxJQUZmO0lBR0EsbUJBQUEsRUFBcUIsSUFIckI7SUFJQSxTQUFBLEVBQVcsS0FKWDtJQUtBLGlCQUFBLEVBQW1CLEtBTG5CO0lBTUEsaUJBQUEsRUFBbUIsS0FObkI7SUFPQSxVQUFBLEVBQVksS0FQWjtJQVFBLGVBQUEsRUFBaUIsS0FSakI7SUFTQSxPQUFBLEVBQVMsSUFUVDtJQVVBLGlCQUFBLEVBQW1CLEVBVm5CO0lBV0EsT0FBQSxFQUFTLEVBWFQ7SUFhQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQUFBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtNQUVyQixlQUFBLEdBQXNCLElBQUEsZUFBQSxDQUFnQixJQUFJLENBQUMsTUFBckIsRUFBNkIsSUFBSSxDQUFDLE1BQWxDO01BQ3RCLGVBQWUsQ0FBQyxhQUFoQixDQUNJLDBCQURKLEVBRUks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akI7UUFDQSxXQUFBLEVBQWEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLElBQUMsQ0FBQSxpQkFBbkIsQ0FEYjtRQUVBLE9BQUEsRUFBUyxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFDLENBQUEsaUJBQWYsQ0FGVDs7SUFEZ0IsQ0F2ZGxCOztBQVZGIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpcmVjdG9yeSwgRmlsZX0gPSByZXF1aXJlICdhdG9tJ1xuRGlmZlZpZXcgPSByZXF1aXJlICcuL2RpZmYtdmlldydcbkxvYWRpbmdWaWV3ID0gcmVxdWlyZSAnLi91aS9sb2FkaW5nLXZpZXcnXG5Gb290ZXJWaWV3ID0gcmVxdWlyZSAnLi91aS9mb290ZXItdmlldydcblN5bmNTY3JvbGwgPSByZXF1aXJlICcuL3N5bmMtc2Nyb2xsJ1xuU3R5bGVDYWxjdWxhdG9yID0gcmVxdWlyZSAnLi9zdHlsZS1jYWxjdWxhdG9yJ1xuY29uZmlnU2NoZW1hID0gcmVxdWlyZSAnLi9jb25maWctc2NoZW1hJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbm1vZHVsZS5leHBvcnRzID0gU3BsaXREaWZmID1cbiAgZGlmZlZpZXc6IG51bGxcbiAgY29uZmlnOiBjb25maWdTY2hlbWFcbiAgc3Vic2NyaXB0aW9uczogbnVsbFxuICBlZGl0b3JTdWJzY3JpcHRpb25zOiBudWxsXG4gIGlzRW5hYmxlZDogZmFsc2VcbiAgd2FzRWRpdG9yMUNyZWF0ZWQ6IGZhbHNlXG4gIHdhc0VkaXRvcjJDcmVhdGVkOiBmYWxzZVxuICBoYXNHaXRSZXBvOiBmYWxzZVxuICB3YXNUcmVlVmlld09wZW46IGZhbHNlXG4gIHByb2Nlc3M6IG51bGxcbiAgc3BsaXREaWZmUmVzb2x2ZXM6IFtdXG4gIG9wdGlvbnM6IHt9XG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAY29udGV4dEZvclNlcnZpY2UgPSB0aGlzXG5cbiAgICBzdHlsZUNhbGN1bGF0b3IgPSBuZXcgU3R5bGVDYWxjdWxhdG9yKGF0b20uc3R5bGVzLCBhdG9tLmNvbmZpZylcbiAgICBzdHlsZUNhbGN1bGF0b3Iuc3RhcnRXYXRjaGluZyhcbiAgICAgICAgJ3NwbGl0LWRpZmYtY3VzdG9tLXN0eWxlcycsXG4gICAgICAgIFsnc3BsaXQtZGlmZi5jb2xvcnMuYWRkZWRDb2xvcicsICdzcGxpdC1kaWZmLmNvbG9ycy5yZW1vdmVkQ29sb3InXSxcbiAgICAgICAgKGNvbmZpZykgLT5cbiAgICAgICAgICBhZGRlZENvbG9yID0gY29uZmlnLmdldCgnc3BsaXQtZGlmZi5jb2xvcnMuYWRkZWRDb2xvcicpXG4gICAgICAgICAgYWRkZWRDb2xvci5hbHBoYSA9IDAuNFxuICAgICAgICAgIGFkZGVkV29yZENvbG9yID0gYWRkZWRDb2xvclxuICAgICAgICAgIGFkZGVkV29yZENvbG9yLmFscGhhID0gMC41XG4gICAgICAgICAgcmVtb3ZlZENvbG9yID0gY29uZmlnLmdldCgnc3BsaXQtZGlmZi5jb2xvcnMucmVtb3ZlZENvbG9yJylcbiAgICAgICAgICByZW1vdmVkQ29sb3IuYWxwaGEgPSAwLjRcbiAgICAgICAgICByZW1vdmVkV29yZENvbG9yID0gcmVtb3ZlZENvbG9yXG4gICAgICAgICAgcmVtb3ZlZFdvcmRDb2xvci5hbHBoYSA9IDAuNVxuICAgICAgICAgIFwiXFxuXG4gICAgICAgICAgLnNwbGl0LWRpZmYtYWRkZWQtY3VzdG9tIHtcXG5cbiAgICAgICAgICAgIFxcdGJhY2tncm91bmQtY29sb3I6ICN7YWRkZWRDb2xvci50b1JHQkFTdHJpbmcoKX07XFxuXG4gICAgICAgICAgfVxcblxuICAgICAgICAgIC5zcGxpdC1kaWZmLXJlbW92ZWQtY3VzdG9tIHtcXG5cbiAgICAgICAgICAgIFxcdGJhY2tncm91bmQtY29sb3I6ICN7cmVtb3ZlZENvbG9yLnRvUkdCQVN0cmluZygpfTtcXG5cbiAgICAgICAgICB9XFxuXG4gICAgICAgICAgLnNwbGl0LWRpZmYtd29yZC1hZGRlZC1jdXN0b20gLnJlZ2lvbiB7XFxuXG4gICAgICAgICAgICBcXHRiYWNrZ3JvdW5kLWNvbG9yOiAje2FkZGVkV29yZENvbG9yLnRvUkdCQVN0cmluZygpfTtcXG5cbiAgICAgICAgICB9XFxuXG4gICAgICAgICAgLnNwbGl0LWRpZmYtd29yZC1yZW1vdmVkLWN1c3RvbSAucmVnaW9uIHtcXG5cbiAgICAgICAgICAgIFxcdGJhY2tncm91bmQtY29sb3I6ICN7cmVtb3ZlZFdvcmRDb2xvci50b1JHQkFTdHJpbmcoKX07XFxuXG4gICAgICAgICAgfVxcblwiXG4gICAgKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZSwgLnRyZWUtdmlldyAuc2VsZWN0ZWQsIC50YWIudGV4dGVkaXRvcicsXG4gICAgICAnc3BsaXQtZGlmZjplbmFibGUnOiAoZSkgPT5cbiAgICAgICAgQGRpZmZQYW5lcyhlKVxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAnc3BsaXQtZGlmZjpuZXh0LWRpZmYnOiA9PlxuICAgICAgICBpZiBAaXNFbmFibGVkXG4gICAgICAgICAgQG5leHREaWZmKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBkaWZmUGFuZXMoKVxuICAgICAgJ3NwbGl0LWRpZmY6cHJldi1kaWZmJzogPT5cbiAgICAgICAgaWYgQGlzRW5hYmxlZFxuICAgICAgICAgIEBwcmV2RGlmZigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZGlmZlBhbmVzKClcbiAgICAgICdzcGxpdC1kaWZmOmNvcHktdG8tcmlnaHQnOiA9PlxuICAgICAgICBpZiBAaXNFbmFibGVkXG4gICAgICAgICAgQGNvcHlUb1JpZ2h0KClcbiAgICAgICdzcGxpdC1kaWZmOmNvcHktdG8tbGVmdCc6ID0+XG4gICAgICAgIGlmIEBpc0VuYWJsZWRcbiAgICAgICAgICBAY29weVRvTGVmdCgpXG4gICAgICAnc3BsaXQtZGlmZjpkaXNhYmxlJzogPT4gQGRpc2FibGUoKVxuICAgICAgJ3NwbGl0LWRpZmY6aWdub3JlLXdoaXRlc3BhY2UnOiA9PiBAdG9nZ2xlSWdub3JlV2hpdGVzcGFjZSgpXG4gICAgICAnc3BsaXQtZGlmZjp0b2dnbGUnOiA9PiBAdG9nZ2xlKClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBkaXNhYmxlKClcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICAjIGNhbGxlZCBieSBcInRvZ2dsZVwiIGNvbW1hbmRcbiAgIyB0b2dnbGVzIHNwbGl0IGRpZmZcbiAgdG9nZ2xlOiAoKSAtPlxuICAgIGlmIEBpc0VuYWJsZWRcbiAgICAgIEBkaXNhYmxlKClcbiAgICBlbHNlXG4gICAgICBAZGlmZlBhbmVzKClcblxuICAjIGNhbGxlZCBieSBcIkRpc2FibGVcIiBjb21tYW5kXG4gICMgcmVtb3ZlcyBkaWZmIGFuZCBzeW5jIHNjcm9sbCwgZGlzcG9zZXMgb2Ygc3Vic2NyaXB0aW9uc1xuICBkaXNhYmxlOiAoKSAtPlxuICAgIEBpc0VuYWJsZWQgPSBmYWxzZVxuXG4gICAgIyByZW1vdmUgbGlzdGVuZXJzXG4gICAgaWYgQGVkaXRvclN1YnNjcmlwdGlvbnM/XG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zID0gbnVsbFxuXG4gICAgaWYgQGRpZmZWaWV3P1xuICAgICAgaWYgQHdhc0VkaXRvcjFDcmVhdGVkXG4gICAgICAgIEBkaWZmVmlldy5jbGVhblVwRWRpdG9yKDEpXG4gICAgICBpZiBAd2FzRWRpdG9yMkNyZWF0ZWRcbiAgICAgICAgQGRpZmZWaWV3LmNsZWFuVXBFZGl0b3IoMilcbiAgICAgIEBkaWZmVmlldy5kZXN0cm95KClcbiAgICAgIEBkaWZmVmlldyA9IG51bGxcblxuICAgICMgcmVtb3ZlIHZpZXdzXG4gICAgaWYgQGZvb3RlclZpZXc/XG4gICAgICBAZm9vdGVyVmlldy5kZXN0cm95KClcbiAgICAgIEBmb290ZXJWaWV3ID0gbnVsbFxuICAgIGlmIEBsb2FkaW5nVmlldz9cbiAgICAgIEBsb2FkaW5nVmlldy5kZXN0cm95KClcbiAgICAgIEBsb2FkaW5nVmlldyA9IG51bGxcblxuICAgIGlmIEBzeW5jU2Nyb2xsP1xuICAgICAgQHN5bmNTY3JvbGwuZGlzcG9zZSgpXG4gICAgICBAc3luY1Njcm9sbCA9IG51bGxcblxuICAgICMgYXV0byBoaWRlIHRyZWUgdmlldyB3aGlsZSBkaWZmaW5nICM4MlxuICAgIGhpZGVUcmVlVmlldyA9IEBvcHRpb25zLmhpZGVUcmVlVmlldyA/IEBfZ2V0Q29uZmlnKCdoaWRlVHJlZVZpZXcnKVxuICAgIGlmIGhpZGVUcmVlVmlldyAmJiBAd2FzVHJlZVZpZXdPcGVuXG4gICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICd0cmVlLXZpZXc6c2hvdycpXG5cbiAgICAjIHJlc2V0IGFsbCB2YXJpYWJsZXNcbiAgICBAd2FzRWRpdG9yMUNyZWF0ZWQgPSBmYWxzZVxuICAgIEB3YXNFZGl0b3IyQ3JlYXRlZCA9IGZhbHNlXG4gICAgQGhhc0dpdFJlcG8gPSBmYWxzZVxuICAgIEB3YXNUcmVlVmlld09wZW4gPSBmYWxzZVxuXG4gICMgY2FsbGVkIGJ5IFwidG9nZ2xlIGlnbm9yZSB3aGl0ZXNwYWNlXCIgY29tbWFuZFxuICB0b2dnbGVJZ25vcmVXaGl0ZXNwYWNlOiAtPlxuICAgICMgaWYgaWdub3JlV2hpdGVzcGFjZSBpcyBub3QgYmVpbmcgb3ZlcnJpZGRlblxuICAgIGlmICEoQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZT8pXG4gICAgICBpZ25vcmVXaGl0ZXNwYWNlID0gQF9nZXRDb25maWcoJ2lnbm9yZVdoaXRlc3BhY2UnKVxuICAgICAgQF9zZXRDb25maWcoJ2lnbm9yZVdoaXRlc3BhY2UnLCAhaWdub3JlV2hpdGVzcGFjZSlcbiAgICAgIEBmb290ZXJWaWV3Py5zZXRJZ25vcmVXaGl0ZXNwYWNlKCFpZ25vcmVXaGl0ZXNwYWNlKVxuXG4gICMgY2FsbGVkIGJ5IFwiTW92ZSB0byBuZXh0IGRpZmZcIiBjb21tYW5kXG4gIG5leHREaWZmOiAtPlxuICAgIGlmIEBkaWZmVmlldz9cbiAgICAgIHNlbGVjdGVkSW5kZXggPSBAZGlmZlZpZXcubmV4dERpZmYoKVxuICAgICAgQGZvb3RlclZpZXc/LnNob3dTZWxlY3Rpb25Db3VudCggc2VsZWN0ZWRJbmRleCArIDEgKVxuXG4gICMgY2FsbGVkIGJ5IFwiTW92ZSB0byBwcmV2aW91cyBkaWZmXCIgY29tbWFuZFxuICBwcmV2RGlmZjogLT5cbiAgICBpZiBAZGlmZlZpZXc/XG4gICAgICBzZWxlY3RlZEluZGV4ID0gQGRpZmZWaWV3LnByZXZEaWZmKClcbiAgICAgIEBmb290ZXJWaWV3Py5zaG93U2VsZWN0aW9uQ291bnQoIHNlbGVjdGVkSW5kZXggKyAxIClcblxuICAjIGNhbGxlZCBieSBcIkNvcHkgdG8gcmlnaHRcIiBjb21tYW5kXG4gIGNvcHlUb1JpZ2h0OiAtPlxuICAgIGlmIEBkaWZmVmlldz9cbiAgICAgIEBkaWZmVmlldy5jb3B5VG9SaWdodCgpXG4gICAgICBAZm9vdGVyVmlldz8uaGlkZVNlbGVjdGlvbkNvdW50KClcblxuICAjIGNhbGxlZCBieSBcIkNvcHkgdG8gbGVmdFwiIGNvbW1hbmRcbiAgY29weVRvTGVmdDogLT5cbiAgICBpZiBAZGlmZlZpZXc/XG4gICAgICBAZGlmZlZpZXcuY29weVRvTGVmdCgpXG4gICAgICBAZm9vdGVyVmlldz8uaGlkZVNlbGVjdGlvbkNvdW50KClcblxuICAjIGNhbGxlZCBieSB0aGUgY29tbWFuZHMgZW5hYmxlL3RvZ2dsZSB0byBkbyBpbml0aWFsIGRpZmZcbiAgIyBzZXRzIHVwIHN1YnNjcmlwdGlvbnMgZm9yIGF1dG8gZGlmZiBhbmQgZGlzYWJsaW5nIHdoZW4gYSBwYW5lIGlzIGRlc3Ryb3llZFxuICAjIGV2ZW50IGlzIGFuIG9wdGlvbmFsIGFyZ3VtZW50IG9mIGEgZmlsZSBwYXRoIHRvIGRpZmYgd2l0aCBjdXJyZW50XG4gICMgZWRpdG9yc1Byb21pc2UgaXMgYW4gb3B0aW9uYWwgYXJndW1lbnQgb2YgYSBwcm9taXNlIHRoYXQgcmV0dXJucyB3aXRoIDIgZWRpdG9yc1xuICAjIG9wdGlvbnMgaXMgYW4gb3B0aW9uYWwgYXJndW1lbnQgd2l0aCBvcHRpb25hbCBwcm9wZXJ0aWVzIHRoYXQgYXJlIHVzZWQgdG8gb3ZlcnJpZGUgdXNlcidzIHNldHRpbmdzXG4gIGRpZmZQYW5lczogKGV2ZW50LCBlZGl0b3JzUHJvbWlzZSwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICMgaW4gY2FzZSBlbmFibGUgd2FzIGNhbGxlZCBhZ2FpblxuICAgIEBkaXNhYmxlKClcblxuICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgaWYgIWVkaXRvcnNQcm9taXNlXG4gICAgICBpZiBldmVudD8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3RhYicpXG4gICAgICAgIGZpbGVQYXRoID0gZXZlbnQuY3VycmVudFRhcmdldC5wYXRoXG4gICAgICAgIGVkaXRvcnNQcm9taXNlID0gQF9nZXRFZGl0b3JzRm9yRGlmZldpdGhBY3RpdmUoZmlsZVBhdGgpXG4gICAgICBlbHNlIGlmIGV2ZW50Py5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbGlzdC1pdGVtJykgJiYgZXZlbnQ/LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaWxlJylcbiAgICAgICAgZmlsZVBhdGggPSBldmVudC5jdXJyZW50VGFyZ2V0LmdldFBhdGgoKVxuICAgICAgICBlZGl0b3JzUHJvbWlzZSA9IEBfZ2V0RWRpdG9yc0ZvckRpZmZXaXRoQWN0aXZlKGZpbGVQYXRoKVxuICAgICAgZWxzZVxuICAgICAgICBlZGl0b3JzUHJvbWlzZSA9IEBfZ2V0RWRpdG9yc0ZvclF1aWNrRGlmZigpXG5cbiAgICBlZGl0b3JzUHJvbWlzZS50aGVuICgoZWRpdG9ycykgLT5cbiAgICAgIGlmIGVkaXRvcnMgPT0gbnVsbFxuICAgICAgICByZXR1cm5cbiAgICAgIEBfc2V0dXBWaXNpYmxlRWRpdG9ycyhlZGl0b3JzLmVkaXRvcjEsIGVkaXRvcnMuZWRpdG9yMilcbiAgICAgIEBkaWZmVmlldyA9IG5ldyBEaWZmVmlldyhlZGl0b3JzKVxuXG4gICAgICAjIGFkZCBsaXN0ZW5lcnNcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjEub25EaWRTdG9wQ2hhbmdpbmcgPT5cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjIub25EaWRTdG9wQ2hhbmdpbmcgPT5cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjEub25EaWREZXN0cm95ID0+XG4gICAgICAgIEBkaXNhYmxlKClcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjIub25EaWREZXN0cm95ID0+XG4gICAgICAgIEBkaXNhYmxlKClcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnc3BsaXQtZGlmZicsICgpID0+XG4gICAgICAgIEB1cGRhdGVEaWZmKGVkaXRvcnMpXG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQgZWRpdG9ycy5lZGl0b3IxLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gKGV2ZW50KSA9PlxuICAgICAgICBAZGlmZlZpZXcuaGFuZGxlQ3Vyc29yQ2hhbmdlKGV2ZW50LmN1cnNvciwgZXZlbnQub2xkQnVmZmVyUG9zaXRpb24sIGV2ZW50Lm5ld0J1ZmZlclBvc2l0aW9uKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcnMuZWRpdG9yMi5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uIChldmVudCkgPT5cbiAgICAgICAgQGRpZmZWaWV3LmhhbmRsZUN1cnNvckNoYW5nZShldmVudC5jdXJzb3IsIGV2ZW50Lm9sZEJ1ZmZlclBvc2l0aW9uLCBldmVudC5uZXdCdWZmZXJQb3NpdGlvbilcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjEub25EaWRBZGRDdXJzb3IgKGN1cnNvcikgPT5cbiAgICAgICAgQGRpZmZWaWV3LmhhbmRsZUN1cnNvckNoYW5nZShjdXJzb3IsIC0xLCBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JzLmVkaXRvcjIub25EaWRBZGRDdXJzb3IgKGN1cnNvcikgPT5cbiAgICAgICAgQGRpZmZWaWV3LmhhbmRsZUN1cnNvckNoYW5nZShjdXJzb3IsIC0xLCBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcblxuICAgICAgIyBhZGQgdGhlIGJvdHRvbSBVSSBwYW5lbFxuICAgICAgaWYgIUBmb290ZXJWaWV3P1xuICAgICAgICBpZ25vcmVXaGl0ZXNwYWNlID0gQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSA/IEBfZ2V0Q29uZmlnKCdpZ25vcmVXaGl0ZXNwYWNlJylcbiAgICAgICAgQGZvb3RlclZpZXcgPSBuZXcgRm9vdGVyVmlldyhpZ25vcmVXaGl0ZXNwYWNlLCAoQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZT8pKVxuICAgICAgICBAZm9vdGVyVmlldy5jcmVhdGVQYW5lbCgpXG4gICAgICBAZm9vdGVyVmlldy5zaG93KClcblxuICAgICAgIyB1cGRhdGUgZGlmZiBpZiB0aGVyZSBpcyBubyBnaXQgcmVwbyAobm8gb25jaGFuZ2UgZmlyZWQpXG4gICAgICBpZiAhQGhhc0dpdFJlcG9cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcblxuICAgICAgIyBhZGQgYXBwbGljYXRpb24gbWVudSBpdGVtc1xuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGF0b20ubWVudS5hZGQgW1xuICAgICAgICB7XG4gICAgICAgICAgJ2xhYmVsJzogJ1BhY2thZ2VzJ1xuICAgICAgICAgICdzdWJtZW51JzogW1xuICAgICAgICAgICAgJ2xhYmVsJzogJ1NwbGl0IERpZmYnXG4gICAgICAgICAgICAnc3VibWVudSc6IFtcbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnSWdub3JlIFdoaXRlc3BhY2UnLCAnY29tbWFuZCc6ICdzcGxpdC1kaWZmOmlnbm9yZS13aGl0ZXNwYWNlJyB9XG4gICAgICAgICAgICAgIHsgJ2xhYmVsJzogJ01vdmUgdG8gTmV4dCBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpuZXh0LWRpZmYnIH1cbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnTW92ZSB0byBQcmV2aW91cyBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpwcmV2LWRpZmYnIH1cbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnQ29weSB0byBSaWdodCcsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6Y29weS10by1yaWdodCd9XG4gICAgICAgICAgICAgIHsgJ2xhYmVsJzogJ0NvcHkgdG8gTGVmdCcsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6Y29weS10by1sZWZ0J31cbiAgICAgICAgICAgIF1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbnRleHRNZW51LmFkZCB7XG4gICAgICAgICdhdG9tLXRleHQtZWRpdG9yJzogW3tcbiAgICAgICAgICAnbGFiZWwnOiAnU3BsaXQgRGlmZicsXG4gICAgICAgICAgJ3N1Ym1lbnUnOiBbXG4gICAgICAgICAgICB7ICdsYWJlbCc6ICdJZ25vcmUgV2hpdGVzcGFjZScsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6aWdub3JlLXdoaXRlc3BhY2UnIH1cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ01vdmUgdG8gTmV4dCBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpuZXh0LWRpZmYnIH1cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ01vdmUgdG8gUHJldmlvdXMgRGlmZicsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6cHJldi1kaWZmJyB9XG4gICAgICAgICAgICB7ICdsYWJlbCc6ICdDb3B5IHRvIFJpZ2h0JywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpjb3B5LXRvLXJpZ2h0J31cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ0NvcHkgdG8gTGVmdCcsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6Y29weS10by1sZWZ0J31cbiAgICAgICAgICBdXG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgKS5iaW5kKHRoaXMpICMgbWFrZSBzdXJlIHRoZSBzY29wZSBpcyBjb3JyZWN0XG5cbiAgIyBjYWxsZWQgYnkgYm90aCBkaWZmUGFuZXMgYW5kIHRoZSBlZGl0b3Igc3Vic2NyaXB0aW9uIHRvIHVwZGF0ZSB0aGUgZGlmZlxuICB1cGRhdGVEaWZmOiAoZWRpdG9ycykgLT5cbiAgICBAaXNFbmFibGVkID0gdHJ1ZVxuXG4gICAgIyBhdXRvIGhpZGUgdHJlZSB2aWV3IHdoaWxlIGRpZmZpbmcgIzgyXG4gICAgaGlkZVRyZWVWaWV3ID0gQG9wdGlvbnMuaGlkZVRyZWVWaWV3ID8gQF9nZXRDb25maWcoJ2hpZGVUcmVlVmlldycpXG4gICAgaWYgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRyZWUtdmlldycpICYmIGhpZGVUcmVlVmlld1xuICAgICAgQHdhc1RyZWVWaWV3T3BlbiA9IHRydWVcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ3RyZWUtdmlldzp0b2dnbGUnKVxuXG4gICAgIyBpZiB0aGVyZSBpcyBhIGRpZmYgYmVpbmcgY29tcHV0ZWQgaW4gdGhlIGJhY2tncm91bmQsIGNhbmNlbCBpdFxuICAgIGlmIEBwcm9jZXNzP1xuICAgICAgQHByb2Nlc3Mua2lsbCgpXG4gICAgICBAcHJvY2VzcyA9IG51bGxcblxuICAgIGlnbm9yZVdoaXRlc3BhY2UgPSBAb3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlID8gQF9nZXRDb25maWcoJ2lnbm9yZVdoaXRlc3BhY2UnKVxuICAgIGVkaXRvclBhdGhzID0gQF9jcmVhdGVUZW1wRmlsZXMoZWRpdG9ycylcblxuICAgICMgY3JlYXRlIHRoZSBsb2FkaW5nIHZpZXcgaWYgaXQgZG9lc24ndCBleGlzdCB5ZXRcbiAgICBpZiAhQGxvYWRpbmdWaWV3P1xuICAgICAgQGxvYWRpbmdWaWV3ID0gbmV3IExvYWRpbmdWaWV3KClcbiAgICAgIEBsb2FkaW5nVmlldy5jcmVhdGVNb2RhbCgpXG4gICAgQGxvYWRpbmdWaWV3LnNob3coKVxuXG4gICAgIyAtLS0ga2ljayBvZmYgYmFja2dyb3VuZCBwcm9jZXNzIHRvIGNvbXB1dGUgZGlmZiAtLS1cbiAgICB7QnVmZmVyZWROb2RlUHJvY2Vzc30gPSByZXF1aXJlICdhdG9tJ1xuICAgIGNvbW1hbmQgPSBwYXRoLnJlc29sdmUgX19kaXJuYW1lLCBcIi4vY29tcHV0ZS1kaWZmLmpzXCJcbiAgICBhcmdzID0gW2VkaXRvclBhdGhzLmVkaXRvcjFQYXRoLCBlZGl0b3JQYXRocy5lZGl0b3IyUGF0aCwgaWdub3JlV2hpdGVzcGFjZV1cbiAgICB0aGVPdXRwdXQgPSAnJ1xuICAgIHN0ZG91dCA9IChvdXRwdXQpID0+XG4gICAgICB0aGVPdXRwdXQgPSBvdXRwdXRcbiAgICAgIGNvbXB1dGVkRGlmZiA9IEpTT04ucGFyc2Uob3V0cHV0KVxuICAgICAgQHByb2Nlc3Mua2lsbCgpXG4gICAgICBAcHJvY2VzcyA9IG51bGxcbiAgICAgIEBsb2FkaW5nVmlldz8uaGlkZSgpXG4gICAgICBAX3Jlc3VtZVVwZGF0ZURpZmYoZWRpdG9ycywgY29tcHV0ZWREaWZmKVxuICAgIHN0ZGVyciA9IChlcnIpID0+XG4gICAgICB0aGVPdXRwdXQgPSBlcnJcbiAgICBleGl0ID0gKGNvZGUpID0+XG4gICAgICBAbG9hZGluZ1ZpZXc/LmhpZGUoKVxuXG4gICAgICBpZiBjb2RlICE9IDBcbiAgICAgICAgY29uc29sZS5sb2coJ0J1ZmZlcmVkTm9kZVByb2Nlc3MgY29kZSB3YXMgJyArIGNvZGUpXG4gICAgICAgIGNvbnNvbGUubG9nKHRoZU91dHB1dClcbiAgICBAcHJvY2VzcyA9IG5ldyBCdWZmZXJlZE5vZGVQcm9jZXNzKHtjb21tYW5kLCBhcmdzLCBzdGRvdXQsIHN0ZGVyciwgZXhpdH0pXG4gICAgIyAtLS0ga2ljayBvZmYgYmFja2dyb3VuZCBwcm9jZXNzIHRvIGNvbXB1dGUgZGlmZiAtLS1cblxuICAjIHJlc3VtZXMgYWZ0ZXIgdGhlIGNvbXB1dGUgZGlmZiBwcm9jZXNzIHJldHVybnNcbiAgX3Jlc3VtZVVwZGF0ZURpZmY6IChlZGl0b3JzLCBjb21wdXRlZERpZmYpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZGlmZlZpZXc/XG5cbiAgICBAZGlmZlZpZXcuY2xlYXJEaWZmKClcbiAgICBpZiBAc3luY1Njcm9sbD9cbiAgICAgIEBzeW5jU2Nyb2xsLmRpc3Bvc2UoKVxuICAgICAgQHN5bmNTY3JvbGwgPSBudWxsXG5cbiAgICAjIGdyYWIgdGhlIHNldHRpbmdzIGZvciB0aGUgZGlmZlxuICAgIGFkZGVkQ29sb3JTaWRlID0gQG9wdGlvbnMuYWRkZWRDb2xvclNpZGUgPyBAX2dldENvbmZpZygnY29sb3JzLmFkZGVkQ29sb3JTaWRlJylcbiAgICBkaWZmV29yZHMgPSBAb3B0aW9ucy5kaWZmV29yZHMgPyBAX2dldENvbmZpZygnZGlmZldvcmRzJylcbiAgICBpZ25vcmVXaGl0ZXNwYWNlID0gQG9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSA/IEBfZ2V0Q29uZmlnKCdpZ25vcmVXaGl0ZXNwYWNlJylcbiAgICBvdmVycmlkZVRoZW1lQ29sb3JzID0gQG9wdGlvbnMub3ZlcnJpZGVUaGVtZUNvbG9ycyA/IEBfZ2V0Q29uZmlnKCdjb2xvcnMub3ZlcnJpZGVUaGVtZUNvbG9ycycpXG5cbiAgICBAZGlmZlZpZXcuZGlzcGxheURpZmYoY29tcHV0ZWREaWZmLCBhZGRlZENvbG9yU2lkZSwgZGlmZldvcmRzLCBpZ25vcmVXaGl0ZXNwYWNlLCBvdmVycmlkZVRoZW1lQ29sb3JzKVxuXG4gICAgIyBnaXZlIHRoZSBtYXJrZXIgbGF5ZXJzIHRvIHRob3NlIHJlZ2lzdGVyZWQgd2l0aCB0aGUgc2VydmljZVxuICAgIHdoaWxlIEBzcGxpdERpZmZSZXNvbHZlcz8ubGVuZ3RoXG4gICAgICBAc3BsaXREaWZmUmVzb2x2ZXMucG9wKCkoQGRpZmZWaWV3LmdldE1hcmtlckxheWVycygpKVxuXG4gICAgQGZvb3RlclZpZXc/LnNldE51bURpZmZlcmVuY2VzKEBkaWZmVmlldy5nZXROdW1EaWZmZXJlbmNlcygpKVxuXG4gICAgc2Nyb2xsU3luY1R5cGUgPSBAb3B0aW9ucy5zY3JvbGxTeW5jVHlwZSA/IEBfZ2V0Q29uZmlnKCdzY3JvbGxTeW5jVHlwZScpXG4gICAgaWYgc2Nyb2xsU3luY1R5cGUgPT0gJ1ZlcnRpY2FsICsgSG9yaXpvbnRhbCdcbiAgICAgIEBzeW5jU2Nyb2xsID0gbmV3IFN5bmNTY3JvbGwoZWRpdG9ycy5lZGl0b3IxLCBlZGl0b3JzLmVkaXRvcjIsIHRydWUpXG4gICAgICBAc3luY1Njcm9sbC5zeW5jUG9zaXRpb25zKClcbiAgICBlbHNlIGlmIHNjcm9sbFN5bmNUeXBlID09ICdWZXJ0aWNhbCdcbiAgICAgIEBzeW5jU2Nyb2xsID0gbmV3IFN5bmNTY3JvbGwoZWRpdG9ycy5lZGl0b3IxLCBlZGl0b3JzLmVkaXRvcjIsIGZhbHNlKVxuICAgICAgQHN5bmNTY3JvbGwuc3luY1Bvc2l0aW9ucygpXG5cbiAgIyBHZXRzIHRoZSBmaXJzdCB0d28gdmlzaWJsZSBlZGl0b3JzIGZvdW5kIG9yIGNyZWF0ZXMgdGhlbSBhcyBuZWVkZWQuXG4gICMgUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggeWllbGRzIGEgdmFsdWUgb2Yge2VkaXRvcjE6IFRleHRFZGl0b3IsIGVkaXRvcjI6IFRleHRFZGl0b3J9XG4gIF9nZXRFZGl0b3JzRm9yUXVpY2tEaWZmOiAoKSAtPlxuICAgIGVkaXRvcjEgPSBudWxsXG4gICAgZWRpdG9yMiA9IG51bGxcblxuICAgICMgdHJ5IHRvIGZpbmQgdGhlIGZpcnN0IHR3byBlZGl0b3JzXG4gICAgcGFuZXMgPSBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRQYW5lcygpXG4gICAgZm9yIHAgaW4gcGFuZXNcbiAgICAgIGFjdGl2ZUl0ZW0gPSBwLmdldEFjdGl2ZUl0ZW0oKVxuICAgICAgaWYgYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGFjdGl2ZUl0ZW0pXG4gICAgICAgIGlmIGVkaXRvcjEgPT0gbnVsbFxuICAgICAgICAgIGVkaXRvcjEgPSBhY3RpdmVJdGVtXG4gICAgICAgIGVsc2UgaWYgZWRpdG9yMiA9PSBudWxsXG4gICAgICAgICAgZWRpdG9yMiA9IGFjdGl2ZUl0ZW1cbiAgICAgICAgICBicmVha1xuXG4gICAgIyBhdXRvIG9wZW4gZWRpdG9yIHBhbmVzIHNvIHdlIGhhdmUgdHdvIHRvIGRpZmYgd2l0aFxuICAgIGlmIGVkaXRvcjEgPT0gbnVsbFxuICAgICAgZWRpdG9yMSA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcigpXG4gICAgICBAd2FzRWRpdG9yMUNyZWF0ZWQgPSB0cnVlXG4gICAgICAjIGFkZCBmaXJzdCBlZGl0b3IgdG8gdGhlIGZpcnN0IHBhbmVcbiAgICAgIHBhbmVzWzBdLmFkZEl0ZW0oZWRpdG9yMSlcbiAgICAgIHBhbmVzWzBdLmFjdGl2YXRlSXRlbShlZGl0b3IxKVxuICAgIGlmIGVkaXRvcjIgPT0gbnVsbFxuICAgICAgZWRpdG9yMiA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcigpXG4gICAgICBAd2FzRWRpdG9yMkNyZWF0ZWQgPSB0cnVlXG4gICAgICBlZGl0b3IyLnNldEdyYW1tYXIoZWRpdG9yMS5nZXRHcmFtbWFyKCkpXG4gICAgICByaWdodFBhbmVJbmRleCA9IHBhbmVzLmluZGV4T2YoYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yMSkpICsgMVxuICAgICAgaWYgcGFuZXNbcmlnaHRQYW5lSW5kZXhdXG4gICAgICAgICMgYWRkIHNlY29uZCBlZGl0b3IgdG8gZXhpc3RpbmcgcGFuZSB0byB0aGUgcmlnaHQgb2YgZmlyc3QgZWRpdG9yXG4gICAgICAgIHBhbmVzW3JpZ2h0UGFuZUluZGV4XS5hZGRJdGVtKGVkaXRvcjIpXG4gICAgICAgIHBhbmVzW3JpZ2h0UGFuZUluZGV4XS5hY3RpdmF0ZUl0ZW0oZWRpdG9yMilcbiAgICAgIGVsc2VcbiAgICAgICAgIyBubyBleGlzdGluZyBwYW5lIHNvIHNwbGl0IHJpZ2h0XG4gICAgICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGVkaXRvcjEpLnNwbGl0UmlnaHQoe2l0ZW1zOiBbZWRpdG9yMl19KVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7ZWRpdG9yMTogZWRpdG9yMSwgZWRpdG9yMjogZWRpdG9yMn0pXG5cbiAgIyBHZXRzIHRoZSBhY3RpdmUgZWRpdG9yIGFuZCBvcGVucyB0aGUgc3BlY2lmaWVkIGZpbGUgdG8gdGhlIHJpZ2h0IG9mIGl0XG4gICMgUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggeWllbGRzIGEgdmFsdWUgb2Yge2VkaXRvcjE6IFRleHRFZGl0b3IsIGVkaXRvcjI6IFRleHRFZGl0b3J9XG4gIF9nZXRFZGl0b3JzRm9yRGlmZldpdGhBY3RpdmU6IChmaWxlUGF0aCkgLT5cbiAgICBhY3RpdmVFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiBhY3RpdmVFZGl0b3I/XG4gICAgICBlZGl0b3IxID0gYWN0aXZlRWRpdG9yXG4gICAgICBAd2FzRWRpdG9yMkNyZWF0ZWQgPSB0cnVlXG4gICAgICBwYW5lcyA9IGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldFBhbmVzKClcbiAgICAgICMgZ2V0IGluZGV4IG9mIHBhbmUgZm9sbG93aW5nIGFjdGl2ZSBlZGl0b3IgcGFuZVxuICAgICAgcmlnaHRQYW5lSW5kZXggPSBwYW5lcy5pbmRleE9mKGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGVkaXRvcjEpKSArIDFcbiAgICAgICMgcGFuZSBpcyBjcmVhdGVkIGlmIHRoZXJlIGlzIG5vdCBvbmUgdG8gdGhlIHJpZ2h0IG9mIHRoZSBhY3RpdmUgZWRpdG9yXG4gICAgICByaWdodFBhbmUgPSBwYW5lc1tyaWdodFBhbmVJbmRleF0gfHwgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yMSkuc3BsaXRSaWdodCgpXG4gICAgICBpZiBlZGl0b3IxLmdldFBhdGgoKSA9PSBmaWxlUGF0aFxuICAgICAgICAjIGlmIGRpZmZpbmcgd2l0aCBpdHNlbGYsIHNldCBmaWxlUGF0aCB0byBudWxsIHNvIGFuIGVtcHR5IGVkaXRvciBpc1xuICAgICAgICAjIG9wZW5lZCwgd2hpY2ggd2lsbCBjYXVzZSBhIGdpdCBkaWZmXG4gICAgICAgIGZpbGVQYXRoID0gbnVsbFxuICAgICAgZWRpdG9yMlByb21pc2UgPSBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lKGZpbGVQYXRoLCByaWdodFBhbmUpXG5cbiAgICAgIHJldHVybiBlZGl0b3IyUHJvbWlzZS50aGVuIChlZGl0b3IyKSAtPlxuICAgICAgICByZXR1cm4ge2VkaXRvcjE6IGVkaXRvcjEsIGVkaXRvcjI6IGVkaXRvcjJ9XG4gICAgZWxzZVxuICAgICAgbm9BY3RpdmVFZGl0b3JNc2cgPSAnTm8gYWN0aXZlIGZpbGUgZm91bmQhIChUcnkgZm9jdXNpbmcgYSB0ZXh0IGVkaXRvciknXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IG5vQWN0aXZlRWRpdG9yTXNnLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgX3NldHVwVmlzaWJsZUVkaXRvcnM6IChlZGl0b3IxLCBlZGl0b3IyKSAtPlxuICAgIEJ1ZmZlckV4dGVuZGVyID0gcmVxdWlyZSAnLi9idWZmZXItZXh0ZW5kZXInXG4gICAgYnVmZmVyMUxpbmVFbmRpbmcgPSAobmV3IEJ1ZmZlckV4dGVuZGVyKGVkaXRvcjEuZ2V0QnVmZmVyKCkpKS5nZXRMaW5lRW5kaW5nKClcblxuICAgIGlmIEB3YXNFZGl0b3IyQ3JlYXRlZFxuICAgICAgIyB3YW50IHRvIHNjcm9sbCBhIG5ld2x5IGNyZWF0ZWQgZWRpdG9yIHRvIHRoZSBmaXJzdCBlZGl0b3IncyBwb3NpdGlvblxuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcjEpLmZvY3VzKClcbiAgICAgICMgc2V0IHRoZSBwcmVmZXJyZWQgbGluZSBlbmRpbmcgYmVmb3JlIGluc2VydGluZyB0ZXh0ICMzOVxuICAgICAgaWYgYnVmZmVyMUxpbmVFbmRpbmcgPT0gJ1xcbicgfHwgYnVmZmVyMUxpbmVFbmRpbmcgPT0gJ1xcclxcbidcbiAgICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcjIub25XaWxsSW5zZXJ0VGV4dCAoKSAtPlxuICAgICAgICAgIGVkaXRvcjIuZ2V0QnVmZmVyKCkuc2V0UHJlZmVycmVkTGluZUVuZGluZyhidWZmZXIxTGluZUVuZGluZylcblxuICAgIEBfc2V0dXBHaXRSZXBvKGVkaXRvcjEsIGVkaXRvcjIpXG5cbiAgICAjIHVuZm9sZCBhbGwgbGluZXMgc28gZGlmZnMgcHJvcGVybHkgYWxpZ25cbiAgICBlZGl0b3IxLnVuZm9sZEFsbCgpXG4gICAgZWRpdG9yMi51bmZvbGRBbGwoKVxuXG4gICAgbXV0ZU5vdGlmaWNhdGlvbnMgPSBAb3B0aW9ucy5tdXRlTm90aWZpY2F0aW9ucyA/IEBfZ2V0Q29uZmlnKCdtdXRlTm90aWZpY2F0aW9ucycpXG4gICAgc29mdFdyYXBNc2cgPSAnV2FybmluZzogU29mdCB3cmFwIGVuYWJsZWQhIChMaW5lIGRpZmZzIG1heSBub3QgYWxpZ24pJ1xuICAgIGlmIGVkaXRvcjEuaXNTb2Z0V3JhcHBlZCgpICYmICFtdXRlTm90aWZpY2F0aW9uc1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ1NwbGl0IERpZmYnLCB7ZGV0YWlsOiBzb2Z0V3JhcE1zZywgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KVxuICAgIGVsc2UgaWYgZWRpdG9yMi5pc1NvZnRXcmFwcGVkKCkgJiYgIW11dGVOb3RpZmljYXRpb25zXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IHNvZnRXcmFwTXNnLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG5cbiAgICBidWZmZXIyTGluZUVuZGluZyA9IChuZXcgQnVmZmVyRXh0ZW5kZXIoZWRpdG9yMi5nZXRCdWZmZXIoKSkpLmdldExpbmVFbmRpbmcoKVxuICAgIGlmIGJ1ZmZlcjJMaW5lRW5kaW5nICE9ICcnICYmIChidWZmZXIxTGluZUVuZGluZyAhPSBidWZmZXIyTGluZUVuZGluZykgJiYgZWRpdG9yMS5nZXRMaW5lQ291bnQoKSAhPSAxICYmIGVkaXRvcjIuZ2V0TGluZUNvdW50KCkgIT0gMSAmJiAhbXV0ZU5vdGlmaWNhdGlvbnNcbiAgICAgICMgcG9wIHdhcm5pbmcgaWYgdGhlIGxpbmUgZW5kaW5ncyBkaWZmZXIgYW5kIHdlIGhhdmVuJ3QgZG9uZSBhbnl0aGluZyBhYm91dCBpdFxuICAgICAgbGluZUVuZGluZ01zZyA9ICdXYXJuaW5nOiBMaW5lIGVuZGluZ3MgZGlmZmVyISdcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKCdTcGxpdCBEaWZmJywge2RldGFpbDogbGluZUVuZGluZ01zZywgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KVxuXG4gIF9zZXR1cEdpdFJlcG86IChlZGl0b3IxLCBlZGl0b3IyKSAtPlxuICAgIGVkaXRvcjFQYXRoID0gZWRpdG9yMS5nZXRQYXRoKClcbiAgICAjIG9ubHkgc2hvdyBnaXQgY2hhbmdlcyBpZiB0aGUgcmlnaHQgZWRpdG9yIGlzIGVtcHR5XG4gICAgaWYgZWRpdG9yMVBhdGg/ICYmIChlZGl0b3IyLmdldExpbmVDb3VudCgpID09IDEgJiYgZWRpdG9yMi5saW5lVGV4dEZvckJ1ZmZlclJvdygwKSA9PSAnJylcbiAgICAgIGZvciBkaXJlY3RvcnksIGkgaW4gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClcbiAgICAgICAgaWYgZWRpdG9yMVBhdGggaXMgZGlyZWN0b3J5LmdldFBhdGgoKSBvciBkaXJlY3RvcnkuY29udGFpbnMoZWRpdG9yMVBhdGgpXG4gICAgICAgICAgcHJvamVjdFJlcG8gPSBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbaV1cbiAgICAgICAgICBpZiBwcm9qZWN0UmVwbz8gJiYgcHJvamVjdFJlcG8ucmVwbz9cbiAgICAgICAgICAgIHJlbGF0aXZlRWRpdG9yMVBhdGggPSBwcm9qZWN0UmVwby5yZWxhdGl2aXplKGVkaXRvcjFQYXRoKVxuICAgICAgICAgICAgZ2l0SGVhZFRleHQgPSBwcm9qZWN0UmVwby5yZXBvLmdldEhlYWRCbG9iKHJlbGF0aXZlRWRpdG9yMVBhdGgpXG4gICAgICAgICAgICBpZiBnaXRIZWFkVGV4dD9cbiAgICAgICAgICAgICAgZWRpdG9yMi5zZWxlY3RBbGwoKVxuICAgICAgICAgICAgICBlZGl0b3IyLmluc2VydFRleHQoZ2l0SGVhZFRleHQpXG4gICAgICAgICAgICAgIEBoYXNHaXRSZXBvID0gdHJ1ZVxuICAgICAgICAgICAgICBicmVha1xuXG4gICMgY3JlYXRlcyB0ZW1wIGZpbGVzIHNvIHRoZSBjb21wdXRlIGRpZmYgcHJvY2VzcyBjYW4gZ2V0IHRoZSB0ZXh0IGVhc2lseVxuICBfY3JlYXRlVGVtcEZpbGVzOiAoZWRpdG9ycykgLT5cbiAgICBlZGl0b3IxUGF0aCA9ICcnXG4gICAgZWRpdG9yMlBhdGggPSAnJ1xuICAgIHRlbXBGb2xkZXJQYXRoID0gYXRvbS5nZXRDb25maWdEaXJQYXRoKCkgKyAnL3NwbGl0LWRpZmYnXG5cbiAgICBlZGl0b3IxUGF0aCA9IHRlbXBGb2xkZXJQYXRoICsgJy9zcGxpdC1kaWZmIDEnXG4gICAgZWRpdG9yMVRlbXBGaWxlID0gbmV3IEZpbGUoZWRpdG9yMVBhdGgpXG4gICAgZWRpdG9yMVRlbXBGaWxlLndyaXRlU3luYyhlZGl0b3JzLmVkaXRvcjEuZ2V0VGV4dCgpKVxuXG4gICAgZWRpdG9yMlBhdGggPSB0ZW1wRm9sZGVyUGF0aCArICcvc3BsaXQtZGlmZiAyJ1xuICAgIGVkaXRvcjJUZW1wRmlsZSA9IG5ldyBGaWxlKGVkaXRvcjJQYXRoKVxuICAgIGVkaXRvcjJUZW1wRmlsZS53cml0ZVN5bmMoZWRpdG9ycy5lZGl0b3IyLmdldFRleHQoKSlcblxuICAgIGVkaXRvclBhdGhzID1cbiAgICAgIGVkaXRvcjFQYXRoOiBlZGl0b3IxUGF0aFxuICAgICAgZWRpdG9yMlBhdGg6IGVkaXRvcjJQYXRoXG5cbiAgICByZXR1cm4gZWRpdG9yUGF0aHNcblxuXG4gIF9nZXRDb25maWc6IChjb25maWcpIC0+XG4gICAgYXRvbS5jb25maWcuZ2V0KFwic3BsaXQtZGlmZi4je2NvbmZpZ31cIilcblxuICBfc2V0Q29uZmlnOiAoY29uZmlnLCB2YWx1ZSkgLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQoXCJzcGxpdC1kaWZmLiN7Y29uZmlnfVwiLCB2YWx1ZSlcblxuXG4gICMgLS0tIFNFUlZJQ0UgQVBJIC0tLVxuICBnZXRNYXJrZXJMYXllcnM6ICgpIC0+XG4gICAgbmV3IFByb21pc2UgKChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICBAc3BsaXREaWZmUmVzb2x2ZXMucHVzaChyZXNvbHZlKVxuICAgICkuYmluZCh0aGlzKVxuXG4gIGRpZmZFZGl0b3JzOiAoZWRpdG9yMSwgZWRpdG9yMiwgb3B0aW9ucykgLT5cbiAgICBAZGlmZlBhbmVzKG51bGwsIFByb21pc2UucmVzb2x2ZSh7ZWRpdG9yMTogZWRpdG9yMSwgZWRpdG9yMjogZWRpdG9yMn0pLCBvcHRpb25zKVxuXG4gIHByb3ZpZGVTcGxpdERpZmY6IC0+XG4gICAgZ2V0TWFya2VyTGF5ZXJzOiBAZ2V0TWFya2VyTGF5ZXJzLmJpbmQoQGNvbnRleHRGb3JTZXJ2aWNlKVxuICAgIGRpZmZFZGl0b3JzOiBAZGlmZkVkaXRvcnMuYmluZChAY29udGV4dEZvclNlcnZpY2UpXG4gICAgZGlzYWJsZTogQGRpc2FibGUuYmluZChAY29udGV4dEZvclNlcnZpY2UpXG4iXX0=
