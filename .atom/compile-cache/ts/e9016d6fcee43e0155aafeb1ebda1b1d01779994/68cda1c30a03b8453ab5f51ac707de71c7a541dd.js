var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require("atom-space-pen-views");
var View = (function (_super) {
    __extends(View, _super);
    function View(options) {
        _super.call(this);
        this.options = options;
        this.init();
    }
    Object.defineProperty(View.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    View.content = function () {
        throw new Error("Must override the base View static content member");
    };
    View.prototype.init = function () {
    };
    return View;
})(sp.View);
exports.View = View;
exports.$ = sp.$;
var ScrollView = (function (_super) {
    __extends(ScrollView, _super);
    function ScrollView(options) {
        _super.call(this);
        this.options = options;
        this.init();
    }
    Object.defineProperty(ScrollView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ScrollView.content = function () {
        throw new Error("Must override the base View static content member");
    };
    ScrollView.prototype.init = function () {
    };
    return ScrollView;
})(sp.ScrollView);
exports.ScrollView = ScrollView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3Mvdmlldy50cyIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3Mvdmlldy50cyJdLCJuYW1lcyI6WyJWaWV3IiwiVmlldy5jb25zdHJ1Y3RvciIsIlZpZXcuJCIsIlZpZXcuY29udGVudCIsIlZpZXcuaW5pdCIsIlNjcm9sbFZpZXciLCJTY3JvbGxWaWV3LmNvbnN0cnVjdG9yIiwiU2Nyb2xsVmlldy4kIiwiU2Nyb2xsVmlldy5jb250ZW50IiwiU2Nyb2xsVmlldy5pbml0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFPLEVBQUUsV0FBVyxzQkFBc0IsQ0FBQyxDQUFBO0FBRTNDLElBQWEsSUFBSTtJQUFrQkEsVUFBdEJBLElBQUlBLFVBQXlCQTtJQVN4Q0EsU0FUV0EsSUFBSUEsQ0FTSUEsT0FBZ0JBO1FBQ2pDQyxpQkFBT0EsQ0FBQUE7UUFEVUEsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBU0E7UUFFakNBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUFBO0lBQ2JBLENBQUNBO0lBWERELHNCQUFJQSxtQkFBQ0E7YUFBTEE7WUFDRUUsTUFBTUEsQ0FBTUEsSUFBSUEsQ0FBQUE7UUFDbEJBLENBQUNBOzs7T0FBQUY7SUFFTUEsWUFBT0EsR0FBZEE7UUFDRUcsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsbURBQW1EQSxDQUFDQSxDQUFBQTtJQUN0RUEsQ0FBQ0E7SUFNREgsbUJBQUlBLEdBQUpBO0lBQVFJLENBQUNBO0lBQ1hKLFdBQUNBO0FBQURBLENBQUNBLEFBZEQsRUFBbUMsRUFBRSxDQUFDLElBQUksRUFjekM7QUFkWSxZQUFJLEdBQUosSUFjWixDQUFBO0FBRVUsU0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFFbkIsSUFBYSxVQUFVO0lBQWtCSyxVQUE1QkEsVUFBVUEsVUFBK0JBO0lBU3BEQSxTQVRXQSxVQUFVQSxDQVNGQSxPQUFnQkE7UUFDakNDLGlCQUFPQSxDQUFBQTtRQURVQSxZQUFPQSxHQUFQQSxPQUFPQSxDQUFTQTtRQUVqQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQUE7SUFDYkEsQ0FBQ0E7SUFYREQsc0JBQUlBLHlCQUFDQTthQUFMQTtZQUNFRSxNQUFNQSxDQUFNQSxJQUFJQSxDQUFBQTtRQUNsQkEsQ0FBQ0E7OztPQUFBRjtJQUVNQSxrQkFBT0EsR0FBZEE7UUFDRUcsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsbURBQW1EQSxDQUFDQSxDQUFBQTtJQUN0RUEsQ0FBQ0E7SUFNREgseUJBQUlBLEdBQUpBO0lBQVFJLENBQUNBO0lBQ1hKLGlCQUFDQTtBQUFEQSxDQUFDQSxBQWRELEVBQXlDLEVBQUUsQ0FBQyxVQUFVLEVBY3JEO0FBZFksa0JBQVUsR0FBVixVQWNaLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3AgPSByZXF1aXJlKFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIilcblxuZXhwb3J0IGNsYXNzIFZpZXc8T3B0aW9ucz4gZXh0ZW5kcyBzcC5WaWV3IHtcbiAgZ2V0ICQoKTogSlF1ZXJ5IHtcbiAgICByZXR1cm4gPGFueT50aGlzXG4gIH1cblxuICBzdGF0aWMgY29udGVudCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IG92ZXJyaWRlIHRoZSBiYXNlIFZpZXcgc3RhdGljIGNvbnRlbnQgbWVtYmVyXCIpXG4gIH1cblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgb3B0aW9uczogT3B0aW9ucykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLmluaXQoKVxuICB9XG4gIGluaXQoKSB7fVxufVxuXG5leHBvcnQgdmFyICQgPSBzcC4kXG5cbmV4cG9ydCBjbGFzcyBTY3JvbGxWaWV3PE9wdGlvbnM+IGV4dGVuZHMgc3AuU2Nyb2xsVmlldyB7XG4gIGdldCAkKCk6IEpRdWVyeSB7XG4gICAgcmV0dXJuIDxhbnk+dGhpc1xuICB9XG5cbiAgc3RhdGljIGNvbnRlbnQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBvdmVycmlkZSB0aGUgYmFzZSBWaWV3IHN0YXRpYyBjb250ZW50IG1lbWJlclwiKVxuICB9XG5cbiAgY29uc3RydWN0b3IocHVibGljIG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5pbml0KClcbiAgfVxuICBpbml0KCkge31cbn1cbiJdfQ==