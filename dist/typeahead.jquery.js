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
    }(), html = function() {
        return {
            wrapper: '<span class="twitter-typeahead"></span>',
            dropdown: '<span class="tt-dropdown-menu"></span>',
            dataset: '<div class="tt-dataset-%CLASS%"></div>',
            suggestions: '<span class="tt-suggestions"></span>',
            suggestion: '<div class="tt-suggestion"></div>',
            create: '<div class="tt-suggestion tt-create"></div>'
        };
    }(), css = function() {
        "use strict";
        var css = {
            wrapper: {
                position: "relative",
                display: "inline-block"
            },
            hint: {
                position: "absolute",
                top: "0",
                left: "0",
                borderColor: "transparent",
                boxShadow: "none",
                opacity: "1"
            },
            input: {
                position: "relative",
                verticalAlign: "top",
                backgroundColor: "transparent"
            },
            inputWithNoHint: {
                position: "relative",
                verticalAlign: "top"
            },
            dropdown: {
                position: "absolute",
                top: "100%",
                left: "0",
                zIndex: "100",
                display: "none"
            },
            suggestions: {
                display: "block"
            },
            suggestion: {
                whiteSpace: "nowrap",
                cursor: "pointer"
            },
            suggestionChild: {
                whiteSpace: "normal"
            },
            ltr: {
                left: "0",
                right: "auto"
            },
            rtl: {
                left: "auto",
                right: " 0"
            }
        };
        return _.isMsie() && _.mixin(css.input, {
            backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
        }), _.isMsie() && _.isMsie() <= 7 && _.mixin(css.input, {
            marginTop: "-1px"
        }), css;
    }(), EventBus = function() {
        "use strict";
        function EventBus(o) {
            o && o.el || $.error("EventBus initialized without el"), this.$el = $(o.el);
        }
        var namespace = "typeahead:";
        return _.mixin(EventBus.prototype, {
            trigger: function(type) {
                var args = [].slice.call(arguments, 1);
                this.$el.trigger(namespace + type, args);
            }
        }), EventBus;
    }(), EventEmitter = function() {
        "use strict";
        function on(method, types, cb, context) {
            var type;
            if (!cb) return this;
            for (types = types.split(splitter), cb = context ? bindContext(cb, context) : cb, 
            this._callbacks = this._callbacks || {}; type = types.shift(); ) this._callbacks[type] = this._callbacks[type] || {
                sync: [],
                async: []
            }, this._callbacks[type][method].push(cb);
            return this;
        }
        function onAsync(types, cb, context) {
            return on.call(this, "async", types, cb, context);
        }
        function onSync(types, cb, context) {
            return on.call(this, "sync", types, cb, context);
        }
        function off(types) {
            var type;
            if (!this._callbacks) return this;
            for (types = types.split(splitter); type = types.shift(); ) delete this._callbacks[type];
            return this;
        }
        function trigger(types) {
            var type, callbacks, args, syncFlush, asyncFlush;
            if (!this._callbacks) return this;
            for (types = types.split(splitter), args = [].slice.call(arguments, 1); (type = types.shift()) && (callbacks = this._callbacks[type]); ) syncFlush = getFlush(callbacks.sync, this, [ type ].concat(args)), 
            asyncFlush = getFlush(callbacks.async, this, [ type ].concat(args)), syncFlush() && nextTick(asyncFlush);
            return this;
        }
        function getFlush(callbacks, context, args) {
            function flush() {
                for (var cancelled, i = 0, len = callbacks.length; !cancelled && len > i; i += 1) cancelled = callbacks[i].apply(context, args) === !1;
                return !cancelled;
            }
            return flush;
        }
        function getNextTick() {
            var nextTickFn;
            return nextTickFn = window.setImmediate ? function(fn) {
                setImmediate(function() {
                    fn();
                });
            } : function(fn) {
                setTimeout(function() {
                    fn();
                }, 0);
            };
        }
        function bindContext(fn, context) {
            return fn.bind ? fn.bind(context) : function() {
                fn.apply(context, [].slice.call(arguments, 0));
            };
        }
        var splitter = /\s+/, nextTick = getNextTick();
        return {
            onSync: onSync,
            onAsync: onAsync,
            off: off,
            trigger: trigger
        };
    }(), highlight = function(doc) {
        "use strict";
        function getRegex(patterns, caseSensitive, wordsOnly) {
            for (var regexStr, escapedPatterns = [], i = 0, len = patterns.length; len > i; i++) escapedPatterns.push(_.escapeRegExChars(patterns[i]));
            return regexStr = wordsOnly ? "\\b(" + escapedPatterns.join("|") + ")\\b" : "(" + escapedPatterns.join("|") + ")", 
            caseSensitive ? new RegExp(regexStr) : new RegExp(regexStr, "i");
        }
        var defaults = {
            node: null,
            pattern: null,
            tagName: "strong",
            className: null,
            wordsOnly: !1,
            caseSensitive: !1
        };
        return function(o) {
            function hightlightTextNode(textNode) {
                var match, patternNode, wrapperNode;
                return (match = regex.exec(textNode.data)) && (wrapperNode = doc.createElement(o.tagName), 
                o.className && (wrapperNode.className = o.className), patternNode = textNode.splitText(match.index), 
                patternNode.splitText(match[0].length), wrapperNode.appendChild(patternNode.cloneNode(!0)), 
                textNode.parentNode.replaceChild(wrapperNode, patternNode)), !!match;
            }
            function traverse(el, hightlightTextNode) {
                for (var childNode, TEXT_NODE_TYPE = 3, i = 0; i < el.childNodes.length; i++) childNode = el.childNodes[i], 
                childNode.nodeType === TEXT_NODE_TYPE ? i += hightlightTextNode(childNode) ? 1 : 0 : traverse(childNode, hightlightTextNode);
            }
            var regex;
            o = _.mixin({}, defaults, o), o.node && o.pattern && (o.pattern = _.isArray(o.pattern) ? o.pattern : [ o.pattern ], 
            regex = getRegex(o.pattern, o.caseSensitive, o.wordsOnly), traverse(o.node, hightlightTextNode));
        };
    }(window.document), Input = function() {
        "use strict";
        function Input(o) {
            var onBlur, onFocus, onKeydown, onInput, that = this;
            o = o || {}, o.input || $.error("input is missing"), onBlur = _.bind(this._onBlur, this), 
            onFocus = _.bind(this._onFocus, this), onKeydown = _.bind(this._onKeydown, this), 
            onInput = _.bind(this._onInput, this), this.$hint = $(o.hint), this.$input = $(o.input).on("blur.tt", onBlur).on("focus.tt", onFocus).on("keydown.tt", onKeydown), 
            0 === this.$hint.length && (this.setHint = this.getHint = this.clearHint = this.clearHintIfInvalid = _.noop), 
            _.isMsie() ? this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function($e) {
                specialKeyCodeMap[$e.which || $e.keyCode] || _.defer(_.bind(that._onInput, that, $e));
            }) : this.$input.on("input.tt", onInput), this.query = this.$input.val(), this.$overflowHelper = buildOverflowHelper(this.$input);
        }
        function buildOverflowHelper($input) {
            return $('<pre aria-hidden="true"></pre>').css({
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "pre",
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
        function areQueriesEquivalent(a, b) {
            return Input.normalizeQuery(a) === Input.normalizeQuery(b);
        }
        function withModifier($e) {
            return $e.altKey || $e.ctrlKey || $e.metaKey || $e.shiftKey;
        }
        var specialKeyCodeMap;
        return specialKeyCodeMap = {
            9: "tab",
            27: "esc",
            37: "left",
            39: "right",
            13: "enter",
            38: "up",
            40: "down"
        }, Input.normalizeQuery = function(str) {
            return (str || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
        }, _.mixin(Input.prototype, EventEmitter, {
            _onBlur: function() {
                this.resetInputValue(), this.trigger("blurred");
            },
            _onFocus: function() {
                this.trigger("focused");
            },
            _onKeydown: function($e) {
                var keyName = specialKeyCodeMap[$e.which || $e.keyCode];
                this._managePreventDefault(keyName, $e), keyName && this._shouldTrigger(keyName, $e) && this.trigger(keyName + "Keyed", $e);
            },
            _onInput: function() {
                this._checkInputValue();
            },
            _managePreventDefault: function(keyName, $e) {
                var preventDefault, hintValue, inputValue;
                switch (keyName) {
                  case "tab":
                    hintValue = this.getHint(), inputValue = this.getInputValue(), preventDefault = hintValue && hintValue !== inputValue && !withModifier($e);
                    break;

                  case "up":
                  case "down":
                    preventDefault = !withModifier($e);
                    break;

                  default:
                    preventDefault = !1;
                }
                preventDefault && $e.preventDefault();
            },
            _shouldTrigger: function(keyName, $e) {
                var trigger;
                switch (keyName) {
                  case "tab":
                    trigger = !withModifier($e);
                    break;

                  default:
                    trigger = !0;
                }
                return trigger;
            },
            _checkInputValue: function() {
                var inputValue, areEquivalent, hasDifferentWhitespace;
                inputValue = this.getInputValue(), areEquivalent = areQueriesEquivalent(inputValue, this.query), 
                hasDifferentWhitespace = areEquivalent ? this.query.length !== inputValue.length : !1, 
                this.query = inputValue, areEquivalent ? hasDifferentWhitespace && this.trigger("whitespaceChanged", this.query) : this.trigger("queryChanged", this.query);
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
            setQuery: function(query) {
                this.query = query;
            },
            getInputValue: function() {
                return this.$input.val();
            },
            setInputValue: function(value, silent) {
                this.$input.val(value), silent ? this.clearHint() : this._checkInputValue();
            },
            resetInputValue: function() {
                this.setInputValue(this.query, !0);
            },
            getHint: function() {
                return this.$hint.val();
            },
            setHint: function(value) {
                this.$hint.val(value);
            },
            clearHint: function() {
                this.setHint("");
            },
            clearHintIfInvalid: function() {
                var val, hint, valIsPrefixOfHint, isValid;
                val = this.getInputValue(), hint = this.getHint(), valIsPrefixOfHint = val !== hint && 0 === hint.indexOf(val), 
                isValid = "" !== val && valIsPrefixOfHint && !this.hasOverflow(), !isValid && this.clearHint();
            },
            getLanguageDirection: function() {
                return (this.$input.css("direction") || "ltr").toLowerCase();
            },
            hasOverflow: function() {
                var constraint = this.$input.width() - 2;
                return this.$overflowHelper.text(this.getInputValue()), this.$overflowHelper.width() >= constraint;
            },
            isCursorAtEnd: function() {
                var valueLength, selectionStart, range;
                return valueLength = this.$input.val().length, selectionStart = this.$input[0].selectionStart, 
                _.isNumber(selectionStart) ? selectionStart === valueLength : document.selection ? (range = document.selection.createRange(), 
                range.moveStart("character", -valueLength), valueLength === range.text.length) : !0;
            },
            destroy: function() {
                this.$hint.off(".tt"), this.$input.off(".tt"), this.$hint = this.$input = this.$overflowHelper = null;
            }
        }), Input;
    }(), Dataset = function() {
        "use strict";
        function Dataset(o) {
            o = o || {}, o.templates = o.templates || {}, o.source || $.error("missing source"), 
            o.name && !isValidName(o.name) && $.error("invalid dataset name: " + o.name), this.query = null, 
            this.highlight = !!o.highlight, this.name = o.name || _.getUniqueId(), this.source = o.source, 
            this.displayFn = getDisplayFn(o.display || o.displayKey), this.templates = getTemplates(o.templates, this.displayFn), 
            this.$el = $(html.dataset.replace("%CLASS%", this.name)), this.allowCreate = o.allowCreate, 
            this.textCreate = o.textCreate || "Create ";
        }
        function getDisplayFn(display) {
            function displayFn(obj) {
                return obj[display];
            }
            return display = display || "value", _.isFunction(display) ? display : displayFn;
        }
        function getTemplates(templates, displayFn) {
            function suggestionTemplate(context) {
                return "<p>" + displayFn(context) + "</p>";
            }
            function createTemplate(context) {
                return '<div><p style="white-space: normal; text-align:center">' + context.textCreate + ' "<b>' + context.query + '</b>"</p></div>';
            }
            return {
                empty: templates.empty && _.templatify(templates.empty),
                header: templates.header && _.templatify(templates.header),
                footer: templates.footer && _.templatify(templates.footer),
                suggestion: templates.suggestion || suggestionTemplate,
                create: templates.create || createTemplate
            };
        }
        function isValidName(str) {
            return /^[_a-zA-Z0-9-]+$/.test(str);
        }
        var datasetKey = "ttDataset", valueKey = "ttValue", datumKey = "ttDatum";
        return Dataset.extractDatasetName = function(el) {
            return $(el).data(datasetKey);
        }, Dataset.extractValue = function(el) {
            return $(el).data(valueKey);
        }, Dataset.extractDatum = function(el) {
            return $(el).data(datumKey);
        }, _.mixin(Dataset.prototype, EventEmitter, {
            _render: function(query, suggestions) {
                function getEmptyHtml() {
                    return that.templates.empty({
                        query: query,
                        isEmpty: !0
                    });
                }
                function getSuggestionsHtml() {
                    function getSuggestionNode(suggestion) {
                        var $el;
                        return $el = $(html.suggestion).append(that.templates.suggestion(suggestion)).data(datasetKey, that.name).data(valueKey, that.displayFn(suggestion)).data(datumKey, suggestion), 
                        $el.children().each(function() {
                            $(this).css(css.suggestionChild);
                        }), $el;
                    }
                    var $suggestions, nodes;
                    return $suggestions = $(html.suggestions).css(css.suggestions), nodes = _.map(suggestions, getSuggestionNode), 
                    $suggestions.append.apply($suggestions, nodes), that.highlight && highlight({
                        className: "tt-highlight",
                        node: $suggestions[0],
                        pattern: query
                    }), $suggestions;
                }
                function getCreateHtml(obj) {
                    var $el;
                    return $el = $(html.create).attr("data-query", query).append(that.templates.create(obj)), 
                    $el.children().each(function() {
                        $(this).css(css.suggestionChild);
                    }), $el;
                }
                function getHeaderHtml() {
                    return that.templates.header({
                        query: query,
                        isEmpty: !hasSuggestions
                    });
                }
                function getFooterHtml() {
                    return that.templates.footer({
                        query: query,
                        isEmpty: !hasSuggestions
                    });
                }
                if (this.$el) {
                    var hasSuggestions, that = this;
                    this.$el.empty(), hasSuggestions = suggestions && suggestions.length, !hasSuggestions && this.templates.empty ? this.$el.html(getEmptyHtml()).prepend(that.templates.header ? getHeaderHtml() : null).append(that.templates.footer ? getFooterHtml() : null) : hasSuggestions && this.$el.html(getSuggestionsHtml()).prepend(that.templates.header ? getHeaderHtml() : null).append(that.templates.footer ? getFooterHtml() : null), 
                    1 == this.allowCreate && this.$el.append(getCreateHtml({
                        query: query,
                        textCreate: this.textCreate
                    })), this.trigger("rendered");
                }
            },
            getRoot: function() {
                return this.$el;
            },
            update: function(query) {
                function render(suggestions) {
                    that.canceled || query !== that.query || that._render(query, suggestions);
                }
                var that = this;
                this.query = query, this.canceled = !1, this.source(query, render);
            },
            cancel: function() {
                this.canceled = !0;
            },
            clear: function() {
                this.cancel(), this.$el.empty(), this.trigger("rendered");
            },
            isEmpty: function() {
                return this.$el.is(":empty");
            },
            destroy: function() {
                this.$el = null;
            }
        }), Dataset;
    }(), Dropdown = function() {
        "use strict";
        function Dropdown(o) {
            var onSuggestionClick, onSuggestionMouseEnter, onSuggestionMouseLeave, that = this;
            o = o || {}, o.menu || $.error("menu is required"), this.isOpen = !1, this.isEmpty = !0, 
            this.datasets = _.map(o.datasets, initializeDataset), onSuggestionClick = _.bind(this._onSuggestionClick, this), 
            onSuggestionMouseEnter = _.bind(this._onSuggestionMouseEnter, this), onSuggestionMouseLeave = _.bind(this._onSuggestionMouseLeave, this), 
            this.$menu = $(o.menu).on("click.tt", ".tt-suggestion", onSuggestionClick).on("mouseenter.tt", ".tt-suggestion", onSuggestionMouseEnter).on("mouseleave.tt", ".tt-suggestion", onSuggestionMouseLeave), 
            _.each(this.datasets, function(dataset) {
                that.$menu.append(dataset.getRoot()), dataset.onSync("rendered", that._onRendered, that);
            });
        }
        function initializeDataset(oDataset) {
            return new Dataset(oDataset);
        }
        return _.mixin(Dropdown.prototype, EventEmitter, {
            _onSuggestionClick: function($e) {
                this.trigger("suggestionClicked", $($e.currentTarget));
            },
            _onSuggestionMouseEnter: function($e) {
                this._removeCursor(), this._setCursor($($e.currentTarget), !0);
            },
            _onSuggestionMouseLeave: function() {
                this._removeCursor();
            },
            _onRendered: function() {
                function isDatasetEmpty(dataset) {
                    return dataset.isEmpty();
                }
                this.isEmpty = _.every(this.datasets, isDatasetEmpty), this.isEmpty ? this._hide() : this.isOpen && this._show(), 
                this.trigger("datasetRendered");
            },
            _hide: function() {
                this.$menu.hide();
            },
            _show: function() {
                this.$menu.css("display", "block");
            },
            _getSuggestions: function() {
                return this.$menu.find(".tt-suggestion");
            },
            _getCursor: function() {
                return this.$menu.find(".tt-cursor").first();
            },
            _setCursor: function($el, silent) {
                $el.first().addClass("tt-cursor"), !silent && this.trigger("cursorMoved");
            },
            _removeCursor: function() {
                this._getCursor().removeClass("tt-cursor");
            },
            _moveCursor: function(increment) {
                var $suggestions, $oldCursor, newCursorIndex, $newCursor;
                if (this.isOpen) {
                    if ($oldCursor = this._getCursor(), $suggestions = this._getSuggestions(), this._removeCursor(), 
                    newCursorIndex = $suggestions.index($oldCursor) + increment, newCursorIndex = (newCursorIndex + 1) % ($suggestions.length + 1) - 1, 
                    -1 === newCursorIndex) return void this.trigger("cursorRemoved");
                    -1 > newCursorIndex && (newCursorIndex = $suggestions.length - 1), this._setCursor($newCursor = $suggestions.eq(newCursorIndex)), 
                    this._ensureVisible($newCursor);
                }
            },
            _ensureVisible: function($el) {
                var elTop, elBottom, menuScrollTop, menuHeight;
                elTop = $el.position().top, elBottom = elTop + $el.outerHeight(!0), menuScrollTop = this.$menu.scrollTop(), 
                menuHeight = this.$menu.height() + parseInt(this.$menu.css("paddingTop"), 10) + parseInt(this.$menu.css("paddingBottom"), 10), 
                0 > elTop ? this.$menu.scrollTop(menuScrollTop + elTop) : elBottom > menuHeight && this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
            },
            close: function() {
                this.isOpen && (this.isOpen = !1, this._removeCursor(), this._hide(), this.trigger("closed"));
            },
            open: function() {
                this.isOpen || (this.isOpen = !0, !this.isEmpty && this._show(), this.trigger("opened"));
            },
            setLanguageDirection: function(dir) {
                this.$menu.css("ltr" === dir ? css.ltr : css.rtl);
            },
            moveCursorUp: function() {
                this._moveCursor(-1);
            },
            moveCursorDown: function() {
                this._moveCursor(1);
            },
            getDatumForSuggestion: function($el) {
                var datum = null;
                return $el.length && (datum = {
                    raw: Dataset.extractDatum($el),
                    value: Dataset.extractValue($el),
                    datasetName: Dataset.extractDatasetName($el)
                }), datum;
            },
            getDatumForCursor: function() {
                return this.getDatumForSuggestion(this._getCursor().first());
            },
            getDatumForTopSuggestion: function() {
                return this.getDatumForSuggestion(this._getSuggestions().first());
            },
            update: function(query) {
                function updateDataset(dataset) {
                    dataset.update(query);
                }
                _.each(this.datasets, updateDataset);
            },
            empty: function() {
                function clearDataset(dataset) {
                    dataset.clear();
                }
                _.each(this.datasets, clearDataset), this.isEmpty = !0;
            },
            isVisible: function() {
                return this.isOpen && !this.isEmpty;
            },
            destroy: function() {
                function destroyDataset(dataset) {
                    dataset.destroy();
                }
                this.$menu.off(".tt"), this.$menu = null, _.each(this.datasets, destroyDataset);
            }
        }), Dropdown;
    }(), Typeahead = function() {
        "use strict";
        function Typeahead(o) {
            var $menu, $input, $hint;
            o = o || {}, o.input || $.error("missing input"), this.isActivated = !1, this.autoselect = !!o.autoselect, 
            this.minLength = _.isNumber(o.minLength) ? o.minLength : 1, this.$node = buildDom(o.input, o.withHint), 
            $menu = this.$node.find(".tt-dropdown-menu"), $input = this.$node.find(".tt-input"), 
            $hint = this.$node.find(".tt-hint"), $input.on("blur.tt", function($e) {
                var active, isActive, hasActive;
                active = document.activeElement, isActive = $menu.is(active), hasActive = $menu.has(active).length > 0, 
                _.isMsie() && (isActive || hasActive) && ($e.preventDefault(), $e.stopImmediatePropagation(), 
                _.defer(function() {
                    $input.focus();
                }));
            }), $menu.on("mousedown.tt", function($e) {
                $e.preventDefault();
            }), this.eventBus = o.eventBus || new EventBus({
                el: $input
            }), this.dropdown = new Dropdown({
                menu: $menu,
                datasets: o.datasets
            }).onSync("suggestionClicked", this._onSuggestionClicked, this).onSync("cursorMoved", this._onCursorMoved, this).onSync("cursorRemoved", this._onCursorRemoved, this).onSync("opened", this._onOpened, this).onSync("closed", this._onClosed, this).onAsync("datasetRendered", this._onDatasetRendered, this), 
            this.input = new Input({
                input: $input,
                hint: $hint
            }).onSync("focused", this._onFocused, this).onSync("blurred", this._onBlurred, this).onSync("enterKeyed", this._onEnterKeyed, this).onSync("tabKeyed", this._onTabKeyed, this).onSync("escKeyed", this._onEscKeyed, this).onSync("upKeyed", this._onUpKeyed, this).onSync("downKeyed", this._onDownKeyed, this).onSync("leftKeyed", this._onLeftKeyed, this).onSync("rightKeyed", this._onRightKeyed, this).onSync("queryChanged", this._onQueryChanged, this).onSync("whitespaceChanged", this._onWhitespaceChanged, this), 
            this._setLanguageDirection();
        }
        function buildDom(input, withHint) {
            var $input, $wrapper, $dropdown, $hint;
            $input = $(input), $wrapper = $(html.wrapper).css(css.wrapper), $dropdown = $(html.dropdown).css(css.dropdown), 
            $hint = $input.clone().css(css.hint).css(getBackgroundStyles($input)), $hint.val("").removeData().addClass("tt-hint").removeAttr("id name placeholder required").prop("readonly", !0).attr({
                autocomplete: "off",
                spellcheck: "false",
                tabindex: -1
            }), $input.data(attrsKey, {
                dir: $input.attr("dir"),
                autocomplete: $input.attr("autocomplete"),
                spellcheck: $input.attr("spellcheck"),
                style: $input.attr("style")
            }), $input.addClass("tt-input").attr({
                autocomplete: "off",
                spellcheck: !1
            }).css(withHint ? css.input : css.inputWithNoHint);
            try {
                !$input.attr("dir") && $input.attr("dir", "auto");
            } catch (e) {}
            return $input.wrap($wrapper).parent().prepend(withHint ? $hint : null).append($dropdown);
        }
        function getBackgroundStyles($el) {
            return {
                backgroundAttachment: $el.css("background-attachment"),
                backgroundClip: $el.css("background-clip"),
                backgroundColor: $el.css("background-color"),
                backgroundImage: $el.css("background-image"),
                backgroundOrigin: $el.css("background-origin"),
                backgroundPosition: $el.css("background-position"),
                backgroundRepeat: $el.css("background-repeat"),
                backgroundSize: $el.css("background-size")
            };
        }
        function destroyDomStructure($node) {
            var $input = $node.find(".tt-input");
            _.each($input.data(attrsKey), function(val, key) {
                _.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
            }), $input.detach().removeData(attrsKey).removeClass("tt-input").insertAfter($node), 
            $node.remove();
        }
        var attrsKey = "ttAttrs";
        return _.mixin(Typeahead.prototype, {
            _onSuggestionClicked: function(type, $el) {
                var datum;
                (datum = this.dropdown.getDatumForSuggestion($el)) && this._select(datum);
            },
            _onCursorMoved: function() {
                var datum = this.dropdown.getDatumForCursor();
                this.input.setInputValue(datum.value, !0), this.eventBus.trigger("cursorchanged", datum.raw, datum.datasetName);
            },
            _onCursorRemoved: function() {
                this.input.resetInputValue(), this._updateHint();
            },
            _onDatasetRendered: function() {
                this._updateHint();
            },
            _onOpened: function() {
                this._updateHint(), this.eventBus.trigger("opened");
            },
            _onClosed: function() {
                this.input.clearHint(), this.eventBus.trigger("closed");
            },
            _onFocused: function() {
                this.isActivated = !0, this.dropdown.open();
            },
            _onBlurred: function() {
                this.isActivated = !1, this.dropdown.empty(), this.dropdown.close();
            },
            _onEnterKeyed: function(type, $e) {
                var cursorDatum, topSuggestionDatum;
                cursorDatum = this.dropdown.getDatumForCursor(), topSuggestionDatum = this.dropdown.getDatumForTopSuggestion(), 
                cursorDatum ? (this._select(cursorDatum), $e.preventDefault()) : this.autoselect && topSuggestionDatum && (this._select(topSuggestionDatum), 
                $e.preventDefault());
            },
            _onTabKeyed: function(type, $e) {
                var datum;
                (datum = this.dropdown.getDatumForCursor()) ? (this._select(datum), $e.preventDefault()) : this._autocomplete(!0);
            },
            _onEscKeyed: function() {
                this.dropdown.close(), this.input.resetInputValue();
            },
            _onUpKeyed: function() {
                var query = this.input.getQuery();
                this.dropdown.isEmpty && query.length >= this.minLength ? this.dropdown.update(query) : this.dropdown.moveCursorUp(), 
                this.dropdown.open();
            },
            _onDownKeyed: function() {
                var query = this.input.getQuery();
                this.dropdown.isEmpty && query.length >= this.minLength ? this.dropdown.update(query) : this.dropdown.moveCursorDown(), 
                this.dropdown.open();
            },
            _onLeftKeyed: function() {
                "rtl" === this.dir && this._autocomplete();
            },
            _onRightKeyed: function() {
                "ltr" === this.dir && this._autocomplete();
            },
            _onQueryChanged: function(e, query) {
                this.input.clearHintIfInvalid(), query.length >= this.minLength ? this.dropdown.update(query) : this.dropdown.empty(), 
                this.dropdown.open(), this._setLanguageDirection();
            },
            _onWhitespaceChanged: function() {
                this._updateHint(), this.dropdown.open();
            },
            _setLanguageDirection: function() {
                var dir;
                this.dir !== (dir = this.input.getLanguageDirection()) && (this.dir = dir, this.$node.css("direction", dir), 
                this.dropdown.setLanguageDirection(dir));
            },
            _updateHint: function() {
                var datum, val, query, escapedQuery, frontMatchRegEx, match;
                datum = this.dropdown.getDatumForTopSuggestion(), datum && this.dropdown.isVisible() && !this.input.hasOverflow() ? (val = this.input.getInputValue(), 
                query = Input.normalizeQuery(val), escapedQuery = _.escapeRegExChars(query), frontMatchRegEx = new RegExp("^(?:" + escapedQuery + ")(.+$)", "i"), 
                match = frontMatchRegEx.exec(datum.value), match ? this.input.setHint(val + match[1]) : this.input.clearHint()) : this.input.clearHint();
            },
            _autocomplete: function(laxCursor) {
                var hint, query, isCursorAtEnd, datum;
                hint = this.input.getHint(), query = this.input.getQuery(), isCursorAtEnd = laxCursor || this.input.isCursorAtEnd(), 
                hint && query !== hint && isCursorAtEnd && (datum = this.dropdown.getDatumForTopSuggestion(), 
                datum && this.input.setInputValue(datum.value), this.eventBus.trigger("autocompleted", datum.raw, datum.datasetName));
            },
            _select: function(datum) {
                this.input.setQuery(datum.value), this.input.setInputValue(datum.value, !0), this._setLanguageDirection(), 
                this.eventBus.trigger("selected", datum.raw, datum.datasetName), this.dropdown.close(), 
                _.defer(_.bind(this.dropdown.empty, this.dropdown));
            },
            open: function() {
                this.dropdown.open();
            },
            close: function() {
                this.dropdown.close();
            },
            setVal: function(val) {
                val = _.toStr(val), this.isActivated ? this.input.setInputValue(val) : (this.input.setQuery(val), 
                this.input.setInputValue(val, !0)), this._setLanguageDirection();
            },
            getVal: function() {
                return this.input.getQuery();
            },
            destroy: function() {
                this.input.destroy(), this.dropdown.destroy(), destroyDomStructure(this.$node), 
                this.$node = null;
            }
        }), Typeahead;
    }();
    !function() {
        "use strict";
        var old, typeaheadKey, methods;
        old = $.fn.typeahead, typeaheadKey = "ttTypeahead", methods = {
            initialize: function(o, datasets) {
                function attach() {
                    var eventBus, typeahead, $input = $(this);
                    _.each(datasets, function(d) {
                        d.highlight = !!o.highlight;
                    }), typeahead = new Typeahead({
                        input: $input,
                        eventBus: eventBus = new EventBus({
                            el: $input
                        }),
                        withHint: _.isUndefined(o.hint) ? !0 : !!o.hint,
                        minLength: o.minLength,
                        autoselect: o.autoselect,
                        datasets: datasets
                    }), $input.data(typeaheadKey, typeahead);
                }
                return datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1), 
                o = o || {}, this.each(attach);
            },
            open: function() {
                function openTypeahead() {
                    var typeahead, $input = $(this);
                    (typeahead = $input.data(typeaheadKey)) && typeahead.open();
                }
                return this.each(openTypeahead);
            },
            close: function() {
                function closeTypeahead() {
                    var typeahead, $input = $(this);
                    (typeahead = $input.data(typeaheadKey)) && typeahead.close();
                }
                return this.each(closeTypeahead);
            },
            val: function(newVal) {
                function setVal() {
                    var typeahead, $input = $(this);
                    (typeahead = $input.data(typeaheadKey)) && typeahead.setVal(newVal);
                }
                function getVal($input) {
                    var typeahead, query;
                    return (typeahead = $input.data(typeaheadKey)) && (query = typeahead.getVal()), 
                    query;
                }
                return arguments.length ? this.each(setVal) : getVal(this.first());
            },
            destroy: function() {
                function unattach() {
                    var typeahead, $input = $(this);
                    (typeahead = $input.data(typeaheadKey)) && (typeahead.destroy(), $input.removeData(typeaheadKey));
                }
                return this.each(unattach);
            }
        }, $.fn.typeahead = function(method) {
            var tts;
            return methods[method] && "initialize" !== method ? (tts = this.filter(function() {
                return !!$(this).data(typeaheadKey);
            }), methods[method].apply(tts, [].slice.call(arguments, 1))) : methods.initialize.apply(this, arguments);
        }, $.fn.typeahead.noConflict = function() {
            return $.fn.typeahead = old, this;
        };
    }();
}(window.jQuery);