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

    if (!o.source) {
      $.error('missing source');
    }

    if (o.name && !isValidName(o.name)) {
      $.error('invalid dataset name: ' + o.name);
    }

    www.mixin(this);

    // tracks the last query the dataset was updated for
    this.query = null;

    this.highlight = !!o.highlight;
    this.name = o.name || _.getUniqueId();

    this.source = o.source;
    this.displayFn = getDisplayFn(o.display || o.displayKey);
    this.templates = getTemplates(o.templates, this.displayFn);

    this.$el = $(this.html.dataset.replace('%CLASS%', this.name));
  }

  // static methods
  // --------------

  Dataset.extractData = function extractData(el) {
    var $el = $(el);

    return {
      val: $el.data(keys.val) || '',
      obj: $el.data(keys.obj) || null
    };
  };

  // instance methods
  // ----------------

  _.mixin(Dataset.prototype, EventEmitter, {

    // ### private

    _render: function render(query, results) {
      if (!this.$el) { return; }

      var that = this, hasResults;

      this.$el.empty();
      hasResults = results && results.length;

      if (!hasResults && this.templates.empty) {
        this.$el
        .html(getEmptyHtml())
        .prepend(that.templates.header ? getHeaderHtml() : null)
        .append(that.templates.footer ? getFooterHtml() : null);
      }

      else if (hasResults) {
        this.$el
        .html(getResultsHtml())
        .prepend(that.templates.header ? getHeaderHtml() : null)
        .append(that.templates.footer ? getFooterHtml() : null);
      }

      this.trigger('rendered');

      function getEmptyHtml() {
        return that.templates.empty({ query: query, isEmpty: true });
      }

      function getResultsHtml() {
        var fragment, nodes;

        fragment = document.createDocumentFragment();
        nodes = _.map(results, getResultNode);

        _.each(nodes, function(n) { fragment.appendChild(n); });

        that.highlight && highlight({
          className: that.classes.highlight,
          node: fragment,
          pattern: query
        });

        return fragment;

        function getResultNode(result) {
          var $el;

          $el = $(that.html.result)
          .append(that.templates.result(result))
          .data(keys.val, that.displayFn(result))
          .data(keys.obj, result);

          return $el[0];
        }
      }

      function getHeaderHtml() {
        return that.templates.header({
          query: query,
          isEmpty: !hasResults
        });
      }

      function getFooterHtml() {
        return that.templates.footer({
          query: query,
          isEmpty: !hasResults
        });
      }
    },

    // ### public

    getRoot: function getRoot() {
      return this.$el;
    },

    update: function update(query) {
      var that = this;

      this.query = query;
      this.canceled = false;
      this.source(query, render);

      function render(results) {
        // if the update has been canceled or if the query has changed
        // do not render the results as they've become outdated
        if (!that.canceled && query === that.query) {
          that._render(query, results);
        }
      }
    },

    cancel: function cancel() {
      this.canceled = true;
    },

    clear: function clear() {
      this.cancel();
      this.$el.empty();
      this.trigger('rendered');
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
      empty: templates.empty && _.templatify(templates.empty),
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
