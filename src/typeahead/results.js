/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Results = (function() {
  'use strict';

  // constructor
  // -----------

  function Results(o, www) {
    var that = this, onSelectableClick, onSelectableMouseEnter,
        onSelectableMouseLeave;

    o = o || {};

    if (!o.node) {
      $.error('node is required');
    }

    www.mixin(this);

    // the latest query the results was updated for
    this.query = null;
    this.datasets = _.map(o.datasets, initializeDataset);

    // bound functions
    onSelectableClick = _.bind(this._onSelectableClick, this);
    onSelectableMouseEnter = _.bind(this._onSelectableMouseEnter, this);
    onSelectableMouseLeave = _.bind(this._onSelectableMouseLeave, this);

    this.$node = $(o.node)
    .on('click.tt', this.selectors.selectable, onSelectableClick)
    .on('mouseenter.tt', this.selectors.selectable, onSelectableMouseEnter)
    .on('mouseleave.tt', this.selectors.selectable, onSelectableMouseLeave);

    _.each(this.datasets, function(dataset) {
      that.$node.append(dataset.getRoot());
      dataset.onSync('rendered', that._onRendered, that);
    });

    function initializeDataset(oDataset) { return new Dataset(oDataset, www); }
  }

  // instance methods
  // ----------------

  _.mixin(Results.prototype, EventEmitter, {

    // ### private

    _onSelectableClick: function onSelectableClick($e) {
      this.trigger('selectableClicked', $($e.currentTarget));
    },

    _onSelectableMouseEnter: function onSelectableMouseEnter($e) {
      this._removeCursor();
      this._setCursor($($e.currentTarget), true);
    },

    _onSelectableMouseLeave: function onSelectableMouseLeave() {
      this._removeCursor();
    },

    _onRendered: function onRendered() {
      var isEmpty = _.every(this.datasets, isDatasetEmpty);

      if (isEmpty) {
        this.$node.addClass(this.classes.empty);
        this._hide();
      }

      else {
        this.$node.removeClass(this.classes.empty);
        this.$node.hasClass(this.classes.activated) && this._show();
      }

      this.trigger('datasetRendered');

      function isDatasetEmpty(dataset) { return dataset.isEmpty(); }
    },

    _getSelectables: function getSelectables() {
      return this.$node.find(this.selectors.selectable);
    },

    _setCursor: function setCursor($el, silent) {
      $el.first().addClass(this.classes.cursor);

      !silent && this.trigger('cursorMoved');
    },

    _removeCursor: function _removeCursor() {
      var selectable = this.getActiveSelectable();

      selectable && selectable.removeClass(this.classes.cursor);
    },

    _moveCursor: function moveCursor(increment) {
      var $selectables, $oldCursor, oldCursorIndex, newCursorIndex, $newCursor;

      $oldCursor = this.getActiveSelectable();
      $selectables = this._getSelectables();

      this._removeCursor();

      // shifting before and after modulo to deal with -1 index
      oldCursorIndex = $oldCursor ? $selectables.index($oldCursor) : -1;
      newCursorIndex = oldCursorIndex + increment;
      newCursorIndex = (newCursorIndex + 1) % ($selectables.length + 1) - 1;

      if (newCursorIndex === -1) {
        this.trigger('cursorRemoved');
        return;
      }

      else if (newCursorIndex < -1) {
        newCursorIndex = $selectables.length - 1;
      }

      this._setCursor($newCursor = $selectables.eq(newCursorIndex));

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
      this.$node.addClass(this.classes.activated);
      !this.$node.hasClass(this.classes.empty) && this._show();
    },

    deactivate: function deactivate() {
      this.$node.removeClass(this.classes.activated);
      this._removeCursor();
      this._hide();
    },

    setLanguageDirection: function setLanguageDirection(dir) {
      this.$node.attr('dir', dir);
      // TODO: not for custom elements
      this.$node.css(dir === 'ltr' ? this.css.ltr : this.css.rtl);
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
      var $selectable = this._getSelectables().filter(this.selectors.cursor).first();

      return $selectable.length ? $selectable : null;
    },

    getTopSelectable: function getTopSelectable() {
      var $selectable = this._getSelectables().first();

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
      this.$node.addClass(this.classes.empty);

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
