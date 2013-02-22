/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var PersistentStorage = (function() {
  var ls = window.localStorage, methods;

  function PersistentStorage(namespace) {
    this.prefix = ["__", namespace, "__"].join("");
    this.ttlKey = "__ttl__";
    this.keyMatcher = new RegExp("^" + this.prefix);
  }

  if (window.localStorage && window.JSON) {
    methods = {
      get: function(key) {
        var ttl = decode(ls.getItem(this.prefix + key));

        if (utils.isNumber(ttl) && now() > ttl) {
          ls.removeItem(this.prefix + key + this.ttlKey);
        }

        return decode(ls.getItem(this.prefix + key));
      },

      set: function(key, val, ttl) {
        if (utils.isNumber(ttl)) {
          ls.setItem(this.prefix + key + this.ttlKey, encode(now() + ttl));
        }

        else {
          ls.removeItem(this.prefix + key + this.ttlKey);
        }

        return ls.setItem(this.prefix + key, encode(val));
      },

      remove: function(key) {
        ls.removeItem(this.prefix + key + this.ttlKey);
        ls.removeItem(this.prefix + key);

        return this;
      },

      clear: function() {
        var i, key, len = ls.length;

        for (i = 0; i < len; i += 1) {
          key = ls.key(i);
          if (key.match(this.keyMatcher)) {
            i -= 1;
            len -= 1;
            this.remove(key.replace(this.keyMatcher, ""));
          }
        }

        return this;
      },

      isExpired: function(key) {
        var ttl = decode(ls.getItem(this.prefix + key + this.ttlKey));

        return utils.isNumber(ttl) && now() > ttl ? true : false;
      }
    };
  }

  else {
    methods = {
      get: utils.noop,
      set: utils.noop,
      remove: utils.noop,
      clear: utils.noop,
      isExpired: utils.noop
    };
  }

  utils.mixin(PersistentStorage.prototype, methods);

  return PersistentStorage;

  function now() {
    return (new Date()).getTime();
  }

  function encode(val) {
    return JSON.stringify(val);
  }

  function decode(val) {
    return utils.isUndefined(val) ? undefined : JSON.parse(val);
  }
})();
