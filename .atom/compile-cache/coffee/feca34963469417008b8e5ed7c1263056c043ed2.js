(function() {
  module.exports = {
    diffWords: {
      title: 'Show Word Diff',
      description: 'Diffs the words between each line when this box is checked.',
      type: 'boolean',
      "default": true,
      order: 1
    },
    ignoreWhitespace: {
      title: 'Ignore Whitespace',
      description: 'Will not diff whitespace when this box is checked.',
      type: 'boolean',
      "default": false,
      order: 2
    },
    muteNotifications: {
      title: 'Mute Notifications',
      description: 'Mutes all warning notifications when this box is checked.',
      type: 'boolean',
      "default": false,
      order: 3
    },
    hideTreeView: {
      title: 'Hide Tree View',
      description: 'Hides Tree View during diff - shows when finished.',
      type: 'boolean',
      "default": false,
      order: 4
    },
    scrollSyncType: {
      title: 'Sync Scrolling',
      description: 'Syncs the scrolling of the editors.',
      type: 'string',
      "default": 'Vertical + Horizontal',
      "enum": ['Vertical + Horizontal', 'Vertical', 'None'],
      order: 5
    },
    colors: {
      type: 'object',
      properties: {
        addedColorSide: {
          title: 'Added Color Side',
          description: 'The side that the latest version of the file is on. The added color will be applied to this editor and the removed color will be opposite.',
          type: 'string',
          "default": 'left',
          "enum": ['left', 'right'],
          order: 1
        },
        overrideThemeColors: {
          title: 'Override Highlight Colors',
          description: 'Override the line highlight colors (defined by variables in your selected syntax theme) with the colors selected below.',
          type: 'boolean',
          "default": false,
          order: 2
        },
        addedColor: {
          title: 'Added Custom Color',
          description: 'The color that will be used for highlighting added lines when **Override Highlight Colors** is checked.',
          type: 'color',
          "default": 'green',
          order: 3
        },
        removedColor: {
          title: 'Removed Custom Color',
          description: 'The color that will be used for highlighting removed lines when **Override Highlight Colors** is checked.',
          type: 'color',
          "default": 'red',
          order: 4
        }
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvLmF0b20vcGFja2FnZXMvc3BsaXQtZGlmZi9saWIvY29uZmlnLXNjaGVtYS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsU0FBQSxFQUNFO01BQUEsS0FBQSxFQUFPLGdCQUFQO01BQ0EsV0FBQSxFQUFhLDZEQURiO01BRUEsSUFBQSxFQUFNLFNBRk47TUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBSFQ7TUFJQSxLQUFBLEVBQU8sQ0FKUDtLQURGO0lBTUEsZ0JBQUEsRUFDRTtNQUFBLEtBQUEsRUFBTyxtQkFBUDtNQUNBLFdBQUEsRUFBYSxvREFEYjtNQUVBLElBQUEsRUFBTSxTQUZOO01BR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUhUO01BSUEsS0FBQSxFQUFPLENBSlA7S0FQRjtJQVlBLGlCQUFBLEVBQ0U7TUFBQSxLQUFBLEVBQU8sb0JBQVA7TUFDQSxXQUFBLEVBQWEsMkRBRGI7TUFFQSxJQUFBLEVBQU0sU0FGTjtNQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FIVDtNQUlBLEtBQUEsRUFBTyxDQUpQO0tBYkY7SUFrQkEsWUFBQSxFQUNFO01BQUEsS0FBQSxFQUFPLGdCQUFQO01BQ0EsV0FBQSxFQUFhLG9EQURiO01BRUEsSUFBQSxFQUFNLFNBRk47TUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBSFQ7TUFJQSxLQUFBLEVBQU8sQ0FKUDtLQW5CRjtJQXdCQSxjQUFBLEVBQ0U7TUFBQSxLQUFBLEVBQU8sZ0JBQVA7TUFDQSxXQUFBLEVBQWEscUNBRGI7TUFFQSxJQUFBLEVBQU0sUUFGTjtNQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsdUJBSFQ7TUFJQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsdUJBQUQsRUFBMEIsVUFBMUIsRUFBc0MsTUFBdEMsQ0FKTjtNQUtBLEtBQUEsRUFBTyxDQUxQO0tBekJGO0lBK0JBLE1BQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxRQUFOO01BQ0EsVUFBQSxFQUNFO1FBQUEsY0FBQSxFQUNFO1VBQUEsS0FBQSxFQUFPLGtCQUFQO1VBQ0EsV0FBQSxFQUFhLDRJQURiO1VBRUEsSUFBQSxFQUFNLFFBRk47VUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE1BSFQ7VUFJQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsTUFBRCxFQUFTLE9BQVQsQ0FKTjtVQUtBLEtBQUEsRUFBTyxDQUxQO1NBREY7UUFPQSxtQkFBQSxFQUNFO1VBQUEsS0FBQSxFQUFPLDJCQUFQO1VBQ0EsV0FBQSxFQUFhLHlIQURiO1VBRUEsSUFBQSxFQUFNLFNBRk47VUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBSFQ7VUFJQSxLQUFBLEVBQU8sQ0FKUDtTQVJGO1FBYUEsVUFBQSxFQUNFO1VBQUEsS0FBQSxFQUFPLG9CQUFQO1VBQ0EsV0FBQSxFQUFhLHlHQURiO1VBRUEsSUFBQSxFQUFNLE9BRk47VUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE9BSFQ7VUFJQSxLQUFBLEVBQU8sQ0FKUDtTQWRGO1FBbUJBLFlBQUEsRUFDRTtVQUFBLEtBQUEsRUFBTyxzQkFBUDtVQUNBLFdBQUEsRUFBYSwyR0FEYjtVQUVBLElBQUEsRUFBTSxPQUZOO1VBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUhUO1VBSUEsS0FBQSxFQUFPLENBSlA7U0FwQkY7T0FGRjtLQWhDRjs7QUFERiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbiAgZGlmZldvcmRzOlxuICAgIHRpdGxlOiAnU2hvdyBXb3JkIERpZmYnXG4gICAgZGVzY3JpcHRpb246ICdEaWZmcyB0aGUgd29yZHMgYmV0d2VlbiBlYWNoIGxpbmUgd2hlbiB0aGlzIGJveCBpcyBjaGVja2VkLidcbiAgICB0eXBlOiAnYm9vbGVhbidcbiAgICBkZWZhdWx0OiB0cnVlXG4gICAgb3JkZXI6IDFcbiAgaWdub3JlV2hpdGVzcGFjZTpcbiAgICB0aXRsZTogJ0lnbm9yZSBXaGl0ZXNwYWNlJ1xuICAgIGRlc2NyaXB0aW9uOiAnV2lsbCBub3QgZGlmZiB3aGl0ZXNwYWNlIHdoZW4gdGhpcyBib3ggaXMgY2hlY2tlZC4nXG4gICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBvcmRlcjogMlxuICBtdXRlTm90aWZpY2F0aW9uczpcbiAgICB0aXRsZTogJ011dGUgTm90aWZpY2F0aW9ucydcbiAgICBkZXNjcmlwdGlvbjogJ011dGVzIGFsbCB3YXJuaW5nIG5vdGlmaWNhdGlvbnMgd2hlbiB0aGlzIGJveCBpcyBjaGVja2VkLidcbiAgICB0eXBlOiAnYm9vbGVhbidcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIG9yZGVyOiAzXG4gIGhpZGVUcmVlVmlldzpcbiAgICB0aXRsZTogJ0hpZGUgVHJlZSBWaWV3J1xuICAgIGRlc2NyaXB0aW9uOiAnSGlkZXMgVHJlZSBWaWV3IGR1cmluZyBkaWZmIC0gc2hvd3Mgd2hlbiBmaW5pc2hlZC4nXG4gICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBvcmRlcjogNFxuICBzY3JvbGxTeW5jVHlwZTpcbiAgICB0aXRsZTogJ1N5bmMgU2Nyb2xsaW5nJ1xuICAgIGRlc2NyaXB0aW9uOiAnU3luY3MgdGhlIHNjcm9sbGluZyBvZiB0aGUgZWRpdG9ycy4nXG4gICAgdHlwZTogJ3N0cmluZydcbiAgICBkZWZhdWx0OiAnVmVydGljYWwgKyBIb3Jpem9udGFsJ1xuICAgIGVudW06IFsnVmVydGljYWwgKyBIb3Jpem9udGFsJywgJ1ZlcnRpY2FsJywgJ05vbmUnXVxuICAgIG9yZGVyOiA1XG4gIGNvbG9yczpcbiAgICB0eXBlOiAnb2JqZWN0J1xuICAgIHByb3BlcnRpZXM6XG4gICAgICBhZGRlZENvbG9yU2lkZTpcbiAgICAgICAgdGl0bGU6ICdBZGRlZCBDb2xvciBTaWRlJ1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBzaWRlIHRoYXQgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBmaWxlIGlzIG9uLiBUaGUgYWRkZWQgY29sb3Igd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZWRpdG9yIGFuZCB0aGUgcmVtb3ZlZCBjb2xvciB3aWxsIGJlIG9wcG9zaXRlLidcbiAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgZGVmYXVsdDogJ2xlZnQnXG4gICAgICAgIGVudW06IFsnbGVmdCcsICdyaWdodCddXG4gICAgICAgIG9yZGVyOiAxXG4gICAgICBvdmVycmlkZVRoZW1lQ29sb3JzOlxuICAgICAgICB0aXRsZTogJ092ZXJyaWRlIEhpZ2hsaWdodCBDb2xvcnMnXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnT3ZlcnJpZGUgdGhlIGxpbmUgaGlnaGxpZ2h0IGNvbG9ycyAoZGVmaW5lZCBieSB2YXJpYWJsZXMgaW4geW91ciBzZWxlY3RlZCBzeW50YXggdGhlbWUpIHdpdGggdGhlIGNvbG9ycyBzZWxlY3RlZCBiZWxvdy4nXG4gICAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICBvcmRlcjogMlxuICAgICAgYWRkZWRDb2xvcjpcbiAgICAgICAgdGl0bGU6ICdBZGRlZCBDdXN0b20gQ29sb3InXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbG9yIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBoaWdobGlnaHRpbmcgYWRkZWQgbGluZXMgd2hlbiAqKk92ZXJyaWRlIEhpZ2hsaWdodCBDb2xvcnMqKiBpcyBjaGVja2VkLidcbiAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICBkZWZhdWx0OiAnZ3JlZW4nXG4gICAgICAgIG9yZGVyOiAzXG4gICAgICByZW1vdmVkQ29sb3I6XG4gICAgICAgIHRpdGxlOiAnUmVtb3ZlZCBDdXN0b20gQ29sb3InXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbG9yIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBoaWdobGlnaHRpbmcgcmVtb3ZlZCBsaW5lcyB3aGVuICoqT3ZlcnJpZGUgSGlnaGxpZ2h0IENvbG9ycyoqIGlzIGNoZWNrZWQuJ1xuICAgICAgICB0eXBlOiAnY29sb3InXG4gICAgICAgIGRlZmF1bHQ6ICdyZWQnXG4gICAgICAgIG9yZGVyOiA0XG4iXX0=
