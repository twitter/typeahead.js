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
      this.trigger('suggestionSelected', extractSuggestion($suggestion));
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

      // in the case of scrollable overflow
      // make sure the cursor is visible in the menu
      this._ensureVisibility($underCursor);

      this.trigger('cursorMoved', extractSuggestion($underCursor));
    },

    _getSuggestions: function() {
      return this.$menu.find('.tt-suggestions > .tt-suggestion');
    },

    _ensureVisibility: function($el) {
      var menuHeight = this.$menu.height() +
            parseInt(this.$menu.css('paddingTop'), 10) +
            parseInt(this.$menu.css('paddingBottom'), 10),
          menuScrollTop = this.$menu.scrollTop(),
          elTop = $el.position().top,
          elBottom = elTop + $el.outerHeight(true);

      if (elTop < 0) {
        this.$menu.scrollTop(menuScrollTop + elTop);
      }

      else if (menuHeight < elBottom) {
        this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
      }
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
        this.isMouseOverDropdown = false;
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

      return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
    },

    getFirstSuggestion: function() {
      var $suggestion = this._getSuggestions().first();

      return $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
    },

    renderSuggestions: function(dataset, suggestions) {
      var datasetClassName = 'tt-dataset-' + dataset.name,
          wrapper = '<div class="tt-suggestion">%body</div>',
          compiledHtml,
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
        .append(dataset.header)
        .append($suggestionsList)
        .append(dataset.footer)
        .appendTo(this.$menu);
      }

      // suggestions to be rendered
      if (suggestions.length > 0) {
        this.isEmpty = false;
        this.isOpen && this._show();

        elBuilder = document.createElement('div');
        fragment = document.createDocumentFragment();

        utils.each(suggestions, function(i, suggestion) {
          suggestion.dataset = dataset.name;
          compiledHtml = dataset.template(suggestion.datum);
          elBuilder.innerHTML = wrapper.replace('%body', compiledHtml);

          $el = $(elBuilder.firstChild)
          .css(css.suggestion)
          .data('suggestion', suggestion);

          $el.children().each(function() {
            $(this).css(css.suggestionChild);
          });

          fragment.appendChild($el[0]);
        });

        // show this dataset in case it was previously empty
        // and render the new suggestions
        $dataset.show().find('.tt-suggestions').html(fragment);
      }

      // no suggestions to render
      else {
        this.clearSuggestions(dataset.name);
      }

      this.trigger('suggestionsRendered');
    },

    clearSuggestions: function(datasetName) {
      var $datasets = datasetName ?
            this.$menu.find('.tt-dataset-' + datasetName) :
            this.$menu.find('[class^="tt-dataset-"]'),
          $suggestions = $datasets.find('.tt-suggestions');

      $datasets.hide();
      $suggestions.empty();

      if (this._getSuggestions().length === 0) {
        this.isEmpty = true;
        this._hide();
      }
    }
  });

  return DropdownView;

  // helper functions
  // ----------------

  function extractSuggestion($el) {
    return $el.data('suggestion');
  }
})();
