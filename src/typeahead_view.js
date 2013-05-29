/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var TypeaheadView = (function() {
  var html = {
        wrapper: '<span class="twitter-typeahead"></span>',
        hint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="off" disabled>',
        dropdown: '<span class="tt-dropdown-menu"></span>'
      },
      css = {
        wrapper: {
          position: 'relative',
          display: 'inline-block'
        },
        hint: {
          position: 'absolute',
          top: '0',
          left: '0',
          borderColor: 'transparent',
          boxShadow: 'none'
        },
        query: {
          position: 'relative',
          verticalAlign: 'top',
          backgroundColor: 'transparent'
        },
        dropdown: {
          position: 'absolute',
          top: '100%',
          left: '0',
          // TODO: should this be configurable?
          zIndex: '100',
          display: 'none'
        }
      };

  // ie specific styling
  if (utils.isMsie()) {
     // ie6-8 (and 9?) doesn't fire hover and click events for elements with
     // transparent backgrounds, for a workaround, use 1x1 transparent gif
    utils.mixin(css.query, {
      backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)'
    });
  }

  // ie7 and under specific styling
  if (utils.isMsie() && utils.isMsie() <= 7) {
    utils.mixin(css.wrapper, { display: 'inline', zoom: '1' });
    // if someone can tell me why this is necessary to align
    // the hint with the query in ie7, i'll send you $5 - @JakeHarding
    utils.mixin(css.query, { marginTop: '-1px' });
  }

  // constructor
  // -----------

  function TypeaheadView(o) {
    var $menu, $input, $hint;

    utils.bindAll(this);

    this.$node = buildDomStructure(o.input);
    this.datasets = o.datasets;
    this.dir = null;

    this.eventBus = o.eventBus;

    $menu = this.$node.find('.tt-dropdown-menu');
    $input = this.$node.find('.tt-query');
    $hint = this.$node.find('.tt-hint');

    this.dropdownView = new DropdownView({ menu: $menu })
    .on('suggestionSelected', this._handleSelection)
    .on('cursorMoved', this._clearHint)
    .on('cursorMoved', this._setInputValueToSuggestionUnderCursor)
    .on('cursorRemoved', this._setInputValueToQuery)
    .on('cursorRemoved', this._updateHint)
    .on('suggestionsRendered', this._updateHint)
    .on('opened', this._updateHint)
    .on('closed', this._clearHint)
    .on('opened closed', this._propagateEvent);

    this.inputView = new InputView({ input: $input, hint: $hint })
    .on('focused', this._openDropdown)
    .on('blured', this._closeDropdown)
    .on('blured', this._setInputValueToQuery)
    .on('enterKeyed tabKeyed', this._handleSelection)
    .on('queryChanged', this._clearHint)
    .on('queryChanged', this._clearSuggestions)
    .on('queryChanged', this._getSuggestions)
    .on('whitespaceChanged', this._updateHint)
    .on('queryChanged whitespaceChanged', this._openDropdown)
    .on('queryChanged whitespaceChanged', this._setLanguageDirection)
    .on('escKeyed', this._closeDropdown)
    .on('escKeyed', this._setInputValueToQuery)
    .on('tabKeyed upKeyed downKeyed', this._managePreventDefault)
    .on('upKeyed downKeyed', this._moveDropdownCursor)
    .on('upKeyed downKeyed', this._openDropdown)
    .on('tabKeyed leftKeyed rightKeyed', this._autocomplete);
  }

  utils.mixin(TypeaheadView.prototype, EventTarget, {
    // private methods
    // ---------------

    _managePreventDefault: function(e) {
      var $e = e.data,
          hint,
          inputValue,
          preventDefault = false;

      switch (e.type) {
        case 'tabKeyed':
          hint = this.inputView.getHintValue();
          inputValue = this.inputView.getInputValue();
          preventDefault = hint && hint !== inputValue;
          break;

        case 'upKeyed':
        case 'downKeyed':
          preventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
          break;
      }

      preventDefault && $e.preventDefault();
    },

    _setLanguageDirection: function() {
      var dir = this.inputView.getLanguageDirection();

      if (dir !== this.dir) {
        this.dir = dir;
        this.$node.css('direction', dir);
        this.dropdownView.setLanguageDirection(dir);
      }
    },

    _updateHint: function() {
      var suggestion = this.dropdownView.getFirstSuggestion(),
          hint = suggestion ? suggestion.value : null,
          dropdownIsVisible = this.dropdownView.isVisible(),
          inputHasOverflow = this.inputView.isOverflow(),
          inputValue,
          query,
          escapedQuery,
          beginsWithQuery,
          match;

      if (hint && dropdownIsVisible && !inputHasOverflow) {
        inputValue = this.inputView.getInputValue();
        query = inputValue
        .replace(/\s{2,}/g, ' ') // condense whitespace
        .replace(/^\s+/g, ''); // strip leading whitespace
        escapedQuery = utils.escapeRegExChars(query);

        beginsWithQuery = new RegExp('^(?:' + escapedQuery + ')(.*$)', 'i');
        match = beginsWithQuery.exec(hint);

        this.inputView.setHintValue(inputValue + (match ? match[1] : ''));
      }
    },

    _clearHint: function() {
      this.inputView.setHintValue('');
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

    _openDropdown: function() {
      this.dropdownView.open();
    },

    _closeDropdown: function(e) {
      this.dropdownView[e.type === 'blured' ?
        'closeUnlessMouseIsOverDropdown' : 'close']();
    },

    _moveDropdownCursor: function(e) {
      var $e = e.data;

      if (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
        this.dropdownView[e.type === 'upKeyed' ?
          'moveCursorUp' : 'moveCursorDown']();
      }
    },

    _handleSelection: function(e) {
      var byClick = e.type === 'suggestionSelected',
          suggestion = byClick ?
            e.data : this.dropdownView.getSuggestionUnderCursor();

      if (suggestion) {
        this.inputView.setInputValue(suggestion.value);

        // if triggered by click, ensure the query input still has focus
        // if triggered by keypress, prevent default browser behavior
        // which is most likely the submission of a form
        // note: e.data is the jquery event
        byClick ? this.inputView.focus() : e.data.preventDefault();

        // focus is not a synchronous event in ie, so we deal with it
        byClick && utils.isMsie() ?
          utils.defer(this.dropdownView.close) : this.dropdownView.close();

        this.eventBus.trigger('selected', suggestion.datum, suggestion.dataset);
      }
    },

    _getSuggestions: function() {
      var that = this, query = this.inputView.getQuery();

      if (utils.isBlankString(query)) { return; }

      utils.each(this.datasets, function(i, dataset) {
        dataset.getSuggestions(query, function(suggestions) {
          // only render the suggestions if the query hasn't changed
          if (query === that.inputView.getQuery()) {
            that.dropdownView.renderSuggestions(dataset, suggestions);
          }
        });
      });
    },

    _autocomplete: function(e) {
      var isCursorAtEnd, ignoreEvent, query, hint, suggestion;

      if (e.type === 'rightKeyed' || e.type === 'leftKeyed') {
        isCursorAtEnd = this.inputView.isCursorAtEnd();
        ignoreEvent = this.inputView.getLanguageDirection() === 'ltr' ?
          e.type === 'leftKeyed' : e.type === 'rightKeyed';

        if (!isCursorAtEnd || ignoreEvent) { return; }
      }

      query = this.inputView.getQuery();
      hint = this.inputView.getHintValue();

      if (hint !== '' && query !== hint) {
        suggestion = this.dropdownView.getFirstSuggestion();
        this.inputView.setInputValue(suggestion.value);

        this.eventBus.trigger(
          'autocompleted',
          suggestion.datum,
          suggestion.dataset
        );
      }
    },

    _propagateEvent: function(e) {
      this.eventBus.trigger(e.type);
    },

    // public methods
    // --------------

    destroy: function() {
      this.inputView.destroy();
      this.dropdownView.destroy();

      destroyDomStructure(this.$node);

      this.$node = null;
    },

    setQuery: function(query) {
      this.inputView.setQuery(query);
      this.inputView.setInputValue(query);

      this._clearHint();
      this._clearSuggestions();
      this._getSuggestions();
    }
  });

  return TypeaheadView;

  function buildDomStructure(input) {
    var $wrapper = $(html.wrapper),
        $dropdown = $(html.dropdown),
        $input = $(input),
        $hint = $(html.hint);

    $wrapper = $wrapper.css(css.wrapper);
    $dropdown = $dropdown.css(css.dropdown);

    $hint
    .css(css.hint)
    // copy background styles from query input to hint input
    .css({
      backgroundAttachment: $input.css('background-attachment'),
      backgroundClip: $input.css('background-clip'),
      backgroundColor: $input.css('background-color'),
      backgroundImage: $input.css('background-image'),
      backgroundOrigin: $input.css('background-origin'),
      backgroundPosition: $input.css('background-position'),
      backgroundRepeat: $input.css('background-repeat'),
      backgroundSize: $input.css('background-size')
    });

    // store the original values of the attrs that get modified
    // so modifications can be reverted on destroy
    $input.data('ttAttrs', {
      dir: $input.attr('dir'),
      autocomplete: $input.attr('autocomplete'),
      spellcheck: $input.attr('spellcheck'),
      style: $input.attr('style')
    });

    $input
    .addClass('tt-query')
    .attr({ autocomplete: 'off', spellcheck: false })
    .css(css.query);

    // ie7 does not like it when dir is set to auto,
    // it does not like it one bit
    try { !$input.attr('dir') && $input.attr('dir', 'auto'); } catch (e) {}

    return $input
    .wrap($wrapper)
    .parent()
    .prepend($hint)
    .append($dropdown);
  }

  function destroyDomStructure($node) {
    var $input = $node.find('.tt-query');

    // need to remove attrs that weren't previously defined and
    // revert attrs that originally had a value
    utils.each($input.data('ttAttrs'), function(key, val) {
      utils.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
    });

    $input
    .detach()
    .removeData('ttAttrs')
    .removeClass('tt-query')
    .insertAfter($node);

    $node.remove();
  }
})();
