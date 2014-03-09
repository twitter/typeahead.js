describe('Typeahead', function() {
  var testDatum;

  beforeEach(function() {
    var $fixture, $input;

    jasmine.Input.useMock();
    jasmine.Dataset.useMock();
    jasmine.Dropdown.useMock();

    setFixtures(fixtures.html.textInput);

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('input');

    testDatum = fixtures.data.simple[0];

    this.view = new Typeahead({
      input: this.$input,
      withHint: true,
      datasets: {}
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
      expect(this.input.setQuery).toHaveBeenCalledWith(testDatum.value);
      expect(this.input.setInputValue)
      .toHaveBeenCalledWith(testDatum.value, true);

      waitsFor(function() { return this.dropdown.close.callCount; });
    });
  });

  describe('when dropdown triggers cursorMoved', function() {
    beforeEach(function() {
      this.dropdown.getDatumForCursor.andReturn(testDatum);
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

      expect(this.input.setHint).toHaveBeenCalledWith(testDatum.value);
    });
  });

  describe('when dropdown triggers datasetRendered', function() {
    it('should update the hint asynchronously', function() {
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.dropdown.isVisible.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.input.getInputValue.andReturn(testDatum.value.slice(0, 2));

      this.dropdown.trigger('datasetRendered');

      // ensure it wasn't called synchronously
      expect(this.input.setHint).not.toHaveBeenCalled();

      waitsFor(function() {
        return !!this.input.setHint.callCount;
      });

      runs(function() {
        expect(this.input.setHint).toHaveBeenCalledWith(testDatum.value);
      });
    });
  });

  describe('when dropdown triggers opened', function() {
    it('should update the hint', function() {
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.dropdown.isVisible.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.input.getInputValue.andReturn(testDatum.value.slice(0, 2));

      this.dropdown.trigger('opened');

      expect(this.input.setHint).toHaveBeenCalledWith(testDatum.value);
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
    it('should activate the typeahead', function() {
      this.input.trigger('focused');

      expect(this.view.isActivated).toBe(true);
    });

    it('should open the dropdown', function() {
      this.input.trigger('focused');

      expect(this.dropdown.open).toHaveBeenCalled();
    });
  });

  describe('when input triggers blurred', function() {
    it('should deactivate the typeahead', function() {
      this.input.trigger('blurred');

      expect(this.view.isActivated).toBe(false);
    });

    it('should empty the dropdown', function() {
      this.input.trigger('blurred');

      expect(this.dropdown.empty).toHaveBeenCalled();
    });

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
      expect(this.input.setQuery).toHaveBeenCalledWith(testDatum.value);
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
        expect(this.input.setQuery).toHaveBeenCalledWith(testDatum.value);
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
        this.input.getHint.andReturn(testDatum.value);
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
    beforeEach(function() {
      this.input.getQuery.andReturn('ghost');
    });

    describe('when dropdown is empty and minLength is satisfied', function() {
      beforeEach(function() {
        this.dropdown.isEmpty = true;
        this.view.minLength = 2;

        this.input.trigger('upKeyed');
      });

      it('should update dropdown', function() {
        expect(this.dropdown.update).toHaveBeenCalledWith('ghost');
      });

      it('should not move cursor up', function() {
        expect(this.dropdown.moveCursorUp).not.toHaveBeenCalled();
      });
    });

    describe('when dropdown is not empty', function() {
      beforeEach(function() {
        this.dropdown.isEmpty = false;
        this.view.minLength = 2;

        this.input.trigger('upKeyed');
      });

      it('should not update dropdown', function() {
        expect(this.dropdown.update).not.toHaveBeenCalled();
      });

      it('should move cursor up', function() {
        expect(this.dropdown.moveCursorUp).toHaveBeenCalled();
      });
    });

    describe('when minLength is not satisfied', function() {
      beforeEach(function() {
        this.dropdown.isEmpty = true;
        this.view.minLength = 10;

        this.input.trigger('upKeyed');
      });

      it('should not update dropdown', function() {
        expect(this.dropdown.update).not.toHaveBeenCalled();
      });

      it('should move cursor up', function() {
        expect(this.dropdown.moveCursorUp).toHaveBeenCalled();
      });
    });

    it('should open the dropdown', function() {
      this.input.trigger('upKeyed');

      expect(this.dropdown.open).toHaveBeenCalled();
    });
  });

  describe('when input triggers downKeyed', function() {
    beforeEach(function() {
      this.input.getQuery.andReturn('ghost');
    });

    describe('when dropdown is empty and minLength is satisfied', function() {
      beforeEach(function() {
        this.dropdown.isEmpty = true;
        this.view.minLength = 2;

        this.input.trigger('downKeyed');
      });

      it('should update dropdown', function() {
        expect(this.dropdown.update).toHaveBeenCalledWith('ghost');
      });

      it('should not move cursor down', function() {
        expect(this.dropdown.moveCursorDown).not.toHaveBeenCalled();
      });
    });

    describe('when dropdown is not empty', function() {
      beforeEach(function() {
        this.dropdown.isEmpty = false;
        this.view.minLength = 2;

        this.input.trigger('downKeyed');
      });

      it('should not update dropdown', function() {
        expect(this.dropdown.update).not.toHaveBeenCalled();
      });

      it('should move cursor down', function() {
        expect(this.dropdown.moveCursorDown).toHaveBeenCalled();
      });
    });

    describe('when minLength is not satisfied', function() {
      beforeEach(function() {
        this.dropdown.isEmpty = true;
        this.view.minLength = 10;

        this.input.trigger('downKeyed');
      });

      it('should not update dropdown', function() {
        expect(this.dropdown.update).not.toHaveBeenCalled();
      });

      it('should move cursor down', function() {
        expect(this.dropdown.moveCursorDown).toHaveBeenCalled();
      });
    });

    it('should open the dropdown', function() {
      this.input.trigger('downKeyed');

      expect(this.dropdown.open).toHaveBeenCalled();
    });
  });

  describe('when input triggers leftKeyed', function() {
    it('should autocomplete if language is rtl', function() {
      var spy;

      this.view.dir = 'rtl';
      this.input.getQuery.andReturn('bi');
      this.input.getHint.andReturn(testDatum.value);
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
      this.input.getHint.andReturn(testDatum.value);
      this.input.isCursorAtEnd.andReturn(true);
      this.dropdown.getDatumForTopSuggestion.andReturn(testDatum);
      this.$input.on('typeahead:autocompleted', spy = jasmine.createSpy());

      this.input.trigger('rightKeyed');

      expect(this.input.setInputValue).toHaveBeenCalledWith(testDatum.value);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when input triggers queryChanged', function() {
    it('should clear the hint if it has become invalid', function() {
      this.input.trigger('queryChanged', testDatum.value);

      expect(this.input.clearHintIfInvalid).toHaveBeenCalled();
    });

    it('should empty dropdown if the query is empty', function() {
      this.input.trigger('queryChanged', '');

      expect(this.dropdown.empty).toHaveBeenCalled();
    });

    it('should not empty dropdown if the query is non-empty', function() {
      this.input.trigger('queryChanged', testDatum.value);

      expect(this.dropdown.empty).not.toHaveBeenCalled();
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

      expect(this.input.setHint).toHaveBeenCalledWith(testDatum.value);
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

  describe('#getVal', function() {
    it('should return the current query', function() {
      this.input.getQuery.andReturn('woah');
      this.view.close();

      expect(this.view.getVal()).toBe('woah');
    });
  });

  describe('#setVal', function() {
    it('should update query', function() {
      this.view.isActivated = true;
      this.view.setVal('woah');

      expect(this.input.setInputValue).toHaveBeenCalledWith('woah');
    });

    it('should update query silently if not activated', function() {
      this.view.setVal('woah');

      expect(this.input.setQuery).toHaveBeenCalledWith('woah');
      expect(this.input.setInputValue).toHaveBeenCalledWith('woah', true);
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
