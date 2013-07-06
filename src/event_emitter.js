/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

// inspired by https://github.com/jharding/boomerang

var EventEmitter = (function(root, undefined) {
  var splitter = /\s+/, nextTick = getNextTick();

  return mixin({ mixin: mixin });

  function mixin(obj) {
    obj.on = on;
    obj.off = off;
    obj.trigger = trigger;

    return obj;
  }

  function on(types, cb, context) {
    var type;

    if (!cb) { return this; }

    this._callbacks = this._callbacks || {};
    types = types.split(splitter);

    while (type = types.shift()) {
      this._callbacks[type] = this._callbacks[type] || [];
      this._callbacks[type].push(context ? bindContext(cb, context) : cb);
    }

    return this;
  }

  function off(types) {
    var type;

    if (!this._callbacks) { return this; }

    types = types.split(splitter);

    while (type = types.shift()) {
      delete this._callbacks[type];
    }

    return this;
  }

  function trigger(types) {
    var type, callbacks, args = [].slice.call(arguments, 1);

    if (!this._callbacks) { return this; }

    types = types.split(splitter);

    while (type = types.shift()) {
      if (callbacks = this._callbacks[type]) {
        for (var i = 0; i < callbacks.length; i += 1) {
          nextTick(this, callbacks[i], [type].concat(args));
        }
      }
    }

    return this;
  }

  function getNextTick() {
    var nextTickFn, messageChannel;

    // IE10+
    if (root.setImmediate) {
      nextTickFn = function nextTickSetImmediate(context, fn, args) {
        setImmediate(function() { fn.apply(context, args); });
      };
    }

    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    else if (root.MessageChannel) {
      channel = new MessageChannel();

      nextTickFn = function nextTickMessageChannel(context, fn, args) {
        channel.port1.onmessage = function() { fn.apply(context, args); };
        channel.port2.postMessage(0);
      };
    }

    // old browsers
    else {
      nextTickFn = function nextTickSetImmediate(context, fn, args) {
        setTimeout(function() { fn.apply(context, args); });
      };
    }

    return nextTickFn;
  }

  function bindContext(fn, context) {
    return fn.bind ?
      fn.bind(context) :
      function() { fn.apply(context, [].slice.call(arguments, 0)); };
  }
})(this);
