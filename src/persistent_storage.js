/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var PersistentStorage = (function() {
  var ls, methods;

  try {
    ls = window.localStorage;

    // while in private browsing mode, some browsers make
    // localStorage available, but throw an error when used
    ls.setItem('~~~', '!');
    ls.removeItem('~~~');
  } catch (err) {
    ls = null;
  }

  function PersistentStorage(namespace) {
    this.prefix = ['__', namespace, '__'].join('');
    this.ttlKey = '__ttl__';
    this.keyMatcher = new RegExp('^' + this.prefix);
  }

  if (ls && window.JSON) {
    methods = {

      // private methods
      // ---------------

      _prefix: function(key) {
        return this.prefix + key;
      },

      _ttlKey: function(key) {
        return this._prefix(key) + this.ttlKey;
      },

      // public methods
      // --------------

      get: function(key) {
        if (this.isExpired(key)) {
          this.remove(key);
        }

        return decode(ls.getItem(this._prefix(key)));
      },

      set: function(key, val, ttl) {
        if (utils.isNumber(ttl)) {
          ls.setItem(this._ttlKey(key), encode(now() + ttl));
        }

        else {
          ls.removeItem(this._ttlKey(key));
        }

        return ls.setItem(this._prefix(key), encode(val));
      },

      remove: function(key) {
        ls.removeItem(this._ttlKey(key));
        ls.removeItem(this._prefix(key));

        return this;
      },

      clear: function() {
        var i, key, keys = [], len = ls.length;

        for (i = 0; i < len; i++) {
          if ((key = ls.key(i)).match(this.keyMatcher)) {
            // gather keys to remove after loop exits
            keys.push(key.replace(this.keyMatcher, ''));
          }
        }

        for (i = keys.length; i--;) {
          this.remove(keys[i]);
        }

        return this;
      },

      isExpired: function(key) {
        var ttl = decode(ls.getItem(this._ttlKey(key)));

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
    return new Date().getTime();
  }

  function encode(val) {
    // convert undefined to null to avoid issues with JSON.parse
    return JSON.stringify(utils.isUndefined(val) ? null : val);
  }

  function decode(val) {
    return JSON.parse(val);
  }
})();
