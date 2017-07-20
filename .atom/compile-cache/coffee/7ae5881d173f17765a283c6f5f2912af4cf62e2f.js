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

    PlatformIOTerminalView.prototype.focus = function(fromWindowEvent) {
      this.resizeTerminalToView();
      this.focusTerminal(fromWindowEvent);
      this.statusBar.setActiveTerminalView(this);
      return PlatformIOTerminalView.__super__.focus.call(this);
    };

    PlatformIOTerminalView.prototype.blur = function() {
      this.blurTerminal();
      return PlatformIOTerminalView.__super__.blur.call(this);
    };

    PlatformIOTerminalView.prototype.focusTerminal = function(fromWindowEvent) {
      if (!this.terminal) {
        return;
      }
      lastActiveElement = $(document.activeElement);
      if (fromWindowEvent && !lastActiveElement.is('div.terminal')) {
        return;
      }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL3ZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1SkFBQTtJQUFBOzs7O0VBQUEsTUFBdUMsT0FBQSxDQUFRLE1BQVIsQ0FBdkMsRUFBQyxlQUFELEVBQU8sNkNBQVAsRUFBNEI7O0VBQzVCLE9BQVksT0FBQSxDQUFRLHNCQUFSLENBQVosRUFBQyxVQUFELEVBQUk7O0VBRUosR0FBQSxHQUFNLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFdBQWhCOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7RUFDWCxXQUFBLEdBQWM7O0VBRWQsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFFTCxjQUFBLEdBQWlCOztFQUNqQixpQkFBQSxHQUFvQjs7RUFFcEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0FDSixTQUFBLEdBQVc7O3FDQUNYLEVBQUEsR0FBSTs7cUNBQ0osU0FBQSxHQUFXOztxQ0FDWCxNQUFBLEdBQVE7O3FDQUNSLEdBQUEsR0FBSzs7cUNBQ0wsWUFBQSxHQUFjLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxNQUFWLENBQUE7O3FDQUNkLFNBQUEsR0FBVzs7cUNBQ1gsS0FBQSxHQUFPOztxQ0FDUCxPQUFBLEdBQVM7O0lBRVQsc0JBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVDQUFQO1FBQWdELE1BQUEsRUFBUSx3QkFBeEQ7T0FBTCxFQUF1RixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDckYsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFB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QTtJQURHOzs7O0tBOWlCc0I7QUFkckMiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGFzaywgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xueyQsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cblB0eSA9IHJlcXVpcmUucmVzb2x2ZSAnLi9wcm9jZXNzJ1xuVGVybWluYWwgPSByZXF1aXJlICd0ZXJtLmpzJ1xuSW5wdXREaWFsb2cgPSBudWxsXG5cbnBhdGggPSByZXF1aXJlICdwYXRoJ1xub3MgPSByZXF1aXJlICdvcydcblxubGFzdE9wZW5lZFZpZXcgPSBudWxsXG5sYXN0QWN0aXZlRWxlbWVudCA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGxhdGZvcm1JT1Rlcm1pbmFsVmlldyBleHRlbmRzIFZpZXdcbiAgYW5pbWF0aW5nOiBmYWxzZVxuICBpZDogJydcbiAgbWF4aW1pemVkOiBmYWxzZVxuICBvcGVuZWQ6IGZhbHNlXG4gIHB3ZDogJydcbiAgd2luZG93SGVpZ2h0OiAkKHdpbmRvdykuaGVpZ2h0KClcbiAgcm93SGVpZ2h0OiAyMFxuICBzaGVsbDogJydcbiAgdGFiVmlldzogZmFsc2VcblxuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAncGxhdGZvcm1pby1pZGUtdGVybWluYWwgdGVybWluYWwtdmlldycsIG91dGxldDogJ3BsYXRmb3JtSU9UZXJtaW5hbFZpZXcnLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWRpdmlkZXInLCBvdXRsZXQ6ICdwYW5lbERpdmlkZXInXG4gICAgICBAZGl2IGNsYXNzOiAnYnRuLXRvb2xiYXInLCBvdXRsZXQ6J3Rvb2xiYXInLCA9PlxuICAgICAgICBAYnV0dG9uIG91dGxldDogJ2Nsb3NlQnRuJywgY2xhc3M6ICdidG4gaW5saW5lLWJsb2NrLXRpZ2h0IHJpZ2h0JywgY2xpY2s6ICdkZXN0cm95JywgPT5cbiAgICAgICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi14J1xuICAgICAgICBAYnV0dG9uIG91dGxldDogJ2hpZGVCdG4nLCBjbGFzczogJ2J0biBpbmxpbmUtYmxvY2stdGlnaHQgcmlnaHQnLCBjbGljazogJ2hpZGUnLCA9PlxuICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaWNvbiBpY29uLWNoZXZyb24tZG93bidcbiAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdtYXhpbWl6ZUJ0bicsIGNsYXNzOiAnYnRuIGlubGluZS1ibG9jay10aWdodCByaWdodCcsIGNsaWNrOiAnbWF4aW1pemUnLCA9PlxuICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaWNvbiBpY29uLXNjcmVlbi1mdWxsJ1xuICAgICAgICBAYnV0dG9uIG91dGxldDogJ2lucHV0QnRuJywgY2xhc3M6ICdidG4gaW5saW5lLWJsb2NrLXRpZ2h0IGxlZnQnLCBjbGljazogJ2lucHV0RGlhbG9nJywgPT5cbiAgICAgICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi1rZXlib2FyZCdcbiAgICAgIEBkaXYgY2xhc3M6ICd4dGVybScsIG91dGxldDogJ3h0ZXJtJ1xuXG4gIEBnZXRGb2N1c2VkVGVybWluYWw6IC0+XG4gICAgcmV0dXJuIFRlcm1pbmFsLlRlcm1pbmFsLmZvY3VzXG5cbiAgaW5pdGlhbGl6ZTogKEBpZCwgQHB3ZCwgQHN0YXR1c0ljb24sIEBzdGF0dXNCYXIsIEBzaGVsbCwgQGFyZ3M9W10sIEBhdXRvUnVuPVtdKSAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGNsb3NlQnRuLFxuICAgICAgdGl0bGU6ICdDbG9zZSdcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGhpZGVCdG4sXG4gICAgICB0aXRsZTogJ0hpZGUnXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtYXhpbWl6ZUJ0bi50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgQG1heGltaXplQnRuLFxuICAgICAgdGl0bGU6ICdGdWxsc2NyZWVuJ1xuICAgIEBpbnB1dEJ0bi50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgQGlucHV0QnRuLFxuICAgICAgdGl0bGU6ICdJbnNlcnQgVGV4dCdcblxuICAgIEBwcmV2SGVpZ2h0ID0gYXRvbS5jb25maWcuZ2V0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC5zdHlsZS5kZWZhdWx0UGFuZWxIZWlnaHQnKVxuICAgIGlmIEBwcmV2SGVpZ2h0LmluZGV4T2YoJyUnKSA+IDBcbiAgICAgIHBlcmNlbnQgPSBNYXRoLmFicyhNYXRoLm1pbihwYXJzZUZsb2F0KEBwcmV2SGVpZ2h0KSAvIDEwMC4wLCAxKSlcbiAgICAgIGJvdHRvbUhlaWdodCA9ICQoJ2F0b20tcGFuZWwuYm90dG9tJykuY2hpbGRyZW4oXCIudGVybWluYWwtdmlld1wiKS5oZWlnaHQoKSBvciAwXG4gICAgICBAcHJldkhlaWdodCA9IHBlcmNlbnQgKiAoJCgnLml0ZW0tdmlld3MnKS5oZWlnaHQoKSArIGJvdHRvbUhlaWdodClcbiAgICBAeHRlcm0uaGVpZ2h0IDBcblxuICAgIEBzZXRBbmltYXRpb25TcGVlZCgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC5zdHlsZS5hbmltYXRpb25TcGVlZCcsIEBzZXRBbmltYXRpb25TcGVlZFxuXG4gICAgb3ZlcnJpZGUgPSAoZXZlbnQpIC0+XG4gICAgICByZXR1cm4gaWYgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgncGxhdGZvcm1pby1pZGUtdGVybWluYWwnKSBpcyAndHJ1ZSdcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBAeHRlcm0ub24gJ21vdXNldXAnLCAoZXZlbnQpID0+XG4gICAgICBpZiBldmVudC53aGljaCAhPSAzXG4gICAgICAgIHRleHQgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkudG9TdHJpbmcoKVxuICAgICAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh0ZXh0KSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnRvZ2dsZXMuc2VsZWN0VG9Db3B5JykgYW5kIHRleHRcbiAgICAgICAgdW5sZXNzIHRleHRcbiAgICAgICAgICBAZm9jdXMoKVxuICAgIEB4dGVybS5vbiAnZHJhZ2VudGVyJywgb3ZlcnJpZGVcbiAgICBAeHRlcm0ub24gJ2RyYWdvdmVyJywgb3ZlcnJpZGVcbiAgICBAeHRlcm0ub24gJ2Ryb3AnLCBAcmVjaWV2ZUl0ZW1PckZpbGVcblxuICAgIEBvbiAnZm9jdXMnLCBAZm9jdXNcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgZGlzcG9zZTogPT5cbiAgICAgIEBvZmYgJ2ZvY3VzJywgQGZvY3VzXG5cbiAgYXR0YWNoOiAtPlxuICAgIHJldHVybiBpZiBAcGFuZWw/XG4gICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoaXRlbTogdGhpcywgdmlzaWJsZTogZmFsc2UpXG5cbiAgc2V0QW5pbWF0aW9uU3BlZWQ6ID0+XG4gICAgQGFuaW1hdGlvblNwZWVkID0gYXRvbS5jb25maWcuZ2V0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC5zdHlsZS5hbmltYXRpb25TcGVlZCcpXG4gICAgQGFuaW1hdGlvblNwZWVkID0gMTAwIGlmIEBhbmltYXRpb25TcGVlZCBpcyAwXG5cbiAgICBAeHRlcm0uY3NzICd0cmFuc2l0aW9uJywgXCJoZWlnaHQgI3swLjI1IC8gQGFuaW1hdGlvblNwZWVkfXMgbGluZWFyXCJcblxuICByZWNpZXZlSXRlbU9yRmlsZTogKGV2ZW50KSA9PlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHtkYXRhVHJhbnNmZXJ9ID0gZXZlbnQub3JpZ2luYWxFdmVudFxuXG4gICAgaWYgZGF0YVRyYW5zZmVyLmdldERhdGEoJ2F0b20tZXZlbnQnKSBpcyAndHJ1ZSdcbiAgICAgIGZpbGVQYXRoID0gZGF0YVRyYW5zZmVyLmdldERhdGEoJ3RleHQvcGxhaW4nKVxuICAgICAgQGlucHV0IFwiI3tmaWxlUGF0aH0gXCIgaWYgZmlsZVBhdGhcbiAgICBlbHNlIGlmIGZpbGVQYXRoID0gZGF0YVRyYW5zZmVyLmdldERhdGEoJ2luaXRpYWxQYXRoJylcbiAgICAgIEBpbnB1dCBcIiN7ZmlsZVBhdGh9IFwiXG4gICAgZWxzZSBpZiBkYXRhVHJhbnNmZXIuZmlsZXMubGVuZ3RoID4gMFxuICAgICAgZm9yIGZpbGUgaW4gZGF0YVRyYW5zZmVyLmZpbGVzXG4gICAgICAgIEBpbnB1dCBcIiN7ZmlsZS5wYXRofSBcIlxuXG4gIGZvcmtQdHlQcm9jZXNzOiAtPlxuICAgIFRhc2sub25jZSBQdHksIHBhdGgucmVzb2x2ZShAcHdkKSwgQHNoZWxsLCBAYXJncywgPT5cbiAgICAgIEBpbnB1dCA9IC0+XG4gICAgICBAcmVzaXplID0gLT5cblxuICBnZXRJZDogLT5cbiAgICByZXR1cm4gQGlkXG5cbiAgZGlzcGxheVRlcm1pbmFsOiAtPlxuICAgIHtjb2xzLCByb3dzfSA9IEBnZXREaW1lbnNpb25zKClcbiAgICBAcHR5UHJvY2VzcyA9IEBmb3JrUHR5UHJvY2VzcygpXG5cbiAgICBAdGVybWluYWwgPSBuZXcgVGVybWluYWwge1xuICAgICAgY3Vyc29yQmxpbmsgICAgIDogZmFsc2VcbiAgICAgIHNjcm9sbGJhY2sgICAgICA6IGF0b20uY29uZmlnLmdldCAncGxhdGZvcm1pby1pZGUtdGVybWluYWwuY29yZS5zY3JvbGxiYWNrJ1xuICAgICAgY29scywgcm93c1xuICAgIH1cblxuICAgIEBhdHRhY2hMaXN0ZW5lcnMoKVxuICAgIEBhdHRhY2hSZXNpemVFdmVudHMoKVxuICAgIEBhdHRhY2hXaW5kb3dFdmVudHMoKVxuICAgIEB0ZXJtaW5hbC5vcGVuIEB4dGVybS5nZXQoMClcblxuICBhdHRhY2hMaXN0ZW5lcnM6IC0+XG4gICAgQHB0eVByb2Nlc3Mub24gXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDpkYXRhXCIsIChkYXRhKSA9PlxuICAgICAgQHRlcm1pbmFsLndyaXRlIGRhdGFcblxuICAgIEBwdHlQcm9jZXNzLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6ZXhpdFwiLCA9PlxuICAgICAgQGRlc3Ryb3koKSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnRvZ2dsZXMuYXV0b0Nsb3NlJylcblxuICAgIEB0ZXJtaW5hbC5lbmQgPSA9PiBAZGVzdHJveSgpXG5cbiAgICBAdGVybWluYWwub24gXCJkYXRhXCIsIChkYXRhKSA9PlxuICAgICAgQGlucHV0IGRhdGFcblxuICAgIEBwdHlQcm9jZXNzLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6dGl0bGVcIiwgKHRpdGxlKSA9PlxuICAgICAgQHByb2Nlc3MgPSB0aXRsZVxuICAgIEB0ZXJtaW5hbC5vbiBcInRpdGxlXCIsICh0aXRsZSkgPT5cbiAgICAgIEB0aXRsZSA9IHRpdGxlXG5cbiAgICBAdGVybWluYWwub25jZSBcIm9wZW5cIiwgPT5cbiAgICAgIEBhcHBseVN0eWxlKClcbiAgICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG5cbiAgICAgIHJldHVybiB1bmxlc3MgQHB0eVByb2Nlc3MuY2hpbGRQcm9jZXNzP1xuICAgICAgYXV0b1J1bkNvbW1hbmQgPSBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLmNvcmUuYXV0b1J1bkNvbW1hbmQnKVxuICAgICAgQGlucHV0IFwiI3thdXRvUnVuQ29tbWFuZH0je29zLkVPTH1cIiBpZiBhdXRvUnVuQ29tbWFuZFxuICAgICAgQGlucHV0IFwiI3tjb21tYW5kfSN7b3MuRU9MfVwiIGZvciBjb21tYW5kIGluIEBhdXRvUnVuXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAc3RhdHVzSWNvbi5kZXN0cm95KClcbiAgICBAc3RhdHVzQmFyLnJlbW92ZVRlcm1pbmFsVmlldyB0aGlzXG4gICAgQGRldGFjaFJlc2l6ZUV2ZW50cygpXG4gICAgQGRldGFjaFdpbmRvd0V2ZW50cygpXG5cbiAgICBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgIEBoaWRlKClcbiAgICAgIEBvblRyYW5zaXRpb25FbmQgPT4gQHBhbmVsLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIEBwYW5lbC5kZXN0cm95KClcblxuICAgIGlmIEBzdGF0dXNJY29uIGFuZCBAc3RhdHVzSWNvbi5wYXJlbnROb2RlXG4gICAgICBAc3RhdHVzSWNvbi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKEBzdGF0dXNJY29uKVxuXG4gICAgQHB0eVByb2Nlc3M/LnRlcm1pbmF0ZSgpXG4gICAgQHRlcm1pbmFsPy5kZXN0cm95KClcblxuICBtYXhpbWl6ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICBAbWF4aW1pemVCdG4udG9vbHRpcC5kaXNwb3NlKClcblxuICAgIEBtYXhIZWlnaHQgPSBAcHJldkhlaWdodCArICQoJy5pdGVtLXZpZXdzJykuaGVpZ2h0KClcbiAgICBidG4gPSBAbWF4aW1pemVCdG4uY2hpbGRyZW4oJ3NwYW4nKVxuICAgIEBvblRyYW5zaXRpb25FbmQgPT4gQGZvY3VzKClcblxuICAgIGlmIEBtYXhpbWl6ZWRcbiAgICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgQG1heGltaXplQnRuLFxuICAgICAgICB0aXRsZTogJ0Z1bGxzY3JlZW4nXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICAgIEBhZGp1c3RIZWlnaHQgQHByZXZIZWlnaHRcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnaWNvbi1zY3JlZW4tbm9ybWFsJykuYWRkQ2xhc3MoJ2ljb24tc2NyZWVuLWZ1bGwnKVxuICAgICAgQG1heGltaXplZCA9IGZhbHNlXG4gICAgZWxzZVxuICAgICAgQG1heGltaXplQnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAbWF4aW1pemVCdG4sXG4gICAgICAgIHRpdGxlOiAnTm9ybWFsJ1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtYXhpbWl6ZUJ0bi50b29sdGlwXG4gICAgICBAYWRqdXN0SGVpZ2h0IEBtYXhIZWlnaHRcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnaWNvbi1zY3JlZW4tZnVsbCcpLmFkZENsYXNzKCdpY29uLXNjcmVlbi1ub3JtYWwnKVxuICAgICAgQG1heGltaXplZCA9IHRydWVcblxuICBvcGVuOiA9PlxuICAgIGxhc3RBY3RpdmVFbGVtZW50ID89ICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcblxuICAgIGlmIGxhc3RPcGVuZWRWaWV3IGFuZCBsYXN0T3BlbmVkVmlldyAhPSB0aGlzXG4gICAgICBpZiBsYXN0T3BlbmVkVmlldy5tYXhpbWl6ZWRcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMucmVtb3ZlIEBtYXhpbWl6ZUJ0bi50b29sdGlwXG4gICAgICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwLmRpc3Bvc2UoKVxuICAgICAgICBpY29uID0gQG1heGltaXplQnRuLmNoaWxkcmVuKCdzcGFuJylcblxuICAgICAgICBAbWF4SGVpZ2h0ID0gbGFzdE9wZW5lZFZpZXcubWF4SGVpZ2h0XG4gICAgICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgQG1heGltaXplQnRuLFxuICAgICAgICAgIHRpdGxlOiAnTm9ybWFsJ1xuICAgICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICAgICAgaWNvbi5yZW1vdmVDbGFzcygnaWNvbi1zY3JlZW4tZnVsbCcpLmFkZENsYXNzKCdpY29uLXNjcmVlbi1ub3JtYWwnKVxuICAgICAgICBAbWF4aW1pemVkID0gdHJ1ZVxuICAgICAgbGFzdE9wZW5lZFZpZXcuaGlkZSgpXG5cbiAgICBsYXN0T3BlbmVkVmlldyA9IHRoaXNcbiAgICBAc3RhdHVzQmFyLnNldEFjdGl2ZVRlcm1pbmFsVmlldyB0aGlzXG4gICAgQHN0YXR1c0ljb24uYWN0aXZhdGUoKVxuXG4gICAgQG9uVHJhbnNpdGlvbkVuZCA9PlxuICAgICAgaWYgbm90IEBvcGVuZWRcbiAgICAgICAgQG9wZW5lZCA9IHRydWVcbiAgICAgICAgQGRpc3BsYXlUZXJtaW5hbCgpXG4gICAgICAgIEBwcmV2SGVpZ2h0ID0gQG5lYXJlc3RSb3coQHh0ZXJtLmhlaWdodCgpKVxuICAgICAgICBAeHRlcm0uaGVpZ2h0KEBwcmV2SGVpZ2h0KVxuICAgICAgICBAZW1pdCBcInBsYXRmb3JtaW8taWRlLXRlcm1pbmFsOnRlcm1pbmFsLW9wZW5cIlxuICAgICAgZWxzZVxuICAgICAgICBAZm9jdXMoKVxuXG4gICAgQHBhbmVsLnNob3coKVxuICAgIEB4dGVybS5oZWlnaHQgMFxuICAgIEBhbmltYXRpbmcgPSB0cnVlXG4gICAgQHh0ZXJtLmhlaWdodCBpZiBAbWF4aW1pemVkIHRoZW4gQG1heEhlaWdodCBlbHNlIEBwcmV2SGVpZ2h0XG5cbiAgaGlkZTogPT5cbiAgICBAdGVybWluYWw/LmJsdXIoKVxuICAgIGxhc3RPcGVuZWRWaWV3ID0gbnVsbFxuICAgIEBzdGF0dXNJY29uLmRlYWN0aXZhdGUoKVxuXG4gICAgQG9uVHJhbnNpdGlvbkVuZCA9PlxuICAgICAgQHBhbmVsLmhpZGUoKVxuICAgICAgdW5sZXNzIGxhc3RPcGVuZWRWaWV3P1xuICAgICAgICBpZiBsYXN0QWN0aXZlRWxlbWVudD9cbiAgICAgICAgICBsYXN0QWN0aXZlRWxlbWVudC5mb2N1cygpXG4gICAgICAgICAgbGFzdEFjdGl2ZUVsZW1lbnQgPSBudWxsXG5cbiAgICBAeHRlcm0uaGVpZ2h0IGlmIEBtYXhpbWl6ZWQgdGhlbiBAbWF4SGVpZ2h0IGVsc2UgQHByZXZIZWlnaHRcbiAgICBAYW5pbWF0aW5nID0gdHJ1ZVxuICAgIEB4dGVybS5oZWlnaHQgMFxuXG4gIHRvZ2dsZTogLT5cbiAgICByZXR1cm4gaWYgQGFuaW1hdGluZ1xuXG4gICAgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICBAaGlkZSgpXG4gICAgZWxzZVxuICAgICAgQG9wZW4oKVxuXG4gIGlucHV0OiAoZGF0YSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwdHlQcm9jZXNzLmNoaWxkUHJvY2Vzcz9cblxuICAgIEB0ZXJtaW5hbC5zdG9wU2Nyb2xsaW5nKClcbiAgICBAcHR5UHJvY2Vzcy5zZW5kIGV2ZW50OiAnaW5wdXQnLCB0ZXh0OiBkYXRhXG5cbiAgcmVzaXplOiAoY29scywgcm93cykgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwdHlQcm9jZXNzLmNoaWxkUHJvY2Vzcz9cblxuICAgIEBwdHlQcm9jZXNzLnNlbmQge2V2ZW50OiAncmVzaXplJywgcm93cywgY29sc31cblxuICBwdHk6ICgpIC0+XG4gICAgaWYgbm90IEBvcGVuZWRcbiAgICAgIHdhaXQgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICBAZW1pdHRlci5vbiBcInBsYXRmb3JtaW8taWRlLXRlcm1pbmFsOnRlcm1pbmFsLW9wZW5cIiwgKCkgPT5cbiAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgc2V0VGltZW91dCByZWplY3QsIDEwMDBcblxuICAgICAgd2FpdC50aGVuICgpID0+XG4gICAgICAgIEBwdHlQcm9taXNlKClcbiAgICBlbHNlXG4gICAgICBAcHR5UHJvbWlzZSgpXG5cbiAgcHR5UHJvbWlzZTogKCkgLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgaWYgQHB0eVByb2Nlc3M/XG4gICAgICAgIEBwdHlQcm9jZXNzLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6cHR5XCIsIChwdHkpID0+XG4gICAgICAgICAgcmVzb2x2ZShwdHkpXG4gICAgICAgIEBwdHlQcm9jZXNzLnNlbmQge2V2ZW50OiAncHR5J31cbiAgICAgICAgc2V0VGltZW91dCByZWplY3QsIDEwMDBcbiAgICAgIGVsc2VcbiAgICAgICAgcmVqZWN0KClcblxuICBhcHBseVN0eWxlOiAtPlxuICAgIGNvbmZpZyA9IGF0b20uY29uZmlnLmdldCAncGxhdGZvcm1pby1pZGUtdGVybWluYWwnXG5cbiAgICBAeHRlcm0uYWRkQ2xhc3MgY29uZmlnLnN0eWxlLnRoZW1lXG4gICAgQHh0ZXJtLmFkZENsYXNzICdjdXJzb3ItYmxpbmsnIGlmIGNvbmZpZy50b2dnbGVzLmN1cnNvckJsaW5rXG5cbiAgICBlZGl0b3JGb250ID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG4gICAgZGVmYXVsdEZvbnQgPSBcIk1lbmxvLCBDb25zb2xhcywgJ0RlamFWdSBTYW5zIE1vbm8nLCBtb25vc3BhY2VcIlxuICAgIG92ZXJyaWRlRm9udCA9IGNvbmZpZy5zdHlsZS5mb250RmFtaWx5XG4gICAgQHRlcm1pbmFsLmVsZW1lbnQuc3R5bGUuZm9udEZhbWlseSA9IG92ZXJyaWRlRm9udCBvciBlZGl0b3JGb250IG9yIGRlZmF1bHRGb250XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2VkaXRvci5mb250RmFtaWx5JywgKGV2ZW50KSA9PlxuICAgICAgZWRpdG9yRm9udCA9IGV2ZW50Lm5ld1ZhbHVlXG4gICAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gb3ZlcnJpZGVGb250IG9yIGVkaXRvckZvbnQgb3IgZGVmYXVsdEZvbnRcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmZvbnRGYW1pbHknLCAoZXZlbnQpID0+XG4gICAgICBvdmVycmlkZUZvbnQgPSBldmVudC5uZXdWYWx1ZVxuICAgICAgQHRlcm1pbmFsLmVsZW1lbnQuc3R5bGUuZm9udEZhbWlseSA9IG92ZXJyaWRlRm9udCBvciBlZGl0b3JGb250IG9yIGRlZmF1bHRGb250XG5cbiAgICBlZGl0b3JGb250U2l6ZSA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLmZvbnRTaXplJylcbiAgICBvdmVycmlkZUZvbnRTaXplID0gY29uZmlnLnN0eWxlLmZvbnRTaXplXG4gICAgQHRlcm1pbmFsLmVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBcIiN7b3ZlcnJpZGVGb250U2l6ZSBvciBlZGl0b3JGb250U2l6ZX1weFwiXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2VkaXRvci5mb250U2l6ZScsIChldmVudCkgPT5cbiAgICAgIGVkaXRvckZvbnRTaXplID0gZXZlbnQubmV3VmFsdWVcbiAgICAgIEB0ZXJtaW5hbC5lbGVtZW50LnN0eWxlLmZvbnRTaXplID0gXCIje292ZXJyaWRlRm9udFNpemUgb3IgZWRpdG9yRm9udFNpemV9cHhcIlxuICAgICAgQHJlc2l6ZVRlcm1pbmFsVG9WaWV3KClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmZvbnRTaXplJywgKGV2ZW50KSA9PlxuICAgICAgb3ZlcnJpZGVGb250U2l6ZSA9IGV2ZW50Lm5ld1ZhbHVlXG4gICAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250U2l6ZSA9IFwiI3tvdmVycmlkZUZvbnRTaXplIG9yIGVkaXRvckZvbnRTaXplfXB4XCJcbiAgICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG5cbiAgICAjIGZpcnN0IDggY29sb3JzIGkuZS4gJ2RhcmsnIGNvbG9yc1xuICAgIEB0ZXJtaW5hbC5jb2xvcnNbMC4uN10gPSBbXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwuYmxhY2sudG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMubm9ybWFsLnJlZC50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwuZ3JlZW4udG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMubm9ybWFsLnllbGxvdy50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwuYmx1ZS50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwubWFnZW50YS50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwuY3lhbi50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwud2hpdGUudG9IZXhTdHJpbmcoKVxuICAgIF1cbiAgICAjICdicmlnaHQnIGNvbG9yc1xuICAgIEB0ZXJtaW5hbC5jb2xvcnNbOC4uMTVdID0gW1xuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRCbGFjay50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodFJlZC50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodEdyZWVuLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0WWVsbG93LnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0Qmx1ZS50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodE1hZ2VudGEudG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRDeWFuLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0V2hpdGUudG9IZXhTdHJpbmcoKVxuICAgIF1cblxuICBhdHRhY2hXaW5kb3dFdmVudHM6IC0+XG4gICAgJCh3aW5kb3cpLm9uICdyZXNpemUnLCBAb25XaW5kb3dSZXNpemVcblxuICBkZXRhY2hXaW5kb3dFdmVudHM6IC0+XG4gICAgJCh3aW5kb3cpLm9mZiAncmVzaXplJywgQG9uV2luZG93UmVzaXplXG5cbiAgYXR0YWNoUmVzaXplRXZlbnRzOiAtPlxuICAgIEBwYW5lbERpdmlkZXIub24gJ21vdXNlZG93bicsIEByZXNpemVTdGFydGVkXG5cbiAgZGV0YWNoUmVzaXplRXZlbnRzOiAtPlxuICAgIEBwYW5lbERpdmlkZXIub2ZmICdtb3VzZWRvd24nXG5cbiAgb25XaW5kb3dSZXNpemU6ID0+XG4gICAgaWYgbm90IEB0YWJWaWV3XG4gICAgICBAeHRlcm0uY3NzICd0cmFuc2l0aW9uJywgJydcbiAgICAgIG5ld0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKVxuICAgICAgYm90dG9tUGFuZWwgPSAkKCdhdG9tLXBhbmVsLWNvbnRhaW5lci5ib3R0b20nKS5maXJzdCgpLmdldCgwKVxuICAgICAgb3ZlcmZsb3cgPSBib3R0b21QYW5lbC5zY3JvbGxIZWlnaHQgLSBib3R0b21QYW5lbC5vZmZzZXRIZWlnaHRcblxuICAgICAgZGVsdGEgPSBuZXdIZWlnaHQgLSBAd2luZG93SGVpZ2h0XG4gICAgICBAd2luZG93SGVpZ2h0ID0gbmV3SGVpZ2h0XG5cbiAgICAgIGlmIEBtYXhpbWl6ZWRcbiAgICAgICAgY2xhbXBlZCA9IE1hdGgubWF4KEBtYXhIZWlnaHQgKyBkZWx0YSwgQHJvd0hlaWdodClcblxuICAgICAgICBAYWRqdXN0SGVpZ2h0IGNsYW1wZWQgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICAgIEBtYXhIZWlnaHQgPSBjbGFtcGVkXG5cbiAgICAgICAgQHByZXZIZWlnaHQgPSBNYXRoLm1pbihAcHJldkhlaWdodCwgQG1heEhlaWdodClcbiAgICAgIGVsc2UgaWYgb3ZlcmZsb3cgPiAwXG4gICAgICAgIGNsYW1wZWQgPSBNYXRoLm1heChAbmVhcmVzdFJvdyhAcHJldkhlaWdodCArIGRlbHRhKSwgQHJvd0hlaWdodClcblxuICAgICAgICBAYWRqdXN0SGVpZ2h0IGNsYW1wZWQgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICAgIEBwcmV2SGVpZ2h0ID0gY2xhbXBlZFxuXG4gICAgICBAeHRlcm0uY3NzICd0cmFuc2l0aW9uJywgXCJoZWlnaHQgI3swLjI1IC8gQGFuaW1hdGlvblNwZWVkfXMgbGluZWFyXCJcbiAgICBAcmVzaXplVGVybWluYWxUb1ZpZXcoKVxuXG4gIHJlc2l6ZVN0YXJ0ZWQ6ID0+XG4gICAgcmV0dXJuIGlmIEBtYXhpbWl6ZWRcbiAgICBAbWF4SGVpZ2h0ID0gQHByZXZIZWlnaHQgKyAkKCcuaXRlbS12aWV3cycpLmhlaWdodCgpXG4gICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsIEByZXNpemVQYW5lbClcbiAgICAkKGRvY3VtZW50KS5vbignbW91c2V1cCcsIEByZXNpemVTdG9wcGVkKVxuICAgIEB4dGVybS5jc3MgJ3RyYW5zaXRpb24nLCAnJ1xuXG4gIHJlc2l6ZVN0b3BwZWQ6ID0+XG4gICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCBAcmVzaXplUGFuZWwpXG4gICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgQHJlc2l6ZVN0b3BwZWQpXG4gICAgQHh0ZXJtLmNzcyAndHJhbnNpdGlvbicsIFwiaGVpZ2h0ICN7MC4yNSAvIEBhbmltYXRpb25TcGVlZH1zIGxpbmVhclwiXG5cbiAgbmVhcmVzdFJvdzogKHZhbHVlKSAtPlxuICAgIHJvd3MgPSB2YWx1ZSAvLyBAcm93SGVpZ2h0XG4gICAgcmV0dXJuIHJvd3MgKiBAcm93SGVpZ2h0XG5cbiAgcmVzaXplUGFuZWw6IChldmVudCkgPT5cbiAgICByZXR1cm4gQHJlc2l6ZVN0b3BwZWQoKSB1bmxlc3MgZXZlbnQud2hpY2ggaXMgMVxuXG4gICAgbW91c2VZID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXZlbnQucGFnZVlcbiAgICBkZWx0YSA9IG1vdXNlWSAtICQoJ2F0b20tcGFuZWwtY29udGFpbmVyLmJvdHRvbScpLmhlaWdodCgpIC0gJCgnYXRvbS1wYW5lbC1jb250YWluZXIuZm9vdGVyJykuaGVpZ2h0KClcbiAgICByZXR1cm4gdW5sZXNzIE1hdGguYWJzKGRlbHRhKSA+IChAcm93SGVpZ2h0ICogNSAvIDYpXG5cbiAgICBjbGFtcGVkID0gTWF0aC5tYXgoQG5lYXJlc3RSb3coQHByZXZIZWlnaHQgKyBkZWx0YSksIEByb3dIZWlnaHQpXG4gICAgcmV0dXJuIGlmIGNsYW1wZWQgPiBAbWF4SGVpZ2h0XG5cbiAgICBAeHRlcm0uaGVpZ2h0IGNsYW1wZWRcbiAgICAkKEB0ZXJtaW5hbC5lbGVtZW50KS5oZWlnaHQgY2xhbXBlZFxuICAgIEBwcmV2SGVpZ2h0ID0gY2xhbXBlZFxuXG4gICAgQHJlc2l6ZVRlcm1pbmFsVG9WaWV3KClcblxuICBhZGp1c3RIZWlnaHQ6IChoZWlnaHQpIC0+XG4gICAgQHh0ZXJtLmhlaWdodCBoZWlnaHRcbiAgICAkKEB0ZXJtaW5hbC5lbGVtZW50KS5oZWlnaHQgaGVpZ2h0XG5cbiAgY29weTogLT5cbiAgICBpZiBAdGVybWluYWwuX3NlbGVjdGVkXG4gICAgICB0ZXh0YXJlYSA9IEB0ZXJtaW5hbC5nZXRDb3B5VGV4dGFyZWEoKVxuICAgICAgdGV4dCA9IEB0ZXJtaW5hbC5ncmFiVGV4dChcbiAgICAgICAgQHRlcm1pbmFsLl9zZWxlY3RlZC54MSwgQHRlcm1pbmFsLl9zZWxlY3RlZC54MixcbiAgICAgICAgQHRlcm1pbmFsLl9zZWxlY3RlZC55MSwgQHRlcm1pbmFsLl9zZWxlY3RlZC55MilcbiAgICBlbHNlXG4gICAgICByYXdUZXh0ID0gQHRlcm1pbmFsLmNvbnRleHQuZ2V0U2VsZWN0aW9uKCkudG9TdHJpbmcoKVxuICAgICAgcmF3TGluZXMgPSByYXdUZXh0LnNwbGl0KC9cXHI/XFxuL2cpXG4gICAgICBsaW5lcyA9IHJhd0xpbmVzLm1hcCAobGluZSkgLT5cbiAgICAgICAgbGluZS5yZXBsYWNlKC9cXHMvZywgXCIgXCIpLnRyaW1SaWdodCgpXG4gICAgICB0ZXh0ID0gbGluZXMuam9pbihcIlxcblwiKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlIHRleHRcblxuICBwYXN0ZTogLT5cbiAgICBAaW5wdXQgYXRvbS5jbGlwYm9hcmQucmVhZCgpXG5cbiAgaW5zZXJ0U2VsZWN0aW9uOiAoY3VzdG9tVGV4dCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIHJ1bkNvbW1hbmQgPSBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnRvZ2dsZXMucnVuSW5zZXJ0ZWRUZXh0JylcbiAgICBzZWxlY3Rpb25UZXh0ID0gJydcbiAgICBpZiBzZWxlY3Rpb24gPSBlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KClcbiAgICAgIEB0ZXJtaW5hbC5zdG9wU2Nyb2xsaW5nKClcbiAgICAgIHNlbGVjdGlvblRleHQgPSBzZWxlY3Rpb25cbiAgICBlbHNlIGlmIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgICBsaW5lID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGN1cnNvci5yb3cpXG4gICAgICBAdGVybWluYWwuc3RvcFNjcm9sbGluZygpXG4gICAgICBzZWxlY3Rpb25UZXh0ID0gbGluZVxuICAgICAgZWRpdG9yLm1vdmVEb3duKDEpO1xuICAgIEBpbnB1dCBcIiN7Y3VzdG9tVGV4dC5cbiAgICAgIHJlcGxhY2UoL1xcJEwvLCBcIiN7ZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93ICsgMX1cIikuXG4gICAgICByZXBsYWNlKC9cXCRGLywgcGF0aC5iYXNlbmFtZShlZGl0b3I/LmJ1ZmZlcj8uZmlsZT8ucGF0aCkpLlxuICAgICAgcmVwbGFjZSgvXFwkRC8sIHBhdGguZGlybmFtZShlZGl0b3I/LmJ1ZmZlcj8uZmlsZT8ucGF0aCkpLlxuICAgICAgcmVwbGFjZSgvXFwkUy8sIHNlbGVjdGlvblRleHQpLlxuICAgICAgcmVwbGFjZSgvXFwkXFwkLywgJyQnKX0je2lmIHJ1bkNvbW1hbmQgdGhlbiBvcy5FT0wgZWxzZSAnJ31cIlxuXG4gIGZvY3VzOiAoZnJvbVdpbmRvd0V2ZW50KSA9PlxuICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG4gICAgQGZvY3VzVGVybWluYWwoZnJvbVdpbmRvd0V2ZW50KVxuICAgIEBzdGF0dXNCYXIuc2V0QWN0aXZlVGVybWluYWxWaWV3KHRoaXMpXG4gICAgc3VwZXIoKVxuXG4gIGJsdXI6ID0+XG4gICAgQGJsdXJUZXJtaW5hbCgpXG4gICAgc3VwZXIoKVxuXG4gIGZvY3VzVGVybWluYWw6IChmcm9tV2luZG93RXZlbnQpID0+XG4gICAgcmV0dXJuIHVubGVzcyBAdGVybWluYWxcblxuICAgIGxhc3RBY3RpdmVFbGVtZW50ID0gJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxuICAgIHJldHVybiBpZiBmcm9tV2luZG93RXZlbnQgYW5kIG5vdCBsYXN0QWN0aXZlRWxlbWVudC5pcygnZGl2LnRlcm1pbmFsJylcblxuICAgIEB0ZXJtaW5hbC5mb2N1cygpXG4gICAgaWYgQHRlcm1pbmFsLl90ZXh0YXJlYVxuICAgICAgQHRlcm1pbmFsLl90ZXh0YXJlYS5mb2N1cygpXG4gICAgZWxzZVxuICAgICAgQHRlcm1pbmFsLmVsZW1lbnQuZm9jdXMoKVxuXG4gIGJsdXJUZXJtaW5hbDogPT5cbiAgICByZXR1cm4gdW5sZXNzIEB0ZXJtaW5hbFxuXG4gICAgQHRlcm1pbmFsLmJsdXIoKVxuICAgIEB0ZXJtaW5hbC5lbGVtZW50LmJsdXIoKVxuXG4gICAgaWYgbGFzdEFjdGl2ZUVsZW1lbnQ/XG4gICAgICBsYXN0QWN0aXZlRWxlbWVudC5mb2N1cygpXG5cbiAgcmVzaXplVGVybWluYWxUb1ZpZXc6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGFuZWwuaXNWaXNpYmxlKCkgb3IgQHRhYlZpZXdcblxuICAgIHtjb2xzLCByb3dzfSA9IEBnZXREaW1lbnNpb25zKClcbiAgICByZXR1cm4gdW5sZXNzIGNvbHMgPiAwIGFuZCByb3dzID4gMFxuICAgIHJldHVybiB1bmxlc3MgQHRlcm1pbmFsXG4gICAgcmV0dXJuIGlmIEB0ZXJtaW5hbC5yb3dzIGlzIHJvd3MgYW5kIEB0ZXJtaW5hbC5jb2xzIGlzIGNvbHNcblxuICAgIEByZXNpemUgY29scywgcm93c1xuICAgIEB0ZXJtaW5hbC5yZXNpemUgY29scywgcm93c1xuXG4gIGdldERpbWVuc2lvbnM6IC0+XG4gICAgZmFrZVJvdyA9ICQoXCI8ZGl2PjxzcGFuPiZuYnNwOzwvc3Bhbj48L2Rpdj5cIilcblxuICAgIGlmIEB0ZXJtaW5hbFxuICAgICAgQGZpbmQoJy50ZXJtaW5hbCcpLmFwcGVuZCBmYWtlUm93XG4gICAgICBmYWtlQ29sID0gZmFrZVJvdy5jaGlsZHJlbigpLmZpcnN0KClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGNvbHMgPSBNYXRoLmZsb29yIEB4dGVybS53aWR0aCgpIC8gKGZha2VDb2wud2lkdGggb3IgOSlcbiAgICAgIHJvd3MgPSBNYXRoLmZsb29yIEB4dGVybS5oZWlnaHQoKSAvIChmYWtlQ29sLmhlaWdodCBvciAyMClcbiAgICAgIEByb3dIZWlnaHQgPSBmYWtlQ29sLmhlaWdodFxuICAgICAgZmFrZVJvdy5yZW1vdmUoKVxuICAgIGVsc2VcbiAgICAgIGNvbHMgPSBNYXRoLmZsb29yIEB4dGVybS53aWR0aCgpIC8gOVxuICAgICAgcm93cyA9IE1hdGguZmxvb3IgQHh0ZXJtLmhlaWdodCgpIC8gMjBcblxuICAgIHtjb2xzLCByb3dzfVxuXG4gIG9uVHJhbnNpdGlvbkVuZDogKGNhbGxiYWNrKSAtPlxuICAgIEB4dGVybS5vbmUgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCA9PlxuICAgICAgY2FsbGJhY2soKVxuICAgICAgQGFuaW1hdGluZyA9IGZhbHNlXG5cbiAgaW5wdXREaWFsb2c6IC0+XG4gICAgSW5wdXREaWFsb2cgPz0gcmVxdWlyZSgnLi9pbnB1dC1kaWFsb2cnKVxuICAgIGRpYWxvZyA9IG5ldyBJbnB1dERpYWxvZyB0aGlzXG4gICAgZGlhbG9nLmF0dGFjaCgpXG5cbiAgcmVuYW1lOiAtPlxuICAgIEBzdGF0dXNJY29uLnJlbmFtZSgpXG5cbiAgdG9nZ2xlVGFiVmlldzogLT5cbiAgICBpZiBAdGFiVmlld1xuICAgICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoaXRlbTogdGhpcywgdmlzaWJsZTogZmFsc2UpXG4gICAgICBAYXR0YWNoUmVzaXplRXZlbnRzKClcbiAgICAgIEBjbG9zZUJ0bi5zaG93KClcbiAgICAgIEBoaWRlQnRuLnNob3coKVxuICAgICAgQG1heGltaXplQnRuLnNob3coKVxuICAgICAgQHRhYlZpZXcgPSBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBwYW5lbC5kZXN0cm95KClcbiAgICAgIEBkZXRhY2hSZXNpemVFdmVudHMoKVxuICAgICAgQGNsb3NlQnRuLmhpZGUoKVxuICAgICAgQGhpZGVCdG4uaGlkZSgpXG4gICAgICBAbWF4aW1pemVCdG4uaGlkZSgpXG4gICAgICBAeHRlcm0uY3NzIFwiaGVpZ2h0XCIsIFwiXCJcbiAgICAgIEB0YWJWaWV3ID0gdHJ1ZVxuICAgICAgbGFzdE9wZW5lZFZpZXcgPSBudWxsIGlmIGxhc3RPcGVuZWRWaWV3ID09IHRoaXNcblxuICBnZXRUaXRsZTogLT5cbiAgICBAc3RhdHVzSWNvbi5nZXROYW1lKCkgb3IgXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbFwiXG5cbiAgZ2V0SWNvbk5hbWU6IC0+XG4gICAgXCJ0ZXJtaW5hbFwiXG5cbiAgZ2V0U2hlbGw6IC0+XG4gICAgcmV0dXJuIHBhdGguYmFzZW5hbWUgQHNoZWxsXG5cbiAgZ2V0U2hlbGxQYXRoOiAtPlxuICAgIHJldHVybiBAc2hlbGxcblxuICBlbWl0OiAoZXZlbnQsIGRhdGEpIC0+XG4gICAgQGVtaXR0ZXIuZW1pdCBldmVudCwgZGF0YVxuXG4gIG9uRGlkQ2hhbmdlVGl0bGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS10aXRsZScsIGNhbGxiYWNrXG5cbiAgZ2V0UGF0aDogLT5cbiAgICByZXR1cm4gQGdldFRlcm1pbmFsVGl0bGUoKVxuXG4gIGdldFRlcm1pbmFsVGl0bGU6IC0+XG4gICAgcmV0dXJuIEB0aXRsZSBvciBAcHJvY2Vzc1xuXG4gIGdldFRlcm1pbmFsOiAtPlxuICAgIHJldHVybiBAdGVybWluYWxcblxuICBpc0FuaW1hdGluZzogLT5cbiAgICByZXR1cm4gQGFuaW1hdGluZ1xuIl19
