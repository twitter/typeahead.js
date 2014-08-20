describe('DefaultResults', function() {
  var www = WWW();

  beforeEach(function() {
    var $fixture;

    jasmine.Dataset.useMock();

    setFixtures('<div id="results-fixture"></div>');

    $fixture = $('#jasmine-fixtures');
    this.$node = $fixture.find('#results-fixture');
    this.$node.html(fixtures.html.dataset);

    this.view = new DefaultResults({ node: this.$node, datasets: [{}] }, www).bind();
    this.dataset = this.view.datasets[0];
  });

  describe('when rendered is triggered on a dataset', function() {
    it('should hide results if empty', function() {
      this.dataset.isEmpty.andReturn(true);

      this.view._show();
      this.dataset.trigger('rendered');

      expect(this.$node).not.toBeVisible();
    });

    it('should not show results if not open', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view._hide();
      this.dataset.trigger('rendered');

      expect(this.$node).not.toBeVisible();
    });

    it('should show results if not empty and open', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view._hide();
      this.view.open();
      this.dataset.trigger('rendered');

      expect(this.$node).toBeVisible();
    });
  });

  describe('when cleared is triggered on a dataset', function() {
    it('should hide results if empty', function() {
      this.dataset.isEmpty.andReturn(true);

      this.view._show();
      this.dataset.trigger('cleared');

      expect(this.$node).not.toBeVisible();
    });

    it('should not show results if not open', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view._hide();
      this.dataset.trigger('cleared');

      expect(this.$node).not.toBeVisible();
    });

    it('should show results if not empty and open', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view._hide();
      this.view.open();
      this.dataset.trigger('cleared');

      expect(this.$node).toBeVisible();
    });
  });

  describe('#open', function() {
    it('should show results if not empty', function() {
      this.$node.removeClass(www.classes.empty);
      this.view.open();

      expect(this.$node).toBeVisible();
    });
  });

  describe('#close', function() {
    it('should hide results', function() {
      this.view._show();
      this.view.close();

      expect(this.$node).not.toBeVisible();
    });
  });
});
