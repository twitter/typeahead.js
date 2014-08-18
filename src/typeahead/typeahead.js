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
    var onSelectableClicked, onDatasetRendered, onFocused, onBlurred,
        onEnterKeyed, onTabKeyed, onEscKeyed, onUpKeyed, onDownKeyed,
        onLeftKeyed, onRightKeyed, onQueryChanged, onWhitespaceChanged;

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
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;

    this.input = o.input;
    this.results = o.results;

    this.enabled = true;

    // activate the typeahead on init if the input has focus
    this.active = false;
    this.input.hasFocus() && this.activate();

    this._hacks();

    // composed event handlers for results
    onSelectableClicked = c(this, 'isActive', '_onSelectableClicked');
    onDatasetRendered = c(this, 'isActive', '_onDatasetRendered');

    this.results.bind()
    .onSync('selectableClicked', onSelectableClicked, this)
    .onSync('datasetRendered', onDatasetRendered, this);

    // composed event handlers for input
    onFocused = c(this, 'activate', 'open', '_onFocused');
    onBlurred = c(this, 'deactivate', '_onBlurred');
    onEnterKeyed = c(this, 'isActive', 'isOpen', '_onEnterKeyed');
    onTabKeyed = c(this, 'isActive', 'isOpen', '_onTabKeyed');
    onEscKeyed = c(this, 'isActive', '_onEscKeyed');
    onUpKeyed = c(this, 'isActive', 'open', '_onUpKeyed');
    onDownKeyed = c(this, 'isActive', 'open', '_onDownKeyed');
    onLeftKeyed = c(this, 'isActive', 'isOpen', '_onLeftKeyed');
    onRightKeyed = c(this, 'isActive', 'isOpen', '_onRightKeyed');
    onQueryChanged = c(this, 'isActive', 'open', '_onQueryChanged');
    onWhitespaceChanged = c(this, 'isActive', 'open', '_onWhitespaceChanged');

    this.input.bind()
    .onSync('focused', onFocused, this)
    .onSync('blurred', onBlurred, this)
    .onSync('enterKeyed', onEnterKeyed, this)
    .onSync('tabKeyed', onTabKeyed, this)
    .onSync('escKeyed', onEscKeyed, this)
    .onSync('upKeyed', onUpKeyed, this)
    .onSync('downKeyed', onDownKeyed, this)
    .onSync('leftKeyed', onLeftKeyed, this)
    .onSync('rightKeyed', onRightKeyed, this)
    .onSync('queryChanged', onQueryChanged, this)
    .onSync('whitespaceChanged', onWhitespaceChanged, this)
    .onSync('langDirChanged', this._onLangDirChanged, this);
  }

  // instance methods
  // ----------------

  _.mixin(Typeahead.prototype, {

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

    // ### event handlers

    _onSelectableClicked: function onSelectableClicked(type, $el) {
      this.select($el);
    },

    _onDatasetRendered: function onDatasetRendered(type, dataset, results, async) {
      this._updateHint();
      this.eventBus.trigger('render', dataset, results, async);
    },

    _onFocused: function onFocused() {
      this.results.update(this.input.getQuery());
    },

    _onBlurred: function onBlurred() {
      if (this.input.hasQueryChangedSinceLastFocus()) {
        this.eventBus.trigger('change', this.input.getQuery());
      }
    },

    _onEnterKeyed: function onEnterKeyed(type, $e) {
      var $selectable;

      if ($selectable = this.results.getActiveSelectable()) {
        this.select($selectable) && $e.preventDefault();
      }
    },

    _onTabKeyed: function onTabKeyed(type, $e) {
      var $selectable;

      if ($selectable = this.results.getActiveSelectable()) {
        this.select($selectable) && $e.preventDefault();
      }

      else if ($selectable = this.results.getTopSelectable()) {
        this.autocomplete($selectable) && $e.preventDefault();
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.close();
    },

    _onUpKeyed: function onUpKeyed() {
      this.moveCursor(-1);
    },

    _onDownKeyed: function onDownKeyed() {
      this.moveCursor(+1);
    },

    _onLeftKeyed: function onLeftKeyed() {
      if (this.dir === 'rtl' && this.input.isCursorAtEnd()) {
        this.autocomplete(this.results.getTopSelectable());
      }
    },

    _onRightKeyed: function onRightKeyed() {
      if (this.dir === 'ltr' && this.input.isCursorAtEnd()) {
        this.autocomplete(this.results.getTopSelectable());
      }
    },

    _onQueryChanged: function onQueryChanged(e, query) {
      query.length >= this.minLength ?
        this.results.update(query) :
        this.results.empty();
    },

    _onWhitespaceChanged: function onWhitespaceChanged() {
      this._updateHint();
    },

    _onLangDirChanged: function onLangDirChanged(e, dir) {
      if (this.dir !== dir) {
        this.dir = dir;
        this.results.setLanguageDirection(dir);
      }
    },

    // ### private

    _updateHint: function updateHint() {
      var $selectable, data, val, query, escapedQuery, frontMatchRegEx, match;

      $selectable = this.results.getTopSelectable();
      data = this.results.getSelectableData($selectable);

      if (data && !this.input.hasOverflow()) {
        val = this.input.getInputValue();
        query = Input.normalizeQuery(val);
        escapedQuery = _.escapeRegExChars(query);

        // match input value, then capture trailing text
        frontMatchRegEx = new RegExp('^(?:' + escapedQuery + ')(.+$)', 'i');
        match = frontMatchRegEx.exec(data.val);

        // clear hint if there's no trailing text
        match && this.input.setHint(val + match[1]);
      }
    },

    // ### public

    isEnabled: function isEnabled() {
      return this.enabled;
    },

    enable: function enable() {
      this.enabled = true;
    },

    disable: function disable() {
      this.enabled = false;
    },

    isActive: function isActive() {
      return this.active;
    },

    activate: function activate() {
      // already active
      if (this.isActive()) {
        return true;
      }

      // unable to activate either due to the typeahead being disabled
      // or due to the active event being prevented
      else if (!this.isEnabled() || this.eventBus.before('active')) {
        return false;
      }

      // activate
      else {
        this.active = true;
        this.eventBus.trigger('active');
        return true;
      }
    },

    deactivate: function deactivate() {
      // already idle
      if (!this.isActive()) {
        return true;
      }

      // unable to deactivate due to the idle event being prevented
      else if (this.eventBus.before('idle')) {
        return false;
      }

      // deactivate
      else {
        this.active = false;
        this.close();
        this.eventBus.trigger('idle');
        return true;
      }
    },

    isOpen: function isOpen() {
      return this.results.isOpen();
    },

    open: function open() {
      if (!this.isOpen() && !this.eventBus.before('open')) {
        this.results.open();
        this.eventBus.trigger('open');
      }

      return this.isOpen();
    },

    close: function close() {
      if (this.isOpen() && !this.eventBus.before('close')) {
        this.results.close();
        this.input.resetInputValue();
        this.eventBus.trigger('close');
      }
      return !this.isOpen();
    },

    setVal: function setVal(val) {
      // expect val to be a string, so be safe, and coerce
      this.input.setQuery(_.toStr(val));
    },

    getVal: function getVal() {
      return this.input.getQuery();
    },

    select: function select($selectable) {
      var data = this.results.getSelectableData($selectable);

      if (data && !this.eventBus.before('select', data.obj)) {
        this.input.setQuery(data.val, true);
        this.close();

        this.eventBus.trigger('select', data.obj);

        // return true if selection succeeded
        return true;
      }

      return false;
    },

    autocomplete: function autocomplete($selectable) {
      var query, data, isValid;

      query = this.input.getQuery();
      data = this.results.getSelectableData($selectable);
      isValid = data && query !== data.val;

      if (isValid && !this.eventBus.before('autocomplete', data.obj)) {
        this.input.setQuery(data.val);
        this.eventBus.trigger('autocompleted', data.obj);

        // return true if autocompletion succeeded
        return true;
      }

      return false;
    },

    moveCursor: function moveCursor(delta) {
      var query, $candidate, data, payload, cancelMove;

      query = this.input.getQuery();
      $candidate = this.results.selectableRelativeToCursor(delta);
      data = this.results.getSelectableData($candidate);
      payload = data ? data.obj : null;

      // update will return true when it's a new query and new results
      // need to be fetched – in this case we don't want to move the cursor
      cancelMove = query.length >= this.minLength && this.results.update(query);

      if (!cancelMove && !this.eventBus.before('cursorchange', payload)) {
        this.results.setCursor($candidate);

        // cursor moved to different selectable
        if (data) {
          this.input.setInputValue(data.val);
        }

        // cursor moved off of selectables, back to input
        else {
          this.input.resetInputValue();
          this._updateHint();
        }

        this.eventBus.trigger('cursorchanged', payload);

        // return true if move succeeded
        return true;
      }

      return false;
    },

    destroy: function destroy() {
      this.input.destroy();
      this.results.destroy();
    }
  });

  return Typeahead;

  // helper functions
  // ----------------

  function c(ctx) {
    var methods = [].slice.call(arguments, 1);

    return function() {
      var args = [].slice.call(arguments);

      _.each(methods, function(method) {
        return ctx[method].apply(ctx, args);
      });
    };
  }
})();
