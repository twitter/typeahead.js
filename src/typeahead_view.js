/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var TypeaheadView = (function() {
  var attrsKey = 'ttAttrs';

  // constructor
  // -----------

  function TypeaheadView(o) {
    var $menu, $input, $hint, sections;

    o = o || {};

    // THOUGHT: what if sections could dynamically be added/removed?
    if (!o.input || !o.sections) {
      $.error('missing input and/or sections');
    }

    this.$node = buildDomStructure(o.input, o.withHint);

    $menu = this.$node.find('.tt-dropdown-menu');
    $input = this.$node.find('.tt-input');
    $hint = this.$node.find('.tt-hint');

    this.eventBus = new EventBus({ el: $input });

    sections = initializeSections(o.sections);

    this.dropdown = new DropdownView({ menu: $menu, sections: sections })
    .onSync('suggestionClicked', this._onSuggestionClicked, this)
    .onSync('cursorMoved', this._onCursorMoved, this)
    .onSync('cursorRemoved', this._onCursorRemoved, this)
    .onSync('sectionRendered', this._onSectionRendered, this)
    .onSync('opened', this._onOpened, this)
    .onSync('closed', this._onClosed, this);

    this.input = new InputView({ input: $input, hint: $hint })
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

  _.mixin(TypeaheadView.prototype, {

    // ### private

    _onSuggestionClicked: function onSuggestionClicked(type, $el) {
      var datum;

      if (datum = this.dropdown.getDatumForSuggestion($el)) {
        this._select(datum);

        // the click event will cause the input to lose focus, so refocus
        this.input.focus();
      }
    },

    _onCursorMoved: function onCursorMoved() {
      var datum = this.dropdown.getDatumForCursor();

      this.input.clearHint();
      this.input.setInputValue(datum.value, true);
    },

    _onCursorRemoved: function onCursorRemoved() {
      this.input.resetInputValue();
      this._updateHint();
    },

    _onSectionRendered: function onSectionRendered() {
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
      this.dropdown.open();
    },

    _onBlurred: function onBlurred() {
      // don't close the menu because this was triggered by a blur event
      // and if the menu is closed, it'll prevent the probable associated
      // click event from being fired
      !this.dropdown.isMouseOverDropdown && this.dropdown.close();
    },

    _onEnterKeyed: function onEnterKeyed(type, $e) {
      var datum;

      if (datum = this.dropdown.getDatumForCursor()) {
        this._select(datum);
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
        this._autocomplete();
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.dropdown.close();
      this.input.resetInputValue();
    },

    _onUpKeyed: function onUpKeyed() {
      this.dropdown.open();
      this.dropdown.moveCursorUp();
    },

    _onDownKeyed: function onDownKeyed() {
      this.dropdown.open();
      this.dropdown.moveCursorDown();
    },

    _onLeftKeyed: function onLeftKeyed() {
      this.dir === 'rtl' && this._autocomplete();
    },

    _onRightKeyed: function onRightKeyed() {
      this.dir === 'ltr' && this._autocomplete();
    },

    _onQueryChanged: function onQueryChanged(e, query) {
      this.input.clearHint();
      this.dropdown.empty();
      this.dropdown.update(query);
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
      var datum, inputValue, query, escapedQuery, frontMatchRegEx, match;

      datum = this.dropdown.getDatumForTopSuggestion();

      if (datum && this.dropdown.isVisible() && !this.input.hasOverflow()) {
        inputValue = this.input.getInputValue();
        query = InputView.normalizeQuery(inputValue);
        escapedQuery = _.escapeRegExChars(query);

        frontMatchRegEx = new RegExp('^(?:' + escapedQuery + ')(.*$)', 'i');
        match = frontMatchRegEx.exec(datum.value);

        this.input.setHintValue(inputValue + (match ? match[1] : ''));
      }
    },

    _autocomplete: function autocomplete() {
      var hint, query, datum;

      hint = this.input.getHintValue();
      query = this.input.getQuery();

      if (hint && query !== hint && this.input.isCursorAtEnd()) {
        datum = this.dropdown.getDatumForTopSuggestion();
        datum && this.input.setInputValue(datum.value);

        this.eventBus.trigger('autocompleted', datum.raw);
      }
    },

    _select: function select(datum) {
      this.input.clearHint();
      this.input.setQuery(datum.value);
      this.input.setInputValue(datum.value, true);

      this._setLanguageDirection();

      // in ie, focus is not a synchronous event, so when a selection
      // is triggered by a click within the dropdown menu, we need to
      // defer the closing of the dropdown otherwise it'll stay open
      _.defer(_.bind(this.dropdown.close, this.dropdown));

      this.eventBus.trigger('selected', datum.raw);
    }

    // ### public

  });

  return TypeaheadView;

  function buildDomStructure(input, withHint) {
    var $input, $wrapper, $dropdown, $hint;

    $input = $(input);
    $wrapper = $(html.wrapper).css(css.wrapper);
    $dropdown = $(html.dropdown).css(css.dropdown);
    $hint = $(html.hint).css(css.hint).css(getBackgroundStyles($input));

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

    // ie7 does not like it when dir is set to auto,
    // it does not like it one bit
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

  function initializeSections(oSections) {
    return _.map(oSections, initialize);

    function initialize(oSection) { return new SectionView(oSection); }
  }
})();
