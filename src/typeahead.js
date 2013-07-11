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
      var oTopLevel, oSections;

      o = o || {};

      oTopLevel = getTopLevel(o);
      oSections = getSections(o);

      return this.each(attachTypeahead);

      function attachTypeahead() {
        var $input = $(this), deferreds, view;

        deferreds = _.map(oSections, getInitializationDeferred);

        view = new TypeaheadView({
          input: $input,
          withHint: oTopLevel.hint,
          minLength: oTopLevel.minLength,
          sections: oSections
        });

        $input.data(viewKey, view);

        $.when.apply($, deferreds)
        .always(function() {
          // deferring to make it possible to attach a listener
          // for typeahead:initialized after calling jQuery#typeahead
          _.defer(function() { view.eventBus.trigger('initialized'); });
        });
      }

      function getInitializationDeferred(oSection) {
        return oSection.dataset ?
          oSection.dataset.initialize() :
          $.Deferred().resolve();
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

  // helper functions
  // ----------------

  function getTopLevel(o) {
    return {
      hint: _.isUndefined(o.hint) ? true : !!o.hint,
      minLength: o.minLength || 0
    };
  }

  function getSections(o) {
    var oSections;

    oSections = o.sections || [];
    oSections = _.isArray(oSections) ? oSections : [oSections];

    return _.map(oSections, getSection);

    function getSection(oSection) {
      return {
        highlight: !!oSection.highlight,
        templates: oSection.templates,
        dataset: getDataset(oSection)
      };
    }

    function getDataset(oSection) {
      return (oSection instanceof Dataset) ?
        oSection.dataset :
        new Dataset(oSection.dataset);
    }
  }

})();
