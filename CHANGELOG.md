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

### 0.8.2 March 04, 2013

* Fixed bug causing error to be thrown when initializing a typeahead on multiple elements. [#51][51]
* Tokens with falsy values are now filtered out – was causing wonky behavior. [#75][75]
* No longer making remote requests for blank queries. [#74][74]
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
[6]: https://github.com/twitter/typeahead.js/pull/6
[3]: https://github.com/twitter/typeahead.js/pull/3
