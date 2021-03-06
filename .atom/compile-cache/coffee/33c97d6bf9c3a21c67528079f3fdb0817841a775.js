(function() {
  module.exports = {
    name: "PHP",
    namespace: "php",

    /*
    Supported Grammars
     */
    grammars: ["PHP"],

    /*
    Supported extensions
     */
    extensions: ["php", "module", "inc"],
    defaultBeautifier: "PHP-CS-Fixer",
    options: {
      cs_fixer_path: {
        title: "PHP-CS-Fixer Path",
        type: 'string',
        "default": "",
        description: "Absolute path to the `php-cs-fixer` CLI executable"
      },
      cs_fixer_version: {
        title: "PHP-CS-Fixer Version",
        type: 'integer',
        "default": 2,
        "enum": [1, 2]
      },
      fixers: {
        type: 'string',
        "default": "",
        description: "Add fixer(s). i.e. linefeed,-short_tag,indentation (PHP-CS-Fixer 1 only)"
      },
      level: {
        type: 'string',
        "default": "",
        description: "By default, all PSR-2 fixers and some additional ones are run. (PHP-CS-Fixer 1 only)"
      },
      rules: {
        type: 'string',
        "default": "",
        description: "Add rule(s). i.e. line_ending,-full_opening_tag,@PSR2 (PHP-CS-Fixer 2 only)"
      },
      phpcbf_path: {
        title: "PHPCBF Path",
        type: 'string',
        "default": "",
        description: "Path to the `phpcbf` CLI executable"
      },
      standard: {
        title: "PHPCBF Standard",
        type: 'string',
        "default": "",
        description: "Standard name Squiz, PSR2, PSR1, PHPCS, PEAR, Zend, MySource... or path to CS rules. Will use local `phpcs.xml`, `phpcs.xml.dist`, `phpcs.ruleset.xml` or `ruleset.xml` if found in the project root."
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvY2hyaXMvc291cmNlL2Jvb3RzdHJhcHBpbmcvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcmMvbGFuZ3VhZ2VzL3BocC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUVmLElBQUEsRUFBTSxLQUZTO0lBR2YsU0FBQSxFQUFXLEtBSEk7O0FBS2Y7OztJQUdBLFFBQUEsRUFBVSxDQUNSLEtBRFEsQ0FSSzs7QUFZZjs7O0lBR0EsVUFBQSxFQUFZLENBQ1YsS0FEVSxFQUVWLFFBRlUsRUFHVixLQUhVLENBZkc7SUFxQmYsaUJBQUEsRUFBbUIsY0FyQko7SUF1QmYsT0FBQSxFQUNFO01BQUEsYUFBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLG1CQUFQO1FBQ0EsSUFBQSxFQUFNLFFBRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRlQ7UUFHQSxXQUFBLEVBQWEsb0RBSGI7T0FERjtNQUtBLGdCQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sc0JBQVA7UUFDQSxJQUFBLEVBQU0sU0FETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsQ0FGVDtRQUdBLENBQUEsSUFBQSxDQUFBLEVBQU0sQ0FBQyxDQUFELEVBQUksQ0FBSixDQUhOO09BTkY7TUFVQSxNQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsRUFEVDtRQUVBLFdBQUEsRUFBYSwwRUFGYjtPQVhGO01BY0EsS0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRFQ7UUFFQSxXQUFBLEVBQWEsc0ZBRmI7T0FmRjtNQWtCQSxLQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsRUFEVDtRQUVBLFdBQUEsRUFBYSw2RUFGYjtPQW5CRjtNQXNCQSxXQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sYUFBUDtRQUNBLElBQUEsRUFBTSxRQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQUZUO1FBR0EsV0FBQSxFQUFhLHFDQUhiO09BdkJGO01BMkJBLFFBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxpQkFBUDtRQUNBLElBQUEsRUFBTSxRQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQUZUO1FBR0EsV0FBQSxFQUFhLHVNQUhiO09BNUJGO0tBeEJhOztBQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIG5hbWU6IFwiUEhQXCJcbiAgbmFtZXNwYWNlOiBcInBocFwiXG5cbiAgIyMjXG4gIFN1cHBvcnRlZCBHcmFtbWFyc1xuICAjIyNcbiAgZ3JhbW1hcnM6IFtcbiAgICBcIlBIUFwiXG4gIF1cblxuICAjIyNcbiAgU3VwcG9ydGVkIGV4dGVuc2lvbnNcbiAgIyMjXG4gIGV4dGVuc2lvbnM6IFtcbiAgICBcInBocFwiXG4gICAgXCJtb2R1bGVcIlxuICAgIFwiaW5jXCJcbiAgXVxuXG4gIGRlZmF1bHRCZWF1dGlmaWVyOiBcIlBIUC1DUy1GaXhlclwiXG5cbiAgb3B0aW9uczpcbiAgICBjc19maXhlcl9wYXRoOlxuICAgICAgdGl0bGU6IFwiUEhQLUNTLUZpeGVyIFBhdGhcIlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFic29sdXRlIHBhdGggdG8gdGhlIGBwaHAtY3MtZml4ZXJgIENMSSBleGVjdXRhYmxlXCJcbiAgICBjc19maXhlcl92ZXJzaW9uOlxuICAgICAgdGl0bGU6IFwiUEhQLUNTLUZpeGVyIFZlcnNpb25cIlxuICAgICAgdHlwZTogJ2ludGVnZXInXG4gICAgICBkZWZhdWx0OiAyXG4gICAgICBlbnVtOiBbMSwgMl1cbiAgICBmaXhlcnM6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgZGVzY3JpcHRpb246IFwiQWRkIGZpeGVyKHMpLiBpLmUuIGxpbmVmZWVkLC1zaG9ydF90YWcsaW5kZW50YXRpb24gKFBIUC1DUy1GaXhlciAxIG9ubHkpXCJcbiAgICBsZXZlbDpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICBkZXNjcmlwdGlvbjogXCJCeSBkZWZhdWx0LCBhbGwgUFNSLTIgZml4ZXJzIGFuZCBzb21lIGFkZGl0aW9uYWwgb25lcyBhcmUgcnVuLiAoUEhQLUNTLUZpeGVyIDEgb25seSlcIlxuICAgIHJ1bGVzOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBydWxlKHMpLiBpLmUuIGxpbmVfZW5kaW5nLC1mdWxsX29wZW5pbmdfdGFnLEBQU1IyIChQSFAtQ1MtRml4ZXIgMiBvbmx5KVwiXG4gICAgcGhwY2JmX3BhdGg6XG4gICAgICB0aXRsZTogXCJQSFBDQkYgUGF0aFwiXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgZGVzY3JpcHRpb246IFwiUGF0aCB0byB0aGUgYHBocGNiZmAgQ0xJIGV4ZWN1dGFibGVcIixcbiAgICBzdGFuZGFyZDpcbiAgICAgIHRpdGxlOiBcIlBIUENCRiBTdGFuZGFyZFwiXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogXCJcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlN0YW5kYXJkIG5hbWUgU3F1aXosIFBTUjIsIFBTUjEsIFBIUENTLCBQRUFSLCBaZW5kLCBNeVNvdXJjZS4uLiBvciBwYXRoIHRvIENTIHJ1bGVzLiBXaWxsIHVzZSBsb2NhbCBgcGhwY3MueG1sYCwgYHBocGNzLnhtbC5kaXN0YCwgYHBocGNzLnJ1bGVzZXQueG1sYCBvciBgcnVsZXNldC54bWxgIGlmIGZvdW5kIGluIHRoZSBwcm9qZWN0IHJvb3QuXCJcblxufVxuIl19
