/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var EventBus = (function() {
  'use strict';

  var namespace = 'typeahead:';

  // constructor
  // -----------

  function EventBus(o) {
    if (!o || !o.el) {
      $.error('EventBus initialized without el');
    }

    this.$el = $(o.el);
  }

  // instance methods
  // ----------------

  _.mixin(EventBus.prototype, {

    // ### private

    _trigger: function(type, args) {
      var $e;

      $e = $.Event(namespace + type);
      args = [].slice.call(arguments, 1);

      this.$el.trigger($e, args);

      return $e;
    },

    // ### public

    before: function(type) {
      var args, $e;

      args = [].slice.call(arguments, 1);
      $e = this._trigger('before' + type, args);

      return $e.isDefaultPrevented();
    },

    trigger: function(type) {
      this._trigger(type, [].slice.call(arguments, 1));
    }
  });

  return EventBus;
})();
