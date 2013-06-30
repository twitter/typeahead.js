/*
 * typeahead.js
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

// this is a modified version of bearhug.js. some utility methods have been
// swapped out for the equivalent ones provided by typeahead.js. for more
// details on bearhug.js, visit https://github.com/jharding/bearhug.
var bearhug = (function(doc) {

  var defaults = {
        node: null,
        pattern: null,
        tagName: 'strong',
        className: null,
        wordsOnly: false,
        caseSensitive: false
      };

  return function bearhug(o) {
    var regex;

    o = utils.mixin({}, defaults, o);

    if (!o.node || !o.pattern) {
      throw new Error('both node and pattern must be set');
    }

    // support wrapping multiple patterns
    o.pattern = utils.isArray(o.pattern) ? o.pattern : [o.pattern];

    regex = getRegex(o.pattern, o.caseSensitive, o.wordsOnly);
    traverse(o.node, bearhugTextNode);

    function bearhugTextNode(textNode) {
      var match, patternNode;

      if (match = regex.exec(textNode.data)) {
        wrapperNode = doc.createElement(o.tagName);
        o.className && (wrapperNode.className = o.className);

        patternNode = textNode.splitText(match.index);
        patternNode.splitText(match[0].length);
        wrapperNode.appendChild(patternNode.cloneNode(true));

        textNode.parentNode.replaceChild(wrapperNode, patternNode);
      }

      return !!match;
    }

    function traverse(el, bearhugTextNode) {
      var childNode, TEXT_NODE_TYPE = 3;

      for (var i = 0; i < el.childNodes.length; i++) {
        childNode = el.childNodes[i];

        if (childNode.nodeType === TEXT_NODE_TYPE) {
          i += bearhugTextNode(childNode) ? 1 : 0;
        }

        else {
          traverse(childNode, bearhugTextNode);
        }
      }
    }
  };

  function getRegex(patterns, caseSensitive, wordsOnly) {
    var escapedPatterns = [], regexStr;

    for (var i = 0; i < patterns.length; i++) {
      escapedPatterns.push(utils.escapeRegExChars(patterns[i]));
    }

    regexStr = wordsOnly ?
      '\\b(' + escapedPatterns.join('|') + ')\\b' :
      '(' + escapedPatterns.join('|') + ')';

    return caseSensitive ? new RegExp(regexStr) : new RegExp(regexStr, 'i');
  }
})(window.document);
