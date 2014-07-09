/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var tokenizers = (function(root) {
  'use strict';

  return {
    nonword: nonword,
    whitespace: whitespace,
    obj: {
      nonword: getObjTokenizer(nonword),
      whitespace: getObjTokenizer(whitespace)
    }
  };

  function toStr(s) { return (_.isUndefined(s) || s === null) ? '' : s + ''; }

  function whitespace(str) {
    str = toStr(str);
    return str ? str.split(/\s+/) : [];
  }

  function nonword(str) {
    str = toStr(str);
    return str ? str.split(/\W+/) : [];
  }

  function getObjTokenizer(tokenizer) {
    return function setKey(/* key, ... */) {
      var args = [].slice.call(arguments, 0);

      return function tokenize(o) {
        var val, tokens = [];

        _.each(args, function(k) {
          tokens = tokens.concat(tokenizer(toStr(o[k])));
        });

        return tokens;
      };
    };
  }
})();
