/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var datasetCache = {}, methods;

  methods = {
    initialize: function(datasetDefs) {
      var datasets = {};

      datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];

      if (this.length === 0) {
        throw new Error('typeahead initialized without DOM element');
      }

      if (datasetDefs.length === 0) {
        throw new Error('no datasets provided');
      }

      utils.each(datasetDefs, function(i, o) {
        o.name = o.name || utils.getUniqueId();

        datasets[o.name] = datasetCache[o.name] ?
          datasetCache[o.name] :
          datasetCache[o.name] = new Dataset(o);
      });

      return this.each(function() {
        var $input = $(this),
            typeaheadView = new TypeaheadView({
              input: $input,
              datasets: datasets
            });

        $input.data('ttView', typeaheadView);
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
