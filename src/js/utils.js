/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var utils = {
  isMsie: function() {
    return (/msie [\w.]+/i).test(navigator.userAgent);
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

  filter: function(obj, test) {
    var results = [];

    $.each(obj, function(key, val) {
      if (test(val, key, obj)) { results.push(val); }
    });

    return results;
  },

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

  mixin: $.extend,

  getUniqueId: (function() {
    var counter = 0;
    return function() { return counter++; };
  })(),

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

  uniqueArray: function(array) {
    var u = {}, a = [];

    for(var i = 0, l = array.length; i < l; ++i) {
      if(u.hasOwnProperty(array[i])) { continue; }

      a.push(array[i]);
      u[array[i]] = 1;
    }

    return a;
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

  noop: function() {},

  sort: function(array, ranker) {
    return this._mergesort(array, ranker);
  },

  _mergesort: function(array, ranker) {
    if (array.length <= 1) {
      return array;
    }

    var pivot = Math.floor(array.length / 2);
    var left = this.sort(array.slice(0, pivot), ranker);
    var right = this.sort(array.slice(pivot, array.length), ranker);

    return this._merge(left, right, ranker);
  },

  _merge: function (left, right, ranker) {
    var result = [];
    while (left.length > 0 || right.length > 0) {
      if (left.length > 0 && right.length > 0) {
        if (ranker(left[0], right[0]) <= 0) {
          result.push(left.shift());
        } else {
          result.push(right.shift());
        }
      } else if (left.length > 0) {
        result = result.concat(left);
        left = [];
      } else if (right.length > 0) {
        result = result.concat(right);
        right = [];
      }
    }

    return result;
  }
};
