/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var initializedDatasets = {}, methods;

  methods = {
    initialize: function(datasetDefs) {
      var datasets = {};

      datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];

      if (datasetDefs.length === 0) {
        throw new Error('no datasets provided');
      }

      utils.each(datasetDefs, function(i, o) {
        var transport, dataset;

        o.name = o.name || utils.getUniqueId();

        // dataset by this name has already been intialized, used it
        if (initializedDatasets[o.name]) {
          dataset = initializedDatasets[o.name];
        }

        else {
          if (o.template && !o.engine) {
            throw new Error('no template engine specified for ' + o.name);
          }

          transport = new Transport({
            ajax: o.ajax,
            wildcard: o.wildcard,
            rateLimitFn: o.rateLimitFn,
            maxConcurrentConnections: o.maxConcurrentConnections
          });

          dataset = initializedDatasets[name] = new Dataset({
            name: o.name,
            limit: o.limit,
            local: o.local,
            prefetch: o.prefetch,
            ttl_ms: o.ttl_ms, // temporary – will be removed in future
            remote: o.remote,
            matcher: o.matcher,
            ranker: o.ranker,
            transport: transport
          });
        }

        // faux dataset used by TypeaheadView instances
        datasets[name] = {
          name: o.name,
          limit: o.limit,
          template: o.template,
          engine: o.engine,
          getSuggestions: dataset.getSuggestions
        };
      });

      return this.each(function() {
        $(this).data({
          typeahead: new TypeaheadView({ input: this, datasets: datasets })
        });
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
