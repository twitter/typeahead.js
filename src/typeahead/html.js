/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var html = (function() {
  return {
    wrapper: '<span class="twitter-typeahead"></span>',
    dropdown: '<span class="tt-dropdown-menu" role="listbox"></span>',
    dataset: '<div class="tt-dataset-%CLASS%" role="presentation"></div>',
    suggestions: '<span class="tt-suggestions" role="presentation"></span>',
    suggestion: '<div class="tt-suggestion" role="option"></div>'
  };
})();
