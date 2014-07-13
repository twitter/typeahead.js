/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var WWW = (function() {
  'use strict';

  var defaultClassNames = {
    wrapper: 'twitter-typeahead',
    input: 'tt-input',
    hint: 'tt-hint',
    results: 'tt-results',
    dataset: 'tt-dataset',
    result: 'tt-result',
    selectable: 'tt-selectable',
    empty: 'tt-empty',
    activated: 'tt-activated',
    cursor: 'tt-cursor',
    highlight: 'tt-highlight'
  };

  return build;

  function build(o) {
    var www, classNames;

    classNames = _.mixin({}, defaultClassNames, o);

    www = {
      css: buildCss(),
      html: buildHtml(classNames),
      selectors: buildSelectors(classNames),
      classNames: classNames
    };

    return {
      css: www.css,
      html: www.html,
      selectors: www.selectors,
      classNames: www.classNames,
      mixin: function(o) { _.mixin(o, www); }
    };
  }

  function buildHtml(c) {
    return {
      wrapper: j('<span class="', c.wrapper, '"></span>'),
      results: j('<span class="', c.results, '"></span>'),
      result: j('<div class="', _j(c.result, c.selectable), '"></div>'),
      dataset: j('<div class="', _j(c.dataset, c.dataset), '-%CLASS%"></div>')
    };

    function j() { return [].slice.call(arguments, 0).join(''); }
    function _j() { return [].slice.call(arguments, 0).join(' '); }
  }

  function buildSelectors(classNames) {
    var selectors = {};
    _.each(classNames, function(v, k) { selectors[k] = '.' + v; });

    return selectors;
  }

  function buildCss() {
    var css =  {
      wrapper: {
        position: 'relative',
        display: 'inline-block'
      },
      hint: {
        position: 'absolute',
        top: '0',
        left: '0',
        borderColor: 'transparent',
        boxShadow: 'none',
        // #741: fix hint opacity issue on iOS
        opacity: '1'
      },
      input: {
        position: 'relative',
        verticalAlign: 'top',
        backgroundColor: 'transparent'
      },
      inputWithNoHint: {
        position: 'relative',
        verticalAlign: 'top'
      },
      results: {
        position: 'absolute',
        top: '100%',
        left: '0',
        zIndex: '100',
        display: 'none'
      },
      ltr: {
        left: '0',
        right: 'auto'
      },
      rtl: {
        left: 'auto',
        right:' 0'
      }
    };

    // ie specific styling
    if (_.isMsie()) {
       // ie6-8 (and 9?) doesn't fire hover and click events for elements with
       // transparent backgrounds, for a workaround, use 1x1 transparent gif
      _.mixin(css.input, {
        backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)'
      });
    }

    // ie7 and under specific styling
    if (_.isMsie() && _.isMsie() <= 7) {
      // if someone can tell me why this is necessary to align
      // the hint with the query in ie7, i'll send you $5 - @JakeHarding
      _.mixin(css.input, { marginTop: '-1px' });
    }

    return css;
  }
})();
