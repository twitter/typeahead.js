/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var RequestCache = (function() {

  function RequestCache(o) {
    utils.bindAll(this);

    o = o || {};

    this.sizeLimit = o.sizeLimit || 10;

    this.cache = {};
    this.cachedKeysByAge = [];
  }

  utils.mixin(RequestCache.prototype, {

    // public methods
    // --------------

    get: function(url) {
      return this.cache[url];
    },

    set: function(url, resp) {
      var requestToEvict;

      if (this.cachedKeysByAge.length === this.sizeLimit) {
        requestToEvict = this.cachedKeysByAge.shift();
        delete this.cache[requestToEvict];
      }

      this.cache[url] = resp;
      this.cachedKeysByAge.push(url);
    }
  });

  return RequestCache;
})();
