describe('InputView', function() {
  var fixture = [
        '<input class="tt-search-input tt-query" type="text" autocomplete="false" spellcheck="false">',
        '<input class="tt-search-input tt-hint" type="text" autocomplete="false" spellcheck="false" disabled>'
      ].join('\n'),
     KEY_MAP = {
      enter: 13,
      esc: 27,
      tab: 9,
      left: 37,
      right: 39,
      up: 38,
      down: 40,
      normal: 65 // "A" key
    };

  beforeEach(function() {
    var $fixtures;

    setFixtures(fixture);

    $fixtures = $('#jasmine-fixtures');
    this.$input = $fixtures.find('.tt-query');
    this.$hint = $fixtures.find('.tt-hint');

    this.inputView = new InputView({ input: this.$input, hint: this.$hint });
  });

  // event listeners
  // ---------------

  describe('when input gains focus', function() {
    beforeEach(function() {
      this.inputView.on('focused', this.spy = jasmine.createSpy());

      this.$input.blur().focus();
    });

    it('should trigger focused', function() {
      expect(this.spy).toHaveBeenCalled();
    });
  });

  describe('when query loses focus', function() {
    beforeEach(function() {
      this.inputView.on('blured', this.spy = jasmine.createSpy());

      this.$input.focus().blur();
    });

    it('should trigger blured', function() {
      expect(this.spy).toHaveBeenCalled();
    });
  });

  describe('when keydown', function() {
    var keys = ['esc', 'tab', 'left', 'right', 'up', 'down', 'enter'];

    beforeEach(function() {
      var that = this;

      this.spies = {};

      keys.forEach(function(key) {
        that.inputView.on(key + 'Keyed', that.spies[key] = jasmine.createSpy());
      });
    });

    // DRY principle in practice
    keys.forEach(function(key) {
      describe('if ' + key, function() {
        beforeEach(function() {
          simulateKeyEvent(this.$input, 'keydown', KEY_MAP[key]);
        });

        it('should trigger ' + key + 'Keyed', function() {
          expect(this.spies[key]).toHaveBeenCalled();
        });
      });
    });
  });

  describe('when input', function() {
    beforeEach(function() {
      this.inputView.on('queryChanged', this.qcSpy = jasmine.createSpy());
      this.inputView.on('whitespaceChanged', this.wcSpy = jasmine.createSpy());
    });

    describe('if query changed', function() {
      beforeEach(function() {
        this.inputView.query = 'old';
        this.inputView.$input.val('new');

        simulateKeyEvent(this.$input, 'input', KEY_MAP.NORMAL);
      });

      it('should trigger queryChanged', function() {
        expect(this.qcSpy).toHaveBeenCalled();
      });

      it('should not trigger whitespaceChanged', function() {
        expect(this.wcSpy).not.toHaveBeenCalled();
      });

      it('should update internal query value', function() {
        expect(this.inputView.getQuery()).toEqual('new');
      });
    });

    describe('if only whitespace in query has changed', function() {
      beforeEach(function() {
        this.inputView.query = 'old town';
        this.inputView.$input.val('old   town');

        simulateKeyEvent(this.$input, 'input', KEY_MAP.NORMAL);
      });

      it('should trigger whitespaceChanged', function() {
        expect(this.wcSpy).toHaveBeenCalled();
      });

      it('should not trigger queryChanged', function() {
        expect(this.qcSpy).not.toHaveBeenCalled();
      });

      it('should not update internal query value', function() {
        expect(this.inputView.getQuery()).toEqual('old town');
      });
    });

    describe('if the query did not change', function() {
      beforeEach(function() {
        this.inputView.query = 'old';
        this.inputView.$input.val('old');

        simulateKeyEvent(this.$input, 'input', KEY_MAP.NORMAL);
      });

      it('should not trigger queryChanged', function() {
        expect(this.qcSpy).not.toHaveBeenCalled();
      });

      it('should not trigger whitespaceChanged', function() {
        expect(this.wcSpy).not.toHaveBeenCalled();
      });
    });
  });

  // public methods
  // --------------

  describe('#constructor', function() {
    beforeEach(function() {
      this.inputView.destroy();

      this.$input.val('hey there');
      this.inputView = new InputView({ input: this.$input, hint: this.$hint });
    });

    it('should default the query to the value of the input', function() {
      expect(this.inputView.getQuery()).toBe('hey there');
    });
  });

  describe('#destroy', function() {
    beforeEach(function() {
      this.inputView.destroy();
    });

    it('should remove event listeners', function() {
      expect($._data(this.$hint, 'events')).toBeUndefined();
      expect($._data(this.$input, 'events')).toBeUndefined();
    });

    it('should drop references to DOM elements', function() {
      expect(this.inputView.$hint).toBeNull();
      expect(this.inputView.$input).toBeNull();
      expect(this.inputView.$overflowHelper).toBeNull();
    });
  });

  describe('#focus', function() {
    beforeEach(function() {
      this.inputView.focus();
    });

    it('should focus on the input', function() {
      expect(this.$input).toBeFocused();
    });
  });

  describe('#blur', function() {
    beforeEach(function() {
      this.$input.focus();
      this.inputView.blur();
    });

    it('should blur on the input', function() {
      expect(this.$input).not.toBeFocused();
    });
  });

  describe('#getQuery', function() {
    it('should act as a getter for query', function() {
      this.inputView.query = 'i am the query value';
      expect(this.inputView.getQuery()).toBe('i am the query value');
    });
  });

  describe('#getInputValue', function() {
    it('should return the value of the input', function() {
      this.$input.val('i am input');
      expect(this.inputView.getInputValue()).toBe('i am input');
    });
  });

  describe('#setInputValue', function() {
    it('should set the value of the input', function() {
      this.inputView.setInputValue('updated input');
      expect(this.$input).toHaveValue('updated input');
    });
  });

  describe('#getHintValue', function() {
    it('should return the value of the hint', function() {
      this.$hint.val('i am a hint');
      expect(this.inputView.getHintValue()).toBe('i am a hint');
    });
  });

  describe('#setHintValue', function() {
    it('should set the value of the hint', function() {
      this.inputView.setHintValue('updated hint');
      expect(this.$hint).toHaveValue('updated hint');
    });
  });

  describe('#getLanguageDirection', function() {
    it('should default to ltr', function() {
      expect(this.inputView.getLanguageDirection()).toBe('ltr');
    });

    it('should return value of input\'s dir attribute', function() {
      this.$input.attr('dir', 'rtl');
      expect(this.inputView.getLanguageDirection()).toBe('rtl');
    });
  });

  describe('#isOverflow', function() {
    describe('when input\'s value is overflowing', function() {
      it('should return false', function() {
        this.$input.val(new Array(1000).join('a'));
        expect(this.inputView.isOverflow()).toBe(true);
      });
    });

    describe('when input\'s value is not overflowing', function() {
      it('should return false', function() {
        this.$input.val('t');
        expect(this.inputView.isOverflow()).toBe(false);
      });
    });
  });

  describe('#isCursorAtEnd', function() {
    beforeEach(function() {
      this.$input.val('text cursor goes here');
    });

    describe('when cursor is not at the end', function() {
      beforeEach(function() {
        setCursorPosition(this.$input, this.$input.val().length / 2);
      });

      it('should return false', function() {
        expect(this.inputView.isCursorAtEnd()).toBe(false);
      });
    });

    describe('when cursor is at the end', function() {
      beforeEach(function() {
        setCursorPosition(this.$input, this.$input.val().length);
      });

      it('should return true', function() {
        expect(this.inputView.isCursorAtEnd()).toBe(true);
      });
    });
  });

  // helper functions
  // ----------------

  function simulateKeyEvent($node, type, key) {
    var event = $.Event(type, { keyCode: key });

    spyOn(event, 'preventDefault');
    $node.trigger(event);

    return event;
  }

  function setCursorPosition($input, pos) {
    var input = $input[0], range;

    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(pos, pos);
    }

    else if (input.createTextRange) {
      range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  }
});
