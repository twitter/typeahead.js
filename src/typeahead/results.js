/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Results = (function() {
  'use strict';

  // constructor
  // -----------

  function Results(o) {
    var that = this, onSuggestionClick, onSuggestionMouseEnter,
        onSuggestionMouseLeave;

    o = o || {};

    if (!o.node) {
      $.error('node is required');
    }

    // the latest query the results was updated for
    this.query = null;
    this.datasets = _.map(o.datasets, initializeDataset);

    // bound functions
    onSuggestionClick = _.bind(this._onSuggestionClick, this);
    onSuggestionMouseEnter = _.bind(this._onSuggestionMouseEnter, this);
    onSuggestionMouseLeave = _.bind(this._onSuggestionMouseLeave, this);

    this.$node = $(o.node)
    .on('click.tt', '.tt-selectable', onSuggestionClick)
    .on('mouseenter.tt', '.tt-selectable', onSuggestionMouseEnter)
    .on('mouseleave.tt', '.tt-selectable', onSuggestionMouseLeave);

    _.each(this.datasets, function(dataset) {
      that.$node.append(dataset.getRoot());
      dataset.onSync('rendered', that._onRendered, that);
    });

    function initializeDataset(oDataset) { return new Dataset(oDataset); }
  }

  // instance methods
  // ----------------

  _.mixin(Results.prototype, EventEmitter, {

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
      var isEmpty = _.every(this.datasets, isDatasetEmpty);

      if (isEmpty) {
        this.$node.addClass('tt-empty');
        this._hide();
      }

      else {
        this.$node.removeClass('tt-empty');
        this.$node.hasClass('tt-activated') && this._show();
      }

      this.trigger('datasetRendered');

      function isDatasetEmpty(dataset) { return dataset.isEmpty(); }
    },

    _getSuggestions: function getSuggestions() {
      return this.$node.find('.tt-selectable');
    },

    _setCursor: function setCursor($el, silent) {
      $el.first().addClass('tt-cursor');

      !silent && this.trigger('cursorMoved');
    },

    _removeCursor: function _removeCursor() {
      var selectable = this.getActiveSelectable();

      selectable && selectable.removeClass('tt-cursor');
    },

    _moveCursor: function moveCursor(increment) {
      var $suggestions, $oldCursor, oldCursorIndex, newCursorIndex, $newCursor;

      $oldCursor = this.getActiveSelectable();
      $suggestions = this._getSuggestions();

      this._removeCursor();

      // shifting before and after modulo to deal with -1 index
      oldCursorIndex = $oldCursor ? $suggestions.index($oldCursor) : -1;
      newCursorIndex = oldCursorIndex + increment;
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
      // make sure the cursor is visible in the node
      this._ensureVisible($newCursor);
    },

    _ensureVisible: function ensureVisible($el) {
      var elTop, elBottom, nodeScrollTop, nodeHeight;

      elTop = $el.position().top;
      elBottom = elTop + $el.outerHeight(true);
      nodeScrollTop = this.$node.scrollTop();
      nodeHeight = this.$node.height() +
        parseInt(this.$node.css('paddingTop'), 10) +
        parseInt(this.$node.css('paddingBottom'), 10);

      if (elTop < 0) {
        this.$node.scrollTop(nodeScrollTop + elTop);
      }

      else if (nodeHeight < elBottom) {
        this.$node.scrollTop(nodeScrollTop + (elBottom - nodeHeight));
      }
    },

   _hide: function() {
      this.$node.hide();
    },

    _show: function() {
      // can't use jQuery#show because $node is a span element we want
      // display: block; not dislay: inline;
      this.$node.css('display', 'block');
    },

    // ### public

    activate: function activate() {
      this.$node.addClass('tt-activated');
      !this.$node.hasClass('tt-empty') && this._show();
    },

    deactivate: function deactivate() {
      this.$node.removeClass('tt-activated');
      this._removeCursor();
      this._hide();
    },

    setLanguageDirection: function setLanguageDirection(dir) {
      this.$node.css(dir === 'ltr' ? css.ltr : css.rtl);
    },

    moveCursorUp: function moveCursorUp() {
      this._moveCursor(-1);
    },

    moveCursorDown: function moveCursorDown() {
      this._moveCursor(+1);
    },

    getDataFromSelectable: function getDataFromSelectable($el) {
      return ($el && $el.length) ? Dataset.extractData($el) : null;
    },

    getActiveSelectable: function getActiveSelectable() {
      var $selectable = this._getSuggestions().filter('.tt-cursor').first();

      return $selectable.length ? $selectable : null;
    },

    getTopSelectable: function getTopSelectable() {
      var $selectable = this._getSuggestions().first();

      return $selectable.length ? $selectable : null;
    },

    update: function update(query) {
      var isValidUpdate = query !== this.query;

      // don't update if the query hasn't changed
      if (isValidUpdate) {
        this.query = query;
        _.each(this.datasets, updateDataset);
      }

      return isValidUpdate;

      function updateDataset(dataset) { dataset.update(query); }
    },

    empty: function empty() {
      _.each(this.datasets, clearDataset);

      this.query = null;
      this.$node.addClass('tt-empty');

      function clearDataset(dataset) { dataset.clear(); }
    },

    destroy: function destroy() {
      this.$node.off('.tt');

      this.$node = null;

      _.each(this.datasets, destroyDataset);

      function destroyDataset(dataset) { dataset.destroy(); }
    }
  });

  return Results;
})();
