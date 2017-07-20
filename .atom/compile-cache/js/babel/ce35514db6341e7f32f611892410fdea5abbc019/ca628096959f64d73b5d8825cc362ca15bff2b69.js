Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.$range = $range;
exports.$file = $file;
exports.copySelection = copySelection;
exports.getPathOfMessage = getPathOfMessage;
exports.getEditorsMap = getEditorsMap;
exports.filterMessages = filterMessages;
exports.filterMessagesByRangeOrPoint = filterMessagesByRangeOrPoint;
exports.visitMessage = visitMessage;
exports.openExternally = openExternally;
exports.sortMessages = sortMessages;
exports.sortSolutions = sortSolutions;
exports.applySolution = applySolution;

var _atom = require('atom');

var _electron = require('electron');

var severityScore = {
  error: 3,
  warning: 2,
  info: 1
};

exports.severityScore = severityScore;
var severityNames = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info'
};
exports.severityNames = severityNames;
var WORKSPACE_URI = 'atom://linter-ui-default';

exports.WORKSPACE_URI = WORKSPACE_URI;

function $range(message) {
  return message.version === 1 ? message.range : message.location.position;
}

function $file(message) {
  return message.version === 1 ? message.filePath : message.location.file;
}

function copySelection() {
  var selection = getSelection();
  if (selection) {
    atom.clipboard.write(selection.toString());
  }
}

function getPathOfMessage(message) {
  return atom.project.relativizePath($file(message) || '')[1];
}

function getEditorsMap(editors) {
  var editorsMap = {};
  var filePaths = [];
  for (var entry of editors.editors) {
    var filePath = entry.textEditor.getPath();
    if (editorsMap[filePath]) {
      editorsMap[filePath].editors.push(entry);
    } else {
      editorsMap[filePath] = {
        added: [],
        removed: [],
        editors: [entry]
      };
      filePaths.push(filePath);
    }
  }
  return { editorsMap: editorsMap, filePaths: filePaths };
}

function filterMessages(messages, filePath) {
  var severity = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var filtered = [];
  messages.forEach(function (message) {
    if ((filePath === null || $file(message) === filePath) && (!severity || message.severity === severity)) {
      filtered.push(message);
    }
  });
  return filtered;
}

function filterMessagesByRangeOrPoint(messages, filePath, rangeOrPoint) {
  var filtered = [];
  var expectedRange = rangeOrPoint.constructor.name === 'Point' ? new _atom.Range(rangeOrPoint, rangeOrPoint) : _atom.Range.fromObject(rangeOrPoint);
  messages.forEach(function (message) {
    var file = $file(message);
    var range = $range(message);
    if (file && range && file === filePath && range.intersectsWith(expectedRange)) {
      filtered.push(message);
    }
  });
  return filtered;
}

function visitMessage(message) {
  var reference = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  var messageFile = undefined;
  var messagePosition = undefined;
  if (reference) {
    if (message.version !== 2) {
      console.warn('[Linter-UI-Default] Only messages v2 are allowed in jump to reference. Ignoring');
      return;
    }
    if (!message.reference || !message.reference.file) {
      console.warn('[Linter-UI-Default] Message does not have a valid reference. Ignoring');
      return;
    }
    messageFile = message.reference.file;
    messagePosition = message.reference.position;
  } else {
    var messageRange = $range(message);
    messageFile = $file(message);
    if (messageRange) {
      messagePosition = messageRange.start;
    }
  }
  atom.workspace.open(messageFile, { searchAllPanes: true }).then(function () {
    var textEditor = atom.workspace.getActiveTextEditor();
    if (messagePosition && textEditor && textEditor.getPath() === messageFile) {
      textEditor.setCursorBufferPosition(messagePosition);
    }
  });
}

function openExternally(message) {
  if (message.version === 2 && message.url) {
    _electron.shell.openExternal(message.url);
  }
}

