/*!
 * typeahead.js 0.8.1
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
    var VERSION = "0.8.1";
    var utils = {
        isMsie: function() {
            return /msie [\w.]+/i.test(navigator.userAgent);
        },
        isString: function(obj) {
            return typeof obj === "string";
        },
        isNumber: function(obj) {
            return typeof obj === "number";
        },
        isArray: $.isArray,
        isFunction: $.isFunction,
        isObject: function(obj) {
            return obj === Object(obj);
        },
        isUndefined: function(obj) {
            return typeof obj === "undefined";
        },
        bind: $.proxy,
        bindAll: function(obj) {
            var val;
            for (var key in obj) {
                utils.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj));
            }
        },
        indexOf: function(haystack, needle) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] === needle) {
                    return i;
                }
            }
            return -1;
        },
        each: $.each,
        map: $.map,
        filter: function(obj, test) {
            var results = [];
            $.each(obj, function(key, val) {
                if (test(val, key, obj)) {
                    results.push(val);
                }
            });
            return results;
        },
        every: function(obj, test) {
            var result = true;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (!(result = test.call(null, val, key, obj))) {
                    return false;
                }
            });
            return !!result;
        },
        mixin: $.extend,
        getUniqueId: function() {
            var counter = 0;
            return function() {
                return counter++;
            };
        }(),
        debounce: function(func, wait, immediate) {
            var timeout, result;
            return function() {
                var context = this, args = arguments, later, callNow;
                later = function() {
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
        throttle: function(func, wait) {
            var context, args, timeout, result, previous, later;
            previous = 0;
            later = function() {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
            };
            return function() {
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
        uniqueArray: function(array) {
            var u = {}, a = [];
            for (var i = 0, l = array.length; i < l; ++i) {
                if (u.hasOwnProperty(array[i])) {
                    continue;
                }
                a.push(array[i]);
                u[array[i]] = 1;
            }
            return a;
        },
        tokenizeQuery: function(str) {
            return $.trim(str).toLowerCase().split(/[\s]+/);
        },
        tokenizeText: function(str) {
            return $.trim(str).toLowerCase().split(/[\s\-_]+/);
        },
        getProtocol: function() {
            return location.protocol;
        },
        noop: function() {}
    };
    var EventTarget = function() {
        var eventSplitter = /\s+/;
        return {
            on: function(events, callback) {
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
            trigger: function(events, data) {
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
    var PersistentStorage = function() {
        var ls = window.localStorage, methods;
        function PersistentStorage(namespace) {
            this.prefix = [ "__", namespace, "__" ].join("");
            this.ttlKey = "__ttl__";
            this.keyMatcher = new RegExp("^" + this.prefix);
        }
        if (window.localStorage && window.JSON) {
            methods = {
                _prefix: function(key) {
                    return this.prefix + key;
                },
                _ttlKey: function(key) {
                    return this._prefix(key) + this.ttlKey;
                },
                get: function(key) {
                    if (this.isExpired(key)) {
                        this.remove(key);
                    }
                    return decode(ls.getItem(this._prefix(key)));
                },
                set: function(key, val, ttl) {
                    if (utils.isNumber(ttl)) {
                        ls.setItem(this._ttlKey(key), encode(now() + ttl));
                    } else {
                        ls.removeItem(this._ttlKey(key));
                    }
                    return ls.setItem(this._prefix(key), encode(val));
                },
                remove: function(key) {
                    ls.removeItem(this._ttlKey(key));
                    ls.removeItem(this._prefix(key));
                    return this;
                },
                clear: function() {
                    var i, key, keys = [], len = ls.length;
                    for (i = 0; i < len; i++) {
                        if ((key = ls.key(i)).match(this.keyMatcher)) {
                            keys.push(key.replace(this.keyMatcher, ""));
                        }
                    }
                    for (i = keys.length; i--; ) {
                        this.remove(keys[i]);
                    }
                    return this;
                },
                isExpired: function(key) {
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
    var RequestCache = function() {
        function RequestCache(o) {
            utils.bindAll(this);
            o = o || {};
            this.sizeLimit = o.sizeLimit || 10;
            this.cache = {};
            this.cachedKeysByAge = [];
        }
        utils.mixin(RequestCache.prototype, {
            get: function(url) {
                return this.cache[url];
            },
            set: function(url, resp) {
                var requestToEvict;
                if (this.cachedKeysByAge.length === this.sizeLimit) {
                    requestToEvict = this.cachedKeysByAge.shift();
                    delete this.cache[requestToEvict];
                }
                this.cache[url] = resp;
                this.cachedKeysByAge.push(url);
            }
        });
        return RequestCache;
    }();
    var Transport = function() {
        function Transport(o) {
            var rateLimitFn;
            utils.bindAll(this);
            o = o || {};
            rateLimitFn = /^throttle$/i.test(o.rateLimitFn) ? utils.throttle : utils.debounce;
            this.wait = o.wait || 300;
            this.wildcard = o.wildcard || "%QUERY";
            this.maxConcurrentRequests = o.maxConcurrentRequests || 6;
            this.concurrentRequests = 0;
            this.onDeckRequestArgs = null;
            this.cache = new RequestCache();
            this.get = rateLimitFn(this.get, this.wait);
        }
        utils.mixin(Transport.prototype, {
            _incrementConcurrentRequests: function() {
                this.concurrentRequests++;
            },
            _decrementConcurrentRequests: function() {
                this.concurrentRequests--;
            },
            _belowConcurrentRequestsThreshold: function() {
                return this.concurrentRequests < this.maxConcurrentRequests;
            },
            get: function(url, query, cb) {
                var that = this, resp;
                url = url.replace(this.wildcard, encodeURIComponent(query || ""));
                if (resp = this.cache.get(url)) {
                    cb && cb(resp);
                } else if (this._belowConcurrentRequestsThreshold()) {
                    $.ajax({
                        url: url,
                        type: "GET",
                        dataType: "json",
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
                } else {
                    this.onDeckRequestArgs = [].slice.call(arguments, 0);
                }
            }
        });
        return Transport;
    }();
    var Dataset = function() {
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
            this._ttl_ms = o.ttl_ms || 3 * 24 * 60 * 60 * 1e3;
            this.keys = {
                version: "version",
                protocol: "protocol",
                itemHash: "itemHash",
                adjacencyList: "adjacencyList"
            };
            o.local && this._processLocalData(o.local);
            o.prefetch && this._loadPrefetchData(o.prefetch);
        }
        utils.mixin(Dataset.prototype, {
            _processLocalData: function(data) {
                data && this._mergeProcessedData(this._processData(data));
            },
            _loadPrefetchData: function(url) {
                var that = this, itemHash = this.storage.get(this.keys.itemHash), adjacencyList = this.storage.get(this.keys.adjacencyList), protocol = this.storage.get(this.keys.protocol), version = this.storage.get(this.keys.version), isExpired = version !== VERSION || protocol !== utils.getProtocol();
                if (itemHash && adjacencyList && !isExpired) {
                    this._mergeProcessedData({
                        itemHash: itemHash,
                        adjacencyList: adjacencyList
                    });
                } else {
                    $.getJSON(url).done(processPrefetchData);
                }
                function processPrefetchData(data) {
                    var processedData = that._processData(data), itemHash = processedData.itemHash, adjacencyList = processedData.adjacencyList;
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
                    if (utils.isString(item)) {
                        item = {
                            value: item,
                            tokens: utils.tokenizeText(item)
                        };
                    }
                    item.tokens = utils.map(item.tokens || [], function(token) {
                        return token.toLowerCase();
                    });
                    itemHash[id = utils.getUniqueId(item.value)] = item;
                    utils.each(item.tokens, function(i, token) {
                        var char = token.charAt(0), adjacency = adjacencyList[char] || (adjacencyList[char] = [ id ]);
                        !~utils.indexOf(adjacency, id) && adjacency.push(id);
                    });
                });
                return {
                    itemHash: itemHash,
                    adjacencyList: adjacencyList
                };
            },
            _mergeProcessedData: function(processedData) {
                var that = this;
                utils.mixin(this.itemHash, processedData.itemHash);
                utils.each(processedData.adjacencyList, function(char, adjacency) {
                    var masterAdjacency = that.adjacencyList[char];
                    that.adjacencyList[char] = masterAdjacency ? masterAdjacency.concat(adjacency) : adjacency;
                });
            },
            _getPotentiallyMatchingIds: function(terms) {
                var potentiallyMatchingIds = [];
                var lists = [];
                utils.map(terms, utils.bind(function(term) {
                    var list = this.adjacencyList[term.charAt(0)];
                    if (!list) {
                        return;
                    }
                    lists.push(list);
                }, this));
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
                var aScoreBoost = !a.score_boost ? 0 : a.score_boost, bScoreBoost = !b.score_boost ? 0 : b.score_boost, aScore = !a.score ? 0 : a.score, bScore = !b.score ? 0 : b.score;
                if (areLocalItems) {
                    return b.weight + bScoreBoost - (a.weight + aScoreBoost);
                } else {
                    return bScore + bScoreBoost - (aScore + aScoreBoost);
                }
            },
            _ranker: function(a, b) {
                if (this._customRanker) {
                    return this._customRanker(a, b);
                } else {
                    var aIsLocal = a.weight && a.weight !== 0;
                    var bIsLocal = b.weight && b.weight !== 0;
                    if (aIsLocal && !bIsLocal) {
                        return -1;
                    } else if (bIsLocal && !aIsLocal) {
                        return 1;
                    } else {
                        return aIsLocal && bIsLocal ? this._compareItems(a, b, true) : this._compareItems(a, b, false);
                    }
                }
            },
            _processRemoteSuggestions: function(callback, matchedItems) {
                var that = this;
                return function(data) {
                    utils.each(data, function(i, remoteItem) {
                        var isDuplicate = false;
                        remoteItem = utils.isString(remoteItem) ? {
                            value: remoteItem
                        } : remoteItem;
                        utils.each(matchedItems, function(i, localItem) {
                            if (remoteItem.value === localItem.value) {
                                isDuplicate = true;
                                return false;
                            }
                        });
                        !isDuplicate && matchedItems.push(remoteItem);
                        return matchedItems.length < that.limit;
                    });
                    callback && callback(matchedItems);
                };
            },
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
    }();
    var InputView = function() {
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
            this.query = "";
            this.$hint = $(o.hint);
            this.$input = $(o.input).on("blur", this._handleBlur).on("focus", this._handleFocus).on("keydown", this._handleSpecialKeyEvent);
            if (!utils.isMsie()) {
                this.$input.on("input", this._compareQueryToInputValue);
            } else {
                this.$input.on("keydown keypress cut paste", function(e) {
                    if (that.specialKeyCodeMap[e.which || e.keyCode]) {
                        return;
                    }
                    setTimeout(that._compareQueryToInputValue, 0);
                });
            }
            this.$overflowHelper = buildOverflowHelper(this.$input);
        }
        utils.mixin(InputView.prototype, EventTarget, {
            _handleFocus: function() {
                this.trigger("focus");
            },
            _handleBlur: function() {
                this.trigger("blur");
            },
            _handleSpecialKeyEvent: function($e) {
                var keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];
                keyName && this.trigger(keyName, $e);
            },
            _compareQueryToInputValue: function() {
                var inputValue = this.getInputValue(), isSameQuery = compareQueries(this.query, inputValue), isSameQueryExceptWhitespace = isSameQuery ? this.query.length !== inputValue.length : false;
                if (isSameQueryExceptWhitespace) {
                    this.trigger("whitespaceChange", {
                        value: this.query
                    });
                } else if (!isSameQuery) {
                    this.trigger("queryChange", {
                        value: this.query = inputValue
                    });
                }
            },
            focus: function() {
                this.$input.focus();
            },
            blur: function() {
                this.$input.blur();
            },
            getQuery: function() {
                return this.query;
            },
            getInputValue: function() {
                return this.$input.val();
            },
            setInputValue: function(value, silent) {
                this.$input.val(value);
                if (silent !== true) {
                    this._compareQueryToInputValue();
                }
            },
            getHintValue: function() {
                return this.$hint.val();
            },
            setHintValue: function(value) {
                this.$hint.val(value);
            },
            getLanguageDirection: function() {
                return (this.$input.css("direction") || "ltr").toLowerCase();
            },
            isOverflow: function() {
                this.$overflowHelper.text(this.getInputValue());
                return this.$overflowHelper.width() > this.$input.width();
            },
            isCursorAtEnd: function() {
                var valueLength = this.$input.val().length, selectionStart = this.$input[0].selectionStart, range;
                if (utils.isNumber(selectionStart)) {
                    return selectionStart === valueLength;
                } else if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart("character", -valueLength);
                    return valueLength === range.text.length;
                }
                return true;
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
            a = (a || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ").toLowerCase();
            b = (b || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ").toLowerCase();
            return a === b;
        }
    }();
    var DropdownView = function() {
        function DropdownView(o) {
            utils.bindAll(this);
            this.isMouseOverDropdown;
            this.$menu = $(o.menu).on("mouseenter", this._handleMouseenter).on("mouseleave", this._handleMouseleave).on("mouseover", ".tt-suggestions > .tt-suggestion", this._handleMouseover).on("click", ".tt-suggestions > .tt-suggestion", this._handleSelection);
        }
        utils.mixin(DropdownView.prototype, EventTarget, {
            _handleMouseenter: function() {
                this.isMouseOverDropdown = true;
            },
            _handleMouseleave: function() {
                this.isMouseOverDropdown = false;
            },
            _handleMouseover: function($e) {
                this._getSuggestions().removeClass("tt-is-under-cursor");
                $($e.currentTarget).addClass("tt-is-under-cursor");
            },
            _handleSelection: function($e) {
                this.trigger("select", formatDataForSuggestion($($e.currentTarget)));
            },
            _moveCursor: function(increment) {
                var $suggestions, $cur, nextIndex, $underCursor;
                if (!this.$menu.hasClass("tt-is-open")) {
                    return;
                }
                $suggestions = this._getSuggestions();
                $cur = $suggestions.filter(".tt-is-under-cursor");
                $cur.removeClass("tt-is-under-cursor");
                nextIndex = $suggestions.index($cur) + increment;
                nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;
                if (nextIndex === -1) {
                    this.trigger("cursorOff");
                    return;
                } else if (nextIndex < -1) {
                    nextIndex = $suggestions.length - 1;
                }
                $underCursor = $suggestions.eq(nextIndex).addClass("tt-is-under-cursor");
                this.trigger("cursorOn", {
                    value: $underCursor.data("value")
                });
            },
            _getSuggestions: function() {
                return this.$menu.find(".tt-suggestions > .tt-suggestion");
            },
            hideUnlessMouseIsOverDropdown: function() {
                if (!this.isMouseOverDropdown) {
                    this.hide();
                }
            },
            hide: function() {
                if (this.$menu.hasClass("tt-is-open")) {
                    this.$menu.removeClass("tt-is-open").find(".tt-suggestions > .tt-suggestion").removeClass("tt-is-under-cursor");
                    this.trigger("hide");
                }
            },
            show: function() {
                if (!this.$menu.hasClass("tt-is-open")) {
                    this.$menu.addClass("tt-is-open");
                    this.trigger("show");
                }
            },
            isOpen: function() {
                return this.$menu.hasClass("tt-is-open");
            },
            moveCursorUp: function() {
                this._moveCursor(-1);
            },
            moveCursorDown: function() {
                this._moveCursor(+1);
            },
            getSuggestionUnderCursor: function() {
                var $suggestion = this._getSuggestions().filter(".tt-is-under-cursor").first();
                return $suggestion.length > 0 ? formatDataForSuggestion($suggestion) : null;
            },
            getFirstSuggestion: function() {
                var $suggestion = this._getSuggestions().first();
                return $suggestion.length > 0 ? formatDataForSuggestion($suggestion) : null;
            },
            renderSuggestions: function(query, dataset, suggestions) {
                var datasetClassName = "tt-dataset-" + dataset.name, $dataset = this.$menu.find("." + datasetClassName), elBuilder, fragment, el;
                if ($dataset.length === 0) {
                    $dataset = $('<li><ol class="tt-suggestions"></ol></li>').addClass(datasetClassName).appendTo(this.$menu);
                }
                elBuilder = document.createElement("div");
                fragment = document.createDocumentFragment();
                this.clearSuggestions(dataset.name);
                if (suggestions.length > 0) {
                    this.$menu.removeClass("tt-is-empty");
                    utils.each(suggestions, function(i, suggestion) {
                        elBuilder.innerHTML = dataset.template.render(suggestion);
                        el = elBuilder.firstChild;
                        el.setAttribute("data-value", suggestion.value);
                        fragment.appendChild(el);
                    });
                }
                $dataset.find("> .tt-suggestions").data({
                    query: query,
                    dataset: dataset.name
                }).append(fragment);
                this.trigger("suggestionsRender");
            },
            clearSuggestions: function(datasetName) {
                var $suggestions = datasetName ? this.$menu.find(".tt-dataset-" + datasetName + " .tt-suggestions") : this.$menu.find(".tt-suggestions");
                $suggestions.empty();
                this._getSuggestions().length === 0 && this.$menu.addClass("tt-is-empty");
            }
        });
        return DropdownView;
        function formatDataForSuggestion($suggestion) {
            var $suggestions = $suggestion.parents(".tt-suggestions").first();
            return {
                value: $suggestion.data("value"),
                query: $suggestions.data("query"),
                dataset: $suggestions.data("dataset")
            };
        }
    }();
    var TypeaheadView = function() {
        var html = {
            wrapper: '<span class="twitter-typeahead"></span>',
            hint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="false" disabled>',
            dropdown: '<ol class="tt-dropdown-menu tt-is-empty"></ol>'
        };
        function TypeaheadView(o) {
            utils.bindAll(this);
            this.$node = wrapInput(o.input);
            this.datasets = o.datasets;
            utils.each(this.datasets, function(key, dataset) {
                var parentTemplate = '<li class="tt-suggestion">%body</li>';
                if (dataset.template) {
                    dataset.template = dataset.engine.compile(parentTemplate.replace("%body", dataset.template));
                } else {
                    dataset.template = {
                        render: function(context) {
                            return parentTemplate.replace("%body", "<p>" + context.value + "</p>");
                        }
                    };
                }
            });
            this.inputView = new InputView({
                input: this.$node.find(".tt-query"),
                hint: this.$node.find(".tt-hint")
            });
            this.dropdownView = new DropdownView({
                menu: this.$node.find(".tt-dropdown-menu")
            });
            this.dropdownView.on("select", this._handleSelection).on("cursorOn", this._clearHint).on("cursorOn", this._setInputValueToSuggestionUnderCursor).on("cursorOff", this._setInputValueToQuery).on("cursorOff", this._updateHint).on("suggestionsRender", this._updateHint).on("show", this._updateHint).on("hide", this._clearHint);
            this.inputView.on("focus", this._showDropdown).on("blur", this._hideDropdown).on("blur", this._setInputValueToQuery).on("enter", this._handleSelection).on("queryChange", this._clearHint).on("queryChange", this._clearSuggestions).on("queryChange", this._getSuggestions).on("whitespaceChange", this._updateHint).on("queryChange whitespaceChange", this._showDropdown).on("queryChange whitespaceChange", this._setLanguageDirection).on("esc", this._hideDropdown).on("esc", this._setInputValueToQuery).on("tab up down", this._managePreventDefault).on("up down", this._moveDropdownCursor).on("up down", this._showDropdown).on("tab left right", this._autocomplete);
        }
        utils.mixin(TypeaheadView.prototype, EventTarget, {
            _managePreventDefault: function(e) {
                var $e = e.data, hint, inputValue, preventDefault = false;
                switch (e.type) {
                  case "tab":
                    hint = this.inputView.getHintValue();
                    inputValue = this.inputView.getInputValue();
                    preventDefault = hint && hint !== inputValue;
                    break;

                  case "up":
                  case "down":
                    preventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
                    break;
                }
                preventDefault && $e.preventDefault();
            },
            _setLanguageDirection: function() {
                var dirClassName = "tt-" + this.inputView.getLanguageDirection();
                if (!this.$node.hasClass(dirClassName)) {
                    this.$node.removeClass("tt-ltr tt-rtl").addClass(dirClassName);
                }
            },
            _updateHint: function() {
                var dataForFirstSuggestion = this.dropdownView.getFirstSuggestion(), hint = dataForFirstSuggestion ? dataForFirstSuggestion.value : null, inputValue, query, beginsWithQuery, match;
                if (hint && this.dropdownView.isOpen() && !this.inputView.isOverflow()) {
                    inputValue = this.inputView.getInputValue();
                    query = inputValue.replace(/\s{2,}/g, " ").replace(/^\s+/g, "");
                    beginsWithQuery = new RegExp("^(?:" + query + ")(.*$)", "i");
                    match = beginsWithQuery.exec(hint);
                    this.inputView.setHintValue(inputValue + (match ? match[1] : ""));
                }
            },
            _clearHint: function() {
                this.inputView.setHintValue("");
            },
            _clearSuggestions: function() {
                this.dropdownView.clearSuggestions();
            },
            _setInputValueToQuery: function() {
                this.inputView.setInputValue(this.inputView.getQuery());
            },
            _setInputValueToSuggestionUnderCursor: function(e) {
                var suggestion = e.data;
                this.inputView.setInputValue(suggestion.value, true);
            },
            _showDropdown: function() {
                this.dropdownView.show();
            },
            _hideDropdown: function(e) {
                this.dropdownView[e.type === "blur" ? "hideUnlessMouseIsOverDropdown" : "hide"]();
            },
            _moveDropdownCursor: function(e) {
                var $e = e.data;
                if (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
                    this.dropdownView[e.type === "up" ? "moveCursorUp" : "moveCursorDown"]();
                }
            },
            _handleSelection: function(e) {
                var byClick = e.type === "select", suggestionData = byClick ? e.data : this.dropdownView.getSuggestionUnderCursor();
                if (suggestionData) {
                    this.inputView.setInputValue(suggestionData.value);
                    byClick ? this.inputView.focus() : e.data.preventDefault();
                    byClick && utils.isMsie() ? setTimeout(this.dropdownView.hide, 0) : this.dropdownView.hide();
                }
            },
            _getSuggestions: function() {
                var that = this, query = this.inputView.getQuery();
                utils.each(this.datasets, function(i, dataset) {
                    dataset.getSuggestions(query, function(suggestions) {
                        that._renderSuggestions(query, dataset, suggestions);
                    });
                });
            },
            _renderSuggestions: function(query, dataset, suggestions) {
                if (query !== this.inputView.getQuery()) {
                    return;
                }
                suggestions = suggestions.slice(0, dataset.limit);
                this.dropdownView.renderSuggestions(query, dataset, suggestions);
            },
            _autocomplete: function(e) {
                var isCursorAtEnd, ignoreEvent, query, hint;
                if (e.type === "right" || e.type === "left") {
                    isCursorAtEnd = this.inputView.isCursorAtEnd();
                    ignoreEvent = this.inputView.getLanguageDirection() === "ltr" ? e.type === "left" : e.type === "right";
                    if (!isCursorAtEnd || ignoreEvent) {
                        return;
                    }
                }
                query = this.inputView.getQuery();
                hint = this.inputView.getHintValue();
                if (hint !== "" && query !== hint) {
                    this.inputView.setInputValue(hint);
                }
            }
        });
        return TypeaheadView;
        function wrapInput(input) {
            var $input = $(input), $hint = $(html.hint).css({
                "background-color": $input.css("background-color")
            });
            if ($input.length === 0) {
                return null;
            }
            try {
                !$input.attr("dir") && $input.attr("dir", "auto");
            } catch (e) {}
            return $input.attr({
                autocomplete: "off",
                spellcheck: false
            }).addClass("tt-query").wrap(html.wrapper).parent().prepend($hint).append(html.dropdown);
        }
    }();
    (function() {
        var initializedDatasets = {}, transportOptions = {}, transport, methods;
        jQuery.fn.typeahead = typeahead;
        typeahead.configureTransport = configureTransport;
        methods = {
            initialize: function(datasetDefs) {
                var datasets = {};
                datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [ datasetDefs ];
                if (datasetDefs.length === 0) {
                    throw new Error("no datasets provided");
                }
                delete typeahead.configureTransport;
                transport = transport || new Transport(transportOptions);
                utils.each(datasetDefs, function(i, datasetDef) {
                    var dataset, name = datasetDef.name = datasetDef.name || utils.getUniqueId();
                    if (initializedDatasets[name]) {
                        dataset = initializedDatasets[name];
                    } else {
                        datasetDef.limit = datasetDef.limit || 5;
                        datasetDef.template = datasetDef.template;
                        datasetDef.engine = datasetDef.engine;
                        if (datasetDef.template && !datasetDef.engine) {
                            throw new Error("no template engine specified for " + name);
                        }
                        dataset = initializedDatasets[name] = new Dataset({
                            name: datasetDef.name,
                            limit: datasetDef.limit,
                            local: datasetDef.local,
                            prefetch: datasetDef.prefetch,
                            ttl_ms: datasetDef.ttl_ms,
                            remote: datasetDef.remote,
                            matcher: datasetDef.matcher,
                            ranker: datasetDef.ranker,
                            transport: transport
                        });
                    }
                    datasets[name] = {
                        name: datasetDef.name,
                        limit: datasetDef.limit,
                        template: datasetDef.template,
                        engine: datasetDef.engine,
                        getSuggestions: dataset.getSuggestions
                    };
                });
                return this.each(function() {
                    $(this).data({
                        typeahead: new TypeaheadView({
                            input: this,
                            datasets: datasets
                        })
                    });
                });
            }
        };
        function typeahead(method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1));
            } else {
                return methods.initialize.apply(this, arguments);
            }
        }
        function configureTransport(o) {
            transportOptions = o;
        }
    })();
})();