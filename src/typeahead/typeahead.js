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

    if (!o.input) {
      $.error('missing input');
    }

    this.isActivated = false;
    this.autoselect = !!o.autoselect;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
    this.$node = buildDom(o.input, o.withHint);

    $menu = this.$node.find('.tt-dropdown-menu');
    $input = this.$node.find('.tt-input');
    $hint = this.$node.find('.tt-hint');

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
      var datum;

      if (datum = this.dropdown.getDatumForSuggestion($el)) {
        this._select(datum);
      }
    },

    _onCursorMoved: function onCursorMoved() {
      var datum = this.dropdown.getDatumForCursor();

      this.input.setInputValue(datum.value, true);

      this.eventBus.trigger('cursorchanged', datum.raw, datum.datasetName);
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
      this.dropdown.open();
    },

    _onBlurred: function onBlurred() {
      this.isActivated = false;
      this.dropdown.empty();
      this.dropdown.close();
    },

    _onEnterKeyed: function onEnterKeyed(type, $e) {
      var cursorDatum, topSuggestionDatum;

      cursorDatum = this.dropdown.getDatumForCursor();
      topSuggestionDatum = this.dropdown.getDatumForTopSuggestion();

      if (cursorDatum) {
        this._select(cursorDatum);
        $e.preventDefault();
      }

      else if (this.autoselect && topSuggestionDatum) {
        this._select(topSuggestionDatum);
        $e.preventDefault();
      }
    },

    _onTabKeyed: function onTabKeyed(type, $e) {
      var datum;

      if (datum = this.dropdown.getDatumForCursor()) {
        this._select(datum);
        $e.preventDefault();
      }

      else {
        this._autocomplete(true);
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.dropdown.close();
      this.input.resetInputValue();
    },

    _onUpKeyed: function onUpKeyed() {
      var query = this.input.getQuery();

      this.dropdown.isEmpty && query.length >= this.minLength ?
        this.dropdown.update(query) :
        this.dropdown.moveCursorUp();

      this.dropdown.open();
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
        this.$node.css('direction', dir);
        this.dropdown.setLanguageDirection(dir);
      }
    },

    _updateHint: function updateHint() {
      var datum, val, query, escapedQuery, frontMatchRegEx, match;

      datum = this.dropdown.getDatumForTopSuggestion();

      if (datum && this.dropdown.isVisible() && !this.input.hasOverflow()) {
        val = this.input.getInputValue();
        query = Input.normalizeQuery(val);
        escapedQuery = _.escapeRegExChars(query);

        // match input value, then capture trailing text
        frontMatchRegEx = new RegExp('^(?:' + escapedQuery + ')(.+$)', 'i');
        match = frontMatchRegEx.exec(datum.value);

        // clear hint if there's no trailing text
        match ? this.input.setHint(val + match[1]) : this.input.clearHint();
      }

      else {
        this.input.clearHint();
      }
    },

    _autocomplete: function autocomplete(laxCursor) {
      var hint, query, isCursorAtEnd, datum;

      hint = this.input.getHint();
      query = this.input.getQuery();
      isCursorAtEnd = laxCursor || this.input.isCursorAtEnd();

      if (hint && query !== hint && isCursorAtEnd) {
        datum = this.dropdown.getDatumForTopSuggestion();
        datum && this.input.setInputValue(datum.value);

        this.eventBus.trigger('autocompleted', datum.raw, datum.datasetName);
      }
    },

    _select: function select(datum) {
      this.input.setQuery(datum.value);
      this.input.setInputValue(datum.value, true);

      this._setLanguageDirection();

      this.eventBus.trigger('selected', datum.raw, datum.datasetName);
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

      destroyDomStructure(this.$node);

      this.$node = null;
    }
  });

  return Typeahead;

  function buildDom(input, withHint) {
    var $input, $wrapper, $dropdown, $hint;

    $input = $(input);
    $wrapper = $(html.wrapper).css(css.wrapper);
    $dropdown = $(html.dropdown).css(css.dropdown);
    $hint = $input.clone().css(css.hint).css(getBackgroundStyles($input));

    $hint
    .val('')
    .removeData()
    .addClass('tt-hint')
    .removeAttr('id name placeholder required')
    .prop('readonly', true)
    .attr({ autocomplete: 'off', spellcheck: 'false', tabindex: -1 });

    // store the original values of the attrs that get modified
    // so modifications can be reverted on destroy
    $input.data(attrsKey, {
      dir: $input.attr('dir'),
      autocomplete: $input.attr('autocomplete'),
      spellcheck: $input.attr('spellcheck'),
      style: $input.attr('style')
    });

    $input
    .addClass('tt-input')
    .attr({ autocomplete: 'off', spellcheck: false })
    .css(withHint ? css.input : css.inputWithNoHint);

    // ie7 does not like it when dir is set to auto
    try { !$input.attr('dir') && $input.attr('dir', 'auto'); } catch (e) {}

    return $input
    .wrap($wrapper)
    .parent()
    .prepend(withHint ? $hint : null)
    .append($dropdown);
  }

  function getBackgroundStyles($el) {
    return {
      backgroundAttachment: $el.css('background-attachment'),
      backgroundClip: $el.css('background-clip'),
      backgroundColor: $el.css('background-color'),
      backgroundImage: $el.css('background-image'),
      backgroundOrigin: $el.css('background-origin'),
      backgroundPosition: $el.css('background-position'),
      backgroundRepeat: $el.css('background-repeat'),
      backgroundSize: $el.css('background-size')
    };
  }

  function destroyDomStructure($node) {
    var $input = $node.find('.tt-input');

    // need to remove attrs that weren't previously defined and
    // revert attrs that originally had a value
    _.each($input.data(attrsKey), function(val, key) {
      _.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
    });

    $input
    .detach()
    .removeData(attrsKey)
    .removeClass('tt-input')
    .insertAfter($node);

    $node.remove();
  }
})();