function sortMessages(sortInfo, rows) {
  var sortColumns = {};

  sortInfo.forEach(function (entry) {
    sortColumns[entry.column] = entry.type;
  });

  return rows.slice().sort(function (a, b) {
    if (sortColumns.severity) {
      var multiplyWith = sortColumns.severity === 'asc' ? 1 : -1;
      var severityA = severityScore[a.severity];
      var severityB = severityScore[b.severity];
      if (severityA !== severityB) {
        return multiplyWith * (severityA > severityB ? 1 : -1);
      }
    }
    if (sortColumns.linterName) {
      var multiplyWith = sortColumns.linterName === 'asc' ? 1 : -1;
      var sortValue = a.severity.localeCompare(b.severity);
      if (sortValue !== 0) {
        return multiplyWith * sortValue;
      }
    }
    if (sortColumns.file) {
      var multiplyWith = sortColumns.file === 'asc' ? 1 : -1;
      var fileA = getPathOfMessage(a);
      var fileALength = fileA.length;
      var fileB = getPathOfMessage(b);
      var fileBLength = fileB.length;
      if (fileALength !== fileBLength) {
        return multiplyWith * (fileALength > fileBLength ? 1 : -1);
      } else if (fileA !== fileB) {
        return multiplyWith * fileA.localeCompare(fileB);
      }
    }
    if (sortColumns.line) {
      var multiplyWith = sortColumns.line === 'asc' ? 1 : -1;
      var rangeA = $range(a);
      var rangeB = $range(b);
      if (rangeA && !rangeB) {
        return 1;
      } else if (rangeB && !rangeA) {
        return -1;
      } else if (rangeA && rangeB) {
        if (rangeA.start.row !== rangeB.start.row) {
          return multiplyWith * (rangeA.start.row > rangeB.start.row ? 1 : -1);
        }
        if (rangeA.start.column !== rangeB.start.column) {
          return multiplyWith * (rangeA.start.column > rangeB.start.column ? 1 : -1);
        }
      }
    }

    return 0;
  });
}

function sortSolutions(solutions) {
  return solutions.slice().sort(function (a, b) {
    return b.priority - a.priority;
  });
}

