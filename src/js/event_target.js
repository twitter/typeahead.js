/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var EventTarget = (function() {
  // Regular expression used to split event strings
  var eventSplitter = /\s+/;

  return {
    // bind one or more space separated events
    on: function(events, callback) {
      var event;

      if (!callback) { return this; }

      this._callbacks = this._callbacks || {};
      events = events.split(eventSplitter);

      while (event = events.shift()) {
        this._callbacks[event] = this._callbacks[event] || [];
        this._callbacks[event].push(callback);
      }

      return this;
    },

    trigger: function(events, data) {
      var event, callbacks;

      if (!this._callbacks) { return this; }

      events = events.split(eventSplitter);

      while (event = events.shift()) {
        if (callbacks = this._callbacks[event]) {
          for (var i = 0; i < callbacks.length; i += 1) {
            callbacks[i].call(this, { type: event, data: data });
          }
        }
      }

      return this;
    }
  };
})();
