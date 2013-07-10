/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var DropdownView = (function() {

  // constructor
  // -----------

  function DropdownView(o) {
    var that = this, onMouseEnter, onMouseLeave, onSuggestionClick,
        onSuggestionMouseEnter, onSuggestionMouseLeave;

    o = o || {};

    if (!o.menu || !o.sections) {
      $.error('menu and/or sections are required');
    }

    this.isOpen = false;
    this.isMouseOverDropdown = false;

    this.sections = o.sections;

    // bound functions
    onMouseEnter = utils.bind(this._onMouseEnter, this);
    onMouseLeave = utils.bind(this._onMouseLeave, this);
    onSuggestionClick = utils.bind(this._onSuggestionClick, this);
    onSuggestionMouseEnter = utils.bind(this._onSuggestionMouseEnter, this);
    onSuggestionMouseLeave = utils.bind(this._onSuggestionMouseLeave, this);

    this.$menu = $(o.menu)
    .on('mouseenter.tt', onMouseEnter)
    .on('mouseleave.tt', onMouseLeave)
    .on('click.tt', '.tt-suggestion', onSuggestionClick)
    .on('mouseenter.tt', '.tt-suggestion', onSuggestionMouseEnter)
    .on('mouseleave.tt', '.tt-suggestion', onSuggestionMouseLeave);

    utils.each(this.sections, function(i, section) {
      that.$menu.append(section.getRoot());
      section.onSync('rendered', that._onRendered, that);
    });
  }

  // instance methods
  // ----------------

  utils.mixin(DropdownView.prototype, EventEmitter, {

    // ### private

    _onMouseEnter: function onMouseEnter($e) {
      this.isMouseOverDropdown = true;
    },

    _onMouseLeave: function onMouseLeave($e) {
      this.isMouseOverDropdown = false;
    },

    _onSuggestionClick: function onSuggestionClick($e) {
      this.trigger('suggestionClicked', $($e.currentTarget));
    },

    _onSuggestionMouseEnter: function onSuggestionMouseEnter($e) {
      this._setCursor($($e.currentTarget));
    },

    _onSuggestionMouseLeave: function onSuggestionMouseLeave($e) {
      this._removeCursor();
    },

    _onRendered: function onRendered() {
      this.trigger('sectionRendered');
    },

    _getSuggestions: function getSuggestions() {
      return this.$menu.find('.tt-suggestion');
    },

    _getCursor: function getCursor() {
      return this.$menu.find('.tt-cursor').first();
    },

    _setCursor: function setCursor($el) {
      $el.first().addClass('tt-cursor');
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

      this.trigger('cursorMoved');
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
        this.isOpen = this.isMouseOverDropdown = false;

        this._removeCursor();
        this.$menu.hide();

        this.trigger('closed');
      }
    },

    open: function open() {
      if (!this.isOpen) {
        this.isOpen = true;

        // can't use jQuery#show because $menu is a span element we want
        // display: block; not dislay: inline;
        this.$menu.css('display', 'block');

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
      return $el.length ? SectionView.extractDatum($el) : null;
    },

    getDatumForCursor: function getDatumForCursor() {
      return this.getDatumForSuggestion(this._getCursor().first());
    },

    getDatumForTopSuggestion: function getDatumForTopSuggestion() {
      return this.getDatumForSuggestion(this._getSuggestions().first());
    },

    update: function update(query) {
      utils.each(this.sections, updateSection);

      function updateSection(i, section) { section.update(query); }
    },

    empty: function empty() {
      utils.each(this.sections, clearSection);

      function clearSection(i, section) { section.clear(); }
    },

    isEmpty: function isEmpty() {
      var hasHeaderOrFooter, sectionsAreEmpty;

      sectionsAreEmpty = utils.every(this.sections, isSectionEmpty);
      hasHeaderOrFooter =
        !!this.$menu.children(':not([class^="tt-section-"])').length;

      return !hasHeaderOrFooter && sectionsAreEmpty;

      function isSectionEmpty(section) { return section.isEmpty(); }
    }
  });

  return DropdownView;

})();
