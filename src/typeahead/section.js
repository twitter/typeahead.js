/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Section = (function() {
  var datumKey = 'ttDatum';

  // constructor
  // -----------

  function Section(o) {
    o = o || {};
    o.templates = o.templates || {};

    if (!o.source) {
      $.error('missing source');
    }

    // tracks the last query the section was updated for
    this.query = null;

    this.highlight = !!o.highlight;
    this.name = o.name || _.getUniqueId();

    this.source = setupSource(o.source);
    this.templates = {
      empty: o.templates.empty && _.templatify(o.templates.empty),
      header: o.templates.header && _.templatify(o.templates.header),
      footer: o.templates.footer && _.templatify(o.templates.footer),
      suggestion: o.templates.suggestion || defaultSuggestionTemplate
    };

    this.$el = $(html.section.replace('%CLASS%', this.name));
  }

  // static methods
  // --------------

  Section.extractDatum = function extractDatum(el) {
    return $(el).data(datumKey);
  };

  // instance methods
  // ----------------

  _.mixin(Section.prototype, EventEmitter, {

    // ### private

    _render: function render(query, suggestions) {
      var that = this, hasSuggestions;

      this.$el.empty();
      hasSuggestions = suggestions && suggestions.length;

      if (!hasSuggestions && this.templates.empty) {
        this.$el
        .html(getEmptyHtml())
        .append(that.templates.header ? getHeaderHtml() : null)
        .prepend(that.templates.footer ? getFooterHtml() : null);
      }

      else if (hasSuggestions) {
        this.$el
        .html(getSuggestionsHtml())
        .append(that.templates.header ? getHeaderHtml() : null)
        .prepend(that.templates.footer ? getFooterHtml() : null);
      }

      this.trigger('rendered');

      function getEmptyHtml() {
        return that.templates.empty({
          query: query,
          hasSuggestions: hasSuggestions
        });
      }

      function getSuggestionsHtml() {
        var $suggestions;

        $suggestions = $(html.suggestions)
        .css(css.suggestions)
        .append(_.map(suggestions, getSuggestionNode));

        that.highlight && highlight({ node: $suggestions[0], pattern: query });

        return $suggestions;

        function getSuggestionNode(suggestion) {
          var $el, innerHtml, outerHtml;

          innerHtml = that.templates.suggestion(suggestion.raw);
          outerHtml = html.suggestion.replace('%BODY%', innerHtml);
          $el = $(outerHtml).data(datumKey, suggestion);

          $el.children().each(function() { $(this).css(css.suggestionChild); });

          return $el;
        }
      }

      function getHeaderHtml() {
        return that.templates.header({
          query: query,
          hasSuggestions: hasSuggestions
        });
      }

      function getFooterHtml() {
        return that.templates.footer({
          query: query,
          hasSuggestions: hasSuggestions
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
      this.source(query, renderIfQueryIsSame);

      function renderIfQueryIsSame(suggestions) {
        query === that.query && that._render(query, suggestions);
      }
    },

    clear: function clear() {
      this._render(this.query || '');
    },

    isEmpty: function isEmpty() {
      return this.$el.is(':empty');
    }
  });

  return Section;

  // helper functions
  // ----------------

  function setupSource(source) {
    var Dataset = window.Dataset;

    // a valid source is either a function or a dataset instance
    // when it's a dataset, grab its get method and bind it to itself
    return (Dataset && source instanceof Dataset) ?
      _.bind(source.get, source) : source;
  }

  function defaultSuggestionTemplate(context) {
    return '<p>' + context.value + '</p>';
  }
})();
