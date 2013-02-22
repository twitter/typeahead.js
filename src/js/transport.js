/*
 * Twitter Typeahead
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Transport = (function() {
  var concurrentConnections = 0,
      maxConcurrentConnections,
      requestCache;

  function Transport(o) {
    utils.bindAll(this);

    o = o || {};

    maxConcurrentConnections = utils.isNumber(o.maxConcurrentConnections) ?
      o.maxConcurrentConnections : maxConcurrentConnections || 6;

    this.wildcard = o.wildcard || '%QUERY';

    this.ajaxSettings = utils.mixin({}, o.ajax, {
      // needs to be true to jqXHR methods (done, always)
      // also you're out of your mind if you want to make a sync request
      async: true,
      beforeSend: function() {
        incrementConcurrentConnections();

        if (o.ajax.beforeSend) {
          return o.ajax.beforeSend.apply(this, arguments);
        }
      }
    });

    requestCache = requestCache || new RequestCache();

    this.get = (/^throttle$/i.test(o.rateLimitFn) ?
      utils.throttle : utils.debounce)(this.get, o.wait || 300);
  }

  utils.mixin(Transport.prototype, {

    // public methods
    // --------------

    get: function(url, query, cb) {
      var that = this, resp;

      url = url.replace(this.wildcard, encodeURIComponent(query || ''));

      if (resp = requestCache.get(url)) {
        cb && cb(resp);
      }

      else if (belowConcurrentConnectionsThreshold()) {
        $.ajax(this.ajaxSettings)
        .done(function(resp) {
          cb && cb(resp);
          requestCache.set(url, resp);
        })
        .always(function() {
          decrementConcurrentConnections();

          // ensures request is always made for the latest query
          if (that.onDeckRequestArgs) {
            that.get.apply(that, that.onDeckRequestArgs);
            that.onDeckRequestArgs = null;
          }
        });
      }

      else {
        this.onDeckRequestArgs = [].slice.call(arguments, 0);
      }
    }
  });

  return Transport;

  // static methods
  // --------------

  function incrementConcurrentConnections() {
    concurrentConnections++;
  }

  function decrementConcurrentConnections() {
    concurrentConnections--;
  }

  function belowConcurrentConnectionsThreshold() {
    return concurrentConnections < maxConcurrentConnections;
  }
})();
