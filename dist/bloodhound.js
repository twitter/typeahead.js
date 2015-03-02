/*!
 * typeahead.js 0.10.5
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2015 Twitter, Inc. and other contributors; Licensed MIT
 */

!function($) {
    var _ = function() {
        "use strict";
        return {
            isMsie: function() {
                return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : !1;
            },
            isBlankString: function(str) {
                return !str || /^\s*$/.test(str);
            },
            escapeRegExChars: function(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            isString: function(obj) {
                return "string" == typeof obj;
            },
            isNumber: function(obj) {
                return "number" == typeof obj;
            },
            isArray: $.isArray,
            isFunction: $.isFunction,
            isObject: $.isPlainObject,
            isUndefined: function(obj) {
                return "undefined" == typeof obj;
            },
            toStr: function(s) {
                return _.isUndefined(s) || null === s ? "" : s + "";
            },
            bind: $.proxy,
            each: function(collection, cb) {
                function reverseArgs(index, value) {
                    return cb(value, index);
                }
                $.each(collection, reverseArgs);
            },
            map: $.map,
            filter: $.grep,
            every: function(obj, test) {
                var result = !0;
                return obj ? ($.each(obj, function(key, val) {
                    return (result = test.call(null, val, key, obj)) ? void 0 : !1;
                }), !!result) : result;
            },
            some: function(obj, test) {
                var result = !1;
                return obj ? ($.each(obj, function(key, val) {
                    return (result = test.call(null, val, key, obj)) ? !1 : void 0;
                }), !!result) : result;
            },
            mixin: $.extend,
            getUniqueId: function() {
                var counter = 0;
                return function() {
                    return counter++;
                };
            }(),
            templatify: function(obj) {
                function template() {
                    return String(obj);
                }
                return $.isFunction(obj) ? obj : template;
            },
            defer: function(fn) {
                setTimeout(fn, 0);
            },
            debounce: function(func, wait, immediate) {
                var timeout, result;
                return function() {
                    var later, callNow, context = this, args = arguments;
                    return later = function() {
                        timeout = null, immediate || (result = func.apply(context, args));
                    }, callNow = immediate && !timeout, clearTimeout(timeout), timeout = setTimeout(later, wait), 
                    callNow && (result = func.apply(context, args)), result;
                };
            },
            throttle: function(func, wait) {
                var context, args, timeout, result, previous, later;
                return previous = 0, later = function() {
                    previous = new Date(), timeout = null, result = func.apply(context, args);
                }, function() {
                    var now = new Date(), remaining = wait - (now - previous);
                    return context = this, args = arguments, 0 >= remaining ? (clearTimeout(timeout), 
                    timeout = null, previous = now, result = func.apply(context, args)) : timeout || (timeout = setTimeout(later, remaining)), 
                    result;
                };
            },
            noop: function() {}
        };
    }(), VERSION = "0.10.5", tokenizers = function() {
        "use strict";
        function whitespace(str) {
            return str = _.toStr(str), str ? str.split(/\s+/) : [];
        }
        function nonword(str) {
            return str = _.toStr(str), str ? str.split(/\W+/) : [];
        }
        function getObjTokenizer(tokenizer) {
            return function() {
                var args = [].slice.call(arguments, 0);
                return function(o) {
                    var tokens = [];
                    return _.each(args, function(k) {
                        tokens = tokens.concat(tokenizer(_.toStr(o[k])));
                    }), tokens;
                };
            };
        }
        return {
            nonword: nonword,
            whitespace: whitespace,
            obj: {
                nonword: getObjTokenizer(nonword),
                whitespace: getObjTokenizer(whitespace)
            }
        };
    }(), LruCache = function() {
        "use strict";
        function LruCache(maxSize) {
            this.maxSize = _.isNumber(maxSize) ? maxSize : 100, this.reset(), this.maxSize <= 0 && (this.set = this.get = $.noop);
        }
        function List() {
            this.head = this.tail = null;
        }
        function Node(key, val) {
            this.key = key, this.val = val, this.prev = this.next = null;
        }
        return _.mixin(LruCache.prototype, {
            set: function(key, val) {
                var node, tailItem = this.list.tail;
                this.size >= this.maxSize && (this.list.remove(tailItem), delete this.hash[tailItem.key]), 
                (node = this.hash[key]) ? (node.val = val, this.list.moveToFront(node)) : (node = new Node(key, val), 
                this.list.add(node), this.hash[key] = node, this.size++);
            },
            get: function(key) {
                var node = this.hash[key];
                return node ? (this.list.moveToFront(node), node.val) : void 0;
            },
            reset: function() {
                this.size = 0, this.hash = {}, this.list = new List();
            }
        }), _.mixin(List.prototype, {
            add: function(node) {
                this.head && (node.next = this.head, this.head.prev = node), this.head = node, this.tail = this.tail || node;
            },
            remove: function(node) {
                node.prev ? node.prev.next = node.next : this.head = node.next, node.next ? node.next.prev = node.prev : this.tail = node.prev;
            },
            moveToFront: function(node) {
                this.remove(node), this.add(node);
            }
        }), LruCache;
    }(), PersistentStorage = function() {
        "use strict";
        function PersistentStorage(namespace) {
            this.prefix = [ "__", namespace, "__" ].join(""), this.ttlKey = "__ttl__", this.keyMatcher = new RegExp("^" + _.escapeRegExChars(this.prefix));
        }
        function now() {
            return new Date().getTime();
        }
        function encode(val) {
            return JSON.stringify(_.isUndefined(val) ? null : val);
        }
        function decode(val) {
            return JSON.parse(val);
        }
        var ls, methods;
        try {
            ls = window.localStorage, ls.setItem("~~~", "!"), ls.removeItem("~~~");
        } catch (err) {
            ls = null;
        }
        return methods = ls && window.JSON ? {
            _prefix: function(key) {
                return this.prefix + key;
            },
            _ttlKey: function(key) {
                return this._prefix(key) + this.ttlKey;
            },
            get: function(key) {
                return this.isExpired(key) && this.remove(key), decode(ls.getItem(this._prefix(key)));
            },
            set: function(key, val, ttl) {
                return _.isNumber(ttl) ? ls.setItem(this._ttlKey(key), encode(now() + ttl)) : ls.removeItem(this._ttlKey(key)), 
                ls.setItem(this._prefix(key), encode(val));
            },
            remove: function(key) {
                return ls.removeItem(this._ttlKey(key)), ls.removeItem(this._prefix(key)), this;
            },
            clear: function() {
                var i, key, keys = [], len = ls.length;
                for (i = 0; len > i; i++) (key = ls.key(i)).match(this.keyMatcher) && keys.push(key.replace(this.keyMatcher, ""));
                for (i = keys.length; i--; ) this.remove(keys[i]);
                return this;
            },
            isExpired: function(key) {
                var ttl = decode(ls.getItem(this._ttlKey(key)));
                return _.isNumber(ttl) && now() > ttl ? !0 : !1;
            }
        } : {
            get: _.noop,
            set: _.noop,
            remove: _.noop,
            clear: _.noop,
            isExpired: _.noop
        }, _.mixin(PersistentStorage.prototype, methods), PersistentStorage;
    }(), Transport = function() {
        "use strict";
        function Transport(o) {
            o = o || {}, this.cancelled = !1, this.lastUrl = null, this._send = o.transport ? callbackToDeferred(o.transport) : $.ajax, 
            this._get = o.rateLimiter ? o.rateLimiter(this._get) : this._get, this._cache = o.cache === !1 ? new LruCache(0) : sharedCache;
        }
        function callbackToDeferred(fn) {
            return function(url, o) {
                function onSuccess(resp) {
                    _.defer(function() {
                        deferred.resolve(resp);
                    });
                }
                function onError(err) {
                    _.defer(function() {
                        deferred.reject(err);
                    });
                }
                var deferred = $.Deferred();
                return fn(url, o, onSuccess, onError), deferred;
            };
        }
        var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests = 6, sharedCache = new LruCache(10);
        return Transport.setMaxPendingRequests = function(num) {
            maxPendingRequests = num;
        }, Transport.resetCache = function() {
            sharedCache.reset();
        }, _.mixin(Transport.prototype, {
            _get: function(url, o, cb) {
                function done(resp) {
                    cb && cb(null, resp), that._cache.set(url, resp);
                }
                function fail() {
                    cb && cb(!0);
                }
                function always() {
                    pendingRequestsCount--, delete pendingRequests[url], that.onDeckRequestArgs && (that._get.apply(that, that.onDeckRequestArgs), 
                    that.onDeckRequestArgs = null);
                }
                var jqXhr, that = this;
                this.cancelled || url !== this.lastUrl || ((jqXhr = pendingRequests[url]) ? jqXhr.done(done).fail(fail) : maxPendingRequests > pendingRequestsCount ? (pendingRequestsCount++, 
                pendingRequests[url] = this._send(url, o).done(done).fail(fail).always(always)) : this.onDeckRequestArgs = [].slice.call(arguments, 0));
            },
            get: function(url, o, cb) {
                var resp;
                return _.isFunction(o) && (cb = o, o = {}), this.cancelled = !1, this.lastUrl = url, 
                (resp = this._cache.get(url)) ? _.defer(function() {
                    cb && cb(null, resp);
                }) : this._get(url, o, cb), !!resp;
            },
            cancel: function() {
                this.cancelled = !0;
            }
        }), Transport;
    }(), SearchIndex = function() {
        "use strict";
        function SearchIndex(o) {
            o = o || {}, o.datumTokenizer && o.queryTokenizer || $.error("datumTokenizer and queryTokenizer are both required"), 
            this.datumTokenizer = o.datumTokenizer, this.queryTokenizer = o.queryTokenizer, 
            this.reset();
        }
        function normalizeTokens(tokens) {
            return tokens = _.filter(tokens, function(token) {
                return !!token;
            }), tokens = _.map(tokens, function(token) {
                return token.toLowerCase();
            });
        }
        function newNode() {
            return {
                ids: [],
                children: {}
            };
        }
        function unique(array) {
            for (var seen = {}, uniques = [], i = 0, len = array.length; len > i; i++) seen[array[i]] || (seen[array[i]] = !0, 
            uniques.push(array[i]));
            return uniques;
        }
        function getIntersection(arrayA, arrayB) {
            function compare(a, b) {
                return a - b;
            }
            var ai = 0, bi = 0, intersection = [];
            arrayA = arrayA.sort(compare), arrayB = arrayB.sort(compare);
            for (var lenArrayA = arrayA.length, lenArrayB = arrayB.length; lenArrayA > ai && lenArrayB > bi; ) arrayA[ai] < arrayB[bi] ? ai++ : arrayA[ai] > arrayB[bi] ? bi++ : (intersection.push(arrayA[ai]), 
            ai++, bi++);
            return intersection;
        }
        return _.mixin(SearchIndex.prototype, {
            bootstrap: function(o) {
                this.datums = o.datums, this.trie = o.trie;
            },
            add: function(data) {
                var that = this;
                data = _.isArray(data) ? data : [ data ], _.each(data, function(datum) {
                    var id, tokens;
                    id = that.datums.push(datum) - 1, tokens = normalizeTokens(that.datumTokenizer(datum)), 
                    _.each(tokens, function(token) {
                        var node, chars, ch;
                        for (node = that.trie, chars = token.split(""); ch = chars.shift(); ) node = node.children[ch] || (node.children[ch] = newNode()), 
                        node.ids.push(id);
                    });
                });
            },
            get: function(query) {
                var tokens, matches, that = this;
                return tokens = normalizeTokens(this.queryTokenizer(query)), _.each(tokens, function(token) {
                    var node, chars, ch, ids;
                    if (matches && 0 === matches.length) return !1;
                    for (node = that.trie, chars = token.split(""); node && (ch = chars.shift()); ) node = node.children[ch];
                    return node && 0 === chars.length ? (ids = node.ids.slice(0), void (matches = matches ? getIntersection(matches, ids) : ids)) : (matches = [], 
                    !1);
                }), matches ? _.map(unique(matches), function(id) {
                    return that.datums[id];
                }) : [];
            },
            reset: function() {
                this.datums = [], this.trie = newNode();
            },
            serialize: function() {
                return {
                    datums: this.datums,
                    trie: this.trie
                };
            }
        }), SearchIndex;
    }(), oParser = function() {
        "use strict";
        function getLocal(o) {
            return o.local || null;
        }
        function getPrefetch(o) {
            var prefetch, defaults;
            return defaults = {
                url: null,
                thumbprint: "",
                ttl: 864e5,
                filter: null,
                ajax: {}
            }, (prefetch = o.prefetch || null) && (prefetch = _.isString(prefetch) ? {
                url: prefetch
            } : prefetch, prefetch = _.mixin(defaults, prefetch), prefetch.thumbprint = VERSION + prefetch.thumbprint, 
            prefetch.ajax.type = prefetch.ajax.type || "GET", prefetch.ajax.dataType = prefetch.ajax.dataType || "json", 
            !prefetch.url && $.error("prefetch requires url to be set")), prefetch;
        }
        function getRemote(o) {
            function byDebounce(wait) {
                return function(fn) {
                    return _.debounce(fn, wait);
                };
            }
            function byThrottle(wait) {
                return function(fn) {
                    return _.throttle(fn, wait);
                };
            }
            var remote, defaults;
            return defaults = {
                url: null,
                cache: !0,
                wildcard: "%QUERY",
                replace: null,
                rateLimitBy: "debounce",
                rateLimitWait: 300,
                send: null,
                filter: null,
                ajax: {}
            }, (remote = o.remote || null) && (remote = _.isString(remote) ? {
                url: remote
            } : remote, remote = _.mixin(defaults, remote), remote.rateLimiter = /^throttle$/i.test(remote.rateLimitBy) ? byThrottle(remote.rateLimitWait) : byDebounce(remote.rateLimitWait), 
            remote.ajax.type = remote.ajax.type || "GET", remote.ajax.dataType = remote.ajax.dataType || "json", 
            delete remote.rateLimitBy, delete remote.rateLimitWait, !remote.url && $.error("remote requires url to be set")), 
            remote;
        }
        return {
            local: getLocal,
            prefetch: getPrefetch,
            remote: getRemote
        };
    }();
    !function(root) {
        "use strict";
        function Bloodhound(o) {
            o && (o.local || o.prefetch || o.remote) || $.error("one of local, prefetch, or remote is required"), 
            this.limit = o.limit || 5, this.sorter = getSorter(o.sorter), this.dupDetector = o.dupDetector || ignoreDuplicates, 
            this.local = oParser.local(o), this.prefetch = oParser.prefetch(o), this.remote = oParser.remote(o), 
            this.cacheKey = this.prefetch ? this.prefetch.cacheKey || this.prefetch.url : null, 
            this.index = new SearchIndex({
                datumTokenizer: o.datumTokenizer,
                queryTokenizer: o.queryTokenizer
            }), this.storage = this.cacheKey ? new PersistentStorage(this.cacheKey) : null;
        }
        function getSorter(sortFn) {
            function sort(array) {
                return array.sort(sortFn);
            }
            function noSort(array) {
                return array;
            }
            return _.isFunction(sortFn) ? sort : noSort;
        }
        function ignoreDuplicates() {
            return !1;
        }
        var old, keys;
        return old = root.Bloodhound, keys = {
            data: "data",
            protocol: "protocol",
            thumbprint: "thumbprint"
        }, root.Bloodhound = Bloodhound, Bloodhound.noConflict = function() {
            return root.Bloodhound = old, Bloodhound;
        }, Bloodhound.tokenizers = tokenizers, _.mixin(Bloodhound.prototype, {
            _loadPrefetch: function(o) {
                function handlePrefetchResponse(resp) {
                    that.clear(), that.add(o.filter ? o.filter(resp) : resp), that._saveToStorage(that.index.serialize(), o.thumbprint, o.ttl);
                }
                var serialized, deferred, that = this;
                return (serialized = this._readFromStorage(o.thumbprint)) ? (this.index.bootstrap(serialized), 
                deferred = $.Deferred().resolve()) : deferred = $.ajax(o.url, o.ajax).done(handlePrefetchResponse), 
                deferred;
            },
            _getFromRemote: function(query, cb) {
                function handleRemoteResponse(err, resp) {
                    cb(err ? [] : that.remote.filter ? that.remote.filter(resp) : resp);
                }
                var url, uriEncodedQuery, that = this;
                if (this.transport) return query = query || "", uriEncodedQuery = encodeURIComponent(query), 
                url = this.remote.replace ? this.remote.replace(this.remote.url, query) : this.remote.url.replace(this.remote.wildcard, uriEncodedQuery), 
                this.transport.get(url, this.remote.ajax, handleRemoteResponse);
            },
            _cancelLastRemoteRequest: function() {
                this.transport && this.transport.cancel();
            },
            _saveToStorage: function(data, thumbprint, ttl) {
                this.storage && (this.storage.set(keys.data, data, ttl), this.storage.set(keys.protocol, location.protocol, ttl), 
                this.storage.set(keys.thumbprint, thumbprint, ttl));
            },
            _readFromStorage: function(thumbprint) {
                var isExpired, stored = {};
                return this.storage && (stored.data = this.storage.get(keys.data), stored.protocol = this.storage.get(keys.protocol), 
                stored.thumbprint = this.storage.get(keys.thumbprint)), isExpired = stored.thumbprint !== thumbprint || stored.protocol !== location.protocol, 
                stored.data && !isExpired ? stored.data : null;
            },
            _initialize: function() {
                function addLocalToIndex() {
                    that.add(_.isFunction(local) ? local() : local);
                }
                var deferred, that = this, local = this.local;
                return deferred = this.prefetch ? this._loadPrefetch(this.prefetch) : $.Deferred().resolve(), 
                local && deferred.done(addLocalToIndex), this.transport = this.remote ? new Transport(this.remote) : null, 
                this.initPromise = deferred.promise();
            },
            initialize: function(force) {
                return !this.initPromise || force ? this._initialize() : this.initPromise;
            },
            add: function(data) {
                this.index.add(data);
            },
            get: function(query, cb) {
                function returnRemoteMatches(remoteMatches) {
                    var matchesWithBackfill = matches.slice(0);
                    _.each(remoteMatches, function(remoteMatch) {
                        var isDuplicate;
                        return isDuplicate = _.some(matchesWithBackfill, function(match) {
                            return that.dupDetector(remoteMatch, match);
                        }), !isDuplicate && matchesWithBackfill.push(remoteMatch), matchesWithBackfill.length < that.limit;
                    }), cb && cb(that.sorter(matchesWithBackfill));
                }
                var that = this, matches = [], cacheHit = !1;
                matches = this.index.get(query), matches = this.sorter(matches).slice(0, this.limit), 
                matches.length < this.limit ? cacheHit = this._getFromRemote(query, returnRemoteMatches) : this._cancelLastRemoteRequest(), 
                cacheHit || (matches.length > 0 || !this.transport) && cb && cb(matches);
            },
            clear: function() {
                this.index.reset();
            },
            clearPrefetchCache: function() {
                this.storage && this.storage.clear();
            },
            clearRemoteCache: function() {
                this.transport && Transport.resetCache();
            },
            ttAdapter: function() {
                return _.bind(this.get, this);
            }
        }), Bloodhound;
    }(this);
}(window.jQuery);