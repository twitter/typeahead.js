describe('TypeaheadView', function() {
  var testDatum;

  beforeEach(function() {
    var $fixture, $input;

    jasmine.InputView.useMock();
    jasmine.SectionView.useMock();
    jasmine.DropdownView.useMock();

    setFixtures(fixtures.html.textInput);

    $fixture = $('#jasmine-fixtures');
    $input = $fixture.find('input');

    testDatum = fixtures.normalized.simple[0];

    this.view = new TypeaheadView({ input: $input, sections: {} });
    this.input = this.view.input;
    this.dropdown = this.view.dropdown;
  });

  describe('when dropdown triggers suggestionClicked', function() {
    beforeEach(function() {
      this.dropdown.getDatumForSuggestion.andReturn(testDatum);
    });

    it('should select the datum', function() {
      this.dropdown.trigger('suggestionClicked');

      expect(this.input.clearHint).toHaveBeenCalled();
      expect(this.input.setQuery).toHaveBeenCalledWith(testDatum.value)
      expect(this.input.setInputValue)
      .toHaveBeenCalledWith(testDatum.value, true);

      waitsFor(function() { return this.dropdown.close.callCount; });
    });

    it('should bring focus to the input', function() {
      this.dropdown.trigger('suggestionClicked');

      expect(this.input.focus).toHaveBeenCalled();
    });
  });

  describe('when dropdown triggers cursorMoved', function() {
    beforeEach(function() {
      this.dropdown.getDatumForCursor.andReturn(testDatum);
    });

    it('should clear the hint', function() {
      this.dropdown.trigger('cursorMoved');

      expect(this.input.clearHint).toHaveBeenCalled();
    });

    it('should update the input value', function() {
      this.dropdown.trigger('cursorMoved');

      expect(this.input.setInputValue)
      .toHaveBeenCalledWith(testDatum.value, true);
    });
  });

  describe('when dropdown triggers cursorRemoved', function() {
    it('should reset the input value', function() {
      this.dropdown.trigger('cursorRemoved');

      expect(this.input.resetInputValue).toHaveBeenCalled();
    });

    it('should update the hint', function() {
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.dropdown.isVisible.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.input.getInputValue.andReturn(testDatum.value.slice(0, 2));

      this.dropdown.trigger('cursorRemoved');

      expect(this.input.setHintValue).toHaveBeenCalledWith(testDatum.value);
    });
  });

  describe('when dropdown triggers sectionRendered', function() {
    it('should update the hint', function() {
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.dropdown.isVisible.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.input.getInputValue.andReturn(testDatum.value.slice(0, 2));

      this.dropdown.trigger('sectionRendered');

      expect(this.input.setHintValue).toHaveBeenCalledWith(testDatum.value);
    });
  });

  describe('when dropdown triggers opened', function() {
    it('should update the hint', function() {
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.dropdown.isVisible.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.input.getInputValue.andReturn(testDatum.value.slice(0, 2));

      this.dropdown.trigger('opened');

      expect(this.input.setHintValue).toHaveBeenCalledWith(testDatum.value);
    });
  });

  describe('when dropdown triggers closed', function() {
    it('should clear the hint', function() {
      this.dropdown.trigger('closed');

      expect(this.input.clearHint).toHaveBeenCalled();
    });
  });

  describe('when input triggers focused', function() {
    it('should open the dropdown', function() {
      this.input.trigger('focused');

      expect(this.dropdown.open).toHaveBeenCalled();
    });
  });

  describe('when input triggers blurred', function() {
    it('should close the dropdown', function() {
      this.input.trigger('blurred');

      expect(this.dropdown.close).toHaveBeenCalled();
    });
  });

  describe('when input triggers enterKeyed', function() {
    beforeEach(function() {
      this.dropdown.getDatumForCursor.andReturn(testDatum);
    });

    it('should select the datum', function() {
      var $e;

      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.input.trigger('enterKeyed', $e);

      expect(this.input.clearHint).toHaveBeenCalled();
      expect(this.input.setQuery).toHaveBeenCalledWith(testDatum.value)
      expect(this.input.setInputValue)
      .toHaveBeenCalledWith(testDatum.value, true);

      waitsFor(function() { return this.dropdown.close.callCount; });
    });

    it('should prevent the default behavior of the event', function() {
      var $e;

      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.input.trigger('enterKeyed', $e);

      expect($e.preventDefault).toHaveBeenCalled();
    });
  });

  describe('when input triggers tabKeyed', function() {
    describe('when cursor is in use', function() {
      beforeEach(function() {
        this.dropdown.getDatumForCursor.andReturn(testDatum);
      });

      it('should select the datum', function() {
        var $e;

        $e = jasmine.createSpyObj('event', ['preventDefault']);
        this.input.trigger('tabKeyed', $e);

        expect(this.input.clearHint).toHaveBeenCalled();
        expect(this.input.setQuery).toHaveBeenCalledWith(testDatum.value)
        expect(this.input.setInputValue)
        .toHaveBeenCalledWith(testDatum.value, true);

        waitsFor(function() { return this.dropdown.close.callCount; });
      });

      it('should prevent the default behavior of the event', function() {
        var $e;

        $e = jasmine.createSpyObj('event', ['preventDefault']);
        this.input.trigger('tabKeyed', $e);

        expect($e.preventDefault).toHaveBeenCalled();
      });
    });

    describe('when cursor is not in use', function() {
      it('should autocomplete', function() {
        this.input.getQuery.andReturn('bi');
        this.input.getHintValue.andReturn(testDatum.value);
        this.input.isCursorAtEnd.andReturn(true);
        this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);

        this.input.trigger('tabKeyed');

        expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
      });
    });
  });

  describe('when input triggers escKeyed', function() {
    it('should close the dropdown', function() {
      this.input.trigger('escKeyed');

      expect(this.dropdown.close).toHaveBeenCalled();
    });

    it('should reset the input value', function() {
      this.input.trigger('escKeyed');

      expect(this.input.resetInputValue).toHaveBeenCalled();
    });
  });

  describe('when input triggers upKeyed', function() {
    it('should open the dropdown', function() {
      this.input.trigger('upKeyed');

      expect(this.dropdown.open).toHaveBeenCalled();
    });

    it('should move the cursor up', function() {
      this.input.trigger('upKeyed');

      expect(this.dropdown.moveCursorUp).toHaveBeenCalled();
    });
  });

  describe('when input triggers downKeyed', function() {
    it('should open the dropdown', function() {
      this.input.trigger('downKeyed');

      expect(this.dropdown.open).toHaveBeenCalled();
    });

    it('should move the cursor down', function() {
      this.input.trigger('downKeyed');

      expect(this.dropdown.moveCursorDown).toHaveBeenCalled();
    });
  });

  describe('when input triggers leftKeyed', function() {
    it('should autocomplete if language is rtl', function() {
      this.view.dir = 'rtl';
      this.input.getQuery.andReturn('bi');
      this.input.getHintValue.andReturn(testDatum.value);
      this.input.isCursorAtEnd.andReturn(true);
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);

      this.input.trigger('leftKeyed');

      expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
    });
  });

  describe('when input triggers rightKeyed', function() {
    it('should autocomplete if language is ltr', function() {
      this.view.dir = 'ltr';
      this.input.getQuery.andReturn('bi');
      this.input.getHintValue.andReturn(testDatum.value);
      this.input.isCursorAtEnd.andReturn(true);
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);

      this.input.trigger('rightKeyed');

      expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
    });
  });

  describe('when input triggers queryChanged', function() {
    it('should clear the hint', function() {
      this.input.trigger('queryChanged', testDatum.value);

      expect(this.input.clearHint).toHaveBeenCalled();
    });

    it('should empty dropdown', function() {
      this.input.trigger('queryChanged', testDatum.value);

      expect(this.dropdown.empty).toHaveBeenCalled();
    });

    it('should update dropdown', function() {
      this.input.trigger('queryChanged', testDatum.value);

      expect(this.dropdown.update).toHaveBeenCalledWith(testDatum.value);
    });

    it('should open the dropdown', function() {
      this.input.trigger('queryChanged', testDatum.value);

      expect(this.dropdown.open).toHaveBeenCalled();
    });

    it('should set the language direction', function() {
      this.input.getLanguageDirection.andReturn('rtl');

      this.input.trigger('queryChanged', testDatum.value);

      expect(this.view.dir).toBe('rtl');
      expect(this.view.$node).toHaveCss({ direction: 'rtl' });
      expect(this.dropdown.setLanguageDirection).toHaveBeenCalledWith('rtl');
    });
  });

  describe('when input triggers whitespaceChanged', function() {
    it('should update the hint', function() {
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.dropdown.isVisible.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.input.getInputValue.andReturn(testDatum.value.slice(0, 2));

      this.input.trigger('whitespaceChanged');

      expect(this.input.setHintValue).toHaveBeenCalledWith(testDatum.value);
    });

    it('should open the dropdown', function() {
      this.input.trigger('whitespaceChanged');

      expect(this.dropdown.open).toHaveBeenCalled();
    });
  });
});
