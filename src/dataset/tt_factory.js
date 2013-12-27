/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var ttDataset = window.ttDataset = (function() {

  function create(o) {
    var dataset, source;

    dataset = new Dataset(o);
    source = _.bind(dataset.get, dataset);

    source.initialize = function() {
      dataset.initialize();
      return source;
    };

    source.add = function(data) {
      dataset.add();
      return source;
    };

    return source;
  }

  return { create: create };
})();
