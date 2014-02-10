describe('Dropdown', function() {

  beforeEach(function() {
    var $fixture;

    jasmine.Dataset.useMock();

    setFixtures(fixtures.html.menu);

    $fixture = $('#jasmine-fixtures');
    this.$menu = $fixture.find('.tt-dropdown-menu');
    this.$menu.html(fixtures.html.dataset);

    this.view = new Dropdown({ menu: this.$menu, datasets: [{}] });
    this.dataset = this.view.datasets[0];
  });

  it('should throw an error if menu and/or datasets is missing', function() {
    expect(noMenu).toThrow();
    expect(noDatasets).toThrow();

    function noMenu() { new Dropdown({ menu: '.menu' }); }
    function noDatasets() { new Dropdown({ datasets: true }); }
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
    it('should remove pre-existing cursor', function() {
      var $first, $last;

      $first = this.$menu.find('.tt-suggestion').first();
      $last = this.$menu.find('.tt-suggestion').last();

      $first.addClass('tt-cursor');
      $last.mouseenter();

      expect($first).not.toHaveClass('tt-cursor');
      expect($last).toHaveClass('tt-cursor');
    });

    it('should set the cursor', function() {
      var $suggestion;

      $suggestion = this.$menu.find('.tt-suggestion').first();
      $suggestion.mouseenter();

      expect($suggestion).toHaveClass('tt-cursor');
    });

    it('should not trigger cursorMoved', function() {
      var spy, $suggestion;

      this.view.onSync('cursorMoved', spy = jasmine.createSpy());

      $suggestion = this.$menu.find('.tt-suggestion').first();
      $suggestion.mouseenter();

      expect(spy).not.toHaveBeenCalled();
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

  describe('when rendered is triggered on a dataset', function() {
    it('should hide the dropdown if empty', function() {
      this.dataset.isEmpty.andReturn(true);

      this.view.open();
      this.view._show();
      this.dataset.trigger('rendered');

      expect(this.$menu).not.toBeVisible();
    });

    it('should show the dropdown if not empty', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view.open();
      this.view._hide();
      this.dataset.trigger('rendered');

      expect(this.$menu).toBeVisible();
    });

    it('should trigger datasetRendered', function() {
      var spy;

      this.view.onSync('datasetRendered', spy = jasmine.createSpy());
      this.dataset.trigger('rendered');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#open', function() {
    it('should display the menu if not empty', function() {
      this.view.close();

      this.view.isEmpty = false;
      this.view.open();

      expect(this.$menu).toBeVisible();
    });

    it('should not display the menu if empty', function() {
      this.view.close();

      this.view.isEmpty = true;
      this.view.open();

      expect(this.$menu).not.toBeVisible();
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

      $suggestion = $('<div>').data({ ttValue: 'one', ttDatum: 'two' });
      datum = this.view.getDatumForSuggestion($suggestion);

      expect(datum).toEqual({ value: 'one', raw: 'two' });
    });

    it('should return null if no element is given', function() {
      expect(this.view.getDatumForSuggestion($('notreal'))).toBeNull();
    });
  });

  describe('#getDatumForCursor', function() {
    it('should return the datum for the cursor', function() {
      var $first;

      $first = this.view._getSuggestions().eq(0);
      $first.data({ ttValue: 'one', ttDatum: 'two' });

      this.view._setCursor($first);
      expect(this.view.getDatumForCursor())
      .toEqual({ value: 'one', raw: 'two' });
    });
  });

  describe('#getDatumForTopSuggestion', function() {
    it('should return the datum for top suggestion', function() {
      var $first;

      $first = this.view._getSuggestions().eq(0);
      $first.data({ ttValue: 'one', ttDatum: 'two' });

      expect(this.view.getDatumForTopSuggestion())
      .toEqual({ value: 'one', raw: 'two' });
    });
  });

  describe('#update', function() {
    it('should invoke update on each dataset', function() {
      this.view.update();
      expect(this.dataset.update).toHaveBeenCalled();
    });
  });

  describe('#empty', function() {
    it('should invoke clear on each dataset', function() {
      this.view.empty();
      expect(this.dataset.clear).toHaveBeenCalled();
    });
  });

  describe('#isVisible', function() {
    it('should return true if open and not empty', function() {
      this.view.isOpen = true;
      this.view.isEmpty = false;

      expect(this.view.isVisible()).toBe(true);

      this.view.isOpen = false;
      this.view.isEmpty = false;

      expect(this.view.isVisible()).toBe(false);

      this.view.isOpen = true;
      this.view.isEmpty = true;

      expect(this.view.isVisible()).toBe(false);

      this.view.isOpen = false;
      this.view.isEmpty = false;

      expect(this.view.isVisible()).toBe(false);
    });
  });

  describe('#destroy', function() {
    it('should remove event handlers', function() {
      var $menu = this.view.$menu;

      spyOn($menu, 'off');

      this.view.destroy();

      expect($menu.off).toHaveBeenCalledWith('.tt');
    });

    it('should destroy its datasets', function() {
      this.view.destroy();

      expect(this.dataset.destroy).toHaveBeenCalled();
    });

    it('should null out its reference to the menu element', function() {
      this.view.destroy();

      expect(this.view.$menu).toBeNull();
    });
  });
});
