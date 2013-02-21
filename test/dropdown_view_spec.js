describe('DropdownView', function() {
  var fixture = '<ol class="tt-dropdown-menu" style="display: none;"></ol>';

  beforeEach(function() {
    var $fixtures;

    setFixtures(fixture);

    $fixtures = $('#jasmine-fixtures');
    this.$menu = $fixtures.find('.tt-dropdown-menu');

    this.dropdownView = new DropdownView({ menu: this.$menu });
  });

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
      this.dropdownView.on('cursorOn', this.spy = jasmine.createSpy());

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
      this.dropdownView.on('select', this.spy = jasmine.createSpy());
      this.$testDataset = renderTestDataset(this.dropdownView, true);

      this.$suggestion = this.$testDataset
      .data('query', 'test query')
      .data('dataset', 'test dataset')
      .find('.tt-suggestion:nth-child(1)')
      .click();
    });

    it('should trigger select', function() {
      expect(this.spy).toHaveBeenCalledWith({
        type: 'select',
        data: {
          query: 'test query',
          dataset: 'test dataset',
          value: 'one'
        }
      });
    });
  });

  describe('#hideUnlessMouseIsOverDropdown', function() {
    beforeEach(function() {
      spyOn(this.dropdownView, 'hide');
    });

    describe('if isMouseOverDropdown is true', function() {
      beforeEach(function() {
        this.dropdownView.isMouseOverDropdown = true;
        this.dropdownView.hideUnlessMouseIsOverDropdown();
      });

      it('should not call hide', function() {
        expect(this.dropdownView.hide).not.toHaveBeenCalled();
      });
    });

    describe('if isMouseOverDropdown is false', function() {
      beforeEach(function() {
        this.dropdownView.isMouseOverDropdown = false;
        this.dropdownView.hideUnlessMouseIsOverDropdown();
      });

      it('should call hide', function() {
        expect(this.dropdownView.hide).toHaveBeenCalled();
      });
    });
  });

  describe('#hide', function() {
    describe('if open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
        this.dropdownView.on('hide', this.spy = jasmine.createSpy());

        this.$menu
        .find('.tt-suggestions > .tt-suggestion')
        .addClass('.tt-is-under-cursor');

        this.dropdownView.hide();
      });

      it('should hide menu', function() {
        expect(this.$menu).toBeHidden();
      });

      it('should remove tt-is-under-cursor class from suggestions', function() {
        var $suggestions = this.$menu.find('.tt-suggestion');

        expect($suggestions).not.toHaveClass('tt-is-under-cursor');
      });

      it('should trigger hide', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });

    describe('if not open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);
        this.dropdownView.on('hide', this.spy = jasmine.createSpy());

        this.dropdownView.hide();
      });

      it('should keep menu hidden', function() {
        expect(this.$menu).toBeHidden();
      });

      it('should not trigger hide', function() {
        expect(this.spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('#show', function() {
    describe('if open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
        this.dropdownView.on('show', this.spy = jasmine.createSpy());

        this.dropdownView.show();
      });

      it('should keep menu visible', function() {
        expect(this.$menu).toBeVisible();
      });

      it('should not trigger show', function() {
        expect(this.spy).not.toHaveBeenCalled();
      });
    });

    describe('if not open', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);
        this.dropdownView.on('show', this.spy = jasmine.createSpy());

        this.dropdownView.show();
      });

      it('should make menu visible', function() {
        expect(this.$menu).toBeVisible();
      });

      it('should trigger show', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });
  });

  describe('#moveCursorUp', function() {
    beforeEach(function() {
      this.dropdownView
      .on('cursorOn', this.cursorOnSpy = jasmine.createSpy())
      .on('cursorOff', this.cursorOffSpy = jasmine.createSpy());
    });

    describe('if not visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);

        this.dropdownView.moveCursorUp();
      });

      it('should not move the cursor to any suggestion', function() {
        expect(this.$menu.find('.tt-is-under-cursor')).not.toExist();
      });

      it('should not trigger cursorOn', function() {
        expect(this.cursorOnSpy).not.toHaveBeenCalled();
      });

      it('should not trigger cursorOff', function() {
        expect(this.cursorOffSpy).not.toHaveBeenCalled();
      });
    });

    describe('if visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
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

        it('should trigger cursorOn', function() {
          expect(this.cursorOnSpy).toHaveBeenCalled();
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

        it('should trigger cursorOn', function() {
          expect(this.cursorOnSpy).toHaveBeenCalled();
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

        it('should trigger cursorOff', function() {
          expect(this.cursorOffSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('#moveCursorDown', function() {
    beforeEach(function() {
      this.dropdownView
      .on('cursorOn', this.cursorOnSpy = jasmine.createSpy())
      .on('cursorOff', this.cursorOffSpy = jasmine.createSpy());
    });

    describe('if not visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, false);

        this.dropdownView.moveCursorDown();
      });

      it('should not move the cursor to any suggestion', function() {
        expect(this.$menu.find('.tt-is-under-cursor')).not.toExist();
      });

      it('should not trigger cursorOn', function() {
        expect(this.cursorOnSpy).not.toHaveBeenCalled();
      });

      it('should not trigger cursorOff', function() {
        expect(this.cursorOffSpy).not.toHaveBeenCalled();
      });
    });

    describe('if visible', function() {
      beforeEach(function() {
        renderTestDataset(this.dropdownView, true);
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

        it('should trigger cursorOn', function() {
          expect(this.cursorOnSpy).toHaveBeenCalled();
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

        it('should trigger cursorOn', function() {
          expect(this.cursorOnSpy).toHaveBeenCalled();
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

        it('should trigger cursorOff', function() {
          expect(this.cursorOffSpy).toHaveBeenCalled();
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
        var $suggestion = this.$menu
            .find('.tt-suggestion')
            .first()
            .addClass('tt-is-under-cursor'),
            suggestionData = this.dropdownView.getSuggestionUnderCursor();

        expect(suggestionData.value).toBe($suggestion.data('value'));
        expect(suggestionData.query).toBe(this.$testDataset.data('query'));
        expect(suggestionData.dataset).toBe(this.$testDataset.data('dataset'));
      });
    });
  });

  describe('#getFirstSuggestion', function() {
    beforeEach(function() {
      this.$testDataset = renderTestDataset(this.dropdownView, true);
    });

    it('should return obj with data about suggestion under the cursor',
    function() {
      var $firstSuggestion = this.dropdownView._getSuggestions().first(),
          suggestionData = this.dropdownView.getFirstSuggestion();

      expect(suggestionData.value).toBe($firstSuggestion.data('value'));
      expect(suggestionData.query).toBe(this.$testDataset.data('query'));
      expect(suggestionData.dataset).toBe(this.$testDataset.data('dataset'));
    });
  });

  describe('#renderSuggestions', function() {
    var template = {
          render: function(c) {
            return '<li class="tt-suggestion"><p>' + c.value + '</p></li>';
          }
        },
        mockNewDataset = { name: 'new', template: template },
        mockOldDataset = { name: 'test', template: template };

    beforeEach(function() {
      this.$testDataset = renderTestDataset(this.dropdownView, true);
    });

    describe('if new dataset', function() {
      beforeEach(function() {
        this.dropdownView.renderSuggestions('query', mockNewDataset, []);
      });

      it('should append new list for dataset', function() {
        expect(this.$menu.find('.tt-dataset-new > .tt-suggestions')).toExist();
      });
    });

    describe('if there are no suggestions', function() {
      beforeEach(function() {
        this.dropdownView.on('suggestionsRender', spy = jasmine.createSpy());

        spyOn(this.dropdownView, 'clearSuggestions');

        this.dropdownView.renderSuggestions('query', mockOldDataset, []);
      });

      it('should call clearSuggestions', function() {
        expect(this.dropdownView.clearSuggestions).toHaveBeenCalledWith('test');
      });

      it('should trigger suggestionsRender', function() {
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('if there are suggestions', function() {
      beforeEach(function() {
        this.dropdownView
        .on('suggestionsRender', this.spy = jasmine.createSpy());

        spyOn(this.dropdownView, 'clearSuggestions').andCallThrough();

        this.dropdownView.renderSuggestions(
          'query',
          mockOldDataset,
          [{ value: 'i am a value' }]
        );
      });

      it('should call clearSuggestions', function() {
        expect(this.dropdownView.clearSuggestions).toHaveBeenCalledWith('test');
      });

      it('should update data values on list', function() {
        expect(this.$testDataset).toHaveData('query', 'query');
        expect(this.$testDataset).toHaveData('dataset', 'test');
      });

      it('should overwrite previous suggestions', function() {
        var $suggestions = this.$testDataset.children();

        expect($suggestions.length).toBe(1);
        expect($suggestions.first()).toHaveText('i am a value');
        expect($suggestions.first()).toHaveData('value', 'i am a value');
      });

      it('should trigger suggestionsRender', function() {
        expect(this.spy).toHaveBeenCalled();
      });
    });
  });

  describe('#clearSuggestions', function() {
    beforeEach(function() {
      renderTestDataset(this.dropdownView, true);
      this.dropdownView.clearSuggestions();
    });

    it('should remove all suggestions', function() {
      expect(this.$menu.find('.tt-suggestion')).not.toExist();
    });

    it('should hide menu', function() {
      expect(this.$menu).toBeHidden();
    });
  });

  // helper functions
  // ----------------

  function renderTestDataset(view, open) {
    var mockQuery = 'test q',
        mockDataset = {
          name: 'test' ,
          template: {
            render: function(c) {
              return '<li class="tt-suggestion"><p>' + c.value + '</p></li>';
            }
          }
        },
         mockSuggestions = [
          { value: 'one' },
          { value: 'two' },
          { value: 'three' }
        ];

    view.renderSuggestions(mockQuery, mockDataset, mockSuggestions);
    open && view.show();

    return $('#jasmine-fixtures .tt-dataset-test > .tt-suggestions');
  }
});
