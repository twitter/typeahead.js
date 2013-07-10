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

  utils.mixin(SectionView.prototype, EventEmitter, {

    // ### private

    _render: function render(query, suggestions) {
      var that = this, $suggestions, headerFooterContext, header, footer;

      this.clear();

      $suggestions = $(html.suggestions)
      .css(css.suggestions)
      .append(utils.map(suggestions, getSuggestionNodes));

      this.$el.append($suggestions);
      this.highlight && highlight({ node: $suggestions[0], pattern: query });

      headerFooterContext = { query: query, isEmpty: !suggestions.length };

      if (this.templates.header) {
        header = this.templates.header(headerFooterContext);
        this.$el.prepend(header);
      }

      if (this.templates.footer) {
        footer = this.templates.footer(headerFooterContext);
        this.$el.append(footer);
      }

      this.trigger('rendered');

      function getSuggestionNodes(suggestion) {
        var $el, innerHtml, outerHtml;

        innerHtml = that.templates.suggestion(suggestion.raw);
        outerHtml = html.suggestion.replace('%BODY%', innerHtml);
        $el = $(outerHtml).data(datumKey, suggestion);

        $el.children().each(function() { $(this).css(css.suggestionChild); });

        return $el;
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
      this.$el.empty();
    },

    isEmpty: function isEmpty() {
      return this.$el.is(':empty');
    }
  });

  return SectionView;

  // helper functions
  // ----------------

  function templatify(obj) {
    return utils.isFunction(obj) ? obj : template;

    function template() { return String(obj); }
  }

  function defaultSuggestionTemplate(context) {
    return '<p>' + context.value + '</p>';
  }
})();
