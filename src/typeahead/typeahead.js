/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  var typeaheadKey, methods;

  typeaheadKey = 'ttTypeahead';

  method = {
    initialize: function initialize(o) {
      o = o || {};

      return this.each(attach);

      function attach() {
        var $input = $(this), typeahead;

        typeahead = new TypeaheadView({
          input: $input,
          withHint: _.isUndefined(o.hint) ? true : !!o.hint,
          autoselect: !!o.autoselect,
          minLength: o.minLength || 0,
          sections: _.isArray(o.sections) ? o.sections : [o.sections]
        });

        $input.data(typeaheadKey, typeahead);
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
