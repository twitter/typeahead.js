/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Transport = (function() {
  'use strict';

  var pendingRequestsCount = 0,
      pendingRequests = {},
      maxPendingRequests = 6,
      sharedCache = new LruCache(10);

  // constructor
  // -----------

  function Transport(o) {
    o = o || {};

    this.cancelled = false;
    this.lastUrl = null;

    this._send = o.transport ? callbackToDeferred(o.transport) : $.ajax;
    this._get = o.rateLimiter ? o.rateLimiter(this._get) : this._get;

    // eh, should this even exist? relying on the browser's cache may be enough
    this._cache = o.cache === false ? new LruCache(0) : sharedCache;
  }

  // static methods
  // --------------

  Transport.setMaxPendingRequests = function setMaxPendingRequests(num) {
    maxPendingRequests = num;
  };

  Transport.resetCache = function resetCache() {
    sharedCache.reset();
  };

  // instance methods
  // ----------------

  _.mixin(Transport.prototype, {

    // ### private

    _get: function(url, o, cb) {
      var that = this, jqXhr;

      // #149: don't make a network request if there has been a cancellation
      // or if the url doesn't match the last url Transport#get was invoked with
      if (this.cancelled || url !== this.lastUrl) { return; }

      // a request is already in progress, piggyback off of it
      if (jqXhr = pendingRequests[url]) {
        jqXhr.done(done).fail(fail);
      }

      // under the pending request threshold, so fire off a request
      else if (pendingRequestsCount < maxPendingRequests) {
        pendingRequestsCount++;
        pendingRequests[url] =
          this._send(url, o).done(done).fail(fail).always(always);
      }

      // at the pending request threshold, so hang out in the on deck circle
      else {
        this.onDeckRequestArgs = [].slice.call(arguments, 0);
      }

      function done(resp) {
        cb && cb(null, resp);
        that._cache.set(url, resp);
      }

      function fail() {
        cb && cb(true);
      }

      function always() {
        pendingRequestsCount--;
        delete pendingRequests[url];

        // ensures request is always made for the last query
        if (that.onDeckRequestArgs) {
          that._get.apply(that, that.onDeckRequestArgs);
          that.onDeckRequestArgs = null;
        }
      }
    },

    // ### public

    get: function(url, o, cb) {
      var resp;

      if (_.isFunction(o)) {
        cb = o;
        o = {};
      }

      this.cancelled = false;
      this.lastUrl = url;

      // in-memory cache hit
      if (resp = this._cache.get(url)) {
        // defer to stay consistent with behavior of ajax call
        _.defer(function() { cb && cb(null, resp); });
      }

      else {
        this._get(url, o, cb);
      }

      // return bool indicating whether or not a cache hit occurred
      return !!resp;
    },

    cancel: function() {
      this.cancelled = true;
    }
  });

  return Transport;

  // helper functions
  // ----------------

  function callbackToDeferred(fn) {
    return function customSendWrapper(url, o) {
      var deferred = $.Deferred();

      fn(url, o, onSuccess, onError);

      return deferred;

      function onSuccess(resp) {
        // defer in case fn is synchronous, otherwise done
        // and always handlers will be attached after the resolution
        _.defer(function() { deferred.resolve(resp); });
      }

      function onError(err) {
        // defer in case fn is synchronous, otherwise done
        // and always handlers will be attached after the resolution
        _.defer(function() { deferred.reject(err); });
      }
    };
  }
})();
