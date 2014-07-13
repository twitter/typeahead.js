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
    var $results, $input, $hint, Res;

    o = o || {};
    o.hint = o.hint || {};
    o.results = o.results || {};

    if (!o.$input || !o.results.$el) {
      $.error('missing input or results element');
    }

    $input  = o.$input;
    $hint = o.hint.$el;
    $results = o.results.$el;

    www.mixin(this);

    this.autoselect = !!o.autoselect;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
    this.eventBus = new EventBus({ el: $input });

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

    // the result constructor used is determined by whether the
    // results element was provided or created
    Res = o.hint.custom ? CustomResults : Results;

    this.results = new Res({ node: $results, datasets: o.datasets }, www)
    .onSync('selectableClicked', this._onSelectableClicked, this)
    .onSync('cursorMoved', this._onCursorMoved, this)
    .onSync('cursorRemoved', this._onCursorRemoved, this)
    .onAsync('datasetRendered', this._onDatasetRendered, this);

    this.input = new Input({ input: $input, hint: $hint }, www)
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

    this._setLanguageDirection();
  }

  // instance methods
  // ----------------

  _.mixin(Typeahead.prototype, {

    // ### private

    _onSelectableClicked: function onSelectableClicked(type, $el) {
      this._select($el);
    },

    _onCursorMoved: function onCursorMoved() {
      var selectable, data;

      selectable = this.results.getActiveSelectable();
      data = this.results.getDataFromSelectable(selectable);

      // TODO: what if data is null?
      this.input.setInputValue(data.val, true);

      this.eventBus.trigger('cursorchanged', data.obj);
    },

    _onCursorRemoved: function onCursorRemoved() {
      this.input.resetInputValue();
      this._updateHint();
      // TODO: cursoroff?
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
        this._select(activeSelectable);
        $e.preventDefault();
      }

      else if (this.autoselect && (topSelectable = this.results.getTopSelectable())) {
        this._select(topSelectable);
        $e.preventDefault();
      }
    },

    _onTabKeyed: function onTabKeyed(type, $e) {
      var selectable;

      if (selectable = this.results.getActiveSelectable()) {
        this._select(selectable);
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
      this._moveCursor('up');
    },

    _onDownKeyed: function onDownKeyed() {
      this._moveCursor('down');
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

        if (data) {
          this.input.setInputValue(data.val);
          this.eventBus.trigger('autocompleted', data.obj);
        }
      }
    },

    _select: function select(selectable) {
      var data = this.results.getDataFromSelectable(selectable);

      if (data) {
        this.input.setQuery(data.val);
        this.input.setInputValue(data.val, true);

        this._setLanguageDirection();

        this.eventBus.trigger('selected', data.obj);

        // #118: allow click event to bubble up to the body before removing
        // the selectables otherwise we break event delegation
        _.defer(_.bind(this.results.deactivate, this.results));
      }
    },

    _moveCursor: function moveCursor(dir) {
      var query = this.input.getQuery(), updateAccepted = false, method;

      this.results.activate();
       method = 'moveCursor' + dir.charAt(0).toUpperCase() + dir.slice(1);

      query.length >= this.minLength ?
        (updateAccepted = this.results.update(query)):
        this.results.empty();

      // only attempt to move the cursor when an update did/will not happen
      // this prevents unwanted cursor movement
      !updateAccepted && this.results[method]();
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

    destroy: function destroy() {
      this.input.destroy();
      this.results.destroy();
    }
  });

  return Typeahead;
})();
