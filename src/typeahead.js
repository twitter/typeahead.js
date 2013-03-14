/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var datasetCache = {}, viewKey = 'ttView', methods;

  methods = {
    initialize: function(datasetDefs) {
      var datasets;

      datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];

      if (this.length === 0) {
        $.error('typeahead initialized without DOM element');
      }

      if (datasetDefs.length === 0) {
        $.error('no datasets provided');
      }

      datasets = utils.map(datasetDefs, function(o) {
        o.name = o.name || utils.getUniqueId();

        return datasetCache[o.name] ?
          datasetCache[o.name] :
          datasetCache[o.name] = new Dataset(o);
      });

      return this.each(initialize);

      function initialize() {
        var $input = $(this),
            deferreds,
            eventBus = new EventBus({ el: $input });

        deferreds = utils.map(datasets, function(dataset) {
          return dataset.initialize();
        });

        $input.data(viewKey, new TypeaheadView({
          input: $input,
          eventBus: eventBus = new EventBus({ el: $input }),
          datasets: datasets
        }));

        $.when.apply($, deferreds)
        .always(function() { eventBus.trigger('initialized'); });
      }
    },

    destroy: function() {
      this.each(function() {
        var $this = $(this),
            view = $this.data(viewKey);

        if (view) {
          view.destroy();
          $this.removeData(viewKey);
        }
      });
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
