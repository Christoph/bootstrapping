(function() {
  module.exports = function() {
    return {
      hexToRgb: function(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
          hex = hex.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
        }
        return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
      },
      hexaToRgb: function(hexa) {
        return this.hexToRgb((hexa.match(/rgba\((\#.+),/))[1]);
      },
      hexToHsl: function(hex) {
        return this.rgbToHsl(this.hexToRgb(hex.replace('#', '')));
      },
      rgbToHex: function(rgb) {
        var _componentToHex;
        _componentToHex = function(component) {
          var _hex;
          _hex = component.toString(16);
          if (_hex.length === 1) {
            return "0" + _hex;
          } else {
            return _hex;
          }
        };
        return [_componentToHex(rgb[0]), _componentToHex(rgb[1]), _componentToHex(rgb[2])].join('');
      },
      rgbToHsl: function(arg) {
        var _d, _h, _l, _max, _min, _s, b, g, r;
        r = arg[0], g = arg[1], b = arg[2];
        r /= 255;
        g /= 255;
        b /= 255;
        _max = Math.max(r, g, b);
        _min = Math.min(r, g, b);
        _l = (_max + _min) / 2;
        if (_max === _min) {
          return [0, 0, Math.floor(_l * 100)];
        }
        _d = _max - _min;
        _s = _l > 0.5 ? _d / (2 - _max - _min) : _d / (_max + _min);
        switch (_max) {
          case r:
            _h = (g - b) / _d + (g < b ? 6 : 0);
            break;
          case g:
            _h = (b - r) / _d + 2;
            break;
          case b:
            _h = (r - g) / _d + 4;
        }
        _h /= 6;
        return [Math.floor(_h * 360), Math.floor(_s * 100), Math.floor(_l * 100)];
      },
      rgbToHsv: function(arg) {
        var b, computedH, computedS, computedV, d, g, h, maxRGB, minRGB, r;
        r = arg[0], g = arg[1], b = arg[2];
        computedH = 0;
        computedS = 0;
        computedV = 0;
        if ((r == null) || (g == null) || (b == null) || isNaN(r) || isNaN(g) || isNaN(b)) {
          return;
        }
        if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
          return;
        }
        r = r / 255;
        g = g / 255;
        b = b / 255;
        minRGB = Math.min(r, Math.min(g, b));
        maxRGB = Math.max(r, Math.max(g, b));
        if (minRGB === maxRGB) {
          computedV = minRGB;
          return [0, 0, computedV];
        }
        d = (r === minRGB ? g - b : (b === minRGB ? r - g : b - r));
        h = (r === minRGB ? 3 : (b === minRGB ? 1 : 5));
        computedH = 60 * (h - d / (maxRGB - minRGB));
        computedS = (maxRGB - minRGB) / maxRGB;
        computedV = maxRGB;
        return [computedH, computedS, computedV];
      },
      hsvToHsl: function(arg) {
        var h, s, v;
        h = arg[0], s = arg[1], v = arg[2];
        return [h, s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h), h / 2];
      },
      hsvToRgb: function(arg) {
        var _f, _i, _p, _q, _result, _t, h, s, v;
        h = arg[0], s = arg[1], v = arg[2];
        h /= 60;
        s /= 100;
        v /= 100;
        if (s === 0) {
          return [Math.round(v * 255), Math.round(v * 255), Math.round(v * 255)];
        }
        _i = Math.floor(h);
        _f = h - _i;
        _p = v * (1 - s);
        _q = v * (1 - s * _f);
        _t = v * (1 - s * (1 - _f));
        _result = (function() {
          switch (_i) {
            case 0:
              return [v, _t, _p];
            case 1:
              return [_q, v, _p];
            case 2:
              return [_p, v, _t];
            case 3:
              return [_p, _q, v];
            case 4:
              return [_t, _p, v];
            case 5:
              return [v, _p, _q];
            default:
              return [v, _t, _p];
          }
        })();
        return [Math.round(_result[0] * 255), Math.round(_result[1] * 255), Math.round(_result[2] * 255)];
      },
      hslToHsv: function(arg) {
        var h, l, s;
        h = arg[0], s = arg[1], l = arg[2];
        s /= 100;
        l /= 100;
        s *= l < .5 ? l : 1 - l;
        return [h, (2 * s / (l + s)) || 0, l + s];
      },
      hslToRgb: function(input) {
        var h, ref, s, v;
        ref = this.hslToHsv(input), h = ref[0], s = ref[1], v = ref[2];
        return this.hsvToRgb([h, s * 100, v * 100]);
      },
      vecToRgb: function(input) {
        return [(input[0] * 255) << 0, (input[1] * 255) << 0, (input[2] * 255) << 0];
      },
      rgbToVec: function(input) {
        return [(input[0] / 255).toFixed(2), (input[1] / 255).toFixed(2), (input[2] / 255).toFixed(2)];
      }
    };
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvY29sb3ItcGlja2VyL2xpYi9tb2R1bGVzL0NvbnZlcnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlJO0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQTtXQU1iO01BQUEsUUFBQSxFQUFVLFNBQUMsR0FBRDtRQUNOLEdBQUEsR0FBTSxHQUFHLENBQUMsT0FBSixDQUFZLEdBQVosRUFBaUIsRUFBakI7UUFDTixJQUFpRCxHQUFHLENBQUMsTUFBSixLQUFjLENBQS9EO1VBQUEsR0FBQSxHQUFNLEdBQUcsQ0FBQyxPQUFKLENBQVksV0FBWixFQUF5QixjQUF6QixFQUFOOztBQUVBLGVBQU8sQ0FDSCxRQUFBLENBQVUsR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFYLEVBQWMsQ0FBZCxDQUFWLEVBQTRCLEVBQTVCLENBREcsRUFFSCxRQUFBLENBQVUsR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFYLEVBQWMsQ0FBZCxDQUFWLEVBQTRCLEVBQTVCLENBRkcsRUFHSCxRQUFBLENBQVUsR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFYLEVBQWMsQ0FBZCxDQUFWLEVBQTRCLEVBQTVCLENBSEc7TUFKRCxDQUFWO01BWUEsU0FBQSxFQUFXLFNBQUMsSUFBRDtBQUNQLGVBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLElBQUksQ0FBQyxLQUFMLENBQVcsZUFBWCxDQUFELENBQTZCLENBQUEsQ0FBQSxDQUF2QztNQURBLENBWlg7TUFrQkEsUUFBQSxFQUFVLFNBQUMsR0FBRDtBQUNOLGVBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxPQUFKLENBQVksR0FBWixFQUFpQixFQUFqQixDQUFWLENBQVY7TUFERCxDQWxCVjtNQXdCQSxRQUFBLEVBQVUsU0FBQyxHQUFEO0FBQ04sWUFBQTtRQUFBLGVBQUEsR0FBa0Is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QixDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQU4sR0FBVyxHQUFaLENBQWdCLENBQUMsT0FBakIsQ0FBeUIsQ0FBekIsQ0FEd0IsRUFFeEIsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFOLEdBQVcsR0FBWixDQUFnQixDQUFDLE9BQWpCLENBQXlCLENBQXpCLENBRndCLEVBR3hCLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBTixHQUFXLEdBQVosQ0FBZ0IsQ0FBQyxPQUFqQixDQUF5QixDQUF6QixDQUh3QjtNQUFsQixDQXJMVjs7RUFOYTtBQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgQ29udmVydFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IC0+XG4gICAgICAgICMgVE9ETzogSSBkb24ndCBsaWtlIHRoaXMgZmlsZS4gSXQncyB1Z2x5IGFuZCBmZWVscyB3ZWlyZFxuXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyAgSEVYIHRvIFJHQlxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBoZXhUb1JnYjogKGhleCkgLT5cbiAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlICcjJywgJydcbiAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlIC8oLikoLikoLikvLCBcIiQxJDEkMiQyJDMkM1wiIGlmIGhleC5sZW5ndGggaXMgM1xuXG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHBhcnNlSW50IChoZXguc3Vic3RyIDAsIDIpLCAxNlxuICAgICAgICAgICAgICAgIHBhcnNlSW50IChoZXguc3Vic3RyIDIsIDIpLCAxNlxuICAgICAgICAgICAgICAgIHBhcnNlSW50IChoZXguc3Vic3RyIDQsIDIpLCAxNl1cblxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgIEhFWEEgdG8gUkdCXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIGhleGFUb1JnYjogKGhleGEpIC0+XG4gICAgICAgICAgICByZXR1cm4gQGhleFRvUmdiIChoZXhhLm1hdGNoIC9yZ2JhXFwoKFxcIy4rKSwvKVsxXVxuXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyAgSEVYIHRvIEhTTFxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBoZXhUb0hzbDogKGhleCkgLT5cbiAgICAgICAgICAgIHJldHVybiBAcmdiVG9Ic2wgQGhleFRvUmdiIGhleC5yZXBsYWNlICcjJywgJydcblxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgIFJHQiB0byBIRVhcbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgcmdiVG9IZXg6IChyZ2IpIC0+XG4gICAgICAgICAgICBfY29tcG9uZW50VG9IZXggPSAoY29tcG9uZW50KSAtPlxuICAgICAgICAgICAgICAgIF9oZXggPSBjb21wb25lbnQudG9TdHJpbmcgMTZcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgX2hleC5sZW5ndGggaXMgMSB0aGVuIFwiMCN7IF9oZXggfVwiIGVsc2UgX2hleFxuXG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIChfY29tcG9uZW50VG9IZXggcmdiWzBdKVxuICAgICAgICAgICAgICAgIChfY29tcG9uZW50VG9IZXggcmdiWzFdKVxuICAgICAgICAgICAgICAgIChfY29tcG9uZW50VG9IZXggcmdiWzJdKVxuICAgICAgICAgICAgXS5qb2luICcnXG5cbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICBSR0IgdG8gSFNMXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHJnYlRvSHNsOiAoW3IsIGcsIGJdKSAtPlxuICAgICAgICAgICAgciAvPSAyNTVcbiAgICAgICAgICAgIGcgLz0gMjU1XG4gICAgICAgICAgICBiIC89IDI1NVxuXG4gICAgICAgICAgICBfbWF4ID0gTWF0aC5tYXggciwgZywgYlxuICAgICAgICAgICAgX21pbiA9IE1hdGgubWluIHIsIGcsIGJcblxuICAgICAgICAgICAgX2wgPSAoX21heCArIF9taW4pIC8gMlxuXG4gICAgICAgICAgICBpZiBfbWF4IGlzIF9taW4gdGhlbiByZXR1cm4gWzAsIDAsIE1hdGguZmxvb3IgX2wgKiAxMDBdXG5cbiAgICAgICAgICAgIF9kID0gX21heCAtIF9taW5cbiAgICAgICAgICAgIF9zID0gaWYgX2wgPiAwLjUgdGhlbiBfZCAvICgyIC0gX21heCAtIF9taW4pIGVsc2UgX2QgLyAoX21heCArIF9taW4pXG5cbiAgICAgICAgICAgIHN3aXRjaCBfbWF4XG4gICAgICAgICAgICAgICAgd2hlbiByIHRoZW4gX2ggPSAoZyAtIGIpIC8gX2QgKyAoaWYgZyA8IGIgdGhlbiA2IGVsc2UgMClcbiAgICAgICAgICAgICAgICB3aGVuIGcgdGhlbiBfaCA9IChiIC0gcikgLyBfZCArIDJcbiAgICAgICAgICAgICAgICB3aGVuIGIgdGhlbiBfaCA9IChyIC0gZykgLyBfZCArIDRcblxuICAgICAgICAgICAgX2ggLz0gNlxuXG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IgX2ggKiAzNjBcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yIF9zICogMTAwXG4gICAgICAgICAgICAgICAgTWF0aC5mbG9vciBfbCAqIDEwMF1cblxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgIFJHQiB0byBIU1ZcbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgcmdiVG9Ic3Y6IChbciwgZywgYl0pIC0+XG4gICAgICAgICAgICBjb21wdXRlZEggPSAwXG4gICAgICAgICAgICBjb21wdXRlZFMgPSAwXG4gICAgICAgICAgICBjb21wdXRlZFYgPSAwXG5cbiAgICAgICAgICAgIGlmIG5vdCByPyBvciBub3QgZz8gb3Igbm90IGI/IG9yIGlzTmFOKHIpIG9yIGlzTmFOKGcpIG9yIGlzTmFOKGIpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBpZiByIDwgMCBvciBnIDwgMCBvciBiIDwgMCBvciByID4gMjU1IG9yIGcgPiAyNTUgb3IgYiA+IDI1NVxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICByID0gciAvIDI1NVxuICAgICAgICAgICAgZyA9IGcgLyAyNTVcbiAgICAgICAgICAgIGIgPSBiIC8gMjU1XG5cbiAgICAgICAgICAgIG1pblJHQiA9IE1hdGgubWluKHIsIE1hdGgubWluKGcsIGIpKVxuICAgICAgICAgICAgbWF4UkdCID0gTWF0aC5tYXgociwgTWF0aC5tYXgoZywgYikpXG5cbiAgICAgICAgICAgICMgQmxhY2stZ3JheS13aGl0ZVxuICAgICAgICAgICAgaWYgbWluUkdCIGlzIG1heFJHQlxuICAgICAgICAgICAgICAgIGNvbXB1dGVkViA9IG1pblJHQlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVl1cblxuICAgICAgICAgICAgIyBDb2xvcnMgb3RoZXIgdGhhbiBibGFjay1ncmF5LXdoaXRlOlxuICAgICAgICAgICAgZCA9IChpZiAociBpcyBtaW5SR0IpIHRoZW4gZyAtIGIgZWxzZSAoKGlmIChiIGlzIG1pblJHQikgdGhlbiByIC0gZyBlbHNlIGIgLSByKSkpXG4gICAgICAgICAgICBoID0gKGlmIChyIGlzIG1pblJHQikgdGhlbiAzIGVsc2UgKChpZiAoYiBpcyBtaW5SR0IpIHRoZW4gMSBlbHNlIDUpKSlcblxuICAgICAgICAgICAgY29tcHV0ZWRIID0gNjAgKiAoaCAtIGQgLyAobWF4UkdCIC0gbWluUkdCKSlcbiAgICAgICAgICAgIGNvbXB1dGVkUyA9IChtYXhSR0IgLSBtaW5SR0IpIC8gbWF4UkdCXG4gICAgICAgICAgICBjb21wdXRlZFYgPSBtYXhSR0JcblxuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBjb21wdXRlZEhcbiAgICAgICAgICAgICAgICBjb21wdXRlZFNcbiAgICAgICAgICAgICAgICBjb21wdXRlZFZdXG5cbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICBIU1YgdG8gSFNMXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIGhzdlRvSHNsOiAoW2gsIHMsIHZdKSAtPiBbXG4gICAgICAgICAgICBoXG4gICAgICAgICAgICBzICogdiAvIChpZiAoaCA9ICgyIC0gcykgKiB2KSA8IDEgdGhlbiBoIGVsc2UgMiAtIGgpXG4gICAgICAgICAgICBoIC8gMl1cblxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgIEhTViB0byBSR0JcbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgaHN2VG9SZ2I6IChbaCwgcywgdl0pIC0+XG4gICAgICAgICAgICBoIC89IDYwICMgMCB0byA1XG4gICAgICAgICAgICBzIC89IDEwMFxuICAgICAgICAgICAgdiAvPSAxMDBcblxuICAgICAgICAgICAgIyBBY2hyb21hdGljIGdyYXlzY2FsZVxuICAgICAgICAgICAgaWYgcyBpcyAwIHRoZW4gcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kIHYgKiAyNTVcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kIHYgKiAyNTVcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kIHYgKiAyNTVdXG5cbiAgICAgICAgICAgIF9pID0gTWF0aC5mbG9vciBoXG4gICAgICAgICAgICBfZiA9IGggLSBfaVxuICAgICAgICAgICAgX3AgPSB2ICogKDEgLSBzKVxuICAgICAgICAgICAgX3EgPSB2ICogKDEgLSBzICogX2YpXG4gICAgICAgICAgICBfdCA9IHYgKiAoMSAtIHMgKiAoMSAtIF9mKSlcblxuICAgICAgICAgICAgX3Jlc3VsdCA9IHN3aXRjaCBfaVxuICAgICAgICAgICAgICAgIHdoZW4gMCB0aGVuIFt2LCBfdCwgX3BdXG4gICAgICAgICAgICAgICAgd2hlbiAxIHRoZW4gW19xLCB2LCBfcF1cbiAgICAgICAgICAgICAgICB3aGVuIDIgdGhlbiBbX3AsIHYsIF90XVxuICAgICAgICAgICAgICAgIHdoZW4gMyB0aGVuIFtfcCwgX3EsIHZdXG4gICAgICAgICAgICAgICAgd2hlbiA0IHRoZW4gW190LCBfcCwgdl1cbiAgICAgICAgICAgICAgICB3aGVuIDUgdGhlbiBbdiwgX3AsIF9xXVxuICAgICAgICAgICAgICAgIGVsc2UgW3YsIF90LCBfcF1cblxuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kIF9yZXN1bHRbMF0gKiAyNTVcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kIF9yZXN1bHRbMV0gKiAyNTVcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kIF9yZXN1bHRbMl0gKiAyNTVdXG5cbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICBIU0wgdG8gSFNWXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIGhzbFRvSHN2OiAoW2gsIHMsIGxdKSAtPlxuICAgICAgICAgICAgcyAvPSAxMDBcbiAgICAgICAgICAgIGwgLz0gMTAwXG5cbiAgICAgICAgICAgIHMgKj0gaWYgbCA8IC41IHRoZW4gbCBlbHNlIDEgLSBsXG5cbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaFxuICAgICAgICAgICAgICAgICgyICogcyAvIChsICsgcykpIG9yIDBcbiAgICAgICAgICAgICAgICBsICsgc11cblxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgIEhTTCB0byBSR0JcbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgaHNsVG9SZ2I6IChpbnB1dCkgLT5cbiAgICAgICAgICAgIFtoLCBzLCB2XSA9IEBoc2xUb0hzdiBpbnB1dFxuICAgICAgICAgICAgcmV0dXJuIEBoc3ZUb1JnYiBbaCwgKHMgKiAxMDApLCAodiAqIDEwMCldXG5cbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICBWRUMgdG8gUkdCXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHZlY1RvUmdiOiAoaW5wdXQpIC0+IHJldHVybiBbXG4gICAgICAgICAgICAoaW5wdXRbMF0gKiAyNTUpIDw8IDBcbiAgICAgICAgICAgIChpbnB1dFsxXSAqIDI1NSkgPDwgMFxuICAgICAgICAgICAgKGlucHV0WzJdICogMjU1KSA8PCAwXVxuXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyAgUkdCIHRvIFZFQ1xuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICByZ2JUb1ZlYzogKGlucHV0KSAtPiByZXR1cm4gW1xuICAgICAgICAgICAgKGlucHV0WzBdIC8gMjU1KS50b0ZpeGVkIDJcbiAgICAgICAgICAgIChpbnB1dFsxXSAvIDI1NSkudG9GaXhlZCAyXG4gICAgICAgICAgICAoaW5wdXRbMl0gLyAyNTUpLnRvRml4ZWQgMl1cbiJdfQ==