// ghostwriter 0.2.0
// =================
// * GitHub: https://github.com/jharding/ghostwriter
// * Copyright (c) 2013 Jake Harding
// * Licensed under the MIT license.

(function(exports, global) {
    global["ghostwriter"] = exports;
    var utils = function() {
        var concat = Array.prototype.concat;
        return {
            isString: function(obj) {
                return typeof obj === "string";
            },
            isNumber: function(obj) {
                return typeof obj === "number";
            },
            isFunction: $.isFunction,
            isArray: $.isArray,
            each: $.each,
            map: $.map,
            bind: $.proxy,
            merge: function(array) {
                return concat.apply([], array);
            },
            mixin: $.extend,
            getKeyEvent: function(type, key) {
                var event = $.Event(type);
                event.ghostwriter = true;
                if (type === "keypress") {
                    event.which = event.keyCode = event.charCode = utils.isString(key) ? key.charCodeAt(0) : key;
                } else if (type === "keydown" || type === "keyup") {
                    event.charCode = 0;
                    event.which = event.charCode = utils.isString(key) ? key.toUpperCase().charCodeAt(0) : key;
                } else if (type === "textInput") {
                    if (!utils.isString(key)) {
                        throw new TypeError("non-string passed for textInput");
                    }
                    event.data = key;
                }
                return event;
            },
            getSelection: function($input) {
                var input = $input[0], selectionStart = input.selectionStart, selectionEnd = input.selectionEnd, valueLength, docSelectionRange, selectionRange, endRange, start, end;
                if (utils.isNumber(selectionStart)) {
                    start = selectionStart, end = selectionEnd;
                } else if (input.createTextRange && $input.is(":focus")) {
                    start = end = 0;
                    valueLength = input.value.length;
                    docSelectionRange = document.selection.createRange();
                    selectionRange = input.createTextRange();
                    selectionRange.moveToBookmark(docSelectionRange.getBookmark());
                    while (selectionRange.compareEndPoints("EndToStart", selectionRange)) {
                        selectionRange.moveEnd("character", -1);
                        end++;
                    }
                    selectionRange.setEndPoint("StartToStart", input.createTextRange());
                    while (selectionRange.compareEndPoints("EndToStart", selectionRange)) {
                        selectionRange.moveEnd("character", -1);
                        start++;
                        end++;
                    }
                }
                return {
                    start: start,
                    end: end
                };
            },
            setSelection: function($input, start, end) {
                var input = $input[0], textRange;
                if (input.setSelectionRange) {
                    input.setSelectionRange(start, end);
                } else if (input.createTextRange) {
                    textRange = input.createTextRange();
                    textRange.collapse(true);
                    textRange.moveEnd("character", start);
                    textRange.moveStart("character", end);
                    textRange.select();
                }
            },
            getCursorPos: function($input) {
                return utils.getSelection($input).start;
            },
            setCursorPos: function($input, pos) {
                utils.setSelection($input, pos, pos);
            }
        };
    }();
    var stroke = function() {
        function strokeBuilder() {
            var strokes = {};
            utils.each(stroke.definitions, function(key, definition) {
                strokes[key] = strokeFactory(definition, key);
            });
            return strokes;
        }
        function strokeFactory(definition, name) {
            var Stroke = function(args) {
                if (!(this instanceof Stroke)) {
                    return new Stroke([].slice.call(arguments, 0));
                }
                this.args = args, this.name = name;
            };
            Stroke.repeat = function(times) {
                var strokes = [], stroke = new Stroke();
                while (times--) {
                    strokes.push(stroke);
                }
                return strokes;
            };
            utils.mixin(Stroke.prototype, {
                repeat: function(times) {
                    var strokes = [];
                    while (times--) {
                        strokes.push(this);
                    }
                    return strokes;
                },
                exec: function($input, o) {
                    definition.apply($input, [ o ].concat(this.args));
                }
            });
            return Stroke;
        }
        return {
            builder: strokeBuilder,
            factory: strokeFactory
        };
    }();
    stroke.definitions = {
        character: function(o, char) {
            var selStart = o.selection.start, selEnd = o.selection.end, newVal, newCursorPos;
            if (selStart === selEnd) {
                newVal = o.val.beforeCursor + char + o.val.afterCursor;
                newCursorPos = o.cursorPos + 1;
            } else {
                newVal = o.val.all.slice(0, selStart) + char + o.val.all.slice(selEnd);
                newCursorPos = selStart + 1;
            }
            this.trigger(utils.getKeyEvent("keydown", char)).trigger(utils.getKeyEvent("keypress", char)).trigger(utils.getKeyEvent("textInput", char)).val(newVal);
            utils.setCursorPos(this, newCursorPos);
            this.trigger(utils.getKeyEvent("keyup", char)).trigger(utils.getKeyEvent("input", char));
        },
        backspace: function(o) {
            var keyCode = 8, selStart = o.selection.start, selEnd = o.selection.end, newVal, newCursorPos;
            if (selStart === selEnd) {
                newVal = o.val.beforeCursor.slice(0, -1) + o.val.afterCursor;
                newCursorPos = o.cursorPos === 0 ? 0 : o.cursorPos - 1;
            } else {
                newVal = o.val.all.slice(0, selStart) + o.val.all.slice(selEnd);
                newCursorPos = selStart;
            }
            this.trigger(utils.getKeyEvent("keydown", keyCode)).val(newVal);
            utils.setCursorPos(this, newCursorPos);
            this.trigger(utils.getKeyEvent("keyup", keyCode));
            if (this.val() !== o.val.all) {
                this.trigger(utils.getKeyEvent("input", keyCode));
            }
        },
        right: function(o) {
            var keyCode = 39, selStart = o.selection.start, selEnd = o.selection.end, newCursorPos = selStart === selEnd ? o.cursorPos + 1 : selEnd;
            this.trigger(utils.getKeyEvent("keydown", keyCode));
            utils.setCursorPos(this, newCursorPos);
            this.trigger(utils.getKeyEvent("keyup", keyCode));
        },
        left: function(o) {
            var keyCode = 37, selStart = o.selection.start, selEnd = o.selection.end, newCursorPos = selStart === selEnd ? o.cursorPos - 1 : selStart;
            this.trigger(utils.getKeyEvent("keydown", keyCode));
            utils.setCursorPos(this, newCursorPos);
            this.trigger(utils.getKeyEvent("keyup", keyCode));
        },
        up: function(o) {
            var keyCode = 38;
            this.trigger(utils.getKeyEvent("keydown", keyCode)).trigger(utils.getKeyEvent("keyup", keyCode));
        },
        down: function(o) {
            var keyCode = 40;
            this.trigger(utils.getKeyEvent("keydown", keyCode)).trigger(utils.getKeyEvent("keyup", keyCode));
        },
        enter: function(o) {
            var keyCode = 13;
            this.trigger(utils.getKeyEvent("keydown", keyCode)).trigger(utils.getKeyEvent("keyup", keyCode));
        },
        tab: function(o) {
            var keyCode = 9;
            this.trigger(utils.getKeyEvent("keydown", keyCode)).trigger(utils.getKeyEvent("keyup", keyCode));
        },
        esc: function(o) {
            var keyCode = 27;
            this.trigger(utils.getKeyEvent("keydown", keyCode)).trigger(utils.getKeyEvent("keyup", keyCode));
        },
        selectLeft: function(o) {
            utils.setSelection(this, o.selection.start - 1, o.selection.end);
        },
        selectRight: function(o) {
            utils.setSelection(this, o.selection.start, o.selection.end + 1);
        },
        selectAll: function(o) {
            this.select();
        },
        trigger: function(o, eventType) {
            this.trigger(eventType);
        },
        noop: function() {}
    };
    var Haunt = function() {
        function Haunt(o) {
            this.loop = !!o.loop;
            this.intervalId = null;
            this.interval = o.interval || 300;
            this.$input = $(o.input).first();
            this.originalInputVal = this.$input.val();
            this.story = [];
            this.manuscript = parseManuscript(o.manuscript);
        }
        utils.mixin(Haunt.prototype, {
            start: function(silent) {
                var eventType;
                if (!this.intervalId) {
                    eventType = this.story.length ? "resume" : "start";
                    this.story = this.story.length ? this.story : this.manuscript.slice(0);
                    !silent && this.$input.trigger("ghostwriter:" + eventType).focus();
                    this.intervalId = setInterval(utils.bind(write, this), this.interval);
                }
                return this;
            },
            pause: function(silent) {
                if (this.intervalId) {
                    !silent && this.$input.trigger("ghostwriter:pause");
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                return this;
            },
            stop: function(silent) {
                if (this.intervalId || this.story.length) {
                    !silent && this.$input.trigger("ghostwriter:stop");
                }
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                this.story = [];
                this.reset();
                this.$input.blur();
                return this;
            },
            restart: function() {
                this.stop();
                this.start();
                return this;
            },
            reset: function() {
                this.$input.val(this.originalInputVal);
            }
        });
        function parseManuscript(manuscript) {
            manuscript = utils.isString(manuscript) ? [ manuscript ] : manuscript;
            manuscript = utils.map(manuscript, function(section) {
                if (utils.isString(section)) {
                    return utils.map(section.split(""), function(char) {
                        return exports.character(char);
                    });
                }
                return section;
            });
            return utils.merge(manuscript);
        }
        function write() {
            var next = this.story.shift(), inputVal = this.$input.val(), cursorPos = utils.getCursorPos(this.$input), o = {
                cursorPos: cursorPos,
                selection: utils.getSelection(this.$input),
                val: {
                    all: inputVal,
                    beforeCursor: inputVal.substr(0, cursorPos),
                    afterCursor: inputVal.substr(cursorPos)
                }
            };
            if (typeof next !== "undefined") {
                (utils.isFunction(next) ? next() : next).exec(this.$input, o);
            } else {
                this.$input.trigger("ghostwriter:finish");
                this.loop ? this.restart() : this.pause(true);
            }
        }
        return Haunt;
    }();
    utils.mixin(exports, stroke.builder(), {
        haunt: function(o) {
            return new Haunt(o);
        }
    });
})({}, function() {
    return this;
}());