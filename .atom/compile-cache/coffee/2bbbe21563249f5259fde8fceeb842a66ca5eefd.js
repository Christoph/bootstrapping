(function() {
  var Beautifier, PHPCSFixer, isWindows, path;

  PHPCSFixer = require("../src/beautifiers/php-cs-fixer");

  Beautifier = require("../src/beautifiers/beautifier");

  path = require('path');

  isWindows = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';

  describe("PHP-CS-Fixer Beautifier", function() {
    beforeEach(function() {
      return waitsForPromise(function() {
        var activationPromise, pack;
        activationPromise = atom.packages.activatePackage('atom-beautify');
        pack = atom.packages.getLoadedPackage("atom-beautify");
        pack.activateNow();
        return activationPromise;
      });
    });
    return describe("Beautifier::beautify", function() {
      var OSSpecificSpecs, beautifier;
      beautifier = null;
      beforeEach(function() {
        return beautifier = new PHPCSFixer();
      });
      OSSpecificSpecs = function() {
        var failWhichProgram, text;
        text = "<?php echo \"test\"; ?>";
        it("should error when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, language, options, p;
            language = "PHP";
            options = {
              fixers: "",
              levels: ""
            };
            beautifier.spawn = function(exe, args, options) {
              var er;
              er = new Error('ENOENT');
              er.code = 'ENOENT';
              return beautifier.Promise.reject(er);
            };
            p = beautifier.beautify(text, language, options);
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true, "Expected '" + v + "' to be instance of Error");
              expect(v.code).toBe("CommandNotFound", "Expected to be CommandNotFound");
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        failWhichProgram = function(failingProgram) {
          return it("should error when '" + failingProgram + "' not found", function() {
            expect(beautifier).not.toBe(null);
            expect(beautifier instanceof Beautifier).toBe(true);
            if (!beautifier.isWindows && failingProgram === "php") {
              return;
            }
            return waitsForPromise({
              shouldReject: true
            }, function() {
              var cb, language, oldSpawn, options, p;
              language = "PHP";
              options = {
                fixers: "",
                levels: ""
              };
              cb = function(v) {
                expect(v).not.toBe(null);
                expect(v instanceof Error).toBe(true, "Expected '" + v + "' to be instance of Error");
                expect(v.code).toBe("CommandNotFound", "Expected to be CommandNotFound");
                expect(v.file).toBe(failingProgram);
                return v;
              };
              beautifier.which = function(exe, options) {
                if (exe == null) {
                  return beautifier.Promise.resolve(null);
                }
                if (exe === failingProgram) {
                  return beautifier.Promise.resolve(failingProgram);
                } else {
                  return beautifier.Promise.resolve("/" + exe);
                }
              };
              oldSpawn = beautifier.spawn.bind(beautifier);
              beautifier.spawn = function(exe, args, options) {
                var er;
                if (exe === failingProgram) {
                  er = new Error('ENOENT');
                  er.code = 'ENOENT';
                  return beautifier.Promise.reject(er);
                } else {
                  return beautifier.Promise.resolve({
                    returnCode: 0,
                    stdout: 'stdout',
                    stderr: ''
                  });
                }
              };
              p = beautifier.beautify(text, language, options);
              expect(p).not.toBe(null);
              expect(p instanceof beautifier.Promise).toBe(true);
              p.then(cb, cb);
              return p;
            });
          });
        };
        return failWhichProgram('php-cs-fixer');
      };
      if (!isWindows) {
        describe("Mac/Linux", function() {
          beforeEach(function() {
            return beautifier.isWindows = false;
          });
          return OSSpecificSpecs();
        });
      }
      return describe("Windows", function() {
        beforeEach(function() {
          return beautifier.isWindows = true;
        });
        return OSSpecificSpecs();
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcGVjL2JlYXV0aWZpZXItcGhwLWNzLWZpeGVyLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxVQUFBLEdBQWEsT0FBQSxDQUFRLGlDQUFSOztFQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsK0JBQVI7O0VBQ2IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQVFQLFNBQUEsR0FBWSxPQUFPLENBQUMsUUFBUixLQUFvQixPQUFwQixJQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBWixLQUFzQixRQURaLElBRVYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFaLEtBQXNCOztFQUV4QixRQUFBLENBQVMseUJBQVQsRUFBb0MsU0FBQTtJQUVsQyxVQUFBLENBQVcsU0FBQTthQUdULGVBQUEsQ0FBZ0IsU0FBQTtBQUNkLFlBQUE7UUFBQSxpQkFBQSxHQUFvQixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsZUFBOUI7UUFFcEIsSUFBQSxHQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsZUFBL0I7UUFDUCxJQUFJLENBQUMsV0FBTCxDQUFBO0FBSUEsZUFBTztNQVJPLENBQWhCO0lBSFMsQ0FBWDtXQWFBLFFBQUEsQ0FBUyxzQkFBVCxFQUFpQyxTQUFBO0FBRS9CLFVBQUE7TUFBQSxVQUFBLEdBQWE7TUFFYixVQUFBLENBQVcsU0FBQTtlQUNULFVBQUEsR0FBaUIsSUFBQSxVQUFBLENBQUE7TUFEUixDQUFYO01BSUEsZUFBQSxHQUFrQixTQUFBO0FBQ2hCLFlBQUE7UUFBQSxJQUFBLEdBQU87UUFFUCxFQUFBLENBQUcsa0RBQUgsRUFBdUQsU0FBQTtVQUNyRCxNQUFBLENBQU8sVUFBUCxDQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUF2QixDQUE0QixJQUE1QjtVQUNB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VUFBVSxDQUFDLFNBQVgsR0FBdUI7VUFGZCxDQUFYO2lCQUlHLGVBQUgsQ0FBQTtRQU5vQixDQUF0QixFQURGOzthQVNBLFFBQUEsQ0FBUyxTQUFULEVBQW9CLFNBQUE7UUFFbEIsVUFBQSxDQUFXLFNBQUE7aUJBRVQsVUFBVSxDQUFDLFNBQVgsR0FBdUI7UUFGZCxDQUFYO2VBSUcsZUFBSCxDQUFBO01BTmtCLENBQXBCO0lBNUcrQixDQUFqQztFQWZrQyxDQUFwQztBQWRBIiwic291cmNlc0NvbnRlbnQiOlsiUEhQQ1NGaXhlciA9IHJlcXVpcmUgXCIuLi9zcmMvYmVhdXRpZmllcnMvcGhwLWNzLWZpeGVyXCJcbkJlYXV0aWZpZXIgPSByZXF1aXJlIFwiLi4vc3JjL2JlYXV0aWZpZXJzL2JlYXV0aWZpZXJcIlxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbiMgVXNlIHRoZSBjb21tYW5kIGB3aW5kb3c6cnVuLXBhY2thZ2Utc3BlY3NgIChjbWQtYWx0LWN0cmwtcCkgdG8gcnVuIHNwZWNzLlxuI1xuIyBUbyBydW4gYSBzcGVjaWZpYyBgaXRgIG9yIGBkZXNjcmliZWAgYmxvY2sgYWRkIGFuIGBmYCB0byB0aGUgZnJvbnQgKGUuZy4gYGZpdGBcbiMgb3IgYGZkZXNjcmliZWApLiBSZW1vdmUgdGhlIGBmYCB0byB1bmZvY3VzIHRoZSBibG9jay5cblxuIyBDaGVjayBpZiBXaW5kb3dzXG5pc1dpbmRvd3MgPSBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMicgb3JcbiAgcHJvY2Vzcy5lbnYuT1NUWVBFIGlzICdjeWd3aW4nIG9yXG4gIHByb2Nlc3MuZW52Lk9TVFlQRSBpcyAnbXN5cydcblxuZGVzY3JpYmUgXCJQSFAtQ1MtRml4ZXIgQmVhdXRpZmllclwiLCAtPlxuXG4gIGJlZm9yZUVhY2ggLT5cblxuICAgICMgQWN0aXZhdGUgcGFja2FnZVxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYWN0aXZhdGlvblByb21pc2UgPSBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnYXRvbS1iZWF1dGlmeScpXG4gICAgICAjIEZvcmNlIGFjdGl2YXRlIHBhY2thZ2VcbiAgICAgIHBhY2sgPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoXCJhdG9tLWJlYXV0aWZ5XCIpXG4gICAgICBwYWNrLmFjdGl2YXRlTm93KClcbiAgICAgICMgQ2hhbmdlIGxvZ2dlciBsZXZlbFxuICAgICAgIyBhdG9tLmNvbmZpZy5zZXQoJ2F0b20tYmVhdXRpZnkuX2xvZ2dlckxldmVsJywgJ3ZlcmJvc2UnKVxuICAgICAgIyBSZXR1cm4gcHJvbWlzZVxuICAgICAgcmV0dXJuIGFjdGl2YXRpb25Qcm9taXNlXG5cbiAgZGVzY3JpYmUgXCJCZWF1dGlmaWVyOjpiZWF1dGlmeVwiLCAtPlxuXG4gICAgYmVhdXRpZmllciA9IG51bGxcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGJlYXV0aWZpZXIgPSBuZXcgUEhQQ1NGaXhlcigpXG4gICAgICAjIGNvbnNvbGUubG9nKCduZXcgYmVhdXRpZmllcicpXG5cbiAgICBPU1NwZWNpZmljU3BlY3MgPSAtPlxuICAgICAgdGV4dCA9IFwiPD9waHAgZWNobyBcXFwidGVzdFxcXCI7ID8+XCJcblxuICAgICAgaXQgXCJzaG91bGQgZXJyb3Igd2hlbiBiZWF1dGlmaWVyJ3MgcHJvZ3JhbSBub3QgZm91bmRcIiwgLT5cbiAgICAgICAgZXhwZWN0KGJlYXV0aWZpZXIpLm5vdC50b0JlKG51bGwpXG4gICAgICAgIGV4cGVjdChiZWF1dGlmaWVyIGluc3RhbmNlb2YgQmVhdXRpZmllcikudG9CZSh0cnVlKVxuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSBzaG91bGRSZWplY3Q6IHRydWUsIC0+XG4gICAgICAgICAgbGFuZ3VhZ2UgPSBcIlBIUFwiXG4gICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGZpeGVyczogXCJcIlxuICAgICAgICAgICAgbGV2ZWxzOiBcIlwiXG4gICAgICAgICAgfVxuICAgICAgICAgICMgTW9jayBzcGF3blxuICAgICAgICAgIGJlYXV0aWZpZXIuc3Bhd24gPSAoZXhlLCBhcmdzLCBvcHRpb25zKSAtPlxuICAgICAgICAgICAgIyBjb25zb2xlLmxvZygnc3Bhd24nLCBleGUsIGFyZ3MsIG9wdGlvbnMpXG4gICAgICAgICAgICBlciA9IG5ldyBFcnJvcignRU5PRU5UJylcbiAgICAgICAgICAgIGVyLmNvZGUgPSAnRU5PRU5UJ1xuICAgICAgICAgICAgcmV0dXJuIGJlYXV0aWZpZXIuUHJvbWlzZS5yZWplY3QoZXIpXG4gICAgICAgICAgIyBCZWF1dGlmeVxuICAgICAgICAgIHAgPSBiZWF1dGlmaWVyLmJlYXV0aWZ5KHRleHQsIGxhbmd1YWdlLCBvcHRpb25zKVxuICAgICAgICAgIGV4cGVjdChwKS5ub3QudG9CZShudWxsKVxuICAgICAgICAgIGV4cGVjdChwIGluc3RhbmNlb2YgYmVhdXRpZmllci5Qcm9taXNlKS50b0JlKHRydWUpXG4gICAgICAgICAgY2IgPSAodikgLT5cbiAgICAgICAgICAgICMgY29uc29sZS5sb2codilcbiAgICAgICAgICAgIGV4cGVjdCh2KS5ub3QudG9CZShudWxsKVxuICAgICAgICAgICAgZXhwZWN0KHYgaW5zdGFuY2VvZiBFcnJvcikudG9CZSh0cnVlLCBcXFxuICAgICAgICAgICAgICBcIkV4cGVjdGVkICcje3Z9JyB0byBiZSBpbnN0YW5jZSBvZiBFcnJvclwiKVxuICAgICAgICAgICAgZXhwZWN0KHYuY29kZSkudG9CZShcIkNvbW1hbmROb3RGb3VuZFwiLCBcXFxuICAgICAgICAgICAgICBcIkV4cGVjdGVkIHRvIGJlIENvbW1hbmROb3RGb3VuZFwiKVxuICAgICAgICAgICAgcmV0dXJuIHZcbiAgICAgICAgICBwLnRoZW4oY2IsIGNiKVxuICAgICAgICAgIHJldHVybiBwXG5cbiAgICAgIGZhaWxXaGljaFByb2dyYW0gPSAoZmFpbGluZ1Byb2dyYW0pIC0+XG4gICAgICAgIGl0IFwic2hvdWxkIGVycm9yIHdoZW4gJyN7ZmFpbGluZ1Byb2dyYW19JyBub3QgZm91bmRcIiwgLT5cbiAgICAgICAgICBleHBlY3QoYmVhdXRpZmllcikubm90LnRvQmUobnVsbClcbiAgICAgICAgICBleHBlY3QoYmVhdXRpZmllciBpbnN0YW5jZW9mIEJlYXV0aWZpZXIpLnRvQmUodHJ1ZSlcblxuICAgICAgICAgIGlmIG5vdCBiZWF1dGlmaWVyLmlzV2luZG93cyBhbmQgZmFpbGluZ1Byb2dyYW0gaXMgXCJwaHBcIlxuICAgICAgICAgICAgIyBPbmx5IGFwcGxpY2FibGUgb24gV2luZG93c1xuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICB3YWl0c0ZvclByb21pc2Ugc2hvdWxkUmVqZWN0OiB0cnVlLCAtPlxuICAgICAgICAgICAgbGFuZ3VhZ2UgPSBcIlBIUFwiXG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICBmaXhlcnM6IFwiXCJcbiAgICAgICAgICAgICAgbGV2ZWxzOiBcIlwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYiA9ICh2KSAtPlxuICAgICAgICAgICAgICAjIGNvbnNvbGUubG9nKCdjYiB2YWx1ZScsIHYpXG4gICAgICAgICAgICAgIGV4cGVjdCh2KS5ub3QudG9CZShudWxsKVxuICAgICAgICAgICAgICBleHBlY3QodiBpbnN0YW5jZW9mIEVycm9yKS50b0JlKHRydWUsIFxcXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCAnI3t2fScgdG8gYmUgaW5zdGFuY2Ugb2YgRXJyb3JcIilcbiAgICAgICAgICAgICAgZXhwZWN0KHYuY29kZSkudG9CZShcIkNvbW1hbmROb3RGb3VuZFwiLCBcXFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgdG8gYmUgQ29tbWFuZE5vdEZvdW5kXCIpXG4gICAgICAgICAgICAgIGV4cGVjdCh2LmZpbGUpLnRvQmUoZmFpbGluZ1Byb2dyYW0pXG4gICAgICAgICAgICAgIHJldHVybiB2XG4gICAgICAgICAgICAjIHdoaWNoID0gYmVhdXRpZmllci53aGljaC5iaW5kKGJlYXV0aWZpZXIpXG4gICAgICAgICAgICBiZWF1dGlmaWVyLndoaWNoID0gKGV4ZSwgb3B0aW9ucykgLT5cbiAgICAgICAgICAgICAgcmV0dXJuIGJlYXV0aWZpZXIuUHJvbWlzZS5yZXNvbHZlKG51bGwpIFxcXG4gICAgICAgICAgICAgICAgaWYgbm90IGV4ZT9cbiAgICAgICAgICAgICAgaWYgZXhlIGlzIGZhaWxpbmdQcm9ncmFtXG4gICAgICAgICAgICAgICAgYmVhdXRpZmllci5Qcm9taXNlLnJlc29sdmUoZmFpbGluZ1Byb2dyYW0pXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAjIHdoaWNoKGV4ZSwgb3B0aW9ucylcbiAgICAgICAgICAgICAgICAjIGNvbnNvbGUubG9nKCdmYWtlIGV4ZSBwYXRoJywgZXhlKVxuICAgICAgICAgICAgICAgIGJlYXV0aWZpZXIuUHJvbWlzZS5yZXNvbHZlKFwiLyN7ZXhlfVwiKVxuXG4gICAgICAgICAgICBvbGRTcGF3biA9IGJlYXV0aWZpZXIuc3Bhd24uYmluZChiZWF1dGlmaWVyKVxuICAgICAgICAgICAgYmVhdXRpZmllci5zcGF3biA9IChleGUsIGFyZ3MsIG9wdGlvbnMpIC0+XG4gICAgICAgICAgICAgICMgY29uc29sZS5sb2coJ3NwYXduJywgZXhlLCBhcmdzLCBvcHRpb25zKVxuICAgICAgICAgICAgICBpZiBleGUgaXMgZmFpbGluZ1Byb2dyYW1cbiAgICAgICAgICAgICAgICBlciA9IG5ldyBFcnJvcignRU5PRU5UJylcbiAgICAgICAgICAgICAgICBlci5jb2RlID0gJ0VOT0VOVCdcbiAgICAgICAgICAgICAgICByZXR1cm4gYmVhdXRpZmllci5Qcm9taXNlLnJlamVjdChlcilcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBiZWF1dGlmaWVyLlByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICByZXR1cm5Db2RlOiAwLFxuICAgICAgICAgICAgICAgICAgc3Rkb3V0OiAnc3Rkb3V0JyxcbiAgICAgICAgICAgICAgICAgIHN0ZGVycjogJydcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBwID0gYmVhdXRpZmllci5iZWF1dGlmeSh0ZXh0LCBsYW5ndWFnZSwgb3B0aW9ucylcbiAgICAgICAgICAgIGV4cGVjdChwKS5ub3QudG9CZShudWxsKVxuICAgICAgICAgICAgZXhwZWN0KHAgaW5zdGFuY2VvZiBiZWF1dGlmaWVyLlByb21pc2UpLnRvQmUodHJ1ZSlcbiAgICAgICAgICAgIHAudGhlbihjYiwgY2IpXG4gICAgICAgICAgICByZXR1cm4gcFxuXG4gICAgICAjIGZhaWxXaGljaFByb2dyYW0oJ3BocCcpXG4gICAgICBmYWlsV2hpY2hQcm9ncmFtKCdwaHAtY3MtZml4ZXInKVxuXG4gICAgdW5sZXNzIGlzV2luZG93c1xuICAgICAgZGVzY3JpYmUgXCJNYWMvTGludXhcIiwgLT5cblxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgIyBjb25zb2xlLmxvZygnbWFjL2xpbngnKVxuICAgICAgICAgIGJlYXV0aWZpZXIuaXNXaW5kb3dzID0gZmFsc2VcblxuICAgICAgICBkbyBPU1NwZWNpZmljU3BlY3NcblxuICAgIGRlc2NyaWJlIFwiV2luZG93c1wiLCAtPlxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICMgY29uc29sZS5sb2coJ3dpbmRvd3MnKVxuICAgICAgICBiZWF1dGlmaWVyLmlzV2luZG93cyA9IHRydWVcblxuICAgICAgZG8gT1NTcGVjaWZpY1NwZWNzXG4iXX0=
