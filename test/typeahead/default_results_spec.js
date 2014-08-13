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

    it('should not show results if not activated', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view._hide();
      this.dataset.trigger('rendered');

      expect(this.$node).not.toBeVisible();
    });

    it('should show results if not empty and activated', function() {
      this.dataset.isEmpty.andReturn(false);

      this.view._hide();
      this.view.activate();
      this.dataset.trigger('rendered');

      expect(this.$node).toBeVisible();
    });
  });

  describe('#activate', function() {
    it('should show results if not empty', function() {
      this.$node.removeClass(www.classes.empty);
      this.view.activate();

      expect(this.$node).toBeVisible();
    });
  });

  describe('#deactivate', function() {
    it('should hide results', function() {
      this.view._show();
      this.view.deactivate();

      expect(this.$node).not.toBeVisible();
    });
  });
});
