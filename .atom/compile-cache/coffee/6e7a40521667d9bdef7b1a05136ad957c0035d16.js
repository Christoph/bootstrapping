(function() {
  var exec, getVenvPath, homeDirSubstitution, isValidExecutable, os, parse, path, pathSubstitution, ref, regex, statSync, where,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  os = require('os');

  statSync = require('fs').statSync;

  ref = require('atom-linter'), exec = ref.exec, parse = ref.parse;

  regex = require('./constants.coffee').regex;

  homeDirSubstitution = function(pth) {
    var homedir;
    homedir = os.homedir();
    if (homedir) {
      pth = pth.replace(/^~($|\/|\\)/, homedir + "$1");
    }
    if (!path.isAbsolute(pth)) {
      pth = path.resolve(pth);
    }
    return pth;
  };

  pathSubstitution = function(pth) {
    var project, projectName, ref1, ref2;
    ref1 = atom.project.getPaths(), project = ref1[0];
    if (!project) {
      return pth;
    }
    ref2 = project.split(path.sep), projectName = ref2[ref2.length - 1];
    pth = pth.replace(/\$PROJECT_NAME/i, projectName);
    return pth.replace(/\$PROJECT/i, project);
  };

  isValidExecutable = function(pth) {
    var e;
    try {
      return statSync(pth).isFile();
    } catch (error) {
      e = error;
      return false;
    }
  };

  where = function(pth) {
    var dir, j, len, paths, projectPath, ref1, tmp;
    ref1 = atom.project.getPaths(), projectPath = ref1[0];
    paths = projectPath ? [projectPath] : [];
    paths.push.apply(paths, (process.env.PATH || process.env.Path).split(path.delimiter));
    for (j = 0, len = paths.length; j < len; j++) {
      dir = paths[j];
      tmp = path.join(dir, pth);
      if (isValidExecutable(tmp)) {
        return tmp;
      }
    }
    return null;
  };

  getVenvPath = function(pth) {
    var i;
    i = pth.indexOf('$PROJECT_NAME');
    if (i !== -1) {
      return pth.substr(0, i + '$PROJECT_NAME'.length);
    }
    i = pth.indexOf('$PROJECT');
    if (i !== -1) {
      return pth.substr(0, i + '$PROJECT'.length);
    }
    return '';
  };

  module.exports = {
    getExecutable: function(executable) {
      var j, len, p, pth, pths;
      if (!executable) {
        return [null, null];
      }
      pths = executable.split(',');
      for (j = 0, len = pths.length; j < len; j++) {
        pth = pths[j];
        pth = pth.trim();
        if (pth.split(path.sep).length === 1) {
          p = where(pth);
          if (p) {
            return [p, null];
          } else {
            continue;
          }
        }
        pth = homeDirSubstitution(pth);
        p = pathSubstitution(pth);
        if (isValidExecutable(p)) {
          this.pylamaPath = p;
          if (p !== pth) {
            return [p, pathSubstitution(getVenvPath(pth))];
          }
          return [p, null];
        }
      }
      return [null, null];
    },
    initEnv: function(filePath, projectPath, virtualEnv) {
      var env, pwd, pythonPath;
      if (virtualEnv == null) {
        virtualEnv = null;
      }
      pythonPath = [];
      if (filePath) {
        pythonPath.push(filePath);
      }
      if (projectPath && indexOf.call(pythonPath, projectPath) < 0) {
        pythonPath.push(projectPath);
      }
      env = Object.create(process.env);
      if (env.PWD) {
        pwd = path.normalize(env.PWD);
        if (pwd && indexOf.call(pythonPath, pwd) < 0) {
          pythonPath.push(pwd);
        }
      }
      if (virtualEnv) {
        env.VIRTUAL_ENV = virtualEnv;
      }
      env.PYLAMA = pythonPath.join(path.delimiter);
      return env;
    },
    lintFile: function(lintInfo, textEditor) {
      return exec(lintInfo.command, lintInfo.args, lintInfo.options).then(function(output) {
        if (output['stderr']) {
          atom.notifications.addWarning(output['stderr']);
        }
        if (atom.inDevMode()) {
          console.log(output['stdout']);
        }
        return parse(output['stdout'], regex).map(function(message) {
          var code, col, colEnd, editorLine, line, linter_msg, ref1;
          linter_msg = {};
          if (message.type) {
            linter_msg.severity = (ref1 = message.type) === 'E' || ref1 === 'F' ? 'error' : 'warning';
          } else {
            linter_msg.severity = 'info';
          }
          code = message.filePath || '';
          if (message.type) {
            code = "" + message.type + code;
          }
          linter_msg.excerpt = code ? code + " " + message.text : "" + message.text;
          line = message.range[0][0];
          col = message.range[0][1];
          editorLine = textEditor.lineTextForBufferRow(line);
          if (!editorLine || !editorLine.length) {
            colEnd = 0;
          } else {
            colEnd = editorLine.indexOf(' ', col + 1);
            if (colEnd === -1) {
              colEnd = editorLine.length;
            } else {
              if (colEnd - col < 3) {
                colEnd = 3;
              }
              colEnd = colEnd < editorLine.length ? colEnd : editorLine.length;
            }
          }
          linter_msg.location = {
            file: lintInfo.fileName,
            position: [[line, col], [line, colEnd]]
          };
          return linter_msg;
        });
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvbGludGVyLXB5bGFtYS9saWIvaGVscGVycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHlIQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDSCxXQUFhLE9BQUEsQ0FBUSxJQUFSOztFQUVmLE1BQWtCLE9BQUEsQ0FBUSxhQUFSLENBQWxCLEVBQUUsZUFBRixFQUFROztFQUNOLFFBQVUsT0FBQSxDQUFRLG9CQUFSOztFQUdaLG1CQUFBLEdBQXNCLFNBQUMsR0FBRDtBQUNwQixRQUFBO0lBQUEsT0FBQSxHQUFVLEVBQUUsQ0FBQyxPQUFILENBQUE7SUFDVixJQUFHLE9BQUg7TUFDRSxHQUFBLEdBQU0sR0FBRyxDQUFDLE9BQUosQ0FBWSxhQUFaLEVBQThCLE9BQUQsR0FBUyxJQUF0QyxFQURSOztJQUVBLElBQUcsQ0FBSSxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFQO01BQ0UsR0FBQSxHQUFNLElBQUksQ0FBQyxPQUFMLENBQWEsR0FBYixFQURSOztXQUVBO0VBTm9COztFQVN0QixnQkFBQSxHQUFtQixTQUFDLEdBQUQ7QUFDakIsUUFBQTtJQUFBLE9BQW9CLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBaEIsQ0FBQSxDQUFqQixFQUFDO0lBQ0QsSUFBRyxDQUFJLE9BQVA7QUFDRSxhQUFPLElBRFQ7O0lBRUEsT0FBcUIsT0FBTyxDQUFDLEtBQVIsQ0FBYyxJQUFJLENBQUMsR0FBbkIsQ0FBckIsRUFBTTtJQUNOLEdBQUEsR0FBTSxHQUFHLENBQUMsT0FBSixDQUFZLGlCQUFaLEVBQStCLFdBQS9CO1dBQ04sR0FBRyxDQUFDLE9BQUosQ0FBWSxZQUFaLEVBQTBCLE9BQTFCO0VBTmlCOztFQVNuQixpQkFBQSxHQUFvQixTQUFDLEdB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QyxDQUFuQztNQUgyRCxDQUE3RDtJQURRLENBdENLOztBQXJEakIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbm9zID0gcmVxdWlyZSAnb3MnXG57IHN0YXRTeW5jIH0gPSByZXF1aXJlICdmcydcblxueyBleGVjLCBwYXJzZSB9ID0gcmVxdWlyZSAnYXRvbS1saW50ZXInXG57IHJlZ2V4IH0gPSByZXF1aXJlICcuL2NvbnN0YW50cy5jb2ZmZWUnXG5cblxuaG9tZURpclN1YnN0aXR1dGlvbiA9IChwdGgpIC0+XG4gIGhvbWVkaXIgPSBvcy5ob21lZGlyKClcbiAgaWYgaG9tZWRpclxuICAgIHB0aCA9IHB0aC5yZXBsYWNlIC9efigkfFxcL3xcXFxcKS8sIFwiI3tob21lZGlyfSQxXCJcbiAgaWYgbm90IHBhdGguaXNBYnNvbHV0ZSBwdGhcbiAgICBwdGggPSBwYXRoLnJlc29sdmUgcHRoXG4gIHB0aFxuXG5cbnBhdGhTdWJzdGl0dXRpb24gPSAocHRoKSAtPlxuICBbcHJvamVjdCwgLi4uXSA9IGRvIGF0b20ucHJvamVjdC5nZXRQYXRoc1xuICBpZiBub3QgcHJvamVjdFxuICAgIHJldHVybiBwdGhcbiAgWy4uLiwgcHJvamVjdE5hbWVdID0gcHJvamVjdC5zcGxpdCBwYXRoLnNlcFxuICBwdGggPSBwdGgucmVwbGFjZSAvXFwkUFJPSkVDVF9OQU1FL2ksIHByb2plY3ROYW1lXG4gIHB0aC5yZXBsYWNlIC9cXCRQUk9KRUNUL2ksIHByb2plY3RcblxuXG5pc1ZhbGlkRXhlY3V0YWJsZSA9IChwdGgpIC0+XG4gIHRyeVxuICAgIGRvIHN0YXRTeW5jKHB0aCkuaXNGaWxlXG4gIGNhdGNoIGVcbiAgICBmYWxzZVxuXG5cbndoZXJlID0gKHB0aCkgLT5cbiAgW3Byb2plY3RQYXRoLCAuLi5dID0gZG8gYXRvbS5wcm9qZWN0LmdldFBhdGhzXG4gIHBhdGhzID0gaWYgcHJvamVjdFBhdGggdGhlbiBbcHJvamVjdFBhdGhdIGVsc2UgW11cbiAgcGF0aHMucHVzaC5hcHBseSBwYXRocywgKHByb2Nlc3MuZW52LlBBVEggb3IgcHJvY2Vzcy5lbnYuUGF0aCkuc3BsaXQgcGF0aC5kZWxpbWl0ZXJcbiAgZm9yIGRpciBpbiBwYXRoc1xuICAgIHRtcCA9IHBhdGguam9pbiBkaXIsIHB0aFxuICAgIHJldHVybiB0bXAgaWYgaXNWYWxpZEV4ZWN1dGFibGUgdG1wXG4gIG51bGxcblxuXG5nZXRWZW52UGF0aCA9IChwdGgpIC0+XG4gIGkgPSBwdGguaW5kZXhPZiAnJFBST0pFQ1RfTkFNRSdcbiAgaWYgaSAhPSAtMVxuICAgIHJldHVybiBwdGguc3Vic3RyKDAsIGkgKyAnJFBST0pFQ1RfTkFNRScubGVuZ3RoKVxuICBpID0gcHRoLmluZGV4T2YgJyRQUk9KRUNUJ1xuICBpZiBpICE9IC0xXG4gICAgcmV0dXJuIHB0aC5zdWJzdHIoMCwgaSArICckUFJPSkVDVCcubGVuZ3RoKVxuICAnJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRFeGVjdXRhYmxlOiAoZXhlY3V0YWJsZSkgLT5cbiAgICBpZiBub3QgZXhlY3V0YWJsZVxuICAgICAgcmV0dXJuIFtudWxsLCBudWxsXVxuICAgIHB0aHMgPSBleGVjdXRhYmxlLnNwbGl0ICcsJ1xuICAgIGZvciBwdGggaW4gcHRoc1xuICAgICAgcHRoID0gZG8gcHRoLnRyaW1cbiAgICAgIGlmIHB0aC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09IDFcbiAgICAgICAgcCA9IHdoZXJlIHB0aFxuICAgICAgICBpZiBwIHRoZW4gcmV0dXJuIFtwLCBudWxsXSBlbHNlIGNvbnRpbnVlXG4gICAgICBwdGggPSBob21lRGlyU3Vic3RpdHV0aW9uIHB0aFxuICAgICAgcCA9IHBhdGhTdWJzdGl0dXRpb24gcHRoXG4gICAgICBpZiBpc1ZhbGlkRXhlY3V0YWJsZSBwXG4gICAgICAgIEBweWxhbWFQYXRoID0gcFxuICAgICAgICBpZiBwIGlzbnQgcHRoXG4gICAgICAgICAgcmV0dXJuIFtwLCBwYXRoU3Vic3RpdHV0aW9uIGdldFZlbnZQYXRoIHB0aF1cbiAgICAgICAgcmV0dXJuIFtwLCBudWxsXVxuICAgIHJldHVybiBbbnVsbCwgbnVsbF1cblxuXG4gIGluaXRFbnY6IChmaWxlUGF0aCwgcHJvamVjdFBhdGgsIHZpcnR1YWxFbnYgPSBudWxsKSAtPlxuICAgIHB5dGhvblBhdGggPSBbXVxuXG4gICAgcHl0aG9uUGF0aC5wdXNoIGZpbGVQYXRoIGlmIGZpbGVQYXRoXG4gICAgcHl0aG9uUGF0aC5wdXNoIHByb2plY3RQYXRoIGlmIHByb2plY3RQYXRoIGFuZCBwcm9qZWN0UGF0aCBub3QgaW4gcHl0aG9uUGF0aFxuXG4gICAgZW52ID0gT2JqZWN0LmNyZWF0ZSBwcm9jZXNzLmVudlxuICAgIGlmIGVudi5QV0RcbiAgICAgIHB3ZCA9IHBhdGgubm9ybWFsaXplIGVudi5QV0RcbiAgICAgIHB5dGhvblBhdGgucHVzaCBwd2QgaWYgcHdkIGFuZCBwd2Qgbm90IGluIHB5dGhvblBhdGhcblxuICAgIGlmIHZpcnR1YWxFbnZcbiAgICAgIGVudi5WSVJUVUFMX0VOViA9IHZpcnR1YWxFbnZcblxuICAgIGVudi5QWUxBTUEgPSBweXRob25QYXRoLmpvaW4gcGF0aC5kZWxpbWl0ZXJcbiAgICBlbnZcblxuXG4gIGxpbnRGaWxlOiAobGludEluZm8sIHRleHRFZGl0b3IpIC0+XG4gICAgZXhlYyhsaW50SW5mby5jb21tYW5kLCBsaW50SW5mby5hcmdzLCBsaW50SW5mby5vcHRpb25zKS50aGVuIChvdXRwdXQpIC0+XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBvdXRwdXRbJ3N0ZGVyciddIGlmIG91dHB1dFsnc3RkZXJyJ11cbiAgICAgIGNvbnNvbGUubG9nIG91dHB1dFsnc3Rkb3V0J10gaWYgZG8gYXRvbS5pbkRldk1vZGVcbiAgICAgIHBhcnNlKG91dHB1dFsnc3Rkb3V0J10sIHJlZ2V4KS5tYXAgKG1lc3NhZ2UpIC0+XG4gICAgICAgIGxpbnRlcl9tc2cgPSB7fVxuXG4gICAgICAgIGlmIG1lc3NhZ2UudHlwZVxuICAgICAgICAgIGxpbnRlcl9tc2cuc2V2ZXJpdHkgPSBpZiBtZXNzYWdlLnR5cGUgaW4gWydFJywgJ0YnXSB0aGVuICdlcnJvcicgZWxzZSAnd2FybmluZydcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxpbnRlcl9tc2cuc2V2ZXJpdHkgPSAnaW5mbydcblxuICAgICAgICBjb2RlID0gbWVzc2FnZS5maWxlUGF0aCBvciAnJ1xuICAgICAgICBjb2RlID0gXCIje21lc3NhZ2UudHlwZX0je2NvZGV9XCIgaWYgbWVzc2FnZS50eXBlXG4gICAgICAgIGxpbnRlcl9tc2cuZXhjZXJwdCA9IGlmIGNvZGUgdGhlbiBcIiN7Y29kZX0gI3ttZXNzYWdlLnRleHR9XCIgZWxzZSBcIiN7bWVzc2FnZS50ZXh0fVwiXG5cbiAgICAgICAgbGluZSA9IG1lc3NhZ2UucmFuZ2VbMF1bMF1cbiAgICAgICAgY29sID0gbWVzc2FnZS5yYW5nZVswXVsxXVxuICAgICAgICBlZGl0b3JMaW5lID0gdGV4dEVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhsaW5lKVxuICAgICAgICBpZiBub3QgZWRpdG9yTGluZSBvciBub3QgZWRpdG9yTGluZS5sZW5ndGhcbiAgICAgICAgICBjb2xFbmQgPSAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjb2xFbmQgPSBlZGl0b3JMaW5lLmluZGV4T2YgJyAnLCBjb2wgKyAxXG4gICAgICAgICAgaWYgY29sRW5kID09IC0xXG4gICAgICAgICAgICBjb2xFbmQgPSBlZGl0b3JMaW5lLmxlbmd0aFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbEVuZCA9IDMgaWYgY29sRW5kIC0gY29sIDwgM1xuICAgICAgICAgICAgY29sRW5kID0gaWYgY29sRW5kIDwgZWRpdG9yTGluZS5sZW5ndGggdGhlbiBjb2xFbmQgZWxzZSBlZGl0b3JMaW5lLmxlbmd0aFxuXG4gICAgICAgIGxpbnRlcl9tc2cubG9jYXRpb24gPSB7XG4gICAgICAgICAgZmlsZTogbGludEluZm8uZmlsZU5hbWVcbiAgICAgICAgICBwb3NpdGlvbjogW1xuICAgICAgICAgICAgW2xpbmUsIGNvbF1cbiAgICAgICAgICAgIFtsaW5lLCBjb2xFbmRdXG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICAgIGxpbnRlcl9tc2dcbn1cbiJdfQ==
