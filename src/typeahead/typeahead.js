/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Typeahead = (function() {
  var attrsKey = 'ttAttrs';

  // constructor
  // -----------

  // THOUGHT: what if datasets could dynamically be added/removed?
  function Typeahead(o) {
    var $menu, $input, $hint, datasets;

    o = o || {};

    if (!o.input) {
      $.error('missing input');
    }

    this.autoselect = !!o.autoselect;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
    this.$node = buildDomStructure(o.input, o.withHint);

    $menu = this.$node.find('.tt-dropdown-menu');
    $input = this.$node.find('.tt-input');
    $hint = this.$node.find('.tt-hint');

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

    // #351: prevents input blur on menu click
    $menu.on('mousedown.tt', function($e) {
      if (_.isMsie() && _.isMsie() < 9) {
        $input[0].onbeforedeactivate = function() {
          window.event.returnValue = false;
          $input[0].onbeforedeactivate = null;
        };
      }

      // ie 9+ and other browsers
      $e.preventDefault();
    });
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

      this.input.clearHint();
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
      this.dropdown.empty();
      this.dropdown.open();
    },

    _onBlurred: function onBlurred() {
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
        this._autocomplete();
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.dropdown.close();
      this.input.resetInputValue();
    },

    _onUpKeyed: function onUpKeyed() {
      var query = this.input.getQuery();

      if(!this.dropdown.isOpen && query.length >= this.minLength) {
        this.dropdown.update(query);
      }

      this.dropdown.open();
      this.dropdown.moveCursorUp();
    },

    _onDownKeyed: function onDownKeyed() {
      var query = this.input.getQuery();

      if( !this.dropdown.isOpen && query.length >= this.minLength) {
        this.dropdown.update(query);
      }

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
      query.length >= this.minLength && this.dropdown.update(query);
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
        query = Input.normalizeQuery(inputValue);
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

        this.eventBus.trigger('autocompleted', datum.raw, datum.datasetName);
      }
    },

    _select: function select(datum) {
      this.input.clearHint();
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

    getQuery: function getQuery() {
      return this.input.getQuery();
    },

    setQuery: function setQuery(val) {
      this.input.setInputValue(val);
    },

    destroy: function destroy() {
      this.input.destroy();
      this.dropdown.destroy();

      destroyDomStructure(this.$node);

      this.$node = null;
    }
  });

  return Typeahead;

  function buildDomStructure(input, withHint) {
    var $input, $wrapper, $dropdown, $hint;

    $input = $(input);
    $wrapper = $(html.wrapper).css(css.wrapper);
    $dropdown = $(html.dropdown).css(css.dropdown);
    $hint = $input.clone().css(css.hint).css(getBackgroundStyles($input));

    $hint
    .val('')
    .removeData()
    .addClass('tt-hint')
    .removeAttr('id name placeholder')
    .prop('disabled', true)
    .attr({ autocomplete: 'off', spellcheck: 'false' });

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
