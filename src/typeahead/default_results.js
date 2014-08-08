/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var DefaultResults = (function() {
  'use strict';

  var s = Results.prototype;

  function DefaultResults(o, www) {
    Results.apply(this, [].slice.call(arguments, 0));
  }

  _.mixin(DefaultResults.prototype, Results.prototype, {
    // overrides
    // ---------

    activate: function activate() {
      var rv = s.activate.apply(this, [].slice.call(arguments, 0));
      !this.$node.hasClass(this.classes.empty) && this._show();

      return rv;
    },

    deactivate: function deactivate() {
      var rv = s.deactivate.apply(this, [].slice.call(arguments, 0));
      this._hide();

      return rv;
    },

    _onRendered: function onRendered() {
      var isEmpty = _.every(this.datasets, isDatasetEmpty);

      if (isEmpty) {
        this._hide();
      }

      else {
        this.$node.hasClass(this.classes.activated) && this._show();
      }

      return s._onRendered.apply(this, [].slice.call(arguments, 0));

      function isDatasetEmpty(dataset) { return dataset.isEmpty(); }
    },

    setLanguageDirection: function setLanguageDirection(dir) {
      this.$node.css(dir === 'ltr' ? this.css.ltr : this.css.rtl);
      return s.setLanguageDirection.apply(this, [].slice.call(arguments, 0));
    },

    // private
    // ---------

    _hide: function hide() {
      this.$node.hide();
    },

    _show: function show() {
      // can't use jQuery#show because $node is a span element we want
      // display: block; not dislay: inline;
      this.$node.css('display', 'block');
    }
  });

  return DefaultResults;
})();
