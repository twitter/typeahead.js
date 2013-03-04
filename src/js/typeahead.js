/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var initializedDatasets = {},
      transportOptions = {},
      transport,
      methods;

  jQuery.fn.typeahead = typeahead;
  typeahead.configureTransport = configureTransport;

  methods = {
    initialize: function(datasetDefs) {
      var datasets = {};

      datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];

      if (datasetDefs.length === 0) {
        throw new Error('no datasets provided');
      }

      delete typeahead.configureTransport;
      transport = transport || new Transport(transportOptions);

      utils.each(datasetDefs, function(i, datasetDef) {
        var dataset,
            name = datasetDef.name = datasetDef.name || utils.getUniqueId();

        // dataset by this name has already been initialized, used it
        if (initializedDatasets[name]) {
          dataset = initializedDatasets[name];
        }

        else {
          datasetDef.limit = datasetDef.limit || 5;

          if (datasetDef.template && !datasetDef.engine) {
            throw new Error('no template engine specified for ' + name);
          }

          dataset = initializedDatasets[name] = new Dataset({
            name: datasetDef.name,
            limit: datasetDef.limit,
            local: datasetDef.local,
            prefetch: datasetDef.prefetch,
            ttl_ms: datasetDef.ttl_ms, // temporary – will be removed in future
            remote: datasetDef.remote,
            matcher: datasetDef.matcher,
            ranker: datasetDef.ranker,
            transport: transport
          });
        }

        datasets[name] = {
          name: datasetDef.name,
          limit: datasetDef.limit,
          template: compileTemplate(datasetDef.template, datasetDef.engine),
          getSuggestions: dataset.getSuggestions
        };
      });

      return this.each(function() {
        $(this).data({
          typeahead: new TypeaheadView({ input: this, datasets: datasets })
        });
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

  function typeahead(method) {
    if (methods[method]) {
      return methods[method].apply(this, [].slice.call(arguments, 1));
    }

    else {
      return methods.initialize.apply(this, arguments);
    }
  }

  function configureTransport(o) {
    transportOptions = o;
  }

  function compileTemplate(template, engine) {
    var wrapper = '<li class="tt-suggestion">%body</li>',
        compiledTemplate;

    if (template) {
      compiledTemplate = engine.compile(wrapper.replace('%body', template));
    }

    // if no template is provided, render suggestion
    // as its value wrapped in a p tag
    else {
      compiledTemplate = {
        render: function(context) {
          return wrapper.replace('%body', '<p>' + context.value + '</p>');
        }
      };
    }

    return compiledTemplate;
  }
})();
