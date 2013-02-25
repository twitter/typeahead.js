/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Dataset = (function() {

  function Dataset(o) {
    utils.bindAll(this);

    this.storage = new PersistentStorage(o.name);
    this.adjacencyList = {};
    this.itemHash = {};

    this.name = o.name;
    this.resetDataOnProtocolSwitch = o.resetDataOnProtocolSwitch || false;
    this.queryUrl = o.remote;
    this.transport = o.transport;
    this.limit = o.limit || 10;
    this._customMatcher = o.matcher || null;
    this._customRanker = o.ranker || null;
    this._ttl_ms = o.ttl_ms || 3 * 24 * 60 * 60 * 1000; // 3 days;

    this.keys = {
      version: 'version',
      protocol: 'protocol',
      itemHash: 'itemHash',
      adjacencyList: 'adjacencyList'
    };

    o.local && this._processLocalData(o.local);
    o.prefetch && this._loadPrefetchData(o.prefetch);
  }

  utils.mixin(Dataset.prototype, {

    // private methods
    // ---------------

    _processLocalData: function(data) {
      data && this._mergeProcessedData(this._processData(data));
    },

    _loadPrefetchData: function(url) {
      var that = this,
          itemHash = this.storage.get(this.keys.itemHash),
          adjacencyList = this.storage.get(this.keys.adjacencyList),
          protocol = this.storage.get(this.keys.protocol),
          version = this.storage.get(this.keys.version),
          isExpired = version !== VERSION || protocol !== utils.getProtocol();

      // data was available in local storage, use it
      if (itemHash && adjacencyList && !isExpired) {
        this._mergeProcessedData({
          itemHash: itemHash,
          adjacencyList: adjacencyList
        });
      }

      else {
        $.getJSON(url).done(processPrefetchData);
      }

      function processPrefetchData(data) {
        var processedData = that._processData(data),
            itemHash = processedData.itemHash,
            adjacencyList = processedData.adjacencyList;

        // store process data in local storage
        // this saves us from processing the data on every page load
        that.storage.set(that.keys.itemHash, itemHash, that._ttl_ms);
        that.storage.set(that.keys.adjacencyList, adjacencyList, that._ttl_ms);
        that.storage.set(that.keys.version, VERSION, that._ttl_ms);
        that.storage.set(that.keys.protocol, utils.getProtocol(), that._ttl_ms);

        that._mergeProcessedData(processedData);
      }
    },

    _processData: function(data) {
      var itemHash = {}, adjacencyList = {};

      utils.each(data, function(i, item) {
        var id;

        // convert string datums to datum objects
        if (utils.isString(item)) {
          item = { value: item, tokens: utils.tokenizeText(item) };
        }

        // normalize tokens
        item.tokens = utils.map(item.tokens || [], function(token) {
          return token.toLowerCase();
        });

        itemHash[id = utils.getUniqueId(item.value)] = item;

        utils.each(item.tokens, function(i, token) {
          var char = token.charAt(0),
              adjacency = adjacencyList[char] || (adjacencyList[char] = [id]);

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
      utils.each(processedData.adjacencyList, function(char, adjacency) {
        var masterAdjacency = that.adjacencyList[char];

        that.adjacencyList[char] = masterAdjacency ?
          masterAdjacency.concat(adjacency) : adjacency;
      });
    },

    _getPotentiallyMatchingIds: function(terms) {
      var potentiallyMatchingIds = [];
      var lists = [];
      utils.map(terms, utils.bind(function(term) {
        var list = this.adjacencyList[term.charAt(0)];
        if (!list) { return; }
        lists.push(list);
      },this));
      if (lists.length === 1) {
        return lists[0];
      }
      var listLengths = [];
      $.each(lists, function(i, list) {
        listLengths.push(list.length);
      });
      var shortestListIndex = utils.indexOf(listLengths, Math.min.apply(null, listLengths)) || 0;
      var shortestList = lists[shortestListIndex] || [];
      potentiallyMatchingIds = utils.map(shortestList, function(item) {
        var idInEveryList = utils.every(lists, function(list) {
          return utils.indexOf(list, item) > -1;
        });
        if (idInEveryList) {
          return item;
        }
      });
      return potentiallyMatchingIds;
    },

    _getItemsFromIds: function(ids) {
      var items = [];
      utils.map(ids, utils.bind(function(id) {
        var item = this.itemHash[id];
        if (item) {
          items.push(item);
        }
      }, this));
      return items;
    },

    _matcher: function(terms) {
      if (this._customMatcher) {
        var customMatcher = this._customMatcher;
        return function(item) {
          return customMatcher(item);
        };
      } else {
        return function(item) {
          var tokens = item.tokens;
          var allTermsMatched = utils.every(terms, function(term) {
            var tokensMatched = utils.filter(tokens, function(token) {
              return token.indexOf(term) === 0;
            });
            return tokensMatched.length;
          });
          if (allTermsMatched) {
            return item;
          }
        };
      }
    },

    _compareItems: function(a, b, areLocalItems) {
      var aScoreBoost = !a.score_boost ? 0 : a.score_boost,
      bScoreBoost = !b.score_boost ? 0 : b.score_boost,
      aScore = !a.score ? 0 : a.score,
      bScore = !b.score ? 0 : b.score;

      if(areLocalItems) {
        return (b.weight + bScoreBoost) - (a.weight + aScoreBoost);
      } else {
        return (bScore + bScoreBoost) - (aScore + aScoreBoost);
      }
    },

    _ranker: function(a, b) {
      if (this._customRanker) {
        return this._customRanker(a, b);
      } else {
        // Anything local should always be first (anything with a non-zero weight) and remote results (non-zero scores), and sort by weight/score within each category
        var aIsLocal = a.weight && a.weight !== 0;
        var bIsLocal = b.weight && b.weight !== 0;
        if (aIsLocal && !bIsLocal) {
          return -1;
        } else if (bIsLocal && !aIsLocal) {
          return 1;
        } else {
          return (aIsLocal && bIsLocal) ? this._compareItems(a, b, true) : this._compareItems(a, b, false);
        }
      }
    },

    _processRemoteSuggestions: function(callback, matchedItems) {
      var that = this;

      return function(data) {
        //convert remote suggestions to object
        utils.each(data, function(i, remoteItem) {
          var isDuplicate = false;

          remoteItem = utils.isString(remoteItem) ?
            { value: remoteItem } : remoteItem;

          // checks for duplicates
          utils.each(matchedItems, function(i, localItem) {
            if (remoteItem.value === localItem.value) {
              isDuplicate = true;

              // break out of each loop
              return false;
            }
          });

          !isDuplicate && matchedItems.push(remoteItem);

          // if we're at the limit, we no longer need to process
          // the remote results and can break out of the each loop
          return matchedItems.length < that.limit;
        });

        callback && callback(matchedItems);
      };
    },

    // public methods
    // ---------------

    getSuggestions: function(query, callback) {
      var terms = utils.tokenizeQuery(query);
      var potentiallyMatchingIds = this._getPotentiallyMatchingIds(terms);
      var potentiallyMatchingItems = this._getItemsFromIds(potentiallyMatchingIds);
      var matchedItems = utils.filter(potentiallyMatchingItems, this._matcher(terms));
      matchedItems.sort(this._ranker);
      callback && callback(matchedItems);
      if (matchedItems.length < this.limit && this.queryUrl) {
        this.transport.get(this.queryUrl, query, this._processRemoteSuggestions(callback, matchedItems));
      }
    }
  });

  return Dataset;
})();
