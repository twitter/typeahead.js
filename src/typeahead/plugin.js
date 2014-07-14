/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  'use strict';

  var old, keys, methods;

  old = $.fn.typeahead;

  keys = {
    typeahead: 'ttTypeahead',
    attrs: 'ttAttrs'
  };

  methods = {
    // supported signatures:
    // function(o, dataset, dataset, ...)
    // function(o, [dataset, dataset, ...])
    initialize: function initialize(o, datasets) {
      var www;

      datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);

      o = o || {};
      www = WWW(o.classNames);

      return this.each(attach);

      function attach() {
        var $input, $wrapper, $hint, $results, defaultHint, defaultResults,
            eventBus, input, results, typeahead, ResultsConstructor;

        // highlight is a top-level config that needs to get inherited
        // from all of the datasets
        _.each(datasets, function(d) { d.highlight = !!o.highlight; });

        $input = $(this);
        $wrapper = $(www.html.wrapper);
        $hint = isDom(o.hint) ? $(o.hint).first() : null;
        $results = isDom(o.results) ? $(o.results).first() : null;

        defaultHint = o.hint !== false && !$hint;
        defaultResults = o.results !== false && !$results;

        defaultHint && ($hint = buildHintFromInput($input, www));
        defaultResults && ($results = $(www.html.results).css(www.css.results));

        $input = prepInput($input);

        // only apply out-of-box css if necessary
        if (defaultHint || defaultResults) {
          $wrapper.css(www.css.wrapper);
          $input.css(defaultHint ? www.css.input : www.css.inputWithNoHint);
        }

        $input
        .wrap($wrapper)
        .parent()
        .prepend(defaultHint ? $hint : null)
        .append(defaultResults ? $results : null);

        ResultsConstructor = defaultResults ? DefaultResults : Results;

        eventBus = new EventBus({ el: $input });
        input = new Input({ hint: $hint, input: $input, }, www);
        results = new ResultsConstructor({
          node: $results,
          datasets: datasets
        }, www);

        typeahead = new Typeahead({
          minLength: o.minLength,
          autoselect: o.autoselect,
          input: input,
          results: results,
          eventBus: eventBus
        }, www);

        $input.data(keys.typeahead, typeahead);
      }
    },

    val: function val(newVal) {
      // mirror jQuery#val functionality: reads opearte on first match,
      // write operates on all matches
      return !arguments.length ? getVal(this.first()) : this.each(setVal);

      function setVal() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(keys.typeahead)) {
          typeahead.setVal(newVal);
        }
      }

      function getVal($input) {
        var typeahead, query;

        if (typeahead = $input.data(keys.typeahead)) {
          query = typeahead.getVal();
        }

        return query;
      }
    },

    destroy: function destroy() {
      return this.each(unattach);

      function unattach() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(keys.typeahead)) {
          revert($input);
          typeahead.destroy();
          $input.removeData(keys.typeahead);
        }
      }
    }
  };

  $.fn.typeahead = function(method) {
    var tts;

    // methods that should only act on intialized typeaheads
    if (methods[method] && method !== 'initialize') {
      // filter out non-typeahead inputs
      tts = this.filter(function() { return !!$(this).data(keys.typeahead); });
      return methods[method].apply(tts, [].slice.call(arguments, 1));
    }

    else {
      return methods.initialize.apply(this, arguments);
    }
  };

  $.fn.typeahead.noConflict = function noConflict() {
    $.fn.typeahead = old;
    return this;
  };

  // helper methods
  // --------------

  function buildHintFromInput($input, www) {
    return $input.clone()
    .addClass('tt-hint')
    .removeData()
    .css(www.css.hint)
    .css(getBackgroundStyles($input))
    .prop('readonly', true)
    .removeAttr('id name placeholder required')
    .attr({ autocomplete: 'off', spellcheck: 'false', tabindex: -1 });
  }

  function prepInput($input) {
    // store the original values of the attrs that get modified
    // so modifications can be reverted on destroy
    $input.data(keys.attrs, {
      dir: $input.attr('dir'),
      autocomplete: $input.attr('autocomplete'),
      spellcheck: $input.attr('spellcheck'),
      style: $input.attr('style')
    });

    $input
    .addClass('tt-input')
    .attr({ autocomplete: 'off', spellcheck: false });

    // ie7 does not like it when dir is set to auto
    try { !$input.attr('dir') && $input.attr('dir', 'auto'); } catch (e) {}

    return $input;
  }

  function getBackgroundStyles($el) {
    return {
      backgroundAttachment: $el.css('background-attachment'),
      backgroundClip: $el.css('background-clip'),
      backgroundColor: $el.css('background-color'),
      backgroundImage: $el.css('background-image'),
      backgroundOrigin: $el.css('background-origin'),
      backgroundPosition: $el.css('background-position'),
      backgroundRepeat: $el.css('background-repeat'),
      backgroundSize: $el.css('background-size')
    };
  }

  function revert($input) {
    var $wrapper = $input.parent();

    // need to remove attrs that weren't previously defined and
    // revert attrs that originally had a value
    _.each($input.data(keys.attrs), function(val, key) {
      _.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
    });

    $input
    .detach()
    .removeData(keys.attrs)
    .removeClass('tt-input')
    .insertAfter($wrapper);

    $wrapper.remove();
  }

  function isDom(obj) { return _.isJQuery(obj) || _.isElement(obj); }
})();
