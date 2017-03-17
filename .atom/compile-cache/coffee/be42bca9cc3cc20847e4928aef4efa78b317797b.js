(function() {
  var CompositeDisposable, DiffView, Directory, File, FooterView, LoadingView, SplitDiff, SyncScroll, configSchema, path, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Directory = ref.Directory, File = ref.File;

  DiffView = require('./diff-view');

  LoadingView = require('./ui/loading-view');

  FooterView = require('./ui/footer-view');

  SyncScroll = require('./sync-scroll');

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
    process: null,
    activate: function(state) {
      window.splitDiffResolves = [];
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
      this.wasEditor1Created = false;
      this.wasEditor2Created = false;
      this.hasGitRepo = false;
      if (this._getConfig('hideTreeView')) {
        return atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');
      }
    },
    toggleIgnoreWhitespace: function() {
      var isWhitespaceIgnored, ref1;
      isWhitespaceIgnored = this._getConfig('ignoreWhitespace');
      this._setConfig('ignoreWhitespace', !isWhitespaceIgnored);
      return (ref1 = this.footerView) != null ? ref1.setIgnoreWhitespace(!isWhitespaceIgnored) : void 0;
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
    diffPanes: function(event) {
      var editorsPromise, filePath;
      this.disable();
      this.editorSubscriptions = new CompositeDisposable();
      if (event != null ? event.currentTarget.classList.contains('tab') : void 0) {
        filePath = event.currentTarget.path;
        editorsPromise = this._getEditorsForDiffWithActive(filePath);
      } else if ((event != null ? event.currentTarget.classList.contains('list-item') : void 0) && (event != null ? event.currentTarget.classList.contains('file') : void 0)) {
        filePath = event.currentTarget.getPath();
        editorsPromise = this._getEditorsForDiffWithActive(filePath);
      } else {
        editorsPromise = this._getEditorsForQuickDiff();
      }
      return editorsPromise.then((function(editors) {
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
        if (this.footerView == null) {
          this.footerView = new FooterView(this._getConfig('ignoreWhitespace'));
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
      var BufferedNodeProcess, args, command, editorPaths, exit, isWhitespaceIgnored, stderr, stdout, theOutput;
      this.isEnabled = true;
      if (this._getConfig('hideTreeView') && document.querySelector('.tree-view')) {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:toggle');
      }
      if (this.process != null) {
        this.process.kill();
        this.process = null;
      }
      isWhitespaceIgnored = this._getConfig('ignoreWhitespace');
      editorPaths = this._createTempFiles(editors);
      if (this.loadingView == null) {
        this.loadingView = new LoadingView();
        this.loadingView.createModal();
      }
      this.loadingView.show();
      BufferedNodeProcess = require('atom').BufferedNodeProcess;
      command = path.resolve(__dirname, "./compute-diff.js");
      args = [editorPaths.editor1Path, editorPaths.editor2Path, isWhitespaceIgnored];
      theOutput = '';
      stdout = (function(_this) {
        return function(output) {
          var computedDiff, ref1;
          theOutput = output;
          computedDiff = JSON.parse(output);
          _this.process.kill();
          _this.process = null;
          if ((ref1 = _this.loadingView) != null) {
            ref1.hide();
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
          var ref1;
          if ((ref1 = _this.loadingView) != null) {
            ref1.hide();
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
      var leftHighlightType, ref1, ref2, rightHighlightType, scrollSyncType;
      this.diffView.clearDiff();
      if (this.syncScroll != null) {
        this.syncScroll.dispose();
        this.syncScroll = null;
      }
      leftHighlightType = 'added';
      rightHighlightType = 'removed';
      if (this._getConfig('leftEditorColor') === 'red') {
        leftHighlightType = 'removed';
      }
      if (this._getConfig('rightEditorColor') === 'green') {
        rightHighlightType = 'added';
      }
      this.diffView.displayDiff(computedDiff, leftHighlightType, rightHighlightType, this._getConfig('diffWords'), this._getConfig('ignoreWhitespace'));
      while ((ref1 = window.splitDiffResolves) != null ? ref1.length : void 0) {
        window.splitDiffResolves.pop()(this.diffView.getMarkerLayers());
      }
      if ((ref2 = this.footerView) != null) {
        ref2.setNumDifferences(this.diffView.getNumDifferences());
      }
      scrollSyncType = this._getConfig('scrollSyncType');
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
      panes = atom.workspace.getPanes();
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
      activeEditor = atom.workspace.getActiveTextEditor();
      if (activeEditor != null) {
        editor1 = activeEditor;
        this.wasEditor2Created = true;
        panes = atom.workspace.getPanes();
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
      var BufferExtender, buffer1LineEnding, buffer2LineEnding, lineEndingMsg, shouldNotify, softWrapMsg;
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
      shouldNotify = !this._getConfig('muteNotifications');
      softWrapMsg = 'Warning: Soft wrap enabled! (Line diffs may not align)';
      if (editor1.isSoftWrapped() && shouldNotify) {
        atom.notifications.addWarning('Split Diff', {
          detail: softWrapMsg,
          dismissable: false,
          icon: 'diff'
        });
      } else if (editor2.isSoftWrapped() && shouldNotify) {
        atom.notifications.addWarning('Split Diff', {
          detail: softWrapMsg,
          dismissable: false,
          icon: 'diff'
        });
      }
      buffer2LineEnding = (new BufferExtender(editor2.getBuffer())).getLineEnding();
      if (buffer2LineEnding !== '' && (buffer1LineEnding !== buffer2LineEnding) && editor1.getLineCount() !== 1 && editor2.getLineCount() !== 1 && shouldNotify) {
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
      return new Promise(function(resolve, reject) {
        return window.splitDiffResolves.push(resolve);
      });
    },
    provideSplitDiff: function() {
      return {
        getMarkerLayers: this.getMarkerLayers
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvc3BsaXQtZGlmZi9saWIvc3BsaXQtZGlmZi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQXlDLE9BQUEsQ0FBUSxNQUFSLENBQXpDLEVBQUMsNkNBQUQsRUFBc0IseUJBQXRCLEVBQWlDOztFQUNqQyxRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsV0FBQSxHQUFjLE9BQUEsQ0FBUSxtQkFBUjs7RUFDZCxVQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztFQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUNmLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFBLEdBQ2Y7SUFBQSxRQUFBLEVBQVUsSUFBVjtJQUNBLE1BQUEsRUFBUSxZQURSO0lBRUEsYUFBQSxFQUFlLElBRmY7SUFHQSxtQkFBQSxFQUFxQixJQUhyQjtJQUlBLFNBQUEsRUFBVyxLQUpYO0lBS0EsaUJBQUEsRUFBbUIsS0FMbkI7SUFNQSxpQkFBQSxFQUFtQixLQU5uQjtJQU9BLFVBQUEsRUFBWSxLQVBaO0lBUUEsT0FBQSxFQUFTLElBUlQ7SUFVQSxRQUFBLEVBQVUsU0FBQyxLQUFEO01BQ1IsTUFBTSxDQUFDLGlCQUFQLEdBQTJCO01BRTNCLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsbUJBQUEsQ0FBQTthQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLHVEQUFsQixFQUNqQjtRQUFBLG1CQUFBLEVBQXFCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDtZQUNuQixLQUFDLENBQUEsU0FBRCxDQUFXLENBQVg7bUJBQ0EsQ0FBQyxDQUFD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bVpBLFVBQUEsRUFBWSxTQUFDLE1BQUQ7YUFDVixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsYUFBQSxHQUFjLE1BQTlCO0lBRFUsQ0FuWlo7SUFzWkEsVUFBQSxFQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7YUFDVixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsYUFBQSxHQUFjLE1BQTlCLEVBQXdDLEtBQXhDO0lBRFUsQ0F0Wlo7SUEyWkEsZUFBQSxFQUFpQixTQUFBO2FBQ1gsSUFBQSxPQUFBLENBQVEsU0FBQyxPQUFELEVBQVUsTUFBVjtlQUNWLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUF6QixDQUE4QixPQUE5QjtNQURVLENBQVI7SUFEVyxDQTNaakI7SUErWkEsZ0JBQUEsRUFBa0IsU0FBQTthQUNoQjtRQUFBLGVBQUEsRUFBaUIsSUFBQyxDQUFBLGVBQWxCOztJQURnQixDQS9abEI7O0FBVEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlyZWN0b3J5LCBGaWxlfSA9IHJlcXVpcmUgJ2F0b20nXG5EaWZmVmlldyA9IHJlcXVpcmUgJy4vZGlmZi12aWV3J1xuTG9hZGluZ1ZpZXcgPSByZXF1aXJlICcuL3VpL2xvYWRpbmctdmlldydcbkZvb3RlclZpZXcgPSByZXF1aXJlICcuL3VpL2Zvb3Rlci12aWV3J1xuU3luY1Njcm9sbCA9IHJlcXVpcmUgJy4vc3luYy1zY3JvbGwnXG5jb25maWdTY2hlbWEgPSByZXF1aXJlICcuL2NvbmZpZy1zY2hlbWEnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxpdERpZmYgPVxuICBkaWZmVmlldzogbnVsbFxuICBjb25maWc6IGNvbmZpZ1NjaGVtYVxuICBzdWJzY3JpcHRpb25zOiBudWxsXG4gIGVkaXRvclN1YnNjcmlwdGlvbnM6IG51bGxcbiAgaXNFbmFibGVkOiBmYWxzZVxuICB3YXNFZGl0b3IxQ3JlYXRlZDogZmFsc2VcbiAgd2FzRWRpdG9yMkNyZWF0ZWQ6IGZhbHNlXG4gIGhhc0dpdFJlcG86IGZhbHNlXG4gIHByb2Nlc3M6IG51bGxcblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIHdpbmRvdy5zcGxpdERpZmZSZXNvbHZlcyA9IFtdXG5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlLCAudHJlZS12aWV3IC5zZWxlY3RlZCwgLnRhYi50ZXh0ZWRpdG9yJyxcbiAgICAgICdzcGxpdC1kaWZmOmVuYWJsZSc6IChlKSA9PlxuICAgICAgICBAZGlmZlBhbmVzKGUpXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICdzcGxpdC1kaWZmOm5leHQtZGlmZic6ID0+XG4gICAgICAgIGlmIEBpc0VuYWJsZWRcbiAgICAgICAgICBAbmV4dERpZmYoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGRpZmZQYW5lcygpXG4gICAgICAnc3BsaXQtZGlmZjpwcmV2LWRpZmYnOiA9PlxuICAgICAgICBpZiBAaXNFbmFibGVkXG4gICAgICAgICAgQHByZXZEaWZmKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBkaWZmUGFuZXMoKVxuICAgICAgJ3NwbGl0LWRpZmY6Y29weS10by1yaWdodCc6ID0+XG4gICAgICAgIGlmIEBpc0VuYWJsZWRcbiAgICAgICAgICBAY29weVRvUmlnaHQoKVxuICAgICAgJ3NwbGl0LWRpZmY6Y29weS10by1sZWZ0JzogPT5cbiAgICAgICAgaWYgQGlzRW5hYmxlZFxuICAgICAgICAgIEBjb3B5VG9MZWZ0KClcbiAgICAgICdzcGxpdC1kaWZmOmRpc2FibGUnOiA9PiBAZGlzYWJsZSgpXG4gICAgICAnc3BsaXQtZGlmZjppZ25vcmUtd2hpdGVzcGFjZSc6ID0+IEB0b2dnbGVJZ25vcmVXaGl0ZXNwYWNlKClcbiAgICAgICdzcGxpdC1kaWZmOnRvZ2dsZSc6ID0+IEB0b2dnbGUoKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGRpc2FibGUoKVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gICMgY2FsbGVkIGJ5IFwidG9nZ2xlXCIgY29tbWFuZFxuICAjIHRvZ2dsZXMgc3BsaXQgZGlmZlxuICB0b2dnbGU6ICgpIC0+XG4gICAgaWYgQGlzRW5hYmxlZFxuICAgICAgQGRpc2FibGUoKVxuICAgIGVsc2VcbiAgICAgIEBkaWZmUGFuZXMoKVxuXG4gICMgY2FsbGVkIGJ5IFwiRGlzYWJsZVwiIGNvbW1hbmRcbiAgIyByZW1vdmVzIGRpZmYgYW5kIHN5bmMgc2Nyb2xsLCBkaXNwb3NlcyBvZiBzdWJzY3JpcHRpb25zXG4gIGRpc2FibGU6ICgpIC0+XG4gICAgQGlzRW5hYmxlZCA9IGZhbHNlXG5cbiAgICAjIHJlbW92ZSBsaXN0ZW5lcnNcbiAgICBpZiBAZWRpdG9yU3Vic2NyaXB0aW9ucz9cbiAgICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICBpZiBAZGlmZlZpZXc/XG4gICAgICBpZiBAd2FzRWRpdG9yMUNyZWF0ZWRcbiAgICAgICAgQGRpZmZWaWV3LmNsZWFuVXBFZGl0b3IoMSlcbiAgICAgIGlmIEB3YXNFZGl0b3IyQ3JlYXRlZFxuICAgICAgICBAZGlmZlZpZXcuY2xlYW5VcEVkaXRvcigyKVxuICAgICAgQGRpZmZWaWV3LmRlc3Ryb3koKVxuICAgICAgQGRpZmZWaWV3ID0gbnVsbFxuXG4gICAgIyByZW1vdmUgdmlld3NcbiAgICBpZiBAZm9vdGVyVmlldz9cbiAgICAgIEBmb290ZXJWaWV3LmRlc3Ryb3koKVxuICAgICAgQGZvb3RlclZpZXcgPSBudWxsXG4gICAgaWYgQGxvYWRpbmdWaWV3P1xuICAgICAgQGxvYWRpbmdWaWV3LmRlc3Ryb3koKVxuICAgICAgQGxvYWRpbmdWaWV3ID0gbnVsbFxuXG4gICAgaWYgQHN5bmNTY3JvbGw/XG4gICAgICBAc3luY1Njcm9sbC5kaXNwb3NlKClcbiAgICAgIEBzeW5jU2Nyb2xsID0gbnVsbFxuXG4gICAgIyByZXNldCBhbGwgdmFyaWFibGVzXG4gICAgQHdhc0VkaXRvcjFDcmVhdGVkID0gZmFsc2VcbiAgICBAd2FzRWRpdG9yMkNyZWF0ZWQgPSBmYWxzZVxuICAgIEBoYXNHaXRSZXBvID0gZmFsc2VcblxuICAgICMgYXV0byBoaWRlIHRyZWUgdmlldyB3aGlsZSBkaWZmaW5nICM4MlxuICAgIGlmIEBfZ2V0Q29uZmlnKCdoaWRlVHJlZVZpZXcnKVxuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAndHJlZS12aWV3OnNob3cnKVxuXG4gICMgY2FsbGVkIGJ5IFwidG9nZ2xlIGlnbm9yZSB3aGl0ZXNwYWNlXCIgY29tbWFuZFxuICAjIHRvZ2dsZXMgaWdub3Jpbmcgd2hpdGVzcGFjZSBhbmQgcmVmcmVzaGVzIHRoZSBkaWZmXG4gIHRvZ2dsZUlnbm9yZVdoaXRlc3BhY2U6IC0+XG4gICAgaXNXaGl0ZXNwYWNlSWdub3JlZCA9IEBfZ2V0Q29uZmlnKCdpZ25vcmVXaGl0ZXNwYWNlJylcbiAgICBAX3NldENvbmZpZygnaWdub3JlV2hpdGVzcGFjZScsICFpc1doaXRlc3BhY2VJZ25vcmVkKVxuICAgIEBmb290ZXJWaWV3Py5zZXRJZ25vcmVXaGl0ZXNwYWNlKCFpc1doaXRlc3BhY2VJZ25vcmVkKVxuXG4gICMgY2FsbGVkIGJ5IFwiTW92ZSB0byBuZXh0IGRpZmZcIiBjb21tYW5kXG4gIG5leHREaWZmOiAtPlxuICAgIGlmIEBkaWZmVmlldz9cbiAgICAgIHNlbGVjdGVkSW5kZXggPSBAZGlmZlZpZXcubmV4dERpZmYoKVxuICAgICAgQGZvb3RlclZpZXc/LnNob3dTZWxlY3Rpb25Db3VudCggc2VsZWN0ZWRJbmRleCArIDEgKVxuXG4gICMgY2FsbGVkIGJ5IFwiTW92ZSB0byBwcmV2aW91cyBkaWZmXCIgY29tbWFuZFxuICBwcmV2RGlmZjogLT5cbiAgICBpZiBAZGlmZlZpZXc/XG4gICAgICBzZWxlY3RlZEluZGV4ID0gQGRpZmZWaWV3LnByZXZEaWZmKClcbiAgICAgIEBmb290ZXJWaWV3Py5zaG93U2VsZWN0aW9uQ291bnQoIHNlbGVjdGVkSW5kZXggKyAxIClcblxuICAjIGNhbGxlZCBieSBcIkNvcHkgdG8gcmlnaHRcIiBjb21tYW5kXG4gIGNvcHlUb1JpZ2h0OiAtPlxuICAgIGlmIEBkaWZmVmlldz9cbiAgICAgIEBkaWZmVmlldy5jb3B5VG9SaWdodCgpXG4gICAgICBAZm9vdGVyVmlldz8uaGlkZVNlbGVjdGlvbkNvdW50KClcblxuICAjIGNhbGxlZCBieSBcIkNvcHkgdG8gbGVmdFwiIGNvbW1hbmRcbiAgY29weVRvTGVmdDogLT5cbiAgICBpZiBAZGlmZlZpZXc/XG4gICAgICBAZGlmZlZpZXcuY29weVRvTGVmdCgpXG4gICAgICBAZm9vdGVyVmlldz8uaGlkZVNlbGVjdGlvbkNvdW50KClcblxuICAjIGNhbGxlZCBieSB0aGUgY29tbWFuZHMgZW5hYmxlL3RvZ2dsZSB0byBkbyBpbml0aWFsIGRpZmZcbiAgIyBzZXRzIHVwIHN1YnNjcmlwdGlvbnMgZm9yIGF1dG8gZGlmZiBhbmQgZGlzYWJsaW5nIHdoZW4gYSBwYW5lIGlzIGRlc3Ryb3llZFxuICAjIGV2ZW50IGlzIGFuIG9wdGlvbmFsIGFyZ3VtZW50IG9mIGEgZmlsZSBwYXRoIHRvIGRpZmYgd2l0aCBjdXJyZW50XG4gIGRpZmZQYW5lczogKGV2ZW50KSAtPlxuICAgICMgaW4gY2FzZSBlbmFibGUgd2FzIGNhbGxlZCBhZ2FpblxuICAgIEBkaXNhYmxlKClcblxuICAgIEBlZGl0b3JTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgaWYgZXZlbnQ/LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0YWInKVxuICAgICAgZmlsZVBhdGggPSBldmVudC5jdXJyZW50VGFyZ2V0LnBhdGhcbiAgICAgIGVkaXRvcnNQcm9taXNlID0gQF9nZXRFZGl0b3JzRm9yRGlmZldpdGhBY3RpdmUoZmlsZVBhdGgpXG4gICAgZWxzZSBpZiBldmVudD8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2xpc3QtaXRlbScpICYmIGV2ZW50Py5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZmlsZScpXG4gICAgICBmaWxlUGF0aCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZ2V0UGF0aCgpXG4gICAgICBlZGl0b3JzUHJvbWlzZSA9IEBfZ2V0RWRpdG9yc0ZvckRpZmZXaXRoQWN0aXZlKGZpbGVQYXRoKVxuICAgIGVsc2VcbiAgICAgIGVkaXRvcnNQcm9taXNlID0gQF9nZXRFZGl0b3JzRm9yUXVpY2tEaWZmKClcblxuICAgIGVkaXRvcnNQcm9taXNlLnRoZW4gKChlZGl0b3JzKSAtPlxuICAgICAgaWYgZWRpdG9ycyA9PSBudWxsXG4gICAgICAgIHJldHVyblxuICAgICAgQF9zZXR1cFZpc2libGVFZGl0b3JzKGVkaXRvcnMuZWRpdG9yMSwgZWRpdG9ycy5lZGl0b3IyKVxuICAgICAgQGRpZmZWaWV3ID0gbmV3IERpZmZWaWV3KGVkaXRvcnMpXG5cbiAgICAgICMgYWRkIGxpc3RlbmVyc1xuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcnMuZWRpdG9yMS5vbkRpZFN0b3BDaGFuZ2luZyA9PlxuICAgICAgICBAdXBkYXRlRGlmZihlZGl0b3JzKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcnMuZWRpdG9yMi5vbkRpZFN0b3BDaGFuZ2luZyA9PlxuICAgICAgICBAdXBkYXRlRGlmZihlZGl0b3JzKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcnMuZWRpdG9yMS5vbkRpZERlc3Ryb3kgPT5cbiAgICAgICAgQGRpc2FibGUoKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcnMuZWRpdG9yMi5vbkRpZERlc3Ryb3kgPT5cbiAgICAgICAgQGRpc2FibGUoKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdzcGxpdC1kaWZmJywgKCkgPT5cbiAgICAgICAgQHVwZGF0ZURpZmYoZWRpdG9ycylcblxuICAgICAgIyBhZGQgdGhlIGJvdHRvbSBVSSBwYW5lbFxuICAgICAgaWYgIUBmb290ZXJWaWV3P1xuICAgICAgICBAZm9vdGVyVmlldyA9IG5ldyBGb290ZXJWaWV3KEBfZ2V0Q29uZmlnKCdpZ25vcmVXaGl0ZXNwYWNlJykpXG4gICAgICAgIEBmb290ZXJWaWV3LmNyZWF0ZVBhbmVsKClcbiAgICAgIEBmb290ZXJWaWV3LnNob3coKVxuXG4gICAgICAjIHVwZGF0ZSBkaWZmIGlmIHRoZXJlIGlzIG5vIGdpdCByZXBvIChubyBvbmNoYW5nZSBmaXJlZClcbiAgICAgIGlmICFAaGFzR2l0UmVwb1xuICAgICAgICBAdXBkYXRlRGlmZihlZGl0b3JzKVxuXG4gICAgICAjIGFkZCBhcHBsaWNhdGlvbiBtZW51IGl0ZW1zXG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5tZW51LmFkZCBbXG4gICAgICAgIHtcbiAgICAgICAgICAnbGFiZWwnOiAnUGFja2FnZXMnXG4gICAgICAgICAgJ3N1Ym1lbnUnOiBbXG4gICAgICAgICAgICAnbGFiZWwnOiAnU3BsaXQgRGlmZidcbiAgICAgICAgICAgICdzdWJtZW51JzogW1xuICAgICAgICAgICAgICB7ICdsYWJlbCc6ICdJZ25vcmUgV2hpdGVzcGFjZScsICdjb21tYW5kJzogJ3NwbGl0LWRpZmY6aWdub3JlLXdoaXRlc3BhY2UnIH1cbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnTW92ZSB0byBOZXh0IERpZmYnLCAnY29tbWFuZCc6ICdzcGxpdC1kaWZmOm5leHQtZGlmZicgfVxuICAgICAgICAgICAgICB7ICdsYWJlbCc6ICdNb3ZlIHRvIFByZXZpb3VzIERpZmYnLCAnY29tbWFuZCc6ICdzcGxpdC1kaWZmOnByZXYtZGlmZicgfVxuICAgICAgICAgICAgICB7ICdsYWJlbCc6ICdDb3B5IHRvIFJpZ2h0JywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpjb3B5LXRvLXJpZ2h0J31cbiAgICAgICAgICAgICAgeyAnbGFiZWwnOiAnQ29weSB0byBMZWZ0JywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpjb3B5LXRvLWxlZnQnfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29udGV4dE1lbnUuYWRkIHtcbiAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3InOiBbe1xuICAgICAgICAgICdsYWJlbCc6ICdTcGxpdCBEaWZmJyxcbiAgICAgICAgICAnc3VibWVudSc6IFtcbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ0lnbm9yZSBXaGl0ZXNwYWNlJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjppZ25vcmUtd2hpdGVzcGFjZScgfVxuICAgICAgICAgICAgeyAnbGFiZWwnOiAnTW92ZSB0byBOZXh0IERpZmYnLCAnY29tbWFuZCc6ICdzcGxpdC1kaWZmOm5leHQtZGlmZicgfVxuICAgICAgICAgICAgeyAnbGFiZWwnOiAnTW92ZSB0byBQcmV2aW91cyBEaWZmJywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpwcmV2LWRpZmYnIH1cbiAgICAgICAgICAgIHsgJ2xhYmVsJzogJ0NvcHkgdG8gUmlnaHQnLCAnY29tbWFuZCc6ICdzcGxpdC1kaWZmOmNvcHktdG8tcmlnaHQnfVxuICAgICAgICAgICAgeyAnbGFiZWwnOiAnQ29weSB0byBMZWZ0JywgJ2NvbW1hbmQnOiAnc3BsaXQtZGlmZjpjb3B5LXRvLWxlZnQnfVxuICAgICAgICAgIF1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICAgICkuYmluZCh0aGlzKSAjIG1ha2Ugc3VyZSB0aGUgc2NvcGUgaXMgY29ycmVjdFxuXG4gICMgY2FsbGVkIGJ5IGJvdGggZGlmZlBhbmVzIGFuZCB0aGUgZWRpdG9yIHN1YnNjcmlwdGlvbiB0byB1cGRhdGUgdGhlIGRpZmZcbiAgdXBkYXRlRGlmZjogKGVkaXRvcnMpIC0+XG4gICAgQGlzRW5hYmxlZCA9IHRydWVcblxuICAgICMgYXV0byBoaWRlIHRyZWUgdmlldyB3aGlsZSBkaWZmaW5nICM4MlxuICAgIGlmIEBfZ2V0Q29uZmlnKCdoaWRlVHJlZVZpZXcnKSAmJiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudHJlZS12aWV3JylcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ3RyZWUtdmlldzp0b2dnbGUnKVxuXG4gICAgIyBpZiB0aGVyZSBpcyBhIGRpZmYgYmVpbmcgY29tcHV0ZWQgaW4gdGhlIGJhY2tncm91bmQsIGNhbmNlbCBpdFxuICAgIGlmIEBwcm9jZXNzP1xuICAgICAgQHByb2Nlc3Mua2lsbCgpXG4gICAgICBAcHJvY2VzcyA9IG51bGxcblxuICAgIGlzV2hpdGVzcGFjZUlnbm9yZWQgPSBAX2dldENvbmZpZygnaWdub3JlV2hpdGVzcGFjZScpXG4gICAgZWRpdG9yUGF0aHMgPSBAX2NyZWF0ZVRlbXBGaWxlcyhlZGl0b3JzKVxuXG4gICAgIyBjcmVhdGUgdGhlIGxvYWRpbmcgdmlldyBpZiBpdCBkb2Vzbid0IGV4aXN0IHlldFxuICAgIGlmICFAbG9hZGluZ1ZpZXc/XG4gICAgICBAbG9hZGluZ1ZpZXcgPSBuZXcgTG9hZGluZ1ZpZXcoKVxuICAgICAgQGxvYWRpbmdWaWV3LmNyZWF0ZU1vZGFsKClcbiAgICBAbG9hZGluZ1ZpZXcuc2hvdygpXG5cbiAgICAjIC0tLSBraWNrIG9mZiBiYWNrZ3JvdW5kIHByb2Nlc3MgdG8gY29tcHV0ZSBkaWZmIC0tLVxuICAgIHtCdWZmZXJlZE5vZGVQcm9jZXNzfSA9IHJlcXVpcmUgJ2F0b20nXG4gICAgY29tbWFuZCA9IHBhdGgucmVzb2x2ZSBfX2Rpcm5hbWUsIFwiLi9jb21wdXRlLWRpZmYuanNcIlxuICAgIGFyZ3MgPSBbZWRpdG9yUGF0aHMuZWRpdG9yMVBhdGgsIGVkaXRvclBhdGhzLmVkaXRvcjJQYXRoLCBpc1doaXRlc3BhY2VJZ25vcmVkXVxuICAgIHRoZU91dHB1dCA9ICcnXG4gICAgc3Rkb3V0ID0gKG91dHB1dCkgPT5cbiAgICAgIHRoZU91dHB1dCA9IG91dHB1dFxuICAgICAgY29tcHV0ZWREaWZmID0gSlNPTi5wYXJzZShvdXRwdXQpXG4gICAgICBAcHJvY2Vzcy5raWxsKClcbiAgICAgIEBwcm9jZXNzID0gbnVsbFxuICAgICAgQGxvYWRpbmdWaWV3Py5oaWRlKClcbiAgICAgIEBfcmVzdW1lVXBkYXRlRGlmZihlZGl0b3JzLCBjb21wdXRlZERpZmYpXG4gICAgc3RkZXJyID0gKGVycikgPT5cbiAgICAgIHRoZU91dHB1dCA9IGVyclxuICAgIGV4aXQgPSAoY29kZSkgPT5cbiAgICAgIEBsb2FkaW5nVmlldz8uaGlkZSgpXG5cbiAgICAgIGlmIGNvZGUgIT0gMFxuICAgICAgICBjb25zb2xlLmxvZygnQnVmZmVyZWROb2RlUHJvY2VzcyBjb2RlIHdhcyAnICsgY29kZSlcbiAgICAgICAgY29uc29sZS5sb2codGhlT3V0cHV0KVxuICAgIEBwcm9jZXNzID0gbmV3IEJ1ZmZlcmVkTm9kZVByb2Nlc3Moe2NvbW1hbmQsIGFyZ3MsIHN0ZG91dCwgc3RkZXJyLCBleGl0fSlcbiAgICAjIC0tLSBraWNrIG9mZiBiYWNrZ3JvdW5kIHByb2Nlc3MgdG8gY29tcHV0ZSBkaWZmIC0tLVxuXG4gICMgcmVzdW1lcyBhZnRlciB0aGUgY29tcHV0ZSBkaWZmIHByb2Nlc3MgcmV0dXJuc1xuICBfcmVzdW1lVXBkYXRlRGlmZjogKGVkaXRvcnMsIGNvbXB1dGVkRGlmZikgLT5cbiAgICBAZGlmZlZpZXcuY2xlYXJEaWZmKClcbiAgICBpZiBAc3luY1Njcm9sbD9cbiAgICAgIEBzeW5jU2Nyb2xsLmRpc3Bvc2UoKVxuICAgICAgQHN5bmNTY3JvbGwgPSBudWxsXG5cbiAgICBsZWZ0SGlnaGxpZ2h0VHlwZSA9ICdhZGRlZCdcbiAgICByaWdodEhpZ2hsaWdodFR5cGUgPSAncmVtb3ZlZCdcbiAgICBpZiBAX2dldENvbmZpZygnbGVmdEVkaXRvckNvbG9yJykgPT0gJ3JlZCdcbiAgICAgIGxlZnRIaWdobGlnaHRUeXBlID0gJ3JlbW92ZWQnXG4gICAgaWYgQF9nZXRDb25maWcoJ3JpZ2h0RWRpdG9yQ29sb3InKSA9PSAnZ3JlZW4nXG4gICAgICByaWdodEhpZ2hsaWdodFR5cGUgPSAnYWRkZWQnXG4gICAgQGRpZmZWaWV3LmRpc3BsYXlEaWZmKGNvbXB1dGVkRGlmZiwgbGVmdEhpZ2hsaWdodFR5cGUsIHJpZ2h0SGlnaGxpZ2h0VHlwZSwgQF9nZXRDb25maWcoJ2RpZmZXb3JkcycpLCBAX2dldENvbmZpZygnaWdub3JlV2hpdGVzcGFjZScpKVxuXG4gICAgd2hpbGUgd2luZG93LnNwbGl0RGlmZlJlc29sdmVzPy5sZW5ndGhcbiAgICAgIHdpbmRvdy5zcGxpdERpZmZSZXNvbHZlcy5wb3AoKShAZGlmZlZpZXcuZ2V0TWFya2VyTGF5ZXJzKCkpXG5cbiAgICBAZm9vdGVyVmlldz8uc2V0TnVtRGlmZmVyZW5jZXMoQGRpZmZWaWV3LmdldE51bURpZmZlcmVuY2VzKCkpXG5cbiAgICBzY3JvbGxTeW5jVHlwZSA9IEBfZ2V0Q29uZmlnKCdzY3JvbGxTeW5jVHlwZScpXG4gICAgaWYgc2Nyb2xsU3luY1R5cGUgPT0gJ1ZlcnRpY2FsICsgSG9yaXpvbnRhbCdcbiAgICAgIEBzeW5jU2Nyb2xsID0gbmV3IFN5bmNTY3JvbGwoZWRpdG9ycy5lZGl0b3IxLCBlZGl0b3JzLmVkaXRvcjIsIHRydWUpXG4gICAgICBAc3luY1Njcm9sbC5zeW5jUG9zaXRpb25zKClcbiAgICBlbHNlIGlmIHNjcm9sbFN5bmNUeXBlID09ICdWZXJ0aWNhbCdcbiAgICAgIEBzeW5jU2Nyb2xsID0gbmV3IFN5bmNTY3JvbGwoZWRpdG9ycy5lZGl0b3IxLCBlZGl0b3JzLmVkaXRvcjIsIGZhbHNlKVxuICAgICAgQHN5bmNTY3JvbGwuc3luY1Bvc2l0aW9ucygpXG5cbiAgIyBHZXRzIHRoZSBmaXJzdCB0d28gdmlzaWJsZSBlZGl0b3JzIGZvdW5kIG9yIGNyZWF0ZXMgdGhlbSBhcyBuZWVkZWQuXG4gICMgUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggeWllbGRzIGEgdmFsdWUgb2Yge2VkaXRvcjE6IFRleHRFZGl0b3IsIGVkaXRvcjI6IFRleHRFZGl0b3J9XG4gIF9nZXRFZGl0b3JzRm9yUXVpY2tEaWZmOiAoKSAtPlxuICAgIGVkaXRvcjEgPSBudWxsXG4gICAgZWRpdG9yMiA9IG51bGxcblxuICAgICMgdHJ5IHRvIGZpbmQgdGhlIGZpcnN0IHR3byBlZGl0b3JzXG4gICAgcGFuZXMgPSBhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpXG4gICAgZm9yIHAgaW4gcGFuZXNcbiAgICAgIGFjdGl2ZUl0ZW0gPSBwLmdldEFjdGl2ZUl0ZW0oKVxuICAgICAgaWYgYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGFjdGl2ZUl0ZW0pXG4gICAgICAgIGlmIGVkaXRvcjEgPT0gbnVsbFxuICAgICAgICAgIGVkaXRvcjEgPSBhY3RpdmVJdGVtXG4gICAgICAgIGVsc2UgaWYgZWRpdG9yMiA9PSBudWxsXG4gICAgICAgICAgZWRpdG9yMiA9IGFjdGl2ZUl0ZW1cbiAgICAgICAgICBicmVha1xuXG4gICAgIyBhdXRvIG9wZW4gZWRpdG9yIHBhbmVzIHNvIHdlIGhhdmUgdHdvIHRvIGRpZmYgd2l0aFxuICAgIGlmIGVkaXRvcjEgPT0gbnVsbFxuICAgICAgZWRpdG9yMSA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcigpXG4gICAgICBAd2FzRWRpdG9yMUNyZWF0ZWQgPSB0cnVlXG4gICAgICAjIGFkZCBmaXJzdCBlZGl0b3IgdG8gdGhlIGZpcnN0IHBhbmVcbiAgICAgIHBhbmVzWzBdLmFkZEl0ZW0oZWRpdG9yMSlcbiAgICAgIHBhbmVzWzBdLmFjdGl2YXRlSXRlbShlZGl0b3IxKVxuICAgIGlmIGVkaXRvcjIgPT0gbnVsbFxuICAgICAgZWRpdG9yMiA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcigpXG4gICAgICBAd2FzRWRpdG9yMkNyZWF0ZWQgPSB0cnVlXG4gICAgICBlZGl0b3IyLnNldEdyYW1tYXIoZWRpdG9yMS5nZXRHcmFtbWFyKCkpXG4gICAgICByaWdodFBhbmVJbmRleCA9IHBhbmVzLmluZGV4T2YoYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yMSkpICsgMVxuICAgICAgaWYgcGFuZXNbcmlnaHRQYW5lSW5kZXhdXG4gICAgICAgICMgYWRkIHNlY29uZCBlZGl0b3IgdG8gZXhpc3RpbmcgcGFuZSB0byB0aGUgcmlnaHQgb2YgZmlyc3QgZWRpdG9yXG4gICAgICAgIHBhbmVzW3JpZ2h0UGFuZUluZGV4XS5hZGRJdGVtKGVkaXRvcjIpXG4gICAgICAgIHBhbmVzW3JpZ2h0UGFuZUluZGV4XS5hY3RpdmF0ZUl0ZW0oZWRpdG9yMilcbiAgICAgIGVsc2VcbiAgICAgICAgIyBubyBleGlzdGluZyBwYW5lIHNvIHNwbGl0IHJpZ2h0XG4gICAgICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGVkaXRvcjEpLnNwbGl0UmlnaHQoe2l0ZW1zOiBbZWRpdG9yMl19KVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7ZWRpdG9yMTogZWRpdG9yMSwgZWRpdG9yMjogZWRpdG9yMn0pXG5cbiAgIyBHZXRzIHRoZSBhY3RpdmUgZWRpdG9yIGFuZCBvcGVucyB0aGUgc3BlY2lmaWVkIGZpbGUgdG8gdGhlIHJpZ2h0IG9mIGl0XG4gICMgUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggeWllbGRzIGEgdmFsdWUgb2Yge2VkaXRvcjE6IFRleHRFZGl0b3IsIGVkaXRvcjI6IFRleHRFZGl0b3J9XG4gIF9nZXRFZGl0b3JzRm9yRGlmZldpdGhBY3RpdmU6IChmaWxlUGF0aCkgLT5cbiAgICBhY3RpdmVFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiBhY3RpdmVFZGl0b3I/XG4gICAgICBlZGl0b3IxID0gYWN0aXZlRWRpdG9yXG4gICAgICBAd2FzRWRpdG9yMkNyZWF0ZWQgPSB0cnVlXG4gICAgICBwYW5lcyA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcbiAgICAgICMgZ2V0IGluZGV4IG9mIHBhbmUgZm9sbG93aW5nIGFjdGl2ZSBlZGl0b3IgcGFuZVxuICAgICAgcmlnaHRQYW5lSW5kZXggPSBwYW5lcy5pbmRleE9mKGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKGVkaXRvcjEpKSArIDFcbiAgICAgICMgcGFuZSBpcyBjcmVhdGVkIGlmIHRoZXJlIGlzIG5vdCBvbmUgdG8gdGhlIHJpZ2h0IG9mIHRoZSBhY3RpdmUgZWRpdG9yXG4gICAgICByaWdodFBhbmUgPSBwYW5lc1tyaWdodFBhbmVJbmRleF0gfHwgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yMSkuc3BsaXRSaWdodCgpXG4gICAgICBpZiBlZGl0b3IxLmdldFBhdGgoKSA9PSBmaWxlUGF0aFxuICAgICAgICAjIGlmIGRpZmZpbmcgd2l0aCBpdHNlbGYsIHNldCBmaWxlUGF0aCB0byBudWxsIHNvIGFuIGVtcHR5IGVkaXRvciBpc1xuICAgICAgICAjIG9wZW5lZCwgd2hpY2ggd2lsbCBjYXVzZSBhIGdpdCBkaWZmXG4gICAgICAgIGZpbGVQYXRoID0gbnVsbFxuICAgICAgZWRpdG9yMlByb21pc2UgPSBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lKGZpbGVQYXRoLCByaWdodFBhbmUpXG5cbiAgICAgIHJldHVybiBlZGl0b3IyUHJvbWlzZS50aGVuIChlZGl0b3IyKSAtPlxuICAgICAgICByZXR1cm4ge2VkaXRvcjE6IGVkaXRvcjEsIGVkaXRvcjI6IGVkaXRvcjJ9XG4gICAgZWxzZVxuICAgICAgbm9BY3RpdmVFZGl0b3JNc2cgPSAnTm8gYWN0aXZlIGZpbGUgZm91bmQhIChUcnkgZm9jdXNpbmcgYSB0ZXh0IGVkaXRvciknXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IG5vQWN0aXZlRWRpdG9yTXNnLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgX3NldHVwVmlzaWJsZUVkaXRvcnM6IChlZGl0b3IxLCBlZGl0b3IyKSAtPlxuICAgIEJ1ZmZlckV4dGVuZGVyID0gcmVxdWlyZSAnLi9idWZmZXItZXh0ZW5kZXInXG4gICAgYnVmZmVyMUxpbmVFbmRpbmcgPSAobmV3IEJ1ZmZlckV4dGVuZGVyKGVkaXRvcjEuZ2V0QnVmZmVyKCkpKS5nZXRMaW5lRW5kaW5nKClcblxuICAgIGlmIEB3YXNFZGl0b3IyQ3JlYXRlZFxuICAgICAgIyB3YW50IHRvIHNjcm9sbCBhIG5ld2x5IGNyZWF0ZWQgZWRpdG9yIHRvIHRoZSBmaXJzdCBlZGl0b3IncyBwb3NpdGlvblxuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcjEpLmZvY3VzKClcbiAgICAgICMgc2V0IHRoZSBwcmVmZXJyZWQgbGluZSBlbmRpbmcgYmVmb3JlIGluc2VydGluZyB0ZXh0ICMzOVxuICAgICAgaWYgYnVmZmVyMUxpbmVFbmRpbmcgPT0gJ1xcbicgfHwgYnVmZmVyMUxpbmVFbmRpbmcgPT0gJ1xcclxcbidcbiAgICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvcjIub25XaWxsSW5zZXJ0VGV4dCAoKSAtPlxuICAgICAgICAgIGVkaXRvcjIuZ2V0QnVmZmVyKCkuc2V0UHJlZmVycmVkTGluZUVuZGluZyhidWZmZXIxTGluZUVuZGluZylcblxuICAgIEBfc2V0dXBHaXRSZXBvKGVkaXRvcjEsIGVkaXRvcjIpXG5cbiAgICAjIHVuZm9sZCBhbGwgbGluZXMgc28gZGlmZnMgcHJvcGVybHkgYWxpZ25cbiAgICBlZGl0b3IxLnVuZm9sZEFsbCgpXG4gICAgZWRpdG9yMi51bmZvbGRBbGwoKVxuXG4gICAgc2hvdWxkTm90aWZ5ID0gIUBfZ2V0Q29uZmlnKCdtdXRlTm90aWZpY2F0aW9ucycpXG4gICAgc29mdFdyYXBNc2cgPSAnV2FybmluZzogU29mdCB3cmFwIGVuYWJsZWQhIChMaW5lIGRpZmZzIG1heSBub3QgYWxpZ24pJ1xuICAgIGlmIGVkaXRvcjEuaXNTb2Z0V3JhcHBlZCgpICYmIHNob3VsZE5vdGlmeVxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ1NwbGl0IERpZmYnLCB7ZGV0YWlsOiBzb2Z0V3JhcE1zZywgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KVxuICAgIGVsc2UgaWYgZWRpdG9yMi5pc1NvZnRXcmFwcGVkKCkgJiYgc2hvdWxkTm90aWZ5XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnU3BsaXQgRGlmZicsIHtkZXRhaWw6IHNvZnRXcmFwTXNnLCBkaXNtaXNzYWJsZTogZmFsc2UsIGljb246ICdkaWZmJ30pXG5cbiAgICBidWZmZXIyTGluZUVuZGluZyA9IChuZXcgQnVmZmVyRXh0ZW5kZXIoZWRpdG9yMi5nZXRCdWZmZXIoKSkpLmdldExpbmVFbmRpbmcoKVxuICAgIGlmIGJ1ZmZlcjJMaW5lRW5kaW5nICE9ICcnICYmIChidWZmZXIxTGluZUVuZGluZyAhPSBidWZmZXIyTGluZUVuZGluZykgJiYgZWRpdG9yMS5nZXRMaW5lQ291bnQoKSAhPSAxICYmIGVkaXRvcjIuZ2V0TGluZUNvdW50KCkgIT0gMSAmJiBzaG91bGROb3RpZnlcbiAgICAgICMgcG9wIHdhcm5pbmcgaWYgdGhlIGxpbmUgZW5kaW5ncyBkaWZmZXIgYW5kIHdlIGhhdmVuJ3QgZG9uZSBhbnl0aGluZyBhYm91dCBpdFxuICAgICAgbGluZUVuZGluZ01zZyA9ICdXYXJuaW5nOiBMaW5lIGVuZGluZ3MgZGlmZmVyISdcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKCdTcGxpdCBEaWZmJywge2RldGFpbDogbGluZUVuZGluZ01zZywgZGlzbWlzc2FibGU6IGZhbHNlLCBpY29uOiAnZGlmZid9KVxuXG4gIF9zZXR1cEdpdFJlcG86IChlZGl0b3IxLCBlZGl0b3IyKSAtPlxuICAgIGVkaXRvcjFQYXRoID0gZWRpdG9yMS5nZXRQYXRoKClcbiAgICAjIG9ubHkgc2hvdyBnaXQgY2hhbmdlcyBpZiB0aGUgcmlnaHQgZWRpdG9yIGlzIGVtcHR5XG4gICAgaWYgZWRpdG9yMVBhdGg/ICYmIChlZGl0b3IyLmdldExpbmVDb3VudCgpID09IDEgJiYgZWRpdG9yMi5saW5lVGV4dEZvckJ1ZmZlclJvdygwKSA9PSAnJylcbiAgICAgIGZvciBkaXJlY3RvcnksIGkgaW4gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKClcbiAgICAgICAgaWYgZWRpdG9yMVBhdGggaXMgZGlyZWN0b3J5LmdldFBhdGgoKSBvciBkaXJlY3RvcnkuY29udGFpbnMoZWRpdG9yMVBhdGgpXG4gICAgICAgICAgcHJvamVjdFJlcG8gPSBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbaV1cbiAgICAgICAgICBpZiBwcm9qZWN0UmVwbz8gJiYgcHJvamVjdFJlcG8ucmVwbz9cbiAgICAgICAgICAgIHJlbGF0aXZlRWRpdG9yMVBhdGggPSBwcm9qZWN0UmVwby5yZWxhdGl2aXplKGVkaXRvcjFQYXRoKVxuICAgICAgICAgICAgZ2l0SGVhZFRleHQgPSBwcm9qZWN0UmVwby5yZXBvLmdldEhlYWRCbG9iKHJlbGF0aXZlRWRpdG9yMVBhdGgpXG4gICAgICAgICAgICBpZiBnaXRIZWFkVGV4dD9cbiAgICAgICAgICAgICAgZWRpdG9yMi5zZWxlY3RBbGwoKVxuICAgICAgICAgICAgICBlZGl0b3IyLmluc2VydFRleHQoZ2l0SGVhZFRleHQpXG4gICAgICAgICAgICAgIEBoYXNHaXRSZXBvID0gdHJ1ZVxuICAgICAgICAgICAgICBicmVha1xuXG4gICMgY3JlYXRlcyB0ZW1wIGZpbGVzIHNvIHRoZSBjb21wdXRlIGRpZmYgcHJvY2VzcyBjYW4gZ2V0IHRoZSB0ZXh0IGVhc2lseVxuICBfY3JlYXRlVGVtcEZpbGVzOiAoZWRpdG9ycykgLT5cbiAgICBlZGl0b3IxUGF0aCA9ICcnXG4gICAgZWRpdG9yMlBhdGggPSAnJ1xuICAgIHRlbXBGb2xkZXJQYXRoID0gYXRvbS5nZXRDb25maWdEaXJQYXRoKCkgKyAnL3NwbGl0LWRpZmYnXG5cbiAgICBlZGl0b3IxUGF0aCA9IHRlbXBGb2xkZXJQYXRoICsgJy9zcGxpdC1kaWZmIDEnXG4gICAgZWRpdG9yMVRlbXBGaWxlID0gbmV3IEZpbGUoZWRpdG9yMVBhdGgpXG4gICAgZWRpdG9yMVRlbXBGaWxlLndyaXRlU3luYyhlZGl0b3JzLmVkaXRvcjEuZ2V0VGV4dCgpKVxuXG4gICAgZWRpdG9yMlBhdGggPSB0ZW1wRm9sZGVyUGF0aCArICcvc3BsaXQtZGlmZiAyJ1xuICAgIGVkaXRvcjJUZW1wRmlsZSA9IG5ldyBGaWxlKGVkaXRvcjJQYXRoKVxuICAgIGVkaXRvcjJUZW1wRmlsZS53cml0ZVN5bmMoZWRpdG9ycy5lZGl0b3IyLmdldFRleHQoKSlcblxuICAgIGVkaXRvclBhdGhzID1cbiAgICAgIGVkaXRvcjFQYXRoOiBlZGl0b3IxUGF0aFxuICAgICAgZWRpdG9yMlBhdGg6IGVkaXRvcjJQYXRoXG5cbiAgICByZXR1cm4gZWRpdG9yUGF0aHNcblxuXG4gIF9nZXRDb25maWc6IChjb25maWcpIC0+XG4gICAgYXRvbS5jb25maWcuZ2V0KFwic3BsaXQtZGlmZi4je2NvbmZpZ31cIilcblxuICBfc2V0Q29uZmlnOiAoY29uZmlnLCB2YWx1ZSkgLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQoXCJzcGxpdC1kaWZmLiN7Y29uZmlnfVwiLCB2YWx1ZSlcblxuXG4gICMgLS0tIFNFUlZJQ0UgQVBJIC0tLVxuICBnZXRNYXJrZXJMYXllcnM6ICgpIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIHdpbmRvdy5zcGxpdERpZmZSZXNvbHZlcy5wdXNoKHJlc29sdmUpXG5cbiAgcHJvdmlkZVNwbGl0RGlmZjogLT5cbiAgICBnZXRNYXJrZXJMYXllcnM6IEBnZXRNYXJrZXJMYXllcnNcbiJdfQ==
