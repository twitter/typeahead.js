/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Typeahead = (function() {
  'use strict';

  // constructor
  // -----------

  // THOUGHT: what if datasets could dynamically be added/removed?
  function Typeahead(o, www) {
    o = o || {};

    if (!o.input) {
      $.error('missing input');
    }

    if (!o.results) {
      $.error('missing results');
    }

    if (!o.eventBus) {
      $.error('missing event bus');
    }

    www.mixin(this);

    this.eventBus = o.eventBus;
    this.autoselect = !!o.autoselect;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;

    this.input = o.input;
    this.results = o.results;

    this._hacks();
    this._setLanguageDirection();

    this.results.bind()
    .onSync('selectableClicked', this._onSelectableClicked, this)
    .onAsync('datasetRendered', this._onDatasetRendered, this);

    this.input.bind()
    .onSync('focused', this._onFocused, this)
    .onSync('blurred', this._onBlurred, this)
    .onSync('enterKeyed', this._onEnterKeyed, this)
    .onSync('tabKeyed', this._onTabKeyed, this)
    .onSync('escKeyed', this._onEscKeyed, this)
    .onSync('upKeyed', this._onUpKeyed, this)
    .onSync('downKeyed', this._onDownKeyed, this)
    .onSync('leftKeyed', this._onLeftKeyed, this)
    .onSync('rightKeyed', this._onRightKeyed, this)
    .onSync('queryChanged', this._onQueryChanged, this)
    .onSync('whitespaceChanged', this._onWhitespaceChanged, this);
  }

  // instance methods
  // ----------------

  _.mixin(Typeahead.prototype, {

    // ### private

    // here's where hacks get applied and we don't feel bad about it
    _hacks: function hacks() {
      var $input, $results;

      // these default values are to make testing easier
      $input = this.input.$input || $('<div>');
      $results = this.results.$node || $('<div>');

      // #705: if there's scrollable overflow, ie doesn't support
      // blur cancellations when the scrollbar is clicked
      //
      // #351: preventDefault won't cancel blurs in ie <= 8
      $input.on('blur.tt', function($e) {
        var active, isActive, hasActive;

        active = document.activeElement;
        isActive = $results.is(active);
        hasActive = $results.has(active).length > 0;

        if (_.isMsie() && (isActive || hasActive)) {
          $e.preventDefault();
          // stop immediate in order to prevent Input#_onBlur from
          // getting exectued
          $e.stopImmediatePropagation();
          _.defer(function() { $input.focus(); });
        }
      });

      // #351: prevents input blur due to clicks within results
      $results.on('mousedown.tt', function($e) { $e.preventDefault(); });
    },

    _onSelectableClicked: function onSelectableClicked(type, $el) {
      this.select($el);
    },

    _onDatasetRendered: function onDatasetRendered() {
      this._updateHint();
    },

    _onFocused: function onFocused() {
      this.results.activate();
      this.results.update(this.input.getQuery());
    },

    _onBlurred: function onBlurred() {
      this.results.deactivate();
      this.input.resetInputValue();
    },

    _onEnterKeyed: function onEnterKeyed(type, $e) {
      var activeSelectable, topSelectable;

      if (activeSelectable = this.results.getActiveSelectable()) {
        this.select(activeSelectable);
        $e.preventDefault();
      }

      else if (this.autoselect && (topSelectable = this.results.getTopSelectable())) {
        this.select(topSelectable);
        $e.preventDefault();
      }
    },

    _onTabKeyed: function onTabKeyed(type, $e) {
      var selectable;

      if (selectable = this.results.getActiveSelectable()) {
        this.select(selectable);
        $e.preventDefault();
      }

      else {
        this._autocomplete(true);
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.results.deactivate();
      this.input.resetInputValue();
    },

    _onUpKeyed: function onUpKeyed() {
      this._moveCursor(-1);
    },

    _onDownKeyed: function onDownKeyed() {
      this._moveCursor(+1);
    },

    _onLeftKeyed: function onLeftKeyed() {
      this.dir === 'rtl' && this._autocomplete();
    },

    _onRightKeyed: function onRightKeyed() {
      this.dir === 'ltr' && this._autocomplete();
    },

    _onQueryChanged: function onQueryChanged(e, query) {
      this.results.activate();
      this.input.clearHintIfInvalid();

      query.length >= this.minLength ?
        this.results.update(query) :
        this.results.empty();

      this._setLanguageDirection();
    },

    _onWhitespaceChanged: function onWhitespaceChanged() {
      this.results.activate();
      this._updateHint();
    },

    _setLanguageDirection: function setLanguageDirection() {
      var dir;

      if (this.dir !== (dir = this.input.getLanguageDirection())) {
        this.dir = dir;
        this.results.setLanguageDirection(dir);
        this.input.setHintLanguageDirection(dir);
      }
    },

    _updateHint: function updateHint() {
      var selectable, data, val, query, escapedQuery, frontMatchRegEx, match;

      selectable = this.results.getTopSelectable();
      data = this.results.getDataFromSelectable(selectable);

      if (data && this._isActivated() && !this.input.hasOverflow()) {
        val = this.input.getInputValue();
        query = Input.normalizeQuery(val);
        escapedQuery = _.escapeRegExChars(query);

        // match input value, then capture trailing text
        frontMatchRegEx = new RegExp('^(?:' + escapedQuery + ')(.+$)', 'i');
        match = frontMatchRegEx.exec(data.val);

        // clear hint if there's no trailing text
        match ? this.input.setHint(val + match[1]) : this.input.clearHint();
      }

      else {
        this.input.clearHint();
      }
    },

    _autocomplete: function autocomplete(laxCursor) {
      var hint, query, isCursorAtEnd, selectable, data;

      hint = this.input.getHint();
      query = this.input.getQuery();
      isCursorAtEnd = laxCursor || this.input.isCursorAtEnd();

      if (hint && query !== hint && isCursorAtEnd) {
        selectable = this.results.getTopSelectable();
        data = this.results.getDataFromSelectable(selectable);

        if (data && !this.eventBus.trigger('autocomplete', data.obj)) {
          this.input.setInputValue(data.val);
          this.eventBus.trigger('autocompleted', data.obj);
        }
      }
    },

    _moveCursor: function moveCursor(delta) {
      var query, candidate, data, payload, cancelMove;

      query = this.input.getQuery();
      candidate = this.results.selectableRelativeToCursor(delta);
      data = this.results.getDataFromSelectable(candidate);
      payload = data ? data.obj : null;

      this.results.activate();

      // update will return true when it's a new query and new results
      // need to be fetched – in this case we don't want to move the cursor
      cancelMove = query.length >= this.minLength && this.results.update(query);

      if (!cancelMove && !this.eventBus.trigger('cursorchange', payload)) {
        this.results.setCursor(candidate);

        // cursor moved to different selectable
        if (data) {
          this.input.setInputValue(data.val, true);
        }

        // cursor moved off of selectables, back to input
        else {
          this.input.resetInputValue();
          this._updateHint();
        }

        this.eventBus.trigger('cursorchanged', payload);
      }
    },

    _isActivated: function isActivated() {
      return this.input.hasFocus();
    },

    // ### public

    setVal: function setVal(val) {
      // expect val to be a string, so be safe, and coerce
      val = _.toStr(val);

      if (this._isActivated()) {
        this.input.setInputValue(val);
      }

      else {
        this.input.setQuery(val);
        this.input.setInputValue(val, true);
      }

      this._setLanguageDirection();
    },

    getVal: function getVal() {
      return this.input.getQuery();
    },

    select: function select(selectable) {
      var data = this.results.getDataFromSelectable(selectable);

      if (data && !this.eventBus.trigger('select', data.obj)) {
        this.input.setQuery(data.val);
        this.input.setInputValue(data.val, true);

        this._setLanguageDirection();

        this.eventBus.trigger('selected', data.obj);

        // #118: allow click event to bubble up to the body before removing
        // the selectables otherwise we break event delegation
        _.defer(_.bind(this.results.deactivate, this.results));
      }
    },


    destroy: function destroy() {
      this.input.destroy();
      this.results.destroy();
    }
  });

  return Typeahead;
})();
