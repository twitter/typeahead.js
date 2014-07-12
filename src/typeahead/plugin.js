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
    attrs: 'ttAttrs',
    oobHint: 'ttOobHint',
    oobMenu: 'ttOobMenu'
  };

  methods = {
    // supported signatures:
    // function(o, dataset, dataset, ...)
    // function(o, [dataset, dataset, ...])
    initialize: function initialize(o, datasets) {
      datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);

      o = o || {};

      return this.each(attach);

      function attach() {
        var $input = $(this), $elements, eventBus, typeahead;

        _.each(datasets, function(d) {
          // HACK: force highlight as a top-level config
          d.highlight = !!o.highlight;
        });

        $elements = buildDom($input, o.hint, o.menu);

        typeahead = new Typeahead({
          hint: $elements.hint,
          menu: $elements.menu,
          input: $input,
          eventBus: eventBus = new EventBus({ el: $input }),
          minLength: o.minLength,
          autoselect: o.autoselect,
          datasets: datasets
        });

        $input.data(keys.typeahead, typeahead);
      }
    },

    open: function open() {
      return this.each(openTypeahead);

      function openTypeahead() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(keys.typeahead)) {
          typeahead.open();
        }
      }
    },

    close: function close() {
      return this.each(closeTypeahead);

      function closeTypeahead() {
        var $input = $(this), typeahead;

        if (typeahead = $input.data(keys.typeahead)) {
          typeahead.close();
        }
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

  function buildDom($input, oHint, oMenu) {
    var $wrapper, $hint, $menu, oobHint, oobMenu;

    $wrapper = $(html.wrapper);
    $hint = $(oHint).first();
    $menu = $(oMenu).first();

    oobHint = oHint !== false && $hint.length === 0;
    oobMenu = oMenu !== false && $menu.length === 0;

    // track whether the hint and menu are out-of-box so in the case destroy
    // is called we can do a proper revert of the changes that've been made
    $input.data(keys.oobHint, oobHint).data(keys.oobMenu, oobMenu);

    oobHint && ($hint = buildHintFromInput($input));
    oobMenu && ($menu = $(html.dropdown).css(css.dropdown));

    $input = prepInput($input);

    // only apply out-of-box css if necessary
    if (oobHint || oobMenu) {
      $wrapper.css(css.wrapper);
      $input.css(oobHint ? css.input : css.inputWithNoHint);
    }

    $input
    .wrap($wrapper)
    .parent()
    .prepend(oobHint ? $hint : null)
    .append(oobMenu ? $menu : null);

    return { wrapper: $wrapper, input: $input, hint: $hint, menu: $menu };
  }


  function buildHintFromInput($input) {
    return $input.clone()
    .addClass('tt-hint')
    .removeData()
    .css(css.hint)
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
})();
