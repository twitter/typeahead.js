/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Dropdown = (function() {

  // constructor
  // -----------

  function Dropdown(o) {
    var that = this, onSuggestionClick, onSuggestionMouseEnter,
        onSuggestionMouseLeave;

    o = o || {};

    if (!o.menu) {
      $.error('menu is required');
    }

    this.isOpen = false;
    this.isEmpty = true;

    this.datasets = _.map(o.datasets, initializeDataset);

    // bound functions
    onSuggestionClick = _.bind(this._onSuggestionClick, this);
    onSuggestionMouseEnter = _.bind(this._onSuggestionMouseEnter, this);
    onSuggestionMouseLeave = _.bind(this._onSuggestionMouseLeave, this);

    this.$menu = $(o.menu)
    .on('click.tt', '.tt-suggestion', onSuggestionClick)
    .on('mouseenter.tt', '.tt-suggestion', onSuggestionMouseEnter)
    .on('mouseleave.tt', '.tt-suggestion', onSuggestionMouseLeave);

    _.each(this.datasets, function(dataset) {
      that.$menu.append(dataset.getRoot());
      dataset.onSync('rendered', that._onRendered, that);
    });
  }

  // instance methods
  // ----------------

  _.mixin(Dropdown.prototype, EventEmitter, {

    // ### private

    _onSuggestionClick: function onSuggestionClick($e) {
      this.trigger('suggestionClicked', $($e.currentTarget));
    },

    _onSuggestionMouseEnter: function onSuggestionMouseEnter($e) {
      this._removeCursor();
      this._setCursor($($e.currentTarget), true);
    },

    _onSuggestionMouseLeave: function onSuggestionMouseLeave() {
      this._removeCursor();
    },

    _onRendered: function onRendered() {
      this.isEmpty = _.every(this.datasets, isDatasetEmpty);

      this.isEmpty ? this._hide() : (this.isOpen && this._show());

      this.trigger('datasetRendered');

      function isDatasetEmpty(dataset) { return dataset.isEmpty(); }
    },

    _hide: function() {
      this.$menu.hide();
    },

    _show: function() {
      // can't use jQuery#show because $menu is a span element we want
      // display: block; not dislay: inline;
      this.$menu.css('display', 'block');
    },

    _getSuggestions: function getSuggestions() {
      return this.$menu.find('.tt-suggestion');
    },

    _getCursor: function getCursor() {
      return this.$menu.find('.tt-cursor').first();
    },

    _setCursor: function setCursor($el, silent) {
      $el.first().addClass('tt-cursor');

      !silent && this.trigger('cursorMoved');
    },

    _removeCursor: function removeCursor() {
      this._getCursor().removeClass('tt-cursor');
    },

    _moveCursor: function moveCursor(increment) {
      var $suggestions, $oldCursor, newCursorIndex, $newCursor;

      if (!this.isOpen) { return; }

      $oldCursor = this._getCursor();
      $suggestions = this._getSuggestions();

      this._removeCursor();

      // shifting before and after modulo to deal with -1 index
      newCursorIndex = $suggestions.index($oldCursor) + increment;
      newCursorIndex = (newCursorIndex + 1) % ($suggestions.length + 1) - 1;

      if (newCursorIndex === -1) {
        this.trigger('cursorRemoved');

        return;
      }

      else if (newCursorIndex < -1) {
        newCursorIndex = $suggestions.length - 1;
      }

      this._setCursor($newCursor = $suggestions.eq(newCursorIndex));

      // in the case of scrollable overflow
      // make sure the cursor is visible in the menu
      this._ensureVisible($newCursor);
    },

    _ensureVisible: function ensureVisible($el) {
      var elTop, elBottom, menuScrollTop, menuHeight;

      elTop = $el.position().top;
      elBottom = elTop + $el.outerHeight(true);
      menuScrollTop = this.$menu.scrollTop();
      menuHeight = this.$menu.height() +
        parseInt(this.$menu.css('paddingTop'), 10) +
        parseInt(this.$menu.css('paddingBottom'), 10);

      if (elTop < 0) {
        this.$menu.scrollTop(menuScrollTop + elTop);
      }

      else if (menuHeight < elBottom) {
        this.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
      }
    },

    // ### public

    close: function close() {
      if (this.isOpen) {
        this.isOpen = false;

        this._removeCursor();
        this._hide();

        this.trigger('closed');
      }
    },

    open: function open() {
      if (!this.isOpen) {
        this.isOpen = true;

        !this.isEmpty && this._show();

        this.trigger('opened');
      }
    },

    setLanguageDirection: function setLanguageDirection(dir) {
      this.$menu.css(dir === 'ltr' ? css.ltr : css.rtl);
    },

    moveCursorUp: function moveCursorUp() {
      this._moveCursor(-1);
    },

    moveCursorDown: function moveCursorDown() {
      this._moveCursor(+1);
    },

    getDatumForSuggestion: function getDatumForSuggestion($el) {
      var datum = null;

      if ($el.length) {
        datum = {
          raw: Dataset.extractDatum($el),
          value: Dataset.extractValue($el),
          datasetName: Dataset.extractDatasetName($el)
        };
      }

      return datum;
    },

    getDatumForCursor: function getDatumForCursor() {
      return this.getDatumForSuggestion(this._getCursor().first());
    },

    getDatumForTopSuggestion: function getDatumForTopSuggestion() {
      return this.getDatumForSuggestion(this._getSuggestions().first());
    },

    update: function update(query) {
      _.each(this.datasets, updateDataset);

      function updateDataset(dataset) { dataset.update(query); }
    },

    empty: function empty() {
      _.each(this.datasets, clearDataset);
      this.isEmpty = true;

      function clearDataset(dataset) { dataset.clear(); }
    },

    isVisible: function isVisible() {
      return this.isOpen && !this.isEmpty;
    },

    destroy: function destroy() {
      this.$menu.off('.tt');

      this.$menu = null;

      _.each(this.datasets, destroyDataset);

      function destroyDataset(dataset) { dataset.destroy(); }
    }
  });

  return Dropdown;

  // helper functions
  // ----------------

  function initializeDataset(oDataset) {
    return new Dataset(oDataset);
  }
})();
