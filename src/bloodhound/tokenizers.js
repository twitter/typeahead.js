/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var tokenizers = (function() {
  'use strict';

  return {
    nonword: nonword,
    whitespace: whitespace,
    ngram: ngram,
    obj: {
      nonword: getObjTokenizer(nonword),
      whitespace: getObjTokenizer(whitespace),
      ngram: getObjTokenizer(ngram)
    }
  };

  function whitespace(str) {
    str = _.toStr(str);
    return str ? str.split(/\s+/) : [];
  }

  function nonword(str) {
    str = _.toStr(str);
    return str ? str.split(/\W+/) : [];
  }

  function ngram(str) {
    str = _.toStr(str);

    var tokens = [],
        word = '';

    _.each(str.split(''), function(char) {
      if (char.match(/\s+/)) {
        word = '';
      } else {
        tokens.push(word+char);
        word += char;
      }
    });

    return tokens;
  }

  function getObjTokenizer(tokenizer) {
    return function setKey(keys) {
      keys = _.isArray(keys) ? keys : [].slice.call(arguments, 0);

      return function tokenize(o) {
        var tokens = [];

        _.each(keys, function(k) {
          tokens = tokens.concat(tokenizer(_.toStr(o[k])));
        });

        return tokens;
      };
    };
  }
})();
