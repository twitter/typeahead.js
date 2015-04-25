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
    obj: {
      nonword: getObjTokenizer(nonword),
      whitespace: getObjTokenizer(whitespace)
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

  function getObjTokenizer(tokenizer) {
    return function setKey(key1/*, key2, ... */) {
      var args;
      if (_.isArray(key1)) {
        args = key1;
      } else {
        args = [].slice.call(arguments, 0);
      }

      return function tokenize(o) {
        var tokens = [];

        _.each(args, function(k) {
          tokens = tokens.concat(tokenizer(_.toStr(o[k])));
        });

        return tokens;
      };
    };
  }
})();
