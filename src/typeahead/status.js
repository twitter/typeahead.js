var Status = (function () {
  'use strict';

  function Status(options) {
    this.el = '<span role="status" aria-live="polite" class="visuallyhidden"></span>';
    this.$el = $(this.el);
    options.$input.after(this.$el);
    _.each(options.menu.datasets, function (dataset) {
      if (dataset.onSync) {
        dataset.onSync('rendered', this.update.bind(this));
        dataset.onSync('cleared', this.cleared.bind(this));
      }
    }.bind(this));
  }
  _.mixin(Status.prototype, {
    update: function update(event, name, suggestions) {
      var length = suggestions.length;
      var words;
      if (length === 1) {
        words = {
          result: 'result',
          is: 'is'
        };
      } else {
        words = {
          result: 'results',
          is: 'are'
        };
      };
      this.$el.text(length + ' ' + words.result + ' ' + words.is + ' available, use up and down arrow keys to navigate.');
    },
    cleared: function () {
      this.$el.text('');
    }
  });

  return Status;
})();
