describe('Status', function() {
  var status;
  var menu;

  beforeEach(function () {

    var $fixture;
    menu = {
      datasets: [
        EventEmitter,
        EventEmitter
      ]
    };

    setFixtures('<input type="text">');

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('input');

    status = new Status({
      $input: this.$input,
      menu: menu
    });

  });

  it('renders a status element after the input', function() {
    expect(status.el).toEqual('<span role="status" aria-live="polite" class="visuallyhidden"></span>');
    expect(status.$el.prev()).toEqual(this.$input);
  });

  describe('when rendered is triggered on the datasets', function() {

    it('should update the status text based on number of suggestion', function() {
      expect(status.$el.text()).toEqual('');

      menu.datasets[0].trigger('rendered', [1, 2, 3]);

      expect(status.$el.text()).toEqual('3 results are available, use up and down arrow keys to navigate.');
    });

    it('should use singular conjugations if only one suggestion', function() {
      expect(status.$el.text()).toEqual('');

      menu.datasets[0].trigger('rendered', [1]);

      expect(status.$el.text()).toEqual('1 result is available, use up and down arrow keys to navigate.');
    });

  });

  describe('when cleaered is triggered on the datasets', function() {
    it('should clear the status text on the suggestion', function() {
      status.$el.text('Text that will be cleared');

      menu.datasets[0].trigger('cleared');

      expect(status.$el.text()).toEqual('');
    });
  });

});
