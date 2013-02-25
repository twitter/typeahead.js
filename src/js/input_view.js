/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var InputView = (function() {

  // constructor
  // -----------

  function InputView(o) {
    var that = this;

    utils.bindAll(this);

    this.specialKeyCodeMap = {
      9: 'tab',
      27: 'esc',
      37: 'left',
      39: 'right',
      13: 'enter',
      38: 'up',
      40: 'down'
    };

    this.query = '';

    this.$hint = $(o.hint);
    this.$input = $(o.input)
    .on('blur', this._handleBlur)
    .on('focus', this._handleFocus)
    .on('keydown', this._handleSpecialKeyEvent);

    // ie7 and ie8 don't support the input event
    // ie9 doesn't fire the input event when characters are removed
    // not sure if ie10 is compatible
    if (!utils.isMsie()) {
      this.$input.on('input', this._compareQueryToInputValue);
    }

    else {
      this.$input
      .on('keydown keypress cut paste', function(e) {
        // if a special key triggered this, ignore it
        if (that.specialKeyCodeMap[e.which || e.keyCode]) { return; }

        // give the browser a chance to update the value of the input
        // before checking to see if the query changed
        setTimeout(that._compareQueryToInputValue, 0);
      });
    }

    // helps with calculating the width of the input's value
    this.$overflowHelper = buildOverflowHelper(this.$input);
  }

  utils.mixin(InputView.prototype, EventTarget, {
    // private methods
    // ---------------

    _handleFocus: function() {
      this.trigger('focus');
    },

    _handleBlur: function() {
      this.trigger('blur');
    },

    _handleSpecialKeyEvent: function($e) {
      // which is normalized and consistent (but not for IE)
      var keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];

      keyName && this.trigger(keyName, $e);
    },

    _compareQueryToInputValue: function() {
      var inputValue = this.getInputValue(),
          isSameQuery = compareQueries(this.query, inputValue),
          isSameQueryExceptWhitespace = isSameQuery ?
            this.query.length !== inputValue.length : false;

      if (isSameQueryExceptWhitespace) {
        this.trigger('whitespaceChange', { value: this.query });
      }

      else if (!isSameQuery) {
        this.trigger('queryChange', { value: this.query = inputValue });
      }
    },

    // public methods
    // --------------

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

      // strict equal to support function(value) signature
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
      return (this.$input.css('direction') || 'ltr').toLowerCase();
    },

    isOverflow: function() {
      this.$overflowHelper.text(this.getInputValue());

      return this.$overflowHelper.width() > this.$input.width();
    },

    isCursorAtEnd: function() {
      var valueLength = this.$input.val().length,
          selectionStart = this.$input[0].selectionStart,
          range;

      if (utils.isNumber(selectionStart)) {
       return selectionStart === valueLength;
      }

      else if (document.selection) {
        // this won't work unless the input has focus, the good news
        // is this code should only get called when the input has focus
        range = document.selection.createRange();
        range.moveStart('character', -valueLength);

        return valueLength === range.text.length;
      }

      return true;
    }
  });

  return InputView;

  function buildOverflowHelper($input) {
    return $('<span></span>')
    .css({
      // position helper off-screen
      position: 'absolute',
      left: '-9999px',
      visibility: 'hidden',
      // avoid line breaks
      whiteSpace: 'nowrap',
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

  function compareQueries(a, b) {
    // strips leading whitespace and condenses all whitespace
    a = (a || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ').toLowerCase();
    b = (b || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ').toLowerCase();

    return a === b;
  }
})();
