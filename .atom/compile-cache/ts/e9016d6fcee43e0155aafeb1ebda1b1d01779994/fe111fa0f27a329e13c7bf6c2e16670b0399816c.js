// Some docs
// http://www.html5rocks.com/en/tutorials/webcomponents/customelements/ (look at lifecycle callback methods)
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TsView = (function (_super) {
    __extends(TsView, _super);
    function TsView() {
        _super.apply(this, arguments);
    }
    TsView.prototype.createdCallback = function () {
        var preview = this.innerText;
        this.innerText = "";
        // Based on markdown editor
        // https://github.com/atom/markdown-preview/blob/2bcbadac3980f1aeb455f7078bd1fdfb4e6fe6b1/lib/renderer.coffee#L111
        var editorElement = (this.editorElement = document.createElement("atom-text-editor"));
        editorElement.setAttributeNode(document.createAttribute("gutter-hidden"));
        editorElement.removeAttribute("tabindex"); // make read-only
        var editor = (this.editor = editorElement.getModel());
        editor.getDecorations({ class: "cursor-line", type: "line" })[0].destroy(); // remove the default selection of a line in each editor
        editor.setText(preview);
        var grammar = atom.grammars.grammarForScopeName("source.tsx");
        editor.setGrammar(grammar);
        editor.setSoftWrapped(true);
        this.appendChild(editorElement);
    };
    // API
    TsView.prototype.text = function (text) {
        this.editor.setText(text);
    };
    return TsView;
})(HTMLElement);
exports.TsView = TsView;
;
document.registerElement("ts-view", TsView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vY29tcG9uZW50cy90c1ZpZXcudHMiLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL2NvbXBvbmVudHMvdHNWaWV3LnRzIl0sIm5hbWVzIjpbIlRzVmlldyIsIlRzVmlldy5jb25zdHJ1Y3RvciIsIlRzVmlldy5jcmVhdGVkQ2FsbGJhY2siLCJUc1ZpZXcudGV4dCJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWTtBQUNaLDRHQUE0Rzs7Ozs7OztBQUU1RyxJQUFhLE1BQU07SUFBU0EsVUFBZkEsTUFBTUEsVUFBb0JBO0lBQXZDQSxTQUFhQSxNQUFNQTtRQUFTQyw4QkFBV0E7SUEwQnZDQSxDQUFDQTtJQXZCQ0QsZ0NBQWVBLEdBQWZBO1FBQ0VFLElBQUlBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLENBQUFBO1FBQzVCQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFBQTtRQUluQkEsQUFGQUEsMkJBQTJCQTtRQUMzQkEsa0hBQWtIQTtZQUM5R0EsYUFBYUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsR0FBR0EsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxDQUFDQSxDQUFBQTtRQUNyRkEsYUFBYUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxRQUFRQSxDQUFDQSxlQUFlQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQSxDQUFBQTtRQUN6RUEsYUFBYUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsRUFBQ0EsaUJBQWlCQTtRQUMzREEsSUFBSUEsTUFBTUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBU0EsYUFBY0EsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0EsQ0FBQUE7UUFDNURBLE1BQU1BLENBQUNBLGNBQWNBLENBQUNBLEVBQUNBLEtBQUtBLEVBQUVBLGFBQWFBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLEVBQUVBLEVBQUNBLHdEQUF3REE7UUFDaklBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLENBQUFBO1FBQ3ZCQSxJQUFJQSxPQUFPQSxHQUFTQSxJQUFLQSxDQUFDQSxRQUFRQSxDQUFDQSxtQkFBbUJBLENBQUNBLFlBQVlBLENBQUNBLENBQUFBO1FBQ3BFQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFBQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQUE7UUFFM0JBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLGFBQWFBLENBQUNBLENBQUFBO0lBQ2pDQSxDQUFDQTtJQUVERixNQUFNQTtJQUNOQSxxQkFBSUEsR0FBSkEsVUFBS0EsSUFBWUE7UUFDZkcsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQUE7SUFDM0JBLENBQUNBO0lBQ0hILGFBQUNBO0FBQURBLENBQUNBLEFBMUJELEVBQTRCLFdBQVcsRUEwQnRDO0FBMUJZLGNBQU0sR0FBTixNQTBCWixDQUFBO0FBRUQsQ0FBQztBQUFNLFFBQVMsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU29tZSBkb2NzXG4vLyBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy93ZWJjb21wb25lbnRzL2N1c3RvbWVsZW1lbnRzLyAobG9vayBhdCBsaWZlY3ljbGUgY2FsbGJhY2sgbWV0aG9kcylcblxuZXhwb3J0IGNsYXNzIFRzVmlldyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgZWRpdG9yRWxlbWVudDogSFRNTEVsZW1lbnRcbiAgZWRpdG9yOiBBdG9tQ29yZS5JRWRpdG9yXG4gIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICB2YXIgcHJldmlldyA9IHRoaXMuaW5uZXJUZXh0XG4gICAgdGhpcy5pbm5lclRleHQgPSBcIlwiXG5cbiAgICAvLyBCYXNlZCBvbiBtYXJrZG93biBlZGl0b3JcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9tYXJrZG93bi1wcmV2aWV3L2Jsb2IvMmJjYmFkYWMzOTgwZjFhZWI0NTVmNzA3OGJkMWZkZmI0ZTZmZTZiMS9saWIvcmVuZGVyZXIuY29mZmVlI0wxMTFcbiAgICB2YXIgZWRpdG9yRWxlbWVudCA9ICh0aGlzLmVkaXRvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXRvbS10ZXh0LWVkaXRvclwiKSlcbiAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiZ3V0dGVyLWhpZGRlblwiKSlcbiAgICBlZGl0b3JFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpIC8vIG1ha2UgcmVhZC1vbmx5XG4gICAgdmFyIGVkaXRvciA9ICh0aGlzLmVkaXRvciA9ICg8YW55PmVkaXRvckVsZW1lbnQpLmdldE1vZGVsKCkpXG4gICAgZWRpdG9yLmdldERlY29yYXRpb25zKHtjbGFzczogXCJjdXJzb3ItbGluZVwiLCB0eXBlOiBcImxpbmVcIn0pWzBdLmRlc3Ryb3koKSAvLyByZW1vdmUgdGhlIGRlZmF1bHQgc2VsZWN0aW9uIG9mIGEgbGluZSBpbiBlYWNoIGVkaXRvclxuICAgIGVkaXRvci5zZXRUZXh0KHByZXZpZXcpXG4gICAgdmFyIGdyYW1tYXIgPSAoPGFueT5hdG9tKS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKFwic291cmNlLnRzeFwiKVxuICAgIGVkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIpXG4gICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpXG5cbiAgICB0aGlzLmFwcGVuZENoaWxkKGVkaXRvckVsZW1lbnQpXG4gIH1cblxuICAvLyBBUElcbiAgdGV4dCh0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLmVkaXRvci5zZXRUZXh0KHRleHQpXG4gIH1cbn1cblxuOyg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJ0cy12aWV3XCIsIFRzVmlldylcbiJdfQ==