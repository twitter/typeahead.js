/*
 * Twitter Typeahead
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var TypeaheadView = (function() {
  var html = {
        wrapper: '<span class="twitter-typeahead"></span>',
        hint: '<input class="tt-hint">',
        dropdown: '<div class="tt-dropdown-menu"></div>'
      },

      css = {
        wrapper: [
          'position: relative;',
          'display: inline-block;',
          '*display: inline;',
          '*zoom: 1;'
        ].join(''),

        hint: [
          'position: absolute;',
          'top: 0;',
          'left: 0;',
          'border-color: transparent;',
          '-webkit-box-shadow: none;',
          '-moz-box-shadow: none;',
          'box-shadow: none;'
        ].join(''),

        query: [
          'position: relative;',
          'vertical-align: top;',
          'background-color: transparent;',
          // ie6-8 doesn't fire hover and click events for elements with
          // transparent backgrounds, for a workaround, use 1x1 transparent gif
          'background-image: url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7);',
          // not sure why ie7 won't play nice
          '*margin-top: -1px;'
        ].join(''),

        dropdown: [
          'position: absolute;',
          'top: 100%;',
          'left: 0;',
          // TODO: should this be configurable?
          'z-index: 100;',
          'display: none;'
        ].join('')
      };

  // constructor
  // -----------

  function TypeaheadView(o) {
    utils.bindAll(this);

    this.$node = buildDomStructure(o.input);
    this.datasets = o.datasets;
    this.dir = null;

    // precompile the templates
    utils.each(this.datasets, function(key, dataset) {
      var parentTemplate = '<div class="tt-suggestion">%body</div>';

      if (dataset.template) {
        dataset.template = dataset.engine
        .compile(parentTemplate.replace('%body', dataset.template));
      }

      // if no template is provided, render suggestion
      // as it's value wrapped in a p tag
      else {
        dataset.template = {
          render: function(context) {
            return parentTemplate
            .replace('%body', '<p>' + context.value + '</p>');
          }
        };
      }
    });

    this.inputView = new InputView({
      input: this.$node.find('.tt-query'),
      hint: this.$node.find('.tt-hint')
    });

    this.dropdownView = new DropdownView({
      menu: this.$node.find('.tt-dropdown-menu')
    });

    this.dropdownView
    .on('select', this._handleSelection)
    .on('cursorOn', this._clearHint)
    .on('cursorOn', this._setInputValueToSuggestionUnderCursor)
    .on('cursorOff', this._setInputValueToQuery)
    .on('cursorOff', this._updateHint)
    .on('suggestionsRender', this._updateHint)
    .on('show', this._updateHint)
    .on('hide', this._clearHint);

    this.inputView
    .on('focus', this._showDropdown)
    .on('blur', this._hideDropdown)
    .on('blur', this._setInputValueToQuery)
    .on('enter', this._handleSelection)
    .on('queryChange', this._clearHint)
    .on('queryChange', this._clearSuggestions)
    .on('queryChange', this._getSuggestions)
    .on('whitespaceChange', this._updateHint)
    .on('queryChange whitespaceChange', this._showDropdown)
    .on('queryChange whitespaceChange', this._setLanguageDirection)
    .on('esc', this._hideDropdown)
    .on('esc', this._setInputValueToQuery)
    .on('up down', this._moveDropdownCursor)
    .on('up down', this._showDropdown)
    .on('tab', this._setPreventDefaultValueForTab)
    .on('tab left right', this._autocomplete);
  }

  utils.mixin(TypeaheadView.prototype, EventTarget, {
    // private methods
    // ---------------

    _setPreventDefaultValueForTab: function(e) {
      var hint = this.inputView.getHintValue(),
          inputValue = this.inputView.getInputValue(),
          preventDefault = hint && hint !== inputValue;

      // if the user tabs to autocomplete while the menu is open
      // this will prevent the focus from being lost from the query input
      this.inputView.setPreventDefaultValueForKey('9', preventDefault);
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
      var dataForFirstSuggestion = this.dropdownView.getFirstSuggestion(),
          hint = dataForFirstSuggestion ? dataForFirstSuggestion.value : null,
          inputValue,
          query,
          beginsWithQuery,
          match;

      if (hint && this.dropdownView.isVisible()) {
        inputValue = this.inputView.getInputValue();
        query = inputValue
        .replace(/\s{2,}/g, ' ') // condense whitespace
        .replace(/^\s+/g, ''); // strip leading whitespace

        beginsWithQuery = new RegExp('^(?:' + query + ')(.*$)', 'i');
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
      this.inputView.setInputValue(e.data.value, true);
    },

    _showDropdown: function() {
      this.dropdownView.show();
    },

    _hideDropdown: function(e) {
      this.dropdownView[e.type === 'blur' ?
        'hideUnlessMouseIsOverDropdown' : 'hide']();
    },

    _moveDropdownCursor: function(e) {
      this.dropdownView[e.type === 'up' ? 'moveCursorUp' : 'moveCursorDown']();
    },

    _handleSelection: function(e) {
      var byClick = e.type === 'select',
          suggestionData = byClick ?
            e.data : this.dropdownView.getSuggestionUnderCursor();

      if (suggestionData) {
        this.inputView.setInputValue(suggestionData.value);

        // if triggered by click, ensure the query input still has focus
        // if trigged by keypress, prevent default browser behavior
        // which is most likely the submisison of a form
        // note: e.data is the jquery event
        byClick ? this.inputView.focus() : e.data.preventDefault();

        // focus is not a synchronous event in ie, so we deal with it
        byClick && utils.isMsie() ?
          setTimeout(this.dropdownView.hide, 0) : this.dropdownView.hide();
      }
    },

    _getSuggestions: function() {
      var that = this,
          query = this.inputView.getQuery();

      utils.each(this.datasets, function(i, dataset) {
        dataset.getSuggestions(query, function(suggestions) {
          that._renderSuggestions(query, dataset, suggestions);
        });
      });
    },

    _renderSuggestions: function(query, dataset, suggestions) {
      if (query !== this.inputView.getQuery()) { return; }

      suggestions = suggestions.slice(0, dataset.limit);
      this.dropdownView.renderSuggestions(query, dataset, suggestions);
    },

    _autocomplete: function(e) {
      var isCursorAtEnd, ignoreEvent, query, hint;

      if (e.type === 'right' || e.type === 'left') {
        isCursorAtEnd = this.inputView.isCursorAtEnd();
        ignoreEvent = this.inputView.getLanguageDirection() === 'ltr' ?
          e.type === 'left' : e.type === 'right';

        if (!isCursorAtEnd || ignoreEvent) { return; }
      }

      query = this.inputView.getQuery();
      hint = this.inputView.getHintValue();

      if (hint !== '' && query !== hint) {
        this.inputView.setInputValue(hint);
      }
    }
  });

  return TypeaheadView;

  function buildDomStructure(input) {
    var $wrapper = $(html.wrapper),
        $dropdown = $(html.dropdown),
        $input = $(input),
        $hint = $(html.hint);

    $wrapper = $wrapper.attr('style', css.wrapper);
    $dropdown = $dropdown.attr('style', css.dropdown);

    $hint
    .attr({
      style: css.hint,
      type: 'text',
      autocomplete: false,
      spellcheck: false,
      disabled: true
    })
    .css('background-color', $input.css('background-color'));

    $input
    .addClass('tt-query')
    .attr({ style: css.query, autocomplete: false, spellcheck: false });

    // ie7 does not like it when dir is set to auto,
    // it does not like it one bit
    try { !$input.attr('dir') && $input.attr('dir', 'auto'); } catch (e) {}

    return $input
    .wrap($wrapper)
    .parent()
    .prepend($hint)
    .append($dropdown);
  }
})();
