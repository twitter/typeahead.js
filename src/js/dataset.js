/*
 * Twitter Typeahead
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
    this.prefetchUrl = o.prefetch;
    this.queryUrl = o.remote;
    this.rawData = o.local;
    this.transport = o.transport;
    this.limit = o.limit || 10;
    this._customMatcher = o.matcher || null;
    this._customRanker = o.ranker || null;
    this._ttl_ms = o.ttl_ms || 3 * 24 * 60 * 60 * 1000;// 3 days;

    this.storageAdjacencyList = 'adjacencyList';
    this.storageHash = 'itemHash';
    this.storageProtocol = 'protocol';
    this.storageVersion = 'version';

    this._loadData();
  }

  utils.mixin(Dataset.prototype, {

    // private methods
    // ---------------

    _isMetadataExpired: function() {
      // TODO: disable protocol check by default and add to global config API
      var isExpired = this.storage.isExpired(this.storageProtocol);
      var isCacheStale = this.storage.isExpired(this.storageAdjacencyList) || this.storage.isExpired(this.storageHash);
      var resetForProtocolSwitch =  this.resetDataOnProtocolSwitch && this.storage.get(this.storageProtocol) != utils.getProtocol();
      if (VERSION == this.storage.get(this.storageVersion) && !resetForProtocolSwitch && !isExpired && !isCacheStale) {
        return false;
      }
      return true;
    },

    _loadData: function() {
      this.rawData && this._processRawData(this.rawData);
      this._getDataFromLocalStorage();
      if (this._isMetadataExpired() || this.itemHash === {}) {
        this.prefetchUrl && this._prefetch(this.prefetchUrl);
      }
    },

    _getDataFromLocalStorage: function() {
      this.itemHash = this.storage.get(this.storageHash) || this.itemHash;
      this.adjacencyList = this.storage.get(this.storageAdjacencyList) || this.adjacencyList;
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

    //takes an array of strings and creates a hash and an adjacency list
    _processRawData: function(data) {
      this.itemHash = {};
      this.adjacencyList = {};
      utils.map(data, utils.bind(function(item) {
        var tokens;
        if (item.tokens) {
          tokens = utils.map(item.tokens, function(t) { return t.toLowerCase(); });
        } else {
          item = {
            tokens: utils.tokenizeText(item.toLowerCase()),
            value: item
          };
          tokens = item.tokens;
        }
        item.id = utils.getUniqueId(item.value);
        utils.map(tokens, utils.bind(function(token) {
            var firstChar = token.charAt(0);
            if (!this.adjacencyList[firstChar]) {
              this.adjacencyList[firstChar] = [item.id];
            }
            else {
              if (utils.indexOf(this.adjacencyList[firstChar], item.id) === -1) {
                this.adjacencyList[firstChar].push(item.id);
              }
            }
        }, this));
        this.itemHash[item.id] = item;
      }, this));

      this.storage.set(this.storageHash, this.itemHash, this._ttl_ms);
      this.storage.set(this.storageAdjacencyList, this.adjacencyList, this._ttl_ms);
      this.storage.set(this.storageVersion, VERSION, this._ttl_ms);
      this.storage.set(this.storageProtocol, utils.getProtocol(), this._ttl_ms);
    },

    _prefetch: function(url) {
      var processPrefetchSuccess = function (data) {
        if (!data) { return; }
        utils.map(data, function(item) {
          if (utils.isString(item)) {
            return {
              value: item,
              tokens: utils.tokenizeText(item.toLowerCase())
            };
          }
          else {
            utils.map(item.tokens, function(token, i) {
              item.tokens[i] = token.toLowerCase();
            });
            return item;
          }
        });
        this._processRawData(data);
      };

      var processPrefetchError = function () {
        this._getDataFromLocalStorage();
      };

      $.ajax({
        url: url,
        success: utils.bind(processPrefetchSuccess, this),
        error: utils.bind(processPrefetchError, this)
      });
    },

    _processRemoteSuggestions: function(callback, matchedItems) {
      return function(data) {
        var remoteAndLocalSuggestions = {}, dedupedSuggestions = [];

        //convert remoteSuggestions to object
        utils.each(data, function(index, item) {
          if (utils.isString(item)) {
            remoteAndLocalSuggestions[item] = { value: item };
          } else {
            remoteAndLocalSuggestions[item.value] = item;
          }
        });

        //dedup local and remote suggestions
        utils.each(matchedItems, function(index, item) {
          if (remoteAndLocalSuggestions[item.value]) {
            return true;
          }
          if (utils.isString(item)) {
            remoteAndLocalSuggestions[item] = { value: item };
          } else {
            remoteAndLocalSuggestions[item.value] = item;
          }
        });

        //convert combined suggestions object back into an array
        utils.each(remoteAndLocalSuggestions, function(index, item) {
          dedupedSuggestions.push(item);
        });
        callback && callback(dedupedSuggestions);
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
