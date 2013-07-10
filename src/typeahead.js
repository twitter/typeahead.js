/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var viewKey, methods;

  viewKey = 'ttView';

  methods = {
    initialize: function initialize(o) {
      return this.each(attachTypeahead);

      function attachTypeahead() {
        var $input = $(this), datasets, deferreds, view, eventBus;

        // TODO: what if section has no dataset?
        datasets = _.map(o.sections, function(section) {
          return section.dataset;
        });

        deferreds = _.map(datasets, function(dataset) {
          return dataset.initialize();
        });

        eventBus = new EventBus({ el: $input });

        view = new TypeaheadView({
          input: $input,
          eventBus: eventBus,
          sections: o.sections
        });

        $input.data(viewKey, view);

        // TODO: trigger initialized
      }
    }
  };

  jQuery.fn.typeahead = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, [].slice.call(arguments, 1));
    }

    else {
      return methods.initialize.apply(this, arguments);
    }
  };
})();
