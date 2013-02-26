describe('TypeaheadView', function() {
  var fixture = '<input class="tt-test">',
      mockDatasets = [];

  ['dataset1', 'dataset2', 'dataset3'].forEach(function(datasetName) {
    mockDatasets.push({
      name: datasetName,
      limit: 4,
      template: '',
      engine: Hogan,
      getSuggestions: jasmine.createSpy()
        .andCallFake(function(q, cb) { cb([]); })
    });
  });

  beforeEach(function() {
    var $fixtures, $input;

    setFixtures(fixture);

    $fixtures = $('#jasmine-fixtures');
    $input = $fixtures.find('.tt-test');

    this.typeaheadView = new TypeaheadView({
      input: $input,
      datasets: mockDatasets
    });

    this.inputView = this.typeaheadView.inputView;
    this.dropdownView = this.typeaheadView.dropdownView;

    // spy on all inputView and dropdownView public methods
    [this.inputView, this.dropdownView].forEach(spyOnPublicMethods);
  });

  // handlers triggered by dropdownView events
  // -----------------------------------------

  describe('when dropdownView triggers suggestionSelected', function() {
    beforeEach(function() {
      this.dropdownView
      .trigger('suggestionSelected', { value: 'i am selected' });
    });

    it('should update input value', function() {
      expect(this.inputView.setInputValue)
      .toHaveBeenCalledWith('i am selected');
    });

    it('should focus input', function() {
      expect(this.inputView.focus).toHaveBeenCalled();
    });

    it('should close dropdown', function() {
      expect(this.dropdownView.close).toHaveBeenCalled();
    });
  });

  describe('when dropdownView triggers cursorMoved', function() {
    beforeEach(function() {
      this.dropdownView.trigger('cursorMoved', { value: 'i am hint' });
    });

    it('should clear hint', function() {
      expect(this.inputView.setHintValue).toHaveBeenCalledWith('');
    });

    it('should set input value to suggestion value', function() {
      expect(this.inputView.setInputValue)
      .toHaveBeenCalledWith('i am hint', true);
    });
  });

  describe('when dropdownView triggers cursorRemoved', function() {
    it('should reset input value to user query', function() {
      this.inputView.getQuery.andReturn('san   ');
      this.dropdownView.trigger('cursorRemoved');

      expect(this.inputView.setInputValue).toHaveBeenCalledWith('san   ');
    });

    _updateHintSpecHelper('dropdownView', 'cursorRemoved');
  });

  describe('when dropdownView triggers suggestionsRendered', function() {
    _updateHintSpecHelper('dropdownView', 'suggestionsRendered');
  });

  describe('when dropdownView triggers closed', function() {
    beforeEach(function() {
      this.dropdownView.trigger('closed');
    });

    it('should clear hint', function() {
      expect(this.inputView.setHintValue).toHaveBeenCalledWith('');
    });
  });

  // handlers triggered by inputView events
  // --------------------------------------

  describe('when inputView triggers blured', function() {
    beforeEach(function() {
      this.inputView.getQuery.andReturn('reset');

      this.inputView.trigger('blured');
    });

    it('should close dropdown unless mouse is over it', function() {
      expect(this.dropdownView.closeUnlessMouseIsOverDropdown)
      .toHaveBeenCalled();
    });

    it('should reset input value to user query', function() {
      expect(this.inputView.setInputValue).toHaveBeenCalledWith('reset');
    });
  });

  describe('when inputView triggers enterKeyed', function() {
    beforeEach(function() {
      this.spy = jasmine.createSpy();

      this.dropdownView.getSuggestionUnderCursor
      .andReturn({ value: 'i am selected' });

      this.inputView.trigger('enterKeyed', { preventDefault: this.spy });
    });

    it('should update input value', function() {
      expect(this.inputView.setInputValue)
      .toHaveBeenCalledWith('i am selected');
    });

    it('should prevent form submissions', function() {
      expect(this.spy).toHaveBeenCalled();
    });

    it('should close dropdown', function() {
      expect(this.dropdownView.close).toHaveBeenCalled();
    });
  });

  describe('when inputView triggers whitespaceChanged', function() {
    _updateHintSpecHelper('inputView', 'whitespaceChanged');

    it('should open the dropdown menu', function() {
      this.inputView.trigger('whitespaceChanged');
      expect(this.dropdownView.open).toHaveBeenCalled();
    });

    describe('if language direction has changed', function() {
      beforeEach(function() {
        this.typeaheadView.dir = 'ltr';
        this.inputView.getLanguageDirection.andReturn('rtl');

        this.inputView.trigger('whitespaceChanged');
      });

      it('should update styling', function() {
        expect(this.typeaheadView.$node).toHaveCss({ direction: 'rtl' });
        expect(this.dropdownView.setLanguageDirection)
        .toHaveBeenCalledWith('rtl');
      });
    });
  });

  describe('when inputView triggers queryChanged', function() {
    it('should open the dropdown menu', function() {
      this.inputView.trigger('queryChanged');
      expect(this.dropdownView.open).toHaveBeenCalled();
    });

    it('should clear hint', function() {
      this.inputView.trigger('queryChanged');
      expect(this.inputView.setHintValue).toHaveBeenCalledWith('');
    });

    it('should clear suggestions', function() {
      this.inputView.trigger('queryChanged');
      expect(this.dropdownView.clearSuggestions).toHaveBeenCalled();
    });

    it('should call dropdownView.renderSuggestions for each dataset',
    function() {
      this.inputView.trigger('queryChanged');
      expect(this.dropdownView.renderSuggestions.callCount).toBe(3);
    });

    describe('if language direction has changed', function() {
      beforeEach(function() {
        this.typeaheadView.dir = 'ltr';
        this.inputView.getLanguageDirection.andReturn('rtl');

        this.inputView.trigger('queryChanged');
      });

      it('should update styling', function() {
        expect(this.typeaheadView.$node).toHaveCss({ direction: 'rtl' });
        expect(this.dropdownView.setLanguageDirection)
        .toHaveBeenCalledWith('rtl');
      });
    });
  });

  describe('when inputView triggers focused', function() {
    beforeEach(function() {
      this.inputView.trigger('focused');
    });

    it('should open the dropdown menu', function() {
      expect(this.dropdownView.open).toHaveBeenCalled();
    });
  });

  describe('when inputView triggers escKeyed', function() {
    beforeEach(function() {
      this.inputView.getQuery.andReturn('reset');

      this.inputView.trigger('escKeyed');
    });

    it('should close dropdown', function() {
      expect(this.dropdownView.close).toHaveBeenCalled();
    });

    it('should reset input value to user query', function() {
      expect(this.inputView.setInputValue).toHaveBeenCalledWith('reset');
    });
  });

  describe('when inputView triggers upKeyed', function() {
    describe('if modifier key was pressed', function() {
      beforeEach(function() {
        this.$e = $.extend($.Event('keydown'), { keyCode: 38, shiftKey: true });
        spyOn(this.$e, 'preventDefault');

        this.inputView.trigger('upKeyed', this.$e);
      });

      it('should open the dropdown menu', function() {
        expect(this.dropdownView.open).toHaveBeenCalled();
      });

      it('should not prevent default browser behavior', function() {
        expect(this.$e.preventDefault).not.toHaveBeenCalled();
      });

      it('should not move cursor up', function() {
        expect(this.dropdownView.moveCursorUp).not.toHaveBeenCalled();
      });
    });

    describe('if modifier key was not pressed', function() {
      beforeEach(function() {
        this.$e = $.extend($.Event('keydown'), { keyCode: 38 });
        spyOn(this.$e, 'preventDefault');

        this.inputView.trigger('upKeyed', this.$e);
      });

      it('should show the dropdown menu', function() {
        expect(this.dropdownView.open).toHaveBeenCalled();
      });

      it('should prevent default browser behavior', function() {
        expect(this.$e.preventDefault).toHaveBeenCalled();
      });

      it('should move cursor up', function() {
        expect(this.dropdownView.moveCursorUp).toHaveBeenCalled();
      });
    });
  });

  describe('when inputView triggers downKeyed', function() {

    describe('if modifier key was pressed', function() {
      beforeEach(function() {
        this.$e = $.extend($.Event('keydown'), { keyCode: 40, shiftKey: true });
        spyOn(this.$e, 'preventDefault');

        this.inputView.trigger('downKeyed', this.$e);
      });

      it('should open the dropdown menu', function() {
        expect(this.dropdownView.open).toHaveBeenCalled();
      });

      it('should not prevent default browser behavior', function() {
        expect(this.$e.preventDefault).not.toHaveBeenCalled();
      });

      it('should not move cursor down', function() {
        expect(this.dropdownView.moveCursorDown).not.toHaveBeenCalled();
      });
    });

    describe('if modifier key was not pressed', function() {
      beforeEach(function() {
        this.$e = $.extend($.Event('keydown'), { keyCode: 40 });
        spyOn(this.$e, 'preventDefault');

        this.inputView.trigger('downKeyed', this.$e);
      });

      it('should open the dropdown menu', function() {
        expect(this.dropdownView.open).toHaveBeenCalled();
      });

      it('should prevent default browser behavior', function() {
        expect(this.$e.preventDefault).toHaveBeenCalled();
      });

      it('should move cursor down', function() {
        expect(this.dropdownView.moveCursorDown).toHaveBeenCalled();
      });
    });
  });

  describe('when inputView triggers tabKeyed', function() {
    beforeEach(function() {
      this.$e = $.extend($.Event('keydown'), { keyCode: 9 });
      spyOn(this.$e, 'preventDefault');
    });

    describe('if hint is empty string', function() {
      beforeEach(function() {
        this.inputView.getHintValue.andReturn('');

        this.inputView.trigger('tabKeyed', this.$e);
      });

      it('should not update input value', function() {
        expect(this.inputView.setInputValue).not.toHaveBeenCalled();
      });

      it('should not prevent default browser behavior', function() {
        expect(this.$e.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('if hint differs from query', function() {
      beforeEach(function() {
        this.inputView.getQuery.andReturn('app');
        this.inputView.getHintValue.andReturn('apple');

        this.inputView.trigger('tabKeyed', this.$e);
      });

      it('should update input value', function() {
        expect(this.inputView.setInputValue).toHaveBeenCalled();
      });

      it('should prevent default browser behavior', function() {
        expect(this.$e.preventDefault).toHaveBeenCalled();
      });
    });
  });

  describe('when inputView triggers leftKeyed', function() {
    beforeEach(function() {
      this.inputView.getQuery.andReturn('app');
      this.inputView.getHintValue.andReturn('apple');
      this.inputView.isCursorAtEnd.andReturn(true);
      this.inputView.getLanguageDirection.andReturn('ltr');
    });

    describe('if being viewed in ltr language', function() {
      beforeEach(function() {
        this.inputView.getLanguageDirection.andReturn('ltr');

        this.inputView.trigger('leftKeyed');
      });

      it('should not update input value', function() {
        expect(this.inputView.setInputValue).not.toHaveBeenCalled();
      });
    });

    describe('if being viewed in rtl language', function() {
      beforeEach(function() {
        this.inputView.getLanguageDirection.andReturn('rtl');

        this.inputView.trigger('leftKeyed');
      });

      it('should update value of input', function() {
        expect(this.inputView.setInputValue).toHaveBeenCalled();
      });
    });

    describe('if cursor is not at then end of the query', function() {
      beforeEach(function() {
        this.inputView.isCursorAtEnd.andReturn(false);

        this.inputView.trigger('leftKeyed');
      });

      it('should not update input value', function() {
        expect(this.inputView.setInputValue).not.toHaveBeenCalled();
      });
    });
  });

  describe('when inputView triggers rightKeyed', function() {
    beforeEach(function() {
      this.inputView.getQuery.andReturn('app');
      this.inputView.getHintValue.andReturn('apple');
      this.inputView.isCursorAtEnd.andReturn(true);
      this.inputView.getLanguageDirection.andReturn('ltr');
    });

    describe('if being viewed in ltr language', function() {
      beforeEach(function() {
        this.inputView.getLanguageDirection.andReturn('ltr');

        this.inputView.trigger('rightKeyed');
      });

      it('should update input value', function() {
        expect(this.inputView.setInputValue).toHaveBeenCalled();
      });
    });

    describe('if being viewed in rtl language', function() {
      beforeEach(function() {
        this.inputView.getLanguageDirection.andReturn('rtl');

        this.inputView.trigger('rightKeyed');
      });

      it('should not update input value', function() {
        expect(this.inputView.setInputValue).not.toHaveBeenCalled();
      });
    });

    describe('if cursor is not at then end of the query', function() {
      beforeEach(function() {
        this.inputView.isCursorAtEnd.andReturn(false);

        this.inputView.trigger('rightKeyed');
      });

      it('should not update input value', function() {
        expect(this.inputView.setInputValue).not.toHaveBeenCalled();
      });
    });
  });

  // spec helpers
  // ------------

  function _updateHintSpecHelper(view, eventType) {
    describe('if input\'s value is overflowing', function() {
      it('should clear hint', function() {
        this.inputView.isOverflow.andReturn(true);
        this.inputView.getInputValue.andReturn('bl');
        this.dropdownView.getFirstSuggestion.andReturn({ value: 'blah' });

        this[view].trigger(eventType);

        expect(this.inputView.setHintValue).not.toHaveBeenCalled();
      });
    });

    describe('if dropdown menu is not visible', function() {
      it('should not show hint', function() {
        this.dropdownView.isVisible.andReturn(false);
        this.inputView.getInputValue.andReturn('san   ');
        this.dropdownView.getFirstSuggestion
        .andReturn({ value: 'desert sand' });

        this[view].trigger(eventType);

        expect(this.inputView.setHintValue).not.toHaveBeenCalled();
      });
    });

    describe('if top suggestion\'s value begins with query', function() {
      it('should show hint', function() {
        this.dropdownView.isVisible.andReturn(true);
        this.inputView.getInputValue.andReturn('san   ');
        this.dropdownView.getFirstSuggestion
        .andReturn({ value: 'san francisco' });

        this[view].trigger(eventType);

        expect(this.inputView.setHintValue)
        .toHaveBeenCalledWith('san   francisco');
      });
    });

    describe('if top suggestion\'s value does not begin with query',
    function() {
      it('should not show hint', function() {
        this.dropdownView.isVisible.andReturn(true);
        this.inputView.getInputValue.andReturn('san   ');
        this.dropdownView.getFirstSuggestion
        .andReturn({ value: 'desert sand' });

        this[view].trigger(eventType);

        expect(this.inputView.setHintValue).toHaveBeenCalledWith('san   ');
      });
    });
  }

  // helper functions
  // ----------------

  function spyOnPublicMethods(view) {
    var isEventMethod, isPublicMethod;

    for (var key in view) {
      if (view.hasOwnProperty(key)) {
        isEventMethod = ~['on', 'off', 'trigger'].indexOf(key);
        isPublicMethod = typeof view[key] == 'function' && !/^_/.test(key);

        if (view.hasOwnProperty(key) && isPublicMethod && !isEventMethod) {
          spyOn(view, key);
        }
      }
    }
  }
});
