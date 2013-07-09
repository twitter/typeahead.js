/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

var css;

css = {
  wrapper: {
    position: 'relative',
    display: 'inline-block'
  },
  hint: {
    position: 'absolute',
    top: '0',
    left: '0',
    borderColor: 'transparent',
    boxShadow: 'none'
  },
  input: {
    position: 'relative',
    verticalAlign: 'top',
    backgroundColor: 'transparent'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    zIndex: '100',
    display: 'none'
  },
  suggestions: {
    display: 'block'
  },
  suggestion: {
    whiteSpace: 'nowrap',
    cursor: 'pointer'
  },
  suggestionChild: {
    whiteSpace: 'normal'
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
if (utils.isMsie()) {
   // ie6-8 (and 9?) doesn't fire hover and click events for elements with
   // transparent backgrounds, for a workaround, use 1x1 transparent gif
  utils.mixin(css.query, {
    backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)'
  });
}

// ie7 and under specific styling
if (utils.isMsie() && utils.isMsie() <= 7) {
  utils.mixin(css.wrapper, { display: 'inline', zoom: '1' });
  // if someone can tell me why this is necessary to align
  // the hint with the query in ie7, i'll send you $5 - @JakeHarding
  utils.mixin(css.query, { marginTop: '-1px' });
}
