/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Input = (function() {
  var specialKeyCodeMap;

  specialKeyCodeMap = {
    9: 'tab',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  // constructor
  // -----------

  function Input(o) {
    var that = this, onBlur, onFocus, onKeydown, onInput;

    o = o || {};

    if (!o.input) {
      $.error('input is missing');
    }

    this.triggerRegex = o.triggerRegex;
    this.triggerCharacter = o.triggerCharacter;
    this.hasTrigger = !!(this.triggerRegex && this.triggerCharacter);

    // bound functions
    onBlur = _.bind(this._onBlur, this);
    onFocus = _.bind(this._onFocus, this);
    onKeydown = _.bind(this._onKeydown, this);
    onInput = _.bind(this._onInput, this);

    this.$hint = $(o.hint);
    this.$input = $(o.input)
    .on('blur.tt', onBlur)
    .on('focus.tt', onFocus)
    .on('keydown.tt', onKeydown);

    // if no hint, noop all the hint related functions
    if (this.$hint.length === 0) {
      this.setHint =
      this.getHint =
      this.clearHint =
      this.clearHintIfInvalid = _.noop;
    }

    // ie7 and ie8 don't support the input event
    // ie9 doesn't fire the input event when characters are removed
    // not sure if ie10 is compatible
    if (!_.isMsie()) {
      this.$input.on('input.tt', onInput);
    }

    else {
      this.$input.on('keydown.tt keypress.tt cut.tt paste.tt', function($e) {
        // if a special key triggered this, ignore it
        if (specialKeyCodeMap[$e.which || $e.keyCode]) { return; }

        // give the browser a chance to update the value of the input
        // before checking to see if the query changed
        _.defer(_.bind(that._onInput, that, $e));
      });
    }

    // the query defaults to whatever the value of the input is
    // on initialization, it'll most likely be an empty string
    this.query = this.$input.val();

    // helps with calculating the width of the input's value
    this.$overflowHelper = buildOverflowHelper(this.$input);
  }

  // static methods
  // --------------

  Input.normalizeQuery = function(str) {
    // strips leading whitespace and condenses all whitespace
    return (str || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
  };

  // instance methods
  // ----------------

  _.mixin(Input.prototype, EventEmitter, {

    // ### private

    _onBlur: function onBlur() {
      this.resetInputValue();
      this.trigger('blurred');
    },

    _onFocus: function onFocus() {
      this.trigger('focused');
    },

    _onKeydown: function onKeydown($e) {
      // which is normalized and consistent (but not for ie)
      var keyName = specialKeyCodeMap[$e.which || $e.keyCode];

      this._managePreventDefault(keyName, $e);
      if (keyName && this._shouldTrigger(keyName, $e)) {
        this.trigger(keyName + 'Keyed', $e);
        // Left and right keys can change the query if
        // it is using a triggerCharacter
        if (keyName === 'left' || keyName === 'right') {
          _.defer(_.bind(this._onInput, this));
        }
      }
    },

    _onInput: function onInput() {
      this._checkInputValue();
    },

    _managePreventDefault: function managePreventDefault(keyName, $e) {
      var preventDefault, hintValue, inputValue;

      switch (keyName) {
        case 'tab':
          hintValue = this.getHint();
          inputValue = this.getInputValue();

          preventDefault = hintValue &&
            hintValue !== inputValue &&
            !withModifier($e);
          break;

        case 'up':
        case 'down':
          preventDefault = !withModifier($e);
          break;

        default:
          preventDefault = false;
      }

      preventDefault && $e.preventDefault();
    },

    _shouldTrigger: function shouldTrigger(keyName, $e) {
      var trigger;

      switch (keyName) {
        case 'tab':
          trigger = !withModifier($e);
          break;

        default:
          trigger = true;
      }

      return trigger;
    },

    _checkInputValue: function checkInputValue() {
      var inputValue, parsedInputValue, areEquivalent, hasDifferentWhitespace;

      inputValue = this.getInputValue();
      parsedInputValue = this._parseInputForTrigger();

      if (this.hasTrigger) {
        inputValue = parsedInputValue ? parsedInputValue.completion : '';
      }

      areEquivalent = areQueriesEquivalent(inputValue, this.query);
      hasDifferentWhitespace = areEquivalent ?
        this.query.length !== inputValue.length : false;

      if (!areEquivalent) {
        this.trigger('queryChanged', this.query = inputValue);
      }

      else if (hasDifferentWhitespace) {
        this.trigger('whitespaceChanged', this.query);
      }
    },

    _findTriggerPosition: function findTriggerPosition() {
      var inputValue, cursorPosition, index, charBeforeTrigger, substr, match;

      inputValue = this.getInputValue();
      cursorPosition = this._getCursorPosition();
      index = inputValue.lastIndexOf(this.triggerCharacter, cursorPosition);

      if (index === -1) {
        return -1;
      }

      // Should precede with a space
      charBeforeTrigger = inputValue.charAt(index - 1);
      if (charBeforeTrigger && charBeforeTrigger !== ' ') {
        return -1;
      }

      substr = inputValue.substring(index, cursorPosition);
      match = substr.match(this.triggerRegex);

      if (!match) {
        return -1;
      }

      if (substr.length > match[0].length) {
        return -1;
      }

      return index;
    },

    _parseInputForTrigger: function parseInputForTrigger() {
      var triggerIndex, cursorPosition, inputValue, afterTrigger, match;

      if (!this.hasTrigger) {
        return null;
      }

      inputValue = this.getInputValue();
      triggerIndex = this._findTriggerPosition();
      afterTrigger = inputValue.substring(triggerIndex);
      match = afterTrigger.match(this.triggerRegex);

      if (triggerIndex === -1 || !match) {
        return null;
      } else {
        return {
          pre: inputValue.substring(0, triggerIndex),
          trigger: this.triggerCharacter,
          completion: match[0].substring(this.triggerCharacter.length),
          post: inputValue.substring(triggerIndex + match[0].length)
        };
      }
    },

    _getCursorPosition: function getCursorPosition() {
      return this.$input[0].selectionStart;
    },

    // ### public

    focus: function focus() {
      this.$input.focus();
    },

    blur: function blur() {
      this.$input.blur();
    },

    getQuery: function getQuery() {
      return this.query;
    },

    setQuery: function setQuery(query) {
      this.query = query;
    },

    getInputValue: function getInputValue() {
      return this.$input.val();
    },

    setInputValue: function setInputValue(value, silent) {
      var inputValue, newCursorPosition, hint;

      inputValue = this._parseInputForTrigger();

      if (inputValue) {
        newCursorPosition = (inputValue.pre + inputValue.trigger + value).length;
        value = inputValue.pre + inputValue.trigger + value + inputValue.post;
      }

      this.$input.val(value);

      if (newCursorPosition) {
        this.setCursorPosition(newCursorPosition);
      }

      // silent prevents any additional events from being triggered
      silent ? this.clearHint() : this._checkInputValue();
    },

    setCursorPosition: function setCursorPosition(pos) {
      var input, range;

      input = this.$input[0];

      if (input.setSelectionRange) {
        input.setSelectionRange(pos, pos);
      }

      else if (input.createTextRange) {
        range = input.createTextRange();
        range.collapse(true);
        if (pos < 0) {
          pos = this.getInputValue().length + pos;
        }
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }
    },

    resetInputValue: function resetInputValue() {
      !this.hasTrigger && this.setInputValue(this.query, true);
    },

    getHint: function getHint() {
      return this.$hint.val();
    },

    setHint: function setHint(value) {
      this.$hint.val(value);
    },

    clearHint: function clearHint() {
      this.setHint('');
    },

    clearHintIfInvalid: function clearHintIfInvalid() {
      var val, hint, valIsPrefixOfHint, isValid;

      val = this.getInputValue();
      hint = this.getHint();
      valIsPrefixOfHint = val !== hint && hint.indexOf(val) === 0;
      isValid = val !== '' && valIsPrefixOfHint && !this.hasOverflow();

      !isValid && this.clearHint();
    },

    getLanguageDirection: function getLanguageDirection() {
      return (this.$input.css('direction') || 'ltr').toLowerCase();
    },

    hasOverflow: function hasOverflow() {
      // 2 is arbitrary, just picking a small number to handle edge cases
      var constraint = this.$input.width() - 2;

      this.$overflowHelper.text(this.getInputValue());

      return this.$overflowHelper.width() >= constraint;
    },

    isCursorAtEnd: function() {
      var valueLength, selectionStart, range;

      valueLength = this.$input.val().length;
      selectionStart = this.$input[0].selectionStart;

      if (_.isNumber(selectionStart)) {
       return selectionStart === valueLength;
      }

      else if (document.selection) {
        // NOTE: this won't work unless the input has focus, the good news
        // is this code should only get called when the input has focus
        range = document.selection.createRange();
        range.moveStart('character', -valueLength);

        return valueLength === range.text.length;
      }

      return true;
    },

    destroy: function destroy() {
      this.$hint.off('.tt');
      this.$input.off('.tt');

      this.$hint = this.$input = this.$overflowHelper = null;
    }
  });

  return Input;

  // helper functions
  // ----------------

  function buildOverflowHelper($input) {
    return $('<pre aria-hidden="true"></pre>')
    .css({
      // position helper off-screen
      position: 'absolute',
      visibility: 'hidden',
      // avoid line breaks and whitespace collapsing
      whiteSpace: 'pre',
      // use same font css as input to calculate accurate width
      fontFamily: $input.css('font-family'),
      fontSize: $input.css('font-size'),
      fontStyle: $input.css('font-style'),
      fontVariant: $input.css('font-variant'),
      fontWeight: $input.css('font-weight'),
      wordSpacing: $input.css('word-spacing'),
      letterSpacing: $input.css('letter-spacing'),
      textIndent: $input.css('text-indent'),
      textRendering: $input.css('text-rendering'),
      textTransform: $input.css('text-transform')
    })
    .insertAfter($input);
  }

  function areQueriesEquivalent(a, b) {
    return Input.normalizeQuery(a) === Input.normalizeQuery(b);
  }

  function withModifier($e) {
    return $e.altKey || $e.ctrlKey || $e.metaKey || $e.shiftKey;
  }
})();
