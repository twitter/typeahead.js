/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Bloodhound = window.Bloodhound = (function() {
  var keys;

  keys = { data: 'data', protocol: 'protocol', thumbprint: 'thumbprint' };

  // constructor
  // -----------

  function Bloodhound(o) {
    if (!o || (!o.local && !o.prefetch && !o.remote)) {
      $.error('one of local, prefetch, or remote is required');
    }

    this.limit = o.limit || 5;
    this.sorter = getSorter(o.sorter);
    this.dupDetector = o.dupDetector || ignoreDuplicates;

    this.local = oParser.local(o);
    this.prefetch = oParser.prefetch(o);
    this.remote = oParser.remote(o);

    this.cacheKey = this.prefetch ?
      (this.prefetch.cacheKey || this.prefetch.url) : null;

    // the backing data structure used for fast pattern matching
    this.index = new SearchIndex({
      datumTokenizer: o.datumTokenizer,
      queryTokenizer: o.queryTokenizer
    });

    // only initialize storage if there's a cacheKey otherwise
    // loading from storage on subsequent page loads is impossible
    this.storage = this.cacheKey ? new PersistentStorage(this.cacheKey) : null;
  }

  // static methods
  // --------------

  Bloodhound.tokenizers = {
    whitespace: function whitespaceTokenizer(s) {
      return s.split(/\s+/);
    },

    nonword: function nonwordTokenizer(s) {
      return s.split(/\W+/);
    }
  };

  // instance methods
  // ----------------

  _.mixin(Bloodhound.prototype, {

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
        var filtered;

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

        cb(filtered);
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
      var stored = {}, isExpired;

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
    // to help improve the testability of bloodhounds
    initialize: function initialize() {
      var that = this, deferred;

      deferred = this.prefetch ?
        this._loadPrefetch(this.prefetch) : $.Deferred().resolve();

      // make sure local is added to the index after prefetch
      this.local && deferred.done(addLocalToIndex);

      this.transport = this.remote ? new Transport(this.remote) : null;
      this.initialize = function initialize() { return deferred.promise(); };

      return deferred.promise();

      function addLocalToIndex() { that.add(that.local); }
    },

    add: function add(data) {
      this.index.add(data);
    },

    get: function get(query, cb) {
      var that = this, matches, cacheHit = false;

      matches = this.index.get(query);
      matches = this.sorter(matches).slice(0, this.limit);

      if (matches.length < this.limit && this.transport) {
        cacheHit = this._getFromRemote(query, returnRemoteMatches);
      }

      // if a cache hit occurred, skip rendering local matches
      // because the rendering of local/remote matches is already
      // in the event loop
      !cacheHit && cb && cb(matches);

      function returnRemoteMatches(remoteMatches) {
        var matchesWithBackfill = matches.slice(0);

        _.each(remoteMatches, function(remoteMatch) {
          var isDuplicate;

          // checks for duplicates
          isDuplicate = _.some(matchesWithBackfill, function(match) {
            return that.dupDetector(remoteMatch, match);
          });

          !isDuplicate && matchesWithBackfill.push(remoteMatch);

          // if we're at the limit, we no longer need to process
          // the remote results and can break out of the each loop
          return matchesWithBackfill.length < that.limit;
        });

        cb && cb(that.sorter(matchesWithBackfill));
      }
    },

    ttAdapter: function ttAdapter() { return _.bind(this.get, this); }
  });

  return Bloodhound;

  // helper functions
  // ----------------

  function getSorter(sortFn) {
    return _.isFunction(sortFn) ? sort : noSort;

    function sort(array) { return array.sort(sortFn); }
    function noSort(array) { return array; }
  }

  function ignoreDuplicates() { return false; }
})();
