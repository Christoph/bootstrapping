(function() {
  var Executable, HybridExecutable, Promise, _, fs, os, parentConfigKey, path, semver, shellEnv, spawn, which,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Promise = require('bluebird');

  _ = require('lodash');

  which = require('which');

  spawn = require('child_process').spawn;

  path = require('path');

  semver = require('semver');

  shellEnv = require('shell-env');

  os = require('os');

  fs = require('fs');

  parentConfigKey = "atom-beautify.executables";

  Executable = (function() {
    var isInstalled, version;

    Executable.prototype.name = null;

    Executable.prototype.cmd = null;

    Executable.prototype.key = null;

    Executable.prototype.homepage = null;

    Executable.prototype.installation = null;

    Executable.prototype.versionArgs = ['--version'];

    Executable.prototype.versionParse = function(text) {
      return semver.clean(text);
    };

    Executable.prototype.versionRunOptions = {};

    Executable.prototype.versionsSupported = '>= 0.0.0';

    Executable.prototype.required = true;

    function Executable(options) {
      var versionOptions;
      if (options.cmd == null) {
        throw new Error("The command (i.e. cmd property) is required for an Executable.");
      }
      this.name = options.name;
      this.cmd = options.cmd;
      this.key = this.cmd;
      this.homepage = options.homepage;
      this.installation = options.installation;
      this.required = !options.optional;
      if (options.version != null) {
        versionOptions = options.version;
        if (versionOptions.args) {
          this.versionArgs = versionOptions.args;
        }
        if (versionOptions.parse) {
          this.versionParse = versionOptions.parse;
        }
        if (versionOptions.runOptions) {
          this.versionRunOptions = versionOptions.runOptions;
        }
        if (versionOptions.supported) {
          this.versionsSupported = versionOptions.supported;
        }
      }
      this.setupLogger();
    }

    Executable.prototype.init = function() {
      return Promise.all([this.loadVersion()]).then((function(_this) {
        return function() {
          return _this.verbose("Done init of " + _this.name);
        };
      })(this)).then((function(_this) {
        return function() {
          return _this;
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          if (!_this.required) {
            return _this;
          } else {
            return Promise.reject(error);
          }
        };
      })(this));
    };


    /*
    Logger instance
     */

    Executable.prototype.logger = null;


    /*
    Initialize and configure Logger
     */

    Executable.prototype.setupLogger = function() {
      var key, method, ref;
      this.logger = require('../logger')(this.name + " Executable");
      ref = this.logger;
      for (key in ref) {
        method = ref[key];
        this[key] = method;
      }
      return this.verbose(this.name + " executable logger has been initialized.");
    };

    isInstalled = null;

    version = null;

    Executable.prototype.loadVersion = function(force) {
      if (force == null) {
        force = false;
      }
      this.verbose("loadVersion", this.version, force);
      if (force || (this.version == null)) {
        this.verbose("Loading version without cache");
        return this.runVersion().then((function(_this) {
          return function(text) {
            return _this.saveVersion(text);
          };
        })(this));
      } else {
        this.verbose("Loading cached version");
        return Promise.resolve(this.version);
      }
    };

    Executable.prototype.runVersion = function() {
      return this.run(this.versionArgs, this.versionRunOptions).then((function(_this) {
        return function(version) {
          _this.info("Version text: " + version);
          return version;
        };
      })(this));
    };

    Executable.prototype.saveVersion = function(text) {
      return Promise.resolve().then((function(_this) {
        return function() {
          return _this.versionParse(text);
        };
      })(this)).then(function(version) {
        var valid;
        valid = Boolean(semver.valid(version));
        if (!valid) {
          throw new Error("Version is not valid: " + version);
        }
        return version;
      }).then((function(_this) {
        return function(version) {
          _this.isInstalled = true;
          return _this.version = version;
        };
      })(this)).then((function(_this) {
        return function(version) {
          _this.info(_this.cmd + " version: " + version);
          return version;
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          var help;
          _this.isInstalled = false;
          _this.error(error);
          help = {
            program: _this.cmd,
            link: _this.installation || _this.homepage,
            pathOption: "Executable - " + (_this.name || _this.cmd) + " - Path"
          };
          return Promise.reject(_this.commandNotFoundError(_this.name || _this.cmd, help));
        };
      })(this));
    };

    Executable.prototype.isSupported = function() {
      return this.isVersion(this.versionsSupported);
    };

    Executable.prototype.isVersion = function(range) {
      return this.versionSatisfies(this.version, range);
    };

    Executable.prototype.versionSatisfies = function(version, range) {
      return semver.satisfies(version, range);
    };

    Executable.prototype.getConfig = function() {
      return (typeof atom !== "undefined" && atom !== null ? atom.config.get(parentConfigKey + "." + this.key) : void 0) || {};
    };


    /*
    Run command-line interface command
     */

    Executable.prototype.run = function(args, options) {
      var cmd, cwd, exeName, help, ignoreReturnCode, onStdin, returnStderr, returnStdoutOrStderr;
      if (options == null) {
        options = {};
      }
      this.debug("Run: ", this.cmd, args, options);
      cmd = options.cmd, cwd = options.cwd, ignoreReturnCode = options.ignoreReturnCode, help = options.help, onStdin = options.onStdin, returnStderr = options.returnStderr, returnStdoutOrStderr = options.returnStdoutOrStderr;
      exeName = cmd || this.cmd;
      if (cwd == null) {
        cwd = os.tmpDir();
      }
      return Promise.all([this.shellEnv(), this.resolveArgs(args)]).then((function(_this) {
        return function(arg1) {
          var args, env, exePath;
          env = arg1[0], args = arg1[1];
          _this.debug('exeName, args:', exeName, args);
          exePath = _this.path(exeName);
          return Promise.all([exeName, args, env, exePath]);
        };
      })(this)).then((function(_this) {
        return function(arg1) {
          var args, env, exe, exeName, exePath, spawnOptions;
          exeName = arg1[0], args = arg1[1], env = arg1[2], exePath = arg1[3];
          _this.debug('exePath:', exePath);
          _this.debug('env:', env);
          _this.debug('PATH:', env.PATH);
          _this.debug('args', args);
          args = _this.relativizePaths(args);
          _this.debug('relativized args', args);
          exe = exePath != null ? exePath : exeName;
          spawnOptions = {
            cwd: cwd,
            env: env
          };
          _this.debug('spawnOptions', spawnOptions);
          return _this.spawn(exe, args, spawnOptions, onStdin).then(function(arg2) {
            var returnCode, stderr, stdout, windowsProgramNotFoundMsg;
            returnCode = arg2.returnCode, stdout = arg2.stdout, stderr = arg2.stderr;
            _this.verbose('spawn result, returnCode', returnCode);
            _this.verbose('spawn result, stdout', stdout);
            _this.verbose('spawn result, stderr', stderr);
            if (!ignoreReturnCode && returnCode !== 0) {
              windowsProgramNotFoundMsg = "is not recognized as an internal or external command";
              _this.verbose(stderr, windowsProgramNotFoundMsg);
              if (_this.isWindows() && returnCode === 1 && stderr.indexOf(windowsProgramNotFoundMsg) !== -1) {
                throw _this.commandNotFoundError(exeName, help);
              } else {
                throw new Error(stderr || stdout);
              }
            } else {
              if (returnStdoutOrStderr) {
                return stdout || stderr;
              } else if (returnStderr) {
                return stderr;
              } else {
                return stdout;
              }
            }
          })["catch"](function(err) {
            _this.debug('error', err);
            if (err.code === 'ENOENT' || err.errno === 'ENOENT') {
              throw _this.commandNotFoundError(exeName, help);
            } else {
              throw err;
            }
          });
        };
      })(this));
    };

    Executable.prototype.path = function(cmd) {
      var config, exeName;
      if (cmd == null) {
        cmd = this.cmd;
      }
      config = this.getConfig();
      if (config && config.path) {
        return Promise.resolve(config.path);
      } else {
        exeName = cmd;
        return this.which(exeName);
      }
    };

    Executable.prototype.resolveArgs = function(args) {
      args = _.flatten(args);
      return Promise.all(args);
    };

    Executable.prototype.relativizePaths = function(args) {
      var newArgs, tmpDir;
      tmpDir = os.tmpDir();
      newArgs = args.map(function(arg) {
        var isTmpFile;
        isTmpFile = typeof arg === 'string' && !arg.includes(':') && path.isAbsolute(arg) && path.dirname(arg).startsWith(tmpDir);
        if (isTmpFile) {
          return path.relative(tmpDir, arg);
        }
        return arg;
      });
      return newArgs;
    };


    /*
    Spawn
     */

    Executable.prototype.spawn = function(exe, args, options, onStdin) {
      args = _.without(args, void 0);
      args = _.without(args, null);
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var cmd, stderr, stdout;
          _this.debug('spawn', exe, args);
          cmd = spawn(exe, args, options);
          stdout = "";
          stderr = "";
          cmd.stdout.on('data', function(data) {
            return stdout += data;
          });
          cmd.stderr.on('data', function(data) {
            return stderr += data;
          });
          cmd.on('close', function(returnCode) {
            _this.debug('spawn done', returnCode, stderr, stdout);
            return resolve({
              returnCode: returnCode,
              stdout: stdout,
              stderr: stderr
            });
          });
          cmd.on('error', function(err) {
            _this.debug('error', err);
            return reject(err);
          });
          if (onStdin) {
            return onStdin(cmd.stdin);
          }
        };
      })(this));
    };


    /*
    Add help to error.description
    
    Note: error.description is not officially used in JavaScript,
    however it is used internally for Atom Beautify when displaying errors.
     */

    Executable.prototype.commandNotFoundError = function(exe, help) {
      if (exe == null) {
        exe = this.name || this.cmd;
      }
      return this.constructor.commandNotFoundError(exe, help);
    };

    Executable.commandNotFoundError = function(exe, help) {
      var docsLink, er, helpStr, issueSearchLink, message;
      message = "Could not find '" + exe + "'. The program may not be installed.";
      er = new Error(message);
      er.code = 'CommandNotFound';
      er.errno = er.code;
      er.syscall = 'beautifier::run';
      er.file = exe;
      if (help != null) {
        if (typeof help === "object") {
          helpStr = "See " + help.link + " for program installation instructions.\n";
          if (help.pathOption) {
            helpStr += "You can configure Atom Beautify with the absolute path to '" + (help.program || exe) + "' by setting '" + help.pathOption + "' in the Atom Beautify package settings.\n";
          }
          if (help.additional) {
            helpStr += help.additional;
          }
          issueSearchLink = "https://github.com/Glavin001/atom-beautify/search?q=" + exe + "&type=Issues";
          docsLink = "https://github.com/Glavin001/atom-beautify/tree/master/docs";
          helpStr += "Your program is properly installed if running '" + (this.isWindows() ? 'where.exe' : 'which') + " " + exe + "' in your " + (this.isWindows() ? 'CMD prompt' : 'Terminal') + " returns an absolute path to the executable. If this does not work then you have not installed the program correctly and so Atom Beautify will not find the program. Atom Beautify requires that the program be found in your PATH environment variable. \nNote that this is not an Atom Beautify issue if beautification does not work and the above command also does not work: this is expected behaviour, since you have not properly installed your program. Please properly setup the program and search through existing Atom Beautify issues before creating a new issue. See " + issueSearchLink + " for related Issues and " + docsLink + " for documentation. If you are still unable to resolve this issue on your own then please create a new issue and ask for help.\n";
          er.description = helpStr;
        } else {
          er.description = help;
        }
      }
      return er;
    };

    Executable._envCache = null;

    Executable.prototype.shellEnv = function() {
      return this.constructor.shellEnv();
    };

    Executable.shellEnv = function() {
      if (this._envCache) {
        return Promise.resolve(this._envCache);
      } else {
        return shellEnv().then((function(_this) {
          return function(env) {
            return _this._envCache = env;
          };
        })(this));
      }
    };


    /*
    Like the unix which utility.
    
    Finds the first instance of a specified executable in the PATH environment variable.
    Does not cache the results,
    so hash -r is not needed when the PATH changes.
    See https://github.com/isaacs/node-which
     */

    Executable.prototype.which = function(exe, options) {
      return this.constructor.which(exe, options);
    };

    Executable._whichCache = {};

    Executable.which = function(exe, options) {
      if (options == null) {
        options = {};
      }
      if (this._whichCache[exe]) {
        return Promise.resolve(this._whichCache[exe]);
      }
      return this.shellEnv().then((function(_this) {
        return function(env) {
          return new Promise(function(resolve, reject) {
            var i, ref;
            if (options.path == null) {
              options.path = env.PATH;
            }
            if (_this.isWindows()) {
              if (!options.path) {
                for (i in env) {
                  if (i.toLowerCase() === "path") {
                    options.path = env[i];
                    break;
                  }
                }
              }
              if (options.pathExt == null) {
                options.pathExt = ((ref = process.env.PATHEXT) != null ? ref : '.EXE') + ";";
              }
            }
            return which(exe, options, function(err, path) {
              if (err) {
                return resolve(exe);
              }
              _this._whichCache[exe] = path;
              return resolve(path);
            });
          });
        };
      })(this));
    };


    /*
    If platform is Windows
     */

    Executable.prototype.isWindows = function() {
      return this.constructor.isWindows();
    };

    Executable.isWindows = function() {
      return new RegExp('^win').test(process.platform);
    };

    return Executable;

  })();

  HybridExecutable = (function(superClass) {
    extend(HybridExecutable, superClass);

    HybridExecutable.prototype.dockerOptions = {
      image: void 0,
      workingDir: "/workdir"
    };

    function HybridExecutable(options) {
      HybridExecutable.__super__.constructor.call(this, options);
      if (options.docker != null) {
        this.dockerOptions = Object.assign({}, this.dockerOptions, options.docker);
        this.docker = this.constructor.dockerExecutable();
      }
    }

    HybridExecutable.docker = void 0;

    HybridExecutable.dockerExecutable = function() {
      if (this.docker == null) {
        this.docker = new Executable({
          name: "Docker",
          cmd: "docker",
          homepage: "https://www.docker.com/",
          installation: "https://www.docker.com/get-docker",
          version: {
            parse: function(text) {
              return text.match(/version [0]*([1-9]\d*).[0]*([1-9]\d*).[0]*([1-9]\d*)/).slice(1).join('.');
            }
          }
        });
      }
      return this.docker;
    };

    HybridExecutable.prototype.installedWithDocker = false;

    HybridExecutable.prototype.init = function() {
      return HybridExecutable.__super__.init.call(this)["catch"]((function(_this) {
        return function(error) {
          if (_this.docker == null) {
            return Promise.reject(error);
          }
          return _this.docker.init().then(function() {
            return _this.runImage(_this.versionArgs, _this.versionRunOptions);
          }).then(function(text) {
            return _this.saveVersion(text);
          }).then(function() {
            return _this.installedWithDocker = true;
          }).then(function() {
            return _this;
          })["catch"](function(dockerError) {
            _this.debug(dockerError);
            return Promise.reject(error);
          });
        };
      })(this));
    };

    HybridExecutable.prototype.run = function(args, options) {
      if (options == null) {
        options = {};
      }
      if (this.installedWithDocker && this.docker && this.docker.isInstalled) {
        return this.runImage(args, options);
      }
      return HybridExecutable.__super__.run.call(this, args, options);
    };

    HybridExecutable.prototype.runImage = function(args, options) {
      this.debug("Run Docker executable: ", args, options);
      return this.resolveArgs(args).then((function(_this) {
        return function(args) {
          var cwd, image, newArgs, pwd, rootPath, tmpDir, workingDir;
          cwd = options.cwd;
          tmpDir = os.tmpDir();
          pwd = fs.realpathSync(cwd || tmpDir);
          image = _this.dockerOptions.image;
          workingDir = _this.dockerOptions.workingDir;
          rootPath = '/mountedRoot';
          newArgs = args.map(function(arg) {
            if (typeof arg === 'string' && !arg.includes(':') && path.isAbsolute(arg) && !path.dirname(arg).startsWith(tmpDir)) {
              return path.join(rootPath, arg);
            } else {
              return arg;
            }
          });
          return _this.docker.run(["run", "--volume", pwd + ":" + workingDir, "--volume", (path.resolve('/')) + ":" + rootPath, "--workdir", workingDir, image, newArgs], options);
        };
      })(this));
    };

    return HybridExecutable;

  })(Executable);

  module.exports = HybridExecutable;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcmMvYmVhdXRpZmllcnMvZXhlY3V0YWJsZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVHQUFBO0lBQUE7OztFQUFBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7RUFDVixDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBQ0osS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztFQUNSLEtBQUEsR0FBUSxPQUFBLENBQVEsZUFBUixDQUF3QixDQUFDOztFQUNqQyxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNULFFBQUEsR0FBVyxPQUFBLENBQVEsV0FBUjs7RUFDWCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUVMLGVBQUEsR0FBa0I7O0VBR1o7QUFFSixRQUFBOzt5QkFBQSxJQUFBLEdBQU07O3lCQUNOLEdBQUEsR0FBSzs7eUJBQ0wsR0FBQSxHQUFLOzt5QkFDTCxRQUFBLEdBQVU7O3lCQUNWLFlBQUEsR0FBYzs7eUJBQ2QsV0FBQSxHQUFhLENBQUMsV0FBRDs7eUJBQ2IsWUFBQSxHQUFjLFNBQUMsSUFBRDthQUFVLE1BQU0sQ0FBQyxLQUFQLENBQWEsSUFBYjtJQUFWOzt5QkFDZCxpQkFBQSxHQUFtQjs7eUJBQ25CLGlCQUFBLEdBQW1COzt5QkFDbkIsUUFBQSxHQUFVOztJQUVHLG9CQUFDLE9BQUQ7QUFFWCxVQUFBO01BQUEsSUFBSSxtQkFBSjtBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sZ0VBQU4sRUFEWjs7TUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLE9BQU8sQ0FBQztNQUNoQixJQUFDLENBQUEsR0FBRCxHQUFPLE9BQU8sQ0FBQztNQUNmLElBQUMsQ0FBQSxH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LElBQ0UsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FERixJQUMyQixDQUFJLElBQUksQ0FBQyxPQUFMLENBQWEsR0FBYixDQUFpQixDQUFDLFVBQWxCLENBQTZCLE1BQTdCLENBRG5DO3FCQUVPLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFvQixHQUFwQixFQUZQO2FBQUEsTUFBQTtxQkFFcUMsSUFGckM7O1VBRGlCLENBQVQ7aUJBTVYsS0FBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksQ0FDUixLQURRLEVBRVIsVUFGUSxFQUVPLEdBQUQsR0FBSyxHQUFMLEdBQVEsVUFGZCxFQUdSLFVBSFEsRUFHTSxDQUFDLElBQUksQ0FBQyxPQUFMLENBQWEsR0FBYixDQUFELENBQUEsR0FBbUIsR0FBbkIsR0FBc0IsUUFINUIsRUFJUixXQUpRLEVBSUssVUFKTCxFQUtSLEtBTFEsRUFNUixPQU5RLENBQVosRUFRRSxPQVJGO1FBZEk7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRFI7SUFGUTs7OztLQWhEbUI7O0VBOEUvQixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTVjakIiLCJzb3VyY2VzQ29udGVudCI6WyJQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKVxuXyA9IHJlcXVpcmUoJ2xvZGFzaCcpXG53aGljaCA9IHJlcXVpcmUoJ3doaWNoJylcbnNwYXduID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduXG5wYXRoID0gcmVxdWlyZSgncGF0aCcpXG5zZW12ZXIgPSByZXF1aXJlKCdzZW12ZXInKVxuc2hlbGxFbnYgPSByZXF1aXJlKCdzaGVsbC1lbnYnKVxub3MgPSByZXF1aXJlKCdvcycpXG5mcyA9IHJlcXVpcmUoJ2ZzJylcblxucGFyZW50Q29uZmlnS2V5ID0gXCJhdG9tLWJlYXV0aWZ5LmV4ZWN1dGFibGVzXCJcblxuXG5jbGFzcyBFeGVjdXRhYmxlXG5cbiAgbmFtZTogbnVsbFxuICBjbWQ6IG51bGxcbiAga2V5OiBudWxsXG4gIGhvbWVwYWdlOiBudWxsXG4gIGluc3RhbGxhdGlvbjogbnVsbFxuICB2ZXJzaW9uQXJnczogWyctLXZlcnNpb24nXVxuICB2ZXJzaW9uUGFyc2U6ICh0ZXh0KSAtPiBzZW12ZXIuY2xlYW4odGV4dClcbiAgdmVyc2lvblJ1bk9wdGlvbnM6IHt9XG4gIHZlcnNpb25zU3VwcG9ydGVkOiAnPj0gMC4wLjAnXG4gIHJlcXVpcmVkOiB0cnVlXG5cbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgICMgVmFsaWRhdGlvblxuICAgIGlmICFvcHRpb25zLmNtZD9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBjb21tYW5kIChpLmUuIGNtZCBwcm9wZXJ0eSkgaXMgcmVxdWlyZWQgZm9yIGFuIEV4ZWN1dGFibGUuXCIpXG4gICAgQG5hbWUgPSBvcHRpb25zLm5hbWVcbiAgICBAY21kID0gb3B0aW9ucy5jbWRcbiAgICBAa2V5ID0gQGNtZFxuICAgIEBob21lcGFnZSA9IG9wdGlvbnMuaG9tZXBhZ2VcbiAgICBAaW5zdGFsbGF0aW9uID0gb3B0aW9ucy5pbnN0YWxsYXRpb25cbiAgICBAcmVxdWlyZWQgPSBub3Qgb3B0aW9ucy5vcHRpb25hbFxuICAgIGlmIG9wdGlvbnMudmVyc2lvbj9cbiAgICAgIHZlcnNpb25PcHRpb25zID0gb3B0aW9ucy52ZXJzaW9uXG4gICAgICBAdmVyc2lvbkFyZ3MgPSB2ZXJzaW9uT3B0aW9ucy5hcmdzIGlmIHZlcnNpb25PcHRpb25zLmFyZ3NcbiAgICAgIEB2ZXJzaW9uUGFyc2UgPSB2ZXJzaW9uT3B0aW9ucy5wYXJzZSBpZiB2ZXJzaW9uT3B0aW9ucy5wYXJzZVxuICAgICAgQHZlcnNpb25SdW5PcHRpb25zID0gdmVyc2lvbk9wdGlvbnMucnVuT3B0aW9ucyBpZiB2ZXJzaW9uT3B0aW9ucy5ydW5PcHRpb25zXG4gICAgICBAdmVyc2lvbnNTdXBwb3J0ZWQgPSB2ZXJzaW9uT3B0aW9ucy5zdXBwb3J0ZWQgaWYgdmVyc2lvbk9wdGlvbnMuc3VwcG9ydGVkXG4gICAgQHNldHVwTG9nZ2VyKClcblxuICBpbml0OiAoKSAtPlxuICAgIFByb21pc2UuYWxsKFtcbiAgICAgIEBsb2FkVmVyc2lvbigpXG4gICAgXSlcbiAgICAgIC50aGVuKCgpID0+IEB2ZXJib3NlKFwiRG9uZSBpbml0IG9mICN7QG5hbWV9XCIpKVxuICAgICAgLnRoZW4oKCkgPT4gQClcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+XG4gICAgICAgIGlmIG5vdCBALnJlcXVpcmVkXG4gICAgICAgICAgQFxuICAgICAgICBlbHNlXG4gICAgICAgICAgUHJvbWlzZS5yZWplY3QoZXJyb3IpXG4gICAgICApXG5cbiAgIyMjXG4gIExvZ2dlciBpbnN0YW5jZVxuICAjIyNcbiAgbG9nZ2VyOiBudWxsXG4gICMjI1xuICBJbml0aWFsaXplIGFuZCBjb25maWd1cmUgTG9nZ2VyXG4gICMjI1xuICBzZXR1cExvZ2dlcjogLT5cbiAgICBAbG9nZ2VyID0gcmVxdWlyZSgnLi4vbG9nZ2VyJykoXCIje0BuYW1lfSBFeGVjdXRhYmxlXCIpXG4gICAgZm9yIGtleSwgbWV0aG9kIG9mIEBsb2dnZXJcbiAgICAgIEBba2V5XSA9IG1ldGhvZFxuICAgIEB2ZXJib3NlKFwiI3tAbmFtZX0gZXhlY3V0YWJsZSBsb2dnZXIgaGFzIGJlZW4gaW5pdGlhbGl6ZWQuXCIpXG5cbiAgaXNJbnN0YWxsZWQgPSBudWxsXG4gIHZlcnNpb24gPSBudWxsXG4gIGxvYWRWZXJzaW9uOiAoZm9yY2UgPSBmYWxzZSkgLT5cbiAgICBAdmVyYm9zZShcImxvYWRWZXJzaW9uXCIsIEB2ZXJzaW9uLCBmb3JjZSlcbiAgICBpZiBmb3JjZSBvciAhQHZlcnNpb24/XG4gICAgICBAdmVyYm9zZShcIkxvYWRpbmcgdmVyc2lvbiB3aXRob3V0IGNhY2hlXCIpXG4gICAgICBAcnVuVmVyc2lvbigpXG4gICAgICAgIC50aGVuKCh0ZXh0KSA9PiBAc2F2ZVZlcnNpb24odGV4dCkpXG4gICAgZWxzZVxuICAgICAgQHZlcmJvc2UoXCJMb2FkaW5nIGNhY2hlZCB2ZXJzaW9uXCIpXG4gICAgICBQcm9taXNlLnJlc29sdmUoQHZlcnNpb24pXG5cbiAgcnVuVmVyc2lvbjogKCkgLT5cbiAgICBAcnVuKEB2ZXJzaW9uQXJncywgQHZlcnNpb25SdW5PcHRpb25zKVxuICAgICAgLnRoZW4oKHZlcnNpb24pID0+XG4gICAgICAgIEBpbmZvKFwiVmVyc2lvbiB0ZXh0OiBcIiArIHZlcnNpb24pXG4gICAgICAgIHZlcnNpb25cbiAgICAgIClcblxuICBzYXZlVmVyc2lvbjogKHRleHQpIC0+XG4gICAgUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIC50aGVuKCA9PiBAdmVyc2lvblBhcnNlKHRleHQpKVxuICAgICAgLnRoZW4oKHZlcnNpb24pIC0+XG4gICAgICAgIHZhbGlkID0gQm9vbGVhbihzZW12ZXIudmFsaWQodmVyc2lvbikpXG4gICAgICAgIGlmIG5vdCB2YWxpZFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZlcnNpb24gaXMgbm90IHZhbGlkOiBcIit2ZXJzaW9uKVxuICAgICAgICB2ZXJzaW9uXG4gICAgICApXG4gICAgICAudGhlbigodmVyc2lvbikgPT5cbiAgICAgICAgQGlzSW5zdGFsbGVkID0gdHJ1ZVxuICAgICAgICBAdmVyc2lvbiA9IHZlcnNpb25cbiAgICAgIClcbiAgICAgIC50aGVuKCh2ZXJzaW9uKSA9PlxuICAgICAgICBAaW5mbyhcIiN7QGNtZH0gdmVyc2lvbjogI3t2ZXJzaW9ufVwiKVxuICAgICAgICB2ZXJzaW9uXG4gICAgICApXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PlxuICAgICAgICBAaXNJbnN0YWxsZWQgPSBmYWxzZVxuICAgICAgICBAZXJyb3IoZXJyb3IpXG4gICAgICAgIGhlbHAgPSB7XG4gICAgICAgICAgcHJvZ3JhbTogQGNtZFxuICAgICAgICAgIGxpbms6IEBpbnN0YWxsYXRpb24gb3IgQGhvbWVwYWdlXG4gICAgICAgICAgcGF0aE9wdGlvbjogXCJFeGVjdXRhYmxlIC0gI3tAbmFtZSBvciBAY21kfSAtIFBhdGhcIlxuICAgICAgICB9XG4gICAgICAgIFByb21pc2UucmVqZWN0KEBjb21tYW5kTm90Rm91bmRFcnJvcihAbmFtZSBvciBAY21kLCBoZWxwKSlcbiAgICAgIClcblxuICBpc1N1cHBvcnRlZDogKCkgLT5cbiAgICBAaXNWZXJzaW9uKEB2ZXJzaW9uc1N1cHBvcnRlZClcblxuICBpc1ZlcnNpb246IChyYW5nZSkgLT5cbiAgICBAdmVyc2lvblNhdGlzZmllcyhAdmVyc2lvbiwgcmFuZ2UpXG5cbiAgdmVyc2lvblNhdGlzZmllczogKHZlcnNpb24sIHJhbmdlKSAtPlxuICAgIHNlbXZlci5zYXRpc2ZpZXModmVyc2lvbiwgcmFuZ2UpXG5cbiAgZ2V0Q29uZmlnOiAoKSAtPlxuICAgIGF0b20/LmNvbmZpZy5nZXQoXCIje3BhcmVudENvbmZpZ0tleX0uI3tAa2V5fVwiKSBvciB7fVxuXG4gICMjI1xuICBSdW4gY29tbWFuZC1saW5lIGludGVyZmFjZSBjb21tYW5kXG4gICMjI1xuICBydW46IChhcmdzLCBvcHRpb25zID0ge30pIC0+XG4gICAgQGRlYnVnKFwiUnVuOiBcIiwgQGNtZCwgYXJncywgb3B0aW9ucylcbiAgICB7IGNtZCwgY3dkLCBpZ25vcmVSZXR1cm5Db2RlLCBoZWxwLCBvblN0ZGluLCByZXR1cm5TdGRlcnIsIHJldHVyblN0ZG91dE9yU3RkZXJyIH0gPSBvcHRpb25zXG4gICAgZXhlTmFtZSA9IGNtZCBvciBAY21kXG4gICAgY3dkID89IG9zLnRtcERpcigpXG5cbiAgICAjIFJlc29sdmUgZXhlY3V0YWJsZSBhbmQgYWxsIGFyZ3NcbiAgICBQcm9taXNlLmFsbChbQHNoZWxsRW52KCksIHRoaXMucmVzb2x2ZUFyZ3MoYXJncyldKVxuICAgICAgLnRoZW4oKFtlbnYsIGFyZ3NdKSA9PlxuICAgICAgICBAZGVidWcoJ2V4ZU5hbWUsIGFyZ3M6JywgZXhlTmFtZSwgYXJncylcbiAgICAgICAgIyBHZXQgUEFUSCBhbmQgb3RoZXIgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgICAgIGV4ZVBhdGggPSBAcGF0aChleGVOYW1lKVxuICAgICAgICBQcm9taXNlLmFsbChbZXhlTmFtZSwgYXJncywgZW52LCBleGVQYXRoXSlcbiAgICAgIClcbiAgICAgIC50aGVuKChbZXhlTmFtZSwgYXJncywgZW52LCBleGVQYXRoXSkgPT5cbiAgICAgICAgQGRlYnVnKCdleGVQYXRoOicsIGV4ZVBhdGgpXG4gICAgICAgIEBkZWJ1ZygnZW52OicsIGVudilcbiAgICAgICAgQGRlYnVnKCdQQVRIOicsIGVudi5QQVRIKVxuICAgICAgICBAZGVidWcoJ2FyZ3MnLCBhcmdzKVxuICAgICAgICBhcmdzID0gdGhpcy5yZWxhdGl2aXplUGF0aHMoYXJncylcbiAgICAgICAgQGRlYnVnKCdyZWxhdGl2aXplZCBhcmdzJywgYXJncylcblxuICAgICAgICBleGUgPSBleGVQYXRoID8gZXhlTmFtZVxuICAgICAgICBzcGF3bk9wdGlvbnMgPSB7XG4gICAgICAgICAgY3dkOiBjd2RcbiAgICAgICAgICBlbnY6IGVudlxuICAgICAgICB9XG4gICAgICAgIEBkZWJ1Zygnc3Bhd25PcHRpb25zJywgc3Bhd25PcHRpb25zKVxuXG4gICAgICAgIEBzcGF3bihleGUsIGFyZ3MsIHNwYXduT3B0aW9ucywgb25TdGRpbilcbiAgICAgICAgICAudGhlbigoe3JldHVybkNvZGUsIHN0ZG91dCwgc3RkZXJyfSkgPT5cbiAgICAgICAgICAgIEB2ZXJib3NlKCdzcGF3biByZXN1bHQsIHJldHVybkNvZGUnLCByZXR1cm5Db2RlKVxuICAgICAgICAgICAgQHZlcmJvc2UoJ3NwYXduIHJlc3VsdCwgc3Rkb3V0Jywgc3Rkb3V0KVxuICAgICAgICAgICAgQHZlcmJvc2UoJ3NwYXduIHJlc3VsdCwgc3RkZXJyJywgc3RkZXJyKVxuXG4gICAgICAgICAgICAjIElmIHJldHVybiBjb2RlIGlzIG5vdCAwIHRoZW4gZXJyb3Igb2NjdXJlZFxuICAgICAgICAgICAgaWYgbm90IGlnbm9yZVJldHVybkNvZGUgYW5kIHJldHVybkNvZGUgaXNudCAwXG4gICAgICAgICAgICAgICMgb3BlcmFibGUgcHJvZ3JhbSBvciBiYXRjaCBmaWxlXG4gICAgICAgICAgICAgIHdpbmRvd3NQcm9ncmFtTm90Rm91bmRNc2cgPSBcImlzIG5vdCByZWNvZ25pemVkIGFzIGFuIGludGVybmFsIG9yIGV4dGVybmFsIGNvbW1hbmRcIlxuXG4gICAgICAgICAgICAgIEB2ZXJib3NlKHN0ZGVyciwgd2luZG93c1Byb2dyYW1Ob3RGb3VuZE1zZylcblxuICAgICAgICAgICAgICBpZiBAaXNXaW5kb3dzKCkgYW5kIHJldHVybkNvZGUgaXMgMSBhbmQgc3RkZXJyLmluZGV4T2Yod2luZG93c1Byb2dyYW1Ob3RGb3VuZE1zZykgaXNudCAtMVxuICAgICAgICAgICAgICAgIHRocm93IEBjb21tYW5kTm90Rm91bmRFcnJvcihleGVOYW1lLCBoZWxwKVxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHN0ZGVyciBvciBzdGRvdXQpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGlmIHJldHVyblN0ZG91dE9yU3RkZXJyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ZG91dCBvciBzdGRlcnJcbiAgICAgICAgICAgICAgZWxzZSBpZiByZXR1cm5TdGRlcnJcbiAgICAgICAgICAgICAgICBzdGRlcnJcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHN0ZG91dFxuICAgICAgICAgIClcbiAgICAgICAgICAuY2F0Y2goKGVycikgPT5cbiAgICAgICAgICAgIEBkZWJ1ZygnZXJyb3InLCBlcnIpXG5cbiAgICAgICAgICAgICMgQ2hlY2sgaWYgZXJyb3IgaXMgRU5PRU5UIChjb21tYW5kIGNvdWxkIG5vdCBiZSBmb3VuZClcbiAgICAgICAgICAgIGlmIGVyci5jb2RlIGlzICdFTk9FTlQnIG9yIGVyci5lcnJubyBpcyAnRU5PRU5UJ1xuICAgICAgICAgICAgICB0aHJvdyBAY29tbWFuZE5vdEZvdW5kRXJyb3IoZXhlTmFtZSwgaGVscClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIyBjb250aW51ZSBhcyBub3JtYWwgZXJyb3JcbiAgICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgKVxuICAgICAgKVxuXG4gIHBhdGg6IChjbWQgPSBAY21kKSAtPlxuICAgIGNvbmZpZyA9IEBnZXRDb25maWcoKVxuICAgIGlmIGNvbmZpZyBhbmQgY29uZmlnLnBhdGhcbiAgICAgIFByb21pc2UucmVzb2x2ZShjb25maWcucGF0aClcbiAgICBlbHNlXG4gICAgICBleGVOYW1lID0gY21kXG4gICAgICBAd2hpY2goZXhlTmFtZSlcblxuICByZXNvbHZlQXJnczogKGFyZ3MpIC0+XG4gICAgYXJncyA9IF8uZmxhdHRlbihhcmdzKVxuICAgIFByb21pc2UuYWxsKGFyZ3MpXG5cbiAgcmVsYXRpdml6ZVBhdGhzOiAoYXJncykgLT5cbiAgICB0bXBEaXIgPSBvcy50bXBEaXIoKVxuICAgIG5ld0FyZ3MgPSBhcmdzLm1hcCgoYXJnKSAtPlxuICAgICAgaXNUbXBGaWxlID0gKHR5cGVvZiBhcmcgaXMgJ3N0cmluZycgYW5kIG5vdCBhcmcuaW5jbHVkZXMoJzonKSBhbmQgXFxcbiAgICAgICAgcGF0aC5pc0Fic29sdXRlKGFyZykgYW5kIHBhdGguZGlybmFtZShhcmcpLnN0YXJ0c1dpdGgodG1wRGlyKSlcbiAgICAgIGlmIGlzVG1wRmlsZVxuICAgICAgICByZXR1cm4gcGF0aC5yZWxhdGl2ZSh0bXBEaXIsIGFyZylcbiAgICAgIHJldHVybiBhcmdcbiAgICApXG4gICAgbmV3QXJnc1xuXG4gICMjI1xuICBTcGF3blxuICAjIyNcbiAgc3Bhd246IChleGUsIGFyZ3MsIG9wdGlvbnMsIG9uU3RkaW4pIC0+XG4gICAgIyBSZW1vdmUgdW5kZWZpbmVkL251bGwgdmFsdWVzXG4gICAgYXJncyA9IF8ud2l0aG91dChhcmdzLCB1bmRlZmluZWQpXG4gICAgYXJncyA9IF8ud2l0aG91dChhcmdzLCBudWxsKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICBAZGVidWcoJ3NwYXduJywgZXhlLCBhcmdzKVxuXG4gICAgICBjbWQgPSBzcGF3bihleGUsIGFyZ3MsIG9wdGlvbnMpXG4gICAgICBzdGRvdXQgPSBcIlwiXG4gICAgICBzdGRlcnIgPSBcIlwiXG5cbiAgICAgIGNtZC5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YSkgLT5cbiAgICAgICAgc3Rkb3V0ICs9IGRhdGFcbiAgICAgIClcbiAgICAgIGNtZC5zdGRlcnIub24oJ2RhdGEnLCAoZGF0YSkgLT5cbiAgICAgICAgc3RkZXJyICs9IGRhdGFcbiAgICAgIClcbiAgICAgIGNtZC5vbignY2xvc2UnLCAocmV0dXJuQ29kZSkgPT5cbiAgICAgICAgQGRlYnVnKCdzcGF3biBkb25lJywgcmV0dXJuQ29kZSwgc3RkZXJyLCBzdGRvdXQpXG4gICAgICAgIHJlc29sdmUoe3JldHVybkNvZGUsIHN0ZG91dCwgc3RkZXJyfSlcbiAgICAgIClcbiAgICAgIGNtZC5vbignZXJyb3InLCAoZXJyKSA9PlxuICAgICAgICBAZGVidWcoJ2Vycm9yJywgZXJyKVxuICAgICAgICByZWplY3QoZXJyKVxuICAgICAgKVxuXG4gICAgICBvblN0ZGluIGNtZC5zdGRpbiBpZiBvblN0ZGluXG4gICAgKVxuXG5cbiAgIyMjXG4gIEFkZCBoZWxwIHRvIGVycm9yLmRlc2NyaXB0aW9uXG5cbiAgTm90ZTogZXJyb3IuZGVzY3JpcHRpb24gaXMgbm90IG9mZmljaWFsbHkgdXNlZCBpbiBKYXZhU2NyaXB0LFxuICBob3dldmVyIGl0IGlzIHVzZWQgaW50ZXJuYWxseSBmb3IgQXRvbSBCZWF1dGlmeSB3aGVuIGRpc3BsYXlpbmcgZXJyb3JzLlxuICAjIyNcbiAgY29tbWFuZE5vdEZvdW5kRXJyb3I6IChleGUsIGhlbHApIC0+XG4gICAgZXhlID89IEBuYW1lIG9yIEBjbWRcbiAgICBAY29uc3RydWN0b3IuY29tbWFuZE5vdEZvdW5kRXJyb3IoZXhlLCBoZWxwKVxuXG4gIEBjb21tYW5kTm90Rm91bmRFcnJvcjogKGV4ZSwgaGVscCkgLT5cbiAgICAjIENyZWF0ZSBuZXcgaW1wcm92ZWQgZXJyb3JcbiAgICAjIG5vdGlmeSB1c2VyIHRoYXQgaXQgbWF5IG5vdCBiZVxuICAgICMgaW5zdGFsbGVkIG9yIGluIHBhdGhcbiAgICBtZXNzYWdlID0gXCJDb3VsZCBub3QgZmluZCAnI3tleGV9Jy4gXFxcbiAgICAgICAgICAgIFRoZSBwcm9ncmFtIG1heSBub3QgYmUgaW5zdGFsbGVkLlwiXG4gICAgZXIgPSBuZXcgRXJyb3IobWVzc2FnZSlcbiAgICBlci5jb2RlID0gJ0NvbW1hbmROb3RGb3VuZCdcbiAgICBlci5lcnJubyA9IGVyLmNvZGVcbiAgICBlci5zeXNjYWxsID0gJ2JlYXV0aWZpZXI6OnJ1bidcbiAgICBlci5maWxlID0gZXhlXG4gICAgaWYgaGVscD9cbiAgICAgIGlmIHR5cGVvZiBoZWxwIGlzIFwib2JqZWN0XCJcbiAgICAgICAgIyBCYXNpYyBub3RpY2VcbiAgICAgICAgaGVscFN0ciA9IFwiU2VlICN7aGVscC5saW5rfSBmb3IgcHJvZ3JhbSBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbGxhdGlvbiBpbnN0cnVjdGlvbnMuXFxuXCJcbiAgICAgICAgIyBIZWxwIHRvIGNvbmZpZ3VyZSBBdG9tIEJlYXV0aWZ5IGZvciBwcm9ncmFtJ3MgcGF0aFxuICAgICAgICBoZWxwU3RyICs9IFwiWW91IGNhbiBjb25maWd1cmUgQXRvbSBCZWF1dGlmeSBcXFxuICAgICAgICAgICAgICAgICAgICB3aXRoIHRoZSBhYnNvbHV0ZSBwYXRoIFxcXG4gICAgICAgICAgICAgICAgICAgIHRvICcje2hlbHAucHJvZ3JhbSBvciBleGV9JyBieSBzZXR0aW5nIFxcXG4gICAgICAgICAgICAgICAgICAgICcje2hlbHAucGF0aE9wdGlvbn0nIGluIFxcXG4gICAgICAgICAgICAgICAgICAgIHRoZSBBdG9tIEJlYXV0aWZ5IHBhY2thZ2Ugc2V0dGluZ3MuXFxuXCIgaWYgaGVscC5wYXRoT3B0aW9uXG4gICAgICAgICMgT3B0aW9uYWwsIGFkZGl0aW9uYWwgaGVscFxuICAgICAgICBoZWxwU3RyICs9IGhlbHAuYWRkaXRpb25hbCBpZiBoZWxwLmFkZGl0aW9uYWxcbiAgICAgICAgIyBDb21tb24gSGVscFxuICAgICAgICBpc3N1ZVNlYXJjaExpbmsgPVxuICAgICAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL0dsYXZpbjAwMS9hdG9tLWJlYXV0aWZ5L1xcXG4gICAgICAgICAgICAgICAgICBzZWFyY2g/cT0je2V4ZX0mdHlwZT1Jc3N1ZXNcIlxuICAgICAgICBkb2NzTGluayA9IFwiaHR0cHM6Ly9naXRodWIuY29tL0dsYXZpbjAwMS9cXFxuICAgICAgICAgICAgICAgICAgYXRvbS1iZWF1dGlmeS90cmVlL21hc3Rlci9kb2NzXCJcbiAgICAgICAgaGVscFN0ciArPSBcIllvdXIgcHJvZ3JhbSBpcyBwcm9wZXJseSBpbnN0YWxsZWQgaWYgcnVubmluZyBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcje2lmIEBpc1dpbmRvd3MoKSB0aGVuICd3aGVyZS5leGUnIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAnd2hpY2gnfSAje2V4ZX0nIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4geW91ciAje2lmIEBpc1dpbmRvd3MoKSB0aGVuICdDTUQgcHJvbXB0JyBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgJ1Rlcm1pbmFsJ30gXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5zIGFuIGFic29sdXRlIHBhdGggdG8gdGhlIGV4ZWN1dGFibGUuIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgdGhpcyBkb2VzIG5vdCB3b3JrIHRoZW4geW91IGhhdmUgbm90IFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFsbGVkIHRoZSBwcm9ncmFtIGNvcnJlY3RseSBhbmQgc28gXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBdG9tIEJlYXV0aWZ5IHdpbGwgbm90IGZpbmQgdGhlIHByb2dyYW0uIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXRvbSBCZWF1dGlmeSByZXF1aXJlcyB0aGF0IHRoZSBwcm9ncmFtIGJlIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgaW4geW91ciBQQVRIIGVudmlyb25tZW50IHZhcmlhYmxlLiBcXG5cXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vdGUgdGhhdCB0aGlzIGlzIG5vdCBhbiBBdG9tIEJlYXV0aWZ5IGlzc3VlIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgYmVhdXRpZmljYXRpb24gZG9lcyBub3Qgd29yayBhbmQgdGhlIGFib3ZlIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZCBhbHNvIGRvZXMgbm90IHdvcms6IHRoaXMgaXMgZXhwZWN0ZWQgXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZWhhdmlvdXIsIHNpbmNlIHlvdSBoYXZlIG5vdCBwcm9wZXJseSBpbnN0YWxsZWQgXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5b3VyIHByb2dyYW0uIFBsZWFzZSBwcm9wZXJseSBzZXR1cCB0aGUgcHJvZ3JhbSBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCBzZWFyY2ggdGhyb3VnaCBleGlzdGluZyBBdG9tIEJlYXV0aWZ5IGlzc3VlcyBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZSBjcmVhdGluZyBhIG5ldyBpc3N1ZS4gXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZWUgI3tpc3N1ZVNlYXJjaExpbmt9IGZvciByZWxhdGVkIElzc3VlcyBhbmQgXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAje2RvY3NMaW5rfSBmb3IgZG9jdW1lbnRhdGlvbi4gXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiB5b3UgYXJlIHN0aWxsIHVuYWJsZSB0byByZXNvbHZlIHRoaXMgaXNzdWUgb24gXFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5b3VyIG93biB0aGVuIHBsZWFzZSBjcmVhdGUgYSBuZXcgaXNzdWUgYW5kIFxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNrIGZvciBoZWxwLlxcblwiXG4gICAgICAgIGVyLmRlc2NyaXB0aW9uID0gaGVscFN0clxuICAgICAgZWxzZSAjaWYgdHlwZW9mIGhlbHAgaXMgXCJzdHJpbmdcIlxuICAgICAgICBlci5kZXNjcmlwdGlvbiA9IGhlbHBcbiAgICByZXR1cm4gZXJcblxuXG4gIEBfZW52Q2FjaGUgPSBudWxsXG4gIHNoZWxsRW52OiAoKSAtPlxuICAgIEBjb25zdHJ1Y3Rvci5zaGVsbEVudigpXG4gIEBzaGVsbEVudjogKCkgLT5cbiAgICBpZiBAX2VudkNhY2hlXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKEBfZW52Q2FjaGUpXG4gICAgZWxzZVxuICAgICAgc2hlbGxFbnYoKVxuICAgICAgICAudGhlbigoZW52KSA9PlxuICAgICAgICAgIEBfZW52Q2FjaGUgPSBlbnZcbiAgICAgICAgKVxuXG4gICMjI1xuICBMaWtlIHRoZSB1bml4IHdoaWNoIHV0aWxpdHkuXG5cbiAgRmluZHMgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGEgc3BlY2lmaWVkIGV4ZWN1dGFibGUgaW4gdGhlIFBBVEggZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gIERvZXMgbm90IGNhY2hlIHRoZSByZXN1bHRzLFxuICBzbyBoYXNoIC1yIGlzIG5vdCBuZWVkZWQgd2hlbiB0aGUgUEFUSCBjaGFuZ2VzLlxuICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2lzYWFjcy9ub2RlLXdoaWNoXG4gICMjI1xuICB3aGljaDogKGV4ZSwgb3B0aW9ucykgLT5cbiAgICBALmNvbnN0cnVjdG9yLndoaWNoKGV4ZSwgb3B0aW9ucylcbiAgQF93aGljaENhY2hlID0ge31cbiAgQHdoaWNoOiAoZXhlLCBvcHRpb25zID0ge30pIC0+XG4gICAgaWYgQF93aGljaENhY2hlW2V4ZV1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoQF93aGljaENhY2hlW2V4ZV0pXG4gICAgIyBHZXQgUEFUSCBhbmQgb3RoZXIgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgQHNoZWxsRW52KClcbiAgICAgIC50aGVuKChlbnYpID0+XG4gICAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgICAgb3B0aW9ucy5wYXRoID89IGVudi5QQVRIXG4gICAgICAgICAgaWYgQGlzV2luZG93cygpXG4gICAgICAgICAgICAjIEVudmlyb25tZW50IHZhcmlhYmxlcyBhcmUgY2FzZS1pbnNlbnNpdGl2ZSBpbiB3aW5kb3dzXG4gICAgICAgICAgICAjIENoZWNrIGVudiBmb3IgYSBjYXNlLWluc2Vuc2l0aXZlICdwYXRoJyB2YXJpYWJsZVxuICAgICAgICAgICAgaWYgIW9wdGlvbnMucGF0aFxuICAgICAgICAgICAgICBmb3IgaSBvZiBlbnZcbiAgICAgICAgICAgICAgICBpZiBpLnRvTG93ZXJDYXNlKCkgaXMgXCJwYXRoXCJcbiAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGF0aCA9IGVudltpXVxuICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgIyBUcmljayBub2RlLXdoaWNoIGludG8gaW5jbHVkaW5nIGZpbGVzXG4gICAgICAgICAgICAjIHdpdGggbm8gZXh0ZW5zaW9uIGFzIGV4ZWN1dGFibGVzLlxuICAgICAgICAgICAgIyBQdXQgZW1wdHkgZXh0ZW5zaW9uIGxhc3QgdG8gYWxsb3cgZm9yIG90aGVyIHJlYWwgZXh0ZW5zaW9ucyBmaXJzdFxuICAgICAgICAgICAgb3B0aW9ucy5wYXRoRXh0ID89IFwiI3twcm9jZXNzLmVudi5QQVRIRVhUID8gJy5FWEUnfTtcIlxuICAgICAgICAgIHdoaWNoKGV4ZSwgb3B0aW9ucywgKGVyciwgcGF0aCkgPT5cbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGV4ZSkgaWYgZXJyXG4gICAgICAgICAgICBAX3doaWNoQ2FjaGVbZXhlXSA9IHBhdGhcbiAgICAgICAgICAgIHJlc29sdmUocGF0aClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcblxuICAjIyNcbiAgSWYgcGxhdGZvcm0gaXMgV2luZG93c1xuICAjIyNcbiAgaXNXaW5kb3dzOiAoKSAtPiBAY29uc3RydWN0b3IuaXNXaW5kb3dzKClcbiAgQGlzV2luZG93czogKCkgLT4gbmV3IFJlZ0V4cCgnXndpbicpLnRlc3QocHJvY2Vzcy5wbGF0Zm9ybSlcblxuY2xhc3MgSHlicmlkRXhlY3V0YWJsZSBleHRlbmRzIEV4ZWN1dGFibGVcblxuICBkb2NrZXJPcHRpb25zOiB7XG4gICAgaW1hZ2U6IHVuZGVmaW5lZFxuICAgIHdvcmtpbmdEaXI6IFwiL3dvcmtkaXJcIlxuICB9XG5cbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKG9wdGlvbnMpXG4gICAgaWYgb3B0aW9ucy5kb2NrZXI/XG4gICAgICBAZG9ja2VyT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIEBkb2NrZXJPcHRpb25zLCBvcHRpb25zLmRvY2tlcilcbiAgICAgIEBkb2NrZXIgPSBAY29uc3RydWN0b3IuZG9ja2VyRXhlY3V0YWJsZSgpXG5cbiAgQGRvY2tlcjogdW5kZWZpbmVkXG4gIEBkb2NrZXJFeGVjdXRhYmxlOiAoKSAtPlxuICAgIGlmIG5vdCBAZG9ja2VyP1xuICAgICAgQGRvY2tlciA9IG5ldyBFeGVjdXRhYmxlKHtcbiAgICAgICAgbmFtZTogXCJEb2NrZXJcIlxuICAgICAgICBjbWQ6IFwiZG9ja2VyXCJcbiAgICAgICAgaG9tZXBhZ2U6IFwiaHR0cHM6Ly93d3cuZG9ja2VyLmNvbS9cIlxuICAgICAgICBpbnN0YWxsYXRpb246IFwiaHR0cHM6Ly93d3cuZG9ja2VyLmNvbS9nZXQtZG9ja2VyXCJcbiAgICAgICAgdmVyc2lvbjoge1xuICAgICAgICAgIHBhcnNlOiAodGV4dCkgLT4gdGV4dC5tYXRjaCgvdmVyc2lvbiBbMF0qKFsxLTldXFxkKikuWzBdKihbMS05XVxcZCopLlswXSooWzEtOV1cXGQqKS8pLnNsaWNlKDEpLmpvaW4oJy4nKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIHJldHVybiBAZG9ja2VyXG5cbiAgaW5zdGFsbGVkV2l0aERvY2tlcjogZmFsc2VcbiAgaW5pdDogKCkgLT5cbiAgICBzdXBlcigpXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpIGlmIG5vdCBAZG9ja2VyP1xuICAgICAgICBAZG9ja2VyLmluaXQoKVxuICAgICAgICAgIC50aGVuKD0+IEBydW5JbWFnZShAdmVyc2lvbkFyZ3MsIEB2ZXJzaW9uUnVuT3B0aW9ucykpXG4gICAgICAgICAgLnRoZW4oKHRleHQpID0+IEBzYXZlVmVyc2lvbih0ZXh0KSlcbiAgICAgICAgICAudGhlbigoKSA9PiBAaW5zdGFsbGVkV2l0aERvY2tlciA9IHRydWUpXG4gICAgICAgICAgLnRoZW4oPT4gQClcbiAgICAgICAgICAuY2F0Y2goKGRvY2tlckVycm9yKSA9PlxuICAgICAgICAgICAgQGRlYnVnKGRvY2tlckVycm9yKVxuICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QoZXJyb3IpXG4gICAgICAgICAgKVxuICAgICAgKVxuXG4gIHJ1bjogKGFyZ3MsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICBpZiBAaW5zdGFsbGVkV2l0aERvY2tlciBhbmQgQGRvY2tlciBhbmQgQGRvY2tlci5pc0luc3RhbGxlZFxuICAgICAgcmV0dXJuIEBydW5JbWFnZShhcmdzLCBvcHRpb25zKVxuICAgIHN1cGVyKGFyZ3MsIG9wdGlvbnMpXG5cbiAgcnVuSW1hZ2U6IChhcmdzLCBvcHRpb25zKSAtPlxuICAgIEBkZWJ1ZyhcIlJ1biBEb2NrZXIgZXhlY3V0YWJsZTogXCIsIGFyZ3MsIG9wdGlvbnMpXG4gICAgdGhpcy5yZXNvbHZlQXJncyhhcmdzKVxuICAgICAgLnRoZW4oKGFyZ3MpID0+XG4gICAgICAgIHsgY3dkIH0gPSBvcHRpb25zXG4gICAgICAgIHRtcERpciA9IG9zLnRtcERpcigpXG4gICAgICAgIHB3ZCA9IGZzLnJlYWxwYXRoU3luYyhjd2Qgb3IgdG1wRGlyKVxuICAgICAgICBpbWFnZSA9IEBkb2NrZXJPcHRpb25zLmltYWdlXG4gICAgICAgIHdvcmtpbmdEaXIgPSBAZG9ja2VyT3B0aW9ucy53b3JraW5nRGlyXG5cbiAgICAgICAgcm9vdFBhdGggPSAnL21vdW50ZWRSb290J1xuICAgICAgICBuZXdBcmdzID0gYXJncy5tYXAoKGFyZykgLT5cbiAgICAgICAgICBpZiAodHlwZW9mIGFyZyBpcyAnc3RyaW5nJyBhbmQgbm90IGFyZy5pbmNsdWRlcygnOicpIFxcXG4gICAgICAgICAgICBhbmQgcGF0aC5pc0Fic29sdXRlKGFyZykgYW5kIG5vdCBwYXRoLmRpcm5hbWUoYXJnKS5zdGFydHNXaXRoKHRtcERpcikpXG4gICAgICAgICAgICB0aGVuIHBhdGguam9pbihyb290UGF0aCwgYXJnKSBlbHNlIGFyZ1xuICAgICAgICApXG5cbiAgICAgICAgQGRvY2tlci5ydW4oW1xuICAgICAgICAgICAgXCJydW5cIixcbiAgICAgICAgICAgIFwiLS12b2x1bWVcIiwgXCIje3B3ZH06I3t3b3JraW5nRGlyfVwiLFxuICAgICAgICAgICAgXCItLXZvbHVtZVwiLCBcIiN7cGF0aC5yZXNvbHZlKCcvJyl9OiN7cm9vdFBhdGh9XCIsXG4gICAgICAgICAgICBcIi0td29ya2RpclwiLCB3b3JraW5nRGlyLFxuICAgICAgICAgICAgaW1hZ2UsXG4gICAgICAgICAgICBuZXdBcmdzXG4gICAgICAgICAgXSxcbiAgICAgICAgICBvcHRpb25zXG4gICAgICAgIClcbiAgICAgIClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEh5YnJpZEV4ZWN1dGFibGVcbiJdfQ==
