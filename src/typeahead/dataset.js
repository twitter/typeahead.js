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

  function Dataset(o) {
    o = o || {};
    o.templates = o.templates || {};

    if (!o.source) {
      $.error('missing source');
    }

    if (o.name && !isValidName(o.name)) {
      $.error('invalid dataset name: ' + o.name);
    }

    // tracks the last query the dataset was updated for
    this.query = null;

    this.highlight = !!o.highlight;
    this.name = o.name || _.getUniqueId();

    this.source = o.source;
    this.displayFn = getDisplayFn(o.display || o.displayKey);

    this.templates = getTemplates(o.templates, this.displayFn);

    this.$el = $(html.dataset.replace('%CLASS%', this.name));
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

    _render: function render(query, suggestions) {
      if (!this.$el) { return; }

      var that = this, hasSuggestions;

      this.$el.empty();
      hasSuggestions = suggestions && suggestions.length;

      if (!hasSuggestions && this.templates.empty) {
        this.$el
        .html(getEmptyHtml())
        .prepend(that.templates.header ? getHeaderHtml() : null)
        .append(that.templates.footer ? getFooterHtml() : null);
      }

      else if (hasSuggestions) {
        this.$el
        .html(getSuggestionsHtml())
        .prepend(that.templates.header ? getHeaderHtml() : null)
        .append(that.templates.footer ? getFooterHtml() : null);
      }

      this.trigger('rendered');

      function getEmptyHtml() {
        return that.templates.empty({ query: query, isEmpty: true });
      }

      function getSuggestionsHtml() {
        var $suggestions, nodes;

        $suggestions = $(html.suggestions).css(css.suggestions);

        // jQuery#append doesn't support arrays as the first argument
        // until version 1.8, see http://bugs.jquery.com/ticket/11231
        nodes = _.map(suggestions, getSuggestionNode);
        $suggestions.append.apply($suggestions, nodes);

        that.highlight && highlight({
          className: 'tt-highlight',
          node: $suggestions[0],
          pattern: query
        });

        return $suggestions;

        function getSuggestionNode(suggestion) {
          var $el;

          $el = $(html.suggestion)
          .append(that.templates.suggestion(suggestion))
          .data(keys.val, that.displayFn(suggestion))
          .data(keys.obj, suggestion);

          $el.children().each(function() { $(this).css(css.suggestionChild); });

          return $el;
        }
      }

      function getHeaderHtml() {
        return that.templates.header({
          query: query,
          isEmpty: !hasSuggestions
        });
      }

      function getFooterHtml() {
        return that.templates.footer({
          query: query,
          isEmpty: !hasSuggestions
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

      function render(suggestions) {
        // if the update has been canceled or if the query has changed
        // do not render the suggestions as they've become outdated
        if (!that.canceled && query === that.query) {
          that._render(query, suggestions);
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
      suggestion: templates.suggestion || suggestionTemplate
    };

    function suggestionTemplate(context) {
      return '<p>' + displayFn(context) + '</p>';
    }
  }

  function isValidName(str) {
    // dashes, underscores, letters, and numbers
    return (/^[_a-zA-Z0-9-]+$/).test(str);
  }
})();
