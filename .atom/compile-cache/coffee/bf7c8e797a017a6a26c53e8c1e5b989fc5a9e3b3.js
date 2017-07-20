(function() {
  var Beautifier, Beautifiers, Languages, Promise, _, beautifiers, fs, isWindows, path, temp;

  Beautifiers = require("../src/beautifiers");

  beautifiers = new Beautifiers();

  Beautifier = require("../src/beautifiers/beautifier");

  Languages = require('../src/languages/');

  _ = require('lodash');

  fs = require('fs');

  path = require('path');

  Promise = require("bluebird");

  temp = require('temp');

  temp.track();

  isWindows = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';

  describe("Atom-Beautify", function() {
    beforeEach(function() {
      return waitsForPromise(function() {
        var activationPromise, pack;
        activationPromise = atom.packages.activatePackage('atom-beautify');
        pack = atom.packages.getLoadedPackage("atom-beautify");
        pack.activateNow();
        return activationPromise;
      });
    });
    afterEach(function() {
      return temp.cleanupSync();
    });
    describe("Beautifiers", function() {
      var beautifier;
      beautifier = null;
      beforeEach(function() {
        return beautifier = new Beautifier();
      });
      return describe("Beautifier::run", function() {
        it("should error when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, p;
            p = beautifier.run("program", []);
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true);
              expect(v.code).toBe("CommandNotFound");
              expect(v.description).toBe(void 0, 'Error should not have a description.');
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        it("should error with help description when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, help, p;
            help = {
              link: "http://test.com",
              program: "test-program",
              pathOption: "Lang - Test Program Path"
            };
            p = beautifier.run("program", [], {
              help: help
            });
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true);
              expect(v.code).toBe("CommandNotFound");
              expect(v.description).not.toBe(null);
              expect(v.description.indexOf(help.link)).not.toBe(-1);
              expect(v.description.indexOf(help.program)).not.toBe(-1);
              expect(v.description.indexOf(help.pathOption)).not.toBe(-1, "Error should have a description.");
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        it("should error with Windows-specific help description when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, help, p, terminal, whichCmd;
            help = {
              link: "http://test.com",
              program: "test-program",
              pathOption: "Lang - Test Program Path"
            };
            beautifier.isWindows = true;
            terminal = 'CMD prompt';
            whichCmd = "where.exe";
            p = beautifier.run("program", [], {
              help: help
            });
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true);
              expect(v.code).toBe("CommandNotFound");
              expect(v.description).not.toBe(null);
              expect(v.description.indexOf(help.link)).not.toBe(-1);
              expect(v.description.indexOf(help.program)).not.toBe(-1);
              expect(v.description.indexOf(help.pathOption)).not.toBe(-1, "Error should have a description.");
              expect(v.description.indexOf(terminal)).not.toBe(-1, "Error should have a description including '" + terminal + "' in message.");
              expect(v.description.indexOf(whichCmd)).not.toBe(-1, "Error should have a description including '" + whichCmd + "' in message.");
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        if (!isWindows) {
          return it("should error with Mac/Linux-specific help description when beautifier's program not found", function() {
            expect(beautifier).not.toBe(null);
            expect(beautifier instanceof Beautifier).toBe(true);
            return waitsForPromise({
              shouldReject: true
            }, function() {
              var cb, help, p, terminal, whichCmd;
              help = {
                link: "http://test.com",
                program: "test-program",
                pathOption: "Lang - Test Program Path"
              };
              beautifier.isWindows = false;
              terminal = "Terminal";
              whichCmd = "which";
              p = beautifier.run("program", [], {
                help: help
              });
              expect(p).not.toBe(null);
              expect(p instanceof beautifier.Promise).toBe(true);
              cb = function(v) {
                expect(v).not.toBe(null);
                expect(v instanceof Error).toBe(true);
                expect(v.code).toBe("CommandNotFound");
                expect(v.description).not.toBe(null);
                expect(v.description.indexOf(help.link)).not.toBe(-1);
                expect(v.description.indexOf(help.program)).not.toBe(-1);
                expect(v.description.indexOf(terminal)).not.toBe(-1, "Error should have a description including '" + terminal + "' in message.");
                expect(v.description.indexOf(whichCmd)).not.toBe(-1, "Error should have a description including '" + whichCmd + "' in message.");
                return v;
              };
              p.then(cb, cb);
              return p;
            });
          });
        }
      });
    });
    return describe("Options", function() {
      var beautifier, beautifyEditor, editor, workspaceElement;
      editor = null;
      beautifier = null;
      workspaceElement = atom.views.getView(atom.workspace);
      beforeEach(function() {
        beautifier = new Beautifiers();
        return waitsForPromise(function() {
          return atom.workspace.open().then(function(e) {
            editor = e;
            return expect(editor.getText()).toEqual("");
          });
        });
      });
      describe("Migrate Settings", function() {
        var migrateSettings;
        migrateSettings = function(beforeKey, afterKey, val) {
          atom.config.set("atom-beautify." + beforeKey, val);
          atom.commands.dispatch(workspaceElement, "atom-beautify:migrate-settings");
          expect(_.has(atom.config.get('atom-beautify'), beforeKey)).toBe(false);
          return expect(atom.config.get("atom-beautify." + afterKey)).toBe(val);
        };
        it("should migrate js_indent_size to js.indent_size", function() {
          migrateSettings("js_indent_size", "js.indent_size", 1);
          return migrateSettings("js_indent_size", "js.indent_size", 10);
        });
        it("should migrate analytics to general.analytics", function() {
          migrateSettings("analytics", "general.analytics", true);
          return migrateSettings("analytics", "general.analytics", false);
        });
        it("should migrate _analyticsUserId to general._analyticsUserId", function() {
          migrateSettings("_analyticsUserId", "general._analyticsUserId", "userid");
          return migrateSettings("_analyticsUserId", "general._analyticsUserId", "userid2");
        });
        it("should migrate language_js_disabled to js.disabled", function() {
          migrateSettings("language_js_disabled", "js.disabled", false);
          return migrateSettings("language_js_disabled", "js.disabled", true);
        });
        it("should migrate language_js_default_beautifier to js.default_beautifier", function() {
          migrateSettings("language_js_default_beautifier", "js.default_beautifier", "Pretty Diff");
          return migrateSettings("language_js_default_beautifier", "js.default_beautifier", "JS Beautify");
        });
        return it("should migrate language_js_beautify_on_save to js.beautify_on_save", function() {
          migrateSettings("language_js_beautify_on_save", "js.beautify_on_save", true);
          return migrateSettings("language_js_beautify_on_save", "js.beautify_on_save", false);
        });
      });
      beautifyEditor = function(callback) {
        var beforeText, delay, isComplete;
        isComplete = false;
        beforeText = null;
        delay = 500;
        runs(function() {
          beforeText = editor.getText();
          atom.commands.dispatch(workspaceElement, "atom-beautify:beautify-editor");
          return setTimeout(function() {
            return isComplete = true;
          }, delay);
        });
        waitsFor(function() {
          return isComplete;
        });
        return runs(function() {
          var afterText;
          afterText = editor.getText();
          expect(typeof beforeText).toBe('string');
          expect(typeof afterText).toBe('string');
          return callback(beforeText, afterText);
        });
      };
      return describe("JavaScript", function() {
        beforeEach(function() {
          waitsForPromise(function() {
            var packName;
            packName = 'language-javascript';
            return atom.packages.activatePackage(packName);
          });
          return runs(function() {
            var code, grammar;
            code = "var hello='world';function(){console.log('hello '+hello)}";
            editor.setText(code);
            grammar = atom.grammars.selectGrammar('source.js');
            expect(grammar.name).toBe('JavaScript');
            editor.setGrammar(grammar);
            expect(editor.getGrammar().name).toBe('JavaScript');
            return jasmine.unspy(window, 'setTimeout');
          });
        });
        describe(".jsbeautifyrc", function() {
          return it("should look at directories above file", function() {
            var cb, isDone;
            isDone = false;
            cb = function(err) {
              isDone = true;
              return expect(err).toBe(void 0);
            };
            runs(function() {
              var err;
              try {
                return temp.mkdir('dir1', function(err, dirPath) {
                  var myData, myData1, rcPath;
                  if (err) {
                    return cb(err);
                  }
                  rcPath = path.join(dirPath, '.jsbeautifyrc');
                  myData1 = {
                    indent_size: 1,
                    indent_char: '\t'
                  };
                  myData = JSON.stringify(myData1);
                  return fs.writeFile(rcPath, myData, function(err) {
                    if (err) {
                      return cb(err);
                    }
                    dirPath = path.join(dirPath, 'dir2');
                    return fs.mkdir(dirPath, function(err) {
                      var myData2;
                      if (err) {
                        return cb(err);
                      }
                      rcPath = path.join(dirPath, '.jsbeautifyrc');
                      myData2 = {
                        indent_size: 2,
                        indent_char: ' '
                      };
                      myData = JSON.stringify(myData2);
                      return fs.writeFile(rcPath, myData, function(err) {
                        if (err) {
                          return cb(err);
                        }
                        return Promise.all(beautifier.getOptionsForPath(rcPath, null)).then(function(allOptions) {
                          var config1, config2, configOptions, editorConfigOptions, editorOptions, homeOptions, projectOptions, ref;
                          editorOptions = allOptions[0], configOptions = allOptions[1], homeOptions = allOptions[2], editorConfigOptions = allOptions[3];
                          projectOptions = allOptions.slice(4);
                          ref = projectOptions.slice(-2), config1 = ref[0], config2 = ref[1];
                          expect(_.get(config1, '_default.indent_size')).toBe(myData1.indent_size);
                          expect(_.get(config2, '_default.indent_size')).toBe(myData2.indent_size);
                          expect(_.get(config1, '_default.indent_char')).toBe(myData1.indent_char);
                          expect(_.get(config2, '_default.indent_char')).toBe(myData2.indent_char);
                          return cb();
                        });
                      });
                    });
                  });
                });
              } catch (error) {
                err = error;
                return cb(err);
              }
            });
            return waitsFor(function() {
              return isDone;
            });
          });
        });
        return describe("Package settings", function() {
          var getOptions;
          getOptions = function(callback) {
            var options;
            options = null;
            waitsForPromise(function() {
              var allOptions;
              allOptions = beautifier.getOptionsForPath(null, null);
              return Promise.all(allOptions).then(function(allOptions) {
                return options = allOptions;
              });
            });
            return runs(function() {
              return callback(options);
            });
          };
          it("should change indent_size to 1", function() {
            atom.config.set('atom-beautify.js.indent_size', 1);
            return getOptions(function(allOptions) {
              var configOptions;
              expect(typeof allOptions).toBe('object');
              configOptions = allOptions[1];
              expect(typeof configOptions).toBe('object');
              expect(configOptions.js.indent_size).toBe(1);
              return beautifyEditor(function(beforeText, afterText) {
                return expect(afterText).toBe("var hello = 'world';\n\nfunction() {\n console.log('hello ' + hello)\n}");
              });
            });
          });
          return it("should change indent_size to 10", function() {
            atom.config.set('atom-beautify.js.indent_size', 10);
            return getOptions(function(allOptions) {
              var configOptions;
              expect(typeof allOptions).toBe('object');
              configOptions = allOptions[1];
              expect(typeof configOptions).toBe('object');
              expect(configOptions.js.indent_size).toBe(10);
              return beautifyEditor(function(beforeText, afterText) {
                return expect(afterText).toBe("var hello = 'world';\n\nfunction() {\n          console.log('hello ' + hello)\n}");
              });
            });
          });
        });
      });
    });
  });

  describe("Languages", function() {
    var languages;
    languages = null;
    beforeEach(function() {
      return languages = new Languages();
    });
    return describe("Languages::namespace", function() {
      return it("should verify that multiple languages do not share the same namespace", function() {
        var namespaceGroups, namespaceOverlap, namespacePairs;
        namespaceGroups = _.groupBy(languages.languages, "namespace");
        namespacePairs = _.toPairs(namespaceGroups);
        namespaceOverlap = _.filter(namespacePairs, function(arg) {
          var group, namespace;
          namespace = arg[0], group = arg[1];
          return group.length > 1;
        });
        return expect(namespaceOverlap.length).toBe(0, "Language namespaces are overlapping.\nNamespaces are unique: only one language for each namespace.\n" + _.map(namespaceOverlap, function(arg) {
          var group, namespace;
          namespace = arg[0], group = arg[1];
          return "- '" + namespace + "': Check languages " + (_.map(group, 'name').join(', ')) + " for using namespace '" + namespace + "'.";
        }).join('\n'));
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcGVjL2F0b20tYmVhdXRpZnktc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0VBQ2QsV0FBQSxHQUFrQixJQUFBLFdBQUEsQ0FBQTs7RUFDbEIsVUFBQSxHQUFhLE9BQUEsQ0FBUSwrQkFBUjs7RUFDYixTQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSOztFQUNaLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUjs7RUFDSixFQUFBLEdBQU8sT0FBQSxDQUFRLElBQVI7O0VBQ1AsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7RUFDVixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsSUFBSSxDQUFDLEtBQUwsQ0FBQTs7RUFRQSxTQUFBLEdBQVksT0FBTyxDQUFDLFFBQVIsS0FBb0IsT0FBcEIsSUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQVosS0FBc0IsUUFEWixJQUVWLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBWixLQUFzQjs7RUFFeEIsUUFBQSxDQUFTLGVBQVQsRUFBMEIsU0FBQTtJQUV4QixVQUFBLENBQVcsU0FBQTthQUdULGVBQUEsQ0FBZ0IsU0FBQTtBQUNkLFlBQUE7UUFBQSxpQkFBQSxHQUFvQixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsZUFBOUI7UUFFcEIsSUFBQSxHQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsZUFBL0I7UUFDUCxJQUFJLENBQUMsV0FBTCxDQUFBO0FBSUEsZUFBTztNQVJPLENBQWhCO0lBSFMsQ0FBWDtJQWFBLFNBQUEsQ0FBVSxTQUFBO2FBQ1IsSUFBSSxDQUFDLFdBQUwsQ0FBQTtJQURRLENBQVY7SUFH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Q0FBcEMsR0FBcUUsd0JBQXJFLEdBQTZGLFNBQTdGLEdBQXVHO1FBQS9ILENBQXhCLENBQTJKLENBQUMsSUFBNUosQ0FBaUssSUFBakssQ0FIRjtNQU4wRSxDQUE1RTtJQUYrQixDQUFqQztFQVBvQixDQUF0QjtBQXhaQSIsInNvdXJjZXNDb250ZW50IjpbIkJlYXV0aWZpZXJzID0gcmVxdWlyZSBcIi4uL3NyYy9iZWF1dGlmaWVyc1wiXG5iZWF1dGlmaWVycyA9IG5ldyBCZWF1dGlmaWVycygpXG5CZWF1dGlmaWVyID0gcmVxdWlyZSBcIi4uL3NyYy9iZWF1dGlmaWVycy9iZWF1dGlmaWVyXCJcbkxhbmd1YWdlcyA9IHJlcXVpcmUoJy4uL3NyYy9sYW5ndWFnZXMvJylcbl8gPSByZXF1aXJlKCdsb2Rhc2gnKVxuZnMgICA9IHJlcXVpcmUoJ2ZzJylcbnBhdGggPSByZXF1aXJlKCdwYXRoJylcblByb21pc2UgPSByZXF1aXJlKFwiYmx1ZWJpcmRcIilcbnRlbXAgPSByZXF1aXJlKCd0ZW1wJylcbnRlbXAudHJhY2soKVxuXG4jIFVzZSB0aGUgY29tbWFuZCBgd2luZG93OnJ1bi1wYWNrYWdlLXNwZWNzYCAoY21kLWFsdC1jdHJsLXApIHRvIHJ1biBzcGVjcy5cbiNcbiMgVG8gcnVuIGEgc3BlY2lmaWMgYGl0YCBvciBgZGVzY3JpYmVgIGJsb2NrIGFkZCBhbiBgZmAgdG8gdGhlIGZyb250IChlLmcuIGBmaXRgXG4jIG9yIGBmZGVzY3JpYmVgKS4gUmVtb3ZlIHRoZSBgZmAgdG8gdW5mb2N1cyB0aGUgYmxvY2suXG5cbiMgQ2hlY2sgaWYgV2luZG93c1xuaXNXaW5kb3dzID0gcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInIG9yXG4gIHByb2Nlc3MuZW52Lk9TVFlQRSBpcyAnY3lnd2luJyBvclxuICBwcm9jZXNzLmVudi5PU1RZUEUgaXMgJ21zeXMnXG5cbmRlc2NyaWJlIFwiQXRvbS1CZWF1dGlmeVwiLCAtPlxuXG4gIGJlZm9yZUVhY2ggLT5cblxuICAgICMgQWN0aXZhdGUgcGFja2FnZVxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYWN0aXZhdGlvblByb21pc2UgPSBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnYXRvbS1iZWF1dGlmeScpXG4gICAgICAjIEZvcmNlIGFjdGl2YXRlIHBhY2thZ2VcbiAgICAgIHBhY2sgPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoXCJhdG9tLWJlYXV0aWZ5XCIpXG4gICAgICBwYWNrLmFjdGl2YXRlTm93KClcbiAgICAgICMgQ2hhbmdlIGxvZ2dlciBsZXZlbFxuICAgICAgIyBhdG9tLmNvbmZpZy5zZXQoJ2F0b20tYmVhdXRpZnkuX2xvZ2dlckxldmVsJywgJ3ZlcmJvc2UnKVxuICAgICAgIyBSZXR1cm4gcHJvbWlzZVxuICAgICAgcmV0dXJuIGFjdGl2YXRpb25Qcm9taXNlXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgdGVtcC5jbGVhbnVwU3luYygpXG5cbiAgZGVzY3JpYmUgXCJCZWF1dGlmaWVyc1wiLCAtPlxuXG4gICAgYmVhdXRpZmllciA9IG51bGxcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGJlYXV0aWZpZXIgPSBuZXcgQmVhdXRpZmllcigpXG5cbiAgICBkZXNjcmliZSBcIkJlYXV0aWZpZXI6OnJ1blwiLCAtPlxuXG4gICAgICBpdCBcInNob3VsZCBlcnJvciB3aGVuIGJlYXV0aWZpZXIncyBwcm9ncmFtIG5vdCBmb3VuZFwiLCAtPlxuICAgICAgICBleHBlY3QoYmVhdXRpZmllcikubm90LnRvQmUobnVsbClcbiAgICAgICAgZXhwZWN0KGJlYXV0aWZpZXIgaW5zdGFuY2VvZiBCZWF1dGlmaWVyKS50b0JlKHRydWUpXG5cbiAgICAgICAgIyB3YWl0c0ZvclJ1bnMgPSAoZm4sIG1lc3NhZ2UsIHRpbWVvdXQpIC0+XG4gICAgICAgICMgICAgIGlzQ29tcGxldGVkID0gZmFsc2VcbiAgICAgICAgIyAgICAgY29tcGxldGVkID0gLT5cbiAgICAgICAgIyAgICAgICAgIGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICAgICAgICAjICAgICAgICAgaXNDb21wbGV0ZWQgPSB0cnVlXG4gICAgICAgICMgICAgIHJ1bnMgLT5cbiAgICAgICAgIyAgICAgICAgIGNvbnNvbGUubG9nKCdydW5zJylcbiAgICAgICAgIyAgICAgICAgIGZuKGNvbXBsZXRlZClcbiAgICAgICAgIyAgICAgd2FpdHNGb3IoLT5cbiAgICAgICAgIyAgICAgICAgIGNvbnNvbGUubG9nKCd3YWl0c0ZvcicsIGlzQ29tcGxldGVkKVxuICAgICAgICAjICAgICAgICAgaXNDb21wbGV0ZWRcbiAgICAgICAgIyAgICAgLCBtZXNzYWdlLCB0aW1lb3V0KVxuICAgICAgICAjXG4gICAgICAgICMgd2FpdHNGb3JSdW5zKChjYikgLT5cbiAgICAgICAgIyAgICAgY29uc29sZS5sb2coJ3dhaXRzRm9yUnVucycsIGNiKVxuICAgICAgICAjICAgICBzZXRUaW1lb3V0KGNiLCAyMDAwKVxuICAgICAgICAjICwgXCJXYWl0aW5nIGZvciBiZWF1dGlmaWNhdGlvbiB0byBjb21wbGV0ZVwiLCA1MDAwKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSBzaG91bGRSZWplY3Q6IHRydWUsIC0+XG4gICAgICAgICAgcCA9IGJlYXV0aWZpZXIucnVuKFwicHJvZ3JhbVwiLCBbXSlcbiAgICAgICAgICBleHBlY3QocCkubm90LnRvQmUobnVsbClcbiAgICAgICAgICBleHBlY3QocCBpbnN0YW5jZW9mIGJlYXV0aWZpZXIuUHJvbWlzZSkudG9CZSh0cnVlKVxuICAgICAgICAgIGNiID0gKHYpIC0+XG4gICAgICAgICAgICAjIGNvbnNvbGUubG9nKHYpXG4gICAgICAgICAgICBleHBlY3Qodikubm90LnRvQmUobnVsbClcbiAgICAgICAgICAgIGV4cGVjdCh2IGluc3RhbmNlb2YgRXJyb3IpLnRvQmUodHJ1ZSlcbiAgICAgICAgICAgIGV4cGVjdCh2LmNvZGUpLnRvQmUoXCJDb21tYW5kTm90Rm91bmRcIilcbiAgICAgICAgICAgIGV4cGVjdCh2LmRlc2NyaXB0aW9uKS50b0JlKHVuZGVmaW5lZCwgXFxcbiAgICAgICAgICAgICAgJ0Vycm9yIHNob3VsZCBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLicpXG4gICAgICAgICAgICByZXR1cm4gdlxuICAgICAgICAgIHAudGhlbihjYiwgY2IpXG4gICAgICAgICAgcmV0dXJuIHBcblxuICAgICAgaXQgXCJzaG91bGQgZXJyb3Igd2l0aCBoZWxwIGRlc2NyaXB0aW9uIFxcXG4gICAgICAgICAgICAgICAgd2hlbiBiZWF1dGlmaWVyJ3MgcHJvZ3JhbSBub3QgZm91bmRcIiwgLT5cbiAgICAgICAgZXhwZWN0KGJlYXV0aWZpZXIpLm5vdC50b0JlKG51bGwpXG4gICAgICAgIGV4cGVjdChiZWF1dGlmaWVyIGluc3RhbmNlb2YgQmVhdXRpZmllcikudG9CZSh0cnVlKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSBzaG91bGRSZWplY3Q6IHRydWUsIC0+XG4gICAgICAgICAgaGVscCA9IHtcbiAgICAgICAgICAgIGxpbms6IFwiaHR0cDovL3Rlc3QuY29tXCJcbiAgICAgICAgICAgIHByb2dyYW06IFwidGVzdC1wcm9ncmFtXCJcbiAgICAgICAgICAgIHBhdGhPcHRpb246IFwiTGFuZyAtIFRlc3QgUHJvZ3JhbSBQYXRoXCJcbiAgICAgICAgICB9XG4gICAgICAgICAgcCA9IGJlYXV0aWZpZXIucnVuKFwicHJvZ3JhbVwiLCBbXSwgaGVscDogaGVscClcbiAgICAgICAgICBleHBlY3QocCkubm90LnRvQmUobnVsbClcbiAgICAgICAgICBleHBlY3QocCBpbnN0YW5jZW9mIGJlYXV0aWZpZXIuUHJvbWlzZSkudG9CZSh0cnVlKVxuICAgICAgICAgIGNiID0gKHYpIC0+XG4gICAgICAgICAgICAjIGNvbnNvbGUubG9nKHYpXG4gICAgICAgICAgICBleHBlY3Qodikubm90LnRvQmUobnVsbClcbiAgICAgICAgICAgIGV4cGVjdCh2IGluc3RhbmNlb2YgRXJyb3IpLnRvQmUodHJ1ZSlcbiAgICAgICAgICAgIGV4cGVjdCh2LmNvZGUpLnRvQmUoXCJDb21tYW5kTm90Rm91bmRcIilcbiAgICAgICAgICAgIGV4cGVjdCh2LmRlc2NyaXB0aW9uKS5ub3QudG9CZShudWxsKVxuICAgICAgICAgICAgZXhwZWN0KHYuZGVzY3JpcHRpb24uaW5kZXhPZihoZWxwLmxpbmspKS5ub3QudG9CZSgtMSlcbiAgICAgICAgICAgIGV4cGVjdCh2LmRlc2NyaXB0aW9uLmluZGV4T2YoaGVscC5wcm9ncmFtKSkubm90LnRvQmUoLTEpXG4gICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAuaW5kZXhPZihoZWxwLnBhdGhPcHRpb24pKS5ub3QudG9CZSgtMSwgXFxcbiAgICAgICAgICAgICAgXCJFcnJvciBzaG91bGQgaGF2ZSBhIGRlc2NyaXB0aW9uLlwiKVxuICAgICAgICAgICAgcmV0dXJuIHZcbiAgICAgICAgICBwLnRoZW4oY2IsIGNiKVxuICAgICAgICAgIHJldHVybiBwXG5cbiAgICAgIGl0IFwic2hvdWxkIGVycm9yIHdpdGggV2luZG93cy1zcGVjaWZpYyBoZWxwIGRlc2NyaXB0aW9uIFxcXG4gICAgICAgICAgICAgICAgd2hlbiBiZWF1dGlmaWVyJ3MgcHJvZ3JhbSBub3QgZm91bmRcIiwgLT5cbiAgICAgICAgZXhwZWN0KGJlYXV0aWZpZXIpLm5vdC50b0JlKG51bGwpXG4gICAgICAgIGV4cGVjdChiZWF1dGlmaWVyIGluc3RhbmNlb2YgQmVhdXRpZmllcikudG9CZSh0cnVlKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSBzaG91bGRSZWplY3Q6IHRydWUsIC0+XG4gICAgICAgICAgaGVscCA9IHtcbiAgICAgICAgICAgIGxpbms6IFwiaHR0cDovL3Rlc3QuY29tXCJcbiAgICAgICAgICAgIHByb2dyYW06IFwidGVzdC1wcm9ncmFtXCJcbiAgICAgICAgICAgIHBhdGhPcHRpb246IFwiTGFuZyAtIFRlc3QgUHJvZ3JhbSBQYXRoXCJcbiAgICAgICAgICB9XG4gICAgICAgICAgIyBGb3JjZSB0byBiZSBXaW5kb3dzXG4gICAgICAgICAgYmVhdXRpZmllci5pc1dpbmRvd3MgPSB0cnVlXG4gICAgICAgICAgdGVybWluYWwgPSAnQ01EIHByb21wdCdcbiAgICAgICAgICB3aGljaENtZCA9IFwid2hlcmUuZXhlXCJcbiAgICAgICAgICAjIFByb2Nlc3NcbiAgICAgICAgICBwID0gYmVhdXRpZmllci5ydW4oXCJwcm9ncmFtXCIsIFtdLCBoZWxwOiBoZWxwKVxuICAgICAgICAgIGV4cGVjdChwKS5ub3QudG9CZShudWxsKVxuICAgICAgICAgIGV4cGVjdChwIGluc3RhbmNlb2YgYmVhdXRpZmllci5Qcm9taXNlKS50b0JlKHRydWUpXG4gICAgICAgICAgY2IgPSAodikgLT5cbiAgICAgICAgICAgICMgY29uc29sZS5sb2codilcbiAgICAgICAgICAgIGV4cGVjdCh2KS5ub3QudG9CZShudWxsKVxuICAgICAgICAgICAgZXhwZWN0KHYgaW5zdGFuY2VvZiBFcnJvcikudG9CZSh0cnVlKVxuICAgICAgICAgICAgZXhwZWN0KHYuY29kZSkudG9CZShcIkNvbW1hbmROb3RGb3VuZFwiKVxuICAgICAgICAgICAgZXhwZWN0KHYuZGVzY3JpcHRpb24pLm5vdC50b0JlKG51bGwpXG4gICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvbi5pbmRleE9mKGhlbHAubGluaykpLm5vdC50b0JlKC0xKVxuICAgICAgICAgICAgZXhwZWN0KHYuZGVzY3JpcHRpb24uaW5kZXhPZihoZWxwLnByb2dyYW0pKS5ub3QudG9CZSgtMSlcbiAgICAgICAgICAgIGV4cGVjdCh2LmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgIC5pbmRleE9mKGhlbHAucGF0aE9wdGlvbikpLm5vdC50b0JlKC0xLCBcXFxuICAgICAgICAgICAgICBcIkVycm9yIHNob3VsZCBoYXZlIGEgZGVzY3JpcHRpb24uXCIpXG4gICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAuaW5kZXhPZih0ZXJtaW5hbCkpLm5vdC50b0JlKC0xLCBcXFxuICAgICAgICAgICAgICBcIkVycm9yIHNob3VsZCBoYXZlIGEgZGVzY3JpcHRpb24gaW5jbHVkaW5nIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJyN7dGVybWluYWx9JyBpbiBtZXNzYWdlLlwiKVxuICAgICAgICAgICAgZXhwZWN0KHYuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgLmluZGV4T2Yod2hpY2hDbWQpKS5ub3QudG9CZSgtMSwgXFxcbiAgICAgICAgICAgICAgXCJFcnJvciBzaG91bGQgaGF2ZSBhIGRlc2NyaXB0aW9uIGluY2x1ZGluZyBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcje3doaWNoQ21kfScgaW4gbWVzc2FnZS5cIilcbiAgICAgICAgICAgIHJldHVybiB2XG4gICAgICAgICAgcC50aGVuKGNiLCBjYilcbiAgICAgICAgICByZXR1cm4gcFxuXG4gICAgICB1bmxlc3MgaXNXaW5kb3dzXG4gICAgICAgIGl0IFwic2hvdWxkIGVycm9yIHdpdGggTWFjL0xpbnV4LXNwZWNpZmljIGhlbHAgZGVzY3JpcHRpb24gXFxcbiAgICAgICAgICAgICAgICAgIHdoZW4gYmVhdXRpZmllcidzIHByb2dyYW0gbm90IGZvdW5kXCIsIC0+XG4gICAgICAgICAgZXhwZWN0KGJlYXV0aWZpZXIpLm5vdC50b0JlKG51bGwpXG4gICAgICAgICAgZXhwZWN0KGJlYXV0aWZpZXIgaW5zdGFuY2VvZiBCZWF1dGlmaWVyKS50b0JlKHRydWUpXG5cbiAgICAgICAgICB3YWl0c0ZvclByb21pc2Ugc2hvdWxkUmVqZWN0OiB0cnVlLCAtPlxuICAgICAgICAgICAgaGVscCA9IHtcbiAgICAgICAgICAgICAgbGluazogXCJodHRwOi8vdGVzdC5jb21cIlxuICAgICAgICAgICAgICBwcm9ncmFtOiBcInRlc3QtcHJvZ3JhbVwiXG4gICAgICAgICAgICAgIHBhdGhPcHRpb246IFwiTGFuZyAtIFRlc3QgUHJvZ3JhbSBQYXRoXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICMgRm9yY2UgdG8gYmUgTWFjL0xpbnV4IChub3QgV2luZG93cylcbiAgICAgICAgICAgIGJlYXV0aWZpZXIuaXNXaW5kb3dzID0gZmFsc2VcbiAgICAgICAgICAgIHRlcm1pbmFsID0gXCJUZXJtaW5hbFwiXG4gICAgICAgICAgICB3aGljaENtZCA9IFwid2hpY2hcIlxuICAgICAgICAgICAgIyBQcm9jZXNzXG4gICAgICAgICAgICBwID0gYmVhdXRpZmllci5ydW4oXCJwcm9ncmFtXCIsIFtdLCBoZWxwOiBoZWxwKVxuICAgICAgICAgICAgZXhwZWN0KHApLm5vdC50b0JlKG51bGwpXG4gICAgICAgICAgICBleHBlY3QocCBpbnN0YW5jZW9mIGJlYXV0aWZpZXIuUHJvbWlzZSkudG9CZSh0cnVlKVxuICAgICAgICAgICAgY2IgPSAodikgLT5cbiAgICAgICAgICAgICAgIyBjb25zb2xlLmxvZyh2KVxuICAgICAgICAgICAgICBleHBlY3Qodikubm90LnRvQmUobnVsbClcbiAgICAgICAgICAgICAgZXhwZWN0KHYgaW5zdGFuY2VvZiBFcnJvcikudG9CZSh0cnVlKVxuICAgICAgICAgICAgICBleHBlY3Qodi5jb2RlKS50b0JlKFwiQ29tbWFuZE5vdEZvdW5kXCIpXG4gICAgICAgICAgICAgIGV4cGVjdCh2LmRlc2NyaXB0aW9uKS5ub3QudG9CZShudWxsKVxuICAgICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvbi5pbmRleE9mKGhlbHAubGluaykpLm5vdC50b0JlKC0xKVxuICAgICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvbi5pbmRleE9mKGhlbHAucHJvZ3JhbSkpLm5vdC50b0JlKC0xKVxuICAgICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIC5pbmRleE9mKHRlcm1pbmFsKSkubm90LnRvQmUoLTEsIFxcXG4gICAgICAgICAgICAgICAgXCJFcnJvciBzaG91bGQgaGF2ZSBhIGRlc2NyaXB0aW9uIGluY2x1ZGluZyBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyN7dGVybWluYWx9JyBpbiBtZXNzYWdlLlwiKVxuICAgICAgICAgICAgICBleHBlY3Qodi5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIC5pbmRleE9mKHdoaWNoQ21kKSkubm90LnRvQmUoLTEsIFxcXG4gICAgICAgICAgICAgICAgXCJFcnJvciBzaG91bGQgaGF2ZSBhIGRlc2NyaXB0aW9uIGluY2x1ZGluZyBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyN7d2hpY2hDbWR9JyBpbiBtZXNzYWdlLlwiKVxuICAgICAgICAgICAgICByZXR1cm4gdlxuICAgICAgICAgICAgcC50aGVuKGNiLCBjYilcbiAgICAgICAgICAgIHJldHVybiBwXG5cbiAgZGVzY3JpYmUgXCJPcHRpb25zXCIsIC0+XG5cbiAgICBlZGl0b3IgPSBudWxsXG4gICAgYmVhdXRpZmllciA9IG51bGxcbiAgICB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKVxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGJlYXV0aWZpZXIgPSBuZXcgQmVhdXRpZmllcnMoKVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oKS50aGVuIChlKSAtPlxuICAgICAgICAgIGVkaXRvciA9IGVcbiAgICAgICAgICBleHBlY3QoZWRpdG9yLmdldFRleHQoKSkudG9FcXVhbChcIlwiKVxuXG4gICAgZGVzY3JpYmUgXCJNaWdyYXRlIFNldHRpbmdzXCIsIC0+XG5cbiAgICAgIG1pZ3JhdGVTZXR0aW5ncyA9IChiZWZvcmVLZXksIGFmdGVyS2V5LCB2YWwpIC0+XG4gICAgICAgICMgc2V0IG9sZCBvcHRpb25zXG4gICAgICAgIGF0b20uY29uZmlnLnNldChcImF0b20tYmVhdXRpZnkuI3tiZWZvcmVLZXl9XCIsIHZhbClcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCBcImF0b20tYmVhdXRpZnk6bWlncmF0ZS1zZXR0aW5nc1wiXG4gICAgICAgICMgQ2hlY2sgcmVzdWx0aW5nIGNvbmZpZ1xuICAgICAgICBleHBlY3QoXy5oYXMoYXRvbS5jb25maWcuZ2V0KCdhdG9tLWJlYXV0aWZ5JyksIGJlZm9yZUtleSkpLnRvQmUoZmFsc2UpXG4gICAgICAgIGV4cGVjdChhdG9tLmNvbmZpZy5nZXQoXCJhdG9tLWJlYXV0aWZ5LiN7YWZ0ZXJLZXl9XCIpKS50b0JlKHZhbClcblxuICAgICAgaXQgXCJzaG91bGQgbWlncmF0ZSBqc19pbmRlbnRfc2l6ZSB0byBqcy5pbmRlbnRfc2l6ZVwiLCAtPlxuICAgICAgICBtaWdyYXRlU2V0dGluZ3MoXCJqc19pbmRlbnRfc2l6ZVwiLFwianMuaW5kZW50X3NpemVcIiwgMSlcbiAgICAgICAgbWlncmF0ZVNldHRpbmdzKFwianNfaW5kZW50X3NpemVcIixcImpzLmluZGVudF9zaXplXCIsIDEwKVxuXG4gICAgICBpdCBcInNob3VsZCBtaWdyYXRlIGFuYWx5dGljcyB0byBnZW5lcmFsLmFuYWx5dGljc1wiLCAtPlxuICAgICAgICBtaWdyYXRlU2V0dGluZ3MoXCJhbmFseXRpY3NcIixcImdlbmVyYWwuYW5hbHl0aWNzXCIsIHRydWUpXG4gICAgICAgIG1pZ3JhdGVTZXR0aW5ncyhcImFuYWx5dGljc1wiLFwiZ2VuZXJhbC5hbmFseXRpY3NcIiwgZmFsc2UpXG5cbiAgICAgIGl0IFwic2hvdWxkIG1pZ3JhdGUgX2FuYWx5dGljc1VzZXJJZCB0byBnZW5lcmFsLl9hbmFseXRpY3NVc2VySWRcIiwgLT5cbiAgICAgICAgbWlncmF0ZVNldHRpbmdzKFwiX2FuYWx5dGljc1VzZXJJZFwiLFwiZ2VuZXJhbC5fYW5hbHl0aWNzVXNlcklkXCIsIFwidXNlcmlkXCIpXG4gICAgICAgIG1pZ3JhdGVTZXR0aW5ncyhcIl9hbmFseXRpY3NVc2VySWRcIixcImdlbmVyYWwuX2FuYWx5dGljc1VzZXJJZFwiLCBcInVzZXJpZDJcIilcblxuICAgICAgaXQgXCJzaG91bGQgbWlncmF0ZSBsYW5ndWFnZV9qc19kaXNhYmxlZCB0byBqcy5kaXNhYmxlZFwiLCAtPlxuICAgICAgICBtaWdyYXRlU2V0dGluZ3MoXCJsYW5ndWFnZV9qc19kaXNhYmxlZFwiLFwianMuZGlzYWJsZWRcIiwgZmFsc2UpXG4gICAgICAgIG1pZ3JhdGVTZXR0aW5ncyhcImxhbmd1YWdlX2pzX2Rpc2FibGVkXCIsXCJqcy5kaXNhYmxlZFwiLCB0cnVlKVxuXG4gICAgICBpdCBcInNob3VsZCBtaWdyYXRlIGxhbmd1YWdlX2pzX2RlZmF1bHRfYmVhdXRpZmllciB0byBqcy5kZWZhdWx0X2JlYXV0aWZpZXJcIiwgLT5cbiAgICAgICAgbWlncmF0ZVNldHRpbmdzKFwibGFuZ3VhZ2VfanNfZGVmYXVsdF9iZWF1dGlmaWVyXCIsXCJqcy5kZWZhdWx0X2JlYXV0aWZpZXJcIiwgXCJQcmV0dHkgRGlmZlwiKVxuICAgICAgICBtaWdyYXRlU2V0dGluZ3MoXCJsYW5ndWFnZV9qc19kZWZhdWx0X2JlYXV0aWZpZXJcIixcImpzLmRlZmF1bHRfYmVhdXRpZmllclwiLCBcIkpTIEJlYXV0aWZ5XCIpXG5cbiAgICAgIGl0IFwic2hvdWxkIG1pZ3JhdGUgbGFuZ3VhZ2VfanNfYmVhdXRpZnlfb25fc2F2ZSB0byBqcy5iZWF1dGlmeV9vbl9zYXZlXCIsIC0+XG4gICAgICAgIG1pZ3JhdGVTZXR0aW5ncyhcImxhbmd1YWdlX2pzX2JlYXV0aWZ5X29uX3NhdmVcIixcImpzLmJlYXV0aWZ5X29uX3NhdmVcIiwgdHJ1ZSlcbiAgICAgICAgbWlncmF0ZVNldHRpbmdzKFwibGFuZ3VhZ2VfanNfYmVhdXRpZnlfb25fc2F2ZVwiLFwianMuYmVhdXRpZnlfb25fc2F2ZVwiLCBmYWxzZSlcblxuICAgIGJlYXV0aWZ5RWRpdG9yID0gKGNhbGxiYWNrKSAtPlxuICAgICAgaXNDb21wbGV0ZSA9IGZhbHNlXG4gICAgICBiZWZvcmVUZXh0ID0gbnVsbFxuICAgICAgZGVsYXkgPSA1MDBcbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgYmVmb3JlVGV4dCA9IGVkaXRvci5nZXRUZXh0KClcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCB3b3Jrc3BhY2VFbGVtZW50LCBcImF0b20tYmVhdXRpZnk6YmVhdXRpZnktZWRpdG9yXCJcbiAgICAgICAgc2V0VGltZW91dCgtPlxuICAgICAgICAgIGlzQ29tcGxldGUgPSB0cnVlXG4gICAgICAgICwgZGVsYXkpXG4gICAgICB3YWl0c0ZvciAtPlxuICAgICAgICBpc0NvbXBsZXRlXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgYWZ0ZXJUZXh0ID0gZWRpdG9yLmdldFRleHQoKVxuICAgICAgICBleHBlY3QodHlwZW9mIGJlZm9yZVRleHQpLnRvQmUoJ3N0cmluZycpXG4gICAgICAgIGV4cGVjdCh0eXBlb2YgYWZ0ZXJUZXh0KS50b0JlKCdzdHJpbmcnKVxuICAgICAgICByZXR1cm4gY2FsbGJhY2soYmVmb3JlVGV4dCwgYWZ0ZXJUZXh0KVxuXG4gICAgZGVzY3JpYmUgXCJKYXZhU2NyaXB0XCIsIC0+XG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBwYWNrTmFtZSA9ICdsYW5ndWFnZS1qYXZhc2NyaXB0J1xuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKHBhY2tOYW1lKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAjIFNldHVwIEVkaXRvclxuICAgICAgICAgIGNvZGUgPSBcInZhciBoZWxsbz0nd29ybGQnO2Z1bmN0aW9uKCl7Y29uc29sZS5sb2coJ2hlbGxvICcraGVsbG8pfVwiXG4gICAgICAgICAgZWRpdG9yLnNldFRleHQoY29kZSlcbiAgICAgICAgICAjIGNvbnNvbGUubG9nKGF0b20uZ3JhbW1hcnMuZ3JhbW1hcnNCeVNjb3BlTmFtZSlcbiAgICAgICAgICBncmFtbWFyID0gYXRvbS5ncmFtbWFycy5zZWxlY3RHcmFtbWFyKCdzb3VyY2UuanMnKVxuICAgICAgICAgIGV4cGVjdChncmFtbWFyLm5hbWUpLnRvQmUoJ0phdmFTY3JpcHQnKVxuICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIpXG4gICAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRHcmFtbWFyKCkubmFtZSkudG9CZSgnSmF2YVNjcmlwdCcpXG5cbiAgICAgICAgICAjIFNlZSBodHRwczovL2Rpc2N1c3MuYXRvbS5pby90L3NvbHZlZC1zZXR0aW1lb3V0LW5vdC13b3JraW5nLWZpcmluZy1pbi1zcGVjcy10ZXN0cy8xMTQyNy8xN1xuICAgICAgICAgIGphc21pbmUudW5zcHkod2luZG93LCAnc2V0VGltZW91dCcpXG5cbiAgICAgICMgYWZ0ZXJFYWNoIC0+XG4gICAgICAjICAgYXRvbS5wYWNrYWdlcy5kZWFjdGl2YXRlUGFja2FnZXMoKVxuICAgICAgIyAgIGF0b20ucGFja2FnZXMudW5sb2FkUGFja2FnZXMoKVxuXG4gICAgICBkZXNjcmliZSBcIi5qc2JlYXV0aWZ5cmNcIiwgLT5cblxuICAgICAgICBpdCBcInNob3VsZCBsb29rIGF0IGRpcmVjdG9yaWVzIGFib3ZlIGZpbGVcIiwgLT5cbiAgICAgICAgICBpc0RvbmUgPSBmYWxzZVxuICAgICAgICAgIGNiID0gKGVycikgLT5cbiAgICAgICAgICAgIGlzRG9uZSA9IHRydWVcbiAgICAgICAgICAgIGV4cGVjdChlcnIpLnRvQmUodW5kZWZpbmVkKVxuICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAjIGNvbnNvbGUubG9nKCdydW5zJylcbiAgICAgICAgICAgICAgIyBNYWtlIHRvcCBkaXJlY3RvcnlcbiAgICAgICAgICAgICAgdGVtcC5ta2RpcignZGlyMScsIChlcnIsIGRpclBhdGgpIC0+XG4gICAgICAgICAgICAgICAgIyBjb25zb2xlLmxvZyhhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKGVycikgaWYgZXJyXG4gICAgICAgICAgICAgICAgIyBBZGQgLmpzYmVhdXRpZnlyYyBmaWxlXG4gICAgICAgICAgICAgICAgcmNQYXRoID0gcGF0aC5qb2luKGRpclBhdGgsICcuanNiZWF1dGlmeXJjJylcbiAgICAgICAgICAgICAgICBteURhdGExID0ge1xuICAgICAgICAgICAgICAgICAgaW5kZW50X3NpemU6IDEsXG4gICAgICAgICAgICAgICAgICBpbmRlbnRfY2hhcjogJ1xcdCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbXlEYXRhID0gSlNPTi5zdHJpbmdpZnkobXlEYXRhMSlcbiAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUocmNQYXRoLCBteURhdGEsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAjIGNvbnNvbGUubG9nKGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgIHJldHVybiBjYihlcnIpIGlmIGVyclxuICAgICAgICAgICAgICAgICAgIyBNYWtlIG5leHQgZGlyZWN0b3J5XG4gICAgICAgICAgICAgICAgICBkaXJQYXRoID0gcGF0aC5qb2luKGRpclBhdGgsICdkaXIyJylcbiAgICAgICAgICAgICAgICAgIGZzLm1rZGlyKGRpclBhdGgsIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgICMgY29uc29sZS5sb2coYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoZXJyKSBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgIyBBZGQgLmpzYmVhdXRpZnlyYyBmaWxlXG4gICAgICAgICAgICAgICAgICAgIHJjUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCAnLmpzYmVhdXRpZnlyYycpXG4gICAgICAgICAgICAgICAgICAgIG15RGF0YTIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgaW5kZW50X3NpemU6IDIsXG4gICAgICAgICAgICAgICAgICAgICAgaW5kZW50X2NoYXI6ICcgJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG15RGF0YSA9IEpTT04uc3RyaW5naWZ5KG15RGF0YTIpXG4gICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZShyY1BhdGgsIG15RGF0YSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAjIGNvbnNvbGUubG9nKGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoZXJyKSBpZiBlcnJcbiAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLmFsbChiZWF1dGlmaWVyLmdldE9wdGlvbnNGb3JQYXRoKHJjUGF0aCwgbnVsbCkpXG4gICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGFsbE9wdGlvbnMpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAjIGNvbnNvbGUubG9nKCdhbGxPcHRpb25zJywgYWxsT3B0aW9ucylcblxuICAgICAgICAgICAgICAgICAgICAgICAgIyBFeHRyYWN0IG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3JPcHRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnT3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWVPcHRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yQ29uZmlnT3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgXSA9IGFsbE9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RPcHRpb25zID0gYWxsT3B0aW9uc1s0Li5dXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICMgQ2hlY2sgdGhhdCB3ZSBleHRyYWN0ZWQgLmpzYmVhdXRpZnlyYyBmaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgW2NvbmZpZzEsIGNvbmZpZzJdID0gcHJvamVjdE9wdGlvbnNbLTIuLl1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KF8uZ2V0KGNvbmZpZzEsJ19kZWZhdWx0LmluZGVudF9zaXplJykpLnRvQmUobXlEYXRhMS5pbmRlbnRfc2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChfLmdldChjb25maWcyLCdfZGVmYXVsdC5pbmRlbnRfc2l6ZScpKS50b0JlKG15RGF0YTIuaW5kZW50X3NpemUpXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBlY3QoXy5nZXQoY29uZmlnMSwnX2RlZmF1bHQuaW5kZW50X2NoYXInKSkudG9CZShteURhdGExLmluZGVudF9jaGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KF8uZ2V0KGNvbmZpZzIsJ19kZWZhdWx0LmluZGVudF9jaGFyJykpLnRvQmUobXlEYXRhMi5pbmRlbnRfY2hhcilcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgIGNiKGVycilcbiAgICAgICAgICB3YWl0c0ZvciAtPlxuICAgICAgICAgICAgaXNEb25lXG5cblxuICAgICAgZGVzY3JpYmUgXCJQYWNrYWdlIHNldHRpbmdzXCIsIC0+XG5cbiAgICAgICAgZ2V0T3B0aW9ucyA9IChjYWxsYmFjaykgLT5cbiAgICAgICAgICBvcHRpb25zID0gbnVsbFxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgICAgIyBjb25zb2xlLmxvZygnYmVhdXRpZmllcicsIGJlYXV0aWZpZXIuZ2V0T3B0aW9uc0ZvclBhdGgsIGJlYXV0aWZpZXIpXG4gICAgICAgICAgICBhbGxPcHRpb25zID0gYmVhdXRpZmllci5nZXRPcHRpb25zRm9yUGF0aChudWxsLCBudWxsKVxuICAgICAgICAgICAgIyBSZXNvbHZlIG9wdGlvbnMgd2l0aCBwcm9taXNlc1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGFsbE9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbigoYWxsT3B0aW9ucykgLT5cbiAgICAgICAgICAgICAgb3B0aW9ucyA9IGFsbE9wdGlvbnNcbiAgICAgICAgICAgIClcbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBjYWxsYmFjayhvcHRpb25zKVxuXG4gICAgICAgIGl0IFwic2hvdWxkIGNoYW5nZSBpbmRlbnRfc2l6ZSB0byAxXCIsIC0+XG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdG9tLWJlYXV0aWZ5LmpzLmluZGVudF9zaXplJywgMSlcblxuICAgICAgICAgIGdldE9wdGlvbnMgKGFsbE9wdGlvbnMpIC0+XG4gICAgICAgICAgICBleHBlY3QodHlwZW9mIGFsbE9wdGlvbnMpLnRvQmUoJ29iamVjdCcpXG4gICAgICAgICAgICBjb25maWdPcHRpb25zID0gYWxsT3B0aW9uc1sxXVxuICAgICAgICAgICAgZXhwZWN0KHR5cGVvZiBjb25maWdPcHRpb25zKS50b0JlKCdvYmplY3QnKVxuICAgICAgICAgICAgZXhwZWN0KGNvbmZpZ09wdGlvbnMuanMuaW5kZW50X3NpemUpLnRvQmUoMSlcblxuICAgICAgICAgICAgYmVhdXRpZnlFZGl0b3IgKGJlZm9yZVRleHQsIGFmdGVyVGV4dCkgLT5cbiAgICAgICAgICAgICAgIyBjb25zb2xlLmxvZyhiZWZvcmVUZXh0LCBhZnRlclRleHQsIGVkaXRvcilcbiAgICAgICAgICAgICAgZXhwZWN0KGFmdGVyVGV4dCkudG9CZShcIlwiXCJ2YXIgaGVsbG8gPSAnd29ybGQnO1xuXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2hlbGxvICcgKyBoZWxsbylcbiAgICAgICAgICAgICAgfVwiXCJcIilcblxuICAgICAgICBpdCBcInNob3VsZCBjaGFuZ2UgaW5kZW50X3NpemUgdG8gMTBcIiwgLT5cbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2F0b20tYmVhdXRpZnkuanMuaW5kZW50X3NpemUnLCAxMClcblxuICAgICAgICAgIGdldE9wdGlvbnMgKGFsbE9wdGlvbnMpIC0+XG4gICAgICAgICAgICBleHBlY3QodHlwZW9mIGFsbE9wdGlvbnMpLnRvQmUoJ29iamVjdCcpXG4gICAgICAgICAgICBjb25maWdPcHRpb25zID0gYWxsT3B0aW9uc1sxXVxuICAgICAgICAgICAgZXhwZWN0KHR5cGVvZiBjb25maWdPcHRpb25zKS50b0JlKCdvYmplY3QnKVxuICAgICAgICAgICAgZXhwZWN0KGNvbmZpZ09wdGlvbnMuanMuaW5kZW50X3NpemUpLnRvQmUoMTApXG5cbiAgICAgICAgICAgIGJlYXV0aWZ5RWRpdG9yIChiZWZvcmVUZXh0LCBhZnRlclRleHQpIC0+XG4gICAgICAgICAgICAgICMgY29uc29sZS5sb2coYmVmb3JlVGV4dCwgYWZ0ZXJUZXh0LCBlZGl0b3IpXG4gICAgICAgICAgICAgIGV4cGVjdChhZnRlclRleHQpLnRvQmUoXCJcIlwidmFyIGhlbGxvID0gJ3dvcmxkJztcblxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdoZWxsbyAnICsgaGVsbG8pXG4gICAgICAgICAgICAgIH1cIlwiXCIpXG5cblxuZGVzY3JpYmUgXCJMYW5ndWFnZXNcIiwgLT5cblxuICBsYW5ndWFnZXMgPSBudWxsXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGxhbmd1YWdlcyA9IG5ldyBMYW5ndWFnZXMoKVxuXG4gIGRlc2NyaWJlIFwiTGFuZ3VhZ2VzOjpuYW1lc3BhY2VcIiwgLT5cblxuICAgIGl0IFwic2hvdWxkIHZlcmlmeSB0aGF0IG11bHRpcGxlIGxhbmd1YWdlcyBkbyBub3Qgc2hhcmUgdGhlIHNhbWUgbmFtZXNwYWNlXCIsIC0+XG5cbiAgICAgIG5hbWVzcGFjZUdyb3VwcyA9IF8uZ3JvdXBCeShsYW5ndWFnZXMubGFuZ3VhZ2VzLCBcIm5hbWVzcGFjZVwiKVxuICAgICAgbmFtZXNwYWNlUGFpcnMgPSBfLnRvUGFpcnMobmFtZXNwYWNlR3JvdXBzKVxuICAgICAgbmFtZXNwYWNlT3ZlcmxhcCA9IF8uZmlsdGVyKG5hbWVzcGFjZVBhaXJzLCAoW25hbWVzcGFjZSwgZ3JvdXBdKSAtPiBncm91cC5sZW5ndGggPiAxKVxuICAgICAgIyBjb25zb2xlLmxvZygnbmFtZXNwYWNlcycsIG5hbWVzcGFjZUdyb3VwcywgbmFtZXNwYWNlUGFpcnMsIG5hbWVzcGFjZU92ZXJsYXApXG4gICAgICBleHBlY3QobmFtZXNwYWNlT3ZlcmxhcC5sZW5ndGgpLnRvQmUoMCwgXFxcbiAgICAgICAgXCJMYW5ndWFnZSBuYW1lc3BhY2VzIGFyZSBvdmVybGFwcGluZy5cXG5cXFxuICAgICAgICBOYW1lc3BhY2VzIGFyZSB1bmlxdWU6IG9ubHkgb25lIGxhbmd1YWdlIGZvciBlYWNoIG5hbWVzcGFjZS5cXG5cIitcbiAgICAgICAgXy5tYXAobmFtZXNwYWNlT3ZlcmxhcCwgKFtuYW1lc3BhY2UsIGdyb3VwXSkgLT4gXCItICcje25hbWVzcGFjZX0nOiBDaGVjayBsYW5ndWFnZXMgI3tfLm1hcChncm91cCwgJ25hbWUnKS5qb2luKCcsICcpfSBmb3IgdXNpbmcgbmFtZXNwYWNlICcje25hbWVzcGFjZX0nLlwiKS5qb2luKCdcXG4nKVxuICAgICAgICApXG4iXX0=
