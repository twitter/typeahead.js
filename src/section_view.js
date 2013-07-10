/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var SectionView = (function() {
  var datumKey = 'ttDatum';

  // constructor
  // -----------

  function SectionView(o) {
    o = o || {};
    o.templates = o.templates || {};

    if (!o.dataset) {
      $.error('missing dataset');
    }

    // tracks the last query the section was updated for
    this.query = null;
    this.highlight = !!o.highlight;

    this.dataset = o.dataset;
    this.templates = {
      empty: o.templates.empty && templatify(o.templates.empty),
      header: o.templates.header && templatify(o.templates.header),
      footer: o.templates.footer && templatify(o.templates.footer),
      suggestion: o.templates.suggestion || defaultSuggestionTemplate
    };

    this.$el = $(html.section.replace('%CLASS%', this.dataset.name));
  }

  // static methods
  // --------------

  SectionView.extractDatum = function extractDatum(el) {
    return $(el).data(datumKey);
  };

  // instance methods
  // ----------------

  _.mixin(SectionView.prototype, EventEmitter, {

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

      else if(hasSuggestions) {
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
      this.dataset.get(query, renderIfQueryIsSame);

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

  return SectionView;

  // helper functions
  // ----------------

  function templatify(obj) {
    return _.isFunction(obj) ? obj : template;

    function template() { return String(obj); }
  }

  function defaultSuggestionTemplate(context) {
    return '<p>' + context.value + '</p>';
  }
})();
