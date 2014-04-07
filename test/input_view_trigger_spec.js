describe('Input with character triggers', function() {
  var KEYS;

   KEYS = {
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
    var $fixture;

    var atMentionsChar = '@';
    var atMentionsRegex = '\\w*';
    var triggerRegex = new RegExp(atMentionsChar + atMentionsRegex, 'g');

    setFixtures(fixtures.html.input + fixtures.html.hint);

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('.tt-input');
    this.$hint = $fixture.find('.tt-hint');

    this.view = new Input({ input: this.$input, hint: this.$hint, triggerCharacter: atMentionsChar, triggerRegex: triggerRegex });
  });

  it('should throw an error if no hint and/or input is provided', function() {
    expect(noInput).toThrow();

    function noInput() { new Input({ hint: '.hint' }); }
  });

  describe('when the blur DOM event is triggered', function() {
    it('should not reset the input value', function() {
      this.view.setQuery('wine');
      this.view.setInputValue('cheese', true);

      this.$input.blur();

      expect(this.$input.val()).toBe('cheese');
    });
  });

  describe('when the keydown DOM event is triggered by left', function() {
    it('should trigger queryChanged if the the cursor enters the trigger regex match', function() {
      var spy;

      this.view.$input.val('Hey there @cheesehead how are you?');
      setCursorPosition(this.view.$input, 22);

      this.view.setQuery('');
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      moveCursor(this.view, this.$input, 'left');
      moveCursor(this.view, this.$input, 'left');

      waitsFor(function() { return spy.callCount === 1; });
    });

    it('should trigger queryChanged if the the cursor does not enter the trigger regex match', function() {
      this.view.$input.val('Hey there @cheesehead how are you?');
      setCursorPosition(this.view.$input, 29);

      this.view.setQuery('');
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      moveCursor(this.view, this.$input, 'left');
      moveCursor(this.view, this.$input, 'left');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by right', function() {
    it('should trigger queryChanged if the the cursor enters the trigger regex match', function() {
      var spy;

      this.view.$input.val('Hey there @cheesehead how are you?');
      setCursorPosition(this.view.$input, 9);

      this.view.setQuery('');
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      moveCursor(this.view, this.$input, 'right');
      moveCursor(this.view, this.$input, 'right');
      moveCursor(this.view, this.$input, 'right');

      waitsFor(function() { return spy.callCount === 1; });
    });

    it('should trigger queryChanged if the the cursor does not enter the trigger regex match', function() {
      this.view.$input.val('Hey there @cheesehead how are you?');
      setCursorPosition(this.view.$input, 29);

      this.view.setQuery('');
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      moveCursor(this.view, this.$input, 'right');
      moveCursor(this.view, this.$input, 'right');
      moveCursor(this.view, this.$input, 'right');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // NOTE: have to treat these as async because the ie polyfill acts
  // in a async manner
  describe('when the input DOM event is triggered', function() {
    it('should not update query if it doesnt include a trigger', function() {
      this.view.setQuery('wine');
      this.view.setInputValue('cheese', true);

      expect(this.view.getInputValue()).toBe('cheese');
    });

    it('should update query if it includes a trigger', function() {
      this.view.setQuery('wine');
      this.view.setInputValue('I love @cheese', true);

      simulateInputEvent(this.$input);

      waitsFor(function() { return this.view.getQuery() === 'cheese'; });
    });

    it('should not trigger queryChanged if the input value does not include a trigger', function() {
      var spy;

      this.view.setQuery('');
      this.view.setInputValue('cheese', true);
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      simulateInputEvent(this.$input);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger queryChanged if the input value does include a trigger', function() {
      var spy;

      this.view.setQuery('wine');
      this.view.setInputValue('@cheese', true);
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      simulateInputEvent(this.$input);

      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger whitespaceChagned if input value does not include a trigger', function() {
      var spy;

      this.view.setQuery('wine  bar');
      this.view.setInputValue('wine bar', true);
      this.view.onSync('whitespaceChanged', spy = jasmine.createSpy());

      simulateInputEvent(this.$input);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger whitespaceChagned if input value does include a trigger', function() {
      var spy;

      this.view.triggerRegex = /@\w+\s?\w*/g;

      this.view.setQuery('wine  bar');
      this.view.setInputValue('@wine bar', true);
      this.view.onSync('whitespaceChanged', spy = jasmine.createSpy());

      simulateInputEvent(this.$input);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#setInputValue', function() {
    it('should act as setter to the input value', function() {
      this.view.setInputValue('cheese');
      expect(this.view.getInputValue()).toBe('cheese');
    });

    it('should act as setter to the input value with a trigger and set cursor position', function() {
      this.view.setInputValue('@cheese');
      expect(this.view.getInputValue()).toBe('@cheese');
      expect(this.view._getCursorPosition()).toBe('@cheese'.length);
    });

    it('should properly set input with a cursor position and trigger', function() {
      this.view.$input.val('Hey there @ how are you?');
      setCursorPosition(this.view.$input, 11);
      this.view.setInputValue('cheesehead');

      expect(this.view.getInputValue()).toBe('Hey there @cheesehead how are you?');
      expect(this.view._getCursorPosition()).toBe(21);
    });

    it('should trigger {query|whitespace}Changed when applicable', function() {
      var spy1, spy2;

      this.view.triggerRegex = /@\w+\s*\w*/g;

      this.view.onSync('queryChanged', spy1 = jasmine.createSpy());
      this.view.onSync('whitespaceChanged', spy2 = jasmine.createSpy());

      this.view.setInputValue('go @cheese head');
      expect(spy1).toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();

      this.view.setInputValue('go @cheese  head');
      expect(spy1.callCount).toBe(1);
      expect(spy2).toHaveBeenCalled();
    });
  });

  describe('#resetInputValue', function() {
    it('should not reset input value to last query if a trigger is present', function() {
      this.view.setQuery('cheese');
      this.view.setInputValue('cheese and @wine', true);

      this.view.resetInputValue();
      expect(this.view.getInputValue()).toBe('cheese and @wine');
    });
  });

  // helper functions
  // ----------------

  function simulateInputEvent($node) {
    var $e, type;

    type = _.isMsie() ? 'keypress' : 'input';
    $e = $.Event(type);

    $node.trigger($e);
  }

  function moveCursor(ctx, $node, rightOrLeft) {
    var cursorPosition, key;

    key = rightOrLeft === 'left' ? KEYS.left : KEYS.right;
    simulateKeyEvent($node, 'keydown', key);

    cursorPosition = ctx._getCursorPosition();
    rightOrLeft === 'left' ? cursorPosition-- : cursorPosition++;
    setCursorPosition($node, cursorPosition);
  }

  function simulateKeyEvent($node, type, key, withModifier) {
    var $e;

    $e = $.Event(type, {
      keyCode: key,
      altKey: !!withModifier,
      ctrlKey: !!withModifier,
      metaKey: !!withModifier,
      shiftKey: !!withModifier
    });

    spyOn($e, 'preventDefault');
    $node.trigger($e);

    return $e;
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
