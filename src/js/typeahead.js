/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var datasetCache = {}, methods;

  methods = {
    initialize: function(datasetDefs) {
      var datasets;

      datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];

      if (this.length === 0) {
        throw new Error('typeahead initialized without DOM element');
      }

      if (datasetDefs.length === 0) {
        throw new Error('no datasets provided');
      }

      datasets = utils.map(datasetDefs, function(o) {
        o.name = o.name || utils.getUniqueId();

        return datasetCache[o.name] ?
          datasetCache[o.name] :
          datasetCache[o.name] = new Dataset(o).initialize(o);
      });

      return this.each(function() {
        var $input = $(this),
            view = new TypeaheadView({ input: $input, datasets: datasets });

        $input.data('ttView', view);
      });
    },

    destroy: function() {
      this.each(function() {
        var $this = $(this),
            view = $this.data('typeahead');

        if (view) {
          view.destroy();
          $this.removeData('typeahead');
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
