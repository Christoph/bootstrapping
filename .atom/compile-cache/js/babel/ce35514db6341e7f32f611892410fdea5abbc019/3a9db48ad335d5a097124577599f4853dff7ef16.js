Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.startWorker = startWorker;
exports.terminateWorker = terminateWorker;
exports.changeConfig = changeConfig;
exports.requestJob = requestJob;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _cryptoRandomString = require('crypto-random-string');

var _cryptoRandomString2 = _interopRequireDefault(_cryptoRandomString);

'use babel';

var workerInstance = undefined;

function startWorker(worker, config) {
  if (workerInstance !== worker) {
    workerInstance = worker;
    workerInstance.start(config);
  }
}

function terminateWorker() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}

function changeConfig(key, value) {
  if (workerInstance) {
    workerInstance.send({
      messageType: 'config',
      message: { key: key, value: value }
    });
  }
}

function requestJob(jobType, textEditor) {
  var emitKey = (0, _cryptoRandomString2['default'])(10);

  return new Promise(function (resolve, reject) {
    var errSub = workerInstance.on('task:error', function () {
      // Re-throw errors from the task
      var error = new Error(arguments[0]);
      // Set the stack to the one given to us by the worker
      error.stack = arguments[1];
      reject(error);
    });

    var responseSub = workerInstance.on(emitKey, function (data) {
      errSub.dispose();
      responseSub.dispose();
      resolve(data);
    });

    try {
      workerInstance.send({
        messageType: 'job',
        message: {
          emitKey: emitKey,
          jobType: jobType,
          content: textEditor.getText(),
          filePath: textEditor.getPath()
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL2xpbnRlci10c2xpbnQvbGliL3dvcmtlckhlbHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O2tDQUUrQixzQkFBc0I7Ozs7QUFGckQsV0FBVyxDQUFDOztBQUlaLElBQUksY0FBYyxZQUFBLENBQUM7O0FBRVosU0FBUyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRTtBQUMxQyxNQUFJLGNBQWMsS0FBSyxNQUFNLEVBQUU7QUFDN0Isa0JBQWMsR0FBRyxNQUFNLENBQUM7QUFDeEIsa0JBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7R0FDOUI7Q0FDRjs7QUFFTSxTQUFTLGVBQWUsR0FBRztBQUNoQyxNQUFJLGNBQWMsRUFBRTtBQUNsQixrQkFBYyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzNCLGtCQUFjLEdBQUcsSUFBSSxDQUFDO0dBQ3ZCO0NBQ0Y7O0FBRU0sU0FBUyxZQUFZLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUN2QyxNQUFJLGNBQWMsRUFBRTtBQUNsQixrQkFBYyxDQUFDLElBQUksQ0FBQztBQUNsQixpQkFBVyxFQUFFLFFBQVE7QUFDckIsYUFBTyxFQUFFLEVBQUUsR0FBRyxFQUFILEdBQUcsRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFO0tBQ3hCLENBQUMsQ0FBQztHQUNKO0NBQ0Y7O0FBRU0sU0FBUyxVQUFVLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRTtBQUM5QyxNQUFNLE9BQU8sR0FBRyxxQ0FBbUIsRUFBRSxDQUFDLENBQUM7O0FBRXZDLFNBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3RDLFFBQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVk7O0FBRXpELFVBQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLFVBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFaEMsV0FBSyxDQUFDLEtBQUssR0FBRyxVQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFlBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNmLENBQUMsQ0FBQzs7QUFFSCxRQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFDLElBQUksRUFBSztBQUN2RCxZQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDakIsaUJBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixhQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDZixDQUFDLENBQUM7O0FBRUgsUUFBSTtBQUNGLG9CQUFjLENBQUMsSUFBSSxDQUFDO0FBQ2xCLG1CQUFXLEVBQUUsS0FBSztBQUNsQixlQUFPLEVBQUU7QUFDUCxpQkFBTyxFQUFQLE9BQU87QUFDUCxpQkFBTyxFQUFQLE9BQU87QUFDUCxpQkFBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUU7QUFDN0Isa0JBQVEsRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFO1NBQy9CO09BQ0YsQ0FBQyxDQUFDO0tBQ0osQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLFlBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNYO0dBQ0YsQ0FBQyxDQUFDO0NBQ0oiLCJmaWxlIjoiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvbGludGVyLXRzbGludC9saWIvd29ya2VySGVscGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCBjcnlwdG9SYW5kb21TdHJpbmcgZnJvbSAnY3J5cHRvLXJhbmRvbS1zdHJpbmcnO1xuXG5sZXQgd29ya2VySW5zdGFuY2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFdvcmtlcih3b3JrZXIsIGNvbmZpZykge1xuICBpZiAod29ya2VySW5zdGFuY2UgIT09IHdvcmtlcikge1xuICAgIHdvcmtlckluc3RhbmNlID0gd29ya2VyO1xuICAgIHdvcmtlckluc3RhbmNlLnN0YXJ0KGNvbmZpZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlcm1pbmF0ZVdvcmtlcigpIHtcbiAgaWYgKHdvcmtlckluc3RhbmNlKSB7XG4gICAgd29ya2VySW5zdGFuY2UudGVybWluYXRlKCk7XG4gICAgd29ya2VySW5zdGFuY2UgPSBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VDb25maWcoa2V5LCB2YWx1ZSkge1xuICBpZiAod29ya2VySW5zdGFuY2UpIHtcbiAgICB3b3JrZXJJbnN0YW5jZS5zZW5kKHtcbiAgICAgIG1lc3NhZ2VUeXBlOiAnY29uZmlnJyxcbiAgICAgIG1lc3NhZ2U6IHsga2V5LCB2YWx1ZSB9LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0Sm9iKGpvYlR5cGUsIHRleHRFZGl0b3IpIHtcbiAgY29uc3QgZW1pdEtleSA9IGNyeXB0b1JhbmRvbVN0cmluZygxMCk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBlcnJTdWIgPSB3b3JrZXJJbnN0YW5jZS5vbigndGFzazplcnJvcicsICguLi5lcnIpID0+IHtcbiAgICAgIC8vIFJlLXRocm93IGVycm9ycyBmcm9tIHRoZSB0YXNrXG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihlcnJbMF0pO1xuICAgICAgLy8gU2V0IHRoZSBzdGFjayB0byB0aGUgb25lIGdpdmVuIHRvIHVzIGJ5IHRoZSB3b3JrZXJcbiAgICAgIGVycm9yLnN0YWNrID0gZXJyWzFdO1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc3BvbnNlU3ViID0gd29ya2VySW5zdGFuY2Uub24oZW1pdEtleSwgKGRhdGEpID0+IHtcbiAgICAgIGVyclN1Yi5kaXNwb3NlKCk7XG4gICAgICByZXNwb25zZVN1Yi5kaXNwb3NlKCk7XG4gICAgICByZXNvbHZlKGRhdGEpO1xuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIHdvcmtlckluc3RhbmNlLnNlbmQoe1xuICAgICAgICBtZXNzYWdlVHlwZTogJ2pvYicsXG4gICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICBlbWl0S2V5LFxuICAgICAgICAgIGpvYlR5cGUsXG4gICAgICAgICAgY29udGVudDogdGV4dEVkaXRvci5nZXRUZXh0KCksXG4gICAgICAgICAgZmlsZVBhdGg6IHRleHRFZGl0b3IuZ2V0UGF0aCgpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfSk7XG59XG4iXX0=