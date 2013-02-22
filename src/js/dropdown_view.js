/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var DropdownView = (function() {

  // constructor
  // -----------

  function DropdownView(o) {
    utils.bindAll(this);

    this.isMouseOverDropdown;

    this.$menu = $(o.menu)
    .on('mouseenter', this._handleMouseenter)
    .on('mouseleave', this._handleMouseleave)
    .on('mouseover', '.tt-suggestions > .tt-suggestion', this._handleMouseover)
    .on('click', '.tt-suggestions > .tt-suggestion', this._handleSelection);
  }

  utils.mixin(DropdownView.prototype, EventTarget, {
    // private methods
    // ---------------

    _handleMouseenter: function() {
      this.isMouseOverDropdown = true;
    },

    _handleMouseleave: function() {
      this.isMouseOverDropdown = false;
    },

    _handleMouseover: function($e) {
      this._getSuggestions().removeClass('tt-is-under-cursor');
      $($e.currentTarget).addClass('tt-is-under-cursor');
    },

    _handleSelection: function($e) {
      this.trigger('select', formatDataForSuggestion($($e.currentTarget)));
    },

    _moveCursor: function(increment) {
      var $suggestions, $cur, nextIndex, $underCursor;

      // don't bother moving the cursor if the menu is hidden
      if (!this.$menu.hasClass('tt-is-open')) {
        return;
      }

      $suggestions = this._getSuggestions();
      $cur = $suggestions.filter('.tt-is-under-cursor');

      $cur.removeClass('tt-is-under-cursor');

      // shifting before and after modulo to deal with -1 index of search input
      nextIndex = $suggestions.index($cur) + increment;
      nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;

      if (nextIndex === -1) {
        this.trigger('cursorOff');

        return;
      }

      else if (nextIndex < -1) {
        // circle to last suggestion
        nextIndex = $suggestions.length - 1;
      }

      $underCursor = $suggestions.eq(nextIndex).addClass('tt-is-under-cursor');
      this.trigger('cursorOn', { value: $underCursor.data('value') });
    },

    _getSuggestions: function() {
      return this.$menu.find('.tt-suggestions > .tt-suggestion');
    },

    // public methods
    // --------------

    hideUnlessMouseIsOverDropdown: function() {
      // this helps detect the scenario a blur event has triggered
      // this function. we don't want to hide the menu in that case
      // because it'll prevent the probable associated click event
      // from being fired
      if (!this.isMouseOverDropdown) {
        this.hide();
      }
    },

    hide: function() {
      if (this.$menu.hasClass('tt-is-open')) {
        this.$menu
        .removeClass('tt-is-open')
        .find('.tt-suggestions > .tt-suggestion')
        .removeClass('tt-is-under-cursor');

        this.trigger('hide');
      }
    },

    show: function() {
      if (!this.$menu.hasClass('tt-is-open')) {
        this.$menu.addClass('tt-is-open');

        this.trigger('show');
      }
    },

    isOpen: function() {
      return this.$menu.hasClass('tt-is-open');
    },

    moveCursorUp: function() {
      this._moveCursor(-1);
    },

    moveCursorDown: function() {
      this._moveCursor(+1);
    },

    getSuggestionUnderCursor: function() {
      var $suggestion = this._getSuggestions()
          .filter('.tt-is-under-cursor')
          .first();

      return $suggestion.length > 0 ?
        formatDataForSuggestion($suggestion) : null;
    },

    getFirstSuggestion: function() {
      var $suggestion = this._getSuggestions().first();

      return $suggestion.length > 0 ?
        formatDataForSuggestion($suggestion) : null;
    },

    renderSuggestions: function(query, dataset, suggestions) {
      var datasetClassName = 'tt-dataset-' + dataset.name,
          $dataset = this.$menu.find('.' + datasetClassName),
          elBuilder,
          fragment,
          el;

      // first time rendering suggestions for this dataset
      if ($dataset.length === 0) {
        $dataset = $('<li><ol class="tt-suggestions"></ol></li>')
        .addClass(datasetClassName)
        .appendTo(this.$menu);
      }

      elBuilder = document.createElement('div');
      fragment = document.createDocumentFragment();

      this.clearSuggestions(dataset.name);

      if (suggestions.length > 0) {
        this.$menu.removeClass('tt-is-empty');

        utils.each(suggestions, function(i, suggestion) {
          elBuilder.innerHTML = dataset.template.render(suggestion);

          el = elBuilder.firstChild;
          el.setAttribute('data-value', suggestion.value);

          fragment.appendChild(el);
        });
      }

      $dataset.find('> .tt-suggestions')
      .data({ query: query, dataset: dataset.name })
      .append(fragment);

      this.trigger('suggestionsRender');
    },

    clearSuggestions: function(datasetName) {
      var $suggestions = datasetName ?
          this.$menu.find('.tt-dataset-' + datasetName + ' .tt-suggestions') :
          this.$menu.find('.tt-suggestions');

      $suggestions.empty();

      // add empty class if the dropdown menu is empty
      this._getSuggestions().length === 0 && this.$menu.addClass('tt-is-empty');
    }
  });

  return DropdownView;

  function formatDataForSuggestion($suggestion) {
    var $suggestions = $suggestion.parents('.tt-suggestions').first();

    return {
      value: $suggestion.data('value'),
      query: $suggestions.data('query'),
      dataset: $suggestions.data('dataset')
    };
  }
})();
