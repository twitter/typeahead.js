/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var SectionView = (function() {
  var suggestionKey = 'ttSuggestion';

  // constructor
  // -----------

  function SectionView(o) {
    // tracks the last query the section was updated for
    this.query = null;

    this.dataset = o.dataset;
    this.templates = o.templates;

    this.$el = $(html.section.replace('%CLASS%', this.dataset.name));
  }

  // static methods
  // --------------

  SectionView.extractDatum = function extractDatum(el) {
    return $(el).data(suggestionKey);
  };

  // instance methods
  // ----------------

  utils.mixin(SectionView.prototype, EventEmitter, {

    // ### private

    _render: function render(query, suggestions) {
      var that = this, $suggestions;

      $suggestions = $(html.suggestions)
      .css(css.suggestions)
      .append(utils.map(suggestions, getSuggestionNodes));

      this.clear();
      this.$el.append($suggestions);
      // TODO: render header and footer

      this.trigger('rendered');

      function getSuggestionNodes(suggestion) {
        var $el, innerHtml, outerHtml;

        innerHtml = that.templates.suggestion(suggestion.raw);
        outerHtml = html.suggestion.replace('%BODY%', innerHtml);
        $el = $(outerHtml).data(suggestionKey, suggestion);

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
    }
  });

  return SectionView;

})();
