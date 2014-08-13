describe('Typeahead', function() {
  var www, testData;

  www = WWW();

  beforeEach(function() {
    var $fixture, $input;

    jasmine.Input.useMock();
    jasmine.Dataset.useMock();
    jasmine.Results.useMock();

    setFixtures('<input type="text">');

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('input');

    testData = { val: 'foo bar', obj: 'fiz' };

    this.view = new Typeahead({
      input: new Input(),
      results: new Results(),
      eventBus: new EventBus({ el: this.$input })
    }, www);

    this.input = this.view.input;
    this.results = this.view.results;
  });

  describe('when results triggers selectableClicked', function() {
    it('should select the selectable', function() {
      var $el;

      spyOn(this.view, 'select');

      this.results.trigger('selectableClicked', $el = $('<bah>'));
      expect(this.view.select).toHaveBeenCalledWith($el);
    });
  });

  describe('when results triggers datasetRendered', function() {
    it('should update the hint asynchronously', function() {
      this.input.hasFocus.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.results.getTopSelectable.andReturn($('<fiz>'));
      this.results.getDataFromSelectable.andReturn(testData);

      this.input.getInputValue.andReturn(testData.val.slice(0, 2));

      this.results.trigger('datasetRendered');

      // ensure it wasn't called synchronously
      expect(this.input.setHint).not.toHaveBeenCalled();

      waitsFor(function() {
        return !!this.input.setHint.callCount;
      });

      runs(function() {
        expect(this.input.setHint).toHaveBeenCalledWith(testData.val);
      });
    });
  });

  describe('when input triggers focused', function() {
    it('should activate results', function() {
      this.input.trigger('focused');
      expect(this.results.activate).toHaveBeenCalled();
    });

    it('should update results for current query', function() {
      this.input.getQuery.andReturn('bar');
      this.input.trigger('focused');
      expect(this.results.update).toHaveBeenCalledWith('bar');
    });
  });

  describe('when input triggers blurred', function() {
    it('should deactivate results', function() {
      this.input.trigger('blurred');
      expect(this.results.deactivate).toHaveBeenCalled();
    });

    it('should reset the input', function() {
      this.input.trigger('blurred');
      expect(this.input.resetInputValue).toHaveBeenCalled();
    });
  });

  describe('when input triggers enterKeyed', function() {
    it('should select selectable if there is an active one', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.results.getActiveSelectable.andReturn($el);

      this.input.trigger('enterKeyed', $e);

      expect(this.view.select).toHaveBeenCalledWith($el);
    });

    it('should prevent default if active selectale ', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.results.getActiveSelectable.andReturn($el);

      this.input.trigger('enterKeyed', $e);

      expect($e.preventDefault).toHaveBeenCalled();
    });

    it('should not select selectable if there is no active one', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);

      this.input.trigger('enterKeyed', $e);

      expect(this.view.select).not.toHaveBeenCalledWith($el);
    });

    it('should not prevent default if no active selectale ', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);

      this.input.trigger('enterKeyed', $e);

      expect($e.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('when input triggers tabKeyed', function() {
    it('should select selectable if there is an active one', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.results.getActiveSelectable.andReturn($el);

      this.input.trigger('tabKeyed', $e);

      expect(this.view.select).toHaveBeenCalledWith($el);
    });

    it('should prevent default if active selectale ', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);
      this.results.getActiveSelectable.andReturn($el);

      this.input.trigger('tabKeyed', $e);

      expect($e.preventDefault).toHaveBeenCalled();
    });

    it('should not select selectable if there is no active one', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);

      this.input.trigger('tabKeyed', $e);

      expect(this.view.select).not.toHaveBeenCalledWith($el);
    });

    it('should not prevent default if no active selectale', function() {
      var $el, $e;
      spyOn(this.view, 'select');

      $el = $('<bah>');
      $e = jasmine.createSpyObj('event', ['preventDefault']);

      this.input.trigger('tabKeyed', $e);

      expect($e.preventDefault).not.toHaveBeenCalled();
    });

    it('should autocomplete', function() {
      assertAutocomplete.call(this, 'tabKeyed');
    });
  });

  describe('when input triggers escKeyed', function() {
    it('should deactivate results', function() {
      this.input.trigger('escKeyed');
      expect(this.results.deactivate).toHaveBeenCalled();
    });

    it('should reset the input', function() {
      this.input.trigger('escKeyed');
      expect(this.input.resetInputValue).toHaveBeenCalled();
    });
  });

  describe('when input triggers upKeyed', moveCursorTests('up'));

  describe('when input triggers downKeyed', moveCursorTests('down'));

  describe('when input triggers leftKeyed', function() {
    it('should autocomplete if language is rtl', function() {
      this.view.dir = 'rtl';
      assertAutocomplete.call(this, 'leftKeyed');
    });
  });

  describe('when input triggers rightKeyed', function() {
    it('should autocomplete if language is ltr', function() {
      this.view.dir = 'ltr';
      assertAutocomplete.call(this, 'rightKeyed');
    });
  });

  describe('when input triggers queryChanged', function() {
    it('should activate results', function() {
      this.input.trigger('queryChanged', '');
      expect(this.results.activate).toHaveBeenCalled();
    });

    it('should clear the hint if it has become invalid', function() {
      this.input.trigger('queryChanged', '');
      expect(this.input.clearHintIfInvalid).toHaveBeenCalled();
    });

    it('should empty results if minLength is not satisfied', function() {
        this.view.minLength = 100;
        this.input.trigger('queryChanged', '');

        expect(this.results.empty).toHaveBeenCalled();
    });

    it('should update results if minLength is satisfied', function() {
        this.input.trigger('queryChanged', 'fiz');

        expect(this.results.update).toHaveBeenCalledWith('fiz');
    });

    it('should set the language direction', function() {
      this.input.getLanguageDirection.andReturn('rtl');

      this.input.trigger('queryChanged', '');

      expect(this.view.dir).toBe('rtl');
      expect(this.results.setLanguageDirection).toHaveBeenCalledWith('rtl');
    });
  });

  describe('when input triggers whitespaceChanged', function() {
    it('should activate results', function() {
      this.input.trigger('whitespaceChanged');
      expect(this.results.activate).toHaveBeenCalled();
    });

    it('should update the hint', function() {
      this.input.hasFocus.andReturn(true);
      this.input.hasOverflow.andReturn(false);
      this.results.getTopSelectable.andReturn($('<fiz>'));
      this.results.getDataFromSelectable.andReturn(testData);

      this.input.getInputValue.andReturn(testData.val.slice(0, 2));

      this.input.trigger('whitespaceChanged');

      expect(this.input.setHint).toHaveBeenCalledWith(testData.val);
    });
  });

  describe('#getVal', function() {
    it('should return the current query', function() {
      this.input.getQuery.andReturn('woah');

      expect(this.view.getVal()).toBe('woah');
    });
  });

  describe('#setVal', function() {
    it('should update query', function() {
      this.input.hasFocus.andReturn(true);
      this.view.setVal('woah');

      expect(this.input.setInputValue).toHaveBeenCalledWith('woah');
    });

    it('should update query silently if not activated', function() {
      this.input.hasFocus.andReturn(false);
      this.view.setVal('woah');

      expect(this.input.setQuery).toHaveBeenCalledWith('woah');
      expect(this.input.setInputValue).toHaveBeenCalledWith('woah', true);
    });
  });

  describe('#select', function() {
    it('should do nothing if element is not a selectable', function() {
      var spy;

      this.results.getDataFromSelectable.andReturn(null);
      this.$input.on('typeahead:selected', spy = jasmine.createSpy());

      this.view.select($('<bah>'));

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger select', function() {
      var spy;

      this.results.getDataFromSelectable.andReturn(testData);
      this.$input.on('typeahead:select', spy = jasmine.createSpy());

      this.view.select($('<bah>'));

      expect(spy).toHaveBeenCalled();
    });

    it('should cancel if select is prevented', function() {
      var spy1, spy2;

      spy1 = jasmine.createSpy().andCallFake(prevent);
      spy2 = jasmine.createSpy();

      this.results.getDataFromSelectable.andReturn(testData);
      this.$input.on('typeahead:select', spy1).on('typeahead:selected', spy2);

      this.view.select($('<bah>'));

      expect(spy1).toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });

    it('should update input value', function() {
      this.results.getDataFromSelectable.andReturn(testData);

      this.view.select($('<bah>'));

      expect(this.input.setQuery).toHaveBeenCalledWith(testData.val);
      expect(this.input.setInputValue).toHaveBeenCalledWith(testData.val, true);
    });

    it('should set the language direction', function() {
      this.input.getLanguageDirection.andReturn('rtl');
      this.results.getDataFromSelectable.andReturn(testData);

      this.view.select($('<bah>'));

      expect(this.view.dir).toBe('rtl');
      expect(this.results.setLanguageDirection).toHaveBeenCalledWith('rtl');
    });

    it('should trigger selected', function() {
      var spy;

      this.results.getDataFromSelectable.andReturn(testData);
      this.$input.on('typeahead:selected', spy = jasmine.createSpy());

      this.view.select($('<bah>'));

      expect(spy).toHaveBeenCalled();
    });

    it('should deactive results asynchronously', function() {
      this.results.getDataFromSelectable.andReturn(testData);

      this.view.select($('<bah>'));

      waitsFor(function() { return !!this.results.deactivate.callCount; });
    });
  });

  describe('#destroy', function() {
    it('should destroy input', function() {
      this.view.destroy();

      expect(this.input.destroy).toHaveBeenCalled();
    });

    it('should destroy results', function() {
      this.view.destroy();

      expect(this.results.destroy).toHaveBeenCalled();
    });
  });

  function moveCursorTests(dir) {
    var eventName, delta;

    eventName = dir + 'Keyed';
    delta = dir === 'up' ? -1 : +1;

    return function() {
      beforeEach(function() {
        this.input.getQuery.andReturn('fiz');
      });

      it('should activate results', function() {
        this.input.trigger(eventName);

        expect(this.results.activate).toHaveBeenCalled();
      });

      it('should update results if minLength is satisfied', function() {
        this.input.trigger(eventName);

        expect(this.results.update).toHaveBeenCalledWith('fiz');
      });

      it('should move cursor if minLength is not satisfied', function() {
        this.view.minLength = 100;
        this.results.update.andReturn(true);

        this.input.trigger(eventName);

        expect(this.results.setCursor).toHaveBeenCalled();
      });

      it('should move cursor if invalid update', function() {
        this.results.update.andReturn(false);
        this.input.trigger(eventName);

        expect(this.results.setCursor).toHaveBeenCalled();
      });

      it('should not move cursor if valid update', function() {
        this.results.update.andReturn(true);

        this.input.trigger(eventName);

        expect(this.results.setCursor).not.toHaveBeenCalled();
      });

      it('should trigger cursorchange before setting cursor', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:cursorchange', spy);

        this.input.trigger(eventName);

        expect(spy).toHaveBeenCalled();
      });

      it('should cancel if cursorchange is prevented', function() {
        var spy = jasmine.createSpy().andCallFake(prevent);

        this.$input.on('typeahead:cursorchange', spy);

        this.input.trigger(eventName);

        expect(this.results.setCursor).not.toHaveBeenCalled();
      });

      it('should update the input value if moved to selectable', function() {
        this.results.selectableRelativeToCursor.andReturn($('<fiz>'));
        this.results.getDataFromSelectable.andReturn(testData);

        this.input.trigger(eventName);

        expect(this.input.setInputValue).toHaveBeenCalledWith(testData.val, true);
      });

      it('should reset the input value if moved to input', function() {
        this.input.trigger(eventName);

        expect(this.input.resetInputValue).toHaveBeenCalled();
      });

      it('should update the hint', function() {
        this.input.hasFocus.andReturn(true);
        this.input.hasOverflow.andReturn(false);
        this.results.getTopSelectable.andReturn($('<fiz>'));
        this.results.getDataFromSelectable.andCallFake(fake);
        this.input.getInputValue.andReturn(testData.val.slice(0, 2));

        this.input.trigger(eventName);

        expect(this.input.setHint).toHaveBeenCalledWith(testData.val);

        function fake($el) {
          return ($el && $el.prop('tagName') === 'FIZ') ? testData : null;
        }
      });

      it('should trigger cursorchanged after setting cursor', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:cursorchanged', spy);

        this.input.trigger(eventName);

        expect(spy).toHaveBeenCalled();
      });
    };
  }

  function assertAutocomplete(eventName) {
    var spy1, spy2;

    this.input.getQuery.andReturn('bi');
    this.input.getHint.andReturn(testData.val);
    this.input.isCursorAtEnd.andReturn(true);
    this.results.getTopSelectable.andReturn($('<bah>'));
    this.results.getDataFromSelectable.andReturn(testData);
    this.$input.on('typeahead:autocomplete', spy1 = jasmine.createSpy());
    this.$input.on('typeahead:autocompleted', spy2 = jasmine.createSpy());

    this.input.trigger(eventName);

    expect(this.input.setInputValue).toHaveBeenCalledWith(testData.val);
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  }

  function prevent($e) { $e.preventDefault(); }
});

