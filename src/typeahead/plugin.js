/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var typeaheadKey, methods;

  typeaheadKey = 'ttTypeahead';

  methods = {
    initialize: function initialize(o /*, splot of sections */) {
      var sections = [].slice.call(arguments, 1);

      o = o || {};

      return this.each(attach);

      function attach() {
        var $input = $(this), typeahead;

        _.each(sections, function(section) {
          // HACK: force highlight as a top-level config
          section.highlight = !!o.highlight;

          // if source is an object, convert it to a dataset
          section.source = _.isObject(section.source) ?
            datasetAdapter(section.source).initialize() : section.source;
        });

        typeahead = new Typeahead({
          input: $input,
          withHint: _.isUndefined(o.hint) ? true : !!o.hint,
          minLength: o.minLength,
          autoselect: o.autoselect,
          sections: sections
        });

        $input.data(typeaheadKey, typeahead);
      }
    },

    open: function open() {
      return this.each(openTypeahead);

      function openTypeahead() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(typeaheadKey)) {
          typeahead.open();
        }
      }
    },

    close: function close() {
      return this.each(closeTypeahead);

      function closeTypeahead() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(typeaheadKey)) {
          typeahead.close();
        }
      }
    },

    val: function val(newVal) {
      return _.isString(newVal) ?
        this.each(setQuery) : this.map(getQuery).get();

      function setQuery() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(typeaheadKey)) {
          typeahead.setQuery(newVal);
        }
      }

      function getQuery() {
        var $input = $(this), typeahead, query;

        if (typeahead = $input.data(typeaheadKey)) {
          query = typeahead.getQuery();
        }

        return query;
      }
    },

    destroy: function destroy() {
      return this.each(unattach);

      function unattach() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(typeaheadKey)) {
          typeahead.destroy();
          $input.removeData(typeaheadKey);
        }
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

  jQuery.fn.typeahead.datasetAdapter = datasetAdapter;

  function datasetAdapter(dataset) {
    var source;

    dataset = _.isObject(dataset) ? new Dataset(dataset) : dataset;
    source = _.bind(dataset.get, dataset);

    source.initialize = function() {
      // returns a promise that is resolved after prefetch data
      // is loaded and processed
      return dataset.initialize();
    };

    source.add = function(data) {
      dataset.add();
    };

    return source;
  };
})();
