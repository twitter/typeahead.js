describe('DropdownView', function() {
  var fixture = '<ol class="tt-dropdown-menu" style="display: none;"></ol>';

  beforeEach(function() {
    var $fixtures;

    setFixtures(fixture);

    $fixtures = $('#jasmine-fixtures');
    this.$menu = $fixtures.find('.tt-dropdown-menu');

    this.dropdownView = new DropdownView({ menu: this.$menu });
  });

  // event listeners
  // ---------------

  describe('on mouseenter', function() {
    beforeEach(function() {
      renderTestDataset(this.dropdownView, true);

      this.$menu.mouseleave().mouseenter();
    });

    it('should set isMouseOverDropdown to true', function() {
      expect(this.dropdownView.isMouseOverDropdown).toBe(true);
    });
  });

  describe('on mouseleave', function() {
    beforeEach(function() {
      this.$menu.mouseenter().mouseleave();
    });

    it('should set isMouseOverDropdown to false', function() {
      expect(this.dropdownView.isMouseOverDropdown).toBe(false);
    });
  });

  describe('on suggestion mouseover', function() {
    beforeEach(function() {
      this.dropdownView.on('cursorMoved', this.spy = jasmine.createSpy());

      this.$testDataset = renderTestDataset(this.dropdownView, true);

      this.$suggestion1 = this.$testDataset.find('.tt-suggestion:nth-child(1)');
      this.$suggestion2 = this.$testDataset.find('.tt-suggestion:nth-child(2)');
      this.$suggestion3 = this.$testDataset.find('.tt-suggestion:nth-child(3)');

      // start with suggestion1 highlighted
      this.$suggestion1.addClass('tt-is-under-cursor');

      this.$suggestion2.mouseover();
    });

    it('should add tt-is-under-cursor class to suggestion', function() {
      expect(this.$suggestion2).toHaveClass('tt-is-under-cursor');
    });

    it('should remove tt-is-under-cursor class from other suggestions',
    function() {
      expect(this.$suggestion1).not.toHaveClass('tt-is-under-cursor');
      expect(this.$suggestion3).not.toHaveClass('tt-is-under-cursor');
    });
  });

  describe('on suggestion click', function() {
    beforeEach(function() {
      this.dropdownView
      .on('suggestionSelected', this.spy = jasmine.createSpy());

      this.$testDataset = renderTestDataset(this.dropdownView, true);

      this.$suggestion = this.$testDataset.find('.tt-suggestion:nth-child(1)');
      this.$suggestion.click();
    });

    it('should trigger suggestionSelected', function() {
      expect(this.spy).toHaveBeenCalledWith({
        type: 'suggestionSelected',
        data: {
          value: 'one',
          tokens: ['one'],
          datum: { value: 'one' },
          dataset: 'test'
        }
      });
    });
  });

  // public methods
  // --------------

  describe('#closeUnlessMouseIsOverDropdown', function() {
    beforeEach(function() {
      spyOn(this.dropdownView, 'close');
    });

    describe('if isMouseOverDropdown is true', function() {
      beforeEach(function() {
        this.dropdownView.isMouseOverDropdown = true;
        this.dropdownView.closeUnlessMouseIsOverDropdown();
      });

      it('should not call close', function() {
        expect(this.dropdownView.close).not.toHaveBeenCalled();
      });
    });

    describe('if isMouseOverDropdown is false', function() {
      beforeEach(function() {
        this.dropdownView.isMouseOverDropdown = false;
        this.dropdownView.closeUnlessMouseIsOverDropdown();
      });

      it('should call close', function() {
        expect(this.dropdownView.close).toHaveBeenCalled();
      });
    });
  });

  describe('#destroy', function() {
    beforeEach(function() {
      this.dropdownView.destroy();
    });

    it('should remove event listeners', function() {
      expect($._data(this.$menu, 'events')).toBeUndefined();
    });

    it('should drop references to DOM elements', function() {
      expect(this.dropdownView.$menu).toBeNull();
    });
  });

  describe('#close', function() {
    describe('if open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
        this.dropdownView.on('closed', this.spy = jasmine.createSpy());

        this.$menu
        .find('.tt-suggestions > .tt-suggestion')
        .addClass('.tt-is-under-cursor');

        // HACK: let's just assume this has been set to true
        this.dropdownView.isMouseOverDropdown = true;

        this.dropdownView.close();
      });

      it('should close menu', function() {
        expect(this.$menu).toBeHidden();
      });

      it('should remove tt-is-under-cursor class from suggestions', function() {
        var $suggestions = this.$menu.find('.tt-suggestion');

        expect($suggestions).not.toHaveClass('tt-is-under-cursor');
      });

      it('should set isMouseOverDropdown to false', function() {
        expect(this.dropdownView.isMouseOverDropdown).toBe(false);
      });

      it('should trigger closed', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });

    describe('if not open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);
        this.dropdownView.on('closed', this.spy = jasmine.createSpy());

        this.dropdownView.close();
      });

      it('should keep menu hidden', function() {
        expect(this.$menu).toBeHidden();
      });

      it('should not trigger closed', function() {
        expect(this.spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('#open', function() {
    describe('if open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
        this.dropdownView.on('opened', this.spy = jasmine.createSpy());

        this.dropdownView.open();
      });

      it('should keep menu visible', function() {
        expect(this.$menu).toBeVisible();
      });

      it('should not trigger opened', function() {
        expect(this.spy).not.toHaveBeenCalled();
      });
    });

    describe('if not open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);
        this.dropdownView.on('opened', this.spy = jasmine.createSpy());

        this.dropdownView.open();
      });

      it('should make menu visible', function() {
        expect(this.$menu).toBeVisible();
      });

      it('should trigger opened', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });
  });

  describe('#moveCursorUp', function() {
    beforeEach(function() {
      this.dropdownView
      .on('cursorMoved', this.cursorMovedSpy = jasmine.createSpy())
      .on('cursorRemoved', this.cursorRemovedSpy = jasmine.createSpy());
    });

    describe('if not visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);

        this.dropdownView.moveCursorUp();
      });

      it('should not move the cursor to any suggestion', function() {
        expect(this.$menu.find('.tt-is-under-cursor')).not.toExist();
      });

      it('should not trigger cursorMoved', function() {
        expect(this.cursorMovedSpy).not.toHaveBeenCalled();
      });

      it('should not trigger cursorRemoved', function() {
        expect(this.cursorRemovedSpy).not.toHaveBeenCalled();
      });
    });

    describe('if visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
      });

      it('should ensure the cursor is visible', function() {
        spyOn(this.dropdownView, '_ensureVisibility');
        this.dropdownView.moveCursorUp();
        expect(this.dropdownView._ensureVisibility).toHaveBeenCalled();
      });

      describe('if no suggestion is under the cursor', function() {
        beforeEach(function() {
          this.dropdownView.moveCursorUp();
        });

        it('should move cursor to last suggestion', function() {
          var $lastSuggestion = this.$menu
              .find('.tt-suggestion')
              .last(),
              $suggestionUnderCursor = this.$menu.find('.tt-is-under-cursor');

          expect($lastSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorMoved', function() {
          expect(this.cursorMovedSpy).toHaveBeenCalled();
        });
      });

      describe('if the last suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$menu
          .find('.tt-suggestion')
          .last()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorUp();
        });

        it('should move cursor to previous suggestion', function() {
          var $suggestionUnderCursor = this.$menu.find('.tt-is-under-cursor'),
               $prevSuggestion = this.$menu
              .find('.tt-suggestion')
              .last()
              .prev();

          expect($prevSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorMoved', function() {
          expect(this.cursorMovedSpy).toHaveBeenCalled();
        });
      });

      describe('if the first suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$menu
          .find('.tt-suggestion')
          .first()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorUp();
        });

        it('should remove the cursor', function() {
          var $suggestionUnderCursor = this.$menu.find('.tt-is-under-cursor');

          expect($suggestionUnderCursor).not.toExist();
        });

        it('should trigger cursorRemoved', function() {
          expect(this.cursorRemovedSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('#moveCursorDown', function() {
    beforeEach(function() {
      this.dropdownView
      .on('cursorMoved', this.cursorMovedSpy = jasmine.createSpy())
      .on('cursorRemoved', this.cursorRemovedSpy = jasmine.createSpy());
    });

    describe('if not visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);

        this.dropdownView.moveCursorDown();
      });

      it('should not move the cursor to any suggestion', function() {
        expect(this.$menu.find('.tt-is-under-cursor')).not.toExist();
      });

      it('should not trigger cursorMoved', function() {
        expect(this.cursorMovedSpy).not.toHaveBeenCalled();
      });

      it('should not trigger cursorRemoved', function() {
        expect(this.cursorRemovedSpy).not.toHaveBeenCalled();
      });
    });

    describe('if visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
      });

      it('should ensure the cursor is visible', function() {
        spyOn(this.dropdownView, '_ensureVisibility');
        this.dropdownView.moveCursorUp();
        expect(this.dropdownView._ensureVisibility).toHaveBeenCalled();
      });

      describe('if no suggestion is under the cursor', function() {
        beforeEach(function() {
          this.dropdownView.moveCursorDown();
        });

        it('should move cursor to first suggestion', function() {
          var $firstSuggestion = this.$menu
              .find('.tt-suggestion').first(),
              $suggestionUnderCursor = this.$menu
              .find('.tt-is-under-cursor');

          expect($firstSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorMoved', function() {
          expect(this.cursorMovedSpy).toHaveBeenCalled();
        });
      });

      describe('if the first suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$menu
          .find('.tt-suggestion')
          .first()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorDown();
        });

        it('should move cursor to next suggestion', function() {
          var $suggestionUnderCursor = this.$menu.find('.tt-is-under-cursor'),
               $nextSuggestion = this.$menu
              .find('.tt-suggestion')
              .first()
              .next();

          expect($nextSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorMoved', function() {
          expect(this.cursorMovedSpy).toHaveBeenCalled();
        });
      });

      describe('if the last suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$menu
          .find('.tt-suggestion')
          .last()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorDown();
        });

        it('should remove the cursor', function() {
          var $suggestionUnderCursor = this.$menu.find('.tt-is-under-cursor');

          expect($suggestionUnderCursor).not.toExist();
        });

        it('should trigger cursorRemoved', function() {
          expect(this.cursorRemovedSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('#getSuggestionUnderCursor', function() {
    beforeEach(function() {
      this.$testDataset = renderTestDataset(this.dropdownView, true);
    });

    describe('if no suggestion is under the cursor', function() {
      it('should return null', function() {
        expect(this.dropdownView.getSuggestionUnderCursor()).toBeNull();
      });
    });

    describe('if suggestion is under the cursor', function() {
      it('should return obj with data about suggestion under the cursor',
      function() {
        var suggestion;

        this.$menu
        .find('.tt-suggestion')
        .first()
        .addClass('tt-is-under-cursor');

        suggestion = this.dropdownView.getSuggestionUnderCursor();

        expect(suggestion).toEqual({
          value: 'one',
          tokens: ['one'],
          datum: { value: 'one' },
          dataset: 'test'
        });
      });
    });
  });

  describe('#getFirstSuggestion', function() {
    beforeEach(function() {
      this.$testDataset = renderTestDataset(this.dropdownView, true);
    });

    it('should return obj with data about suggestion under the cursor',
    function() {
      var suggestion = this.dropdownView.getFirstSuggestion();
      expect(suggestion).toEqual({
        value: 'one',
        tokens: ['one'],
        datum: { value: 'one' },
        dataset: 'test'
      });
    });
  });

  describe('#renderSuggestions', function() {
    var template = function(c) { return '<p>' + c.value + '</p>'; },
        mockOldDataset = {
          name: 'test',
          template: template
        },
        mockNewDataset = {
          name: 'new',
          header: '<h1>header</h1>',
          footer: '<h1>footer</h1>',
          template: template
        };

    beforeEach(function() {
      this.$testDataset = renderTestDataset(this.dropdownView, true);
    });

    describe('if new dataset', function() {
      beforeEach(function() {
        this.dropdownView.renderSuggestions(mockNewDataset, []);
      });

      it('should render the header', function() {
        var $header = this.$menu.find('.tt-dataset-new').children().first();
        expect($header).toBe('h1');
        expect($header).toHaveText('header');
      });

      it('should render the footer', function() {
        var $footer = this.$menu.find('.tt-dataset-new').children().last();
        expect($footer).toBe('h1');
        expect($footer).toHaveText('footer');
      });

      it('should append new list for dataset', function() {
        expect(this.$menu.find('.tt-dataset-new > .tt-suggestions')).toExist();
      });
    });

    describe('if there are no suggestions', function() {
      beforeEach(function() {
        this.dropdownView
        .on('suggestionsRendered', this.spy = jasmine.createSpy());

        spyOn(this.dropdownView, 'clearSuggestions');

        this.dropdownView.renderSuggestions(mockOldDataset, []);
      });

      it('should call clearSuggestions', function() {
        expect(this.dropdownView.clearSuggestions).toHaveBeenCalledWith('test');
      });

      it('should trigger suggestionsRendered', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });

    describe('if there are suggestions', function() {
      beforeEach(function() {
        this.dropdownView
        .on('suggestionsRendered', this.spy = jasmine.createSpy());

        spyOn(this.dropdownView, 'clearSuggestions').andCallThrough();

        this.dropdownView.renderSuggestions(
          mockOldDataset,
          [{ datum: { value: 'i am a value' } }]
        );
      });

      it('should overwrite previous suggestions', function() {
        var $suggestions = this.$testDataset.children(),
            $suggestion = $suggestions.first(),
            datum = $suggestion.data('suggestion').datum;

        expect($suggestions.length).toBe(1);
        expect($suggestion).toHaveText('i am a value');
        expect(datum).toEqual({ value: 'i am a value' });
      });

      it('should trigger suggestionsRendered', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });
  });

  describe('#clearSuggestions', function() {
    beforeEach(function() {
      renderTestDataset(this.dropdownView, true);
      this.dropdownView.clearSuggestions();
    });

    it('should hide all datasets', function() {
      expect(this.$menu.find('[class^="tt-dataset-"]')).toBeHidden();
    });

    it('should remove all suggestions', function() {
      expect(this.$menu.find('.tt-suggestion')).not.toExist();
    });

    it('should close menu', function() {
      expect(this.$menu).toBeHidden();
    });
  });

  // helper functions
  // ----------------

  function renderTestDataset(view, open) {
    var mockDataset = {
          name: 'test' ,
          template: function(c) { return '<p>' + c.value + '</p>'; }
        },
         mockSuggestions = [
          { value: 'one', tokens: ['one'], datum: { value: 'one' } },
          { value: 'two', tokens: ['two'], datum: { value: 'two' } },
          { value: 'three', tokens: ['three'], datum: { value: 'three' } }
        ];

    view.renderSuggestions(mockDataset, mockSuggestions);
    open && view.open();

    return $('#jasmine-fixtures .tt-dataset-test > .tt-suggestions');
  }
});
