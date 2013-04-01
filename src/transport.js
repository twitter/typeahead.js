/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Transport = (function() {
  var pendingRequestsCount = 0,
      pendingRequests = {},
      maxPendingRequests,
      requestCache;

  function Transport(o) {
    utils.bindAll(this);

    o = utils.isString(o) ? { url: o } : o;

    requestCache = requestCache || new RequestCache();

    // shared between all instances, last instance to set it wins
    maxPendingRequests = utils.isNumber(o.maxParallelRequests) ?
      o.maxParallelRequests : maxPendingRequests || 6;

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

    this._get = (/^throttle$/i.test(o.rateLimitFn) ?
      utils.throttle : utils.debounce)(this._get, o.rateLimitWait || 300);
  }

  utils.mixin(Transport.prototype, {

    // private methods
    // ---------------

    _get: function(url, cb) {
      var that = this;

      // under the pending request threshold, so fire off a request
      if (belowPendingRequestsThreshold()) {
        this._sendRequest(url).done(done);
      }

      // at the pending request threshold, so hang out in the on deck circle
      else {
        this.onDeckRequestArgs = [].slice.call(arguments, 0);
      }

      // success callback
      function done(resp) {
        var data = that.filter ? that.filter(resp) : resp;

        cb && cb(data);

        // cache the resp and not the results of applying filter
        // in case multiple datasets use the same url and
        // have different filters
        requestCache.set(url, resp);
      }
    },

    _sendRequest: function(url) {
      var that = this, jqXhr = pendingRequests[url];

      if (!jqXhr) {
        incrementPendingRequests();
        jqXhr = pendingRequests[url] =
          $.ajax(url, this.ajaxSettings).always(always);
      }

      return jqXhr;

      function always() {
        decrementPendingRequests();
        pendingRequests[url] = null;

        // ensures request is always made for the last query
        if (that.onDeckRequestArgs) {
          that._get.apply(that, that.onDeckRequestArgs);
          that.onDeckRequestArgs = null;
        }
      }
    },

    // public methods
    // --------------

    get: function(query, cb) {
      var that = this,
          encodedQuery = encodeURIComponent(query || ''),
          url,
          resp;

      cb = cb || utils.noop;

      url = this.replace ?
        this.replace(this.url, encodedQuery) :
        this.url.replace(this.wildcard, encodedQuery);

      // in-memory cache hit
      if (resp = requestCache.get(url)) {
        // defer to stay consistent with behavior of ajax call
        utils.defer(function() { cb(that.filter ? that.filter(resp) : resp); });
      }

      else {
        this._get(url, cb);
      }

      // return bool indicating whether or not a cache hit occurred
      return !!resp;
    }
  });

  return Transport;

  // static methods
  // --------------

  function incrementPendingRequests() {
    pendingRequestsCount++;
  }

  function decrementPendingRequests() {
    pendingRequestsCount--;
  }

  function belowPendingRequestsThreshold() {
    return pendingRequestsCount < maxPendingRequests;
  }
})();
