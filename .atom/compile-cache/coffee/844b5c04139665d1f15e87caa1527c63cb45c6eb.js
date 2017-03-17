(function() {
  var _, child, filteredEnvironment, fs, path, pty, systemLanguage;

  pty = require('pty.js');

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  child = require('child_process');

  systemLanguage = (function() {
    var command, language;
    language = "en_US.UTF-8";
    if (process.platform === 'darwin') {
      try {
        command = 'plutil -convert json -o - ~/Library/Preferences/.GlobalPreferences.plist';
        language = (JSON.parse(child.execSync(command).toString()).AppleLocale) + ".UTF-8";
      } catch (error) {}
    }
    return language;
  })();

  filteredEnvironment = (function() {
    var env;
    env = _.omit(process.env, 'ATOM_HOME', 'ELECTRON_RUN_AS_NODE', 'GOOGLE_API_KEY', 'NODE_ENV', 'NODE_PATH', 'userAgent', 'taskPath');
    if (env.LANG == null) {
      env.LANG = systemLanguage;
    }
    env.TERM_PROGRAM = 'platformio-ide-terminal';
    return env;
  })();

  module.exports = function(pwd, shell, args, options) {
    var callback, emitTitle, ptyProcess, title;
    if (options == null) {
      options = {};
    }
    callback = this.async();
    if (/zsh|bash/.test(shell) && args.indexOf('--login') === -1 && process.platform !== 'win32') {
      args.unshift('--login');
    }
    ptyProcess = pty.fork(shell, args, {
      cwd: pwd,
      env: filteredEnvironment,
      name: 'xterm-256color'
    });
    title = shell = path.basename(shell);
    emitTitle = _.throttle(function() {
      return emit('platformio-ide-terminal:title', ptyProcess.process);
    }, 500, true);
    ptyProcess.on('data', function(data) {
      emit('platformio-ide-terminal:data', data);
      return emitTitle();
    });
    ptyProcess.on('exit', function() {
      emit('platformio-ide-terminal:exit');
      return callback();
    });
    return process.on('message', function(arg) {
      var cols, event, ref, rows, text;
      ref = arg != null ? arg : {}, event = ref.event, cols = ref.cols, rows = ref.rows, text = ref.text;
      switch (event) {
        case 'resize':
          return ptyProcess.resize(cols, rows);
        case 'input':
          return ptyProcess.write(text);
      }
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL3Byb2Nlc3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLFFBQVI7O0VBQ04sSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxDQUFBLEdBQUksT0FBQSxDQUFRLFlBQVI7O0VBQ0osS0FBQSxHQUFRLE9BQUEsQ0FBUSxlQUFSOztFQUVSLGNBQUEsR0FBb0IsQ0FBQSxTQUFBO0FBQ2xCLFFBQUE7SUFBQSxRQUFBLEdBQVc7SUFDWCxJQUFHLE9BQU8sQ0FBQyxRQUFSLEtBQW9CLFFBQXZCO0FBQ0U7UUFDRSxPQUFBLEdBQVU7UUFDVixRQUFBLEdBQWEsQ0FBQyxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUssQ0FBQyxRQUFOLENBQWUsT0FBZixDQUF1QixDQUFDLFFBQXhCLENBQUEsQ0FBWCxDQUE4QyxDQUFDLFdBQWhELENBQUEsR0FBNEQsU0FGM0U7T0FBQSxpQkFERjs7QUFJQSxXQUFPO0VBTlcsQ0FBQSxDQUFILENBQUE7O0VBUWpCLG1CQUFBLEdBQXlCLENBQUEsU0FBQTtBQUN2QixRQUFBO0lBQUEsR0FBQSxHQUFNLENBQUMsQ0FBQyxJQUFGLENBQU8sT0FBTyxDQUFDLEdBQWYsRUFBb0IsV0FBcEIsRUFBaUMsc0JBQWpDLEVBQXlELGdCQUF6RCxFQUEyRSxVQUEzRSxFQUF1RixXQUF2RixFQUFvRyxXQUFwRyxFQUFpSCxVQUFqSDs7TUFDTixHQUFHLENBQUMsT0FBUTs7SUFDWixHQUFHLENBQUMsWUFBSixHQUFtQjtBQUNuQixXQUFPO0VBSmdCLENBQUEsQ0FBSCxDQUFBOztFQU10QixNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLEdBQUQsRUFBTSxLQUFOLEVBQWEsSUFBYixFQUFtQixPQUFuQjtBQUNmLFFBQUE7O01BRGtDLFVBQVE7O0lBQzFDLFFBQUEsR0FBVyxJQUFDLENBQUEsS0FBRCxDQUFBO0lBRVgsSUFBRyxVQUFVLENBQUMsSUFBWCxDQUFnQixLQUFoQixDQUFBLElBQTJCLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixDQUFBLEtBQTJCLENBQUMsQ0FBdkQsSUFBNkQsT0FBTyxDQUFDLFFBQVIsS0FBc0IsT0FBdEY7TUFDRSxJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsRUFERjs7SUFHQSxVQUFBLEdBQWEsR0FBRyxDQUFDLElBQUosQ0FBUyxLQUFULEVBQWdCLElBQWhCLEVBQ1g7TUFBQSxHQUFBLEVBQUssR0FBTDtNQUNBLEdBQUEsRUFBSyxtQkFETDtNQUVBLElBQUEsRUFBTSxnQkFGTjtLQURXO0lBS2IsS0FBQSxHQUFRLEtBQUEsR0FBUSxJQUFJLENBQUMsUUFBTCxDQUFjLEtBQWQ7SUFFaEIsU0FBQSxHQUFZLENBQUMsQ0FBQyxRQUFGLENBQVcsU0FBQTthQUNyQixJQUFBLENBQUssK0JBQUwsRUFBc0MsVUFBVSxDQUFDLE9BQWpEO0lBRHFCLENBQVgsRUFFVixHQUZVLEVBRUwsSUFGSztJQUlaLFVBQVUsQ0FBQyxFQUFYLENBQWMsTUFBZCxFQUFzQixTQUFDLElBQUQ7TUFDcEIsSUFBQSxDQUFLLDhCQUFMLEVBQXFDLElBQXJDO2FBQ0EsU0FBQSxDQUFBO0lBRm9CLENBQXRCO0lBSUEsVUFBVSxDQUFDLEVBQVgsQ0FBYyxNQUFkLEVBQXNCLFNBQUE7TUFDcEIsSUFBQSxDQUFLLDhCQUFMO2FBQ0EsUUFBQSxDQUFBO0lBRm9CLENBQXRCO1dBSUEsT0FBTyxDQUFDLEVBQVIsQ0FBVyxTQUFYLEVBQXNCLFNBQUMsR0FBRDtBQUNwQixVQUFBOzBCQURxQixNQUEwQixJQUF6QixtQkFBTyxpQkFBTSxpQkFBTTtBQUN6QyxjQUFPLEtBQVA7QUFBQSxhQUNPLFFBRFA7aUJBQ3FCLFVBQVUsQ0FBQyxNQUFYLENBQWtCLElBQWxCLEVBQXdCLElBQXhCO0FBRHJCLGFBRU8sT0FGUDtpQkFFb0IsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsSUFBakI7QUFGcEI7SUFEb0IsQ0FBdEI7RUF6QmU7QUFwQmpCIiwic291cmNlc0NvbnRlbnQiOlsicHR5ID0gcmVxdWlyZSAncHR5LmpzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG5jaGlsZCA9IHJlcXVpcmUgJ2NoaWxkX3Byb2Nlc3MnXG5cbnN5c3RlbUxhbmd1YWdlID0gZG8gLT5cbiAgbGFuZ3VhZ2UgPSBcImVuX1VTLlVURi04XCJcbiAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuICAgIHRyeVxuICAgICAgY29tbWFuZCA9ICdwbHV0aWwgLWNvbnZlcnQganNvbiAtbyAtIH4vTGlicmFyeS9QcmVmZXJlbmNlcy8uR2xvYmFsUHJlZmVyZW5jZXMucGxpc3QnXG4gICAgICBsYW5ndWFnZSA9IFwiI3tKU09OLnBhcnNlKGNoaWxkLmV4ZWNTeW5jKGNvbW1hbmQpLnRvU3RyaW5nKCkpLkFwcGxlTG9jYWxlfS5VVEYtOFwiXG4gIHJldHVybiBsYW5ndWFnZVxuXG5maWx0ZXJlZEVudmlyb25tZW50ID0gZG8gLT5cbiAgZW52ID0gXy5vbWl0IHByb2Nlc3MuZW52LCAnQVRPTV9IT01FJywgJ0VMRUNUUk9OX1JVTl9BU19OT0RFJywgJ0dPT0dMRV9BUElfS0VZJywgJ05PREVfRU5WJywgJ05PREVfUEFUSCcsICd1c2VyQWdlbnQnLCAndGFza1BhdGgnXG4gIGVudi5MQU5HID89IHN5c3RlbUxhbmd1YWdlXG4gIGVudi5URVJNX1BST0dSQU0gPSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwnXG4gIHJldHVybiBlbnZcblxubW9kdWxlLmV4cG9ydHMgPSAocHdkLCBzaGVsbCwgYXJncywgb3B0aW9ucz17fSkgLT5cbiAgY2FsbGJhY2sgPSBAYXN5bmMoKVxuXG4gIGlmIC96c2h8YmFzaC8udGVzdChzaGVsbCkgYW5kIGFyZ3MuaW5kZXhPZignLS1sb2dpbicpID09IC0xIGFuZCBwcm9jZXNzLnBsYXRmb3JtIGlzbnQgJ3dpbjMyJ1xuICAgIGFyZ3MudW5zaGlmdCAnLS1sb2dpbidcblxuICBwdHlQcm9jZXNzID0gcHR5LmZvcmsgc2hlbGwsIGFyZ3MsXG4gICAgY3dkOiBwd2QsXG4gICAgZW52OiBmaWx0ZXJlZEVudmlyb25tZW50LFxuICAgIG5hbWU6ICd4dGVybS0yNTZjb2xvcidcblxuICB0aXRsZSA9IHNoZWxsID0gcGF0aC5iYXNlbmFtZSBzaGVsbFxuXG4gIGVtaXRUaXRsZSA9IF8udGhyb3R0bGUgLT5cbiAgICBlbWl0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDp0aXRsZScsIHB0eVByb2Nlc3MucHJvY2VzcylcbiAgLCA1MDAsIHRydWVcblxuICBwdHlQcm9jZXNzLm9uICdkYXRhJywgKGRhdGEpIC0+XG4gICAgZW1pdCgncGxhdGZvcm1pby1pZGUtdGVybWluYWw6ZGF0YScsIGRhdGEpXG4gICAgZW1pdFRpdGxlKClcblxuICBwdHlQcm9jZXNzLm9uICdleGl0JywgLT5cbiAgICBlbWl0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDpleGl0JylcbiAgICBjYWxsYmFjaygpXG5cbiAgcHJvY2Vzcy5vbiAnbWVzc2FnZScsICh7ZXZlbnQsIGNvbHMsIHJvd3MsIHRleHR9PXt9KSAtPlxuICAgIHN3aXRjaCBldmVudFxuICAgICAgd2hlbiAncmVzaXplJyB0aGVuIHB0eVByb2Nlc3MucmVzaXplKGNvbHMsIHJvd3MpXG4gICAgICB3aGVuICdpbnB1dCcgdGhlbiBwdHlQcm9jZXNzLndyaXRlKHRleHQpXG4iXX0=
