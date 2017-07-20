(function() {
  var $, CompositeDisposable, GitAddAndCommitContext, GitAddContext, GitCheckoutAllFiles, GitCheckoutBranch, GitCheckoutFile, GitCheckoutFileContext, GitCheckoutNewBranch, GitCherryPick, GitCommit, GitCommitAmend, GitDeleteBranch, GitDiff, GitDiffAll, GitDiffBranchFiles, GitDiffBranchFilesContext, GitDiffBranches, GitDiffBranchesContext, GitDiffContext, GitDifftool, GitDifftoolContext, GitFetch, GitFetchAll, GitFetchPrune, GitInit, GitLog, GitMerge, GitOpenChangedFiles, GitPaletteView, GitPull, GitPullContext, GitPush, GitPushContext, GitRebase, GitRemove, GitRun, GitShow, GitStageFiles, GitStageFilesBeta, GitStageHunk, GitStashApply, GitStashDrop, GitStashPop, GitStashSave, GitStashSaveMessage, GitStatus, GitTags, GitUnstageFileContext, GitUnstageFiles, OutputViewManager, baseLineGrammar, baseWordGrammar, configurations, contextMenu, currentFile, diffGrammars, getWorkspaceRepos, git, onPathsChanged, setDiffGrammar;

  CompositeDisposable = require('atom').CompositeDisposable;

  $ = require('atom-space-pen-views').$;

  git = require('./git');

  configurations = require('./config');

  contextMenu = require('./context-menu');

  OutputViewManager = require('./output-view-manager');

  GitPaletteView = require('./views/git-palette-view');

  GitAddContext = require('./models/context/git-add-context');

  GitDiffContext = require('./models/context/git-diff-context');

  GitAddAndCommitContext = require('./models/context/git-add-and-commit-context');

  GitCheckoutNewBranch = require('./models/git-checkout-new-branch');

  GitCheckoutBranch = require('./models/git-checkout-branch');

  GitDeleteBranch = require('./models/git-delete-branch');

  GitCheckoutAllFiles = require('./models/git-checkout-all-files');

  GitCheckoutFile = require('./models/git-checkout-file');

  GitCheckoutFileContext = require('./models/context/git-checkout-file-context');

  GitCherryPick = require('./models/git-cherry-pick');

  GitCommit = require('./models/git-commit');

  GitCommitAmend = require('./models/git-commit-amend');

  GitDiff = require('./models/git-diff');

  GitDiffBranches = require('./models/git-diff-branches');

  GitDiffBranchesContext = require('./models/context/git-diff-branches-context');

  GitDiffBranchFiles = require('./models/git-diff-branch-files');

  GitDiffBranchFilesContext = require('./models/context/git-diff-branch-files-context');

  GitDifftool = require('./models/git-difftool');

  GitDifftoolContext = require('./models/context/git-difftool-context');

  GitDiffAll = require('./models/git-diff-all');

  GitFetch = require('./models/git-fetch');

  GitFetchAll = require('./models/git-fetch-all');

  GitFetchPrune = require('./models/git-fetch-prune.coffee');

  GitInit = require('./models/git-init');

  GitLog = require('./models/git-log');

  GitPull = require('./models/git-pull');

  GitPullContext = require('./models/context/git-pull-context');

  GitPush = require('./models/git-push');

  GitPushContext = require('./models/context/git-push-context');

  GitRemove = require('./models/git-remove');

  GitShow = require('./models/git-show');

  GitStageFiles = require('./models/git-stage-files');

  GitStageFilesBeta = require('./models/git-stage-files-beta');

  GitStageHunk = require('./models/git-stage-hunk');

  GitStashApply = require('./models/git-stash-apply');

  GitStashDrop = require('./models/git-stash-drop');

  GitStashPop = require('./models/git-stash-pop');

  GitStashSave = require('./models/git-stash-save');

  GitStashSaveMessage = require('./models/git-stash-save-message');

  GitStatus = require('./models/git-status');

  GitTags = require('./models/git-tags');

  GitUnstageFiles = require('./models/git-unstage-files');

  GitUnstageFileContext = require('./models/context/git-unstage-file-context');

  GitRun = require('./models/git-run');

  GitMerge = require('./models/git-merge');

  GitRebase = require('./models/git-rebase');

  GitOpenChangedFiles = require('./models/git-open-changed-files');

  diffGrammars = require('./grammars/diff.js');

  baseWordGrammar = __dirname + '/grammars/word-diff.json';

  baseLineGrammar = __dirname + '/grammars/line-diff.json';

  currentFile = function(repo) {
    var ref;
    return repo.relativize((ref = atom.workspace.getActiveTextEditor()) != null ? ref.getPath() : void 0);
  };

  setDiffGrammar = function() {
    var baseGrammar, diffGrammar, enableSyntaxHighlighting, grammar, wordDiff;
    while (atom.grammars.grammarForScopeName('source.diff')) {
      atom.grammars.removeGrammarForScopeName('source.diff');
    }
    enableSyntaxHighlighting = atom.config.get('git-plus.diffs.syntaxHighlighting');
    wordDiff = atom.config.get('git-plus.diffs.wordDiff');
    diffGrammar = null;
    baseGrammar = null;
    if (wordDiff) {
      diffGrammar = diffGrammars.wordGrammar;
      baseGrammar = baseWordGrammar;
    } else {
      diffGrammar = diffGrammars.lineGrammar;
      baseGrammar = baseLineGrammar;
    }
    if (enableSyntaxHighlighting) {
      return atom.grammars.addGrammar(diffGrammar);
    } else {
      grammar = atom.grammars.readGrammarSync(baseGrammar);
      grammar.packageName = 'git-plus';
      return atom.grammars.addGrammar(grammar);
    }
  };

  getWorkspaceRepos = function() {
    return atom.project.getRepositories().filter(function(r) {
      return r != null;
    });
  };

  onPathsChanged = function(gp) {
    if (typeof gp.deactivate === "function") {
      gp.deactivate();
    }
    if (typeof gp.activate === "function") {
      gp.activate();
    }
    if (gp.statusBar) {
      return typeof gp.consumeStatusBar === "function" ? gp.consumeStatusBar(gp.statusBar) : void 0;
    }
  };

  module.exports = {
    config: configurations,
    subscriptions: null,
    workspace: document.querySelector('atom-workspace'),
    provideService: function() {
      return require('./service');
    },
    activate: function(state) {
      var repos;
      setDiffGrammar();
      this.subscriptions = new CompositeDisposable;
      repos = getWorkspaceRepos();
      if (atom.project.getDirectories().length === 0) {
        atom.project.onDidChangePaths((function(_this) {
          return function(paths) {
            return onPathsChanged(_this);
          };
        })(this));
      }
      if (repos.length === 0 && atom.project.getDirectories().length > 0) {
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:init', (function(_this) {
          return function() {
            return GitInit().then(_this.activate);
          };
        })(this)));
      }
      if (repos.length > 0) {
        atom.project.onDidChangePaths((function(_this) {
          return function(paths) {
            return onPathsChanged(_this);
          };
        })(this));
        contextMenu();
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:menu', function() {
          return new GitPaletteView();
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo, {
              file: currentFile(repo)
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add-modified', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo, {
              update: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add-all', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:commit', function() {
          return git.getRepo().then(function(repo) {
            return GitCommit(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:commit-all', function() {
          return git.getRepo().then(function(repo) {
            return GitCommit(repo, {
              stageChanges: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:commit-amend', function() {
          return git.getRepo().then(function(repo) {
            return new GitCommitAmend(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add-and-commit', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo, {
              file: currentFile(repo)
            }).then(function() {
              return GitCommit(repo);
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add-and-commit-and-push', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo, {
              file: currentFile(repo)
            }).then(function() {
              return GitCommit(repo, {
                andPush: true
              });
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add-all-and-commit', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo).then(function() {
              return GitCommit(repo);
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:add-all-commit-and-push', function() {
          return git.getRepo().then(function(repo) {
            return git.add(repo).then(function() {
              return GitCommit(repo, {
                andPush: true
              });
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:commit-all-and-push', function() {
          return git.getRepo().then(function(repo) {
            return GitCommit(repo, {
              stageChanges: true,
              andPush: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:checkout', function() {
          return git.getRepo().then(function(repo) {
            return GitCheckoutBranch(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:checkout-remote', function() {
          return git.getRepo().then(function(repo) {
            return GitCheckoutBranch(repo, {
              remote: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:checkout-current-file', function() {
          return git.getRepo().then(function(repo) {
            return GitCheckoutFile(repo, {
              file: currentFile(repo)
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:checkout-all-files', function() {
          return git.getRepo().then(function(repo) {
            return GitCheckoutAllFiles(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:new-branch', function() {
          return git.getRepo().then(function(repo) {
            return GitCheckoutNewBranch(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:delete-local-branch', function() {
          return git.getRepo().then(function(repo) {
            return GitDeleteBranch(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:delete-remote-branch', function() {
          return git.getRepo().then(function(repo) {
            return GitDeleteBranch(repo, {
              remote: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:cherry-pick', function() {
          return git.getRepo().then(function(repo) {
            return GitCherryPick(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:diff', function() {
          return git.getRepo().then(function(repo) {
            return GitDiff(repo, {
              file: currentFile(repo)
            });
          });
        }));
        if (atom.config.get('git-plus.experimental.diffBranches')) {
          this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:diff-branches', function() {
            return git.getRepo().then(function(repo) {
              return GitDiffBranches(repo);
            });
          }));
          this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:diff-branch-files', function() {
            return git.getRepo().then(function(repo) {
              return GitDiffBranchFiles(repo);
            });
          }));
        }
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:difftool', function() {
          return git.getRepo().then(function(repo) {
            return GitDifftool(repo, {
              file: currentFile(repo)
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:diff-all', function() {
          return git.getRepo().then(function(repo) {
            return GitDiffAll(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:fetch', function() {
          return git.getRepo().then(function(repo) {
            return GitFetch(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:fetch-all', function() {
          return git.getAllRepos().then(function(repos) {
            return GitFetchAll(repos);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:fetch-prune', function() {
          return git.getRepo().then(function(repo) {
            return GitFetchPrune(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:pull', function() {
          return git.getRepo().then(function(repo) {
            return GitPull(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:push', function() {
          return git.getRepo().then(function(repo) {
            return GitPush(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:push-set-upstream', function() {
          return git.getRepo().then(function(repo) {
            return GitPush(repo, {
              setUpstream: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:remove', function() {
          return git.getRepo().then(function(repo) {
            return GitRemove(repo, {
              showSelector: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:remove-current-file', function() {
          return git.getRepo().then(function(repo) {
            return GitRemove(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:reset', function() {
          return git.getRepo().then(function(repo) {
            return git.reset(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:show', function() {
          return git.getRepo().then(function(repo) {
            return GitShow(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:log', function() {
          return git.getRepo().then(function(repo) {
            return GitLog(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:log-current-file', function() {
          return git.getRepo().then(function(repo) {
            return GitLog(repo, {
              onlyCurrentFile: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stage-hunk', function() {
          return git.getRepo().then(function(repo) {
            return GitStageHunk(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stash-save', function() {
          return git.getRepo().then(function(repo) {
            return GitStashSave(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stash-save-message', function() {
          return git.getRepo().then(function(repo) {
            return GitStashSaveMessage(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stash-pop', function() {
          return git.getRepo().then(function(repo) {
            return GitStashPop(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stash-apply', function() {
          return git.getRepo().then(function(repo) {
            return GitStashApply(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stash-delete', function() {
          return git.getRepo().then(function(repo) {
            return GitStashDrop(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:status', function() {
          return git.getRepo().then(function(repo) {
            return GitStatus(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:tags', function() {
          return git.getRepo().then(function(repo) {
            return GitTags(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:run', function() {
          return git.getRepo().then(function(repo) {
            return new GitRun(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:merge', function() {
          return git.getRepo().then(function(repo) {
            return GitMerge(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:merge-remote', function() {
          return git.getRepo().then(function(repo) {
            return GitMerge(repo, {
              remote: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:merge-no-fast-forward', function() {
          return git.getRepo().then(function(repo) {
            return GitMerge(repo, {
              noFastForward: true
            });
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:rebase', function() {
          return git.getRepo().then(function(repo) {
            return GitRebase(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:git-open-changed-files', function() {
          return git.getRepo().then(function(repo) {
            return GitOpenChangedFiles(repo);
          });
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:add', function() {
          return GitAddContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:add-and-commit', function() {
          return GitAddAndCommitContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:checkout-file', function() {
          return GitCheckoutFileContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:diff', function() {
          return GitDiffContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:diff-branches', GitDiffBranchesContext));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:diff-branch-files', GitDiffBranchFilesContext));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:difftool', function() {
          return GitDifftoolContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:pull', function() {
          return GitPullContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:push', function() {
          return GitPushContext();
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:push-set-upstream', function() {
          return GitPushContext({
            setUpstream: true
          });
        }));
        this.subscriptions.add(atom.commands.add('.tree-view', 'git-plus-context:unstage-file', function() {
          return GitUnstageFileContext();
        }));
        this.subscriptions.add(atom.config.observe('git-plus.diffs.syntaxHighlighting', setDiffGrammar));
        this.subscriptions.add(atom.config.observe('git-plus.diffs.wordDiff', setDiffGrammar));
        if (atom.config.get('git-plus.experimental.stageFilesBeta')) {
          this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stage-files', function() {
            return git.getRepo().then(GitStageFilesBeta);
          }));
        } else {
          this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:unstage-files', function() {
            return git.getRepo().then(GitUnstageFiles);
          }));
          this.subscriptions.add(atom.commands.add('atom-workspace', 'git-plus:stage-files', function() {
            return git.getRepo().then(GitStageFiles);
          }));
        }
        this.subscriptions.add(atom.config.onDidChange('git-plus.experimental.stageFilesBeta', (function(_this) {
          return function() {
            _this.subscriptions.dispose();
            return _this.activate();
          };
        })(this)));
        return this.subscriptions.add(atom.config.observe('git-plus.experimental.autoFetch', (function(_this) {
          return function(interval) {
            return _this.autoFetch(interval);
          };
        })(this)));
      }
    },
    deactivate: function() {
      var ref;
      this.subscriptions.dispose();
      if ((ref = this.statusBarTile) != null) {
        ref.destroy();
      }
      return clearInterval(this.autoFetchInterval);
    },
    autoFetch: function(interval) {
      var fetch, fetchIntervalMs;
      clearInterval(this.autoFetchInterval);
      if (fetchIntervalMs = (interval * 60) * 1000) {
        fetch = (function(_this) {
          return function() {
            return atom.commands.dispatch(_this.workspace, 'git-plus:fetch-all');
          };
        })(this);
        return this.autoFetchInterval = setInterval(fetch, fetchIntervalMs);
      }
    },
    consumeAutosave: function(arg) {
      var dontSaveIf;
      dontSaveIf = arg.dontSaveIf;
      return dontSaveIf(function(paneItem) {
        return paneItem.getPath().includes('COMMIT_EDITMSG');
      });
    },
    consumeStatusBar: function(statusBar1) {
      this.statusBar = statusBar1;
      if (getWorkspaceRepos().length > 0) {
        this.setupBranchesMenuToggle(this.statusBar);
        if (atom.config.get('git-plus.general.enableStatusBarIcon')) {
          return this.setupOutputViewToggle(this.statusBar);
        }
      }
    },
    setupOutputViewToggle: function(statusBar) {
      var div, icon, link;
      div = document.createElement('div');
      div.classList.add('inline-block');
      icon = document.createElement('span');
      icon.textContent = 'git+';
      link = document.createElement('a');
      link.appendChild(icon);
      link.onclick = function(e) {
        return OutputViewManager.getView().toggle();
      };
      atom.tooltips.add(div, {
        title: "Toggle Git-Plus Output Console"
      });
      div.appendChild(link);
      return this.statusBarTile = statusBar.addRightTile({
        item: div,
        priority: 0
      });
    },
    setupBranchesMenuToggle: function(statusBar) {
      return statusBar.getRightTiles().some((function(_this) {
        return function(arg) {
          var item, ref;
          item = arg.item;
          if (item != null ? (ref = item.classList) != null ? typeof ref.contains === "function" ? ref.contains('git-view') : void 0 : void 0 : void 0) {
            $(item).find('.git-branch').on('click', function(e) {
              var newBranchKey, pressed;
              newBranchKey = atom.config.get('git-plus.general').newBranchKey;
              pressed = function(key) {
                return e[key + "Key"];
              };
              if (pressed(newBranchKey)) {
                return atom.commands.dispatch(_this.workspace, 'git-plus:new-branch');
              } else {
                return atom.commands.dispatch(_this.workspace, 'git-plus:checkout');
              }
            });
            return true;
          }
        };
      })(this));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL2dpdC1wbHVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXdCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixJQUF3QixPQUFBLENBQVEsc0JBQVI7O0VBQ3pCLEdBQUEsR0FBeUIsT0FBQSxDQUFRLE9BQVI7O0VBQ3pCLGNBQUEsR0FBeUIsT0FBQSxDQUFRLFVBQVI7O0VBQ3pCLFdBQUEsR0FBeUIsT0FBQSxDQUFRLGdCQUFSOztFQUN6QixpQkFBQSxHQUF5QixPQUFBLENBQVEsdUJBQVI7O0VBQ3pCLGNBQUEsR0FBeUIsT0FBQSxDQUFRLDBCQUFSOztFQUN6QixhQUFBLEdBQXlCLE9BQUEsQ0FBUSxrQ0FBUjs7RUFDekIsY0FBQSxHQUF5QixPQUFBLENBQVEsbUNBQVI7O0VBQ3pCLHNCQUFBLEdBQXlCLE9BQUEsQ0FBUSw2Q0FBUjs7RUFDekIsb0JBQUEsR0FBeUIsT0FBQSxDQUFRLGtDQUFSOztFQUN6QixpQkFBQSxHQUF5QixPQUFBLENBQVEsOEJBQVI7O0VBQ3pCLGVBQUEsR0FBeUIsT0FBQSxDQUFRLDRCQUFSOztFQUN6QixtQkFBQSxHQUF5QixPQUFBLENBQVEsaUNBQVI7O0VBQ3pCLGVBQUEsR0FBeUIsT0FBQSxDQUFRLDRCQUFSOztFQUN6QixzQkFBQSxHQUF5QixPQUFBLENBQVEsNENBQVI7O0VBQ3pCLGFBQUEsR0FBeUIsT0FBQSxDQUFRLDBCQUFSOztFQUN6QixTQUFBLEdBQXlCLE9BQUEsQ0FBUSxxQkFBUjs7RUFDekIsY0FBQSxHQUF5QixPQUFBLENBQVEsMkJBQVI7O0VBQ3pCLE9BQUEsR0FBeUIsT0FBQSxDQUFRLG1CQUFSOztFQUN6QixlQUFBLEdBQXlCLE9BQUEsQ0FBUSw0QkFBUjs7RUFDekIsc0JBQUEsR0FBeUIsT0FBQSxD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RSxDQUFHLEdBQUQsR0FBSyxLQUFQO2NBQVg7Y0FDVixJQUFHLE9BQUEsQ0FBUSxZQUFSLENBQUg7dUJBQ0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLEtBQUMsQ0FBQSxTQUF4QixFQUFtQyxxQkFBbkMsRUFERjtlQUFBLE1BQUE7dUJBR0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLEtBQUMsQ0FBQSxTQUF4QixFQUFtQyxtQkFBbkMsRUFIRjs7WUFIc0MsQ0FBeEM7QUFPQSxtQkFBTyxLQVJUOztRQUQ2QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0I7SUFEdUIsQ0E5SHpCOztBQTdGRiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSAgPSByZXF1aXJlICdhdG9tJ1xueyR9ICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuZ2l0ICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vZ2l0J1xuY29uZmlndXJhdGlvbnMgICAgICAgICA9IHJlcXVpcmUgJy4vY29uZmlnJ1xuY29udGV4dE1lbnUgICAgICAgICAgICA9IHJlcXVpcmUgJy4vY29udGV4dC1tZW51J1xuT3V0cHV0Vmlld01hbmFnZXIgICAgICA9IHJlcXVpcmUgJy4vb3V0cHV0LXZpZXctbWFuYWdlcidcbkdpdFBhbGV0dGVWaWV3ICAgICAgICAgPSByZXF1aXJlICcuL3ZpZXdzL2dpdC1wYWxldHRlLXZpZXcnXG5HaXRBZGRDb250ZXh0ICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvY29udGV4dC9naXQtYWRkLWNvbnRleHQnXG5HaXREaWZmQ29udGV4dCAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvY29udGV4dC9naXQtZGlmZi1jb250ZXh0J1xuR2l0QWRkQW5kQ29tbWl0Q29udGV4dCA9IHJlcXVpcmUgJy4vbW9kZWxzL2NvbnRleHQvZ2l0LWFkZC1hbmQtY29tbWl0LWNvbnRleHQnXG5HaXRDaGVja291dE5ld0JyYW5jaCAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWNoZWNrb3V0LW5ldy1icmFuY2gnXG5HaXRDaGVja291dEJyYW5jaCAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWNoZWNrb3V0LWJyYW5jaCdcbkdpdERlbGV0ZUJyYW5jaCAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtZGVsZXRlLWJyYW5jaCdcbkdpdENoZWNrb3V0QWxsRmlsZXMgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtY2hlY2tvdXQtYWxsLWZpbGVzJ1xuR2l0Q2hlY2tvdXRGaWxlICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1jaGVja291dC1maWxlJ1xuR2l0Q2hlY2tvdXRGaWxlQ29udGV4dCA9IHJlcXVpcmUgJy4vbW9kZWxzL2NvbnRleHQvZ2l0LWNoZWNrb3V0LWZpbGUtY29udGV4dCdcbkdpdENoZXJyeVBpY2sgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtY2hlcnJ5LXBpY2snXG5HaXRDb21taXQgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWNvbW1pdCdcbkdpdENvbW1pdEFtZW5kICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtY29tbWl0LWFtZW5kJ1xuR2l0RGlmZiAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1kaWZmJ1xuR2l0RGlmZkJyYW5jaGVzICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1kaWZmLWJyYW5jaGVzJ1xuR2l0RGlmZkJyYW5jaGVzQ29udGV4dCA9IHJlcXVpcmUgJy4vbW9kZWxzL2NvbnRleHQvZ2l0LWRpZmYtYnJhbmNoZXMtY29udGV4dCdcbkdpdERpZmZCcmFuY2hGaWxlcyAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtZGlmZi1icmFuY2gtZmlsZXMnXG5HaXREaWZmQnJhbmNoRmlsZXNDb250ZXh0ICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2NvbnRleHQvZ2l0LWRpZmYtYnJhbmNoLWZpbGVzLWNvbnRleHQnXG5HaXREaWZmdG9vbCAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWRpZmZ0b29sJ1xuR2l0RGlmZnRvb2xDb250ZXh0ICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2NvbnRleHQvZ2l0LWRpZmZ0b29sLWNvbnRleHQnXG5HaXREaWZmQWxsICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWRpZmYtYWxsJ1xuR2l0RmV0Y2ggICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1mZXRjaCdcbkdpdEZldGNoQWxsICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtZmV0Y2gtYWxsJ1xuR2l0RmV0Y2hQcnVuZSAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1mZXRjaC1wcnVuZS5jb2ZmZWUnXG5HaXRJbml0ICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWluaXQnXG5HaXRMb2cgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LWxvZydcbkdpdFB1bGwgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtcHVsbCdcbkdpdFB1bGxDb250ZXh0ICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9jb250ZXh0L2dpdC1wdWxsLWNvbnRleHQnXG5HaXRQdXNoICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXB1c2gnXG5HaXRQdXNoQ29udGV4dCAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvY29udGV4dC9naXQtcHVzaC1jb250ZXh0J1xuR2l0UmVtb3ZlICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1yZW1vdmUnXG5HaXRTaG93ICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXNob3cnXG5HaXRTdGFnZUZpbGVzICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YWdlLWZpbGVzJ1xuR2l0U3RhZ2VGaWxlc0JldGEgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1zdGFnZS1maWxlcy1iZXRhJ1xuR2l0U3RhZ2VIdW5rICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1zdGFnZS1odW5rJ1xuR2l0U3Rhc2hBcHBseSAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1zdGFzaC1hcHBseSdcbkdpdFN0YXNoRHJvcCAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtc3Rhc2gtZHJvcCdcbkdpdFN0YXNoUG9wICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtc3Rhc2gtcG9wJ1xuR2l0U3Rhc2hTYXZlICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1zdGFzaC1zYXZlJ1xuR2l0U3Rhc2hTYXZlTWVzc2FnZSAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1zdGFzaC1zYXZlLW1lc3NhZ2UnXG5HaXRTdGF0dXMgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi9tb2RlbHMvZ2l0LXN0YXR1cydcbkdpdFRhZ3MgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtdGFncydcbkdpdFVuc3RhZ2VGaWxlcyAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtdW5zdGFnZS1maWxlcydcbkdpdFVuc3RhZ2VGaWxlQ29udGV4dCAgPSByZXF1aXJlICcuL21vZGVscy9jb250ZXh0L2dpdC11bnN0YWdlLWZpbGUtY29udGV4dCdcbkdpdFJ1biAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtcnVuJ1xuR2l0TWVyZ2UgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1tZXJnZSdcbkdpdFJlYmFzZSAgICAgICAgICAgICAgPSByZXF1aXJlICcuL21vZGVscy9naXQtcmViYXNlJ1xuR2l0T3BlbkNoYW5nZWRGaWxlcyAgICA9IHJlcXVpcmUgJy4vbW9kZWxzL2dpdC1vcGVuLWNoYW5nZWQtZmlsZXMnXG5kaWZmR3JhbW1hcnMgICAgICAgICAgID0gcmVxdWlyZSAnLi9ncmFtbWFycy9kaWZmLmpzJ1xuXG5iYXNlV29yZEdyYW1tYXIgPSBfX2Rpcm5hbWUgKyAnL2dyYW1tYXJzL3dvcmQtZGlmZi5qc29uJ1xuYmFzZUxpbmVHcmFtbWFyID0gX19kaXJuYW1lICsgJy9ncmFtbWFycy9saW5lLWRpZmYuanNvbidcblxuY3VycmVudEZpbGUgPSAocmVwbykgLT5cbiAgcmVwby5yZWxhdGl2aXplKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0UGF0aCgpKVxuXG5zZXREaWZmR3JhbW1hciA9IC0+XG4gIHdoaWxlIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZSAnc291cmNlLmRpZmYnXG4gICAgYXRvbS5ncmFtbWFycy5yZW1vdmVHcmFtbWFyRm9yU2NvcGVOYW1lICdzb3VyY2UuZGlmZidcblxuICBlbmFibGVTeW50YXhIaWdobGlnaHRpbmcgPSBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1wbHVzLmRpZmZzLnN5bnRheEhpZ2hsaWdodGluZycpXG4gIHdvcmREaWZmID0gYXRvbS5jb25maWcuZ2V0KCdnaXQtcGx1cy5kaWZmcy53b3JkRGlmZicpXG4gIGRpZmZHcmFtbWFyID0gbnVsbFxuICBiYXNlR3JhbW1hciA9IG51bGxcblxuICBpZiB3b3JkRGlmZlxuICAgIGRpZmZHcmFtbWFyID0gZGlmZkdyYW1tYXJzLndvcmRHcmFtbWFyXG4gICAgYmFzZUdyYW1tYXIgPSBiYXNlV29yZEdyYW1tYXJcbiAgZWxzZVxuICAgIGRpZmZHcmFtbWFyID0gZGlmZkdyYW1tYXJzLmxpbmVHcmFtbWFyXG4gICAgYmFzZUdyYW1tYXIgPSBiYXNlTGluZUdyYW1tYXJcblxuICBpZiBlbmFibGVTeW50YXhIaWdobGlnaHRpbmdcbiAgICBhdG9tLmdyYW1tYXJzLmFkZEdyYW1tYXIgZGlmZkdyYW1tYXJcbiAgZWxzZVxuICAgIGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLnJlYWRHcmFtbWFyU3luYyBiYXNlR3JhbW1hclxuICAgIGdyYW1tYXIucGFja2FnZU5hbWUgPSAnZ2l0LXBsdXMnXG4gICAgYXRvbS5ncmFtbWFycy5hZGRHcmFtbWFyIGdyYW1tYXJcblxuZ2V0V29ya3NwYWNlUmVwb3MgPSAtPiBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkuZmlsdGVyIChyKSAtPiByP1xuXG5vblBhdGhzQ2hhbmdlZCA9IChncCkgLT5cbiAgZ3AuZGVhY3RpdmF0ZT8oKVxuICBncC5hY3RpdmF0ZT8oKVxuICBncC5jb25zdW1lU3RhdHVzQmFyPyhncC5zdGF0dXNCYXIpIGlmIGdwLnN0YXR1c0JhclxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGNvbmZpZzogY29uZmlndXJhdGlvbnNcblxuICBzdWJzY3JpcHRpb25zOiBudWxsXG5cbiAgd29ya3NwYWNlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdhdG9tLXdvcmtzcGFjZScpXG5cbiAgcHJvdmlkZVNlcnZpY2U6IC0+IHJlcXVpcmUgJy4vc2VydmljZSdcblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIHNldERpZmZHcmFtbWFyKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgcmVwb3MgPSBnZXRXb3Jrc3BhY2VSZXBvcygpXG4gICAgaWYgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubGVuZ3RoIGlzIDBcbiAgICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzIChwYXRocykgPT4gb25QYXRoc0NoYW5nZWQodGhpcylcbiAgICBpZiByZXBvcy5sZW5ndGggaXMgMCBhbmQgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubGVuZ3RoID4gMFxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czppbml0JywgPT4gR2l0SW5pdCgpLnRoZW4oQGFjdGl2YXRlKVxuICAgIGlmIHJlcG9zLmxlbmd0aCA+IDBcbiAgICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzIChwYXRocykgPT4gb25QYXRoc0NoYW5nZWQodGhpcylcbiAgICAgIGNvbnRleHRNZW51KClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6bWVudScsIC0+IG5ldyBHaXRQYWxldHRlVmlldygpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmFkZCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gZ2l0LmFkZChyZXBvLCBmaWxlOiBjdXJyZW50RmlsZShyZXBvKSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmFkZC1tb2RpZmllZCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gZ2l0LmFkZChyZXBvLCB1cGRhdGU6IHRydWUpKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czphZGQtYWxsJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBnaXQuYWRkKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpjb21taXQnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdENvbW1pdChyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6Y29tbWl0LWFsbCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0Q29tbWl0KHJlcG8sIHN0YWdlQ2hhbmdlczogdHJ1ZSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmNvbW1pdC1hbWVuZCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gbmV3IEdpdENvbW1pdEFtZW5kKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czphZGQtYW5kLWNvbW1pdCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gZ2l0LmFkZChyZXBvLCBmaWxlOiBjdXJyZW50RmlsZShyZXBvKSkudGhlbiAtPiBHaXRDb21taXQocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmFkZC1hbmQtY29tbWl0LWFuZC1wdXNoJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBnaXQuYWRkKHJlcG8sIGZpbGU6IGN1cnJlbnRGaWxlKHJlcG8pKS50aGVuIC0+IEdpdENvbW1pdChyZXBvLCBhbmRQdXNoOiB0cnVlKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6YWRkLWFsbC1hbmQtY29tbWl0JywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBnaXQuYWRkKHJlcG8pLnRoZW4gLT4gR2l0Q29tbWl0KHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czphZGQtYWxsLWNvbW1pdC1hbmQtcHVzaCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gZ2l0LmFkZChyZXBvKS50aGVuIC0+IEdpdENvbW1pdChyZXBvLCBhbmRQdXNoOiB0cnVlKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6Y29tbWl0LWFsbC1hbmQtcHVzaCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0Q29tbWl0KHJlcG8sIHN0YWdlQ2hhbmdlczogdHJ1ZSwgYW5kUHVzaDogdHJ1ZSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmNoZWNrb3V0JywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRDaGVja291dEJyYW5jaChyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6Y2hlY2tvdXQtcmVtb3RlJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRDaGVja291dEJyYW5jaChyZXBvLCB7cmVtb3RlOiB0cnVlfSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmNoZWNrb3V0LWN1cnJlbnQtZmlsZScsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0Q2hlY2tvdXRGaWxlKHJlcG8sIGZpbGU6IGN1cnJlbnRGaWxlKHJlcG8pKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6Y2hlY2tvdXQtYWxsLWZpbGVzJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRDaGVja291dEFsbEZpbGVzKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpuZXctYnJhbmNoJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRDaGVja291dE5ld0JyYW5jaChyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6ZGVsZXRlLWxvY2FsLWJyYW5jaCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0RGVsZXRlQnJhbmNoKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpkZWxldGUtcmVtb3RlLWJyYW5jaCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0RGVsZXRlQnJhbmNoKHJlcG8sIHtyZW1vdGU6IHRydWV9KSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6Y2hlcnJ5LXBpY2snLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdENoZXJyeVBpY2socmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmRpZmYnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdERpZmYocmVwbywgZmlsZTogY3VycmVudEZpbGUocmVwbykpKVxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdnaXQtcGx1cy5leHBlcmltZW50YWwuZGlmZkJyYW5jaGVzJylcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpkaWZmLWJyYW5jaGVzJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXREaWZmQnJhbmNoZXMocmVwbykpXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6ZGlmZi1icmFuY2gtZmlsZXMnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdERpZmZCcmFuY2hGaWxlcyhyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6ZGlmZnRvb2wnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdERpZmZ0b29sKHJlcG8sIGZpbGU6IGN1cnJlbnRGaWxlKHJlcG8pKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6ZGlmZi1hbGwnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdERpZmZBbGwocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOmZldGNoJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRGZXRjaChyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6ZmV0Y2gtYWxsJywgLT4gZ2l0LmdldEFsbFJlcG9zKCkudGhlbigocmVwb3MpIC0+IEdpdEZldGNoQWxsKHJlcG9zKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6ZmV0Y2gtcHJ1bmUnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdEZldGNoUHJ1bmUocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnB1bGwnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdFB1bGwocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnB1c2gnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdFB1c2gocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnB1c2gtc2V0LXVwc3RyZWFtJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRQdXNoKHJlcG8sIHNldFVwc3RyZWFtOiB0cnVlKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6cmVtb3ZlJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRSZW1vdmUocmVwbywgc2hvd1NlbGVjdG9yOiB0cnVlKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6cmVtb3ZlLWN1cnJlbnQtZmlsZScsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0UmVtb3ZlKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpyZXNldCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gZ2l0LnJlc2V0KHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpzaG93JywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRTaG93KHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpsb2cnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdExvZyhyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6bG9nLWN1cnJlbnQtZmlsZScsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0TG9nKHJlcG8sIG9ubHlDdXJyZW50RmlsZTogdHJ1ZSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnN0YWdlLWh1bmsnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdFN0YWdlSHVuayhyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6c3Rhc2gtc2F2ZScsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0U3Rhc2hTYXZlKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpzdGFzaC1zYXZlLW1lc3NhZ2UnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdFN0YXNoU2F2ZU1lc3NhZ2UocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnN0YXNoLXBvcCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0U3Rhc2hQb3AocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnN0YXNoLWFwcGx5JywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRTdGFzaEFwcGx5KHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpzdGFzaC1kZWxldGUnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdFN0YXNoRHJvcChyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6c3RhdHVzJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRTdGF0dXMocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnRhZ3MnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdFRhZ3MocmVwbykpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnJ1bicsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gbmV3IEdpdFJ1bihyZXBvKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6bWVyZ2UnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdE1lcmdlKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czptZXJnZS1yZW1vdGUnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oKHJlcG8pIC0+IEdpdE1lcmdlKHJlcG8sIHJlbW90ZTogdHJ1ZSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOm1lcmdlLW5vLWZhc3QtZm9yd2FyZCcsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0TWVyZ2UocmVwbywgbm9GYXN0Rm9yd2FyZDogdHJ1ZSkpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2dpdC1wbHVzOnJlYmFzZScsIC0+IGdpdC5nZXRSZXBvKCkudGhlbigocmVwbykgLT4gR2l0UmViYXNlKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdnaXQtcGx1czpnaXQtb3Blbi1jaGFuZ2VkLWZpbGVzJywgLT4gZ2l0LmdldFJlcG8oKS50aGVuKChyZXBvKSAtPiBHaXRPcGVuQ2hhbmdlZEZpbGVzKHJlcG8pKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3JywgJ2dpdC1wbHVzLWNvbnRleHQ6YWRkJywgLT4gR2l0QWRkQ29udGV4dCgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcnLCAnZ2l0LXBsdXMtY29udGV4dDphZGQtYW5kLWNvbW1pdCcsIC0+IEdpdEFkZEFuZENvbW1pdENvbnRleHQoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3JywgJ2dpdC1wbHVzLWNvbnRleHQ6Y2hlY2tvdXQtZmlsZScsIC0+IEdpdENoZWNrb3V0RmlsZUNvbnRleHQoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3JywgJ2dpdC1wbHVzLWNvbnRleHQ6ZGlmZicsIC0+IEdpdERpZmZDb250ZXh0KClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldycsICdnaXQtcGx1cy1jb250ZXh0OmRpZmYtYnJhbmNoZXMnLCBHaXREaWZmQnJhbmNoZXNDb250ZXh0XG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcnLCAnZ2l0LXBsdXMtY29udGV4dDpkaWZmLWJyYW5jaC1maWxlcycsIEdpdERpZmZCcmFuY2hGaWxlc0NvbnRleHRcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldycsICdnaXQtcGx1cy1jb250ZXh0OmRpZmZ0b29sJywgLT4gR2l0RGlmZnRvb2xDb250ZXh0KClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldycsICdnaXQtcGx1cy1jb250ZXh0OnB1bGwnLCAtPiBHaXRQdWxsQ29udGV4dCgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcnLCAnZ2l0LXBsdXMtY29udGV4dDpwdXNoJywgLT4gR2l0UHVzaENvbnRleHQoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3JywgJ2dpdC1wbHVzLWNvbnRleHQ6cHVzaC1zZXQtdXBzdHJlYW0nLCAtPiBHaXRQdXNoQ29udGV4dChzZXRVcHN0cmVhbTogdHJ1ZSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldycsICdnaXQtcGx1cy1jb250ZXh0OnVuc3RhZ2UtZmlsZScsIC0+IEdpdFVuc3RhZ2VGaWxlQ29udGV4dCgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnZ2l0LXBsdXMuZGlmZnMuc3ludGF4SGlnaGxpZ2h0aW5nJywgc2V0RGlmZkdyYW1tYXJcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdnaXQtcGx1cy5kaWZmcy53b3JkRGlmZicsIHNldERpZmZHcmFtbWFyXG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2dpdC1wbHVzLmV4cGVyaW1lbnRhbC5zdGFnZUZpbGVzQmV0YScpXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6c3RhZ2UtZmlsZXMnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oR2l0U3RhZ2VGaWxlc0JldGEpXG4gICAgICBlbHNlXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6dW5zdGFnZS1maWxlcycsIC0+IGdpdC5nZXRSZXBvKCkudGhlbihHaXRVbnN0YWdlRmlsZXMpXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZ2l0LXBsdXM6c3RhZ2UtZmlsZXMnLCAtPiBnaXQuZ2V0UmVwbygpLnRoZW4oR2l0U3RhZ2VGaWxlcylcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZ2l0LXBsdXMuZXhwZXJpbWVudGFsLnN0YWdlRmlsZXNCZXRhJywgPT5cbiAgICAgICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICAgIEBhY3RpdmF0ZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnZ2l0LXBsdXMuZXhwZXJpbWVudGFsLmF1dG9GZXRjaCcsIChpbnRlcnZhbCkgPT4gQGF1dG9GZXRjaChpbnRlcnZhbClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBzdGF0dXNCYXJUaWxlPy5kZXN0cm95KClcbiAgICBjbGVhckludGVydmFsIEBhdXRvRmV0Y2hJbnRlcnZhbFxuXG4gIGF1dG9GZXRjaDogKGludGVydmFsKSAtPlxuICAgIGNsZWFySW50ZXJ2YWwgQGF1dG9GZXRjaEludGVydmFsXG4gICAgaWYgZmV0Y2hJbnRlcnZhbE1zID0gKGludGVydmFsICogNjApICogMTAwMFxuICAgICAgZmV0Y2ggPSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKEB3b3Jrc3BhY2UsICdnaXQtcGx1czpmZXRjaC1hbGwnKVxuICAgICAgQGF1dG9GZXRjaEludGVydmFsID0gc2V0SW50ZXJ2YWwoZmV0Y2gsIGZldGNoSW50ZXJ2YWxNcylcblxuICBjb25zdW1lQXV0b3NhdmU6ICh7ZG9udFNhdmVJZn0pIC0+XG4gICAgZG9udFNhdmVJZiAocGFuZUl0ZW0pIC0+IHBhbmVJdGVtLmdldFBhdGgoKS5pbmNsdWRlcyAnQ09NTUlUX0VESVRNU0cnXG5cbiAgY29uc3VtZVN0YXR1c0JhcjogKEBzdGF0dXNCYXIpIC0+XG4gICAgaWYgZ2V0V29ya3NwYWNlUmVwb3MoKS5sZW5ndGggPiAwXG4gICAgICBAc2V0dXBCcmFuY2hlc01lbnVUb2dnbGUgQHN0YXR1c0JhclxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0ICdnaXQtcGx1cy5nZW5lcmFsLmVuYWJsZVN0YXR1c0Jhckljb24nXG4gICAgICAgIEBzZXR1cE91dHB1dFZpZXdUb2dnbGUgQHN0YXR1c0JhclxuXG4gIHNldHVwT3V0cHV0Vmlld1RvZ2dsZTogKHN0YXR1c0JhcikgLT5cbiAgICBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gICAgZGl2LmNsYXNzTGlzdC5hZGQgJ2lubGluZS1ibG9jaydcbiAgICBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3BhbidcbiAgICBpY29uLnRleHRDb250ZW50ID0gJ2dpdCsnXG4gICAgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2EnXG4gICAgbGluay5hcHBlbmRDaGlsZCBpY29uXG4gICAgbGluay5vbmNsaWNrID0gKGUpIC0+IE91dHB1dFZpZXdNYW5hZ2VyLmdldFZpZXcoKS50b2dnbGUoKVxuICAgIGF0b20udG9vbHRpcHMuYWRkIGRpdiwgeyB0aXRsZTogXCJUb2dnbGUgR2l0LVBsdXMgT3V0cHV0IENvbnNvbGVcIn1cbiAgICBkaXYuYXBwZW5kQ2hpbGQgbGlua1xuICAgIEBzdGF0dXNCYXJUaWxlID0gc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSBpdGVtOiBkaXYsIHByaW9yaXR5OiAwXG5cbiAgc2V0dXBCcmFuY2hlc01lbnVUb2dnbGU6IChzdGF0dXNCYXIpIC0+XG4gICAgc3RhdHVzQmFyLmdldFJpZ2h0VGlsZXMoKS5zb21lICh7aXRlbX0pID0+XG4gICAgICBpZiBpdGVtPy5jbGFzc0xpc3Q/LmNvbnRhaW5zPyAnZ2l0LXZpZXcnXG4gICAgICAgICQoaXRlbSkuZmluZCgnLmdpdC1icmFuY2gnKS5vbiAnY2xpY2snLCAoZSkgPT5cbiAgICAgICAgICB7bmV3QnJhbmNoS2V5fSA9IGF0b20uY29uZmlnLmdldCgnZ2l0LXBsdXMuZ2VuZXJhbCcpXG4gICAgICAgICAgcHJlc3NlZCA9IChrZXkpIC0+IGVbXCIje2tleX1LZXlcIl1cbiAgICAgICAgICBpZiBwcmVzc2VkIG5ld0JyYW5jaEtleVxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChAd29ya3NwYWNlLCAnZ2l0LXBsdXM6bmV3LWJyYW5jaCcpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChAd29ya3NwYWNlLCAnZ2l0LXBsdXM6Y2hlY2tvdXQnKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuIl19