function applySolution(textEditor, version, solution) {
  if (solution.apply) {
    solution.apply();
    return true;
  }
  var range = version === 1 ? solution.range : solution.position;
  var currentText = version === 1 ? solution.oldText : solution.currentText;
  var replaceWith = version === 1 ? solution.newText : solution.replaceWith;
  if (currentText) {
    var textInRange = textEditor.getTextInBufferRange(range);
    if (currentText !== textInRange) {
      console.warn('[linter-ui-default] Not applying fix because text did not match the expected one', 'expected', currentText, 'but got', textInRange);
      return false;
    }
  }
  textEditor.setTextInBufferRange(range, replaceWith);
  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7b0JBRXNCLE1BQU07O3dCQUNOLFVBQVU7O0FBS3pCLElBQU0sYUFBYSxHQUFHO0FBQzNCLE9BQUssRUFBRSxDQUFDO0FBQ1IsU0FBTyxFQUFFLENBQUM7QUFDVixNQUFJLEVBQUUsQ0FBQztDQUNSLENBQUE7OztBQUVNLElBQU0sYUFBYSxHQUFHO0FBQzNCLE9BQUssRUFBRSxPQUFPO0FBQ2QsU0FBTyxFQUFFLFNBQVM7QUFDbEIsTUFBSSxFQUFFLE1BQU07Q0FDYixDQUFBOztBQUNNLElBQU0sYUFBYSxHQUFHLDBCQUEwQixDQUFBOzs7O0FBRWhELFNBQVMsTUFBTSxDQUFDLE9BQXNCLEVBQVc7QUFDdEQsU0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFBO0NBQ3pFOztBQUNNLFNBQVMsS0FBSyxDQUFDLE9BQXNCLEVBQVc7QUFDckQsU0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFBO0NBQ3hFOztBQUNNLFNBQVMsYUFBYSxHQUFHO0FBQzlCLE1BQU0sU0FBUyxHQUFHLFlBQVksRUFBRSxDQUFBO0FBQ2hDLE1BQUksU0FBUyxFQUFFO0FBQ2IsUUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7R0FDM0M7Q0FDRjs7QUFDTSxTQUFTLGdCQUFnQixDQUFDLE9BQXNCLEVBQVU7QUFDL0QsU0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMs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QUFLLENBQUE7S0FDYjtHQUNGO0FBQ0QsWUFBVSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUNuRCxTQUFPLElBQUksQ0FBQTtDQUNaIiwiZmlsZSI6Ii9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9oZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgUmFuZ2UgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgc2hlbGwgfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCB0eXBlIHsgUG9pbnQsIFRleHRFZGl0b3IgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgRWRpdG9ycyBmcm9tICcuL2VkaXRvcnMnXG5pbXBvcnQgdHlwZSB7IExpbnRlck1lc3NhZ2UgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY29uc3Qgc2V2ZXJpdHlTY29yZSA9IHtcbiAgZXJyb3I6IDMsXG4gIHdhcm5pbmc6IDIsXG4gIGluZm86IDEsXG59XG5cbmV4cG9ydCBjb25zdCBzZXZlcml0eU5hbWVzID0ge1xuICBlcnJvcjogJ0Vycm9yJyxcbiAgd2FybmluZzogJ1dhcm5pbmcnLFxuICBpbmZvOiAnSW5mbycsXG59XG5leHBvcnQgY29uc3QgV09SS1NQQUNFX1VSSSA9ICdhdG9tOi8vbGludGVyLXVpLWRlZmF1bHQnXG5cbmV4cG9ydCBmdW5jdGlvbiAkcmFuZ2UobWVzc2FnZTogTGludGVyTWVzc2FnZSk6ID9PYmplY3Qge1xuICByZXR1cm4gbWVzc2FnZS52ZXJzaW9uID09PSAxID8gbWVzc2FnZS5yYW5nZSA6IG1lc3NhZ2UubG9jYXRpb24ucG9zaXRpb25cbn1cbmV4cG9ydCBmdW5jdGlvbiAkZmlsZShtZXNzYWdlOiBMaW50ZXJNZXNzYWdlKTogP3N0cmluZyB7XG4gIHJldHVybiBtZXNzYWdlLnZlcnNpb24gPT09IDEgPyBtZXNzYWdlLmZpbGVQYXRoIDogbWVzc2FnZS5sb2NhdGlvbi5maWxlXG59XG5leHBvcnQgZnVuY3Rpb24gY29weVNlbGVjdGlvbigpIHtcbiAgY29uc3Qgc2VsZWN0aW9uID0gZ2V0U2VsZWN0aW9uKClcbiAgaWYgKHNlbGVjdGlvbikge1xuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHNlbGVjdGlvbi50b1N0cmluZygpKVxuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGF0aE9mTWVzc2FnZShtZXNzYWdlOiBMaW50ZXJNZXNzYWdlKTogc3RyaW5nIHtcbiAgcmV0dXJuIGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCgkZmlsZShtZXNzYWdlKSB8fCAnJylbMV1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVkaXRvcnNNYXAoZWRpdG9yczogRWRpdG9ycyk6IHsgZWRpdG9yc01hcDogT2JqZWN0LCBmaWxlUGF0aHM6IEFycmF5PHN0cmluZz4gfSB7XG4gIGNvbnN0IGVkaXRvcnNNYXAgPSB7fVxuICBjb25zdCBmaWxlUGF0aHMgPSBbXVxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVkaXRvcnMuZWRpdG9ycykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gZW50cnkudGV4dEVkaXRvci5nZXRQYXRoKClcbiAgICBpZiAoZWRpdG9yc01hcFtmaWxlUGF0aF0pIHtcbiAgICAgIGVkaXRvcnNNYXBbZmlsZVBhdGhdLmVkaXRvcnMucHVzaChlbnRyeSlcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdG9yc01hcFtmaWxlUGF0aF0gPSB7XG4gICAgICAgIGFkZGVkOiBbXSxcbiAgICAgICAgcmVtb3ZlZDogW10sXG4gICAgICAgIGVkaXRvcnM6IFtlbnRyeV0sXG4gICAgICB9XG4gICAgICBmaWxlUGF0aHMucHVzaChmaWxlUGF0aClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgZWRpdG9yc01hcCwgZmlsZVBhdGhzIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlck1lc3NhZ2VzKG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPiwgZmlsZVBhdGg6ID9zdHJpbmcsIHNldmVyaXR5OiA/c3RyaW5nID0gbnVsbCk6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3QgZmlsdGVyZWQgPSBbXVxuICBtZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBpZiAoKGZpbGVQYXRoID09PSBudWxsIHx8ICRmaWxlKG1lc3NhZ2UpID09PSBmaWxlUGF0aCkgJiYgKCFzZXZlcml0eSB8fCBtZXNzYWdlLnNldmVyaXR5ID09PSBzZXZlcml0eSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobWVzc2FnZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBmaWx0ZXJlZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTWVzc2FnZXNCeVJhbmdlT3JQb2ludChtZXNzYWdlczogU2V0PExpbnRlck1lc3NhZ2U+IHwgQXJyYXk8TGludGVyTWVzc2FnZT4sIGZpbGVQYXRoOiBzdHJpbmcsIHJhbmdlT3JQb2ludDogUG9pbnQgfCBSYW5nZSk6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3QgZmlsdGVyZWQgPSBbXVxuICBjb25zdCBleHBlY3RlZFJhbmdlID0gcmFuZ2VPclBvaW50LmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQb2ludCcgPyBuZXcgUmFuZ2UocmFuZ2VPclBvaW50LCByYW5nZU9yUG9pbnQpIDogUmFuZ2UuZnJvbU9iamVjdChyYW5nZU9yUG9pbnQpXG4gIG1lc3NhZ2VzLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnN0IGZpbGUgPSAkZmlsZShtZXNzYWdlKVxuICAgIGNvbnN0IHJhbmdlID0gJHJhbmdlKG1lc3NhZ2UpXG4gICAgaWYgKGZpbGUgJiYgcmFuZ2UgJiYgZmlsZSA9PT0gZmlsZVBhdGggJiYgcmFuZ2UuaW50ZXJzZWN0c1dpdGgoZXhwZWN0ZWRSYW5nZSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobWVzc2FnZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBmaWx0ZXJlZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRNZXNzYWdlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UsIHJlZmVyZW5jZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGxldCBtZXNzYWdlRmlsZVxuICBsZXQgbWVzc2FnZVBvc2l0aW9uXG4gIGlmIChyZWZlcmVuY2UpIHtcbiAgICBpZiAobWVzc2FnZS52ZXJzaW9uICE9PSAyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tMaW50ZXItVUktRGVmYXVsdF0gT25seSBtZXNzYWdlcyB2MiBhcmUgYWxsb3dlZCBpbiBqdW1wIHRvIHJlZmVyZW5jZS4gSWdub3JpbmcnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5yZWZlcmVuY2UgfHwgIW1lc3NhZ2UucmVmZXJlbmNlLmZpbGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignW0xpbnRlci1VSS1EZWZhdWx0XSBNZXNzYWdlIGRvZXMgbm90IGhhdmUgYSB2YWxpZCByZWZlcmVuY2UuIElnbm9yaW5nJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBtZXNzYWdlRmlsZSA9IG1lc3NhZ2UucmVmZXJlbmNlLmZpbGVcbiAgICBtZXNzYWdlUG9zaXRpb24gPSBtZXNzYWdlLnJlZmVyZW5jZS5wb3NpdGlvblxuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1lc3NhZ2VSYW5nZSA9ICRyYW5nZShtZXNzYWdlKVxuICAgIG1lc3NhZ2VGaWxlID0gJGZpbGUobWVzc2FnZSlcbiAgICBpZiAobWVzc2FnZVJhbmdlKSB7XG4gICAgICBtZXNzYWdlUG9zaXRpb24gPSBtZXNzYWdlUmFuZ2Uuc3RhcnRcbiAgICB9XG4gIH1cbiAgYXRvbS53b3Jrc3BhY2Uub3BlbihtZXNzYWdlRmlsZSwgeyBzZWFyY2hBbGxQYW5lczogdHJ1ZSB9KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAobWVzc2FnZVBvc2l0aW9uICYmIHRleHRFZGl0b3IgJiYgdGV4dEVkaXRvci5nZXRQYXRoKCkgPT09IG1lc3NhZ2VGaWxlKSB7XG4gICAgICB0ZXh0RWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKG1lc3NhZ2VQb3NpdGlvbilcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcGVuRXh0ZXJuYWxseShtZXNzYWdlOiBMaW50ZXJNZXNzYWdlKTogdm9pZCB7XG4gIGlmIChtZXNzYWdlLnZlcnNpb24gPT09IDIgJiYgbWVzc2FnZS51cmwpIHtcbiAgICBzaGVsbC5vcGVuRXh0ZXJuYWwobWVzc2FnZS51cmwpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRNZXNzYWdlcyhzb3J0SW5mbzogQXJyYXk8eyBjb2x1bW46IHN0cmluZywgdHlwZTogJ2FzYycgfCAnZGVzYycgfT4sIHJvd3M6IEFycmF5PExpbnRlck1lc3NhZ2U+KTogQXJyYXk8TGludGVyTWVzc2FnZT4ge1xuICBjb25zdCBzb3J0Q29sdW1ucyA6IHtcbiAgICBzZXZlcml0eT86ICdhc2MnIHwgJ2Rlc2MnLFxuICAgIGxpbnRlck5hbWU/OiAnYXNjJyB8ICdkZXNjJyxcbiAgICBmaWxlPzogJ2FzYycgfCAnZGVzYycsXG4gICAgbGluZT86ICdhc2MnIHwgJ2Rlc2MnXG4gIH0gPSB7fVxuXG4gIHNvcnRJbmZvLmZvckVhY2goZnVuY3Rpb24oZW50cnkpIHtcbiAgICBzb3J0Q29sdW1uc1tlbnRyeS5jb2x1bW5dID0gZW50cnkudHlwZVxuICB9KVxuXG4gIHJldHVybiByb3dzLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgaWYgKHNvcnRDb2x1bW5zLnNldmVyaXR5KSB7XG4gICAgICBjb25zdCBtdWx0aXBseVdpdGggPSBzb3J0Q29sdW1ucy5zZXZlcml0eSA9PT0gJ2FzYycgPyAxIDogLTFcbiAgICAgIGNvbnN0IHNldmVyaXR5QSA9IHNldmVyaXR5U2NvcmVbYS5zZXZlcml0eV1cbiAgICAgIGNvbnN0IHNldmVyaXR5QiA9IHNldmVyaXR5U2NvcmVbYi5zZXZlcml0eV1cbiAgICAgIGlmIChzZXZlcml0eUEgIT09IHNldmVyaXR5Qikge1xuICAgICAgICByZXR1cm4gbXVsdGlwbHlXaXRoICogKHNldmVyaXR5QSA+IHNldmVyaXR5QiA/IDEgOiAtMSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNvcnRDb2x1bW5zLmxpbnRlck5hbWUpIHtcbiAgICAgIGNvbnN0IG11bHRpcGx5V2l0aCA9IHNvcnRDb2x1bW5zLmxpbnRlck5hbWUgPT09ICdhc2MnID8gMSA6IC0xXG4gICAgICBjb25zdCBzb3J0VmFsdWUgPSBhLnNldmVyaXR5LmxvY2FsZUNvbXBhcmUoYi5zZXZlcml0eSlcbiAgICAgIGlmIChzb3J0VmFsdWUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIHNvcnRWYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc29ydENvbHVtbnMuZmlsZSkge1xuICAgICAgY29uc3QgbXVsdGlwbHlXaXRoID0gc29ydENvbHVtbnMuZmlsZSA9PT0gJ2FzYycgPyAxIDogLTFcbiAgICAgIGNvbnN0IGZpbGVBID0gZ2V0UGF0aE9mTWVzc2FnZShhKVxuICAgICAgY29uc3QgZmlsZUFMZW5ndGggPSBmaWxlQS5sZW5ndGhcbiAgICAgIGNvbnN0IGZpbGVCID0gZ2V0UGF0aE9mTWVzc2FnZShiKVxuICAgICAgY29uc3QgZmlsZUJMZW5ndGggPSBmaWxlQi5sZW5ndGhcbiAgICAgIGlmIChmaWxlQUxlbmd0aCAhPT0gZmlsZUJMZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIChmaWxlQUxlbmd0aCA+IGZpbGVCTGVuZ3RoID8gMSA6IC0xKVxuICAgICAgfSBlbHNlIGlmIChmaWxlQSAhPT0gZmlsZUIpIHtcbiAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIGZpbGVBLmxvY2FsZUNvbXBhcmUoZmlsZUIpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzb3J0Q29sdW1ucy5saW5lKSB7XG4gICAgICBjb25zdCBtdWx0aXBseVdpdGggPSBzb3J0Q29sdW1ucy5saW5lID09PSAnYXNjJyA/IDEgOiAtMVxuICAgICAgY29uc3QgcmFuZ2VBID0gJHJhbmdlKGEpXG4gICAgICBjb25zdCByYW5nZUIgPSAkcmFuZ2UoYilcbiAgICAgIGlmIChyYW5nZUEgJiYgIXJhbmdlQikge1xuICAgICAgICByZXR1cm4gMVxuICAgICAgfSBlbHNlIGlmIChyYW5nZUIgJiYgIXJhbmdlQSkge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH0gZWxzZSBpZiAocmFuZ2VBICYmIHJhbmdlQikge1xuICAgICAgICBpZiAocmFuZ2VBLnN0YXJ0LnJvdyAhPT0gcmFuZ2VCLnN0YXJ0LnJvdykge1xuICAgICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiAocmFuZ2VBLnN0YXJ0LnJvdyA+IHJhbmdlQi5zdGFydC5yb3cgPyAxIDogLTEpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJhbmdlQS5zdGFydC5jb2x1bW4gIT09IHJhbmdlQi5zdGFydC5jb2x1bW4pIHtcbiAgICAgICAgICByZXR1cm4gbXVsdGlwbHlXaXRoICogKHJhbmdlQS5zdGFydC5jb2x1bW4gPiByYW5nZUIuc3RhcnQuY29sdW1uID8gMSA6IC0xKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIDBcbiAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRTb2x1dGlvbnMoc29sdXRpb25zOiBBcnJheTxPYmplY3Q+KTogQXJyYXk8T2JqZWN0PiB7XG4gIHJldHVybiBzb2x1dGlvbnMuc2xpY2UoKS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYi5wcmlvcml0eSAtIGEucHJpb3JpdHlcbiAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U29sdXRpb24odGV4dEVkaXRvcjogVGV4dEVkaXRvciwgdmVyc2lvbjogMSB8IDIsIHNvbHV0aW9uOiBPYmplY3QpOiBib29sZWFuIHtcbiAgaWYgKHNvbHV0aW9uLmFwcGx5KSB7XG4gICAgc29sdXRpb24uYXBwbHkoKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgY29uc3QgcmFuZ2UgPSB2ZXJzaW9uID09PSAxID8gc29sdXRpb24ucmFuZ2UgOiBzb2x1dGlvbi5wb3NpdGlvblxuICBjb25zdCBjdXJyZW50VGV4dCA9IHZlcnNpb24gPT09IDEgPyBzb2x1dGlvbi5vbGRUZXh0IDogc29sdXRpb24uY3VycmVudFRleHRcbiAgY29uc3QgcmVwbGFjZVdpdGggPSB2ZXJzaW9uID09PSAxID8gc29sdXRpb24ubmV3VGV4dCA6IHNvbHV0aW9uLnJlcGxhY2VXaXRoXG4gIGlmIChjdXJyZW50VGV4dCkge1xuICAgIGNvbnN0IHRleHRJblJhbmdlID0gdGV4dEVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBpZiAoY3VycmVudFRleHQgIT09IHRleHRJblJhbmdlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tsaW50ZXItdWktZGVmYXVsdF0gTm90IGFwcGx5aW5nIGZpeCBiZWNhdXNlIHRleHQgZGlkIG5vdCBtYXRjaCB0aGUgZXhwZWN0ZWQgb25lJywgJ2V4cGVjdGVkJywgY3VycmVudFRleHQsICdidXQgZ290JywgdGV4dEluUmFuZ2UpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgdGV4dEVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgcmVwbGFjZVdpdGgpXG4gIHJldHVybiB0cnVlXG59XG4iXX0=