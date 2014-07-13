/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Typeahead = (function() {
  'use strict';

  var attrsKey = 'ttAttrs';

  // constructor
  // -----------

  // THOUGHT: what if datasets could dynamically be added/removed?
  function Typeahead(o) {
    var $menu, $input, $hint;

    o = o || {};

    if (!o.input || !o.menu) {
      $.error('missing input or menu');
    }

    $hint = o.hint;
    $menu = o.menu;
    $input  = o.input;

    this.isActivated = false;
    this.autoselect = !!o.autoselect;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;

    // #705: if there's scrollable overflow, ie doesn't support
    // blur cancellations when the scrollbar is clicked
    //
    // #351: preventDefault won't cancel blurs in ie <= 8
    $input.on('blur.tt', function($e) {
      var active, isActive, hasActive;

      active = document.activeElement;
      isActive = $menu.is(active);
      hasActive = $menu.has(active).length > 0;

      if (_.isMsie() && (isActive || hasActive)) {
        $e.preventDefault();
        // stop immediate in order to prevent Input#_onBlur from
        // getting exectued
        $e.stopImmediatePropagation();
        _.defer(function() { $input.focus(); });
      }
    });

    // #351: prevents input blur due to clicks within dropdown menu
    $menu.on('mousedown.tt', function($e) { $e.preventDefault(); });

    this.eventBus = o.eventBus || new EventBus({ el: $input });

    this.dropdown = new Dropdown({ menu: $menu, datasets: o.datasets })
    .onSync('suggestionClicked', this._onSuggestionClicked, this)
    .onSync('cursorMoved', this._onCursorMoved, this)
    .onSync('cursorRemoved', this._onCursorRemoved, this)
    .onSync('opened', this._onOpened, this)
    .onSync('closed', this._onClosed, this)
    .onAsync('datasetRendered', this._onDatasetRendered, this);

    this.input = new Input({ input: $input, hint: $hint })
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

    _onSuggestionClicked: function onSuggestionClicked(type, $el) {
      this._select($el);
    },

    _onCursorMoved: function onCursorMoved() {
      var selectable, data;

      selectable = this.dropdown.getActiveSelectable();
      data = this.dropdown.getDataFromSelectable(selectable);

      this.input.setInputValue(data.val, true);

      this.eventBus.trigger('cursorchanged', data.obj);
    },

    _onCursorRemoved: function onCursorRemoved() {
      this.input.resetInputValue();
      this._updateHint();
    },

    _onDatasetRendered: function onDatasetRendered() {
      this._updateHint();
    },

    _onOpened: function onOpened() {
      this._updateHint();

      this.eventBus.trigger('opened');
    },

    _onClosed: function onClosed() {
      this.input.clearHint();

      this.eventBus.trigger('closed');
    },

    _onFocused: function onFocused() {
      this.isActivated = true;
      this.dropdown.open(); // TODO: activate
    },

    _onBlurred: function onBlurred() {
      this.isActivated = false;
      this.dropdown.empty(); // TODO: tt-suggestion tt-suggestion-always
      this.dropdown.close(); // TODO: deactivate
    },

    _onEnterKeyed: function onEnterKeyed(type, $e) {
      var activeSelectable, topSelectable;

      if (activeSelectable = this.dropdown.getActiveSelectable()) {
        this._select(activeSelectable);
        $e.preventDefault();
      }

      else if (this.autoselect && (topSelectable = this.dropdown.getTopSelectable())) {
        this._select(topSelectable);
        $e.preventDefault();
      }
    },

    _onTabKeyed: function onTabKeyed(type, $e) {
      var selectable;

      if (selectable = this.dropdown.getActiveSelectable()) {
        this._select(selectable);
        $e.preventDefault();
      }

      else {
        this._autocomplete(true);
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.dropdown.close(); // TODO: deactivate
      this.input.resetInputValue();
    },

    _onUpKeyed: function onUpKeyed() {
      var query = this.input.getQuery();

      this.dropdown.isEmpty && query.length >= this.minLength ?
        this.dropdown.update(query) :
        this.dropdown.moveCursorUp();

      this.dropdown.open(); // TODO: activate
    },

    _onDownKeyed: function onDownKeyed() {
      var query = this.input.getQuery();

      this.dropdown.isEmpty && query.length >= this.minLength ?
        this.dropdown.update(query) :
        this.dropdown.moveCursorDown();

      this.dropdown.open();
    },

    _onLeftKeyed: function onLeftKeyed() {
      this.dir === 'rtl' && this._autocomplete();
    },

    _onRightKeyed: function onRightKeyed() {
      this.dir === 'ltr' && this._autocomplete();
    },

    _onQueryChanged: function onQueryChanged(e, query) {
      this.input.clearHintIfInvalid();

      query.length >= this.minLength ?
        this.dropdown.update(query) :
        this.dropdown.empty();

      this.dropdown.open();
      this._setLanguageDirection();
    },

    _onWhitespaceChanged: function onWhitespaceChanged() {
      this._updateHint();
      this.dropdown.open();
    },

    _setLanguageDirection: function setLanguageDirection() {
      var dir;

      if (this.dir !== (dir = this.input.getLanguageDirection())) {
        this.dir = dir;
        // TODO: this.$node.css('direction', dir);
        this.dropdown.setLanguageDirection(dir);
      }
    },

    _updateHint: function updateHint() {
      var selectable, data, val, query, escapedQuery, frontMatchRegEx, match;

      selectable = this.dropdown.getTopSelectable();
      data = this.dropdown.getDataFromSelectable(selectable);

      if (data && this.dropdown.isVisible() && !this.input.hasOverflow()) {
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
        selectable = this.dropdown.getTopSelectable();
        data = this.dropdown.getDataFromSelectable(selectable);
        data && this.input.setInputValue(data.val);

        this.eventBus.trigger('autocompleted', data.obj);
      }
    },

    _select: function select(selectable) {
      var data = this.dropdown.getDataFromSelectable(selectable);

      this.input.setQuery(data.val);
      this.input.setInputValue(data.val, true);

      this._setLanguageDirection();

      this.eventBus.trigger('selected', data.obj);
      this.dropdown.close();

      // #118: allow click event to bubble up to the body before removing
      // the suggestions otherwise we break event delegation
      _.defer(_.bind(this.dropdown.empty, this.dropdown));
    },

    // ### public

    open: function open() {
      this.dropdown.open();
    },

    close: function close() {
      this.dropdown.close();
    },

    setVal: function setVal(val) {
      // expect val to be a string, so be safe, and coerce
      val = _.toStr(val);

      if (this.isActivated) {
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
      this.dropdown.destroy();
    }
  });

  return Typeahead;
})();
