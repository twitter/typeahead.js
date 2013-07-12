describe('Typeahead', function() {
  var testDatum;

  beforeEach(function() {
    var $fixture, $input;

    jasmine.Input.useMock();
    jasmine.Section.useMock();
    jasmine.Dropdown.useMock();

    setFixtures(fixtures.html.textInput);

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('input');

    testDatum = fixtures.normalized.simple[0];

    this.view = new Typeahead({
      input: this.$input,
      withHint: true,
      sections: {}
    });

    this.input = this.view.input;
    this.dropdown = this.view.dropdown;
  });

  describe('when dropdown triggers suggestionClicked', function() {
    beforeEach(function() {
      this.dropdown.getDatumForSuggestion.andReturn(testDatum);
    });

    it('should select the datum', function() {
      var $e, spy;

      this.$input.on('typeahead:selected', spy = jasmine.createSpy());
      this.dropdown.trigger('suggestionClicked');

      expect(spy).toHaveBeenCalled();
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

    it('should trigger cursorchanged', function() {
      var spy;

      this.$input.on('typeahead:cursorchanged', spy = jasmine.createSpy());

      this.dropdown.trigger('cursorMoved');

      expect(spy).toHaveBeenCalled();
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

    it('should trigger typeahead:opened', function() {
      var spy;

      this.$input.on('typeahead:opened', spy = jasmine.createSpy());

      this.dropdown.trigger('opened');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when dropdown triggers closed', function() {
    it('should clear the hint', function() {
      this.dropdown.trigger('closed');

      expect(this.input.clearHint).toHaveBeenCalled();
    });

    it('should trigger typeahead:closed', function() {
      var spy;

      this.$input.on('typeahead:closed', spy = jasmine.createSpy());

      this.dropdown.trigger('closed');

      expect(spy).toHaveBeenCalled();
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
      var $e, spy;

      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.$input.on('typeahead:selected', spy = jasmine.createSpy());
      this.input.trigger('enterKeyed', $e);

      expect(spy).toHaveBeenCalled();
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
        var $e, spy;

        $e = jasmine.createSpyObj('event', ['preventDefault']);
        this.$input.on('typeahead:selected', spy = jasmine.createSpy());
        this.input.trigger('tabKeyed', $e);

        expect(spy).toHaveBeenCalled();
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
        var spy;

        this.input.getQuery.andReturn('bi');
        this.input.getHintValue.andReturn(testDatum.value);
        this.input.isCursorAtEnd.andReturn(true);
        this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
        this.$input.on('typeahead:autocompleted', spy = jasmine.createSpy());

        this.input.trigger('tabKeyed');

        expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
        expect(spy).toHaveBeenCalled();
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
      var spy;

      this.view.dir = 'rtl';
      this.input.getQuery.andReturn('bi');
      this.input.getHintValue.andReturn(testDatum.value);
      this.input.isCursorAtEnd.andReturn(true);
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.$input.on('typeahead:autocompleted', spy = jasmine.createSpy());

      this.input.trigger('leftKeyed');

      expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when input triggers rightKeyed', function() {
    it('should autocomplete if language is ltr', function() {
      var spy;

      this.view.dir = 'ltr';
      this.input.getQuery.andReturn('bi');
      this.input.getHintValue.andReturn(testDatum.value);
      this.input.isCursorAtEnd.andReturn(true);
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.$input.on('typeahead:autocompleted', spy = jasmine.createSpy());

      this.input.trigger('rightKeyed');

      expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
      expect(spy).toHaveBeenCalled();
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

  describe('#open', function() {
    it('should open the dropdown', function() {
      this.view.open();

      expect(this.dropdown.open).toHaveBeenCalled();
    });
  });

  describe('#close', function() {
    it('should close the dropdown', function() {
      this.view.close();

      expect(this.dropdown.close).toHaveBeenCalled();
    });
  });

  describe('#getQuery', function() {
    it('should return the current query', function() {
      this.input.getQuery.andReturn('woah');
      this.view.close();

      expect(this.view.getQuery()).toBe('woah');
    });
  });

  describe('#getQuery', function() {
    it('should update the input value', function() {
      this.view.setQuery('woah');

      expect(this.input.setInputValue).toHaveBeenCalledWith('woah');
    });
  });

  describe('#destroy', function() {
    it('should destroy input', function() {
      this.view.destroy();

      expect(this.input.destroy).toHaveBeenCalled();
    });

    it('should destroy dropdown', function() {
      this.view.destroy();

      expect(this.dropdown.destroy).toHaveBeenCalled();
    });

    it('should null out its reference to the wrapper element', function() {
      this.view.destroy();

      expect(this.view.$node).toBeNull();
    });

    it('should revert DOM changes', function() {
      this.view.destroy();

      // TODO: bad test
      expect(this.$input).not.toHaveClass('tt-input');
    });
  });
});
