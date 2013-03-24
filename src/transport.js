/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Transport = (function() {
  var pendingRequests = 0, maxParallelRequests, requestCache;

  function Transport(o) {
    utils.bindAll(this);

    o = utils.isString(o) ? { url: o } : o;

    requestCache = requestCache || new RequestCache();

    // shared between all instances, last instance to set it wins
    maxParallelRequests = utils.isNumber(o.maxParallelRequests) ?
      o.maxParallelRequests : maxParallelRequests || 6;

    this.url = o.url;
    this.wildcard = o.wildcard || '%QUERY';
    this.filter = o.filter;
    this.replace = o.replace;

    this.ajaxSettings = {
      type: 'get',
      cache: o.cache,
      timeout: o.timeout,
      dataType: o.dataType || 'json',
      beforeSend: o.beforeSend
    };

    this.get = (/^throttle$/i.test(o.rateLimitFn) ?
      utils.throttle : utils.debounce)(this.get, o.rateLimitWait || 300);
  }

  utils.mixin(Transport.prototype, {

    // public methods
    // --------------

    get: function(query, cb) {
      var that = this,
          encodedQuery = encodeURIComponent(query || ''),
          url,
          resp;

      url = this.replace ?
        this.replace(this.url, encodedQuery) :
        this.url.replace(this.wildcard, encodedQuery);

      if (resp = requestCache.get(url)) {
        cb && cb(resp);
      }

      else if (belowPendingRequestsThreshold()) {
        incrementPendingRequests();
        $.ajax(url, this.ajaxSettings).done(done).always(always);
      }

      else {
        this.onDeckRequestArgs = [].slice.call(arguments, 0);
      }

      // success callback
      function done(resp) {
        resp = that.filter ? that.filter(resp) : resp;

        cb && cb(resp);
        requestCache.set(url, resp);
      }

      // comlete callback
      function always() {
        decrementPendingRequests();

        // ensures request is always made for the latest query
        if (that.onDeckRequestArgs) {
          that.get.apply(that, that.onDeckRequestArgs);
          that.onDeckRequestArgs = null;
        }
      }
    }
  });

  return Transport;

  // static methods
  // --------------

  function incrementPendingRequests() {
    pendingRequests++;
  }

  function decrementPendingRequests() {
    pendingRequests--;
  }

  function belowPendingRequestsThreshold() {
    return pendingRequests < maxParallelRequests;
  }
})();
