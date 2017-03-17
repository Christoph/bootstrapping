(function() {
  module.exports = {
    config: {
      forceInline: {
        title: 'Force Inline',
        description: 'Elements in this comma delimited list will render their closing tags on the same line, even if they are block by default. Use * to force all closing tags to render inline',
        type: 'array',
        "default": ['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      },
      forceBlock: {
        title: 'Force Block',
        description: 'Elements in this comma delimited list will render their closing tags after a tabbed line, even if they are inline by default. Values are ignored if Force Inline is *',
        type: 'array',
        "default": ['head']
      },
      neverClose: {
        title: 'Never Close Elements',
        description: 'Comma delimited list of elements to never close',
        type: 'array',
        "default": ['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'command', 'embed', 'keygen', 'param', 'source', 'track', 'wbr']
      },
      makeNeverCloseSelfClosing: {
        title: 'Make Never Close Elements Self-Closing',
        description: 'Closes elements with " />" (ie &lt;br&gt; becomes &lt;br /&gt;)',
        type: 'boolean',
        "default": true
      },
      legacyMode: {
        title: "Legacy/International Mode",
        description: "Do not use this unless you use a non-US or non-QUERTY keyboard and/or the plugin isn't working otherwise. USING THIS OPTION WILL OPT YOU OUT OF NEW IMPROVEMENTS/FEATURES POST 0.22.0",
        type: 'boolean',
        "default": false
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvYXV0b2Nsb3NlLWh0bWwvbGliL2NvbmZpZ3VyYXRpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDSTtJQUFBLE1BQUEsRUFDSTtNQUFBLFdBQUEsRUFDSTtRQUFBLEtBQUEsRUFBTyxjQUFQO1FBQ0EsV0FBQSxFQUFhLDRLQURiO1FBRUEsSUFBQSxFQUFNLE9BRk47UUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLENBQUMsT0FBRCxFQUFVLElBQVYsRUFBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsRUFBNEIsSUFBNUIsRUFBa0MsSUFBbEMsRUFBd0MsSUFBeEMsQ0FIVDtPQURKO01BS0EsVUFBQSxFQUNJO1FBQUEsS0FBQSxFQUFPLGFBQVA7UUFDQSxXQUFBLEVBQWEsdUtBRGI7UUFFQSxJQUFBLEVBQU0sT0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsQ0FBQyxNQUFELENBSFQ7T0FOSjtNQVVBLFVBQUEsRUFDSTtRQUFBLEtBQUEsRUFBTyxzQkFBUDtRQUNBLFdBQUEsRUFBYSxpREFEYjtRQUVBLElBQUEsRUFBTSxPQUZOO1FBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsS0FBYixFQUFvQixPQUFwQixFQUE2QixNQUE3QixFQUFxQyxNQUFyQyxFQUE2QyxNQUE3QyxFQUFxRCxNQUFyRCxFQUE2RCxLQUE3RCxFQUFvRSxTQUFwRSxFQUErRSxPQUEvRSxFQUF3RixRQUF4RixFQUFrRyxPQUFsRyxFQUEyRyxRQUEzRyxFQUFxSCxPQUFySCxFQUE4SCxLQUE5SCxDQUhUO09BWEo7TUFlQSx5QkFBQSxFQUNJO1FBQUEsS0FBQSxFQUFPLHdDQUFQO1FBQ0EsV0FBQSxFQUFhLGlFQURiO1FBRUEsSUFBQSxFQUFNLFNBRk47UUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBSFQ7T0FoQko7TUFvQkEsVUFBQSxFQUNJO1FBQUEsS0FBQSxFQUFPLDJCQUFQO1FBQ0EsV0FBQSxFQUFhLHVMQURiO1FBRUEsSUFBQSxFQUFNLFNBRk47UUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBSFQ7T0FyQko7S0FESjs7QUFESiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbiAgICBjb25maWc6XG4gICAgICAgIGZvcmNlSW5saW5lOlxuICAgICAgICAgICAgdGl0bGU6ICdGb3JjZSBJbmxpbmUnXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VsZW1lbnRzIGluIHRoaXMgY29tbWEgZGVsaW1pdGVkIGxpc3Qgd2lsbCByZW5kZXIgdGhlaXIgY2xvc2luZyB0YWdzIG9uIHRoZSBzYW1lIGxpbmUsIGV2ZW4gaWYgdGhleSBhcmUgYmxvY2sgYnkgZGVmYXVsdC4gVXNlICogdG8gZm9yY2UgYWxsIGNsb3NpbmcgdGFncyB0byByZW5kZXIgaW5saW5lJ1xuICAgICAgICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgICAgICAgZGVmYXVsdDogWyd0aXRsZScsICdoMScsICdoMicsICdoMycsICdoNCcsICdoNScsICdoNiddXG4gICAgICAgIGZvcmNlQmxvY2s6XG4gICAgICAgICAgICB0aXRsZTogJ0ZvcmNlIEJsb2NrJ1xuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFbGVtZW50cyBpbiB0aGlzIGNvbW1hIGRlbGltaXRlZCBsaXN0IHdpbGwgcmVuZGVyIHRoZWlyIGNsb3NpbmcgdGFncyBhZnRlciBhIHRhYmJlZCBsaW5lLCBldmVuIGlmIHRoZXkgYXJlIGlubGluZSBieSBkZWZhdWx0LiBWYWx1ZXMgYXJlIGlnbm9yZWQgaWYgRm9yY2UgSW5saW5lIGlzIConXG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknXG4gICAgICAgICAgICBkZWZhdWx0OiBbJ2hlYWQnXVxuICAgICAgICBuZXZlckNsb3NlOlxuICAgICAgICAgICAgdGl0bGU6ICdOZXZlciBDbG9zZSBFbGVtZW50cydcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgZGVsaW1pdGVkIGxpc3Qgb2YgZWxlbWVudHMgdG8gbmV2ZXIgY2xvc2UnXG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknXG4gICAgICAgICAgICBkZWZhdWx0OiBbJ2JyJywgJ2hyJywgJ2ltZycsICdpbnB1dCcsICdsaW5rJywgJ21ldGEnLCAnYXJlYScsICdiYXNlJywgJ2NvbCcsICdjb21tYW5kJywgJ2VtYmVkJywgJ2tleWdlbicsICdwYXJhbScsICdzb3VyY2UnLCAndHJhY2snLCAnd2JyJ11cbiAgICAgICAgbWFrZU5ldmVyQ2xvc2VTZWxmQ2xvc2luZzpcbiAgICAgICAgICAgIHRpdGxlOiAnTWFrZSBOZXZlciBDbG9zZSBFbGVtZW50cyBTZWxmLUNsb3NpbmcnXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3NlcyBlbGVtZW50cyB3aXRoIFwiIC8+XCIgKGllICZsdDticiZndDsgYmVjb21lcyAmbHQ7YnIgLyZndDspJ1xuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgIGxlZ2FjeU1vZGU6XG4gICAgICAgICAgICB0aXRsZTogXCJMZWdhY3kvSW50ZXJuYXRpb25hbCBNb2RlXCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRvIG5vdCB1c2UgdGhpcyB1bmxlc3MgeW91IHVzZSBhIG5vbi1VUyBvciBub24tUVVFUlRZIGtleWJvYXJkIGFuZC9vciB0aGUgcGx1Z2luIGlzbid0IHdvcmtpbmcgb3RoZXJ3aXNlLiBVU0lORyBUSElTIE9QVElPTiBXSUxMIE9QVCBZT1UgT1VUIE9GIE5FVyBJTVBST1ZFTUVOVFMvRkVBVFVSRVMgUE9TVCAwLjIyLjBcIlxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuIl19
