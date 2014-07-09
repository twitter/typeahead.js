/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var oParser = (function() {
  'use strict';

  return {
    local: getLocal,
    prefetch: getPrefetch,
    remote: getRemote
  };

  function getLocal(o) {
    return o.local || null;
  }

  function getPrefetch(o) {
    var prefetch, defaults;

    defaults = {
      url: null,
      thumbprint: '',
      ttl: 24 * 60 * 60 * 1000, // 1 day
      filter: null,
      ajax: {}
    };

    if (prefetch = o.prefetch || null) {
      // support basic (url) and advanced configuration
      prefetch = _.isString(prefetch) ? { url: prefetch } : prefetch;

      prefetch = _.mixin(defaults, prefetch);
      prefetch.thumbprint = VERSION + prefetch.thumbprint;

      prefetch.ajax.type = prefetch.ajax.type || 'GET';
      prefetch.ajax.dataType = prefetch.ajax.dataType || 'json';

      !prefetch.url && $.error('prefetch requires url to be set');
    }

    return prefetch;
  }

  function getRemote(o) {
    var remote, defaults;

    defaults = {
      url: null,
      cache: true,
      wildcard: '%QUERY',
      replace: null,
      rateLimitBy: 'debounce',
      rateLimitWait: 300,
      send: null,
      filter: null,
      ajax: {}
    };

    if (remote = o.remote || null) {
      // support basic (url) and advanced configuration
      remote = _.isString(remote) ? { url: remote } : remote;

      remote = _.mixin(defaults, remote);
      remote.rateLimiter = /^throttle$/i.test(remote.rateLimitBy) ?
        byThrottle(remote.rateLimitWait) : byDebounce(remote.rateLimitWait);

      remote.ajax.type = remote.ajax.type || 'GET';
      remote.ajax.dataType = remote.ajax.dataType || 'json';

      delete remote.rateLimitBy;
      delete remote.rateLimitWait;

      !remote.url && $.error('remote requires url to be set');
    }

    return remote;

    function byDebounce(wait) {
      return function(fn) { return _.debounce(fn, wait); };
    }

    function byThrottle(wait) {
      return function(fn) { return _.throttle(fn, wait); };
    }
  }
})();
