(function() {
  var $, CompositeDisposable, Emitter, InputDialog, PlatformIOTerminalView, Pty, Task, Terminal, View, lastActiveElement, lastOpenedView, os, path, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom'), Task = ref.Task, CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, View = ref1.View;

  Pty = require.resolve('./process');

  Terminal = require('term.js');

  InputDialog = null;

  path = require('path');

  os = require('os');

  lastOpenedView = null;

  lastActiveElement = null;

  module.exports = PlatformIOTerminalView = (function(superClass) {
    extend(PlatformIOTerminalView, superClass);

    function PlatformIOTerminalView() {
      this.blurTerminal = bind(this.blurTerminal, this);
      this.focusTerminal = bind(this.focusTerminal, this);
      this.blur = bind(this.blur, this);
      this.focus = bind(this.focus, this);
      this.resizePanel = bind(this.resizePanel, this);
      this.resizeStopped = bind(this.resizeStopped, this);
      this.resizeStarted = bind(this.resizeStarted, this);
      this.onWindowResize = bind(this.onWindowResize, this);
      this.hide = bind(this.hide, this);
      this.open = bind(this.open, this);
      this.recieveItemOrFile = bind(this.recieveItemOrFile, this);
      this.setAnimationSpeed = bind(this.setAnimationSpeed, this);
      return PlatformIOTerminalView.__super__.constructor.apply(this, arguments);
    }

    PlatformIOTerminalView.prototype.animating = false;

    PlatformIOTerminalView.prototype.id = '';

    PlatformIOTerminalView.prototype.maximized = false;

    PlatformIOTerminalView.prototype.opened = false;

    PlatformIOTerminalView.prototype.pwd = '';

    PlatformIOTerminalView.prototype.windowHeight = $(window).height();

    PlatformIOTerminalView.prototype.rowHeight = 20;

    PlatformIOTerminalView.prototype.shell = '';

    PlatformIOTerminalView.prototype.tabView = false;

    PlatformIOTerminalView.content = function() {
      return this.div({
        "class": 'platformio-ide-terminal terminal-view',
        outlet: 'platformIOTerminalView'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'panel-divider',
            outlet: 'panelDivider'
          });
          _this.div({
            "class": 'btn-toolbar',
            outlet: 'toolbar'
          }, function() {
            _this.button({
              outlet: 'closeBtn',
              "class": 'btn inline-block-tight right',
              click: 'destroy'
            }, function() {
              return _this.span({
                "class": 'icon icon-x'
              });
            });
            _this.button({
              outlet: 'hideBtn',
              "class": 'btn inline-block-tight right',
              click: 'hide'
            }, function() {
              return _this.span({
                "class": 'icon icon-chevron-down'
              });
            });
            _this.button({
              outlet: 'maximizeBtn',
              "class": 'btn inline-block-tight right',
              click: 'maximize'
            }, function() {
              return _this.span({
                "class": 'icon icon-screen-full'
              });
            });
            return _this.button({
              outlet: 'inputBtn',
              "class": 'btn inline-block-tight left',
              click: 'inputDialog'
            }, function() {
              return _this.span({
                "class": 'icon icon-keyboard'
              });
            });
          });
          return _this.div({
            "class": 'xterm',
            outlet: 'xterm'
          });
        };
      })(this));
    };

    PlatformIOTerminalView.getFocusedTerminal = function() {
      return Terminal.Terminal.focus;
    };

    PlatformIOTerminalView.prototype.initialize = function(id, pwd, statusIcon, statusBar, shell, args, autoRun) {
      var bottomHeight, override, percent;
      this.id = id;
      this.pwd = pwd;
      this.statusIcon = statusIcon;
      this.statusBar = statusBar;
      this.shell = shell;
      this.args = args != null ? args : [];
      this.autoRun = autoRun != null ? autoRun : [];
      this.subscriptions = new CompositeDisposable;
      this.emitter = new Emitter;
      this.subscriptions.add(atom.tooltips.add(this.closeBtn, {
        title: 'Close'
      }));
      this.subscriptions.add(atom.tooltips.add(this.hideBtn, {
        title: 'Hide'
      }));
      this.subscriptions.add(this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
        title: 'Fullscreen'
      }));
      this.inputBtn.tooltip = atom.tooltips.add(this.inputBtn, {
        title: 'Insert Text'
      });
      this.prevHeight = atom.config.get('platformio-ide-terminal.style.defaultPanelHeight');
      if (this.prevHeight.indexOf('%') > 0) {
        percent = Math.abs(Math.min(parseFloat(this.prevHeight) / 100.0, 1));
        bottomHeight = $('atom-panel.bottom').children(".terminal-view").height() || 0;
        this.prevHeight = percent * ($('.item-views').height() + bottomHeight);
      }
      this.xterm.height(0);
      this.setAnimationSpeed();
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.animationSpeed', this.setAnimationSpeed));
      override = function(event) {
        if (event.originalEvent.dataTransfer.getData('platformio-ide-terminal') === 'true') {
          return;
        }
        event.preventDefault();
        return event.stopPropagation();
      };
      this.xterm.on('mouseup', (function(_this) {
        return function(event) {
          var text;
          if (event.which !== 3) {
            text = window.getSelection().toString();
            if (atom.config.get('platformio-ide-terminal.toggles.selectToCopy') && text) {
              atom.clipboard.write(text);
            }
            if (!text) {
              return _this.focus();
            }
          }
        };
      })(this));
      this.xterm.on('dragenter', override);
      this.xterm.on('dragover', override);
      this.xterm.on('drop', this.recieveItemOrFile);
      this.on('focus', this.focus);
      return this.subscriptions.add({
        dispose: (function(_this) {
          return function() {
            return _this.off('focus', _this.focus);
          };
        })(this)
      });
    };

    PlatformIOTerminalView.prototype.attach = function() {
      if (this.panel != null) {
        return;
      }
      return this.panel = atom.workspace.addBottomPanel({
        item: this,
        visible: false
      });
    };

    PlatformIOTerminalView.prototype.setAnimationSpeed = function() {
      this.animationSpeed = atom.config.get('platformio-ide-terminal.style.animationSpeed');
      if (this.animationSpeed === 0) {
        this.animationSpeed = 100;
      }
      return this.xterm.css('transition', "height " + (0.25 / this.animationSpeed) + "s linear");
    };

    PlatformIOTerminalView.prototype.recieveItemOrFile = function(event) {
      var dataTransfer, file, filePath, i, len, ref2, results;
      event.preventDefault();
      event.stopPropagation();
      dataTransfer = event.originalEvent.dataTransfer;
      if (dataTransfer.getData('atom-event') === 'true') {
        filePath = dataTransfer.getData('text/plain');
        if (filePath) {
          return this.input(filePath + " ");
        }
      } else if (filePath = dataTransfer.getData('initialPath')) {
        return this.input(filePath + " ");
      } else if (dataTransfer.files.length > 0) {
        ref2 = dataTransfer.files;
        results = [];
        for (i = 0, len = ref2.length; i < len; i++) {
          file = ref2[i];
          results.push(this.input(file.path + " "));
        }
        return results;
      }
    };

    PlatformIOTerminalView.prototype.forkPtyProcess = function() {
      return Task.once(Pty, path.resolve(this.pwd), this.shell, this.args, (function(_this) {
        return function() {
          _this.input = function() {};
          return _this.resize = function() {};
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.getId = function() {
      return this.id;
    };

    PlatformIOTerminalView.prototype.displayTerminal = function() {
      var cols, ref2, rows;
      ref2 = this.getDimensions(), cols = ref2.cols, rows = ref2.rows;
      this.ptyProcess = this.forkPtyProcess();
      this.terminal = new Terminal({
        cursorBlink: false,
        scrollback: atom.config.get('platformio-ide-terminal.core.scrollback'),
        cols: cols,
        rows: rows
      });
      this.attachListeners();
      this.attachResizeEvents();
      this.attachWindowEvents();
      return this.terminal.open(this.xterm.get(0));
    };

    PlatformIOTerminalView.prototype.attachListeners = function() {
      this.ptyProcess.on("platformio-ide-terminal:data", (function(_this) {
        return function(data) {
          return _this.terminal.write(data);
        };
      })(this));
      this.ptyProcess.on("platformio-ide-terminal:exit", (function(_this) {
        return function() {
          if (atom.config.get('platformio-ide-terminal.toggles.autoClose')) {
            return _this.destroy();
          }
        };
      })(this));
      this.terminal.end = (function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this);
      this.terminal.on("data", (function(_this) {
        return function(data) {
          return _this.input(data);
        };
      })(this));
      this.ptyProcess.on("platformio-ide-terminal:title", (function(_this) {
        return function(title) {
          return _this.process = title;
        };
      })(this));
      this.terminal.on("title", (function(_this) {
        return function(title) {
          return _this.title = title;
        };
      })(this));
      return this.terminal.once("open", (function(_this) {
        return function() {
          var autoRunCommand, command, i, len, ref2, results;
          _this.applyStyle();
          _this.resizeTerminalToView();
          if (_this.ptyProcess.childProcess == null) {
            return;
          }
          autoRunCommand = atom.config.get('platformio-ide-terminal.core.autoRunCommand');
          if (autoRunCommand) {
            _this.input("" + autoRunCommand + os.EOL);
          }
          ref2 = _this.autoRun;
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            command = ref2[i];
            results.push(_this.input("" + command + os.EOL));
          }
          return results;
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.destroy = function() {
      var ref2, ref3;
      this.subscriptions.dispose();
      this.statusIcon.destroy();
      this.statusBar.removeTerminalView(this);
      this.detachResizeEvents();
      this.detachWindowEvents();
      if (this.panel.isVisible()) {
        this.hide();
        this.onTransitionEnd((function(_this) {
          return function() {
            return _this.panel.destroy();
          };
        })(this));
      } else {
        this.panel.destroy();
      }
      if (this.statusIcon && this.statusIcon.parentNode) {
        this.statusIcon.parentNode.removeChild(this.statusIcon);
      }
      if ((ref2 = this.ptyProcess) != null) {
        ref2.terminate();
      }
      return (ref3 = this.terminal) != null ? ref3.destroy() : void 0;
    };

    PlatformIOTerminalView.prototype.maximize = function() {
      var btn;
      this.subscriptions.remove(this.maximizeBtn.tooltip);
      this.maximizeBtn.tooltip.dispose();
      this.maxHeight = this.prevHeight + $('.item-views').height();
      btn = this.maximizeBtn.children('span');
      this.onTransitionEnd((function(_this) {
        return function() {
          return _this.focus();
        };
      })(this));
      if (this.maximized) {
        this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
          title: 'Fullscreen'
        });
        this.subscriptions.add(this.maximizeBtn.tooltip);
        this.adjustHeight(this.prevHeight);
        btn.removeClass('icon-screen-normal').addClass('icon-screen-full');
        return this.maximized = false;
      } else {
        this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
          title: 'Normal'
        });
        this.subscriptions.add(this.maximizeBtn.tooltip);
        this.adjustHeight(this.maxHeight);
        btn.removeClass('icon-screen-full').addClass('icon-screen-normal');
        return this.maximized = true;
      }
    };

    PlatformIOTerminalView.prototype.open = function() {
      var icon;
      if (lastActiveElement == null) {
        lastActiveElement = $(document.activeElement);
      }
      if (lastOpenedView && lastOpenedView !== this) {
        if (lastOpenedView.maximized) {
          this.subscriptions.remove(this.maximizeBtn.tooltip);
          this.maximizeBtn.tooltip.dispose();
          icon = this.maximizeBtn.children('span');
          this.maxHeight = lastOpenedView.maxHeight;
          this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
            title: 'Normal'
          });
          this.subscriptions.add(this.maximizeBtn.tooltip);
          icon.removeClass('icon-screen-full').addClass('icon-screen-normal');
          this.maximized = true;
        }
        lastOpenedView.hide();
      }
      lastOpenedView = this;
      this.statusBar.setActiveTerminalView(this);
      this.statusIcon.activate();
      this.onTransitionEnd((function(_this) {
        return function() {
          if (!_this.opened) {
            _this.opened = true;
            _this.displayTerminal();
            _this.prevHeight = _this.nearestRow(_this.xterm.height());
            _this.xterm.height(_this.prevHeight);
            return _this.emit("platformio-ide-terminal:terminal-open");
          } else {
            return _this.focus();
          }
        };
      })(this));
      this.panel.show();
      this.xterm.height(0);
      this.animating = true;
      return this.xterm.height(this.maximized ? this.maxHeight : this.prevHeight);
    };

    PlatformIOTerminalView.prototype.hide = function() {
      var ref2;
      if ((ref2 = this.terminal) != null) {
        ref2.blur();
      }
      lastOpenedView = null;
      this.statusIcon.deactivate();
      this.onTransitionEnd((function(_this) {
        return function() {
          _this.panel.hide();
          if (lastOpenedView == null) {
            if (lastActiveElement != null) {
              lastActiveElement.focus();
              return lastActiveElement = null;
            }
          }
        };
      })(this));
      this.xterm.height(this.maximized ? this.maxHeight : this.prevHeight);
      this.animating = true;
      return this.xterm.height(0);
    };

    PlatformIOTerminalView.prototype.toggle = function() {
      if (this.animating) {
        return;
      }
      if (this.panel.isVisible()) {
        return this.hide();
      } else {
        return this.open();
      }
    };

    PlatformIOTerminalView.prototype.input = function(data) {
      if (this.ptyProcess.childProcess == null) {
        return;
      }
      this.terminal.stopScrolling();
      return this.ptyProcess.send({
        event: 'input',
        text: data
      });
    };

    PlatformIOTerminalView.prototype.resize = function(cols, rows) {
      if (this.ptyProcess.childProcess == null) {
        return;
      }
      return this.ptyProcess.send({
        event: 'resize',
        rows: rows,
        cols: cols
      });
    };

    PlatformIOTerminalView.prototype.pty = function() {
      var wait;
      if (!this.opened) {
        wait = new Promise((function(_this) {
          return function(resolve, reject) {
            _this.emitter.on("platformio-ide-terminal:terminal-open", function() {
              return resolve();
            });
            return setTimeout(reject, 1000);
          };
        })(this));
        return wait.then((function(_this) {
          return function() {
            return _this.ptyPromise();
          };
        })(this));
      } else {
        return this.ptyPromise();
      }
    };

    PlatformIOTerminalView.prototype.ptyPromise = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          if (_this.ptyProcess != null) {
            _this.ptyProcess.on("platformio-ide-terminal:pty", function(pty) {
              return resolve(pty);
            });
            _this.ptyProcess.send({
              event: 'pty'
            });
            return setTimeout(reject, 1000);
          } else {
            return reject();
          }
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.applyStyle = function() {
      var config, defaultFont, editorFont, editorFontSize, overrideFont, overrideFontSize, ref2, ref3;
      config = atom.config.get('platformio-ide-terminal');
      this.xterm.addClass(config.style.theme);
      if (config.toggles.cursorBlink) {
        this.xterm.addClass('cursor-blink');
      }
      editorFont = atom.config.get('editor.fontFamily');
      defaultFont = "Menlo, Consolas, 'DejaVu Sans Mono', monospace";
      overrideFont = config.style.fontFamily;
      this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
      this.subscriptions.add(atom.config.onDidChange('editor.fontFamily', (function(_this) {
        return function(event) {
          editorFont = event.newValue;
          return _this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.fontFamily', (function(_this) {
        return function(event) {
          overrideFont = event.newValue;
          return _this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
        };
      })(this)));
      editorFontSize = atom.config.get('editor.fontSize');
      overrideFontSize = config.style.fontSize;
      this.terminal.element.style.fontSize = (overrideFontSize || editorFontSize) + "px";
      this.subscriptions.add(atom.config.onDidChange('editor.fontSize', (function(_this) {
        return function(event) {
          editorFontSize = event.newValue;
          _this.terminal.element.style.fontSize = (overrideFontSize || editorFontSize) + "px";
          return _this.resizeTerminalToView();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.fontSize', (function(_this) {
        return function(event) {
          overrideFontSize = event.newValue;
          _this.terminal.element.style.fontSize = (overrideFontSize || editorFontSize) + "px";
          return _this.resizeTerminalToView();
        };
      })(this)));
      [].splice.apply(this.terminal.colors, [0, 8].concat(ref2 = [config.ansiColors.normal.black.toHexString(), config.ansiColors.normal.red.toHexString(), config.ansiColors.normal.green.toHexString(), config.ansiColors.normal.yellow.toHexString(), config.ansiColors.normal.blue.toHexString(), config.ansiColors.normal.magenta.toHexString(), config.ansiColors.normal.cyan.toHexString(), config.ansiColors.normal.white.toHexString()])), ref2;
      return ([].splice.apply(this.terminal.colors, [8, 8].concat(ref3 = [config.ansiColors.zBright.brightBlack.toHexString(), config.ansiColors.zBright.brightRed.toHexString(), config.ansiColors.zBright.brightGreen.toHexString(), config.ansiColors.zBright.brightYellow.toHexString(), config.ansiColors.zBright.brightBlue.toHexString(), config.ansiColors.zBright.brightMagenta.toHexString(), config.ansiColors.zBright.brightCyan.toHexString(), config.ansiColors.zBright.brightWhite.toHexString()])), ref3);
    };

    PlatformIOTerminalView.prototype.attachWindowEvents = function() {
      return $(window).on('resize', this.onWindowResize);
    };

    PlatformIOTerminalView.prototype.detachWindowEvents = function() {
      return $(window).off('resize', this.onWindowResize);
    };

    PlatformIOTerminalView.prototype.attachResizeEvents = function() {
      return this.panelDivider.on('mousedown', this.resizeStarted);
    };

    PlatformIOTerminalView.prototype.detachResizeEvents = function() {
      return this.panelDivider.off('mousedown');
    };

    PlatformIOTerminalView.prototype.onWindowResize = function() {
      var bottomPanel, clamped, delta, newHeight, overflow;
      if (!this.tabView) {
        this.xterm.css('transition', '');
        newHeight = $(window).height();
        bottomPanel = $('atom-panel-container.bottom').first().get(0);
        overflow = bottomPanel.scrollHeight - bottomPanel.offsetHeight;
        delta = newHeight - this.windowHeight;
        this.windowHeight = newHeight;
        if (this.maximized) {
          clamped = Math.max(this.maxHeight + delta, this.rowHeight);
          if (this.panel.isVisible()) {
            this.adjustHeight(clamped);
          }
          this.maxHeight = clamped;
          this.prevHeight = Math.min(this.prevHeight, this.maxHeight);
        } else if (overflow > 0) {
          clamped = Math.max(this.nearestRow(this.prevHeight + delta), this.rowHeight);
          if (this.panel.isVisible()) {
            this.adjustHeight(clamped);
          }
          this.prevHeight = clamped;
        }
        this.xterm.css('transition', "height " + (0.25 / this.animationSpeed) + "s linear");
      }
      return this.resizeTerminalToView();
    };

    PlatformIOTerminalView.prototype.resizeStarted = function() {
      if (this.maximized) {
        return;
      }
      this.maxHeight = this.prevHeight + $('.item-views').height();
      $(document).on('mousemove', this.resizePanel);
      $(document).on('mouseup', this.resizeStopped);
      return this.xterm.css('transition', '');
    };

    PlatformIOTerminalView.prototype.resizeStopped = function() {
      $(document).off('mousemove', this.resizePanel);
      $(document).off('mouseup', this.resizeStopped);
      return this.xterm.css('transition', "height " + (0.25 / this.animationSpeed) + "s linear");
    };

    PlatformIOTerminalView.prototype.nearestRow = function(value) {
      var rows;
      rows = Math.floor(value / this.rowHeight);
      return rows * this.rowHeight;
    };

    PlatformIOTerminalView.prototype.resizePanel = function(event) {
      var clamped, delta, mouseY;
      if (event.which !== 1) {
        return this.resizeStopped();
      }
      mouseY = $(window).height() - event.pageY;
      delta = mouseY - $('atom-panel-container.bottom').height() - $('atom-panel-container.footer').height();
      if (!(Math.abs(delta) > (this.rowHeight * 5 / 6))) {
        return;
      }
      clamped = Math.max(this.nearestRow(this.prevHeight + delta), this.rowHeight);
      if (clamped > this.maxHeight) {
        return;
      }
      this.xterm.height(clamped);
      $(this.terminal.element).height(clamped);
      this.prevHeight = clamped;
      return this.resizeTerminalToView();
    };

    PlatformIOTerminalView.prototype.adjustHeight = function(height) {
      this.xterm.height(height);
      return $(this.terminal.element).height(height);
    };

    PlatformIOTerminalView.prototype.copy = function() {
      var lines, rawLines, rawText, text, textarea;
      if (this.terminal._selected) {
        textarea = this.terminal.getCopyTextarea();
        text = this.terminal.grabText(this.terminal._selected.x1, this.terminal._selected.x2, this.terminal._selected.y1, this.terminal._selected.y2);
      } else {
        rawText = this.terminal.context.getSelection().toString();
        rawLines = rawText.split(/\r?\n/g);
        lines = rawLines.map(function(line) {
          return line.replace(/\s/g, " ").trimRight();
        });
        text = lines.join("\n");
      }
      return atom.clipboard.write(text);
    };

    PlatformIOTerminalView.prototype.paste = function() {
      return this.input(atom.clipboard.read());
    };

    PlatformIOTerminalView.prototype.insertSelection = function(customText) {
      var cursor, editor, line, ref2, ref3, ref4, ref5, runCommand, selection, selectionText;
      if (!(editor = atom.workspace.getActiveTextEditor())) {
        return;
      }
      runCommand = atom.config.get('platformio-ide-terminal.toggles.runInsertedText');
      selectionText = '';
      if (selection = editor.getSelectedText()) {
        this.terminal.stopScrolling();
        selectionText = selection;
      } else if (cursor = editor.getCursorBufferPosition()) {
        line = editor.lineTextForBufferRow(cursor.row);
        this.terminal.stopScrolling();
        selectionText = line;
        editor.moveDown(1);
      }
      return this.input("" + (customText.replace(/\$L/, "" + (editor.getCursorBufferPosition().row + 1)).replace(/\$F/, path.basename(editor != null ? (ref4 = editor.buffer) != null ? (ref5 = ref4.file) != null ? ref5.path : void 0 : void 0 : void 0)).replace(/\$D/, path.dirname(editor != null ? (ref2 = editor.buffer) != null ? (ref3 = ref2.file) != null ? ref3.path : void 0 : void 0 : void 0)).replace(/\$S/, selectionText).replace(/\$\$/, '$')) + (runCommand ? os.EOL : ''));
    };

    PlatformIOTerminalView.prototype.focus = function() {
      this.resizeTerminalToView();
      this.focusTerminal();
      this.statusBar.setActiveTerminalView(this);
      return PlatformIOTerminalView.__super__.focus.call(this);
    };

    PlatformIOTerminalView.prototype.blur = function() {
      this.blurTerminal();
      return PlatformIOTerminalView.__super__.blur.call(this);
    };

    PlatformIOTerminalView.prototype.focusTerminal = function() {
      if (!this.terminal) {
        return;
      }
      lastActiveElement = $(document.activeElement);
      this.terminal.focus();
      if (this.terminal._textarea) {
        return this.terminal._textarea.focus();
      } else {
        return this.terminal.element.focus();
      }
    };

    PlatformIOTerminalView.prototype.blurTerminal = function() {
      if (!this.terminal) {
        return;
      }
      this.terminal.blur();
      this.terminal.element.blur();
      if (lastActiveElement != null) {
        return lastActiveElement.focus();
      }
    };

    PlatformIOTerminalView.prototype.resizeTerminalToView = function() {
      var cols, ref2, rows;
      if (!(this.panel.isVisible() || this.tabView)) {
        return;
      }
      ref2 = this.getDimensions(), cols = ref2.cols, rows = ref2.rows;
      if (!(cols > 0 && rows > 0)) {
        return;
      }
      if (!this.terminal) {
        return;
      }
      if (this.terminal.rows === rows && this.terminal.cols === cols) {
        return;
      }
      this.resize(cols, rows);
      return this.terminal.resize(cols, rows);
    };

    PlatformIOTerminalView.prototype.getDimensions = function() {
      var cols, fakeCol, fakeRow, rows;
      fakeRow = $("<div><span>&nbsp;</span></div>");
      if (this.terminal) {
        this.find('.terminal').append(fakeRow);
        fakeCol = fakeRow.children().first()[0].getBoundingClientRect();
        cols = Math.floor(this.xterm.width() / (fakeCol.width || 9));
        rows = Math.floor(this.xterm.height() / (fakeCol.height || 20));
        this.rowHeight = fakeCol.height;
        fakeRow.remove();
      } else {
        cols = Math.floor(this.xterm.width() / 9);
        rows = Math.floor(this.xterm.height() / 20);
      }
      return {
        cols: cols,
        rows: rows
      };
    };

    PlatformIOTerminalView.prototype.onTransitionEnd = function(callback) {
      return this.xterm.one('webkitTransitionEnd', (function(_this) {
        return function() {
          callback();
          return _this.animating = false;
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.inputDialog = function() {
      var dialog;
      if (InputDialog == null) {
        InputDialog = require('./input-dialog');
      }
      dialog = new InputDialog(this);
      return dialog.attach();
    };

    PlatformIOTerminalView.prototype.rename = function() {
      return this.statusIcon.rename();
    };

    PlatformIOTerminalView.prototype.toggleTabView = function() {
      if (this.tabView) {
        this.panel = atom.workspace.addBottomPanel({
          item: this,
          visible: false
        });
        this.attachResizeEvents();
        this.closeBtn.show();
        this.hideBtn.show();
        this.maximizeBtn.show();
        return this.tabView = false;
      } else {
        this.panel.destroy();
        this.detachResizeEvents();
        this.closeBtn.hide();
        this.hideBtn.hide();
        this.maximizeBtn.hide();
        this.xterm.css("height", "");
        this.tabView = true;
        if (lastOpenedView === this) {
          return lastOpenedView = null;
        }
      }
    };

    PlatformIOTerminalView.prototype.getTitle = function() {
      return this.statusIcon.getName() || "platformio-ide-terminal";
    };

    PlatformIOTerminalView.prototype.getIconName = function() {
      return "terminal";
    };

    PlatformIOTerminalView.prototype.getShell = function() {
      return path.basename(this.shell);
    };

    PlatformIOTerminalView.prototype.getShellPath = function() {
      return this.shell;
    };

    PlatformIOTerminalView.prototype.emit = function(event, data) {
      return this.emitter.emit(event, data);
    };

    PlatformIOTerminalView.prototype.onDidChangeTitle = function(callback) {
      return this.emitter.on('did-change-title', callback);
    };

    PlatformIOTerminalView.prototype.getPath = function() {
      return this.getTerminalTitle();
    };

    PlatformIOTerminalView.prototype.getTerminalTitle = function() {
      return this.title || this.process;
    };

    PlatformIOTerminalView.prototype.getTerminal = function() {
      return this.terminal;
    };

    PlatformIOTerminalView.prototype.isAnimating = function() {
      return this.animating;
    };

    return PlatformIOTerminalView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL3ZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1SkFBQTtJQUFBOzs7O0VBQUEsTUFBdUMsT0FBQSxDQUFRLE1BQVIsQ0FBdkMsRUFBQyxlQUFELEVBQU8sNkNBQVAsRUFBNEI7O0VBQzVCLE9BQVksT0FBQSxDQUFRLHNCQUFSLENBQVosRUFBQyxVQUFELEVBQUk7O0VBRUosR0FBQSxHQUFNLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFdBQWhCOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7RUFDWCxXQUFBLEdBQWM7O0VBRWQsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFFTCxjQUFBLEdBQWlCOztFQUNqQixpQkFBQSxHQUFvQjs7RUFFcEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0FDSixTQUFBLEdBQVc7O3FDQUNYLEVBQUEsR0FBSTs7cUNBQ0osU0FBQSxHQUFXOztxQ0FDWCxNQUFBLEdBQVE7O3FDQUNSLEdBQUEsR0FBSzs7cUNBQ0wsWUFBQSxHQUFjLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxNQUFWLENBQUE7O3FDQUNkLFNBQUEsR0FBVzs7cUNBQ1gsS0FBQSxHQUFPOztxQ0FDUCxPQUFBLEdBQVM7O0lBRVQsc0JBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVDQUFQO1FBQWdELE1BQUEsRUFBUSx3QkFBeEQ7T0FBTCxFQUF1RixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDckYsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFB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cmUgJ2F0b20nXG57JCwgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuUHR5ID0gcmVxdWlyZS5yZXNvbHZlICcuL3Byb2Nlc3MnXG5UZXJtaW5hbCA9IHJlcXVpcmUgJ3Rlcm0uanMnXG5JbnB1dERpYWxvZyA9IG51bGxcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5vcyA9IHJlcXVpcmUgJ29zJ1xuXG5sYXN0T3BlbmVkVmlldyA9IG51bGxcbmxhc3RBY3RpdmVFbGVtZW50ID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQbGF0Zm9ybUlPVGVybWluYWxWaWV3IGV4dGVuZHMgVmlld1xuICBhbmltYXRpbmc6IGZhbHNlXG4gIGlkOiAnJ1xuICBtYXhpbWl6ZWQ6IGZhbHNlXG4gIG9wZW5lZDogZmFsc2VcbiAgcHdkOiAnJ1xuICB3aW5kb3dIZWlnaHQ6ICQod2luZG93KS5oZWlnaHQoKVxuICByb3dIZWlnaHQ6IDIwXG4gIHNoZWxsOiAnJ1xuICB0YWJWaWV3OiBmYWxzZVxuXG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbCB0ZXJtaW5hbC12aWV3Jywgb3V0bGV0OiAncGxhdGZvcm1JT1Rlcm1pbmFsVmlldycsID0+XG4gICAgICBAZGl2IGNsYXNzOiAncGFuZWwtZGl2aWRlcicsIG91dGxldDogJ3BhbmVsRGl2aWRlcidcbiAgICAgIEBkaXYgY2xhc3M6ICdidG4tdG9vbGJhcicsIG91dGxldDondG9vbGJhcicsID0+XG4gICAgICAgIEBidXR0b24gb3V0bGV0OiAnY2xvc2VCdG4nLCBjbGFzczogJ2J0biBpbmxpbmUtYmxvY2stdGlnaHQgcmlnaHQnLCBjbGljazogJ2Rlc3Ryb3knLCA9PlxuICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaWNvbiBpY29uLXgnXG4gICAgICAgIEBidXR0b24gb3V0bGV0OiAnaGlkZUJ0bicsIGNsYXNzOiAnYnRuIGlubGluZS1ibG9jay10aWdodCByaWdodCcsIGNsaWNrOiAnaGlkZScsID0+XG4gICAgICAgICAgQHNwYW4gY2xhc3M6ICdpY29uIGljb24tY2hldnJvbi1kb3duJ1xuICAgICAgICBAYnV0dG9uIG91dGxldDogJ21heGltaXplQnRuJywgY2xhc3M6ICdidG4gaW5saW5lLWJsb2NrLXRpZ2h0IHJpZ2h0JywgY2xpY2s6ICdtYXhpbWl6ZScsID0+XG4gICAgICAgICAgQHNwYW4gY2xhc3M6ICdpY29uIGljb24tc2NyZWVuLWZ1bGwnXG4gICAgICAgIEBidXR0b24gb3V0bGV0OiAnaW5wdXRCdG4nLCBjbGFzczogJ2J0biBpbmxpbmUtYmxvY2stdGlnaHQgbGVmdCcsIGNsaWNrOiAnaW5wdXREaWFsb2cnLCA9PlxuICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaWNvbiBpY29uLWtleWJvYXJkJ1xuICAgICAgQGRpdiBjbGFzczogJ3h0ZXJtJywgb3V0bGV0OiAneHRlcm0nXG5cbiAgQGdldEZvY3VzZWRUZXJtaW5hbDogLT5cbiAgICByZXR1cm4gVGVybWluYWwuVGVybWluYWwuZm9jdXNcblxuICBpbml0aWFsaXplOiAoQGlkLCBAcHdkLCBAc3RhdHVzSWNvbiwgQHN0YXR1c0JhciwgQHNoZWxsLCBAYXJncz1bXSwgQGF1dG9SdW49W10pIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAY2xvc2VCdG4sXG4gICAgICB0aXRsZTogJ0Nsb3NlJ1xuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAaGlkZUJ0bixcbiAgICAgIHRpdGxlOiAnSGlkZSdcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAbWF4aW1pemVCdG4sXG4gICAgICB0aXRsZTogJ0Z1bGxzY3JlZW4nXG4gICAgQGlucHV0QnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAaW5wdXRCdG4sXG4gICAgICB0aXRsZTogJ0luc2VydCBUZXh0J1xuXG4gICAgQHByZXZIZWlnaHQgPSBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmRlZmF1bHRQYW5lbEhlaWdodCcpXG4gICAgaWYgQHByZXZIZWlnaHQuaW5kZXhPZignJScpID4gMFxuICAgICAgcGVyY2VudCA9IE1hdGguYWJzKE1hdGgubWluKHBhcnNlRmxvYXQoQHByZXZIZWlnaHQpIC8gMTAwLjAsIDEpKVxuICAgICAgYm90dG9tSGVpZ2h0ID0gJCgnYXRvbS1wYW5lbC5ib3R0b20nKS5jaGlsZHJlbihcIi50ZXJtaW5hbC12aWV3XCIpLmhlaWdodCgpIG9yIDBcbiAgICAgIEBwcmV2SGVpZ2h0ID0gcGVyY2VudCAqICgkKCcuaXRlbS12aWV3cycpLmhlaWdodCgpICsgYm90dG9tSGVpZ2h0KVxuICAgIEB4dGVybS5oZWlnaHQgMFxuXG4gICAgQHNldEFuaW1hdGlvblNwZWVkKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmFuaW1hdGlvblNwZWVkJywgQHNldEFuaW1hdGlvblNwZWVkXG5cbiAgICBvdmVycmlkZSA9IChldmVudCkgLT5cbiAgICAgIHJldHVybiBpZiBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbCcpIGlzICd0cnVlJ1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIEB4dGVybS5vbiAnbW91c2V1cCcsIChldmVudCkgPT5cbiAgICAgIGlmIGV2ZW50LndoaWNoICE9IDNcbiAgICAgICAgdGV4dCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKS50b1N0cmluZygpXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRleHQpIGlmIGF0b20uY29uZmlnLmdldCgncGxhdGZvcm1pby1pZGUtdGVybWluYWwudG9nZ2xlcy5zZWxlY3RUb0NvcHknKSBhbmQgdGV4dFxuICAgICAgICB1bmxlc3MgdGV4dFxuICAgICAgICAgIEBmb2N1cygpXG4gICAgQHh0ZXJtLm9uICdkcmFnZW50ZXInLCBvdmVycmlkZVxuICAgIEB4dGVybS5vbiAnZHJhZ292ZXInLCBvdmVycmlkZVxuICAgIEB4dGVybS5vbiAnZHJvcCcsIEByZWNpZXZlSXRlbU9yRmlsZVxuXG4gICAgQG9uICdmb2N1cycsIEBmb2N1c1xuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBkaXNwb3NlOiA9PlxuICAgICAgQG9mZiAnZm9jdXMnLCBAZm9jdXNcblxuICBhdHRhY2g6IC0+XG4gICAgcmV0dXJuIGlmIEBwYW5lbD9cbiAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbChpdGVtOiB0aGlzLCB2aXNpYmxlOiBmYWxzZSlcblxuICBzZXRBbmltYXRpb25TcGVlZDogPT5cbiAgICBAYW5pbWF0aW9uU3BlZWQgPSBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmFuaW1hdGlvblNwZWVkJylcbiAgICBAYW5pbWF0aW9uU3BlZWQgPSAxMDAgaWYgQGFuaW1hdGlvblNwZWVkIGlzIDBcblxuICAgIEB4dGVybS5jc3MgJ3RyYW5zaXRpb24nLCBcImhlaWdodCAjezAuMjUgLyBAYW5pbWF0aW9uU3BlZWR9cyBsaW5lYXJcIlxuXG4gIHJlY2lldmVJdGVtT3JGaWxlOiAoZXZlbnQpID0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAge2RhdGFUcmFuc2Zlcn0gPSBldmVudC5vcmlnaW5hbEV2ZW50XG5cbiAgICBpZiBkYXRhVHJhbnNmZXIuZ2V0RGF0YSgnYXRvbS1ldmVudCcpIGlzICd0cnVlJ1xuICAgICAgZmlsZVBhdGggPSBkYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpXG4gICAgICBAaW5wdXQgXCIje2ZpbGVQYXRofSBcIiBpZiBmaWxlUGF0aFxuICAgIGVsc2UgaWYgZmlsZVBhdGggPSBkYXRhVHJhbnNmZXIuZ2V0RGF0YSgnaW5pdGlhbFBhdGgnKVxuICAgICAgQGlucHV0IFwiI3tmaWxlUGF0aH0gXCJcbiAgICBlbHNlIGlmIGRhdGFUcmFuc2Zlci5maWxlcy5sZW5ndGggPiAwXG4gICAgICBmb3IgZmlsZSBpbiBkYXRhVHJhbnNmZXIuZmlsZXNcbiAgICAgICAgQGlucHV0IFwiI3tmaWxlLnBhdGh9IFwiXG5cbiAgZm9ya1B0eVByb2Nlc3M6IC0+XG4gICAgVGFzay5vbmNlIFB0eSwgcGF0aC5yZXNvbHZlKEBwd2QpLCBAc2hlbGwsIEBhcmdzLCA9PlxuICAgICAgQGlucHV0ID0gLT5cbiAgICAgIEByZXNpemUgPSAtPlxuXG4gIGdldElkOiAtPlxuICAgIHJldHVybiBAaWRcblxuICBkaXNwbGF5VGVybWluYWw6IC0+XG4gICAge2NvbHMsIHJvd3N9ID0gQGdldERpbWVuc2lvbnMoKVxuICAgIEBwdHlQcm9jZXNzID0gQGZvcmtQdHlQcm9jZXNzKClcblxuICAgIEB0ZXJtaW5hbCA9IG5ldyBUZXJtaW5hbCB7XG4gICAgICBjdXJzb3JCbGluayAgICAgOiBmYWxzZVxuICAgICAgc2Nyb2xsYmFjayAgICAgIDogYXRvbS5jb25maWcuZ2V0ICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC5jb3JlLnNjcm9sbGJhY2snXG4gICAgICBjb2xzLCByb3dzXG4gICAgfVxuXG4gICAgQGF0dGFjaExpc3RlbmVycygpXG4gICAgQGF0dGFjaFJlc2l6ZUV2ZW50cygpXG4gICAgQGF0dGFjaFdpbmRvd0V2ZW50cygpXG4gICAgQHRlcm1pbmFsLm9wZW4gQHh0ZXJtLmdldCgwKVxuXG4gIGF0dGFjaExpc3RlbmVyczogLT5cbiAgICBAcHR5UHJvY2Vzcy5vbiBcInBsYXRmb3JtaW8taWRlLXRlcm1pbmFsOmRhdGFcIiwgKGRhdGEpID0+XG4gICAgICBAdGVybWluYWwud3JpdGUgZGF0YVxuXG4gICAgQHB0eVByb2Nlc3Mub24gXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDpleGl0XCIsID0+XG4gICAgICBAZGVzdHJveSgpIGlmIGF0b20uY29uZmlnLmdldCgncGxhdGZvcm1pby1pZGUtdGVybWluYWwudG9nZ2xlcy5hdXRvQ2xvc2UnKVxuXG4gICAgQHRlcm1pbmFsLmVuZCA9ID0+IEBkZXN0cm95KClcblxuICAgIEB0ZXJtaW5hbC5vbiBcImRhdGFcIiwgKGRhdGEpID0+XG4gICAgICBAaW5wdXQgZGF0YVxuXG4gICAgQHB0eVByb2Nlc3Mub24gXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDp0aXRsZVwiLCAodGl0bGUpID0+XG4gICAgICBAcHJvY2VzcyA9IHRpdGxlXG4gICAgQHRlcm1pbmFsLm9uIFwidGl0bGVcIiwgKHRpdGxlKSA9PlxuICAgICAgQHRpdGxlID0gdGl0bGVcblxuICAgIEB0ZXJtaW5hbC5vbmNlIFwib3BlblwiLCA9PlxuICAgICAgQGFwcGx5U3R5bGUoKVxuICAgICAgQHJlc2l6ZVRlcm1pbmFsVG9WaWV3KClcblxuICAgICAgcmV0dXJuIHVubGVzcyBAcHR5UHJvY2Vzcy5jaGlsZFByb2Nlc3M/XG4gICAgICBhdXRvUnVuQ29tbWFuZCA9IGF0b20uY29uZmlnLmdldCgncGxhdGZvcm1pby1pZGUtdGVybWluYWwuY29yZS5hdXRvUnVuQ29tbWFuZCcpXG4gICAgICBAaW5wdXQgXCIje2F1dG9SdW5Db21tYW5kfSN7b3MuRU9MfVwiIGlmIGF1dG9SdW5Db21tYW5kXG4gICAgICBAaW5wdXQgXCIje2NvbW1hbmR9I3tvcy5FT0x9XCIgZm9yIGNvbW1hbmQgaW4gQGF1dG9SdW5cblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBzdGF0dXNJY29uLmRlc3Ryb3koKVxuICAgIEBzdGF0dXNCYXIucmVtb3ZlVGVybWluYWxWaWV3IHRoaXNcbiAgICBAZGV0YWNoUmVzaXplRXZlbnRzKClcbiAgICBAZGV0YWNoV2luZG93RXZlbnRzKClcblxuICAgIGlmIEBwYW5lbC5pc1Zpc2libGUoKVxuICAgICAgQGhpZGUoKVxuICAgICAgQG9uVHJhbnNpdGlvbkVuZCA9PiBAcGFuZWwuZGVzdHJveSgpXG4gICAgZWxzZVxuICAgICAgQHBhbmVsLmRlc3Ryb3koKVxuXG4gICAgaWYgQHN0YXR1c0ljb24gYW5kIEBzdGF0dXNJY29uLnBhcmVudE5vZGVcbiAgICAgIEBzdGF0dXNJY29uLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoQHN0YXR1c0ljb24pXG5cbiAgICBAcHR5UHJvY2Vzcz8udGVybWluYXRlKClcbiAgICBAdGVybWluYWw/LmRlc3Ryb3koKVxuXG4gIG1heGltaXplOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLnJlbW92ZSBAbWF4aW1pemVCdG4udG9vbHRpcFxuICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwLmRpc3Bvc2UoKVxuXG4gICAgQG1heEhlaWdodCA9IEBwcmV2SGVpZ2h0ICsgJCgnLml0ZW0tdmlld3MnKS5oZWlnaHQoKVxuICAgIGJ0biA9IEBtYXhpbWl6ZUJ0bi5jaGlsZHJlbignc3BhbicpXG4gICAgQG9uVHJhbnNpdGlvbkVuZCA9PiBAZm9jdXMoKVxuXG4gICAgaWYgQG1heGltaXplZFxuICAgICAgQG1heGltaXplQnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAbWF4aW1pemVCdG4sXG4gICAgICAgIHRpdGxlOiAnRnVsbHNjcmVlbidcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbWF4aW1pemVCdG4udG9vbHRpcFxuICAgICAgQGFkanVzdEhlaWdodCBAcHJldkhlaWdodFxuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdpY29uLXNjcmVlbi1ub3JtYWwnKS5hZGRDbGFzcygnaWNvbi1zY3JlZW4tZnVsbCcpXG4gICAgICBAbWF4aW1pemVkID0gZmFsc2VcbiAgICBlbHNlXG4gICAgICBAbWF4aW1pemVCdG4udG9vbHRpcCA9IGF0b20udG9vbHRpcHMuYWRkIEBtYXhpbWl6ZUJ0bixcbiAgICAgICAgdGl0bGU6ICdOb3JtYWwnXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICAgIEBhZGp1c3RIZWlnaHQgQG1heEhlaWdodFxuICAgICAgYnRuLnJlbW92ZUNsYXNzKCdpY29uLXNjcmVlbi1mdWxsJykuYWRkQ2xhc3MoJ2ljb24tc2NyZWVuLW5vcm1hbCcpXG4gICAgICBAbWF4aW1pemVkID0gdHJ1ZVxuXG4gIG9wZW46ID0+XG4gICAgbGFzdEFjdGl2ZUVsZW1lbnQgPz0gJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxuXG4gICAgaWYgbGFzdE9wZW5lZFZpZXcgYW5kIGxhc3RPcGVuZWRWaWV3ICE9IHRoaXNcbiAgICAgIGlmIGxhc3RPcGVuZWRWaWV3Lm1heGltaXplZFxuICAgICAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICAgICAgQG1heGltaXplQnRuLnRvb2x0aXAuZGlzcG9zZSgpXG4gICAgICAgIGljb24gPSBAbWF4aW1pemVCdG4uY2hpbGRyZW4oJ3NwYW4nKVxuXG4gICAgICAgIEBtYXhIZWlnaHQgPSBsYXN0T3BlbmVkVmlldy5tYXhIZWlnaHRcbiAgICAgICAgQG1heGltaXplQnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAbWF4aW1pemVCdG4sXG4gICAgICAgICAgdGl0bGU6ICdOb3JtYWwnXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbWF4aW1pemVCdG4udG9vbHRpcFxuICAgICAgICBpY29uLnJlbW92ZUNsYXNzKCdpY29uLXNjcmVlbi1mdWxsJykuYWRkQ2xhc3MoJ2ljb24tc2NyZWVuLW5vcm1hbCcpXG4gICAgICAgIEBtYXhpbWl6ZWQgPSB0cnVlXG4gICAgICBsYXN0T3BlbmVkVmlldy5oaWRlKClcblxuICAgIGxhc3RPcGVuZWRWaWV3ID0gdGhpc1xuICAgIEBzdGF0dXNCYXIuc2V0QWN0aXZlVGVybWluYWxWaWV3IHRoaXNcbiAgICBAc3RhdHVzSWNvbi5hY3RpdmF0ZSgpXG5cbiAgICBAb25UcmFuc2l0aW9uRW5kID0+XG4gICAgICBpZiBub3QgQG9wZW5lZFxuICAgICAgICBAb3BlbmVkID0gdHJ1ZVxuICAgICAgICBAZGlzcGxheVRlcm1pbmFsKClcbiAgICAgICAgQHByZXZIZWlnaHQgPSBAbmVhcmVzdFJvdyhAeHRlcm0uaGVpZ2h0KCkpXG4gICAgICAgIEB4dGVybS5oZWlnaHQoQHByZXZIZWlnaHQpXG4gICAgICAgIEBlbWl0IFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6dGVybWluYWwtb3BlblwiXG4gICAgICBlbHNlXG4gICAgICAgIEBmb2N1cygpXG5cbiAgICBAcGFuZWwuc2hvdygpXG4gICAgQHh0ZXJtLmhlaWdodCAwXG4gICAgQGFuaW1hdGluZyA9IHRydWVcbiAgICBAeHRlcm0uaGVpZ2h0IGlmIEBtYXhpbWl6ZWQgdGhlbiBAbWF4SGVpZ2h0IGVsc2UgQHByZXZIZWlnaHRcblxuICBoaWRlOiA9PlxuICAgIEB0ZXJtaW5hbD8uYmx1cigpXG4gICAgbGFzdE9wZW5lZFZpZXcgPSBudWxsXG4gICAgQHN0YXR1c0ljb24uZGVhY3RpdmF0ZSgpXG5cbiAgICBAb25UcmFuc2l0aW9uRW5kID0+XG4gICAgICBAcGFuZWwuaGlkZSgpXG4gICAgICB1bmxlc3MgbGFzdE9wZW5lZFZpZXc/XG4gICAgICAgIGlmIGxhc3RBY3RpdmVFbGVtZW50P1xuICAgICAgICAgIGxhc3RBY3RpdmVFbGVtZW50LmZvY3VzKClcbiAgICAgICAgICBsYXN0QWN0aXZlRWxlbWVudCA9IG51bGxcblxuICAgIEB4dGVybS5oZWlnaHQgaWYgQG1heGltaXplZCB0aGVuIEBtYXhIZWlnaHQgZWxzZSBAcHJldkhlaWdodFxuICAgIEBhbmltYXRpbmcgPSB0cnVlXG4gICAgQHh0ZXJtLmhlaWdodCAwXG5cbiAgdG9nZ2xlOiAtPlxuICAgIHJldHVybiBpZiBAYW5pbWF0aW5nXG5cbiAgICBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgIEBoaWRlKClcbiAgICBlbHNlXG4gICAgICBAb3BlbigpXG5cbiAgaW5wdXQ6IChkYXRhKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHB0eVByb2Nlc3MuY2hpbGRQcm9jZXNzP1xuXG4gICAgQHRlcm1pbmFsLnN0b3BTY3JvbGxpbmcoKVxuICAgIEBwdHlQcm9jZXNzLnNlbmQgZXZlbnQ6ICdpbnB1dCcsIHRleHQ6IGRhdGFcblxuICByZXNpemU6IChjb2xzLCByb3dzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHB0eVByb2Nlc3MuY2hpbGRQcm9jZXNzP1xuXG4gICAgQHB0eVByb2Nlc3Muc2VuZCB7ZXZlbnQ6ICdyZXNpemUnLCByb3dzLCBjb2xzfVxuXG4gIHB0eTogKCkgLT5cbiAgICBpZiBub3QgQG9wZW5lZFxuICAgICAgd2FpdCA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgIEBlbWl0dGVyLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6dGVybWluYWwtb3BlblwiLCAoKSA9PlxuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICBzZXRUaW1lb3V0IHJlamVjdCwgMTAwMFxuXG4gICAgICB3YWl0LnRoZW4gKCkgPT5cbiAgICAgICAgQHB0eVByb21pc2UoKVxuICAgIGVsc2VcbiAgICAgIEBwdHlQcm9taXNlKClcblxuICBwdHlQcm9taXNlOiAoKSAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICBpZiBAcHR5UHJvY2Vzcz9cbiAgICAgICAgQHB0eVByb2Nlc3Mub24gXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDpwdHlcIiwgKHB0eSkgPT5cbiAgICAgICAgICByZXNvbHZlKHB0eSlcbiAgICAgICAgQHB0eVByb2Nlc3Muc2VuZCB7ZXZlbnQ6ICdwdHknfVxuICAgICAgICBzZXRUaW1lb3V0IHJlamVjdCwgMTAwMFxuICAgICAgZWxzZVxuICAgICAgICByZWplY3QoKVxuXG4gIGFwcGx5U3R5bGU6IC0+XG4gICAgY29uZmlnID0gYXRvbS5jb25maWcuZ2V0ICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbCdcblxuICAgIEB4dGVybS5hZGRDbGFzcyBjb25maWcuc3R5bGUudGhlbWVcbiAgICBAeHRlcm0uYWRkQ2xhc3MgJ2N1cnNvci1ibGluaycgaWYgY29uZmlnLnRvZ2dsZXMuY3Vyc29yQmxpbmtcblxuICAgIGVkaXRvckZvbnQgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5mb250RmFtaWx5JylcbiAgICBkZWZhdWx0Rm9udCA9IFwiTWVubG8sIENvbnNvbGFzLCAnRGVqYVZ1IFNhbnMgTW9ubycsIG1vbm9zcGFjZVwiXG4gICAgb3ZlcnJpZGVGb250ID0gY29uZmlnLnN0eWxlLmZvbnRGYW1pbHlcbiAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gb3ZlcnJpZGVGb250IG9yIGVkaXRvckZvbnQgb3IgZGVmYXVsdEZvbnRcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRGYW1pbHknLCAoZXZlbnQpID0+XG4gICAgICBlZGl0b3JGb250ID0gZXZlbnQubmV3VmFsdWVcbiAgICAgIEB0ZXJtaW5hbC5lbGVtZW50LnN0eWxlLmZvbnRGYW1pbHkgPSBvdmVycmlkZUZvbnQgb3IgZWRpdG9yRm9udCBvciBkZWZhdWx0Rm9udFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwuc3R5bGUuZm9udEZhbWlseScsIChldmVudCkgPT5cbiAgICAgIG92ZXJyaWRlRm9udCA9IGV2ZW50Lm5ld1ZhbHVlXG4gICAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gb3ZlcnJpZGVGb250IG9yIGVkaXRvckZvbnQgb3IgZGVmYXVsdEZvbnRcblxuICAgIGVkaXRvckZvbnRTaXplID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udFNpemUnKVxuICAgIG92ZXJyaWRlRm9udFNpemUgPSBjb25maWcuc3R5bGUuZm9udFNpemVcbiAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250U2l6ZSA9IFwiI3tvdmVycmlkZUZvbnRTaXplIG9yIGVkaXRvckZvbnRTaXplfXB4XCJcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRTaXplJywgKGV2ZW50KSA9PlxuICAgICAgZWRpdG9yRm9udFNpemUgPSBldmVudC5uZXdWYWx1ZVxuICAgICAgQHRlcm1pbmFsLmVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBcIiN7b3ZlcnJpZGVGb250U2l6ZSBvciBlZGl0b3JGb250U2l6ZX1weFwiXG4gICAgICBAcmVzaXplVGVybWluYWxUb1ZpZXcoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwuc3R5bGUuZm9udFNpemUnLCAoZXZlbnQpID0+XG4gICAgICBvdmVycmlkZUZvbnRTaXplID0gZXZlbnQubmV3VmFsdWVcbiAgICAgIEB0ZXJtaW5hbC5lbGVtZW50LnN0eWxlLmZvbnRTaXplID0gXCIje292ZXJyaWRlRm9udFNpemUgb3IgZWRpdG9yRm9udFNpemV9cHhcIlxuICAgICAgQHJlc2l6ZVRlcm1pbmFsVG9WaWV3KClcblxuICAgICMgZmlyc3QgOCBjb2xvcnMgaS5lLiAnZGFyaycgY29sb3JzXG4gICAgQHRlcm1pbmFsLmNvbG9yc1swLi43XSA9IFtcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5ibGFjay50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwucmVkLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5ncmVlbi50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwueWVsbG93LnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5ibHVlLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5tYWdlbnRhLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5jeWFuLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC53aGl0ZS50b0hleFN0cmluZygpXG4gICAgXVxuICAgICMgJ2JyaWdodCcgY29sb3JzXG4gICAgQHRlcm1pbmFsLmNvbG9yc1s4Li4xNV0gPSBbXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodEJsYWNrLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0UmVkLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0R3JlZW4udG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRZZWxsb3cudG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRCbHVlLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0TWFnZW50YS50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodEN5YW4udG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRXaGl0ZS50b0hleFN0cmluZygpXG4gICAgXVxuXG4gIGF0dGFjaFdpbmRvd0V2ZW50czogLT5cbiAgICAkKHdpbmRvdykub24gJ3Jlc2l6ZScsIEBvbldpbmRvd1Jlc2l6ZVxuXG4gIGRldGFjaFdpbmRvd0V2ZW50czogLT5cbiAgICAkKHdpbmRvdykub2ZmICdyZXNpemUnLCBAb25XaW5kb3dSZXNpemVcblxuICBhdHRhY2hSZXNpemVFdmVudHM6IC0+XG4gICAgQHBhbmVsRGl2aWRlci5vbiAnbW91c2Vkb3duJywgQHJlc2l6ZVN0YXJ0ZWRcblxuICBkZXRhY2hSZXNpemVFdmVudHM6IC0+XG4gICAgQHBhbmVsRGl2aWRlci5vZmYgJ21vdXNlZG93bidcblxuICBvbldpbmRvd1Jlc2l6ZTogPT5cbiAgICBpZiBub3QgQHRhYlZpZXdcbiAgICAgIEB4dGVybS5jc3MgJ3RyYW5zaXRpb24nLCAnJ1xuICAgICAgbmV3SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpXG4gICAgICBib3R0b21QYW5lbCA9ICQoJ2F0b20tcGFuZWwtY29udGFpbmVyLmJvdHRvbScpLmZpcnN0KCkuZ2V0KDApXG4gICAgICBvdmVyZmxvdyA9IGJvdHRvbVBhbmVsLnNjcm9sbEhlaWdodCAtIGJvdHRvbVBhbmVsLm9mZnNldEhlaWdodFxuXG4gICAgICBkZWx0YSA9IG5ld0hlaWdodCAtIEB3aW5kb3dIZWlnaHRcbiAgICAgIEB3aW5kb3dIZWlnaHQgPSBuZXdIZWlnaHRcblxuICAgICAgaWYgQG1heGltaXplZFxuICAgICAgICBjbGFtcGVkID0gTWF0aC5tYXgoQG1heEhlaWdodCArIGRlbHRhLCBAcm93SGVpZ2h0KVxuXG4gICAgICAgIEBhZGp1c3RIZWlnaHQgY2xhbXBlZCBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgICAgQG1heEhlaWdodCA9IGNsYW1wZWRcblxuICAgICAgICBAcHJldkhlaWdodCA9IE1hdGgubWluKEBwcmV2SGVpZ2h0LCBAbWF4SGVpZ2h0KVxuICAgICAgZWxzZSBpZiBvdmVyZmxvdyA+IDBcbiAgICAgICAgY2xhbXBlZCA9IE1hdGgubWF4KEBuZWFyZXN0Um93KEBwcmV2SGVpZ2h0ICsgZGVsdGEpLCBAcm93SGVpZ2h0KVxuXG4gICAgICAgIEBhZGp1c3RIZWlnaHQgY2xhbXBlZCBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgICAgQHByZXZIZWlnaHQgPSBjbGFtcGVkXG5cbiAgICAgIEB4dGVybS5jc3MgJ3RyYW5zaXRpb24nLCBcImhlaWdodCAjezAuMjUgLyBAYW5pbWF0aW9uU3BlZWR9cyBsaW5lYXJcIlxuICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG5cbiAgcmVzaXplU3RhcnRlZDogPT5cbiAgICByZXR1cm4gaWYgQG1heGltaXplZFxuICAgIEBtYXhIZWlnaHQgPSBAcHJldkhlaWdodCArICQoJy5pdGVtLXZpZXdzJykuaGVpZ2h0KClcbiAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlJywgQHJlc2l6ZVBhbmVsKVxuICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgQHJlc2l6ZVN0b3BwZWQpXG4gICAgQHh0ZXJtLmNzcyAndHJhbnNpdGlvbicsICcnXG5cbiAgcmVzaXplU3RvcHBlZDogPT5cbiAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZScsIEByZXNpemVQYW5lbClcbiAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCBAcmVzaXplU3RvcHBlZClcbiAgICBAeHRlcm0uY3NzICd0cmFuc2l0aW9uJywgXCJoZWlnaHQgI3swLjI1IC8gQGFuaW1hdGlvblNwZWVkfXMgbGluZWFyXCJcblxuICBuZWFyZXN0Um93OiAodmFsdWUpIC0+XG4gICAgcm93cyA9IHZhbHVlIC8vIEByb3dIZWlnaHRcbiAgICByZXR1cm4gcm93cyAqIEByb3dIZWlnaHRcblxuICByZXNpemVQYW5lbDogKGV2ZW50KSA9PlxuICAgIHJldHVybiBAcmVzaXplU3RvcHBlZCgpIHVubGVzcyBldmVudC53aGljaCBpcyAxXG5cbiAgICBtb3VzZVkgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBldmVudC5wYWdlWVxuICAgIGRlbHRhID0gbW91c2VZIC0gJCgnYXRvbS1wYW5lbC1jb250YWluZXIuYm90dG9tJykuaGVpZ2h0KCkgLSAkKCdhdG9tLXBhbmVsLWNvbnRhaW5lci5mb290ZXInKS5oZWlnaHQoKVxuICAgIHJldHVybiB1bmxlc3MgTWF0aC5hYnMoZGVsdGEpID4gKEByb3dIZWlnaHQgKiA1IC8gNilcblxuICAgIGNsYW1wZWQgPSBNYXRoLm1heChAbmVhcmVzdFJvdyhAcHJldkhlaWdodCArIGRlbHRhKSwgQHJvd0hlaWdodClcbiAgICByZXR1cm4gaWYgY2xhbXBlZCA+IEBtYXhIZWlnaHRcblxuICAgIEB4dGVybS5oZWlnaHQgY2xhbXBlZFxuICAgICQoQHRlcm1pbmFsLmVsZW1lbnQpLmhlaWdodCBjbGFtcGVkXG4gICAgQHByZXZIZWlnaHQgPSBjbGFtcGVkXG5cbiAgICBAcmVzaXplVGVybWluYWxUb1ZpZXcoKVxuXG4gIGFkanVzdEhlaWdodDogKGhlaWdodCkgLT5cbiAgICBAeHRlcm0uaGVpZ2h0IGhlaWdodFxuICAgICQoQHRlcm1pbmFsLmVsZW1lbnQpLmhlaWdodCBoZWlnaHRcblxuICBjb3B5OiAtPlxuICAgIGlmIEB0ZXJtaW5hbC5fc2VsZWN0ZWRcbiAgICAgIHRleHRhcmVhID0gQHRlcm1pbmFsLmdldENvcHlUZXh0YXJlYSgpXG4gICAgICB0ZXh0ID0gQHRlcm1pbmFsLmdyYWJUZXh0KFxuICAgICAgICBAdGVybWluYWwuX3NlbGVjdGVkLngxLCBAdGVybWluYWwuX3NlbGVjdGVkLngyLFxuICAgICAgICBAdGVybWluYWwuX3NlbGVjdGVkLnkxLCBAdGVybWluYWwuX3NlbGVjdGVkLnkyKVxuICAgIGVsc2VcbiAgICAgIHJhd1RleHQgPSBAdGVybWluYWwuY29udGV4dC5nZXRTZWxlY3Rpb24oKS50b1N0cmluZygpXG4gICAgICByYXdMaW5lcyA9IHJhd1RleHQuc3BsaXQoL1xccj9cXG4vZylcbiAgICAgIGxpbmVzID0gcmF3TGluZXMubWFwIChsaW5lKSAtPlxuICAgICAgICBsaW5lLnJlcGxhY2UoL1xccy9nLCBcIiBcIikudHJpbVJpZ2h0KClcbiAgICAgIHRleHQgPSBsaW5lcy5qb2luKFwiXFxuXCIpXG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUgdGV4dFxuXG4gIHBhc3RlOiAtPlxuICAgIEBpbnB1dCBhdG9tLmNsaXBib2FyZC5yZWFkKClcblxuICBpbnNlcnRTZWxlY3Rpb246IChjdXN0b21UZXh0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgcnVuQ29tbWFuZCA9IGF0b20uY29uZmlnLmdldCgncGxhdGZvcm1pby1pZGUtdGVybWluYWwudG9nZ2xlcy5ydW5JbnNlcnRlZFRleHQnKVxuICAgIHNlbGVjdGlvblRleHQgPSAnJ1xuICAgIGlmIHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKVxuICAgICAgQHRlcm1pbmFsLnN0b3BTY3JvbGxpbmcoKVxuICAgICAgc2VsZWN0aW9uVGV4dCA9IHNlbGVjdGlvblxuICAgIGVsc2UgaWYgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGxpbmUgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coY3Vyc29yLnJvdylcbiAgICAgIEB0ZXJtaW5hbC5zdG9wU2Nyb2xsaW5nKClcbiAgICAgIHNlbGVjdGlvblRleHQgPSBsaW5lXG4gICAgICBlZGl0b3IubW92ZURvd24oMSk7XG4gICAgQGlucHV0IFwiI3tjdXN0b21UZXh0LlxuICAgICAgcmVwbGFjZSgvXFwkTC8sIFwiI3tlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgKyAxfVwiKS5cbiAgICAgIHJlcGxhY2UoL1xcJEYvLCBwYXRoLmJhc2VuYW1lKGVkaXRvcj8uYnVmZmVyPy5maWxlPy5wYXRoKSkuXG4gICAgICByZXBsYWNlKC9cXCRELywgcGF0aC5kaXJuYW1lKGVkaXRvcj8uYnVmZmVyPy5maWxlPy5wYXRoKSkuXG4gICAgICByZXBsYWNlKC9cXCRTLywgc2VsZWN0aW9uVGV4dCkuXG4gICAgICByZXBsYWNlKC9cXCRcXCQvLCAnJCcpfSN7aWYgcnVuQ29tbWFuZCB0aGVuIG9zLkVPTCBlbHNlICcnfVwiXG5cbiAgZm9jdXM6ID0+XG4gICAgQHJlc2l6ZVRlcm1pbmFsVG9WaWV3KClcbiAgICBAZm9jdXNUZXJtaW5hbCgpXG4gICAgQHN0YXR1c0Jhci5zZXRBY3RpdmVUZXJtaW5hbFZpZXcodGhpcylcbiAgICBzdXBlcigpXG5cbiAgYmx1cjogPT5cbiAgICBAYmx1clRlcm1pbmFsKClcbiAgICBzdXBlcigpXG5cbiAgZm9jdXNUZXJtaW5hbDogPT5cbiAgICByZXR1cm4gdW5sZXNzIEB0ZXJtaW5hbFxuXG4gICAgbGFzdEFjdGl2ZUVsZW1lbnQgPSAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG5cbiAgICBAdGVybWluYWwuZm9jdXMoKVxuICAgIGlmIEB0ZXJtaW5hbC5fdGV4dGFyZWFcbiAgICAgIEB0ZXJtaW5hbC5fdGV4dGFyZWEuZm9jdXMoKVxuICAgIGVsc2VcbiAgICAgIEB0ZXJtaW5hbC5lbGVtZW50LmZvY3VzKClcblxuICBibHVyVGVybWluYWw6ID0+XG4gICAgcmV0dXJuIHVubGVzcyBAdGVybWluYWxcblxuICAgIEB0ZXJtaW5hbC5ibHVyKClcbiAgICBAdGVybWluYWwuZWxlbWVudC5ibHVyKClcblxuICAgIGlmIGxhc3RBY3RpdmVFbGVtZW50P1xuICAgICAgbGFzdEFjdGl2ZUVsZW1lbnQuZm9jdXMoKVxuXG4gIHJlc2l6ZVRlcm1pbmFsVG9WaWV3OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHBhbmVsLmlzVmlzaWJsZSgpIG9yIEB0YWJWaWV3XG5cbiAgICB7Y29scywgcm93c30gPSBAZ2V0RGltZW5zaW9ucygpXG4gICAgcmV0dXJuIHVubGVzcyBjb2xzID4gMCBhbmQgcm93cyA+IDBcbiAgICByZXR1cm4gdW5sZXNzIEB0ZXJtaW5hbFxuICAgIHJldHVybiBpZiBAdGVybWluYWwucm93cyBpcyByb3dzIGFuZCBAdGVybWluYWwuY29scyBpcyBjb2xzXG5cbiAgICBAcmVzaXplIGNvbHMsIHJvd3NcbiAgICBAdGVybWluYWwucmVzaXplIGNvbHMsIHJvd3NcblxuICBnZXREaW1lbnNpb25zOiAtPlxuICAgIGZha2VSb3cgPSAkKFwiPGRpdj48c3Bhbj4mbmJzcDs8L3NwYW4+PC9kaXY+XCIpXG5cbiAgICBpZiBAdGVybWluYWxcbiAgICAgIEBmaW5kKCcudGVybWluYWwnKS5hcHBlbmQgZmFrZVJvd1xuICAgICAgZmFrZUNvbCA9IGZha2VSb3cuY2hpbGRyZW4oKS5maXJzdCgpWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICBjb2xzID0gTWF0aC5mbG9vciBAeHRlcm0ud2lkdGgoKSAvIChmYWtlQ29sLndpZHRoIG9yIDkpXG4gICAgICByb3dzID0gTWF0aC5mbG9vciBAeHRlcm0uaGVpZ2h0KCkgLyAoZmFrZUNvbC5oZWlnaHQgb3IgMjApXG4gICAgICBAcm93SGVpZ2h0ID0gZmFrZUNvbC5oZWlnaHRcbiAgICAgIGZha2VSb3cucmVtb3ZlKClcbiAgICBlbHNlXG4gICAgICBjb2xzID0gTWF0aC5mbG9vciBAeHRlcm0ud2lkdGgoKSAvIDlcbiAgICAgIHJvd3MgPSBNYXRoLmZsb29yIEB4dGVybS5oZWlnaHQoKSAvIDIwXG5cbiAgICB7Y29scywgcm93c31cblxuICBvblRyYW5zaXRpb25FbmQ6IChjYWxsYmFjaykgLT5cbiAgICBAeHRlcm0ub25lICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgPT5cbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEBhbmltYXRpbmcgPSBmYWxzZVxuXG4gIGlucHV0RGlhbG9nOiAtPlxuICAgIElucHV0RGlhbG9nID89IHJlcXVpcmUoJy4vaW5wdXQtZGlhbG9nJylcbiAgICBkaWFsb2cgPSBuZXcgSW5wdXREaWFsb2cgdGhpc1xuICAgIGRpYWxvZy5hdHRhY2goKVxuXG4gIHJlbmFtZTogLT5cbiAgICBAc3RhdHVzSWNvbi5yZW5hbWUoKVxuXG4gIHRvZ2dsZVRhYlZpZXc6IC0+XG4gICAgaWYgQHRhYlZpZXdcbiAgICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKGl0ZW06IHRoaXMsIHZpc2libGU6IGZhbHNlKVxuICAgICAgQGF0dGFjaFJlc2l6ZUV2ZW50cygpXG4gICAgICBAY2xvc2VCdG4uc2hvdygpXG4gICAgICBAaGlkZUJ0bi5zaG93KClcbiAgICAgIEBtYXhpbWl6ZUJ0bi5zaG93KClcbiAgICAgIEB0YWJWaWV3ID0gZmFsc2VcbiAgICBlbHNlXG4gICAgICBAcGFuZWwuZGVzdHJveSgpXG4gICAgICBAZGV0YWNoUmVzaXplRXZlbnRzKClcbiAgICAgIEBjbG9zZUJ0bi5oaWRlKClcbiAgICAgIEBoaWRlQnRuLmhpZGUoKVxuICAgICAgQG1heGltaXplQnRuLmhpZGUoKVxuICAgICAgQHh0ZXJtLmNzcyBcImhlaWdodFwiLCBcIlwiXG4gICAgICBAdGFiVmlldyA9IHRydWVcbiAgICAgIGxhc3RPcGVuZWRWaWV3ID0gbnVsbCBpZiBsYXN0T3BlbmVkVmlldyA9PSB0aGlzXG5cbiAgZ2V0VGl0bGU6IC0+XG4gICAgQHN0YXR1c0ljb24uZ2V0TmFtZSgpIG9yIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWxcIlxuXG4gIGdldEljb25OYW1lOiAtPlxuICAgIFwidGVybWluYWxcIlxuXG4gIGdldFNoZWxsOiAtPlxuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lIEBzaGVsbFxuXG4gIGdldFNoZWxsUGF0aDogLT5cbiAgICByZXR1cm4gQHNoZWxsXG5cbiAgZW1pdDogKGV2ZW50LCBkYXRhKSAtPlxuICAgIEBlbWl0dGVyLmVtaXQgZXZlbnQsIGRhdGFcblxuICBvbkRpZENoYW5nZVRpdGxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtdGl0bGUnLCBjYWxsYmFja1xuXG4gIGdldFBhdGg6IC0+XG4gICAgcmV0dXJuIEBnZXRUZXJtaW5hbFRpdGxlKClcblxuICBnZXRUZXJtaW5hbFRpdGxlOiAtPlxuICAgIHJldHVybiBAdGl0bGUgb3IgQHByb2Nlc3NcblxuICBnZXRUZXJtaW5hbDogLT5cbiAgICByZXR1cm4gQHRlcm1pbmFsXG5cbiAgaXNBbmltYXRpbmc6IC0+XG4gICAgcmV0dXJuIEBhbmltYXRpbmdcbiJdfQ==
