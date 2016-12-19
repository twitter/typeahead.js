var Status = (function () {
  'use strict';

  function Status(options) {
    this.el = '<span role="status" aria-live="polite" class="visuallyhidden"></span>';
    this.$el = $(this.el);
    options.$input.after(this.$el);
    _.each(options.menu.datasets, _.bind(function (dataset) {
      if (dataset.onSync) {
        dataset.onSync('rendered', _.bind(this.update, this));
        dataset.onSync('cleared', _.bind(this.cleared, this));
      }
    }, this));
  }
  _.mixin(Status.prototype, {
    update: function update(event, suggestions) {
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
