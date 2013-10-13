/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Section = (function() {
  var sectionKey = 'ttSection', valueKey = 'ttValue', datumKey = 'ttDatum';

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
    this.valueKey = getValueKeyFromDataset(o.source) || o.valueKey || 'value';

    this.templates = getTemplates(o.templates, this.valueKey);

    this.$el = $(html.section.replace('%CLASS%', this.name));
  }

  // static methods
  // --------------

  Section.extractSectionName = function extractSectionName(el) {
    return $(el).data(sectionKey);
  };

  Section.extractValue = function extractDatum(el) {
    return $(el).data(valueKey);
  };

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
        return that.templates.empty({ query: query });
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

          innerHtml = that.templates.suggestion(suggestion);
          outerHtml = html.suggestion.replace('%BODY%', innerHtml);
          $el = $(outerHtml)
          .data(sectionKey, that.name)
          .data(valueKey, suggestion[that.valueKey])
          .data(datumKey, suggestion);

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
    },

    destroy: function destroy() {
      this.$el = null;
    }
  });

  return Section;

  // helper functions
  // ----------------

  // a valid source is either a function or a dataset instance
  // when it's a dataset, grab its get method and bind it to itself
  function setupSource(source) {
    if (window.Dataset && source instanceof window.Dataset) {
      source.initialize();
      source = _.bind(source.get, source);
    }

    return source;
  }

  function getValueKeyFromDataset(source) {
    return (Dataset && source instanceof Dataset) ? source.valueKey : null;
  }

  function getTemplates(templates, valueKey) {
    valueKey = valueKey || 'value';

    return {
      empty: templates.empty && _.templatify(templates.empty),
      header: templates.header && _.templatify(templates.header),
      footer: templates.footer && _.templatify(templates.footer),
      suggestion: templates.suggestion || suggestionTemplate
    };

    function suggestionTemplate(context) {
      return '<p>' + context[valueKey] + '</p>';
    }
  }
})();
