/*
 * Twitter Typeahead
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Transport = (function() {

  function Transport(o) {
    var rateLimitFn;

    utils.bindAll(this);

    o = o || {};

    rateLimitFn = (/^throttle$/i).test(o.rateLimitFn) ?
      utils.throttle : utils.debounce;

    this.wait = o.wait || 300;
    this.wildcard = o.wildcard || '%QUERY';
    this.maxConcurrentRequests = o.maxConcurrentRequests || 6;

    this.concurrentRequests = 0;
    this.onDeckRequestArgs = null;

    this.cache = new RequestCache();

    this.get = rateLimitFn(this.get, this.wait);
  }

  utils.mixin(Transport.prototype, {

    // private methods
    // ---------------

    _incrementConcurrentRequests: function() {
      this.concurrentRequests++;
    },

    _decrementConcurrentRequests: function() {
      this.concurrentRequests--;
    },

    _belowConcurrentRequestsThreshold: function() {
      return this.concurrentRequests < this.maxConcurrentRequests;
    },

    _getDataType: function (url) {
      //IE does not support location.origin, therefore we build it manuaully
      var origin = [location.protocol,'//',location.host].join('');

      return new RegExp(origin).test(url) ? 'json' : 'jsonp';
    },

    // public methods
    // --------------

    get: function(url, query, cb) {
      var that = this, resp;

      url = url.replace(this.wildcard, encodeURIComponent(query || ''));
      var dataType = this._getDataType(url);

      if (resp = this.cache.get(url)) {
        cb && cb(resp);
      }

      else if (this._belowConcurrentRequestsThreshold()) {
        $.ajax({
          url: url,
          type: 'GET',
          dataType: dataType,
          beforeSend: function() {
            that._incrementConcurrentRequests();
          },
          success: function(resp) {
            cb && cb(resp);
            that.cache.set(url, resp);
          },
          complete: function() {
            that._decrementConcurrentRequests();

            if (that.onDeckRequestArgs) {
              that.get.apply(that, that.onDeckRequestArgs);
              that.onDeckRequestArgs = null;
            }
          }
        });
      }

      else {
        this.onDeckRequestArgs = [].slice.call(arguments, 0);
      }
    }
  });

  return Transport;
})();
