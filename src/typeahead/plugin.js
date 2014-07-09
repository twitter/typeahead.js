/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  'use strict';

  var old, typeaheadKey, methods;

  old = $.fn.typeahead;

  typeaheadKey = 'ttTypeahead';

  methods = {
    // supported signatures:
    // function(o, dataset, dataset, ...)
    // function(o, [dataset, dataset, ...])
    initialize: function initialize(o, datasets) {
      datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);

      o = o || {};

      return this.each(attach);

      function attach() {
        var $input = $(this), eventBus, typeahead;

        _.each(datasets, function(d) {
          // HACK: force highlight as a top-level config
          d.highlight = !!o.highlight;
        });

        typeahead = new Typeahead({
          input: $input,
          eventBus: eventBus = new EventBus({ el: $input }),
          withHint: _.isUndefined(o.hint) ? true : !!o.hint,
          minLength: o.minLength,
          autoselect: o.autoselect,
          datasets: datasets
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
      // mirror jQuery#val functionality: reads opearte on first match,
      // write operates on all matches
      return !arguments.length ? getVal(this.first()) : this.each(setVal);

      function setVal() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(typeaheadKey)) {
          typeahead.setVal(newVal);
        }
      }

      function getVal($input) {
        var typeahead, query;

        if (typeahead = $input.data(typeaheadKey)) {
          query = typeahead.getVal();
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

  $.fn.typeahead = function(method) {
    var tts;

    // methods that should only act on intialized typeaheads
    if (methods[method] && method !== 'initialize') {
      // filter out non-typeahead inputs
      tts = this.filter(function() { return !!$(this).data(typeaheadKey); });
      return methods[method].apply(tts, [].slice.call(arguments, 1));
    }

    else {
      return methods.initialize.apply(this, arguments);
    }
  };

  $.fn.typeahead.noConflict = function noConflict() {
    $.fn.typeahead = old;
    return this;
  };
})();
