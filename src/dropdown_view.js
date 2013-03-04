/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var DropdownView = (function() {
  var html = {
        suggestionsList: '<span class="tt-suggestions"></span>'
      },
      css = {
        suggestionsList: { display: 'block' },
        suggestion: { whiteSpace: 'nowrap', cursor: 'pointer' },
        suggestionChild: { whiteSpace: 'normal' }
      };

  // constructor
  // -----------

  function DropdownView(o) {
    utils.bindAll(this);

    this.isOpen = false;
    this.isEmpty = true;
    this.isMouseOverDropdown = false;

    this.$menu = $(o.menu)
    .on('mouseenter.tt', this._handleMouseenter)
    .on('mouseleave.tt', this._handleMouseleave)
    .on('click.tt', '.tt-suggestion', this._handleSelection)
    .on('mouseover.tt', '.tt-suggestion', this._handleMouseover);
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
      var $suggestion = $($e.currentTarget);

      this._getSuggestions().removeClass('tt-is-under-cursor');
      $suggestion.addClass('tt-is-under-cursor');
    },

    _handleSelection: function($e) {
      var $suggestion = $($e.currentTarget);
      this.trigger('suggestionSelected', formatDataForSuggestion($suggestion));
    },

    _show: function() {
      // can't use jQuery#show because $menu is a span element we want
      // display: block; not dislay: inline;
      this.$menu.css('display', 'block');
    },

    _hide: function() {
      this.$menu.hide();
    },

    _moveCursor: function(increment) {
      var $suggestions, $cur, nextIndex, $underCursor;

      // don't bother moving the cursor if the menu is closed or empty
      if (!this.isVisible()) {
        return;
      }

      $suggestions = this._getSuggestions();
      $cur = $suggestions.filter('.tt-is-under-cursor');

      $cur.removeClass('tt-is-under-cursor');

      // shifting before and after modulo to deal with -1 index of search input
      nextIndex = $suggestions.index($cur) + increment;
      nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;

      if (nextIndex === -1) {
        this.trigger('cursorRemoved');

        return;
      }

      else if (nextIndex < -1) {
        // circle to last suggestion
        nextIndex = $suggestions.length - 1;
      }

      $underCursor = $suggestions.eq(nextIndex).addClass('tt-is-under-cursor');
      this.trigger('cursorMoved', { value: $underCursor.data('value') });
    },

    _getSuggestions: function() {
      return this.$menu.find('.tt-suggestions > .tt-suggestion');
    },

    // public methods
    // --------------

    destroy: function() {
      this.$menu.off('.tt');

      this.$menu = null;
    },

    isVisible: function() {
      return this.isOpen && !this.isEmpty;
    },

    closeUnlessMouseIsOverDropdown: function() {
      // this helps detect the scenario a blur event has triggered
      // this function. we don't want to close the menu in that case
      // because it'll prevent the probable associated click event
      // from being fired
      if (!this.isMouseOverDropdown) {
        this.close();
      }
    },

    close: function() {
      if (this.isOpen) {
        this.isOpen = false;
        this._hide();

        this.$menu
        .find('.tt-suggestions > .tt-suggestion')
        .removeClass('tt-is-under-cursor');

        this.trigger('closed');
      }
    },

    open: function() {
      if (!this.isOpen) {
        this.isOpen = true;
        !this.isEmpty && this._show();

        this.trigger('opened');
      }
    },

    setLanguageDirection: function(dir) {
      var ltrCss = { left: '0', right: 'auto' },
          rtlCss = { left: 'auto', right:' 0' };

      dir === 'ltr' ? this.$menu.css(ltrCss) : this.$menu.css(rtlCss);
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
          $suggestionsList,
          $dataset = this.$menu.find('.' + datasetClassName),
          elBuilder,
          fragment,
          $el;

      // first time rendering suggestions for this dataset
      if ($dataset.length === 0) {
        $suggestionsList = $(html.suggestionsList).css(css.suggestionsList);

        $dataset = $('<div></div>')
        .addClass(datasetClassName)
        .append($suggestionsList)
        .appendTo(this.$menu);
      }

      elBuilder = document.createElement('div');
      fragment = document.createDocumentFragment();

      this.clearSuggestions(dataset.name);

      if (suggestions.length > 0) {
        this.isEmpty = false;
        this.isOpen && this._show();

        utils.each(suggestions, function(i, suggestion) {
          elBuilder.innerHTML = dataset.template.render(suggestion);

          $el = $(elBuilder.firstChild)
          .css(css.suggestion)
          .data('value', suggestion.value);

          $el.children().each(function() {
            $(this).css(css.suggestionChild);
          });

          fragment.appendChild($el[0]);
        });
      }

      $dataset.find('> .tt-suggestions')
      .data({ query: query, dataset: dataset.name })
      .append(fragment);

      this.trigger('suggestionsRendered');
    },

    clearSuggestions: function(datasetName) {
      var $suggestions = datasetName ?
          this.$menu.find('.tt-dataset-' + datasetName + ' .tt-suggestions') :
          this.$menu.find('.tt-suggestions');

      $suggestions.empty();

      if (this._getSuggestions().length === 0) {
        this.isEmpty = true;
        this._hide();
      }
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
