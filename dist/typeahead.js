/*
 * typeahead.js 0.9.4  Svakinn: perhaps the many changes here deserve a new version number - of course few comments need to be removed before this code is released
 * Bugfixes: IE11 detection, blur/focus flicker on dropdown click, local suggestions now handle values with spaces
 * Remote handler functionality (handling function option instead of ajax) still allowing for throttling and cache, supports JQuery and Q promises
 * Remote cashing control: user can skip caching, define caching key and even caching key function 
 * Optional handling for restricting selection to the set of Datums provided (restrictInputToDatum)
 * Introduction of name/key values: data key may differ from the display name
 * Introducing the concept of selected datum, updated on autocomplete or selection
 * New typeahead interface methods: getDatum, getQuery, setDatum, clearCache, openDropdown and closeDropdown
 * New event noSelect: when user leaves field without selecting valid datum.
 * Option to set minLength as 0 to get all suggestion (to the limit) for empty text in input
 * Improved suggestion triggering, eliminating the need to initialize values with the setQuery method
 * Busy indication with the new typeahead:busyUpdate event
 * Accompanying this update is a Knockout binding handler that greatly simplifies the work of initialization, auto-Datum creation and two-way databinding to selected Datum
 * See updated Readme.md and the new Handler.md and Knockout.md for details.
 * Credits for this update:  nathankoop and bowser project for the IE11 detection, zhigang1992 for the restrictInputToDatum option, cusspvz for the handler name, adanaltamira for minLength documentation, and last but not least
 * ryanpitts for the idea and implementation of the nameKey option.
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */
(function ($) {
    var VERSION = "0.9.4";
    var utils = {
        isMsie: function () {
            //Improved IE11 detection (borrowed from the bowser Github project: https://github.com/ded/bowser)
            return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
        },
        isBlankString: function (str) {
            return !str || /^\s*$/.test(str);
        },
        escapeRegExChars: function (str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        isString: function (obj) {
            return typeof obj === "string";
        },
        isNumber: function (obj) {
            return typeof obj === "number";
        },
        isArray: $.isArray,
        isFunction: $.isFunction,
        isObject: $.isPlainObject,
        isUndefined: function (obj) {
            return typeof obj === "undefined";
        },
        bind: $.proxy,
        bindAll: function (obj) {
            var val;
            for (var key in obj) {
                $.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj));
            }
        },
        indexOf: function (haystack, needle) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] === needle) {
                    return i;
                }
            }
            return -1;
        },
        each: $.each,
        map: $.map,
        filter: $.grep,
        every: function (obj, test) {
            var result = true;
            if (!obj) {
                return result;
            }
            $.each(obj, function (key, val) {
                if (!(result = test.call(null, val, key, obj))) {
                    return false;
                }
            });
            return !!result;
        },
        some: function (obj, test) {
            var result = false;
            if (!obj) {
                return result;
            }
            $.each(obj, function (key, val) {
                if (result = test.call(null, val, key, obj)) {
                    return false;
                }
            });
            return !!result;
        },
        mixin: $.extend,
        getUniqueId: function () {
            var counter = 1;    //0 as value cuases problems with conditional checks, mabe this should be converted to string as well?
            return function () {
                return counter++;
            };
        }(),
        defer: function (fn) {
            setTimeout(fn, 0);
        },
        debounce: function (func, wait, immediate) {
            var timeout, result;
            return function () {
                var context = this, args = arguments, later, callNow;
                later = function () {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };
                callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                }
                return result;
            };
        },
        throttle: function (func, wait) {
            var context, args, timeout, result, previous, later;
            previous = 0;
            later = function () {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
            };
            return function () {
                var now = new Date(), remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        tokenizeQuery: function (str) {
            return $.trim(str).toLowerCase().split(/[\s]+/);
        },
        tokenizeText: function (str) {
            return $.trim(str).toLowerCase().split(/[\s\-_]+/);
        },
        getProtocol: function () {
            return location.protocol;
        },
        noop: function () { }
    };
    var EventTarget = function () {
        var eventSplitter = /\s+/;
        return {
            on: function (events, callback) {
                var event;
                if (!callback) {
                    return this;
                }
                this._callbacks = this._callbacks || {};
                events = events.split(eventSplitter);
                while (event = events.shift()) {
                    this._callbacks[event] = this._callbacks[event] || [];
                    this._callbacks[event].push(callback);
                }
                return this;
            },
            trigger: function (events, data) {
                var event, callbacks;
                if (!this._callbacks) {
                    return this;
                }
                events = events.split(eventSplitter);
                while (event = events.shift()) {
                    if (callbacks = this._callbacks[event]) {
                        for (var i = 0; i < callbacks.length; i += 1) {
                            callbacks[i].call(this, {
                                type: event,
                                data: data
                            });
                        }
                    }
                }
                return this;
            }
        };
    }();
    var EventBus = function () {
        var namespace = "typeahead:";
        function EventBus(o) {
            if (!o || !o.el) {
                $.error("EventBus initialized without el");
            }
            this.$el = $(o.el);
        }
        utils.mixin(EventBus.prototype, {
            trigger: function (type) {
                var args = [].slice.call(arguments, 1);
                this.$el.trigger(namespace + type, args);
            }
        });
        return EventBus;
    }();
    var PersistentStorage = function () {
        var ls, methods;
        try {
            ls = window.localStorage;
            ls.setItem("~~~", "!");
            ls.removeItem("~~~");
        } catch (err) {
            ls = null;
        }
        function PersistentStorage(namespace) {
            this.prefix = ["__", namespace, "__"].join("");
            this.ttlKey = "__ttl__";
            this.keyMatcher = new RegExp("^" + this.prefix);
        }
        if (ls && window.JSON) {
            methods = {
                _prefix: function (key) {
                    return this.prefix + key;
                },
                _ttlKey: function (key) {
                    return this._prefix(key) + this.ttlKey;
                },
                get: function (key) {
                    if (this.isExpired(key)) {
                        this.remove(key);
                    }
                    return decode(ls.getItem(this._prefix(key)));
                },
                set: function (key, val, ttl) {
                    if (utils.isNumber(ttl)) {
                        ls.setItem(this._ttlKey(key), encode(now() + ttl));
                    } else {
                        ls.removeItem(this._ttlKey(key));
                    }
                    return ls.setItem(this._prefix(key), encode(val));
                },
                remove: function (key) {
                    ls.removeItem(this._ttlKey(key));
                    ls.removeItem(this._prefix(key));
                    return this;
                },
                clear: function () {
                    var i, key, keys = [], len = ls.length;
                    for (i = 0; i < len; i++) {
                        if ((key = ls.key(i)).match(this.keyMatcher)) {
                            keys.push(key.replace(this.keyMatcher, ""));
                        }
                    }
                    for (i = keys.length; i--;) {
                        this.remove(keys[i]);
                    }
                    return this;
                },
                isExpired: function (key) {
                    var ttl = decode(ls.getItem(this._ttlKey(key)));
                    return utils.isNumber(ttl) && now() > ttl ? true : false;
                }
            };
        } else {
            methods = {
                get: utils.noop,
                set: utils.noop,
                remove: utils.noop,
                clear: utils.noop,
                isExpired: utils.noop
            };
        }
        utils.mixin(PersistentStorage.prototype, methods);
        return PersistentStorage;
        function now() {
            return new Date().getTime();
        }
        function encode(val) {
            return JSON.stringify(utils.isUndefined(val) ? null : val);
        }
        function decode(val) {
            return JSON.parse(val);
        }
    }();
    var RequestCache = function () {
        function RequestCache(o) {
            utils.bindAll(this);
            o = o || {};
            this.sizeLimit = o.sizeLimit || 10;
            this.cache = {};
            this.cachedKeysByAge = [];
        }
        utils.mixin(RequestCache.prototype, {
            get: function (cacheKey) {
                return this.cache[cacheKey];
            },
            set: function (cacheKey, resp) {
                var requestToEvict;
                if (this.cachedKeysByAge.length === this.sizeLimit) {
                    requestToEvict = this.cachedKeysByAge.shift();
                    delete this.cache[requestToEvict];
                }
                this.cache[cacheKey] = resp;
                this.cachedKeysByAge.push(cacheKey);
            },
            clear: function () {
                this.cache = {};
                this.cachedKeysByAge = [];
            }
        });
        return RequestCache;
    }();
    var Transport = function () {
        var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests, requestCache;
        function Transport(o) {
            utils.bindAll(this);
            o = utils.isString(o) ? {
                url: o
            } : o;
            requestCache = requestCache || new RequestCache();
            maxPendingRequests = utils.isNumber(o.maxParallelRequests) ? o.maxParallelRequests : maxPendingRequests || 6;
            this.url = o.url;
            this.handler = o.handler = (typeof o.handler == 'function' ? o.handler : null);
            this.wildcard = o.wildcard || "%QUERY";
            this.filter = o.filter;
            this.replace = o.replace;
            this.name = o.name;
            this.cacheKey = o.cacheKey;
            this.skipCache = o.skipCache;
            if (this.url) {
                this.ajaxSettings = {
                    type: "get",
                    cache: o.cache,
                    timeout: o.timeout,
                    dataType: o.dataType || "json",
                    beforeSend: o.beforeSend
                };
            };
            this._get = (/^throttle$/i.test(o.rateLimitFn) ? utils.throttle : utils.debounce)(this._get, o.rateLimitWait || 300);
        }
        utils.mixin(Transport.prototype, {
            _get: function (url, cb, query, cacheKey) {
                var that = this, computedData = [];
                if (belowPendingRequestsThreshold()) {
                    if (this.handler)
                        //Support Q promises as well as JQuery promises, remember that Q can consume JQuery promise but not vice versa
                        if (typeof Q !== 'undefined')
                            return Q.when(this._sendRequest(query, computedData)).then(function () { done(computedData); return Q.resolve(true); });
                        else
                            return $.when(this._sendRequest(query, computedData)).then(function () { done(computedData); return $.Deferred().resolve(); });
                    else
                        return this._sendRequest(url).done(done);
                } else {
                    return this.onDeckRequestArgs = [].slice.call(arguments, 0);
                }
                function done(resp) {
                    var data = that.filter ? that.filter(resp) : resp;
                    cb && cb(data);
                    this.skipCache || requestCache.set(cacheKey, resp);
                }
            },
            _sendRequest: function (url, data) {
                var that = this, jqXhr = pendingRequests[url];
                if (!jqXhr) {
                    incrementPendingRequests();
                    if (this.handler)
                        if (Q)
                            jqXhr = Q.when(this.handler(url, data)).then(function () { always(); return Q.resolve(true); });
                        else
                            jqXhr = $.when(this.handler(url, data)).then(function () { always(); return $.Deferred().resolve(); });
                    else
                        jqXhr = pendingRequests[url] = $.ajax(url, this.ajaxSettings).always(always);
                }
                return jqXhr;
                function always() {
                    decrementPendingRequests();
                    pendingRequests[url] = null;
                    if (that.onDeckRequestArgs) {
                        that._get.apply(that, that.onDeckRequestArgs);
                        that.onDeckRequestArgs = null;
                    }
                }
            },
            get: function (query, cb) {
                var that = this, encodedQuery = encodeURIComponent(query || ""), url, resp, cacheKey;
                cb = cb || utils.noop;
                url = this.url ? (this.replace ? this.replace(this.url, encodedQuery) : this.url.replace(this.wildcard, encodedQuery)) : '';
                if (typeof this.cacheKey == 'function')
                    cacheKey = this.cacheKey(query);
                else
                    cacheKey = this.cacheKey ? this.cacheKey + '%_' + query : url;
                if (!this.skipCache && (resp = requestCache.get(cacheKey))) {
                    utils.defer(function () {
                        cb(that.filter ? that.filter(resp) : resp);
                    });
                } else {
                    this._get(url, cb, query, cacheKey);
                }
                return !!resp;
            },
            clearCache: function () {
                this.skipCache || requestCache.clear();
            }
        });
        return Transport;
        function incrementPendingRequests() {
            pendingRequestsCount++;
        }
        function decrementPendingRequests() {
            pendingRequestsCount--;
        }
        function belowPendingRequestsThreshold() {
            return pendingRequestsCount < maxPendingRequests;
        }
    }();
    var Dataset = function () {
        var keys = {
            thumbprint: "thumbprint",
            protocol: "protocol",
            itemHash: "itemHash",
            adjacencyList: "adjacencyList",
            nameAdjacencyList: "nameAdjacencyList"
        };
        function Dataset(o) {
            utils.bindAll(this);
            if (utils.isString(o.template) && !o.engine) {
                $.error("no template engine specified");
            }
            if (!o.local && !o.prefetch && !o.remote) {
                $.error("one of local, prefetch or remote is required");
            }
            this.name = o.name || utils.getUniqueId();
            this.limit = o.limit || 5;
            if (o.minLength === 0)  //Allow for minlength = 0, in that case we should get all available options (for local) and what the remote function will to with empty query
                this.minLength = 0;
            else
                this.minLength = o.minLength || 1;
            this.cacheKeyFn = null;
            if (typeof o.cacheKey === 'function') {
                this.cacheKey = o.cacheKey();
                this.cacheKeyFn = o.cacheKey;
            }
            else
                this.cacheKey = o.cacheKey ? o.cacheKey : this.name;
            this.header = o.header;
            this.footer = o.footer;
            this.valueKey = o.valueKey || "value";
            this.nameKey = o.nameKey || this.valueKey;
            this.restrictInputToDatum = o.restrictInputToDatum; //The behavior to clear input value on leaving the box if it does not contain selected datum and if it dos reset the value to last selected datum name
            this.template = compileTemplate(o.template, o.engine, this.nameKey);
            this.local = o.local;
            this.prefetch = o.prefetch;
            this.remote = o.remote;
            this.matcher = o.matcher; //override for _getLocalSuggestions
            this.itemHash = {};
            this.adjacencyList = {};
            this.nameAdjacencyList = {};
            this.storage = this.cacheKey ? new PersistentStorage(this.cacheKey) : null;
        }
        utils.mixin(Dataset.prototype, {
            _processLocalData: function (data) {
                this._mergeProcessedData(this._processData(data));
            },
            _loadPrefetchData: function (o) {
                var that = this, thumbprint = VERSION + (o.thumbprint || ""), storedThumbprint, storedProtocol, storedItemHash, storedAdjacencyList, storedNameAdjacencyList, isExpired = true, deferred;
                o = utils.isString(o) ? {
                    url: o
                } : o;
                o.ttl = utils.isNumber(o.ttl) ? o.ttl : 24 * 60 * 60 * 1e3;
                if (!o.skipCache && o.ttl > 0) {
                    if (this.storage) {
                        storedThumbprint = this.storage.get(keys.thumbprint);
                        storedProtocol = this.storage.get(keys.protocol);
                        storedItemHash = this.storage.get(keys.itemHash);
                        storedAdjacencyList = this.storage.get(keys.adjacencyList);
                        storedNameAdjacencyList = this.storage.get(keys.nameAdjacencyList);
                    }
                    isExpired = storedThumbprint !== thumbprint || storedProtocol !== utils.getProtocol();
                }
                if (!o.skipCache && o.ttl > 0 && storedItemHash && storedAdjacencyList && storedNameAdjacencyList && !isExpired) {
                    this._mergeProcessedData({
                        itemHash: storedItemHash,
                        adjacencyList: storedAdjacencyList,
                        nameAdjacencyList: storedNameAdjacencyList
                    });
                    deferred = $.Deferred().resolve();
                } else {
                    if (o.prefetchHandler && typeof o.prefetchHandler == 'function') {
                        //Support Q promises as well as JQuery promises, remember that Q can consume JQuery promise but not vice versa
                        if (typeof Q !== 'undefined') {
                            deferred = $.Deferred();
                            Q.when(o.prefetchHandler()).then(QDone).fail(function (error) { deferred.resolve(); });
                        }
                        else {
                            deferred = $.when(o.prefetchHandler()).done(processPrefetchData);
                        }
                        function QDone(data) {
                            processPrefetchData(data);
                            deferred.resolve();
                            return Q.resolve(true);
                        }
                    }
                    else if (o.url)
                        deferred = $.getJSON(o.url).done(processPrefetchData).fail(errorPrefetchdata);
                }
                return deferred;
                function errorPrefetchdata(jqxhr, textStatus, error) {
                    console.log('Prefetch error: ' + error.message);
                };
                function processPrefetchData(data) {
                    var filteredData = o.filter ? o.filter(data) : data, processedData = that._processData(filteredData), itemHash = processedData.itemHash, adjacencyList = processedData.adjacencyList, nameAdjacencyList = processedData.nameAdjacencyList;
                    if (that.storage) {
                        that.storage.set(keys.itemHash, itemHash, o.ttl);
                        that.storage.set(keys.adjacencyList, adjacencyList, o.ttl);
                        that.storage.set(keys.nameAdjacencyList, nameAdjacencyList, o.ttl);
                        that.storage.set(keys.thumbprint, thumbprint, o.ttl);
                        that.storage.set(keys.protocol, utils.getProtocol(), o.ttl);
                    }
                    that._mergeProcessedData(processedData);
                }
            },
            _transformDatum: function (datum) {
                var value = utils.isString(datum) ? datum : datum[this.valueKey], name = utils.isString(datum) ? datum : datum[this.nameKey], tokens = datum.tokens || utils.tokenizeText(value), item = {
                    value: value,
                    name: name,
                    tokens: tokens,
                    dsname: this.name  //Dataset name/key
                };
                if (utils.isString(datum)) {
                    item.datum = {};
                    item.datum[this.valueKey] = datum;
                } else {
                    item.datum = datum;
                }
                //We should trust the users not to put in empty tokens - if they do, no harm done
                //item.tokens = utils.filter(item.tokens, function (token) {
                //    return !utils.isBlankString(token);
                //});
                //in-case insensitve search using regEx should be quicker than indexof so we can skip this processing - this also has bug if token is not string
                //item.tokens = utils.map(item.tokens, function (token) {
                //    return token.toLowerCase();
                //});
                return item;
            },
            _processData: function (data) {
                var that = this, itemHash = {}, adjacencyList = {}, nameAdjacencyList = {};
                utils.each(data, function (i, datum) {
                    var item = that._transformDatum(datum), id = utils.getUniqueId(item.value);
                    itemHash[id] = item;
                    var nChar = item.name.charAt(0).toLowerCase();
                    nameAdjacency = nameAdjacencyList[nChar] || (nameAdjacencyList[nChar] = [id]);
                    !~utils.indexOf(nameAdjacency, id) && nameAdjacency.push(id);
                    utils.each(item.tokens, function (i, token) {
                        var character = token.charAt(0).toLowerCase();
                        adjacency = adjacencyList[character] || (adjacencyList[character] = [id]);
                        !~utils.indexOf(adjacency, id) && adjacency.push(id);
                    });
                });
                return {
                    itemHash: itemHash,
                    adjacencyList: adjacencyList,
                    nameAdjacencyList: nameAdjacencyList
                };
            },
            _mergeProcessedData: function (processedData) {
                var that = this;
                utils.mixin(this.itemHash, processedData.itemHash);
                utils.each(processedData.adjacencyList, function (character, adjacency) {
                    var masterAdjacency = that.adjacencyList[character];
                    that.adjacencyList[character] = masterAdjacency ? masterAdjacency.concat(adjacency) : adjacency;
                });
                utils.each(processedData.nameAdjacencyList, function (character, nameAdjacency) {
                    var masterNameAdjacency = that.nameAdjacencyList[character];
                    that.nameAdjacencyList[character] = masterNameAdjacency ? masterNameAdjacency.concat(nameAdjacency) : nameAdjacency;
                });
            },
            /*
            Replace this one with one that actually works for data uincluding spaces
            _getLocalSuggestions: function (terms) {
                var that = this, firstChars = [], lists = [], shortestList, suggestions = [];
                utils.each(terms, function (i, term) {
                    var firstChar = term.charAt(0);
                    !~utils.indexOf(firstChars, firstChar) && firstChars.push(firstChar);
                });
                utils.each(firstChars, function (i, firstChar) {
                    var list = that.adjacencyList[firstChar];
                    if (!list) {
                        return false;
                    }
                    lists.push(list);
                    if (!shortestList || list.length < shortestList.length) {
                        shortestList = list;
                    }
                });
                if (lists.length < firstChars.length) {
                    return [];
                }
                utils.each(shortestList, function (i, id) {
                    var item = that.itemHash[id], isCandidate, isMatch;
                    isCandidate = utils.every(lists, function (list) {
                        return ~utils.indexOf(list, id);
                    });
                    isMatch = isCandidate && utils.every(terms, function (term) {
                        return utils.some(item.tokens, function (token) {
                            return token.indexOf(term) === 0;
                        });
                    });
                    isMatch && suggestions.push(item);
                });
                return suggestions;
            },
            */
            //Here there is only one search term: the query entered
            //This search prefers names first and then tokens. This is helpful since we are using hint system and want the hint to match the name
            //This will also handle empty query as to return all options (up to the limit of cours)
            _getLocalSuggestions: function (query) {
                var suggestions = [], src = query.toLowerCase(), itLen, noFound = 0, regSrc = new RegExp('^' + src, 'i');
                if (query === null || query === '') {
                    //User asks for all suggestions if no query
                    var lim = this.limit;
                    utils.each(this.itemHash, function (i, item) {
                        suggestions.push(item);
                        noFound++;
                        if (noFound == lim)
                            return false;
                    });
                }
                else {
                    //First round, name-search
                    //Use the new nameAdjacencyList for indexing on the first char:
                    var nlist = this.nameAdjacencyList[src.charAt(0)];
                    if (nlist) {
                        itLen = nlist.length;
                        for (var i = 0; i < itLen; i++) {
                            var item = this.itemHash[nlist[i]];
                            if (item.name.search(regSrc) === 0) {
                                suggestions.push(item);
                                noFound++;
                            };
                            if (noFound == this.limit)
                                break;
                        };
                    }

                    if (noFound < this.limit) {
                        //second round tuple search
                        var list = this.adjacencyList[src.charAt(0)];
                        if (!list)
                            return suggestions;
                        itLen = list.length;
                        for (var i = 0; i < itLen; i++) {
                            var item = this.itemHash[list[i]];
                            var isMatch = utils.some(item.tokens, function (token) {
                                return token.search(regSrc) === 0;
                            });
                            if (isMatch) {
                                //Check if suggestion allready found
                                var isInSuggest = false;
                                utils.each(suggestions, function (i, sugg) {
                                    if (sugg.value == item.value) {
                                        isInSuggest = true;
                                        return false; //break
                                    }
                                });
                                if (!isInSuggest) {
                                    suggestions.push(item);
                                    noFound++;
                                    if (noFound == this.limit)
                                        break;
                                }

                            }
                        }
                    }
                }
                return suggestions;
            },
            initialize: function () {
                var deferred;
                this.local && this._processLocalData(this.local);
                if (this.remote && typeof this.remote == 'function') this.remote = { handler: this.remote }; //Allow for remote to be handler function
                if (this.prefetch && typeof this.prefetch == 'function') this.prefetch = { prefetchHandler: this.prefetch }; //Allow for prefetch to be handler function
                if (this.remote && !this.remote.url && !this.remote.cacheKey && !this.remote.name) this.remote.cacheKey = this.cacheKey || this.remote.name || this.name; //Fallback for caching name for handler if cacheKey is not specified in the remote section, another approach would be to raise error if missing
                this.transport = this.remote ? new Transport(this.remote) : null;
                this.isRemote = this.remote ? true : false;
                deferred = this.prefetch ? this._loadPrefetchData(this.prefetch) : $.Deferred().resolve();
                //this.local = this.prefetch = this.remote = null; we need the original objects for the reload function
                this.initialize = function () {
                    return deferred;
                };
                return deferred;
            },
            getSuggestions: function (query, cb) {
                var that = this, terms, suggestions, cacheHit = false;
                if (query.length < this.minLength) {
                    return;
                }
                //terms = utils.tokenizeQuery(query);
                //suggestions = this._getLocalSuggestions(terms).slice(0, this.limit);
                if (this.matcher && typeof this.matcher == 'function')
                    suggestons = this.matcher(query, this);
                else
                    suggestions = this._getLocalSuggestions(query);
                if (this.transport)
                    cacheHit = this.transport.get(query, processRemoteData);
                !cacheHit && cb && cb(suggestions);
                function processRemoteData(data) {
                    suggestions = suggestions.slice(0);
                    utils.each(data, function (i, datum) {
                        var item = that._transformDatum(datum), isDuplicate;
                        isDuplicate = utils.some(suggestions, function (suggestion) {
                            return item.value === suggestion.value;
                        });
                        !isDuplicate && suggestions.push(item);
                        return suggestions.length < that.limit;
                    });
                    cb && cb(suggestions);
                }
            },
            //Returns deferred object that resolves when local abnd prefetched data has been loaded
            reload: function () {
                var deferred;
                if (this.cacheKeyFn) {
                    var oldKey = this.cacheKey;
                    this.cacheKey = this.cacheKeyFn(); //Reevaluate the cache key
                    if (this.cacheKey != oldKey)
                        this.clearCache();
                }
                this.itemHash = {};
                this.adjacencyList = {};
                this.nameAdjacencyList = {};
                this.local && this._processLocalData(this.local);
                return this.prefetch ? this._loadPrefetchData(this.prefetch) : $.Deferred().resolve();
            },
            clearCache: function () {
                if (this.storage)
                    this.storage.clear();
                if (this.transport)
                    this.transport.clearCache();
            }
        });
        return Dataset;
        function compileTemplate(template, engine, nameKey) {
            var renderFn, compiledTemplate;
            if (utils.isFunction(template)) {
                renderFn = template;
            } else if (utils.isString(template)) {
                compiledTemplate = engine.compile(template);
                renderFn = utils.bind(compiledTemplate.render, compiledTemplate);
            } else {
                renderFn = function (context) {
                    return "<p>" + context[nameKey] + "</p>";
                };
            }
            return renderFn;
        }
    }();
    var InputView = function () {
        function InputView(o) {
            var that = this;
            utils.bindAll(this);
            this.specialKeyCodeMap = {
                9: "tab",
                27: "esc",
                37: "left",
                39: "right",
                13: "enter",
                38: "up",
                40: "down"
            };
            this.tracer = o.tracer;
            this.isFocused = false;  
            this.$hint = $(o.hint);
            this.$input = $(o.input).on("blur.tt", this._handleBlur).on("focus.tt", this._handleFocus).on("keydown.tt", this._handleSpecialKeyEvent);
            if (!utils.isMsie()) {
                this.$input.on("input.tt", this._compareQueryToInputValue);
            } else {
                this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function ($e) {
                    if (that.specialKeyCodeMap[$e.which || $e.keyCode]) {
                        return;
                    }
                    utils.defer(that._compareQueryToInputValue);
                });
            }
            this.query = this.$input.val();
            this.$overflowHelper = buildOverflowHelper(this.$input);
        }
        utils.mixin(InputView.prototype, EventTarget, {
            _handleFocus: function () {
                //this.tracer.push('inputview focus');
                this.isFocused = true;
                this.trigger("focused");
            },
            _handleBlur: function () {
                //this.tracer.push('inputview blured');
                this.isFocused = false;
                this.trigger("blured");
            },
            _handleSpecialKeyEvent: function ($e) {
                var keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];
                keyName && this.trigger(keyName + "Keyed", $e);
            },
            _compareQueryToInputValue: function () {
                var inputValue = this.getInputValue(), isSameQuery = compareQueries(this.query, inputValue);
                //No need for whitespace handling, query suggestons include whitespace like any other character!
                //, isSameQueryExceptWhitespace = isSameQuery ? this.query.length !== inputValue.length : false;
                //if (isSameQueryExceptWhitespace) {
                //    this.trigger("whitespaceChanged", {
                //        value: this.query
                //    });
                //} else
                if (!isSameQuery) {
                    this.trigger("queryChanged", {
                        value: this.query = inputValue
                    });
                }
            },
            destroy: function () {
                this.$hint.off(".tt");
                this.$input.off(".tt");
                this.$hint = this.$input = this.$overflowHelper = null;
            },
            focus: function () {
                this.$input.focus();
            },
            blur: function () {
                this.$input.blur();
            },
            getQuery: function () {
                return this.query;
            },
            setQuery: function (query) {
                this.query = query;
            },
            getInputValue: function () {
                return this.$input.val();
            },
            setInputValue: function (value, silent) {
                this.$input.val(value);
                !silent && this._compareQueryToInputValue();
            },
            getHintValue: function () {
                return this.$hint.val();
            },
            setHintValue: function (value) {
                this.$hint.val(value);
            },
            getLanguageDirection: function () {
                return (this.$input.css("direction") || "ltr").toLowerCase();
            },
            isOverflow: function () {
                this.$overflowHelper.text(this.getInputValue());
                return this.$overflowHelper.width() > this.$input.width();
            },
            isCursorAtEnd: function () {
                var valueLength = this.$input.val().length, selectionStart = this.$input[0].selectionStart, range;
                if (utils.isNumber(selectionStart)) {
                    return selectionStart === valueLength;
                } else if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart("character", -valueLength);
                    return valueLength === range.text.length;
                }
                return true;
            },
            //Report if the input has focus or not 
            hasFocus: function () {
                return this.isFocused || this.$input.is(':focus');
            }
        });
        return InputView;
        function buildOverflowHelper($input) {
            return $("<span></span>").css({
                position: "absolute",
                left: "-9999px",
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: $input.css("font-family"),
                fontSize: $input.css("font-size"),
                fontStyle: $input.css("font-style"),
                fontVariant: $input.css("font-variant"),
                fontWeight: $input.css("font-weight"),
                wordSpacing: $input.css("word-spacing"),
                letterSpacing: $input.css("letter-spacing"),
                textIndent: $input.css("text-indent"),
                textRendering: $input.css("text-rendering"),
                textTransform: $input.css("text-transform")
            }).insertAfter($input);
        }
        function compareQueries(a, b) {
            a = (a || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
            b = (b || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
            return a === b;
        }
    }();
    var DropdownView = function () {
        var html = {
            suggestionsList: '<span class="tt-suggestions"></span>'
        }, css = {
            suggestionsList: {
                display: "block"
            },
            suggestion: {
                whiteSpace: "nowrap",
                cursor: "pointer"
            },
            suggestionChild: {
                whiteSpace: "normal"
            }
        };
        function DropdownView(o) {
            utils.bindAll(this);
            this.tracer = o.tracer;
            this.isOpen = false;
            this.isEmpty = true;
            this.isMouseOverDropdown = false;
            this.$menu = $(o.menu).on("mousedown.tt", this._handleMouseDown).on("mouseenter.tt", this._handleMouseenter).on("mouseleave.tt", this._handleMouseleave).on("click.tt", ".tt-suggestion", this._handleSelection).on("mouseover.tt", ".tt-suggestion", this._handleMouseover);
        }
        utils.mixin(DropdownView.prototype, EventTarget, {
            _handleMouseenter: function () {
                this.isMouseOverDropdown = true;
            },
            _handleMouseleave: function () {
                this.isMouseOverDropdown = false;
            },
            _handleMouseover: function ($e) {
                var $suggestion = $($e.currentTarget);
                this._getSuggestions().removeClass("tt-is-under-cursor");
                $suggestion.addClass("tt-is-under-cursor");
            },
            _handleMouseDown: function ($e) {
                //This stops the inputview from bluring (this from focusing) but the _handleSelection is still executed without problem (which is exactly what we needed)
                //this.tracer.push('Dropdownview mousedown target: ' + $e.type + ' ' + $e.currentTarget.innerText);
                $e.preventDefault();
            },
            _handleSelection: function ($e) {
                //this.tracer.push('Dropdownview handleselecton target: ' + extractSuggestion($($e.currentTarget)).name);
                var $suggestion = $($e.currentTarget);
                this.trigger("suggestionSelected", extractSuggestion($suggestion));
            },
            _show: function () {
                this.$menu.css("display", "block");
            },
            _hide: function () {
                this.$menu.hide();
            },
            _moveCursor: function (increment) {
                var $suggestions, $cur, nextIndex, $underCursor;
                if (!this.isVisible()) {
                    return;
                }
                $suggestions = this._getSuggestions();
                $cur = $suggestions.filter(".tt-is-under-cursor");
                $cur.removeClass("tt-is-under-cursor");
                nextIndex = $suggestions.index($cur) + increment;
                nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;
                if (nextIndex === -1) {
                    this.trigger("cursorRemoved");
                    return;
                } else if (nextIndex < -1) {
                    nextIndex = $suggestions.length - 1;
                }
                $underCursor = $suggestions.eq(nextIndex).addClass("tt-is-under-cursor");
                this._ensureVisibility($underCursor);
                this.trigger("cursorMoved", extractSuggestion($underCursor));
            },
            _getSuggestions: function () {
                return this.$menu.find(".tt-suggestions > .tt-suggestion");
            },
            _ensureVisibility: function ($el) {
                var menuHeight = this.$menu.height() + parseInt(this.$menu.css("paddingTop"), 10) + parseInt(this.$menu.css("paddingBottom"), 10), menuScrollTop = this.$menu.scrollTop(), elTop = $el.position().top, elBottom = elTop + $el.outerHeight(true);
                if (elTop < 0) {
                    this.$menu.scrollTop(menuScrollTop + elTop);
                } else if (menuHeight < elBottom) {
                    this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
                }
            },
            destroy: function () {
                this.$menu.off(".tt");
                this.$menu = null;
            },
            isVisible: function () {
                return this.isOpen && !this.isEmpty;
            },
            closeUnlessMouseIsOverDropdown: function () {
                if (!this.isMouseOverDropdown) {
                    this.close();
                }
            },
            close: function () {
                if (this.isOpen) {
                    this.isOpen = false;
                    this.isMouseOverDropdown = false;
                    this._hide();
                    this.$menu.find(".tt-suggestions > .tt-suggestion").removeClass("tt-is-under-cursor");
                    this.trigger("closed");
                }
            },
            open: function () {
                if (!this.isOpen) {
                    this.isOpen = true;
                    //!this.isEmpty && this._show();
                    this._show();
                    this.trigger("opened");
                }
            },
            setLanguageDirection: function (dir) {
                var ltrCss = {
                    left: "0",
                    right: "auto"
                }, rtlCss = {
                    left: "auto",
                    right: " 0"
                };
                dir === "ltr" ? this.$menu.css(ltrCss) : this.$menu.css(rtlCss);
            },
            moveCursorUp: function () {
                this._moveCursor(-1);
            },
            moveCursorDown: function () {
                this._moveCursor(+1);
            },
            getSuggestionUnderCursor: function () {
                var $suggestion = this._getSuggestions().filter(".tt-is-under-cursor").first();
                return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
            },
            getFirstSuggestion: function () {
                var $suggestion = this._getSuggestions().first();
                return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
            },
            renderSuggestions: function (dataset, suggestions) {
                var datasetClassName = "tt-dataset-" + dataset.name, wrapper = '<div class="tt-suggestion">%body</div>', compiledHtml, $suggestionsList, $dataset = this.$menu.find("." + datasetClassName), elBuilder, fragment, $el;
                if ($dataset.length === 0) {
                    $suggestionsList = $(html.suggestionsList).css(css.suggestionsList);
                    $dataset = $("<div></div>").addClass(datasetClassName).append(dataset.header).append($suggestionsList).append(dataset.footer).appendTo(this.$menu);
                }
                if (suggestions.length > 0) {
                    this.isEmpty = false;
                    this.isOpen && this._show();
                    elBuilder = document.createElement("div");
                    fragment = document.createDocumentFragment();
                    utils.each(suggestions, function (i, suggestion) {
                        suggestion.dataset = dataset.name;
                        compiledHtml = dataset.template(suggestion.datum);
                        elBuilder.innerHTML = wrapper.replace("%body", compiledHtml);
                        $el = $(elBuilder.firstChild).css(css.suggestion).data("suggestion", suggestion);
                        $el.children().each(function () {
                            $(this).css(css.suggestionChild);
                        });
                        fragment.appendChild($el[0]);
                    });
                    $dataset.show().find(".tt-suggestions").html(fragment);
                } else {
                    this.clearSuggestions(dataset.name);
                }
                this.trigger("suggestionsRendered");
            },
            clearSuggestions: function (datasetName) {
                //this.tracer.push('Dropdownview clearSuggestions');
                var $datasets = datasetName ? this.$menu.find(".tt-dataset-" + datasetName) : this.$menu.find('[class^="tt-dataset-"]'), $suggestions = $datasets.find(".tt-suggestions");
                $datasets.hide();
                $suggestions.empty();
                if (this._getSuggestions().length === 0) {
                    this.isEmpty = true;
                    this._hide();
                }
            }
        });
        return DropdownView;
        function extractSuggestion($el) {
            return $el.data("suggestion");
        }
    }();
    var TypeaheadView = function () {
        var html = {
            wrapper: '<span class="twitter-typeahead"></span>',
            hint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="off" disabled>',
            dropdown: '<span class="tt-dropdown-menu"></span>'
        }, css = {
            wrapper: {
                position: "relative",
                display: "inline-block"
            },
            hint: {
                position: "absolute",
                top: "0",
                left: "0",
                borderColor: "transparent",
                boxShadow: "none"
            },
            query: {
                position: "relative",
                verticalAlign: "top",
                backgroundColor: "transparent"
            },
            dropdown: {
                position: "absolute",
                top: "100%",
                left: "0",
                zIndex: "100",
                display: "none"
            }
        };
        if (utils.isMsie()) {
            utils.mixin(css.query, {
                backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
            });
        }
        if (utils.isMsie() && utils.isMsie() <= 7) {
            utils.mixin(css.wrapper, {
                display: "inline",
                zoom: "1"
            });
            utils.mixin(css.query, {
                marginTop: "-1px"
            });
        }
        function TypeaheadView(o) {
            var $menu, $input, $hint;
            utils.bindAll(this);
            this.$node = buildDomStructure(o.input);
            this.selectedDatum = null;
            this.selectedDatumDsName = null;
            this.datasets = o.datasets;
            this.dir = null;
            this.eventBus = o.eventBus;
            this.hasRemote = false;
            this.isBusy = false;  //For controllyng busy/notBusy events
            this.isLoading = false; //
            this.dsnameAny = null; //Failsafe dsname for setDatum
            this.restrictInputToDatum = null;
            this.tracer = null; //Debug tool for logs since console.log is unusable in IE since it receives focus
            this.dsIdx = []; //NameIndex on datasets
            this.minMinLength = null; //The least minLength of the datasets - to check if any of them allow for empty query (get all)
            //Pickup required options from the datasets
            //Note: we are assuming that each dataset has the same name and valueKeys, restrictInputToDatum is picked up from any of those
            //Perhaps a better way would be to have some global settings seporate from the datasets
            if (this.datasets && this.datasets.length > 0) {
                for (var i = 0; i < this.datasets.length; i++) {
                    this.dsIdx[this.datasets[i].name] = this.datasets[i];
                    if (!this.dsnameAny)
                        this.dsnameAny = this.datasets[i].name;
                    if (this.datasets[i].isRemote) {
                        this.hasRemote = true;
                        this.dsnameAny = this.datasets[i].name; //prefer remote dataset as failsafe for setDatum
                    }
                    if (!this.restrictInputToDatum && this.datasets[i]['restrictInputToDatum'])
                        this.restrictInputToDatum = this.datasets[i]['restrictInputToDatum'];
                    if (!this.tracer)
                        this.tracer = this.datasets[i]['tracer'];
                    if (this.minMinLength === null || this.minMinLength > this.datasets[i].minLength)
                        this.minMinLength = this.datasets[i].minLength;
                }
            }
            if (!this.tracer) this.tracer = [];
            $menu = this.$node.find(".tt-dropdown-menu");
            $input = this.$node.find(".tt-query");
            $hint = this.$node.find(".tt-hint");
            this.dropdownView = new DropdownView({
                menu: $menu,
                tracer: this.tracer
            }).on("suggestionSelected", this._handleSelection).on("cursorMoved", this._clearHint).on("cursorMoved", this._setInputValueToSuggestionUnderCursor).on("cursorRemoved", this._setInputValueToQuery).on("cursorRemoved", this._updateHint).on("suggestionsRendered", this._updateHint).on("opened", this._updateHint).on("closed", this._clearHint).on("opened closed", this._propagateEvent);
            this.inputView = new InputView({
                input: $input,
                hint: $hint,
                tracer: this.tracer
                //Little cleanup of all the event handlers here
                //I do not see any need for handling whitespace key at all !
            }).on("focused", this._handleFocused).on("enterKeyed tabKeyed", this._handleSelection)//.on("queryChanged", this._clearHint).on("queryChanged", this._clearSuggestions).on("queryChanged", this._queryForSuggestions)
                //.on("whitespaceChanged", this._updateHint)
                //.on("queryChanged whitespaceChanged", this._queryForSuggestions)
                //.on("queryChanged whitespaceChanged", this._setLanguageDirection) //include in queryForSuggestions
                .on("queryChanged", this._queryForSuggestions)
                .on("escKeyed", this._closeDropdown).on("escKeyed", this._setInputValueToQuery)
                .on("tabKeyed upKeyed downKeyed", this._managePreventDefault)
                .on("upKeyed downKeyed", this._moveDropdownCursor)
                .on("upKeyed downKeyed", this._openDropdown)
                .on("tabKeyed leftKeyed rightKeyed", this._autocomplete)
                .on("blured", this._handleBlured); 
        }
        utils.mixin(TypeaheadView.prototype, EventTarget, {
            _managePreventDefault: function (e) {
                var $e = e.data, hint, inputValue, preventDefault = false;
                switch (e.type) {
                    case "tabKeyed":  //Stop user from leaving input on tab-key if auto-completion is still to be done by tab key
                        hint = this.inputView.getHintValue();
                        inputValue = this.inputView.getInputValue();
                        preventDefault = hint && hint !== inputValue;
                        break;

                    case "upKeyed":
                    case "downKeyed":
                        preventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
                        break;
                }
                preventDefault && $e.preventDefault();
            },
            _manageLeaving: function (e) {
                //this.tracer.push('Leaving');
                var inputValue = this.inputView.getInputValue();
                var restrict = (typeof this.restrictInputToDatum == 'function' ? this.restrictInputToDatum() : this.restrictInputToDatum);
                //To allow user to select nothing we nullify the datum if the input string is empty and the datum name is not empty
                if (inputValue === null || inputValue.length == 0) {
                    if (!this.selectedDatum || this.selectedDatum[this.dsIdx[this.selectedDatumDsName].nameKey]) {
                        this.selectedDatum = null; //Clear the selected datum and notify
                        this.eventBus.trigger("noSelect", ''); //TTrigger event for databinding since user is deliberatly selecting empty value
                    }
                }
                else if (this.selectedDatum && inputValue != this.selectedDatum[this.dsIdx[this.selectedDatumDsName].nameKey]) {
                    if (restrict) {
                        this.inputView.setInputValue(this.selectedDatum[this.dsIdx[this.selectedDatumDsName].nameKey], true); //Reset input value as current datum
                    }
                    else {
                        this.selectedDatum = null; //Clear the selected datum and notify (without removing the input text)
                        this.eventBus.trigger("noSelect", inputValue); //TTrigger event for databinding of selected datum
                    }
                }
                else if (!this.selectedDatum && inputValue !== null && inputValue.length > 0) {
                    if (restrict)
                        this.inputView.setInputValue('', true); //Reset input value to empty value if restriction
                    this.eventBus.trigger("noSelect", inputValue); //TTrigger event for databinding of selected datum
                }

            },
            _setLanguageDirection: function () {
                var dir = this.inputView.getLanguageDirection();
                if (dir !== this.dir) {
                    this.dir = dir;
                    this.$node.css("direction", dir);
                    this.dropdownView.setLanguageDirection(dir);
                }
            },
            _updateHint: function () {
                var suggestion = this.dropdownView.getFirstSuggestion(), hint = suggestion ? suggestion.name : null, dropdownIsVisible = this.dropdownView.isVisible(), inputHasOverflow = this.inputView.isOverflow(), inputValue, query, escapedQuery, beginsWithQuery, match;
                if (hint && dropdownIsVisible && !inputHasOverflow) {
                    inputValue = this.inputView.getInputValue();
                    query = inputValue.replace(/\s{2,}/g, " ").replace(/^\s+/g, "");
                    escapedQuery = utils.escapeRegExChars(query);
                    beginsWithQuery = new RegExp("^(?:" + escapedQuery + ")(.*$)", "i");
                    match = beginsWithQuery.exec(hint);
                    this.inputView.setHintValue(inputValue + (match ? match[1] : ""));
                }
            },
            _clearHint: function () {
                this.inputView.setHintValue("");
            },
            _clearSuggestions: function () {
                this.dropdownView.clearSuggestions();
            },
            _setInputValueToQuery: function () {
                this.inputView.setInputValue(this.inputView.getQuery());
            },
            _setInputValueToSuggestionUnderCursor: function (e) {
                var suggestion = e.data;
                this.inputView.setInputValue(suggestion.name, true);
            },
            _openDropdown: function (e) {  //basically does the same thing as _queryForSuggestions now but only if closed
                //this.dropdownView.open();
                if (!this.dropdownView.isOpen)
                    this._queryForSuggestions(); //Suggestion render will open dropdown when something is found
            },
            _closeDropdown: function (e) {
                var e_type = e && e.type ? e.type : 'close'; //Ability to call without event info
                this._handleBusy(false, null);
                this.dropdownView[e_type === "blured" ? "closeUnlessMouseIsOverDropdown" : "close"]();
            },
            _moveDropdownCursor: function (e) {
                var $e = e.data;
                if (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
                    this.dropdownView[e.type === "upKeyed" ? "moveCursorUp" : "moveCursorDown"]();
                }
            },
            _handleSelection: function (e) {
                //this.tracer.push('Typeahead view handle selection');
                //var byClick = e.type === "suggestionSelected", suggestion = byClick ? e.data : this.dropdownView.getSuggestionUnderCursor();
                //In any case now the getSuggestion under control works fine
                //suggestion = this.dropdownView.getSuggestionUnderCursor();
                //Change this to accept the suggestion if we get it by event but as a failback look for it in the dropdownview
                if (e.data && e.data.hasOwnProperty('datum'))
                    suggestion = e.data;
                else
                    suggestion = this.dropdownView.getSuggestionUnderCursor();
                if (suggestion) {
                    //this.tracer.push('Suggestion foud: ' + suggestion.name);
                    this.inputView.setQuery(suggestion.name);
                    this.inputView.setInputValue(suggestion.name, true);
                    this.selectedDatumDsName = suggestion.dsname;
                    this.selectedDatum = suggestion.datum;
                    this._clearSuggestions();
                    //this._getSuggestions();
                    //this._updateHint();
                    //The previous code was to tackle the problem of the dropdownview having received focus on mouse click
                    //This has been fixed now, at least for FF and Crome so we sould be able to simpli close the dropdown without refocusing the input view
                    //byClick ? this.inputView.focus() : e.data.preventDefault();
                    //byClick && utils.isMsie() ? utils.defer(this.dropdownView.close) : this.dropdownView.close();
                    //Another thing we want to do here is to clear 
                    this._handleBusy(false, null);
                    this.dropdownView.close();
                    this.eventBus.trigger("selected", suggestion.datum, suggestion.dataset);
                };
                //else
                //    this.tracer.push('Typeaheadview handleselection found no suggestion');
            },
            //Allow page/binders manage busy controller or dataBind to busy property
            //This function is called when Suggestions are rendered but also when the dropdown is closed, the same goes for prefetching data
            //Caller sets null for unknown values, else true/false
            _handleBusy: function (isBusy, isLoading) {
                var busyNow = this.isBusy === true || this.isLoading === true;
                if (!busyNow && (isBusy === true || isLoading === true))
                    this.eventBus.trigger("busyUpdate",true);
                else if (busyNow && (isBusy === false || isLoading === false)) {
                    var okNow = true;
                    if (this.isBusy === true && isBusy !== false)
                        okNow = false;
                    if (this.isLoading === true && isLoading !== false)
                        okNow = false;
                    okNow && this.eventBus.trigger("busyUpdate",false);
                }
                if (isBusy !== null)
                    this.isBusy = isBusy;
                if (isLoading !== null)
                    this.isLoading = isLoading;
            },
            _handleFocused: function () {
                this.inputView.isFocused = true; //Debug
                this._queryForSuggestions();
            },
            _handleBlured: function (e) {
                this.inputView.isFocused = false; //Debug
                this._closeDropdown(e);
                this._setInputValueToQuery();
                this._manageLeaving(e);
            },
            //Now made to run on demand (on focus on input or when typing)
            //Also renamed from _getSuggestons since same method name with different functionality is used in other classes
            _queryForSuggestions: function () {
                this._clearHint();
                this._clearSuggestions();
                var that = this, query = this.inputView.getQuery();
                //this.tracer.push('Typeaheadview getSuggestins: '+query);
                if (this.minMinLength !== 0 && utils.isBlankString(query)) {
                    return;
                }
                this._handleBusy(true, null);
                utils.each(this.datasets, function (i, dataset) {
                    dataset.getSuggestions(query, function (suggestions) {
                        if (query === that.inputView.getQuery()) { //This is still the active query
                            //NOW OPEN THE DROPDOWN - but only if this is the focused input control
                            if (that.inputView.hasFocus()) {
                                that._setLanguageDirection;
                                that.dropdownView.open(); 
                                that.dropdownView.renderSuggestions(dataset, suggestions);
                            }
                        }
                    });
                });
                if (query === that.inputView.getQuery()) {
                    this._handleBusy(false, null);
                }
            },
            _autocomplete: function (e) {
                var isCursorAtEnd, ignoreEvent, query, hint, suggestion;
                if (e.type === "rightKeyed" || e.type === "leftKeyed") {
                    isCursorAtEnd = this.inputView.isCursorAtEnd();
                    ignoreEvent = this.inputView.getLanguageDirection() === "ltr" ? e.type === "leftKeyed" : e.type === "rightKeyed";
                    if (!isCursorAtEnd || ignoreEvent) {
                        return;
                    }
                }
                query = this.inputView.getQuery();
                hint = this.inputView.getHintValue();
                if (hint !== "" && query !== hint) {
                    suggestion = this.dropdownView.getFirstSuggestion();
                    //this.tracer.push('autocomplete: ' + suggestion.name);
                    this.selectedDatum = suggestion.datum;
                    this.selectedDatumDsName = suggestion.dsname;
                    this.inputView.setInputValue(suggestion.name);
                    this.eventBus.trigger("autocompleted", suggestion.datum, suggestion.dataset);
                }
                //this.tracer.push('Typeaheadview autocomplete: ' + query);
            },
            _propagateEvent: function (e) {
                this.eventBus.trigger(e.type);
            },
            destroy: function () {
                this.inputView.destroy();
                this.dropdownView.destroy();
                destroyDomStructure(this.$node);
                this.$node = null;
            },
            setQuery: function (query) {
                this.inputView.setQuery(query);
                this.inputView.setInputValue(query);
                this._clearHint();
                this._clearSuggestions();
                //this._getSuggestions();  
                //this._queryForSuggestions();  //ToDO: this is questionable, should only do this if control is focused (now only needed if prefetch is in progress)
            },
            setDatum: function (datum, dsname) {
                //Since we are using namekeys and valuekeys we can not assume how to pickup datum values unless we have the name and value keys
                //Those keys are stored in the dataset, this is why we need the dsname property.
                //We are still prepared for it to be emty, because it should be ok if we have only one dataset,only one remote dataset the datum belongs to, or all the datasets use the same keys. (probably 95% of all cases)
                dsname = dsname ? dsname : this.dsnameAny;
                if (typeof dsname !== 'undefined' && this.dsIdx[dsname].nameKey) {
                    this.selectedDatumDsName = dsname;
                    this.selectedDatum = datum;
                    query = datum ? datum[this.dsIdx[dsname].nameKey] : '';
                    this.inputView.setQuery(query);
                    this.inputView.setInputValue(query);
                    this._clearHint();
                    this._clearSuggestions();
                    //this._getSuggestions();
                    //this._queryForSuggestions(); //ToDO: this is questionable, should only do this if control is focused (now only needed if prefetch is in progress)
                };
            }
        });
        return TypeaheadView;
        function buildDomStructure(input) {
            var $wrapper = $(html.wrapper), $dropdown = $(html.dropdown), $input = $(input), $hint = $(html.hint);
            $wrapper = $wrapper.css(css.wrapper);
            $dropdown = $dropdown.css(css.dropdown);
            $hint.css(css.hint).css({
                backgroundAttachment: $input.css("background-attachment"),
                backgroundClip: $input.css("background-clip"),
                backgroundColor: $input.css("background-color"),
                backgroundImage: $input.css("background-image"),
                backgroundOrigin: $input.css("background-origin"),
                backgroundPosition: $input.css("background-position"),
                backgroundRepeat: $input.css("background-repeat"),
                backgroundSize: $input.css("background-size")
            });
            $input.data("ttAttrs", {
                dir: $input.attr("dir"),
                autocomplete: $input.attr("autocomplete"),
                spellcheck: $input.attr("spellcheck"),
                style: $input.attr("style")
            });
            $input.addClass("tt-query").attr({
                autocomplete: "off",
                spellcheck: false
            }).css(css.query);
            try {
                !$input.attr("dir") && $input.attr("dir", "auto");
            } catch (e) { }
            return $input.wrap($wrapper).parent().prepend($hint).append($dropdown);
        }
        function destroyDomStructure($node) {
            var $input = $node.find(".tt-query");
            utils.each($input.data("ttAttrs"), function (key, val) {
                utils.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
            });
            $input.detach().removeData("ttAttrs").removeClass("tt-query").insertAfter($node);
            $node.remove();
        }
    }();
    (function () {
        var cache = {}, viewKey = "ttView", methods, eventbus;
        methods = {
            initialize: function (datasetDefs) {
                var datasets, view;
                datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];
                if (datasetDefs.length === 0) {
                    $.error("no datasets provided");
                }
                datasets = utils.map(datasetDefs, function (o) {
                    //No reason to cache the whole dataset object, preset and remote cache should do fine
                    //var dataset = cache[o.name] ? cache[o.name] : new Dataset(o);
                    //if (o.name) {
                    //    cache[o.name] = dataset;
                    //}
                    //return dataset;
                    return new Dataset(o);
                });
                return this.each(initialize);
                function initialize() {
                    var $input = $(this), deferreds;
                    eventBus = new EventBus({
                        el: $input
                    });
                    $input.data(viewKey, new TypeaheadView({
                        input: $input,
                        eventBus: eventBus = new EventBus({
                            el: $input
                        }),
                        datasets: datasets,
                    }));
                    view = $(this).data(viewKey);
                    view._handleBusy(null, true); //Notify busy for initialiszation
                    deferreds = utils.map(datasets, function (dataset) {
                        return dataset.initialize();
                    });
                    $.when.apply($, deferreds).always(function () {
                        utils.defer(function () {
                            //if current is focused - recalculate suggestions - releaving programmers from calling setQuery on initialized
                            if (view.inputView && view.inputView.hasFocus())
                                view._queryForSuggestions();
                            view._handleBusy(null, false); //Notify no longer busy for initialization
                            eventBus.trigger("initialized");
                        });
                    });
                }
            },
            reload: function () {
                var $input = $(this), deferreds, view = $input.data(viewKey) ;
                return this.each(reload);
                function reload() {
                    var datasets = view && view.datasets ? view.datasets : null;
                    view._handleBusy(null, true); //Notify busy for reload
                    view._clearSuggestions();
                    deferreds = utils.map(datasets, function (dataset) {
                        return dataset.reload();
                    });
                    $.when.apply($, deferreds).always(function () {
                        utils.defer(function () {
                            if (view && view.inputView && view.inputView.hasFocus())
                                view._queryForSuggestions();
                            view._handleBusy(null, false); //Notify reload compleated
                            eventBus.trigger("reloaded");
                        });
                    });
                    return deferreds;
                }
            },
            destroy: function () {
                return this.each(destroy);
                function destroy() {
                    var $this = $(this), view = $this.data(viewKey);
                    if (view = $input.data(viewKey)) {
                        view.destroy();
                        $this.removeData(viewKey);
                    }
                }
            },
            setQuery: function (query) {
                var view = $(this).data(viewKey);
                view && view.setQuery(query);
            },
            setDatum: function (datum, dsname) {
                var view = $(this).data(viewKey);
                view && view.setDatum(datum, dsname);
            },
            getDatum: function () {
                var view = $(this).data(viewKey);
                return view && view.selectedDatum;
            },
            getQuery: function () {
                var view = $(this).data(viewKey);
                return view && view.inputView.getInputValue();
            },
            clearCache: function () {
                var view = $(this).data(viewKey);
                var datasets = view && view.datasets ? view.datasets : null;
                utils.each(datasets, clearCache);
                function clearCache(i, ds) {
                    ds.clearCache();
                }
            },
            openDropdown: function () {
                var view = $(this).data(viewKey);
                view && view._openDropdown();
            },
            closeDropdown: function () {
                var view = $(this).data(viewKey);
                view && view._closeDropdown();
            }
        };
        jQuery.fn.typeahead = function (method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1));
            } else {
                return methods.initialize.apply(this, arguments);
            }
        };
    })();
})(window.jQuery);