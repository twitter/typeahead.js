var Status = (function () {
  'use strict';

  function Status(options) {
    this.$el = $('<span></span>', {
      'role': 'status',
      'aria-live': 'polite',
    }).css({
      // This `.visuallyhidden` style is inspired by HTML5 Boilerplate
      // https://github.com/h5bp/html5-boilerplate/blob/fea7f22/src/css/main.css#L128
      'position': 'absolute',
      'padding': '0',
      'border': '0',
      'height': '1px',
      'width': '1px',
      'margin-bottom': '-1px',
      'margin-right': '-1px',
      'overflow': 'hidden',
      'clip': 'rect(0 0 0 0)',
      'white-space': 'nowrap',
    });
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
