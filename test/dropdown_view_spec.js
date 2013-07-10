describe('DropdownView', function() {

  beforeEach(function() {
    var $fixture;

    jasmine.SectionView.useMock();

    setFixtures(fixtures.html.menu);

    $fixture = $('#jasmine-fixtures');
    this.$menu = $fixture.find('.tt-dropdown-menu');
    this.$menu.html(fixtures.html.section);

    this.section = new SectionView();

    this.view = new DropdownView({
      menu: this.$menu,
      sections: [this.section]
    });
  });

  it('should throw an error if menu and/or sections is missing', function() {
    expect(noMenu).toThrow();
    expect(noSections).toThrow();

    function noMenu() { new DropdownView({ menu: '.menu' }); }
    function noSections() { new DropdownView({ sections: true }); }
  });

  describe('when mouseenter is triggered', function() {
    it('should set isMouseOverDropdown to true', function() {
      this.$menu.mouseleave().mouseenter();
      expect(this.view.isMouseOverDropdown).toBe(true);
    });
  });

  describe('when mouseleave is triggered', function() {
    it('should set isMouseOverDropdown to false', function() {
      this.$menu.mouseenter().mouseleave();
      expect(this.view.isMouseOverDropdown).toBe(false);
    });
  });

  describe('when click event is triggered on a suggestion', function() {
    it('should trigger suggestionClicked', function() {
      var spy;

      this.view.onSync('suggestionClicked', spy = jasmine.createSpy());

      this.$menu.find('.tt-suggestion').first().click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when mouseenter is triggered on a suggestion', function() {
    it('should set the cursor', function() {
      var $suggestion;

      $suggestion = this.$menu.find('.tt-suggestion').first();
      $suggestion.mouseenter();

      expect($suggestion).toHaveClass('tt-cursor');
    });
  });

  describe('when mouseleave is triggered on a suggestion', function() {
    it('should remove the cursor', function() {
      var $suggestion;

      $suggestion = this.$menu.find('.tt-suggestion').first();
      $suggestion.mouseenter().mouseleave();

      expect($suggestion).not.toHaveClass('tt-cursor');
    });
  });

  describe('when rendered is triggered on a section', function() {
    it('should trigger sectionRendered', function() {
      var spy;

      this.view.onSync('sectionRendered', spy = jasmine.createSpy());
      this.section.trigger('rendered');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#open', function() {
    it('should display the menu', function() {
      this.view.close();
      this.view.open();

      expect(this.$menu).toBeVisible();
    });

    it('should trigger opened', function() {
      var spy;

      this.view.onSync('opened', spy = jasmine.createSpy());

      this.view.close();
      this.view.open();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#close', function() {
    it('should hide the menu', function() {
      this.view.open();
      this.view.close();

      expect(this.$menu).not.toBeVisible();
    });

    it('should trigger closed', function() {
      var spy;

      this.view.onSync('closed', spy = jasmine.createSpy());

      this.view.open();
      this.view.close();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#setLanguageDirection', function() {
    it('should update css for given language direction', function() {
      // TODO: eh, the toHaveCss matcher doesn't seem to work very well
      /*
      this.view.setLanguageDirection('rtl');
      expect(this.$menu).toHaveCss({ left: 'auto', right: '0px' });

      this.view.setLanguageDirection('ltr');
      expect(this.$menu).toHaveCss({ left: '0px', right: 'auto' });
      */
    });
  });

  describe('#moveCursorUp', function() {
    beforeEach(function() {
      this.view.open();
    });

    it('should move the cursor up', function() {
      var $first, $second;

      $first = this.view._getSuggestions().eq(0);
      $second = this.view._getSuggestions().eq(1);

      this.view._setCursor($second);
      this.view.moveCursorUp();
      expect(this.view._getCursor()).toBe($first);
    });

    it('should move cursor to bottom if cursor is not present', function() {
      var $bottom;

      $bottom = this.view._getSuggestions().eq(-1);

      this.view.moveCursorUp();
      expect(this.view._getCursor()).toBe($bottom);
    });

    it('should remove cursor if already at top', function() {
      var $first;

      $first = this.view._getSuggestions().eq(0);

      this.view._setCursor($first);
      this.view.moveCursorUp();
      expect(this.view._getCursor().length).toBe(0);
    });
  });

  describe('#moveCursorDown', function() {
    beforeEach(function() {
      this.view.open();
    });

    it('should move the cursor down', function() {
      var $first, $second;

      $first = this.view._getSuggestions().eq(0);
      $second = this.view._getSuggestions().eq(1);

      this.view._setCursor($first);
      this.view.moveCursorDown();
      expect(this.view._getCursor()).toBe($second);
    });

    it('should move cursor to top if cursor is not present', function() {
      var $first;

      $first = this.view._getSuggestions().eq(0);

      this.view.moveCursorDown();
      expect(this.view._getCursor()).toBe($first);
    });

    it('should remove cursor if already at bottom', function() {
      var $bottom;

      $bottom = this.view._getSuggestions().eq(-1);

      this.view._setCursor($bottom);
      this.view.moveCursorDown();
      expect(this.view._getCursor().length).toBe(0);
    });
  });

  describe('#getDatumForSuggestion', function() {
    it('should extract the datum from the suggestion element', function() {
      var $suggestion, datum;

      $suggestion = $('<div>').data('ttDatum', { value: 'one' });
      datum = this.view.getDatumForSuggestion($suggestion);

      expect(datum).toEqual({ value: 'one' });
    });

    it('should return null if no element is given', function() {
      expect(this.view.getDatumForSuggestion($('notreal'))).toBeNull();
    });
  });

  describe('#getDatumForCursor', function() {
    it('should return the datum for the cursor', function() {
      var $first;

      $first = this.view._getSuggestions().eq(0);
      $first.data('ttDatum', { value: 'one' });

      this.view._setCursor($first);
      expect(this.view.getDatumForCursor()).toEqual({ value: 'one' });
    });
  });

  describe('#getDatumForTopSuggestion', function() {
    it('should return the datum for top suggestion', function() {
      var $first;

      $first = this.view._getSuggestions().eq(0);
      $first.data('ttDatum', { value: 'one' });

      expect(this.view.getDatumForTopSuggestion()).toEqual({ value: 'one' });
    });
  });

  describe('#update', function() {
    it('should invoke update on each section', function() {
      this.view.update();
      expect(this.section.update).toHaveBeenCalled();
    });
  });

  describe('#empty', function() {
    it('should invoke clear on each section', function() {
      this.view.empty();
      expect(this.section.clear).toHaveBeenCalled();
    });
  });

  describe('#isEmpty', function() {
    it('should return false if a header or footer is present', function() {
      this.section.isEmpty.andReturn(true);
      this.$menu.append('<div class="footer">');

      expect(this.view.isEmpty()).toBe(false);
    });

    it('should return false if a section is not empty', function() {
      this.section.isEmpty.andReturn(false);

      expect(this.view.isEmpty()).toBe(false);
    });

    it('should return true otherwise', function() {
      this.section.isEmpty.andReturn(true);

      expect(this.view.isEmpty()).toBe(true);
    });
  });
});
