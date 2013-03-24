/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var utils = {
  isMsie: function() {
    var match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);

    return match ? parseInt(match[2], 10) : false;
  },

  isBlankString: function(str) { return !str || /^\s*$/.test(str); },

  // http://stackoverflow.com/a/6969486
  escapeRegExChars: function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  },

  isString: function(obj) { return typeof obj === 'string'; },

  isNumber: function(obj) { return typeof obj === 'number'; },

  isArray: $.isArray,

  isFunction: $.isFunction,

  isObject: $.isPlainObject,

  isUndefined: function(obj) { return typeof obj === 'undefined'; },

  bind: $.proxy,

  bindAll: function(obj) {
    var val;
    for (var key in obj) {
      $.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj));
    }
  },

  indexOf: function(haystack, needle) {
    for (var i = 0; i < haystack.length; i++) {
      if (haystack[i] === needle) { return i; }
    }

    return -1;
  },

  each: $.each,

  map: $.map,

  filter: $.grep,

  every: function(obj, test) {
    var result = true;

    if (!obj) { return result; }

    $.each(obj, function(key, val) {
      if (!(result = test.call(null, val, key, obj))) {
        return false;
      }
    });

    return !!result;
  },

  some: function(obj, test) {
    var result = false;

    if (!obj) { return result; }

    $.each(obj, function(key, val) {
      if (result = test.call(null, val, key, obj)) {
        return false;
      }
    });

    return !!result;
  },

  mixin: $.extend,

  getUniqueId: (function() {
    var counter = 0;
    return function() { return counter++; };
  })(),

  defer: function(fn) { setTimeout(fn, 0); },

  debounce: function(func, wait, immediate) {
    var timeout, result;

    return function() {
      var context = this, args = arguments, later, callNow;

      later = function() {
        timeout = null;
        if (!immediate) { result = func.apply(context, args); }
      };

      callNow = immediate && !timeout;

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) { result = func.apply(context, args); }

      return result;
    };
  },

  throttle: function(func, wait) {
    var context, args, timeout, result, previous, later;

    previous = 0;
    later = function() {
      previous = new Date();
      timeout = null;
      result = func.apply(context, args);
    };

    return function() {
      var now = new Date(),
          remaining = wait - (now - previous);

      context = this;
      args = arguments;

      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      }

      else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }

      return result;
    };
  },

  tokenizeQuery: function(str) {
    return $.trim(str).toLowerCase().split(/[\s]+/);
  },

  tokenizeText: function(str) {
    return $.trim(str).toLowerCase().split(/[\s\-_]+/);
  },

  getProtocol: function() {
    return location.protocol;
  },

  noop: function() {}
};
