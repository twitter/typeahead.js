/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var SearchIndex = (function() {
  'use strict';

  // constructor
  // -----------

  function SearchIndex(o) {
    o = o || {};

    if (!o.datumTokenizer || !o.queryTokenizer) {
      $.error('datumTokenizer and queryTokenizer are both required');
    }

    this.datumTokenizer = o.datumTokenizer;
    this.queryTokenizer = o.queryTokenizer;

    this.reset();
  }

  // instance methods
  // ----------------

  _.mixin(SearchIndex.prototype, {

    // ### public

    bootstrap: function bootstrap(o) {
      this.datums = o.datums;
      this.trie = o.trie;
    },

    add: function(data) {
      var that = this;

      data = _.isArray(data) ? data : [data];

      _.each(data, function(datum) {
        var id, tokens;

        id = that.datums.push(datum) - 1;
        tokens = normalizeTokens(that.datumTokenizer(datum));

        _.each(tokens, function(token) {
          var node, chars, ch;

          node = that.trie;
          chars = token.split('');

          while (ch = chars.shift()) {
            node = node.children[ch] || (node.children[ch] = newNode());
            node.ids.push(id);
          }
        });
      });
    },

    get: function get(query) {
      var that = this, tokens, matches;

      tokens = normalizeTokens(this.queryTokenizer(query));

      _.each(tokens, function(token) {
        var node, chars, ch, ids;

        // previous tokens didn't share any matches
        if (matches && matches.length === 0) {
          return false;
        }

        node = that.trie;
        chars = token.split('');

        while (node && (ch = chars.shift())) {
          node = node.children[ch];
        }

        if (node && chars.length === 0) {
          ids = node.ids.slice(0);
          matches = matches ? getIntersection(matches, ids) : ids;
        }

        // break early if we find out there are no possible matches
        else {
          matches = [];
          return false;
        }
      });

      return matches ?
        _.map(unique(matches), function(id) { return that.datums[id]; }) : [];
    },

    reset: function reset() {
      this.datums = [];
      this.trie = newNode();
    },

    all: function all() {
      return this.datums.slice(0);
    },

    serialize: function serialize() {
      return { datums: this.datums, trie: this.trie };
    }
  });

  return SearchIndex;

  // helper functions
  // ----------------

  function normalizeTokens(tokens) {
   // filter out falsy tokens
    tokens = _.filter(tokens, function(token) { return !!token; });

    // normalize tokens
    tokens = _.map(tokens, function(token) { return token.toLowerCase(); });

    return tokens;
  }

  function newNode() {
    return { ids: [], children: {} };
  }

  function unique(array) {
    var seen = {}, uniques = [];

    for (var i = 0, len = array.length; i < len; i++) {
      if (!seen[array[i]]) {
        seen[array[i]] = true;
        uniques.push(array[i]);
      }
    }

    return uniques;
  }

  function getIntersection(arrayA, arrayB) {
    var ai = 0, bi = 0, intersection = [];

    arrayA = arrayA.sort(compare);
    arrayB = arrayB.sort(compare);

    var lenArrayA = arrayA.length, lenArrayB = arrayB.length;

    while (ai < lenArrayA && bi < lenArrayB) {
      if (arrayA[ai] < arrayB[bi]) {
        ai++;
      }

      else if (arrayA[ai] > arrayB[bi]) {
        bi++;
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
