# Changelog

### 1.1.1 January 12, 2017
* Fix hiding of .visuallyhidden style (introduced in #104) [#107](https://github.com/corejavascript/typeahead.js/pull/107)

### 1.1.0 December 19, 2016
* Improve screen reader support, ARIA, etc. [#104](https://github.com/corejavascript/typeahead.js/pull/104)
* Remove non-essential files from NPM package [#100](https://github.com/corejavascript/typeahead.js/pull/100)

### 1.0.1 November 17, 2016
* v1.0.1 Released

### 1.0.0-beta November 10, 2016
* Add diacritic-insensitive highlighting [#51](https://github.com/corejavascript/typeahead.js/pull/51)
* Allow for custom setting of maxPendingRequests [#62](https://github.com/corejavascript/typeahead.js/pull/62)
* Fix incorrect event arguments [#65](https://github.com/corejavascript/typeahead.js/pull/65)
* Fix incorrect limit with remote [#52](https://github.com/corejavascript/typeahead.js/pull/52)
* Implement edge ngram tokenizer for Bloodhound [#93](https://github.com/corejavascript/typeahead.js/pull/93)
* Remove requirement to have bower when installing via NPM [#74](https://github.com/corejavascript/typeahead.js/pull/74)
* Fix codestyle issues [#86](https://github.com/corejavascript/typeahead.js/pull/86)
* Add PhantomJS as dev dependency [#87](https://github.com/corejavascript/typeahead.js/pull/87)
* Remove cursor onMouseLeave [#90](https://github.com/corejavascript/typeahead.js/pull/90)
* Add matchAnyQueryToken option. [#2](https://github.com/corejavascript/typeahead.js/pull/2)
* Update rendered-count after async results have displayed. [#8](https://github.com/corejavascript/typeahead.js/pull/8)
* Add default on option to stop propagation when selecting an entry. [#13](https://github.com/corejavascript/typeahead.js/pull/13)
* Fix link to contributing guidelines [#49](https://github.com/corejavascript/typeahead.js/pull/49)
* Set cursor onHover [#28](https://github.com/corejavascript/typeahead.js/pull/28)
* Complete to currently selected suggestion [#27](https://github.com/corejavascript/typeahead.js/pull/27)
* Fix 404 links [#41](https://github.com/corejavascript/typeahead.js/pull/41)
* Fix typos in comments in plugin.js [#37](https://github.com/corejavascript/typeahead.js/pull/37)
* Update travis config to run latest supported node version [#25](https://github.com/corejavascript/typeahead.js/pull/25)
* Update NPM package dependencies [#19](https://github.com/corejavascript/typeahead.js/pull/19)
* Speed up Travis build [#22](https://github.com/corejavascript/typeahead.js/pull/22)
* Fix npm error by adding license link [#18](https://github.com/corejavascript/typeahead.js/pull/18)
* Move globally installed dependency [#16](https://github.com/corejavascript/typeahead.js/pull/16)


### 0.11.1 April 26, 2015

* Add prepare option to prefetch. [#1181](https://github.com/twitter/typeahead.js/pull/1181)
* Handle QuotaExceededError. [#1110](https://github.com/twitter/typeahead.js/pull/1110)
* Escape HTML entities from suggestion display value when rendering with default
  template. [#964](https://github.com/twitter/typeahead.js/pull/964)
* List jquery as a dependency in package.json. [#1143](https://github.com/twitter/typeahead.js/pull/1143)

### 0.11.0 April 25, 2015

An overhaul of typeahead.js – consider this a release candidate for v1. There
are bunch of API changes with this release so don't expect backwards
compatibility with previous versions. There are also many new undocumented
features that have been introduced. Documentation for those features will be
added before v1 ships.

Beware that since this release is pretty much a rewrite, there are bound to be
some bugs. To be safe, you should consider this release beta software and
throughly test your integration of it before using it in production
environments. This caveat only applies to this release as subsequent releases
will address any issues that come up.

### 0.10.5 August 7, 2014

* Increase supported version range for jQuery dependency. [#917](https://github.com/twitter/typeahead.js/pull/917)

### 0.10.4 July 13, 2014

**Hotfix**

* Fix regression that breaks Bloodhound instances when more than 1 instance is
  relying on remote data. [#899](https://github.com/twitter/typeahead.js/pull/899)

### 0.10.3 July 10, 2014

**Bug fixes**

* `Bloodhound#clearPrefetchCache` now works with cache keys that contain regex
  characters. [#771](https://github.com/twitter/typeahead.js/pull/771)
* Prevent outdated network requests from being sent. [#809](https://github.com/twitter/typeahead.js/pull/809)
* Add support to object tokenizers for multiple property tokenization. [#811](https://github.com/twitter/typeahead.js/pull/811)
* Fix broken `jQuery#typeahead('val')` method. [#815](https://github.com/twitter/typeahead.js/pull/815)
* Remove `disabled` attribute from the hint input control. [#839](https://github.com/twitter/typeahead.js/pull/839)
* Add `tt-highlight` class to highlighted text. [#833](https://github.com/twitter/typeahead.js/pull/833)
* Handle non-string types that are passed to `jQuery#typeahead('val', val)`. [#881](https://github.com/twitter/typeahead.js/pull/881)

### 0.10.2 March 10, 2014

* Prevent flickering of dropdown menu when requesting remote suggestions. [#718](https://github.com/twitter/typeahead.js/pull/718)
* Reduce hint flickering. [#754](https://github.com/twitter/typeahead.js/pull/754)
* Added `Bloodhound#{clear, clearPrefetchCache, clearRemoteCache}` and made it
  possible to reinitialize Bloodhound instances. [#703](https://github.com/twitter/typeahead.js/pull/703)
* Invoke `local` function during initialization. [#687](https://github.com/twitter/typeahead.js/pull/687)
* In addition to HTML strings, templates can now return DOM nodes. [#742](https://github.com/twitter/typeahead.js/pull/742)
* Prevent `jQuery#typeahead('val', val)` from opening dropdown menus of
  non-active typeaheads. [#646](https://github.com/twitter/typeahead.js/pull/646)
* Fix bug in IE that resulted in dropdown menus with overflow being closed
  when clicking on the scrollbar. [#705](https://github.com/twitter/typeahead.js/pull/705)
* Only show dropdown menu if `minLength` is satisfied. [#710](https://github.com/twitter/typeahead.js/pull/710)

### 0.10.1 February 9, 2014

**Hotfix**

* Fixed bug that prevented some ajax configs from being respected. [#630](https://github.com/twitter/typeahead.js/pull/630)
* Event delegation on suggestion clicks is no longer broken. [#118](https://github.com/twitter/typeahead.js/pull/118)
* Ensure dataset names are valid class name suffixes. [#610](https://github.com/twitter/typeahead.js/pull/610)
* Added support for `displayKey` to be a function. [#633](https://github.com/twitter/typeahead.js/pull/633)
* `jQuery#typeahead('val')` now mirrors `jQuery#val()`. [#659](https://github.com/twitter/typeahead.js/pull/659)
* Datasets can now be passed to jQuery plugin as an array. [#664](https://github.com/twitter/typeahead.js/pull/664)
* Added a `noConflict` method to the jQuery plugin. [#612](https://github.com/twitter/typeahead.js/pull/612)
* Bloodhound's `local` property can now be a function. [#485](https://github.com/twitter/typeahead.js/pull/485)

### 0.10.0 February 2, 2014

**Introducting Bloodhound**

This release was almost a complete rewrite of typeahead.js and will hopefully
lay the foundation for the 1.0.0 release. It's impossible to enumerate all of
the issues that were fixed. If you want to get an idea of what issues 0.10.0
resolved, take a look at the closed issues in the [0.10.0 milestone](https://github.com/twitter/typeahead.js/issues?milestone=8&page=1&state=closed).

The most important change in 0.10.0 is that typeahead.js was broken up into 2
individual components: Bloodhound and jQuery#typeahead. Bloodhound is an
feature-rich suggestion engine. jQuery#typeahead is a jQuery plugin that turns
input controls into typeaheads.

It's impossible to write a typeahead library that supports every use-case out
of the box – that was the main motivation behind decomposing typeahead.js.
Previously, some prospective typeahead.js users were unable to use the library
because either the suggestion engine or the typeahead UI did not meet their
requirements. In those cases, they were either forced to fork typeahead.js and
make the necessary modifications or they had to give up on using typeahead.js
entirely. Now they have the option of swapping out the component that doesn't
work for them with a custom implementation.

### 0.9.3 June 24, 2013

* Ensure cursor visibility in menus with overflow. [#209](https://github.com/twitter/typeahead.js/pull/209)
* Fixed bug that led to the menu staying open when it should have been closed. [#260](https://github.com/twitter/typeahead.js/pull/260)
* Private browsing in Safari no longer breaks prefetch. [#270](https://github.com/twitter/typeahead.js/pull/270)
* Pressing tab while a suggestion is highlighted now results in a selection. [#266](https://github.com/twitter/typeahead.js/pull/266)
* Dataset name is now passed as an argument for typeahead:selected event. [#207](https://github.com/twitter/typeahead.js/pull/207)

### 0.9.2 April 14, 2013

* Prefetch usage no longer breaks when cookies are disabled. [#190](https://github.com/twitter/typeahead.js/pull/190)
* Precompiled templates are now wrapped in the appropriate DOM element. [#172](https://github.com/twitter/typeahead.js/pull/172)

### 0.9.1 April 1, 2013

* Multiple requests no longer get sent for a query when datasets share a remote source. [#152](https://github.com/twitter/typeahead.js/pull/152)
* Datasets now support precompiled templates. [#137](https://github.com/twitter/typeahead.js/pull/137)
* Cached remote suggestions now get rendered immediately. [#156](https://github.com/twitter/typeahead.js/pull/156)
* Added typeahead:autocompleted event. [#132](https://github.com/twitter/typeahead.js/pull/132)
* Added a plugin method for programmatically setting the query. Experimental. [#159](https://github.com/twitter/typeahead.js/pull/159)
* Added minLength option for datasets. Experimental. [#131](https://github.com/twitter/typeahead.js/pull/131)
* Prefetch objects now support thumbprint option. Experimental. [#157](https://github.com/twitter/typeahead.js/pull/157)

### 0.9.0 March 24, 2013

**Custom events, no more typeahead.css, and an improved API**

* Implemented the triggering of custom events. [#106](https://github.com/twitter/typeahead.js/pull/106)
* Got rid of typeahead.css and now apply styling through JavaScript. [#15](https://github.com/twitter/typeahead.js/pull/15)
* Made the API more flexible and addressed a handful of remote issues by rewriting the transport component. [#25](https://github.com/twitter/typeahead.js/pull/81)
* Added support for dataset headers and footers. [#81](https://github.com/twitter/typeahead.js/pull/81)
* No longer cache unnamed datasets. [#116](https://github.com/twitter/typeahead.js/pull/116)
* Made the key name of the value property configurable. [#115](https://github.com/twitter/typeahead.js/pull/115)
* Input values set before initialization of typeaheads are now respected. [#109](https://github.com/twitter/typeahead.js/pull/109)
* Fixed an input value/hint casing bug. [#108](https://github.com/twitter/typeahead.js/pull/108)

### 0.8.2 March 04, 2013

* Fixed bug causing error to be thrown when initializing a typeahead on multiple elements. [#51](https://github.com/twitter/typeahead.js/pull/51)
* Tokens with falsy values are now filtered out – was causing wonky behavior. [#75](https://github.com/twitter/typeahead.js/pull/75)
* No longer making remote requests for blank queries. [#74](https://github.com/twitter/typeahead.js/pull/74)
* Datums with regex characters in their value no longer cause errors. [#77](https://github.com/twitter/typeahead.js/pull/77)
* Now compatible with the Closure Compiler. [#48](https://github.com/twitter/typeahead.js/pull/48)
* Reference to jQuery is now obtained through window.jQuery, not window.$. [#47](https://github.com/twitter/typeahead.js/pull/47)
* Added a plugin method for destroying typeaheads. Won't be documented until v0.9 and might change before then. [#59](https://github.com/twitter/typeahead.js/pull/59)

### 0.8.1 February 25, 2013

* Fixed bug preventing local and prefetch from being used together. [#39](https://github.com/twitter/typeahead.js/pull/39)
* No longer prevent default browser behavior when up or down arrow is pressed with a modifier. [#6](https://github.com/twitter/typeahead.js/pull/6)
* Hint is hidden when user entered query is wider than the input. [#26](https://github.com/twitter/typeahead.js/pull/26)
* Data stored in localStorage now expires properly. [#34](https://github.com/twitter/typeahead.js/pull/34)
* Normalized search tokens and fixed query tokenization. [#38](https://github.com/twitter/typeahead.js/pull/38)
* Remote suggestions now are appended, not prepended to suggestions list. [#40](https://github.com/twitter/typeahead.js/pull/40)
* Fixed some typos through the codebase. [#3](https://github.com/twitter/typeahead.js/pull/3)

### 0.8.0 February 19, 2013

**Initial public release**

* Prefetch and search data locally insanely fast.
* Search hard-coded, prefetched, and/or remote data.
* Hinting.
* RTL/IME/international support.
* Search multiple datasets.
* Share datasets (and caching) between multiple inputs.
* And much, much more...
