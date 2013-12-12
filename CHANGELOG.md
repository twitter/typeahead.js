Changelog
=========

For transparency and insight into our release cycle, releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on semantic versioning, please visit http://semver.org/.

---

### 0.9.3 June 24, 2013

* Ensure cursor visibility in menus with overflow. [#209][209]
* Fixed bug that led to the menu staying open when it should have been closed. [#260][260]
* Private browsing in Safari no longer breaks prefetch. [#270][270]
* Pressing tab while a suggestion is highlighted now results in a selection. [#266][266]
* Dataset name is now passed as an argument for typeahead:selected event. [#207][207]

### 0.9.2 April 14, 2013

* Prefetch usage no longer breaks when cookies are disabled. [#190][190]
* Precompiled templates are now wrapped in the appropriate DOM element. [#172][172]

### 0.9.1 April 1, 2013

* Multiple requests no longer get sent for a query when datasets share a remote source. [#152][152]
* Datasets now support precompiled templates. [#137][137]
* Cached remote suggestions now get rendered immediately. [#156][156]
* Added typeahead:autocompleted event. [#132][132]
* Added a plugin method for programmatically setting the query. Experimental. [#159][159]
* Added minLength option for datasets. Experimental. [#131][131]
* Prefetch objects now support thumbprint option. Experimental. [#157][157]

### 0.9.0 March 24, 2013

**Custom events, no more typeahead.css, and an improved API**

* Implemented the triggering of custom events. [#106][106]
* Got rid of typeahead.css and now apply styling through JavaScript. [#15][15]
* Made the API more flexible and addressed a handful of remote issues by rewriting the transport component. [#25][25]
* Added support for dataset headers and footers. [#81][81]
* No longer cache unnamed datasets. [#116][116]
* Made the key name of the value property configurable. [#115][115]
* Input values set before initialization of typeaheads are now respected. [#109][109]
* Fixed an input value/hint casing bug. [#108][108]

### 0.8.2 March 04, 2013

* Fixed bug causing error to be thrown when initializing a typeahead on multiple elements. [#51][51]
* Tokens with falsy values are now filtered out – was causing wonky behavior. [#75][75]
* No longer making remote requests for blank queries. [#74][74]
* Datums with regex characters in their value no longer cause errors. [#77][77]
* Now compatible with the Closure Compiler. [#48][48]
* Reference to jQuery is now obtained through window.jQuery, not window.$. [#47][47]
* Added a plugin method for destroying typeaheads. Won't be documented until v0.9 and might change before then. [#59][59]

### 0.8.1 February 25, 2013

* Fixed bug preventing local and prefetch from being used together. [#39][39]
* No longer prevent default browser behavior when up or down arrow is pressed with a modifier. [#6][6]
* Hint is hidden when user entered query is wider than the input. [#26][26]
* Data stored in localStorage now expires properly. [#34][34]
* Normalized search tokens and fixed query tokenization. [#38][38]
* Remote suggestions now are appended, not prepended to suggestions list. [#40][40]
* Fixed some typos through the codebase. [#3][3]

### 0.8.0 February 19, 2013

**Initial public release**

* Prefetch and search data locally insanely fast.
* Search hard-coded, prefetched, and/or remote data.
* Hinting.
* RTL/IME/international support.
* Search multiple datasets.
* Share datasets (and caching) between multiple inputs.
* And much, much more...

[270]: https://github.com/twitter/typeahead.js/pull/270
[266]: https://github.com/twitter/typeahead.js/pull/266
[260]: https://github.com/twitter/typeahead.js/pull/260
[209]: https://github.com/twitter/typeahead.js/pull/209
[207]: https://github.com/twitter/typeahead.js/pull/207
[190]: https://github.com/twitter/typeahead.js/pull/190
[172]: https://github.com/twitter/typeahead.js/pull/172
[159]: https://github.com/twitter/typeahead.js/pull/159
[157]: https://github.com/twitter/typeahead.js/pull/157
[156]: https://github.com/twitter/typeahead.js/pull/156
[152]: https://github.com/twitter/typeahead.js/pull/152
[137]: https://github.com/twitter/typeahead.js/pull/137
[132]: https://github.com/twitter/typeahead.js/pull/132
[131]: https://github.com/twitter/typeahead.js/pull/131
[116]: https://github.com/twitter/typeahead.js/pull/116
[115]: https://github.com/twitter/typeahead.js/pull/115
[109]: https://github.com/twitter/typeahead.js/pull/109
[108]: https://github.com/twitter/typeahead.js/pull/108
[106]: https://github.com/twitter/typeahead.js/pull/106
[81]: https://github.com/twitter/typeahead.js/pull/81
[77]: https://github.com/twitter/typeahead.js/pull/77
[75]: https://github.com/twitter/typeahead.js/pull/75
[74]: https://github.com/twitter/typeahead.js/pull/74
[59]: https://github.com/twitter/typeahead.js/pull/59
[51]: https://github.com/twitter/typeahead.js/pull/51
[48]: https://github.com/twitter/typeahead.js/pull/48
[47]: https://github.com/twitter/typeahead.js/pull/47
[40]: https://github.com/twitter/typeahead.js/pull/40
[39]: https://github.com/twitter/typeahead.js/pull/39
[38]: https://github.com/twitter/typeahead.js/pull/38
[34]: https://github.com/twitter/typeahead.js/pull/34
[26]: https://github.com/twitter/typeahead.js/pull/26
[25]: https://github.com/twitter/typeahead.js/pull/25
[15]: https://github.com/twitter/typeahead.js/pull/15
[6]: https://github.com/twitter/typeahead.js/pull/6
[3]: https://github.com/twitter/typeahead.js/pull/3
