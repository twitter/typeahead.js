/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Dataset = (function() {
  'use strict';

  var keys;

  keys = {
    val: 'tt-selectable-display',
    obj: 'tt-selectable-object'
  };

  // constructor
  // -----------

  function Dataset(o, www) {
    o = o || {};
    o.templates = o.templates || {};

    // DEPRECATED: empty and suggestion will be dropped in v1
    o.templates.notFound = o.templates.notFound || o.templates.empty;
    o.templates.result = o.templates.result || o.templates.suggestion;

    if (!o.source) {
      $.error('missing source');
    }

    if (o.name && !isValidName(o.name)) {
      $.error('invalid dataset name: ' + o.name);
    }

    www.mixin(this);

    this.highlight = !!o.highlight;
    this.name = o.name || _.getUniqueId();

    this.limit = o.limit || 5;
    this.displayFn = getDisplayFn(o.display || o.displayKey);
    this.templates = getTemplates(o.templates, this.displayFn);

    // use duck typing to see if source is a bloodhound instance by checking
    // for the __ttAdapter property; otherwise assume it is a function
    this.source = o.source.__ttAdapter ? o.source.__ttAdapter() : o.source;

    // if the async option is undefined, inspect the source signature as
    // a hint to figuring out of the source will return async results
    this.async = _.isUndefined(o.async) ? this.source.length > 1 : !!o.async;

    this.$el = $(this.html.dataset.replace('%CLASS%', this.name));
  }

  // static methods
  // --------------

  Dataset.extractData = function extractData(el) {
    var $el = $(el);

    if ($el.data(keys.obj)) {
      return {
        val: $el.data(keys.val) || '',
        obj: $el.data(keys.obj) || null
      };
    }

    return null;
  };

  // instance methods
  // ----------------

  _.mixin(Dataset.prototype, EventEmitter, {

    // ### private

    _overwrite: function overwrite(query, results) {
      results = results || [];

      // got results: overwrite dom with results
      if (results.length) {
        this._renderResults(query, results);
      }

      // no results, expecting async: overwrite dom with pending
      else if (this.async && this.templates.pending) {
        this._renderPending(query);
      }

      // no results, not expecting async: overwrite dom with not found
      else if (!this.async && this.templates.notFound) {
        this._renderNotFound(query);
      }

      // nothing to render: empty dom
      else {
        this._empty();
      }

      this.trigger('rendered', this.name, results, false);
    },

    _append: function append(query, results) {
      results = results || [];

      // got results, sync results exist: append results to dom
      if (results.length && this.$lastResult.length) {
        this._appendResults(query, results);
      }

      // got results, no sync results: overwrite dom with results
      else if (results.length) {
        this._renderResults(query, results);
      }

      // no async/sync results: overwrite dom with not found
      else if (!this.$lastResult.length && this.templates.notFound) {
        this._renderNotFound(query);
      }

      this.trigger('rendered', this.name, results, true);
    },

    _renderResults: function renderResults(query, results) {
      var $fragment;

      $fragment = this._getResultsFragment(query, results);
      this.$lastResult = $fragment.children().last();

      this.$el.html($fragment)
      .prepend(this._getHeader(query, results))
      .append(this._getFooter(query, results));
    },

    _appendResults: function appendResults(query, results) {
      var $fragment, $lastResult;

      $fragment = this._getResultsFragment(query, results);
      $lastResult = $fragment.children().last();

      this.$lastResult.after($fragment);

      this.$lastResult = $lastResult;
    },

    _renderPending: function renderPending(query) {
      var template = this.templates.pending;

      template && this.$el.html(template({ query: query }));
      this.$lastResult = null;
    },

    _renderNotFound: function renderNotFound(query) {
      var template = this.templates.notFound;

      template && this.$el.html(template({ query: query }));
      this.$lastResult = null;
    },

    _empty: function empty() {
      this.$el.empty();
      this.$lastResult = null;
    },

    _getResultsFragment: function getResultsFragment(query, results) {
      var that = this, fragment;

      fragment = document.createDocumentFragment();
      _.each(results, function getResultNode(result) {
        var $el, context;

        context = that._injectQuery(query, result);

        $el = $(that.html.result)
        .append(that.templates.result(context))
        .data(keys.val, that.displayFn(result))
        .data(keys.obj, result);

        fragment.appendChild($el[0]);
      });

      this.highlight && highlight({
        className: this.classes.highlight,
        node: fragment,
        pattern: query
      });

      return $(fragment);
    },

    _getFooter: function getFooter(query, results) {
      return this.templates.footer ?
        this.templates.footer({ query: query, results: results }) :
        null;
    },

    _getHeader: function getHeader(query, results) {
      return this.templates.header ?
        this.templates.header({ query: query, results: results }) :
        null;
    },

    _injectQuery: function injectQuery(query, obj) {
      return _.isObject(obj) ? _.mixin({ _query: query }, obj) : obj;
    },

    // ### public

    getRoot: function getRoot() {
      return this.$el;
    },

    update: function update(query) {
      var that = this, canceled = false, results, rendered;

      // cancel possible pending update
      this.cancel();

      this.cancel = function cancel() {
        canceled = true;
        that.cancel = $.noop;
        that.async && that.trigger('asyncCanceled', query);
      };

      results = (this.source(query, append) || []).slice(0, this.limit);
      rendered = results.length;

      this._overwrite(query, results);

      if (rendered < this.limit && this.async) {
        this.trigger('asyncRequested', query);
      }

      function append(results) {
        results = results || [];
        // if the update has been canceled or if the query has changed
        // do not render the results as they've become outdated
        if (!canceled && rendered < that.limit) {
          that.cancel = $.noop;
          that._append(query, results.slice(0, that.limit - rendered));
          rendered += results.length;
          that.async && that.trigger('asyncReceived', query);
        }
      }
    },

    // cancel function gets set in #update
    cancel: $.noop,

    clear: function clear() {
      this._empty();
      this.cancel();
      this.trigger('cleared');
    },

    isEmpty: function isEmpty() {
      return this.$el.is(':empty');
    },

    destroy: function destroy() {
      this.$el = null;
    }
  });

  return Dataset;

  // helper functions
  // ----------------

  function getDisplayFn(display) {
    display = display || 'value';

    return _.isFunction(display) ? display : displayFn;

    function displayFn(obj) { return obj[display]; }
  }

  function getTemplates(templates, displayFn) {
    return {
      notFound: templates.notFound && _.templatify(templates.notFound),
      pending: templates.pending && _.templatify(templates.pending),
      header: templates.header && _.templatify(templates.header),
      footer: templates.footer && _.templatify(templates.footer),
      result: templates.result || resultTemplate
    };

    function resultTemplate(context) {
      return '<p>' + displayFn(context) + '</p>';
    }
  }

  function isValidName(str) {
    // dashes, underscores, letters, and numbers
    return (/^[_a-zA-Z0-9-]+$/).test(str);
  }
})();
