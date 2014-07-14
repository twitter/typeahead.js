describe('Results', function() {
  var www = WWW();

  beforeEach(function() {
    var $fixture;

    jasmine.Dataset.useMock();

    setFixtures('<div id="results-fixture"></div>');

    $fixture = $('#jasmine-fixtures');
    this.$node = $fixture.find('#results-fixture');
    this.$node.html(fixtures.html.dataset);

    this.view = new Results({ node: this.$node, datasets: [{}] }, www).bind();
    this.dataset = this.view.datasets[0];
  });

  it('should throw an error if node is missing', function() {
    expect(noNode).toThrow();
    function noNode() { new Results({ datasets: [{}] }, www); }
  });

  describe('when click event is triggered on a selectable', function() {
    it('should trigger selectableClicked', function() {
      var spy;

      this.view.onSync('selectableClicked', spy = jasmine.createSpy());

      this.$node.find(www.selectors.selectable).first().click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when mouseenter is triggered on a selectable', function() {
    it('should remove pre-existing cursor', function() {
      var $first, $last;

      $first = this.$node.find(www.selectors.selectable).first();
      $last = this.$node.find(www.selectors.selectable).last();

      $first.addClass(www.classes.cursor);
      $last.mouseenter();

      expect($first).not.toHaveClass(www.classes.cursor);
      expect($last).toHaveClass(www.classes.cursor);
    });

    it('should set the cursor', function() {
      var $selectable;

      $selectable = this.$node.find(www.selectors.selectable).first();
      $selectable.mouseenter();

      expect($selectable).toHaveClass(www.classes.cursor);
    });

    it('should not trigger cursorMoved', function() {
      var spy, $selectable;

      this.view.onSync('cursorMoved', spy = jasmine.createSpy());

      $selectable = this.$node.find(www.selectors.selectable).first();
      $selectable.mouseenter();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when mouseleave is triggered on a selectable', function() {
    it('should remove the cursor', function() {
      var $selectable;

      $selectable = this.$node.find(www.selectors.selectable).first();
      $selectable.mouseenter().mouseleave();

      expect($selectable).not.toHaveClass(www.classes.cursor);
    });
  });

  describe('when rendered is triggered on a dataset', function() {
    it('should add empty class to node if empty', function() {
      this.dataset.isEmpty.andReturn(true);

      this.$node.removeClass(www.classes.empty);
      this.dataset.trigger('rendered');

      expect(this.$node).toHaveClass(www.classes.empty);
    });

    it('should remove empty class from node if not empty', function() {
      this.dataset.isEmpty.andReturn(false);

      this.$node.addClass(www.classes.empty);
      this.dataset.trigger('rendered');

      expect(this.$node).not.toHaveClass(www.classes.empty);
    });

    it('should trigger datasetRendered', function() {
      var spy;

      this.view.onSync('datasetRendered', spy = jasmine.createSpy());
      this.dataset.trigger('rendered');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#activate', function() {
    it('should add activated class to node', function() {
      this.$node.removeClass(www.classes.activated);
      this.view.activate();

      expect(this.$node).toHaveClass(www.classes.activated);
    });
  });

  describe('#deactivate', function() {
    it('should remove activated class to node', function() {
      this.$node.addClass(www.classes.activated);
      this.view.deactivate();

      expect(this.$node).not.toHaveClass(www.classes.activated);
    });

    it('should remove cursor', function() {
      var $selectable;

      $selectable = this.view._getSelectables().first();
      this.view._setCursor($selectable);

      expect($selectable).toHaveClass(www.classes.cursor);

      this.view.deactivate();

      expect($selectable).not.toHaveClass(www.classes.cursor);
    });
  });

  describe('#setLanguageDirection', function() {
    it('should update css for given language direction', function() {
      this.view.setLanguageDirection('rtl');
      expect(this.$node).toHaveAttr('dir', 'rtl');

      this.view.setLanguageDirection('ltr');
      expect(this.$node).toHaveAttr('dir', 'ltr');
    });
  });

  describe('#moveCursorUp', function() {
    it('should move the cursor up', function() {
      var $first, $second;

      $first = this.view._getSelectables().eq(0);
      $second = this.view._getSelectables().eq(1);

      this.view._setCursor($second);
      this.view.moveCursorUp();
      expect(this.view.getActiveSelectable()).toBe($first);
    });

    it('should move cursor to bottom if cursor is not present', function() {
      var $bottom;

      $bottom = this.view._getSelectables().eq(-1);

      this.view.moveCursorUp();
      expect(this.view.getActiveSelectable()).toBe($bottom);
    });

    it('should remove cursor if already at top', function() {
      var $first;

      $first = this.view._getSelectables().eq(0);

      this.view._setCursor($first);
      this.view.moveCursorUp();
      expect(this.view.getActiveSelectable()).toBeNull();
    });
  });

  describe('#moveCursorDown', function() {
    it('should move the cursor down', function() {
      var $first, $second;

      $first = this.view._getSelectables().eq(0);
      $second = this.view._getSelectables().eq(1);

      this.view._setCursor($first);
      this.view.moveCursorDown();
      expect(this.view.getActiveSelectable()).toBe($second);
    });

    it('should move cursor to top if cursor is not present', function() {
      var $first;

      $first = this.view._getSelectables().eq(0);

      this.view.moveCursorDown();
      expect(this.view.getActiveSelectable()).toBe($first);
    });

    it('should remove cursor if already at bottom', function() {
      var $bottom;

      $bottom = this.view._getSelectables().eq(-1);

      this.view._setCursor($bottom);
      this.view.moveCursorDown();
      expect(this.view.getActiveSelectable()).toBeNull();
    });
  });

  describe('#getDataFromSelectable', function() {
    it('should extract the data from the selectable element', function() {
      var $selectable, datum;

      $selectable = $('<div>').data({
        'tt-selectable-display': 'one',
        'tt-selectable-object': 'two'
      });

      data = this.view.getDataFromSelectable($selectable);

      expect(data).toEqual({ val: 'one', obj: 'two' });
    });

    it('should return null if no element is given', function() {
      expect(this.view.getDataFromSelectable($('notreal'))).toBeNull();
    });
  });

  describe('#getActiveSelectable', function() {
    it('should return the selectable the cursor is on', function() {
      var $first;

      $first = this.view._getSelectables().eq(0);
      this.view._setCursor($first);

      expect(this.view.getActiveSelectable()).toBe($first);
    });

    it('should return null if the cursor is off', function() {
      expect(this.view.getActiveSelectable()).toBeNull();
    });
  });

  describe('#getTopSelectable', function() {
    it('should return the selectable at the top of the results', function() {
      var $first;

      $first = this.view._getSelectables().eq(0);
      expect(this.view.getTopSelectable()).toBe($first);
    });
  });

  describe('#update', function() {
    it('should invoke update on each dataset if valid update', function() {
      this.view.update('fiz');
      expect(this.dataset.update).toHaveBeenCalled();
    });

    it('should return true when valid update', function() {
      expect(this.view.update('fiz')).toBe(true);
    });

    it('should return false when invalid update', function() {
      this.view.update('fiz');
      expect(this.view.update('fiz')).toBe(false);
    });
  });

  describe('#empty', function() {
    it('should set query to null', function() {
      this.view.query = 'fiz';
      this.view.empty();

      expect(this.view.query).toBeNull();
    });

    it('should add empty class to node', function() {
      this.$node.removeClass(www.classes.empty);
      this.view.empty();

      expect(this.$node).toHaveClass(www.classes.empty);
    });

    it('should invoke clear on each dataset', function() {
      this.view.empty();
      expect(this.dataset.clear).toHaveBeenCalled();
    });
  });

  describe('#destroy', function() {
    it('should remove event handlers', function() {
      var $node = this.view.$node;

      spyOn($node, 'off');
      this.view.destroy();
      expect($node.off).toHaveBeenCalledWith('.tt');
    });

    it('should destroy its datasets', function() {
      this.view.destroy();
      expect(this.dataset.destroy).toHaveBeenCalled();
    });

    it('should null out its reference to the node element', function() {
      this.view.destroy();
      expect(this.view.$node).toBeNull();
    });
  });
});
