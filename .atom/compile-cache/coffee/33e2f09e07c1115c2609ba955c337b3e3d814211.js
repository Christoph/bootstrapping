(function() {
  var meta;

  meta = {
    define: "https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/metaKey",
    key: (function() {
      switch (process.platform) {
        case "darwin":
          return "⌘";
        case "linux":
          return "Super";
        case "win32":
          return "❖";
      }
    })()
  };

  module.exports = {
    general: {
      order: 1,
      type: "object",
      properties: {
        gitPath: {
          order: 1,
          title: "Git Path",
          type: "string",
          "default": "git",
          description: "If git is not in your PATH, specify where the executable is"
        },
        enableStatusBarIcon: {
          order: 2,
          title: "Status-bar Pin Icon",
          type: "boolean",
          "default": true,
          description: "The pin icon in the bottom-right of the status-bar toggles the output view above the status-bar"
        },
        newBranchKey: {
          order: 3,
          title: "Status-bar New Branch modifier key",
          type: "string",
          "default": "alt",
          description: "Status-bar branch list modifier key to alternatively create a new branch if held on click. Note that _[`meta`](" + meta.define + ")_ is <kbd>" + meta.key + "</kbd>",
          "enum": ["alt", "shift", "meta", "ctrl"]
        },
        openInPane: {
          order: 4,
          title: "Allow commands to open new panes",
          type: "boolean",
          "default": true,
          description: "Commands like `Commit`, `Log`, `Show`, `Diff` can be split into new panes"
        },
        splitPane: {
          order: 5,
          title: "Split pane direction",
          type: "string",
          "default": "Down",
          description: "Where should new panes go?",
          "enum": ["Up", "Right", "Down", "Left"]
        },
        messageTimeout: {
          order: 6,
          title: "Output view timeout",
          type: "integer",
          "default": 5,
          description: "For how many seconds should the output view above the status-bar stay open?"
        },
        showFormat: {
          order: 7,
          title: "Format option for 'Git Show'",
          type: "string",
          "default": "full",
          "enum": ["oneline", "short", "medium", "full", "fuller", "email", "raw", "none"],
          description: "Which format to use for `git show`? (`none` will use your git config default)"
        }
      }
    },
    commits: {
      order: 2,
      type: "object",
      properties: {
        verboseCommits: {
          title: "Verbose Commits",
          description: "Show diffs in commit pane?",
          type: "boolean",
          "default": false
        }
      }
    },
    diffs: {
      order: 3,
      type: "object",
      properties: {
        includeStagedDiff: {
          order: 1,
          title: "Include staged diffs?",
          type: "boolean",
          "default": true
        },
        wordDiff: {
          order: 2,
          title: "Word diff",
          type: "boolean",
          "default": true,
          description: "Should diffs be generated with the `--word-diff` flag?"
        },
        syntaxHighlighting: {
          order: 3,
          title: "Enable syntax highlighting in diffs?",
          type: "boolean",
          "default": true
        }
      }
    },
    logs: {
      order: 4,
      type: "object",
      properties: {
        numberOfCommitsToShow: {
          order: 1,
          title: "Number of commits to load",
          type: "integer",
          "default": 25,
          minimum: 1,
          description: "Initial amount of commits to load when running the `Log` command"
        }
      }
    },
    remoteInteractions: {
      order: 5,
      type: "object",
      properties: {
        pullRebase: {
          order: 1,
          title: "Pull Rebase",
          type: "boolean",
          "default": false,
          description: "Pull with `--rebase` flag?"
        },
        pullBeforePush: {
          order: 2,
          title: "Pull Before Pushing",
          type: "boolean",
          "default": false,
          description: "Pull from remote before pushing"
        },
        promptForBranch: {
          order: 3,
          title: "Prompt for branch selection when pulling/pushing",
          type: "boolean",
          "default": false,
          description: "If false, it defaults to current branch upstream"
        }
      }
    },
    tags: {
      order: 6,
      type: "object",
      properties: {
        signTags: {
          title: "Sign git tags with GPG",
          type: "boolean",
          "default": false,
          description: "Use a GPG key to sign Git tags"
        }
      }
    },
    experimental: {
      order: 7,
      type: "object",
      properties: {
        stageFilesBeta: {
          order: 1,
          title: "Stage Files Beta",
          type: "boolean",
          "default": true,
          description: "Stage and unstage files in a single command"
        },
        customCommands: {
          order: 2,
          title: "Custom Commands",
          type: "boolean",
          "default": false,
          description: "Declared custom commands in your `init` file that can be run from the Git-plus command palette"
        },
        diffBranches: {
          order: 3,
          title: "Show diffs across branches",
          type: "boolean",
          "default": false,
          description: "Diffs will be shown for the current branch against a branch you choose. The `Diff branch files` command will allow choosing which file to compare. The file feature requires the 'split-diff' package to be installed."
        },
        useSplitDiff: {
          order: 4,
          title: "Split diff",
          type: "boolean",
          "default": false,
          description: "Use the split-diff package to show diffs for a single file. Only works with `Diff` command when a file is open."
        },
        autoFetch: {
          order: 5,
          title: "Auto-fetch",
          type: "integer",
          "default": 0,
          maximum: 60,
          description: "Automatically fetch remote repositories every `x` minutes (`0` will disable this feature)"
        },
        autoFetchNotify: {
          order: 6,
          title: "Auto-fetch notification",
          type: "boolean",
          "default": false,
          description: "Show notifications while running `fetch --all`?"
        }
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvZ2l0LXBsdXMvbGliL2NvbmZpZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FDRTtJQUFBLE1BQUEsRUFBUSxxRUFBUjtJQUNBLEdBQUE7QUFDRSxjQUFPLE9BQU8sQ0FBQyxRQUFmO0FBQUEsYUFDTyxRQURQO2lCQUNxQjtBQURyQixhQUVPLE9BRlA7aUJBRW9CO0FBRnBCLGFBR08sT0FIUDtpQkFHb0I7QUFIcEI7UUFGRjs7O0VBT0YsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE9BQUEsRUFDRTtNQUFBLEtBQUEsRUFBTyxDQUFQO01BQ0EsSUFBQSxFQUFNLFFBRE47TUFFQSxVQUFBLEVBQ0U7UUFBQSxPQUFBLEVBQ0U7VUFBQSxLQUFBLEVBQU8sQ0FBUDtVQUNBLEtBQUEsRUFBTyxVQURQO1VBRUEsSUFBQSxFQUFNLFFBRk47VUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBSFQ7VUFJQSxXQUFBLEVBQWEsNkRBSmI7U0FERjtRQU1BLG1CQUFBLEVBQ0U7VUFBQSxLQUFBLEVBQU8sQ0FBUDtVQUNBLEtBQUEsRUFBTyxxQkFEUDtVQUVBLElBQUEsRUFBTSxTQUZOO1VBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUhUO1VBSUEsV0FBQSxFQUFhLGlHQUpiO1NBUEY7UUFZQSxZQUFBLEVBQ0U7VUFBQSxLQUFBLEVBQU8sQ0FBUDtVQUNBLEtBQUEsRUFBTyxvQ0FEUDtVQUVBLElBQUEsRUFBTSxRQUZOO1VBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUhUO1VBSUEsV0FBQSxFQUFhLGlIQUFBLEdBQWtILElBQUksQ0FBQyxNQUF2SCxHQUE4SCxhQUE5SCxHQUEySSxJQUFJLENBQUMsR0FBaEosR0FBb0osUUFKaks7VUFLQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENB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UDtVQUNBLEtBQUEsRUFBTyw0QkFEUDtVQUVBLElBQUEsRUFBTSxTQUZOO1VBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUhUO1VBSUEsV0FBQSxFQUFhLHdOQUpiO1NBYkY7UUFrQkEsWUFBQSxFQUNFO1VBQUEsS0FBQSxFQUFPLENBQVA7VUFDQSxLQUFBLEVBQU8sWUFEUDtVQUVBLElBQUEsRUFBTSxTQUZOO1VBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUhUO1VBSUEsV0FBQSxFQUFhLGlIQUpiO1NBbkJGO1FBd0JBLFNBQUEsRUFDRTtVQUFBLEtBQUEsRUFBTyxDQUFQO1VBQ0EsS0FBQSxFQUFPLFlBRFA7VUFFQSxJQUFBLEVBQU0sU0FGTjtVQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsQ0FIVDtVQUlBLE9BQUEsRUFBUyxFQUpUO1VBS0EsV0FBQSxFQUFhLDJGQUxiO1NBekJGO1FBK0JBLGVBQUEsRUFDRTtVQUFBLEtBQUEsRUFBTyxDQUFQO1VBQ0EsS0FBQSxFQUFPLHlCQURQO1VBRUEsSUFBQSxFQUFNLFNBRk47VUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBSFQ7VUFJQSxXQUFBLEVBQWEsaURBSmI7U0FoQ0Y7T0FIRjtLQXpIRjs7QUFURiIsInNvdXJjZXNDb250ZW50IjpbIm1ldGEgPSAjS2V5XG4gIGRlZmluZTogXCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTW91c2VFdmVudC9tZXRhS2V5XCJcbiAga2V5OlxuICAgIHN3aXRjaCBwcm9jZXNzLnBsYXRmb3JtXG4gICAgICB3aGVuIFwiZGFyd2luXCIgdGhlbiBcIuKMmFwiXG4gICAgICB3aGVuIFwibGludXhcIiB0aGVuIFwiU3VwZXJcIlxuICAgICAgd2hlbiBcIndpbjMyXCIgdGhlbiBcIuKdllwiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgZ2VuZXJhbDpcbiAgICBvcmRlcjogMVxuICAgIHR5cGU6IFwib2JqZWN0XCJcbiAgICBwcm9wZXJ0aWVzOlxuICAgICAgZ2l0UGF0aDpcbiAgICAgICAgb3JkZXI6IDFcbiAgICAgICAgdGl0bGU6IFwiR2l0IFBhdGhcIlxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgIGRlZmF1bHQ6IFwiZ2l0XCJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiSWYgZ2l0IGlzIG5vdCBpbiB5b3VyIFBBVEgsIHNwZWNpZnkgd2hlcmUgdGhlIGV4ZWN1dGFibGUgaXNcIlxuICAgICAgZW5hYmxlU3RhdHVzQmFySWNvbjpcbiAgICAgICAgb3JkZXI6IDJcbiAgICAgICAgdGl0bGU6IFwiU3RhdHVzLWJhciBQaW4gSWNvblwiXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIHBpbiBpY29uIGluIHRoZSBib3R0b20tcmlnaHQgb2YgdGhlIHN0YXR1cy1iYXIgdG9nZ2xlcyB0aGUgb3V0cHV0IHZpZXcgYWJvdmUgdGhlIHN0YXR1cy1iYXJcIlxuICAgICAgbmV3QnJhbmNoS2V5OlxuICAgICAgICBvcmRlcjogM1xuICAgICAgICB0aXRsZTogXCJTdGF0dXMtYmFyIE5ldyBCcmFuY2ggbW9kaWZpZXIga2V5XCJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICBkZWZhdWx0OiBcImFsdFwiXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0YXR1cy1iYXIgYnJhbmNoIGxpc3QgbW9kaWZpZXIga2V5IHRvIGFsdGVybmF0aXZlbHkgY3JlYXRlIGEgbmV3IGJyYW5jaCBpZiBoZWxkIG9uIGNsaWNrLiBOb3RlIHRoYXQgX1tgbWV0YWBdKCN7bWV0YS5kZWZpbmV9KV8gaXMgPGtiZD4je21ldGEua2V5fTwva2JkPlwiXG4gICAgICAgIGVudW06IFtcImFsdFwiLCBcInNoaWZ0XCIsIFwibWV0YVwiLCBcImN0cmxcIl1cbiAgICAgIG9wZW5JblBhbmU6XG4gICAgICAgIG9yZGVyOiA0XG4gICAgICAgIHRpdGxlOiBcIkFsbG93IGNvbW1hbmRzIHRvIG9wZW4gbmV3IHBhbmVzXCJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICBkZXNjcmlwdGlvbjogXCJDb21tYW5kcyBsaWtlIGBDb21taXRgLCBgTG9nYCwgYFNob3dgLCBgRGlmZmAgY2FuIGJlIHNwbGl0IGludG8gbmV3IHBhbmVzXCJcbiAgICAgIHNwbGl0UGFuZTpcbiAgICAgICAgb3JkZXI6IDVcbiAgICAgICAgdGl0bGU6IFwiU3BsaXQgcGFuZSBkaXJlY3Rpb25cIlxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgIGRlZmF1bHQ6IFwiRG93blwiXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIldoZXJlIHNob3VsZCBuZXcgcGFuZXMgZ28/XCJcbiAgICAgICAgZW51bTogW1wiVXBcIiwgXCJSaWdodFwiLCBcIkRvd25cIiwgXCJMZWZ0XCJdXG4gICAgICBtZXNzYWdlVGltZW91dDpcbiAgICAgICAgb3JkZXI6IDZcbiAgICAgICAgdGl0bGU6IFwiT3V0cHV0IHZpZXcgdGltZW91dFwiXG4gICAgICAgIHR5cGU6IFwiaW50ZWdlclwiXG4gICAgICAgIGRlZmF1bHQ6IDVcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRm9yIGhvdyBtYW55IHNlY29uZHMgc2hvdWxkIHRoZSBvdXRwdXQgdmlldyBhYm92ZSB0aGUgc3RhdHVzLWJhciBzdGF5IG9wZW4/XCJcbiAgICAgIHNob3dGb3JtYXQ6XG4gICAgICAgIG9yZGVyOiA3XG4gICAgICAgIHRpdGxlOiBcIkZvcm1hdCBvcHRpb24gZm9yICdHaXQgU2hvdydcIlxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgIGRlZmF1bHQ6IFwiZnVsbFwiXG4gICAgICAgIGVudW06IFtcIm9uZWxpbmVcIiwgXCJzaG9ydFwiLCBcIm1lZGl1bVwiLCBcImZ1bGxcIiwgXCJmdWxsZXJcIiwgXCJlbWFpbFwiLCBcInJhd1wiLCBcIm5vbmVcIl1cbiAgICAgICAgZGVzY3JpcHRpb246IFwiV2hpY2ggZm9ybWF0IHRvIHVzZSBmb3IgYGdpdCBzaG93YD8gKGBub25lYCB3aWxsIHVzZSB5b3VyIGdpdCBjb25maWcgZGVmYXVsdClcIlxuICBjb21taXRzOlxuICAgIG9yZGVyOiAyXG4gICAgdHlwZTogXCJvYmplY3RcIlxuICAgIHByb3BlcnRpZXM6XG4gICAgICB2ZXJib3NlQ29tbWl0czpcbiAgICAgICAgdGl0bGU6IFwiVmVyYm9zZSBDb21taXRzXCJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvdyBkaWZmcyBpbiBjb21taXQgcGFuZT9cIlxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICBkaWZmczpcbiAgICBvcmRlcjogM1xuICAgIHR5cGU6IFwib2JqZWN0XCJcbiAgICBwcm9wZXJ0aWVzOlxuICAgICAgaW5jbHVkZVN0YWdlZERpZmY6XG4gICAgICAgIG9yZGVyOiAxXG4gICAgICAgIHRpdGxlOiBcIkluY2x1ZGUgc3RhZ2VkIGRpZmZzP1wiXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIHdvcmREaWZmOlxuICAgICAgICBvcmRlcjogMlxuICAgICAgICB0aXRsZTogXCJXb3JkIGRpZmZcIlxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3VsZCBkaWZmcyBiZSBnZW5lcmF0ZWQgd2l0aCB0aGUgYC0td29yZC1kaWZmYCBmbGFnP1wiXG4gICAgICBzeW50YXhIaWdobGlnaHRpbmc6XG4gICAgICAgIG9yZGVyOiAzXG4gICAgICAgIHRpdGxlOiBcIkVuYWJsZSBzeW50YXggaGlnaGxpZ2h0aW5nIGluIGRpZmZzP1wiXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgbG9nczpcbiAgICBvcmRlcjogNFxuICAgIHR5cGU6IFwib2JqZWN0XCJcbiAgICBwcm9wZXJ0aWVzOlxuICAgICAgbnVtYmVyT2ZDb21taXRzVG9TaG93OlxuICAgICAgICBvcmRlcjogMVxuICAgICAgICB0aXRsZTogXCJOdW1iZXIgb2YgY29tbWl0cyB0byBsb2FkXCJcbiAgICAgICAgdHlwZTogXCJpbnRlZ2VyXCJcbiAgICAgICAgZGVmYXVsdDogMjVcbiAgICAgICAgbWluaW11bTogMVxuICAgICAgICBkZXNjcmlwdGlvbjogXCJJbml0aWFsIGFtb3VudCBvZiBjb21taXRzIHRvIGxvYWQgd2hlbiBydW5uaW5nIHRoZSBgTG9nYCBjb21tYW5kXCJcbiAgcmVtb3RlSW50ZXJhY3Rpb25zOlxuICAgIG9yZGVyOiA1XG4gICAgdHlwZTogXCJvYmplY3RcIlxuICAgIHByb3BlcnRpZXM6XG4gICAgICBwdWxsUmViYXNlOlxuICAgICAgICBvcmRlcjogMVxuICAgICAgICB0aXRsZTogXCJQdWxsIFJlYmFzZVwiXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlB1bGwgd2l0aCBgLS1yZWJhc2VgIGZsYWc/XCJcbiAgICAgIHB1bGxCZWZvcmVQdXNoOlxuICAgICAgICBvcmRlcjogMlxuICAgICAgICB0aXRsZTogXCJQdWxsIEJlZm9yZSBQdXNoaW5nXCJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgZGVzY3JpcHRpb246IFwiUHVsbCBmcm9tIHJlbW90ZSBiZWZvcmUgcHVzaGluZ1wiXG4gICAgICBwcm9tcHRGb3JCcmFuY2g6XG4gICAgICAgIG9yZGVyOiAzXG4gICAgICAgIHRpdGxlOiBcIlByb21wdCBmb3IgYnJhbmNoIHNlbGVjdGlvbiB3aGVuIHB1bGxpbmcvcHVzaGluZ1wiXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIklmIGZhbHNlLCBpdCBkZWZhdWx0cyB0byBjdXJyZW50IGJyYW5jaCB1cHN0cmVhbVwiXG4gIHRhZ3M6XG4gICAgb3JkZXI6IDZcbiAgICB0eXBlOiBcIm9iamVjdFwiXG4gICAgcHJvcGVydGllczpcbiAgICAgIHNpZ25UYWdzOlxuICAgICAgICB0aXRsZTogXCJTaWduIGdpdCB0YWdzIHdpdGggR1BHXCJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVXNlIGEgR1BHIGtleSB0byBzaWduIEdpdCB0YWdzXCJcbiAgZXhwZXJpbWVudGFsOlxuICAgIG9yZGVyOiA3XG4gICAgdHlwZTogXCJvYmplY3RcIlxuICAgIHByb3BlcnRpZXM6XG4gICAgICBzdGFnZUZpbGVzQmV0YTpcbiAgICAgICAgb3JkZXI6IDFcbiAgICAgICAgdGl0bGU6IFwiU3RhZ2UgRmlsZXMgQmV0YVwiXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU3RhZ2UgYW5kIHVuc3RhZ2UgZmlsZXMgaW4gYSBzaW5nbGUgY29tbWFuZFwiXG4gICAgICBjdXN0b21Db21tYW5kczpcbiAgICAgICAgb3JkZXI6IDJcbiAgICAgICAgdGl0bGU6IFwiQ3VzdG9tIENvbW1hbmRzXCJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRGVjbGFyZWQgY3VzdG9tIGNvbW1hbmRzIGluIHlvdXIgYGluaXRgIGZpbGUgdGhhdCBjYW4gYmUgcnVuIGZyb20gdGhlIEdpdC1wbHVzIGNvbW1hbmQgcGFsZXR0ZVwiXG4gICAgICBkaWZmQnJhbmNoZXM6XG4gICAgICAgIG9yZGVyOiAzXG4gICAgICAgIHRpdGxlOiBcIlNob3cgZGlmZnMgYWNyb3NzIGJyYW5jaGVzXCJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgZGVzY3JpcHRpb246IFwiRGlmZnMgd2lsbCBiZSBzaG93biBmb3IgdGhlIGN1cnJlbnQgYnJhbmNoIGFnYWluc3QgYSBicmFuY2ggeW91IGNob29zZS4gVGhlIGBEaWZmIGJyYW5jaCBmaWxlc2AgY29tbWFuZCB3aWxsIGFsbG93IGNob29zaW5nIHdoaWNoIGZpbGUgdG8gY29tcGFyZS4gVGhlIGZpbGUgZmVhdHVyZSByZXF1aXJlcyB0aGUgJ3NwbGl0LWRpZmYnIHBhY2thZ2UgdG8gYmUgaW5zdGFsbGVkLlwiXG4gICAgICB1c2VTcGxpdERpZmY6XG4gICAgICAgIG9yZGVyOiA0XG4gICAgICAgIHRpdGxlOiBcIlNwbGl0IGRpZmZcIlxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICBkZXNjcmlwdGlvbjogXCJVc2UgdGhlIHNwbGl0LWRpZmYgcGFja2FnZSB0byBzaG93IGRpZmZzIGZvciBhIHNpbmdsZSBmaWxlLiBPbmx5IHdvcmtzIHdpdGggYERpZmZgIGNvbW1hbmQgd2hlbiBhIGZpbGUgaXMgb3Blbi5cIlxuICAgICAgYXV0b0ZldGNoOlxuICAgICAgICBvcmRlcjogNVxuICAgICAgICB0aXRsZTogXCJBdXRvLWZldGNoXCJcbiAgICAgICAgdHlwZTogXCJpbnRlZ2VyXCJcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICBtYXhpbXVtOiA2MFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IGZldGNoIHJlbW90ZSByZXBvc2l0b3JpZXMgZXZlcnkgYHhgIG1pbnV0ZXMgKGAwYCB3aWxsIGRpc2FibGUgdGhpcyBmZWF0dXJlKVwiXG4gICAgICBhdXRvRmV0Y2hOb3RpZnk6XG4gICAgICAgIG9yZGVyOiA2XG4gICAgICAgIHRpdGxlOiBcIkF1dG8tZmV0Y2ggbm90aWZpY2F0aW9uXCJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvdyBub3RpZmljYXRpb25zIHdoaWxlIHJ1bm5pbmcgYGZldGNoIC0tYWxsYD9cIlxuIl19
