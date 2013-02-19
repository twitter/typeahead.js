describe('DropdownView', function() {
  var fixture = [
    '<ol class="tt-dropdown-menu">',
      '<li class="tt-dataset-test">',
        '<ol class="tt-suggestions" data-query="test q" data-dataset="test">',
          '<li class="tt-suggestion" data-value="one">one</li>',
          '<li class="tt-suggestion" data-value="two">two</li>',
          '<li class="tt-suggestion" data-value="three">three</li>',
        '</ol>',
      '</li>',
    '</ol>'
  ].join('\n');

  beforeEach(function() {
    var $fixtures;

    setFixtures(fixture);

    $fixtures = $('#jasmine-fixtures');
    this.$menu = $fixtures.find('.tt-dropdown-menu');
    this.$testSet = $fixtures.find('.tt-dataset-test > .tt-suggestions');

    this.dropdownView = new DropdownView({ menu: this.$menu });
  });

  describe('when mouseenter', function() {
    beforeEach(function() {
      this.$menu.mouseleave().mouseenter();
    });

    it('should set isMouseOverDropdown to true', function() {
      expect(this.dropdownView.isMouseOverDropdown).toBe(true);
    });
  });

  describe('when mouseleave', function() {
    beforeEach(function() {
      this.$menu.mouseenter().mouseleave();
    });

    it('should set isMouseOverDropdown to false', function() {
      expect(this.dropdownView.isMouseOverDropdown).toBe(false);
    });
  });

  describe('when mouseover suggestion', function() {
    var spy, $suggestion1, $suggestion2, $suggestion3;

    beforeEach(function() {
      this.dropdownView.on('cursorOn', spy = jasmine.createSpy());

      $suggestion1 = this.$testSet.find('.tt-suggestion:nth-child(1)');
      $suggestion2 = this.$testSet.find('.tt-suggestion:nth-child(2)');
      $suggestion3 = this.$testSet.find('.tt-suggestion:nth-child(3)');

      // start with suggestion1 highlighted
      $suggestion1.addClass('tt-is-under-cursor');

      $suggestion2.mouseover();
    });

    it('should add tt-is-under-cursor class to suggestion', function() {
      expect($suggestion2).toHaveClass('tt-is-under-cursor');
    });

    it('should remove tt-is-under-cursor class from other suggestions',
    function() {
      expect($suggestion1).not.toHaveClass('tt-is-under-cursor');
      expect($suggestion3).not.toHaveClass('tt-is-under-cursor');
    });
  });

  describe('when click suggestion', function() {
    var spy, $suggestion;

    beforeEach(function() {
      this.dropdownView.on('select', spy = jasmine.createSpy());

      $suggestion = this.$testSet
      .data('query', 'test query')
      .data('dataset', 'test dataset')
      .find('.tt-suggestion:nth-child(1)').click();
    });

    it('should trigger select', function() {
      expect(spy).toHaveBeenCalledWith({
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
    var spy;

    beforeEach(function() {
      this.dropdownView.on('hide', spy = jasmine.createSpy());
    });

    describe('if menu has tt-is-open class', function() {
      beforeEach(function() {
        this.$menu.addClass('tt-is-open')
        .find('.tt-suggestions > .tt-suggestion')
        .addClass('.tt-is-under-cursor');

        this.dropdownView.hide();
      });

      it('should remove tt-is-open class', function() {
        expect(this.$menu).not.toHaveClass('tt-is-open');
      });

      it('should remove tt-is-under-cursor class from suggestions', function() {
        var $suggestions = this.$menu.find('.tt-suggestions > .tt-suggestion');
        expect($suggestions).not.toHaveClass('tt-is-under-cursor');
      });

      it('should trigger hide', function() {
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('if menu does not have tt-is-open class', function() {
      beforeEach(function() {
        this.$menu.removeClass('tt-is-open');

        this.dropdownView.hide();
      });

      it('should not add the tt-is-open class', function() {
        expect(this.$menu).not.toHaveClass('tt-is-open');
      });

      it('should not trigger hide', function() {
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('#show', function() {
    var spy;

    beforeEach(function() {
      this.dropdownView.on('show', spy = jasmine.createSpy());
    });

    describe('if menu has tt-is-open class', function() {
      beforeEach(function() {
        this.$menu.addClass('tt-is-open');

        this.dropdownView.show();
      });

      it('should not remove tt-is-open class', function() {
        expect(this.$menu).toHaveClass('tt-is-open');
      });

      it('should not trigger show', function() {
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('if menu does not have tt-is-open class', function() {
      beforeEach(function() {
        this.$menu.removeClass('tt-is-open');

        this.dropdownView.show();
      });

      it('should add the tt-is-open class', function() {
        expect(this.$menu).toHaveClass('tt-is-open');
      });

      it('should trigger show', function() {
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#moveCursorUp', function() {
    var cursorOnSpy, cursorOffSpy;

    beforeEach(function() {
      this.dropdownView.on('cursorOn', cursorOnSpy = jasmine.createSpy());
      this.dropdownView.on('cursorOff', cursorOffSpy = jasmine.createSpy());
    });

    describe('if menu is closed', function() {
      beforeEach(function() {
        this.dropdownView.hide();
        this.dropdownView.moveCursorUp();
      });

      it('should not move the cursor to any suggestion', function() {
        expect(this.$testSet.find('.under-cursor')).not.toExist();
      });

      it('should not trigger cursorOn', function() {
        expect(cursorOnSpy).not.toHaveBeenCalled();
      });

      it('should not trigger cursorOff', function() {
        expect(cursorOffSpy).not.toHaveBeenCalled();
      });
    });

    describe('if menu is open', function() {
      beforeEach(function() {
        this.dropdownView.show();
      });

      describe('if no suggestion is under the cursor', function() {
        beforeEach(function() {
          this.dropdownView.moveCursorUp();
        });

        it('should move cursor to last suggestion', function() {
          var $lastSuggestion = this.$testSet.find('.tt-suggestion').last(),
              $suggestionUnderCursor = this.$testSet
              .find('.tt-is-under-cursor');

          expect($lastSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorOn', function() {
          expect(cursorOnSpy).toHaveBeenCalled();
        });
      });

      describe('if the last suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$testSet
          .find('.tt-suggestion')
          .last()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorUp();
        });

        it('should move cursor to previous suggestion', function() {
          var $suggestionUnderCursor = this.$testSet
              .find('.tt-is-under-cursor'),
               $prevSuggestion = this.$testSet
              .find('.tt-suggestion')
              .last()
              .prev();

          expect($prevSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorOn', function() {
          expect(cursorOnSpy).toHaveBeenCalled();
        });
      });

      describe('if the first suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$testSet
          .find('.tt-suggestion')
          .first()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorUp();
        });

        it('should remove the cursor', function() {
          var $suggestionUnderCursor = this.$testSet
              .find('.tt-is-under-cursor');

          expect($suggestionUnderCursor).not.toExist();
        });

        it('should trigger cursorOff', function() {
          expect(cursorOffSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('#moveCursorDown', function() {
    var cursorOnSpy, cursorOffSpy;

    beforeEach(function() {
      this.dropdownView.on('cursorOn', cursorOnSpy = jasmine.createSpy());
      this.dropdownView.on('cursorOff', cursorOffSpy = jasmine.createSpy());
    });

    describe('if menu is closed', function() {
      beforeEach(function() {
        this.dropdownView.hide();

        this.dropdownView.moveCursorDown();
      });

      it('should not move the cursor to any suggestion', function() {
        expect(this.$testSet.find('.under-cursor')).not.toExist();
      });

      it('should not trigger cursorOn', function() {
        expect(cursorOnSpy).not.toHaveBeenCalled();
      });

      it('should not trigger cursorOff', function() {
        expect(cursorOffSpy).not.toHaveBeenCalled();
      });
    });

    describe('if menu is open', function() {
      beforeEach(function() {
        this.dropdownView.show();
      });

      describe('if no suggestion is under the cursor', function() {
        beforeEach(function() {
          this.dropdownView.moveCursorDown();
        });

        it('should move cursor to first suggestion', function() {
          var $firstSuggestion = this.$testSet.find('.tt-suggestion').first(),
              $suggestionUnderCursor = this.$testSet
              .find('.tt-is-under-cursor');

          expect($firstSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorOn', function() {
          expect(cursorOnSpy).toHaveBeenCalled();
        });
      });

      describe('if the first suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$testSet
          .find('.tt-suggestion')
          .first()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorDown();
        });

        it('should move cursor to next suggestion', function() {
          var $suggestionUnderCursor = this.$testSet
              .find('.tt-is-under-cursor'),
               $nextSuggestion = this.$testSet
              .find('.tt-suggestion')
              .first()
              .next();

          expect($nextSuggestion).toBe($suggestionUnderCursor);
        });

        it('should trigger cursorOn', function() {
          expect(cursorOnSpy).toHaveBeenCalled();
        });
      });

      describe('if the last suggestion is under the cursor', function() {
        beforeEach(function() {
          this.$testSet
          .find('.tt-suggestion')
          .last()
          .addClass('tt-is-under-cursor');

          this.dropdownView.moveCursorDown();
        });

        it('should remove the cursor', function() {
          var $suggestionUnderCursor = this.$testSet
              .find('.tt-is-under-cursor');

          expect($suggestionUnderCursor).not.toExist();
        });

        it('should trigger cursorOff', function() {
          expect(cursorOffSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('#getSuggestionUnderCursor', function() {
    describe('if no suggestion is under the cursor', function() {
      it('should return null', function() {
        expect(this.dropdownView.getSuggestionUnderCursor()).toBeNull();
      });
    });

    describe('if suggestion is under the cursor', function() {
      var $suggestion;

      beforeEach(function() {
        $suggestion = this.$testSet
        .find('.tt-suggestion')
        .first()
        .addClass('tt-is-under-cursor');
      });

      it('should return obj with data about suggestion under the cursor',
      function() {
        var suggestionData = this.dropdownView.getSuggestionUnderCursor();

        expect(suggestionData.value).toBe($suggestion.data('value'));
        expect(suggestionData.query).toBe(this.$testSet.data('query'));
        expect(suggestionData.dataset).toBe(this.$testSet.data('dataset'));
      });
    });
  });

  describe('#getFirstSuggestion', function() {
    it('should return obj with data about suggestion under the cursor',
    function() {
      var $firstSuggestion = this.dropdownView._getSuggestions().first(),
          suggestionData = this.dropdownView.getFirstSuggestion();

      expect(suggestionData.value).toBe($firstSuggestion.data('value'));
      expect(suggestionData.query).toBe(this.$testSet.data('query'));
      expect(suggestionData.dataset).toBe(this.$testSet.data('dataset'));
    });
  });

  describe('#renderSuggestions', function() {
    var template = {
          render: function(c) { return '<p>' + c.value + '</p>';  }
        },
        mockNewDataset = { name: 'new', template: template },
        mockOldDataset = { name: 'test', template: template };

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
      var spy;

      beforeEach(function() {
        this.dropdownView.on('suggestionsRender', spy = jasmine.createSpy());

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

      it('should remove tt-is-empty class from menu', function() {
        expect(this.dropdownView.$menu).not.toHaveClass('tt-is-empty');
      });

      it('should update data values on list', function() {
        expect(this.$testSet).toHaveData('query', 'query');
        expect(this.$testSet).toHaveData('dataset', 'test');
      });

      it('should overwrite previous suggestions', function() {
        var $suggestions = this.$testSet.children();

        expect($suggestions.length).toBe(1);
        expect($suggestions.first()).toHaveText('i am a value');
        expect($suggestions.first()).toHaveData('value', 'i am a value');
      });

      it('should trigger suggestionsRender', function() {
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#clearSuggestions', function() {
    beforeEach(function() {
      this.dropdownView.clearSuggestions();
    });

    it('should remove all suggestions', function() {
      expect(this.$menu.find('.tt-suggestion')).not.toExist();
    });

    it('should add tt-is-empty class to menu', function() {
      expect(this.$menu).toHaveClass('tt-is-empty');
    });
  });
});
