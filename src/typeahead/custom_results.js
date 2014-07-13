/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var CustomResults = (function() {
  'use strict';

  function CustomResults(o) {
    Results.call(this, o);
  }

  _.mixin(CustomResults.prototype, Results.prototype, {
    _hide: _.noop,
    _show: _.noop
  });

  return CustomResults;
})();
