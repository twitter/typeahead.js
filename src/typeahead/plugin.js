/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var typeaheadKey, methods;

  typeaheadKey = 'ttTypeahead';

  methods = {
    initialize: function initialize(o) {
      o = o || {};

      return this.each(attach);

      function attach() {
        var $input = $(this), sections, typeahead;

        sections =  _.isArray(o.sections) ? o.sections : [o.sections];

        // HACK: force highlight as a top-level config
        _.each(sections, function(s) { s.highlight = !!o.highlight; });

        typeahead = new Typeahead({
          input: $input,
          withHint: _.isUndefined(o.hint) ? true : !!o.hint,
          minLength: o.minLength || 0,
          autoselect: !!o.autoselect,
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
})();
