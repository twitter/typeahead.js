/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Dataset = window.Dataset = (function() {
  var keys;

  keys = { data: 'data', protocol: 'protocol', thumbprint: 'thumbprint' };

  // constructor
  // -----------

  function Dataset(o) {
    if (!o || (!o.local && !o.prefetch && !o.remote)) {
      $.error('one of local, prefetch, or remote is required');
    }

    this.name = o.name || _.getUniqueId();
    this.limit = o.limit || 5;
    this.valueKey = o.valueKey || 'value';
    this.dupChecker = getDupChecker(o.dupChecker);
    this.sorter = getSorter(o.sorter);

    this.local = getLocal(o);
    this.prefetch = getPrefetch(o);
    this.remote = getRemote(o);

    // the backing data structure used for fast pattern matching
    this.index = new SearchIndex({ tokenizer: o.tokenizer });

    // only initialize storage if there's a name otherwise
    // loading from storage on subsequent page loads is impossible
    this.storage = o.name ? new PersistentStorage(o.name) : null;
  }

  // instance methods
  // ----------------

  _.mixin(Dataset.prototype, {

    // ### private

    _loadPrefetch: function loadPrefetch(o) {
      var that = this, serialized, deferred;

      if (serialized = this._readFromStorage(o.thumbprint)) {
        this.index.bootstrap(serialized);
        deferred = $.Deferred().resolve();
      }

      else {
        deferred = $.ajax(o.url, o.ajax).done(handlePrefetchResponse);
      }

      return deferred;

      function handlePrefetchResponse(resp) {
        var filtered, normalized;

        filtered = o.filter ? o.filter(resp) : resp;
        that.add(filtered);

        that._saveToStorage(that.index.serialize(), o.thumbprint, o.ttl);
      }
    },

    _getFromRemote: function getFromRemote(query, cb) {
      var that = this, url, uriEncodedQuery;

      query = query || '';

      uriEncodedQuery = encodeURIComponent(query);

      url = this.remote.replace ?
        this.remote.replace(this.remote.url, query) :
        this.remote.url.replace(this.remote.wildcard, uriEncodedQuery);

      return this.transport.get(url, this.remote.ajax, handleRemoteResponse);

      function handleRemoteResponse(resp) {
        var filtered = that.remote.filter ? that.remote.filter(resp) : resp;

        cb(that._normalize(filtered));
      }
    },

    _normalize: function normalize(data) {
      var that = this;

      return _.map(data, normalizeRawDatum);

      function normalizeRawDatum(raw) {
        var value, datum;

        value = _.isString(raw) ? raw : raw[that.valueKey];
        datum = { value: value, tokens: raw.tokens };

        _.isString(raw) ?
          (datum.raw = {})[that.valueKey] = raw :
          datum.raw = raw;

        return datum;
      }
    },

    _saveToStorage: function saveToStorage(data, thumbprint, ttl) {
      if (this.storage) {
        this.storage.set(keys.data, data, ttl);
        this.storage.set(keys.protocol, location.protocol, ttl);
        this.storage.set(keys.thumbprint, thumbprint, ttl);
      }
    },

    _readFromStorage: function readFromStorage(thumbprint) {
      var stored = {};

      if (this.storage) {
        stored.data = this.storage.get(keys.data);
        stored.protocol = this.storage.get(keys.protocol);
        stored.thumbprint = this.storage.get(keys.thumbprint);
      }
      // the stored data is considered expired if the thumbprints
      // don't match or if the protocol it was originally stored under
      // has changed
      isExpired = stored.thumbprint !== thumbprint ||
        stored.protocol !== location.protocol;

      return stored.data && !isExpired ? stored.data : null;
    },

    // ### public

    // the contents of this function are broken out of the constructor
    // to help improve the testability of datasets
    initialize: function initialize() {
      var that = this, deferred;

      deferred = this.prefetch ?
        this._loadPrefetch(this.prefetch) : $.Deferred().resolve();

      // make sure local is added to the index after prefetch
      this.local && deferred.done(addLocalToIndex);

      this.transport = this.remote ? new Transport(this.remote) : null;
      this.initialize = function initialize() { return that; };

      return this;

      function addLocalToIndex() { that.add(that.local); }
    },

    add: function add(data) {
      var normalized;

      data = _.isArray(data) ? data : [data];
      normalized = this._normalize(data);

      this.index.add(normalized);
    },

    get: function get(query, cb) {
      var that = this, matches, cacheHit = false;

      matches = _.map(this.index.get(query), pickRaw)
      .sort(this.sorter)
      .slice(0, this.limit);

      if (matches.length < this.limit && this.transport) {
        cacheHit = this._getFromRemote(query, returnRemoteMatches);
      }

      // if a cache hit occurred, skip rendering local matches
      // because the rendering of local/remote matches is already
      // in the event loop
      !cacheHit && cb && cb(matches);

      function returnRemoteMatches(remoteMatches) {
        var matchesWithBackfill = matches.slice(0);

        remoteMatches = _.map(remoteMatches, pickRaw);

        _.each(remoteMatches, function(remoteMatch) {
          var isDuplicate;

          // checks for duplicates
          isDuplicate = _.some(matchesWithBackfill, function(match) {
            return that.dupChecker(remoteMatch, match);
          });

          !isDuplicate && matchesWithBackfill.push(remoteMatch);

          // if we're at the limit, we no longer need to process
          // the remote results and can break out of the each loop
          return matchesWithBackfill.length < that.limit;
        });

        cb && cb(matchesWithBackfill.sort(this.sorter));
      }

      function pickRaw(obj) { return obj.raw; }
    }
  });

  return Dataset;

  // helper functions
  // ----------------

  function getSorter(sorter) {
    return sorter || defaultSorter;

    function defaultSorter() { return 0; }
  }

  function getDupChecker(dupChecker) {
    if (!_.isFunction(dupChecker)) {
      dupChecker = dupChecker === false ? ignoreDups : standardDupChecker;
    }

    return dupChecker;

    function ignoreDups() { return false; }
    function standardDupChecker(a, b) { return a.value === b.value; }
  }

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

      prefetch.ajax.method = prefetch.ajax.method || 'get';
      prefetch.ajax.dataType = prefetch.ajax.dataType || 'json';
    }

    return prefetch;
  }

  function getRemote(o) {
    var remote, defaults;

    defaults = {
      url: null,
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

      remote.ajax.method = remote.ajax.method || 'get';
      remote.ajax.dataType = remote.ajax.dataType || 'json';

      delete remote.rateLimitBy;
      delete remote.rateLimitWait;
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
