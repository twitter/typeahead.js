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
    expect(status.$el.attr('role')).toEqual('status');
    expect(status.$el.attr('aria-live')).toEqual('polite');
    expect(status.$el.prev()).toEqual(this.$input);
  });

  it('renders a status element that is visible to screen readers', function () {
    expect(status.$el.attr('aria-hidden')).not.toEqual('true');
    expect(status.$el.css('display')).not.toEqual('none');
    expect(status.$el.css('visibility')).not.toEqual('hidden');
    expect(status.$el.height()).not.toEqual(0);
    expect(status.$el.width()).not.toEqual(0);
  });

  it('renders a status element that is hidden on displays', function () {
    expect(status.$el.outerHeight(true)).toEqual(0);
    expect(status.$el.outerWidth(true)).toEqual(0);
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
