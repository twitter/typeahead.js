/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var SearchIndex = (function() {

  // constructor
  // -----------

  function SearchIndex() {
    this.datums = [];
    this.trie = newNode();
  }

  // instance methods
  // ----------------

  utils.mixin(SearchIndex.prototype, {

    // ### private methods

    _tokenize: function tokenize(str) {
      return $.trim(str).toLowerCase().split(/\s+/);
    },

    // ### public methods

    bootstrap: function bootstrap(o) {
      this.datums = o.datums;
      this.trie = o.trie;
    },

    add: function(data) {
      var that = this;

      data = utils.isArray(data) ? data : [data];

      utils.each(data, function(i, datum) {
        var id, tokens;

        id = that.datums.push(datum) - 1;
        tokens = that._tokenize(datum.value);

        utils.each(tokens, function(i, token) {
          var node, chars, ch, ids;

          node = that.trie;
          chars = token.split('');

          while (ch = chars.shift()) {
            node = node.children[ch] || (node.children[ch] = newNode());
            node.ids.push(id);
          }
        });
      });
    },

    remove: function remove() {
      $.error('not implemented');
    },

    get: function get(query) {
      var that = this, tokens, matches;

      tokens = this._tokenize(query);

      utils.each(tokens, function(i, token) {
        var node, chars, ch, ids;

        // previous tokens didn't share any matches
        if (matches && matches.length === 0) {
          return false;
        }

        node = that.trie;
        chars = token.split('');

        while ((ch = chars.shift()) && node.children[ch]) {
          node = node.children[ch];
        }

        if (chars.length === 0) {
          ids = node.ids.slice(0);
          matches = matches ? getIntersection(matches, ids) : ids;
        }

        // break early if we find out there are no possible matches
        else {
          return false;
        }
      });

      return matches ?
        utils.map(matches, function(id) { return that.datums[id]; }) : [];
    },

    serialize: function serialize() {
      return { datums: this.datums, trie: this.trie };
    }
  });

  return SearchIndex;

  // helper functions
  // ----------------

  function newNode() {
    return { ids: [], children: {} };
  }

  function getIntersection(arrayA, arrayB) {
    var ai = 0, bi = 0, intersection = [];

    arrayA = arrayA.sort(compare);
    arrayB = arrayB.sort(compare);

    while (ai < arrayA.length && bi < arrayB.length) {
      if (arrayA[ai] < arrayB[bi]) {
        ai++;
      }

      else if (arrayA[ai] > arrayB[bi]) {
        ai++;
      }

      else {
        intersection.push(arrayA[ai]);
        ai++;
        bi++;
      }
    }

    return intersection;

    function compare(a, b) { return a - b; }
  }
})();
