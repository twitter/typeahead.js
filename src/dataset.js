/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Dataset = (function() {
  var keys = {
        thumbprint: 'thumbprint',
        protocol: 'protocol',
        itemHash: 'itemHash',
        adjacencyList: 'adjacencyList'
      };

  function Dataset(o) {
    utils.bindAll(this);

    if (utils.isString(o.template) && !o.engine) {
      $.error('no template engine specified');
    }

    if (!o.local && !o.prefetch && !o.remote) {
      $.error('one of local, prefetch, or remote is required');
    }

    this.name = o.name || utils.getUniqueId();
    this.limit = o.limit || 5;
    this.minLength = o.minLength || 1;
    this.header = o.header;
    this.footer = o.footer;
    this.valueKey = o.valueKey || 'value';
    this.template = compileTemplate(o.template, o.engine, this.valueKey);

    // used then deleted in #initialize
    this.local = o.local;
    this.prefetch = o.prefetch;
    this.remote = o.remote;

    this.itemHash = {};
    this.adjacencyList = {};

    // only initialize storage if there's a name otherwise
    // loading from storage on subsequent page loads is impossible
    this.storage = o.name ? new PersistentStorage(o.name) : null;
  }

  utils.mixin(Dataset.prototype, {

    // private methods
    // ---------------

    _processLocalData: function(data) {
      this._mergeProcessedData(this._processData(data));
    },

    _loadPrefetchData: function(o) {
      var that = this,
          thumbprint = VERSION + (o.thumbprint || ''),
          storedThumbprint,
          storedProtocol,
          storedItemHash,
          storedAdjacencyList,
          isExpired,
          deferred;

      if (this.storage) {
        storedThumbprint = this.storage.get(keys.thumbprint);
        storedProtocol = this.storage.get(keys.protocol);
        storedItemHash = this.storage.get(keys.itemHash);
        storedAdjacencyList = this.storage.get(keys.adjacencyList);
      }

      isExpired = storedThumbprint !== thumbprint ||
        storedProtocol !== utils.getProtocol();

      o = utils.isString(o) ? { url: o } : o;
      o.ttl = utils.isNumber(o.ttl) ? o.ttl : 24 * 60 * 60 * 1000;

      // data was available in local storage, use it
      if (storedItemHash && storedAdjacencyList && !isExpired) {
        this._mergeProcessedData({
          itemHash: storedItemHash,
          adjacencyList: storedAdjacencyList
        });

        deferred = $.Deferred().resolve();
      }

      else {
        deferred = $.getJSON(o.url).done(processPrefetchData);
      }

      return deferred;

      function processPrefetchData(data) {
        var filteredData = o.filter ? o.filter(data) : data,
            processedData = that._processData(filteredData),
            itemHash = processedData.itemHash,
            adjacencyList = processedData.adjacencyList;

        // store process data in local storage, if storage is available
        // this saves us from processing the data on every page load
        if (that.storage) {
          that.storage.set(keys.itemHash, itemHash, o.ttl);
          that.storage.set(keys.adjacencyList, adjacencyList, o.ttl);
          that.storage.set(keys.thumbprint, thumbprint, o.ttl);
          that.storage.set(keys.protocol, utils.getProtocol(), o.ttl);
        }

        that._mergeProcessedData(processedData);
      }
    },

    _transformDatum: function(datum) {
      var value = utils.isString(datum) ? datum : datum[this.valueKey],
          tokens = datum.tokens || utils.tokenizeText(value),
          item = { value: value, tokens: tokens };

      if (utils.isString(datum)) {
        item.datum = {};
        item.datum[this.valueKey] = datum;
      }

      else {
        item.datum = datum;
      }

      // filter out falsy tokens
      item.tokens = utils.filter(item.tokens, function(token) {
        return !utils.isBlankString(token);
      });

      // normalize tokens
      item.tokens = utils.map(item.tokens, function(token) {
        return token.toLowerCase();
      });

      return item;
    },

    _processData: function(data) {
      var that = this, itemHash = {}, adjacencyList = {};

      utils.each(data, function(i, datum) {
        var item = that._transformDatum(datum),
            id = utils.getUniqueId(item.value);

        itemHash[id] = item;

        utils.each(item.tokens, function(i, token) {
          var character = token.charAt(0),
              adjacency = adjacencyList[character] ||
                (adjacencyList[character] = [id]);

          !~utils.indexOf(adjacency, id) && adjacency.push(id);
        });
      });

      return { itemHash: itemHash, adjacencyList: adjacencyList };
    },

    _mergeProcessedData: function(processedData) {
      var that = this;

      // merge item hash
      utils.mixin(this.itemHash, processedData.itemHash);

      // merge adjacency list
      utils.each(processedData.adjacencyList, function(character, adjacency) {
        var masterAdjacency = that.adjacencyList[character];

        that.adjacencyList[character] = masterAdjacency ?
          masterAdjacency.concat(adjacency) : adjacency;
      });
    },

    _getLocalSuggestions: function(terms) {
      var that = this,
          firstChars = [],
          lists = [],
          shortestList,
          suggestions = [];

      // create a unique array of the first chars in
      // the terms this comes in handy when multiple
      // terms start with the same letter
      utils.each(terms, function(i, term) {
        var firstChar = term.charAt(0);
        !~utils.indexOf(firstChars, firstChar) && firstChars.push(firstChar);
      });

      utils.each(firstChars, function(i, firstChar) {
        var list = that.adjacencyList[firstChar];

        // break out of the loop early
        if (!list) { return false; }

        lists.push(list);

        if (!shortestList || list.length < shortestList.length) {
          shortestList = list;
        }
      });

      // no suggestions :(
      if (lists.length < firstChars.length) {
        return [];
      }

      // populate suggestions
      utils.each(shortestList, function(i, id) {
        var item = that.itemHash[id], isCandidate, isMatch;

        isCandidate = utils.every(lists, function(list) {
          return ~utils.indexOf(list, id);
        });

        isMatch = isCandidate && utils.every(terms, function(term) {
          return utils.some(item.tokens, function(token) {
            return token.indexOf(term) === 0;
          });
        });

        isMatch && suggestions.push(item);
      });

      return suggestions;
    },

    // public methods
    // ---------------

    // the contents of this function are broken out of the constructor
    // to help improve the testability of datasets
    initialize: function() {
      var deferred;

      this.local && this._processLocalData(this.local);
      this.transport = this.remote ? new Transport(this.remote) : null;

      deferred = this.prefetch ?
        this._loadPrefetchData(this.prefetch) :
        $.Deferred().resolve();

      this.local = this.prefetch = this.remote = null;
      this.initialize = function() { return deferred; };

      return deferred;
    },

    getSuggestions: function(query, cb) {
      var that = this, terms, suggestions, cacheHit = false;

      // don't do anything until the minLength constraint is met
      if (query.length < this.minLength) {
        return;
      }

      terms = utils.tokenizeQuery(query);
      suggestions = this._getLocalSuggestions(terms).slice(0, this.limit);

      if (suggestions.length < this.limit && this.transport) {
        cacheHit = this.transport.get(query, processRemoteData);
      }

      // if a cache hit occurred, skip rendering local suggestions
      // because the rendering of local/remote suggestions is already
      // in the event loop
      !cacheHit && cb && cb(suggestions);

      // callback for transport.get
      function processRemoteData(data) {
        suggestions = suggestions.slice(0);

        // convert remote suggestions to object
        utils.each(data, function(i, datum) {
          var item = that._transformDatum(datum), isDuplicate;

          // checks for duplicates
          isDuplicate = utils.some(suggestions, function(suggestion) {
            return item.value === suggestion.value;
          });

          !isDuplicate && suggestions.push(item);

          // if we're at the limit, we no longer need to process
          // the remote results and can break out of the each loop
          return suggestions.length < that.limit;
        });

        cb && cb(suggestions);
      }
    }
  });

  return Dataset;

  function compileTemplate(template, engine, valueKey) {
    var renderFn, compiledTemplate;

    // precompiled template
    if (utils.isFunction(template)) {
      renderFn = template;
    }

    // string template that needs to be compiled
    else if (utils.isString(template)) {
      compiledTemplate = engine.compile(template);
      renderFn = utils.bind(compiledTemplate.render, compiledTemplate);
    }

    // if no template is provided, render suggestion
    // as its value wrapped in a p tag
    else {
      renderFn = function(context) {
        return '<p>' + context[valueKey] + '</p>';
      };
    }

    return renderFn;
  }
})();
