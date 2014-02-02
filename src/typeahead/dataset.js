/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var Dataset = (function() {
  var datasetKey = 'ttDataset', valueKey = 'ttValue', datumKey = 'ttDatum';

  // constructor
  // -----------

  function Dataset(o) {
    o = o || {};
    o.templates = o.templates || {};

    if (!o.source) {
      $.error('missing source');
    }

    // tracks the last query the dataset was updated for
    this.query = null;

    this.highlight = !!o.highlight;
    this.name = o.name || _.getUniqueId();

    this.source = o.source;
    this.valueKey = o.displayKey || 'value';

    this.templates = getTemplates(o.templates, this.valueKey);

    this.$el = $(html.dataset.replace('%CLASS%', this.name));
  }

  // static methods
  // --------------

  Dataset.extractDatasetName = function extractDatasetName(el) {
    return $(el).data(datasetKey);
  };

  Dataset.extractValue = function extractDatum(el) {
    return $(el).data(valueKey);
  };

  Dataset.extractDatum = function extractDatum(el) {
    return $(el).data(datumKey);
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
          .data(datasetKey, that.name)
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

  return Dataset;

  // helper functions
  // ----------------

  function getTemplates(templates, valueKey) {
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
